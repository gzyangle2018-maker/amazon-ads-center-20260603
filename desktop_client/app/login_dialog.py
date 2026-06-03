"""
登录对话框 - PySide6
"""
from PySide6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit,
    QPushButton, QMessageBox, QFormLayout, QGroupBox, QCheckBox
)
from PySide6.QtCore import Qt
from PySide6.QtGui import QFont

from .api_client import APIClient
from .config_manager import ConfigManager


class LoginDialog(QDialog):
    """登录对话框"""

    def __init__(self, config: ConfigManager, parent=None):
        super().__init__(parent)
        self.config = config
        self.token = None
        self.username = ""
        self._setup_ui()
        self._load_saved()

    def _setup_ui(self):
        self.setWindowTitle("Amazon Ads Center - 登录")
        self.setFixedSize(420, 380)
        self.setStyleSheet("""
            QDialog {
                background-color: #111827;
            }
            QLabel {
                color: #D1D5DB;
                font-size: 13px;
            }
            QLineEdit {
                padding: 8px 12px;
                border: 1px solid #374151;
                border-radius: 6px;
                background-color: #1F2937;
                color: #F9FAFB;
                font-size: 13px;
            }
            QLineEdit:focus {
                border-color: #F97316;
            }
            QPushButton {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                font-size: 13px;
                font-weight: bold;
            }
            QGroupBox {
                color: #9CA3AF;
                border: 1px solid #374151;
                border-radius: 8px;
                margin-top: 10px;
                padding-top: 20px;
            }
        """)

        layout = QVBoxLayout(self)
        layout.setSpacing(15)
        layout.setContentsMargins(30, 30, 30, 30)

        # 标题
        title = QLabel("Amazon Ads Center")
        title.setFont(QFont("Arial", 20, QFont.Bold))
        title.setStyleSheet("color: #F97316;")
        title.setAlignment(Qt.AlignCenter)
        layout.addWidget(title)

        subtitle = QLabel("亚马逊广告执行中枢")
        subtitle.setFont(QFont("Arial", 11))
        subtitle.setStyleSheet("color: #9CA3AF;")
        subtitle.setAlignment(Qt.AlignCenter)
        layout.addWidget(subtitle)

        layout.addSpacing(10)

        # 服务器设置
        server_group = QGroupBox("服务器设置")
        server_layout = QFormLayout(server_group)

        self.url_input = QLineEdit()
        self.url_input.setPlaceholderText("http://localhost:8000")
        server_layout.addRow("服务器地址:", self.url_input)

        layout.addWidget(server_group)

        # 登录表单
        login_group = QGroupBox("账号登录")
        login_layout = QFormLayout(login_group)

        self.username_input = QLineEdit()
        self.username_input.setPlaceholderText("输入账号")
        login_layout.addRow("账号:", self.username_input)

        self.password_input = QLineEdit()
        self.password_input.setEchoMode(QLineEdit.Password)
        self.password_input.setPlaceholderText("输入密码")
        login_layout.addRow("密码:", self.password_input)

        self.remember_check = QCheckBox("记住密码")
        self.remember_check.setStyleSheet("color: #9CA3AF;")
        login_layout.addRow("", self.remember_check)

        layout.addWidget(login_group)

        # 按钮
        btn_layout = QHBoxLayout()

        self.offline_btn = QPushButton("离线模式")
        self.offline_btn.setStyleSheet("""
            QPushButton {
                background-color: #374151;
                color: #D1D5DB;
            }
            QPushButton:hover {
                background-color: #4B5563;
            }
        """)
        self.offline_btn.clicked.connect(self._accept_offline)

        self.login_btn = QPushButton("登录")
        self.login_btn.setStyleSheet("""
            QPushButton {
                background-color: #F97316;
                color: white;
            }
            QPushButton:hover {
                background-color: #EA580C;
            }
        """)
        self.login_btn.clicked.connect(self._do_login)
        self.login_btn.setDefault(True)

        btn_layout.addWidget(self.offline_btn)
        btn_layout.addWidget(self.login_btn)
        layout.addLayout(btn_layout)

    def _load_saved(self):
        """加载保存的配置"""
        server_url = self.config.get('server', 'base_url', '')
        username = self.config.get('server', 'username', '')
        token = self.config.get('server', 'token', '')

        if server_url:
            self.url_input.setText(server_url)
        if username:
            self.username_input.setText(username)

        if token:
            # 尝试用token直接验证，跳过登录
            self.token = token
            self.username = username
            # 但不自动关闭，等用户操作

    def _do_login(self):
        """执行登录"""
        username = self.username_input.text().strip()
        password = self.password_input.text().strip()
        server_url = self.url_input.text().strip()

        if not username or not password:
            QMessageBox.warning(self, "提示", "请输入账号和密码")
            return

        if not server_url:
            server_url = "http://localhost:8000"

        # 保存服务器地址
        self.config.set('server', 'base_url', server_url)
        self.config.set('server', 'username', username)

        # 调用API登录
        client = APIClient(server_url)
        result = client.login(username, password)

        if 'access_token' in result:
            self.token = result['access_token']
            self.username = username
            self.config.set('server', 'token', self.token)

            if self.remember_check.isChecked():
                self.config.set('server', 'username', username)
                # 注意：实际生产环境不应明文存密码
                self.config.save()

            self.accept()
        else:
            error_msg = result.get('error') or result.get('detail') or '登录失败'
            QMessageBox.critical(self, "登录失败", str(error_msg))

    def _accept_offline(self):
        """离线模式"""
        self.token = None
        self.username = "offline"
        self.accept()

    def get_credentials(self):
        """获取登录凭证"""
        return {
            'username': self.username,
            'token': self.token,
            'server_url': self.url_input.text().strip() or "http://localhost:8000",
        }
