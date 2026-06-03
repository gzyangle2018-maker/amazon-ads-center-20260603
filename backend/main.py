"""
Amazon Ads Center - 后端API服务

FastAPI + SQLAlchemy + JWT
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import auth, users, uploads, analysis, reports, admin

# 创建表
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Amazon Ads Center API",
    version="1.0.0",
    description="亚马逊广告执行中枢 - 后端API",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(users.router, prefix="/api/users", tags=["用户"])
app.include_router(uploads.router, prefix="/api/uploads", tags=["上传"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["分析"])
app.include_router(reports.router, prefix="/api/reports", tags=["报告"])
app.include_router(admin.router, prefix="/api/admin", tags=["管理"])


@app.get("/")
def root():
    return {"name": "Amazon Ads Center API", "version": "1.0.0", "status": "ok"}


@app.get("/health")
def health():
    return {"status": "healthy"}
