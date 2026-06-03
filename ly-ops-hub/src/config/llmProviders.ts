// ============================================================
// LY-OPS Hub — LLM Provider Registry (v2)
// 所有 API Key 均通过 apiKeyEnvName 引用环境变量。
// 前端不存储任何真实 Key。
// ============================================================

import type { LLMProviderConfig } from "../types/llm";

export const llmProviders: LLMProviderConfig[] = [
  // ── 中转 API ──────────────────────────────────────────────
  {
    id: "dataler",
    name: "Dataler 中转 API",
    type: "dataler",
    enabled: true,
    baseUrl: "",
    apiKeyEnvName: "DATALER_API_KEY",
    defaultModel: "gpt-5.5",
    models: [
      "gpt-5.5",
      "claude-4.6",
      "gemini-3.1-pro",
      "gemini-3.5-flash",
    ],
    region: "relay",
    protocol: "openai-compatible",
    docsUrl: "https://jqm6hiro8q.apifox.cn/",
    note: "Apifox 地址仅作文档参考，真实 baseUrl 从环境变量 VITE_DATALER_BASE_URL 配置",
  },

  // ── 海外 API ──────────────────────────────────────────────
  {
    id: "openai",
    name: "OpenAI",
    type: "openai",
    enabled: false,
    baseUrl: "https://api.openai.com/v1",
    apiKeyEnvName: "OPENAI_API_KEY",
    defaultModel: "gpt-5.5",
    models: [
      "gpt-5.5",
      "gpt-5.5-thinking",
      "gpt-5.4",
      "gpt-5.3-instant",
    ],
    region: "global",
    protocol: "openai-responses",
  },
  {
    id: "anthropic",
    name: "Claude (Anthropic)",
    type: "anthropic",
    enabled: false,
    baseUrl: "https://api.anthropic.com/v1",
    apiKeyEnvName: "ANTHROPIC_API_KEY",
    defaultModel: "claude-4.6",
    models: [
      "claude-4.6",
      "claude-4.6-sonnet",
      "claude-4.6-opus",
    ],
    region: "global",
    protocol: "anthropic-messages",
  },
  {
    id: "gemini",
    name: "Gemini",
    type: "gemini",
    enabled: false,
    baseUrl: "https://generativelanguage.googleapis.com",
    apiKeyEnvName: "GEMINI_API_KEY",
    defaultModel: "gemini-3.1-pro",
    models: [
      "gemini-3.1-pro",
      "gemini-3.5-flash",
    ],
    region: "global",
    protocol: "gemini-native",
  },
  {
    id: "gemini-openai",
    name: "Gemini OpenAI Compatible",
    type: "gemini-openai",
    enabled: false,
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
    apiKeyEnvName: "GEMINI_API_KEY",
    defaultModel: "gemini-2.5-flash",
    models: ["gemini-2.5-flash"],
    region: "global",
    protocol: "openai-compatible",
  },

  // ── 国内模型 ──────────────────────────────────────────────
  {
    id: "deepseek",
    name: "DeepSeek",
    type: "deepseek",
    enabled: false,
    baseUrl: "https://api.deepseek.com",
    apiKeyEnvName: "DEEPSEEK_API_KEY",
    defaultModel: "deepseek-v4-pro",
    models: [
      "deepseek-v4-pro",
      "deepseek-v4-flash",
    ],
    region: "china",
    protocol: "openai-compatible",
    note: "性价比极高，推荐作为默认推理 Provider",
  },
  {
    id: "qwen",
    name: "Qwen / 阿里云百炼",
    type: "qwen",
    enabled: false,
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    apiKeyEnvName: "DASHSCOPE_API_KEY",
    defaultModel: "qwen-max",
    models: [
      "qwen-max",
      "qwen-plus",
      "qwen-turbo",
    ],
    region: "china",
    protocol: "openai-compatible",
  },
  {
    id: "doubao",
    name: "Doubao / 火山方舟",
    type: "doubao",
    enabled: false,
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    apiKeyEnvName: "ARK_API_KEY",
    defaultModel: "doubao-seed-1-6",
    models: [
      "doubao-seed-1-6",
      "doubao-seed-1-6-thinking",
    ],
    region: "china",
    protocol: "openai-compatible",
  },
  {
    id: "moonshot",
    name: "Moonshot / Kimi",
    type: "moonshot",
    enabled: false,
    baseUrl: "https://api.moonshot.cn/v1",
    apiKeyEnvName: "MOONSHOT_API_KEY",
    defaultModel: "kimi-k2.6",
    models: [
      "kimi-k2.6",
      "kimi-k2.5",
      "kimi-k2-thinking",
    ],
    region: "china",
    protocol: "openai-compatible",
    note: "超长上下文，适合大批量文档分析",
  },

  // ── 自定义 ──────────────────────────────────────────────
  {
    id: "custom",
    name: "自定义模型接口",
    type: "custom",
    enabled: false,
    baseUrl: "",
    apiKeyEnvName: "CUSTOM_LLM_API_KEY",
    defaultModel: "",
    models: [],
    region: "relay",
    protocol: "openai-compatible",
    note: "兼容 OpenAI API 格式的任何第三方或自部署模型",
  },
];

// ── Derived helpers ──────────────────────────────────────────

export function getProvidersByRegion(region: string): LLMProviderConfig[] {
  return llmProviders.filter((p) => p.region === region);
}

export function getProviderById(id: string): LLMProviderConfig | undefined {
  return llmProviders.find((p) => p.id === id);
}

export function getEnabledProviders(): LLMProviderConfig[] {
  return llmProviders.filter((p) => p.enabled);
}
