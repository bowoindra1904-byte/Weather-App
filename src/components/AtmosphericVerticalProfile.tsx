/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { CurrentWeather, WeatherLocation } from '../types/weather';
import {
  Layers,
  TrendingUp,
  CloudFog,
  Wind,
  Thermometer,
  ShieldAlert,
  Mountain,
  Zap,
  ArrowUpRight
} from 'lucide-react';

interface AtmosphericVerticalProfileProps {
  current: CurrentWeather;
  location: WeatherLocation;
}

export const AtmosphericVerticalProfile: React.FC<AtmosphericVerticalProfileProps> = ({
  current,
  location,
}) => {
  // 1. Lifted Condensation Level (LCL / Dasar Awan Konvektif)
  // Formula: LCL = 125 * (T - T_dew) meters
  const dewPoint = current.dewPoint ?? Math.max(16, current.temperature - (100 - current.relativeHumidity) / 5);
  const lclMeters = Math.max(300, Math.round(125 * (current.temperature - dewPoint)));

  // 2. Freezing Level / Lapisan Beku (0°C Isotherm in Tropical Bangka: ~4,500m - 5,000m)
  // Standard environmental lapse rate ~6.5°C per 1,000m
  const freezingLevelMeters = Math.round((current.temperature / 6.5) * 1000);

  // 3. Menumbing Orographic Interaction
  const menumbingElevation = 445; // meters
  const isMenumbingCloudIntercept = lclMeters <= menumbingElevation + 200;

  // 4. CAPE (Convective Available Potential Energy) Approximation
  // Based on temperature, humidity, and solar radiation (UV index)
  const estimatedCape = useMemo(() => {
    let cape = (current.temperature - 24) * 85 + (current.relativeHumidity - 60) * 22;
    if (current.uvIndex > 6) cape += 400;
    if (current.precipitation > 0) cape += 250;
    return Math.max(200, Math.round(cape));
  }, [current]);

  let capeStability = 'Stabil (Lapisan Udara Tenang)';
  let capeColor = 'text-emerald-400 bg-emerald-950/60 border-emerald-800';
  if (estimatedCape > 2500) {
    capeStability = 'Sangat Labil (Potensi Badai Petir Ekstrem & Squall Line)';
    capeColor = 'text-rose-400 bg-rose-950/80 border-rose-800';
  } else if (estimatedCape > 1200) {
    capeStability = 'Moderat (Pertumbuhan Awan Konvektif / Hujan Lokal)';
    capeColor = 'text-amber-400 bg-amber-950/60 border-amber-800';
  }

  // Atmospheric Layers
  const layers = [
    {
      altitude: '12.000 m',
      name: 'Lapisan Tropopause',
      temp: '-54°C',
      desc: 'Puncak awan Cumulonimbus (Anvil Cirrus), arus Jet Stream tropis',
      color: 'border-purple-500/40 bg-purple-950/20 text-purple-300',
    },
    {
      altitude: `${freezingLevelMeters.toLocaleString('id-ID')} m`,
      name: 'Lapisan Beku (0°C Isotherm)',
      temp: '0.0°C',
      desc: 'Transisi tetes air superdingin menjadi kristal es & graupel (pembentuk petir)',
      color: 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300',
    },
    {
      altitude: `${lclMeters.toLocaleString('id-ID')} m`,
      name: 'Dasar Awan / LCL (Lifted Condensation Level)',
      temp: `${(current.temperature - (lclMeters / 1000) * 6.5).toFixed(1)}°C`,
      desc: `Ketinggian kondensasi uap air dari Selat Bangka membentuk awan kumulus`,
      color: 'border-blue-500/50 bg-blue-950/30 text-blue-300',
      highlight: true,
    },
    {
      altitude: '445 m',
      name: 'Puncak Bukit Menumbing (Mentok)',
      temp: `${(current.temperature - 2.9).toFixed(1)}°C`,
      desc: isMenumbingCloudIntercept
        ? 'Terhalang kabut tebal orografis & tutupan awan rendah'
        : 'Angin lereng orografis sepoi-sepoi, visibilitas baik',
      color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300',
    },
    {
      altitude: '0 - 50 m',
      name: `Lapisan Permukaan (${location.name})`,
      temp: `${current.temperature}°C`,
      desc: `Tekanan ${current.surfacePressure} hPa · Kelembapan ${current.relativeHumidity}% · Angin ${current.windSpeed} km/j`,
      color: 'border-teal-500/40 bg-teal-950/20 text-teal-300',
      isSurface: true,
    },
  ];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-5">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-950/80 text-indigo-400 border border-indigo-700/60 shadow-lg">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2">
              PROFIL VERTIKAL ATMOSFER & SOUNDING
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-800">
                AEROLOGI TROPOSFER
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Analisis gradien suhu vertikal, stabilitas udara konvektif, dan orografi Menumbing
            </p>
          </div>
        </div>

        {/* CAPE Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">Energi Konvektif (CAPE):</span>
          <span className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border ${capeColor}`}>
            {estimatedCape} J/kg
          </span>
        </div>
      </div>

      {/* Atmospheric Layers Vertical Stack */}
      <div className="space-y-3">
        {layers.map((layer, idx) => (
          <div
            key={idx}
            className={`p-3.5 rounded-2xl border transition-all ${layer.color} ${
              layer.highlight ? 'ring-1 ring-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : ''
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-950/60 border border-slate-800">
                  {layer.altitude}
                </span>
                <span className="text-xs font-bold font-display text-slate-100">{layer.name}</span>
                {layer.isSurface && (
                  <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded border border-teal-500/30">
                    Lokasi Aktif
                  </span>
                )}
              </div>

              <span className="font-mono text-xs font-bold tabular-nums">{layer.temp}</span>
            </div>

            <p className="text-[11px] text-slate-400 mt-1 pl-1">{layer.desc}</p>
          </div>
        ))}
      </div>

      {/* Technical Aerology Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <CloudFog className="w-3.5 h-3.5 text-blue-400" /> Dasar Awan (LCL)
          </span>
          <span className="text-base font-bold font-mono text-blue-300 mt-1">
            {lclMeters} <span className="text-xs font-normal text-slate-400">meter dpl</span>
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">Rumus Espy (T - Td)</span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Thermometer className="w-3.5 h-3.5 text-cyan-400" /> Lapisan Beku (0°C)
          </span>
          <span className="text-base font-bold font-mono text-cyan-300 mt-1">
            {freezingLevelMeters} <span className="text-xs font-normal text-slate-400">meter dpl</span>
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">Lapse rate ~6.5°C/km</span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Stabilitas Troposfer
          </span>
          <span className="text-xs font-bold text-slate-200 mt-1 leading-snug">
            {capeStability}
          </span>
        </div>
      </div>
    </div>
  );
};
