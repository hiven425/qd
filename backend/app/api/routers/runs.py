from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID

from app.db.models import Run
from app.schemas.site import RunResponse
from app.api.deps import get_db, verify_admin_token

router = APIRouter()

@router.get("/sites/{site_id}/runs", response_model=List[RunResponse])
async def list_site_runs(
    site_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin_token)
):
    """获取站点的执行记录"""
    result = await db.execute(
        select(Run)
        .where(Run.site_id == site_id)
        .order_by(Run.started_at.desc())
        .limit(50)
    )
    runs = result.scalars().all()
    return runs

@router.get("/runs/{run_id}", response_model=RunResponse)
async def get_run(
    run_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin_token)
):
    """获取单个执行记录"""
    result = await db.execute(select(Run).where(Run.id == run_id))
    run = result.scalar_one_or_none()

    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    return run
