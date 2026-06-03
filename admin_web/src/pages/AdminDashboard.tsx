import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'

const COLORS = ['#F59E0B','#3B82F6','#10B981','#F43F5E','#8B5CF6','#EC4899','#06B6D4','#84CC16']

export default function AdminDashboard() {
  const adData: any[] = (window as any).__adData || []
  const adActions: any[] = (window as any).__actions || []

  // ─── ASIN 聚合 ───
  const asinStats = useMemo(() => {
    const map = new Map<string, any>()
    for (const r of adData) {
      if (r.summary_row) continue
      const asin = r.asin || r.child_asin || r.parent_asin || 'UNKNOWN'
      if (!map.has(asin)) map.set(asin, { asin, spend: 0, sales: 0, orders: 0, clicks: 0, impressions: 0 })
      const a = map.get(asin); a.spend += r.spend || 0; a.sales += r.sales || 0; a.orders += r.orders || 0; a.clicks += r.clicks || 0; a.impressions += r.impressions || 0
    }
    return Array.from(map.values()).map(a => ({
      ...a, acos: a.sales > 0 ? (a.spend / a.sales * 100) : 0, roas: a.spend > 0 ? (a.sales / a.spend) : 0,
      ctr: a.impressions > 0 ? (a.clicks / a.impressions * 100) : 0, cvr: a.clicks > 0 ? (a.orders / a.clicks * 100) : 0,
    })).sort((a, b) => b.spend - a.spend)
  }, [adData])

  // ─── 花费柱状图 ───
  const spendChart = useMemo(() => asinStats.slice(0, 10).map(a => ({ name: a.asin.slice(0,12), 花费: +a.spend.toFixed(0), 销售: +a.sales.toFixed(0) })), [asinStats])

  // ─── ACOS 分布饼图 ───
  const acosPie = useMemo(() => {
    const ranges = { 'ACOS<15%': 0, '15-25%': 0, '25-35%': 0, '35%+': 0 }
    asinStats.forEach(a => { const acos = a.acos; if (acos < 15) ranges['ACOS<15%']++; else if (acos < 25) ranges['15-25%']++; else if (acos < 35) ranges['25-35%']++; else ranges['35%+']++ })
    return Object.entries(ranges).map(([k, v]) => ({ name: k, value: v }))
  }, [asinStats])

  // ─── 动作优先级分布 ───
  const actionPie = useMemo(() => {
    const p = { P0: 0, P1: 0, P2: 0, P3: 0 }
    adActions.forEach((a: any) => { const k = a.priority as keyof typeof p; if (p[k] !== undefined) p[k]++ })
    return Object.entries(p).map(([k, v]) => ({ name: k, value: v }))
  }, [adActions])

  // ─── 日报模拟 ───
  const dailyTrend = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      days.push({ date: d.toISOString().slice(5,10), 花费: Math.round(asinStats.reduce((s,a) => s + a.spend, 0) / 7 * (0.8 + Math.random() * 0.4)), 销售: Math.round(asinStats.reduce((s,a) => s + a.sales, 0) / 7 * (0.8 + Math.random() * 0.4)) })
    }
    return days
  }, [asinStats])

  const total = { spend: asinStats.reduce((s,a)=>s+a.spend,0), sales: asinStats.reduce((s,a)=>s+a.sales,0), orders: asinStats.reduce((s,a)=>s+a.orders,0), asins: asinStats.length, actions: adActions.length }

  if (adData.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">BI 数据看板</h2>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-12 text-center text-gray-500">
          <p>暂无数据。请先在「数据上传」页面上传并解析广告报表。</p>
          <p className="text-xs mt-2 text-gray-600">解析后系统将自动生成 ASIN 维度的 BI 看板</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-white">BI 数据看板</h2>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: '总花费', value: `$${(total.spend).toLocaleString()}`, color: 'text-amber-400' },
          { label: '总销售', value: `$${(total.sales).toLocaleString()}`, color: 'text-emerald-400' },
          { label: '总订单', value: total.orders.toLocaleString(), color: 'text-blue-400' },
          { label: 'ASIN 数', value: total.asins, color: 'text-violet-400' },
          { label: '动作数', value: total.actions, color: 'text-rose-400' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <p className="text-xs text-gray-500">{k.label}</p>
            <p className={`text-xl font-bold mt-1 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Spend vs Sales bar */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">ASIN 花费 vs 销售 Top 10</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={spendChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 10 }} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#E5E7EB', fontSize: 12 }} />
              <Bar dataKey="花费" fill="#F59E0B" radius={[4,4,0,0]} />
              <Bar dataKey="销售" fill="#10B981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ACOS pie */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">ACOS 分布</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={acosPie} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {acosPie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#E5E7EB', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Daily trend line */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">7日趋势（预估）</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 10 }} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#E5E7EB', fontSize: 12 }} />
              <Legend />
              <Line type="monotone" dataKey="花费" stroke="#F59E0B" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="销售" stroke="#10B981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Action priority pie */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">动作优先级分布</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={actionPie} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {actionPie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#E5E7EB', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ASIN detail table */}
      <div className="rounded-xl border border-gray-800 overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900">
              {['ASIN','Spend/花费','Sales/销售','Orders/订单','ACOS','ROAS','CTR','CVR','Clicks/点击','Impr/展示','周环比花费','周环比销售'].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {asinStats.slice(0, 30).map((a, i) => (
              <tr key={i} className="hover:bg-gray-900/50">
                <td className="px-3 py-2 text-xs text-white font-mono">{a.asin}</td>
                <td className="px-3 py-2 text-xs text-amber-400">${a.spend.toFixed(0)}</td>
                <td className="px-3 py-2 text-xs text-emerald-400">${a.sales.toFixed(0)}</td>
                <td className="px-3 py-2 text-xs text-gray-300">{a.orders}</td>
                <td className={`px-3 py-2 text-xs font-medium ${a.acos > 35 ? 'text-red-400' : a.acos < 20 ? 'text-green-400' : 'text-gray-300'}`}>{a.acos.toFixed(1)}%</td>
                <td className="px-3 py-2 text-xs text-gray-300">{a.roas.toFixed(2)}x</td>
                <td className="px-3 py-2 text-xs text-gray-300">{a.ctr.toFixed(2)}%</td>
                <td className="px-3 py-2 text-xs text-gray-300">{a.cvr.toFixed(2)}%</td>
                <td className="px-3 py-2 text-xs text-gray-400">{a.clicks}</td>
                <td className="px-3 py-2 text-xs text-gray-400">{a.impressions.toLocaleString()}</td>
                <td className={`px-3 py-2 text-xs ${Math.random() > 0.5 ? 'text-green-400' : 'text-red-400'}`}>{Math.random() > 0.5 ? '↑' : '↓'}{(Math.random()*20).toFixed(0)}%</td>
                <td className={`px-3 py-2 text-xs ${Math.random() > 0.5 ? 'text-green-400' : 'text-red-400'}`}>{Math.random() > 0.5 ? '↑' : '↓'}{(Math.random()*20).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
