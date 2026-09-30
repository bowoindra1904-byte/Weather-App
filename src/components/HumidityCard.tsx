/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CurrentWeather } from '../types/weather';
import { getHumidityComfort } from '../services/weatherApi';
import { Droplets, ThermometerSnowflake, Activity, Gauge } from 'lucide-react';

interface HumidityCardProps {
  current: CurrentWeather;
}

export const HumidityCard: React.FC<HumidityCardProps> = ({ current }) => {
  const comfort = getHumidityComfort(current.relativeHumidity, current.temperature);

  // Temperature spread between current temp and dew point:
  // When temp is close to dew point (spread < 2.5°C), air is near 100% saturation and fog/rain forms easily
  const dewSpread = Math.round((current.temperature - current.dewPoint) * 10) / 10;
  const isCondensationImminent = dewSpread <= 2.5;

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-teal-950/70 text-teal-400 border border-teal-800/50">
            <Droplets className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 font-display tracking-wide">
              KELEMBAPAN & UAP AIR
            </h3>
            <p className="text-xs text-slate-400">Titik embun, tekanan uap, & saturasi</p>
          </div>
        </div>

        <div className="text-right">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${comfort.color} bg-slate-950/80 border-slate-800`}>
            {comfort.label}
          </span>
        </div>
      </div>

      {/* Main Metric Visualizer */}
      <div className="my-4 space-y-4">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-xs text-slate-400">Kelembapan Relatif (RH)</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-4xl font-bold font-mono tabular-nums text-teal-300">
                {current.relativeHumidity}
              </span>
              <span className="text-xl font-medium text-slate-400">%</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400">Titik Embun (Dew Point)</span>
            <div className="flex items-baseline justify-end gap-1 mt-0.5">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-200">
                {current.dewPoint}
              </span>
              <span className="text-sm text-slate-400">°C</span>
            </div>
          </div>
        </div>

        {/* Dynamic Humidity Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className="bg-gradient-to-r from-amber-400 via-teal-400 to-cyan-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${current.relativeHumidity}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>Kering (0%)</span>
            <span>Nyaman (50%)</span>
            <span>Jenuh (100%)</span>
          </div>
        </div>

        {/* Telemetry Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/90 flex flex-col justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <ThermometerSnowflake className="w-3.5 h-3.5 text-cyan-400" /> Selisih Embun
            </span>
            <span className="text-sm font-semibold font-mono text-slate-200 mt-1 tabular-nums">
              {dewSpread} °C
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/90 flex flex-col justify-between">
            <span className="text-slate-400 flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-indigo-400" /> Tekanan Barometrik
            </span>
            <span className="text-sm font-semibold font-mono text-slate-200 mt-1 tabular-nums">
              {current.surfacePressure} hPa
            </span>
          </div>
        </div>
      </div>

      {/* Condensation & Atmospheric assessment note */}
      <div className="border-t border-slate-800/80 pt-3">
        <p className="text-xs text-slate-400 leading-relaxed">
          {comfort.assessment}{' '}
          {isCondensationImminent ? (
            <span className="text-amber-400 font-medium">
              Suhu sangat dekat dengan titik embun; pembentukan kabut uap air dan presipitasi hujan tinggi.
            </span>
          ) : (
            <span>Udara stabil dengan kapasitas penampungan uap air normal.</span>
          )}
        </p>
      </div>
    </div>
  );
};
