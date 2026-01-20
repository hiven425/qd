from sqlmodel import create_engine, Session, SQLModel
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import get_settings
import os

settings = get_settings()

# Ensure data directory exists
os.makedirs("./data", exist_ok=True)

# Async engine for aiosqlite
engine = create_async_engine(
    settings.database_url,
    echo=False,
    connect_args={"check_same_thread": False}
)

async_session = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

async def get_session() -> AsyncSession:
    async with async_session() as session:
        yield session
