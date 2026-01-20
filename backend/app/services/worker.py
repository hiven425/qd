from datetime import datetime
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models import Site, Run
from app.services.flow_engine import FlowEngine

class Worker:
    """Worker 执行器"""

    def __init__(self):
        self.flow_engine = FlowEngine()

    async def run_site(self, site_id: UUID, trigger: str = 'manual') -> dict:
        """执行站点任务"""
        from app.db.session import async_session

        async with async_session() as session:
            # 加载站点
            result = await session.execute(select(Site).where(Site.id == site_id))
            site = result.scalar_one_or_none()

            if not site:
                return {'status': 'error', 'message': 'Site not found'}

            if not site.enabled or site.paused:
                return {'status': 'skipped', 'message': 'Site is disabled or paused'}

            # 创建 Run 记录
            run = Run(
                site_id=site_id,
                status='RUNNING',
                started_at=datetime.utcnow()
            )
            session.add(run)
            await session.commit()
            await session.refresh(run)

            try:
                # 执行 Flow
                flow_result = await self.flow_engine.execute_flow(
                    site_id=site_id,
                    flow=site.flow or [],
                    auth=site.auth or {}
                )

                # 更新 Run 记录
                run.status = flow_result.status
                run.finished_at = datetime.utcnow()
                run.summary = flow_result.summary
                run.steps = flow_result.steps
                run.auth_failed = flow_result.auth_failed

                # 更新站点状态
                site.last_run_at = run.finished_at
                site.last_run_status = run.status

                # 如果 auth 失败，暂停站点
                if flow_result.auth_failed:
                    site.paused = True

                await session.commit()

                # 发送通知（如果失败）
                if run.status in ['FAILED', 'AUTH_FAILED']:
                    await self._send_notification(site, run)

                return {
                    'status': 'success',
                    'run_id': str(run.id),
                    'run_status': run.status
                }

            except Exception as e:
                # 更新 Run 记录为失败
                run.status = 'FAILED'
                run.finished_at = datetime.utcnow()
                run.summary = f'执行异常: {str(e)}'
                await session.commit()

                return {
                    'status': 'error',
                    'message': str(e)
                }

    async def _send_notification(self, site: Site, run: Run):
        """发送 Webhook 通知"""
        from app.core.config import get_settings
        import httpx

        settings = get_settings()
        webhook_url = settings.webhook_url

        if not webhook_url:
            return

        payload = {
            'siteId': str(site.id),
            'siteName': site.name,
            'runId': str(run.id),
            'status': run.status,
            'authFailed': run.auth_failed,
            'summary': run.summary,
            'startedAt': run.started_at.isoformat(),
            'finishedAt': run.finished_at.isoformat() if run.finished_at else None
        }

        try:
            async with httpx.AsyncClient() as client:
                await client.post(webhook_url, json=payload, timeout=10.0)
        except Exception as e:
            # 忽略通知失败
            pass
