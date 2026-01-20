from sqlmodel import SQLModel, Field, Column, JSON
from typing import Optional, Any
from datetime import datetime
from uuid import UUID, uuid4

class Site(SQLModel, table=True):
    __tablename__ = "sites"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(index=True)
    enabled: bool = Field(default=True, index=True)
    paused: bool = Field(default=False, index=True)
    tags: Optional[Any] = Field(default=None, sa_column=Column(JSON))
    base_url: Optional[str] = None
    auth: Optional[Any] = Field(default=None, sa_column=Column(JSON))
    flow: Optional[Any] = Field(default=None, sa_column=Column(JSON))
    schedule: Optional[Any] = Field(default=None, sa_column=Column(JSON))
    last_run_at: Optional[datetime] = None
    next_run_at: Optional[datetime] = Field(default=None, index=True)
    last_run_status: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Run(SQLModel, table=True):
    __tablename__ = "runs"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    site_id: UUID = Field(foreign_key="sites.id", index=True)
    status: str = Field(index=True)
    started_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    finished_at: Optional[datetime] = None
    summary: Optional[str] = None
    steps: Optional[Any] = Field(default=None, sa_column=Column(JSON))
    auth_failed: bool = Field(default=False)

class Secret(SQLModel, table=True):
    __tablename__ = "secrets"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    site_id: UUID = Field(foreign_key="sites.id", index=True)
    key_name: str
    ciphertext: str
    nonce: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
