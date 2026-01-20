from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.db.session import init_db
from app.services.scheduler import scheduler
from app.core.config import get_settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await scheduler.start()
    yield
    await scheduler.stop()

app = FastAPI(title="CheckinHub", lifespan=lifespan)

# 解析 CORS 配置
settings = get_settings()
cors_origins = settings.cors_origins.split(",") if settings.cors_origins != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.routers import health, sites, runs, har

app.include_router(health.router, prefix="/api")
app.include_router(sites.router, prefix="/api")
app.include_router(runs.router, prefix="/api")
app.include_router(har.router, prefix="/api")
