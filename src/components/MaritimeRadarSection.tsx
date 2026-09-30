/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CurrentWeather, WeatherLocation } from '../types/weather';
import { calculateMaritimeWeather } from '../services/maritimeWeather';
import {
  Anchor,
  Ship,
  Waves,
  Navigation,
  Compass,
  Plane,
  Sprout,
  ShieldAlert,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface MaritimeRadarSectionProps {
  current: CurrentWeather;
  location: WeatherLocation;
}

export const MaritimeRadarSection: React.FC<MaritimeRadarSectionProps> = ({ current, location }) => {
  const maritime = calculateMaritimeWeather(current, location);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-950/80 text-cyan-400 border border-cyan-700/60 shadow-lg">
            <Anchor className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-display tracking-wide flex items-center gap-2">
              RADAR MARITIM & PELAYARAN SELAT BANGKA
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-800">
                LIVE COASTAL RADAR
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Analisis tinggi gelombang, keselamatan penyeberangan kapal ferry Tanjung Kalian, & pasang surut laut
            </p>
          </div>
        </div>

        {/* Ferry Tanjung Kalian Crossing Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">Status Pelabuhan Tanjung Kalian:</span>
          <span className={`px-3 py-1 rounded-xl text-xs font-bold border shadow-sm ${maritime.ferryStatusColor}`}>
            {maritime.ferryStatus}
          </span>
        </div>
      </div>

      {/* Main Grid: Wave Gauge, Ferry Simulator, Tide & Agriculture */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Wave Height Meter */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 font-display">
              <Waves className="w-4 h-4 text-cyan-400" /> TINGGI GELOMBANG SIGNIFIKAN
            </span>
            <span className={`text-xs font-bold font-mono ${maritime.waveCategoryColor}`}>
              Kategori: {maritime.waveCategory}
            </span>
          </div>

          {/* Big Metric Display */}
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold font-mono text-cyan-300 tabular-nums">
              {maritime.waveHeightMeters}
            </span>
            <span className="text-xl font-medium text-slate-400">Meter</span>
          </div>

          {/* Animated Water Surface Level Bar */}
          <div className="space-y-1.5">
            <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden p-0.5 border border-slate-800 relative">
              <div
                className="bg-gradient-to-r from-teal-400 via-cyan-400 to-amber-500 h-full rounded-full transition-all duration-700 relative overflow-hidden"
                style={{ width: `${Math.min(100, (maritime.waveHeightMeters / 3.5) * 100)}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.2m (Tenang)</span>
              <span>1.25m (Sedang)</span>
              <span>3.5m+ (Ekstrem)</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 flex items-center justify-between">
            <span>Suhu Permukaan Laut (SST):</span>
            <span className="font-mono text-cyan-300 font-bold">{maritime.seaSurfaceTemp}°C</span>
          </div>
        </div>

        {/* 2. Tidal Cycle & Selat Bangka Currents */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 font-display">
              <Compass className="w-4 h-4 text-teal-400" /> PASANG SURUT SELAT BANGKA
            </span>
            <span className="text-xs font-mono text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800/50">
              {maritime.tideHeightMeters} Meter
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400">Fase Arus Saat Ini:</span>
            <h4 className="text-base font-bold text-slate-100 font-display mt-0.5">
              {maritime.tidePhase}
            </h4>
          </div>

          <div className="space-y-1.5 text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-teal-400" /> Puncak Pasang:
              </span>
              <span className="font-mono text-slate-200">{maritime.highTideTime}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-800 pt-1">
              <span className="flex items-center gap-1 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Puncak Surut:
              </span>
              <span className="font-mono text-slate-200">{maritime.lowTideTime}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-snug">
            Kondisi arus pasang surut normal untuk pergerakan kapal penyeberangan di alur sempit Selat Bangka.
          </p>
        </div>

        {/* 3. Drone Flight & Agriculture Index */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 font-display">
              <Plane className="w-4 h-4 text-blue-400" /> SURVEI UDARA & DRONE
            </span>
            <span className={`text-xs font-bold font-mono ${maritime.droneColor}`}>
              {maritime.droneFlightSafety}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Kecepatan Angin Puncak:</span>
              <span className="font-mono font-bold text-slate-200">{current.windGusts} km/jam</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-1">
                  <Sprout className="w-3.5 h-3.5 text-emerald-400" /> Evapotranspirasi Lahan:
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  {maritime.evapotranspirationMm} mm/hari
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-snug">
                Indikator laju kehilangan air tanah untuk perkebunan kelapa sawit & lada Bangka Barat.
              </p>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 flex items-center justify-between">
            <span>Visibilitas Horizontal:</span>
            <span className="font-mono text-cyan-300 font-bold">10.0 Km (Optimal)</span>
          </div>
        </div>
      </div>

      {/* Fishermen & Maritime Advisory Text Banner */}
      <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
        <Ship className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
        <div className="text-xs space-y-0.5">
          <span className="font-bold text-slate-200">
            Panduan Navigasi Nelayan & Pelayaran Selat Bangka:
          </span>
          <p className="text-slate-300 leading-relaxed">{maritime.fishermenAdvisory}</p>
        </div>
      </div>
    </div>
  );
};
