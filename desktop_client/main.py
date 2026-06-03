"""
Amazon Ads Center - 运营端 EXE
入口文件

用法:
    python main.py                 # 正常启动
    python main.py --offline       # 离线模式
"""
import sys
import os

# 确保项目根目录在path中
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from PySide6.QtWidgets import QApplication, QMessageBox
from PySide6.QtCore import Qt

from app.config_manager import ConfigManager
from app.login_dialog import LoginDialog
from app.ui_main import MainWindow
from app.utils import ensure_dir, log_message


def main():
    # 高DPI支持
    QApplication.setHighDpiScaleFactorRoundingPolicy(
        Qt.HighDpiScaleFactorRoundingPolicy.PassThrough
    )

    app = QApplication(sys.argv)
    app.setApplicationName("Amazon Ads Center")
    app.setOrganizationName("Amazon Ads Center")

    # 设置全局暗色调色板
    app.setStyle("Fusion")

    # 初始化配置
    config = ConfigManager()

    # 确保目录存在
    base_dir = os.path.dirname(os.path.abspath(__file__))
    ensure_dir(os.path.join(base_dir, "uploads"))
    ensure_dir(os.path.join(base_dir, "outputs"))
    ensure_dir(os.path.join(base_dir, "logs"))

    # 检查离线模式
    offline = "--offline" in sys.argv

    if offline:
        log_message(os.path.join(base_dir, "logs"), "INFO", "离线模式启动")
        window = MainWindow(config)
        window.show()
        sys.exit(app.exec())

    # 显示登录对话框
    login = LoginDialog(config)
    if login.exec() == LoginDialog.Accepted:
        creds = login.get_credentials()
        log_message(os.path.join(base_dir, "logs"), "INFO",
                    f"登录成功: {creds.get('username', 'unknown')}")

        # 启动主窗口
        window = MainWindow(config)
        window.show()
        sys.exit(app.exec())
    else:
        sys.exit(0)


if __name__ == "__main__":
    main()
