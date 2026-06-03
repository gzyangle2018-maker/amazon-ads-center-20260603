// ============================================================
// LY-OPS Hub — LLM Type Definitions
// ============================================================

export type LLMProtocol =
  | "openai-compatible"
  | "openai-responses"
  | "anthropic-messages"
  | "gemini-native";

export type LLMProviderType =
  | "openai"
  | "anthropic"
  | "gemini"
  | "gemini-openai"
  | "deepseek"
  | "qwen"
  | "doubao"
  | "zhipu"
  | "moonshot"
  | "openrouter"
  | "oneapi"
  | "dataler"
  | "custom";

export type LLMRegion = "global" | "china" | "relay" | "local";

export interface LLMModel {
  id: string;
  name: string;
  contextWindow?: number;
  maxTokens?: number;
}

export interface LLMProviderConfig {
  id: string;
  name: string;
  type: LLMProviderType;
  enabled: boolean;
  baseUrl: string;
  apiKeyEnvName: string;
  defaultModel: string;
  models: string[];
  region: LLMRegion;
  protocol?: LLMProtocol;
  docsUrl?: string;
  note?: string;
}

// ---- Region metadata ----

export interface RegionMeta {
  key: LLMRegion;
  label: string;
  description: string;
}

export const REGION_META: RegionMeta[] = [
  {
    key: "global",
    label: "海外 API",
    description: "OpenAI / Anthropic / Google 等国际模型",
  },
  {
    key: "china",
    label: "国内模型",
    description: "DeepSeek / 通义千问 / 豆包 / 智谱 / Kimi",
  },
  {
    key: "relay",
    label: "中转 API",
    description: "OpenRouter / OneAPI / 自定义中转",
  },
  {
    key: "local",
    label: "自定义接口",
    description: "Custom Provider / 本地部署",
  },
];

export function getRegionMeta(key: LLMRegion): RegionMeta {
  return (
    REGION_META.find((r) => r.key === key) ?? REGION_META[3]
  );
}

// ---- Agent Run types (reserved for future) ----

export interface AgentRunRequest {
  agentId: string;
  inputType: "text" | "file" | "url" | "mixed";
  inputText?: string;
  fileIds?: string[];
  params?: Record<string, unknown>;
  llmProviderId?: string;
  model?: string;
  userId?: string;
  role?: "admin" | "operator" | "designer" | "assistant";
}

export interface AgentRunResult {
  taskId: string;
  agentId: string;
  status: "success" | "failed" | "running" | "queued";
  summary?: string;
  outputText?: string;
  outputFiles?: {
    name: string;
    url: string;
    type: "excel" | "pdf" | "image" | "markdown" | "json";
  }[];
  logs?: string[];
  createdAt: string;
}
