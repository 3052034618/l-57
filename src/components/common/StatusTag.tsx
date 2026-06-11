import type { TaskStatus } from '@/types';
import { getStatusLabel } from '@/utils/format';
import { cn } from '@/lib/utils';

interface StatusTagProps {
  status: TaskStatus;
}

const dotColors: Record<TaskStatus, string> = {
  pending: 'bg-sand-500',
  draft: 'bg-slate-400',
  submitted: 'bg-forest-500',
  auditing: 'bg-sky-500',
  approved: 'bg-forest-600',
  rejected: 'bg-clay-500',
};

const tagClasses: Record<TaskStatus, string> = {
  pending: 'tag-pending',
  draft: 'tag-draft',
  submitted: 'tag-submitted',
  auditing: 'tag-auditing',
  approved: 'tag-approved',
  rejected: 'tag-rejected',
};

export default function StatusTag({ status }: StatusTagProps) {
  return (
    <span className={cn('tag', tagClasses[status])}>
      <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[status])} />
      {getStatusLabel(status)}
    </span>
  );
}
