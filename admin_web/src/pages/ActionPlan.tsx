import { useState, useEffect, useMemo } from 'react'
import type { ActionItem } from '../types'
import { runRuleEngine, generateTodayTasks } from '../services/ruleEngine'
import { getProfile } from '../services/intentClassifier'

export default function ActionPlan() {
  const [actions, setActions] = useState<ActionItem[]>([])
  const [diagnostics, setDiagnostics] = useState<string[]>([])
  const [filter, setFilter] = useState('')
  const [layerFilter, setLayerFilter] = useState('')

  useEffect(() => {
    const rows: any[] = (window as any).__adData || []
    if (rows.length === 0) {
      setDiagnostics(['未找到标准化数据。请先在「数据上传」页面上传文件并点击「开始解析」。'])
      return
    }
    const diag: string[] = [`标准化数据: ${rows.length} 行`]

    const reportTypes = [...new Set(rows.map((r: any) => r.report_type).filter(Boolean))]
    diag.push(`已识别报表: ${reportTypes.length} 种 (${reportTypes.join(', ')})`)

    const hasOrders = rows.some((r: any) => (r.orders || 0) > 0)
    const hasSpend = rows.some((r: any) => (r.spend || 0) > 0)
    const hasClicks = rows.some((r: any) => (r.clicks || 0) > 0)
    const hasSearchTerm = rows.some((r: any) => r.search_term)
    const hasCampaign = rows.some((r: any) => r.campaign_name)
    if (!hasOrders) diag.push('⚠ 数据中无订单字段 (orders=0)')
    if (!hasSpend) diag.push('⚠ 数据中无花费字段 (spend=0)')
    if (!hasClicks) diag.push('⚠ 数据中无点击字段 (clicks=0)')
    if (!hasSearchTerm) diag.push('⚠ 无搜索词数据 → 无法生成否词/竞价动作')
    if (!hasCampaign) diag.push('⚠ 无广告活动名称 → 无法生成预算/模式动作')

    const profile = getProfile('generic')
    const result = runRuleEngine(rows, profile, [], [])
    setActions(result.actions)
    diag.push(`规则引擎: 生成 ${result.actions.length} 条动作, ${result.missing.length} 条缺失报告`)
    if (result.actions.length === 0) {
      diag.push('原因: 规则条件未命中（可能所有ACOS正常、无高花费0订单词、或无Campaign级数据）')
    }
    setDiagnostics(diag)
    ;(window as any).__actions = result.actions
    ;(window as any).__todayTasks = generateTodayTasks(result.actions)
  }, [])

  const layers = useMemo(() => [...new Set(actions.map(a => a.action_layer))], [actions])
  const filtered = useMemo(() => actions.filter(a => {
    if (filter && !JSON.stringify(a).toLowerCase().includes(filter.toLowerCase())) return false
    if (layerFilter && a.action_layer !== layerFilter) return false
    return true
  }), [actions, filter, layerFilter])

  const priorityColors: Record<string, string> = { P0: 'bg-red-500/10 text-red-400', P1: 'bg-orange-500/10 text-orange-400', P2: 'bg-blue-500/10 text-blue-400', P3: 'bg-gray-500/10 text-gray-400' }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">12维度行动计划</h2>

      {/* Diagnostics when empty or always visible */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 space-y-1">
        {diagnostics.map((d, i) => (
          <p key={i} className={`text-xs ${d.startsWith('⚠') ? 'text-yellow-400' : d.startsWith('原因') ? 'text-orange-400' : 'text-gray-400'}`}>{d}</p>
        ))}
        {actions.length === 0 && (
          <button
            onClick={() => { const blob = new Blob([JSON.stringify({ diagnostics, sampleRows: ((window as any).__adData || []).slice(0, 5) }, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'debug_actions.json'; a.click() }}
            className="mt-2 text-xs text-orange-400 hover:text-orange-300 underline"
          >下载调试JSON</button>
        )}
      </div>

      {actions.length > 0 && (
        <>
          <div className="flex gap-3 flex-wrap">
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="搜索ASIN/活动/关键词..."
              className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white placeholder-gray-500 w-64 focus:border-orange-500 focus:outline-none" />
            <select value={layerFilter} onChange={e => setLayerFilter(e.target.value)}
              className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none">
              <option value="">全部层级 ({actions.length}条)</option>
              {layers.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <span className="self-center text-xs text-gray-500">筛选: {filtered.length} 条</span>
            <span className="self-center text-xs text-gray-600">P0:{actions.filter(a=>a.priority==='P0').length} P1:{actions.filter(a=>a.priority==='P1').length} P2:{actions.filter(a=>a.priority==='P2').length}</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-sm min-w-[1400px]">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900">
                  {['优先级','ASIN','广告活动','广告组','目标词','动作层级','建议动作','调整值','原因','执行时间','风险'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map((a, i) => (
                  <tr key={i} className="hover:bg-gray-900/50">
                    <td className="px-3 py-2 whitespace-nowrap"><span className={`text-xs px-1.5 py-0.5 rounded font-bold ${priorityColors[a.priority]}`}>{a.priority}</span></td>
                    <td className="px-3 py-2 text-gray-300 text-xs whitespace-nowrap">{a.asin || '-'}</td>
                    <td className="px-3 py-2 text-gray-300 text-xs whitespace-nowrap">{a.campaign_name || '-'}</td>
                    <td className="px-3 py-2 text-gray-300 text-xs whitespace-nowrap">{a.ad_group_name || '-'}</td>
                    <td className="px-3 py-2 text-gray-300 text-xs whitespace-nowrap">{a.target_text || a.search_term || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap"><span className="text-[10px] bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">{a.action_layer}</span></td>
                    <td className="px-3 py-2 text-white text-xs">{a.suggested_action}</td>
                    <td className="px-3 py-2 text-gray-300 text-xs whitespace-nowrap">{a.adjustment_value || '-'}</td>
                    <td className="px-3 py-2 text-gray-400 text-xs">{a.reason}</td>
                    <td className="px-3 py-2 text-gray-400 text-xs whitespace-nowrap">{a.execute_time}</td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap">{a.risk_flag ? <span className="text-red-400">⚠ {a.risk_flag}</span> : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
