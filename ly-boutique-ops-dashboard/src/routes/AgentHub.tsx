import { useState } from 'react';
import { AgentCard } from '@/components/common/AgentCard';
import { mockAgents } from '@/data/mockAgents';
import { useAppStore } from '@/store';
import { Bot, Zap, Search, AlertTriangle } from 'lucide-react';
import { runAgentTask } from '@/lib/aiRouter';
import type { AiRunResponse } from '@/types';

export function AgentHub() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<AiRunResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const { modelConfigs, getModelForAgent } = useAppStore();

  const filtered = search
    ? mockAgents.filter(
        (a) =>
          a.name.includes(search) ||
          a.description.includes(search) ||
          a.category.includes(search)
      )
    : mockAgents;

  // Check if any agent has a configured model
  const configuredCount = mockAgents.filter((a) => {
    const m = getModelForAgent(a.id);
    return m && m.apiKey;
  }).length;

  const handleDispatch = async (agentId: string) => {
    const model = getModelForAgent(agentId);
    if (!model || !model.apiKey) {
      setResults({
        success: false,
        agentId,
        modelProvider: model?.provider || 'unknown',
        modelName: model?.modelName || 'unknown',
        result: { error: 'API Key 未配置，请先在「模型配置」页面添加 API Key' },
        tasks: [],
        warnings: ['缺少 API Key'],
        cost: { tokens: 0, estimatedUsd: 0 },
        createdAt: new Date().toISOString(),
      });
      return;
    }

    setLoading(true);
    setResults(null);
    const res = await runAgentTask({
      agentId,
      modelProvider: model.provider,
      modelName: model.modelName,
      taskType: 'manual_dispatch',
      inputFiles: [],
      inputText: '',
      context: { apiKey: model.apiKey, baseUrl: model.apiBaseUrl },
      options: { temperature: 0.2, maxTokens: 8000 },
    });
    setResults(res);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Agent 路由</h1>
        <p className="text-sm text-text-secondary mt-1">
          统一 Agent Hub · 跳转官网 / API 调用 · 已配置 {configuredCount}/{mockAgents.length} 个模型
        </p>
      </div>

      {/* Warning if no API keys */}
      {configuredCount === 0 && (
        <div className="panel-card border-accent-yellow/30 bg-accent-yellow/5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-accent-yellow shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-accent-yellow">尚未配置 API Key</h3>
              <p className="text-xs text-text-secondary mt-1">
                请先前往「模型配置」页面填入 Dataler 中转 API Key 或各模型 API Key，才能通过 API 调用 Agent。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-2 panel-card">
        <Search size={16} className="text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索 Agent 名称 / 分类..."
          className="bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-muted flex-1"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="panel-card border-accent-cyan/30 bg-accent-cyan/5 flex items-center gap-3">
          <Zap size={18} className="text-accent-cyan animate-pulse" />
          <span className="text-sm text-accent-cyan">模型处理中...</span>
        </div>
      )}

      {/* Result */}
      {results && (
        <div className={`panel-card ${results.success ? 'border-accent-green/30 bg-accent-green/5' : 'border-accent-red/30 bg-accent-red/5'}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-sm font-semibold flex items-center gap-2 ${results.success ? 'text-accent-green' : 'text-accent-red'}`}>
              <Bot size={16} /> {results.success ? '任务已下发' : '调用失败'}
            </h3>
            <span className="text-xs text-text-muted">
              模型: {results.modelProvider} / {results.modelName}
            </span>
          </div>
          <p className="text-sm text-text-secondary">
            {results.success
              ? (results.result.summary as string)
              : (results.result.error as string)}
          </p>
          {results.success && (
            <div className="flex gap-4 mt-2 text-xs text-text-muted">
              <span>Tokens: {results.cost.tokens.toLocaleString()}</span>
              <span>预估成本: ${results.cost.estimatedUsd}</span>
              {results.warnings.length > 0 && (
                <span className="text-accent-yellow">⚠ {results.warnings[0]}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Agent grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((agent) => {
          const model = getModelForAgent(agent.id);
          return (
            <AgentCard
              key={agent.id}
              agent={{
                ...agent,
                modelProvider: model?.provider || agent.modelProvider,
                modelName: model?.modelName || agent.modelName,
              }}
              hasApiKey={!!model?.apiKey}
              onToggle={(id) => console.log('toggle', id)}
              onDispatch={(id) => handleDispatch(id)}
            />
          );
        })}
      </div>
    </div>
  );
}
