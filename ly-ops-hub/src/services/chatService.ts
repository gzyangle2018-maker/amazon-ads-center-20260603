// ============================================================
// LY-OPS Hub — Chat Service (mock, Phase 1)
// ============================================================

const MOCK_DELAY = 500;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  files?: UploadedFile[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
}

// ── Session management ──────────────────────────────────────

const SESSIONS_KEY = "lyops_chat_sessions";

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]): void {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function listChatSessions(): ChatSession[] {
  return loadSessions().sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function createChatSession(title?: string): ChatSession {
  const sessions = loadSessions();
  const session: ChatSession = {
    id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
    title: title ?? "新对话",
    messages: [],
    pinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  sessions.push(session);
  saveSessions(sessions);
  return session;
}

export function getChatSession(id: string): ChatSession | undefined {
  return loadSessions().find((s) => s.id === id);
}

export function updateChatSession(
  id: string,
  updates: Partial<ChatSession>,
): void {
  const sessions = loadSessions();
  const idx = sessions.findIndex((s) => s.id === id);
  if (idx === -1) return;
  sessions[idx] = { ...sessions[idx], ...updates, updatedAt: new Date().toISOString() };
  saveSessions(sessions);
}

export function deleteChatSession(id: string): void {
  const sessions = loadSessions().filter((s) => s.id !== id);
  saveSessions(sessions);
}

// ── Message helpers ─────────────────────────────────────────

export function addMessageToSession(
  sessionId: string,
  message: Omit<ChatMessage, "id" | "createdAt">,
): ChatMessage {
  const sessions = loadSessions();
  const idx = sessions.findIndex((s) => s.id === sessionId);
  if (idx === -1) throw new Error("Session not found");

  const msg: ChatMessage = {
    ...message,
    id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
    createdAt: new Date().toISOString(),
  };
  sessions[idx].messages.push(msg);
  sessions[idx].updatedAt = new Date().toISOString();

  // Auto-title from first user message
  if (
    sessions[idx].title === "新对话" &&
    message.role === "user"
  ) {
    sessions[idx].title = message.content.slice(0, 40) + (message.content.length > 40 ? "…" : "");
  }

  saveSessions(sessions);
  return msg;
}

// ── Mock LLM response ───────────────────────────────────────

export async function sendMessage(
  _sessionId: string,
  _content: string,
  _files?: UploadedFile[],
  _opts?: {
    provider?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  },
): Promise<string> {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, MOCK_DELAY + Math.random() * 1000));

  const responses = [
    "当前为前端演示模式，真实 LLM 调用将在后端 API 接入后启用。\n\n您可以继续体验界面交互、会话管理、文件上传等功能。",
    "收到您的消息。在演示模式下，我无法连接到实际的 AI 模型。\n\n请确保后端 API 已部署并正确配置环境变量。",
    "演示模式提示：所有会话数据保存在浏览器本地存储中，刷新页面不会丢失。\n\n真实接入后，数据将同步至 Supabase 数据库。",
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

// ── Mock file upload ────────────────────────────────────────

export async function uploadFiles(
  files: File[],
): Promise<UploadedFile[]> {
  await new Promise((r) => setTimeout(r, 300));
  return files.map((f) => ({
    id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
    name: f.name,
    size: f.size,
    type: f.type,
  }));
}
