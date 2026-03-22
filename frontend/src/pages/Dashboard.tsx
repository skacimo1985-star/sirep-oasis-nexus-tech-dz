import { useEffect, useCallback } from 'react';
import {
  Cpu,
  AlertTriangle,
  Activity,
  Wifi,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useDataStore, selectActiveAlerts } from '@/store/dataStore';
import {
  fetchDashboardStats,
  fetchSensors,
  fetchAlerts,
} from '@/services/monitoring.service';
import StatsCard from '@/components/Dashboard/StatsCard';
import SensorChart from '@/components/Dashboard/SensorChart';
import AlertList from '@/components/Dashboard/AlertList';
import LoadingSpinner from '@/components/Common/LoadingSpinner';

export default function Dashboard() {
  const { user } = useAuthStore();

  const {
    sensors,
    dashboardStats,
    isLoadingSensors,
    isLoadingStats,
    isLoadingAlerts,
    setSensors,
    setAlerts,
    setDashboardStats,
    setLoadingSensors,
    setLoadingStats,
    setLoadingAlerts,
    setSensorsError,
    setAlertsError,
  } = useDataStore();

  const activeAlerts = useDataStore(selectActiveAlerts);

  const loadData = useCallback(async () => {
    setLoadingStats(true);
    setLoadingSensors(true);
    setLoadingAlerts(true);

    const [statsResult, sensorsResult, alertsResult] = await Promise.allSettled([
      fetchDashboardStats(),
      fetchSensors(),
      fetchAlerts({ status: 'active', limit: 10 }),
    ]);

    if (statsResult.status === 'fulfilled') {
      setDashboardStats(statsResult.value);
    }
    setLoadingStats(false);

    if (sensorsResult.status === 'fulfilled') {
      setSensors(sensorsResult.value);
      setSensorsError(null);
    } else {
      setSensorsError('Impossible de charger les capteurs');
    }
    setLoadingSensors(false);

    if (alertsResult.status === 'fulfilled') {
      setAlerts(alertsResult.value);
      setAlertsError(null);
    } else {
      setAlertsError('Impossible de charger les alertes');
    }
    setLoadingAlerts(false);
  }, [
    setLoadingStats,
    setLoadingSensors,
    setLoadingAlerts,
    setDashboardStats,
    setSensors,
    setAlerts,
    setSensorsError,
    setAlertsError,
  ]);

  useEffect(() => {
    void loadData();
    const interval = setInterval(() => void loadData(), 60_000);
    return () => clearInterval(interval);
  }, [loadData]);

  const isLoading = isLoadingStats && !dashboardStats;

  /* Demo sensors fallback for display */
  const displaySensor = sensors.find((s) => s.readings.length > 0) ?? null;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Tableau de Bord</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Vue d&apos;ensemble de la plateforme ·{' '}
            <span className="arabic-inline">نظرة عامة على المنصة</span>
          </p>
        </div>
        <button
          onClick={() => void loadData()}
          disabled={isLoadingStats || isLoadingSensors}
          className="btn-secondary self-start sm:self-auto"
        >
          <RefreshCw
            className={`w-4 h-4 ${isLoadingStats ? 'animate-spin' : ''}`}
          />
          Actualiser
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Capteurs actifs"
          titleAr="أجهزة الاستشعار"
          value={dashboardStats?.onlineSensors ?? '—'}
          subtitle={`sur ${dashboardStats?.totalSensors ?? '—'} total`}
          icon={Cpu}
          iconColor="text-oasis-600"
          iconBg="bg-oasis-50"
          highlight="success"
          isLoading={isLoading}
          trend={
            dashboardStats
              ? {
                  value: Math.round(
                    (dashboardStats.onlineSensors / dashboardStats.totalSensors) * 100
                  ) || 0,
                  direction: 'up',
                  label: 'en ligne',
                }
              : undefined
          }
        />
        <StatsCard
          title="Alertes actives"
          titleAr="التنبيهات النشطة"
          value={dashboardStats?.activeAlerts ?? '—'}
          subtitle={`dont ${dashboardStats?.criticalAlerts ?? 0} critique(s)`}
          icon={AlertTriangle}
          iconColor={
            (dashboardStats?.criticalAlerts ?? 0) > 0 ? 'text-red-600' : 'text-sand-600'
          }
          iconBg={
            (dashboardStats?.criticalAlerts ?? 0) > 0 ? 'bg-red-50' : 'bg-sand-50'
          }
          highlight={(dashboardStats?.criticalAlerts ?? 0) > 0 ? 'danger' : 'warning'}
          isLoading={isLoading}
        />
        <StatsCard
          title="Disponibilité"
          titleAr="وقت التشغيل"
          value={dashboardStats ? `${dashboardStats.systemUptime.toFixed(1)}%` : '—'}
          subtitle="Système en ligne"
          icon={Activity}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
          highlight="info"
          isLoading={isLoading}
        />
        <StatsCard
          title="Points de données"
          titleAr="نقاط البيانات"
          value={dashboardStats?.dataPointsToday?.toLocaleString('fr-DZ') ?? '—'}
          subtitle="aujourd'hui"
          icon={TrendingUp}
          iconColor="text-dusk-600"
          iconBg="bg-dusk-50"
          isLoading={isLoading}
          trend={{ value: 12, direction: 'up', label: 'vs hier' }}
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sensor chart — takes 2 columns */}
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <div>
              <h2 className="section-title flex items-center gap-2">
                <Wifi className="w-4 h-4 text-oasis-600" />
                Données Capteurs en Temps Réel
              </h2>
              <p className="text-xs text-slate-400 arabic-inline">بيانات المستشعرات في الوقت الفعلي</p>
            </div>
          </div>

          {isLoadingSensors && !displaySensor ? (
            <LoadingSpinner label="Chargement des capteurs…" />
          ) : displaySensor ? (
            <SensorChart sensor={displaySensor} height={260} showLegend />
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
              Aucun capteur avec données disponibles
            </div>
          )}

          {/* Sensor list */}
          {sensors.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {sensors.slice(0, 6).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 text-xs"
                  >
                    <span
                      className={`status-dot ${
                        s.status === 'online'
                          ? 'status-dot-online'
                          : s.status === 'warning'
                          ? 'status-dot-warning'
                          : 'status-dot-offline'
                      }`}
                    />
                    <span className="truncate font-medium text-slate-700">{s.name}</span>
                    {s.lastReading && (
                      <span className="ml-auto text-slate-500 tabular-nums">
                        {s.lastReading.value.toFixed(1)}
                        {s.lastReading.unit}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="section-title flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-sand-500" />
                Alertes Récentes
              </h2>
              <p className="text-xs text-slate-400 arabic-inline">التنبيهات الأخيرة</p>
            </div>
            {activeAlerts.length > 0 && (
              <span className="badge badge-danger animate-pulse">
                {activeAlerts.length}
              </span>
            )}
          </div>

          {isLoadingAlerts && activeAlerts.length === 0 ? (
            <LoadingSpinner size="sm" label="Chargement…" />
          ) : (
            <AlertList
              alerts={activeAlerts}
              maxItems={6}
              showViewAll
              compact
            />
          )}
        </div>
      </div>

      {/* Welcome message */}
      <div className="card oasis-gradient text-white overflow-hidden relative">
        <div className="absolute right-0 top-0 w-48 h-48 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10">
          <p className="text-sm font-medium text-oasis-200">
            Connecté en tant que: {user?.role}
          </p>
          <h3 className="text-xl font-bold mt-1">
            Bienvenue sur SIREP OASIS NEXUS TECH DZ
          </h3>
          <p className="text-oasis-200 text-sm mt-1 arabic">
            مرحباً بك في منصة واحة الصحراء الذكية
          </p>
        </div>
      </div>
    </div>
  );
}
