from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID

from app.db.models import Site
from app.schemas.site import SiteCreate, SiteUpdate, SiteResponse
from app.api.deps import get_db, verify_admin_token
from app.services.worker import Worker
from app.services.scheduler import scheduler

router = APIRouter()
worker = Worker()

@router.get("/sites", response_model=List[SiteResponse])
async def list_sites(
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin_token)
):
    """获取所有站点"""
    result = await db.execute(select(Site))
    sites = result.scalars().all()
    return sites

@router.post("/sites", response_model=SiteResponse)
async def create_site(
    site_data: SiteCreate,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin_token)
):
    """创建新站点"""
    site = Site(**site_data.model_dump())
    db.add(site)
    await db.commit()
    await db.refresh(site)

    # 调度站点
    scheduler.schedule_site(site)

    return site

@router.get("/sites/{site_id}", response_model=SiteResponse)
async def get_site(
    site_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin_token)
):
    """获取单个站点"""
    result = await db.execute(select(Site).where(Site.id == site_id))
    site = result.scalar_one_or_none()

    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    return site

@router.put("/sites/{site_id}", response_model=SiteResponse)
async def update_site(
    site_id: UUID,
    site_data: SiteUpdate,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin_token)
):
    """更新站点"""
    result = await db.execute(select(Site).where(Site.id == site_id))
    site = result.scalar_one_or_none()

    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    # 更新字段
    for key, value in site_data.model_dump(exclude_unset=True).items():
        setattr(site, key, value)

    await db.commit()
    await db.refresh(site)

    # 重新调度
    scheduler.schedule_site(site)

    return site

@router.delete("/sites/{site_id}")
async def delete_site(
    site_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin_token)
):
    """删除站点"""
    result = await db.execute(select(Site).where(Site.id == site_id))
    site = result.scalar_one_or_none()

    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    # 取消调度
    scheduler.unschedule_site(site_id)

    await db.delete(site)
    await db.commit()

    return {"message": "Site deleted"}

@router.post("/sites/{site_id}/run")
async def run_site_now(
    site_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin_token)
):
    """立即执行站点任务"""
    result = await worker.run_site(site_id, trigger='manual')
    return result

@router.post("/sites/{site_id}/pause")
async def pause_site(
    site_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin_token)
):
    """暂停站点"""
    result = await db.execute(select(Site).where(Site.id == site_id))
    site = result.scalar_one_or_none()

    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    site.paused = True
    await db.commit()

    scheduler.unschedule_site(site_id)

    return {"message": "Site paused"}

@router.post("/sites/{site_id}/resume")
async def resume_site(
    site_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin_token)
):
    """恢复站点"""
    result = await db.execute(select(Site).where(Site.id == site_id))
    site = result.scalar_one_or_none()

    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    site.paused = False
    await db.commit()

    scheduler.schedule_site(site)

    return {"message": "Site resumed"}
