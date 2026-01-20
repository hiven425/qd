from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    admin_token: str = "change-me"
    encryption_key: str = "change-me-32-bytes-key-here!!"
    webhook_url: str = ""
    database_url: str = "sqlite+aiosqlite:///./data/checkinhub.db"
    cors_origins: str = "*"  # 生产环境应设置为具体域名，逗号分隔

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings()
