"""
API客户端 - 与后端Cloudflare Worker/FastAPI通信
"""
import json
import requests
from typing import Dict, Any, Optional, List
from pathlib import Path


class APIClient:
    """后端API客户端"""

    def __init__(self, base_url: str = "", token: str = ""):
        self.base_url = base_url.rstrip('/') if base_url else "http://localhost:8000"
        self.token = token
        self.session = requests.Session()
        self._update_headers()

    def _update_headers(self):
        """更新请求头"""
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        self.session.headers.update(headers)

    def set_token(self, token: str):
        self.token = token
        self._update_headers()

    # === 认证 ===

    def login(self, username: str, password: str) -> Dict[str, Any]:
        """登录"""
        try:
            resp = self.session.post(
                f"{self.base_url}/api/auth/login",
                json={"username": username, "password": password},
                timeout=30,
            )
            data = resp.json()
            if resp.status_code == 200 and data.get('access_token'):
                self.set_token(data['access_token'])
            return data
        except Exception as e:
            return {"error": str(e)}

    # === 文件上传 ===

    def upload_file(self, filepath: str, shop_id: str = "") -> Dict[str, Any]:
        """上传文件"""
        try:
            with open(filepath, 'rb') as f:
                files = {'file': (Path(filepath).name, f)}
                data = {'shop_id': shop_id} if shop_id else {}
                resp = self.session.post(
                    f"{self.base_url}/api/uploads/",
                    files=files,
                    data=data,
                    timeout=120,
                )
            return resp.json()
        except Exception as e:
            return {"error": str(e)}

    def upload_analysis_result(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """上传分析结果"""
        try:
            resp = self.session.post(
                f"{self.base_url}/api/analysis/",
                json=result,
                timeout=60,
            )
            return resp.json()
        except Exception as e:
            return {"error": str(e)}

    # === 查询 ===

    def get_uploads(self, params: Dict = None) -> List[Dict]:
        """获取上传记录"""
        try:
            resp = self.session.get(
                f"{self.base_url}/api/uploads/",
                params=params or {},
                timeout=30,
            )
            return resp.json() if resp.status_code == 200 else []
        except Exception:
            return []

    def get_analysis_results(self, params: Dict = None) -> List[Dict]:
        """获取分析结果"""
        try:
            resp = self.session.get(
                f"{self.base_url}/api/analysis/",
                params=params or {},
                timeout=30,
            )
            return resp.json() if resp.status_code == 200 else []
        except Exception:
            return []

    def download_report(self, task_id: str, save_path: str) -> bool:
        """下载报告文件"""
        try:
            resp = self.session.get(
                f"{self.base_url}/api/reports/{task_id}/download",
                stream=True,
                timeout=120,
            )
            if resp.status_code == 200:
                with open(save_path, 'wb') as f:
                    for chunk in resp.iter_content(chunk_size=8192):
                        f.write(chunk)
                return True
            return False
        except Exception:
            return False

    def health_check(self) -> Dict[str, Any]:
        """健康检查"""
        try:
            resp = self.session.get(f"{self.base_url}/", timeout=10)
            return resp.json() if resp.status_code == 200 else {"error": f"HTTP {resp.status_code}"}
        except Exception as e:
            return {"error": str(e)}
