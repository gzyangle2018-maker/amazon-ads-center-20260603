"""
字段映射器 - 将各种来源的列名映射到标准字段

支持：亚马逊后台中文/英文、赛狐ERP、优卖云、领星等第三方ERP
"""
import re
from typing import Dict, Optional, Tuple

# 标准字段 → 可能的源字段名列表
FIELD_MAP: Dict[str, list] = {
    # === 核心标识 ===
    "date": ["日期", "Date", "date"],
    "date_start": ["开始日期", "Start Date", "date_start"],
    "date_end": ["结束日期", "End Date", "date_end"],
    "currency": ["货币", "Currency", "currency"],
    "marketplace": ["店铺", "站点", "国家/地区", "Marketplace", "Country", "marketplace", "零售商"],

    # === 广告结构 ===
    "portfolio_name": ["广告组合名称", "Portfolio Name", "Portfolio", "portfolio_name"],
    "campaign_type": ["广告活动类型", "Campaign Type", "campaign_type", "广告类型"],
    "ad_type": ["广告类型", "Ad Type", "ad_type", "费用类型"],
    "campaign_name": ["广告活动名称", "Campaign Name", "Campaign", "campaign_name"],
    "campaign_status": ["状态", "Status", "campaign_status", "广告活动状态"],
    "ad_group_name": ["广告组名称", "Ad Group Name", "Ad Group", "ad_group_name"],
    "target_text": ["投放", "Targeting", "Keyword", "target_text", "关键词"],
    "target_type": ["投放类型", "Target Type", "target_type", "Targeting Type"],
    "search_term": ["客户搜索词", "用户搜索词", "Search Term", "Customer Search Term", "search_term",
                     "搜索词", "搜索查询", "Search Query"],
    "match_type": ["匹配类型", "Match Type", "match_type"],
    "placement": ["广告位", "Placement", "placement", "广告位名称"],

    # === 竞价与预算 ===
    "bid": ["出价", "Bid", "bid", "默认竞价"],
    "budget": ["预算", "Budget", "budget", "每日预算"],
    "bidding_strategy": ["竞价策略", "Bidding Strategy", "bidding_strategy"],

    # === 展示指标 ===
    "impressions": ["展示量", "曝光量", "Impressions", "impressions", "展现量"],
    "top_of_search_impression_share": ["搜索结果首页首位展示量份额", "Top of Search Impression Share",
                                        "top_of_search_impression_share", "搜索结果顶部展示份额"],
    "viewable_impressions": ["可查看的展现量", "Viewable Impressions", "viewable_impressions", "可见展示次数"],

    # === 点击指标 ===
    "clicks": ["点击量", "Clicks", "clicks", "点击"],
    "ctr": ["点击率 (CTR)", "点击率", "CTR", "ctr", "Click Through Rate"],
    "cpc": ["单次点击成本 (CPC)", "CPC均价", "CPC", "cpc", "Cost Per Click", "每次点击成本"],

    # === 花费与销售 ===
    "spend": ["花费", "Spend", "spend", "支出", "成本", "广告花费"],
    "orders": ["7天总订单数(#)", "14天总订单数(#)", "订单数", "Orders", "orders",
               "订单", "7天内总订单数", "14天内总订单数", "直接订单数"],
    "direct_orders": ["直接订单数", "Direct Orders", "direct_orders"],
    "indirect_orders": ["间接订单数", "Indirect Orders", "indirect_orders"],
    "units": ["7天总销售量(#)", "14天总销售量(#)", "销售量", "Units", "units", "已售商品数量",
              "销量(搜索词暂无该数据)", "销量"],
    "sales": ["7天总销售额", "14天总销售额", "销售额", "Sales", "sales",
              "7天内总销售额", "14天内总销售额"],
    "acos": ["广告投入产出比 (ACOS) 总计", "ACOS", "acos", "ACoS", "广告销售成本"],
    "roas": ["总广告投资回报率 (ROAS)", "ROAS", "roas", "广告支出回报率"],
    "cvr": ["7天的转化率", "14天的转化率", "转化率", "订单转化率CVR", "CVR", "cvr", "Conversion Rate"],
    "cpa": ["CPA", "cpa", "单次获客成本"],

    # === 业务报告指标 ===
    "sessions": ["会话数 - 总计", "会话 - 总计", "Sessions", "sessions", "会话数"],
    "page_views": ["页面浏览量 - 总计", "页面浏览量", "Page Views", "page_views"],
    "unit_session_pct": ["商品会话百分比", "Unit Session %", "unit_session_pct", "商品会话百分比 - B2B"],
    "buy_box_pct": ["推荐报价（推荐报价展示位）百分比", "Buy Box %", "buy_box_pct"],
    "refund_units": ["已退款的商品数量", "Refund Units", "refund_units"],
    "refund_rate": ["退款率", "Refund Rate", "refund_rate"],

    # === B2B ===
    "b2b_sessions": ["会话 - 总计 - B2B", "B2B Sessions", "b2b_sessions"],
    "b2b_orders": ["已订购商品数量 - B2B", "订单商品总数 - B2B", "B2B Orders", "b2b_orders"],
    "b2b_sales": ["已订购商品销售额 - B2B", "B2B Sales", "b2b_sales"],

    # === 品牌新客 ===
    "new_to_brand_orders": ["14天内\"品牌新买家\"订单数量(#)", "新买家订单数", "New-to-Brand Orders",
                            "new_to_brand_orders", "品牌新买家订单数"],
    "new_to_brand_sales": ["14天内\"品牌新买家\"销售额", "新买家销售额", "New-to-Brand Sales",
                           "new_to_brand_sales", "品牌新买家销售额"],

    # === 视频指标 ===
    "vtr": ["显示到达率 (VTR)", "VTR", "vtr"],
    "vctr": ["浏览量点击率 (vCTR)", "vCTR", "vctr"],
    "video_25": ["第一四分位视频观看次数", "Video 25%", "video_25", "视频播放完成25%次数"],
    "video_50": ["中点视频观看次数", "Video 50%", "video_50", "视频播放完成50%次数"],
    "video_75": ["第三四分位视频观看次数", "Video 75%", "video_75", "视频播放完成75%次数"],
    "video_100": ["完整视频观看次数", "Video 100%", "video_100", "视频播放完成100%次数"],
    "video_5s": ["5 秒观看次数", "Video 5s", "video_5s", "视频完成5秒播放次数"],
    "video_unmute": ["视频取消静音", "Video Unmute", "video_unmute", "视频取消静音数"],

    # === 其他 ===
    "dpv": ["14 天商品详情页浏览量 (DPV)", "DPV", "dpv"],
    "atc": ["14 天 ATC", "ATC", "atc"],
    "brand_searches": ["14 天内品牌搜索量", "Brand Searches", "brand_searches"],
    "parent_asin": ["（父）ASIN", "Parent ASIN", "parent_asin"],
    "child_asin": ["（子）ASIN", "Child ASIN", "child_asin"],
    "asin": ["ASIN", "asin", "商品", "产品ASIN"],
    "title": ["标题", "Title", "title", "商品名称"],
}

# 编译正则版本（加速匹配）
_FIELD_MAP_FLAT: Dict[str, str] = {}
for _std_name, _aliases in FIELD_MAP.items():
    for _alias in _aliases:
        _FIELD_MAP_FLAT[_alias.lower().strip()] = _std_name


def map_field(source_name: str) -> Tuple[Optional[str], float]:
    """
    将源字段名映射到标准字段名
    返回: (标准字段名, 置信度)
    """
    clean = source_name.strip()

    # 1. 精确匹配
    if clean.lower() in _FIELD_MAP_FLAT:
        return _FIELD_MAP_FLAT[clean.lower()], 1.0

    # 2. 去括号匹配
    no_paren = re.sub(r'\([^)]*\)', '', clean).strip()
    if no_paren.lower() in _FIELD_MAP_FLAT:
        return _FIELD_MAP_FLAT[no_paren.lower()], 0.95

    # 3. 包含匹配
    for alias, std_name in _FIELD_MAP_FLAT.items():
        if alias in clean.lower() or clean.lower() in alias:
            return std_name, 0.85

    # 4. 关键词匹配
    keywords = {
        "展示": "impressions", "曝光": "impressions", "impression": "impressions",
        "点击率": "ctr", "ctr": "ctr",
        "点击": "clicks", "click": "clicks",
        "花费": "spend", "spend": "spend", "支出": "spend",
        "cpc": "cpc", "单次点击": "cpc",
        "acos": "acos", "广告投入产出比": "acos", "广告销售成本": "acos",
        "roas": "roas", "广告支出回报率": "roas",
        "订单": "orders", "order": "orders",
        "销售": "sales", "sale": "sales",
        "转化": "cvr", "conversion": "cvr",
        "搜索词": "search_term", "search term": "search_term", "search query": "search_term",
        "投放": "target_text", "targeting": "target_text", "keyword": "target_text",
        "广告活动": "campaign_name", "campaign": "campaign_name",
        "广告组": "ad_group_name", "ad group": "ad_group_name",
        "预算": "budget", "budget": "budget",
        "竞价": "bidding_strategy", "bid": "bid",
        "会话": "sessions", "session": "sessions",
        "页面浏览": "page_views", "page view": "page_views",
        "商品会话": "unit_session_pct", "unit session": "unit_session_pct",
        "推荐报价": "buy_box_pct", "buy box": "buy_box_pct",
        "退款": "refund_rate",
        "asin": "asin", "ASIN": "asin",
        "视频": "video",
        "品牌新客": "new_to_brand_orders", "new to brand": "new_to_brand_orders",
    }
    for kw, std_name in keywords.items():
        if kw.lower() in clean.lower():
            return std_name, 0.70

    return None, 0.0


def map_dataframe_columns(columns: list) -> Dict[str, str]:
    """
    将DataFrame的所有列映射到标准字段
    返回: {原始列名: 标准字段名}
    """
    mapping = {}
    for col in columns:
        std_name, conf = map_field(str(col))
        if std_name and conf >= 0.65:
            mapping[col] = std_name
    return mapping


def get_standard_fields() -> list:
    """返回所有标准字段名"""
    return list(FIELD_MAP.keys())


def get_report_required_fields(report_type: str) -> list:
    """返回指定报表类型的必须字段"""
    required = {
        "SP_Campaign_Report": ["date", "campaign_name", "spend", "sales", "acos", "impressions", "clicks"],
        "SP_Search_Term_Report": ["date", "campaign_name", "search_term", "spend", "sales", "orders"],
        "SP_Targeting_Report": ["date", "campaign_name", "target_text", "spend", "sales"],
        "SB_Campaign_Report": ["date", "campaign_name", "spend", "sales", "acos"],
        "SB_Keyword_Report": ["date", "campaign_name", "target_text", "spend", "sales"],
        "SB_Keyword_Placement_Report": ["date", "campaign_name", "target_text", "placement", "spend"],
        "SB_Search_Term_Report": ["date", "campaign_name", "search_term", "spend", "sales"],
        "ERP_Search_Term_Summary_Report": ["search_term", "spend", "sales", "orders", "impressions", "clicks"],
        "ABA_Search_Query_Performance_Report": ["search_term", "asin"],
        "ABA_Top_Search_Terms_Report": ["search_term"],
        "Business_Report_Child_30D": ["child_asin", "parent_asin", "sessions", "page_views"],
        "Business_Report_Child_7D": ["child_asin", "parent_asin", "sessions", "page_views"],
        "Business_Report_Parent_30D": ["parent_asin", "sessions", "page_views"],
        "Business_Report_Parent_7D": ["parent_asin", "sessions", "page_views"],
    }
    return required.get(report_type, [])
