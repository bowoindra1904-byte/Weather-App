/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SpatialWeatherPoint, WeatherLocation } from '../types/weather';
import { getWeatherCondition, getWindDirectionCardinal } from '../services/weatherApi';
import {
  Table,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Wind,
  Droplets,
  Thermometer,
  CloudRain,
  Flame,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Anchor
} from 'lucide-react';

interface BangkaBaratComparisonTableProps {
  spatialData: SpatialWeatherPoint[];
  selectedLocation: WeatherLocation;
  onSelectLocation: (location: WeatherLocation) => void;
}

export const BangkaBaratComparisonTable: React.FC<BangkaBaratComparisonTableProps> = ({
  spatialData,
  selectedLocation,
  onSelectLocation,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  if (spatialData.length === 0) return null;

  // Calculate Fire Weather Index / Karhutla Risk
  const getFireRisk = (temp: number, humidity: number, wind: number) => {
    // High temp (>32), low humidity (<65%), and wind (>15) increase fire risk
    const score = (temp - 25) * 1.5 + (85 - humidity) * 1.2 + wind * 0.8;
    if (score > 50) return { label: 'Tinggi', color: 'text-rose-400 bg-rose-950/60 border-rose-800' };
    if (score > 30) return { label: 'Sedang', color: 'text-amber-400 bg-amber-950/60 border-amber-800' };
    return { label: 'Rendah', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800' };
  };

  // Overall Safety Risk Level
  const getSafetyStatus = (point: SpatialWeatherPoint) => {
    if (point.windSpeed >= 35 || point.precipitation >= 15 || [95, 96, 99].includes(point.weatherCode)) {
      return { label: 'SIAGA', color: 'text-rose-300 bg-rose-950 border-rose-600', icon: ShieldAlert };
    }
    if (point.windSpeed >= 22 || point.precipitation > 0 || point.temperature >= 33) {
      return { label: 'WASPADA', color: 'text-amber-300 bg-amber-950 border-amber-600', icon: AlertTriangle };
    }
    return { label: 'KONDUSIF', color: 'text-emerald-300 bg-emerald-950 border-emerald-600', icon: ShieldCheck };
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 shadow-lg">
            <Table className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-display tracking-wide flex items-center gap-2">
              MATRIKS KOMPARASI CUACA SELURUH KECAMATAN BANGKA BARAT
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-800">
                7 ZONA PANTAU
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Perbandingan komparatif suhu, angin, presipitasi, risiko Karhutla, & tingkat keselamatan wilayah
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-950 text-xs font-medium text-slate-300 hover:text-cyan-300 border border-slate-800 transition-colors"
        >
          <span>{isExpanded ? 'Sembunyikan Matriks' : 'Tampilkan Matriks'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="overflow-x-auto rounded-2xl border border-slate-800/90">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-slate-950/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">Kecamatan / Wilayah</th>
                <th className="py-3 px-3">Kondisi Cuaca</th>
                <th className="py-3 px-3">Suhu (Terasa)</th>
                <th className="py-3 px-3">Angin & Arah</th>
                <th className="py-3 px-3">Kelembapan</th>
                <th className="py-3 px-3">Awan & Hujan</th>
                <th className="py-3 px-3">Kerawanan Karhutla</th>
                <th className="py-3 px-3">Status Risiko</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
              {spatialData.map((pt) => {
                const isSelected = selectedLocation.name === pt.location.name;
                const condition = getWeatherCondition(pt.weatherCode);
                const cardinal = getWindDirectionCardinal(pt.windDirection);
                const fireRisk = getFireRisk(pt.temperature, pt.relativeHumidity, pt.windSpeed);
                const safety = getSafetyStatus(pt);
                const SafetyIcon = safety.icon;

                return (
                  <tr
                    key={pt.location.name}
                    className={`transition-colors hover:bg-slate-900/60 ${
                      isSelected ? 'bg-cyan-950/30 ring-1 ring-inset ring-cyan-500/40' : ''
                    }`}
                  >
                    {/* Location Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {pt.location.isMaritime ? (
                          <Anchor className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                        )}
                        <div>
                          <div className="font-bold text-slate-100 font-display flex items-center gap-1.5">
                            {pt.location.name}
                            {isSelected && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                Aktif
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">{pt.location.district}</div>
                        </div>
                      </div>
                    </td>

                    {/* Condition */}
                    <td className="py-3 px-3">
                      <span className="text-slate-300 font-medium">{condition.label}</span>
                    </td>

                    {/* Temperature */}
                    <td className="py-3 px-3 font-mono">
                      <span className="font-bold text-slate-100">{pt.temperature}°C</span>{' '}
                      <span className="text-slate-500 text-[11px]">({pt.apparentTemperature}°C)</span>
                    </td>

                    {/* Wind */}
                    <td className="py-3 px-3 font-mono">
                      <span className="text-cyan-300 font-semibold">{pt.windSpeed} km/j</span>{' '}
                      <span className="text-slate-400 text-[10px]">· {cardinal.short} ({pt.windDirection}°)</span>
                    </td>

                    {/* Humidity */}
                    <td className="py-3 px-3 font-mono text-teal-300 font-semibold">
                      {pt.relativeHumidity}%
                    </td>

                    {/* Rain / Clouds */}
                    <td className="py-3 px-3 font-mono">
                      {pt.precipitation > 0 ? (
                        <span className="text-indigo-400 font-bold">{pt.precipitation} mm/j</span>
                      ) : (
                        <span className="text-slate-400">{pt.cloudCover}% awan</span>
                      )}
                    </td>

                    {/* Fire Risk */}
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${fireRisk.color}`}>
                        {fireRisk.label}
                      </span>
                    </td>

                    {/* Safety Status */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${safety.color}`}>
                          <SafetyIcon className="w-3 h-3" />
                          {safety.label}
                        </span>
                      </div>
                    </td>

                    {/* Focus Button */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onSelectLocation(pt.location)}
                        disabled={isSelected}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all flex items-center gap-1 mx-auto ${
                          isSelected
                            ? 'bg-slate-800 text-slate-500 cursor-default'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500 hover:text-slate-950'
                        }`}
                      >
                        <span>{isSelected ? 'Dipilih' : 'Pilih'}</span>
                        {!isSelected && <ArrowRight className="w-3 h-3" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
