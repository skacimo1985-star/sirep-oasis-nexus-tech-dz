import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import clsx from 'clsx';
import type { Alert, AlertSeverity, AlertStatus } from '@/store/dataStore';

interface AlertsPanelProps {
  alerts: Alert[];
  isLoading?: boolean;
  onAcknowledge: (id: string) => Promise<void>;
  onResolve: (id: string) => Promise<void>;
  onRefresh: () => void;
}

type FilterStatus   = AlertStatus | 'all';
type FilterSeverity = AlertSeverity | 'all';

const severityLabels: Record<AlertSeverity, string> = {
  critical: 'Critique',
  high:     'Élevé',
  medium:   'Moyen',
  low:      'Faible',
  info:     'Info',
};

const statusLabels: Record<AlertStatus, string> = {
  active:       'Active',
  acknowledged: 'Acquittée',
  resolved:     'Résolue',
};

const severityIcons: Record<AlertSeverity, React.ElementType> = {
  critical: XCircle,
  high:     AlertTriangle,
  medium:   AlertTriangle,
  low:      Clock,
  info:     Clock,
};

const severityBadgeClass: Record<AlertSeverity, string> = {
  critical: 'badge-danger',
  high:     'badge-warning',
  medium:   'bg-yellow-100 text-yellow-800',
  low:      'badge-info',
  info:     'badge-neutral',
};

function AlertCard({
  alert,
  onAcknowledge,
  onResolve,
}: {
  alert: Alert;
  onAcknowledge: (id: string) => Promise<void>;
  onResolve: (id: string) => Promise<void>;
}) {
  const [actioning, setActioning] = useState(false);
  const Icon = severityIcons[alert.severity];

  let timeAgo = '';
  try {
    timeAgo = formatDistanceToNow(parseISO(alert.createdAt), {
      addSuffix: true,
      locale: fr,
    });
  } catch {
    timeAgo = alert.createdAt;
  }

  async function handle(fn: (id: string) => Promise<void>) {
    setActioning(true);
    try {
      await fn(alert.id);
    } finally {
      setActioning(false);
    }
  }

  return (
    <div
      className={clsx(
        'card p-4 transition-all hover:shadow-md',
        {
          'alert-critical': alert.severity === 'critical',
          'alert-high':     alert.severity === 'high',
          'alert-medium':   alert.severity === 'medium',
          'alert-low':      alert.severity === 'low',
          'alert-info':     alert.severity === 'info',
          'opacity-60':     alert.status === 'resolved',
        }
      )}
    >
      <div className="flex items-start gap-3">
        <Icon
          className={clsx('w-5 h-5 mt-0.5 shrink-0', {
            'text-red-600':    alert.severity === 'critical',
            'text-orange-500': alert.severity === 'high',
            'text-yellow-500': alert.severity === 'medium',
            'text-sky-500':    alert.severity === 'low',
            'text-slate-500':  alert.severity === 'info',
          })}
        />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-slate-800">{alert.title}</h3>
            {alert.titleAr && (
              <span className="text-xs text-slate-500 arabic-inline">{alert.titleAr}</span>
            )}
            <span className={clsx('badge text-[10px]', severityBadgeClass[alert.severity])}>
              {severityLabels[alert.severity]}
            </span>
            <span className="badge badge-neutral text-[10px]">
              {statusLabels[alert.status]}
            </span>
          </div>

          <p className="text-sm text-slate-600 mb-2">{alert.message}</p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span>Source: <strong className="text-slate-600">{alert.source}</strong></span>
            <span>{timeAgo}</span>
          </div>
        </div>

        {/* Actions */}
        {alert.status !== 'resolved' && (
          <div className="flex flex-col gap-2 shrink-0">
            {alert.status === 'active' && (
              <button
                onClick={() => handle(onAcknowledge)}
                disabled={actioning}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-sand-100 text-sand-800 hover:bg-sand-200 transition-colors disabled:opacity-50"
                title="Acquitter"
              >
                {actioning ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Clock className="w-3 h-3" />
                )}
                Acquitter
              </button>
            )}
            <button
              onClick={() => handle(onResolve)}
              disabled={actioning}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-oasis-100 text-oasis-800 hover:bg-oasis-200 transition-colors disabled:opacity-50"
              title="Résoudre"
            >
              {actioning ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <CheckCircle className="w-3 h-3" />
              )}
              Résoudre
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AlertsPanel({
  alerts,
  isLoading = false,
  onAcknowledge,
  onResolve,
  onRefresh,
}: AlertsPanelProps) {
  const [filterStatus,   setFilterStatus]   = useState<FilterStatus>('all');
  const [filterSeverity, setFilterSeverity] = useState<FilterSeverity>('all');

  const filtered = alerts.filter((a) => {
    const matchStatus   = filterStatus   === 'all' || a.status   === filterStatus;
    const matchSeverity = filterSeverity === 'all' || a.severity === filterSeverity;
    return matchStatus && matchSeverity;
  });

  const counts = {
    active:       alerts.filter((a) => a.status === 'active').length,
    acknowledged: alerts.filter((a) => a.status === 'acknowledged').length,
    resolved:     alerts.filter((a) => a.status === 'resolved').length,
    critical:     alerts.filter((a) => a.severity === 'critical' && a.status === 'active').length,
  };

  return (
    <div className="space-y-4">
      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        {counts.critical > 0 && (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold animate-pulse-slow">
            <XCircle className="w-3.5 h-3.5" />
            {counts.critical} alerte(s) critique(s)
          </span>
        )}
        <span className="badge badge-warning">{counts.active} active(s)</span>
        <span className="badge badge-neutral">{counts.acknowledged} acquittée(s)</span>
        <span className="badge badge-success">{counts.resolved} résolue(s)</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
          className="input-field w-40 py-1.5 text-xs"
        >
          <option value="all">Tout statut</option>
          <option value="active">Active</option>
          <option value="acknowledged">Acquittée</option>
          <option value="resolved">Résolue</option>
        </select>
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value as FilterSeverity)}
          className="input-field w-40 py-1.5 text-xs"
        >
          <option value="all">Toute sévérité</option>
          <option value="critical">Critique</option>
          <option value="high">Élevé</option>
          <option value="medium">Moyen</option>
          <option value="low">Faible</option>
          <option value="info">Info</option>
        </select>
        <button
          onClick={onRefresh}
          className="ml-auto btn-secondary py-1.5 text-xs"
          title="Actualiser"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualiser
        </button>
      </div>

      {/* Alert cards */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="skeleton w-5 h-5 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-2/3" />
                  <div className="skeleton h-3 w-full" />
                  <div className="skeleton h-3 w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
          <CheckCircle className="w-14 h-14 text-oasis-200" />
          <p className="text-base font-medium">Aucune alerte trouvée</p>
          <p className="text-sm arabic-inline">لا توجد تنبيهات</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={onAcknowledge}
              onResolve={onResolve}
            />
          ))}
        </div>
      )}
    </div>
  );
}
