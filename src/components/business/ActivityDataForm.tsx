import { useState, useEffect } from 'react';
import { Search, Calculator, AlertCircle, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActivityData, EmissionFactor } from '@/types';
import { calculateEmission } from '@/utils/emission';
import { formatEmission } from '@/utils/format';
import FactorSelector from './FactorSelector';

const COMMON_UNITS = ['kg', 't', 'g', 'L', 'm³', 'kWh', 't·km', '件', '个', 'm²'];

interface ActivityDataFormProps {
  data: ActivityData;
  factors: EmissionFactor[];
  onChange: (updates: Partial<ActivityData>) => void;
  hasError?: boolean;
  errorMessage?: string;
}

export default function ActivityDataForm({
  data,
  factors,
  onChange,
  hasError,
  errorMessage,
}: ActivityDataFormProps) {
  const [factorSelectorOpen, setFactorSelectorOpen] = useState(false);
  const [emission, setEmission] = useState<number | null>(null);

  const selectedFactor = factors.find((f) => f.id === data.factorId);

  useEffect(() => {
    const factorValue = selectedFactor?.value ?? null;
    const calculated = calculateEmission(data.quantity, factorValue);
    setEmission(calculated);
    if (calculated !== data.emission) {
      onChange({ emission: calculated });
    }
  }, [data.quantity, selectedFactor, data.emission, onChange]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ name: e.target.value });
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      onChange({ quantity: null });
    } else {
      const num = parseFloat(value);
      onChange({ quantity: isNaN(num) ? null : num });
    }
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ unit: e.target.value });
  };

  const handleFactorSelect = (factor: EmissionFactor) => {
    onChange({ factorId: factor.id });
    setFactorSelectorOpen(false);
  };

  const handleRemarkChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ remark: e.target.value });
  };

  return (
    <div
      className={cn(
        'p-5 rounded-xl border bg-white transition-all',
        hasError ? 'border-clay-300 bg-clay-50/30' : 'border-forest-100 hover:shadow-card'
      )}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-forest-700">
            活动名称 <span className="text-clay-400">*</span>
          </label>
          <input
            type="text"
            value={data.name}
            onChange={handleNameChange}
            placeholder="请输入活动名称"
            className={cn(
              'w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-all',
              'focus:ring-2 focus:ring-forest-200 focus:border-forest-400',
              hasError && !data.name ? 'border-clay-300 bg-clay-50' : 'border-slate-200'
            )}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-forest-700">
            数量 <span className="text-clay-400">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={data.quantity ?? ''}
              onChange={handleQuantityChange}
              placeholder="请输入数量"
              min="0"
              step="any"
              className={cn(
                'flex-1 px-4 py-2.5 rounded-lg border text-sm outline-none transition-all',
                'focus:ring-2 focus:ring-forest-200 focus:border-forest-400',
                hasError && data.quantity === null
                  ? 'border-clay-300 bg-clay-50'
                  : 'border-slate-200'
              )}
            />
            <select
              value={data.unit}
              onChange={handleUnitChange}
              className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none transition-all focus:ring-2 focus:ring-forest-200 focus:border-forest-400 bg-white"
            >
              {COMMON_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-forest-700">
            排放因子 <span className="text-clay-400">*</span>
          </label>
          <button
            type="button"
            onClick={() => setFactorSelectorOpen(true)}
            className={cn(
              'w-full flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm outline-none transition-all text-left',
              'hover:border-forest-300 hover:bg-forest-50/50',
              'focus:ring-2 focus:ring-forest-200 focus:border-forest-400',
              hasError && !data.factorId
                ? 'border-clay-300 bg-clay-50'
                : 'border-slate-200 bg-white'
            )}
          >
            {selectedFactor ? (
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-medium text-forest-800 truncate">{selectedFactor.name}</span>
                <span className="text-xs text-slate-500 shrink-0">
                  {selectedFactor.value} kgCO₂e/{selectedFactor.unit}
                </span>
                {selectedFactor.isRecommended && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-forest-100 text-forest-600 shrink-0">
                    推荐
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-400">点击选择排放因子</span>
            )}
            <Search className="h-4 w-4 text-slate-400 shrink-0 ml-2" />
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-forest-700">排放量</label>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50">
            <Calculator className="h-4 w-4 text-forest-500 shrink-0" />
            <span className="text-sm text-slate-500">自动计算：</span>
            <span
              className={cn(
                'font-semibold',
                emission !== null ? 'text-forest-700' : 'text-slate-400'
              )}
            >
              {formatEmission(emission)}
            </span>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-1">
          <label className="text-sm font-medium text-forest-700 flex items-center gap-1.5">
            <StickyNote className="h-4 w-4" />
            备注
          </label>
          <textarea
            value={data.remark ?? ''}
            onChange={handleRemarkChange}
            placeholder="请输入备注信息（可选）"
            rows={2}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none transition-all focus:ring-2 focus:ring-forest-200 focus:border-forest-400 resize-none"
          />
        </div>
      </div>

      {hasError && errorMessage && (
        <div className="mt-3 flex items-center gap-2 text-sm text-clay-500">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <FactorSelector
        isOpen={factorSelectorOpen}
        onClose={() => setFactorSelectorOpen(false)}
        onSelect={handleFactorSelect}
        factors={factors}
        selectedId={data.factorId ?? undefined}
      />
    </div>
  );
}
