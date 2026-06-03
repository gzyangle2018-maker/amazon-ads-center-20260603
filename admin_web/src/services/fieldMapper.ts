// ─── 字段映射器 v3 — 强中文匹配 + 派生字段计算 ───
import type { StandardAdRow, FieldMappingEntry } from '../types'

const FIELD_DICT: Record<string, string[]> = {
  date: ['日期','Date','date'],
  shop_name: ['店铺','Shop'],
  marketplace: ['站点','国家/地区','Marketplace','Country','零售商','国家'],
  currency: ['货币','Currency'],
  portfolio_name: ['广告组合名称','Portfolio Name','Portfolio','广告组合'],
  campaign_type: ['广告活动类型','Campaign Type'],
  ad_type: ['费用类型','Ad Type','广告类型'],
  campaign_name: ['广告活动名称','Campaign Name','Campaign','活动名称'],
  campaign_status: ['状态','Status','广告活动状态'],
  ad_group_name: ['广告组名称','Ad Group Name','Ad Group','广告组'],
  target_text: ['投放','Targeting','Keyword','关键词','目标词'],
  target_type: ['投放类型','Target Type'],
  search_term: ['客户搜索词','用户搜索词','Search Term','Customer Search Term','搜索词','搜索查询','Search Query'],
  match_type: ['匹配类型','Match Type'],
  placement: ['广告位','Placement'],
  bid: ['出价','Bid','默认竞价'],
  budget: ['预算','Budget','每日预算'],
  bidding_strategy: ['竞价策略','Bidding Strategy'],
  impressions: ['展示量','曝光量','Impressions','展现量','曝光量：总数'],
  top_of_search_impression_share: ['搜索结果首页首位展示量份额','Top of Search Impression Share'],
  viewable_impressions: ['可查看的展现量','Viewable Impressions','可见展示次数'],
  clicks: ['点击量','Clicks','点击','点击量：总数'],
  ctr: ['点击率 (CTR)','点击率','CTR','Click Through Rate'],
  cpc: ['单次点击成本 (CPC)','CPC均价','CPC','Cost Per Click','每次点击成本','去年每次点击成本'],
  spend: ['花费','Spend','支出','成本','广告花费','去年支出'],
  orders: ['7天总订单数(#)','14天总订单数(#)','订单数','Orders','直接订单数','购买量：总数','已订购商品数量'],
  direct_orders: ['直接订单数','Direct Orders'],
  indirect_orders: ['间接订单数','Indirect Orders'],
  units: ['7天总销售量(#)','14天总销售量(#)','销售量','Units','已售商品数量','销量','已发货商品数量'],
  sales: ['7天总销售额','14天总销售额','销售额','Sales','7天内总销售额','14天内总销售额','已订购商品销售额','已发货商品销售额'],
  acos: ['广告投入产出比 (ACOS) 总计','ACOS','acos','ACoS','Acos','广告销售成本'],
  roas: ['总广告投资回报率 (ROAS)','ROAS','roas','广告支出回报率'],
  cvr: ['7天的转化率','14天的转化率','转化率','订单转化率CVR','CVR','Conversion Rate','转化率 - 总计','商品会话百分比'],
  cpa: ['CPA','cpa'],
  sessions: ['会话数 - 总计','会话 - 总计','Sessions','会话数','会话'],
  page_views: ['页面浏览量 - 总计','页面浏览量','Page Views','页面浏览'],
  unit_session_pct: ['商品会话百分比','Unit Session %'],
  buy_box_pct: ['推荐报价（推荐报价展示位）百分比','Buy Box %'],
  refund_units: ['已退款的商品数量','Refund Units'],
  refund_rate: ['退款率','Refund Rate'],
  b2b_sessions: ['会话 - 总计 - B2B','B2B Sessions'],
  b2b_orders: ['已订购商品数量 - B2B','订单商品总数 - B2B','B2B Orders'],
  b2b_sales: ['已订购商品销售额 - B2B','B2B Sales'],
  new_to_brand_orders: ['品牌新买家订单数','New-to-Brand Orders','14天内"品牌新买家"订单数量(#)','新买家订单数'],
  new_to_brand_sales: ['品牌新买家销售额','New-to-Brand Sales','14天内"品牌新买家"销售额','新买家销售额'],
  vtr: ['显示到达率 (VTR)','VTR'],
  vctr: ['浏览量点击率 (vCTR)','vCTR'],
  video_25: ['第一四分位视频观看次数','Video 25%','视频播放完成25%次数'],
  video_50: ['中点视频观看次数','Video 50%','视频播放完成50%次数'],
  video_75: ['第三四分位视频观看次数','Video 75%','视频播放完成75%次数'],
  video_100: ['完整视频观看次数','Video 100%','视频播放完成100%次数'],
  video_5s: ['5 秒观看次数','Video 5s','视频完成5秒播放次数'],
  video_unmute: ['视频取消静音','Video Unmute','视频取消静音数'],
  dpv: ['14 天商品详情页浏览量 (DPV)','DPV'],
  atc: ['14 天 ATC','ATC','购物车加入：总数'],
  brand_searches: ['14 天内品牌搜索量','Brand Searches'],
  parent_asin: ['（父）ASIN','(父) ASIN','Parent ASIN'],
  child_asin: ['（子）ASIN','(子) ASIN','Child ASIN'],
  asin: ['ASIN','商品ASIN','产品ASIN','商品'],
  title: ['标题','Title','商品标题','商品名称'],
}

const FLAT: Record<string, string> = {}
for (const [std, aliases] of Object.entries(FIELD_DICT)) {
  for (const a of aliases) FLAT[a.replace(/\s+/g,'').toLowerCase()] = std
}

function normalize(s: string): string {
  return s.replace(/\s+/g,'').replace(/（/g,'(').replace(/）/g,')').replace(/！/g,'!').toLowerCase()
}

export function mapField(sourceName: string): { standardField: string; confidence: number } {
  const n = normalize(sourceName.trim())
  // 1. Exact normalized
  if (FLAT[n]) return { standardField: FLAT[n], confidence: 1.0 }
  // 2. Remove parenthetical content
  const noParen = n.replace(/\([^)]*\)/g,'').trim()
  if (noParen !== n && FLAT[noParen]) return { standardField: FLAT[noParen], confidence: 0.95 }
  // 3. Contains match (alias in source or source in alias)
  let best = '', bestConf = 0
  for (const [alias, std] of Object.entries(FLAT)) {
    if (n.includes(alias) || alias.includes(n)) {
      const conf = Math.max(alias.length / Math.max(n.length, alias.length), 0.70)
      if (conf > bestConf) { best = std; bestConf = conf }
    }
  }
  if (best) return { standardField: best, confidence: Math.round(bestConf * 100) / 100 }
  return { standardField: '', confidence: 0 }
}

export function mapAllFields(columns: string[]): FieldMappingEntry[] {
  return columns.map(col => {
    const { standardField, confidence } = mapField(String(col))
    return {
      source_file: '', sheet_name: '',
      originalField: String(col),
      standardField: standardField || '未识别',
      confidence,
      inCalculation: confidence >= 0.70,
      note: confidence >= 0.95 ? '精确匹配' : confidence >= 0.70 ? '模糊匹配' : '需人工确认',
    }
  })
}

export function cleanAmount(v: any): number {
  if (v === null || v === undefined || v === '') return 0
  if (typeof v === 'number') return isNaN(v) ? 0 : v
  let s = String(v).trim()
  s = s.replace(/^[A-Za-z]{0,3}[\$￥€£¥]\s*/, '')
  if (s.includes(',') && s.includes('.')) {
    const ld = s.lastIndexOf('.'), lc = s.lastIndexOf(',')
    if (lc > ld) s = s.replace(/\./g,'').replace(',','.')
    else s = s.replace(/,/g,'')
  } else if (s.includes(',')) {
    if (s.split(',').length === 2 && s.split(',')[1].length <= 2) s = s.replace(',','.')
    else s = s.replace(/,/g,'')
  }
  const n = parseFloat(s)
  return isNaN(n) ? 0 : n
}

export function cleanPercent(v: any): number {
  if (v === null || v === undefined || v === '') return 0
  if (typeof v === 'number') return Math.abs(v) > 1 ? v / 100 : v
  const n = parseFloat(String(v).trim().replace('%',''))
  if (isNaN(n)) return 0
  return Math.abs(n) > 1 ? n / 100 : n
}

export function standardizeRow(raw: Record<string,any>, mapping: Record<string,string>): StandardAdRow {
  const row: any = { summary_row: false }

  for (const [origCol, stdField] of Object.entries(mapping)) {
    const val = raw[origCol]
    if (!stdField) continue
    if (['spend','sales','cpc','cpa','bid','budget','b2b_sales','new_to_brand_sales'].includes(stdField)) {
      row[stdField] = cleanAmount(val)
    } else if (['ctr','cvr','acos','roas','unit_session_pct','buy_box_pct','refund_rate','top_of_search_impression_share','vtr','vctr'].includes(stdField)) {
      const v = cleanPercent(val)
      row[stdField] = (stdField === 'acos' && v === 0) ? null : v
    } else if (['impressions','clicks','orders','direct_orders','indirect_orders','units','sessions','page_views','b2b_orders','b2b_sessions','refund_units','new_to_brand_orders','dpv','atc','brand_searches','video_25','video_50','video_75','video_100','video_5s','video_unmute','viewable_impressions'].includes(stdField)) {
      row[stdField] = Math.round(cleanAmount(val))
    } else {
      row[stdField] = (val === null || val === undefined) ? '' : String(val)
    }
  }

  // ─── Derived fields ───
  const imp = row.impressions || 0; const clk = row.clicks || 0
  const spd = row.spend || 0; const sls = row.sales || 0; const ord = row.orders || 0
  if (!row.ctr && imp > 0) row.ctr = clk / imp
  if (!row.cpc && clk > 0) row.cpc = spd / clk
  if (!row.cvr && clk > 0) row.cvr = ord / clk
  if ((row.acos === undefined || row.acos === null) && sls > 0) row.acos = spd / sls
  if (!row.roas && spd > 0) row.roas = sls / spd

  // Summary row detection
  if (String(row.shop_name||'').trim() === '总计') row.summary_row = true
  if (!String(row.search_term||'').trim() && !String(row.campaign_name||'').trim() && (spd > 0 || sls > 0)) row.summary_row = true

  return row as StandardAdRow
}
