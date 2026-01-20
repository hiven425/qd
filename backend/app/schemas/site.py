from pydantic import BaseModel
from typing import Optional, Any, List
from datetime import datetime
from uuid import UUID

class SiteBase(BaseModel):
    name: str
    enabled: bool = True
    paused: bool = False
    tags: Optional[List[str]] = None
    base_url: Optional[str] = None
    auth: Optional[Any] = None
    flow: Optional[Any] = None
    schedule: Optional[Any] = None

class SiteCreate(SiteBase):
    pass

class SiteUpdate(SiteBase):
    name: Optional[str] = None
    enabled: Optional[bool] = None
    paused: Optional[bool] = None

class SiteResponse(SiteBase):
    id: UUID
    last_run_at: Optional[datetime] = None
    next_run_at: Optional[datetime] = None
    last_run_status: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RunResponse(BaseModel):
    id: UUID
    site_id: UUID
    status: str
    started_at: datetime
    finished_at: Optional[datetime] = None
    summary: Optional[str] = None
    steps: Optional[Any] = None
    auth_failed: bool = False

    class Config:
        from_attributes = True
