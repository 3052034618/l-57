import { useState, useCallback, useRef } from 'react';
import {
  Upload,
  FileText,
  FileSpreadsheet,
  FileImage,
  X,
  AlertCircle,
  Paperclip,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Attachment } from '@/types';
import { formatFileSize, formatDateTime } from '@/utils/format';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.xls',
  '.xlsx',
  '.doc',
  '.docx',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface AttachmentUploaderProps {
  attachments: Attachment[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
}

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) return FileImage;
  if (fileType.includes('pdf') || fileType.includes('word')) return FileText;
  if (fileType.includes('excel') || fileType.includes('sheet')) return FileSpreadsheet;
  return FileText;
}

function validateFile(file: File): string | null {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  const isValidType = ALLOWED_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(extension);
  if (!isValidType) {
    return `不支持的文件格式：${file.name}`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `文件超过大小限制（10MB）：${file.name}`;
  }
  return null;
}

export default function AttachmentUploader({
  attachments,
  onAdd,
  onRemove,
}: AttachmentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      setError(null);
      const files = Array.from(fileList);
      const validFiles: File[] = [];
      const errors: string[] = [];

      files.forEach((file) => {
        const validationError = validateFile(file);
        if (validationError) {
          errors.push(validationError);
        } else {
          validFiles.push(file);
        }
      });

      if (errors.length > 0) {
        setError(errors.join('；'));
      }

      if (validFiles.length > 0) {
        onAdd(validFiles);
      }
    },
    [onAdd]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
        e.target.value = '';
      }
    },
    [handleFiles]
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
          isDragging
            ? 'border-forest-400 bg-forest-50/50'
            : 'border-slate-200 hover:border-forest-300 hover:bg-forest-50/30'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_EXTENSIONS.join(',')}
          onChange={handleInputChange}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-50">
            <Upload className="h-6 w-6 text-forest-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-forest-700">
              {isDragging ? '释放文件以上传' : '点击或拖拽文件到此处上传'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              支持 PDF、Excel、Word、图片格式，单个文件不超过 10MB
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-clay-50 border border-clay-200 text-sm text-clay-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-forest-700">
            <Paperclip className="h-4 w-4" />
            已上传附件 ({attachments.length})
          </div>
          <div className="space-y-2">
            {attachments.map((attachment) => {
              const Icon = getFileIcon(attachment.type);
              return (
                <div
                  key={attachment.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:shadow-card transition-all"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-forest-50">
                    <Icon className="h-5 w-5 text-forest-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-forest-800 truncate">
                      {attachment.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatFileSize(attachment.size)} · {formatDateTime(attachment.uploadTime)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(attachment.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-clay-500 hover:bg-clay-50 transition-colors shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
