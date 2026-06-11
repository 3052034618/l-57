import { create } from 'zustand';
import type { ExportRecord } from '@/types';
import { useUINotificationStore } from '@/store/useUINotificationStore';

interface ExportState {
  records: ExportRecord[];
  addRecord: (record: Omit<ExportRecord, 'id' | 'exportTime'>) => void;
  getRecentRecords: (limit?: number) => ExportRecord[];
  triggerDownload: (record: ExportRecord) => void;
}

export const useExportStore = create<ExportState>((set, get) => ({
  records: [],
  addRecord: (record) => {
    const newRecord: ExportRecord = {
      ...record,
      id: `export-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      exportTime: new Date().toISOString(),
    };
    set((state) => ({
      records: [newRecord, ...state.records].slice(0, 20),
    }));
  },
  getRecentRecords: (limit) => {
    const { records } = get();
    const sorted = [...records].sort(
      (a, b) => new Date(b.exportTime).getTime() - new Date(a.exportTime).getTime()
    );
    return limit ? sorted.slice(0, limit) : sorted;
  },
  triggerDownload: (record) => {
    const showToast = useUINotificationStore.getState().showToast;
    showToast('info', '正在重新下载报告');

    const content = `碳排放汇总报告（模拟文件）\n文件名：${record.fileName}\n导出时间：${record.exportTime}\n文件类型：${record.fileType.toUpperCase()}\n产品数量：${record.summaryCount}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = record.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
}));
