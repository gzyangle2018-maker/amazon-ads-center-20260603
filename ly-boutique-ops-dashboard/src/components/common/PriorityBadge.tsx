import type { Priority } from '@/types';

const styles: Record<Priority, string> = {
  P0: 'bg-accent-red/15 text-accent-red border-accent-red/30',
  P1: 'bg-accent-orange/15 text-accent-orange border-accent-orange/30',
  P2: 'bg-accent-blue/15 text-accent-blue border-accent-blue/30',
  P3: 'bg-text-muted/15 text-text-muted border-text-muted/20',
};

const labels: Record<Priority, string> = {
  P0: 'P0 · 紧急',
  P1: 'P1 · 高优',
  P2: 'P2 · 常规',
  P3: 'P3 · 观察',
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`chip border ${styles[priority]} font-semibold`}>
      {labels[priority]}
    </span>
  );
}
