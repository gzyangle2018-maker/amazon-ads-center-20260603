import { useEffect, useState, useMemo } from 'react'
import { Search, Filter, Loader2, Play, Pause, Archive } from 'lucide-react'
import {
  fetchCampaigns,
  updateCampaignStatus,
  type Campaign,
} from '../services/api'
import { formatCurrency, formatNumber, formatPercent, cn } from '../lib/utils'

const statusLabels: Record<Campaign['status'], { label: string; className: string }> = {
  enabled: { label: '投放中', className: 'bg-green-100 text-green-700' },
  paused: { label: '已暂停', className: 'bg-yellow-100 text-yellow-700' },
  archived: { label: '已归档', className: 'bg-gray-100 text-gray-500' },
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Campaign['status']>('all')
  const [sortKey, setSortKey] = useState<keyof Campaign>('sales')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchCampaigns()
      .then(setCampaigns)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleStatusChange = async (
    id: string,
    status: Campaign['status']
  ) => {
    try {
      await updateCampaignStatus(id, status)
      setCampaigns((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c))
      )
    } catch {
      alert('更新失败，请重试')
    }
  }

  const filtered = useMemo(() => {
    let result = [...campaigns]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter((c) => c.name.toLowerCase().includes(q))
    }

    if (statusFilter !== 'all') {
      result = result.filter((c) => c.status === statusFilter)
    }

    result.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'desc' ? bv - av : av - bv
      }
      return 0
    })

    return result
  }, [campaigns, search, statusFilter, sortKey, sortDir])

  const handleSort = (key: keyof Campaign) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amazon-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-medium">加载失败</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            广告活动
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            共 {filtered.length} 个活动
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索活动名称..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 pl-10 pr-4 py-2.5 text-sm focus:border-amazon-500 focus:outline-none focus:ring-1 focus:ring-amazon-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          {(['all', 'enabled', 'paused', 'archived'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                statusFilter === s
                  ? 'bg-amazon-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {s === 'all' ? '全部' : statusLabels[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: '总花费', value: formatCurrency(filtered.reduce((s, c) => s + c.spent, 0)) },
          { label: '总销售', value: formatCurrency(filtered.reduce((s, c) => s + c.sales, 0)) },
          { label: '平均 ACoS', value: formatPercent(filtered.length ? filtered.reduce((s, c) => s + c.acos, 0) / filtered.length : 0) },
          { label: '总订单', value: formatNumber(filtered.reduce((s, c) => s + c.orders, 0)) },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border bg-white p-4 text-center"
          >
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="text-lg font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                {[
                  { key: 'name', label: '活动名称', sortable: false },
                  { key: 'status', label: '状态', sortable: false },
                  { key: 'budget', label: '预算', sortable: true },
                  { key: 'spent', label: '花费', sortable: true },
                  { key: 'sales', label: '销售额', sortable: true },
                  { key: 'acos', label: 'ACoS', sortable: true },
                  { key: 'roas', label: 'ROAS', sortable: true },
                  { key: 'impressions', label: '展示', sortable: true },
                  { key: 'clicks', label: '点击', sortable: true },
                  { key: 'orders', label: '订单', sortable: true },
                ].map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-left font-semibold text-gray-600',
                      col.sortable && 'cursor-pointer select-none hover:text-gray-900'
                    )}
                    onClick={() => col.sortable && handleSort(col.key as keyof Campaign)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key && (
                        <span className="text-amazon-500">
                          {sortDir === 'desc' ? '↓' : '↑'}
                        </span>
                      )}
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-gray-400">
                    没有找到匹配的活动
                  </td>
                </tr>
              ) : (
                filtered.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {campaign.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {campaign.targeting === 'auto' ? '自动投放' : '手动投放'}
                          {' · '}
                          {campaign.startDate}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
                          statusLabels[campaign.status].className
                        )}
                      >
                        {statusLabels[campaign.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {formatCurrency(campaign.budget)}
                    </td>
                    <td className="px-4 py-3">
                      {formatCurrency(campaign.spent)}
                    </td>
                    <td className="px-4 py-3 font-medium text-green-700">
                      {formatCurrency(campaign.sales)}
                    </td>
                    <td className="px-4 py-3">
                      {formatPercent(campaign.acos)}
                    </td>
                    <td className="px-4 py-3">
                      {campaign.roas.toFixed(2)}x
                    </td>
                    <td className="px-4 py-3">
                      {formatNumber(campaign.impressions)}
                    </td>
                    <td className="px-4 py-3">
                      {formatNumber(campaign.clicks)}
                    </td>
                    <td className="px-4 py-3">
                      {formatNumber(campaign.orders)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {campaign.status !== 'enabled' && (
                          <button
                            onClick={() => handleStatusChange(campaign.id, 'enabled')}
                            className="rounded p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-600 transition-colors"
                            title="启用"
                          >
                            <Play className="h-4 w-4" />
                          </button>
                        )}
                        {campaign.status === 'enabled' && (
                          <button
                            onClick={() => handleStatusChange(campaign.id, 'paused')}
                            className="rounded p-1.5 text-gray-400 hover:bg-yellow-50 hover:text-yellow-600 transition-colors"
                            title="暂停"
                          >
                            <Pause className="h-4 w-4" />
                          </button>
                        )}
                        {campaign.status !== 'archived' && (
                          <button
                            onClick={() => handleStatusChange(campaign.id, 'archived')}
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                            title="归档"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
