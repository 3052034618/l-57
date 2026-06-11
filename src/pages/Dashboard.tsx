import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  Bell,
  Plus,
  Send,
  FileText,
  User
} from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import { useTaskStore } from '@/store/useTaskStore';
import StatCard from '@/components/business/StatCard';
import ProgressRing from '@/components/business/ProgressRing';
import TaskFilters from '@/components/business/TaskFilters';
import TaskTable from '@/components/business/TaskTable';
import type { Task, TaskFilter, TaskStatus } from '@/types';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser, userRole } = useUserStore();
  const { tasks } = useTaskStore();
  const [filters, setFilters] = useState<TaskFilter>({});

  const visibleTasks = useMemo(() => {
    if (userRole === 'supplier') {
      return tasks.filter((t) => t.supplierId === 'sup-001');
    }
    return tasks;
  }, [tasks, userRole]);

  const stats = useMemo(() => {
    const pending = visibleTasks.filter(
      (t) => t.status === 'pending' || t.status === 'draft'
    ).length;
    const auditing = visibleTasks.filter(
      (t) => t.status === 'submitted' || t.status === 'auditing'
    ).length;
    const approved = visibleTasks.filter((t) => t.status === 'approved').length;
    const rejected = visibleTasks.filter((t) => t.status === 'rejected').length;
    const total = visibleTasks.length;
    const completionRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    return { pending, auditing, approved, rejected, total, completionRate };
  }, [visibleTasks]);

  const filteredTasks = useMemo(() => {
    let result = [...visibleTasks];

    if (filters.status) {
      result = result.filter((t) => t.status === filters.status);
    }

    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      result = result.filter(
        (t) =>
          t.productName.toLowerCase().includes(kw) ||
          t.productCode.toLowerCase().includes(kw) ||
          t.supplierName.toLowerCase().includes(kw)
      );
    }

    if (filters.dateFrom) {
      result = result.filter((t) => t.deadline >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      result = result.filter((t) => t.deadline <= filters.dateTo!);
    }

    return result;
  }, [visibleTasks, filters]);

  const handleViewTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (userRole === 'enterprise') {
      if (task && (task.status === 'approved' || task.status === 'rejected')) {
        navigate(`/audit/${taskId}`);
      } else {
        navigate(`/report/${taskId}`);
      }
    } else {
      navigate(`/report/${taskId}`);
    }
  };

  const handleEditTask = (taskId: string) => {
    navigate(`/report/${taskId}`);
  };

  const handleAuditTask = (taskId: string) => {
    navigate(`/audit/${taskId}`);
  };

  const legendItems = [
    { label: '待填报', count: stats.pending, color: 'bg-clay-400' },
    { label: '审核中', count: stats.auditing, color: 'bg-forest-300' },
    { label: '已通过', count: stats.approved, color: 'bg-forest-500' },
    { label: '已驳回', count: stats.rejected, color: 'bg-clay-500' },
  ];

  const quickActions =
    userRole === 'enterprise'
      ? [
          { label: '新建任务', icon: Plus, color: 'from-forest-500 to-forest-600' },
          { label: '批量催办', icon: Send, color: 'from-forest-400 to-forest-500' },
          { label: '导出报告', icon: FileText, color: 'from-forest-300 to-forest-500', onClick: () => navigate('/summary') },
        ]
      : [
          { label: '待填报任务', icon: ClipboardList, color: 'from-clay-400 to-clay-500' },
          { label: '我的消息', icon: Bell, color: 'from-forest-400 to-forest-500', onClick: () => navigate('/notifications') },
          { label: '填报指南', icon: FileText, color: 'from-forest-300 to-forest-500' },
        ];

  const welcomeText = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return '早上好';
    if (hour < 18) return '下午好';
    return '晚上好';
  }, []);

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-forest-800 flex items-center gap-3">
              {welcomeText}，{currentUser?.name || '用户'}
              <span className="text-forest-400">👋</span>
            </h1>
            <p className="mt-1 text-slate-500">
              {currentUser?.company} ·{' '}
              {userRole === 'enterprise' ? '企业管理员' : '供应商填报员'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2.5 rounded-xl bg-white border border-forest-100 text-forest-600 hover:bg-forest-50 transition-colors shadow-card">
              <Bell className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white border border-forest-100 shadow-card">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center text-white font-semibold">
                <User className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-forest-800">
                  {currentUser?.name}
                </p>
                <p className="text-xs text-slate-500">{currentUser?.company}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          <StatCard
            title="待填报"
            value={stats.pending}
            icon={ClipboardList}
            color="orange"
            trend="需要尽快处理"
            trendUp={false}
          />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <StatCard
            title="审核中"
            value={stats.auditing}
            icon={Clock}
            color="teal"
            trend="正在审核流程"
            trendUp={true}
          />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <StatCard
            title="已通过"
            value={stats.approved}
            icon={CheckCircle2}
            color="green"
            trend="数据已确认"
            trendUp={true}
          />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="relative overflow-hidden rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 p-6 bg-gradient-to-br from-clay-400 to-clay-500">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-sm font-medium mb-1">已驳回</p>
                <p className="text-3xl font-bold text-white animate-count-up tabular-nums">
                  {stats.rejected}
                </p>
                <div className="mt-3 flex items-center gap-1">
                  <XCircle className="h-4 w-4 text-white/90" />
                  <span className="text-sm text-white/90">需重新提交</span>
                </div>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20">
                <XCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
            <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div
          className="lg:col-span-1 card p-6 animate-fade-in-up"
          style={{ animationDelay: '0.25s' }}
        >
          <h3 className="font-semibold text-forest-700 mb-5">任务完成进度</h3>
          <div className="flex flex-col items-center">
            <ProgressRing
              value={stats.approved}
              max={stats.total || 1}
              size={160}
              strokeWidth={14}
              centerText={`${stats.completionRate}%`}
            />
            <p className="mt-3 text-sm text-slate-500">
              共 {stats.total} 个任务，已完成 {stats.approved} 个
            </p>
          </div>
          <div className="mt-6 pt-5 border-t border-forest-100 space-y-3">
            {legendItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn('w-3 h-3 rounded-full', item.color)}
                  />
                  <span className="text-sm text-slate-600">{item.label}</span>
                </div>
                <span className="text-sm font-semibold text-forest-700">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="lg:col-span-2 card p-6 animate-fade-in-up"
          style={{ animationDelay: '0.3s' }}
        >
          <h3 className="font-semibold text-forest-700 mb-5">快捷操作</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {quickActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className="group relative flex flex-col items-center justify-center gap-3 p-5 rounded-xl bg-gradient-to-br from-forest-50 to-forest-100/50 border border-forest-100 hover:border-forest-300 hover:shadow-card-hover transition-all duration-300"
                >
                  <div
                    className={cn(
                      'flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br text-white shadow-md group-hover:scale-110 transition-transform duration-300',
                      action.color
                    )}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-forest-700 group-hover:text-forest-800">
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-forest-50 to-sand-50 border border-forest-100">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-forest-100 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-forest-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-forest-800">
                  {userRole === 'enterprise'
                    ? '您有 ' + stats.auditing + ' 个任务等待审核'
                    : '您有 ' + stats.pending + ' 个任务需要填报'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  请及时处理，避免影响后续流程
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
        <TaskFilters onFilterChange={setFilters} />
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-forest-700">
            任务列表
            <span className="ml-2 text-sm font-normal text-slate-500">
              共 {filteredTasks.length} 条
            </span>
          </h3>
        </div>
        <TaskTable
          tasks={filteredTasks}
          onView={handleViewTask}
          onEdit={handleEditTask}
          onAudit={handleAuditTask}
          role={userRole}
        />
      </div>
    </div>
  );
}
