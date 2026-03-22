import { Bell, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useDataStore, selectActiveAlerts, selectCriticalAlerts } from '@/store/dataStore';
import clsx from 'clsx';

export default function Topbar() {
  const { user } = useAuthStore();
  const activeAlerts   = useDataStore(selectActiveAlerts);
  const criticalAlerts = useDataStore(selectCriticalAlerts);
  const navigate       = useNavigate();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showAlertsBadge, setShowAlertsBadge] = useState(false);

  useEffect(() => {
    const tick = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const onOnline  = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    setShowAlertsBadge(criticalAlerts.length > 0);
  }, [criticalAlerts.length]);

  const formattedTime = currentTime.toLocaleTimeString('fr-DZ', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const formattedDate = currentTime.toLocaleDateString('fr-DZ', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      {/* Left: greeting */}
      <div>
        <h1 className="text-base font-semibold text-slate-800">
          Bonjour, {user?.name ?? 'Utilisateur'}&nbsp;👋
        </h1>
        <p className="text-xs text-slate-400">
          {formattedDate} · {formattedTime}
        </p>
      </div>

      {/* Right: status indicators + actions */}
      <div className="flex items-center gap-3">
        {/* Online indicator */}
        <div
          className={clsx(
            'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
            isOnline
              ? 'bg-oasis-50 text-oasis-700'
              : 'bg-red-50 text-red-600'
          )}
          title={isOnline ? 'Connecté' : 'Hors ligne'}
        >
          {isOnline ? (
            <Wifi className="w-3.5 h-3.5" />
          ) : (
            <WifiOff className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </span>
        </div>

        {/* Refresh indicator */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-500">
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Temps réel</span>
        </div>

        {/* Alerts bell */}
        <button
          onClick={() => navigate('/monitoring')}
          className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
          title={`${activeAlerts.length} alertes actives`}
          aria-label="Alertes"
        >
          <Bell
            className={clsx(
              'w-5 h-5',
              showAlertsBadge ? 'text-red-500 animate-pulse-slow' : 'text-slate-500'
            )}
          />
          {activeAlerts.length > 0 && (
            <span
              className={clsx(
                'absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center',
                'rounded-full text-[10px] font-bold text-white px-1',
                criticalAlerts.length > 0 ? 'bg-red-500' : 'bg-sand-500'
              )}
            >
              {activeAlerts.length > 99 ? '99+' : activeAlerts.length}
            </span>
          )}
        </button>

        {/* User avatar */}
        <div className="w-9 h-9 rounded-full oasis-gradient flex items-center justify-center text-white font-semibold text-sm">
          {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
        </div>
      </div>
    </header>
  );
}
