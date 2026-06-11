import { create } from 'zustand';
import { mockTasks } from '@/data/mockTasks';
import type { Task } from '@/types';

export type MessageType = 'system' | 'audit' | 'reminder';

export interface Message {
  id: string;
  type: MessageType;
  title: string;
  summary: string;
  content: string;
  time: string;
  isRead: boolean;
  taskId?: string;
  taskName?: string;
  taskStatus?: Task['status'];
}

interface MessageState {
  messages: Message[];
  selectedIds: string[];
  markAsRead: (id: string) => void;
  markManyAsRead: (ids: string[]) => void;
  markAllAsRead: () => void;
  addMessage: (msg: Omit<Message, 'id' | 'time' | 'isRead'>) => void;
  addReminderMessages: (taskIds: string[], content: string) => void;
  toggleSelected: (id: string) => void;
  clearSelected: () => void;
}

const generateInitialMessages = (): Message[] => {
  const result: Message[] = [];
  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000).toISOString();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 3600 * 1000).toISOString();

  result.push(
    {
      id: 'sys-001',
      type: 'system',
      title: '系统升级通知',
      summary: '碳排放核算系统将于本周五晚进行例行维护升级...',
      content: '尊敬的用户，您好！\n\n为了提供更优质的服务，碳排放核算管理系统将于 2024年12月13日（周五）22:00 - 次日 02:00 进行例行维护升级。\n\n升级内容：\n1. 优化排放因子数据库，新增 200+ 因子数据\n2. 提升报表导出速度\n3. 修复已知问题\n\n维护期间系统将暂停服务，请您提前保存好正在编辑的数据。给您带来的不便，敬请谅解。\n\n—— 绿能智造科技有限公司',
      time: daysAgo(2),
      isRead: false,
    },
    {
      id: 'sys-002',
      type: 'system',
      title: '新功能上线：批量数据导入',
      summary: '现已支持通过 Excel 模板批量导入活动数据...',
      content: '新功能上线通知：\n\n批量数据导入功能现已正式上线！您可以：\n1. 在任务填报页面下载 Excel 导入模板\n2. 按照模板格式填写活动数据\n3. 一键上传批量导入，自动计算排放量\n\n该功能将大幅提升数据填报效率，欢迎体验使用。',
      time: daysAgo(4),
      isRead: true,
    },
    {
      id: 'sys-003',
      type: 'system',
      title: '任务指派：智能电动滑板车 X1',
      summary: '您收到了新的碳排放数据填报任务，请及时处理。',
      content: '任务指派通知：\n\n您已被指派为「智能电动滑板车 X1」项目碳排放数据填报任务的负责人。\n\n任务详情：\n- 产品：智能电动滑板车 X1\n- 供应商：华东钢铁集团有限公司\n- 截止日期：2024-12-15\n- 任务ID：task-001\n\n请在截止日期前完成数据填报并提交审核。',
      time: daysAgo(10),
      isRead: true,
      taskId: 'task-001',
      taskName: '智能电动滑板车 X1 - 华东钢铁集团有限公司',
      taskStatus: 'approved',
    },
    {
      id: 'sys-004',
      type: 'system',
      title: '核算模板更新通知',
      summary: 'LED护眼台灯核算模板已更新至 V2.0 版本...',
      content: '核算模板更新通知：\n\n「LED护眼台灯」产品碳排放核算模板已更新至 V2.0 版本。\n\n更新内容：\n1. 新增「末端公路配送」活动数据采集项\n2. 优化排放因子自动匹配逻辑\n3. 新增异常数据自动检测规则\n\n请使用最新模板进行数据填报，确保核算结果准确。',
      time: daysAgo(6),
      isRead: false,
      taskId: 'task-008',
      taskName: 'LED护眼台灯 - 绿源塑料科技股份有限公司',
      taskStatus: 'auditing',
    }
  );

  mockTasks.forEach((task) => {
    if (task.comments.length > 0) {
      const latestComment = task.comments[task.comments.length - 1];
      const isRejected = task.status === 'rejected';
      const isAuditing = task.status === 'auditing';
      const isApproved = task.status === 'approved';

      let auditTitle = '';
      let auditSummary = '';
      if (isApproved) {
        auditTitle = `审核通过：${task.productName}`;
        auditSummary = '您提交的碳排放数据审核已通过，核算结果已入库。';
      } else if (isRejected) {
        auditTitle = `审核驳回：${task.productName}`;
        auditSummary = latestComment.content.slice(0, 50) + '...';
      } else {
        auditTitle = `审核反馈：${task.productName}`;
        auditSummary = latestComment.content.slice(0, 50) + '...';
      }

      result.push({
        id: `audit-${task.id}`,
        type: 'audit',
        title: auditTitle,
        summary: auditSummary,
        content: `审核意见：\n\n${latestComment.content}\n\n—— 审核人：${latestComment.author}`,
        time: latestComment.createdAt,
        isRead: isApproved,
        taskId: task.id,
        taskName: `${task.productName} - ${task.supplierName}`,
        taskStatus: task.status,
      });
    }
  });

  const pendingTasks = mockTasks.filter((t) => t.status === 'pending' || t.status === 'draft');
  pendingTasks.forEach((task, idx) => {
    const deadline = new Date(task.deadline);
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    let urgencyText = '';
    let titlePrefix = '';
    if (daysLeft < 0) {
      urgencyText = `已逾期 ${Math.abs(daysLeft)} 天`;
      titlePrefix = '逾期催办';
    } else if (daysLeft <= 3) {
      urgencyText = `仅剩 ${daysLeft} 天`;
      titlePrefix = '加急催办';
    } else {
      urgencyText = `还有 ${daysLeft} 天`;
      titlePrefix = '催办提醒';
    }

    result.push({
      id: `rem-${task.id}-${idx}`,
      type: 'reminder',
      title: `${titlePrefix}：${task.productName}`,
      summary: `碳排放数据填报任务${urgencyText}截止，请尽快处理。`,
      content: `您好：\n\n您负责的「${task.productName}」碳排放数据填报任务${urgencyText}截止（截止日期：${task.deadline}）。\n\n请尽快登录系统完成数据填报并提交审核，确保碳核算工作按时完成。\n\n任务详情：\n- 产品：${task.productName}\n- 供应商：${task.supplierName}\n- 截止日期：${task.deadline}\n- 当前状态：${task.status === 'pending' ? '待填报' : '草稿'}\n\n感谢您的配合！`,
      time: hoursAgo(idx * 5 + 2),
      isRead: daysLeft > 5,
      taskId: task.id,
      taskName: `${task.productName} - ${task.supplierName}`,
      taskStatus: task.status,
    });
  });

  return result.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
};

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: generateInitialMessages(),
  selectedIds: [],

  markAsRead: (id) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, isRead: true } : m)),
    })),

  markManyAsRead: (ids) =>
    set((state) => ({
      messages: state.messages.map((m) => (ids.includes(m.id) ? { ...m, isRead: true } : m)),
    })),

  markAllAsRead: () =>
    set((state) => ({
      messages: state.messages.map((m) => ({ ...m, isRead: true })),
    })),

  addMessage: (msg) =>
    set((state) => ({
      messages: [
        {
          ...msg,
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          time: new Date().toISOString(),
          isRead: false,
        },
        ...state.messages,
      ],
    })),

  addReminderMessages: (taskIds, content) =>
    set((state) => {
      const tasksMap = new Map(mockTasks.map((t) => [t.id, t]));
      const newMessages: Message[] = taskIds
        .filter((id) => tasksMap.has(id))
        .map((taskId, idx) => {
          const task = tasksMap.get(taskId)!;
          return {
            id: `rem-${taskId}-${Date.now()}-${idx}`,
            type: 'reminder' as const,
            title: `催办提醒：${task.productName}`,
            summary: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
            content,
            time: new Date().toISOString(),
            isRead: false,
            taskId,
            taskName: `${task.productName} - ${task.supplierName}`,
            taskStatus: task.status,
          };
        });
      return {
        messages: [...newMessages, ...state.messages],
      };
    }),

  toggleSelected: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((i) => i !== id)
        : [...state.selectedIds, id],
    })),

  clearSelected: () => set({ selectedIds: [] }),
}));
