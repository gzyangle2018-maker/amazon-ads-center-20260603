import { X, TrendingUp, DollarSign, Target, Activity, Shield } from 'lucide-react';
import type { AsinRecord } from '@/types';
import { ASIN_STATUS_LABELS } from '@/types';

interface AsinDrawerProps {
  asin: AsinRecord | null;
  onClose: () => void;
}

export function AsinDrawer({ asin, onClose }: AsinDrawerProps) {
  if (!asin) return null;

  const gradeColors: Record<string, string> = {
    S: 'bg-accent-green/15 text-accent-green border-accent-green/30',
    A: 'bg-accent-blue/15 text-accent-blue border-accent-blue/30',
    B: 'bg-accent-yellow/15 text-accent-yellow border-accent-yellow/30',
    C: 'bg-accent-orange/15 text-accent-orange border-accent-orange/30',
    D: 'bg-accent-red/15 text-accent-red border-accent-red/30',
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-bg-dark border-l border-white/10 overflow-y-auto animate-slide-in">
        {/* Header */}
        <div className="sticky top-0 bg-bg-dark/95 backdrop-blur-md border-b border-white/10 p-5 flex items-start justify-between z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-text-muted font-mono">{asin.asin}</span>
              <span className={`chip border text-[11px] font-semibold ${gradeColors[asin.grade]}`}>
                {asin.grade} 级
              </span>
              <span className="chip bg-white/5 text-text-muted border-white/10 text-[11px]">
                {ASIN_STATUS_LABELS[asin.status]}
              </span>
            </div>
            <h2 className="text-lg font-bold text-text-primary">{asin.productName}</h2>
            <p className="text-sm text-text-secondary mt-0.5">{asin.store} · {asin.site} · {asin.sku}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Quick metrics */}
          <div className="grid grid-cols-2 gap-3">
            <MetricBox icon={<TrendingUp size={14} />} label="30天销量" value={asin.orders30d.toLocaleString()} />
            <MetricBox icon={<DollarSign size={14} />} label="30天销售额" value={`$${asin.sales30d.toLocaleString()}`} />
            <MetricBox icon={<Target size={14} />} label="ACOS" value={`${asin.acos}%`} />
            <MetricBox icon={<Activity size={14} />} label="TACOS" value={`${asin.tacos}%`} />
            <MetricBox icon={<Shield size={14} />} label="CVR" value={`${asin.cvr}%`} />
            <MetricBox icon={<Target size={14} />} label="CTR" value={`${asin.ctr}%`} />
            <MetricBox icon={<DollarSign size={14} />} label="净利润" value={`$${asin.netProfit.toLocaleString()}`} />
            <MetricBox icon={<Shield size={14} />} label="库存天数" value={`${asin.inventoryDays}天`} />
          </div>

          {/* Details */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">基础信息</h3>
            <DetailRow label="父 ASIN" value={asin.parentAsin} />
            <DetailRow label="产品线" value={asin.productLine} />
            <DetailRow label="负责人" value={asin.owner} />
            <DetailRow label="上架时间" value={asin.launchDate} />
            <DetailRow label="当前策略" value={asin.strategy} />
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">利润分析</h3>
            <DetailRow label="毛利" value={`$${asin.grossProfit.toLocaleString()}`} />
            <DetailRow label="净利润率" value={`${asin.netMargin}%`} />
            <DetailRow label="退货率" value={`${asin.returnRate}%`} />
            <DetailRow label="差评率" value={`${asin.negativeReviewRate}%`} />
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">广告数据</h3>
            <DetailRow label="广告花费" value={`$${asin.adSpend30d.toLocaleString()}`} />
            <DetailRow label="广告销售额" value={`$${asin.adSales30d.toLocaleString()}`} />
            <DetailRow label="ACOS" value={`${asin.acos}%`} />
            <DetailRow label="TACOS" value={`${asin.tacos}%`} />
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">库存</h3>
            <DetailRow label="库存数量" value={asin.inventoryQty.toLocaleString()} />
            <DetailRow label="可售天数" value={`${asin.inventoryDays}天`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-white/5 border border-white/8">
      <div className="flex items-center gap-1.5 text-text-muted mb-1">
        {icon}
        <span className="text-[11px]">{label}</span>
      </div>
      <span className="text-sm font-bold text-text-primary">{value}</span>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-white/5">
      <span className="text-xs text-text-muted">{label}</span>
      <span className="text-xs text-text-primary font-medium">{value}</span>
    </div>
  );
}
