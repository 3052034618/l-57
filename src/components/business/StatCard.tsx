import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: 'green' | 'emerald' | 'orange' | 'teal';
  trend?: string;
  trendUp?: boolean;
}

const colorClasses: Record<StatCardProps['color'], { bg: string; iconBg: string; iconColor: string }> = {
  green: {
    bg: 'bg-gradient-to-br from-forest-500 to-forest-700',
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
  },
  emerald: {
    bg: 'bg-gradient-to-br from-forest-400 to-forest-600',
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
  },
  orange: {
    bg: 'bg-gradient-to-br from-clay-400 to-clay-500',
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
  },
  teal: {
    bg: 'bg-gradient-to-br from-forest-300 to-forest-500',
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
  },
};

export default function StatCard({ title, value, icon: Icon, color, trend, trendUp }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState<number | string>(typeof value === 'number' ? 0 : '');
  const colorConfig = colorClasses[color];

  useEffect(() => {
    if (typeof value === 'number') {
      const duration = 1000;
      const steps = 30;
      const stepValue = value / steps;
      let current = 0;
      let step = 0;

      const timer = setInterval(() => {
        step++;
        current = Math.min(stepValue * step, value);
        if (step >= steps) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value]);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300 p-6',
        colorConfig.bg
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-white animate-count-up tabular-nums">
            {displayValue}
          </p>
          {trend && (
            <div className="mt-3 flex items-center gap-1">
              {trendUp ? (
                <TrendingUp className="h-4 w-4 text-white/90" />
              ) : (
                <TrendingDown className="h-4 w-4 text-white/90" />
              )}
              <span className="text-sm text-white/90">{trend}</span>
            </div>
          )}
        </div>
        <div className={cn('flex items-center justify-center w-12 h-12 rounded-xl', colorConfig.iconBg)}>
          <Icon className={cn('h-6 w-6', colorConfig.iconColor)} />
        </div>
      </div>
      <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
      <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
    </div>
  );
}
