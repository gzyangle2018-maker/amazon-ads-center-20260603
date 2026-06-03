// ─── User & Roles ────────────────────────────────────────────

export type UserRole = 'admin' | 'operator' | 'assistant' | 'designer' | 'safety';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  stores: string[];       // stores this user has access to
  asins: string[];        // specific ASINs (empty = all for admin)
  avatar?: string;
}

// ─── Product Grades & Status ─────────────────────────────────

export type AsinGrade = 'S' | 'A' | 'B' | 'C' | 'D';
export type AsinStatus = 'main_push' | 'stable' | 'watch' | 'reactivate' | 'clearance' | 'paused' | 'delist';

export const ASIN_STATUS_LABELS: Record<AsinStatus, string> = {
  main_push: '主推',
  stable: '稳定',
  watch: '观察',
  reactivate: '待激活',
  clearance: '清货',
  paused: '停投',
  delist: '下架',
};

// ─── Priority ─────────────────────────────────────────────────

export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

// ─── Task ─────────────────────────────────────────────────────

export type TaskStatus =
  | 'not_started'
  | 'in_progress'
  | 'pending_approval'
  | 'completed'
  | 'rework'
  | 'closed'
  | 'monitor_only';

export type TaskType =
  | 'ads'
  | 'listing'
  | 'image'
  | 'video'
  | 'inventory'
  | 'profit'
  | 'compliance'
  | 'safety'
  | 'reactivation'
  | 'launch'
  | 'data_fix'
  | 'structure_fix';

export type TaskSource = 'daily' | 'weekly' | 'monthly' | 'manual' | 'agent';

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: '未开始',
  in_progress: '进行中',
  pending_approval: '待审批',
  completed: '已完成',
  rework: '需返工',
  closed: '已关闭',
  monitor_only: '仅监控',
};

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  ads: '广告调整',
  listing: 'Listing优化',
  image: '主图优化',
  video: '视频制作',
  inventory: '库存处理',
  profit: '价格调整',
  compliance: '合规检查',
  safety: '店铺安全',
  reactivation: '二次激活',
  launch: '新品推广',
  data_fix: '数据补充',
  structure_fix: '广告结构整改',
};

export interface TaskEvidence {
  type: 'screenshot' | 'report' | 'doc_link' | 'github_link' | 'cf_link' | 'image_version' | 'video_version' | 'bulk_file' | 'listing_diff' | 'note';
  label: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface Task {
  id: string;
  source: TaskSource;
  store: string;
  site: string;
  asin: string;
  sku: string;
  taskType: TaskType;
  title: string;
  description: string;
  assignee: string;
  collaborators: string[];
  priority: Priority;
  deadline: string;
  status: TaskStatus;
  evidenceRequired: string;
  evidence: TaskEvidence[];
  aiAudit: string;
  humanNote: string;
  createdAt: string;
  completedAt: string | null;
}

// ─── Attribution ──────────────────────────────────────────────

export type AttributionConfidence = 'A' | 'B' | 'C' | 'D';

export interface AttributionResult {
  confidence: AttributionConfidence;
  reason: string;
  allowExecution: boolean;
  allowBulk: boolean;
  warning: string;
}

export interface AdAttributionRow {
  campaignId: string;
  campaignName: string;
  adGroupId: string;
  adGroupName: string;
  keywordId: string;
  targetingId: string;
  searchTerm: string;
  targetTerm: string;
  advertisedAsin: string;
  advertisedSku: string;
  mappedAsin: string;
  confidence: AttributionConfidence;
  basis: string;
  multiAsinMixed: boolean;
  executable: boolean;
  riskNote: string;
  suggestedFix: string;
}

// ─── Agent ────────────────────────────────────────────────────

export type AgentUseMode = 'official_link' | 'api' | 'hybrid' | 'disabled';
export type AgentCategory =
  | 'data_analysis'
  | 'ads'
  | 'listing'
  | 'image'
  | 'video'
  | 'inventory'
  | 'profit'
  | 'compliance'
  | 'safety'
  | 'reactivation'
  | 'launch';

export const AGENT_CATEGORY_LABELS: Record<AgentCategory, string> = {
  data_analysis: '数据分析',
  ads: '广告投流',
  listing: 'Listing转化',
  image: '作图',
  video: '视频',
  inventory: '库存',
  profit: '利润',
  compliance: '合规',
  safety: '店铺安全',
  reactivation: '老品二次激活',
  launch: '新品推广',
};

export interface Agent {
  id: string;
  name: string;
  category: AgentCategory;
  description: string;
  useMode: AgentUseMode;
  applicableData: string;
  output: string;
  enabled: boolean;
  owner: string;
  permissions: UserRole[];
  modelProvider: string;
  modelName: string;
  entryUrl: string;
}

// ─── Model Config ─────────────────────────────────────────────

export type ModelProvider =
  | 'datater'
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'deepseek'
  | 'qwen'
  | 'kimi'
  | 'glm'
  | 'custom';

export type ModelPurpose =
  | 'total_control'
  | 'ads_deep'
  | 'listing_writing'
  | 'image_prompt'
  | 'video_script'
  | 'data_cleaning'
  | 'audit'
  | 'low_cost_batch';

export const MODEL_PROVIDER_LABELS: Record<ModelProvider, string> = {
  datater: 'Datater 中转',
  openai: 'OpenAI / GPT',
  anthropic: 'Anthropic / Claude',
  google: 'Google / Gemini',
  deepseek: 'DeepSeek',
  qwen: 'Qwen / 通义千问',
  kimi: 'Kimi / 月之暗面',
  glm: 'GLM / 智谱',
  custom: '自定义 API',
};

export interface ModelConfig {
  id: string;
  provider: ModelProvider;
  apiBaseUrl: string;
  apiKey: string;        // masked in UI
  modelName: string;
  enabled: boolean;
  purpose: ModelPurpose[];
  maxContext: number;
  priceLevel: 'low' | 'medium' | 'high';
  speedLevel: 'slow' | 'medium' | 'fast';
  stabilityLevel: 'low' | 'medium' | 'high';
  isDefault: boolean;
}

// ─── AI Router ────────────────────────────────────────────────

export interface AiRunRequest {
  agentId: string;
  modelProvider: string;
  modelName: string;
  taskType: string;
  inputFiles: string[];
  inputText: string;
  context: Record<string, unknown>;
  options: {
    temperature: number;
    maxTokens: number;
  };
}

export interface AiRunResponse {
  success: boolean;
  agentId: string;
  modelProvider: string;
  modelName: string;
  result: Record<string, unknown>;
  tasks: Task[];
  warnings: string[];
  cost: {
    tokens: number;
    estimatedUsd: number;
  };
  createdAt: string;
}

// ─── ASIN ─────────────────────────────────────────────────────

export interface AsinRecord {
  asin: string;
  sku: string;
  parentAsin: string;
  productName: string;
  productLine: string;
  store: string;
  site: string;
  owner: string;
  launchDate: string;
  grade: AsinGrade;
  status: AsinStatus;
  strategy: string;

  // metrics
  orders30d: number;
  sales30d: number;
  adSpend30d: number;
  adSales30d: number;
  acos: number;
  tacos: number;
  cvr: number;
  ctr: number;
  grossProfit: number;
  netProfit: number;
  netMargin: number;
  inventoryQty: number;
  inventoryDays: number;
  returnRate: number;
  negativeReviewRate: number;
}

// ─── Daily Scan ───────────────────────────────────────────────

export type DailyActionType =
  | 'negate_keyword'
  | 'lower_bid'
  | 'raise_bid'
  | 'add_budget'
  | 'reduce_budget'
  | 'add_exact'
  | 'add_phrase'
  | 'add_broad'
  | 'add_pat'
  | 'pause_keyword'
  | 'pause_campaign'
  | 'listing_optimize'
  | 'main_image'
  | 'aplus_optimize'
  | 'video_optimize'
  | 'inventory_alert'
  | 'clearance_watch'
  | 'reactivation_watch'
  | 'monitor_only'
  | 'structure_fix';

export const DAILY_ACTION_LABELS: Record<DailyActionType, string> = {
  negate_keyword: '广告否词',
  lower_bid: '降低竞价',
  raise_bid: '提高竞价',
  add_budget: '加预算',
  reduce_budget: '降预算',
  add_exact: '新增精准词',
  add_phrase: '新增词组词',
  add_broad: '新增宽泛词',
  add_pat: '新增PAT竞品投放',
  pause_keyword: '暂停关键词',
  pause_campaign: '暂停广告活动',
  listing_optimize: 'Listing优化',
  main_image: '主图优化',
  aplus_optimize: 'A+优化',
  video_optimize: '视频优化',
  inventory_alert: '库存预警',
  clearance_watch: '清货观察',
  reactivation_watch: '二次激活观察',
  monitor_only: '仅监控不执行',
  structure_fix: '广告结构整改',
};

export interface DailyIssue {
  id: string;
  date: string;
  store: string;
  operator: string;
  assistant: string;
  site: string;
  asin: string;
  sku: string;
  productName: string;
  problemType: string;
  anomalyMetric: string;
  currentValue: string;
  compareValue: string;
  changePct: string;
  cause: string;
  aiSuggestion: string;
  actionType: DailyActionType;
  bulkExecutable: boolean;
  needsApproval: boolean;
  attributionConfidence: AttributionConfidence;
  evidence: string;
  evidenceLink: string;
  dispatchAgent: string;
  deadline: string;
  assignee: string;
  status: TaskStatus;
  priority: Priority;
}

// ─── Weekly Diagnosis ─────────────────────────────────────────

export interface WeeklyPlan {
  id: string;
  period: string;
  store: string;
  asin: string;
  sku: string;
  productName: string;
  grade: AsinGrade;
  ordersThisWeek: number;
  ordersLastWeek: number;
  ordersChange: number;
  salesThisWeek: number;
  adSpend: number;
  adSales: number;
  acos: number;
  tacos: number;
  ctr: number;
  cvr: number;
  grossProfit: number;
  netProfit: number;
  inventoryDays: number;
  coreProblem: string;
  coreOpportunity: string;
  weeklyStrategy: string;
  adTask: string;
  listingTask: string;
  imageTask: string;
  videoTask: string;
  inventoryTask: string;
  assignee: string;
  deadline: string;
  evidenceRequired: string;
  status: TaskStatus;
}

// ─── Monthly Grading ──────────────────────────────────────────

export interface MonthlyGrade {
  id: string;
  month: string;
  store: string;
  operator: string;
  site: string;
  asin: string;
  sku: string;
  productName: string;
  productLine: string;
  monthlyOrders: number;
  monthlySales: number;
  monthlyAdSpend: number;
  monthlyAdSales: number;
  acos: number;
  tacos: number;
  grossProfit: number;
  netProfit: number;
  netMargin: number;
  inventoryQty: number;
  inventoryDays: number;
  returnRate: number;
  negativeReviewRate: number;
  cvr: number;
  ctr: number;
  grade: AsinGrade;
  gradeReason: string;
  nextMonthStrategy: string;
  reactivationCandidate: boolean;
  clearanceCandidate: boolean;
  continueAds: boolean;
  needListingOptimize: boolean;
  needImageOptimize: boolean;
  needVideoOptimize: boolean;
  assignee: string;
  nextMonthGoal: string;
}

// ─── Data Upload ──────────────────────────────────────────────

export type FileCategory =
  | 'erp_product'
  | 'erp_profit'
  | 'sp_search_term'
  | 'sp_targeting'
  | 'sp_campaign'
  | 'sp_advertised_product'
  | 'sb_search_term'
  | 'sb_campaign'
  | 'bulk_operation'
  | 'business_report'
  | 'inventory_report'
  | 'return_report'
  | 'negative_review'
  | 'other';

export const FILE_CATEGORY_LABELS: Record<FileCategory, string> = {
  erp_product: 'ERP产品分析',
  erp_profit: 'ERP利润报表',
  sp_search_term: 'SP搜索词报告',
  sp_targeting: 'SP投放报告',
  sp_campaign: 'SP广告活动报告',
  sp_advertised_product: 'SP广告商品报告',
  sb_search_term: 'SB搜索词报告',
  sb_campaign: 'SB广告活动报告',
  bulk_operation: 'Bulk Operation原始表',
  business_report: '业务报告',
  inventory_report: '库存报告',
  return_report: '退货报告',
  negative_review: '差评报告',
  other: '其他',
};

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  category: FileCategory;
  uploader: string;
  uploadedAt: string;
  store: string;
  site: string;
  period: string;
  purpose: string;
  previewData?: Record<string, string>[];
}

// ─── Dashboard KPI ────────────────────────────────────────────

export interface DashboardKpi {
  id: string;
  label: string;
  value: string;
  trend: string;
  trendUp: boolean | null;
  description: string;
  icon: string;
}

export interface TopIssue {
  id: string;
  priority: Priority;
  store: string;
  site: string;
  asin: string;
  sku: string;
  productName: string;
  assignee: string;
  problemType: string;
  affectedMetric: string;
  aiJudgment: string;
  suggestedAction: string;
  directlyExecutable: boolean;
  needsApproval: boolean;
  deadline: string;
  status: TaskStatus;
}

// ─── Permission ───────────────────────────────────────────────

export interface Permission {
  id: string;
  name: string;
  description: string;
  roles: UserRole[];
}

// ─── Navigation ───────────────────────────────────────────────

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  roles: UserRole[];
}
