import { useMemo } from 'react';
import { DataTable } from '@/components/common/DataTable';
import type { Column } from '@/components/common/DataTable';
import { mockMonthlyGrades } from '@/data/mockMonthlyGrades';
import type { MonthlyGrade } from '@/types';
import { gradeColor } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, Package, RefreshCw } from 'lucide-react';

export function MonthlyGrading() {
  const columns: Column<MonthlyGrade>[] = [
    { key: 'grade', header: '等级', render: (r) => <span className={`chip text-xs font-bold ${gradeColor(r.grade)}`}>{r.grade}</span>, sortable: true },
    { key: 'productName', header: '产品', render: (r) => <span className="text-xs max-w-[140px] block truncate">{r.productName}</span> },
    { key: 'store', header: '店铺' },
    { key: 'operator', header: '运营' },
    { key: 'monthlyOrders', header: '月销量', sortable: true },
    { key: 'monthlySales', header: '月销售额', render: (r) => <span>${r.monthlySales.toLocaleString()}</span> },
    { key: 'tacos', header: 'TACOS', render: (r) => <span className={r.tacos > 30 ? 'text-accent-red font-semibold' : ''}>{r.tacos}%</span> },
    { key: 'netProfit', header: '净利润', render: (r) => <span className={r.netProfit < 0 ? 'text-accent-red' : 'text-accent-green'}>${r.netProfit.toLocaleString()}</span> },
    { key: 'netMargin', header: '利润率', render: (r) => <span className={r.netMargin < 0 ? 'text-accent-red' : ''}>{r.netMargin}%</span> },
    { key: 'inventoryDays', header: '库存天数' },
    { key: 'cvr', header: 'CVR', render: (r) => `${r.cvr}%` },
    { key: 'gradeReason', header: '分级原因', render: (r) => <span className="text-xs max-w-[160px] block truncate">{r.gradeReason}</span> },
    { key: 'nextMonthStrategy', header: '下月策略', render: (r) => <span className="text-xs max-w-[160px] block truncate">{r.nextMonthStrategy}</span> },
    { key: 'assignee', header: '负责人' },
  ];

  const stats = useMemo(() => {
    const s = mockMonthlyGrades.filter((g) => g.grade === 'S');
    const a = mockMonthlyGrades.filter((g) => g.grade === 'A');
    const b = mockMonthlyGrades.filter((g) => g.grade === 'B');
    const c = mockMonthlyGrades.filter((g) => g.grade === 'C');
    const d = mockMonthlyGrades.filter((g) => g.grade === 'D');
    const totalProfit = mockMonthlyGrades.reduce((sum, g) => sum + g.netProfit, 0);
    const totalAdWaste = mockMonthlyGrades
      .filter((g) => g.tacos > 30)
      .reduce((sum, g) => sum + (g.monthlyAdSpend - g.monthlyAdSales * 0.3), 0);
    const reactivation = mockMonthlyGrades.filter((g) => g.reactivationCandidate);
    const clearance = mockMonthlyGrades.filter((g) => g.clearanceCandidate);

    return { s, a, b, c, d, totalProfit, totalAdWaste, reactivation, clearance };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">每月分级</h1>
        <p className="text-sm text-text-secondary mt-1">
          产品资源重配 · 决定加资源/维持/二次激活/清货/停投
        </p>
      </div>

      {/* Grade matrix */}
      <div className="grid grid-cols-5 gap-3">
        {(['S', 'A', 'B', 'C', 'D'] as const).map((grade) => {
          const list = stats[grade.toLowerCase() as 's' | 'a' | 'b' | 'c' | 'd'];
          const colors: Record<string, string> = {
            S: 'border-accent-green/30 bg-accent-green/5',
            A: 'border-accent-blue/30 bg-accent-blue/5',
            B: 'border-accent-yellow/30 bg-accent-yellow/5',
            C: 'border-accent-orange/30 bg-accent-orange/5',
            D: 'border-accent-red/30 bg-accent-red/5',
          };
          return (
            <div key={grade} className={`panel-card ${colors[grade]} text-center`}>
              <div className={`text-3xl font-black ${grade === 'S' ? 'text-accent-green' : grade === 'A' ? 'text-accent-blue' : grade === 'B' ? 'text-accent-yellow' : grade === 'C' ? 'text-accent-orange' : 'text-accent-red'}`}>
                {list.length}
              </div>
              <div className={`chip inline-flex mt-1 text-xs font-bold ${gradeColor(grade)}`}>{grade} 级</div>
              <div className="text-[11px] text-text-muted mt-2">
                {grade === 'S' ? '加资源猛攻' : grade === 'A' ? '维持优化' : grade === 'B' ? '找瓶颈突破' : grade === 'C' ? '二次激活/清货' : '降资源/停投'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Key panels */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="panel-card">
          <div className="flex items-center gap-2 text-xs text-text-muted mb-1"><DollarSign size={14} />总净利润</div>
          <div className={`text-xl font-bold ${stats.totalProfit >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
            ${stats.totalProfit.toLocaleString()}
          </div>
        </div>
        <div className="panel-card border-accent-red/20">
          <div className="flex items-center gap-2 text-xs text-accent-red mb-1"><AlertTriangle size={14} />广告浪费</div>
          <div className="text-xl font-bold text-accent-red">${Math.max(0, stats.totalAdWaste).toLocaleString()}</div>
          <div className="text-[11px] text-text-muted">TACOS&gt;30%的超支</div>
        </div>
        <div className="panel-card border-accent-orange/20">
          <div className="flex items-center gap-2 text-xs text-accent-orange mb-1"><RefreshCw size={14} />二次激活候选</div>
          <div className="text-xl font-bold text-accent-orange">{stats.reactivation.length}</div>
          <div className="text-[11px] text-text-muted">{stats.reactivation.map((r) => r.sku).join('、')}</div>
        </div>
        <div className="panel-card border-accent-red/20">
          <div className="flex items-center gap-2 text-xs text-accent-red mb-1"><Package size={14} />清货候选</div>
          <div className="text-xl font-bold text-accent-red">{stats.clearance.length}</div>
          <div className="text-[11px] text-text-muted">{stats.clearance.map((r) => r.sku).join('、')}</div>
        </div>
      </div>

      {/* Full table */}
      <DataTable
        columns={columns}
        data={mockMonthlyGrades}
        searchPlaceholder="搜索 ASIN / 产品 / 运营..."
      />
    </div>
  );
}
