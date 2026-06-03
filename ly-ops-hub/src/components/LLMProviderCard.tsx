// ============================================================
// LY-OPS Hub — LLM Provider Card (editable)
// ============================================================

import { useState } from "react";
import type { LLMProviderConfig } from "../types/llm";
import { getRegionMeta } from "../types/llm";

interface LLMProviderCardProps {
  provider: LLMProviderConfig;
  onToggle: (id: string) => void;
  onUpdate: (id: string, field: "baseUrl" | "defaultModel", value: string) => void;
}

export default function LLMProviderCard({ provider, onToggle, onUpdate }: LLMProviderCardProps) {
  const regionMeta = getRegionMeta(provider.region);
  const [editing, setEditing] = useState(false);
  const [editBaseUrl, setEditBaseUrl] = useState(provider.baseUrl);
  const [editModel, setEditModel] = useState(provider.defaultModel);

  const handleSave = () => {
    onUpdate(provider.id, "baseUrl", editBaseUrl);
    onUpdate(provider.id, "defaultModel", editModel);
    setEditing(false);
  };

  return (
    <div className={`rounded-2xl border p-5 transition ${
      provider.enabled
        ? "border-emerald-500/20 bg-emerald-500/[0.03]"
        : "border-white/10 bg-white/[0.03] opacity-60 hover:opacity-80"
    }`}>
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{provider.name}</h3>
          <p className="text-xs text-gray-500">
            {regionMeta.label} · <code className="text-indigo-400">{provider.id}</code>
            {provider.protocol && (
              <span className="ml-1 text-gray-600">({provider.protocol})</span>
            )}
          </p>
        </div>
        <button
          onClick={() => onToggle(provider.id)}
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition cursor-pointer ${
            provider.enabled
              ? "bg-emerald-500/20 text-emerald-400 ring-emerald-500/30 hover:bg-emerald-500/30"
              : "bg-gray-500/20 text-gray-500 ring-gray-500/30 hover:bg-gray-500/30"
          }`}
        >
          {provider.enabled ? "✓ 已启用" : "未启用"}
        </button>
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm">
        {editing ? (
          <>
            <div>
              <label className="text-xs text-gray-500">Base URL</label>
              <input
                value={editBaseUrl}
                onChange={(e) => setEditBaseUrl(e.target.value)}
                placeholder="https://api.example.com/v1"
                className="mt-0.5 w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white outline-none focus:border-indigo-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">默认模型</label>
              <input
                value={editModel}
                onChange={(e) => setEditModel(e.target.value)}
                placeholder="model-name"
                className="mt-0.5 w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white outline-none focus:border-indigo-500/50"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white"
              >
                保存
              </button>
              <button
                onClick={() => setEditing(false)}
                className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-gray-400"
              >
                取消
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Base URL:</span>
              <code className="rounded bg-white/5 px-2 py-0.5 text-xs text-gray-300 truncate max-w-[200px]">
                {provider.baseUrl || "(待配置)"}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">默认模型:</span>
              <code className="rounded bg-white/5 px-2 py-0.5 text-xs text-indigo-400">
                {provider.defaultModel || "(待配置)"}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">环境变量:</span>
              <code className="rounded bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
                {provider.apiKeyEnvName}
              </code>
            </div>
            {provider.models.length > 0 && (
              <div>
                <span className="text-xs text-gray-600">可用模型:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {provider.models.map((m) => (
                    <code key={m} className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-gray-400">
                      {m}
                    </code>
                  ))}
                </div>
              </div>
            )}
            {provider.docsUrl && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">文档:</span>
                <a href={provider.docsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:underline">
                  {provider.docsUrl}
                </a>
              </div>
            )}
            {provider.note && (
              <p className="rounded-lg bg-indigo-500/10 px-3 py-2 text-xs text-indigo-300">
                💡 {provider.note}
              </p>
            )}
            <button
              onClick={() => {
                setEditBaseUrl(provider.baseUrl);
                setEditModel(provider.defaultModel);
                setEditing(true);
              }}
              className="mt-1 rounded-lg bg-white/5 px-3 py-1 text-xs text-gray-500 transition hover:bg-white/10 hover:text-gray-300"
            >
              ✏️ 编辑
            </button>
          </>
        )}
      </div>
    </div>
  );
}
