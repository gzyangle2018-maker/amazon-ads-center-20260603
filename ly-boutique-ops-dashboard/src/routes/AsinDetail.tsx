import { useState } from 'react';
import { DataTable } from '@/components/common/DataTable';
import type { Column } from '@/components/common/DataTable';
import { AsinDrawer } from '@/components/common/AsinDrawer';
import { mockAsins } from '@/data/mockAsins';
import type { AsinRecord } from '@/types';
import { ASIN_STATUS_LABELS } from '@/types';
import { gradeColor } from '@/lib/utils';

export function AsinDetail() {
  const [selected, setSelected] = useState<AsinRecord | null>(null);

  const columns: Column<AsinRecord>[] = [
    { key: 'asin', header: 'ASIN', render: (r) => <span className="font-mono text-xs text-accent-cyan cursor-pointer hover:underline" onClick={() => setSelected(r)}>{r.asin}</span> },
    { key: 'productName', header: '产品名', render: (r) => <span className="text-xs max-w-[160px] block truncate">{r.productName}</span> },
    { key: 'sku', header: 'SKU' },
    { key: 'store', header: '店铺', sortable: true },
    { key: 'site', header: '站点' },
    { key: 'owner', header: '负责人' },
    { key: 'grade', header: '等级', render: (r) => <span className={`chip text-xs font-bold ${gradeColor(r.grade)}`}>{r.grade}</span>, sortable: true },
    { key: 'status', header: '状态', render: (r) => <span className="chip bg-white/5 text-text-secondary border-white/10 text-xs">{ASIN_STATUS_LABELS[r.status]}</span> },
    { key: 'orders30d', header: '30天订单', sortable: true },
    { key: 'sales30d', header: '销售额', render: (r) => <span>${r.sales30d.toLocaleString()}</span> },
    { key: 'acos', header: 'ACOS', render: (r) => <span className={r.acos > 40 ? 'text-accent-red font-semibold' : ''}>{r.acos}%</span> },
    { key: 'tacos', header: 'TACOS', render: (r) => <span className={r.tacos > 25 ? 'text-accent-red font-semibold' : ''}>{r.tacos}%</span> },
    { key: 'cvr', header: 'CVR', render: (r) => `${r.cvr}%` },
    { key: 'netProfit', header: '净利润', render: (r) => <span className={r.netProfit < 0 ? 'text-accent-red' : 'text-accent-green'}>${r.netProfit.toLocaleString()}</span> },
    { key: 'inventoryDays', header: '库存天数', render: (r) => <span className={r.inventoryDays > 180 ? 'text-accent-red' : r.inventoryDays < 30 ? 'text-accent-yellow' : ''}>{r.inventoryDays}天</span> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">ASIN 详情</h1>
        <p className="text-sm text-text-secondary mt-1">
          {mockAsins.length} 个 ASIN · 点击 ASIN 查看完整经营档案
        </p>
      </div>

      <DataTable
        columns={columns}
        data={mockAsins}
        searchPlaceholder="搜索 ASIN / SKU / 产品名..."
        onRowClick={(row) => setSelected(row)}
      />

      <AsinDrawer asin={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
