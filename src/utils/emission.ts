import type { ActivityData, ActivityStage } from '../types';
import { mockFactors } from '../data/mockFactors';

export const calculateEmission = (quantity: number | null, factorValue: number | null): number | null => {
  if (quantity === null || quantity === undefined || factorValue === null || factorValue === undefined) {
    return null;
  }
  if (isNaN(quantity) || isNaN(factorValue)) {
    return null;
  }
  return Number((quantity * factorValue).toFixed(4));
};

export const sumStageEmissions = (activityDataArray: ActivityData[], stage: ActivityStage): number => {
  return activityDataArray
    .filter((item) => item.stage === stage && item.emission !== null)
    .reduce((sum, item) => sum + (item.emission as number), 0);
};

export const sumTotalEmissions = (activityDataArray: ActivityData[]): number => {
  return activityDataArray
    .filter((item) => item.emission !== null)
    .reduce((sum, item) => sum + (item.emission as number), 0);
};

export const getFactorValueById = (factorId: string | null): number | null => {
  if (!factorId) return null;
  const factor = mockFactors.find((f) => f.id === factorId);
  return factor ? factor.value : null;
};

export const recalculateActivityEmission = (item: ActivityData): ActivityData => {
  const factorValue = getFactorValueById(item.factorId);
  const emission = calculateEmission(item.quantity, factorValue);
  return { ...item, emission };
};
