import { useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  ChevronRight,
  Home,
  CheckCircle,
  XCircle,
  AlertTriangle,
  GitCompareArrows,
  Package,
  Building2,
  Calendar,
  MessageSquare,
  Paperclip,
  Send,
  Link2,
  FileText,
  FileSpreadsheet,
  FileImage,
  ChevronDown,
  ArrowLeftRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTaskStore } from '@/store/useTaskStore';
import { useUINotificationStore } from '@/store/useUINotificationStore';
import { useUserStore } from '@/store/useUserStore';
import { mockFactors } from '@/data/mockFactors';
import type { ActivityData, ActivityStage, AuditComment, TaskVersion, Attachment } from '@/types';
import { formatDate, formatDateTime, formatEmission, formatFileSize, getStageLabel } from '@/utils/format';
import { sumTotalEmissions } from '@/utils/emission';
import StatusTag from '@/components/common/StatusTag';
import CommentThread from '@/components/business/CommentThread';
import Modal from '@/components/common/Modal';
import AccessGuard from '@/components/access/AccessGuard';

const STAGES: ActivityStage[] = ['material', 'production', 'transport'];

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) return FileImage;
  if (fileType.includes('pdf') || fileType.includes('word')) return FileText;
  if (fileType.includes('excel') || fileType.includes('sheet')) return FileSpreadsheet;
  return FileText;
}

export default function AuditPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const getTaskById = useTaskStore((s) => s.getTaskById);
  const markAnomaly = useTaskStore((s) => s.markAnomaly);
  const unmarkAnomaly = useTaskStore((s) => s.unmarkAnomaly);
  const addAuditComment = useTaskStore((s) => s.addAuditComment);
  const approveTask = useTaskStore((s) => s.approveTask);
  const rejectTask = useTaskStore((s) => s.rejectTask);
  const showToast = useUINotificationStore((s) => s.showToast);
  const currentUser = useUserStore((s) => s.currentUser);
  const userRole = useUserStore((s) => s.userRole);

  const task = taskId ? getTaskById(taskId) : undefined;

  const [viewMode, setViewMode] = useState<'single' | 'compare'>('single');
  const [selectedVersionA, setSelectedVersionA] = useState<number>(0);
  const [selectedVersionB, setSelectedVersionB] = useState<number>(0);
  const [commentText, setCommentText] = useState('');
  const [referencedDataIds, setReferencedDataIds] = useState<string[]>([]);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [versionSelectOpen, setVersionSelectOpen] = useState<'a' | 'b' | null>(null);

  const sortedVersions = useMemo(() => {
    if (!task) return [] as TaskVersion[];
    return [...task.versions].sort((a, b) => b.version - a.version);
  }, [task]);

  const currentVersion = useMemo(() => {
    if (!task || task.versions.length === 0) return null;
    return task.versions[task.versions.length - 1];
  }, [task]);

  const versionA = useMemo(() => {
    if (!task) return null;
    return task.versions.find((v) => v.version === selectedVersionA) ?? currentVersion;
  }, [task, selectedVersionA, currentVersion]);

  const versionB = useMemo(() => {
    if (!task) return null;
    return task.versions.find((v) => v.version === selectedVersionB) ?? null;
  }, [task, selectedVersionB]);

  const activityData = useMemo(() => currentVersion?.data ?? [], [currentVersion]);
  const attachments = useMemo(() => currentVersion?.attachments ?? [], [currentVersion]);

  const groupedData = useMemo(() => {
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

  const totalEmission = useMemo(() => sumTotalEmissions(activityData), [activityData]);

  const dataDiffMap = useMemo(() => {
    if (!versionA || !versionB) return new Map<string, { changed: boolean; field?: string }>();
    const diff = new Map<string, { changed: boolean; field?: string }>();
    versionA.data.forEach((itemA) => {
      const itemB = versionB.data.find((d) => d.id === itemA.id);
      if (!itemB) {
        diff.set(itemA.id, { changed: true });
      } else {
        const fields = ['name', 'quantity', 'unit', 'factorId', 'emission'] as const;
        for (const field of fields) {
          if (itemA[field] !== itemB[field]) {
            diff.set(itemA.id, { changed: true, field });
            break;
          }
        }
      }
    });
    versionB.data.forEach((itemB) => {
      if (!versionA.data.find((d) => d.id === itemB.id)) {
        diff.set(itemB.id, { changed: true });
      }
    });
    return diff;
  }, [versionA, versionB]);

  const toggleAnomaly = useCallback(
    (dataId: string) => {
      if (!taskId || !task) return;
      if (task.anomalies.includes(dataId)) {
        unmarkAnomaly(taskId, dataId);
        showToast('info', '已取消异常标记');
      } else {
        markAnomaly(taskId, dataId);
        showToast('warning', '已标记为异常数据');
      }
    },
    [taskId, task, markAnomaly, unmarkAnomaly, showToast]
  );

  const toggleReference = useCallback((dataId: string) => {
    setReferencedDataIds((prev) =>
      prev.includes(dataId) ? prev.filter((id) => id !== dataId) : [...prev, dataId]
    );
  }, []);

  const handleSendComment = useCallback(() => {
    if (!taskId || !commentText.trim() || !currentUser) return;
    const newComment: AuditComment = {
      id: `c-${Date.now()}`,
      taskId,
      version: task?.currentVersion ?? 1,
      author: currentUser.name,
      authorRole: userRole,
      content: commentText.trim(),
      createdAt: new Date().toISOString(),
      references: referencedDataIds.length > 0 ? referencedDataIds : undefined,
    };
    addAuditComment(taskId, newComment);
    setCommentText('');
    setReferencedDataIds([]);
    showToast('success', '意见已发送');
  }, [taskId, commentText, currentUser, userRole, referencedDataIds, task, addAuditComment, showToast]);

  const handleApprove = useCallback(() => {
    if (!taskId) return;
    approveTask(taskId);
    showToast('success', '审核已通过');
  }, [taskId, approveTask, showToast]);

  const handleReject = useCallback(() => {
    if (!taskId || !rejectReason.trim()) {
      showToast('error', '请填写驳回原因');
      return;
    }
    rejectTask(taskId, rejectReason.trim());
    setRejectModalOpen(false);
    setRejectReason('');
    showToast('info', '已驳回任务');
  }, [taskId, rejectReason, rejectTask, showToast]);

  const getFactorName = useCallback(
    (factorId: string | null) => {
      if (!factorId) return '--';
      const factor = mockFactors.find((f) => f.id === factorId);
      return factor ? factor.name : '--';
    },
    []
  );

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="h-12 w-12 text-slate-400 mb-4" />
        <p className="text-lg text-slate-600">任务不存在</p>
      </div>
    );
  }

  const renderDataRow = (item: ActivityData, isCompare: boolean = false, side?: 'a' | 'b') => {
    const isAnomaly = task.anomalies.includes(item.id);
    const isReferenced = referencedDataIds.includes(item.id);
    const hasDiff = isCompare && dataDiffMap.has(item.id);

    return (
      <div
        key={`${item.id}-${side ?? 'single'}`}
        className={cn(
          'p-4 rounded-lg border transition-all',
          isAnomaly ? 'border-clay-300 bg-clay-50/50' : 'border-slate-200 bg-white hover:shadow-card',
          hasDiff && 'ring-2 ring-sand-300 bg-sand-50/30'
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-forest-800">{item.name || '--'}</span>
              {isReferenced && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-forest-100 text-forest-700">
                  <Link2 className="h-3 w-3" />
                  已引用
                </span>
              )}
              {hasDiff && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-sand-100 text-sand-600">
                  <ArrowLeftRight className="h-3 w-3" />
                  有变更
                </span>
              )}
            </div>
            <div className="mt-2 grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-1 text-sm">
              <div>
                <span className="text-slate-500">数量：</span>
                <span className="text-slate-700 font-medium">{item.quantity ?? '--'} {item.unit}</span>
              </div>
              <div>
                <span className="text-slate-500">排放因子：</span>
                <span className="text-slate-700 font-medium">{getFactorName(item.factorId)}</span>
              </div>
              <div>
                <span className="text-slate-500">排放量：</span>
                <span className="font-semibold text-forest-700">{formatEmission(item.emission)}</span>
              </div>
              <div>
                <span className="text-slate-500">阶段：</span>
                <span className="text-slate-700">{getStageLabel(item.stage)}</span>
              </div>
            </div>
            {item.remark && (
              <div className="mt-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded">
                备注：{item.remark}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!isCompare && (
              <button
                type="button"
                onClick={() => toggleReference(item.id)}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  isReferenced
                    ? 'bg-forest-100 text-forest-600'
                    : 'text-slate-400 hover:bg-slate-100 hover:text-forest-500'
                )}
                title="引用到意见"
              >
                <Link2 className="h-4 w-4" />
              </button>
            )}
            {!isCompare && (
              <button
                type="button"
                onClick={() => toggleAnomaly(item.id)}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  isAnomaly
                    ? 'bg-clay-100 text-clay-600'
                    : 'text-slate-400 hover:bg-clay-50 hover:text-clay-500'
                )}
                title={isAnomaly ? '取消异常标记' : '标记为异常'}
              >
                <AlertTriangle className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <AccessGuard taskId={taskId!}>
      <div className="space-y-6">
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Home className="h-4 w-4" />
        <ChevronRight className="h-4 w-4" />
        <span>任务管理</span>
        <ChevronRight className="h-4 w-4" />
        <span className="text-forest-700 font-medium">审核</span>
      </nav>

      <div className="rounded-xl border border-forest-100 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-forest-800">碳排放数据审核</h1>
              <StatusTag status={task.status} />
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-forest-100 text-forest-700 text-sm font-medium">
                V{task.currentVersion || 0}
              </span>
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('single')}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                viewMode === 'single'
                  ? 'bg-forest-500 text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              )}
            >
              <FileText className="h-4 w-4" />
              单版本
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('compare');
                if (sortedVersions.length >= 2) {
                  setSelectedVersionA(sortedVersions[0].version);
                  setSelectedVersionB(sortedVersions[1].version);
                }
              }}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                viewMode === 'compare'
                  ? 'bg-forest-500 text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              )}
            >
              <GitCompareArrows className="h-4 w-4" />
              版本对比
            </button>
          </div>
        </div>

        {viewMode === 'compare' && sortedVersions.length >= 2 && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => setVersionSelectOpen(versionSelectOpen === 'a' ? null : 'a')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700"
              >
                版本 A：V{versionA?.version ?? 0}
                <ChevronDown className="h-4 w-4" />
              </button>
              {versionSelectOpen === 'a' && (
                <div className="absolute left-0 top-full mt-1 w-48 rounded-lg border border-slate-200 bg-white shadow-lg z-20 overflow-hidden">
                  {sortedVersions.map((v) => (
                    <button
                      key={v.version}
                      type="button"
                      onClick={() => {
                        setSelectedVersionA(v.version);
                        setVersionSelectOpen(null);
                      }}
                      className={cn(
                        'w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors',
                        selectedVersionA === v.version && 'bg-forest-50 text-forest-700 font-medium'
                      )}
                    >
                      V{v.version} - {formatDateTime(v.submitTime)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <ArrowLeftRight className="h-5 w-5 text-slate-400" />
            <div className="relative">
              <button
                type="button"
                onClick={() => setVersionSelectOpen(versionSelectOpen === 'b' ? null : 'b')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700"
              >
                版本 B：V{versionB?.version ?? 0}
                <ChevronDown className="h-4 w-4" />
              </button>
              {versionSelectOpen === 'b' && (
                <div className="absolute left-0 top-full mt-1 w-48 rounded-lg border border-slate-200 bg-white shadow-lg z-20 overflow-hidden">
                  {sortedVersions.map((v) => (
                    <button
                      key={v.version}
                      type="button"
                      onClick={() => {
                        setSelectedVersionB(v.version);
                        setVersionSelectOpen(null);
                      }}
                      className={cn(
                        'w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors',
                        selectedVersionB === v.version && 'bg-forest-50 text-forest-700 font-medium'
                      )}
                    >
                      V{v.version} - {formatDateTime(v.submitTime)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {viewMode === 'single' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {STAGES.map((stage) => (
              <div key={stage} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-forest-800">{getStageLabel(stage)}</h3>
                  <span className="text-sm text-slate-500">{groupedData[stage].length} 项</span>
                </div>
                {groupedData[stage].length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">该阶段暂无数据</p>
                ) : (
                  <div className="space-y-3">
                    {groupedData[stage].map((item) => renderDataRow(item))}
                  </div>
                )}
              </div>
            ))}

            <div className="rounded-xl border border-forest-100 bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <Paperclip className="h-5 w-5 text-forest-600" />
                <h3 className="font-semibold text-forest-800">附件查看</h3>
                <span className="text-sm text-slate-500">({attachments.length})</span>
              </div>
              {attachments.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">暂无附件</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {attachments.map((att: Attachment) => {
                    const Icon = getFileIcon(att.type);
                    return (
                      <div
                        key={att.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-forest-50">
                          <Icon className="h-5 w-5 text-forest-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-forest-800 truncate">{att.name}</p>
                          <p className="text-xs text-slate-500">
                            {formatFileSize(att.size)} · {formatDateTime(att.uploadTime)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-5 w-5 text-forest-600" />
                <h3 className="font-semibold text-forest-800">审核意见</h3>
              </div>
              <div className="space-y-3">
                {referencedDataIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {referencedDataIds.map((id) => {
                      const item = activityData.find((d) => d.id === id);
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-forest-100 text-forest-700 text-xs"
                        >
                          <Link2 className="h-3 w-3" />
                          {item?.name || id}
                          <button
                            type="button"
                            onClick={() => toggleReference(id)}
                            className="ml-0.5 hover:text-clay-500"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="请输入审核意见..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm outline-none transition-all focus:ring-2 focus:ring-forest-200 focus:border-forest-400 resize-none"
                />
                <button
                  type="button"
                  onClick={handleSendComment}
                  disabled={!commentText.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-forest-500 text-sm font-medium text-white hover:bg-forest-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                  发送意见
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-5 w-5 text-slate-500" />
                <h3 className="font-semibold text-slate-700">历史意见</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                <CommentThread comments={task.comments} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-semibold text-forest-800">版本 A - V{versionA?.version ?? 0}</h3>
                {versionA && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {versionA.submitter} · {formatDateTime(versionA.submitTime)}
                  </p>
                )}
              </div>
              <span className="text-sm font-medium text-forest-600">
                {formatEmission(versionA ? sumTotalEmissions(versionA.data) : 0)}
              </span>
            </div>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {versionA?.data.map((item) => renderDataRow(item, true, 'a'))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-semibold text-forest-800">版本 B - V{versionB?.version ?? 0}</h3>
                {versionB && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {versionB.submitter} · {formatDateTime(versionB.submitTime)}
                  </p>
                )}
              </div>
              <span className="text-sm font-medium text-forest-600">
                {formatEmission(versionB ? sumTotalEmissions(versionB.data) : 0)}
              </span>
            </div>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {versionB?.data.map((item) => renderDataRow(item, true, 'b'))}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'single' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setRejectModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-clay-300 bg-white text-sm font-medium text-clay-600 hover:bg-clay-50 transition-colors"
          >
            <XCircle className="h-4 w-4" />
            驳回
          </button>
          <button
            type="button"
            onClick={handleApprove}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-forest-500 text-sm font-medium text-white hover:bg-forest-600 transition-colors shadow-sm"
          >
            <CheckCircle className="h-4 w-4" />
            通过
          </button>
        </div>
      )}

      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="驳回任务"
        footer={
          <>
            <button
              type="button"
              onClick={() => setRejectModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleReject}
              className="px-4 py-2 rounded-lg bg-clay-500 text-sm font-medium text-white hover:bg-clay-600 transition-colors"
            >
              确认驳回
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">请填写驳回原因，供应商将根据您的意见修改后重新提交。</p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="请输入驳回原因..."
            rows={4}
            className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm outline-none transition-all focus:ring-2 focus:ring-clay-200 focus:border-clay-400 resize-none"
          />
        </div>
      </Modal>
      </div>
    </AccessGuard>
  );
}
