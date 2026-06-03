"""工具函数"""
import json
from typing import Any


def load_json_safe(data: Any) -> Any:
    """安全加载JSON"""
    if isinstance(data, (dict, list)):
        return data
    if isinstance(data, str):
        try:
            return json.loads(data)
        except (json.JSONDecodeError, TypeError):
            return data
    return data
