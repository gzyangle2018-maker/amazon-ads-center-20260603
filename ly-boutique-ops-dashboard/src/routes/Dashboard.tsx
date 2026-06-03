import { useMemo } from 'react';
import {
  AlertTriangle, Zap, ShieldAlert, Ban, Target, Layers,
  TrendingDown, DollarSign, Package, FileEdit, Image, Clock,
  Gauge,
} from 'lucide-react';
import { KpiCard } from '@/components/common/KpiCard';
import { DataTable } from '@/components/common/DataTable';
import type { Column } from '@/components/common/DataTable';
import { PriorityBadge } from '@/components/common/PriorityBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfidenceBadge } from '@/components/common/ConfidenceBadge';
import { mockAsins } from '@/data/mockAsins';
import { mockTasks } from '@/data/mockTasks';
import { mockDailyIssues } from '@/data/mockDailyIssues';
import { mockMonthlyGrades } from '@/data/mockMonthlyGrades';
import type { TopIssue, DashboardKpi } from '@/types';
import { gradeColor } from '@/lib/utils';

export function Dashboard() {
  const kpis = useMemo<DashboardKpi[]>(() => {
    const s = mockAsins.filter((a) => a.grade === 'S').length;
    const a = mockAsins.filter((a2) => a2.grade === 'A').length;
    const b = mockAsins.filter((a3) => a3.grade === 'B').length;
    const c = mockAsins.filter((a4) => a4.grade === 'C').length;
    const d = mockAsins.filter((a5) => a5.grade === 'D').length;
    const overdue = mockTasks.filter((t) => t.status !== 'completed' && t.status !== 'closed' && new Date(t.deadline) < new Date()).length;
    const needsApproval = mockTasks.filter((t) => t.status === 'pending_approval').length;
    const dAttribution = mockDailyIssues.filter((i) => i.attributionConfidence === 'D').length;

    return [
      { id: '1', label: '今日异常 ASIN', value: String(mockDailyIssues.length), trend: '+6', trendUp: true, description: 'TACOS / CVR / 订单波动触发', icon: 'AlertTriangle' },
      { id: '2', label: '可执行动作', value: '42', trend: 'A/B级可执行', trendUp: true, description: '可明确归属ASIN后执行', icon: 'Zap' },
      { id: '3', label: '需人工审批', value: String(needsApproval), trend: '高风险动作', trendUp: null, description: '需管理员确认后执行', icon: 'ShieldAlert' },
      { id: '4', label: '禁止强执行', value: String(dAttribution), trend: 'D级归属', trendUp: false, description: '多ASIN混投或无法归属', icon: 'Ban' },
      { id: '5', label: '本周重点 ASIN', value: '8', trend: '较上周+2', trendUp: true, description: 'P0/P1优先级ASIN', icon: 'Target' },
      { id: '6', label: '产品分级 S/A/B/C/D', value: `${s}/${a}/${b}/${c}/${d}`, trend: '月度分布', trendUp: null, description: '月度产品分层', icon: 'Layers' },
      { id: '7', label: 'TACOS 异常', value: '5', trend: '较上周-1', trendUp: false, description: '高于目标TACOS', icon: 'TrendingDown' },
      { id: '8', label: '库存风险', value: '4', trend: '需紧急处理', trendUp: false, description: '库存<30天或>180天', icon: 'Package' },
      { id: '9', label: 'Listing待优化', value: '6', trend: '本周新增2', trendUp: true, description: '标题/BP/A+ 优化', icon: 'FileEdit' },
      { id: '10', label: '作图/视频待处理', value: '7', trend: '进行中5个', trendUp: null, description: '主图/视频/A+素材', icon: 'Image' },
      { id: '11', label: '任务逾期', value: String(overdue), trend: overdue > 3 ? '需关注' : '可控', trendUp: overdue > 3, description: '超过截止时间未完成', icon: 'Clock' },
    ];
  }, []);

  const topIssues = useMemo<TopIssue[]>(() => {
    return mockDailyIssues.slice(0, 10).map((i) => ({
      id: i.id,
      priority: i.priority,
      store: i.store,
      site: i.site,
      asin: i.asin,
      sku: i.sku,
      productName: i.productName,
      assignee: i.assignee,
      problemType: i.problemType,
      affectedMetric: i.anomalyMetric,
      aiJudgment: i.cause,
      suggestedAction: i.aiSuggestion,
      directlyExecutable: !i.needsApproval,
      needsApproval: i.needsApproval,
      deadline: i.deadline,
      status: i.status,
    }));
  }, []);

  const topIssueColumns: Column<TopIssue>[] = [
    { key: 'priority', header: '优先级', render: (r) => <PriorityBadge priority={r.priority} /> },
    { key: 'store', header: '店铺' },
    { key: 'asin', header: 'ASIN', render: (r) => <span className="font-mono text-xs">{r.asin}</span> },
    { key: 'productName', header: '产品', render: (r) => <span className="text-xs">{r.productName}</span> },
    { key: 'assignee', header: '负责人' },
    { key: 'problemType', header: '问题类型' },
    { key: 'affectedMetric', header: '影响指标' },
    { key: 'suggestedAction', header: '建议动作', render: (r) => <span className="text-xs max-w-[200px] block truncate">{r.suggestedAction}</span> },
    { key: 'directlyExecutable', header: '可执行', render: (r) => r.directlyExecutable ? <span className="text-accent-green text-xs">是</span> : <span className="text-accent-red text-xs">需审批</span> },
    { key: 'status', header: '状态', render: (r) => <StatusBadge status={r.status} /> },
  ];

  const gradeCounts = useMemo(() => {
    const grades = ['S', 'A', 'B', 'C', 'D'] as const;
    return grades.map((g) => ({
      grade: g,
      count: mockMonthlyGrades.filter((m) => m.grade === g).length,
    }));
  }, []);

  const auditSummary = useMemo(() => {
    const completed = mockTasks.filter((t) => t.status === 'completed').length;
    const pending = mockTasks.filter((t) => t.status === 'pending_approval').length;
    const inProgress = mockTasks.filter((t) => t.status === 'in_progress').length;
    return { completed, pending, inProgress, total: mockTasks.length };
  }, []);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">总控首页</h1>
        <p className="text-sm text-text-secondary mt-1">
          小精品体系整体健康度 · {new Date().toLocaleDateString('zh-CN')}
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {kpis.slice(0, 12).map((k) => (
          <KpiCard
            key={k.id}
            label={k.label}
            value={k.value}
            trend={k.trend}
            trendUp={k.trendUp}
            description={k.description}
            icon={<KpiIcon name={k.icon} />}
          />
        ))}
      </div>

      {/* Core sections */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top 10 Issues */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-text-primary">今日最重要 10 个问题</h2>
            <span className="text-xs text-text-muted">按优先级排序</span>
          </div>
          <DataTable columns={topIssueColumns} data={topIssues} searchable={false} />
        </div>

        {/* Grade distribution */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-3">本月产品分层变化</h2>
            <div className="panel-card">
              <div className="grid grid-cols-5 gap-3">
                {gradeCounts.map((g) => (
                  <div key={g.grade} className="text-center">
                    <div className={`text-2xl font-black ${g.grade === 'S' ? 'text-accent-green' : g.grade === 'A' ? 'text-accent-blue' : g.grade === 'B' ? 'text-accent-yellow' : g.grade === 'C' ? 'text-accent-orange' : 'text-accent-red'}`}>
                      {g.count}
                    </div>
                    <div className={`chip inline-flex mt-1 text-xs font-bold ${gradeColor(g.grade)}`}>{g.grade} 级</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Team Audit */}
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-3">团队执行审计</h2>
            <div className="panel-card">
              <div className="grid grid-cols-4 gap-3 text-center">
                <div>
                  <div className="text-2xl font-bold text-text-primary">{auditSummary.total}</div>
                  <div className="text-xs text-text-muted">总任务</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent-green">{auditSummary.completed}</div>
                  <div className="text-xs text-text-muted">已完成</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent-blue">{auditSummary.inProgress}</div>
                  <div className="text-xs text-text-muted">进行中</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent-yellow">{auditSummary.pending}</div>
                  <div className="text-xs text-text-muted">待审批</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/8">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">本周重点 ASIN 进度</h3>
                {mockAsins.filter((a) => a.grade === 'S' || a.grade === 'A').slice(0, 5).map((a) => (
                  <div key={a.asin} className="flex items-center justify-between py-2 border-b border-white/5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${a.grade === 'S' ? 'bg-accent-green' : 'bg-accent-blue'}`} />
                      <span className="text-text-primary font-medium">{a.productName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-text-muted">
                      <span>{a.store}</span>
                      <span>销量 {a.orders30d}</span>
                      <span>TACOS {a.tacos}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    AlertTriangle: <AlertTriangle size={18} />,
    Zap: <Zap size={18} />,
    ShieldAlert: <ShieldAlert size={18} />,
    Ban: <Ban size={18} />,
    Target: <Target size={18} />,
    Layers: <Layers size={18} />,
    TrendingDown: <TrendingDown size={18} />,
    Package: <Package size={18} />,
    FileEdit: <FileEdit size={18} />,
    Image: <Image size={18} />,
    Clock: <Clock size={18} />,
    Gauge: <Gauge size={18} />,
    DollarSign: <DollarSign size={18} />,
  };
  return icons[name] || <Gauge size={18} />;
}
