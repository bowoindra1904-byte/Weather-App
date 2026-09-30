/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DailyForecastItem } from '../types/weather';
import { getWeatherCondition, getWindDirectionCardinal } from '../services/weatherApi';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  Calendar,
  Droplets,
  Wind
} from 'lucide-react';

interface DailyForecastProps {
  daily: DailyForecastItem[];
}

export const DailyForecast: React.FC<DailyForecastProps> = ({ daily }) => {
  const getIcon = (code: number, className = 'w-5 h-5') => {
    const cond = getWeatherCondition(code);
    switch (cond.iconName) {
      case 'Sun':
      case 'SunDim':
        return <Sun className={`${className} text-amber-400`} />;
      case 'CloudSun':
        return <CloudSun className={`${className} text-amber-300`} />;
      case 'CloudRain':
      case 'CloudRainWind':
        return <CloudRain className={`${className} text-cyan-400`} />;
      case 'CloudLightning':
        return <CloudLightning className={`${className} text-amber-400`} />;
      case 'CloudDrizzle':
        return <CloudDrizzle className={`${className} text-teal-400`} />;
      case 'CloudFog':
        return <CloudFog className={`${className} text-slate-400`} />;
      default:
        return <Cloud className={`${className} text-slate-300`} />;
    }
  };

  const formatDayName = (dateStr: string, index: number) => {
    if (index === 0) return 'Hari Ini';
    if (index === 1) return 'Besok';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { weekday: 'long' });
  };

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 backdrop-blur-md shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80 mb-3">
        <div className="p-2 rounded-lg bg-emerald-950/70 text-emerald-400 border border-emerald-800/50">
          <Calendar className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-100 font-display tracking-wide">
            PRAKIRAAN 7 HARI MENDATANG
          </h3>
          <p className="text-xs text-slate-400">Prediksi cuaca, curah hujan harian, & kecepatan angin</p>
        </div>
      </div>

      {/* Daily Rows */}
      <div className="divide-y divide-slate-800/60">
        {daily.map((item, index) => {
          const condition = getWeatherCondition(item.weatherCode);
          const cardinal = getWindDirectionCardinal(item.windDirectionDominant);

          return (
            <div
              key={item.date}
              className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-2 hover:bg-slate-800/30 px-2 rounded-xl transition-colors"
            >
              {/* Day & Date */}
              <div className="flex items-center gap-3 w-40 shrink-0">
                {getIcon(item.weatherCode)}
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    {formatDayName(item.date, index)}
                  </span>
                  <span className="text-[11px] text-slate-400">{formatDateShort(item.date)}</span>
                </div>
              </div>

              {/* Condition Label */}
              <div className="text-xs text-slate-300 md:w-44 shrink-0">
                <span>{condition.label}</span>
              </div>

              {/* Rain Probability & Sum */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400 md:w-32 shrink-0">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-mono text-slate-300">{item.precipitationProbabilityMax}%</span>
                {item.precipitationSum > 0 && (
                  <span className="text-[10px] text-indigo-300 font-mono">
                    ({item.precipitationSum} mm)
                  </span>
                )}
              </div>

              {/* Wind Speed Max */}
              <div className="flex items-center gap-1 text-xs text-slate-400 md:w-28 shrink-0">
                <Wind className="w-3.5 h-3.5 text-teal-400" />
                <span className="font-mono text-slate-200">{item.windSpeedMax} km/j</span>
                <span className="text-[10px] text-slate-400 font-mono">({cardinal.short})</span>
              </div>

              {/* Temperature Bar */}
              <div className="flex items-center gap-2 grow max-w-xs">
                <span className="text-xs font-mono text-slate-400 tabular-nums w-8 text-right">
                  {item.temperatureMin}°
                </span>
                <div className="grow bg-slate-800 h-2 rounded-full overflow-hidden relative">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-amber-400"
                    style={{
                      marginLeft: `${Math.max(0, (item.temperatureMin - 15) * 4)}%`,
                      width: `${Math.max(20, (item.temperatureMax - item.temperatureMin) * 7)}%`,
                    }}
                  />
                </div>
                <span className="text-xs font-mono text-slate-200 font-semibold tabular-nums w-8">
                  {item.temperatureMax}°
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
