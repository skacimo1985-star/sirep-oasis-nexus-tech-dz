import { formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AlertTriangle, CheckCircle, Info, XCircle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import type { Alert, AlertSeverity } from '@/store/dataStore';

interface AlertListProps {
  alerts: Alert[];
  maxItems?: number;
  showViewAll?: boolean;
  compact?: boolean;
}

const severityConfig: Record<
  AlertSeverity,
  { icon: React.ElementType; iconClass: string; rowClass: string; label: string; labelAr: string }
> = {
  critical: {
    icon:      XCircle,
    iconClass: 'text-red-600',
    rowClass:  'alert-critical',
    label:     'Critique',
    labelAr:   'حرج',
  },
  high: {
    icon:      AlertTriangle,
    iconClass: 'text-orange-500',
    rowClass:  'alert-high',
    label:     'Élevé',
    labelAr:   'عالي',
  },
  medium: {
    icon:      AlertTriangle,
    iconClass: 'text-yellow-500',
    rowClass:  'alert-medium',
    label:     'Moyen',
    labelAr:   'متوسط',
  },
  low: {
    icon:      Info,
    iconClass: 'text-sky-500',
    rowClass:  'alert-low',
    label:     'Faible',
    labelAr:   'منخفض',
  },
  info: {
    icon:      Info,
    iconClass: 'text-slate-500',
    rowClass:  'alert-info',
    label:     'Info',
    labelAr:   'معلومة',
  },
};

function AlertRow({ alert, compact }: { alert: Alert; compact?: boolean }) {
  const cfg = severityConfig[alert.severity];
  const Icon = cfg.icon;

  let timeAgo = '';
  try {
    timeAgo = formatDistanceToNow(parseISO(alert.createdAt), {
      addSuffix: true,
      locale: fr,
    });
  } catch {
    timeAgo = alert.createdAt;
  }

  return (
    <div
      className={clsx(
        'rounded-lg px-4 py-3 flex items-start gap-3 animate-fade-in',
        cfg.rowClass
      )}
    >
      <Icon className={clsx('w-4 h-4 mt-0.5 shrink-0', cfg.iconClass)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-slate-800 truncate">
            {alert.title}
          </p>
          <span
            className={clsx('badge text-[10px]', {
              'badge-danger':  alert.severity === 'critical',
              'badge-warning': alert.severity === 'high' || alert.severity === 'medium',
              'badge-info':    alert.severity === 'low' || alert.severity === 'info',
            })}
          >
            {cfg.label}
          </span>
          {alert.status === 'acknowledged' && (
            <span className="badge badge-neutral text-[10px]">Acquitté</span>
          )}
        </div>
        {!compact && (
          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
            {alert.message}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] text-slate-400">{timeAgo}</span>
          <span className="text-[11px] text-slate-300">·</span>
          <span className="text-[11px] text-slate-400">{alert.source}</span>
        </div>
      </div>
      {alert.status === 'resolved' && (
        <CheckCircle className="w-4 h-4 text-oasis-500 shrink-0 mt-0.5" />
      )}
    </div>
  );
}

export default function AlertList({
  alerts,
  maxItems     = 5,
  showViewAll  = true,
  compact      = false,
}: AlertListProps) {
  const navigate    = useNavigate();
  const displayList = alerts.slice(0, maxItems);

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
        <CheckCircle className="w-10 h-10 text-oasis-300" />
        <p className="text-sm font-medium">Aucune alerte active</p>
        <p className="text-xs arabic-inline">لا توجد تنبيهات نشطة</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {displayList.map((alert) => (
        <AlertRow key={alert.id} alert={alert} compact={compact} />
      ))}

      {showViewAll && alerts.length > maxItems && (
        <button
          onClick={() => navigate('/monitoring')}
          className="w-full flex items-center justify-center gap-1 py-2 text-xs font-medium text-oasis-600 hover:text-oasis-800 hover:bg-oasis-50 rounded-lg transition-colors"
        >
          Voir toutes les alertes ({alerts.length})
          <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
