// ============================================================
// LY-OPS Hub — Login Page
// 深色科技风，mock 登录。后续替换为 Supabase/Auth.js/自建后端。
// ============================================================

import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { UserRole } from "../types/auth";

const isDev = import.meta.env.DEV;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("请输入用户名和密码");
      return;
    }
    setSubmitting(true);
    const result = login(
      username.trim(),
      password,
      role ? (role as UserRole) : undefined,
    );
    if (result.ok) {
      navigate("/", { replace: true });
    } else {
      setError(result.error ?? "登录失败");
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0f0f1a] px-4">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-20 right-0 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl font-bold text-white shadow-lg shadow-indigo-500/25">
            L
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            LY-OPS
          </h1>
          <p className="mt-1 text-sm text-gray-500">内部工作台 · 登录</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm"
        >
          {/* Username */}
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-gray-400">
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="输入用户名"
              autoComplete="username"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-gray-400">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码"
              autoComplete="current-password"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Role selector (dev only) */}
          {isDev && (
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-400">
                角色 <span className="text-xs text-amber-500">(开发环境)</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole | "")}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500/50"
              >
                <option value="">自动匹配</option>
                <option value="admin">管理员 (admin)</option>
                <option value="assistant">助理 (assistant)</option>
                <option value="ops_assistant">运营助理 (ops_assistant)</option>
                <option value="operator">运营 (operator)</option>
                <option value="designer">美工 (designer)</option>
              </select>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {submitting ? "验证中…" : "登录"}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-600">
          LY-OPS Hub · Phase 2 — 内部工作台 · 仅限授权用户
        </p>
      </div>
    </div>
  );
}
