"""
12层广告规则引擎

规则执行顺序：
1. 否词规则
2. 预算规则
3. 预算模式规则
4. 竞价规则
5. 王牌词拆精准规则
6. 页面优先规则
7. 广告位规则
8. 企业购规则
9. AMC规则
10. SBV视频规则
11. 意图分类
12. 综合动作生成
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field, asdict

from app.services.utils import safe_divide, calc_ctr, calc_cvr, calc_cpc, calc_acos, calc_roas


# === 意图分类词根 ===
INTENT_CATEGORIES = {
    "兼容/接口": ["nema", "iec", "c13", "c14", "c5", "c7", "c19", "c20",
                  "3-prong", "2-prong", "usb c", "type c", "barrel", "round tip",
                  "connector", "plug", "ac cord", "power cord"],
    "规格参数": ["45w", "65w", "90w", "100w", "120w", "130w", "180w", "240w",
                 "3ft", "6ft", "10ft", "15ft", "18awg", "16awg", "14awg",
                 "125v", "250v", "10a", "13a", "15a", "19v", "20v",
                 "ul", "etl", "ce", "rohs"],
    "场景/用途": ["office", "home", "desk", "travel", "replacement", "spare",
                  "school", "work", "monitor", "tv", "printer", "pc", "laptop"],
    "痛点/价值": ["heavy duty", "durable", "safe", "thick", "strong", "no loose",
                   "fast charging", "reliable", "universal", "compatible"],
    "品牌/竞品": ["hp", "dell", "lenovo", "asus", "acer", "toshiba", "samsung",
                  "lg", "sony", "anker", "belkin", "insignia", "onn", "microsoft", "surface"],
    "防守": [],
}

# 高相关核心词（否定时需负责人确认）
HIGH_RELEVANCE_ROOTS = [
    "charger", "adapter", "power", "cord", "cable", "usb c", "laptop",
    "replacement", "compatible", "nema", "iec", "c13", "c14", "c5", "c7",
    "hp", "dell", "lenovo", "asus", "acer", "toshiba", "samsung", "monitor", "tv",
]


@dataclass
class ActionItem:
    """广告调整动作"""
    priority: int = 0
    operator: str = ""
    shop: str = ""
    asin: str = ""
    ad_type: str = ""
    campaign_name: str = ""
    ad_group_name: str = ""
    target_text: str = ""
    action_layer: str = ""
    current_data: str = ""
    suggested_action: str = ""
    before_value: str = ""
    after_value: str = ""
    adjustment_value: str = ""
    reason: str = ""
    expected_impact: str = ""
    execute_time: str = ""
    risk_flag: str = ""
    confidence: float = 1.0


@dataclass
class AnalysisResult:
    """完整分析结果"""
    operator: str = ""
    shop: str = ""
    marketplace: str = ""
    date_range: str = ""
    data_directory: List[Dict] = field(default_factory=list)
    missing_reports: List[Dict] = field(default_factory=list)
    asin_overview: List[Dict] = field(default_factory=list)
    rule_engine_actions: List[ActionItem] = field(default_factory=list)
    negative_keywords: List[Dict] = field(default_factory=list)
    exact_split_candidates: List[Dict] = field(default_factory=list)
    placement_suggestions: List[Dict] = field(default_factory=list)
    video_diagnosis: List[Dict] = field(default_factory=list)
    traffic_tree: List[Dict] = field(default_factory=list)
    today_execution: List[Dict] = field(default_factory=list)
    monitor_7day: List[Dict] = field(default_factory=list)
    llm_input: Dict = field(default_factory=dict)
    core_diagnosis: Dict = field(default_factory=dict)


class RuleEngine:
    """规则引擎主类"""

    def __init__(self, data_frames: Dict[str, pd.DataFrame] = None):
        self.data = data_frames or {}
        self.actions: List[ActionItem] = []
        self.warnings: List[str] = []
        self.missing: List[Dict] = []

    def load_data(self, data_frames: Dict[str, pd.DataFrame]):
        self.data = data_frames
        self.actions = []
        self.warnings = []
        self.missing = []

    def _get_combined_df(self, report_types: List[str]) -> pd.DataFrame:
        dfs = []
        for rt in report_types:
            if rt in self.data and len(self.data[rt]) > 0:
                df = self.data[rt].copy()
                df['_source_report'] = rt
                dfs.append(df)
        if not dfs:
            return pd.DataFrame()
        return pd.concat(dfs, ignore_index=True, sort=False)

    # ============================================================
    # 规则1: 否词规则
    # ============================================================
    def rule_negative_keywords(self, df: pd.DataFrame = None) -> List[Dict]:
        if df is None:
            df = self._get_combined_df([
                'SP_Search_Term_Report', 'SB_Search_Term_Report',
                'ERP_Search_Term_Summary_Report'
            ])

        if df.empty:
            self.missing.append({
                'missing_report': 'SP/SB搜索词报表',
                'affected_module': '否词规则',
                'impact': '无法生成否词建议',
                'is_blocking': False,
                'fallback_method': '跳过否词分析',
            })
            return []

        results = []
        df = df[df.get('is_summary', False) == False] if 'is_summary' in df.columns else df

        for _, row in df.iterrows():
            clicks = int(row.get('clicks', 0) or 0)
            orders = int(row.get('orders', 0) or 0)
            search_term = str(row.get('search_term', '') or row.get('target_text', ''))
            campaign = str(row.get('campaign_name', ''))
            ad_group = str(row.get('ad_group_name', ''))
            asin_val = str(row.get('asin', '') or row.get('child_asin', ''))
            spend = float(row.get('spend', 0) or 0)
            sales = float(row.get('sales', 0) or 0)

            if not search_term or clicks < 10 or orders > 0:
                continue

            is_high_relevance = any(
                root in search_term.lower() for root in HIGH_RELEVANCE_ROOTS
            )

            match_type = str(row.get('match_type', '')).lower()
            neg_type = 'Negative Exact'
            if 'broad' in match_type:
                neg_type = 'Negative Phrase'
            elif 'phrase' in match_type:
                neg_type = 'Negative Exact'

            result = {
                'asin': asin_val,
                'campaign_name': campaign,
                'ad_group_name': ad_group,
                'search_term': search_term,
                'clicks': clicks,
                'orders': orders,
                'spend': spend,
                'sales': sales,
                'acos': calc_acos(spend, sales),
                'is_high_relevance': is_high_relevance,
                'neg_type': neg_type,
                'needs_approval': is_high_relevance,
                'reason': f'点击{clicks}次零转化' + (' [高相关核心词，需负责人确认后否定]' if is_high_relevance else ''),
            }
            results.append(result)

            action = ActionItem(
                priority=1 if not is_high_relevance else 2,
                asin=asin_val,
                ad_type='SP' if 'SP' in str(row.get('_source_report', '')) else 'SB',
                campaign_name=campaign,
                ad_group_name=ad_group,
                target_text=search_term,
                action_layer='否词/否ASIN层',
                current_data=f'点击{clicks}, 订单{orders}, 花费${spend:.2f}',
                suggested_action=f'添加{neg_type}否词',
                before_value='-',
                after_value=neg_type,
                adjustment_value=search_term,
                reason=result['reason'],
                expected_impact='阻止无效花费',
                risk_flag='高相关核心词' if is_high_relevance else '',
            )
            self.actions.append(action)

        return results

    # ============================================================
    # 规则2: 预算规则
    # ============================================================
    def rule_budget(self, df: pd.DataFrame = None, is_recent_3d: bool = False) -> List[Dict]:
        if df is None:
            df = self._get_combined_df(['SP_Campaign_Report', 'SB_Campaign_Report'])

        if df.empty:
            return []

        results = []
        df = df[df.get('is_summary', False) == False] if 'is_summary' in df.columns else df

        for _, row in df.iterrows():
            spend = float(row.get('spend', 0) or 0)
            sales = float(row.get('sales', 0) or 0)
            acos = calc_acos(spend, sales)

            if acos is None:
                continue

            budget = float(row.get('budget', 0) or 0)
            campaign = str(row.get('campaign_name', ''))
            asin_val = str(row.get('asin', '') or row.get('child_asin', ''))

            suggestion = None
            new_budget = budget
            risk = ''

            if acos < 0.20:
                if is_recent_3d:
                    new_budget = budget * 2.0
                    suggestion = f'预算 +100%: ${budget:.2f} → ${new_budget:.2f}'
                else:
                    new_budget = budget * 1.5
                    suggestion = f'预算 +50%: ${budget:.2f} → ${new_budget:.2f}'
                    risk = '非近3天数据，预算建议降级为参考'
            elif acos > 0.35:
                if is_recent_3d:
                    new_budget = budget * 0.5
                    suggestion = f'预算 -50%: ${budget:.2f} → ${new_budget:.2f}'
                else:
                    new_budget = budget * 0.5
                    suggestion = f'预算 -50%: ${budget:.2f} → ${new_budget:.2f}'
                    risk = '非近3天数据，预算建议降级为参考'

            if suggestion:
                results.append({
                    'campaign_name': campaign,
                    'asin': asin_val,
                    'current_budget': budget,
                    'suggested_budget': round(new_budget, 2),
                    'acos': round(acos, 4),
                    'spend': spend,
                    'sales': sales,
                    'risk': risk,
                })

                action = ActionItem(
                    priority=1 if acos < 0.15 or acos > 0.50 else 2,
                    asin=asin_val,
                    campaign_name=campaign,
                    action_layer='预算调整层',
                    current_data=f'ACoS={acos*100:.1f}%, 花费${spend:.2f}, 销售${sales:.2f}',
                    suggested_action=suggestion,
                    before_value=f'${budget:.2f}',
                    after_value=f'${new_budget:.2f}',
                    adjustment_value=f'${new_budget - budget:+.2f}',
                    reason=f'ACoS={acos*100:.1f}%' + (' (低ACoS扩量)' if acos < 0.20 else ' (高ACoS收缩)'),
                    expected_impact='增加花费效率' if acos < 0.20 else '降低无效花费',
                    risk_flag=risk,
                )
                self.actions.append(action)

        return results

    # ============================================================
    # 规则3: 预算模式规则
    # ============================================================
    def rule_bidding_mode(self, df: pd.DataFrame = None) -> List[Dict]:
        if df is None:
            df = self._get_combined_df(['SP_Campaign_Report', 'SB_Campaign_Report'])

        if df.empty:
            return []

        results = []
        df = df[df.get('is_summary', False) == False] if 'is_summary' in df.columns else df

        for _, row in df.iterrows():
            spend = float(row.get('spend', 0) or 0)
            sales = float(row.get('sales', 0) or 0)
            acos = calc_acos(spend, sales)
            bidding = str(row.get('bidding_strategy', '')).lower()

            if acos is None or acos >= 0.20:
                continue

            if '仅降低' in bidding or '只降低' in bidding or 'down only' in bidding:
                campaign = str(row.get('campaign_name', ''))
                results.append({
                    'campaign_name': campaign,
                    'current_bidding': bidding,
                    'suggested_bidding': '固定竞价',
                    'acos': round(acos, 4),
                    'reason': '低ACOS活动需稳定吃量，不建议只降低导致扩量不足',
                })

                action = ActionItem(
                    priority=2,
                    campaign_name=campaign,
                    action_layer='预算调整层',
                    current_data=f'竞价策略={bidding}, ACoS={acos*100:.1f}%',
                    suggested_action='改为固定竞价',
                    before_value=bidding,
                    after_value='固定竞价',
                    adjustment_value='固定竞价',
                    reason='低ACOS活动需稳定吃量，不建议只降低',
                    expected_impact='提高竞价稳定性，增加曝光机会',
                )
                self.actions.append(action)

        return results

    # ============================================================
    # 规则4: 竞价规则
    # ============================================================
    def rule_bid_adjustment(self, df: pd.DataFrame = None) -> List[Dict]:
        if df is None:
            df = self._get_combined_df([
                'SP_Search_Term_Report', 'SB_Search_Term_Report', 'SB_Keyword_Report'
            ])

        if df.empty:
            return []

        results = []
        df = df[df.get('is_summary', False) == False] if 'is_summary' in df.columns else df

        for _, row in df.iterrows():
            spend = float(row.get('spend', 0) or 0)
            sales = float(row.get('sales', 0) or 0)
            acos = calc_acos(spend, sales)
            clicks = int(row.get('clicks', 0) or 0)
            orders = int(row.get('orders', 0) or 0)
            bid = row.get('bid', None)
            target = str(row.get('target_text', '') or row.get('search_term', ''))
            campaign = str(row.get('campaign_name', ''))
            ad_group = str(row.get('ad_group_name', ''))
            asin_val = str(row.get('asin', '') or row.get('child_asin', ''))

            if clicks >= 10 and orders == 0:
                continue

            if clicks < 10 and orders == 0:
                self.warnings.append(f'{campaign}/{target}: 点击<10且无订单，标记观察不直接否定')
                continue

            if acos is None:
                continue

            bid_adj = 0.0
            if acos <= 0.10:
                bid_adj = 0.20
            elif acos <= 0.20:
                bid_adj = 0.10
            elif acos >= 0.40:
                bid_adj = -0.20
            elif acos >= 0.30:
                bid_adj = -0.10

            if bid_adj == 0:
                continue

            bid_note = ''
            if bid is None or bid == 0:
                bid_note = '缺当前出价，无法计算调整后出价，仅给调整方向'

            results.append({
                'campaign_name': campaign,
                'ad_group_name': ad_group,
                'target_text': target,
                'asin': asin_val,
                'current_bid': bid if bid else 'N/A',
                'adjustment': bid_adj,
                'acos': round(acos, 4),
                'note': bid_note,
            })

            action = ActionItem(
                priority=2,
                asin=asin_val,
                campaign_name=campaign,
                ad_group_name=ad_group,
                target_text=target,
                action_layer='竞价层',
                current_data=f'ACoS={acos*100:.1f}%, 出价=${bid if bid else "N/A"}',
                suggested_action=f'出价 {"+" if bid_adj > 0 else ""}{bid_adj:.2f} USD',
                before_value=f'${bid:.2f}' if bid else 'N/A',
                after_value=f'${bid + bid_adj:.2f}' if bid else f'方向: {"+" if bid_adj > 0 else ""}{bid_adj:.2f}',
                adjustment_value=f'{bid_adj:+.2f}',
                reason=f'ACoS={acos*100:.1f}%',
                expected_impact=f'{"提升曝光和转化" if bid_adj > 0 else "降低花费"}',
                risk_flag=bid_note,
            )
            self.actions.append(action)

        return results

    # ============================================================
    # 规则5: 王牌词拆精准规则
    # ============================================================
    def rule_exact_split(self, df: pd.DataFrame = None, target_acos: float = 0.30) -> List[Dict]:
        if df is None:
            df = self._get_combined_df([
                'SP_Search_Term_Report', 'SB_Search_Term_Report',
                'ERP_Search_Term_Summary_Report'
            ])

        if df.empty:
            return []

        df = df[df.get('is_summary', False) == False] if 'is_summary' in df.columns else df

        group_stats = df.groupby('ad_group_name').agg(
            avg_ctr=('ctr', 'mean'),
            avg_cvr=('cvr', 'mean'),
        ).reset_index()

        results = []

        for _, row in df.iterrows():
            orders = int(row.get('orders', 0) or 0)
            spend = float(row.get('spend', 0) or 0)
            sales = float(row.get('sales', 0) or 0)
            acos = calc_acos(spend, sales)
            ctr = float(row.get('ctr', 0) or 0)
            cvr = float(row.get('cvr', 0) or 0)
            search_term = str(row.get('search_term', '') or row.get('target_text', ''))
            campaign = str(row.get('campaign_name', ''))
            ad_group = str(row.get('ad_group_name', ''))
            asin_val = str(row.get('asin', '') or row.get('child_asin', ''))

            if orders <= 0 or acos is None or acos >= target_acos:
                continue

            gs = group_stats[group_stats['ad_group_name'] == ad_group]
            if gs.empty:
                continue
            avg_ctr = gs.iloc[0]['avg_ctr']
            avg_cvr = gs.iloc[0]['avg_cvr']

            if ctr > avg_ctr and cvr > avg_cvr:
                new_campaign = f'{asin_val}-SP-Exact-Harvest-{search_term[:30]}-V1'
                new_ad_group = f'Harvest-{search_term[:30]}'

                results.append({
                    'asin': asin_val,
                    'original_campaign': campaign,
                    'original_ad_group': ad_group,
                    'search_term': search_term,
                    'performance': f'CTR={ctr*100:.2f}%, CVR={cvr*100:.2f}%, ACoS={acos*100:.1f}%',
                    'new_campaign': new_campaign,
                    'new_ad_group': new_ad_group,
                })

                action = ActionItem(
                    priority=1,
                    asin=asin_val,
                    campaign_name=campaign,
                    ad_group_name=ad_group,
                    target_text=search_term,
                    action_layer='拆精准层',
                    current_data=f'CTR={ctr*100:.2f}% > avg={avg_ctr*100:.2f}%, CVR={cvr*100:.2f}% > avg={avg_cvr*100:.2f}%',
                    suggested_action=f'拆出精准组: {new_campaign}',
                    before_value=f'{campaign}/{ad_group}',
                    after_value=new_campaign,
                    adjustment_value='拆出精准 + 原组Negative Exact',
                    reason=f'高表现搜索词(ACoS={acos*100:.1f}%)，CTR/CVR双高，建议拆出精准收割',
                    expected_impact='精准组单独优化竞价和预算，防止Broad/Phrase组稀释',
                )
                self.actions.append(action)

        return results

    # ============================================================
    # 规则6: 页面优先规则
    # ============================================================
    def rule_page_priority(self, df: pd.DataFrame = None) -> List[Dict]:
        if df is None:
            df = self._get_combined_df([
                'Business_Report_Child_30D', 'Business_Report_Child_7D',
                'Business_Report_Parent_30D', 'Business_Report_Parent_7D'
            ])

        if df.empty:
            self.missing.append({
                'missing_report': '业务报告(子体/父体)',
                'affected_module': '页面优先规则',
                'impact': '无法判断页面转化问题',
                'is_blocking': False,
                'fallback_method': '假定页面正常，不触发页面优先标志',
            })
            return []

        results = []
        avg_unit_session = df['unit_session_pct'].mean() if 'unit_session_pct' in df.columns else 0
        avg_cvr_val = df['cvr'].mean() if 'cvr' in df.columns else 0

        for _, row in df.iterrows():
            unit_sess = float(row.get('unit_session_pct', 0) or 0)
            cvr = float(row.get('cvr', 0) or 0)
            buy_box = float(row.get('buy_box_pct', 1.0) or 1.0)
            asin_val = str(row.get('child_asin', '') or row.get('parent_asin', '') or row.get('asin', ''))

            is_page_issue = False
            reasons = []

            if avg_unit_session > 0 and unit_sess < avg_unit_session * 0.7:
                is_page_issue = True
                reasons.append(f'商品会话百分比({unit_sess*100:.1f}%)低于平均({avg_unit_session*100:.1f}%)')

            if avg_cvr_val > 0 and cvr < avg_cvr_val * 0.7:
                is_page_issue = True
                reasons.append(f'转化率({cvr*100:.1f}%)低于平均({avg_cvr_val*100:.1f}%)')

            if buy_box < 0.90:
                is_page_issue = True
                reasons.append(f'Buy Box率({buy_box*100:.1f}%)<90%')

            if is_page_issue:
                results.append({
                    'asin': asin_val,
                    'unit_session_pct': unit_sess,
                    'cvr': cvr,
                    'buy_box_pct': buy_box,
                    'is_page_issue': True,
                    'reasons': '; '.join(reasons),
                    'recommendation': '页面与报价优先，不做激进放量；广告只做防守性+精准收割操作',
                })

                for action in self.actions:
                    if action.action_layer == '预算调整层' and action.asin == asin_val:
                        if '预算' in action.suggested_action and '+' in action.suggested_action:
                            action.risk_flag += ' [页面优先: 预算增幅打折]'

        return results

    # ============================================================
    # 规则7: 广告位规则
    # ============================================================
    def rule_placement(self, df: pd.DataFrame = None) -> List[Dict]:
        if df is None:
            df = self._get_combined_df(['SB_Keyword_Placement_Report'])

        if df.empty:
            self.missing.append({
                'missing_report': 'Placement广告位报表',
                'affected_module': '广告位规则',
                'impact': '广告位溢价建议降级，仅参考搜索结果首页首位展示量份额',
                'is_blocking': False,
                'fallback_method': '降级处理',
            })
            return []

        results = []
        if 'placement' in df.columns:
            for placement, group in df.groupby('placement'):
                total_spend = group['spend'].sum() if 'spend' in group.columns else 0
                total_sales = group['sales'].sum() if 'sales' in group.columns else 0
                acos = calc_acos(total_spend, total_sales)

                suggestion = None
                if 'Top' in str(placement) or '顶部' in str(placement):
                    if acos is not None and acos < 0.25:
                        suggestion = 'Top位溢价 +20%'
                    elif acos is not None and acos < 0.35:
                        suggestion = 'Top位溢价 +10%'
                elif 'Product' in str(placement) or '商品页面' in str(placement):
                    if acos is None or (acos > 0.40):
                        suggestion = '商品页面溢价 -20%'
                elif 'Rest' in str(placement) or '其他' in str(placement):
                    suggestion = '保持或降低'

                if suggestion:
                    results.append({
                        'placement': str(placement),
                        'spend': total_spend,
                        'sales': total_sales,
                        'acos': round(acos, 4) if acos else 'N/A',
                        'suggestion': suggestion,
                    })

        return results

    # ============================================================
    # 规则8: 企业购规则
    # ============================================================
    def rule_b2b(self, df: pd.DataFrame = None) -> List[Dict]:
        if df is None:
            df = self._get_combined_df([
                'Business_Report_Child_30D', 'Business_Report_Parent_30D'
            ])

        b2b_fields = ['b2b_orders', 'b2b_sales', 'b2b_sessions']
        has_b2b = any(f in df.columns for f in b2b_fields) if not df.empty else False

        if not has_b2b:
            self.warnings.append('缺B2B数据，企业购建议谨慎放大')
            return []

        total_b2b_sales = df['b2b_sales'].sum() if 'b2b_sales' in df.columns else 0

        if total_b2b_sales == 0:
            self.missing.append({
                'missing_report': 'B2B销售数据',
                'affected_module': '企业购规则',
                'impact': 'B2B数据存在但当前贡献低',
                'is_blocking': False,
                'fallback_method': '企业购建议谨慎放大',
            })

        return []

    # ============================================================
    # 规则9: AMC规则
    # ============================================================
    def rule_amc(self):
        self.missing.append({
            'missing_report': 'AMC人群表现数据',
            'affected_module': 'AMC规则',
            'impact': 'AMC建议仅方向性判断',
            'is_blocking': False,
            'fallback_method': '方向性判断：高意图人群溢价+50~+100%; 浏览未购买→SD重定向; 加购未购买→SD强召回',
        })
        return []

    # ============================================================
    # 规则10: SBV视频规则
    # ============================================================
    def rule_sbv_video(self, df: pd.DataFrame = None) -> List[Dict]:
        if df is None:
            df = self._get_combined_df(['SB_Campaign_Report', 'SB_Keyword_Report'])

        video_fields = ['video_5s', 'video_25', 'video_50', 'video_75', 'video_100',
                        'video_unmute', 'vtr', 'vctr']
        has_video = any(f in df.columns for f in video_fields) if not df.empty else False

        if not has_video:
            return []

        results = []
        for _, row in df.iterrows():
            v5s = int(row.get('video_5s', 0) or 0)
            v25 = int(row.get('video_25', 0) or 0)
            v50 = int(row.get('video_50', 0) or 0)
            v75 = int(row.get('video_75', 0) or 0)
            v100 = int(row.get('video_100', 0) or 0)
            vtr = float(row.get('vtr', 0) or 0)
            vctr = float(row.get('vctr', 0) or 0)
            campaign = str(row.get('campaign_name', ''))
            asin_val = str(row.get('asin', '') or row.get('child_asin', ''))

            issues = []
            if v5s > 0 and v25 > 0 and v25 / max(v5s, 1) < 0.5:
                issues.append('5秒→25%掉点大: 前5秒钩子弱')
            if v25 > 0 and v50 > 0 and v50 / max(v25, 1) < 0.5:
                issues.append('25%→50%掉点大: 卖点节奏弱')
            if v50 > 0 and v75 > 0 and v75 / max(v50, 1) < 0.5:
                issues.append('50%→75%掉点大: 视频过长或证据不足')
            if v75 > 0 and v100 > 0 and v100 / max(v75, 1) < 0.3:
                issues.append('完播率低: 视频结尾CTA不足')
            if vctr < 0.005:
                issues.append('vCTR低: 标题/首帧/产品痛点不够')

            if issues:
                scripts = [
                    f'"{asin_val} 电源适配器完美兼容{asin_val}笔记本电脑"',
                    f'"替换您的旧充电器？{asin_val}配件专为{asin_val}设计"',
                    f'"安全认证UL/ETL，{asin_val}电源线稳定供电"',
                    f'"10ft超长线缆，{asin_val}办公桌不再束缚"',
                    f'"{asin_val}快速充电，65W大功率输出"',
                ]

                results.append({
                    'campaign_name': campaign,
                    'asin': asin_val,
                    'video_5s': v5s,
                    'video_25': v25,
                    'video_50': v50,
                    'video_75': v75,
                    'video_100': v100,
                    'vtr': vtr,
                    'vctr': vctr,
                    'issues': issues,
                    'scripts': scripts,
                })

        return results

    # ============================================================
    # 意图分类器
    # ============================================================
    def classify_intent(self, text: str) -> List[str]:
        if not text:
            return []
        text_lower = text.lower()
        categories = []
        for cat, roots in INTENT_CATEGORIES.items():
            if cat == '防守':
                continue
            for root in roots:
                if root in text_lower:
                    categories.append(cat)
                    break
        if not categories:
            categories.append('通用/未分类')
        return categories

    # ============================================================
    # 综合执行
    # ============================================================
    def run_all_rules(self, is_recent_3d: bool = False) -> AnalysisResult:
        result = AnalysisResult()

        negs = self.rule_negative_keywords()
        result.negative_keywords = negs

        self.rule_budget(is_recent_3d=is_recent_3d)
        self.rule_bidding_mode()
        self.rule_bid_adjustment()

        splits = self.rule_exact_split()
        result.exact_split_candidates = splits

        self.rule_page_priority()

        placements = self.rule_placement()
        result.placement_suggestions = placements

        self.rule_b2b()
        self.rule_amc()

        videos = self.rule_sbv_video()
        result.video_diagnosis = videos

        result.missing_reports = self.missing
        result.rule_engine_actions = self.actions

        today = []
        for i, action in enumerate(self.actions):
            today.append({
                'seq': i + 1,
                'priority': action.priority,
                'asin': action.asin,
                'campaign_name': action.campaign_name,
                'ad_group_name': action.ad_group_name,
                'target_text': action.target_text,
                'action': action.suggested_action,
                'adjustment': action.adjustment_value,
                'risk': action.risk_flag,
                'status': '待执行',
            })
        result.today_execution = sorted(today, key=lambda x: x['priority'])

        result.monitor_7day = [
            {'target': 'ACoS趋势', 'metric': 'acos', 'threshold': 'ACoS>35%', 'trigger_action': '重新评估预算和竞价', 'window': '7天'},
            {'target': '点击转化', 'metric': 'orders/clicks', 'threshold': '点击>=10零转化', 'trigger_action': '添加否词', 'window': '3天滚动'},
            {'target': '预算消耗率', 'metric': 'spend/budget', 'threshold': '日均>80%预算', 'trigger_action': '检查是否被预算限制', 'window': '每日'},
            {'target': '页面健康', 'metric': 'unit_session_pct', 'threshold': '低于平均70%', 'trigger_action': '优先优化页面', 'window': '周度'},
            {'target': 'Buy Box', 'metric': 'buy_box_pct', 'threshold': '<90%', 'trigger_action': '检查定价/库存', 'window': '每日'},
            {'target': '关键词排名', 'metric': 'top_of_search_share', 'threshold': '下跌>10%', 'trigger_action': '调整竞价', 'window': '周度'},
            {'target': '新客获取', 'metric': 'new_to_brand_orders', 'threshold': '下降趋势', 'trigger_action': '增加品牌推广预算', 'window': '周度'},
        ]

        result.core_diagnosis = {
            'main_problem': self._determine_main_problem(),
            'data_completeness': self._assess_data_completeness(),
            'page_priority': any('页面优先' in str(getattr(a, 'risk_flag', '')) for a in self.actions),
            'confidence': min(1.0, 0.5 + len(self.data) * 0.05),
            'total_actions': len(self.actions),
            'high_priority_actions': sum(1 for a in self.actions if a.priority <= 2),
            'missing_count': len(self.missing),
        }

        return result

    def _determine_main_problem(self) -> str:
        if not self.actions:
            return '数据不足，无法判断'

        has_neg = any(a.action_layer == '否词/否ASIN层' for a in self.actions)
        has_budget_increase = any('预算' in a.action_layer and '+' in a.suggested_action for a in self.actions)
        has_budget_decrease = any('预算' in a.action_layer and '-' in a.suggested_action for a in self.actions)

        if has_budget_decrease and has_neg:
            return 'ACOS失控'
        elif has_neg and not has_budget_increase:
            return '花费有但没转化'
        elif has_budget_increase:
            return '花费花不出去'
        else:
            return '需要综合优化'

    def _assess_data_completeness(self) -> str:
        total = 14
        present = len([k for k, v in self.data.items() if not v.empty])
        pct = present / total
        if pct >= 0.8:
            return '完整'
        elif pct >= 0.5:
            return '部分完整'
        else:
            return '严重缺失'

    def to_llm_input(self, result: AnalysisResult) -> Dict:
        return {
            'operator': result.operator,
            'shop': result.shop,
            'marketplace': result.marketplace,
            'date_range': result.date_range,
            'data_directory': result.data_directory,
            'missing_reports': [m['missing_report'] for m in result.missing_reports],
            'asin_overview': result.asin_overview,
            'rule_engine_actions': [
                {
                    'priority': a.priority,
                    'layer': a.action_layer,
                    'campaign': a.campaign_name,
                    'ad_group': a.ad_group_name,
                    'target': a.target_text,
                    'action': a.suggested_action,
                    'reason': a.reason,
                }
                for a in result.rule_engine_actions
            ],
            'negative_keywords': result.negative_keywords,
            'exact_split_candidates': result.exact_split_candidates,
            'placement_suggestions': result.placement_suggestions,
            'video_diagnosis': result.video_diagnosis,
            'output_requirement': '生成核心诊断、今日执行清单、7天监控计划',
        }


class AmazonAdsRuleEngine:
    """
    便捷包装器 - 符合 AnalysisWorker 的调用约定

    run_all_rules(df, report_type) → 返回 action dicts
    然后分别调用 get_* 获取专项结果
    """

    def __init__(self):
        self._engine = RuleEngine()
        self._last_actions = []
        self._last_negatives = []
        self._last_splits = []
        self._last_placements = []
        self._last_videos = []
        self._last_missing = []
        self._last_diagnosis = {}

    def run_all_rules(self, df: pd.DataFrame, report_type: str) -> List[Dict]:
        """运行全部规则，返回action dicts列表"""
        data = {report_type: df}
        self._engine.load_data(data)

        result = self._engine.run_all_rules()

        self._last_actions = [
            {
                'priority': f'P{a.priority}',
                'action_type': a.action_layer,
                'campaign_name': a.campaign_name,
                'ad_group_name': a.ad_group_name,
                'target_text': a.target_text,
                'action': a.suggested_action,
                'adjustment': a.adjustment_value,
                'reason': a.reason,
                'expected_impact': a.expected_impact,
                'risk_flag': a.risk_flag,
                'asin': a.asin,
                'shop': a.shop,
            }
            for a in result.rule_engine_actions
        ]
        self._last_negatives = result.negative_keywords
        self._last_splits = result.exact_split_candidates
        self._last_placements = result.placement_suggestions
        self._last_videos = result.video_diagnosis
        self._last_missing = result.missing_reports
        self._last_diagnosis = result.core_diagnosis

        return self._last_actions

    def get_negative_keywords(self, df: pd.DataFrame = None) -> List[Dict]:
        return self._last_negatives

    def get_exact_split_candidates(self, df: pd.DataFrame = None) -> List[Dict]:
        return self._last_splits

    def get_placement_suggestions(self, df: pd.DataFrame = None) -> List[Dict]:
        return self._last_placements

    def get_video_diagnosis(self, df: pd.DataFrame = None) -> List[Dict]:
        return self._last_videos

    def get_missing_reports(self) -> List[Dict]:
        return self._last_missing

    def get_core_diagnosis(self) -> Dict:
        return self._last_diagnosis

    def get_actions(self) -> List[Dict]:
        return self._last_actions
