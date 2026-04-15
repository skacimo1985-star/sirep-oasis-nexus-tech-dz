import { useEffect, useCallback, useRef } from 'react';
import { Activity, RefreshCw, Wifi } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useDataStore } from '@/store/dataStore';
import {
  fetchSystemHealth,
  fetchAlerts,
  acknowledgeAlert,
  resolveAlert,
  getSocket,
  disconnectSocket,
  onSocketEvent,
} from '@/services/monitoring.service';
import AlertsPanel from '@/components/Monitoring/AlertsPanel';
import SystemHealthDisplay from '@/components/Monitoring/SystemHealth';

export default function Monitoring() {
  const { accessToken } = useAuthStore();

  const {
    alerts,
    systemHealth,
    isLoadingAlerts,
    isLoadingHealth,
    setAlerts,
    updateAlert,
    addAlert,
    setSystemHealth,
    setLoadingAlerts,
    setLoadingHealth,
    setAlertsError,
  } = useDataStore();

  const socketCleanupRef = useRef<(() => void)[]>([]);
  const lastHealthRef    = useRef<string>('');

  const loadAlerts = useCallback(async () => {
    setLoadingAlerts(true);
    try {
      const data = await fetchAlerts({ limit: 100 });
      setAlerts(data);
      setAlertsError(null);
    } catch {
      setAlertsError('Impossible de charger les alertes.');
    } finally {
      setLoadingAlerts(false);
    }
  }, [setLoadingAlerts, setAlerts, setAlertsError]);

  const loadHealth = useCallback(async () => {
    setLoadingHealth(true);
    try {
      const data = await fetchSystemHealth();
      setSystemHealth(data);
    } catch {
      // health fetch failed — keep last known state
    } finally {
      setLoadingHealth(false);
    }
  }, [setLoadingHealth, setSystemHealth]);

  const handleRefresh = useCallback(() => {
    void loadAlerts();
    void loadHealth();
  }, [loadAlerts, loadHealth]);

  /* Socket.io real-time updates */
  useEffect(() => {
    if (!accessToken) return;

        const _socket = getSocket(accessToken); // stored for cleanup via socketCleanupRef

    const cleanups = [
      onSocketEvent('alert:new',     (alert)  => addAlert(alert)),
      onSocketEvent('alert:updated', (alert)  => updateAlert(alert.id, alert)),
      onSocketEvent('health:update', (health) => {
        const key = JSON.stringify(health);
        if (key !== lastHealthRef.current) {
          lastHealthRef.current = key;
          setSystemHealth(health);
        }
      }),
    ];
    socketCleanupRef.current = cleanups;

    return () => {
      cleanups.forEach((fn) => fn());
      disconnectSocket();
    };
  }, [accessToken, addAlert, updateAlert, setSystemHealth]);

  useEffect(() => {
    void loadAlerts();
    void loadHealth();

    /* Poll health every 30 seconds */
    const interval = setInterval(() => void loadHealth(), 30_000);
    return () => clearInterval(interval);
  }, [loadAlerts, loadHealth]);

  async function handleAcknowledge(id: string) {
    const updated = await acknowledgeAlert(id);
    updateAlert(id, updated);
  }

  async function handleResolve(id: string) {
    const updated = await resolveAlert(id);
    updateAlert(id, updated);
  }

  const activeCount   = alerts.filter((a) => a.status === 'active').length;
  const criticalCount = alerts.filter(
    (a) => a.severity === 'critical' && a.status === 'active'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Activity className="w-6 h-6 text-oasis-600" />
            Monitoring Système
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Santé du système et alertes ·{' '}
            <span className="arabic-inline">صحة النظام والتنبيهات</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-oasis-50 text-oasis-700 text-xs font-medium">
            <Wifi className="w-3.5 h-3.5" />
            Temps réel
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoadingAlerts || isLoadingHealth}
            className="btn-secondary"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                isLoadingAlerts || isLoadingHealth ? 'animate-spin' : ''
              }`}
            />
            Actualiser
          </button>
        </div>
      </div>

      {/* Critical alert banner */}
      {criticalCount > 0 && (
        <div className="rounded-xl bg-red-600 text-white px-5 py-3 flex items-center gap-3 animate-pulse-slow">
          <Activity className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold">
              ⚠ {criticalCount} alerte(s) critique(s) active(s)
            </p>
            <p className="text-sm text-red-200 arabic-inline">
              {criticalCount} تنبيه حرج نشط
            </p>
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* System health — left 2 cols */}
        <div className="xl:col-span-2 card">
          <div className="card-header">
            <div>
              <h2 className="section-title flex items-center gap-2">
                <Activity className="w-4 h-4 text-oasis-600" />
                Santé du Système
              </h2>
              <p className="text-xs text-slate-400 arabic-inline">صحة النظام</p>
            </div>
          </div>
          <SystemHealthDisplay
            health={systemHealth}
            isLoading={isLoadingHealth && !systemHealth}
            lastUpdated={systemHealth ? new Date().toISOString() : undefined}
          />
        </div>

        {/* Alerts panel — right 3 cols */}
        <div className="xl:col-span-3 card">
          <div className="card-header">
            <div>
              <h2 className="section-title flex items-center gap-2">
                Alertes
                <span className="text-xs font-normal text-slate-400 arabic-inline">
                  التنبيهات
                </span>
              </h2>
            </div>
            {activeCount > 0 && (
              <span className="badge badge-danger animate-pulse">
                {activeCount} active(s)
              </span>
            )}
          </div>
          <AlertsPanel
            alerts={alerts}
            isLoading={isLoadingAlerts && alerts.length === 0}
            onAcknowledge={handleAcknowledge}
            onResolve={handleResolve}
            onRefresh={handleRefresh}
          />
        </div>
      </div>
    </div>
  );
}
