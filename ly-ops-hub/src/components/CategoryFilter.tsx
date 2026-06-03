import type { AgentCategory } from "../types/agent";
import { CATEGORY_META } from "../types/agent";

interface CategoryFilterProps {
  selected: AgentCategory | "all";
  onChange: (category: AgentCategory | "all") => void;
  counts: Record<string, number>;
}

export default function CategoryFilter({
  selected,
  onChange,
  counts,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange("all")}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
          selected === "all"
            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
            : "bg-white/5 text-gray-300 hover:bg-white/10"
        }`}
      >
        全部
        <span className="ml-1.5 text-xs opacity-60">
          {Object.values(counts).reduce((a, b) => a + b, 0)}
        </span>
      </button>

      {CATEGORY_META.map((cat) => (
        <button
          key={cat.key}
          onClick={() => onChange(cat.key)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            selected === cat.key
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
              : "bg-white/5 text-gray-300 hover:bg-white/10"
          }`}
        >
          {cat.icon} {cat.label}
          <span className="ml-1.5 text-xs opacity-60">
            {counts[cat.key] ?? 0}
          </span>
        </button>
      ))}
    </div>
  );
}
