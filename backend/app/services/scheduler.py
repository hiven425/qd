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
        """启动调度器并加载所有站点任务"""
        self.scheduler.start()
        
        # 从数据库加载所有启用的站点并调度
        await self._load_all_sites()

    async def _load_all_sites(self):
        """从数据库加载所有启用站点并调度"""
        from app.db.session import async_session
        from sqlalchemy import select
        
        async with async_session() as session:
            result = await session.execute(
                select(Site).where(Site.enabled == True, Site.paused == False)
            )
            sites = result.scalars().all()
            
            for site in sites:
                self.schedule_site(site)
                print(f"[Scheduler] 已调度站点: {site.name} ({site.id})", flush=True)
            
            print(f"[Scheduler] 启动完成，共加载 {len(sites)} 个站点任务", flush=True)

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
            print(f"[Scheduler] 📅 调度站点 [{site.name}]: 类型=dailyAfter, 下次执行={next_run.strftime('%Y-%m-%d %H:%M:%S')}", flush=True)

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
            job = self.scheduler.get_job(job_id)
            print(f"[Scheduler] 📅 调度站点 [{site.name}]: 类型=cron, 表达式={cron_expr}, 下次执行={job.next_run_time if job else 'N/A'}", flush=True)

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
        from datetime import datetime as dt
        
        start_time = dt.now()
        print(f"[Scheduler] {start_time.strftime('%Y-%m-%d %H:%M:%S')} 开始执行任务: site_id={site_id}", flush=True)
        
        try:
            result = await self.worker.run_site(site_id, trigger='scheduled')
            end_time = dt.now()
            duration = (end_time - start_time).total_seconds()
            
            if result.get('status') == 'success':
                print(f"[Scheduler] ✅ 任务成功: site_id={site_id}, run_status={result.get('run_status')}, 耗时={duration:.2f}s", flush=True)
            elif result.get('status') == 'skipped':
                print(f"[Scheduler] ⏭️ 任务跳过: site_id={site_id}, reason={result.get('message')}", flush=True)
            else:
                print(f"[Scheduler] ❌ 任务失败: site_id={site_id}, error={result.get('message')}, 耗时={duration:.2f}s", flush=True)
                
        except Exception as e:
            end_time = dt.now()
            duration = (end_time - start_time).total_seconds()
            print(f"[Scheduler] ❌ 任务异常: site_id={site_id}, exception={str(e)}, 耗时={duration:.2f}s", flush=True)

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
                    # 获取下次运行时间
                    job = self.scheduler.get_job(f"site_{site_id}")
                    if job:
                        print(f"[Scheduler] 📅 已重新调度: {site.name}, 下次执行={job.next_run_time}", flush=True)
            elif site and site.paused:
                print(f"[Scheduler] ⏸️ 站点已暂停，不再调度: {site.name}", flush=True)

# 全局调度器实例
scheduler = Scheduler()
