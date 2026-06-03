import { Server, CheckCircle, XCircle, Zap, DollarSign, Gauge } from 'lucide-react';
import type { ModelConfig } from '@/types';
import { MODEL_PROVIDER_LABELS } from '@/types';

interface ModelConfigCardProps {
  model: ModelConfig;
  onToggle: (id: string) => void;
}

const priceColors = {
  low: 'text-accent-green',
  medium: 'text-accent-yellow',
  high: 'text-accent-red',
};

const speedColors = {
  slow: 'text-accent-yellow',
  medium: 'text-accent-blue',
  fast: 'text-accent-green',
};

export function ModelConfigCard({ model, onToggle }: ModelConfigCardProps) {
  return (
    <div className={`panel-card group hover:border-accent-cyan/20 transition-all ${!model.enabled ? 'opacity-55' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-accent-purple/15 border border-accent-purple/20 grid place-items-center">
            <Server size={18} className="text-accent-purple" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{MODEL_PROVIDER_LABELS[model.provider]}</h3>
            <p className="text-[11px] text-text-muted font-mono">{model.modelName}</p>
          </div>
        </div>
        <button
          onClick={() => onToggle(model.id)}
          className="shrink-0"
          title={model.enabled ? '禁用' : '启用'}
        >
          {model.enabled ? (
            <CheckCircle size={18} className="text-accent-green" />
          ) : (
            <XCircle size={18} className="text-text-muted" />
          )}
        </button>
      </div>

      {/* URL */}
      <p className="text-[11px] text-text-muted font-mono mb-3 truncate">{model.apiBaseUrl}</p>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center p-2 rounded-lg bg-white/5">
          <DollarSign size={12} className={`mx-auto mb-0.5 ${priceColors[model.priceLevel]}`} />
          <span className="text-[10px] text-text-muted block">价格</span>
          <span className={`text-[11px] font-semibold ${priceColors[model.priceLevel]}`}>
            {model.priceLevel === 'low' ? '低' : model.priceLevel === 'medium' ? '中' : '高'}
          </span>
        </div>
        <div className="text-center p-2 rounded-lg bg-white/5">
          <Zap size={12} className={`mx-auto mb-0.5 ${speedColors[model.speedLevel]}`} />
          <span className="text-[10px] text-text-muted block">速度</span>
          <span className={`text-[11px] font-semibold ${speedColors[model.speedLevel]}`}>
            {model.speedLevel === 'slow' ? '慢' : model.speedLevel === 'medium' ? '中' : '快'}
          </span>
        </div>
        <div className="text-center p-2 rounded-lg bg-white/5">
          <Gauge size={12} className="mx-auto mb-0.5 text-accent-blue" />
          <span className="text-[10px] text-text-muted block">上下文</span>
          <span className="text-[11px] font-semibold text-text-secondary">
            {(model.maxContext / 1000).toFixed(0)}K
          </span>
        </div>
      </div>

      {/* Purpose tags */}
      <div className="flex flex-wrap gap-1">
        {model.purpose.map((p) => (
          <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-text-muted border border-white/5">
            {p}
          </span>
        ))}
      </div>

      {/* Default badge */}
      {model.isDefault && (
        <div className="mt-2">
          <span className="chip bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30 text-[10px]">
            默认模型
          </span>
        </div>
      )}
    </div>
  );
}
