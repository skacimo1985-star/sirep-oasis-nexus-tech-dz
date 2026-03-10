import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Sensor } from '@/store/dataStore';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SensorChartProps {
  sensor: Sensor;
  maxPoints?: number;
  height?: number;
  showLegend?: boolean;
  compact?: boolean;
}

const OASIS_COLORS = [
  { line: '#15803d', fill: 'rgba(21,128,61,0.08)' },
  { line: '#ca8a04', fill: 'rgba(202,138,4,0.08)' },
  { line: '#0284c7', fill: 'rgba(2,132,199,0.08)' },
  { line: '#7c3aed', fill: 'rgba(124,58,237,0.08)' },
];

export default function SensorChart({
  sensor,
  maxPoints  = 50,
  height     = 240,
  showLegend = false,
  compact    = false,
}: SensorChartProps) {
  const readings = useMemo(
    () => sensor.readings.slice(-maxPoints),
    [sensor.readings, maxPoints]
  );

  const labels = useMemo(
    () =>
      readings.map((r) => {
        try {
          return format(parseISO(r.timestamp), compact ? 'HH:mm' : 'HH:mm:ss', {
            locale: fr,
          });
        } catch {
          return r.timestamp;
        }
      }),
    [readings, compact]
  );

  const color = OASIS_COLORS[0];

  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: `${sensor.name} (${readings[0]?.unit ?? ''})`,
          data: readings.map((r) => r.value),
          borderColor: color.line,
          backgroundColor: color.fill,
          borderWidth: 2,
          pointRadius: compact ? 0 : 3,
          pointHoverRadius: 5,
          tension: 0.4,
          fill: true,
        },
      ],
    }),
    [labels, sensor.name, readings, color, compact]
  );

  const options: ChartOptions<'line'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300 },
      plugins: {
        legend: {
          display: showLegend,
          position: 'top' as const,
          labels: { boxWidth: 12, font: { size: 11 } },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(15,23,42,0.9)',
          titleFont: { size: 11 },
          bodyFont:  { size: 11 },
          callbacks: {
            label: (ctx) =>
              ` ${ctx.parsed.y?.toFixed(2)} ${readings[0]?.unit ?? ''}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font:       { size: 10 },
            color:      '#94a3b8',
            maxTicksLimit: compact ? 5 : 10,
          },
        },
        y: {
          grid: { color: '#f1f5f9' },
          ticks: {
            font:  { size: 10 },
            color: '#94a3b8',
            callback: (v) => `${v} ${readings[0]?.unit ?? ''}`,
          },
        },
      },
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
    }),
    [readings, showLegend, compact]
  );

  if (readings.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-slate-400 text-sm rounded-lg bg-slate-50"
        style={{ height }}
      >
        Aucune donnée disponible / لا توجد بيانات
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <Line data={data} options={options} />
    </div>
  );
}
