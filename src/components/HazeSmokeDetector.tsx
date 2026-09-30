/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CurrentWeather, WeatherLocation } from '../types/weather';
import { calculateHazeSmokeStatus } from '../services/hazeSmokeDetector';
import { getWindDirectionCardinal } from '../services/weatherApi';
import {
  Flame,
  Wind,
  Eye,
  ShieldAlert,
  ShieldCheck,
  Compass,
  AlertTriangle,
  HeartPulse,
  Sparkles,
  Navigation,
  Activity,
  Layers,
  Info
} from 'lucide-react';

interface HazeSmokeDetectorProps {
  current: CurrentWeather;
  location: WeatherLocation;
}

export const HazeSmokeDetector: React.FC<HazeSmokeDetectorProps> = ({ current, location }) => {
  const [isDemoSmoke, setIsDemoSmoke] = useState<boolean>(false);

  const status = calculateHazeSmokeStatus(current, location, isDemoSmoke);
  const cardinal = getWindDirectionCardinal(current.windDirection);
  const headingDeg = (current.windDirection + 180) % 360;
  const headingCardinal = getWindDirectionCardinal(headingDeg);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 md:p-6 backdrop-blur-xl shadow-2xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-950/80 text-amber-400 border border-amber-700/60 shadow-lg">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-display tracking-wide flex items-center gap-2">
              PENDETEKSI KABUT ASAP & DISPERSI ANGIN
              <span className="text-[10px] font-mono text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-800">
                HAZE & SMOKE RADAR
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Deteksi partikulat asap Karhutla, jarak pandang Selat Bangka, dan vektor aliran angin
            </p>
          </div>
        </div>

        {/* Action: Demo Switch & Severity Badge */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsDemoSmoke(!isDemoSmoke)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              isDemoSmoke
                ? 'bg-amber-950 text-amber-300 border border-amber-600 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isDemoSmoke ? 'Mode Simulasi: Aktif' : 'Uji Simulasi Kabut Asap'}</span>
          </button>

          <span className={`px-3 py-1 rounded-xl text-xs font-bold border shadow-sm ${status.severityColor}`}>
            {status.severityLabel}
          </span>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Jarak Pandang (Visibility) */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Eye className="w-4 h-4 text-cyan-400" /> Jarak Pandang Horisontal
            </span>
            <span className="font-mono text-[11px] text-slate-500">Optik Atmosfer</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold font-mono text-cyan-300 tabular-nums">
              {status.visibilityKm}
            </span>
            <span className="text-xs text-slate-400 font-medium">Kilometer</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                status.visibilityKm >= 8 ? 'bg-cyan-400' : status.visibilityKm >= 4 ? 'bg-amber-400' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, (status.visibilityKm / 10) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400">
            {status.visibilityKm >= 8
              ? 'Penglihatan jernih tanpa gangguan partikulat'
              : status.visibilityKm >= 4
              ? 'Sedikit terhalang partikel debu / kabut'
              : 'Jarak pandang terganggu pekat'}
          </p>
        </div>

        {/* 2. Partikulat PM2.5 & AQI */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Activity className="w-4 h-4 text-amber-400" /> Partikulat PM2.5 & AQI
            </span>
            <span className="font-mono text-[11px] text-slate-500">Kualitas Udara</span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold font-mono text-amber-300 tabular-nums">
                {status.pm25Estimate}
              </span>
              <span className="text-[10px] text-slate-400">µg/m³</span>
            </div>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200">
              AQI {status.aqiEstimate}
            </span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                status.aqiEstimate <= 50 ? 'bg-emerald-400' : status.aqiEstimate <= 100 ? 'bg-amber-400' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, (status.aqiEstimate / 200) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400">
            Kategori:{' '}
            <strong className="text-slate-200">
              {status.aqiEstimate <= 50 ? 'Baik (Sehat)' : status.aqiEstimate <= 100 ? 'Sedang' : 'Tidak Sehat'}
            </strong>
          </p>
        </div>

        {/* 3. Arah Angin & Vektor Dispersi */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Compass className="w-4 h-4 text-teal-400" /> Vektor Arah Angin
            </span>
            <span className="font-mono text-[11px] text-teal-400">{current.windSpeed} km/j</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Compass Arrow Visualizer */}
            <div
              className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center transform transition-transform duration-500"
              style={{ transform: `rotate(${current.windDirection}deg)` }}
              title={`Arah hembusan ${current.windDirection}°`}
            >
              <Navigation className="w-5 h-5 text-teal-400 fill-teal-400" />
            </div>
            <div>
              <div className="font-bold text-slate-100 text-sm font-display">
                Dari {cardinal.full} ({current.windDirection}°)
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Menuju {headingCardinal.full} ({headingDeg}°)
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1">
            Massa udara bertiup dari {cardinal.short} menuju daratan {headingCardinal.short}
          </p>
        </div>

        {/* 4. Rekomendasi Masker & Kesehatan */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <HeartPulse className="w-4 h-4 text-rose-400" /> Rekomendasi Masker
            </span>
            <span className="font-mono text-[11px] text-slate-500">Kesehatan</span>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-200 block">
              {status.maskAdvice}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Tipe Partikel: {status.type === 'asap_karhutla' ? 'Asap Pembakaran' : status.type === 'kabut_embun_radiasi' ? 'Uap Air Alami' : 'Atmosfer Bersih'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1">
            Lindungi kelompok rentan ISPA, lansia, dan balita
          </p>
        </div>
      </div>

      {/* Trajectory & Threat Breakdown Banner */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Sumber Massa Udara:</span>
            <span className="text-slate-400">{status.smokeSource}</span>
          </div>
          {status.isTransboundaryThreat && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-950 text-rose-300 border border-rose-700 animate-pulse">
              KORIDOR SELAT BANGKA WASPADA
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300 border-t border-slate-800/80 pt-2.5">
          <div className="space-y-1">
            <span className="text-slate-400 font-semibold block text-[11px]">
              Dinamika Aliran & Dispersi Asap di Bangka Barat:
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {status.dispersionHeading}. {status.windCarrier}.
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400 font-semibold block text-[11px]">
              Dampak Pelayaran & Pelabuhan Tanjung Kalian:
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {status.aviationMarineImpact}
            </p>
          </div>
        </div>

        {/* Health tips accordion / checklist */}
        <div className="border-t border-slate-800/80 pt-2">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">
            Protokol Kesehatan & Mitigasi Paparan Asap:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-300">
            {status.healthRecommendations.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-1.5">
                <span className="text-amber-400 font-bold shrink-0">✓</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
