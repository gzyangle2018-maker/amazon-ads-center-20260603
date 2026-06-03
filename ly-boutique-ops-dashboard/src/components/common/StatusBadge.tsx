import type { TaskStatus } from '@/types';
import { TASK_STATUS_LABELS } from '@/types';

const styles: Record<TaskStatus, string> = {
  not_started: 'bg-text-muted/10 text-text-muted border-text-muted/20',
  in_progress: 'bg-accent-blue/15 text-accent-blue border-accent-blue/30',
  pending_approval: 'bg-accent-yellow/15 text-accent-yellow border-accent-yellow/30',
  completed: 'bg-accent-green/15 text-accent-green border-accent-green/30',
  rework: 'bg-accent-orange/15 text-accent-orange border-accent-orange/30',
  closed: 'bg-white/5 text-text-muted border-white/10',
  monitor_only: 'bg-accent-purple/15 text-accent-purple border-accent-purple/30',
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`chip border text-[11px] ${styles[status]}`}>
      {TASK_STATUS_LABELS[status]}
    </span>
  );
}
