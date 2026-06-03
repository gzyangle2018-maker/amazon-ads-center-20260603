import type { AttributionConfidence } from '@/types';

const styles: Record<AttributionConfidence, string> = {
  A: 'bg-accent-green/15 text-accent-green border-accent-green/30',
  B: 'bg-accent-blue/15 text-accent-blue border-accent-blue/30',
  C: 'bg-accent-yellow/15 text-accent-yellow border-accent-yellow/30',
  D: 'bg-accent-red/15 text-accent-red border-accent-red/30',
};

const labels: Record<AttributionConfidence, string> = {
  A: 'A级 · 可执行',
  B: 'B级 · 可执行(需复核)',
  C: 'C级 · 仅参考',
  D: 'D级 · 禁止执行',
};

export function ConfidenceBadge({ confidence }: { confidence: AttributionConfidence }) {
  return (
    <span className={`chip border font-semibold ${styles[confidence]}`}>
      {labels[confidence]}
    </span>
  );
}
