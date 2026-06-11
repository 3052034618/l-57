import { Inbox } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

export default function EmptyState({ title, description, icon: Icon }: EmptyStateProps) {
  const DisplayIcon = Icon || Inbox;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-forest-50 mb-6">
        <DisplayIcon className="h-10 w-10 text-forest-400" />
      </div>
      <h3 className="text-lg font-semibold text-forest-800 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 text-center max-w-sm">{description}</p>
    </div>
  );
}
