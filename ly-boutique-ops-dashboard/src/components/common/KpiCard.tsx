import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string;
  trend: string;
  trendUp: boolean | null;
  description: string;
  icon: React.ReactNode;
  color?: string;
}

export function KpiCard({ label, value, trend, trendUp, description, icon, color }: KpiCardProps) {
  const borderColor = color || 'border-accent-cyan/30';
  const bgGlow = color || 'bg-accent-cyan/10';

  return (
    <div className={`panel-card ${borderColor} hover:${bgGlow} transition-all group`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-text-muted uppercase tracking-wider font-medium">{label}</span>
        <span className="text-text-muted group-hover:text-accent-cyan transition-colors">{icon}</span>
      </div>
      <strong className="text-3xl font-bold block mb-1 text-text-primary group-hover:text-white transition-colors">
        {value}
      </strong>
      <div className="flex items-center gap-1.5 mb-1.5">
        {trendUp === null ? (
          <Minus size={14} className="text-text-muted" />
        ) : trendUp ? (
          <TrendingUp size={14} className="text-accent-green" />
        ) : (
          <TrendingDown size={14} className="text-accent-red" />
        )}
        <em className={`text-xs not-italic font-semibold ${trendUp === null ? 'text-text-muted' : trendUp ? 'text-accent-green' : 'text-accent-red'}`}>
          {trend}
        </em>
      </div>
      <p className="text-xs text-text-muted leading-relaxed">{description}</p>
    </div>
  );
}
