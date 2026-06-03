"""数据库配置"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/amazon_ads_center"
)

# 开发环境使用SQLite
SQLITE_URL = "sqlite:///./amazon_ads.db"
USE_SQLITE = os.getenv("USE_SQLITE", "true").lower() == "true"

engine = create_engine(
    SQLITE_URL if USE_SQLITE else DATABASE_URL,
    connect_args={"check_same_thread": False} if USE_SQLITE else {},
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
