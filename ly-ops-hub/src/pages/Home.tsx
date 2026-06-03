import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  agents,
  getOnlineAgentCount,
  getDevelopingAgentCount,
  getPlannedAgentCount,
  getCategoryCounts,
  getAgentById,
} from "../config/agents";
import { CATEGORY_META } from "../types/agent";
import StatusBadge from "../components/StatusBadge";
import { filterAgentsByUser } from "../utils/permission";
import { getRoleLabel } from "../config/roles";
import type { UserRole } from "../types/auth";

export default function Home() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  // ── Admin home ─────────────────────────────────────
  if (isAdmin) {
    const onlineCount = getOnlineAgentCount();
    const developingCount = getDevelopingAgentCount();
    const plannedCount = getPlannedAgentCount();
    const categoryCounts = getCategoryCounts();
    const stockHelper = getAgentById("stock-helper")!;

    return (
      <div className="space-y-8">
        {/* System Overview */}
        <section>
          <h2 className="mb-4 text-xl font-bold text-white">📊 系统总览</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Agent 总数" value={agents.length} />
            <StatCard label="已上线" value={onlineCount} color="text-emerald-400" />
            <StatCard label="开发中" value={developingCount} color="text-amber-400" />
            <StatCard label="规划中" value={plannedCount} color="text-sky-400" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard label="今日调用量" value="—" color="text-indigo-400" />
            <StatCard label="本月调用量" value="—" color="text-indigo-400" />
            <StatCard label="预估成本" value="—" color="text-amber-400" />
          </div>
        </section>

        {/* Featured Agent */}
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
            ⭐ 第一个已上线工具
          </h2>
          <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-3">
                  <h3 className="text-2xl font-bold text-white">
                    {stockHelper.name}
                  </h3>
                  <StatusBadge status="online" />
                </div>
                <p className="text-sm text-gray-400">
                  {stockHelper.version} · 后端支持 / 库存
                </p>
                <p className="mt-2 max-w-xl text-sm text-gray-300">
                  {stockHelper.description}
                </p>
              </div>
              <div className="flex flex-shrink-0 gap-2">
                <button
                  onClick={() => navigate(`/workspace/${stockHelper.id}`)}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-500"
                >
                  进入工具 →
                </button>
                {stockHelper.githubUrl && (
                  <a
                    href={stockHelper.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-gray-300 transition hover:bg-white/20"
                  >
                    GitHub
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Quick links */}
        <section>
          <h2 className="mb-4 text-xl font-bold text-white">⚡ 快捷入口</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Agent 中心", icon: "🤖", path: "/agents" },
              { label: "权限管理", icon: "👥", path: "/admin/permissions" },
              { label: "LLM 配置", icon: "🧠", path: "/llm" },
              { label: "使用 BI", icon: "📊", path: "/admin/usage" },
              { label: "AI Chat", icon: "💬", path: "/chat" },
              { label: "资产登记", icon: "🗂️", path: "/admin/agent-assets" },
              { label: "系统配置", icon: "⚙️", path: "/settings" },
              { label: "文档", icon: "📖", path: "/docs" },
            ].map((l) => (
              <button
                key={l.path}
                onClick={() => navigate(l.path)}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition hover:border-indigo-500/30 hover:bg-indigo-500/5"
              >
                <div className="text-2xl">{l.icon}</div>
                <div className="mt-2 font-semibold text-white">
                  {l.label}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Category overview */}
        <section>
          <h2 className="mb-4 text-xl font-bold text-white">📂 Agent 分类</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORY_META.map((cat) => (
              <button
                key={cat.key}
                onClick={() => navigate(`/agents?category=${cat.key}`)}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition hover:border-indigo-500/30 hover:bg-indigo-500/5"
              >
                <div className="text-2xl">{cat.icon}</div>
                <h3 className="mt-2 font-semibold text-white">{cat.label}</h3>
                <p className="mt-1 text-xs text-gray-500">{cat.description}</p>
                <span className="mt-3 inline-block rounded-full bg-white/5 px-3 py-1 text-xs text-gray-400">
                  {categoryCounts[cat.key] ?? 0} 个 Agent
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // ── Member home ─────────────────────────────────────
  const roleLabel = user ? getRoleLabel(user.role as UserRole) : "";
  const myAgents = user ? filterAgentsByUser(user, agents) : [];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-900/20 via-surface to-purple-900/10 p-8">
        <h1 className="text-3xl font-extrabold text-white">
          我的工作台
        </h1>
        <p className="mt-2 text-gray-400">
          欢迎，{user?.displayName} · {roleLabel}
        </p>
      </section>

      {/* My tools */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-white">🧰 我的可用工具</h2>
        {myAgents.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <div className="text-4xl">📭</div>
            <p className="mt-3 text-gray-400">暂无可用工具</p>
            <p className="text-sm text-gray-600">
              请联系管理员为你分配 Agent
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myAgents.map((agent) => (
              <div
                key={agent.id}
                className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 transition hover:border-emerald-400/40"
              >
                <div className="mb-2 flex items-center gap-2">
                  <StatusBadge status="online" />
                  {agent.version && (
                    <span className="text-xs text-gray-500">{agent.version}</span>
                  )}
                </div>
                <h3 className="mb-1 font-semibold text-white">{agent.name}</h3>
                <p className="mb-4 text-sm text-gray-400">{agent.description}</p>
                <button
                  onClick={() => {
                    if (agent.embedMode === "iframe") {
                      navigate(`/workspace/${agent.id}`);
                    } else if (agent.url) {
                      window.open(agent.url, "_blank");
                    }
                  }}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
                >
                  进入工具 →
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Today's tasks */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-white">📋 今日待办</h2>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-sm text-gray-500">暂无待办事项。后续版本将接入任务系统。</p>
        </div>
      </section>

      {/* Usage notes */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-white">📌 使用须知</h2>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
          <ul className="list-inside list-disc space-y-1 text-sm text-gray-400">
            <li>你只能看到管理员分配给你的已上线工具。</li>
            <li>工具配置和部署信息由管理员统一管理。</li>
            <li>如有问题，请联系管理员。</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

// ── Sub-component ──────────────────────────────────────

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className={`text-2xl font-bold ${color ?? "text-white"}`}>
        {value}
      </div>
      <div className="mt-1 text-sm text-gray-400">{label}</div>
    </div>
  );
}
