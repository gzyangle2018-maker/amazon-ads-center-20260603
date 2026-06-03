// ============================================================
// LY-OPS Hub — Auth Context
// 管理登录/登出/角色，localStorage 持久化
// 后续可替换为 Supabase Auth / Auth.js / 自建后端
// ============================================================

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { User, UserRole } from "../types/auth";

// ── Mock users ──────────────────────────────────────────────
const MOCK_USERS: (User & { password: string })[] = [
  {
    id: "u-001",
    username: "yangle",
    password: "leo0417",
    displayName: "Leo Young",
    role: "admin",
    department: "管理",
    enabled: true,
  },
  {
    id: "u-002",
    username: "assistant01",
    password: "123456",
    displayName: "助理小陈",
    role: "assistant",
    department: "店铺安全",
    enabled: true,
  },
  {
    id: "u-003",
    username: "ops_assistant01",
    password: "123456",
    displayName: "运营助理小李",
    role: "ops_assistant",
    department: "转化组",
    enabled: true,
  },
  {
    id: "u-004",
    username: "operator01",
    password: "123456",
    displayName: "运营小王",
    role: "operator",
    department: "投流组",
    enabled: true,
  },
  {
    id: "u-005",
    username: "designer01",
    password: "123456",
    displayName: "美工小张",
    role: "designer",
    department: "视觉组",
    enabled: true,
  },
];

// ── Context shape ───────────────────────────────────────────
interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (
    username: string,
    password: string,
    role?: UserRole,
  ) => { ok: boolean; error?: string };
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ────────────────────────────────────────────────
const STORAGE_KEY = "lyops_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as User;
        if (parsed.id && parsed.username && parsed.role) {
          setUser(parsed);
        }
      }
    } catch {
      /* corrupted data — ignore */
    }
    setLoading(false);
  }, []);

  const login = useCallback(
    (
      username: string,
      password: string,
      role?: UserRole,
    ): { ok: boolean; error?: string } => {
      const match = MOCK_USERS.find(
        (u) =>
          u.username === username &&
          u.password === password &&
          u.enabled &&
          (!role || u.role === role),
      );
      if (!match) {
        return { ok: false, error: "用户名或密码错误" };
      }
      const { password: _, ...userData } = match;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
      return { ok: true };
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
