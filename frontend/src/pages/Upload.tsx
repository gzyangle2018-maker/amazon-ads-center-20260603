import { useState, useCallback } from 'react'
import {
  UploadCloud,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Brain,
  Download,
  ChevronRight,
} from 'lucide-react'
import { runAnalysis, parseFileOnly, type AnalysisResult, type ParseResult } from '../services/api'
import { cn } from '../lib/utils'

type Stage = 'idle' | 'uploading' | 'parsing' | 'analyzing' | 'done' | 'error'

export default function Upload() {
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [stage, setStage] = useState<Stage>('idle')
  const [progress, setProgress] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [enableLLM, setEnableLLM] = useState(true)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) {
      const ext = f.name.split('.').pop()?.toLowerCase()
      if (ext === 'csv' || ext === 'xlsx' || ext === 'xls') {
        setFile(f)
        setError(null)
        setResult(null)
        setParseResult(null)
        setStage('idle')
      } else {
        setError('仅支持 CSV / XLSX / XLS 文件')
      }
    }
  }, [])

  const handleAnalyze = async () => {
    if (!file) return

    try {
      setStage('uploading')
      setProgress('正在上传文件...')

      // 先解析
      setStage('parsing')
      setProgress('正在解析文件，识别报表类型...')
      const parsed = await parseFileOnly(file)
      setParseResult(parsed)

      // 运行完整分析
      setStage('analyzing')
      setProgress('正在运行 12 层规则引擎分析...')

      const llmConfig = enableLLM
        ? {
            api_key: localStorage.getItem('llm_api_key') || '',
            api_base_url: localStorage.getItem('llm_api_base_url') || '',
            model: localStorage.getItem('llm_model') || 'deepseek-chat',
          }
        : undefined

      const analysisResult = await runAnalysis(file, enableLLM, llmConfig)
      setResult(analysisResult)
      setStage('done')
      setProgress('')
    } catch (err: any) {
      setError(err.message || '分析失败')
      setStage('error')
      setProgress('')
    }
  }

  const layerColors: Record<string, string> = {
    '否词/否ASIN层': 'bg-orange-100 text-orange-700',
    '预算调整层': 'bg-green-100 text-green-700',
    '竞价层': 'bg-blue-100 text-blue-700',
    '拆精准层': 'bg-purple-100 text-purple-700',
    '页面优先层': 'bg-pink-100 text-pink-700',
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">📊 数据上传 & 分析</h2>
        <p className="text-sm text-gray-500 mt-1">上传 Amazon 广告报表，一键生成分析报告</p>
      </div>

      {/* Upload zone */}
      {stage === 'idle' && (
        <div
          className={cn(
            'relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-colors',
            dragOver
              ? 'border-amazon-500 bg-amazon-50'
              : 'border-gray-300 bg-white hover:border-amazon-400 hover:bg-gray-50'
          )}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="text-center">
              <FileSpreadsheet className="mx-auto h-14 w-14 text-green-500" />
              <p className="mt-3 text-lg font-semibold text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / 1024).toFixed(1)} KB · {file.name.split('.').pop()?.toUpperCase()}
              </p>
              <div className="mt-6 flex items-center gap-4 justify-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableLLM}
                    onChange={(e) => setEnableLLM(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-amazon-500 focus:ring-amazon-500"
                  />
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Brain className="h-4 w-4" />
                    LLM 智能诊断
                  </span>
                </label>
                <button
                  onClick={handleAnalyze}
                  className="inline-flex items-center gap-2 rounded-lg bg-amazon-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-amazon-600 transition-colors"
                >
                  <Zap className="h-4 w-4" />
                  开始分析
                </button>
              </div>
              <button
                onClick={() => { setFile(null); setError(null) }}
                className="mt-2 text-xs text-gray-400 hover:text-gray-600"
              >
                移除文件
              </button>
            </div>
          ) : (
            <>
              <UploadCloud className="h-14 w-14 text-gray-300" />
              <p className="mt-4 text-lg font-semibold text-gray-700">
                拖拽 CSV / Excel 文件到此处
              </p>
              <p className="mt-1 text-sm text-gray-400">
                支持亚马逊后台报表、赛狐/优卖云/领星ERP导出
              </p>
              <label className="mt-6 cursor-pointer rounded-lg bg-gray-100 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">
                选择文件
                <input
                  type="file"
                  className="hidden"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) {
                      setFile(f)
                      setError(null)
                      setResult(null)
                      setParseResult(null)
                    }
                  }}
                />
              </label>
            </>
          )}
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>
      )}

      {/* Progress */}
      {(stage === 'uploading' || stage === 'parsing' || stage === 'analyzing') && (
        <div className="rounded-2xl border bg-white p-8 text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-amazon-500" />
          <p className="mt-4 text-lg font-semibold text-gray-900">
            {stage === 'uploading' && '上传中...'}
            {stage === 'parsing' && '解析报表数据...'}
            {stage === 'analyzing' && '规则引擎分析中...'}
          </p>
          <p className="mt-2 text-sm text-gray-500">{progress}</p>
        </div>
      )}

      {/* Parse result preview */}
      {parseResult && stage === 'analyzing' && (
        <div className="rounded-2xl border bg-white p-6">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            解析完成
          </h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{parseResult.recognized_sheets}</p>
              <p className="text-xs text-gray-500">识别 Sheet 数</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{parseResult.total_rows}</p>
              <p className="text-xs text-gray-500">总行数</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {Object.keys(parseResult.sheets).length}
              </p>
              <p className="text-xs text-gray-500">报表类型</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {Object.entries(parseResult.sheets).map(([name, info]) => (
              <div key={name} className="flex items-center justify-between rounded-lg border px-4 py-2 text-sm">
                <span className="font-medium text-gray-700">{name}</span>
                <span className="text-gray-500">
                  {info.report_type} · 置信度 {(info.confidence * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {stage === 'done' && result && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="rounded-2xl border bg-white p-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              分析完成 — {result.filename}
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: '总动作数', value: result.summary?.total_actions || 0, color: 'text-amazon-600' },
                { label: '否词候选', value: result.summary?.negative_keywords || 0, color: 'text-orange-600' },
                { label: '拆精准候选', value: result.summary?.exact_split_candidates || 0, color: 'text-purple-600' },
                { label: '广告位建议', value: result.summary?.placement_suggestions || 0, color: 'text-blue-600' },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-gray-50 p-3 text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
            {result.excel_path && (
              <a
                href={result.task_id ? `/api/analysis/${result.task_id}/excel` : '#'}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                下载 Excel 报告
              </a>
            )}
          </div>

          {/* Actions table */}
          {result.actions && result.actions.length > 0 && (
            <div className="rounded-2xl border bg-white overflow-hidden">
              <div className="border-b bg-gray-50 px-6 py-3">
                <h3 className="font-semibold text-gray-900">
                  12层动作表 ({result.actions.length} 条)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">优先级</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">动作层级</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">广告活动</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">目标词/ASIN</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">建议动作</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">原因</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-600">风险标记</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {result.actions.slice(0, 50).map((action, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2">
                          <span className={cn(
                            'inline-block rounded-full px-2 py-0.5 text-xs font-bold',
                            action.优先级 === 'P0' || action.优先级 === 1 ? 'bg-red-100 text-red-700' :
                            action.优先级 === 'P1' || action.优先级 === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-600'
                          )}>
                            {action.优先级}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <span className={cn(
                            'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                            layerColors[action.动作层级] || 'bg-gray-100 text-gray-600'
                          )}>
                            {action.动作层级}
                          </span>
                        </td>
                        <td className="px-4 py-2 font-medium text-gray-900 max-w-[200px] truncate" title={action.广告活动}>
                          {action.广告活动}
                        </td>
                        <td className="px-4 py-2 text-gray-600 max-w-[150px] truncate" title={action['目标词/ASIN']}>
                          {action['目标词/ASIN']}
                        </td>
                        <td className="px-4 py-2 text-gray-900 max-w-[250px] truncate" title={action.建议动作}>
                          {action.建议动作}
                        </td>
                        <td className="px-4 py-2 text-gray-500 text-xs max-w-[200px] truncate" title={action.原因}>
                          {action.原因}
                        </td>
                        <td className="px-4 py-2">
                          {action.风险标记 && (
                            <span className="text-xs text-amber-600">{action.风险标记}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tabs: Negative / Split / Placement / Video / LLM */}
          <ResultTabs result={result} />
        </div>
      )}

      {/* Error */}
      {stage === 'error' && (
        <div className="rounded-2xl border bg-red-50 p-8 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-red-400" />
          <p className="mt-4 text-lg font-semibold text-red-700">分析失败</p>
          <p className="mt-2 text-sm text-red-500">{error}</p>
          <button
            onClick={() => { setStage('idle'); setError(null) }}
            className="mt-4 text-sm text-red-600 underline hover:text-red-800"
          >
            重新上传
          </button>
        </div>
      )}

      {/* Reset button */}
      {stage === 'done' && (
        <button
          onClick={() => {
            setFile(null)
            setStage('idle')
            setResult(null)
            setParseResult(null)
            setError(null)
          }}
          className="text-sm text-gray-400 hover:text-gray-600 underline"
        >
          ← 上传新文件重新分析
        </button>
      )}
    </div>
  )
}

function ResultTabs({ result }: { result: AnalysisResult }) {
  const [tab, setTab] = useState<'negative' | 'split' | 'placement' | 'video' | 'llm'>('negative')

  const tabs = [
    { key: 'negative' as const, label: '否词清单', count: result.negative_keywords?.length || 0 },
    { key: 'split' as const, label: '拆精准', count: result.exact_split?.length || 0 },
    { key: 'placement' as const, label: '广告位', count: result.placement_suggestions?.length || 0 },
    { key: 'video' as const, label: '视频诊断', count: result.video_diagnosis?.length || 0 },
    { key: 'llm' as const, label: 'LLM诊断', count: 0 },
  ]

  const renderTab = () => {
    switch (tab) {
      case 'negative':
        return (
          <DataList
            data={result.negative_keywords || []}
            columns={['search_term', 'campaign_name', 'clicks', 'orders', 'spend', 'acos', 'neg_type', 'reason']}
            labels={{ search_term: '搜索词', campaign_name: '活动', clicks: '点击', orders: '订单', spend: '花费', acos: 'ACOS', neg_type: '否定类型', reason: '原因' }}
            empty="暂无否词候选"
          />
        )
      case 'split':
        return (
          <DataList
            data={result.exact_split || []}
            columns={['search_term', 'original_campaign', 'new_campaign', 'performance']}
            labels={{ search_term: '搜索词', original_campaign: '原活动', new_campaign: '新活动', performance: '当前表现' }}
            empty="暂无拆精准候选"
          />
        )
      case 'placement':
        return (
          <DataList
            data={result.placement_suggestions || []}
            columns={['placement', 'spend', 'sales', 'acos', 'suggestion']}
            labels={{ placement: '广告位', spend: '花费', sales: '销售', acos: 'ACOS', suggestion: '建议' }}
            empty="暂无广告位建议"
          />
        )
      case 'video':
        return (
          <DataList
            data={result.video_diagnosis || []}
            columns={['campaign_name', 'asin', 'issues']}
            labels={{ campaign_name: '活动', asin: 'ASIN', issues: '问题' }}
            empty="暂无视频诊断"
          />
        )
      case 'llm':
        return result.llm_report ? (
          <div className="prose prose-sm max-w-none p-4">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">{result.llm_report}</pre>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400">
            <Brain className="mx-auto h-8 w-8 mb-2" />
            <p>未启用 LLM 诊断或诊断结果为空</p>
            <p className="text-xs mt-1">在 LLM 设置中配置 API Key 以启用智能诊断</p>
          </div>
        )
    }
  }

  return (
    <div className="rounded-2xl border bg-white overflow-hidden">
      <div className="flex border-b overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors',
              tab === t.key
                ? 'border-b-2 border-amazon-500 text-amazon-600'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>
      {renderTab()}
    </div>
  )
}

function DataList({
  data,
  columns,
  labels,
  empty,
}: {
  data: Record<string, any>[]
  columns: string[]
  labels: Record<string, string>
  empty: string
}) {
  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400">
        <p>{empty}</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            {columns.map((col) => (
              <th key={col} className="px-4 py-2 text-left font-semibold text-gray-600">
                {labels[col] || col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.slice(0, 30).map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 transition-colors">
              {columns.map((col) => {
                const val = row[col]
                const displayVal = Array.isArray(val) ? val.join(', ') : String(val ?? '-')
                return (
                  <td key={col} className="px-4 py-2 text-gray-600 max-w-[200px] truncate" title={displayVal}>
                    {displayVal}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
