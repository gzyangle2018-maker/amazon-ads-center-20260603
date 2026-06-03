"""用户管理路由"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..database import get_db
from ..models import User
from ..auth import hash_password, require_admin

router = APIRouter()


class CreateUserRequest(BaseModel):
    username: str
    password: str
    role: str = "operator"
    display_name: str = ""


@router.post("/")
def create_user(req: CreateUserRequest, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """管理员创建用户"""
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(status_code=400, detail="用户名已存在")
    user = User(
        username=req.username,
        password_hash=hash_password(req.password),
        role=req.role if req.role in ["admin", "operator", "viewer"] else "operator",
        display_name=req.display_name or req.username,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "username": user.username}


@router.put("/{user_id}/toggle")
def toggle_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    """启用/禁用用户"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    user.is_active = not user.is_active
    db.commit()
    return {"id": user.id, "is_active": user.is_active}
