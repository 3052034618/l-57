import { useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  ChevronRight,
  Home,
  Save,
  Send,
  History,
  ChevronDown,
  Leaf,
  Factory,
  Truck,
  Check,
  AlertCircle,
  AlertTriangle,
  Paperclip,
  MessageSquare,
  Package,
  Building2,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTaskStore } from '@/store/useTaskStore';
import { useUINotificationStore } from '@/store/useUINotificationStore';
import { mockFactors } from '@/data/mockFactors';
import type { ActivityData, ActivityStage, Attachment, TaskVersion } from '@/types';
import { formatDate, formatDateTime, formatEmission, getStageLabel } from '@/utils/format';
import { validateActivityData, validateTaskSubmission } from '@/utils/validation';
import { sumStageEmissions, sumTotalEmissions } from '@/utils/emission';
import StatusTag from '@/components/common/StatusTag';
import StageSection from '@/components/business/StageSection';
import AttachmentUploader from '@/components/business/AttachmentUploader';
import CommentThread from '@/components/business/CommentThread';
import AccessGuard from '@/components/access/AccessGuard';

const STAGES: ActivityStage[] = ['material', 'production', 'transport'];

const STAGE_INFO: Record<ActivityStage, { icon: typeof Leaf; title: string; step: number }> = {
  material: { icon: Leaf, title: '原材料获取', step: 1 },
  production: { icon: Factory, title: '生产制造', step: 2 },
  transport: { icon: Truck, title: '运输配送', step: 3 },
};

export default function ReportForm() {
  const { taskId } = useParams<{ taskId: string }>();
  const getTaskById = useTaskStore((s) => s.getTaskById);
  const updateActivityData = useTaskStore((s) => s.updateActivityData);
  const addActivityData = useTaskStore((s) => s.addActivityData);
  const addAttachment = useTaskStore((s) => s.addAttachment);
  const removeAttachment = useTaskStore((s) => s.removeAttachment);
  const saveDraft = useTaskStore((s) => s.saveDraft);
  const submitTask = useTaskStore((s) => s.submitTask);
  const showToast = useUINotificationStore((s) => s.showToast);

  const task = taskId ? getTaskById(taskId) : undefined;

  const [expandedStages, setExpandedStages] = useState<Record<ActivityStage, boolean>>({
    material: true,
    production: false,
    transport: false,
  });
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);

  const currentVersion = useMemo(() => {
    if (!task || task.versions.length === 0) return null;
    return task.versions[task.versions.length - 1];
  }, [task]);

  const activityData = useMemo(() => currentVersion?.data ?? [], [currentVersion]);
  const attachments = useMemo(() => currentVersion?.attachments ?? [], [currentVersion]);

  const stageData = useMemo(() => {
    const result: Record<ActivityStage, ActivityData[]> = {
      material: [],
      production: [],
      transport: [],
    };
    activityData.forEach((item) => {
      result[item.stage].push(item);
    });
    return result;
  }, [activityData]);

  const validationErrors = useMemo(() => {
    const errors: Record<string, string[]> = {};
    activityData.forEach((item) => {
      const itemErrors = validateActivityData(item);
      if (itemErrors.length > 0) {
        errors[item.id] = itemErrors;
      }
    });
    return errors;
  }, [activityData]);

  const validationSummary = useMemo(() => {
    if (!task) return { missing: 0, anomalies: 0 };
    const result = validateTaskSubmission(task);
    const anomalyCount = task.anomalies.length;
    return {
      missing: result.missingFields.filter((f) => !f.startsWith('stage-') && f !== 'attachments' && f !== 'versions' && f !== 'activityData').length,
      anomalies: anomalyCount,
    };
  }, [task, activityData]);

  const totalEmission = useMemo(() => sumTotalEmissions(activityData), [activityData]);

  const toggleStage = useCallback((stage: ActivityStage) => {
    setExpandedStages((prev) => ({ ...prev, [stage]: !prev[stage] }));
  }, []);

  const handleDataChange = useCallback(
    (dataId: string, updates: Partial<ActivityData>) => {
      if (!taskId) return;
      updateActivityData(taskId, dataId, updates);
    },
    [taskId, updateActivityData]
  );

  const handleAddAttachments = useCallback(
    (files: File[]) => {
      if (!taskId) return;
      files.forEach((file, index) => {
        const newAttachment: Attachment = {
          id: `att-${Date.now()}-${index}`,
          name: file.name,
          type: file.type,
          size: file.size,
          uploadTime: new Date().toISOString(),
        };
        addAttachment(taskId, newAttachment);
      });
      showToast('success', `成功上传 ${files.length} 个文件`);
    },
    [taskId, addAttachment, showToast]
  );

  const handleRemoveAttachment = useCallback(
    (attachmentId: string) => {
      if (!taskId) return;
      removeAttachment(taskId, attachmentId);
      showToast('info', '已删除附件');
    },
    [taskId, removeAttachment, showToast]
  );

  const handleSaveDraft = useCallback(() => {
    if (!taskId) return;
    saveDraft(taskId);
    showToast('success', '草稿已保存');
  }, [taskId, saveDraft, showToast]);

  const handleSubmit = useCallback(() => {
    if (!taskId) return;
    const result = submitTask(taskId);
    if (result.success) {
      showToast('success', '提交审核成功');
    } else {
      showToast('error', `提交失败：${result.errors?.join('；') ?? '未知错误'}`);
    }
  }, [taskId, submitTask, showToast]);

  const handleAddActivityData = useCallback(
    (stage: ActivityStage) => {
      if (!taskId) return;
      const random = Math.random().toString(36).slice(2, 8);
      const newItem: ActivityData = {
        id: `ad-${Date.now()}-${random}`,
        stage,
        name: '',
        quantity: null,
        unit: 'kg',
        factorId: null,
        emission: null,
      };
      addActivityData(taskId, stage, newItem);
      if (!expandedStages[stage]) {
        setExpandedStages((prev) => ({ ...prev, [stage]: true }));
      }
      showToast('success', `已新增${getStageLabel(stage)}活动数据`);
    },
    [taskId, addActivityData, expandedStages, showToast]
  );

  const scrollToError = useCallback(() => {
    const firstErrorId = Object.keys(validationErrors)[0];
    if (firstErrorId) {
      const element = document.querySelector(`[data-id="${firstErrorId}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [validationErrors]);

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-12 w-12 text-slate-400 mb-4" />
        <p className="text-lg text-slate-600">任务不存在</p>
      </div>
    );
  }

  return (
    <AccessGuard taskId={taskId!}>
      <div className="space-y-6">
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Home className="h-4 w-4" />
        <ChevronRight className="h-4 w-4" />
        <span>任务管理</span>
        <ChevronRight className="h-4 w-4" />
        <span className="text-forest-700 font-medium">资料填报</span>
      </nav>

      <div className="rounded-xl border border-forest-100 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-forest-800">碳排放数据填报</h1>
              <StatusTag status={task.status} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-500">产品：</span>
                <span className="text-sm font-medium text-slate-700">{task.productName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-500">供应商：</span>
                <span className="text-sm font-medium text-slate-700">{task.supplierName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-500">截止日期：</span>
                <span className="text-sm font-medium text-slate-700">{formatDate(task.deadline)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">总排放：</span>
                <span className="text-sm font-semibold text-forest-700">{formatEmission(totalEmission)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Save className="h-4 w-4" />
            保存草稿
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-forest-500 text-sm font-medium text-white hover:bg-forest-600 transition-colors shadow-sm"
          >
            <Send className="h-4 w-4" />
            提交审核
          </button>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setVersionHistoryOpen(!versionHistoryOpen)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <History className="h-4 w-4" />
            版本历史
            <span className="px-1.5 py-0.5 rounded bg-forest-100 text-forest-700 text-xs font-semibold">
              V{task.currentVersion || 0}
            </span>
            <ChevronDown className={cn('h-4 w-4 transition-transform', versionHistoryOpen && 'rotate-180')} />
          </button>
          {versionHistoryOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg z-20 overflow-hidden">
              {task.versions.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">暂无历史版本</div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {[...task.versions].reverse().map((version: TaskVersion) => (
                    <div
                      key={version.version}
                      className="p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-forest-700">V{version.version}</span>
                        {version.version === task.currentVersion && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-forest-100 text-forest-700">
                            <Check className="h-3 w-3" />
                            当前版本
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        提交人：{version.submitter} · {formatDateTime(version.submitTime)}
                      </div>
                      {version.comment && (
                        <div className="mt-2 text-sm text-slate-600 bg-slate-50 p-2 rounded">
                          {version.comment}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          {STAGES.map((stage, index) => {
            const info = STAGE_INFO[stage];
            const Icon = info.icon;
            const stageEmission = sumStageEmissions(activityData, stage);
            const isComplete = stageData[stage].length > 0 &&
              stageData[stage].every((item) => !validationErrors[item.id]);
            return (
              <div key={stage} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-full border-2 transition-colors',
                      isComplete
                        ? 'border-forest-500 bg-forest-500 text-white'
                        : stageData[stage].length > 0
                        ? 'border-forest-400 bg-forest-50 text-forest-600'
                        : 'border-slate-300 bg-white text-slate-400'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mt-2 text-center">
                    <div className="text-sm font-medium text-slate-700">{info.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {stageData[stage].length > 0 ? formatEmission(stageEmission) : '待填报'}
                    </div>
                  </div>
                </div>
                {index < STAGES.length - 1 && (
                  <div className={cn(
                    'flex-1 h-0.5 mx-2',
                    isComplete ? 'bg-forest-500' : 'bg-slate-200'
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {(validationSummary.missing > 0 || validationSummary.anomalies > 0) && (
        <button
          type="button"
          onClick={scrollToError}
          className="w-full flex items-center justify-between px-5 py-3 rounded-xl border border-clay-200 bg-clay-50 hover:bg-clay-100/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-clay-500" />
            <span className="text-sm font-medium text-clay-700">校验结果汇总</span>
          </div>
          <div className="flex items-center gap-4">
            {validationSummary.missing > 0 && (
              <span className="inline-flex items-center gap-1.5 text-sm">
                <span className="px-2 py-0.5 rounded-full bg-clay-100 text-clay-600 font-semibold">
                  {validationSummary.missing}
                </span>
                <span className="text-clay-600">缺项</span>
              </span>
            )}
            {validationSummary.anomalies > 0 && (
              <span className="inline-flex items-center gap-1.5 text-sm">
                <span className="px-2 py-0.5 rounded-full bg-clay-100 text-clay-600 font-semibold">
                  {validationSummary.anomalies}
                </span>
                <span className="text-clay-600">异常</span>
              </span>
            )}
            <span className="text-sm text-clay-500 underline">点击定位</span>
          </div>
        </button>
      )}

      <div className="space-y-4">
        {STAGES.map((stage) => (
          <div key={stage} data-id={`stage-${stage}`}>
            <StageSection
              stage={stage}
              title={getStageLabel(stage)}
              dataItems={stageData[stage]}
              factors={mockFactors}
              expanded={expandedStages[stage]}
              onToggle={() => toggleStage(stage)}
              onAddData={() => handleAddActivityData(stage)}
              onDataChange={handleDataChange}
              validationErrors={validationErrors}
            />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-forest-100 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <Paperclip className="h-5 w-5 text-forest-600" />
          <h2 className="text-lg font-semibold text-forest-800">附件上传</h2>
        </div>
        <AttachmentUploader
          attachments={attachments}
          onAdd={handleAddAttachments}
          onRemove={handleRemoveAttachment}
        />
      </div>

      <div className="rounded-xl border border-forest-100 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-forest-600" />
          <h2 className="text-lg font-semibold text-forest-800">审核意见</h2>
          <span className="text-sm text-slate-500">({task.comments.length})</span>
        </div>
        <CommentThread comments={task.comments} />
      </div>
      </div>
    </AccessGuard>
  );
}
