from fastapi import Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_session
from app.core.config import get_settings

async def get_db() -> AsyncSession:
    """获取数据库会话"""
    async for session in get_session():
        yield session

async def verify_admin_token(authorization: str = Header(None)):
    """验证管理员 token"""
    settings = get_settings()

    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    # 期望格式: "Bearer <token>"
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization header format")

    token = parts[1]
    if token != settings.admin_token:
        raise HTTPException(status_code=401, detail="Invalid admin token")

    return True
