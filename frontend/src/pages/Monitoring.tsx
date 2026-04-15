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

    const socket = getSocket(accessToken); // establishes Socket.io connection for real-time updates

    socket.on('alert:new', (alert: Alert) => {
      setAlerts((prev) => [alert, ...prev]);
    });

    socket.on('alert:updated', (alert: Alert) => {
      updateAlert(alert.id, alert);
    });

    socket.on('health:updated', (health: SystemHealth) => {
      setSystemHealth(health);
    });

    socketCleanupRef.current = () => {
      socket.off('alert:new');
      socket.off('alert:updated');
      socket.off('health:updated');
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

  return (
    <div className="monitoring-page">
      <header className="monitoring-header">
        <h1>System Monitoring</h1>
        <button onClick={handleRefresh} disabled={loadingAlerts || loadingHealth}>
          {loadingAlerts || loadingHealth ? 'Refreshing...' : 'Refresh'}
        </button>
      </header>

      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <section className="health-summary">
        <h2>System Health</h2>
        {systemHealth ? (
          <div className="health-grid">
            <div className="health-card">
              <span>Status</span>
              <strong className={`status-${systemHealth.status}`}>
                {systemHealth.status}
              </strong>
            </div>
            <div className="health-card">
              <span>Uptime</span>
              <strong>{systemHealth.uptime}</strong>
            </div>
            <div className="health-card">
              <span>CPU</span>
              <strong>{systemHealth.cpu}%</strong>
            </div>
            <div className="health-card">
              <span>Memory</span>
              <strong>{systemHealth.memory}%</strong>
            </div>
          </div>
        ) : (
          <p>{loadingHealth ? 'Loading health data...' : 'No health data available.'}</p>
        )}
      </section>

      <section className="alerts-section">
        <h2>
          Alerts
          <span className="badge active">{activeCount} active</span>
          {criticalCount > 0 && (
            <span className="badge critical">{criticalCount} critical</span>
          )}
        </h2>

        {loadingAlerts && alerts.length === 0 ? (
          <p>Loading alerts...</p>
        ) : alerts.length === 0 ? (
          <p>No alerts found.</p>
        ) : (
          <ul className="alerts-list">
            {alerts.map((alert) => (
              <li
                key={alert.id}
                className={`alert-item severity-${alert.severity} status-${alert.status}`}
              >
                <div className="alert-info">
                  <strong>{alert.title}</strong>
                  <p>{alert.message}</p>
                  <small>
                    {alert.severity.toUpperCase()} &bull; {alert.status} &bull;{' '}
                    {new Date(alert.createdAt).toLocaleString()}
                  </small>
                </div>
                <div className="alert-actions">
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
