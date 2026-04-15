import { io, Socket } from 'socket.io-client';
import apiClient from '@/utils/api';
import type { Sensor, Alert, DashboardStats, SystemHealth } from '@/store/dataStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? '';

/* ── REST API calls ─────────────────────────────────────────── */

export async function fetchSensors(): Promise<Sensor[]> {
  const { data } = await apiClient.get<{ data: Sensor[] }>('/sensors');
  return data.data;
}

export async function fetchSensorById(id: string): Promise<Sensor> {
  const { data } = await apiClient.get<{ data: Sensor }>(`/sensors/${id}`);
  return data.data;
}

export interface SensorHistoryParams {
  from?: string;
  to?: string;
  limit?: number;
}

export async function fetchSensorHistory(
  id: string,
  params: SensorHistoryParams = {}
): Promise<Sensor['readings']> {
  const { data } = await apiClient.get<{ data: Sensor['readings'] }>(
    `/sensors/${id}/history`,
    { params }
  );
  return data.data;
}

export async function fetchAlerts(params?: {
  status?: string;
  severity?: string;
  limit?: number;
  page?: number;
}): Promise<Alert[]> {
  const { data } = await apiClient.get<{ data: Alert[] }>('/alerts', { params });
  return data.data;
}

export async function acknowledgeAlert(id: string): Promise<Alert> {
  const { data } = await apiClient.patch<{ data: Alert }>(`/alerts/${id}/acknowledge`);
  return data.data;
}

export async function resolveAlert(id: string): Promise<Alert> {
  const { data } = await apiClient.patch<{ data: Alert }>(`/alerts/${id}/resolve`);
  return data.data;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data } = await apiClient.get<{ data: DashboardStats }>('/dashboard/stats');
  return data.data;
}

export async function fetchSystemHealth(): Promise<SystemHealth> {
  const { data } = await apiClient.get<{ data: SystemHealth }>('/monitoring/health');
  return data.data;
}

export interface ThingSpeakChannel {
  id: number;
  name: string;
  field1?: string;
  field2?: string;
  field3?: string;
  field4?: string;
}

export interface ThingSpeakFeed {
  created_at: string;
  field1?: string;
  field2?: string;
  field3?: string;
  field4?: string;
}

export async function fetchThingSpeakData(
  channelId: string,
  apiKey?: string,
  results = 100
): Promise<{ channel: ThingSpeakChannel; feeds: ThingSpeakFeed[] }> {
  const { data } = await apiClient.get<{
    data: { channel: ThingSpeakChannel; feeds: ThingSpeakFeed[] };
  }>(`/iot/thingspeak/${channelId}`, { params: { apiKey, results } });
  return data.data;
}

/* ── Socket.io connection ───────────────────────────────────── */

export type SocketEventMap = {
  'sensor:update': Sensor;
  'sensor:reading': { sensorId: string; reading: Sensor['readings'][number] };
  'alert:new': Alert;
  'alert:updated': Alert;
  'health:update': SystemHealth;
  'stats:update': DashboardStats;
};

let socketInstance: Socket | null = null;

export function getSocket(token: string): Socket {
  if (socketInstance?.connected) return socketInstance;
  socketInstance = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 2_000,
  });
  return socketInstance;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

// fix: removed shadow variable 'socket' — use socketInstance directly
export function onSocketEvent<K extends keyof SocketEventMap>(
  event: K,
  handler: (data: SocketEventMap[K]) => void
): () => void {
  if (!socketInstance) return () => undefined;
  socketInstance.on(event, handler as Parameters<typeof socketInstance.on>[1]);
  return () => {
    socketInstance?.off(event, handler as Parameters<typeof socketInstance.off>[1]);
  };
}
