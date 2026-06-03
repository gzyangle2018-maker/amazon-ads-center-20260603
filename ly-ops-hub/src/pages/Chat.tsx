// ============================================================
// LY-OPS Hub — AI Chat Page
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { llmProviders } from "../config/llmProviders";
import {
  listChatSessions,
  createChatSession,
  deleteChatSession,
  updateChatSession,
  addMessageToSession,
  sendMessage,
  uploadFiles,
  type ChatSession,
  type ChatMessage,
  type UploadedFile,
} from "../services/chatService";
import { logUsage, canUseAIChat } from "../utils/permission";

export default function Chat() {
  const { user, isAdmin } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Settings state
  const [provider, setProvider] = useState("dataler");
  const [model, setModel] = useState("gpt-5.5");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [fileMode, setFileMode] = useState(false);
  const [webMode, setWebMode] = useState(false);
  const [businessMode, setBusinessMode] = useState("fast");

  // File upload
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect if no chat access
  useEffect(() => {
    if (user && !canUseAIChat(user) && !isAdmin) {
      // Non-admin without chat permission — wouldn't reach here due to nav hiding
    }
  }, [user, isAdmin]);

  // Load sessions
  useEffect(() => {
    setSessions(listChatSessions());
  }, []);

  // Find active session
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages]);

  // ── Handlers ──────────────────────────────────────────

  const handleNewChat = () => {
    const s = createChatSession();
    setSessions(listChatSessions());
    setActiveSessionId(s.id);
    setInput("");
    setAttachedFiles([]);
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    setAttachedFiles([]);
  };

  const handleDeleteSession = (id: string) => {
    deleteChatSession(id);
    if (activeSessionId === id) setActiveSessionId(null);
    setSessions(listChatSessions());
  };

  const handleTogglePin = (id: string) => {
    const s = sessions.find((x) => x.id === id);
    if (s) {
      updateChatSession(id, { pinned: !s.pinned });
      setSessions(listChatSessions());
    }
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() && attachedFiles.length === 0) return;
    if (loading) return;

    let sid = activeSessionId;
    if (!sid) {
      const s = createChatSession();
      sid = s.id;
      setActiveSessionId(sid);
      setSessions(listChatSessions());
    }

    // Add user message
    addMessageToSession(sid, {
      role: "user",
      content: input.trim(),
      files: attachedFiles.length > 0 ? attachedFiles : undefined,
    });
    setInput("");
    setAttachedFiles([]);
    setSessions(listChatSessions());
    setLoading(true);

    // Log
    if (user) {
      logUsage({ userId: user.id, action: "send_chat", providerId: provider, model });
    }

    // Get mock response
    const reply = await sendMessage(sid, input.trim(), attachedFiles, {
      provider,
      model,
      temperature,
      maxTokens,
    });

    addMessageToSession(sid, { role: "assistant", content: reply });
    setSessions(listChatSessions());
    setLoading(false);
  }, [input, activeSessionId, attachedFiles, loading, user, provider, model, temperature, maxTokens]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── File handling ─────────────────────────────────────

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const uploaded = await uploadFiles(Array.from(files));
    setAttachedFiles((prev) => [...prev, ...uploaded]);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length === 0) return;
    const uploaded = await uploadFiles(Array.from(files));
    setAttachedFiles((prev) => [...prev, ...uploaded]);
  };

  // ── Filter sessions ───────────────────────────────────

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const pinnedSessions = filteredSessions.filter((s) => s.pinned);
  const unpinnedSessions = filteredSessions.filter((s) => !s.pinned);

  // ── Provider options ──────────────────────────────────

  const enabledProviders = llmProviders.filter((p) => p.enabled);
  const selectedProvider = llmProviders.find((p) => p.id === provider);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0">
      {/* ── Left sidebar: sessions ── */}
      <div className="flex w-64 flex-shrink-0 flex-col border-r border-white/10">
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="w-full rounded-xl bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500"
          >
            + 新建对话
          </button>
        </div>

        <div className="px-3 pb-2">
          <input
            type="text"
            placeholder="搜索会话…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder-gray-600 outline-none focus:border-indigo-500/50"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          {pinnedSessions.length > 0 && (
            <div className="mb-2">
              <div className="px-2 py-1 text-xs text-gray-600">📌 已固定</div>
              {pinnedSessions.map((s) => (
                <SessionItem
                  key={s.id}
                  session={s}
                  active={s.id === activeSessionId}
                  onSelect={() => handleSelectSession(s.id)}
                  onDelete={() => handleDeleteSession(s.id)}
                  onTogglePin={() => handleTogglePin(s.id)}
                />
              ))}
            </div>
          )}
          <div>
            {pinnedSessions.length > 0 && (
              <div className="px-2 py-1 text-xs text-gray-600">💬 最近对话</div>
            )}
            {unpinnedSessions.map((s) => (
              <SessionItem
                key={s.id}
                session={s}
                active={s.id === activeSessionId}
                onSelect={() => handleSelectSession(s.id)}
                onDelete={() => handleDeleteSession(s.id)}
                onTogglePin={() => handleTogglePin(s.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Center: chat ── */}
      <div className="flex flex-1 flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {!activeSession ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-3 text-5xl">💬</div>
              <h3 className="text-lg font-semibold text-white">AI Chat</h3>
              <p className="mt-1 max-w-sm text-sm text-gray-500">
                选择左侧会话或新建对话开始
              </p>
            </div>
          ) : activeSession.messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-3 text-5xl">✨</div>
              <h3 className="text-lg font-semibold text-white">开始新对话</h3>
              <p className="mt-1 text-sm text-gray-500">
                输入消息或上传文件开始
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeSession.messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                  AI 正在思考…
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-white/10 px-4 py-3">
          {/* Attached files */}
          {attachedFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachedFiles.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2 py-1 text-xs text-gray-400"
                >
                  📎 {f.name} ({(f.size / 1024).toFixed(0)} KB)
                  <button
                    onClick={() =>
                      setAttachedFiles((prev) => prev.filter((x) => x.id !== f.id))
                    }
                    className="text-gray-600 hover:text-gray-300"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div
            className={`flex items-end gap-2 rounded-2xl border p-2 transition ${
              dragOver
                ? "border-indigo-500/50 bg-indigo-500/10"
                : "border-white/10 bg-white/5"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg p-2 text-gray-500 transition hover:bg-white/10 hover:text-gray-300"
            >
              📎
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.xlsx,.xls,.csv,.txt,.docx,.png,.jpg,.jpeg,.gif,.webp"
              className="hidden"
              onChange={handleFileSelect}
            />
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息… (Enter 发送，Shift+Enter 换行)"
              rows={1}
              className="max-h-32 flex-1 resize-none bg-transparent text-sm text-white placeholder-gray-600 outline-none"
            />
            <button
              onClick={() => setInput("")}
              className="rounded-lg p-2 text-gray-500 transition hover:bg-white/10"
            >
              🗑️
            </button>
            <button
              onClick={handleSend}
              disabled={loading || (!input.trim() && attachedFiles.length === 0)}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-40"
            >
              {loading ? "…" : "发送"}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`rounded-lg p-2 text-sm transition ${
                showSettings
                  ? "bg-indigo-600/20 text-indigo-400"
                  : "text-gray-500 hover:bg-white/10"
              }`}
            >
              ⚙️
            </button>
          </div>
        </div>
      </div>

      {/* ── Right: settings ── */}
      {showSettings && (
        <div className="w-64 flex-shrink-0 overflow-y-auto border-l border-white/10 p-4">
          <h3 className="mb-3 text-sm font-semibold text-white">对话设置</h3>

          {isAdmin ? (
            <>
              {/* Provider */}
              <div className="mb-3">
                <label className="mb-1 block text-xs text-gray-500">Provider</label>
                <select
                  value={provider}
                  onChange={(e) => {
                    setProvider(e.target.value);
                    const p = llmProviders.find((x) => x.id === e.target.value);
                    if (p) setModel(p.defaultModel);
                  }}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white outline-none"
                >
                  {enabledProviders.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model */}
              <div className="mb-3">
                <label className="mb-1 block text-xs text-gray-500">Model</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white outline-none"
                >
                  {selectedProvider?.models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  )) ?? <option>{model}</option>}
                </select>
              </div>

              {/* Temperature */}
              <div className="mb-3">
                <label className="mb-1 block text-xs text-gray-500">
                  Temperature: {temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Max Tokens */}
              <div className="mb-3">
                <label className="mb-1 block text-xs text-gray-500">
                  Max Tokens: {maxTokens}
                </label>
                <input
                  type="range"
                  min="256"
                  max="32768"
                  step="256"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* System Prompt */}
              <div className="mb-3">
                <label className="mb-1 block text-xs text-gray-500">System Prompt</label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="（可选）"
                  rows={3}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white placeholder-gray-600 outline-none"
                />
              </div>

              {/* Toggles */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-gray-400">
                  <input
                    type="checkbox"
                    checked={webMode}
                    onChange={(e) => setWebMode(e.target.checked)}
                    className="rounded"
                  />
                  启用联网
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-400">
                  <input
                    type="checkbox"
                    checked={fileMode}
                    onChange={(e) => setFileMode(e.target.checked)}
                    className="rounded"
                  />
                  启用文件解析
                </label>
              </div>
            </>
          ) : (
            <>
              {/* Non-admin: business modes only */}
              <div className="mb-3">
                <label className="mb-1 block text-xs text-gray-500">业务模式</label>
                <select
                  value={businessMode}
                  onChange={(e) => setBusinessMode(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white outline-none"
                >
                  <option value="fast">⚡ 快速模式</option>
                  <option value="deep">🧠 深度模式</option>
                  <option value="image">🖼️ 图片分析模式</option>
                  <option value="file">📁 文件分析模式</option>
                </select>
              </div>
              <p className="text-xs text-gray-600">
                当前使用管理员预设的默认 Provider。
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────

function SessionItem({
  session,
  active,
  onSelect,
  onDelete,
  onTogglePin,
}: {
  session: ChatSession;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`group flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-sm transition ${
        active
          ? "bg-indigo-600/20 text-indigo-400"
          : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
      }`}
    >
      <span className="truncate">{session.title}</span>
      <div className="hidden gap-0.5 group-hover:flex">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          className="rounded p-0.5 text-xs text-gray-600 hover:text-amber-400"
        >
          📌
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="rounded p-0.5 text-xs text-gray-600 hover:text-red-400"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
          isUser
            ? "bg-indigo-600 text-white"
            : "bg-white/10 text-gray-200"
        }`}
      >
        {/* Files */}
        {message.files && message.files.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {message.files.map((f) => (
              <span
                key={f.id}
                className="rounded-lg bg-black/20 px-2 py-0.5 text-xs"
              >
                📎 {f.name}
              </span>
            ))}
          </div>
        )}
        {/* Content — basic markdown-like rendering */}
        <div className="whitespace-pre-wrap break-words">
          {message.content}
        </div>
      </div>
    </div>
  );
}
