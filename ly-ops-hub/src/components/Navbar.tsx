import { useState, useRef, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getRoleLabel } from "../config/roles";
import type { UserRole } from "../types/auth";

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const MAIN_NAV: NavItem[] = [
  { path: "/", label: "首页", icon: "🏠" },
  { path: "/agents", label: "Agent 中心", icon: "🤖" },
  { path: "/chat", label: "AI Chat", icon: "💬" },
];

const ADMIN_MENU: NavItem[] = [
  { path: "/llm", label: "LLM 配置", icon: "🧠" },
  { path: "/admin/permissions", label: "权限管理", icon: "👥" },
  { path: "/admin/usage", label: "使用 BI", icon: "📊" },
  { path: "/admin/agent-assets", label: "资产登记", icon: "🗂️" },
  { path: "/settings", label: "系统配置", icon: "⚙️" },
  { path: "/docs", label: "文档", icon: "📖" },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!user) return null;

  const roleLabel = getRoleLabel(user.role as UserRole);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0f0f1a]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Brand */}
        <NavLink to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-base font-bold text-white shadow-lg shadow-indigo-500/25">
            L
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            LY-OPS
          </span>
        </NavLink>

        {/* Nav + user area */}
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {/* Main nav — always visible */}
          {MAIN_NAV.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                className={`flex-shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-indigo-600/20 text-indigo-400"
                    : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                }`}
              >
                <span className="mr-1">{link.icon}</span>
                <span className="hidden lg:inline">{link.label}</span>
              </NavLink>
            );
          })}

          {/* Admin dropdown */}
          {isAdmin && (
            <div className="relative flex-shrink-0" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={`rounded-lg px-2.5 py-1.5 text-sm font-medium transition ${
                  menuOpen
                    ? "bg-indigo-600/20 text-indigo-400"
                    : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                }`}
              >
                ⚙️ <span className="hidden lg:inline">管理</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-white/10 bg-[#1a1a2e] py-1 shadow-2xl backdrop-blur-xl">
                  {ADMIN_MENU.map((link) => {
                    const isActive = location.pathname === link.path;
                    return (
                      <NavLink
                        key={link.path}
                        to={link.path}
                        onClick={() => setMenuOpen(false)}
                        className={`block px-4 py-2 text-sm transition ${
                          isActive
                            ? "bg-indigo-600/20 text-indigo-400"
                            : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                        }`}
                      >
                        <span className="mr-2">{link.icon}</span>
                        {link.label}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Separator */}
          <div className="mx-1.5 h-5 w-px flex-shrink-0 bg-white/10" />

          {/* User */}
          <div className="flex flex-shrink-0 items-center gap-1.5 text-sm">
            <span className="hidden text-gray-400 sm:inline max-w-[80px] truncate">
              {user.displayName}
            </span>
            <span className="flex-shrink-0 rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-400 ring-1 ring-indigo-500/30">
              {roleLabel}
            </span>
            <button
              onClick={handleLogout}
              className="flex-shrink-0 rounded-lg px-2 py-1 text-xs text-gray-500 transition hover:bg-white/10 hover:text-gray-300"
            >
              退出
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
