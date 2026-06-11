import { useState, useMemo } from 'react';
import { Search, Zap, Leaf, Truck, Check, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EmissionFactor } from '@/types';
import Modal from '@/components/common/Modal';
import EmptyState from '@/components/common/EmptyState';

const CATEGORIES = [
  { key: 'all', label: '全部', icon: null },
  { key: '能源', label: '能源', icon: Zap },
  { key: '原材料', label: '原材料', icon: Leaf },
  { key: '运输', label: '运输', icon: Truck },
] as const;

interface FactorSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (factor: EmissionFactor) => void;
  factors: EmissionFactor[];
  selectedId?: string;
}

export default function FactorSelector({
  isOpen,
  onClose,
  onSelect,
  factors,
  selectedId,
}: FactorSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredFactors = useMemo(() => {
    return factors.filter((factor) => {
      const matchesCategory = activeCategory === 'all' || factor.category === activeCategory;
      const matchesSearch =
        searchQuery === '' ||
        factor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        factor.source.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [factors, searchQuery, activeCategory]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="选择排放因子"
      width="max-w-2xl"
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索排放因子名称或来源..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none transition-all focus:ring-2 focus:ring-forest-200 focus:border-forest-400"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-forest-500 text-white shadow-sm'
                    : 'bg-forest-50 text-forest-700 hover:bg-forest-100'
                )}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="max-h-[45vh] overflow-y-auto space-y-2 pr-1">
          {filteredFactors.length === 0 ? (
            <EmptyState
              title="未找到排放因子"
              description="尝试更换搜索关键词或选择其他分类"
            />
          ) : (
            filteredFactors.map((factor) => {
              const isSelected = selectedId === factor.id;
              return (
                <button
                  key={factor.id}
                  type="button"
                  onClick={() => onSelect(factor)}
                  className={cn(
                    'w-full text-left p-4 rounded-xl border transition-all',
                    'hover:shadow-card hover:border-forest-300',
                    isSelected
                      ? 'border-forest-400 bg-forest-50/50 ring-2 ring-forest-200'
                      : 'border-slate-200 bg-white'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-forest-800">{factor.name}</span>
                        {factor.isRecommended && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-sand-100 text-sand-500">
                            <Star className="h-3 w-3 fill-current" />
                            推荐
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-forest-50 text-forest-600">
                          {factor.category}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">数值：</span>
                          <span className="font-semibold text-forest-700">
                            {factor.value} kgCO₂e/{factor.unit}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">单位：</span>
                          <span className="text-slate-700">{factor.unit}</span>
                        </div>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1 text-xs text-slate-500">
                        <span>来源：{factor.source}</span>
                        <span>·</span>
                        <span>{factor.year}年</span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-forest-500 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
