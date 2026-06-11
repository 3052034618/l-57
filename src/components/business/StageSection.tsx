import { ChevronDown, ChevronUp, Leaf, Factory, Truck, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActivityData, ActivityStage, EmissionFactor } from '@/types';
import { getStageLabel, formatEmission } from '@/utils/format';
import { sumStageEmissions } from '@/utils/emission';
import ActivityDataForm from './ActivityDataForm';
import EmptyState from '@/components/common/EmptyState';

const STAGE_ICONS: Record<ActivityStage, typeof Leaf> = {
  material: Leaf,
  production: Factory,
  transport: Truck,
};

interface StageSectionProps {
  stage: ActivityStage;
  title: string;
  dataItems: ActivityData[];
  factors: EmissionFactor[];
  expanded: boolean;
  onToggle: () => void;
  onDataChange: (dataId: string, updates: Partial<ActivityData>) => void;
  validationErrors?: Record<string, string[]>;
}

export default function StageSection({
  stage,
  title,
  dataItems,
  factors,
  expanded,
  onToggle,
  onDataChange,
  validationErrors,
}: StageSectionProps) {
  const Icon = STAGE_ICONS[stage];
  const stageEmission = sumStageEmissions(dataItems, stage);
  const hasErrors = validationErrors && Object.keys(validationErrors).length > 0;
  const dataItemErrors = dataItems.filter((item) => validationErrors?.[item.id]);

  return (
    <div
      className={cn(
        'rounded-xl border bg-white overflow-hidden transition-all',
        hasErrors ? 'border-clay-200' : 'border-forest-100'
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'w-full flex items-center justify-between px-5 py-4 transition-colors',
          expanded
            ? 'bg-forest-50/50 border-b border-forest-100'
            : 'hover:bg-forest-50/30'
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              hasErrors ? 'bg-clay-100 text-clay-500' : 'bg-forest-100 text-forest-600'
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-forest-800">{title || getStageLabel(stage)}</h3>
              <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-xs font-medium bg-forest-100 text-forest-700">
                {dataItems.length}
              </span>
              {hasErrors && (
                <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-xs font-medium bg-clay-100 text-clay-600">
                  {dataItemErrors.length}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              阶段排放：
              <span className="font-medium text-forest-700 ml-1">
                {formatEmission(stageEmission)}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasErrors && (
            <span className="flex items-center gap-1 text-xs text-clay-500 bg-clay-50 px-2 py-1 rounded-md">
              <AlertCircle className="h-3.5 w-3.5" />
              存在验证错误
            </span>
          )}
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="p-5 space-y-4 animate-fade-in-up">
          {dataItems.length === 0 ? (
            <EmptyState
              title="暂无活动数据"
              description="点击上方添加按钮来创建新的活动数据项"
            />
          ) : (
            dataItems.map((item) => {
              const errors = validationErrors?.[item.id];
              const hasError = !!errors && errors.length > 0;
              return (
                <ActivityDataForm
                  key={item.id}
                  data={item}
                  factors={factors}
                  onChange={(updates) => onDataChange(item.id, updates)}
                  hasError={hasError}
                  errorMessage={hasError ? errors?.join('；') : undefined}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
