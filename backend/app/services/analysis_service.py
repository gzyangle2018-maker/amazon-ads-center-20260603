"""
分析管线编排服务 — 将 解析 → 规则引擎 → LLM诊断 → Excel导出 串联为一条管线
"""
import os
import json
from datetime import datetime
from typing import Dict, List, Any, Optional
from pathlib import Path

from app.services.parser_engine import parse_file
from app.services.rule_engine import AmazonAdsRuleEngine
from app.services.metrics_engine import calc_asin_overview, calc_traffic_tree, calc_summary_stats
from app.services.llm_client import LLMClient, get_model_presets, get_preset_config
from app.services.excel_writer import ExcelReportWriter


class AnalysisPipeline:
    """一键分析管线"""

    def __init__(self, llm_config: Optional[Dict[str, Any]] = None):
        """
        Args:
            llm_config: LLM配置，None则跳过LLM诊断
        """
        self.llm_config = llm_config or {}
        self.llm_client = LLMClient(self.llm_config) if llm_config.get('enabled') else None
        self.rule_engine = AmazonAdsRuleEngine()
        self.excel_writer = ExcelReportWriter(
            output_dir=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage", "reports")
        )

    def run(self, filepath: str, operator: str = "", run_llm: bool = True) -> Dict[str, Any]:
        """
        执行完整分析管线

        Args:
            filepath: 上传的文件路径
            operator: 操作人
            run_llm: 是否运行LLM诊断

        Returns:
            完整分析结果字典
        """
        # ─── 1. 解析文件 ───
        parsed = parse_file(filepath)

        if 'error' in parsed:
            return {"success": False, "error": parsed['error'], "stage": "parse"}

        # ─── 2. 收集所有sheet的DataFrame，按报表类型组织 ───
        data_frames = {}
        all_dfs = []
        parsed_sheets = []

        for sheet_name, sheet_data in parsed.get('sheets', {}).items():
            df = sheet_data.get('df')
            report_type = sheet_data.get('report_type', '')
            if df is not None and len(df) > 0:
                data_frames[report_type] = df
                all_dfs.append(df)
                parsed_sheets.append({
                    "sheet_name": sheet_name,
                    "report_type": report_type,
                    "confidence": sheet_data.get('confidence', 0),
                    "row_count": sheet_data.get('row_count', 0),
                })

        if not all_dfs:
            return {
                "success": False,
                "error": "未能识别任何有效报表数据",
                "stage": "parse",
                "unrecognized": parsed.get('unrecognized_sheets', []),
            }

        # ─── 3. 运行规则引擎 ───
        engine = AmazonAdsRuleEngine()
        all_actions = []
        all_negative = []
        all_split = []
        all_placement = []
        all_video = []

        for sheet_name, sheet_data in parsed.get('sheets', {}).items():
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

        # ─── 4. 计算指标 ───
        asin_overview = []
        traffic_tree = []
        for sheet_name, sheet_data in parsed.get('sheets', {}).items():
            df = sheet_data.get('df')
            if df is not None and len(df) > 0:
                try:
                    asin_overview.extend(calc_asin_overview(df))
                except Exception:
                    pass
                try:
                    traffic_tree.extend(calc_traffic_tree(df))
                except Exception:
                    pass

        # ─── 5. 构建数据目录 ───
        data_directory = []
        for i, pr in enumerate([parsed]):
            for sn, sd in pr.get('sheets', {}).items():
                df = sd.get('df')
                data_directory.append({
                    "批次": i + 1,
                    "运营": operator,
                    "店铺": "",
                    "站点": "",
                    "文件名": pr.get('filename', ''),
                    "Sheet名": sn,
                    "报表类型": sd.get('report_type', ''),
                    "识别置信度": f"{sd.get('confidence', 0):.0%}",
                    "时间范围": "",
                    "ASIN数量": len(df) if df is not None else 0,
                    "广告类型": "",
                    "活动数量": 0,
                    "广告组数量": 0,
                    "关键词数量": 0,
                    "ASIN Target数量": 0,
                    "读取状态": "成功",
                    "备注": sd.get('reason', ''),
                })

        # ─── 6. 构建缺失清单 ───
        missing_reports = []
        for pr in [parsed]:
            for us in pr.get('unrecognized_sheets', []):
                missing_reports.append({
                    "运营": operator,
                    "店铺": "",
                    "ASIN": "",
                    "缺失数据": f"未识别Sheet: {us.get('sheet_name', '')}",
                    "影响模块": "数据解析",
                    "影响结论": "无法进行后续分析",
                    "是否阻断": "否",
                    "降级处理方式": "跳过该Sheet",
                    "需要补充的文件": pr.get('filename', ''),
                })

        # ─── 7. 构建今日执行清单 ───
        today_tasks = []
        actions_serializable = []
        for i, action in enumerate(all_actions):
            action_dict = {
                "优先级": action.get('priority', 'P2'),
                "运营": operator,
                "店铺": action.get('shop', ''),
                "ASIN": action.get('asin', ''),
                "广告类型": action.get('ad_type', ''),
                "广告活动": action.get('campaign_name', ''),
                "广告组": action.get('ad_group_name', ''),
                "目标词/ASIN": action.get('target_text', ''),
                "动作层级": action.get('action_layer', ''),
                "当前数据": action.get('current_data', ''),
                "建议动作": action.get('suggested_action', ''),
                "调整前": action.get('before_value', ''),
                "调整后": action.get('after_value', ''),
                "调整值": action.get('adjustment_value', ''),
                "原因": action.get('reason', ''),
                "预期影响": action.get('expected_impact', ''),
                "执行时间": action.get('execute_time', ''),
                "风险标记": action.get('risk_flag', ''),
            }
            actions_serializable.append(action_dict)

            if action.get('priority') in ['P0', 'P1', 1, 2]:
                today_tasks.append({
                    "序号": i + 1,
                    "优先级": action.get('priority', ''),
                    "运营": operator,
                    "店铺": action.get('shop', ''),
                    "ASIN": action.get('asin', ''),
                    "广告活动": action.get('campaign_name', ''),
                    "广告组": action.get('ad_group_name', ''),
                    "目标词/ASIN": action.get('target_text', ''),
                    "具体动作": action.get('suggested_action', ''),
                    "调整值": str(action.get('adjustment_value', '')),
                    "执行人": "",
                    "执行状态": "待执行",
                    "截止时间": "",
                    "备注": action.get('reason', ''),
                })

        # ─── 8. 7天监控计划 ───
        monitor_plan = [
            {"目标": "ACOS控制", "监控指标": "ACOS", "阈值/Trigger": "> 35%", "触发动作": "预算减少50%", "时间窗口": "3天", "负责角色": "运营", "复盘日期": "Day 7"},
            {"目标": "花费效率", "监控指标": "ROAS", "阈值/Trigger": "< 2.0", "触发动作": "暂停低效活动", "时间窗口": "7天", "负责角色": "运营", "复盘日期": "Day 7"},
            {"目标": "否词效果", "监控指标": "点击量", "阈值/Trigger": ">=10且订单=0", "触发动作": "加Negative Exact", "时间窗口": "持续", "负责角色": "运营", "复盘日期": "Day 3"},
            {"目标": "精准拆分验证", "监控指标": "新活动ACOS", "阈值/Trigger": "< 原活动ACOS", "触发动作": "继续观察", "时间窗口": "14天", "负责角色": "运营", "复盘日期": "Day 14"},
        ]

        # ─── 9. LLM诊断（可选） ───
        llm_report = ""
        if run_llm and self.llm_client and self.llm_client.enabled:
            llm_input = {
                "operator": operator,
                "data_directory": [
                    {"Sheet": s["sheet_name"], "Type": s["report_type"], "Rows": s["row_count"]}
                    for s in parsed_sheets
                ],
                "actions_summary": [
                    {"layer": a.get("action_layer"), "action": a.get("suggested_action"), "reason": a.get("reason")}
                    for a in actions_serializable[:50]
                ],
                "negative_keywords_count": len(all_negative),
                "exact_split_count": len(all_split),
                "asin_overview": asin_overview[:5],
            }
            llm_result = self.llm_client.generate_diagnosis(llm_input)
            if llm_result.get('success'):
                llm_report = llm_result.get('content', '')
            else:
                llm_report = f"LLM诊断失败: {llm_result.get('error', '')}"

        # ─── 10. 生成Excel ───
        try:
            excel_path = self.excel_writer.write_full_report(
                data_directory=data_directory,
                missing_reports=missing_reports,
                asin_overview=asin_overview,
                traffic_tree=traffic_tree,
                action_table=actions_serializable,
                today_tasks=today_tasks,
                monitor_plan=monitor_plan,
                negative_keywords=all_negative,
                add_keywords=[],
                exact_split=all_split,
                placement_suggestions=all_placement,
                video_diagnosis=all_video,
                llm_report=llm_report,
                raw_data=[],
                filename_prefix=f"广告分析报告_{parsed.get('filename', 'unknown')}",
            )
        except Exception as e:
            excel_path = ""
            print(f"Excel生成失败: {e}")

        # ─── 11. 返回结果 ───
        return {
            "success": True,
            "filename": parsed.get('filename', ''),
            "total_rows": parsed.get('total_rows', 0),
            "recognized_sheets": parsed.get('recognized_sheets', 0),
            "parsed_sheets": parsed_sheets,
            "unrecognized_sheets": parsed.get('unrecognized_sheets', []),
            "summary": {
                "total_actions": len(all_actions),
                "negative_keywords": len(all_negative),
                "exact_split_candidates": len(all_split),
                "placement_suggestions": len(all_placement),
                "video_diagnosis": len(all_video),
                "asin_count": len(asin_overview),
            },
            "actions": actions_serializable[:100],  # 最多返回100条
            "negative_keywords": all_negative[:50],
            "exact_split": all_split[:20],
            "placement_suggestions": all_placement[:20],
            "video_diagnosis": all_video[:20],
            "today_tasks": today_tasks[:50],
            "monitor_plan": monitor_plan,
            "asin_overview": asin_overview[:20],
            "llm_report": llm_report,
            "excel_path": excel_path,
            "data_directory": data_directory,
            "missing_reports": missing_reports,
        }
