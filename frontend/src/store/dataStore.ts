import { create } from 'zustand';

/* ── Types ───────────────────────────────────────────────────────────── */
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type AlertStatus   = 'active' | 'acknowledged' | 'resolved';
export type SensorStatus  = 'online' | 'offline' | 'warning';

export interface SensorReading {
  timestamp: string;
  value: number;
  unit: string;
}

export interface Sensor {
  id: string;
  name: string;
  nameAr: string;
  type: string;
  location: string;
  status: SensorStatus;
  lastReading?: SensorReading;
  readings: SensorReading[];
}

export interface Alert {
  id: string;
  title: string;
  titleAr?: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  source: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export interface DashboardStats {
  totalSensors: number;
  onlineSensors: number;
  offlineSensors: number;
  activeAlerts: number;
  criticalAlerts: number;
  systemUptime: number; // percentage
  dataPointsToday: number;
  lastUpdated: string;
}

export interface SystemHealth {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  dbConnections: number;
  apiLatency: number;
  uptime: number; // seconds
}

interface DataState {
  sensors: Sensor[];
  alerts: Alert[];
  dashboardStats: DashboardStats | null;
  systemHealth: SystemHealth | null;
  selectedSensorId: string | null;
  isLoadingSensors: boolean;
  isLoadingAlerts: boolean;
  isLoadingStats: boolean;
  isLoadingHealth: boolean;
  sensorsError: string | null;
  alertsError: string | null;
}

interface DataActions {
  setSensors: (sensors: Sensor[]) => void;
  updateSensor: (id: string, partial: Partial<Sensor>) => void;
  addSensorReading: (sensorId: string, reading: SensorReading) => void;
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  updateAlert: (id: string, partial: Partial<Alert>) => void;
  setDashboardStats: (stats: DashboardStats) => void;
  setSystemHealth: (health: SystemHealth) => void;
  setSelectedSensor: (id: string | null) => void;
  setLoadingSensors: (v: boolean) => void;
  setLoadingAlerts: (v: boolean) => void;
  setLoadingStats: (v: boolean) => void;
  setLoadingHealth: (v: boolean) => void;
  setSensorsError: (e: string | null) => void;
  setAlertsError: (e: string | null) => void;
}

type DataStore = DataState & DataActions;

const MAX_READINGS_PER_SENSOR = 100;

export const useDataStore = create<DataStore>()((set) => ({
  /* ── Initial state ──────────────────────────────────────────────── */
  sensors: [],
  alerts: [],
  dashboardStats: null,
  systemHealth: null,
  selectedSensorId: null,
  isLoadingSensors: false,
  isLoadingAlerts: false,
  isLoadingStats: false,
  isLoadingHealth: false,
  sensorsError: null,
  alertsError: null,

  /* ── Sensor actions ─────────────────────────────────────────────── */
  setSensors: (sensors) => set({ sensors }),

  updateSensor: (id, partial) =>
    set((state) => ({
      sensors: state.sensors.map((s) =>
        s.id === id ? { ...s, ...partial } : s
      ),
    })),

  addSensorReading: (sensorId, reading) =>
    set((state) => ({
      sensors: state.sensors.map((s) => {
        if (s.id !== sensorId) return s;
        const readings = [...s.readings, reading].slice(-MAX_READINGS_PER_SENSOR);
        return { ...s, readings, lastReading: reading };
      }),
    })),

  /* ── Alert actions ──────────────────────────────────────────────── */
  setAlerts: (alerts) => set({ alerts }),

  addAlert: (alert) =>
    set((state) => ({ alerts: [alert, ...state.alerts] })),

  updateAlert: (id, partial) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, ...partial } : a
      ),
    })),

  /* ── Dashboard / health ─────────────────────────────────────────── */
  setDashboardStats: (dashboardStats) => set({ dashboardStats }),
  setSystemHealth: (systemHealth) => set({ systemHealth }),

  /* ── UI state ───────────────────────────────────────────────────── */
  setSelectedSensor: (selectedSensorId) => set({ selectedSensorId }),
  setLoadingSensors: (isLoadingSensors) => set({ isLoadingSensors }),
  setLoadingAlerts:  (isLoadingAlerts)  => set({ isLoadingAlerts }),
  setLoadingStats:   (isLoadingStats)   => set({ isLoadingStats }),
  setLoadingHealth:  (isLoadingHealth)  => set({ isLoadingHealth }),
  setSensorsError:   (sensorsError)     => set({ sensorsError }),
  setAlertsError:    (alertsError)      => set({ alertsError }),
}));

/* ── Selectors ────────────────────────────────────────────────────────── */
export const selectOnlineSensors = (s: DataStore) =>
  s.sensors.filter((x) => x.status === 'online');
export const selectActiveAlerts = (s: DataStore) =>
  s.alerts.filter((x) => x.status === 'active');
export const selectCriticalAlerts = (s: DataStore) =>
  s.alerts.filter((x) => x.severity === 'critical' && x.status === 'active');
