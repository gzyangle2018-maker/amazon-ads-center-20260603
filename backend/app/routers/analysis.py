"""分析任务路由 — 接入完整分析管线"""
import os
import json
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from ..database import get_db
from ..models import User, AnalysisTask, AnalysisAsinResult, ActionItem, MissingReport, UploadFile as UploadFileModel
from ..auth import get_current_user, require_operator
from ..services.analysis_service import AnalysisPipeline
from ..services.parser_engine import parse_file
from ..services.rule_engine import AmazonAdsRuleEngine
from ..services.metrics_engine import calc_asin_overview, calc_traffic_tree
from ..services.llm_client import LLMClient, get_model_presets

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage", "uploads")
REPORT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage", "reports")


class LLMConfigRequest(BaseModel):
    api_base_url: str = ""
    api_key: str = ""
    model: str = "deepseek-chat"
    temperature: float = 0.3
    max_tokens: int = 4000
    enabled: bool = True


@router.post("/run")
async def run_analysis(
    file: UploadFile = File(...),
    llm_enabled: bool = Form(True),
    llm_config_json: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    user: User = Depends(require_operator),
):
    """
    一键执行完整分析管线：
    上传文件 → 解析 → 规则引擎分析 → LLM诊断 → 生成Excel报告
    """
    # 1. 保存上传文件
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = Path(file.filename).suffix
    safe_name = f"{user.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    # 2. 构建LLM配置
    llm_config = {}
    if llm_enabled and llm_config_json:
        try:
            llm_config = json.loads(llm_config_json)
        except json.JSONDecodeError:
            llm_config = {}

    if llm_enabled and not llm_config:
        # 使用默认DeepSeek配置
        llm_config = {
            "api_base_url": os.getenv("LLM_API_BASE_URL", ""),
            "api_key": os.getenv("LLM_API_KEY", ""),
            "model": os.getenv("LLM_MODEL", "deepseek-chat"),
            "temperature": float(os.getenv("LLM_TEMPERATURE", "0.3")),
            "max_tokens": int(os.getenv("LLM_MAX_TOKENS", "4000")),
            "enabled": bool(llm_config.get("api_key") if isinstance(llm_config, dict) else False),
        }

    if not isinstance(llm_config, dict) or not llm_config.get('api_key'):
        llm_config = {"enabled": False}

    # 3. 运行分析管线
    pipeline = AnalysisPipeline(llm_config)
    result = pipeline.run(file_path, operator=user.display_name or user.username, run_llm=llm_enabled)

    if not result.get('success'):
        return {"success": False, "error": result.get('error', '未知错误'), "stage": result.get('stage', 'unknown')}

    # 4. 保存到数据库
    task = AnalysisTask(
        user_id=user.id,
        task_name=f"分析_{file.filename}_{datetime.now().strftime('%Y%m%d')}",
        date_range="",
        status="completed",
        llm_report_text=result.get('llm_report', ''),
        excel_report_path=result.get('excel_path', ''),
        finished_at=datetime.utcnow(),
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    # 保存数据目录
    upload_record = UploadFileModel(
        user_id=user.id,
        original_filename=file.filename,
        stored_path=file_path,
        file_size=os.path.getsize(file_path),
        file_type=ext.replace('.', ''),
        status="analyzed",
    )
    db.add(upload_record)

    # 保存ASIN结果
    for a in result.get('asin_overview', [])[:50]:
        db.add(AnalysisAsinResult(
            task_id=task.id,
            asin=a.get('asin', ''),
            parent_asin=a.get('parent_asin', ''),
            title=a.get('title', ''),
            spend=a.get('spend', 0),
            sales=a.get('sales', 0),
            orders=a.get('orders', 0),
            acos=a.get('acos'),
            ctr=a.get('ctr', 0),
            cvr=a.get('cvr', 0),
            cpc=a.get('cpc', 0),
            main_problem=a.get('main_problem', ''),
        ))

    # 保存动作
    for a in result.get('actions', [])[:200]:
        db.add(ActionItem(
            task_id=task.id,
            asin=a.get('ASIN', ''),
            priority=str(a.get('优先级', 'P2')),
            ad_type=a.get('广告类型', ''),
            campaign_name=a.get('广告活动', ''),
            ad_group_name=a.get('广告组', ''),
            target_text=a.get('目标词/ASIN', ''),
            action_layer=a.get('动作层级', ''),
            current_data=a.get('当前数据', ''),
            suggested_action=a.get('建议动作', ''),
            before_value=a.get('调整前', ''),
            after_value=a.get('调整后', ''),
            adjustment_value=a.get('调整值', ''),
            reason=a.get('原因', ''),
            expected_impact=a.get('预期影响', ''),
            risk_flag=a.get('风险标记', ''),
            status="pending",
        ))

    # 保存缺失报告
    for m in result.get('missing_reports', []):
        db.add(MissingReport(
            task_id=task.id,
            asin=m.get('ASIN', ''),
            missing_report=m.get('缺失数据', ''),
            affected_module=m.get('影响模块', ''),
            impact=m.get('影响结论', ''),
            is_blocking=m.get('是否阻断', '') == '是',
            fallback_method=m.get('降级处理方式', ''),
            required_file=m.get('需要补充的文件', ''),
        ))

    db.commit()

    return {
        "success": True,
        "task_id": task.id,
        "summary": result.get('summary', {}),
        "filename": result.get('filename', ''),
        "parsed_sheets": result.get('parsed_sheets', []),
        "unrecognized_sheets": result.get('unrecognized_sheets', []),
        "actions": result.get('actions', []),
        "negative_keywords": result.get('negative_keywords', []),
        "exact_split": result.get('exact_split', []),
        "placement_suggestions": result.get('placement_suggestions', []),
        "video_diagnosis": result.get('video_diagnosis', []),
        "today_tasks": result.get('today_tasks', []),
        "monitor_plan": result.get('monitor_plan', []),
        "asin_overview": result.get('asin_overview', []),
        "llm_report": result.get('llm_report', ''),
        "excel_path": result.get('excel_path', ''),
    }


@router.post("/parse-only")
async def parse_only(
    file: UploadFile = File(...),
    user: User = Depends(require_operator),
):
    """仅解析文件，不运行完整分析"""
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = Path(file.filename).suffix
    safe_name = f"parse_{user.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    result = parse_file(file_path)
    # 移除DataFrame（不可JSON序列化）
    sheets_info = {}
    for sn, sd in result.get('sheets', {}).items():
        sheets_info[sn] = {
            'report_type': sd.get('report_type', ''),
            'confidence': sd.get('confidence', 0),
            'reason': sd.get('reason', ''),
            'row_count': sd.get('row_count', 0),
            'columns': list(sd['df'].columns) if sd.get('df') is not None else [],
        }

    return {
        "filename": result.get('filename', ''),
        "recognized_sheets": result.get('recognized_sheets', 0),
        "total_rows": result.get('total_rows', 0),
        "sheets": sheets_info,
        "unrecognized_sheets": result.get('unrecognized_sheets', []),
    }


@router.post("/llm-diagnose")
def llm_diagnose(
    req: LLMConfigRequest,
    structured_data: Dict[str, Any],
    user: User = Depends(require_operator),
):
    """单独调用LLM诊断"""
    config = {
        "api_base_url": req.api_base_url,
        "api_key": req.api_key,
        "model": req.model,
        "temperature": req.temperature,
        "max_tokens": req.max_tokens,
        "enabled": bool(req.api_key),
    }
    client = LLMClient(config)
    result = client.generate_diagnosis(structured_data)
    return result


@router.get("/")
def list_analysis(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """我的分析记录"""
    query = db.query(AnalysisTask)
    if user.role != "admin":
        query = query.filter(AnalysisTask.user_id == user.id)
    tasks = query.order_by(AnalysisTask.created_at.desc()).limit(100).all()
    return [
        {
            "id": t.id,
            "task_name": t.task_name,
            "status": t.status,
            "excel_report_path": t.excel_report_path,
            "created_at": t.created_at.isoformat() if t.created_at else "",
            "finished_at": t.finished_at.isoformat() if t.finished_at else "",
        }
        for t in tasks
    ]


@router.get("/llm/presets")
def get_llm_presets():
    """获取国内大模型预设列表"""
    return {"presets": get_model_presets()}


@router.get("/{task_id}")
def get_analysis(task_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """获取分析详情"""
    task = db.query(AnalysisTask).filter(AnalysisTask.id == task_id).first()
    if not task:
        return {"error": "任务不存在"}

    return {
        "id": task.id,
        "task_name": task.task_name,
        "date_range": task.date_range,
        "status": task.status,
        "asin_results": [
            {"asin": a.asin, "spend": a.spend, "sales": a.sales, "acos": a.acos, "main_problem": a.main_problem}
            for a in task.asin_results
        ],
        "actions": [
            {
                "id": a.id,
                "priority": a.priority,
                "campaign_name": a.campaign_name,
                "ad_group_name": a.ad_group_name,
                "target_text": a.target_text,
                "action_layer": a.action_layer,
                "suggested_action": a.suggested_action,
                "reason": a.reason,
                "status": a.status,
            }
            for a in task.action_items
        ],
        "missing_reports": [
            {"asin": m.asin, "missing_report": m.missing_report, "impact": m.impact}
            for m in task.missing_reports
        ],
        "llm_report": task.llm_report_text,
        "excel_path": task.excel_report_path,
        "created_at": task.created_at.isoformat() if task.created_at else "",
    }


@router.get("/{task_id}/excel")
def download_excel(task_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """下载Excel分析报告"""
    task = db.query(AnalysisTask).filter(AnalysisTask.id == task_id).first()
    if not task:
        return {"error": "任务不存在"}
    if user.role != "admin" and task.user_id != user.id:
        return {"error": "无权限"}

    if task.excel_report_path and os.path.exists(task.excel_report_path):
        return FileResponse(
            task.excel_report_path,
            filename=f"分析报告_{task_id}.xlsx",
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )

    # 尝试重新生成
    return {"error": "报告文件不存在，请重新运行分析"}
