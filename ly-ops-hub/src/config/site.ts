// ============================================================
// LY-OPS Hub — Site Configuration
// ============================================================

export const SITE_CONFIG = {
  brand: "LY-OPS",
  subtitle: "LeoYoung Ops Control Center",
  tagline: "幕后操盘手 L 的亚马逊运营 AI 中台",
  version: "1.0.0",
  phase: "Phase 1 — 总控台",
};

export const NAV_LINKS = [
  { path: "/", label: "首页", icon: "🏠" },
  { path: "/agents", label: "Agent 中心", icon: "🤖" },
  { path: "/llm", label: "LLM 配置", icon: "🧠" },
  { path: "/settings", label: "系统配置", icon: "⚙️" },
  { path: "/docs", label: "文档", icon: "📖" },
] as const;
