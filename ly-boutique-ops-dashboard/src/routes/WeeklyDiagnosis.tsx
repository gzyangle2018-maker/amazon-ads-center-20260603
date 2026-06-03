import { useState } from 'react';
import { DataTable } from '@/components/common/DataTable';
import type { Column } from '@/components/common/DataTable';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { mockWeeklyPlans } from '@/data/mockWeeklyPlans';
import type { WeeklyPlan } from '@/types';
import { TrendingUp, TrendingDown, Send, ShieldAlert, Upload, FileText } from 'lucide-react';

export function WeeklyDiagnosis() {
  const [selected, setSelected] = useState<WeeklyPlan | null>(null);

  const columns: Column<WeeklyPlan>[] = [
    { key: 'grade', header: '等级', render: (r) => <span className={`chip text-xs font-bold ${r.grade === 'S' ? 'bg-accent-green/15 text-accent-green' : r.grade === 'A' ? 'bg-accent-blue/15 text-accent-blue' : 'bg-accent-yellow/15 text-accent-yellow'}`}>{r.grade}</span>, sortable: true },
    { key: 'productName', header: '产品', render: (r) => <span className="text-xs max-w-[140px] block truncate">{r.productName}</span> },
    { key: 'store', header: '店铺' },
    { key: 'ordersThisWeek', header: '本周销量', sortable: true },
    { key: 'ordersChange', header: '变化', render: (r) => (
      <span className={`text-xs font-semibold ${r.ordersChange >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
        {r.ordersChange >= 0 ? <TrendingUp size={12} className="inline mr-0.5" /> : <TrendingDown size={12} className="inline mr-0.5" />}
        {r.ordersChange >= 0 ? '+' : ''}{r.ordersChange}%
      </span>
    )},
    { key: 'tacos', header: 'TACOS', render: (r) => <span className={r.tacos > 25 ? 'text-accent-red font-semibold' : ''}>{r.tacos}%</span> },
    { key: 'acos', header: 'ACOS', render: (r) => <span className={r.acos > 40 ? 'text-accent-red font-semibold' : ''}>{r.acos}%</span> },
    { key: 'cvr', header: 'CVR', render: (r) => `${r.cvr}%` },
    { key: 'netProfit', header: '净利润', render: (r) => <span className={r.netProfit < 0 ? 'text-accent-red' : 'text-accent-green'}>${r.netProfit.toLocaleString()}</span> },
    { key: 'inventoryDays', header: '库存天数' },
    { key: 'coreProblem', header: '核心问题', render: (r) => <span className="text-xs max-w-[160px] block truncate text-accent-yellow">{r.coreProblem}</span> },
    { key: 'weeklyStrategy', header: '本周策略', render: (r) => <span className="text-xs max-w-[180px] block truncate">{r.weeklyStrategy}</span> },
    { key: 'status', header: '状态', render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">每周诊断</h1>
          <p className="text-sm text-text-secondary mt-1">
            深挖 P0/P1 重点 ASIN · 连接广告/Listing/作图/视频任务
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-xs flex items-center gap-1.5">
            <Send size={13} /> 分发本周任务
          </button>
          <button className="btn-primary text-xs flex items-center gap-1.5">
            <FileText size={13} /> 本周复盘总结
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="本周诊断ASIN" value={mockWeeklyPlans.length} sub="P0/P1重点" />
        <SummaryCard label="需广告调整" value={mockWeeklyPlans.filter((p) => p.adTask).length} sub="广告Agent分发" color="cyan" />
        <SummaryCard label="需素材更新" value={mockWeeklyPlans.filter((p) => p.imageTask || p.videoTask).length} sub="作图/视频Agent" color="purple" />
        <SummaryCard label="需库存处理" value={mockWeeklyPlans.filter((p) => p.inventoryTask).length} sub="库存Agent分发" color="yellow" />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={mockWeeklyPlans}
        searchPlaceholder="搜索 ASIN / 产品..."
        onRowClick={(row) => setSelected(row)}
      />

      {/* Detail panel */}
      {selected && (
        <div className="panel-card border-accent-cyan/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">
              {selected.productName} <span className="text-sm text-text-muted font-normal ml-2">{selected.asin}</span>
            </h2>
            <button onClick={() => setSelected(null)} className="text-text-muted hover:text-text-primary">✕</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DetailSection title="核心问题" content={selected.coreProblem} color="text-accent-red" />
            <DetailSection title="核心机会" content={selected.coreOpportunity} color="text-accent-green" />
            <DetailSection title="本周策略" content={selected.weeklyStrategy} color="text-accent-cyan" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {selected.adTask && <TaskCard label="广告任务" content={selected.adTask} icon={<Send size={14} />} />}
            {selected.listingTask && <TaskCard label="Listing任务" content={selected.listingTask} icon={<FileText size={14} />} />}
            {selected.imageTask && <TaskCard label="作图任务" content={selected.imageTask} icon={<Upload size={14} />} />}
            {selected.videoTask && <TaskCard label="视频任务" content={selected.videoTask} icon={<Upload size={14} />} />}
            {selected.inventoryTask && <TaskCard label="库存任务" content={selected.inventoryTask} icon={<ShieldAlert size={14} />} />}
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-white/8">
            <button className="btn-secondary text-xs flex items-center gap-1.5">
              <ShieldAlert size={13} /> 人工审批
            </button>
            <button className="btn-secondary text-xs flex items-center gap-1.5">
              <Upload size={13} /> 上传证据
            </button>
            <button className="btn-primary text-xs flex items-center gap-1.5">
              <Send size={13} /> 分发任务
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, sub, color }: { label: string; value: number; sub: string; color?: string }) {
  const colors: Record<string, string> = {
    cyan: 'border-accent-cyan/20',
    purple: 'border-accent-purple/20',
    yellow: 'border-accent-yellow/20',
  };
  return (
    <div className={`panel-card ${color ? colors[color] : ''}`}>
      <div className="text-xs text-text-muted mb-1">{label}</div>
      <div className="text-2xl font-bold text-text-primary">{value}</div>
      <div className="text-xs text-text-muted">{sub}</div>
    </div>
  );
}

function DetailSection({ title, content, color }: { title: string; content: string; color: string }) {
  return (
    <div>
      <h3 className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${color}`}>{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{content}</p>
    </div>
  );
}

function TaskCard({ label, content, icon }: { label: string; content: string; icon: React.ReactNode }) {
  return (
    <div className="p-3 rounded-xl bg-white/5 border border-white/8">
      <div className="flex items-center gap-1.5 text-text-muted mb-1 text-xs">
        {icon}<span>{label}</span>
      </div>
      <p className="text-xs text-text-primary leading-relaxed">{content}</p>
    </div>
  );
}
