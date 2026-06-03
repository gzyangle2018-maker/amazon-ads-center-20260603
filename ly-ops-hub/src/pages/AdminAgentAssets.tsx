// ============================================================
// LY-OPS Hub — Admin: Agent Asset Registry
// ============================================================

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { agents as allAgents } from "../config/agents";
import { deployments as allDeployments } from "../config/deployments";
import { getEmbedConfig } from "../config/embedConfigs";
import { PLATFORM_META } from "../types/deployment";
import type { AgentDeployment } from "../types/deployment";
import type { AgentTool } from "../types/agent";
import StatusBadge from "../components/StatusBadge";

export default function AdminAgentAssets() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<AgentTool | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [deployments] = useState<AgentDeployment[]>(() => {
    // Merge from config + localStorage
    try {
      const stored = localStorage.getItem("lyops_deployments");
      if (stored) return JSON.parse(stored);
    } catch {}
    return allDeployments;
  });



  const filtered = useMemo(() => {
    if (!search.trim()) return allAgents;
    const q = search.toLowerCase();
    return allAgents.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q),
    );
  }, [search]);

  const getDeployment = (agentId: string) => {
    return deployments.find((d) => d.agentId === agentId);
  };

  const getEmbed = (agentId: string) => {
    return getEmbedConfig(agentId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">🗂️ Agent 资产登记</h1>
          <p className="mt-1 text-sm text-gray-500">
            统一管理所有子 Agent 的部署信息和内嵌配置
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedAgent(null);
            setEditMode(true);
          }}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          + 新增 Agent
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="搜索 Agent…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition focus:border-indigo-500/50"
      />

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs text-gray-500">
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3">分类</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">部署平台</th>
              <th className="px-4 py-3">生产地址</th>
              <th className="px-4 py-3">GitHub</th>
              <th className="px-4 py-3">iframe</th>
              <th className="px-4 py-3">数据敏感</th>
              <th className="px-4 py-3">成本</th>
              <th className="px-4 py-3">负责人</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((agent) => {
              const depl = getDeployment(agent.id);
              const emb = getEmbed(agent.id);
              const platLabel = depl
                ? PLATFORM_META[depl.platform]?.label ?? depl.platform
                : "—";

              return (
                <tr
                  key={agent.id}
                  className="border-t border-white/5 hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-white">{agent.name}</span>
                    {agent.version && (
                      <span className="ml-1 text-xs text-gray-600">
                        {agent.version}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {agent.category}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={agent.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {depl ? (
                      <span className="flex items-center gap-1">
                        {PLATFORM_META[depl.platform]?.icon}{" "}
                        {platLabel}
                      </span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {depl?.productionUrl ? (
                      <a
                        href={depl.productionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:underline"
                      >
                        {depl.productionUrl.length > 30
                          ? depl.productionUrl.slice(0, 30) + "…"
                          : depl.productionUrl}
                      </a>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {depl?.repositoryUrl ? (
                      <a
                        href={depl.repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:underline"
                      >
                        🔗
                      </a>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {emb ? (
                      <span
                        className={
                          emb.framePolicyStatus === "allowed"
                            ? "text-emerald-400"
                            : emb.framePolicyStatus === "blocked"
                              ? "text-red-400"
                              : "text-amber-400"
                        }
                      >
                        {emb.embedMode}
                        {emb.embedAllowed ? " ✓" : " ✗"}
                      </span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span
                      className={
                        agent.dataSensitivity === "high"
                          ? "text-red-400"
                          : agent.dataSensitivity === "medium"
                            ? "text-amber-400"
                            : "text-gray-500"
                      }
                    >
                      {agent.dataSensitivity ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {agent.costLevel ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {agent.owner ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() =>
                          navigate(`/workspace/${agent.id}`)
                        }
                        className="rounded-lg bg-indigo-600/20 px-2 py-1 text-xs text-indigo-400 hover:bg-indigo-600/30"
                      >
                        测试内嵌
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit modal — simplified for Phase 1 */}
      {editMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0f0f1a] p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">
              {selectedAgent ? `编辑: ${selectedAgent.name}` : "新增 Agent 资产"}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Agent ID</label>
                <input className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">部署平台</label>
                <select className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none">
                  <option value="">选择平台</option>
                  {Object.entries(PLATFORM_META).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.icon} {v.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">生产地址</label>
                <input className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">GitHub 仓库</label>
                <input className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none" />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEditMode(false)}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm text-gray-400"
              >
                取消
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
              >
                保存到 localStorage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
