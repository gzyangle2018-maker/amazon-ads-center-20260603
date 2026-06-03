import { useNavigate } from "react-router-dom";
import type { AgentTool } from "../types/agent";
import { getCategoryMeta } from "../types/agent";
import StatusBadge from "./StatusBadge";
import { useAuth } from "../contexts/AuthContext";
import { canViewDeploymentInfo } from "../utils/permission";

interface AgentCardProps {
  agent: AgentTool;
}

export default function AgentCard({ agent }: AgentCardProps) {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const catMeta = getCategoryMeta(agent.category);
  const isOnline = agent.status === "online";
  const showTechInfo = canViewDeploymentInfo(user);

  const handleEnter = () => {
    if (!agent.url) return;
    if (agent.embedMode === "iframe") {
      navigate(`/workspace/${agent.id}`);
    } else {
      window.open(agent.url, "_blank");
    }
  };

  return (
    <div
      className={`group relative rounded-2xl border p-5 transition-all duration-300 ${
        isOnline
          ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-400/50 hover:shadow-lg hover:shadow-emerald-500/10"
          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
      }`}
    >
      {isOnline && (
        <div className="absolute inset-0 rounded-2xl bg-emerald-500/5 blur-xl" />
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{catMeta.icon}</span>
            <span className="text-xs text-gray-500">{catMeta.label}</span>
          </div>
          <StatusBadge status={agent.status} />
        </div>

        {/* Name */}
        <h3 className="mb-1 text-lg font-semibold text-white">
          {agent.name}
        </h3>
        {agent.version && (
          <span className="mb-2 inline-block rounded bg-white/10 px-1.5 py-0.5 text-xs text-gray-400">
            {agent.version}
          </span>
        )}

        {/* Description */}
        <p className="mb-3 text-sm leading-relaxed text-gray-400">
          {agent.description}
        </p>

        {/* Admin-only: details & steps */}
        {showTechInfo && (
          <>
            {agent.details && (
              <p className="mb-2 text-xs text-gray-600">{agent.details}</p>
            )}
            {agent.steps && agent.steps.length > 0 && (
              <div className="mb-3">
                <span className="text-xs text-gray-500">
                  {agent.steps.length} 个步骤
                </span>
              </div>
            )}
          </>
        )}

        {/* Tags */}
        {agent.tags && agent.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {agent.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-gray-500"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Admin-only: LLM badge & owner */}
        {showTechInfo && (
          <div className="mb-4 flex items-center gap-3 text-xs text-gray-500">
            <span>
              {agent.llmRequired ? "🧠 LLM 必需" : "⚡ 无需 LLM"}
            </span>
            {agent.ownerRole && (
              <span className="rounded bg-white/5 px-1.5 py-0.5">
                {agent.ownerRole}
              </span>
            )}
          </div>
        )}

        {/* Non-admin: mock task counts */}
        {!isAdmin && isOnline && (
          <div className="mb-4 flex items-center gap-3 text-xs text-gray-500">
            <span>📋 今日待处理: {Math.floor(Math.random() * 5)}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleEnter}
            disabled={!agent.url}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              agent.url
                ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/25"
                : "cursor-not-allowed bg-white/5 text-gray-600"
            }`}
          >
            {agent.url ? "进入工具 →" : "暂未部署"}
          </button>

          {/* Admin-only: GitHub + Docs */}
          {showTechInfo && (
            <>
              <a
                href={agent.githubUrl ?? "#"}
                target={agent.githubUrl ? "_blank" : undefined}
                rel="noopener noreferrer"
                className={`rounded-lg px-3 py-2 text-sm transition ${
                  agent.githubUrl
                    ? "bg-white/10 text-gray-300 hover:bg-white/20"
                    : "cursor-not-allowed bg-white/5 text-gray-700"
                }`}
                onClick={(e) => {
                  if (!agent.githubUrl) e.preventDefault();
                }}
              >
                GitHub
              </a>
              <a
                href={agent.docsUrl ?? "#"}
                target={agent.docsUrl ? "_blank" : undefined}
                rel="noopener noreferrer"
                className={`rounded-lg px-3 py-2 text-sm transition ${
                  agent.docsUrl
                    ? "bg-white/10 text-gray-300 hover:bg-white/20"
                    : "cursor-not-allowed bg-white/5 text-gray-700"
                }`}
                onClick={(e) => {
                  if (!agent.docsUrl) e.preventDefault();
                }}
              >
                文档
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
