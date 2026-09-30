/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HourlyForecastItem } from '../types/weather';
import { getWeatherCondition, getWindDirectionCardinal } from '../services/weatherApi';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  Wind,
  Droplets,
  RotateCcw,
  Clock,
  PlayCircle
} from 'lucide-react';

interface HourlyTimelineProps {
  hourly: HourlyForecastItem[];
  activeHourIndex: number | null;
  onSelectHour: (index: number | null) => void;
}

export const HourlyTimeline: React.FC<HourlyTimelineProps> = ({
  hourly,
  activeHourIndex,
  onSelectHour,
}) => {
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

  const formatHour = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 backdrop-blur-md shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-950/70 text-indigo-400 border border-indigo-800/50">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 font-display tracking-wide">
              PRAKIRAAN 24 JAM & SIMULASI WAKTU
            </h3>
            <p className="text-xs text-slate-400">
              Pilih jam untuk mensimulasikan pergerakan angin & awan pada kanvas 3D
            </p>
          </div>
        </div>

        {activeHourIndex !== null && (
          <button
            onClick={() => onSelectHour(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 hover:bg-cyan-900/80 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Kembali ke Waktu Nyata (Live)</span>
          </button>
        )}
      </div>

      {/* Horizontal Scroll Track */}
      <div className="flex gap-2.5 overflow-x-auto py-4 scroll-smooth">
        {hourly.map((item, idx) => {
          const isSelected = activeHourIndex === idx;
          const isCurrent = idx === 0 && activeHourIndex === null;
          const cardinal = getWindDirectionCardinal(item.windDirection);

          return (
            <button
              key={item.time}
              onClick={() => onSelectHour(idx)}
              className={`shrink-0 w-28 p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-cyan-950/80 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400'
                  : isCurrent
                  ? 'bg-slate-950/80 border-slate-700 hover:border-slate-600'
                  : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              {/* Hour & Live Badge */}
              <div className="flex items-center justify-between text-xs">
                <span className={`font-mono font-medium ${isSelected ? 'text-cyan-300' : 'text-slate-300'}`}>
                  {formatHour(item.time)}
                </span>
                {idx === 0 && (
                  <span className="text-[9px] font-semibold text-cyan-400 bg-cyan-950 px-1 rounded border border-cyan-800">
                    KINI
                  </span>
                )}
              </div>

              {/* Weather Icon & Temp */}
              <div className="my-2 flex items-center justify-between">
                {getIcon(item.weatherCode)}
                <span className="text-base font-bold font-mono text-slate-100 tabular-nums">
                  {item.temperature}°
                </span>
              </div>

              {/* Rain Probability / Precip */}
              <div className="text-[11px] text-slate-400 flex items-center gap-1 mb-1.5">
                <Droplets className="w-3 h-3 text-cyan-400" />
                <span className="font-mono text-slate-300">{item.precipitationProbability}%</span>
                {item.precipitation > 0 && (
                  <span className="text-[10px] text-indigo-300 font-mono">({item.precipitation}mm)</span>
                )}
              </div>

              {/* Wind Speed & Direction */}
              <div className="text-[11px] text-slate-400 flex items-center gap-1 pt-1.5 border-t border-slate-800/80">
                <Wind className="w-3 h-3 text-teal-400" />
                <span className="font-mono text-slate-200 font-medium">{item.windSpeed}</span>
                <span className="text-[10px] text-slate-400">km/j</span>
                <span
                  className="inline-block text-[10px] text-cyan-400 transition-transform font-mono ml-auto"
                  title={`Arah ${cardinal.full} (${item.windDirection}°)`}
                >
                  {cardinal.short}
                </span>
              </div>

              {/* Simulation prompt banner on active */}
              {isSelected && (
                <div className="mt-2 text-[9px] font-semibold text-cyan-300 bg-cyan-900/60 py-0.5 px-1 rounded text-center border border-cyan-700/50">
                  Simulasi 3D Aktif
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
