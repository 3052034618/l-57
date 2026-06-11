import { MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AuditComment, UserRole } from '@/types';
import { formatDateTime } from '@/utils/format';

interface CommentThreadProps {
  comments: AuditComment[];
}

const roleLabels: Record<UserRole, string> = {
  enterprise: '企业审核员',
  supplier: '供应商',
};

const roleTagClasses: Record<UserRole, string> = {
  enterprise: 'bg-forest-100 text-forest-700',
  supplier: 'bg-sand-100 text-sand-600',
};

export default function CommentThread({ comments }: CommentThreadProps) {
  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-3">
          <MessageSquare className="h-6 w-6 text-slate-400" />
        </div>
        <p className="text-sm text-slate-500">暂无审核意见</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="flex gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:shadow-card transition-all"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-100">
            <User className="h-5 w-5 text-forest-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-forest-800">{comment.author}</span>
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
                  roleTagClasses[comment.authorRole]
                )}
              >
                {roleLabels[comment.authorRole]}
              </span>
              <span className="text-xs text-slate-400">
                V{comment.version}
              </span>
              <span className="text-xs text-slate-400 ml-auto">
                {formatDateTime(comment.createdAt)}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {comment.content}
            </p>
            {comment.references && comment.references.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {comment.references.map((ref) => (
                  <span
                    key={ref}
                    className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-xs text-slate-600"
                  >
                    引用：{ref}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
