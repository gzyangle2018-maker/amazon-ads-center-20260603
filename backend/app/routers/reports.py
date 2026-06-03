"""报告下载路由"""
import os
from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, AnalysisTask
from ..auth import get_current_user

router = APIRouter()
REPORT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage", "reports")


@router.get("/{task_id}/download")
def download_report(task_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """下载分析报告"""
    task = db.query(AnalysisTask).filter(AnalysisTask.id == task_id).first()
    if not task:
        return {"error": "任务不存在"}
    if user.role != "admin" and task.user_id != user.id:
        return {"error": "无权限"}
    if task.excel_report_path and os.path.exists(task.excel_report_path):
        return FileResponse(task.excel_report_path, filename=f"report_{task_id}.xlsx")
    return {"error": "报告文件不存在"}
