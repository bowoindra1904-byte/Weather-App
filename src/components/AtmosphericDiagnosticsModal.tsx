/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CompleteWeatherData } from '../types/weather';
import { calculateMaritimeWeather } from '../services/maritimeWeather';
import { getWeatherCondition, getWindDirectionCardinal } from '../services/weatherApi';
import {
  FileText,
  Printer,
  X,
  ShieldCheck,
  Compass,
  Mountain,
  Anchor,
  Sprout,
  Activity,
  CheckCircle2,
  Calendar
} from 'lucide-react';

interface AtmosphericDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  weatherData: CompleteWeatherData;
}

export const AtmosphericDiagnosticsModal: React.FC<AtmosphericDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  weatherData,
}) => {
  if (!isOpen) return null;

  const current = weatherData.current;
  const location = weatherData.location;
  const condition = getWeatherCondition(current.weatherCode);
  const cardinal = getWindDirectionCardinal(current.windDirection);
  const maritime = calculateMaritimeWeather(current, location);

  // Convective Orographic Index around Bukit Menumbing (elevation ~445m)
  const isMenumbingConvective = current.relativeHumidity > 75 && current.windSpeed > 10;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-950 text-cyan-400 border border-cyan-800/80">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-display">
                BULETIN RESMI DIAGNOSTIK METEOROLOGI BANGKA BARAT
              </h3>
              <p className="text-xs text-slate-400">
                Laporan komprehensif stabilitas atmosfer, orografi Menumbing, & sektor strategis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 text-xs font-semibold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bulletin Body */}
        <div className="overflow-y-auto p-6 space-y-6 text-slate-200 print:text-black print:bg-white">
          {/* Header Metadata */}
          <div className="border border-slate-800 rounded-2xl p-4 bg-slate-950/50 space-y-2">
            <div className="flex flex-wrap items-center justify-between text-xs">
              <div>
                <span className="text-slate-400">Wilayah Observasi:</span>{' '}
                <strong className="text-cyan-300 font-display">{location.name}</strong> ({location.district})
              </div>
              <div className="font-mono text-slate-400">
                Pembaruan: {weatherData.lastUpdated} WIB · WGS84
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Suhu Udara</span>
                <span className="font-mono font-bold text-slate-100">{current.temperature}°C</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Kelembapan Relatif</span>
                <span className="font-mono font-bold text-teal-300">{current.relativeHumidity}% RH</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Vektor Angin</span>
                <span className="font-mono font-bold text-cyan-300">
                  {current.windSpeed} km/j ({cardinal.short})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Tekanan Udara</span>
                <span className="font-mono font-bold text-slate-100">{current.surfacePressure} hPa</span>
              </div>
            </div>
          </div>

          {/* 1. Orographic Menumbing Analysis */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 font-display flex items-center gap-2">
              <Mountain className="w-4 h-4 text-emerald-400" />
              1. ANALISIS OROGRAFIK PERBUKITAN MENUMBING & KONVEKSI LOKAL
            </h4>
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs leading-relaxed text-slate-300 space-y-1.5">
              <p>
                Bukit Menumbing (elevasi puncak ~445 mdpl) bertindak sebagai rintangan orografik alami bagi massa udara laut yang bertiup dari Selat Bangka. Udara lembap dipaksa naik (*orographic lift*), mengalami pendinginan adiabatik, dan memicu kondensasi awan kumulus lokal di lereng barat dan selatan Mentok.
              </p>
              <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-400 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  Status Konveksi Menumbing:{' '}
                  {isMenumbingConvective ? 'Aktivitas Konvektif Sedang Aktif' : 'Atmosfer Stabil'}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Maritime & Straits Dynamics */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 font-display flex items-center gap-2">
              <Anchor className="w-4 h-4 text-cyan-400" />
              2. KESIAPSIAGAAN MARITIM & PENYEBERANGAN SELAT BANGKA
            </h4>
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs leading-relaxed text-slate-300 space-y-2">
              <div className="flex items-center justify-between">
                <span>Tinggi Gelombang Signifikan:</span>
                <strong className="font-mono text-cyan-300">{maritime.waveHeightMeters} Meter ({maritime.waveCategory})</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Status Kelayakan Ferry Tanjung Kalian:</span>
                <strong className="font-mono text-emerald-400">{maritime.ferryStatus}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Siklus Pasang Surut Air Laut:</span>
                <span className="font-mono text-slate-200">{maritime.tidePhase} (~{maritime.tideHeightMeters}m)</span>
              </div>
              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                {maritime.fishermenAdvisory}
              </p>
            </div>
          </div>

          {/* 3. Strategic Agricultural & Plantation Advisory */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 font-display flex items-center gap-2">
              <Sprout className="w-4 h-4 text-amber-400" />
              3. REKOMENDASI SEKTOR PERKEBUNAN (LADA & SAWIT)
            </h4>
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs leading-relaxed text-slate-300 space-y-1.5">
              <p>
                Laju evapotranspirasi tanah terhitung sebesar{' '}
                <strong className="text-amber-400 font-mono">{maritime.evapotranspirationMm} mm/hari</strong>.
                Untuk perkebunan lada putih (Muntok White Pepper) di sentra Jebus dan Parittiga, kelembapan tanah mencukupi dan tidak terindikasi stres kekeringan.
              </p>
              <p className="text-[11px] text-slate-400">
                Penyemprotan pupuk daun dan fungisida paling efektif dilakukan pada pagi hari sebelum kecepatan angin meningkat di atas 20 km/jam.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-500">
          <span>Pusat Data Meteorologi & Geofisika Terpadu · Bangka Barat</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Tutup Buletin
          </button>
        </div>
      </div>
    </div>
  );
};
