import { useState } from 'react';
import { DataTable } from '@/components/common/DataTable';
import type { Column } from '@/components/common/DataTable';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfidenceBadge } from '@/components/common/ConfidenceBadge';
import { mockDailyIssues } from '@/data/mockDailyIssues';
import type { DailyIssue } from '@/types';
import { DAILY_ACTION_LABELS } from '@/types';
import { FileText, Zap, Clock, Filter } from 'lucide-react';

export function DailyScan() {
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const filtered = filterPriority === 'all'
    ? mockDailyIssues
    : mockDailyIssues.filter((i) => i.priority === filterPriority);

  const columns: Column<DailyIssue>[] = [
    { key: 'priority', header: '优先级', render: (r) => <PriorityBadge priority={r.priority} />, sortable: true },
    { key: 'store', header: '店铺', sortable: true },
    { key: 'asin', header: 'ASIN', render: (r) => <span className="font-mono text-xs">{r.asin}</span> },
    { key: 'productName', header: '产品', render: (r) => <span className="text-xs max-w-[140px] block truncate">{r.productName}</span> },
    { key: 'assignee', header: '负责人' },
    { key: 'problemType', header: '问题类型', render: (r) => <span className="text-xs">{r.problemType}</span> },
    { key: 'anomalyMetric', header: '异常指标' },
    { key: 'currentValue', header: '当前值' },
    { key: 'compareValue', header: '对比值' },
    { key: 'cause', header: '原因', render: (r) => <span className="text-xs max-w-[160px] block truncate">{r.cause}</span> },
    { key: 'actionType', header: '动作类型', render: (r) => <span className="text-xs">{DAILY_ACTION_LABELS[r.actionType]}</span> },
    { key: 'attributionConfidence', header: '归属', render: (r) => <ConfidenceBadge confidence={r.attributionConfidence} /> },
    { key: 'bulkExecutable', header: 'Bulk', render: (r) => r.bulkExecutable ? <span className="text-accent-green text-xs">可批量</span> : <span className="text-text-muted text-xs">—</span> },
    { key: 'needsApproval', header: '审批', render: (r) => r.needsApproval ? <span className="text-accent-yellow text-xs font-semibold">需审批</span> : <span className="text-text-muted text-xs">—</span> },
    { key: 'deadline', header: '截止' },
    { key: 'status', header: '状态', render: (r) => <StatusBadge status={r.status} /> },
  ];

  const p0Count = mockDailyIssues.filter((i) => i.priority === 'P0').length;
  const p1Count = mockDailyIssues.filter((i) => i.priority === 'P1').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">每日扫描</h1>
        <p className="text-sm text-text-secondary mt-1">
          每日异常扫描和动作分发 · 只输出今天最应该处理的动作
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="panel-card">
          <div className="flex items-center gap-2 text-xs text-text-muted mb-1"><FileText size={14} />总计</div>
          <div className="text-2xl font-bold text-text-primary">{mockDailyIssues.length}</div>
          <div className="text-xs text-text-muted">今日异常</div>
        </div>
        <div className="panel-card border-accent-red/20">
          <div className="flex items-center gap-2 text-xs text-accent-red mb-1"><Zap size={14} />P0</div>
          <div className="text-2xl font-bold text-accent-red">{p0Count}</div>
          <div className="text-xs text-text-muted">紧急问题</div>
        </div>
        <div className="panel-card border-accent-orange/20">
          <div className="flex items-center gap-2 text-xs text-accent-orange mb-1"><Zap size={14} />P1</div>
          <div className="text-2xl font-bold text-accent-orange">{p1Count}</div>
          <div className="text-xs text-text-muted">高优先级</div>
        </div>
        <div className="panel-card">
          <div className="flex items-center gap-2 text-xs text-text-muted mb-1"><Clock size={14} />建议</div>
          <div className="text-2xl font-bold text-accent-cyan">5-10</div>
          <div className="text-xs text-text-muted">每运营每日关键动作</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter size={14} className="text-text-muted" />
        {(['all', 'P0', 'P1', 'P2', 'P3'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setFilterPriority(p)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
              filterPriority === p
                ? 'bg-accent-cyan/15 border-accent-cyan/40 text-accent-cyan font-semibold'
                : 'border-white/10 text-text-muted hover:text-text-primary'
            }`}
          >
            {p === 'all' ? '全部' : p}
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="搜索 ASIN / 产品 / 问题类型..."
      />
    </div>
  );
}
