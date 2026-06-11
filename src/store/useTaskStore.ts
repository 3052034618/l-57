import { create } from 'zustand';
import type { Task, TaskStatus, ActivityData, ActivityStage, Attachment, AuditComment, TaskVersion } from '@/types';
import { mockTasks as initialTasks } from '@/data/mockTasks';
import { validateTaskSubmission } from '@/utils/validation';
import { useUserStore } from '@/store/useUserStore';

function getCurrentUserName(): string {
  return useUserStore.getState().currentUser?.name || '当前用户';
}

function ensureInitialVersion(versions: TaskVersion[], now: string): TaskVersion[] {
  if (versions.length === 0) {
    return [
      {
        version: 1,
        submitTime: now,
        submitter: getCurrentUserName(),
        comment: '',
        data: [],
        attachments: [],
      },
    ];
  }
  return versions;
}

interface TaskState {
  tasks: Task[];
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  getTaskById: (id: string) => Task | undefined;
  getTasksByStatus: (status: TaskStatus) => Task[];
  getTasksBySupplier: (supplierId: string) => Task[];
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  updateActivityData: (taskId: string, dataId: string, updates: Partial<ActivityData>) => void;
  addActivityData: (taskId: string, stage: ActivityStage, newItem: ActivityData) => void;
  addAttachment: (taskId: string, attachment: Attachment) => void;
  removeAttachment: (taskId: string, attachmentId: string) => void;
  addAuditComment: (taskId: string, comment: AuditComment) => void;
  submitTask: (taskId: string) => { success: boolean; errors?: string[] };
  createNewVersion: (taskId: string, comment?: string) => void;
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
        const now = new Date().toISOString();
        const versions = ensureInitialVersion([...t.versions], now);
        const latestVersion = versions[versions.length - 1];
        const updatedData = latestVersion.data.map((d) =>
          d.id === dataId ? { ...d, ...updates } : d
        );
        versions[versions.length - 1] = { ...latestVersion, data: updatedData };
        return {
          ...t,
          versions,
          currentVersion: versions.length,
          updatedAt: now,
        };
      }),
    })),

  addActivityData: (taskId, stage, newItem) =>
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const now = new Date().toISOString();
        const versions = ensureInitialVersion([...t.versions], now);
        const latestVersion = versions[versions.length - 1];
        const updatedData = [...latestVersion.data, newItem];
        versions[versions.length - 1] = { ...latestVersion, data: updatedData };
        return {
          ...t,
          versions,
          currentVersion: versions.length,
          updatedAt: now,
        };
      }),
    })),

  createNewVersion: (taskId, comment) =>
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const now = new Date().toISOString();
        const versions = ensureInitialVersion([...t.versions], now);
        const latestVersion = versions[versions.length - 1];
        const newVersionNumber = latestVersion.version + 1;
        const currentUser = getCurrentUserName();
        const newVersion = {
          version: newVersionNumber,
          submitTime: now,
          submitter: currentUser,
          comment: comment || latestVersion.comment,
          data: JSON.parse(JSON.stringify(latestVersion.data)),
          attachments: JSON.parse(JSON.stringify(latestVersion.attachments)),
        };
        return {
          ...t,
          currentVersion: newVersionNumber,
          versions: [...versions, newVersion],
          updatedAt: now,
        };
      }),
    })),

  addAttachment: (taskId, attachment) =>
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const now = new Date().toISOString();
        const versions = ensureInitialVersion([...t.versions], now);
        const latestVersion = versions[versions.length - 1];
        versions[versions.length - 1] = {
          ...latestVersion,
          attachments: [...latestVersion.attachments, attachment],
        };
        return {
          ...t,
          versions,
          currentVersion: versions.length,
          updatedAt: now,
        };
      }),
    })),

  removeAttachment: (taskId, attachmentId) =>
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== taskId) return t;
        if (t.versions.length === 0) return t;
        const now = new Date().toISOString();
        const versions = [...t.versions];
        const latestVersion = versions[versions.length - 1];
        versions[versions.length - 1] = {
          ...latestVersion,
          attachments: latestVersion.attachments.filter((a) => a.id !== attachmentId),
        };
        return {
          ...t,
          versions,
          updatedAt: now,
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

    if (task.versions.length === 0) {
      return { success: false, errors: ['任务无版本数据，请先保存草稿'] };
    }

    const validation = validateTaskSubmission(task);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    const latestVersion = task.versions[task.versions.length - 1];
    const now = new Date().toISOString();
    const currentUser = getCurrentUserName();
    const newVersionNumber = latestVersion.version + 1;
    const newVersion = {
      version: newVersionNumber,
      submitTime: now,
      submitter: currentUser,
      comment: latestVersion.comment || '提交审核',
      data: JSON.parse(JSON.stringify(latestVersion.data)),
      attachments: JSON.parse(JSON.stringify(latestVersion.attachments)),
    };

    set({
      tasks: state.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const updatedLatestVersion = { ...latestVersion, submitTime: now };
        const updatedVersions = [...t.versions];
        updatedVersions[updatedVersions.length - 1] = updatedLatestVersion;
        updatedVersions.push(newVersion);
        return {
          ...t,
          status: 'submitted' as TaskStatus,
          currentVersion: newVersionNumber,
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
        const versions = ensureInitialVersion([...t.versions], now);
        if (t.versions.length === 0 && versionComment) {
          versions[0] = { ...versions[0], comment: versionComment };
        } else {
          versions[versions.length - 1] = {
            ...versions[versions.length - 1],
            comment: versionComment || versions[versions.length - 1].comment,
          };
        }
        return {
          ...t,
          status: 'draft' as TaskStatus,
          currentVersion: versions.length,
          versions,
          updatedAt: now,
        };
      }),
    })),

  sendReminders: (taskIds, content) => {
    console.log('发送催办:', taskIds, content);
  },
}));
