import { useMemo } from 'react';
import { DataTable } from '@/components/common/DataTable';
import type { Column } from '@/components/common/DataTable';
import { ConfidenceBadge } from '@/components/common/ConfidenceBadge';
import type { AdAttributionRow } from '@/types';
import { AlertTriangle, ShieldAlert, Ban, CheckCircle, Info } from 'lucide-react';

/**
 * Mock attribution audit data — demonstrates all four confidence levels.
 */
function generateMockAttribution(): AdAttributionRow[] {
  return [
    {
      campaignId: 'SP-001', campaignName: 'US-B0816PPB5T-CHG65W-SP-Manual-Exact-Core',
      adGroupId: 'AG-001', adGroupName: 'Core-KWs',
      keywordId: 'KW-001', targetingId: '',
      searchTerm: 'gan charger 65w', targetTerm: 'gan charger 65w',
      advertisedAsin: 'B0816PPB5T', advertisedSku: 'CHG65W',
      mappedAsin: 'B0816PPB5T', confidence: 'A',
      basis: 'Campaign名称直接包含ASIN',
      multiAsinMixed: false, executable: true,
      riskNote: '', suggestedFix: '',
    },
    {
      campaignId: 'SP-002', campaignName: 'US-Auto-General',
      adGroupId: 'AG-002', adGroupName: 'Auto-Targeting',
      keywordId: 'KW-002', targetingId: 'TG-001',
      searchTerm: 'wireless earbuds', targetTerm: 'wireless earbuds',
      advertisedAsin: '', advertisedSku: '',
      mappedAsin: 'B0TEST002', confidence: 'B',
      basis: '通过Bulk Operation中Campaign ID可映射到SKU WL-BT51',
      multiAsinMixed: false, executable: true,
      riskNote: '需人工复核Bulk映射关系',
      suggestedFix: '建议将Campaign名称改为含ASIN的命名',
    },
    {
      campaignId: '', campaignName: 'SP-Broad-Discovery',
      adGroupId: '', adGroupName: '',
      keywordId: '', targetingId: '',
      searchTerm: 'phone case iphone 15', targetTerm: 'phone case',
      advertisedAsin: '', advertisedSku: '',
      mappedAsin: 'B0TEST011', confidence: 'C',
      basis: '仅通过产品名"手机壳"语义推测',
      multiAsinMixed: true, executable: false,
      riskNote: '该广告结构无法高置信归属ASIN，禁止生成强执行动作，请先拆分广告结构或补充广告商品报告',
      suggestedFix: '补充广告商品报告或按ASIN拆分Campaign',
    },
    {
      campaignId: 'SP-003', campaignName: 'US-SP-Auto-All-Products',
      adGroupId: 'AG-003', adGroupName: 'Auto-CatchAll',
      keywordId: '', targetingId: '',
      searchTerm: 'usb c cable', targetTerm: '*',
      advertisedAsin: '', advertisedSku: '',
      mappedAsin: '', confidence: 'D',
      basis: '该活动包含4个不同ASIN的产品，无法拆分归属',
      multiAsinMixed: true, executable: false,
      riskNote: '该广告结构无法高置信归属ASIN，禁止生成强执行动作，请先拆分广告结构或补充广告商品报告',
      suggestedFix: '立即拆分：按ASIN创建独立Campaign并命名含ASIN',
    },
    {
      campaignId: 'SP-004', campaignName: 'US-B0TEST005-CAM-4K-SP-Manual-Exact',
      adGroupId: 'AG-004', adGroupName: 'Exact-Top-KWs',
      keywordId: 'KW-004', targetingId: '',
      searchTerm: '4k webcam autofocus', targetTerm: '4k webcam autofocus',
      advertisedAsin: 'B0TEST005', advertisedSku: 'CAM-4K',
      mappedAsin: 'B0TEST005', confidence: 'A',
      basis: 'Campaign名称直接包含ASIN + 广告商品报告确认',
      multiAsinMixed: false, executable: true,
      riskNote: '', suggestedFix: '',
    },
    {
      campaignId: 'SP-005', campaignName: 'US-HUB-USB7-SP-PAT-Competitor',
      adGroupId: 'AG-005', adGroupName: 'PAT-ASIN-Targets',
      keywordId: '', targetingId: 'TG-005',
      searchTerm: '', targetTerm: 'B0XYZ789',
      advertisedAsin: 'B0TEST009', advertisedSku: 'HUB-USB7',
      mappedAsin: 'B0TEST009', confidence: 'A',
      basis: '广告商品报告直接提供ASIN',
      multiAsinMixed: false, executable: true,
      riskNote: '', suggestedFix: '',
    },
    {
      campaignId: 'SP-006', campaignName: 'SP-General-Catch',
      adGroupId: 'AG-006', adGroupName: 'General',
      keywordId: 'KW-006', targetingId: '',
      searchTerm: 'bluetooth mouse silent', targetTerm: 'bluetooth mouse',
      advertisedAsin: '', advertisedSku: '',
      mappedAsin: 'B0TEST016', confidence: 'C',
      basis: '通过搜索词语义推测为MOUSE-BT，无直接字段支撑',
      multiAsinMixed: false, executable: false,
      riskNote: '该广告结构无法高置信归属ASIN，禁止生成强执行动作',
      suggestedFix: '补充广告商品报告',
    },
    {
      campaignId: '', campaignName: 'SP-CA-WL-BT51-Auto-Close',
      adGroupId: '', adGroupName: '',
      keywordId: '', targetingId: '',
      searchTerm: 'noise cancelling earbuds', targetTerm: 'noise cancelling earbuds',
      advertisedAsin: '', advertisedSku: '',
      mappedAsin: 'B0TEST002', confidence: 'A',
      basis: 'Campaign名称包含SKU WL-BT51',
      multiAsinMixed: false, executable: true,
      riskNote: '', suggestedFix: '',
    },
    {
      campaignId: 'SP-007', campaignName: 'SB-Video-General',
      adGroupId: 'AG-007', adGroupName: 'Video-Ads',
      keywordId: 'KW-007', targetingId: '',
      searchTerm: 'usb c hub', targetTerm: 'usb c hub',
      advertisedAsin: '', advertisedSku: '',
      mappedAsin: '', confidence: 'D',
      basis: 'SB视频广告包含3个不同ASIN，无法拆分',
      multiAsinMixed: true, executable: false,
      riskNote: '该广告结构无法高置信归属ASIN，禁止生成强执行动作',
      suggestedFix: '拆分为每个ASIN独立SB视频广告',
    },
    {
      campaignId: 'SP-008', campaignName: 'US-B0TEST004-KB-MX01-SP-Manual-Exact',
      adGroupId: 'AG-008', adGroupName: 'Long-Tail-KWs',
      keywordId: 'KW-008', targetingId: '',
      searchTerm: 'mechanical keyboard hot swappable', targetTerm: 'mechanical keyboard hot swappable',
      advertisedAsin: 'B0TEST004', advertisedSku: 'KB-MX01',
      mappedAsin: 'B0TEST004', confidence: 'A',
      basis: 'Campaign名称直接包含ASIN + 广告商品报告确认',
      multiAsinMixed: false, executable: true,
      riskNote: '', suggestedFix: '',
    },
  ];
}

export function AdAttributionAudit() {
  const data = useMemo(() => generateMockAttribution(), []);

  const columns: Column<AdAttributionRow>[] = [
    { key: 'confidence', header: '归属', render: (r) => <ConfidenceBadge confidence={r.confidence} />, sortable: true },
    { key: 'campaignName', header: 'Campaign', render: (r) => <span className="text-xs max-w-[180px] block truncate font-mono">{r.campaignName || '—'}</span> },
    { key: 'adGroupName', header: 'Ad Group', render: (r) => <span className="text-xs max-w-[140px] block truncate">{r.adGroupName || '—'}</span> },
    { key: 'advertisedAsin', header: '推广ASIN', render: (r) => <span className="font-mono text-xs">{r.advertisedAsin || '—'}</span> },
    { key: 'mappedAsin', header: '映射ASIN', render: (r) => <span className="font-mono text-xs">{r.mappedAsin || '—'}</span> },
    { key: 'searchTerm', header: '搜索词/投放', render: (r) => <span className="text-xs max-w-[140px] block truncate">{r.searchTerm || r.targetTerm || '—'}</span> },
    { key: 'basis', header: '归属依据', render: (r) => <span className="text-xs max-w-[160px] block truncate">{r.basis}</span> },
    { key: 'multiAsinMixed', header: '混投', render: (r) => r.multiAsinMixed ? <span className="text-accent-red text-xs font-semibold">是</span> : <span className="text-text-muted text-xs">否</span> },
    { key: 'executable', header: '可执行', render: (r) => r.executable ? <CheckCircle size={14} className="text-accent-green" /> : <Ban size={14} className="text-accent-red" /> },
    { key: 'suggestedFix', header: '整改建议', render: (r) => <span className="text-xs max-w-[180px] block truncate">{r.suggestedFix || '—'}</span> },
  ];

  const stats = useMemo(() => {
    const a = data.filter((d) => d.confidence === 'A').length;
    const b = data.filter((d) => d.confidence === 'B').length;
    const c = data.filter((d) => d.confidence === 'C').length;
    const d = data.filter((d) => d.confidence === 'D').length;
    const blocked = data.filter((d) => !d.executable).length;
    return { a, b, c, d, blocked };
  }, [data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">广告归属审计</h1>
        <p className="text-sm text-text-secondary mt-1">
          判断每条广告数据能否归属到具体 ASIN · C/D 级禁止生成强执行动作
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        <StatBox label="A级 · 可执行" value={stats.a} color="text-accent-green" icon={<CheckCircle size={16} />} />
        <StatBox label="B级 · 可执行(复核)" value={stats.b} color="text-accent-blue" icon={<Info size={16} />} />
        <StatBox label="C级 · 仅参考" value={stats.c} color="text-accent-yellow" icon={<AlertTriangle size={16} />} />
        <StatBox label="D级 · 禁止执行" value={stats.d} color="text-accent-red" icon={<Ban size={16} />} />
        <StatBox label="已阻止强执行" value={stats.blocked} color="text-accent-orange" icon={<ShieldAlert size={16} />} />
      </div>

      {/* Warning for C/D */}
      <div className="panel-card border-accent-red/30 bg-accent-red/5">
        <div className="flex items-start gap-3">
          <ShieldAlert size={20} className="text-accent-red shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-accent-red">安全规则</h3>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              C/D 级 ASIN 归属的广告数据<strong className="text-accent-red">禁止生成强执行动作和 Bulk 操作</strong>。
              这些广告活动/广告组必须先拆分结构或补充广告商品报告后，才能进行 ASIN 级诊断。
            </p>
          </div>
        </div>
      </div>

      {/* Naming convention reference */}
      <div className="panel-card">
        <h3 className="text-sm font-semibold text-text-primary mb-2">推荐广告结构命名规范</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono text-text-muted">
          <code className="bg-white/5 px-2 py-1 rounded">站点-ASIN-SKU-产品简称-广告类型-匹配方式-目标</code>
          <code className="bg-white/5 px-2 py-1 rounded">US-B0816PPB5T-CHG65W-SP-Manual-Exact-Core</code>
          <code className="bg-white/5 px-2 py-1 rounded">US-B0816PPB5T-CHG65W-SP-Auto-Close</code>
          <code className="bg-white/5 px-2 py-1 rounded">US-B0816PPB5T-CHG65W-SP-PAT-Competitor</code>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="搜索 Campaign / ASIN / 搜索词..."
      />
    </div>
  );
}

function StatBox({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="panel-card text-center">
      <div className={`flex justify-center mb-1 ${color}`}>{icon}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-[11px] text-text-muted mt-1">{label}</div>
    </div>
  );
}
