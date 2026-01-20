from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timedelta
import random
from typing import Optional
from uuid import UUID

from app.db.models import Site
from app.services.worker import Worker

class Scheduler:
    """APScheduler 调度器"""

    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.worker = Worker()

    async def start(self):
        """启动调度器"""
        self.scheduler.start()

    async def stop(self):
        """停止调度器"""
        self.scheduler.shutdown()

    def schedule_site(self, site: Site):
        """为站点创建调度任务"""
        if not site.enabled or site.paused:
            return

        schedule = site.schedule or {}
        schedule_type = schedule.get('type', 'dailyAfter')

        job_id = f"site_{site.id}"

        # 移除旧任务
        if self.scheduler.get_job(job_id):
            self.scheduler.remove_job(job_id)

        if schedule_type == 'dailyAfter':
            # 每日固定时间执行
            hour = schedule.get('hour', 8)
            minute = schedule.get('minute', 5)
            random_delay_seconds = schedule.get('randomDelaySeconds', 0)

            # 计算下次执行时间
            next_run = self._compute_next_daily_run(hour, minute, random_delay_seconds)

            self.scheduler.add_job(
                self._run_site_job,
                'date',
                run_date=next_run,
                args=[site.id],
                id=job_id
            )

        elif schedule_type == 'cron':
            # Cron 表达式
            cron_expr = schedule.get('cron', '0 8 * * *')
            trigger = CronTrigger.from_crontab(cron_expr)

            self.scheduler.add_job(
                self._run_site_job,
                trigger,
                args=[site.id],
                id=job_id
            )

    def unschedule_site(self, site_id: UUID):
        """取消站点调度"""
        job_id = f"site_{site_id}"
        if self.scheduler.get_job(job_id):
            self.scheduler.remove_job(job_id)

    def _compute_next_daily_run(self, hour: int, minute: int, random_delay_seconds: int) -> datetime:
        """计算下次执行时间（带随机延迟）"""
        now = datetime.now()
        next_run = now.replace(hour=hour, minute=minute, second=0, microsecond=0)

        # 如果今天的时间已过，推到明天
        if next_run <= now:
            next_run += timedelta(days=1)

        # 添加随机延迟
        if random_delay_seconds > 0:
            delay = random.randint(0, random_delay_seconds)
            next_run += timedelta(seconds=delay)

        return next_run

    async def _run_site_job(self, site_id: UUID):
        """执行站点任务"""
        await self.worker.run_site(site_id, trigger='scheduled')

        # 重新调度下一次执行
        await self._reschedule_site(site_id)

    async def _reschedule_site(self, site_id: UUID):
        """从数据库加载站点并重新调度（仅 DailyAfter 模式）"""
        from app.db.session import async_session
        from sqlalchemy import select

        async with async_session() as session:
            result = await session.execute(select(Site).where(Site.id == site_id))
            site = result.scalar_one_or_none()

            if site and site.enabled and not site.paused:
                schedule = site.schedule or {}
                # 仅 DailyAfter 模式需要重新调度（Cron 模式由 APScheduler 自动处理）
                if schedule.get('type') == 'dailyAfter':
                    self.schedule_site(site)

# 全局调度器实例
scheduler = Scheduler()
