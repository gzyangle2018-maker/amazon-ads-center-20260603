// ============================================================
// LY-OPS Hub — Permission Utilities
// ============================================================

import type { AgentTool } from "../types/agent";
import type { User, UserAgentAssignment, UserRole } from "../types/auth";
import { ROLE_PERMISSIONS } from "../config/roles";
import { agents as allAgents } from "../config/agents";

// ── User helpers ───────────────────────────────────────

export function isAdmin(user: User | null): boolean {
  return user?.role === "admin";
}

export function getUserRole(user: User | null): UserRole | null {
  return user?.role ?? null;
}

// ── Agent visibility ────────────────────────────────────

/** Get all assignments from localStorage */
export function getAssignments(): UserAgentAssignment[] {
  try {
    const raw = localStorage.getItem("lyops_assignments");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Save assignments to localStorage */
export function saveAssignments(assignments: UserAgentAssignment[]): void {
  localStorage.setItem("lyops_assignments", JSON.stringify(assignments));
}

/** Get assigned agent IDs for a user (merged: role defaults + explicit assignments) */
export function getAssignedAgentIds(user: User | null): Set<string> {
  if (!user) return new Set();
  if (isAdmin(user)) {
    // Admin sees all
    return new Set(allAgents.map((a) => a.id));
  }

  const perm = ROLE_PERMISSIONS[user.role];
  const ids = new Set(perm.visibleAgentIds);

  // Merge explicit assignments from localStorage
  const assignments = getAssignments();
  for (const a of assignments) {
    if (a.userId === user.id) {
      if (a.enabled) ids.add(a.agentId);
      else ids.delete(a.agentId);
    }
  }
  return ids;
}

/** Can this user view this agent? */
export function canViewAgent(user: User | null, agent: AgentTool): boolean {
  if (!user) return false;
  if (isAdmin(user)) return true;

  // Non-admin: only online + assigned
  if (agent.status !== "online") return false;
  return getAssignedAgentIds(user).has(agent.id);
}

/** Filter agents by user visibility */
export function filterAgentsByUser(
  user: User | null,
  agentList: AgentTool[],
): AgentTool[] {
  if (!user) return [];
  if (isAdmin(user)) return agentList;
  const ids = getAssignedAgentIds(user);
  return agentList.filter(
    (a) => a.status === "online" && ids.has(a.id),
  );
}

// ── Feature permissions ─────────────────────────────────

/** Can this user use a specific feature of an agent? */
export function canUseFeature(
  user: User | null,
  agentId: string,
  featureId: string,
): boolean {
  if (!user) return false;
  if (isAdmin(user)) return true;

  const assignments = getAssignments();
  const assignment = assignments.find(
    (a) => a.userId === user.id && a.agentId === agentId,
  );
  if (!assignment) return false;
  if (!assignment.featurePermissions) {
    // If no features explicitly set, look at agent defaults
    const agent = allAgents.find((a) => a.id === agentId);
    const feat = agent?.features?.find((f) => f.id === featureId);
    return feat?.enabledByDefault ?? true;
  }
  return assignment.featurePermissions[featureId] ?? false;
}

// ── UI visibility helpers ────────────────────────────────

export function canViewLLMConfig(user: User | null): boolean {
  if (!user) return false;
  return ROLE_PERMISSIONS[user.role]?.canViewLLMConfig ?? false;
}

export function canViewDeploymentInfo(user: User | null): boolean {
  if (!user) return false;
  return ROLE_PERMISSIONS[user.role]?.canViewDeploymentInfo ?? false;
}

export function canAssignAgents(user: User | null): boolean {
  if (!user) return false;
  return ROLE_PERMISSIONS[user.role]?.canAssignAgents ?? false;
}

export function canViewUsageBI(user: User | null): boolean {
  if (!user) return false;
  return ROLE_PERMISSIONS[user.role]?.canViewUsageBI ?? false;
}

export function canUseAIChat(user: User | null): boolean {
  if (!user) return false;
  return ROLE_PERMISSIONS[user.role]?.canUseAIChat ?? false;
}

export function canViewDocs(user: User | null): boolean {
  if (!user) return false;
  return ROLE_PERMISSIONS[user.role]?.canViewDocs ?? false;
}

export function canViewSettings(user: User | null): boolean {
  if (!user) return false;
  return ROLE_PERMISSIONS[user.role]?.canViewSettings ?? false;
}

// ── Usage logging ────────────────────────────────────────

export function logUsage(log: Omit<import("../types/auth").UsageLog, "id" | "createdAt">): void {
  try {
    const raw = localStorage.getItem("lyops_usage_logs");
    const logs: import("../types/auth").UsageLog[] = raw ? JSON.parse(raw) : [];
    logs.push({
      ...log,
      id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
      createdAt: new Date().toISOString(),
    });
    // Keep last 1000 entries
    if (logs.length > 1000) logs.splice(0, logs.length - 1000);
    localStorage.setItem("lyops_usage_logs", JSON.stringify(logs));
  } catch { /* ignore */ }
}

export function getUsageLogs(): import("../types/auth").UsageLog[] {
  try {
    const raw = localStorage.getItem("lyops_usage_logs");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
