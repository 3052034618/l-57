import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { useUserStore } from '@/store/useUserStore';

interface AccessGuardProps {
  taskId: string;
  children: ReactNode;
  onBack?: () => void;
}

export default function AccessGuard({ taskId, children, onBack }: AccessGuardProps) {
  const navigate = useNavigate();
  const { userRole } = useUserStore();
  const getTaskById = useTaskStore((s) => s.getTaskById);
  const task = getTaskById(taskId);

  if (userRole === 'supplier' && task && task.supplierId !== 'sup-001') {
    const handleBack = () => {
      if (onBack) {
        onBack();
      } else {
        navigate('/dashboard');
      }
    };

    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-full bg-clay-100 blur-2xl opacity-60" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-clay-50 border-4 border-clay-100">
            <ShieldAlert className="h-12 w-12 text-clay-500" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">无访问权限</h2>
        <p className="text-slate-500 mb-8 text-center max-w-md">
          您当前登录的账号无权访问此任务。该任务属于其他供应商，
          请确认任务归属或联系企业管理员。
        </p>
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-forest-500 text-sm font-medium text-white hover:bg-forest-600 transition-colors shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          返回工作台
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
