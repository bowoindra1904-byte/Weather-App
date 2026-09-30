/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ExtremeAlert, ExtremeAlertType, NotificationPreferences, SeverityLevel } from '../types/weather';
import { atmosphereAudio } from '../services/audioAtmosphere';
import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Zap,
  Wind,
  CloudRain,
  Flame,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info
} from 'lucide-react';

interface ExtremeWeatherPanelProps {
  alerts: ExtremeAlert[];
  locationName: string;
  preferences: NotificationPreferences;
  onUpdatePreferences: (newPrefs: Partial<NotificationPreferences>) => void;
  isSimulatingExtremeDemo?: boolean;
  onToggleExtremeDemo?: () => void;
}

export const ExtremeWeatherPanel: React.FC<ExtremeWeatherPanelProps> = ({
  alerts,
  locationName,
  preferences,
  onUpdatePreferences,
  isSimulatingExtremeDemo = false,
  onToggleExtremeDemo,
}) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);

  // Filter alerts based on active user notification preferences
  const filteredAlerts = alerts.filter((alert) => {
    if (alert.type === 'thunderstorm' && !preferences.thunderstorm) return false;
    if (alert.type === 'gale' && !preferences.gale) return false;
    if (alert.type === 'flood' && !preferences.flood) return false;
    if (alert.type === 'heatwave' && !preferences.heatwave) return false;
    return true;
  });

  const getSeverityBadge = (severity: SeverityLevel) => {
    switch (severity) {
      case 'awas':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold font-mono tracking-wider text-rose-200 bg-rose-950 border border-rose-600 shadow-[0_0_10px_rgba(225,29,72,0.4)] animate-pulse">
            TINGKAT: AWAS (BAHAYA EKSTREM)
          </span>
        );
      case 'siaga':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold font-mono tracking-wider text-amber-200 bg-amber-950 border border-amber-600 shadow-[0_0_8px_rgba(217,119,6,0.3)]">
            TINGKAT: SIAGA (SIGNIFIKAN)
          </span>
        );
      case 'waspada':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold font-mono tracking-wider text-yellow-200 bg-yellow-950/80 border border-yellow-600">
            TINGKAT: WASPADA (HATI-HATI)
          </span>
        );
    }
  };

  const getTypeIcon = (type: ExtremeAlertType, className = 'w-5 h-5') => {
    switch (type) {
      case 'thunderstorm':
        return <Zap className={`${className} text-amber-400`} />;
      case 'gale':
        return <Wind className={`${className} text-cyan-400`} />;
      case 'flood':
        return <CloudRain className={`${className} text-blue-400`} />;
      case 'heatwave':
        return <Flame className={`${className} text-orange-400`} />;
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-950/80 text-rose-400 border border-rose-800/60">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-display tracking-wide flex items-center gap-2">
              SISTEM PERINGATAN DINI CUACA EKSTREM BANGKA BARAT
              {filteredAlerts.length > 0 && (
                <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Deteksi otomatis badai petir, angin kencang/topan, banjir bandang, & gelombang panas
            </p>
          </div>
        </div>

        {/* Action Controls: Notification Toggles & Demo Switch */}
        <div className="flex items-center gap-2">
          {onToggleExtremeDemo && (
            <button
              onClick={() => {
                onToggleExtremeDemo();
                if (preferences.soundEnabled) {
                  atmosphereAudio.triggerWarningAlert();
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                isSimulatingExtremeDemo
                  ? 'bg-amber-950 text-amber-300 border border-amber-700/80'
                  : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{isSimulatingExtremeDemo ? 'Mode Uji: Aktif' : 'Uji Simulasi Peringatan'}</span>
            </button>
          )}

          <button
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 text-xs font-medium text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <Bell className="w-3.5 h-3.5 text-cyan-400" />
            <span>Pengaturan Notifikasi</span>
            {isConfigOpen ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Notification Filter Preferences */}
      {isConfigOpen && (
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-xs font-bold text-slate-200 font-display">
              AKTIFKAN / NONAKTIFKAN NOTIFIKASI PER JENIS CUACA BERBAHAYA:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onUpdatePreferences({ soundEnabled: !preferences.soundEnabled })}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
                  preferences.soundEnabled
                    ? 'text-cyan-300 bg-cyan-950/80 border-cyan-800'
                    : 'text-slate-500 bg-slate-900 border-slate-800'
                }`}
                title="Aktifkan nada sinyal audio peringatan"
              >
                {preferences.soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span className="text-[10px]">Suara: {preferences.soundEnabled ? 'Aktif' : 'Hening'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Toggle 1: Thunderstorm */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:bg-slate-850 transition-colors">
              <input
                type="checkbox"
                checked={preferences.thunderstorm}
                onChange={(e) => onUpdatePreferences({ thunderstorm: e.target.checked })}
                className="mt-0.5 accent-cyan-400 w-4 h-4 rounded cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Badai Petir
                </span>
                <p className="text-[10px] text-slate-400">Kilat, petir awan kumulonimbus, & guruh</p>
              </div>
            </label>

            {/* Toggle 2: Gale / High Wind */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:bg-slate-850 transition-colors">
              <input
                type="checkbox"
                checked={preferences.gale}
                onChange={(e) => onUpdatePreferences({ gale: e.target.checked })}
                className="mt-0.5 accent-cyan-400 w-4 h-4 rounded cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-cyan-400" /> Angin Topan & Gelombang
                </span>
                <p className="text-[10px] text-slate-400">Hembusan kencang & gelombang Selat Bangka</p>
              </div>
            </label>

            {/* Toggle 3: Flood */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:bg-slate-850 transition-colors">
              <input
                type="checkbox"
                checked={preferences.flood}
                onChange={(e) => onUpdatePreferences({ flood: e.target.checked })}
                className="mt-0.5 accent-cyan-400 w-4 h-4 rounded cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                  <CloudRain className="w-3.5 h-3.5 text-blue-400" /> Banjir Bandang
                </span>
                <p className="text-[10px] text-slate-400">Hujan lebat & luapan Sungai Mentok</p>
              </div>
            </label>

            {/* Toggle 4: Heatwave */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:bg-slate-850 transition-colors">
              <input
                type="checkbox"
                checked={preferences.heatwave}
                onChange={(e) => onUpdatePreferences({ heatwave: e.target.checked })}
                className="mt-0.5 accent-cyan-400 w-4 h-4 rounded cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-400" /> Gelombang Panas
                </span>
                <p className="text-[10px] text-slate-400">Indeks panas ekstrem & sengatan termal</p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Alert Feed Content */}
      {filteredAlerts.length === 0 ? (
        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-emerald-300 font-display">
                STATUS KONDISI ATMOSFER DI {locationName.toUpperCase()} AMAN
              </h4>
              <p className="text-xs text-slate-300">
                Tidak ada indikasi badai petir, hembusan angin topan berbahaya, potensi banjir bandang, maupun gelombang panas ekstrem saat ini.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80 shrink-0 hidden sm:inline-block">
            STATUS: HIJAU / STABIL
          </span>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const isExpanded = expandedAlertId === alert.id;
            const borderBg =
              alert.severity === 'awas'
                ? 'bg-rose-950/40 border-rose-700/80 text-rose-100'
                : alert.severity === 'siaga'
                ? 'bg-amber-950/40 border-amber-700/80 text-amber-100'
                : 'bg-yellow-950/30 border-yellow-700/60 text-yellow-100';

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border backdrop-blur-md shadow-lg transition-all ${borderBg}`}
              >
                {/* Top Row: Title, Severity, Duration */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {getTypeIcon(alert.type, 'w-5 h-5')}
                    <h4 className="text-sm font-bold font-display tracking-wide">{alert.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(alert.severity)}
                  </div>
                </div>

                {/* Duration & Trigger Metrics Bar */}
                <div className="flex flex-wrap items-center gap-4 text-xs mt-2.5 py-1.5 px-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center gap-1 text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Perkiraan Durasi Aktif:</span>
                    <strong className="text-cyan-300 font-mono">
                      ~{alert.durationHours} Jam (Hingga {alert.estimatedEndTime})
                    </strong>
                  </div>
                  <span className="text-slate-600">·</span>
                  <div className="flex items-center gap-1 text-slate-300">
                    <span>Indikator:</span>
                    <strong className="text-slate-100 font-mono">{alert.metricValue}</strong>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
                  {alert.description}
                </p>

                {/* Recommendations Accordion */}
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col gap-2">
                  <button
                    onClick={() => setExpandedAlertId(isExpanded ? null : alert.id)}
                    className="flex items-center justify-between text-xs font-semibold text-slate-200 hover:text-cyan-300 transition-colors"
                  >
                    <span>Prosedur Keselamatan & Area Terdampak di Bangka Barat</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {isExpanded && (
                    <div className="space-y-3 pt-2 animate-in fade-in duration-200">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                          Langkah Mitigasi yang Direkomendasikan:
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                          {alert.recommendations.map((rec, rIdx) => (
                            <li key={rIdx}>{rec}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 pt-1">
                        <span className="font-semibold">Wilayah Terdampak Utama:</span>
                        {alert.impactAreas.map((area, aIdx) => (
                          <span
                            key={aIdx}
                            className="bg-slate-950 px-2 py-0.5 rounded text-[11px] text-slate-200 border border-slate-800"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
