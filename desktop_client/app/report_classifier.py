"""
报表识别器 - 通过文件名+Sheet名+字段集合综合判断报表类型

支持识别的报表类型：
- SP_Campaign_Report          商品推广广告活动
- SP_Search_Term_Report        商品推广搜索词
- SP_Targeting_Report          商品推广投放
- SB_Campaign_Report           品牌推广广告活动
- SB_Keyword_Report            品牌推广关键词
- SB_Keyword_Placement_Report  品牌推广关键词广告位
- SB_Search_Term_Report        品牌推广搜索词
- ERP_Search_Term_Summary_Report  ERP广告搜索词汇总
- ABA_Search_Query_Performance_Report  ABA搜索查询绩效
- ABA_Top_Search_Terms_Report   ABA热门搜索词
- Business_Report_Child_30D    业务报告30天子体
- Business_Report_Child_7D     业务报告7天子体
- Business_Report_Parent_30D   业务报告30天父体
- Business_Report_Parent_7D    业务报告7天父体
"""
import re
from typing import Tuple, Optional
from pathlib import Path


# 每种报表类型的识别签名
REPORT_SIGNATURES = {
    "SP_Campaign_Report": {
        "sheet_patterns": [r"商品推广.*广告活动", r"SP.*Campaign", r"Sponsored Products.*Campaign"],
        "file_patterns": [r"商品推广.*广告活动", r"SP.*Campaign", r"Sponsored Products Campaign"],
        "must_have_fields": ["campaign_name", "spend", "acos"],
        "key_fields": ["广告活动类型", "竞价策略", "预算", "状态", "7天总销售额"],
        "exclude_fields": ["搜索词", "search_term", "投放", "target_text", "广告组名称"],
    },
    "SP_Search_Term_Report": {
        "sheet_patterns": [r"商品推广.*搜索词", r"SP.*Search Term", r"Sponsored Products.*Search Term"],
        "file_patterns": [r"商品推广.*搜索词", r"SP.*Search Term", r"Sponsored Products Search Term"],
        "must_have_fields": ["campaign_name", "search_term"],
        "key_fields": ["客户搜索词", "匹配类型", "7天总销售额", "广告SKU"],
        "exclude_fields": [],
    },
    "SP_Targeting_Report": {
        "sheet_patterns": [r"商品推广.*投放", r"SP.*Targeting", r"Sponsored Products.*Targeting"],
        "file_patterns": [r"商品推广.*投放", r"SP.*Targeting", r"Sponsored Products Targeting"],
        "must_have_fields": ["campaign_name", "target_text"],
        "key_fields": ["投放", "匹配类型", "搜索结果首页首位展示量份额", "广告SKU"],
        "exclude_fields": ["客户搜索词", "search_term"],
    },
    "SB_Campaign_Report": {
        "sheet_patterns": [r"品牌推广.*广告活动", r"SB.*Campaign", r"Sponsored Brands.*Campaign"],
        "file_patterns": [r"品牌推广.*广告活动", r"SB.*Campaign", r"Sponsored Brands Campaign"],
        "must_have_fields": ["campaign_name", "spend", "acos"],
        "key_fields": ["费用类型", "品牌新买家", "显示到达率", "14天内品牌搜索量", "5 秒观看次数"],
        "exclude_fields": ["搜索词", "search_term"],
    },
    "SB_Keyword_Report": {
        "sheet_patterns": [r"品牌推广.*关键词[^广告位]", r"品牌推广.*关键词_报告", r"SB.*Keyword[^P]"],
        "file_patterns": [r"品牌推广.*关键词(?!广告位)", r"SB.*Keyword(?!.*Placement)"],
        "must_have_fields": ["campaign_name", "target_text"],
        "key_fields": ["搜索结果首页首位展示量份额", "可查看的展现量", "显示到达率", "5 秒观看次数"],
        "exclude_fields": ["placement", "广告位", "客户搜索词", "search_term"],
    },
    "SB_Keyword_Placement_Report": {
        "sheet_patterns": [r"品牌推广.*关键词广告位", r"品牌推广.*广告位", r"SB.*Keyword.*Placement", r"SB.*Placement"],
        "file_patterns": [r"品牌推广.*广告位", r"关键词广告位", r"Keyword.*Placement"],
        "must_have_fields": ["campaign_name", "target_text"],
        "key_fields": ["投放", "广告位", "placement", "品牌新买家"],
        "exclude_fields": [],
    },
    "SB_Search_Term_Report": {
        "sheet_patterns": [r"品牌推广.*搜索词", r"SB.*Search Term", r"Sponsored Brands.*Search Term"],
        "file_patterns": [r"品牌推广.*搜索词", r"SB.*Search Term", r"Sponsored Brands Search Term"],
        "must_have_fields": ["campaign_name", "search_term"],
        "key_fields": ["客户搜索词", "费用类型", "可查看的展现量", "14天总销售额"],
        "exclude_fields": [],
    },
    "ERP_Search_Term_Summary_Report": {
        "sheet_patterns": [r"广告搜索词汇总", r"搜索词汇总"],
        "file_patterns": [r"广告搜索词汇总", r"搜索词汇总"],
        "must_have_fields": ["search_term"],
        "key_fields": ["店铺", "用户搜索词", "CPC均价", "直接订单数", "间接订单数", "新买家"],
        "exclude_fields": [],
    },
    "ABA_Search_Query_Performance_Report": {
        "sheet_patterns": [r"搜索查询绩效", r"Search Query Performance"],
        "file_patterns": [r"搜索查询绩效", r"品牌分析.*搜索查询", r"Search.Query.Performance"],
        "must_have_fields": ["search_term"],
        "key_fields": ["搜索查询", "Search Query", "搜索查询分数", "search query score"],
        "exclude_fields": [],
    },
    "ABA_Top_Search_Terms_Report": {
        "sheet_patterns": [r"热门搜索词", r"Top Search Terms"],
        "file_patterns": [r"热门搜索词", r"品牌分析.*热门", r"Top.Search.Terms"],
        "must_have_fields": ["search_term"],
        "key_fields": ["搜索词", "Search Term", "搜索频率排名", "search frequency rank"],
        "exclude_fields": [],
    },
    "Business_Report_Child_30D": {
        "sheet_patterns": [r"业务报告.*子体", r"Business.*Child"],
        "file_patterns": [r"30天.*业务报告.*子体", r"业务报告.*30天.*子体", r"30d.*child", r"child.*30d"],
        "must_have_fields": ["child_asin", "parent_asin"],
        "key_fields": ["（子）ASIN", "（父）ASIN", "会话数 - 总计", "已订购商品数量"],
        "exclude_fields": [],
    },
    "Business_Report_Child_7D": {
        "sheet_patterns": [r"业务报告.*子体", r"Business.*Child"],
        "file_patterns": [r"7天.*业务报告.*子体", r"业务报告.*7天.*子体", r"7d.*child", r"child.*7d"],
        "must_have_fields": ["child_asin", "parent_asin"],
        "key_fields": ["（子）ASIN", "（父）ASIN", "会话数 - 总计", "已订购商品数量"],
        "exclude_fields": [],
    },
    "Business_Report_Parent_30D": {
        "sheet_patterns": [r"业务报告.*父体", r"Business.*Parent"],
        "file_patterns": [r"30天.*业务报告.*父体", r"业务报告.*30天.*父体", r"30d.*parent", r"parent.*30d"],
        "must_have_fields": ["parent_asin"],
        "key_fields": ["（父）ASIN", "会话数 - 总计", "转化率 - 总计"],
        "exclude_fields": [],
    },
    "Business_Report_Parent_7D": {
        "sheet_patterns": [r"业务报告.*父体", r"Business.*Parent"],
        "file_patterns": [r"7天.*业务报告.*父体", r"业务报告.*7天.*父体", r"7d.*parent", r"parent.*7d"],
        "must_have_fields": ["parent_asin"],
        "key_fields": ["（父）ASIN", "会话数 - 总计", "转化率 - 总计"],
        "exclude_fields": [],
    },
}


def _match_pattern(text: str, patterns: list) -> bool:
    """检查文本是否匹配任一模式"""
    if not text:
        return False
    text_lower = str(text).lower()
    for pat in patterns:
        if re.search(pat, text_lower, re.IGNORECASE):
            return True
    return False


def _count_field_matches(columns: list, field_names: list) -> int:
    """计算列名中有多少匹配给定字段名"""
    cols_lower = [str(c).lower() for c in columns]
    count = 0
    for fn in field_names:
        fn_lower = fn.lower()
        for cl in cols_lower:
            if fn_lower in cl or cl in fn_lower:
                count += 1
                break
    return count


def classify_report(
    filename: str,
    sheet_name: str = "",
    columns: list = None
) -> Tuple[Optional[str], float, str]:
    """
    识别报表类型

    参数:
        filename: 文件名
        sheet_name: Sheet名
        columns: 列名列表

    返回:
        (report_type, confidence, matched_reason)
    """
    if columns is None:
        columns = []

    best_type = None
    best_score = 0.0
    best_reason = ""

    for rtype, sig in REPORT_SIGNATURES.items():
        score = 0.0
        reasons = []

        # 1. Sheet名匹配 (权重最高)
        if sheet_name and _match_pattern(sheet_name, sig["sheet_patterns"]):
            score += 0.40
            reasons.append(f"Sheet名匹配")

        # 2. 文件名匹配
        if _match_pattern(filename, sig["file_patterns"]):
            score += 0.30
            reasons.append(f"文件名匹配")

        # 3. 必须字段检查
        if columns and sig["must_have_fields"]:
            must_match = _count_field_matches(columns, sig["must_have_fields"])
            must_total = len(sig["must_have_fields"])
            if must_match == must_total:
                score += 0.20
                reasons.append(f"必须字段全匹配({must_match}/{must_total})")
            elif must_match >= must_total * 0.5:
                score += 0.10
                reasons.append(f"必须字段部分匹配({must_match}/{must_total})")
            else:
                continue  # 必须字段不满足，跳过此类型

        # 4. 关键字段加分
        if columns and sig["key_fields"]:
            key_match = _count_field_matches(columns, sig["key_fields"])
            if key_match > 0:
                bonus = min(0.10, key_match * 0.02)
                score += bonus
                reasons.append(f"关键字段命中{key_match}个")

        # 5. 排除字段扣分
        if columns and sig["exclude_fields"]:
            exclude_match = _count_field_matches(columns, sig["exclude_fields"])
            if exclude_match > 0:
                score -= exclude_match * 0.10
                reasons.append(f"排除字段命中{exclude_match}个")

        # 判断最佳
        if score > best_score:
            best_score = score
            best_type = rtype
            best_reason = "+".join(reasons) if reasons else "默认匹配"

    # 阈值判断
    if best_score < 0.35:
        return None, best_score, f"未达置信度阈值(score={best_score:.2f})"

    confidence = min(best_score, 0.98)  # 上限0.98，不允许100%自信
    return best_type, round(confidence, 2), best_reason


def classify_from_filename_only(filename: str) -> Tuple[Optional[str], float, str]:
    """仅从文件名判断报表类型（快速通道）"""
    return classify_report(filename, "", None)


def get_all_report_types() -> list:
    """返回所有支持的报表类型"""
    return list(REPORT_SIGNATURES.keys())


def extract_asin_from_filename(filename: str) -> Optional[str]:
    """从文件名提取ASIN（如B0816PPB5T）"""
    import re
    match = re.search(r'[A-Z0-9]{10}', str(filename))
    return match.group(0) if match else None


def extract_date_range_from_filename(filename: str) -> Tuple[Optional[str], Optional[str]]:
    """从文件名提取日期范围"""
    import re
    # 模式: 20260427-20260526
    match = re.search(r'(\d{8})\s*[-_到]\s*(\d{8})', str(filename))
    if match:
        d1 = f"{match.group(1)[:4]}-{match.group(1)[4:6]}-{match.group(1)[6:8]}"
        d2 = f"{match.group(2)[:4]}-{match.group(2)[4:6]}-{match.group(2)[6:8]}"
        return d1, d2
    # 单日期模式
    match = re.search(r'(\d{4})[.-](\d{1,2})[.-](\d{1,2})', str(filename))
    if match:
        d = f"{match.group(1)}-{match.group(2).zfill(2)}-{match.group(3).zfill(2)}"
        return d, d
    return None, None


def extract_period_from_filename(filename: str) -> Optional[str]:
    """提取报表周期：30天/7天/14天"""
    if re.search(r'(30天|30d|30D|月度|月报)', str(filename)):
        return "30D"
    if re.search(r'(14天|14d|14D|双周)', str(filename)):
        return "14D"
    if re.search(r'(7天|7d|7D|周报)', str(filename)):
        return "7D"
    if re.search(r'(90天|90d|90D|季度)', str(filename)):
        return "90D"
    return None
