import { useState, useMemo } from 'react';
import { DataTable } from '@/components/common/DataTable';
import type { Column } from '@/components/common/DataTable';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { mockTasks } from '@/data/mockTasks';
import type { Task } from '@/types';
import { TASK_TYPE_LABELS } from '@/types';
import { ListTodo, CheckCircle, Clock, AlertTriangle, Filter, Upload } from 'lucide-react';

export function TaskCenter() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filtered = filterStatus === 'all'
    ? mockTasks
    : mockTasks.filter((t) => t.status === filterStatus);

  const columns: Column<Task>[] = [
    { key: 'priority', header: '优先级', render: (r) => <PriorityBadge priority={r.priority} /> },
    { key: 'status', header: '状态', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'title', header: '任务', render: (r) => <span className="text-xs max-w-[200px] block truncate font-medium">{r.title}</span> },
    { key: 'taskType', header: '类型', render: (r) => <span className="text-xs">{TASK_TYPE_LABELS[r.taskType]}</span> },
    { key: 'store', header: '店铺' },
    { key: 'asin', header: 'ASIN', render: (r) => <span className="font-mono text-xs">{r.asin}</span> },
    { key: 'assignee', header: '负责人' },
    { key: 'deadline', header: '截止', sortable: true },
    { key: 'source', header: '来源', render: (r) => {
      const labels: Record<string, string> = { daily: '每日', weekly: '每周', monthly: '每月', manual: '人工', agent: 'Agent' };
      return <span className="text-xs">{labels[r.source]}</span>;
    }},
    { key: 'evidence', header: '证据', render: (r) => r.evidence.length > 0 ? <CheckCircle size={14} className="text-accent-green" /> : <AlertTriangle size={14} className="text-accent-yellow" /> },
  ];

  const stats = useMemo(() => {
    const total = mockTasks.length;
    const completed = mockTasks.filter((t) => t.status === 'completed').length;
    const inProgress = mockTasks.filter((t) => t.status === 'in_progress').length;
    const overdue = mockTasks.filter((t) => t.status !== 'completed' && t.status !== 'closed' && new Date(t.deadline) < new Date()).length;
    const pendingApproval = mockTasks.filter((t) => t.status === 'pending_approval').length;
    return { total, completed, inProgress, overdue, pendingApproval };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">任务中心</h1>
          <p className="text-sm text-text-secondary mt-1">
            把 AI 建议变成团队可执行任务 · 每个任务必须有证据
          </p>
        </div>
        <button className="btn-primary text-xs flex items-center gap-1.5">
          <ListTodo size={13} /> 创建任务
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <TaskStatBox label="总任务" value={stats.total} icon={<ListTodo size={16} />} />
        <TaskStatBox label="已完成" value={stats.completed} icon={<CheckCircle size={16} />} color="text-accent-green" />
        <TaskStatBox label="进行中" value={stats.inProgress} icon={<Clock size={16} />} color="text-accent-blue" />
        <TaskStatBox label="逾期" value={stats.overdue} icon={<AlertTriangle size={16} />} color="text-accent-red" />
        <TaskStatBox label="待审批" value={stats.pendingApproval} icon={<AlertTriangle size={16} />} color="text-accent-yellow" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter size={14} className="text-text-muted" />
        {(['all', 'not_started', 'in_progress', 'pending_approval', 'completed', 'closed'] as const).map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
            filterStatus === s ? 'bg-accent-cyan/15 border-accent-cyan/40 text-accent-cyan font-semibold' : 'border-white/10 text-text-muted hover:text-text-primary'
          }`}>
            {s === 'all' ? '全部' : s === 'not_started' ? '未开始' : s === 'in_progress' ? '进行中' : s === 'pending_approval' ? '待审批' : s === 'completed' ? '已完成' : '已关闭'}
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="搜索任务标题 / ASIN / 负责人..."
        onRowClick={(row) => setSelectedTask(row)}
      />

      {/* Task detail */}
      {selectedTask && (
        <div className="panel-card border-accent-cyan/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <PriorityBadge priority={selectedTask.priority} />
                <StatusBadge status={selectedTask.status} />
                <span className="text-xs text-text-muted">{selectedTask.id}</span>
              </div>
              <h2 className="text-lg font-semibold text-text-primary">{selectedTask.title}</h2>
            </div>
            <button onClick={() => setSelectedTask(null)} className="text-text-muted hover:text-text-primary">✕</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-text-secondary leading-relaxed mb-3">{selectedTask.description}</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-text-muted">店铺/站点</span><span className="text-text-primary">{selectedTask.store} · {selectedTask.site}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">ASIN / SKU</span><span className="text-text-primary font-mono">{selectedTask.asin} / {selectedTask.sku}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">负责人</span><span className="text-text-primary">{selectedTask.assignee}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">截止时间</span><span className="text-text-primary">{selectedTask.deadline}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">证据要求</span><span className="text-text-primary">{selectedTask.evidenceRequired}</span></div>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">证据记录</h3>
              {selectedTask.evidence.length === 0 ? (
                <p className="text-xs text-accent-yellow flex items-center gap-1.5">
                  <AlertTriangle size={12} /> 缺证据 — 不能标记为完成
                </p>
              ) : (
                <div className="space-y-1.5">
                  {selectedTask.evidence.map((e, i) => (
                    <div key={i} className="text-xs p-2 rounded bg-white/5 border border-white/8">
                      <span className="text-text-primary">{e.label}</span>
                      <span className="text-text-muted ml-2">{e.uploadedAt}</span>
                    </div>
                  ))}
                </div>
              )}
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mt-4 mb-2">AI 审计</h3>
              <p className="text-xs text-text-secondary">{selectedTask.aiAudit || '未审计'}</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-white/8">
            <button className="btn-secondary text-xs flex items-center gap-1.5">
              <Upload size={13} /> 上传证据
            </button>
            <button className="btn-primary text-xs">确认完成</button>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskStatBox({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color?: string }) {
  return (
    <div className="panel-card text-center">
      <div className={`flex justify-center mb-1 ${color || 'text-text-muted'}`}>{icon}</div>
      <div className={`text-2xl font-bold ${color || 'text-text-primary'}`}>{value}</div>
      <div className="text-[11px] text-text-muted mt-1">{label}</div>
    </div>
  );
}
