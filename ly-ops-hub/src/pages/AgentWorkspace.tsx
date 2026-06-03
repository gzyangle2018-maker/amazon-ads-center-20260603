// ============================================================
// LY-OPS Hub — Agent Workspace (iframe embed)
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { agents } from "../config/agents";
import { getEmbedConfig } from "../config/embedConfigs";
import { logUsage, canViewAgent } from "../utils/permission";

export default function AgentWorkspace() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const agent = agents.find((a) => a.id === agentId);
  const embedCfg = agentId ? getEmbedConfig(agentId) : undefined;

  const [iframeError, setIframeError] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // Log usage
  useEffect(() => {
    if (user && agentId) {
      logUsage({
        userId: user.id,
        agentId,
        action: "open_agent",
      });
    }
  }, [user, agentId]);

  // Redirect if agent not found or no access
  useEffect(() => {
    if (!agent) {
      navigate("/agents", { replace: true });
      return;
    }
    if (!canViewAgent(user, agent)) {
      navigate("/agents", { replace: true });
    }
  }, [agent, user, navigate]);

  const handleRefresh = useCallback(() => {
    setIframeError(false);
    // Force iframe reload by toggling src
    const iframe = document.getElementById(
      "agent-iframe",
    ) as HTMLIFrameElement | null;
    if (iframe && agent?.url) {
      iframe.src = agent.url;
    }
  }, [agent]);

  const handleFullscreen = () => {
    const el = document.getElementById("workspace-container");
    if (!el) return;
    if (!fullscreen) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
    setFullscreen(!fullscreen);
  };

  const handleIframeError = () => {
    setIframeError(true);
  };

  const handleCopyUrl = () => {
    if (agent?.url) {
      navigator.clipboard.writeText(agent.url).catch(() => {});
    }
  };

  if (!agent) return null;

  const showUrl = isAdmin || !agent.hideTechnicalInfoForNonAdmin;

  return (
    <div
      id="workspace-container"
      className="flex h-[calc(100vh-10rem)] flex-col"
    >
      {/* Top bar */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/agents"
            className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-gray-400 transition hover:bg-white/20 hover:text-gray-200"
          >
            ← 我的工具
          </Link>
          <h1 className="text-lg font-bold text-white">{agent.name}</h1>
          {agent.version && (
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-gray-400">
              {agent.version}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-gray-400 transition hover:bg-white/20"
          >
            🔄 刷新
          </button>
          <button
            onClick={handleFullscreen}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-gray-400 transition hover:bg-white/20"
          >
            {fullscreen ? "⤓ 退出全屏" : "⛶ 全屏"}
          </button>
          {isAdmin && (
            <>
              {agent.url && (
                <button
                  onClick={() => window.open(agent.url, "_blank")}
                  className="rounded-lg bg-indigo-600/20 px-3 py-1.5 text-sm text-indigo-400 transition hover:bg-indigo-600/30"
                >
                  🔗 外部打开
                </button>
              )}
              {agent.url && (
                <button
                  onClick={handleCopyUrl}
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-gray-400 transition hover:bg-white/20"
                >
                  📋 复制地址
                </button>
              )}
              {agent.githubUrl && (
                <a
                  href={agent.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-gray-400 transition hover:bg-white/20"
                >
                  GitHub
                </a>
              )}
            </>
          )}
        </div>
      </div>

      {/* URL display (admin only) */}
      {showUrl && agent.url && (
        <div className="mb-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-gray-500">
          <code>{agent.url}</code>
        </div>
      )}

      {/* Content area */}
      <div className="relative flex-1 overflow-hidden rounded-2xl border border-white/10">
        {!iframeError ? (
          <iframe
            id="agent-iframe"
            src={agent.url}
            title={agent.name}
            className="h-full w-full border-0"
            sandbox={
              embedCfg?.sandbox ??
              "allow-scripts allow-forms allow-downloads allow-same-origin allow-popups"
            }
            onError={handleIframeError}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <div className="mb-3 text-5xl">🚫</div>
            <h3 className="mb-2 text-lg font-semibold text-white">
              无法加载工具
            </h3>
            <p className="mb-1 max-w-md text-sm text-gray-400">
              当前工具可能设置了 X-Frame-Options 或 CSP frame-ancestors
              禁止被内嵌。
            </p>
            <p className="mb-4 text-xs text-gray-600">
              请联系管理员或将工具在新窗口打开。
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                className="rounded-xl bg-white/10 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/20"
              >
                重试
              </button>
              {agent.url && (
                <button
                  onClick={() => window.open(agent.url, "_blank")}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                >
                  在新窗口打开
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
