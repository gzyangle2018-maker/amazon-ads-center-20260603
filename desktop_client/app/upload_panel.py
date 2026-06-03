"""
上传面板 - 文件拖拽上传、批量解析、进度展示
"""
import os
from pathlib import Path
from typing import List, Dict, Any
import threading

from PySide6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QTableWidget, QTableWidgetItem, QHeaderView, QProgressBar,
    QFileDialog, QMessageBox, QGroupBox, QSplitter, QTextEdit,
    QAbstractItemView, QCheckBox
)
from PySide6.QtCore import Qt, Signal, QThread
from PySide6.QtGui import QFont, QDragEnterEvent, QDropEvent

from .parser_engine import parse_file, parse_files_batch
from .report_classifier import classify_report
from .utils import get_file_info, log_message


class ParseWorker(QThread):
    """后台解析线程"""
    progress = Signal(int, str)  # 进度, 消息
    finished = Signal(list)       # 结果列表
    error = Signal(str)

    def __init__(self, filepaths: List[str]):
        super().__init__()
        self.filepaths = filepaths

    def run(self):
        results = []
        total = len(self.filepaths)
        for i, fp in enumerate(self.filepaths):
            try:
                self.progress.emit(int((i / total) * 100), f"解析: {Path(fp).name}")
                r = parse_file(fp)
                results.append(r)
            except Exception as e:
                results.append({
                    'filename': Path(fp).name,
                    'filepath': fp,
                    'error': str(e),
                    'sheets': {},
                })
        self.progress.emit(100, "解析完成")
        self.finished.emit(results)


class UploadPanel(QWidget):
    """数据上传面板"""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.file_list: List[str] = []
        self.parsed_results: List[Dict] = []
        self._setup_ui()

    def _setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setSpacing(12)

        # 顶部操作区
        top_layout = QHBoxLayout()

        self.add_btn = QPushButton("添加文件")
        self.add_btn.setMinimumHeight(36)
        self.add_btn.setStyleSheet("""
            QPushButton {
                background-color: #F97316;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
                font-weight: bold;
            }
            QPushButton:hover { background-color: #EA580C; }
        """)
        self.add_btn.clicked.connect(self._add_files)

        self.add_dir_btn = QPushButton("添加文件夹")
        self.add_dir_btn.setMinimumHeight(36)
        self.add_dir_btn.setStyleSheet("""
            QPushButton {
                background-color: #374151;
                color: #D1D5DB;
                border: 1px solid #4B5563;
                border-radius: 6px;
                padding: 8px 16px;
            }
            QPushButton:hover { background-color: #4B5563; }
        """)
        self.add_dir_btn.clicked.connect(self._add_directory)

        self.clear_btn = QPushButton("清空列表")
        self.clear_btn.setMinimumHeight(36)
        self.clear_btn.setStyleSheet("""
            QPushButton {
                background-color: #7F1D1D;
                color: #FCA5A5;
                border: none;
                border-radius: 6px;
                padding: 8px 16px;
            }
            QPushButton:hover { background-color: #991B1B; }
        """)
        self.clear_btn.clicked.connect(self._clear_files)

        top_layout.addWidget(self.add_btn)
        top_layout.addWidget(self.add_dir_btn)
        top_layout.addWidget(self.clear_btn)
        top_layout.addStretch()

        # 文件计数
        self.count_label = QLabel("已添加 0 个文件")
        self.count_label.setStyleSheet("color: #9CA3AF; font-size: 12px;")
        top_layout.addWidget(self.count_label)

        layout.addLayout(top_layout)

        # 文件列表
        self.table = QTableWidget()
        self.table.setColumnCount(9)
        self.table.setHorizontalHeaderLabels([
            "文件名", "大小(KB)", "Sheet名", "推测类型", "置信度",
            "时间范围", "ASIN数", "活动数", "状态"
        ])
        self.table.horizontalHeader().setSectionResizeMode(0, QHeaderView.Stretch)
        self.table.setAlternatingRowColors(True)
        self.table.setSelectionBehavior(QAbstractItemView.SelectRows)
        self.table.setStyleSheet("""
            QTableWidget {
                background-color: #1F2937;
                border: 1px solid #374151;
                border-radius: 8px;
                gridline-color: #374151;
                color: #E5E7EB;
            }
            QTableWidget::item { padding: 4px; }
            QHeaderView::section {
                background-color: #111827;
                color: #9CA3AF;
                border: none;
                padding: 8px;
                font-weight: bold;
            }
            QTableWidget::item:alternate { background-color: #1A2332; }
        """)
        layout.addWidget(self.table)

        # 操作按钮
        action_layout = QHBoxLayout()

        self.parse_btn = QPushButton("开始解析")
        self.parse_btn.setMinimumHeight(40)
        self.parse_btn.setStyleSheet("""
            QPushButton {
                background-color: #059669;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 10px 24px;
                font-weight: bold;
                font-size: 14px;
            }
            QPushButton:hover { background-color: #047857; }
            QPushButton:disabled { background-color: #374151; color: #6B7280; }
        """)
        self.parse_btn.clicked.connect(self._start_parse)

        self.analyze_btn = QPushButton("开始分析")
        self.analyze_btn.setMinimumHeight(40)
        self.analyze_btn.setStyleSheet("""
            QPushButton {
                background-color: #2563EB;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 10px 24px;
                font-weight: bold;
                font-size: 14px;
            }
            QPushButton:hover { background-color: #1D4ED8; }
            QPushButton:disabled { background-color: #374151; color: #6B7280; }
        """)
        self.analyze_btn.setEnabled(False)
        self.analyze_btn.clicked.connect(self._start_analysis)

        self.excel_btn = QPushButton("生成Excel")
        self.excel_btn.setMinimumHeight(40)
        self.excel_btn.setStyleSheet("""
            QPushButton {
                background-color: #7C3AED;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 10px 24px;
                font-weight: bold;
                font-size: 14px;
            }
            QPushButton:hover { background-color: #6D28D9; }
            QPushButton:disabled { background-color: #374151; color: #6B7280; }
        """)
        self.excel_btn.setEnabled(False)

        self.sync_btn = QPushButton("同步云端")
        self.sync_btn.setMinimumHeight(40)
        self.sync_btn.setStyleSheet("""
            QPushButton {
                background-color: #0891B2;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 10px 24px;
                font-weight: bold;
                font-size: 14px;
            }
            QPushButton:hover { background-color: #0E7490; }
            QPushButton:disabled { background-color: #374151; color: #6B7280; }
        """)

        action_layout.addWidget(self.parse_btn)
        action_layout.addWidget(self.analyze_btn)
        action_layout.addWidget(self.excel_btn)
        action_layout.addWidget(self.sync_btn)
        action_layout.addStretch()

        layout.addLayout(action_layout)

        # 进度条
        self.progress = QProgressBar()
        self.progress.setMaximum(100)
        self.progress.setVisible(False)
        self.progress.setStyleSheet("""
            QProgressBar {
                border: none;
                border-radius: 4px;
                background-color: #374151;
                height: 6px;
            }
            QProgressBar::chunk {
                background-color: #F97316;
                border-radius: 4px;
            }
        """)
        layout.addWidget(self.progress)

        # 日志区
        self.log_output = QTextEdit()
        self.log_output.setReadOnly(True)
        self.log_output.setMaximumHeight(150)
        self.log_output.setStyleSheet("""
            QTextEdit {
                background-color: #0F172A;
                border: 1px solid #374151;
                border-radius: 6px;
                color: #A5B4FC;
                font-family: 'Consolas', monospace;
                font-size: 11px;
                padding: 8px;
            }
        """)
        layout.addWidget(self.log_output)

    def _add_files(self):
        """添加文件"""
        files, _ = QFileDialog.getOpenFileNames(
            self, "选择报表文件",
            "",
            "报表文件 (*.csv *.xlsx *.xls);;CSV文件 (*.csv);;Excel文件 (*.xlsx *.xls);;所有文件 (*.*)"
        )
        for f in files:
            if f not in self.file_list:
                self.file_list.append(f)
        self._refresh_table()

    def _add_directory(self):
        """添加整个文件夹"""
        dir_path = QFileDialog.getExistingDirectory(self, "选择报表文件夹")
        if not dir_path:
            return
        for root, dirs, files in os.walk(dir_path):
            for f in files:
                if f.lower().endswith(('.csv', '.xlsx', '.xls')):
                    full_path = os.path.join(root, f)
                    if full_path not in self.file_list:
                        self.file_list.append(full_path)
        self._refresh_table()

    def _clear_files(self):
        """清空文件列表"""
        self.file_list.clear()
        self.parsed_results.clear()
        self._refresh_table()
        self.analyze_btn.setEnabled(False)
        self.excel_btn.setEnabled(False)
        self.log_output.clear()

    def _refresh_table(self):
        """刷新文件列表表格"""
        self.table.setRowCount(len(self.file_list))
        self.count_label.setText(f"已添加 {len(self.file_list)} 个文件")

        for row, fp in enumerate(self.file_list):
            filename = Path(fp).name
            info = get_file_info(fp)

            self.table.setItem(row, 0, QTableWidgetItem(filename))
            self.table.setItem(row, 1, QTableWidgetItem(str(info['size_mb'])))

            # 推测类型
            rtype, conf, reason = classify_report(filename)
            self.table.setItem(row, 3, QTableWidgetItem(rtype or "未知"))
            self.table.setItem(row, 4, QTableWidgetItem(f"{conf:.0%}" if conf else "N/A"))

            # 检查是否有已解析结果
            if row < len(self.parsed_results):
                pr = self.parsed_results[row]
                if 'error' in pr:
                    self.table.setItem(row, 8, QTableWidgetItem(f"错误: {pr['error']}"))
                else:
                    self.table.setItem(row, 8, QTableWidgetItem("已解析"))
            else:
                self.table.setItem(row, 8, QTableWidgetItem("待解析"))

    def _start_parse(self):
        """开始解析"""
        if not self.file_list:
            QMessageBox.warning(self, "提示", "请先添加文件")
            return

        self.parse_btn.setEnabled(False)
        self.progress.setVisible(True)

        self.worker = ParseWorker(self.file_list)
        self.worker.progress.connect(self._on_progress)
        self.worker.finished.connect(self._on_parse_finished)
        self.worker.error.connect(self._on_error)
        self.worker.start()

    def _on_progress(self, value: int, message: str):
        self.progress.setValue(value)
        self._log(message)

    def _on_parse_finished(self, results: List[Dict]):
        self.parsed_results = results
        self.parse_btn.setEnabled(True)
        self.analyze_btn.setEnabled(True)
        self.progress.setVisible(False)

        success_count = len([r for r in results if 'error' not in r])
        fail_count = len(results) - success_count
        self._log(f"解析完成: {success_count} 成功, {fail_count} 失败")

        # 统计报表类型
        type_counts = {}
        for r in results:
            for sheet_name, sheet_data in r.get('sheets', {}).items():
                rt = sheet_data.get('report_type', '未知')
                type_counts[rt] = type_counts.get(rt, 0) + 1
        for rt, cnt in type_counts.items():
            self._log(f"  {rt}: {cnt} 个Sheet")

        self._refresh_table()

    def _on_error(self, msg: str):
        self._log(f"错误: {msg}")
        self.parse_btn.setEnabled(True)
        self.progress.setVisible(False)

    def _start_analysis(self):
        """开始分析（触发父窗口的分析流程）"""
        # 信号通过parent传递
        if self.parsed_results:
            self._log("开始规则引擎分析...")
            # 父窗口会连接analyze_btn的clicked信号来完成后续操作
        else:
            QMessageBox.warning(self, "提示", "请先解析文件")

    def _log(self, message: str):
        """追加日志"""
        self.log_output.append(message)
        # 自动滚动到底部
        scrollbar = self.log_output.verticalScrollBar()
        scrollbar.setValue(scrollbar.maximum())

    def get_parsed_results(self) -> List[Dict]:
        return self.parsed_results

    def get_file_list(self) -> List[str]:
        return self.file_list
