const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export interface Campaign {
  id: string
  name: string
  status: 'enabled' | 'paused' | 'archived'
  budget: number
  spent: number
  impressions: number
  clicks: number
  orders: number
  sales: number
  acos: number
  roas: number
  startDate: string
  targeting: 'auto' | 'manual'
}

export interface DashboardData {
  summary: {
    impressions: number
    clicks: number
    spend: number
    sales: number
    acos: number
    roas: number
    ctr: number
    cpc: number
  }
  dailyTrend: Array<{
    date: string
    spend: number
    sales: number
    impressions: number
    clicks: number
  }>
  campaigns: Campaign[]
}

// ─── 分析相关类型 ───

export interface ParsedSheet {
  sheet_name: string
  report_type: string
  confidence: number
  row_count: number
}

export interface ActionItem {
  优先级: string
  运营: string
  店铺: string
  ASIN: string
  广告类型: string
  广告活动: string
  广告组: string
  '目标词/ASIN': string
  动作层级: string
  当前数据: string
  建议动作: string
  调整前: string
  调整后: string
  调整值: string
  原因: string
  预期影响: string
  执行时间: string
  风险标记: string
}

export interface AnalysisResult {
  success: boolean
  task_id?: number
  summary?: {
    total_actions: number
    negative_keywords: number
    exact_split_candidates: number
    placement_suggestions: number
    video_diagnosis: number
    asin_count: number
  }
  filename?: string
  parsed_sheets?: ParsedSheet[]
  unrecognized_sheets?: Array<{ sheet_name: string; columns: string[]; row_count: number }>
  actions?: ActionItem[]
  negative_keywords?: Array<Record<string, any>>
  exact_split?: Array<Record<string, any>>
  placement_suggestions?: Array<Record<string, any>>
  video_diagnosis?: Array<Record<string, any>>
  today_tasks?: Array<Record<string, any>>
  monitor_plan?: Array<Record<string, any>>
  asin_overview?: Array<Record<string, any>>
  llm_report?: string
  excel_path?: string
  error?: string
  stage?: string
}

export interface LLMPreset {
  model: string
  name: string
  provider: string
  base_url: string
}

export interface ParseResult {
  filename: string
  recognized_sheets: number
  total_rows: number
  sheets: Record<string, { report_type: string; confidence: number; reason: string; row_count: number; columns: string[] }>
  unrecognized_sheets: Array<{ sheet_name: string; columns: string[]; row_count: number }>
}

// ─── API 函数 ───

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch(`${API_BASE}/api/dashboard`)
  if (!res.ok) throw new Error('Failed to fetch dashboard')
  return res.json()
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  const res = await fetch(`${API_BASE}/api/campaigns`)
  if (!res.ok) throw new Error('Failed to fetch campaigns')
  return res.json()
}

export async function updateCampaignStatus(
  id: string,
  status: 'enabled' | 'paused' | 'archived'
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/campaigns/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error('Failed to update campaign')
}

// ─── 分析 API ───

export async function runAnalysis(
  file: File,
  llmEnabled: boolean = true,
  llmConfig?: { api_key: string; api_base_url?: string; model?: string }
): Promise<AnalysisResult> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('llm_enabled', String(llmEnabled))
  if (llmConfig) {
    formData.append('llm_config_json', JSON.stringify(llmConfig))
  }

  const res = await fetch(`${API_BASE}/api/analysis/run`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || '分析请求失败')
  }
  return res.json()
}

export async function parseFileOnly(file: File): Promise<ParseResult> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_BASE}/api/analysis/parse-only`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  })
  if (!res.ok) throw new Error('解析失败')
  return res.json()
}

export async function fetchLLMPresets(): Promise<LLMPreset[]> {
  const res = await fetch(`${API_BASE}/api/analysis/llm/presets`)
  if (!res.ok) throw new Error('获取模型预设失败')
  const data = await res.json()
  return data.presets || []
}

export async function fetchAnalysisList(): Promise<Array<{ id: number; task_name: string; status: string; created_at: string }>> {
  const res = await fetch(`${API_BASE}/api/analysis/`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('获取分析列表失败')
  return res.json()
}

export async function fetchAnalysisDetail(taskId: number): Promise<any> {
  const res = await fetch(`${API_BASE}/api/analysis/${taskId}`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('获取分析详情失败')
  return res.json()
}

export function getExcelDownloadUrl(taskId: number): string {
  return `${API_BASE}/api/analysis/${taskId}/excel`
}
