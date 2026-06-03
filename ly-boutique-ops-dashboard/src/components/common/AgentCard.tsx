import { Bot, ExternalLink, Zap, Power, Key, AlertTriangle } from 'lucide-react';
import type { Agent } from '@/types';
import { AGENT_CATEGORY_LABELS } from '@/types';

interface AgentCardProps {
  agent: Agent;
  hasApiKey?: boolean;
  onToggle?: (id: string) => void;
  onDispatch?: (id: string) => void;
}

const modeLabels = {
  official_link: '跳转官网',
  api: 'API 调用',
  hybrid: '混合模式',
  disabled: '暂未启用',
};

const modeColors = {
  official_link: 'bg-accent-blue/15 text-accent-blue border-accent-blue/30',
  api: 'bg-accent-green/15 text-accent-green border-accent-green/30',
  hybrid: 'bg-accent-purple/15 text-accent-purple border-accent-purple/30',
  disabled: 'bg-text-muted/10 text-text-muted border-text-muted/20',
};

export function AgentCard({ agent, hasApiKey, onToggle, onDispatch }: AgentCardProps) {
  return (
    <div className={`panel-card group hover:border-accent-cyan/20 transition-all ${!agent.enabled ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-accent-cyan/15 border border-accent-cyan/20 grid place-items-center">
            <Bot size={18} className="text-accent-cyan" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary leading-tight">{agent.name}</h3>
            <span className="text-[11px] text-text-muted">{AGENT_CATEGORY_LABELS[agent.category]}</span>
          </div>
        </div>
        <button
          onClick={() => onToggle?.(agent.id)}
          className={`shrink-0 ${agent.enabled ? 'text-accent-green' : 'text-text-muted'}`}
          title={agent.enabled ? '已启用' : '已禁用'}
        >
          <Power size={16} />
        </button>
      </div>

      {/* Description */}
      <p className="text-xs text-text-secondary leading-relaxed mb-3 line-clamp-2">{agent.description}</p>

      {/* Meta */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`chip border text-[11px] ${modeColors[agent.useMode]}`}>
          {agent.useMode === 'official_link' && <ExternalLink size={10} className="mr-0.5" />}
          {agent.useMode === 'api' && <Zap size={10} className="mr-0.5" />}
          {modeLabels[agent.useMode]}
        </span>
        <span className="chip border bg-white/5 text-text-muted border-white/10 text-[11px]">
          {agent.modelProvider} / {agent.modelName}
        </span>
      </div>

      {/* Owner & Permissions */}
      <div className="text-[11px] text-text-muted mb-1">
        负责人：{agent.owner} · 权限：{agent.permissions.join('、')}
      </div>

      {/* API Key warning */}
      {agent.useMode === 'api' && !hasApiKey && (
        <div className="flex items-center gap-1.5 text-[11px] text-accent-yellow mb-3">
          <Key size={10} />
          <span>未配置 API Key — 请先在「模型配置」填入</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {agent.useMode === 'official_link' ? (
          <a
            href={agent.entryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            <ExternalLink size={12} /> 打开 Agent
          </a>
        ) : (
          <button
            onClick={() => onDispatch?.(agent.id)}
            className={`text-xs flex items-center gap-1.5 ${
              agent.enabled && hasApiKey
                ? 'btn-primary'
                : 'btn-secondary text-text-muted'
            }`}
            disabled={!agent.enabled}
          >
            <Zap size={12} /> 分发任务
          </button>
        )}
        <button className="btn-secondary text-xs">配置</button>
      </div>
    </div>
  );
}
