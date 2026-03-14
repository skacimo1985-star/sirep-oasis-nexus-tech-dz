import { Cpu, HardDrive, MemoryStick, Activity, Database, Wifi, Clock } from 'lucide-react';
import clsx from 'clsx';
import { formatDuration, intervalToDuration } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { SystemHealth } from '@/store/dataStore';

interface SystemHealthProps {
  health: SystemHealth | null;
  isLoading?: boolean;
  lastUpdated?: string;
}

interface MetricBarProps {
  label: string;
  labelAr: string;
  value: number;
  max?: number;
  unit?: string;
  icon: React.ElementType;
  thresholds?: { warning: number; danger: number };
}

function MetricBar({
  label,
  labelAr,
  value,
  max = 100,
  unit = '%',
  icon: Icon,
  thresholds = { warning: 70, danger: 90 },
}: MetricBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  const colorClass =
    pct >= thresholds.danger
      ? 'bg-red-500'
      : pct >= thresholds.warning
      ? 'bg-sand-400'
      : 'bg-oasis-500';

  const textClass =
    pct >= thresholds.danger
      ? 'text-red-600'
      : pct >= thresholds.warning
      ? 'text-sand-600'
      : 'text-oasis-700';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={clsx('w-4 h-4', textClass)} />
          <span className="text-sm font-medium text-slate-700">{label}</span>
          <span className="text-xs text-slate-400 arabic-inline">{labelAr}</span>
        </div>
        <span className={clsx('text-sm font-bold tabular-nums', textClass)}>
          {typeof value === 'number' ? value.toFixed(1) : value}{unit}
        </span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-700', colorClass)}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        />
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  unit = '',
  color = 'default',
}: {
  label: string;
  value: string | number;
  unit?: string;
  color?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const colorMap = {
    default: 'bg-slate-50 text-slate-700 border-slate-200',
    success: 'bg-oasis-50 text-oasis-800 border-oasis-200',
    warning: 'bg-sand-50 text-sand-800 border-sand-200',
    danger:  'bg-red-50 text-red-800 border-red-200',
  };
  return (
    <div className={clsx('rounded-lg border px-4 py-3 text-center', colorMap[color])}>
      <p className="text-xs text-current/60 font-medium mb-1">{label}</p>
      <p className="text-xl font-bold tabular-nums">
        {value}
        {unit && <span className="text-sm font-normal ml-0.5">{unit}</span>}
      </p>
    </div>
  );
}

export default function SystemHealthDisplay({
  health,
  isLoading = false,
  lastUpdated,
}: SystemHealthProps) {
  if (isLoading || !health) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-lg" />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="skeleton h-4 w-32" />
              <div className="skeleton h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const uptimeDuration = intervalToDuration({ start: 0, end: health.uptime * 1000 });
  const uptimeStr = formatDuration(uptimeDuration, {
    format: ['days', 'hours', 'minutes'],
    locale: fr,
  });

  return (
    <div className="space-y-6">
      {/* Quick stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatPill
          label="Latence API"
          value={health.apiLatency}
          unit="ms"
          color={health.apiLatency > 500 ? 'danger' : health.apiLatency > 200 ? 'warning' : 'success'}
        />
        <StatPill
          label="Connexions DB"
          value={health.dbConnections}
          color={health.dbConnections > 80 ? 'danger' : 'success'}
        />
        <StatPill
          label="Réseau ↑"
          value={(health.networkOut / 1024).toFixed(1)}
          unit="MB/s"
          color="default"
        />
        <StatPill
          label="Réseau ↓"
          value={(health.networkIn / 1024).toFixed(1)}
          unit="MB/s"
          color="default"
        />
      </div>

      {/* Progress bars */}
      <div className="card space-y-5">
        <div className="card-header">
          <h3 className="section-title flex items-center gap-2">
            <Activity className="w-4 h-4 text-oasis-600" />
            Utilisation des ressources
            <span className="text-xs font-normal text-slate-400 arabic-inline">
              استخدام الموارد
            </span>
          </h3>
          {lastUpdated && (
            <span className="text-xs text-slate-400">
              Mis à jour: {new Date(lastUpdated).toLocaleTimeString('fr-DZ')}
            </span>
          )}
        </div>

        <MetricBar
          label="CPU"
          labelAr="المعالج"
          value={health.cpuUsage}
          icon={Cpu}
          thresholds={{ warning: 70, danger: 90 }}
        />
        <MetricBar
          label="Mémoire RAM"
          labelAr="الذاكرة"
          value={health.memoryUsage}
          icon={MemoryStick}
          thresholds={{ warning: 75, danger: 90 }}
        />
        <MetricBar
          label="Disque"
          labelAr="القرص"
          value={health.diskUsage}
          icon={HardDrive}
          thresholds={{ warning: 80, danger: 95 }}
        />
        <MetricBar
          label="Connexions DB"
          labelAr="قاعدة البيانات"
          value={health.dbConnections}
          max={100}
          unit=" conn"
          icon={Database}
          thresholds={{ warning: 70, danger: 90 }}
        />
      </div>

      {/* Uptime */}
      <div className="card flex items-center gap-4 p-4">
        <div className="p-3 bg-oasis-50 rounded-xl">
          <Clock className="w-6 h-6 text-oasis-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700">
            Durée de fonctionnement
            <span className="ml-2 text-xs text-slate-400 arabic-inline">وقت التشغيل</span>
          </p>
          <p className="text-2xl font-bold text-oasis-700">{uptimeStr || '< 1 min'}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-oasis-100">
          <Wifi className="w-3.5 h-3.5 text-oasis-600" />
          <span className="text-xs font-semibold text-oasis-700">En ligne</span>
        </div>
      </div>
    </div>
  );
}
