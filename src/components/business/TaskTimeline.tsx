import { useMemo } from 'react';
import { UserPlus, AlertCircle, FileText, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task, UserRole, AuditComment } from '@/types';
import type { Message } from '@/store/useMessageStore';
import { formatDateTime } from '@/utils/format';

interface TaskTimelineProps {
  task: Task;
  messages?: Message[];
  userRole: UserRole;
}

type TimelineNodeType = 'assign' | 'reminder' | 'version' | 'audit';

interface TimelineNode {
  id: string;
  type: TimelineNodeType;
  time: string;
  title: string;
  description: string;
  icon: typeof UserPlus;
  color: string;
}

const nodeColorMap: Record<TimelineNodeType, { bg: string; icon: string }> = {
  assign: { bg: 'bg-forest-100', icon: 'text-forest-600' },
  reminder: { bg: 'bg-clay-100', icon: 'text-clay-600' },
  version: { bg: 'bg-sand-100', icon: 'text-sand-600' },
  audit: { bg: 'bg-sky-100', icon: 'text-sky-600' },
};

export default function TaskTimeline({ task, messages = [], userRole: _userRole }: TaskTimelineProps) {
  const nodes = useMemo<TimelineNode[]>(() => {
    const result: TimelineNode[] = [];

    result.push({
      id: `assign-${task.id}`,
      type: 'assign',
      time: task.createdAt,
      title: '任务指派',
      description: '碳排放数据填报任务已创建',
      icon: UserPlus,
      color: 'assign',
    });

    const reminderMessages = messages.filter(
      (m) => m.type === 'reminder' && m.taskId === task.id
    );
    reminderMessages.forEach((msg) => {
      result.push({
        id: `reminder-${msg.id}`,
        type: 'reminder',
        time: msg.time,
        title: '催办提醒',
        description: msg.summary,
        icon: AlertCircle,
        color: 'reminder',
      });
    });

    task.versions.forEach((version) => {
      const isFirstVersion = version.version === 1;
      const submitDate = new Date(version.submitTime);
      const createdDate = new Date(task.createdAt);
      const timeDiffHours = Math.abs(submitDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
      const isStartFilling = isFirstVersion && timeDiffHours <= 48;

      let title: string;
      if (isStartFilling) {
        title = '开始填报';
      } else {
        title = `提交 V${version.version}`;
      }

      result.push({
        id: `version-${task.id}-${version.version}`,
        type: 'version',
        time: version.submitTime,
        title,
        description: version.comment || '活动数据已更新',
        icon: FileText,
        color: 'version',
      });
    });

    const auditMessages = messages.filter(
      (m) => m.type === 'audit' && m.taskId === task.id
    );
    auditMessages.forEach((msg) => {
        let title = '审核反馈';
        if (msg.title.includes('通过')) {
          title = '审核通过';
        } else if (msg.title.includes('驳回')) {
          title = '审核驳回';
        }

        result.push({
          id: `audit-msg-${msg.id}`,
          type: 'audit',
          time: msg.time,
          title,
          description: msg.summary,
          icon: MessageSquare,
          color: 'audit',
        });
      });

    task.comments.forEach((comment: AuditComment) => {
      let title = '审核反馈';
      if (task.status === 'approved' && comment === task.comments[task.comments.length - 1]) {
        title = '审核通过';
      } else if (task.status === 'rejected' && comment === task.comments[task.comments.length - 1]) {
        title = '审核驳回';
      }

      result.push({
        id: `audit-comment-${comment.id}`,
        type: 'audit',
        time: comment.createdAt,
        title,
        description: comment.content.length > 60 ? comment.content.slice(0, 60) + '...' : comment.content,
        icon: MessageSquare,
        color: 'audit',
      });
    });

    const seen = new Set<string>();
    const deduped = result.filter((node) => {
      const key = `${node.type}-${node.time}-${node.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    deduped.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    return deduped;
  }, [task, messages]);

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-3">
          <FileText className="h-6 w-6 text-slate-400" />
        </div>
        <p className="text-sm text-slate-500">暂无任务进度</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {nodes.map((node, index) => {
        const Icon = node.icon;
        const colors = nodeColorMap[node.color as TimelineNodeType];
        const isLast = index === nodes.length - 1;

        return (
          <div key={node.id} className="relative flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                  colors.bg
                )}
              >
                <Icon className={cn('h-3.5 w-3.5', colors.icon)} />
              </div>
              {!isLast && (
                <div className="w-px flex-1 border-l border-dashed border-forest-200 my-1" />
              )}
            </div>

            <div className="flex-1 pb-5">
              <div className="flex items-center gap-2 flex-wrap">
                <h5 className="text-sm font-medium text-forest-800">{node.title}</h5>
                <span className="text-xs text-slate-400">{formatDateTime(node.time)}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">{node.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
