import { useState, useMemo, useCallback } from 'react';
import {
  Bell,
  MessageSquare,
  AlertCircle,
  Check,
  Send,
  ChevronDown,
  Inbox,
  CheckCheck,
  Clock,
  Package,
  Building2,
  Calendar,
} from 'lucide-react';
import { useTaskStore } from '@/store/useTaskStore';
import { useUserStore } from '@/store/useUserStore';
import { useUINotificationStore } from '@/store/useUINotificationStore';
import { useMessageStore, type MessageType, type Message } from '@/store/useMessageStore';
import Modal from '@/components/common/Modal';
import { formatDate, formatDateTime, getStatusLabel } from '@/utils/format';
import { cn } from '@/lib/utils';

type TabKey = 'all' | MessageType;

const tabs: { key: TabKey; label: string; icon: typeof Bell }[] = [
  { key: 'all', label: '全部消息', icon: Inbox },
  { key: 'system', label: '系统通知', icon: Bell },
  { key: 'audit', label: '审核反馈', icon: MessageSquare },
  { key: 'reminder', label: '催办消息', icon: AlertCircle },
];

const typeIcons: Record<MessageType, typeof Bell> = {
  system: Bell,
  audit: MessageSquare,
  reminder: AlertCircle,
};

const typeColors: Record<MessageType, { bg: string; icon: string; dot: string }> = {
  system: { bg: 'bg-forest-50', icon: 'text-forest-600', dot: 'bg-forest-500' },
  audit: { bg: 'bg-sky-50', icon: 'text-sky-600', dot: 'bg-sky-500' },
  reminder: { bg: 'bg-clay-50', icon: 'text-clay-600', dot: 'bg-clay-500' },
};

const reminderTemplates = [
  { key: 'standard', label: '标准催办', content: '您好，您有待填报的碳排放数据任务，请尽快完成填报并提交审核。' },
  { key: 'urgent', label: '加急催办', content: '【紧急提醒】您的碳排放数据填报任务即将到期，请务必在截止日期前完成提交，以免影响整体进度。' },
  { key: 'overdue', label: '逾期提醒', content: '【逾期提醒】您有碳排放数据填报任务已超过截止日期，请立即处理并说明原因。' },
];

export default function Notifications() {
  const { tasks } = useTaskStore();
  const { userRole } = useUserStore();
  const showToast = useUINotificationStore((s) => s.showToast);
  const {
    messages,
    selectedIds,
    markAsRead,
    markManyAsRead,
    addReminderMessages,
    toggleSelected,
    clearSelected,
  } = useMessageStore();

  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [reminderTaskIds, setReminderTaskIds] = useState<string[]>([]);
  const [reminderTemplate, setReminderTemplate] = useState(reminderTemplates[0].key);
  const [reminderContent, setReminderContent] = useState(reminderTemplates[0].content);
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false);

  const filteredMessages = useMemo(() => {
    if (activeTab === 'all') return messages;
    return messages.filter((m) => m.type === activeTab);
  }, [messages, activeTab]);

  const selectedMessage = useMemo(() => {
    return messages.find((m) => m.id === selectedMessageId) || null;
  }, [messages, selectedMessageId]);

  const unreadCount = useMemo(() => {
    return messages.filter((m) => !m.isRead).length;
  }, [messages]);

  const tabUnreadCounts = useMemo(() => {
    const counts: Record<TabKey, number> = {
      all: unreadCount,
      system: messages.filter((m) => m.type === 'system' && !m.isRead).length,
      audit: messages.filter((m) => m.type === 'audit' && !m.isRead).length,
      reminder: messages.filter((m) => m.type === 'reminder' && !m.isRead).length,
    };
    return counts;
  }, [messages, unreadCount]);

  const allSelected = useMemo(() => {
    return filteredMessages.length > 0 && filteredMessages.every((m) => selectedIds.includes(m.id));
  }, [filteredMessages, selectedIds]);

  const toggleSelectAll = () => {
    if (allSelected) {
      clearSelected();
    } else {
      filteredMessages.forEach((m) => {
        if (!selectedIds.includes(m.id)) toggleSelected(m.id);
      });
    }
  };

  const handleSelectMessage = useCallback((msg: Message) => {
    setSelectedMessageId(msg.id);
    if (!msg.isRead) {
      markAsRead(msg.id);
    }
  }, [markAsRead]);

  const handleMarkAsRead = useCallback((id: string) => {
    markAsRead(id);
    showToast('success', '消息已标记为已读');
  }, [markAsRead, showToast]);

  const handleBatchMarkAsRead = () => {
    if (selectedIds.length === 0) {
      showToast('warning', '请先选择要标记的消息');
      return;
    }
    markManyAsRead(selectedIds);
    showToast('success', '已将 ' + selectedIds.length + ' 条消息标记为已读');
    clearSelected();
  };

  const handleGoProcess = (taskId: string) => {
    showToast('info', '正在跳转到任务：' + taskId);
  };

  const handleOpenReminderModal = () => {
    setReminderModalOpen(true);
    setReminderTaskIds([]);
    setReminderTemplate(reminderTemplates[0].key);
    setReminderContent(reminderTemplates[0].content);
  };

  const handleTemplateChange = (key: string) => {
    setReminderTemplate(key);
    const template = reminderTemplates.find((t) => t.key === key);
    if (template) {
      setReminderContent(template.content);
    }
    setTemplateDropdownOpen(false);
  };

  const toggleReminderTask = (taskId: string) => {
    setReminderTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleSendReminders = () => {
    if (reminderTaskIds.length === 0) {
      showToast('error', '请至少选择一个任务');
      return;
    }
    if (!reminderContent.trim()) {
      showToast('error', '请填写催办内容');
      return;
    }
    addReminderMessages(reminderTaskIds, reminderContent);
    showToast('success', '已向 ' + reminderTaskIds.length + ' 个任务发送催办消息');
    setReminderModalOpen(false);
  };

  const pendingTasks = useMemo(() => {
    return tasks.filter((t) => t.status === 'pending' || t.status === 'draft');
  }, [tasks]);

  const selectedTask = useMemo(() => {
    if (!selectedMessage?.taskId) return null;
    return tasks.find((t) => t.id === selectedMessage.taskId) || null;
  }, [tasks, selectedMessage]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-forest-800">消息中心</h1>
        <p className="mt-1 text-slate-500">
          查看系统通知、审核反馈和催办消息
          {unreadCount > 0 && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-clay-500 text-white text-xs font-medium">
              {unreadCount} 条未读
            </span>
          )}
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center gap-1 px-4 pt-4 border-b border-forest-100">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const count = tabUnreadCounts[tab.key];
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'relative inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                  activeTab === tab.key
                    ? 'border-forest-500 text-forest-700'
                    : 'border-transparent text-slate-500 hover:text-forest-600'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {count > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-clay-500 text-white text-xs font-medium">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {userRole === 'enterprise' && (
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <label className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-forest-300 text-forest-500 focus:ring-forest-400"
              />
              全选
              {selectedIds.length > 0 && (
                <span className="text-xs text-slate-400">（已选 {selectedIds.length} 条）</span>
              )}
            </label>
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={handleBatchMarkAsRead}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-forest-200 bg-white text-sm text-forest-700 hover:bg-forest-50 transition-colors"
              >
                <CheckCheck className="h-4 w-4" />
                批量已读
              </button>
              <button
                onClick={handleOpenReminderModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-forest-500 text-sm text-white hover:bg-forest-600 transition-colors"
              >
                <Send className="h-4 w-4" />
                批量催办
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 min-h-[600px]">
          <div className="lg:col-span-2 border-r border-slate-100 overflow-y-auto max-h-[70vh]">
            {filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-slate-400">
                <Inbox className="h-12 w-12 mb-3" />
                <p className="text-sm">暂无消息</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filteredMessages.map((msg) => {
                  const Icon = typeIcons[msg.type];
                  const colorConfig = typeColors[msg.type];
                  const isSelected = selectedMessageId === msg.id;
                  const isChecked = selectedIds.includes(msg.id);

                  return (
                    <li
                      key={msg.id}
                      onClick={() => handleSelectMessage(msg)}
                      className={cn(
                        'relative px-4 py-3.5 cursor-pointer transition-all',
                        isSelected
                          ? 'bg-forest-50/70 border-l-2 border-forest-500'
                          : 'hover:bg-slate-50 border-l-2 border-transparent'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {userRole === 'enterprise' && (
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleSelected(msg.id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1 w-4 h-4 rounded border-forest-300 text-forest-500 focus:ring-forest-400 shrink-0"
                          />
                        )}

                        <div
                          className={cn(
                            'flex items-center justify-center w-10 h-10 rounded-xl shrink-0',
                            colorConfig.bg
                          )}
                        >
                          <Icon className={cn('h-5 w-5', colorConfig.icon)} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {!msg.isRead && (
                              <span
                                className={cn(
                                  'w-2 h-2 rounded-full shrink-0',
                                  colorConfig.dot
                                )}
                              />
                            )}
                            <h4
                              className={cn(
                                'text-sm truncate',
                                msg.isRead
                                  ? 'font-normal text-slate-700'
                                  : 'font-semibold text-forest-800'
                              )}
                            >
                              {msg.title}
                            </h4>
                          </div>
                          <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                            {msg.summary}
                          </p>
                          <div className="mt-1.5 flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="h-3 w-3" />
                            {formatDateTime(msg.time)}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="lg:col-span-3 flex flex-col max-h-[70vh]">
            {selectedMessage ? (
              <>
                <div className="px-6 py-4 border-b border-slate-100">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'flex items-center justify-center w-12 h-12 rounded-xl shrink-0',
                        typeColors[selectedMessage.type].bg
                      )}
                    >
                      {(() => {
                        const Icon = typeIcons[selectedMessage.type];
                        return (
                          <Icon
                            className={cn(
                              'h-6 w-6',
                              typeColors[selectedMessage.type].icon
                            )}
                          />
                        );
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold text-forest-800">
                        {selectedMessage.title}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatDateTime(selectedMessage.time)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 px-6 py-5 overflow-y-auto">
                  <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedMessage.content}
                  </div>

                  {selectedTask && (
                    <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-forest-50 to-sand-50/50 border border-forest-100">
                      <h4 className="text-sm font-semibold text-forest-800 mb-3">
                        关联任务信息
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="text-slate-500">产品：</span>
                          <span className="text-slate-700 font-medium">
                            {selectedTask.productName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="text-slate-500">供应商：</span>
                          <span className="text-slate-700 font-medium">
                            {selectedTask.supplierName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="text-slate-500">截止日期：</span>
                          <span className="text-slate-700 font-medium">
                            {formatDate(selectedTask.deadline)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="text-slate-500">当前状态：</span>
                          <span className="text-forest-600 font-medium">
                            {getStatusLabel(selectedTask.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
                  <button
                    onClick={() => handleMarkAsRead(selectedMessage.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-forest-200 bg-white text-sm font-medium text-forest-700 hover:bg-forest-50 transition-colors"
                  >
                    <Check className="h-4 w-4" />
                    已读
                  </button>
                  {selectedMessage.taskId && (
                    <button
                      onClick={() => handleGoProcess(selectedMessage.taskId!)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-forest-500 text-sm font-medium text-white hover:bg-forest-600 transition-colors"
                    >
                      去处理
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 py-16 text-slate-400">
                <Inbox className="h-16 w-16 mb-4" />
                <p className="text-sm">请选择一条消息查看详情</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        title="批量催办"
        width="max-w-2xl"
        footer={
          <>
            <button
              onClick={() => setReminderModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSendReminders}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-forest-500 text-sm font-medium text-white hover:bg-forest-600 transition-colors"
            >
              <Send className="h-4 w-4" />
              发送催办
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-forest-800 mb-2">
              选择任务 <span className="text-clay-500">*</span>
            </label>
            <div className="border border-forest-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
              {pendingTasks.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-400">
                  暂无可催办的任务
                </div>
              ) : (
                pendingTasks.map((task) => (
                  <label
                    key={task.id}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-slate-100 last:border-b-0 hover:bg-forest-50/30',
                      reminderTaskIds.includes(task.id) && 'bg-forest-50/60'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={reminderTaskIds.includes(task.id)}
                      onChange={() => toggleReminderTask(task.id)}
                      className="mt-0.5 w-4 h-4 rounded border-forest-300 text-forest-500 focus:ring-forest-400 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-forest-800 truncate">
                        {task.productName}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                        <span className="truncate">{task.supplierName}</span>
                        <span>截止：{formatDate(task.deadline)}</span>
                        <span
                          className={cn(
                            'px-1.5 py-0.5 rounded text-xs font-medium',
                            task.status === 'pending' &&
                              'bg-sand-100 text-sand-600',
                            task.status === 'draft' &&
                              'bg-slate-100 text-slate-600'
                          )}
                        >
                          {getStatusLabel(task.status)}
                        </span>
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
            {reminderTaskIds.length > 0 && (
              <p className="mt-2 text-xs text-forest-600">
                已选择 {reminderTaskIds.length} 个任务
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-forest-800 mb-2">
              催办模板
            </label>
            <div className="relative">
              <button
                onClick={() => setTemplateDropdownOpen(!templateDropdownOpen)}
                className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg border border-forest-200 bg-white text-sm text-forest-800 hover:border-forest-300 transition-colors"
              >
                <span>
                  {reminderTemplates.find((t) => t.key === reminderTemplate)?.label}
                </span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-slate-400 transition-transform',
                    templateDropdownOpen && 'rotate-180'
                  )}
                />
              </button>
              {templateDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 py-1 bg-white border border-forest-100 rounded-lg shadow-card-hover z-10">
                  {reminderTemplates.map((tpl) => (
                    <button
                      key={tpl.key}
                      onClick={() => handleTemplateChange(tpl.key)}
                      className={cn(
                        'w-full px-4 py-2.5 text-left text-sm transition-colors',
                        reminderTemplate === tpl.key
                          ? 'bg-forest-50 text-forest-700 font-medium'
                          : 'text-slate-600 hover:bg-forest-50/50'
                      )}
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-forest-800 mb-2">
              催办内容 <span className="text-clay-500">*</span>
            </label>
            <textarea
              value={reminderContent}
              onChange={(e) => setReminderContent(e.target.value)}
              placeholder="请输入催办内容..."
              rows={5}
              className="w-full px-4 py-3 rounded-lg border border-forest-200 bg-white text-sm text-forest-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-forest-400 focus:border-transparent transition-all resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
