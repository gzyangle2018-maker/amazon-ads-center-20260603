"""数据库模型"""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="operator")  # admin / operator / viewer
    display_name = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    shops = relationship("Shop", back_populates="owner")
    uploads = relationship("UploadFile", back_populates="user")


class Shop(Base):
    __tablename__ = "shops"

    id = Column(Integer, primary_key=True, index=True)
    shop_name = Column(String(100), nullable=False)
    marketplace = Column(String(20))  # US/CA/UK/DE/JP
    owner_user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="shops")


class UploadFile(Base):
    __tablename__ = "upload_files"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=True)
    original_filename = Column(String(255))
    stored_path = Column(String(500))
    file_size = Column(Integer)
    file_type = Column(String(10))
    report_type = Column(String(50))
    recognition_confidence = Column(Float, default=0)
    date_start = Column(String(20))
    date_end = Column(String(20))
    status = Column(String(20), default="uploaded")  # uploaded/parsed/analyzed
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="uploads")


class AnalysisTask(Base):
    __tablename__ = "analysis_tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    shop_id = Column(Integer, ForeignKey("shops.id"), nullable=True)
    task_name = Column(String(200))
    date_range = Column(String(50))
    status = Column(String(20), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)
    excel_report_path = Column(String(500))
    llm_report_text = Column(Text)

    asin_results = relationship("AnalysisAsinResult", back_populates="task")
    action_items = relationship("ActionItem", back_populates="task")
    missing_reports = relationship("MissingReport", back_populates="task")


class AnalysisAsinResult(Base):
    __tablename__ = "analysis_asin_results"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("analysis_tasks.id"))
    asin = Column(String(20), index=True)
    parent_asin = Column(String(20))
    title = Column(String(500))
    spend = Column(Float, default=0)
    sales = Column(Float, default=0)
    orders = Column(Integer, default=0)
    acos = Column(Float, nullable=True)
    tacos = Column(Float, nullable=True)
    ctr = Column(Float, default=0)
    cvr = Column(Float, default=0)
    cpc = Column(Float, default=0)
    sessions = Column(Integer, default=0)
    unit_session_pct = Column(Float, default=0)
    buy_box_pct = Column(Float, default=0)
    main_problem = Column(String(100))
    sub_problems = Column(JSON)
    page_priority = Column(Boolean, default=False)
    confidence = Column(String(20), default="中")
    raw_json = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("AnalysisTask", back_populates="asin_results")


class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("analysis_tasks.id"))
    asin = Column(String(20))
    priority = Column(String(5))  # P0/P1/P2/P3
    ad_type = Column(String(20))  # SP/SB/SD
    campaign_name = Column(String(255))
    ad_group_name = Column(String(255))
    target_text = Column(String(500))
    action_layer = Column(String(50))
    current_data = Column(String(500))
    suggested_action = Column(String(500))
    before_value = Column(String(100))
    after_value = Column(String(100))
    adjustment_value = Column(String(100))
    reason = Column(Text)
    expected_impact = Column(Text)
    execute_time = Column(String(50))
    status = Column(String(20), default="pending")
    operator_note = Column(Text)
    admin_note = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("AnalysisTask", back_populates="action_items")


class MissingReport(Base):
    __tablename__ = "missing_reports"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("analysis_tasks.id"))
    asin = Column(String(20))
    missing_report = Column(String(200))
    affected_module = Column(String(100))
    impact = Column(Text)
    is_blocking = Column(Boolean, default=False)
    fallback_method = Column(Text)
    required_file = Column(String(500))
    status = Column(String(20), default="open")

    task = relationship("AnalysisTask", back_populates="missing_reports")


class ReportDownload(Base):
    __tablename__ = "report_downloads"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("analysis_tasks.id"))
    file_path = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
