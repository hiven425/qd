from fastapi import APIRouter, UploadFile, File, Depends
from typing import List, Dict, Any
import json

from app.api.deps import verify_admin_token

router = APIRouter()

@router.post("/har/parse")
async def parse_har(
    file: UploadFile = File(...),
    _: bool = Depends(verify_admin_token)
):
    """解析 HAR 文件，返回请求列表"""
    content = await file.read()
    har_data = json.loads(content)

    entries = har_data.get('log', {}).get('entries', [])

    # 过滤静态资源和埋点
    static_extensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp',
                        '.css', '.js', '.map', '.woff', '.woff2', '.ttf']
    analytics_domains = ['google-analytics', 'googletagmanager', 'doubleclick',
                        'sentry', 'datadog']

    filtered_entries = []
    for entry in entries:
        url = entry['request']['url']

        # 跳过静态资源
        if any(url.endswith(ext) for ext in static_extensions):
            continue

        # 跳过埋点域名
        if any(domain in url for domain in analytics_domains):
            continue

        filtered_entries.append({
            'url': url,
            'method': entry['request']['method'],
            'status': entry['response']['status'],
            'headers': {h['name']: h['value'] for h in entry['request']['headers']},
            'postData': entry['request'].get('postData', {}).get('text'),
            'time': entry['time']
        })

    return {'entries': filtered_entries}

@router.post("/har/generate-flow")
async def generate_flow(
    selected_entries: List[Dict[str, Any]],
    _: bool = Depends(verify_admin_token)
):
    """从选中的请求生成 Flow 配置"""
    flow_steps = []

    for idx, entry in enumerate(selected_entries):
        step = {
            'name': f'step_{idx + 1}',
            'method': entry['method'],
            'url': entry['url'],
            'headers': {}
        }

        # 提取关键 headers
        raw_headers = entry.get('headers', {})
        # 转为小写 key 方便匹配
        headers_lower = {k.lower(): v for k, v in raw_headers.items()}
        
        for key in ['accept', 'content-type', 'authorization', 'cookie']:
            if key in headers_lower:
                step['headers'][key] = headers_lower[key]

        # 提取 body
        if entry.get('postData'):
            try:
                step['body'] = json.loads(entry['postData'])
            except:
                step['body'] = entry['postData']

        flow_steps.append(step)

    return {'flow': flow_steps}
