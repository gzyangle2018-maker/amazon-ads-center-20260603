"""
工具函数模块 - 通用辅助函数
"""
import os
import re
import json
import hashlib
import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional


def ensure_dir(path: str) -> str:
    """确保目录存在"""
    Path(path).mkdir(parents=True, exist_ok=True)
    return path


def safe_divide(a: float, b: float, default: float = 0.0) -> float:
    """安全除法，b为0时返回默认值"""
    if b == 0:
        return default
    return a / b


def safe_percent(a: float, b: float, default: float = 0.0) -> float:
    """安全百分比计算，返回小数形式"""
    if b == 0:
        return default
    return a / b


def calc_ctr(clicks: int, impressions: int) -> float:
    """计算CTR"""
    return safe_percent(clicks, impressions)


def calc_cvr(orders: int, clicks: int) -> float:
    """计算CVR"""
    return safe_percent(orders, clicks)


def calc_cpc(spend: float, clicks: int) -> float:
    """计算CPC"""
    return safe_divide(spend, clicks)


def calc_acos(spend: float, sales: float) -> float:
    """计算ACOS，无销售额返回None"""
    if sales == 0:
        return None
    return spend / sales


def calc_roas(sales: float, spend: float) -> float:
    """计算ROAS"""
    return safe_divide(sales, spend)


def format_currency(value: float) -> str:
    """格式化为美元"""
    if value is None:
        return "$0.00"
    return f"${value:,.2f}"


def format_percent(value: float) -> str:
    """格式化为百分比字符串"""
    if value is None:
        return "N/A"
    return f"{value * 100:.2f}%"


def format_number(value: Any) -> str:
    """格式化数字"""
    if value is None:
        return "0"
    if isinstance(value, float):
        if value == int(value):
            return f"{int(value):,}"
        return f"{value:,.2f}"
    return f"{int(value):,}"


def parse_date_range(date_range_str: str) -> tuple:
    """解析日期范围字符串"""
    parts = re.split(r'\s*[-到~]\s*', date_range_str)
    if len(parts) == 2:
        return parts[0].strip(), parts[1].strip()
    return date_range_str.strip(), date_range_str.strip()


def get_file_hash(filepath: str) -> str:
    """计算文件MD5"""
    h = hashlib.md5()
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            h.update(chunk)
    return h.hexdigest()


def get_file_info(filepath: str) -> Dict[str, Any]:
    """获取文件信息"""
    p = Path(filepath)
    stat = p.stat()
    return {
        'name': p.name,
        'path': str(p.absolute()),
        'size': stat.st_size,
        'size_mb': round(stat.st_size / (1024 * 1024), 2),
        'modified': datetime.datetime.fromtimestamp(stat.st_mtime).isoformat(),
        'extension': p.suffix.lower(),
    }


def log_message(log_dir: str, level: str, message: str):
    """写日志"""
    ensure_dir(log_dir)
    timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    log_file = os.path.join(log_dir, f"{datetime.datetime.now().strftime('%Y%m%d')}.log")
    line = f"[{timestamp}] [{level}] {message}\n"
    with open(log_file, 'a', encoding='utf-8') as f:
        f.write(line)
    print(line.strip())


def mask_string(s: str, show_chars: int = 4) -> str:
    """脱敏字符串，只显示最后几个字符"""
    if not s:
        return ""
    if len(s) <= show_chars:
        return "*" * len(s)
    return "*" * (len(s) - show_chars) + s[-show_chars:]


def load_json(filepath: str, default: Any = None) -> Any:
    """安全加载JSON"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return default


def save_json(filepath: str, data: Any):
    """保存JSON"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def generate_id(prefix: str = "") -> str:
    """生成唯一ID"""
    import uuid
    uid = uuid.uuid4().hex[:10]
    return f"{prefix}_{uid}" if prefix else uid


def truncate_text(text: str, max_len: int = 100) -> str:
    """截断文本"""
    if not text:
        return ""
    if len(text) <= max_len:
        return text
    return text[:max_len-3] + "..."
