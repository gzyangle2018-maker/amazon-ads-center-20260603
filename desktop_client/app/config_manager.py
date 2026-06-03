"""
配置管理器 - 管理本地配置文件 config.json
"""
import os
import json
from pathlib import Path
from typing import Dict, Any


DEFAULT_CONFIG = {
    "api": {
        "api_base_url": "",
        "api_key": "",
        "model": "deepseek-chat",
        "temperature": 0.3,
        "max_tokens": 4000,
        "enabled": False,
    },
    "server": {
        "base_url": "http://localhost:8000",
        "username": "",
        "token": "",
    },
    "general": {
        "language": "zh-CN",
        "auto_sync": False,
        "output_dir": "outputs",
        "log_dir": "logs",
    },
}


class ConfigManager:
    """配置管理器"""

    def __init__(self, config_path: str = None):
        if config_path is None:
            config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "config.json")
        self.config_path = config_path
        self.config = self._load()

    def _load(self) -> Dict[str, Any]:
        """加载配置"""
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, 'r', encoding='utf-8') as f:
                    loaded = json.load(f)
                # 合并默认值
                return self._merge_defaults(loaded)
            except Exception:
                pass
        return self._merge_defaults({})

    def _merge_defaults(self, loaded: Dict) -> Dict:
        """合并默认配置"""
        import copy
        config = copy.deepcopy(DEFAULT_CONFIG)
        for section in config:
            if section in loaded:
                config[section].update(loaded[section])
        return config

    def save(self):
        """保存配置"""
        os.makedirs(os.path.dirname(self.config_path), exist_ok=True)
        with open(self.config_path, 'w', encoding='utf-8') as f:
            json.dump(self.config, f, ensure_ascii=False, indent=2)

    def get(self, section: str, key: str, default=None):
        """获取配置值"""
        return self.config.get(section, {}).get(key, default)

    def set(self, section: str, key: str, value):
        """设置配置值"""
        if section not in self.config:
            self.config[section] = {}
        self.config[section][key] = value
        self.save()

    def get_section(self, section: str) -> Dict:
        """获取整个配置节"""
        return self.config.get(section, {})

    def is_llm_configured(self) -> bool:
        """检查LLM是否已配置"""
        api = self.config.get('api', {})
        return bool(api.get('api_base_url') and api.get('api_key') and api.get('enabled'))

    def is_logged_in(self) -> bool:
        """检查是否已登录"""
        server = self.config.get('server', {})
        return bool(server.get('token'))
