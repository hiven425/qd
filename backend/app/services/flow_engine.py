import httpx
from typing import Dict, Any, Optional
from datetime import datetime
from uuid import UUID

from app.utils.conditions import evaluate_condition
from app.utils.extraction import extract_variables, extract_json_path
from app.utils.templating import render_template, render_dict
from app.utils.redaction import redact_headers, redact_response

class FlowContext:
    """Flow 执行上下文"""
    def __init__(self, auth: Dict[str, Any]):
        self.variables: Dict[str, Any] = {}
        self.auth = auth

        # 从 auth 中提取 token
        if auth.get('type') == 'bearer':
            token_source = auth.get('tokenSource', 'manual')
            if token_source == 'manual':
                # 检查是否有加密凭证
                encrypted = auth.get('encrypted')
                if encrypted:
                    from app.services.credential_manager import CredentialManager
                    from app.core.config import get_settings
                    settings = get_settings()
                    cm = CredentialManager(settings.encryption_key)
                    self.variables['token'] = cm.decrypt(
                        encrypted['ciphertext'],
                        encrypted['nonce']
                    )
                else:
                    self.variables['token'] = auth.get('token', '')
            elif token_source == 'env':
                import os
                env_key = auth.get('envKey', '')
                self.variables['token'] = os.getenv(env_key, '')

class FlowResult:
    """Flow 执行结果"""
    def __init__(self):
        self.status = 'RUNNING'
        self.steps = []
        self.auth_failed = False
        self.summary = ''

class FlowEngine:
    """Flow Engine 核心"""

    async def execute_flow(self, site_id: UUID, flow: list, auth: Dict[str, Any]) -> FlowResult:
        """执行完整的 Flow"""
        context = FlowContext(auth)
        result = FlowResult()

        async with httpx.AsyncClient(timeout=30.0) as client:
            for idx, step in enumerate(flow):
                step_result = await self._execute_step(client, step, context)
                result.steps.append(step_result)

                # 检查步骤状态
                if step_result['status'] == 'SKIPPED':
                    result.status = 'SKIPPED'
                    result.summary = f"步骤 {step['name']} 被跳过: {step_result.get('reason', '')}"
                    break
                elif step_result['status'] == 'FAILED':
                    result.status = 'FAILED'
                    result.summary = f"步骤 {step['name']} 失败: {step_result.get('error', '')}"

                    # 检查是否是 auth 失败
                    if step_result.get('auth_failed', False):
                        result.auth_failed = True
                    break

        if result.status == 'RUNNING':
            result.status = 'SUCCESS'
            result.summary = '所有步骤执行成功'

        return result

    async def _execute_step(self, client: httpx.AsyncClient, step: Dict[str, Any], context: FlowContext) -> Dict[str, Any]:
        """执行单个步骤"""
        step_result = {
            'name': step.get('name', ''),
            'status': 'RUNNING',
            'started_at': datetime.utcnow().isoformat(),
        }

        try:
            # 1. 评估条件
            condition = step.get('condition')
            if condition:
                if not evaluate_condition(condition, context.variables):
                    step_result['status'] = 'SKIPPED'
                    step_result['reason'] = f"条件不满足: {condition}"
                    return step_result

            # 2. 渲染模板
            url = render_template(step['url'], context.variables)
            headers = render_dict(step.get('headers', {}), context.variables)
            body = step.get('body')
            if body and isinstance(body, dict):
                body = render_dict(body, context.variables)

            # 3. 执行 HTTP 请求
            method = step['method'].upper()
            start_time = datetime.utcnow()

            response = await client.request(
                method=method,
                url=url,
                headers=headers,
                json=body if body else None
            )

            elapsed_ms = (datetime.utcnow() - start_time).total_seconds() * 1000

            # 4. 记录响应（脱敏）
            step_result['status_code'] = response.status_code
            step_result['elapsed_ms'] = elapsed_ms
            step_result['headers'] = redact_headers(dict(response.headers))

            # 5. 解析响应
            response_data = None
            try:
                response_data = response.json()
                step_result['response'] = redact_response(str(response_data))
            except:
                step_result['response'] = redact_response(response.text)

            # 6. 验证 expect
            expect = step.get('expect')
            if expect:
                expect_result = self._validate_expect(response, response_data, expect)
                if not expect_result['passed']:
                    step_result['status'] = 'FAILED'
                    step_result['error'] = expect_result['error']
                    step_result['auth_failed'] = expect_result.get('auth_failed', False)
                    return step_result

            # 7. 提取变量
            extract_rules = step.get('extract', [])
            if extract_rules and response_data:
                extract_variables(response_data, extract_rules, context.variables)

            step_result['status'] = 'SUCCESS'

        except Exception as e:
            step_result['status'] = 'FAILED'
            step_result['error'] = str(e)

        return step_result

    def _validate_expect(self, response: httpx.Response, response_data: Any, expect: Dict[str, Any]) -> Dict[str, Any]:
        """验证 expect 规则"""
        expect_type = expect.get('type', 'json')

        # 检查 auth 失败
        if response.status_code in [401, 403]:
            return {
                'passed': False,
                'error': f'认证失败: HTTP {response.status_code}',
                'auth_failed': True
            }

        if expect_type == 'json':
            path = expect.get('path', '')
            expected_value = expect.get('equals')

            actual_value = extract_json_path(response_data, path)

            if actual_value != expected_value:
                return {
                    'passed': False,
                    'error': f'JSON 路径 {path} 期望值 {expected_value}，实际值 {actual_value}'
                }

        return {'passed': True}
