// ============================================================
// LY-OPS Hub — Admin: Agent Permissions
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { agents } from "../config/agents";
import {
  getAssignments,
  saveAssignments,
} from "../utils/permission";
import { ROLE_LABELS, ROLE_PERMISSIONS } from "../config/roles";
import type { UserRole, UserAgentAssignment } from "../types/auth";
import StatusBadge from "../components/StatusBadge";

const MOCK_USERS = [
  { id: "u-001", username: "yangle", displayName: "Leo Young", role: "admin" as UserRole },
  { id: "u-002", username: "assistant01", displayName: "助理小陈", role: "assistant" as UserRole },
  { id: "u-003", username: "ops_assistant01", displayName: "运营助理小李", role: "ops_assistant" as UserRole },
  { id: "u-004", username: "operator01", displayName: "运营小王", role: "operator" as UserRole },
  { id: "u-005", username: "designer01", displayName: "美工小张", role: "designer" as UserRole },
];

export default function AdminPermissions() {
  const { user: _admin } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState("u-001");
  const [assignments, setAssignments] = useState<UserAgentAssignment[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setAssignments(getAssignments());
  }, []);

  const selectedUser = MOCK_USERS.find((u) => u.id === selectedUserId);
  const rolePerm = selectedUser
    ? ROLE_PERMISSIONS[selectedUser.role]
    : null;



  const isAgentAssigned = useCallback(
    (userId: string, agentId: string) => {
      const explicit = assignments.find(
        (a) => a.userId === userId && a.agentId === agentId,
      );
      if (explicit) return explicit.enabled;
      // Check role defaults
      if (rolePerm) {
        if (rolePerm.visibleAgentIds.length === 0 && rolePerm.visibleCategories.length === 0) {
          return rolePerm.role === "admin";
        }
        if (rolePerm.visibleAgentIds.includes(agentId)) return true;
        const agent = agents.find((a) => a.id === agentId);
        if (agent && rolePerm.visibleCategories.includes(agent.category)) return true;
      }
      return false;
    },
    [assignments, rolePerm],
  );

  const toggleAgent = (userId: string, agentId: string) => {
    const existing = assignments.find(
      (a) => a.userId === userId && a.agentId === agentId,
    );
    let updated: UserAgentAssignment[];
    if (existing) {
      updated = assignments.map((a) =>
        a.userId === userId && a.agentId === agentId
          ? { ...a, enabled: !a.enabled }
          : a,
      );
    } else {
      updated = [
        ...assignments,
        {
          userId,
          agentId,
          enabled: true,
          assignedAt: new Date().toISOString(),
          assignedBy: "admin",
        },
      ];
    }
    setAssignments(updated);
    saveAssignments(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const batchAssignRole = (role: UserRole) => {
    const perm = ROLE_PERMISSIONS[role];
    const userIds = MOCK_USERS.filter((u) => u.role === role).map((u) => u.id);
    let updated = [...assignments];

    for (const uid of userIds) {
      for (const agent of agents) {
        const shouldAssign =
          perm.visibleAgentIds.includes(agent.id) ||
          (perm.visibleCategories.length > 0 &&
            perm.visibleCategories.includes(agent.category));
        if (shouldAssign) {
          const existing = updated.find(
            (a) => a.userId === uid && a.agentId === agent.id,
          );
          if (!existing) {
            updated.push({
              userId: uid,
              agentId: agent.id,
              enabled: true,
              assignedAt: new Date().toISOString(),
              assignedBy: "admin",
            });
          } else if (!existing.enabled) {
            updated = updated.map((a) =>
              a.userId === uid && a.agentId === agent.id
                ? { ...a, enabled: true }
                : a,
            );
          }
        }
      }
    }
    setAssignments(updated);
    saveAssignments(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">👥 权限管理</h1>
          <p className="mt-1 text-sm text-gray-500">管理用户对 Agent 的访问权限</p>
        </div>
        {saved && (
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
            ✅ 已保存
          </span>
        )}
      </div>

      <div className="flex gap-4">
        {/* ── Left: user list ── */}
        <div className="w-56 flex-shrink-0 space-y-1">
          {MOCK_USERS.map((u) => (
            <button
              key={u.id}
              onClick={() => setSelectedUserId(u.id)}
              className={`w-full rounded-xl px-4 py-3 text-left transition ${
                selectedUserId === u.id
                  ? "bg-indigo-600/20 text-white ring-1 ring-indigo-500/30"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              <div className="font-medium">{u.displayName}</div>
              <div className="text-xs text-gray-500">
                @{u.username} · {ROLE_LABELS[u.role]}
              </div>
            </button>
          ))}
        </div>

        {/* ── Right: agent assignment grid ── */}
        <div className="flex-1">
          {selectedUser && rolePerm && (
            <>
              <div className="mb-3 flex items-center gap-3">
                <span className="text-sm font-semibold text-white">
                  {selectedUser.displayName} 的 Agent 权限
                </span>
                <button
                  onClick={() => batchAssignRole(selectedUser.role)}
                  className="rounded-lg bg-amber-500/10 px-3 py-1 text-xs text-amber-400 ring-1 ring-amber-500/20 transition hover:bg-amber-500/20"
                >
                  按角色批量分配
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {agents.map((agent) => {
                  const assigned = isAgentAssigned(selectedUser.id, agent.id);
                  return (
                    <label
                      key={agent.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                        assigned
                          ? "border-emerald-500/20 bg-emerald-500/5"
                          : "border-white/10 bg-white/[0.03]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={assigned}
                        onChange={() => toggleAgent(selectedUser.id, agent.id)}
                        className="mt-0.5 rounded"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-white">
                            {agent.name}
                          </span>
                          <StatusBadge status={agent.status} />
                        </div>
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {agent.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
