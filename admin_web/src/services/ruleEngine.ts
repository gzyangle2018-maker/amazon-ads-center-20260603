import type {
  StandardAdRow, ActionItem, CategoryProfile,
  AsinOverview, TrafficTreeNode, MissingReport
} from '../types'
import { isHighRelevance } from './intentClassifier'

// ─── helpers ───
const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 }
const sortActions = (a: ActionItem[]) => a.sort((x, y) => priorityOrder[x.priority] - priorityOrder[y.priority])

function calcAcos(spend: number, sales: number): number | null {
  return sales > 0 ? spend / sales : null
}

// ─── main engine ───
export function runRuleEngine(
  rows: StandardAdRow[], profile: CategoryProfile,
  asinOverview: AsinOverview[], trafficTree: TrafficTreeNode[]
): { actions: ActionItem[]; missing: MissingReport[] } {
  const actions: ActionItem[] = []
  const missing: MissingReport[] = []

  // ═══ Detect available data sources ═══
  const nonSummary = rows.filter(r => !r.summary_row)
  const hasSearchTerms = nonSummary.some(r => r.search_term)
  const hasCampaign = nonSummary.some(r => r.campaign_name)
  const hasPlacement = nonSummary.some(r => r.placement || (r.top_of_search_impression_share ?? 0) > 0)
  const hasVideo = nonSummary.some(r => (r.video_5s ?? 0) > 0 || (r.vtr ?? 0) > 0)
  const hasB2B = nonSummary.some(r => (r.b2b_orders ?? 0) > 0 || (r.b2b_sales ?? 0) > 0)
  const hasBusiness = nonSummary.some(r => (r.sessions ?? 0) > 0 || (r.unit_session_pct ?? 0) > 0)

  // ═══ Missing data checks ═══
  if (!hasSearchTerms) missing.push({ operator:'',shop:'',marketplace:'',asin:'',missingReport:'搜索词报表',affectedModule:'否词/拆组/词级竞价',impact:'无法做关键词级优化',isBlocking:false,fallback:'仅做活动级分析',requiredFile:'SP/SB 搜索词报表' })
  if (!hasPlacement) missing.push({ operator:'',shop:'',marketplace:'',asin:'',missingReport:'Placement报表',affectedModule:'广告位溢价',impact:'无法输出完整广告位溢价建议',isBlocking:false,fallback:'仅参考搜索结果顶部展示份额',requiredFile:'Placement / 广告位报表' })
  if (!hasBusiness) missing.push({ operator:'',shop:'',marketplace:'',asin:'',missingReport:'Business Reports',affectedModule:'页面转化优先级',impact:'无法判断页面转化优先级',isBlocking:false,fallback:'跳过页面优先判断',requiredFile:'业务报告 (子体/父体)' })
  missing.push({ operator:'',shop:'',marketplace:'',asin:'',missingReport:'AMC人群表现数据',affectedModule:'受众/AMC',impact:'AMC建议仅方向性判断',isBlocking:false,fallback:'仅方向性建议',requiredFile:'Audience / AMC 报表' })

  // ═══ GROUP rows ═══
  // Campaign-level: aggregate spend/sales/orders per campaign
  type CampaignAgg = { campaign: string; adType: string; asin: string; spend: number; sales: number; orders: number; impressions: number; clicks: number; budget: number; biddingStrategy: string; rows: StandardAdRow[] }
  const campMap = new Map<string, CampaignAgg>()
  for (const r of nonSummary) {
    if (!r.campaign_name) continue
    const key = r.campaign_name
    if (!campMap.has(key)) {
      campMap.set(key, { campaign: key, adType: r.ad_type || 'SP', asin: r.asin || r.child_asin || '', spend: 0, sales: 0, orders: 0, impressions: 0, clicks: 0, budget: r.budget || 0, biddingStrategy: r.bidding_strategy || '', rows: [] })
    }
    const agg = campMap.get(key)!
    agg.spend += r.spend || 0
    agg.sales += r.sales || 0
    agg.orders += r.orders || 0
    agg.impressions += r.impressions || 0
    agg.clicks += r.clicks || 0
    if (!agg.budget && r.budget) agg.budget = r.budget
    if (!agg.biddingStrategy && r.bidding_strategy) agg.biddingStrategy = r.bidding_strategy
    if (!agg.asin) agg.asin = r.asin || r.child_asin || ''
    agg.rows.push(r)
  }

  // Ad group-level: used for avg CTR/CVR in exact-split
  type GroupAgg = { group: string; campaign: string; ctrTotal: number; cvrTotal: number; count: number; rows: StandardAdRow[] }
  const groupMap = new Map<string, GroupAgg>()
  for (const r of nonSummary) {
    if (!r.ad_group_name) continue
    const key = r.ad_group_name
    if (!groupMap.has(key)) groupMap.set(key, { group: key, campaign: r.campaign_name || '', ctrTotal: 0, cvrTotal: 0, count: 0, rows: [] })
    const g = groupMap.get(key)!
    g.ctrTotal += r.ctr || 0; g.cvrTotal += r.cvr || 0; g.count++
    g.rows.push(r)
  }

  // ═══ 1. 否词规则 (keyword-level) ═══
  const negated = new Set<string>()
  for (const r of nonSummary) {
    const term = r.search_term || r.target_text
    if (!term || negated.has(term)) continue
    const clicks = r.clicks || 0; const orders = r.orders || 0
    if (clicks >= 10 && orders === 0) {
      negated.add(term)
      const highRel = isHighRelevance(term, profile)
      const isASIN = new RegExp(profile.asin_regex).test(term)
      actions.push({
        priority: 'P1', asin: r.asin || r.child_asin, ad_type: (r.ad_type || 'SP') as any,
        campaign_name: r.campaign_name, ad_group_name: r.ad_group_name,
        target_text: term, search_term: term,
        action_layer: '否词/否ASIN层',
        current_data: `点击=${clicks}, 订单=0, 花费=$${(r.spend||0).toFixed(2)}`,
        suggested_action: isASIN ? `否定ASIN: ${term}` : `否定关键词: ${term}`,
        adjustment_value: isASIN ? 'Negative Product Targeting' : 'Negative Exact',
        reason: `点击≥10 且 0 订单${highRel ? '；⚠ 高相关核心词，需负责人确认' : ''}`,
        expected_impact: '减少无效花费',
        execute_time: '立即',
        need_owner_confirm: highRel || undefined,
        risk_flag: highRel ? '高相关核心词' : undefined,
      })
    }
  }

  // ═══ 2. 预算规则 (campaign-level, aggregated) ═══
  for (const [, agg] of campMap) {
    const acos = calcAcos(agg.spend, agg.sales)
    if (acos === null || !agg.budget) {
      if (!agg.budget) {
        actions.push({
          priority: 'P2', asin: agg.asin, ad_type: agg.adType as any,
          campaign_name: agg.campaign,
          action_layer: '预算调整层',
          current_data: `花费=$${agg.spend.toFixed(2)}, 销售=$${agg.sales.toFixed(2)}, ACOS=${acos !== null ? (acos*100).toFixed(1)+'%' : '无销售额'}`,
          suggested_action: '缺预算字段，无法计算调整后预算，仅给调整方向',
          reason: '缺少当前预算数据',
          expected_impact: '需补充预算后重新计算',
          execute_time: '补充数据后',
        })
      }
      continue
    }

    if (acos < profile.target_acos) {
      const multiplier = 2.0 // simplified: assume recent
      actions.push({
        priority: 'P1', asin: agg.asin, ad_type: agg.adType as any,
        campaign_name: agg.campaign,
        action_layer: '预算调整层',
        current_data: `ACOS=${(acos*100).toFixed(1)}% (目标<${(profile.target_acos*100).toFixed(0)}%), 预算=$${agg.budget.toFixed(2)}`,
        suggested_action: '增加预算',
        before_value: `$${agg.budget.toFixed(2)}`,
        after_value: `$${(agg.budget * multiplier).toFixed(2)}`,
        adjustment_value: `+${((multiplier-1)*100).toFixed(0)}%`,
        reason: `ACOS低于目标，可扩大投放`,
        expected_impact: '扩大有效投放量',
        execute_time: '立即',
      })
    }
    if (acos > 0.35) {
      actions.push({
        priority: 'P1', asin: agg.asin, ad_type: agg.adType as any,
        campaign_name: agg.campaign,
        action_layer: '预算调整层',
        current_data: `ACOS=${(acos*100).toFixed(1)}%, 预算=$${agg.budget.toFixed(2)}`,
        suggested_action: '减少预算',
        before_value: `$${agg.budget.toFixed(2)}`,
        after_value: `$${(agg.budget * 0.5).toFixed(2)}`,
        adjustment_value: '-50%',
        reason: 'ACOS > 35%，需控制花费',
        expected_impact: '降低无效支出',
        execute_time: '立即',
      })
    }
  }

  // ═══ 3. 预算模式规则 (campaign-level) ═══
  for (const [, agg] of campMap) {
    if (!agg.biddingStrategy) continue
    const acos = calcAcos(agg.spend, agg.sales)
    if (acos !== null && acos < 0.2 && /仅降低|只降低|动态竞价.*降低/.test(agg.biddingStrategy)) {
      actions.push({
        priority: 'P2', asin: agg.asin, ad_type: agg.adType as any,
        campaign_name: agg.campaign,
        action_layer: '预算调整层',
        current_data: `竞价策略=${agg.biddingStrategy}, ACOS=${(acos*100).toFixed(1)}%`,
        suggested_action: '切换为固定竞价',
        adjustment_value: '固定竞价',
        reason: '低ACOS活动需稳定吃量，只降低不利于扩量',
        expected_impact: '稳定获取流量',
        execute_time: '立即',
      })
    }
  }

  // ═══ 4. 竞价规则 (keyword-level) ═══
  for (const r of nonSummary) {
    const bid = r.bid ?? 0; if (bid === 0) continue
    const term = r.search_term || r.target_text; if (!term) continue
    const acos = calcAcos(r.spend || 0, r.sales || 0)
    if (acos === null) continue
    const clicks = r.clicks || 0
    if (clicks >= 10 && (r.orders || 0) === 0) continue // 优先否词

    let bidAdj = 0
    if (acos <= 0.10) bidAdj = 0.2
    else if (acos <= 0.20) bidAdj = 0.1
    else if (acos >= 0.40) bidAdj = -0.2
    else if (acos >= 0.30) bidAdj = -0.1
    if (bidAdj === 0) continue

    actions.push({
      priority: 'P2', asin: r.asin || r.child_asin, ad_type: (r.ad_type || 'SP') as any,
      campaign_name: r.campaign_name, ad_group_name: r.ad_group_name,
      target_text: term,
      action_layer: '竞价层',
      current_data: `ACOS=${(acos*100).toFixed(1)}%, 出价=$${bid.toFixed(2)}, 点击=${clicks}, 订单=${r.orders||0}`,
      suggested_action: bidAdj > 0 ? `出价 +$${bidAdj.toFixed(2)}` : `出价 -$${Math.abs(bidAdj).toFixed(2)}`,
      before_value: `$${bid.toFixed(2)}`,
      after_value: `$${(bid + bidAdj).toFixed(2)}`,
      adjustment_value: `${bidAdj > 0 ? '+' : ''}$${bidAdj.toFixed(2)}`,
      reason: `ACOS在${bidAdj > 0 ? '低' : '高'}区间`,
      expected_impact: bidAdj > 0 ? '争取更多曝光' : '控制成本',
      execute_time: '立即',
    })
  }

  // ═══ 5. 拆精准规则 (keyword vs group avg) ═══
  const splitDone = new Set<string>()
  for (const [, g] of groupMap) {
    if (g.count < 3) continue
    const avgCtr = g.ctrTotal / g.count
    const avgCvr = g.cvrTotal / g.count
    for (const r of g.rows) {
      const term = r.search_term || r.target_text; if (!term || splitDone.has(term)) continue
      const acos = calcAcos(r.spend || 0, r.sales || 0)
      const ctr = r.ctr || 0; const cvr = r.cvr || 0
      if ((r.orders || 0) > 0 && acos !== null && acos < profile.target_acos && ctr > avgCtr && cvr > avgCvr) {
        splitDone.add(term)
        const asin = r.asin || r.child_asin || 'ASIN'
        const safe = term.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '-').slice(0, 40)
        const newName = profile.naming_template
          .replace('{asin}', asin).replace('{ad_type}', r.ad_type || 'SP')
          .replace('{structure}', 'Exact-Harvest').replace('{intent}', safe).replace('{version}', 'V1')
        actions.push({
          priority: 'P0', asin, ad_type: (r.ad_type || 'SP') as any,
          campaign_name: r.campaign_name, ad_group_name: r.ad_group_name,
          target_text: term,
          action_layer: '拆精准层',
          current_data: `订单=${r.orders||0}, ACOS=${acos?((acos*100).toFixed(1)+'%'):'-'}, CTR>组均, CVR>组均`,
          suggested_action: `拆出精准组: ${newName}`,
          adjustment_value: newName,
          reason: '该词表现优于组均，建议独立精准投放',
          expected_impact: '精准收割高效词，同时原组否定避免互抢',
          execute_time: '本周内',
        })
      }
    }
  }

  // ═══ 6. 页面优先规则 (ASIN-level) ═══
  if (asinOverview.length > 0 && hasBusiness) {
    const avgUnitSess = asinOverview.reduce((s,a) => s + a.unit_session_pct, 0) / asinOverview.length
    const avgCvr = asinOverview.reduce((s,a) => s + a.cvr, 0) / asinOverview.length
    const avgRefund = asinOverview.reduce((s,a) => s + a.refundRate, 0) / asinOverview.length
    for (const a of asinOverview) {
      if (a.unit_session_pct < avgUnitSess * 0.7 ||
          (a.buy_box_pct > 0 && a.buy_box_pct < 0.9) ||
          a.refundRate > avgRefund * 1.5 ||
          a.cvr < avgCvr * 0.7) {
        actions.push({
          priority: 'P0', asin: a.asin,
          action_layer: '广泛/词组重构层',
          current_data: `UnitSess%: ${(a.unit_session_pct*100).toFixed(1)}%, BuyBox%: ${(a.buy_box_pct*100).toFixed(1)}%, 退款率: ${(a.refundRate*100).toFixed(1)}%`,
          suggested_action: '页面与报价优先，不做激进放量；广告只做防守性+精准收割',
          reason: '页面转化指标低于同批ASIN平均',
          expected_impact: '先优化Listing和报价再放量',
          execute_time: '优先处理',
        })
        break // one per ASIN
      }
    }
  }

  // ═══ 7. 广告位规则 (campaign-level) ═══
  if (hasPlacement) {
    for (const [, agg] of campMap) {
      const acos = calcAcos(agg.spend, agg.sales)
      const cvr = agg.clicks > 0 ? agg.orders / agg.clicks : 0
      if (acos !== null && acos < profile.target_acos && cvr > 0.05) {
        actions.push({
          priority: 'P2', asin: agg.asin, ad_type: agg.adType as any,
          campaign_name: agg.campaign,
          action_layer: '广告位溢价层',
          current_data: `ACOS=${(acos*100).toFixed(1)}%, CVR=${(cvr*100).toFixed(1)}%`,
          suggested_action: 'Top of Search 溢价 +20%',
          adjustment_value: '+20%',
          reason: '低ACOS高CVR，建议抢占搜索结果顶部位置',
          expected_impact: '提升搜索顶部曝光',
          execute_time: '立即',
        })
      }
    }
  }

  // ═══ 8. 企业购规则 ═══
  if (hasB2B) {
    missing.push({ operator:'',shop:'',marketplace:'',asin:'',missingReport:'Business Price / 阶梯价',affectedModule:'企业购溢价',impact:'企业购建议仅方向性判断',isBlocking:false,fallback:'仅方向性建议',requiredFile:'Business Price 设置或阶梯价表' })
    const b2bDone = new Set<string>()
    for (const r of nonSummary) {
      const term = (r.search_term || r.target_text || '').toLowerCase()
      if (!term || b2bDone.has(term)) continue
      if (profile.b2b_roots.some(b => term.includes(b.toLowerCase()))) {
        b2bDone.add(term)
        actions.push({
          priority: 'P2', asin: r.asin || r.child_asin, ad_type: (r.ad_type || 'SP') as any,
          campaign_name: r.campaign_name, ad_group_name: r.ad_group_name,
          target_text: r.search_term || r.target_text,
          action_layer: '企业购溢价层',
          current_data: `关键词: ${term}`,
          suggested_action: '企业购溢价 +20%',
          adjustment_value: '+20%',
          reason: '命中B2B词根；缺Business Price，建议保守+20%',
          expected_impact: '获取企业采购流量',
          execute_time: '立即',
        })
      }
    }
  }

  // ═══ 9. SBV视频规则 ═══
  if (hasVideo) {
    for (const r of nonSummary) {
      if (!r.video_5s || r.summary_row) continue
      const v5s = r.video_5s || 0; const v25 = r.video_25 || 0; const v50 = r.video_50 || 0
      const v75 = r.video_75 || 0; const v100 = r.video_100 || 0
      const vtr = r.vtr || 0; const vctr = r.vctr || 0; const imp = r.impressions || 0
      const issues: string[] = []
      if (imp > 0 && v5s / imp < 0.3) issues.push('5秒观看率低→前5秒钩子弱')
      if (v25 > 0 && v50 > 0 && v50 / v25 < 0.5) issues.push('25%→50%掉点大→卖点节奏弱')
      if (v75 > 0 && v100 / v75 < 0.3) issues.push('完播率低→视频过长或证据不足')
      if (vctr < 0.01) issues.push('vCTR低→标题/首帧痛点不足')
      if (issues.length === 0) continue

      const script = profile.pain_value_roots.slice(0,3).join('、') || profile.core_intent_roots.slice(0,2).join('+') || '品质之选'
      actions.push({
        priority: 'P2', asin: r.asin || r.child_asin, ad_type: (r.ad_type || 'SB') as any,
        campaign_name: r.campaign_name, ad_group_name: r.ad_group_name,
        action_layer: 'SBV视频优化层',
        current_data: issues.join('; '),
        suggested_action: `${issues.length}个视频问题；推荐前5秒脚本: "${script}"`,
        reason: '视频指标异常，影响转化',
        expected_impact: '提升视频广告效果',
        execute_time: '本周内',
      })
    }
  }

  return { actions: sortActions(actions), missing }
}

export function generateTodayTasks(actions: ActionItem[]): any[] {
  return actions
    .filter(a => a.priority === 'P0' || a.priority === 'P1')
    .map((a, i) => ({
      seq: i + 1, priority: a.priority,
      operator: a.operator || '', shop: a.shop || '', marketplace: a.marketplace || '',
      asin: a.asin || '', campaign_name: a.campaign_name || '', ad_group_name: a.ad_group_name || '',
      target_text: a.target_text || a.search_term || '',
      action: a.suggested_action, adjustment: a.adjustment_value || '',
      executor: '', status: '待执行' as const, deadline: a.execute_time, note: a.reason,
    }))
}
