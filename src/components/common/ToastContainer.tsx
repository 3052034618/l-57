import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useUINotificationStore, type ToastType } from '@/store/useUINotificationStore';
import { cn } from '@/lib/utils';

const toastStyles: Record<ToastType, { bg: string; border: string; icon: typeof CheckCircle; iconColor: string }> = {
  success: {
    bg: 'bg-forest-50',
    border: 'border-forest-300',
    icon: CheckCircle,
    iconColor: 'text-forest-600',
  },
  error: {
    bg: 'bg-clay-50',
    border: 'border-clay-300',
    icon: XCircle,
    iconColor: 'text-clay-500',
  },
  warning: {
    bg: 'bg-sand-50',
    border: 'border-sand-300',
    icon: AlertTriangle,
    iconColor: 'text-sand-500',
  },
  info: {
    bg: 'bg-sky-50',
    border: 'border-sky-300',
    icon: Info,
    iconColor: 'text-sky-600',
  },
};

export default function ToastContainer() {
  const { toasts, removeToast } = useUINotificationStore();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 w-80">
      {toasts.map((toast) => {
        const style = toastStyles[toast.type];
        const Icon = style.icon;
        return (
          <div
            key={toast.id}
            className={cn(
              'flex items-start gap-3 p-4 rounded-lg shadow-card-hover border animate-fade-in-up',
              style.bg,
              style.border
            )}
          >
            <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', style.iconColor)} />
            <p className="flex-1 text-sm text-slate-700">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 p-0.5 rounded hover:bg-white/60 transition-colors"
            >
              <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
