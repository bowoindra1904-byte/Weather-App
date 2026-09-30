/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CurrentWeather } from '../types/weather';
import { AlertTriangle, CheckCircle2, Wind, CloudRain, Zap, Droplets, Info } from 'lucide-react';

interface WeatherAlertBannerProps {
  current: CurrentWeather;
}

export const WeatherAlertBanner: React.FC<WeatherAlertBannerProps> = ({ current }) => {
  const alerts: { title: string; desc: string; type: 'danger' | 'warning' | 'info'; icon: React.ReactNode }[] = [];

  // 1. Thunderstorm Alert
  if ([95, 96, 99].includes(current.weatherCode)) {
    alerts.push({
      title: 'Peringatan Badai Petir Atmosfer Aktif',
      desc: 'Terdeteksi muatan listrik awan kumulonimbus dan potensi sambaran kilat. Hindari berada di ruang terbuka atau di bawah pohon rindang.',
      type: 'danger',
      icon: <Zap className="w-5 h-5 text-amber-400 shrink-0" />,
    });
  }

  // 2. Heavy Rain Alert
  if (current.precipitation >= 10 || [65, 82].includes(current.weatherCode)) {
    alerts.push({
      title: 'Peringatan Curah Hujan Deras',
      desc: `Intensitas presipitasi mencapai ${current.precipitation} mm/jam. Waspadai genangan air, jalan licin, dan penurunan jarak pandang berkendara.`,
      type: 'warning',
      icon: <CloudRain className="w-5 h-5 text-blue-400 shrink-0" />,
    });
  }

  // 3. High Wind Alert
  if (current.windSpeed >= 38 || current.windGusts >= 50) {
    alerts.push({
      title: 'Peringatan Hembusan Angin Kencang',
      desc: `Kecepatan angin terukur ${current.windSpeed} km/jam dengan hembusan puncak ${current.windGusts} km/jam. Kurangi kecepatan saat berkendara dan waspadai benda beterbangan.`,
      type: 'warning',
      icon: <Wind className="w-5 h-5 text-cyan-400 shrink-0" />,
    });
  }

  // 4. Oppressive Humidity / Heat Index Alert
  if (current.relativeHumidity >= 88 && current.temperature >= 30) {
    alerts.push({
      title: 'Kondisi Kelembapan Ekstrem & Udara Jenuh',
      desc: `Kelembapan ${current.relativeHumidity}% RH pada suhu ${current.temperature}°C menimbulkan beban panas dan rasa gerah tinggi. Perbanyak asupan cairan tubuh.`,
      type: 'info',
      icon: <Droplets className="w-5 h-5 text-teal-400 shrink-0" />,
    });
  }

  if (alerts.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/50 backdrop-blur-md flex items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <h4 className="text-xs font-semibold text-emerald-300 font-display">
              KONDISI ATMOSFER STABIL & AMAN
            </h4>
            <p className="text-xs text-slate-300">
              Tidak terdeteksi anomali cuaca ekstrem. Kecepatan angin, kelembapan udara, dan massa awan berada pada batas normal untuk aktivitas luar ruangan.
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80 shrink-0 hidden sm:inline-block">
          STATUS: NORMAL
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert, i) => {
        const borderBg =
          alert.type === 'danger'
            ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
            : alert.type === 'warning'
            ? 'bg-amber-950/40 border-amber-800/60 text-amber-200'
            : 'bg-teal-950/40 border-teal-800/60 text-teal-200';

        return (
          <div
            key={i}
            className={`p-4 rounded-2xl border backdrop-blur-md flex items-start gap-3 shadow-lg ${borderBg}`}
          >
            {alert.icon}
            <div className="grow">
              <h4 className="text-xs font-semibold font-display tracking-wide">{alert.title}</h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{alert.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
