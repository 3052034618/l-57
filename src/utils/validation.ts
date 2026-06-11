import type { ActivityData, Task, ValidationResult } from '../types';

export const validateActivityData = (item: ActivityData): string[] => {
  const errors: string[] = [];

  if (!item.name || item.name.trim() === '') {
    errors.push('活动名称不能为空');
  }

  if (!item.unit || item.unit.trim() === '') {
    errors.push('单位不能为空');
  }

  if (item.quantity === null || item.quantity === undefined) {
    errors.push('数量未填写');
  } else if (isNaN(item.quantity)) {
    errors.push('数量必须是有效数字');
  } else if (item.quantity < 0) {
    errors.push('数量不能为负数');
  }

  if (!item.factorId) {
    errors.push('排放因子未选择');
  }

  return errors;
};

export const validateTaskSubmission = (task: Task): ValidationResult => {
  const errors: string[] = [];
  const missingFields: string[] = [];

  if (task.currentVersion === 0 || task.versions.length === 0) {
    errors.push('尚未提交任何版本数据');
    return { valid: false, errors, missingFields: ['versions'] };
  }

  const latestVersion = task.versions[task.versions.length - 1];
  const activityData = latestVersion.data;

  if (activityData.length === 0) {
    errors.push('活动数据为空');
    missingFields.push('activityData');
  }

  const stages: ActivityData['stage'][] = ['material', 'production', 'transport'];
  stages.forEach((stage) => {
    const stageItems = activityData.filter((item) => item.stage === stage);
    if (stageItems.length === 0) {
      missingFields.push(`stage-${stage}`);
    }
  });

  activityData.forEach((item) => {
    const itemErrors = validateActivityData(item);
    itemErrors.forEach((err) => {
      errors.push(`[${item.name}] ${err}`);
    });
    if (itemErrors.length > 0) {
      missingFields.push(item.id);
    }
  });

  if (latestVersion.attachments.length === 0) {
    missingFields.push('attachments');
  }

  return {
    valid: errors.length === 0,
    errors,
    missingFields: Array.from(new Set(missingFields)),
  };
};

export const isTaskReadyForSubmit = (task: Task): boolean => {
  const result = validateTaskSubmission(task);
  return result.valid;
};
