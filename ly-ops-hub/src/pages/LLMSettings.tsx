// ============================================================
// LY-OPS Hub — LLM Configuration Center (admin only, interactive)
// ============================================================

import { useState, useCallback } from "react";
import type { LLMRegion } from "../types/llm";
import { REGION_META } from "../types/llm";
import { llmProviders as defaultProviders } from "../config/llmProviders";
import LLMProviderCard from "../components/LLMProviderCard";
import type { LLMProviderConfig } from "../types/llm";

const STORAGE_KEY = "lyops_llm_overrides";

function loadOverrides(): Record<string, Partial<LLMProviderConfig>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveOverrides(overrides: Record<string, Partial<LLMProviderConfig>>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

export default function LLMSettings() {
  const [region, setRegion] = useState<LLMRegion | "all">("all");
  const [overrides, setOverrides] = useState<Record<string, Partial<LLMProviderConfig>>>(loadOverrides);
  const [saved, setSaved] = useState(false);

  // Merge defaults with localStorage overrides
  const providers = defaultProviders.map((p) => ({
    ...p,
    ...overrides[p.id],
  }));

  const filtered =
    region === "all"
      ? providers
      : providers.filter((p) => p.region === region);

  const handleToggle = useCallback(
    (id: string) => {
      const provider = providers.find((p) => p.id === id);
      if (!provider) return;
      const next = {
        ...overrides,
        [id]: { ...overrides[id], enabled: !provider.enabled },
      };
      setOverrides(next);
      saveOverrides(next);
      flashSaved();
    },
    [overrides, providers],
  );

  const handleUpdate = useCallback(
    (id: string, field: "baseUrl" | "defaultModel", value: string) => {
      const next = {
        ...overrides,
        [id]: { ...overrides[id], [field]: value },
      };
      setOverrides(next);
      saveOverrides(next);
      flashSaved();
    },
    [overrides],
  );

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">🧠 LLM 配置中心</h1>
          <p className="mt-1 text-sm text-gray-500">
            管理所有 LLM Provider · 修改自动保存到本地
          </p>
        </div>
        {saved && (
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
            ✅ 已保存
          </span>
        )}
      </div>

      {/* ⚠️ Security notice */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-semibold text-amber-400">安全提示</h3>
            <p className="mt-1 text-sm leading-relaxed text-gray-400">
              API Key 决不能暴露在前端。当前通过 <code className="text-amber-300">apiKeyEnvName</code>{" "}
              引用环境变量。后续将 Key 放到：
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-gray-500">
              <li>Cloudflare Workers Secrets</li>
              <li>Supabase Edge Functions / Vault</li>
              <li>Zeabur / Railway 环境变量</li>
              <li>自建 API Gateway 反向代理</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Region tabs */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setRegion("all")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            region === "all"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
              : "bg-white/5 text-gray-300 hover:bg-white/10"
          }`}>
          全部 ({providers.length})
        </button>
        {REGION_META.map((r) => {
          const count = providers.filter((p) => p.region === r.key).length;
          return (
            <button key={r.key} onClick={() => setRegion(r.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                region === r.key
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                  : "bg-white/5 text-gray-300 hover:bg-white/10"
              }`}>
              {r.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Provider list */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <LLMProviderCard
            key={p.id}
            provider={p}
            onToggle={handleToggle}
            onUpdate={handleUpdate}
          />
        ))}
      </div>
    </div>
  );
}
