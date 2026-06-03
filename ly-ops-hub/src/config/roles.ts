// ============================================================
// LY-OPS Hub — Role Permissions Configuration
// ============================================================

import type { RolePermission, UserRole } from "../types/auth";

export const ROLE_PERMISSIONS: Record<UserRole, RolePermission> = {
  admin: {
    role: "admin",
    label: "管理员",
    description: "我本人，拥有全部权限。全部 Agent、全部状态、部署信息、LLM 配置、权限管理、使用 BI。",
    visibleCategories: [],
    visibleAgentIds: [],
    canViewLLMConfig: true,
    canViewDeploymentInfo: true,
    canAssignAgents: true,
    canViewUsageBI: true,
    canUseAIChat: true,
    canViewDocs: true,
    canViewSettings: true,
  },
  assistant: {
    role: "assistant",
    label: "助理",
    description: "店铺安全、申诉、发货、提款、邮件。只看管理员分配的已上线 Agent。",
    visibleCategories: ["backend_support"],
    visibleAgentIds: [
      "3c-appeal-v1",
      "counterattack-master",
      "risk-warning",
      "stock-helper",
    ],
    canViewLLMConfig: false,
    canViewDeploymentInfo: false,
    canAssignAgents: false,
    canViewUsageBI: false,
    canUseAIChat: false,
    canViewDocs: false,
    canViewSettings: false,
  },
  ops_assistant: {
    role: "ops_assistant",
    label: "运营助理",
    description: "转化：Creator 站外、Listing、作图、私域。只看已上线的转化和流量类 Agent。",
    visibleCategories: ["conversion", "traffic"],
    visibleAgentIds: [
      "listing-optimize-v1",
      "3c-listing-master-v2",
      "3c-listing-master-v2.1",
      "qa-master",
      "ai-image-gen-v2",
      "ai-video-v1",
      "ai-video-v2",
      "viral-video-fusion-v3",
      "negative-review-v1",
      "creator-master",
      "offsite-outreach",
    ],
    canViewLLMConfig: false,
    canViewDeploymentInfo: false,
    canAssignAgents: false,
    canViewUsageBI: false,
    canUseAIChat: false,
    canViewDocs: false,
    canViewSettings: false,
  },
  operator: {
    role: "operator",
    label: "运营",
    description: "投流：站内广告、关联流量、秒杀、促销、品牌功能、运营数据。",
    visibleCategories: ["traffic", "data_analysis"],
    visibleAgentIds: [
      "ad-master-v1",
      "ad-master-v1.1",
      "ad-master-v1.2",
      "ad-master-v2",
      "ad-master-v3",
      "algorithm-feeding",
      "daily-keyword-tracker",
      "sales-summary",
      "weekly-ad-report",
      "weekly-aba-trend",
      "weekly-inventory-master",
    ],
    canViewLLMConfig: false,
    canViewDeploymentInfo: false,
    canAssignAgents: false,
    canViewUsageBI: false,
    canUseAIChat: false,
    canViewDocs: false,
    canViewSettings: false,
  },
  designer: {
    role: "designer",
    label: "美工",
    description: "AI 图片、AI 视频、月销量大于 300 的产品视觉任务。",
    visibleCategories: ["conversion"],
    visibleAgentIds: [
      "ai-image-gen-v2",
      "ai-video-v1",
      "ai-video-v2",
      "viral-video-fusion-v3",
      "watermark-remover",
    ],
    canViewLLMConfig: false,
    canViewDeploymentInfo: false,
    canAssignAgents: false,
    canViewUsageBI: false,
    canUseAIChat: false,
    canViewDocs: false,
    canViewSettings: false,
  },
};

// ---- Role display helpers ----

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "管理员",
  assistant: "助理",
  ops_assistant: "运营助理",
  operator: "运营",
  designer: "美工",
};

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role] ?? role;
}
