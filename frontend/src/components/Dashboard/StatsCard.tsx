import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';
import clsx from 'clsx';

type TrendDirection = 'up' | 'down' | 'neutral';

interface StatsCardProps {
  title: string;
  titleAr?: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: number;
    direction: TrendDirection;
    label?: string;
  };
  footer?: ReactNode;
  isLoading?: boolean;
  highlight?: 'success' | 'warning' | 'danger' | 'info' | 'default';
}

const highlightStyles: Record<string, string> = {
  success: 'border-l-4 border-oasis-500',
  warning: 'border-l-4 border-sand-500',
  danger:  'border-l-4 border-red-500',
  info:    'border-l-4 border-sky-500',
  default: '',
};

const trendColors: Record<TrendDirection, string> = {
  up:      'text-oasis-600',
  down:    'text-red-600',
  neutral: 'text-slate-500',
};

const trendArrows: Record<TrendDirection, string> = {
  up:      '↑',
  down:    '↓',
  neutral: '→',
};

export default function StatsCard({
  title,
  titleAr,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-oasis-600',
  iconBg    = 'bg-oasis-50',
  trend,
  footer,
  isLoading = false,
  highlight = 'default',
}: StatsCardProps) {
  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-8 w-16" />
            <div className="skeleton h-3 w-32" />
          </div>
          <div className="skeleton w-12 h-12 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('card transition-shadow hover:shadow-md', highlightStyles[highlight])}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="text-sm font-medium text-slate-500 truncate">{title}</p>
            {titleAr && (
              <span className="text-xs text-slate-400 arabic-inline">{titleAr}</span>
            )}
          </div>

          <p className="mt-1 text-3xl font-bold text-slate-900 tabular-nums">
            {value}
          </p>

          {subtitle && (
            <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          )}

          {trend && (
            <div className={clsx('mt-2 flex items-center gap-1 text-xs font-medium', trendColors[trend.direction])}>
              <span aria-hidden="true">{trendArrows[trend.direction]}</span>
              <span>{Math.abs(trend.value)}%</span>
              {trend.label && (
                <span className="text-slate-400 font-normal">{trend.label}</span>
              )}
            </div>
          )}
        </div>

        <div className={clsx('p-3 rounded-xl ml-4 shrink-0', iconBg)}>
          <Icon className={clsx('w-6 h-6', iconColor)} />
        </div>
      </div>

      {footer && (
        <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );
}
