import type { AgentStatus } from "../types/agent";
import { getStatusMeta } from "../types/agent";

interface StatusBadgeProps {
  status: AgentStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const meta = getStatusMeta(status);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${meta.bgColor} ${meta.color}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "online"
            ? "animate-pulse bg-emerald-400"
            : status === "developing"
              ? "bg-amber-400"
              : "bg-current"
        }`}
      />
      {meta.label}
    </span>
  );
}
