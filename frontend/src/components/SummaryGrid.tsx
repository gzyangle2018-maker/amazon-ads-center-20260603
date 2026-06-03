import {
  DollarSign,
  Eye,
  MousePointerClick,
  ShoppingCart,
  Percent,
  TrendingUp,
} from 'lucide-react'
import { formatCurrency, formatNumber, formatPercent } from '../lib/utils'

interface SummaryGridProps {
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
}

export default function SummaryGrid({ summary }: SummaryGridProps) {
  const cards = [
    {
      title: '销售额',
      value: formatCurrency(summary.sales),
      subtitle: `ROAS: ${summary.roas.toFixed(2)}x`,
      icon: <ShoppingCart className="h-5 w-5 text-amazon-500" />,
      trend: 'up' as const,
      trendValue: '+12.5%',
    },
    {
      title: '广告花费',
      value: formatCurrency(summary.spend),
      subtitle: `ACoS: ${formatPercent(summary.acos)}`,
      icon: <DollarSign className="h-5 w-5 text-amazon-500" />,
      trend: 'up' as const,
      trendValue: '+5.2%',
    },
    {
      title: '展示量',
      value: formatNumber(summary.impressions),
      subtitle: `CTR: ${formatPercent(summary.ctr)}`,
      icon: <Eye className="h-5 w-5 text-amazon-500" />,
      trend: 'up' as const,
      trendValue: '+8.3%',
    },
    {
      title: '点击量',
      value: formatNumber(summary.clicks),
      subtitle: `CPC: ${formatCurrency(summary.cpc)}`,
      icon: <MousePointerClick className="h-5 w-5 text-amazon-500" />,
      trend: 'down' as const,
      trendValue: '-3.1%',
    },
    {
      title: 'ACoS',
      value: formatPercent(summary.acos),
      subtitle: '广告销售成本比',
      icon: <Percent className="h-5 w-5 text-amazon-500" />,
      trend: 'down' as const,
      trendValue: '-2.1%',
    },
    {
      title: 'ROAS',
      value: `${summary.roas.toFixed(2)}x`,
      subtitle: '广告支出回报率',
      icon: <TrendingUp className="h-5 w-5 text-amazon-500" />,
      trend: 'up' as const,
      trendValue: '+0.8x',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1.5 min-w-0">
              <p className="text-xs font-medium text-gray-500 truncate">{card.title}</p>
              <p className="text-lg font-bold tracking-tight text-gray-900 truncate">
                {card.value}
              </p>
              <p className="text-xs text-gray-400 truncate">{card.subtitle}</p>
            </div>
            <div className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amazon-50">
              {card.icon}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <span
              className={`text-xs font-semibold ${
                card.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {card.trend === 'up' ? '↑' : '↓'} {card.trendValue}
            </span>
            <span className="text-xs text-gray-400">vs 上周</span>
          </div>
        </div>
      ))}
    </div>
  )
}
