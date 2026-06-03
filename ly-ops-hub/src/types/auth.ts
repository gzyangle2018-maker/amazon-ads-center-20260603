// ============================================================
// LY-OPS Hub — Auth Type Definitions
// ============================================================

export type UserRole =
  | "admin"
  | "assistant"
  | "ops_assistant"
  | "operator"
  | "designer";

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  department?: string;
  enabled: boolean;
}

export interface RolePermission {
  role: UserRole;
  label: string;
  description: string;
  visibleCategories: string[];
  visibleAgentIds: string[];
  canViewLLMConfig: boolean;
  canViewDeploymentInfo: boolean;
  canAssignAgents: boolean;
  canViewUsageBI: boolean;
  canUseAIChat: boolean;
  canViewDocs: boolean;
  canViewSettings: boolean;
}

// ---- User-Agent Assignment ----

export interface UserAgentAssignment {
  userId: string;
  agentId: string;
  enabled: boolean;
  featurePermissions?: Record<string, boolean>;
  assignedAt: string;
  assignedBy: string;
}

// ---- Usage Log ----

export interface UsageLog {
  id: string;
  userId: string;
  agentId?: string;
  providerId?: string;
  model?: string;
  action: "open_agent" | "send_chat" | "upload_file" | "export_file";
  inputTokens?: number;
  outputTokens?: number;
  estimatedCost?: number;
  createdAt: string;
}
