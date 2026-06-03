// ============================================================
// LY-OPS Hub — Agent Utilities
// ============================================================

import type { AgentTool, AgentCategory, AgentStatus } from "../types/agent";
import { agents } from "../config/agents";

/** Filter agents by multiple criteria */
export function filterAgents(opts: {
  category?: AgentCategory | "all";
  status?: AgentStatus | "all";
  search?: string;
  ownerRole?: AgentTool["ownerRole"];
  llmRequired?: boolean;
}): AgentTool[] {
  let result = [...agents];

  if (opts.category && opts.category !== "all") {
    result = result.filter((a) => a.category === opts.category);
  }
  if (opts.status && opts.status !== "all") {
    result = result.filter((a) => a.status === opts.status);
  }
  if (opts.search && opts.search.trim()) {
    const q = opts.search.toLowerCase();
    result = result.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.tags?.some((t) => t.toLowerCase().includes(q)),
    );
  }
  if (opts.ownerRole) {
    result = result.filter(
      (a) => a.ownerRole === opts.ownerRole || a.ownerRole === "all",
    );
  }
  if (opts.llmRequired !== undefined) {
    result = result.filter((a) => a.llmRequired === opts.llmRequired);
  }

  return result;
}

/** Sort agents by priority descending */
export function sortByPriority(list: AgentTool[]): AgentTool[] {
  return [...list].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}
