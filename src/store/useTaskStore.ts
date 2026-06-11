import { create } from 'zustand';
import type { Task, TaskStatus, ActivityData, Attachment, AuditComment } from '@/types';
import { mockTasks as initialTasks } from '@/data/mockTasks';
import { validateTaskSubmission } from '@/utils/validation';

interface TaskState {
  tasks: Task[];
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  getTaskById: (id: string) => Task | undefined;
  getTasksByStatus: (status: TaskStatus) => Task[];
  getTasksBySupplier: (supplierId: string) => Task[];
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  updateActivityData: (taskId: string, dataId: string, updates: Partial<ActivityData>) => void;
  addAttachment: (taskId: string, attachment: Attachment) => void;
  removeAttachment: (taskId: string, attachmentId: string) => void;
  addAuditComment: (taskId: string, comment: AuditComment) => void;
  submitTask: (taskId: string) => { success: boolean; errors?: string[] };
  approveTask: (taskId: string, comment?: string) => void;
  rejectTask: (taskId: string, reason: string) => void;
  markAnomaly: (taskId: string, dataId: string) => void;
  unmarkAnomaly: (taskId: string, dataId: string) => void;
  saveDraft: (taskId: string, versionComment?: string) => void;
  sendReminders: (taskIds: string[], content: string) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: initialTasks,
  selectedTaskId: null,

  setSelectedTaskId: (id) => set({ selectedTaskId: id }),

  getTaskById: (id) => get().tasks.find((t) => t.id === id),

  getTasksByStatus: (status) => get().tasks.filter((t) => t.status === status),

  getTasksBySupplier: (supplierId) => get().tasks.filter((t) => t.supplierId === supplierId),

  updateTaskStatus: (taskId, status) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, status, updatedAt: new Date().toISOString() } : t
      ),
    })),

  updateActivityData: (taskId, dataId, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const latestVersion = t.versions[t.versions.length - 1];
        const updatedData = latestVersion.data.map((d) =>
          d.id === dataId ? { ...d, ...updates } : d
        );
        const updatedVersions = [...t.versions];
        updatedVersions[updatedVersions.length - 1] = { ...latestVersion, data: updatedData };
        return {
          ...t,
          versions: updatedVersions,
          updatedAt: new Date().toISOString(),
        };
      }),
    })),

  addAttachment: (taskId, attachment) =>
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const latestVersion = t.versions[t.versions.length - 1];
        const updatedVersions = [...t.versions];
        updatedVersions[updatedVersions.length - 1] = {
          ...latestVersion,
          attachments: [...latestVersion.attachments, attachment],
        };
        return {
          ...t,
          versions: updatedVersions,
          updatedAt: new Date().toISOString(),
        };
      }),
    })),

  removeAttachment: (taskId, attachmentId) =>
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const latestVersion = t.versions[t.versions.length - 1];
        const updatedVersions = [...t.versions];
        updatedVersions[updatedVersions.length - 1] = {
          ...latestVersion,
          attachments: latestVersion.attachments.filter((a) => a.id !== attachmentId),
        };
        return {
          ...t,
          versions: updatedVersions,
          updatedAt: new Date().toISOString(),
        };
      }),
    })),

  addAuditComment: (taskId, comment) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, comments: [...t.comments, comment] } : t
      ),
    })),

  submitTask: (taskId) => {
    const state = get();
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return { success: false, errors: ['任务不存在'] };

    const validation = validateTaskSubmission(task);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    set({
      tasks: state.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const now = new Date().toISOString();
        const latestVersion = t.versions[t.versions.length - 1];
        const updatedVersion = { ...latestVersion, submitTime: now };
        const updatedVersions = [...t.versions];
        updatedVersions[updatedVersions.length - 1] = updatedVersion;
        return {
          ...t,
          status: 'submitted',
          versions: updatedVersions,
          updatedAt: now,
        };
      }),
    });
    return { success: true };
  },

  approveTask: (taskId, comment) =>
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const now = new Date().toISOString();
        const newComment: AuditComment = {
          id: `c-${Date.now()}`,
          taskId,
          version: t.currentVersion,
          author: '张明远',
          authorRole: 'enterprise',
          content: comment || '审核通过，数据完整准确。',
          createdAt: now,
        };
        return {
          ...t,
          status: 'approved',
          comments: [...t.comments, newComment],
          updatedAt: now,
        };
      }),
    })),

  rejectTask: (taskId, reason) =>
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const now = new Date().toISOString();
        const newComment: AuditComment = {
          id: `c-${Date.now()}`,
          taskId,
          version: t.currentVersion,
          author: '张明远',
          authorRole: 'enterprise',
          content: reason,
          createdAt: now,
        };
        return {
          ...t,
          status: 'rejected',
          comments: [...t.comments, newComment],
          updatedAt: now,
        };
      }),
    })),

  markAnomaly: (taskId, dataId) =>
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== taskId) return t;
        if (t.anomalies.includes(dataId)) return t;
        return { ...t, anomalies: [...t.anomalies, dataId] };
      }),
    })),

  unmarkAnomaly: (taskId, dataId) =>
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return { ...t, anomalies: t.anomalies.filter((id) => id !== dataId) };
      }),
    })),

  saveDraft: (taskId, versionComment) =>
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const now = new Date().toISOString();
        return {
          ...t,
          status: 'draft',
          updatedAt: now,
          versions: t.versions.map((v, idx) =>
            idx === t.versions.length - 1
              ? { ...v, comment: versionComment || v.comment }
              : v
          ),
        };
      }),
    })),

  sendReminders: (taskIds, content) => {
    console.log('发送催办:', taskIds, content);
  },
}));
