import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Agents from "./pages/Agents";
import LLMSettings from "./pages/LLMSettings";
import Settings from "./pages/Settings";
import Docs from "./pages/Docs";
import AgentWorkspace from "./pages/AgentWorkspace";
import Chat from "./pages/Chat";
import AdminPermissions from "./pages/AdminPermissions";
import AdminUsage from "./pages/AdminUsage";
import AdminAgentAssets from "./pages/AdminAgentAssets";

// ── Route guard: redirect to /login if not authenticated ────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f1a]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// ── Route guard: admin only ─────────────────────────────────
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Login — no layout */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route path="/" element={<Home />} />
            <Route path="/agents" element={<Agents />} />
            <Route
              path="/llm"
              element={
                <RequireAdmin>
                  <LLMSettings />
                </RequireAdmin>
              }
            />
            <Route
              path="/settings"
              element={
                <RequireAdmin>
                  <Settings />
                </RequireAdmin>
              }
            />
            <Route
              path="/docs"
              element={
                <RequireAdmin>
                  <Docs />
                </RequireAdmin>
              }
            />
            {/* Workspace — iframe */}
            <Route path="/workspace/:agentId" element={<AgentWorkspace />} />
            {/* Chat */}
            <Route path="/chat" element={<Chat />} />
            {/* Admin pages */}
            <Route
              path="/admin/permissions"
              element={
                <RequireAdmin>
                  <AdminPermissions />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/usage"
              element={
                <RequireAdmin>
                  <AdminUsage />
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/agent-assets"
              element={
                <RequireAdmin>
                  <AdminAgentAssets />
                </RequireAdmin>
              }
            />
          </Route>

          {/* Catch-all → login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
