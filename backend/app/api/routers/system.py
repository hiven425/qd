from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List

from app.db.models import Site, Run
from app.api.deps import get_db, verify_admin_token
from app.services.scheduler import scheduler
from app.core.config import get_settings

router = APIRouter()

@router.get("/system/status")
async def get_system_status(
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin_token)
):
    """获取系统状态"""
    settings = get_settings()
    
    # 站点统计
    total_sites = await db.execute(select(func.count(Site.id)))
    enabled_sites = await db.execute(
        select(func.count(Site.id)).where(Site.enabled == True, Site.paused == False)
    )
    paused_sites = await db.execute(
        select(func.count(Site.id)).where(Site.paused == True)
    )
    
    # 调度器状态
    jobs = scheduler.scheduler.get_jobs()
    
    return {
        "scheduler": {
            "running": scheduler.scheduler.running,
            "jobCount": len(jobs)
        },
        "sites": {
            "total": total_sites.scalar() or 0,
            "enabled": enabled_sites.scalar() or 0,
            "paused": paused_sites.scalar() or 0
        },
        "config": {
            "webhookConfigured": bool(settings.webhook_url)
        },
        "version": "1.0.0"
    }

@router.get("/system/jobs")
async def get_scheduled_jobs(
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin_token)
):
    """获取当前调度任务列表"""
    from uuid import UUID as PyUUID
    
    jobs = scheduler.scheduler.get_jobs()
    
    job_list = []
    for job in jobs:
        # 从 job_id 提取 site_id
        site_id_str = job.id.replace("site_", "")
        
        try:
            site_uuid = PyUUID(site_id_str)
            # 查询站点名称
            result = await db.execute(select(Site.name).where(Site.id == site_uuid))
            site_name = result.scalar()
        except:
            site_name = "Unknown"
        
        job_list.append({
            "id": job.id,
            "siteId": site_id_str,
            "siteName": site_name or "Unknown",
            "nextRunTime": job.next_run_time.isoformat() if job.next_run_time else None
        })
    
    # 按下次执行时间排序
    job_list.sort(key=lambda x: x["nextRunTime"] or "")
    
    return {"jobs": job_list}

@router.get("/system/runs/recent")
async def get_recent_runs(
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin_token)
):
    """获取最近执行记录"""
    result = await db.execute(
        select(Run, Site.name.label("site_name"))
        .join(Site, Run.site_id == Site.id)
        .order_by(Run.started_at.desc())
        .limit(limit)
    )
    
    runs = []
    for row in result.all():
        run = row[0]
        site_name = row[1]
        runs.append({
            "id": str(run.id),
            "siteId": str(run.site_id),
            "siteName": site_name,
            "status": run.status,
            "startedAt": run.started_at.isoformat() if run.started_at else None,
            "finishedAt": run.finished_at.isoformat() if run.finished_at else None,
            "summary": run.summary
        })
    
    return {"runs": runs}

@router.post("/system/webhook/test")
async def test_webhook(
    _: bool = Depends(verify_admin_token)
):
    """测试 Webhook 连接"""
    import httpx
    
    settings = get_settings()
    webhook_url = settings.webhook_url
    
    if not webhook_url:
        return {"success": False, "message": "Webhook URL 未配置"}
    
    payload = {
        "type": "test",
        "message": "CheckinHub Webhook 测试消息"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(webhook_url, json=payload, timeout=10.0)
            return {
                "success": response.status_code < 400,
                "statusCode": response.status_code,
                "message": "Webhook 测试成功" if response.status_code < 400 else f"HTTP {response.status_code}"
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"连接失败: {str(e)}"
        }
