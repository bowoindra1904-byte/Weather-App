/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CurrentWeather, HourlyForecastItem } from '../types/weather';
import { Cloud, CloudRain, Eye, Radar } from 'lucide-react';

interface CloudRainRadarProps {
  current: CurrentWeather;
  currentHourly?: HourlyForecastItem;
}

export const CloudRainRadar: React.FC<CloudRainRadarProps> = ({ current, currentHourly }) => {
  const lowCloud = currentHourly?.cloudCoverLow ?? Math.round(current.cloudCover * 0.4);
  const midCloud = currentHourly?.cloudCoverMid ?? Math.round(current.cloudCover * 0.35);
  const highCloud = currentHourly?.cloudCoverHigh ?? Math.round(current.cloudCover * 0.25);
  const visibilityKm = currentHourly?.visibility ? Math.round((currentHourly.visibility / 1000) * 10) / 10 : 10;
  const rainProb = currentHourly?.precipitationProbability ?? (current.precipitation > 0 ? 90 : 15);

  let rainIntensityLabel = 'Tanpa Presipitasi';
  let rainBadgeColor = 'text-slate-400 bg-slate-900 border-slate-800';

  if (current.precipitation > 15) {
    rainIntensityLabel = 'Hujan Sangat Lebat';
    rainBadgeColor = 'text-rose-400 bg-rose-950/80 border-rose-800';
  } else if (current.precipitation > 5) {
    rainIntensityLabel = 'Hujan Sedang / Lebat';
    rainBadgeColor = 'text-amber-400 bg-amber-950/80 border-amber-800';
  } else if (current.precipitation > 0.5) {
    rainIntensityLabel = 'Hujan Ringan Teratur';
    rainBadgeColor = 'text-cyan-400 bg-cyan-950/80 border-cyan-800';
  } else if (current.precipitation > 0) {
    rainIntensityLabel = 'Gerimis Rintik Halus';
    rainBadgeColor = 'text-teal-400 bg-teal-950/80 border-teal-800';
  }

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-950/70 text-blue-400 border border-blue-800/50">
            <CloudRain className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 font-display tracking-wide">
              MASSA AWAN & RADAR HUJAN
            </h3>
            <p className="text-xs text-slate-400">Stratifikasi awan & intensitas presipitasi</p>
          </div>
        </div>

        <div className="text-right">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${rainBadgeColor}`}>
            {rainIntensityLabel}
          </span>
        </div>
      </div>

      {/* Main Stats: Cloud & Rain */}
      <div className="my-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Radar Graphic Simulation */}
        <div className="relative flex items-center justify-center p-2">
          <div className="relative w-36 h-36 rounded-full border border-slate-700 bg-slate-950/90 overflow-hidden flex items-center justify-center shadow-inner">
            {/* Radar concentric rings */}
            <div className="absolute w-28 h-28 rounded-full border border-slate-800" />
            <div className="absolute w-18 h-18 rounded-full border border-slate-800/80" />
            <div className="absolute w-8 h-8 rounded-full border border-slate-800/60" />
            <div className="absolute w-full h-[1px] bg-slate-800" />
            <div className="absolute h-full w-[1px] bg-slate-800" />

            {/* Radar simulated echo blooms (precipitation mass) */}
            {current.precipitation > 0 && (
              <div
                className="absolute w-16 h-16 rounded-full bg-blue-500/30 blur-md pointer-events-none animate-pulse"
                style={{
                  top: '25%',
                  left: '30%',
                  background:
                    current.precipitation > 5
                      ? 'radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, rgba(59, 130, 246, 0.3) 70%, transparent 100%)'
                      : 'radial-gradient(circle, rgba(56, 189, 248, 0.4) 0%, transparent 80%)',
                }}
              />
            )}

            {/* Radar beam sweep */}
            <div
              className="absolute inset-0 origin-center animate-radar-sweep pointer-events-none"
              style={{
                background:
                  'conic-gradient(from 0deg, transparent 0deg, transparent 300deg, rgba(56, 189, 248, 0.25) 360deg)',
              }}
            />

            {/* Center dot */}
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,1)] z-10" />

            {/* Live indicator badge */}
            <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[9px] font-mono text-cyan-400">
              <Radar className="w-2.5 h-2.5 animate-spin" /> LIVE
            </div>
          </div>
        </div>

        {/* Rain rate & Cloud coverage metrics */}
        <div className="space-y-3">
          <div>
            <span className="text-xs text-slate-400">Curah Hujan Saat Ini</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tabular-nums text-indigo-300">
                {current.precipitation}
              </span>
              <span className="text-sm font-medium text-slate-400">mm/jam</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>Peluang Hujan:</span>
              <span className="font-mono text-cyan-300 font-semibold">{rainProb}%</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Total Tutupan Awan</span>
              <span className="font-mono text-slate-200 font-semibold">{current.cloudCover}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
              <div
                className="bg-blue-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${current.cloudCover}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Layers Stratification */}
      <div className="border-t border-slate-800/80 pt-3 space-y-2">
        <span className="text-[11px] font-medium text-slate-400 tracking-wide">
          Stratifikasi Lapisan Awan:
        </span>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Rendah (&lt;2km)</span>
            <span className="font-mono font-semibold text-slate-200 tabular-nums">{lowCloud}%</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Menengah (2-6km)</span>
            <span className="font-mono font-semibold text-slate-200 tabular-nums">{midCloud}%</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Tinggi (&gt;6km)</span>
            <span className="font-mono font-semibold text-slate-200 tabular-nums">{highCloud}%</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-slate-400" /> Jarak Pandang Atmosfer:
          </span>
          <span className="font-mono text-slate-200 font-medium">{visibilityKm} km</span>
        </div>
      </div>
    </div>
  );
};
