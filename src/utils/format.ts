import type { TaskStatus, ActivityStage } from '../types';

export const formatNumber = (num: number | null | undefined, decimals: number = 2): string => {
  if (num === null || num === undefined || isNaN(num)) {
    return '--';
  }
  return Number(num.toFixed(decimals)).toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatDate = (dateStr: string | Date): string => {
  if (!dateStr) return '--';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return '--';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateTime = (dateStr: string | Date): string => {
  if (!dateStr) return '--';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return '--';
  const datePart = formatDate(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${datePart} ${hours}:${minutes}`;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0 || !bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const statusLabels: Record<TaskStatus, string> = {
  pending: '待填报',
  draft: '草稿',
  submitted: '已提交',
  auditing: '审核中',
  approved: '已通过',
  rejected: '已驳回',
};

export const getStatusLabel = (status: TaskStatus): string => {
  return statusLabels[status] || status;
};

const stageLabels: Record<ActivityStage, string> = {
  material: '原材料阶段',
  production: '生产阶段',
  transport: '运输阶段',
};

export const getStageLabel = (stage: ActivityStage): string => {
  return stageLabels[stage] || stage;
};

export const formatEmission = (kgCO2e: number | null | undefined): string => {
  if (kgCO2e === null || kgCO2e === undefined || isNaN(kgCO2e)) {
    return '--';
  }
  if (kgCO2e >= 1000) {
    return `${formatNumber(kgCO2e / 1000, 2)} tCO₂e`;
  }
  return `${formatNumber(kgCO2e, 2)} kgCO₂e`;
};
