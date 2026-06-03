// ============================================================
// Amazon Ads Center v2.0 — 核心类型定义
// ============================================================

/** 标准广告数据行 */
export interface StandardAdRow {
  source_file: string
  sheet_name: string
  report_type: string
  date?: string; date_start?: string; date_end?: string
  shop_name?: string; marketplace?: string; currency?: string
  portfolio_name?: string; campaign_type?: string
  ad_type?: 'SP' | 'SB' | 'SD' | 'UNKNOWN'
  campaign_name?: string; campaign_status?: string
  ad_group_name?: string
  target_text?: string; target_type?: string
  search_term?: string; match_type?: string; placement?: string
  bid?: number; budget?: number; bidding_strategy?: string
  impressions?: number; top_of_search_impression_share?: number; viewable_impressions?: number
  clicks?: number; ctr?: number; spend?: number; cpc?: number
  orders?: number; direct_orders?: number; indirect_orders?: number
  units?: number; sales?: number
  acos?: number | null; roas?: number | null; cvr?: number; cpa?: number
  sessions?: number; page_views?: number; unit_session_pct?: number; buy_box_pct?: number
  refund_units?: number; refund_rate?: number
  b2b_sessions?: number; b2b_orders?: number; b2b_sales?: number
  new_to_brand_orders?: number; new_to_brand_sales?: number
  vtr?: number; vctr?: number
  video_25?: number; video_50?: number; video_75?: number; video_100?: number
  video_5s?: number; video_unmute?: number
  dpv?: number; atc?: number; brand_searches?: number
  parent_asin?: string; child_asin?: string; asin?: string; title?: string
  summary_row?: boolean
  raw_json?: any
}

/** 报表识别结果 */
export interface ReportRecognition {
  filename: string; filepath?: string; fileType: string; fileSize: number
  sheets: SheetRecognition[]
  status: 'pending' | 'parsed' | 'error'; error?: string
}

export interface SheetRecognition {
  sheetName: string
  reportType: string
  confidence: number
  matchedReason: string
  rowCount: number
  asinCount: number
  campaignCount: number
  keywordCount: number
  dateStart?: string; dateEnd?: string
  columns: string[]
  status: 'recognized' | 'unrecognized'
}

/** 字段映射条目 */
export interface FieldMappingEntry {
  source_file: string; sheet_name: string
  originalField: string; standardField: string
  confidence: number; inCalculation: boolean; note: string
}

/** 规则引擎动作 */
export interface ActionItem {
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  operator?: string; shop?: string; marketplace?: string
  asin?: string; ad_type?: 'SP' | 'SB' | 'SD' | 'UNKNOWN'
  campaign_name?: string; ad_group_name?: string
  target_text?: string; search_term?: string
  action_layer: string; current_data: string; suggested_action: string
  before_value?: string; after_value?: string; adjustment_value?: string
  reason: string; expected_impact: string
  execute_time: string
  need_owner_confirm?: boolean; risk_flag?: string
}

/** ASIN总览 */
export interface AsinOverview {
  asin: string; parent_asin: string; title: string
  spend: number; sales: number; orders: number
  acos: number | null; tacos: number | null
  impressions: number; clicks: number; ctr: number; cvr: number; cpc: number
  sessions: number; page_views: number; unit_session_pct: number; buy_box_pct: number
  refundRate: number; b2b_orders: number; b2b_sales: number
  pagePriority: boolean; mainProblem: string; confidence: string
}

/** 流量结构树节点 */
export interface TrafficTreeNode {
  asin: string; wordLevel: string; targetText: string
  source: string; intentLevel: string
  impressions: number; clicks: number; spend: number
  orders: number; sales: number
  cpc: number; ctr: number; cvr: number; acos: number | null; roas: number
  abaRank: string; monthlySearchVolume: string; suggestion: string
}

/** 缺失数据 */
export interface MissingReport {
  operator: string; shop: string; marketplace: string
  asin: string; missingReport: string; affectedModule: string
  impact: string; isBlocking: boolean; fallback: string; requiredFile: string
}

/** 类目配置 */
export interface CategoryProfile {
  category_id: string; category_name: string
  target_acos: number; target_tacos: number; budget_cap_ratio: number
  core_intent_roots: string[]; attribute_intent_roots: string[]
  scenario_intent_roots: string[]; pain_value_roots: string[]
  brand_competitor_roots: string[]; b2b_roots: string[]
  negative_irrelevant_roots: string[]; high_relevance_roots: string[]
  asin_regex: string; naming_template: string
}

/** 解析任务上下文 */
export interface ParseTask {
  id: string
  createdAt: string
  operator: string; shop: string; marketplace: string
  categoryProfile: CategoryProfile
  files: ReportRecognition[]
  dataRows: StandardAdRow[]
  fieldMappings: FieldMappingEntry[]
  missingReports: MissingReport[]
  asinOverview: AsinOverview[]
  trafficTree: TrafficTreeNode[]
  actions: ActionItem[]
  todayTasks: TodayTask[]
  monitorPlan: MonitorPlanItem[]
  llmReport: string
}

/** 今日执行任务 */
export interface TodayTask {
  seq: number; priority: string
  operator: string; shop: string; marketplace: string
  asin: string; campaign_name: string; ad_group_name: string
  target_text: string; action: string; adjustment: string
  executor: string; status: '待执行' | '已执行' | '需确认' | '已驳回' | '已复盘'
  deadline: string; note: string
}

/** 监控计划 */
export interface MonitorPlanItem {
  goal: string; metric: string; threshold: string
  triggerAction: string; timeWindow: string; role: string; reviewDate: string
}

/** 分析结果汇总 */
export interface AnalysisSummary {
  totalTasks: number; totalFiles: number; totalRows: number
  totalAsins: number; totalActions: number; highPriorityActions: number
  missingCount: number; lastAnalysisTime: string
}
