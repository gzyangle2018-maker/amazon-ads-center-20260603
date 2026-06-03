"""
主窗口 - 蓝黑科技风 Amazon Ads Center 运营端
"""
import os
import sys
from pathlib import Path
from typing import Dict, List, Any
import threading

from PySide6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QStackedWidget, QTextEdit, QLineEdit, QFormLayout, QGroupBox,
    QMessageBox, QScrollArea, QFrame, QStatusBar, QListWidget, QListWidgetItem,
)
from PySide6.QtCore import Qt, QSize, Signal, QThread
from PySide6.QtGui import QFont, QIcon, QPalette, QColor

from .config_manager import ConfigManager
from .login_dialog import LoginDialog
from .upload_panel import UploadPanel
from .parser_engine import parse_file, parse_files_batch
from .rule_engine import AmazonAdsRuleEngine
from .metrics_engine import calc_asin_overview, calc_traffic_tree, calc_summary_stats
from .llm_client import LLMClient, create_structured_summary
from .excel_writer import ExcelReportWriter
from .api_client import APIClient
from .security import mask_api_key
from .utils import log_message, ensure_dir


# 暗色主题样式
DARK_STYLE = """
QMainWindow { background-color: #0F172A; }
QWidget { background-color: #0F172A; color: #E2E8F0; font-family: 'Microsoft YaHei'; }
QLabel { color: #CBD5E1; }
QGroupBox { border: 1px solid #334155; border-radius: 8px; margin-top: 12px; padding-top: 16px; color: #94A3B8; font-weight: bold; }
QGroupBox::title { subcontrol-origin: margin; left: 12px; padding: 0 4px; }
QLineEdit {
    background-color: #1E293B; border: 1px solid #334155; border-radius: 6px;
    padding: 8px 12px; color: #F1F5F9; font-size: 13px;
}
QLineEdit:focus { border-color: #F97316; }
QTextEdit {
    background-color: #1E293B; border: 1px solid #334155; border-radius: 6px;
    color: #CBD5E1; font-size: 12px;
}
QScrollArea { border: none; }
QListWidget {
    background-color: #111827; border: none; color: #CBD5E1; font-size: 13px;
    padding: 4px;
}
QListWidget::item { padding: 12px 16px; border-radius: 6px; }
QListWidget::item:selected { background-color: #F97316; color: white; }
QListWidget::item:hover { background-color: #1E293B; }
QStatusBar { background-color: #1E293B; color: #94A3B8; border-top: 1px solid #334155; }
"""


class AnalysisWorker(QThread):
    """后台分析线程"""
    progress = Signal(int, str)
    finished = Signal(dict)
    error = Signal(str)

    def __init__(self, parsed_results: List[Dict], config: ConfigManager):
        super().__init__()
        self.parsed_results = parsed_results
        self.config = config

    def run(self):
        try:
            engine = AmazonAdsRuleEngine()
            all_actions = []
            all_negative = []
            all_split = []
            all_placement = []
            all_video = []

            total = len(self.parsed_results)
            for i, pr in enumerate(self.parsed_results):
                if 'error' in pr:
                    continue
                self.progress.emit(int((i / max(total, 1)) * 80), f"分析: {pr.get('filename', '')}")

                for sheet_name, sheet_data in pr.get('sheets', {}).items():
                    df = sheet_data.get('df')
                    report_type = sheet_data.get('report_type', '')
                    if df is None or len(df) == 0:
                        continue

                    actions = engine.run_all_rules(df, report_type)
                    all_actions.extend(actions)
                    all_negative.extend(engine.get_negative_keywords(df))
                    all_split.extend(engine.get_exact_split_candidates(df))
                    all_placement.extend(engine.get_placement_suggestions(df))
                    all_video.extend(engine.get_video_diagnosis(df))

            self.progress.emit(90, "整理分析结果...")
            result = {
                'actions': all_actions,
                'negative_keywords': all_negative,
                'exact_split': all_split,
                'placement_suggestions': all_placement,
                'video_diagnosis': all_video,
            }
            self.progress.emit(100, "分析完成")
            self.finished.emit(result)
        except Exception as e:
            self.error.emit(str(e))


class MainWindow(QMainWindow):
    """主窗口"""

    def __init__(self, config: ConfigManager):
        super().__init__()
        self.config = config
        self.parsed_results: List[Dict] = []
        self.analysis_result: Dict = {}
        self.api_client = None

        self.setWindowTitle("Amazon Ads Center - 亚马逊广告执行中枢")
        self.setMinimumSize(1200, 800)
        self.setStyleSheet(DARK_STYLE)

        self._setup_ui()
        self._setup_menu()

    def _setup_ui(self):
        central = QWidget()
        self.setCentralWidget(central)
        main_layout = QHBoxLayout(central)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)

        # === 左侧导航 ===
        nav_widget = QWidget()
        nav_widget.setFixedWidth(220)
        nav_widget.setStyleSheet("background-color: #111827; border-right: 1px solid #1E293B;")
        nav_layout = QVBoxLayout(nav_widget)
        nav_layout.setContentsMargins(0, 0, 0, 0)
        nav_layout.setSpacing(0)

        # Logo区
        logo_widget = QWidget()
        logo_widget.setStyleSheet("background-color: #F97316; padding: 16px;")
        logo_layout = QVBoxLayout(logo_widget)
        logo_label = QLabel("Amazon Ads Center")
        logo_label.setFont(QFont("Arial", 14, QFont.Bold))
        logo_label.setStyleSheet("color: white; background: transparent;")
        logo_sub = QLabel("广告执行中枢 v1.0")
        logo_sub.setStyleSheet("color: rgba(255,255,255,0.7); background: transparent; font-size: 11px;")
        logo_layout.addWidget(logo_label)
        logo_layout.addWidget(logo_sub)
        nav_layout.addWidget(logo_widget)

        # 导航菜单
        self.nav_list = QListWidget()
        self.nav_list.setSpacing(2)
        nav_items = [
            ("📊 数据上传", 0),
            ("📋 数据目录", 1),
            ("⚠️ 缺失检查", 2),
            ("🔍 本地规则分析", 3),
            ("🤖 LLM诊断", 4),
            ("📥 Excel输出", 5),
            ("☁️ 同步云端", 6),
            ("⚙️ API设置", 7),
            ("📝 日志中心", 8),
        ]
        for text, idx in nav_items:
            item = QListWidgetItem(text)
            item.setData(Qt.UserRole, idx)
            self.nav_list.addItem(item)

        self.nav_list.currentRowChanged.connect(self._on_nav_change)
        nav_layout.addWidget(self.nav_list)

        # 底部用户信息
        user_widget = QWidget()
        user_widget.setStyleSheet("background-color: #0A0F1A; padding: 12px; border-top: 1px solid #1E293B;")
        user_layout = QVBoxLayout(user_widget)
        self.user_label = QLabel(f"👤 {self.config.get('server', 'username', '未登录')}")
        self.user_label.setStyleSheet("color: #CBD5E1; font-size: 12px;")
        user_layout.addWidget(self.user_label)
        nav_layout.addWidget(user_widget)

        main_layout.addWidget(nav_widget)

        # === 右侧内容区 ===
        self.stack = QStackedWidget()
        self.stack.setStyleSheet("background-color: #0F172A;")

        # 0: 数据上传
        self.upload_panel = UploadPanel()
        self.upload_panel.analyze_btn.clicked.connect(self._run_analysis)
        self.upload_panel.excel_btn.clicked.connect(self._generate_excel)
        self.stack.addWidget(self.upload_panel)

        # 1: 数据目录
        self.catalog_page = self._create_text_page("数据目录")
        self.stack.addWidget(self.catalog_page)

        # 2: 缺失检查
        self.missing_page = self._create_text_page("缺失检查")
        self.stack.addWidget(self.missing_page)

        # 3: 本地规则分析
        self.analysis_page = self._create_text_page("规则分析结果")
        self.stack.addWidget(self.analysis_page)

        # 4: LLM诊断
        self.llm_page = self._create_text_page("LLM诊断报告")
        self.stack.addWidget(self.llm_page)

        # 5: Excel输出
        self.excel_page = self._create_text_page("Excel输出")
        self.stack.addWidget(self.excel_page)

        # 6: 同步云端
        self.sync_page = self._create_text_page("云端同步")
        self.stack.addWidget(self.sync_page)

        # 7: API设置
        self.api_page = self._create_api_settings_page()
        self.stack.addWidget(self.api_page)

        # 8: 日志中心
        self.log_page = self._create_text_page("日志中心")
        self.stack.addWidget(self.log_page)

        main_layout.addWidget(self.stack)

        # 状态栏
        self.statusBar().showMessage("就绪")

    def _create_text_page(self, title: str) -> QWidget:
        """创建通用文本页面"""
        page = QWidget()
        layout = QVBoxLayout(page)
        layout.setContentsMargins(24, 24, 24, 24)

        title_label = QLabel(title)
        title_label.setFont(QFont("Arial", 16, QFont.Bold))
        title_label.setStyleSheet("color: #F1F5F9;")
        layout.addWidget(title_label)

        self._current_text = QTextEdit()
        self._current_text.setReadOnly(True)
        layout.addWidget(self._current_text)
        return page

    def _create_api_settings_page(self) -> QWidget:
        """创建API设置页"""
        page = QWidget()
        layout = QVBoxLayout(page)
        layout.setContentsMargins(24, 24, 24, 24)

        title = QLabel("⚙️ API设置")
        title.setFont(QFont("Arial", 16, QFont.Bold))
        title.setStyleSheet("color: #F1F5F9;")
        layout.addWidget(title)

        group = QGroupBox("LLM API 配置")
        form = QFormLayout(group)

        self.api_url_input = QLineEdit()
        self.api_url_input.setPlaceholderText("https://api.deepseek.com/v1/chat/completions")
        self.api_url_input.setText(self.config.get('api', 'api_base_url', ''))
        form.addRow("API Base URL:", self.api_url_input)

        self.api_key_input = QLineEdit()
        self.api_key_input.setEchoMode(QLineEdit.Password)
        self.api_key_input.setPlaceholderText("sk-...")
        masked = mask_api_key(self.config.get('api', 'api_key', ''))
        if masked:
            self.api_key_input.setPlaceholderText(f"已保存: {masked}")
        form.addRow("API Key:", self.api_key_input)

        self.model_input = QLineEdit()
        self.model_input.setText(self.config.get('api', 'model', 'deepseek-chat'))
        form.addRow("模型名称:", self.model_input)

        self.temp_input = QLineEdit()
        self.temp_input.setText(str(self.config.get('api', 'temperature', 0.3)))
        form.addRow("Temperature:", self.temp_input)

        self.max_tokens_input = QLineEdit()
        self.max_tokens_input.setText(str(self.config.get('api', 'max_tokens', 4000)))
        form.addRow("Max Tokens:", self.max_tokens_input)

        layout.addWidget(group)

        btn_layout = QHBoxLayout()

        save_btn = QPushButton("保存设置")
        save_btn.setStyleSheet("""
            QPushButton { background-color: #059669; color: white; border-radius: 6px; padding: 10px 20px; font-weight: bold; }
            QPushButton:hover { background-color: #047857; }
        """)
        save_btn.clicked.connect(self._save_api_settings)

        test_btn = QPushButton("测试连接")
        test_btn.setStyleSheet("""
            QPushButton { background-color: #2563EB; color: white; border-radius: 6px; padding: 10px 20px; font-weight: bold; }
            QPushButton:hover { background-color: #1D4ED8; }
        """)
        test_btn.clicked.connect(self._test_api_connection)

        btn_layout.addWidget(save_btn)
        btn_layout.addWidget(test_btn)
        btn_layout.addStretch()
        layout.addLayout(btn_layout)

        self.api_status_label = QLabel("")
        self.api_status_label.setStyleSheet("color: #94A3B8; font-size: 12px;")
        layout.addWidget(self.api_status_label)

        layout.addStretch()
        return page

    def _setup_menu(self):
        """设置导航菜单"""
        # 默认选中数据上传
        self.nav_list.setCurrentRow(0)

    def _on_nav_change(self, index: int):
        """导航切换"""
        self.stack.setCurrentIndex(index)

    def _run_analysis(self):
        """运行规则引擎分析"""
        self.parsed_results = self.upload_panel.get_parsed_results()
        if not self.parsed_results:
            QMessageBox.warning(self, "提示", "请先解析文件")
            return

        self.statusBar().showMessage("正在运行规则引擎分析...")

        self.worker = AnalysisWorker(self.parsed_results, self.config)
        self.worker.progress.connect(lambda v, m: self.statusBar().showMessage(m))
        self.worker.finished.connect(self._on_analysis_finished)
        self.worker.error.connect(lambda e: QMessageBox.critical(self, "分析错误", str(e)))
        self.worker.start()

    def _on_analysis_finished(self, result: Dict):
        """分析完成"""
        self.analysis_result = result
        self.upload_panel.excel_btn.setEnabled(True)
        self.statusBar().showMessage(
            f"分析完成: {len(result.get('actions', []))} 个动作, "
            f"{len(result.get('negative_keywords', []))} 个否词候选, "
            f"{len(result.get('exact_split', []))} 个拆精准候选"
        )

        # 显示结果到分析页
        self.stack.setCurrentIndex(3)  # 跳到分析页
        lines = []
        lines.append(f"## 分析结果汇总\n")
        lines.append(f"- 总动作数: {len(result.get('actions', []))}")
        lines.append(f"- 否词候选: {len(result.get('negative_keywords', []))}")
        lines.append(f"- 拆精准候选: {len(result.get('exact_split', []))}")
        lines.append(f"- 广告位建议: {len(result.get('placement_suggestions', []))}")
        lines.append(f"- 视频诊断: {len(result.get('video_diagnosis', []))}")
        lines.append(f"\n### 前20个动作:")
        for i, action in enumerate(result.get('actions', [])[:20]):
            lines.append(f"{i+1}. [{action.get('priority','')}] {action.get('action_type','')}: "
                        f"{action.get('campaign_name','')} / {action.get('target_text','')} → "
                        f"{action.get('action','')}")
        self._current_text.setMarkdown('\n'.join(lines))

    def _generate_excel(self):
        """生成Excel报告"""
        if not self.analysis_result:
            QMessageBox.warning(self, "提示", "请先运行分析")
            return

        writer = ExcelReportWriter()
        result = self.analysis_result

        try:
            filepath = writer.write_full_report(
                data_directory=self._build_data_directory(),
                missing_reports=self._build_missing_reports(),
                asin_overview=self._build_asin_overview(),
                traffic_tree=self._build_traffic_tree(),
                action_table=result.get('actions', []),
                today_tasks=self._build_today_tasks(result),
                monitor_plan=self._build_monitor_plan(),
                negative_keywords=result.get('negative_keywords', []),
                add_keywords=[],
                exact_split=result.get('exact_split', []),
                placement_suggestions=result.get('placement_suggestions', []),
                video_diagnosis=result.get('video_diagnosis', []),
                llm_report="",
                raw_data=[],
            )
            QMessageBox.information(self, "导出成功", f"Excel已保存到:\n{filepath}")
            self.statusBar().showMessage(f"Excel已导出: {filepath}")
        except Exception as e:
            QMessageBox.critical(self, "导出失败", str(e))

    def _build_data_directory(self) -> List[Dict]:
        """构建数据目录"""
        return [
            {
                "批次": i + 1,
                "运营": self.config.get('server', 'username', ''),
                "店铺": "",
                "站点": "",
                "文件名": pr.get('filename', ''),
                "Sheet名": sn,
                "报表类型": sd.get('report_type', ''),
                "识别置信度": f"{sd.get('confidence', 0):.0%}",
                "时间范围": "",
                "ASIN数量": len(sd.get('df', [])) if sd.get('df') is not None else 0,
                "广告类型": "",
                "活动数量": 0,
                "广告组数量": 0,
                "关键词数量": 0,
                "ASIN Target数量": 0,
                "读取状态": "成功",
                "备注": sd.get('reason', ''),
            }
            for i, pr in enumerate(self.parsed_results)
            for sn, sd in pr.get('sheets', {}).items()
        ]

    def _build_missing_reports(self) -> List[Dict]:
        """构建缺失清单"""
        # 简化版：检查是否有未识别Sheet
        missing = []
        for pr in self.parsed_results:
            for us in pr.get('unrecognized_sheets', []):
                missing.append({
                    "运营": self.config.get('server', 'username', ''),
                    "店铺": "",
                    "ASIN": "",
                    "缺失数据": f"未识别Sheet: {us.get('sheet_name', '')}",
                    "影响模块": "数据解析",
                    "影响结论": "无法进行后续分析",
                    "是否阻断": "否",
                    "降级处理方式": "跳过该Sheet",
                    "需要补充的文件": pr.get('filename', ''),
                })
        return missing

    def _build_asin_overview(self) -> List[Dict]:
        """构建ASIN总览"""
        overviews = []
        for pr in self.parsed_results:
            for sn, sd in pr.get('sheets', {}).items():
                df = sd.get('df')
                if df is not None and len(df) > 0:
                    try:
                        ov = calc_asin_overview(df)
                        overviews.extend(ov)
                    except Exception:
                        pass
        return overviews

    def _build_traffic_tree(self) -> List[Dict]:
        """构建流量结构树"""
        tree = []
        for pr in self.parsed_results:
            for sn, sd in pr.get('sheets', {}).items():
                df = sd.get('df')
                if df is not None:
                    try:
                        tt = calc_traffic_tree(df)
                        tree.extend(tt)
                    except Exception:
                        pass
        return tree

    def _build_today_tasks(self, result: Dict) -> List[Dict]:
        """构建今日执行清单"""
        tasks = []
        for i, action in enumerate(result.get('actions', [])[:50]):
            if action.get('priority') in ['P0', 'P1']:
                tasks.append({
                    "序号": i + 1,
                    "优先级": action.get('priority', ''),
                    "运营": self.config.get('server', 'username', ''),
                    "店铺": action.get('shop', ''),
                    "ASIN": action.get('asin', ''),
                    "广告活动": action.get('campaign_name', ''),
                    "广告组": action.get('ad_group_name', ''),
                    "目标词/ASIN": action.get('target_text', ''),
                    "具体动作": action.get('action', ''),
                    "调整值": str(action.get('adjustment', '')),
                    "执行人": "",
                    "执行状态": "待执行",
                    "截止时间": "",
                    "备注": action.get('reason', ''),
                })
        return tasks

    def _build_monitor_plan(self) -> List[Dict]:
        """构建7天监控计划"""
        return [
            {"目标": "ACOS控制", "监控指标": "ACOS", "阈值/Trigger": "> 35%", "触发动作": "预算减少50%", "时间窗口": "3天", "负责角色": "运营", "复盘日期": "Day 7"},
            {"目标": "花费效率", "监控指标": "ROAS", "阈值/Trigger": "< 2.0", "触发动作": "暂停低效活动", "时间窗口": "7天", "负责角色": "运营", "复盘日期": "Day 7"},
            {"目标": "否词效果", "监控指标": "点击量", "阈值/Trigger": ">=10且订单=0", "触发动作": "加Negative Exact", "时间窗口": "持续", "负责角色": "运营", "复盘日期": "Day 3"},
            {"目标": "精准拆分验证", "监控指标": "新活动ACOS", "阈值/Trigger": "< 原活动ACOS", "触发动作": "继续观察", "时间窗口": "14天", "负责角色": "运营", "复盘日期": "Day 14"},
        ]

    def _save_api_settings(self):
        """保存API设置"""
        self.config.set('api', 'api_base_url', self.api_url_input.text().strip())
        if self.api_key_input.text().strip():
            self.config.set('api', 'api_key', self.api_key_input.text().strip())
        self.config.set('api', 'model', self.model_input.text().strip())
        try:
            self.config.set('api', 'temperature', float(self.temp_input.text().strip()))
        except ValueError:
            pass
        try:
            self.config.set('api', 'max_tokens', int(self.max_tokens_input.text().strip()))
        except ValueError:
            pass
        self.config.set('api', 'enabled', True)
        self.api_status_label.setText("✅ 设置已保存")
        self.api_status_label.setStyleSheet("color: #4ADE80; font-size: 12px;")

    def _test_api_connection(self):
        """测试API连接"""
        self._save_api_settings()
        client = LLMClient(self.config.get_section('api'))
        result = client.test_connection()
        if result.get('success'):
            self.api_status_label.setText(f"✅ 连接成功: {result.get('response', '')}")
            self.api_status_label.setStyleSheet("color: #4ADE80; font-size: 12px;")
        else:
            self.api_status_label.setText(f"❌ 连接失败: {result.get('error', '')}")
            self.api_status_label.setStyleSheet("color: #F87171; font-size: 12px;")
