// ============================================================
// LY-OPS Hub — Agent Embed Configuration Registry
// ============================================================

import type { AgentEmbedConfig } from "../types/deployment";

export const embedConfigs: AgentEmbedConfig[] = [
  {
    agentId: "stock-helper",
    embedMode: "iframe",
    embedAllowed: true,
    framePolicyStatus: "unknown",
    fallbackOpenExternal: true,
    allowedParentOrigin: "pending",
    hideUrlForNonAdmin: true,
    sandbox:
      "allow-scripts allow-forms allow-downloads allow-same-origin allow-popups",
  },
];

export function getEmbedConfig(
  agentId: string,
): AgentEmbedConfig | undefined {
  return embedConfigs.find((e) => e.agentId === agentId);
}
