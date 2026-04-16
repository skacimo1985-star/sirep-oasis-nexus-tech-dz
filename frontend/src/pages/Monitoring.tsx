import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useDataStore } from '@/store/dataStore';
import type { Alert, SystemHealth } from '@/store/dataStore';
import {
  fetchSystemHealth,
  fetchAlerts,
  acknowledgeAlert,
  resolveAlert,
  getSocket,
} from '@/services/monitoring.service';
import AlertsPanel from '@/components/Monitoring/AlertsPanel';
import SystemHealthDisplay from '@/components/Monitoring/SystemHealth';

export default function Monitoring() {
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();

  const {
    alerts,
    systemHealth,
    isLoadingAlerts,
    isLoadingHealth,
    setAlerts,
    addAlert,
    updateAlert,
    setSystemHealth,
    setLoadingAlerts,
    setLoadingHealth,
    setAlertsError,
  } = useDataStore();

  const socketCleanupRef = useRef<(() => void)[]>([]);

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
      // health fetch failed
    } finally {
      setLoadingHealth(false);
    }
  }, [setLoadingHealth, setSystemHealth]);

  const handleRefresh = useCallback(() => {
    void loadAlerts();
    void loadHealth();
  }, [loadAlerts, loadHealth]);

  /* Initial data load */
  useEffect(() => {
    if (!accessToken) {
      navigate('/login');
      return;
    }
    void loadAlerts();
    void loadHealth();
  }, [accessToken, navigate, loadAlerts, loadHealth]);

  /* Polling every 30s */
  useEffect(() => {
    if (!accessToken) return;
    const interval = setInterval(() => {
      void loadAlerts();
      void loadHealth();
    }, 30_000);
    return () => clearInterval(interval);
  }, [accessToken, loadAlerts, loadHealth]);

  /* Socket.io real-time updates */
  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket(accessToken);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onAlertNew = (alert: Alert) => addAlert(alert);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onAlertUpdated = (alert: Alert) => updateAlert(alert.id, alert);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onHealthUpdate = (health: SystemHealth) => setSystemHealth(health);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on('alert:new', onAlertNew as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on('alert:updated', onAlertUpdated as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on('health:update', onHealthUpdate as any);

    socketCleanupRef.current = [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      () => socket.off('alert:new', onAlertNew as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      () => socket.off('alert:updated', onAlertUpdated as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      () => socket.off('health:update', onHealthUpdate as any),
    ];

    return () => {
      socketCleanupRef.current.forEach((fn) => fn());
    };
  }, [accessToken, addAlert, updateAlert, setSystemHealth]);

  async function handleAcknowledge(id: string) {
    try {
      const updated = await acknowledgeAlert(id);
      updateAlert(id, updated);
    } catch {
      setAlertsError("Impossible d'acquitter l'alerte.");
    }
  }

  async function handleResolve(id: string) {
    try {
      const updated = await resolveAlert(id);
      updateAlert(id, updated);
    } catch {
      setAlertsError("Impossible de r\u00e9soudre l'alerte.");
    }
  }

  const activeCount = alerts.filter((a) => a.status === 'active').length;
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
            Monitoring Syst\u00e8me
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Sant\u00e9 du syst\u00e8me et alertes \u00b7{' '}
            <span className="arabic-inline">\u0635\u062d\u0629 \u0627\u0644\u0646\u0638\u0627\u0645 \u0648\u0627\u0644\u062a\u0646\u0628\u064a\u0647\u0627\u062a</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-oasis-50 text-oasis-700 text-xs font-medium">
            Temps r\u00e9el
          </span>
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
        <div className="rounded-xl bg-red-600 text-white px-5 py-3 flex items-center gap-3">
          <Activity className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold">
              \u26a0 {criticalCount} alerte(s) critique(s) active(s)
            </p>
            <p className="text-sm text-red-200 arabic-inline">
              {criticalCount} \u062a\u0646\u0628\u064a\u0647 \u062d\u0631\u062c \u0646\u0634\u0637
            </p>
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* System health */}
        <div className="xl:col-span-2 card">
          <div className="card-header">
            <div>
              <h2 className="section-title flex items-center gap-2">
                <Activity className="w-4 h-4 text-oasis-600" />
                Sant\u00e9 du Syst\u00e8me
              </h2>
              <span className="text-xs text-slate-400 arabic-inline">
                \u0635\u062d\u0629 \u0627\u0644\u0646\u0638\u0627\u0645
              </span>
            </div>
          </div>
          <SystemHealthDisplay
            health={systemHealth}
            isLoading={isLoadingHealth && !systemHealth}
            lastUpdated={systemHealth ? new Date().toISOString() : undefined}
          />
        </div>

        {/* Alerts panel */}
        <div className="xl:col-span-3 card">
          <div className="card-header">
            <div>
              <h2 className="section-title flex items-center gap-2">
                Alertes
                <span className="text-xs font-normal text-slate-400 arabic-inline">
                  \u0627\u0644\u062a\u0646\u0628\u064a\u0647\u0627\u062a
                </span>
              </h2>
            </div>
            {activeCount > 0 && (
              <span className="badge badge-danger">
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
