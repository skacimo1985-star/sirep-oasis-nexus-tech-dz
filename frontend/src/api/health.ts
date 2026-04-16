// Thin wrapper over monitoring.service — lets Monitoring.tsx import from '../api/health'
import { fetchSystemHealth } from '@/services/monitoring.service';
import type { SystemHealth } from '@/store/dataStore';

export async function getSystemHealth(
  accessToken: string
): Promise<SystemHealth> {
  void accessToken; // token injected via axios interceptor in api.ts
  return fetchSystemHealth();
}
