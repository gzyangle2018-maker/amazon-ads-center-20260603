import { useState, useEffect, useMemo } from 'react'

const tabs = ['上传数据源', '分析结果', '缺失数据', '执行动作追踪']

export default function AdminAudit() {
  const [tab, setTab] = useState(0)
  const [pushedTasks, setPushedTasks] = useState<any[]>([])

  // Load pushed tasks from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('pushed_tasks')
    if (stored) {
      try { setPushedTasks(JSON.parse(stored).tasks || []) } catch {}
    }
    // Also load from window globals
    const wTasks = (window as any).__todayTasks || []
    if (wTasks.length > 0 && pushedTasks.length === 0) setPushedTasks(wTasks)
  }, [])

  // Read data from window globals
  const adData = (window as any).__adData || []
  const adResults = (window as any).__adResults || []
  const adActions = (window as any).__actions || []
  const reportTypes: string[] = [...new Set(adData.map((r: any) => r.report_type).filter(Boolean))] as string[]

  const uploadData = useMemo(() => adResults.flatMap((r: any, i: number) =>
    r.sheets?.map((s: any) => ({
      '上传时间': new Date().toISOString().slice(0, 10),
      '运营': 'admin', '店铺': '-', '站点': '-', '类目': '通用类目',
      '文件名': r.filename, 'Sheet名': s.sheetName,
      '报表类型': s.reportType, '置信度': `${(s.confidence*100).toFixed(0)}%`,
      'ASIN数': s.asinCount || 0, '状态': s.status === 'recognized' ? '已解析' : '未识别',
    }))
  ) || [], [adResults])

  const analysisData = useMemo(() => {
    const asinMap = new Map<string, any>()
    for (const r of adData) {
      if (r.summary_row) continue
      const asin = r.asin || r.child_asin || r.parent_asin || 'UNKNOWN_ASIN'
      if (!asinMap.has(asin)) asinMap.set(asin, { asin, spend: 0, sales: 0, orders: 0 })
      const a = asinMap.get(asin); a.spend += r.spend || 0; a.sales += r.sales || 0; a.orders += r.orders || 0
    }
    return Array.from(asinMap.values()).map(a => ({
      '分析时间': new Date().toISOString().slice(0, 10), '运营': 'admin', '店铺': '-',
      '站点': '-', '类目': '通用类目', 'ASIN': a.asin,
      '主问题': '-', 'Spend': a.spend.toFixed(2), 'Sales': a.sales.toFixed(2),
      'Orders': a.orders, 'ACOS': a.sales > 0 ? `${((a.spend/a.sales)*100).toFixed(1)}%` : '-',
      '动作数': adActions.length, '可信度': '中',
    }))
  }, [adData, adActions])

  const missingData = useMemo(() => {
    const hasSearch = reportTypes.some(t => t.includes('Search_Term') || t.includes('ERP'))
    const hasPlacement = reportTypes.some(t => t.includes('Targeting') || t.includes('Placement'))
    const hasBusiness = reportTypes.some(t => t.includes('Business'))
    const hasAMC = reportTypes.includes('Audience_AMC_Report')
    const rows: any[] = []
    if (!hasSearch) rows.push({'运营':'-','店铺':'-','ASIN':'-','缺失报表':'搜索词报表','影响模块':'否词/拆组','是否阻断':'是','降级处理':'仅活动级','状态':'待补充'})
    if (!hasPlacement) rows.push({'运营':'-','店铺':'-','ASIN':'-','缺失报表':'Placement报表','影响模块':'广告位溢价','是否阻断':'否','降级处理':'方向性','状态':'待补充'})
    if (!hasBusiness) rows.push({'运营':'-','店铺':'-','ASIN':'-','缺失报表':'Business Reports','影响模块':'页面转化','是否阻断':'否','降级处理':'跳过','状态':'待补充'})
    if (!hasAMC) rows.push({'运营':'-','店铺':'-','ASIN':'-','缺失报表':'AMC报表','影响模块':'受众/AMC','是否阻断':'否','降级处理':'方向性','状态':'待补充'})
    return rows
  }, [reportTypes])

  const actionData = useMemo(() => pushedTasks.length > 0 ? pushedTasks.map((t: any) => ({
    '运营': 'admin', 'ASIN': t.asin || '-', '广告活动': t.campaign || t.campaign_name || '-',
    '广告组': t.adGroup || t.ad_group_name || '-', '目标词': t.target || t.target_text || '-',
    '建议动作': t.action || t.suggested_action || '-', '调整值': t.adjustment || '-',
    '优先级': t.priority || 'P2', '执行状态': t.status || '待执行',
  })) : adActions.filter((a: any) => a.priority === 'P0' || a.priority === 'P1').slice(0, 50).map((a: any) => ({
    '运营': 'admin', 'ASIN': a.asin || '-', '广告活动': a.campaign_name || '-',
    '广告组': a.ad_group_name || '-', '目标词': a.target_text || a.search_term || '-',
    '建议动作': a.suggested_action || '-', '调整值': a.adjustment_value || '-',
    '优先级': a.priority || 'P2', '执行状态': '待执行',
  })), [pushedTasks, adActions])

  const panels: Record<number, { cols: string[]; rows: any[] }> = {
    0: { cols: ['上传时间','运营','店铺','站点','类目','文件名','Sheet名','报表类型','置信度','ASIN数','状态'], rows: uploadData },
    1: { cols: ['分析时间','运营','店铺','站点','类目','ASIN','主问题','Spend','Sales','Orders','ACOS','动作数','可信度'], rows: analysisData },
    2: { cols: ['运营','店铺','ASIN','缺失报表','影响模块','是否阻断','降级处理','状态'], rows: missingData },
    3: { cols: ['运营','ASIN','广告活动','广告组','目标词','建议动作','调整值','优先级','执行状态'], rows: actionData },
  }

  const { cols, rows } = panels[tab]

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">管理员审计</h2>
      <div className="flex gap-1 border-b border-gray-800">
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === i ? 'border-orange-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}>{t}</button>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900">
              {cols.map(h => <th key={h} className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {rows.length === 0 ? (
              <tr><td colSpan={cols.length} className="px-4 py-12 text-center text-gray-500">
                {adData.length === 0 ? '暂无数据 — 请先在「数据上传」页面解析文件，数据将自动同步' : '暂无匹配数据'}
              </td></tr>
            ) : rows.map((r, i) => (
              <tr key={i} className="hover:bg-gray-900/50">
                {cols.map(c => <td key={c} className="px-3 py-2 text-gray-300 text-xs max-w-[200px] truncate">{r[c] ?? '-'}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
