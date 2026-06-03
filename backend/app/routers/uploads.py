"""上传路由"""
import os
import shutil
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile as FastAPIUploadFile, File, Form
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, UploadFile
from ..auth import get_current_user, require_operator

router = APIRouter()
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage", "uploads")


@router.post("/")
async def upload_file(
    file: FastAPIUploadFile = File(...),
    shop_id: str = Form(""),
    db: Session = Depends(get_db),
    user: User = Depends(require_operator),
):
    """上传文件"""
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # 保存文件
    ext = Path(file.filename).suffix
    safe_name = f"{user.id}_{__import__('time').time()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # 数据库记录
    upload = UploadFile(
        user_id=user.id,
        shop_id=int(shop_id) if shop_id else None,
        original_filename=file.filename,
        stored_path=file_path,
        file_size=os.path.getsize(file_path),
        file_type=ext.replace('.', ''),
    )
    db.add(upload)
    db.commit()
    db.refresh(upload)

    return {"id": upload.id, "filename": file.filename, "status": "uploaded"}


@router.get("/")
def list_uploads(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """我的上传记录"""
    query = db.query(UploadFile)
    if user.role != "admin":
        query = query.filter(UploadFile.user_id == user.id)
    uploads = query.order_by(UploadFile.created_at.desc()).limit(100).all()
    return [
        {
            "id": u.id,
            "filename": u.original_filename,
            "report_type": u.report_type,
            "confidence": u.recognition_confidence,
            "status": u.status,
            "created_at": u.created_at.isoformat() if u.created_at else "",
        }
        for u in uploads
    ]


@router.get("/{upload_id}/download")
def download_file(upload_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """下载原始文件"""
    upload = db.query(UploadFile).filter(UploadFile.id == upload_id).first()
    if not upload:
        return {"error": "文件不存在"}
    if user.role != "admin" and upload.user_id != user.id:
        return {"error": "无权限"}
    return {"filepath": upload.stored_path, "filename": upload.original_filename}
