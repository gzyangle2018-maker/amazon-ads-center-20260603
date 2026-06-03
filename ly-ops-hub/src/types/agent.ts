// ============================================================
// LY-OPS Hub — Agent Type Definitions
// ============================================================

export type AgentStatus = "online" | "developing" | "planned" | "paused";

export type AgentCategory =
  | "data_analysis"
  | "operation_plan"
  | "market"
  | "conversion"
  | "traffic"
  | "backend_support"
  | "management";

export type AgentEntryType =
  | "external_url"
  | "internal_route"
  | "api_agent"
  | "placeholder";

import type { UserRole } from "./auth";

export type EmbedMode = "iframe" | "internal_route" | "external_url" | "api_agent";

export interface AgentFeature {
  id: string;
  name: string;
  description?: string;
  enabledByDefault?: boolean;
  requiredRole?: UserRole[];
}

export interface AgentTool {
  id: string;
  name: string;
  category: AgentCategory;
  subCategory?: string;
  version?: string;
  description: string;
  details?: string;
  steps?: string[];
  status: AgentStatus;
  entryType: AgentEntryType;
  url?: string;
  githubUrl?: string;
  docsUrl?: string;
  tags?: string[];
  ownerRole?: "admin" | "operator" | "designer" | "assistant" | "all";
  llmRequired?: boolean;
  llmProfileId?: string;
  priority?: number;
  // v2 fields
  embedMode?: EmbedMode;
  showUrlToRoles?: UserRole[];
  hideTechnicalInfoForNonAdmin?: boolean;
  features?: AgentFeature[];
  deploymentId?: string;
  embedConfigId?: string;
  dataSensitivity?: "low" | "medium" | "high";
  costLevel?: "free" | "low" | "medium" | "high";
  requiresFileUpload?: boolean;
  supportedFileTypes?: string[];
  owner?: string;
  lastReviewedAt?: string;
}

// ---- Category metadata ----

export interface CategoryMeta {
  key: AgentCategory;
  label: string;
  icon: string;
  description: string;
}

export const CATEGORY_META: CategoryMeta[] = [
  {
    key: "data_analysis",
    label: "数据分析",
    icon: "📊",
    description: "数据报表、趋势分析、销量追踪",
  },
  {
    key: "operation_plan",
    label: "运营计划",
    icon: "📋",
    description: "推广计划、二次激活、运营策略",
  },
  {
    key: "market",
    label: "市场数据",
    icon: "🌍",
    description: "市场分析、供应链、卖点解析",
  },
  {
    key: "conversion",
    label: "转化",
    icon: "🔄",
    description: "Listing 优化、QA、AI 生图/视频",
  },
  {
    key: "traffic",
    label: "流量",
    icon: "🚀",
    description: "广告分析、站外投放、算法投喂",
  },
  {
    key: "backend_support",
    label: "后端支持",
    icon: "🔧",
    description: "申诉、库存、绩效、风控",
  },
  {
    key: "management",
    label: "管理",
    icon: "🏛️",
    description: "组织、权限、系统配置",
  },
];

// ---- Status metadata ----

export interface StatusMeta {
  key: AgentStatus;
  label: string;
  color: string;
  bgColor: string;
}

export const STATUS_META: StatusMeta[] = [
  {
    key: "online",
    label: "已上线",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20 ring-emerald-500/30",
  },
  {
    key: "developing",
    label: "开发中",
    color: "text-amber-400",
    bgColor: "bg-amber-500/20 ring-amber-500/30",
  },
  {
    key: "planned",
    label: "规划中",
    color: "text-sky-400",
    bgColor: "bg-sky-500/20 ring-sky-500/30",
  },
  {
    key: "paused",
    label: "已暂停",
    color: "text-gray-400",
    bgColor: "bg-gray-500/20 ring-gray-500/30",
  },
];

export function getCategoryMeta(key: AgentCategory): CategoryMeta {
  return (
    CATEGORY_META.find((c) => c.key === key) ?? CATEGORY_META[0]
  );
}

export function getStatusMeta(key: AgentStatus): StatusMeta {
  return (
    STATUS_META.find((s) => s.key === key) ?? STATUS_META[3]
  );
}
