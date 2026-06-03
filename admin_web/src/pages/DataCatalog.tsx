import { useState, useEffect, useMemo } from 'react'
import type { StandardAdRow } from '../types'
import { mapAllFields } from '../services/fieldMapper'
import { classifyWordLevel, getProfile } from '../services/intentClassifier'
import { SortableTable } from '../components/SortableTable'

// ─── helpers ───
function getAdData(): StandardAdRow[] { return (window as any).__adData || [] }
function getAdResults(): any[] { return (window as any).__adResults || [] }

// ══════════════════════════════════════════════
// 1. DataCatalog — 从 normalizedRows 统计
// ══════════════════════════════════════════════
export default function DataCatalog() {
  const results = useMemo(() => getAdResults(), [])
  const rows = useMemo(() => getAdData(), [])

  const data = useMemo(() => {
    if (results.length === 0 && rows.length === 0) return []
    // Build catalog from results + supplement with row counts
    const fileSheets = new Map<string, any[]>()
    for (const r of rows) {
      const key = `${r.source_file}|||${r.sheet_name}`
      if (!fileSheets.has(key)) fileSheets.set(key, [])
      fileSheets.get(key)!.push(r)
    }

    return results.flatMap((r, i) => {
      const fileRows = rows.filter(rr => rr.source_file === r.filename)
      return r.sheets.map((s: any, j: number) => {
        const sheetKey = `${r.filename}|||${s.sheetName}`
        const sr = fileSheets.get(sheetKey) || []
        const asins = new Set(sr.map(rr => rr.asin || rr.child_asin || rr.parent_asin).filter(Boolean))
        const campaigns = new Set(sr.map(rr => rr.campaign_name).filter(Boolean))
        const adGroups = new Set(sr.map(rr => rr.ad_group_name).filter(Boolean))
        const keywords = new Set(sr.map(rr => rr.search_term || rr.target_text).filter(Boolean))
        const asinTargets = sr.filter(rr => (rr.search_term || rr.target_text || '').match(/B0[A-Z0-9]{8}/)).length

        return {
          '批次': i + 1,
          '文件名': r.filename,
          'Sheet名': s.sheetName,
          '报表类型': s.reportType,
          '识别置信度': `${(s.confidence * 100).toFixed(0)}%`,
          '行数': sr.length || s.rowCount || 0,
          'ASIN数量': asins.size || 0,
          '活动数量': campaigns.size || 0,
          '广告组数量': adGroups.size || 0,
          '关键词数量': keywords.size || 0,
          'ASIN Target数量': asinTargets || 0,
          '状态': s.status === 'recognized' ? '已识别' : '未识别',
        }
      })
    })
  }, [results, rows])

  return <TablePage title="数据目录" columns={['批次', '文件名', 'Sheet名', '报表类型', '识别置信度', '行数', 'ASIN数量', '活动数量', '广告组数量', '关键词数量', 'ASIN Target数量', '状态']} data={data} empty="暂无数据，请先到「数据上传」页面上传并解析文件" />
}

// ══════════════════════════════════════════════
// 2. FieldMapping — 真实字段映射结果
// ══════════════════════════════════════════════
export function FieldMapping() {
  const results = useMemo(() => getAdResults(), [])

  const data = useMemo(() => {
    const rows: any[] = []
    for (const r of results) {
      for (const s of r.sheets || []) {
        const cols = s.columns || []
        if (cols.length === 0) continue
        const mappings = mapAllFields(cols)
        for (const m of mappings) {
          rows.push({
            '文件': r.filename,
            'Sheet': s.sheetName,
            '原始字段': m.originalField,
            '标准字段': m.standardField,
            '置信度': `${(m.confidence * 100).toFixed(0)}%`,
            '匹配方式': m.note,
            '是否参与计算': m.inCalculation ? '是' : '否',
          })
        }
      }
    }
    return rows
  }, [results])

  const mapped = data.filter(d => d['标准字段'] !== '未识别').length
  const total = data.length

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">字段识别</h2>
      {total > 0 && (
        <div className="flex gap-4 text-sm">
          <span className="text-green-400">已映射: {mapped}</span>
          <span className="text-red-400">未识别: {total - mapped}</span>
          <span className="text-gray-500">总计: {total} 列</span>
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900">
              {['文件', 'Sheet', '原始字段', '标准字段', '置信度', '匹配方式', '是否参与计算'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {data.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">暂无数据，请先解析文件</td></tr>
            ) : data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-900/50">
                <td className="px-4 py-2 text-gray-300 text-xs">{row['文件']}</td>
                <td className="px-4 py-2 text-gray-300 text-xs">{row['Sheet']}</td>
                <td className="px-4 py-2 text-gray-300 text-xs">{row['原始字段']}</td>
                <td className={`px-4 py-2 text-xs font-medium ${row['标准字段'] === '未识别' ? 'text-red-400' : 'text-green-400'}`}>{row['标准字段']}</td>
                <td className="px-4 py-2 text-gray-400 text-xs">{row['置信度']}</td>
                <td className="px-4 py-2 text-gray-500 text-xs">{row['匹配方式']}</td>
                <td className="px-4 py-2 text-gray-400 text-xs">{row['是否参与计算']}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-600">共 {total} 条字段映射记录</p>
    </div>
  )
}

// ══════════════════════════════════════════════
// 3. MissingCheck — 基于已识别报表动态判断
// ══════════════════════════════════════════════
export function MissingCheck() {
  const rows = useMemo(() => getAdData(), [])
  const reportTypes = useMemo(() => new Set(rows.map(r => r.report_type).filter(Boolean)), [rows])

  const hasSearchTerm = reportTypes.has('SP_Search_Term_Report') || reportTypes.has('SB_Search_Term_Report') || reportTypes.has('ERP_Search_Term_Summary_Report')
  const hasPlacement = reportTypes.has('SP_Targeting_Report') || reportTypes.has('SB_Keyword_Placement_Report') || rows.some(r => (r.top_of_search_impression_share ?? 0) > 0)
  const hasBusiness = reportTypes.has('Business_Report_Child') || reportTypes.has('Business_Report_Parent')
  const hasCampaign = reportTypes.has('SP_Campaign_Report') || reportTypes.has('SB_Campaign_Report')
  const hasAMC = reportTypes.has('Audience_AMC_Report')
  const hasVideo = rows.some(r => (r.video_5s ?? 0) > 0 || (r.video_25 ?? 0) > 0)

  const data = [
    { '缺失报表': '搜索词报表', '影响模块': '否词/拆组/词级竞价', '影响结论': hasSearchTerm ? '已覆盖' : '无法做关键词级优化', '是否阻断': hasSearchTerm ? '否' : '是', '降级处理': hasSearchTerm ? '-' : '仅做活动级分析' },
    { '缺失报表': 'Placement报表', '影响模块': '广告位溢价', '影响结论': hasPlacement ? '已覆盖' : '无法输出完整广告位溢价建议', '是否阻断': '否', '降级处理': hasPlacement ? '-' : '仅参考搜索结果顶部展示份额' },
    { '缺失报表': 'Business Reports', '影响模块': '页面转化优先级', '影响结论': hasBusiness ? '已覆盖' : '无法判断页面转化优先级', '是否阻断': '否', '降级处理': hasBusiness ? '-' : '跳过页面优先判断' },
    { '缺失报表': 'Campaign Summary', '影响模块': '活动级预算调整', '影响结论': hasCampaign ? '已覆盖' : '无法输出活动级预算调整', '是否阻断': '否', '降级处理': hasCampaign ? '-' : '仅关键词级建议' },
    { '缺失报表': 'Audience/AMC报表', '影响模块': '受众/AMC', '影响结论': hasAMC ? '已覆盖' : 'AMC建议仅方向性判断', '是否阻断': '否', '降级处理': hasAMC ? '-' : '仅方向性建议' },
    { '缺失报表': 'SBV视频数据', '影响模块': '视频优化', '影响结论': hasVideo ? '已覆盖' : '无法输出视频优化建议', '是否阻断': '否', '降级处理': hasVideo ? '-' : '跳过视频诊断' },
    { '缺失报表': 'Business Price/阶梯价', '影响模块': '企业购', '影响结论': '企业购建议只能方向性判断', '是否阻断': '否', '降级处理': '仅方向性建议' },
  ]

  return <TablePage title="缺失检查" columns={['缺失报表', '影响模块', '影响结论', '是否阻断', '降级处理']}
    data={data} empty="" highlight={['是否阻断']} />
}

// ══════════════════════════════════════════════
// 4. AsinOverview — 聚合 + UNKNOWN_ASIN 兜底
// ══════════════════════════════════════════════
export function AsinOverview() {
  const rows = useMemo(() => getAdData(), [])

  const data = useMemo(() => {
    const asinMap = new Map<string, any>()
    const unknownRows: any[] = []

    for (const r of rows) {
      if (r.summary_row) continue
      const asin = r.asin || r.child_asin || r.parent_asin ||
        ((r.campaign_name || r.target_text || r.search_term) ? 'UNKNOWN_ASIN' : null)
      if (!asin) continue

      if (!asinMap.has(asin)) {
        asinMap.set(asin, { asin, spend: 0, sales: 0, orders: 0, impressions: 0, clicks: 0, sessions: 0, page_views: 0, buy_box_pct: 0, refund_rate: 0 })
      }
      const a = asinMap.get(asin)
      a.spend += r.spend || 0
      a.sales += r.sales || 0
      a.orders += r.orders || 0
      a.impressions += r.impressions || 0
      a.clicks += r.clicks || 0
      a.sessions += r.sessions || 0
      a.page_views += r.page_views || 0
      if (r.buy_box_pct) a.buy_box_pct = r.buy_box_pct
      if (r.refund_rate) a.refund_rate = r.refund_rate
    }

    return Array.from(asinMap.values()).map(a => ({
      ASIN: a.asin,
      Spend: a.spend.toFixed(2),
      Sales: a.sales.toFixed(2),
      Orders: a.orders,
      ACOS: a.sales > 0 ? `${((a.spend / a.sales) * 100).toFixed(1)}%` : '-',
      Impressions: a.impressions,
      Clicks: a.clicks,
      CTR: a.impressions > 0 ? `${((a.clicks / a.impressions) * 100).toFixed(2)}%` : '-',
      CVR: a.clicks > 0 ? `${((a.orders / a.clicks) * 100).toFixed(2)}%` : '-',
      CPC: a.clicks > 0 ? (a.spend / a.clicks).toFixed(2) : '-',
      Sessions: a.sessions || '-',
      'BuyBox%': a.buy_box_pct ? `${(a.buy_box_pct * 100).toFixed(0)}%` : '-',
    }))
  }, [rows])

  return <TablePage title="ASIN总览" columns={['ASIN', 'Spend', 'Sales', 'Orders', 'ACOS', 'Impressions', 'Clicks', 'CTR', 'CVR', 'CPC', 'Sessions', 'BuyBox%']}
    data={data} empty="暂无标准化数据。请先在「数据上传」页面上传并解析文件" />
}

// ══════════════════════════════════════════════
// 5. TrafficTree — 搜索词/投放词 + 意图分类
// ══════════════════════════════════════════════
export function TrafficTree() {
  const rows = useMemo(() => getAdData(), [])
  const profile = useMemo(() => getProfile('generic'), [])

  const data = useMemo(() => {
    return rows
      .filter(r => (r.search_term || r.target_text) && !r.summary_row)
      .slice(0, 300)
      .map(r => {
        const term = r.search_term || r.target_text || ''
        return {
          ASIN: r.asin || r.child_asin || r.parent_asin || 'UNKNOWN_ASIN',
          '词层级': classifyWordLevel(term, profile),
          '目标词': term,
          '来源': r.report_type || '',
          '意图': classifyWordLevel(term, profile),
          Spend: (r.spend || 0).toFixed(2),
          Orders: r.orders || 0,
          Sales: (r.sales || 0).toFixed(2),
          Clicks: r.clicks || 0,
          Impressions: r.impressions || 0,
          ACOS: (r.sales||0) > 0 ? `${(((r.spend||0) / (r.sales||1)) * 100).toFixed(1)}%` : '-',
          ROAS: (r.spend||0) > 0 ? ((r.sales||0) / (r.spend||1)).toFixed(2) : '-',
          CTR: r.ctr ? `${(r.ctr * 100).toFixed(2)}%` : '-',
          CVR: r.cvr ? `${(r.cvr * 100).toFixed(2)}%` : '-',
        }
      })
  }, [rows, profile])

  return <SortableTable title="流量结构树" columns={['ASIN', '词层级', '目标词', '来源', '意图', 'Spend', 'Orders', 'Sales', 'Clicks', 'Impressions', 'ACOS', 'ROAS', 'CTR', 'CVR']}
    data={data} empty="暂无搜索词/投放数据。请上传搜索词报表或投放报表" />
}

// ══════════════════════════════════════════════
// Reusable table component
// ══════════════════════════════════════════════
function TablePage({ title, columns, data, empty, highlight }: { title: string; columns: string[]; data: any[]; empty: string; highlight?: string[] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <div className="overflow-hidden rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900">
              {columns.map(h => <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {data.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500">{empty}</td></tr>
            ) : data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-900/50">
                {columns.map(col => {
                  const val = row[col] ?? '-'
                  const isHighlight = highlight?.includes(col) && val === '是'
                  return (
                    <td key={col} className={`px-4 py-2 whitespace-nowrap max-w-[300px] truncate text-xs ${isHighlight ? 'text-red-400 font-semibold' : 'text-gray-300'}`}>
                      {val}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-gray-600">共 {data.length} 条记录</p>
    </div>
  )
}
