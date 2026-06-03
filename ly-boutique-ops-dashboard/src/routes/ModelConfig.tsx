import { useState } from 'react';
import { useAppStore } from '@/store';
import type { ModelConfig, ModelProvider, ModelPurpose } from '@/types';
import { MODEL_PROVIDER_LABELS } from '@/types';
import { Server, Plus, Shield, Trash2, Eye, EyeOff, CheckCircle, XCircle, Zap, DollarSign, Gauge, Globe } from 'lucide-react';

const PURPOSE_LABELS: Record<ModelPurpose, string> = {
  total_control: '总控分析',
  ads_deep: '广告深度分析',
  listing_writing: 'Listing写作',
  image_prompt: '作图提示词',
  video_script: '视频脚本',
  data_cleaning: '数据清洗',
  audit: '执行审计',
  low_cost_batch: '低成本批量',
};

export function ModelConfig() {
  const { modelConfigs, updateModelConfig, addModelConfig, removeModelConfig, toggleModelEnabled } = useAppStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  // New model form state
  const [newProvider, setNewProvider] = useState<ModelProvider>('datater');
  const [newBaseUrl, setNewBaseUrl] = useState('https://dataler.com/v1');
  const [newApiKey, setNewApiKey] = useState('');
  const [newModelName, setNewModelName] = useState('');

  // Edit form state
  const [editBaseUrl, setEditBaseUrl] = useState('');
  const [editApiKey, setEditApiKey] = useState('');
  const [editModelName, setEditModelName] = useState('');

  const startEdit = (m: ModelConfig) => {
    setEditingId(m.id);
    setEditBaseUrl(m.apiBaseUrl);
    setEditApiKey(m.apiKey);
    setEditModelName(m.modelName);
  };

  const saveEdit = (id: string) => {
    updateModelConfig(id, {
      apiBaseUrl: editBaseUrl,
      apiKey: editApiKey,
      modelName: editModelName,
    });
    setEditingId(null);
  };

  const handleAdd = () => {
    if (!newModelName.trim()) return;
    addModelConfig({
      id: `m-${Date.now()}`,
      provider: newProvider,
      apiBaseUrl: newBaseUrl,
      apiKey: newApiKey,
      modelName: newModelName,
      enabled: true,
      purpose: ['low_cost_batch'],
      maxContext: 128000,
      priceLevel: 'medium',
      speedLevel: 'medium',
      stabilityLevel: 'medium',
      isDefault: false,
    });
    setNewModelName('');
    setNewApiKey('');
    setShowAddForm(false);
  };

  const toggleKey = (id: string) => setShowKeys((p) => ({ ...p, [id]: !p[id] }));

  const priceColor = (level: string) =>
    level === 'low' ? 'text-accent-green' : level === 'medium' ? 'text-accent-yellow' : 'text-accent-red';

  const providerPresets: { provider: ModelProvider; baseUrl: string }[] = [
    { provider: 'datater', baseUrl: 'https://dataler.com/v1' },
    { provider: 'openai', baseUrl: 'https://api.openai.com/v1' },
    { provider: 'anthropic', baseUrl: 'https://api.anthropic.com/v1' },
    { provider: 'google', baseUrl: 'https://generativelanguage.googleapis.com/v1' },
    { provider: 'deepseek', baseUrl: 'https://api.deepseek.com/v1' },
    { provider: 'qwen', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
    { provider: 'kimi', baseUrl: 'https://api.moonshot.cn/v1' },
    { provider: 'glm', baseUrl: 'https://open.bigmodel.cn/api/paas/v4' },
    { provider: 'custom', baseUrl: '' },
  ];

  const handleProviderChange = (provider: ModelProvider) => {
    setNewProvider(provider);
    const preset = providerPresets.find((p) => p.provider === provider);
    if (preset) setNewBaseUrl(preset.baseUrl);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">模型配置</h1>
          <p className="text-sm text-text-secondary mt-1">
            配置 API Key 和模型路由 · 数据保存在浏览器本地存储
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary text-xs flex items-center gap-1.5"
        >
          <Plus size={13} /> 添加模型
        </button>
      </div>

      {/* Dataler quick-setup banner */}
      <div className="panel-card border-accent-cyan/30 bg-accent-cyan/5">
        <div className="flex items-start gap-3">
          <Globe size={20} className="text-accent-cyan shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-accent-cyan">💡 Dataler 中转 API 快速配置</h3>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              在 Dataler 注册获取 API Key → 填入下方 Dataler 配置的 API Key 字段 → 即可调用 GPT-4.1 / Claude / Gemini 等所有模型。
              一个 Key 通吃所有模型，无需科学上网，价格低于官方。
            </p>
            <a
              href="https://dataler.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-accent-cyan mt-2 hover:underline"
            >
              <Globe size={12} /> 前往 Dataler 注册获取 API Key →
            </a>
          </div>
        </div>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="panel-card border-accent-green/30">
          <h3 className="text-sm font-semibold text-text-primary mb-4">添加新模型配置</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-muted block mb-1">供应商</label>
              <select
                value={newProvider}
                onChange={(e) => handleProviderChange(e.target.value as ModelProvider)}
                className="input-field"
              >
                {providerPresets.map((p) => (
                  <option key={p.provider} value={p.provider} className="bg-bg-dark">
                    {MODEL_PROVIDER_LABELS[p.provider]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">模型名称</label>
              <input
                type="text"
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                placeholder="例如 gpt-4.1 / deepseek-chat"
                className="input-field"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">API Base URL</label>
              <input
                type="text"
                value={newBaseUrl}
                onChange={(e) => setNewBaseUrl(e.target.value)}
                className="input-field font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">API Key</label>
              <input
                type="password"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                placeholder="sk-..."
                className="input-field font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowAddForm(false)} className="btn-secondary text-xs">取消</button>
            <button onClick={handleAdd} className="btn-primary text-xs">添加</button>
          </div>
        </div>
      )}

      {/* Security note */}
      <div className="panel-card border-accent-yellow/30 bg-accent-yellow/5">
        <div className="flex items-start gap-3">
          <Shield size={20} className="text-accent-yellow shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-accent-yellow">安全提示</h3>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              API Key 保存在浏览器 localStorage 中，不会上传到服务器。
              正式生产环境应在 Cloudflare Workers 环境变量中配置，前端不存 Key。
              当前版本为前端 MVP，localStorage 仅用于演示。
            </p>
          </div>
        </div>
      </div>

      {/* Model list */}
      <div className="space-y-3">
        {modelConfigs.map((model) => (
          <div
            key={model.id}
            className={`panel-card group hover:border-accent-cyan/20 transition-all ${
              !model.enabled ? 'opacity-50' : ''
            } ${editingId === model.id ? 'border-accent-cyan/40' : ''}`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent-purple/15 border border-accent-purple/20 grid place-items-center">
                  <Server size={18} className="text-accent-purple" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    {MODEL_PROVIDER_LABELS[model.provider]}
                    {model.isDefault && (
                      <span className="chip ml-1.5 bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30 text-[10px]">
                        默认
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-text-muted font-mono">{model.modelName}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => toggleModelEnabled(model.id)}
                  className="shrink-0"
                  title={model.enabled ? '禁用' : '启用'}
                >
                  {model.enabled ? (
                    <CheckCircle size={18} className="text-accent-green" />
                  ) : (
                    <XCircle size={18} className="text-text-muted" />
                  )}
                </button>
                <button
                  onClick={() => removeModelConfig(model.id)}
                  className="shrink-0 text-text-muted hover:text-accent-red transition-colors ml-1"
                  title="删除"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {/* Edit mode */}
            {editingId === model.id ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">API Base URL</label>
                  <input
                    type="text"
                    value={editBaseUrl}
                    onChange={(e) => setEditBaseUrl(e.target.value)}
                    className="input-field font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">API Key</label>
                  <div className="flex gap-2">
                    <input
                      type={showKeys[model.id] ? 'text' : 'password'}
                      value={editApiKey}
                      onChange={(e) => setEditApiKey(e.target.value)}
                      placeholder="在此填入你的 API Key..."
                      className="input-field font-mono text-xs flex-1"
                    />
                    <button
                      onClick={() => toggleKey(model.id)}
                      className="btn-secondary text-xs px-2"
                      title={showKeys[model.id] ? '隐藏' : '显示'}
                    >
                      {showKeys[model.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">模型名称</label>
                  <input
                    type="text"
                    value={editModelName}
                    onChange={(e) => setEditModelName(e.target.value)}
                    className="input-field font-mono text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditingId(null)} className="btn-secondary text-xs">取消</button>
                  <button onClick={() => saveEdit(model.id)} className="btn-primary text-xs">保存</button>
                </div>
              </div>
            ) : (
              /* View mode */
              <>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center p-2 rounded-lg bg-white/5">
                    <DollarSign size={12} className={`mx-auto mb-0.5 ${priceColor(model.priceLevel)}`} />
                    <span className="text-[10px] text-text-muted block">价格</span>
                    <span className={`text-[11px] font-semibold ${priceColor(model.priceLevel)}`}>
                      {model.priceLevel === 'low' ? '低' : model.priceLevel === 'medium' ? '中' : '高'}
                    </span>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-white/5">
                    <Zap size={12} className="mx-auto mb-0.5 text-accent-blue" />
                    <span className="text-[10px] text-text-muted block">速度</span>
                    <span className="text-[11px] font-semibold text-text-secondary">
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

                {/* API Key status */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] text-text-muted uppercase tracking-wider">API Key:</span>
                  {model.apiKey ? (
                    <span className="text-[11px] text-accent-green flex items-center gap-1">
                      <CheckCircle size={10} /> 已配置
                    </span>
                  ) : (
                    <span className="text-[11px] text-accent-yellow flex items-center gap-1">
                      <Shield size={10} /> 未配置 — 点击编辑按钮填入
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-text-muted font-mono truncate mb-3">
                  {model.apiBaseUrl}
                </div>

                {/* Purpose tags */}
                <div className="flex flex-wrap gap-1">
                  {model.purpose.map((p) => (
                    <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-text-muted border border-white/5">
                      {PURPOSE_LABELS[p] || p}
                    </span>
                  ))}
                </div>

                {/* Edit button */}
                <button
                  onClick={() => startEdit(model)}
                  className="mt-3 text-xs text-accent-cyan hover:underline"
                >
                  ✏️ 编辑 API Key / URL
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Routing rules */}
      <div className="panel-card">
        <h2 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Server size={16} /> 模型路由规则
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          <RuleRow label="高价值复杂分析" value="GPT / Claude / Gemini" />
          <RuleRow label="大批量低成本分析" value="DeepSeek / Qwen / Kimi" />
          <RuleRow label="中文运营任务" value="DeepSeek / Qwen / Kimi" />
          <RuleRow label="英文 Listing / 广告语" value="GPT / Claude / Gemini" />
          <RuleRow label="多模态图片理解" value="Gemini / GPT" />
          <RuleRow label="强推理和复杂归因" value="Claude / GPT" />
        </div>
      </div>
    </div>
  );
}

function RuleRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 px-3 rounded-lg bg-white/5 border border-white/5">
      <span className="text-text-muted">{label}</span>
      <span className="text-text-primary font-medium">{value}</span>
    </div>
  );
}
