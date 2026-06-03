import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts'
import SummaryGrid from '../components/SummaryGrid'
import { fetchDashboard, type DashboardData } from '../services/api'
import { formatCurrency, formatNumber } from '../lib/utils'
import { Loader2 } from 'lucide-react'

const COLORS = ['#FF9900', '#146EB4', '#232F3E', '#FFA726', '#66BB6A', '#AB47BC']

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboard()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amazon-500" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-medium">加载失败</p>
          <p className="text-sm text-gray-500 mt-1">{error || '未知错误'}</p>
        </div>
      </div>
    )
  }

  const campaignPieData = data.campaigns.slice(0, 6).map((c) => ({
    name: c.name,
    value: c.spent,
  }))

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">仪表盘</h2>
        <p className="text-sm text-gray-500 mt-1">Amazon 广告数据概览与分析</p>
      </div>

      {/* KPI Summary Grid */}
      <SummaryGrid summary={data.summary} />

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Spend & Sales trend */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-1">花费与销售趋势</h3>
          <p className="text-xs text-gray-500 mb-4">最近 30 天</p>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.dailyTrend}>
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF9900" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FF9900" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#146EB4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#146EB4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === 'spend' ? '花费' : '销售额',
                ]}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Area
                type="monotone"
                dataKey="spend"
                stroke="#FF9900"
                strokeWidth={2}
                fill="url(#spendGrad)"
                name="花费"
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#146EB4"
                strokeWidth={2}
                fill="url(#salesGrad)"
                name="销售额"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Campaign spend distribution */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-1">活动花费分布</h3>
          <p className="text-xs text-gray-500 mb-4">按广告活动</p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={campaignPieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {campaignPieData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Legend
                formatter={(value: string) => (
                  <span className="text-xs text-gray-600">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Impressions & Clicks trend */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-1">展示与点击趋势</h3>
          <p className="text-xs text-gray-500 mb-4">最近 30 天</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                tickFormatter={(v) => formatNumber(v)}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatNumber(value),
                  name === 'impressions' ? '展示量' : '点击量',
                ]}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Line
                type="monotone"
                dataKey="impressions"
                stroke="#FF9900"
                strokeWidth={2}
                dot={false}
                name="展示量"
              />
              <Line
                type="monotone"
                dataKey="clicks"
                stroke="#146EB4"
                strokeWidth={2}
                dot={false}
                name="点击量"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Quick campaign list */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-1">热门活动 TOP 5</h3>
          <p className="text-xs text-gray-500 mb-4">按销售额排序</p>
          <div className="space-y-3">
            {data.campaigns
              .sort((a, b) => b.sales - a.sales)
              .slice(0, 5)
              .map((campaign, idx) => (
                <div
                  key={campaign.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {campaign.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      ACoS {campaign.acos.toFixed(1)}% · ROAS {campaign.roas.toFixed(2)}x
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(campaign.sales)}
                    </p>
                    <p className="text-xs text-gray-400">
                      花费 {formatCurrency(campaign.spent)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
