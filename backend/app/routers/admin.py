"""管理路由 - 管理员专用"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..models import User, UploadFile, AnalysisTask, ActionItem, MissingReport
from ..auth import require_admin

router = APIRouter()


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """管理仪表盘"""
    today_uploads = db.query(UploadFile).count()
    today_tasks = db.query(AnalysisTask).count()
    high_risk = db.query(AnalysisTask).filter(
        AnalysisTask.status == "pending"
    ).count()
    missing = db.query(MissingReport).filter(MissingReport.status == "open").count()
    pending_actions = db.query(ActionItem).filter(
        ActionItem.status == "pending"
    ).count()
    done_actions = db.query(ActionItem).filter(
        ActionItem.status == "completed"
    ).count()

    return {
        "today_uploads": today_uploads,
        "today_tasks": today_tasks,
        "high_risk_asins": high_risk,
        "missing_data": missing,
        "pending_actions": pending_actions,
        "done_actions": done_actions,
    }


@router.get("/uploads")
def list_uploads(
    operator: Optional[str] = Query(None),
    shop: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """所有上传记录"""
    query = db.query(UploadFile)
    if operator:
        query = query.join(User).filter(User.username == operator)
    uploads = query.order_by(UploadFile.created_at.desc()).limit(200).all()
    return [
        {
            "id": u.id,
            "operator": u.user.display_name if u.user else "",
            "filename": u.original_filename,
            "report_type": u.report_type,
            "confidence": u.recognition_confidence,
            "status": u.status,
            "created_at": u.created_at.isoformat() if u.created_at else "",
        }
        for u in uploads
    ]


@router.get("/analysis")
def list_analysis(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """所有分析结果"""
    tasks = db.query(AnalysisTask).order_by(AnalysisTask.created_at.desc()).limit(200).all()
    return [
        {
            "id": t.id,
            "task_name": t.task_name,
            "date_range": t.date_range,
            "status": t.status,
            "created_at": t.created_at.isoformat() if t.created_at else "",
        }
        for t in tasks
    ]


@router.get("/actions")
def list_actions(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """所有执行动作"""
    query = db.query(ActionItem)
    if status:
        query = query.filter(ActionItem.status == status)
    items = query.order_by(ActionItem.priority.asc()).limit(500).all()
    return [
        {
            "id": a.id,
            "asin": a.asin,
            "priority": a.priority,
            "campaign_name": a.campaign_name,
            "target_text": a.target_text,
            "action": a.suggested_action,
            "status": a.status,
            "created_at": a.created_at.isoformat() if a.created_at else "",
        }
        for a in items
    ]


@router.get("/missing")
def list_missing(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """缺失数据清单"""
    items = db.query(MissingReport).order_by(MissingReport.status).limit(200).all()
    return [
        {
            "id": m.id,
            "asin": m.asin,
            "missing_report": m.missing_report,
            "affected_module": m.affected_module,
            "is_blocking": m.is_blocking,
            "status": m.status,
        }
        for m in items
    ]


@router.get("/users")
def list_users(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """用户列表"""
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "role": u.role,
            "display_name": u.display_name,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else "",
        }
        for u in users
    ]
