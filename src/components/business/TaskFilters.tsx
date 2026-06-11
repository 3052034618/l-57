import { useState } from 'react';
import { Search, Filter, CalendarRange, X, ChevronDown } from 'lucide-react';
import type { TaskFilter, TaskStatus } from '@/types';
import { getStatusLabel } from '@/utils/format';
import { cn } from '@/lib/utils';

interface TaskFiltersProps {
  onFilterChange: (filters: TaskFilter) => void;
}

const statusOptions: (TaskStatus | 'all')[] = [
  'all',
  'pending',
  'draft',
  'submitted',
  'auditing',
  'approved',
  'rejected',
];

export default function TaskFilters({ onFilterChange }: TaskFiltersProps) {
  const [filters, setFilters] = useState<TaskFilter>({
    status: undefined,
    keyword: '',
    dateFrom: '',
    dateTo: '',
  });
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const updateFilters = (updates: Partial<TaskFilter>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleStatusChange = (status: TaskStatus | 'all') => {
    updateFilters({ status: status === 'all' ? undefined : status });
    setStatusDropdownOpen(false);
  };

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ keyword: e.target.value });
  };

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ dateFrom: e.target.value });
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ dateTo: e.target.value });
  };

  const handleReset = () => {
    const resetFilters: TaskFilter = {
      status: undefined,
      keyword: '',
      dateFrom: '',
      dateTo: '',
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const hasActiveFilters = filters.status || filters.keyword || filters.dateFrom || filters.dateTo;
  const currentStatusLabel = filters.status ? getStatusLabel(filters.status) : '全部状态';

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-forest-600" />
        <span className="font-semibold text-forest-700">筛选条件</span>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="ml-auto flex items-center gap-1 text-sm text-slate-500 hover:text-clay-500 transition-colors"
          >
            <X className="h-4 w-4" />
            重置
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative min-w-[180px]">
          <button
            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
            className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg border border-forest-200 bg-white text-sm text-forest-800 hover:border-forest-300 transition-colors"
          >
            <span>{currentStatusLabel}</span>
            <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', statusDropdownOpen && 'rotate-180')} />
          </button>
          {statusDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 py-1 bg-white border border-forest-100 rounded-lg shadow-card-hover z-10">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={cn(
                    'w-full px-4 py-2 text-left text-sm transition-colors',
                    filters.status === status || (status === 'all' && !filters.status)
                      ? 'bg-forest-50 text-forest-700 font-medium'
                      : 'text-slate-600 hover:bg-forest-50/50'
                  )}
                >
                  {status === 'all' ? '全部状态' : getStatusLabel(status)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative flex-1 min-w-[240px] max-w-[360px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={filters.keyword}
            onChange={handleKeywordChange}
            placeholder="搜索产品名称、物料编码、供应商..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-forest-200 bg-white text-sm text-forest-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-forest-400 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <CalendarRange className="h-4 w-4 text-slate-400" />
          <input
            type="date"
            value={filters.dateFrom}
            onChange={handleDateFromChange}
            className="px-3 py-2.5 rounded-lg border border-forest-200 bg-white text-sm text-forest-800 focus:outline-none focus:ring-2 focus:ring-forest-400 focus:border-transparent transition-all"
          />
          <span className="text-slate-400">至</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={handleDateToChange}
            className="px-3 py-2.5 rounded-lg border border-forest-200 bg-white text-sm text-forest-800 focus:outline-none focus:ring-2 focus:ring-forest-400 focus:border-transparent transition-all"
          />
        </div>
      </div>
    </div>
  );
}
