// ============================================================
// LY-OPS Hub — Agent Deployment Registry
// ============================================================

import type { AgentDeployment } from "../types/deployment";

export const deployments: AgentDeployment[] = [
  {
    agentId: "stock-helper",
    platform: "cloudflare_pages",
    projectName: "amazon-stock-helper",
    repositoryUrl:
      "https://github.com/gzyangle2018-maker/amazon-inventory-assistant-20260528-v3-success",
    productionBranch: "main",
    buildCommand: "npm run build",
    outputDirectory: "dist",
    productionUrl: "https://amazon-stock-helper.pages.dev",
    customDomain: "",
    environmentVariables: [
      "VITE_APP_NAME",
      "VITE_PUBLIC_SITE_URL",
      "VITE_API_BASE_URL",
      "VITE_AUTH_ENABLED",
    ],
    lastKnownStatus: "unknown",
    rollbackNote: "Cloudflare Pages 后台可回滚到历史 deployment",
  },
];

export function getDeployment(agentId: string): AgentDeployment | undefined {
  return deployments.find((d) => d.agentId === agentId);
}
