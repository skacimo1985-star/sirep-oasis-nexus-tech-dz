// Thin wrapper over monitoring.service — lets Monitoring.tsx import from '../api/alerts'
import {
  fetchAlerts,
  acknowledgeAlert,
  resolveAlert,
} from '@/services/monitoring.service';
import type { Alert } from '@/store/dataStore';

export async function getAlerts(accessToken: string): Promise<Alert[]> {
  void accessToken; // token injected via axios interceptor in api.ts
  return fetchAlerts();
}

export async function acknowledgeAlertById(
  id: string,
  accessToken: string
): Promise<Alert> {
  void accessToken;
  return acknowledgeAlert(id);
}

export async function resolveAlertById(
  id: string,
  accessToken: string
): Promise<Alert> {
  void accessToken;
  return resolveAlert(id);
}

// Re-export for convenience so Monitoring.tsx named imports work
export { acknowledgeAlertById as acknowledgeAlert, resolveAlertById as resolveAlert };
