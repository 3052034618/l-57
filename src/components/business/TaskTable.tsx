import { Eye, Edit, ClipboardCheck } from 'lucide-react';
import type { Task, UserRole, TaskStatus } from '@/types';
import StatusTag from '@/components/common/StatusTag';
import { formatDate } from '@/utils/format';
import { cn } from '@/lib/utils';

interface TaskTableProps {
  tasks: Task[];
  onView: (taskId: string) => void;
  onEdit?: (taskId: string) => void;
  onAudit?: (taskId: string) => void;
  role: UserRole;
}

const getProgressByStatus = (status: TaskStatus, currentVersion: number): number => {
  if (status === 'approved') return 100;
  if (status === 'auditing') return 80;
  if (status === 'submitted') return 60;
  if (status === 'rejected') return 40;
  if (status === 'draft') return currentVersion > 0 ? 30 : 15;
  return 10;
};

export default function TaskTable({ tasks, onView, onEdit, onAudit, role }: TaskTableProps) {
  if (tasks.length === 0) {
    return (
      <div className="card p-8">
        <div className="text-center text-slate-500 py-8">
          <p className="text-lg">暂无任务数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-forest-50/50 border-b border-forest-100">
              <th className="px-6 py-4 text-left text-sm font-semibold text-forest-700">
                产品名称/物料编码
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-forest-700">
                供应商
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-forest-700">
                截止日期
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-forest-700">
                状态
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-forest-700 w-48">
                进度
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-forest-700">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const progress = getProgressByStatus(task.status, task.currentVersion);
              return (
                <tr key={task.id} className="table-row">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-forest-800">{task.productName}</span>
                      <span className="text-sm text-slate-500">{task.productCode}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-forest-700">{task.supplierName}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-600">{formatDate(task.deadline)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusTag status={task.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            progress >= 80
                              ? 'bg-gradient-to-r from-forest-400 to-forest-600'
                              : progress >= 50
                              ? 'bg-gradient-to-r from-forest-300 to-forest-500'
                              : progress >= 30
                              ? 'bg-gradient-to-r from-sand-300 to-sand-500'
                              : 'bg-gradient-to-r from-clay-300 to-clay-500'
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-600 w-10 text-right">
                        {progress}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onView(task.id)}
                        className="p-2 rounded-lg text-forest-600 hover:bg-forest-50 transition-colors"
                        title="查看详情"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {role === 'supplier' && onEdit && task.status !== 'approved' && (
                        <button
                          onClick={() => onEdit(task.id)}
                          className="p-2 rounded-lg text-forest-600 hover:bg-forest-50 transition-colors"
                          title="编辑"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      {role === 'enterprise' && onAudit && (task.status === 'submitted' || task.status === 'auditing') && (
                        <button
                          onClick={() => onAudit(task.id)}
                          className="p-2 rounded-lg text-forest-600 hover:bg-forest-50 transition-colors"
                          title="审核"
                        >
                          <ClipboardCheck className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
