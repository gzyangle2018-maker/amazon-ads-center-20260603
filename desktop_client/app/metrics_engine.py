"""
指标计算引擎 - 计算CTR/CVR/CPC/ACOS/ROAS/TACOS等核心指标
"""
from typing import Dict, List, Any, Optional
import pandas as pd
import numpy as np


def calc_metrics_for_row(row: Dict[str, Any]) -> Dict[str, Any]:
    """为单行数据计算所有指标"""
    impressions = float(row.get('impressions', 0) or 0)
    clicks = float(row.get('clicks', 0) or 0)
    spend = float(row.get('spend', 0) or 0)
    sales = float(row.get('sales', 0) or 0)
    orders = float(row.get('orders', 0) or 0)
    sessions = float(row.get('sessions', 0) or 0)
    page_views = float(row.get('page_views', 0) or 0)

    ctr = clicks / impressions if impressions > 0 else 0
    cpc = spend / clicks if clicks > 0 else 0
    cvr = orders / clicks if clicks > 0 else 0
    acos = spend / sales if sales > 0 else None
    roas = sales / spend if spend > 0 else 0
    unit_session_pct = orders / sessions if sessions > 0 else 0

    return {
        'ctr': ctr,
        'cpc': cpc,
        'cvr': cvr,
        'acos': acos,
        'roas': roas,
        'unit_session_pct': unit_session_pct,
    }


def calc_asin_overview(df_std: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    从标准化数据计算ASIN级别总览
    返回ASIN面板数据列表
    """
    if 'asin' not in df_std.columns and 'child_asin' not in df_std.columns:
        return []

    asin_col = 'asin' if 'asin' in df_std.columns else 'child_asin'

    # 按ASIN分组聚合
    agg_map = {}
    for col in ['spend', 'sales', 'orders', 'impressions', 'clicks',
                'sessions', 'page_views', 'refund_units', 'b2b_orders', 'b2b_sales']:
        if col in df_std.columns:
            agg_map[col] = 'sum'

    if not agg_map:
        return []

    grouped = df_std.groupby(asin_col, as_index=False).agg(agg_map)

    results = []
    for _, row in grouped.iterrows():
        asin_val = row[asin_col]
        if pd.isna(asin_val) or str(asin_val).strip() == '':
            continue

        spend = float(row.get('spend', 0) or 0)
        sales = float(row.get('sales', 0) or 0)
        orders = int(row.get('orders', 0) or 0)
        impressions = int(row.get('impressions', 0) or 0)
        clicks = int(row.get('clicks', 0) or 0)
        sessions = int(row.get('sessions', 0) or 0)
        page_views = int(row.get('page_views', 0) or 0)
        refund_units = int(row.get('refund_units', 0) or 0)
        b2b_orders = int(row.get('b2b_orders', 0) or 0)
        b2b_sales = float(row.get('b2b_sales', 0) or 0)

        ctr = clicks / impressions if impressions > 0 else 0
        cpc = spend / clicks if clicks > 0 else 0
        cvr = orders / clicks if clicks > 0 else 0
        acos = spend / sales if sales > 0 else None
        roas = sales / spend if spend > 0 else 0
        tacos = spend / sales if sales > 0 else None  # TACOS 近似（需要总销售数据）
        unit_session_pct = orders / sessions if sessions > 0 else 0
        refund_rate = refund_units / orders if orders > 0 else 0

        # 提取标题
        title = ''
        if 'title' in df_std.columns:
            titles = df_std[df_std[asin_col] == asin_val]['title'].dropna()
            if len(titles) > 0:
                title = str(titles.iloc[0])

        results.append({
            'asin': str(asin_val),
            'parent_asin': '',
            'title': title,
            'spend': round(spend, 2),
            'sales': round(sales, 2),
            'orders': orders,
            'acos': round(acos, 4) if acos is not None else None,
            'tacos': round(tacos, 4) if tacos is not None else None,
            'impressions': impressions,
            'clicks': clicks,
            'ctr': round(ctr, 4),
            'cvr': round(cvr, 4),
            'cpc': round(cpc, 4),
            'sessions': sessions,
            'page_views': page_views,
            'unit_session_pct': round(unit_session_pct, 4),
            'buy_box_pct': 0,
            'refund_rate': round(refund_rate, 4),
            'b2b_orders': b2b_orders,
            'b2b_sales': round(b2b_sales, 2),
            'page_priority': False,
            'main_problem': '',
            'confidence': '中',
        })

    return results


def calc_traffic_tree(df_std: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    构建流量结构树

    从搜索词/投放数据中提取关键词层级
    """
    rows = []

    if 'search_term' in df_std.columns or 'target_text' in df_std.columns:
        term_col = 'search_term' if 'search_term' in df_std.columns else 'target_text'
        asin_col = 'asin' if 'asin' in df_std.columns else 'child_asin'

        for _, row in df_std.iterrows():
            term = str(row.get(term_col, '')).strip()
            if not term or term == 'nan':
                continue
            asin = str(row.get(asin_col, '')).strip() if asin_col in df_std.columns else ''

            # 判断词层级
            word_count = len(term.split())
            if word_count <= 1:
                level = '核心词'
            elif word_count <= 2:
                level = '1级大词'
            elif word_count <= 3:
                level = '2级大词'
            elif word_count <= 5:
                level = '长尾词'
            else:
                level = '小词/属性词'

            rows.append({
                'asin': asin,
                'word_level': level,
                'target_text': term,
                'source': 'search_term_report',
                'intent_level': '',
                'impressions': int(row.get('impressions', 0) or 0),
                'clicks': int(row.get('clicks', 0) or 0),
                'spend': round(float(row.get('spend', 0) or 0), 2),
                'orders': int(row.get('orders', 0) or 0),
                'sales': round(float(row.get('sales', 0) or 0), 2),
                'cpc': round(float(row.get('cpc', 0) or 0), 4),
                'ctr': round(float(row.get('ctr', 0) or 0), 4),
                'cvr': round(float(row.get('cvr', 0) or 0), 4),
                'acos': round(float(row.get('acos', 0) or 0), 4),
                'roas': round(float(row.get('roas', 0) or 0), 4),
                'aba_rank': '',
                'monthly_search_volume': '',
                'suggestion': '',
            })

    return rows


def calc_summary_stats(df_std: pd.DataFrame) -> Dict[str, Any]:
    """计算汇总统计"""
    spend = float(df_std['spend'].sum()) if 'spend' in df_std.columns else 0
    sales = float(df_std['sales'].sum()) if 'sales' in df_std.columns else 0
    orders = int(df_std['orders'].sum()) if 'orders' in df_std.columns else 0
    impressions = int(df_std['impressions'].sum()) if 'impressions' in df_std.columns else 0
    clicks = int(df_std['clicks'].sum()) if 'clicks' in df_std.columns else 0

    return {
        'spend': round(spend, 2),
        'sales': round(sales, 2),
        'orders': orders,
        'impressions': impressions,
        'clicks': clicks,
        'acos': round(spend / sales, 4) if sales > 0 else None,
        'roas': round(sales / spend, 4) if spend > 0 else 0,
        'ctr': round(clicks / impressions, 4) if impressions > 0 else 0,
        'cpc': round(spend / clicks, 4) if clicks > 0 else 0,
        'cvr': round(orders / clicks, 4) if clicks > 0 else 0,
    }
