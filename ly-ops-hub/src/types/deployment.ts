// ============================================================
// LY-OPS Hub — Deployment & Embed Type Definitions
// ============================================================

export type DeployPlatform =
  | "cloudflare_pages"
  | "vercel"
  | "zeabur"
  | "railway"
  | "render"
  | "vps"
  | "local"
  | "unknown";

export type EmbedMode =
  | "iframe"
  | "internal_route"
  | "external_url"
  | "api_agent";

export type FramePolicyStatus = "unknown" | "allowed" | "blocked";

export interface AgentDeployment {
  agentId: string;
  platform: DeployPlatform;
  projectName: string;
  repositoryUrl?: string;
  productionBranch?: string;
  buildCommand?: string;
  outputDirectory?: string;
  productionUrl: string;
  previewUrl?: string;
  customDomain?: string;
  environmentVariables?: string[];
  lastDeployAt?: string;
  lastKnownStatus?: "healthy" | "warning" | "down" | "unknown";
  rollbackNote?: string;
  owner?: string;
  notes?: string;
}

export interface AgentEmbedConfig {
  agentId: string;
  embedMode: EmbedMode;
  embedAllowed: boolean;
  framePolicyStatus: FramePolicyStatus;
  fallbackOpenExternal: boolean;
  allowedParentOrigin?: string;
  hideUrlForNonAdmin: boolean;
  sandbox?: string;
}

// ---- Platform metadata ----

export const PLATFORM_META: Record<DeployPlatform, { label: string; icon: string }> = {
  cloudflare_pages: { label: "Cloudflare Pages", icon: "☁️" },
  vercel: { label: "Vercel", icon: "▲" },
  zeabur: { label: "Zeabur", icon: "⚡" },
  railway: { label: "Railway", icon: "🚂" },
  render: { label: "Render", icon: "🔄" },
  vps: { label: "VPS", icon: "🖥️" },
  local: { label: "本地", icon: "💻" },
  unknown: { label: "未知", icon: "❓" },
};
