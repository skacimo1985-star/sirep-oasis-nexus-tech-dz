import { useEffect, useCallback, useRef } from 'react';
import {
  Cpu,
  RefreshCw,
  Wifi,
  WifiOff,
  ThermometerSun,
  Droplets,
  Wind,
  Sun,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useDataStore } from '@/store/dataStore';
import {
  fetchSensors,
  getSocket,
  disconnectSocket,
  onSocketEvent,
} from '@/services/monitoring.service';
import SensorChart from '@/components/Dashboard/SensorChart';
import LoadingSpinner from '@/components/Common/LoadingSpinner';
import clsx from 'clsx';

const SENSOR_ICONS: Record<string, React.ElementType> = {
  temperature: ThermometerSun,
  humidity:    Droplets,
  wind:        Wind,
  solar:       Sun,
  default:     Cpu,
};

export default function IoTMonitor() {
  const { accessToken } = useAuthStore();

  const {
    sensors,
    selectedSensorId,
    isLoadingSensors,
    sensorsError,
    setSensors,
    updateSensor,
    addSensorReading,
    setSelectedSensor,
    setLoadingSensors,
    setSensorsError,
  } = useDataStore();

  const socketCleanupRef = useRef<(() => void)[]>([]);

  const loadSensors = useCallback(async () => {
    setLoadingSensors(true);
    setSensorsError(null);
    try {
      const data = await fetchSensors();
      setSensors(data);
      if (!selectedSensorId && data.length > 0) {
        setSelectedSensor(data[0].id);
      }
    } catch {
      setSensorsError('Impossible de charger les capteurs. / تعذر تحميل المستشعرات.');
    } finally {
      setLoadingSensors(false);
    }
  }, [setLoadingSensors, setSensorsError, setSensors, setSelectedSensor, selectedSensorId]);

  /* Socket.io real-time updates */
  useEffect(() => {
    if (!accessToken) return;

                getSocket(accessToken); // establishes Socket.io connection for real-time updates

    const cleanups = [
      onSocketEvent('sensor:update', (sensor) => updateSensor(sensor.id, sensor)),
      onSocketEvent('sensor:reading', ({ sensorId, reading }) =>
        addSensorReading(sensorId, reading)
      ),
    ];
    socketCleanupRef.current = cleanups;

    return () => {
      cleanups.forEach((fn) => fn());
      disconnectSocket();
    };
  }, [accessToken, updateSensor, addSensorReading]);

  useEffect(() => {
    void loadSensors();
  }, [loadSensors]);

  const selectedSensor =
    sensors.find((s) => s.id === selectedSensorId) ?? sensors[0] ?? null;

  const onlineSensors  = sensors.filter((s) => s.status === 'online').length;
  const offlineSensors = sensors.filter((s) => s.status === 'offline').length;
  const warningSensors = sensors.filter((s) => s.status === 'warning').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Cpu className="w-6 h-6 text-oasis-600" />
            Surveillance IoT
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Capteurs connectés en temps réel ·{' '}
            <span className="arabic-inline">المستشعرات المتصلة في الوقت الفعلي</span>
          </p>
        </div>
        <button
          onClick={() => void loadSensors()}
          disabled={isLoadingSensors}
          className="btn-secondary self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingSensors ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card py-4 border-l-4 border-oasis-500 text-center">
          <p className="text-3xl font-bold text-oasis-700">{onlineSensors}</p>
          <p className="text-sm text-slate-500">En ligne</p>
          <p className="text-xs text-slate-400 arabic-inline">متصل</p>
        </div>
        <div className="card py-4 border-l-4 border-sand-400 text-center">
          <p className="text-3xl font-bold text-sand-600">{warningSensors}</p>
          <p className="text-sm text-slate-500">Avertissement</p>
          <p className="text-xs text-slate-400 arabic-inline">تحذير</p>
        </div>
        <div className="card py-4 border-l-4 border-red-400 text-center">
          <p className="text-3xl font-bold text-red-600">{offlineSensors}</p>
          <p className="text-sm text-slate-500">Hors ligne</p>
          <p className="text-xs text-slate-400 arabic-inline">غير متصل</p>
        </div>
      </div>

      {/* Error */}
      {sensorsError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {sensorsError}
        </div>
      )}

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sensor list */}
        <div className="card lg:col-span-1">
          <div className="card-header">
            <h2 className="section-title text-sm">
              Capteurs ({sensors.length})
            </h2>
          </div>

          {isLoadingSensors && sensors.length === 0 ? (
            <LoadingSpinner size="sm" label="Chargement…" />
          ) : sensors.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">
              Aucun capteur trouvé
            </p>
          ) : (
            <div className="space-y-1">
              {sensors.map((sensor) => {
                const SIcon = SENSOR_ICONS[sensor.type] ?? SENSOR_ICONS.default;
                return (
                  <button
                    key={sensor.id}
                    onClick={() => setSelectedSensor(sensor.id)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                      selectedSensorId === sensor.id
                        ? 'bg-oasis-100 text-oasis-800'
                        : 'hover:bg-slate-50 text-slate-700'
                    )}
                  >
                    <SIcon className="w-4 h-4 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{sensor.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{sensor.location}</p>
                    </div>
                    {sensor.status === 'online' ? (
                      <Wifi className="w-3 h-3 text-oasis-500 shrink-0" />
                    ) : sensor.status === 'warning' ? (
                      <Wifi className="w-3 h-3 text-sand-400 shrink-0" />
                    ) : (
                      <WifiOff className="w-3 h-3 text-red-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Chart area */}
        <div className="card lg:col-span-3">
          {selectedSensor ? (
            <>
              <div className="card-header">
                <div>
                  <h2 className="section-title flex items-center gap-2">
                    {(() => {
                      const SIcon =
                        SENSOR_ICONS[selectedSensor.type] ?? SENSOR_ICONS.default;
                      return <SIcon className="w-4 h-4 text-oasis-600" />;
                    })()}
                    {selectedSensor.name}
                    <span className="text-xs font-normal text-slate-400 arabic-inline">
                      {selectedSensor.nameAr}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    📍 {selectedSensor.location}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={clsx('badge', {
                      'badge-success': selectedSensor.status === 'online',
                      'badge-warning': selectedSensor.status === 'warning',
                      'badge-danger':  selectedSensor.status === 'offline',
                    })}
                  >
                    {selectedSensor.status === 'online'
                      ? 'En ligne'
                      : selectedSensor.status === 'warning'
                      ? 'Avertissement'
                      : 'Hors ligne'}
                  </span>
                </div>
              </div>

              {/* Last reading */}
              {selectedSensor.lastReading && (
                <div className="mb-4 p-4 rounded-xl bg-oasis-50 border border-oasis-100 flex items-center gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Dernière valeur / آخر قيمة</p>
                    <p className="text-4xl font-bold text-oasis-700 tabular-nums">
                      {selectedSensor.lastReading.value.toFixed(2)}
                      <span className="text-xl ml-1 font-normal text-oasis-500">
                        {selectedSensor.lastReading.unit}
                      </span>
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-slate-400">Type</p>
                    <p className="text-sm font-semibold text-slate-700 capitalize">
                      {selectedSensor.type}
                    </p>
                  </div>
                </div>
              )}

              <SensorChart
                sensor={selectedSensor}
                height={300}
                showLegend={false}
                maxPoints={60}
              />

              {selectedSensor.readings.length === 0 && (
                <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
                  Aucune donnée disponible pour ce capteur
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <Cpu className="w-12 h-12 text-oasis-200" />
              <p>Sélectionnez un capteur pour afficher les données</p>
              <p className="text-sm arabic-inline">اختر مستشعراً لعرض البيانات</p>
            </div>
          )}
        </div>
      </div>

      {/* ThingSpeak integration notice */}
      <div className="card border-l-4 border-dusk-500 bg-dusk-50/30">
        <div className="flex items-start gap-3">
          <Sun className="w-5 h-5 text-dusk-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-dusk-900">
              Intégration ThingSpeak
              <span className="ml-2 text-xs font-normal text-slate-400 arabic-inline">
                تكامل ثينج سبيك
              </span>
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Les données peuvent également être visualisées directement depuis ThingSpeak.
              Configurez votre Channel ID et API Key dans les paramètres.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
