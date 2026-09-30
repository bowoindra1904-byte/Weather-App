/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CurrentWeather } from '../types/weather';
import { getBeaufortScale, getWindDirectionCardinal } from '../services/weatherApi';
import { Wind, Navigation, Gauge, ShieldAlert } from 'lucide-react';

interface WindGaugeProps {
  current: CurrentWeather;
}

export const WindGauge: React.FC<WindGaugeProps> = ({ current }) => {
  const cardinal = getWindDirectionCardinal(current.windDirection);
  const beaufort = getBeaufortScale(current.windSpeed);
  const speedMs = Math.round((current.windSpeed / 3.6) * 10) / 10;
  const speedKnots = Math.round((current.windSpeed * 0.539957) * 10) / 10;

  // Opposite cardinal (direction the wind is blowing towards)
  const oppositeCardinal = getWindDirectionCardinal((current.windDirection + 180) % 360);

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-950/70 text-cyan-400 border border-cyan-800/50">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 font-display tracking-wide">
              DINAMIKA ANGIN REAL-TIME
            </h3>
            <p className="text-xs text-slate-400">Vektor arah, kecepatan, & hembusan</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono text-cyan-400 font-semibold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
            {cardinal.short} · {current.windDirection}°
          </span>
        </div>
      </div>

      {/* Main Content: Compass Rose & Metric Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 items-center">
        {/* Animated Compass Rose */}
        <div className="relative flex items-center justify-center p-2">
          <div className="relative w-36 h-36 rounded-full border border-slate-700/80 bg-slate-950/60 flex items-center justify-center shadow-inner">
            {/* Cardinal Markers */}
            <span className="absolute top-1.5 text-[10px] font-bold text-cyan-400 font-mono">U</span>
            <span className="absolute bottom-1.5 text-[10px] font-bold text-slate-400 font-mono">S</span>
            <span className="absolute right-2 text-[10px] font-bold text-slate-400 font-mono">T</span>
            <span className="absolute left-2 text-[10px] font-bold text-slate-400 font-mono">B</span>

            {/* Inner Ring with Tick marks */}
            <div className="w-24 h-24 rounded-full border border-dashed border-slate-700/60 flex items-center justify-center">
              {/* Central Pivot Hub */}
              <div className="w-6 h-6 rounded-full bg-slate-900 border border-cyan-500/50 flex items-center justify-center shadow-md z-10">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              </div>
            </div>

            {/* Animated Needle pointing towards wind direction */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-transform duration-700 ease-out"
              style={{ transform: `rotate(${current.windDirection}deg)` }}
            >
              <div className="flex flex-col items-center h-full justify-between py-2 pointer-events-none">
                {/* Arrow Head (North tip) */}
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[18px] border-b-cyan-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                {/* Tail */}
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[14px] border-t-slate-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Speed & Units Breakdown */}
        <div className="space-y-3">
          <div>
            <span className="text-xs text-slate-400">Kecepatan Angin</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tabular-nums text-slate-100">
                {current.windSpeed}
              </span>
              <span className="text-sm font-medium text-slate-400">km/jam</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-0.5">
              <span>{speedMs} m/detik</span>
              <span>·</span>
              <span>{speedKnots} knot</span>
            </div>
          </div>

          {/* Wind Gusts */}
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-amber-400" /> Hembusan Maksimum
              </span>
              <span className="font-mono font-semibold text-amber-400 tabular-nums">
                {current.windGusts} km/jam
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Beaufort Scale & Trajectory Description */}
      <div className="space-y-2 border-t border-slate-800/80 pt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Klasifikasi Skala Beaufort:</span>
          <span className={`font-semibold ${beaufort.color}`}>
            Tingkat {beaufort.scale} · {beaufort.name}
          </span>
        </div>

        {/* Beaufort Progress Bar */}
        <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-cyan-400 via-emerald-400 via-amber-400 to-rose-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (beaufort.scale / 10) * 100)}%` }}
          />
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          {beaufort.description} Angin berhembus dari arah{' '}
          <strong className="text-cyan-300 font-medium">{cardinal.full}</strong> menuju ke{' '}
          <strong className="text-slate-200 font-medium">{oppositeCardinal.full}</strong>.
        </p>
      </div>
    </div>
  );
};
