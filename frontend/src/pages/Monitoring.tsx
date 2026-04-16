import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAlerts, acknowledgeAlert, resolveAlert } from '../api/alerts';
import { getSystemHealth } from '../api/health';
import { getSocket } from '../utils/socket';
import type { Alert, SystemHealth } from '../types';

const Monitoring: React.FC = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketCleanupRef = useRef<(() => void) | null>(null);

  const updateAlert = useCallback(
    (id: string, updated: Alert) => {
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updated } : a))
      );
    },
    []
  );

  const loadAlerts = useCallback(async () => {
    if (!accessToken) return;
    setLoadingAlerts(true);
    try {
      const data = await getAlerts(accessToken);
      setAlerts(data);
    } catch (err) {
      setError('Failed to load alerts');
    } finally {
      setLoadingAlerts(false);
    }
  }, [accessToken]);

  const loadHealth = useCallback(async () => {
    if (!accessToken) return;
    setLoadingHealth(true);
    try {
      const data = await getSystemHealth(accessToken);
      setSystemHealth(data);
    } catch (err) {
      setError('Failed to load system health');
    } finally {
      setLoadingHealth(false);
    }
  }, [accessToken]);

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
    }, 30000);
    return () => clearInterval(interval);
  }, [accessToken, loadAlerts, loadHealth]);

  /* Socket.io real-time updates */
  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket(accessToken);
    socket.on('alert:new', (alert: Alert) => {
      setAlerts((prev) => [alert, ...prev]);
    });
    socket.on('alert:updated', (alert: Alert) => {
      updateAlert(alert.id, alert);
    });
    socket.on('health:update', (health: SystemHealth) => {
      setSystemHealth(health);
    });
    socketCleanupRef.current = () => {
      socket.off('alert:new');
      socket.off('alert:updated');
      socket.off('health:update');
    };
    return () => {
      socketCleanupRef.current?.();
    };
  }, [accessToken, updateAlert]);

  async function handleAcknowledge(id: string) {
    if (!accessToken) return;
    try {
      const updated = await acknowledgeAlert(id, accessToken);
      updateAlert(id, updated);
    } catch {
      setError('Failed to acknowledge alert');
    }
  }

  async function handleResolve(id: string) {
    if (!accessToken) return;
    try {
      const updated = await resolveAlert(id, accessToken);
      updateAlert(id, updated);
    } catch {
      setError('Failed to resolve alert');
    }
  }

  const activeCount = alerts.filter((a) => a.status === 'active').length;
  const criticalCount = alerts.filter(
    (a) => a.severity === 'critical' && a.status === 'active'
  ).length;

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div>
      <h1>System Monitoring</h1>
      <button onClick={handleRefresh} disabled={loadingAlerts || loadingHealth}>
        {loadingAlerts || loadingHealth ? 'Refreshing...' : 'Refresh'}
      </button>

      {error && (
        <div role="alert">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <section>
        <h2>System Health</h2>
        {systemHealth ? (
          <ul>
            <li>CPU: <strong>{systemHealth.cpuUsage.toFixed(1)}%</strong></li>
            <li>Memory: <strong>{systemHealth.memoryUsage.toFixed(1)}%</strong></li>
            <li>Disk: <strong>{systemHealth.diskUsage.toFixed(1)}%</strong></li>
            <li>Uptime: <strong>{formatUptime(systemHealth.uptime)}</strong></li>
            <li>API Latency: <strong>{systemHealth.apiLatency}ms</strong></li>
          </ul>
        ) : (
          <p>{loadingHealth ? 'Loading health data...' : 'No health data available.'}</p>
        )}
      </section>

      <section>
        <h2>
          Alerts
          <span> {activeCount} active</span>
          {criticalCount > 0 && <span> {criticalCount} critical</span>}
        </h2>

        {loadingAlerts && alerts.length === 0 ? (
          <p>Loading alerts...</p>
        ) : alerts.length === 0 ? (
          <p>No alerts found.</p>
        ) : (
          <ul>
            {alerts.map((alert) => (
              <li key={alert.id}>
                <strong>{alert.title}</strong>
                <p>{alert.message}</p>
                <small>
                  {alert.severity.toUpperCase()} &bull; {alert.status} &bull;{' '}
                  {new Date(alert.createdAt).toLocaleString()}
                </small>
                <div>
                  {alert.status === 'active' && (
                    <button onClick={() => void handleAcknowledge(alert.id)}>
                      Acknowledge
                    </button>
                  )}
                  {alert.status !== 'resolved' && (
                    <button onClick={() => void handleResolve(alert.id)}>
                      Resolve
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Monitoring;
