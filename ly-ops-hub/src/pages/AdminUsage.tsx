// ============================================================
// LY-OPS Hub — Admin: Usage BI
// ============================================================

import { useState, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { agents } from "../config/agents";
import { llmProviders } from "../config/llmProviders";
import { getUsageLogs } from "../utils/permission";
import type { UsageLog } from "../types/auth";

// ── Mock data generators (Phase 1) ──────────────────────────

function generateMockLogs(): UsageLog[] {
  const realLogs = getUsageLogs();
  if (realLogs.length > 50) return realLogs;

  const mockUsers = [
    "u-001", "u-002", "u-003", "u-004", "u-005",
  ];
  const mockAgents = agents.filter((a) => a.status === "online" || a.status === "developing");
  const mockProviders = llmProviders.filter((p) => p.enabled);
  const actions: UsageLog["action"][] = [
    "open_agent",
    "send_chat",
    "upload_file",
    "export_file",
  ];

  const logs: UsageLog[] = [...realLogs];
  const now = Date.now();

  for (let i = 0; i < 200; i++) {
    const action = actions[Math.floor(Math.random() * actions.length)];
    const agent = mockAgents[Math.floor(Math.random() * mockAgents.length)];
    const provider =
      mockProviders[Math.floor(Math.random() * mockProviders.length)];
    const inputTokens = Math.floor(Math.random() * 8000);
    const outputTokens = Math.floor(Math.random() * 4000);

    logs.push({
      id: `mock-${i}`,
      userId: mockUsers[Math.floor(Math.random() * mockUsers.length)],
      agentId: action === "open_agent" ? agent.id : undefined,
      providerId: action === "send_chat" ? provider.id : undefined,
      model: action === "send_chat" ? provider.defaultModel : undefined,
      action,
      inputTokens: action === "send_chat" ? inputTokens : undefined,
      outputTokens: action === "send_chat" ? outputTokens : undefined,
      estimatedCost:
        action === "send_chat"
          ? (inputTokens / 1_000_000) * 2 + (outputTokens / 1_000_000) * 8
          : undefined,
      createdAt: new Date(
        now - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
      ).toISOString(),
    });
  }

  return logs;
}

const USER_NAMES: Record<string, string> = {
  "u-001": "Leo (admin)",
  "u-002": "助理小陈",
  "u-003": "运营助理小李",
  "u-004": "运营小王",
  "u-005": "美工小张",
};

export default function AdminUsage() {
  const { user: _admin } = useAuth();
  const logs = useMemo(() => generateMockLogs(), []);
  const [tab, setTab] = useState<"overview" | "users" | "agents" | "providers">("overview");

  // ── Computed stats ─────────────────────────────────

  const totalCalls = logs.length;
  const totalInputTokens = logs.reduce(
    (s, l) => s + (l.inputTokens ?? 0),
    0,
  );
  const totalOutputTokens = logs.reduce(
    (s, l) => s + (l.outputTokens ?? 0),
    0,
  );
  const totalCost = logs.reduce((s, l) => s + (l.estimatedCost ?? 0), 0);

  const chatLogs = logs.filter((l) => l.action === "send_chat");
  const agentLogs = logs.filter((l) => l.action === "open_agent");

  // Per user
  const userStats = useMemo(() => {
    const map: Record<string, { calls: number; tokens: number; cost: number }> = {};
    for (const l of logs) {
      if (!map[l.userId])
        map[l.userId] = { calls: 0, tokens: 0, cost: 0 };
      map[l.userId].calls++;
      map[l.userId].tokens += (l.inputTokens ?? 0) + (l.outputTokens ?? 0);
      map[l.userId].cost += l.estimatedCost ?? 0;
    }
    return Object.entries(map).sort((a, b) => b[1].calls - a[1].calls);
  }, [logs]);

  // Per agent
  const agentStats = useMemo(() => {
    const map: Record<string, { calls: number; name: string }> = {};
    for (const l of agentLogs) {
      if (!l.agentId) continue;
      if (!map[l.agentId]) map[l.agentId] = { calls: 0, name: "" };
      map[l.agentId].calls++;
      const agent = agents.find((a) => a.id === l.agentId);
      map[l.agentId].name = agent?.name ?? l.agentId;
    }
    return Object.entries(map).sort((a, b) => b[1].calls - a[1].calls);
  }, [agentLogs]);

  // Per provider
  const providerStats = useMemo(() => {
    const map: Record<string, { calls: number; tokens: number; cost: number; name: string }> = {};
    for (const l of chatLogs) {
      if (!l.providerId) continue;
      if (!map[l.providerId])
        map[l.providerId] = { calls: 0, tokens: 0, cost: 0, name: "" };
      map[l.providerId].calls++;
      map[l.providerId].tokens +=
        (l.inputTokens ?? 0) + (l.outputTokens ?? 0);
      map[l.providerId].cost += l.estimatedCost ?? 0;
      const p = llmProviders.find((x) => x.id === l.providerId);
      map[l.providerId].name = p?.name ?? l.providerId;
    }
    return Object.entries(map).sort((a, b) => b[1].calls - a[1].calls);
  }, [chatLogs]);

  // 7-day trend (mock)
  const trend = useMemo(() => {
    const days: { label: string; calls: number; cost: number }[] = [];
    const now = Date.now();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      days.push({
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        calls: Math.floor(Math.random() * 40) + 10,
        cost: Math.random() * 5 + 0.5,
      });
    }
    return days;
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white">📊 使用 BI</h1>
        <p className="mt-1 text-sm text-gray-500">系统使用数据概览（含 mock 数据）</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["overview", "users", "agents", "providers"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t
                ? "bg-indigo-600 text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            {t === "overview" && "总览"}
            {t === "users" && "按用户"}
            {t === "agents" && "按 Agent"}
            {t === "providers" && "按 Provider"}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KpiCard label="总调用次数" value={totalCalls.toLocaleString()} />
            <KpiCard label="AI Chat 调用" value={chatLogs.length.toLocaleString()} />
            <KpiCard label="Agent 打开" value={agentLogs.length.toLocaleString()} />
            <KpiCard
              label="预估成本"
              value={`$${totalCost.toFixed(2)}`}
              color="text-amber-400"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <KpiCard
              label="输入 Token"
              value={totalInputTokens.toLocaleString()}
            />
            <KpiCard
              label="输出 Token"
              value={totalOutputTokens.toLocaleString()}
            />
          </div>

          {/* 7-day trend */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="mb-4 text-sm font-semibold text-white">
              📈 最近 7 天使用趋势
            </h3>
            <div className="space-y-2">
              {trend.map((d) => (
                <div key={d.label} className="flex items-center gap-2 text-xs">
                  <span className="w-12 text-gray-500">{d.label}</span>
                  <div className="flex-1">
                    <div
                      className="h-5 rounded bg-indigo-600/30"
                      style={{
                        width: `${Math.min(100, (d.calls / 50) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="w-10 text-right text-gray-400">
                    {d.calls}
                  </span>
                  <span className="w-16 text-right text-amber-400">
                    ${d.cost.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === "users" && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="pb-2">用户</th>
                <th className="pb-2 text-right">调用次数</th>
                <th className="pb-2 text-right">Token 数</th>
                <th className="pb-2 text-right">成本</th>
              </tr>
            </thead>
            <tbody>
              {userStats.map(([uid, stat]) => (
                <tr key={uid} className="border-t border-white/5">
                  <td className="py-2 text-white">
                    {USER_NAMES[uid] ?? uid}
                  </td>
                  <td className="py-2 text-right text-gray-300">
                    {stat.calls}
                  </td>
                  <td className="py-2 text-right text-gray-300">
                    {stat.tokens.toLocaleString()}
                  </td>
                  <td className="py-2 text-right text-amber-400">
                    ${stat.cost.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "agents" && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="pb-2">Agent</th>
                <th className="pb-2 text-right">打开次数</th>
              </tr>
            </thead>
            <tbody>
              {agentStats.map(([aid, stat]) => (
                <tr key={aid} className="border-t border-white/5">
                  <td className="py-2 text-white">{stat.name}</td>
                  <td className="py-2 text-right text-gray-300">
                    {stat.calls}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "providers" && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="pb-2">Provider</th>
                <th className="pb-2 text-right">调用次数</th>
                <th className="pb-2 text-right">Token 数</th>
                <th className="pb-2 text-right">成本</th>
              </tr>
            </thead>
            <tbody>
              {providerStats.map(([pid, stat]) => (
                <tr key={pid} className="border-t border-white/5">
                  <td className="py-2 text-white">{stat.name}</td>
                  <td className="py-2 text-right text-gray-300">
                    {stat.calls}
                  </td>
                  <td className="py-2 text-right text-gray-300">
                    {stat.tokens.toLocaleString()}
                  </td>
                  <td className="py-2 text-right text-amber-400">
                    ${stat.cost.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className={`text-2xl font-bold ${color ?? "text-white"}`}>
        {value}
      </div>
      <div className="mt-1 text-xs text-gray-500">{label}</div>
    </div>
  );
}
