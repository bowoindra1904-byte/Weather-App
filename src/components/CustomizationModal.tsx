/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Simulation3DConfig, VisualTheme } from '../types/weather';
import { Sliders, X, Sparkles, Wind, Cloud, CloudRain, RotateCcw, Check, Palette } from 'lucide-react';

interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: Simulation3DConfig;
  onUpdateConfig: (newConfig: Partial<Simulation3DConfig>) => void;
}

export const CustomizationModal: React.FC<CustomizationModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
}) => {
  if (!isOpen) return null;

  const themes: {
    id: VisualTheme;
    name: string;
    description: string;
    accentColor: string;
    borderActive: string;
    bgPreview: string;
  }[] = [
    {
      id: 'realistic',
      name: 'Realistis (Alami)',
      description: 'Pencahayaan fisik fotorealistik, warna langit alami Bangka Barat, dan material atmosfer presisi.',
      accentColor: 'text-cyan-400',
      borderActive: 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.25)]',
      bgPreview: 'from-slate-900 via-sky-950 to-slate-950',
    },
    {
      id: 'cartoon',
      name: 'Gaya Kartun (Cel-Shaded)',
      description: 'Visual kartun ceria, gumpalan awan flat-shaded cerah, warna tanah hijau cerah, dan partikel playful.',
      accentColor: 'text-amber-400',
      borderActive: 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.25)]',
      bgPreview: 'from-blue-600 via-emerald-600 to-sky-500',
    },
    {
      id: 'futuristic',
      name: 'Futuristik Cyber (Hologram)',
      description: 'Estetika cyberpunk sci-fi, grid neon laser cyan & magenta, cincin digital, dan partikel neon bercahaya.',
      accentColor: 'text-fuchsia-400',
      borderActive: 'border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.3)]',
      bgPreview: 'from-slate-950 via-purple-950 to-cyan-950',
    },
  ];

  const handleResetDefaults = () => {
    onUpdateConfig({
      theme: 'realistic',
      windIntensity: 1.0,
      cloudDensity: 1.0,
      rainIntensity: 1.0,
      animationSpeed: 1.0,
      showWindParticles: true,
      showClouds: true,
      showRain: true,
      showHumidityFog: true,
      showSensorPedestal: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/60">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 font-display">
                KUSTOMISASI TAMPILAN 3D
              </h3>
              <p className="text-xs text-slate-400">
                Pilih tema visual & sesuaikan intensitas animasi cuaca real-time
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-5 space-y-6">
          {/* 1. THEME SELECTION */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-3 flex items-center gap-1.5 font-display tracking-wider">
              <Palette className="w-4 h-4 text-cyan-400" /> PILIH TEMA VISUAL 3D:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {themes.map((t) => {
                const isSelected = config.theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => onUpdateConfig({ theme: t.id })}
                    className={`relative p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                      isSelected
                        ? `bg-slate-950/90 ${t.borderActive} ring-1 ring-white/20`
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    {/* Visual Swatch Preview */}
                    <div
                      className={`w-full h-10 rounded-xl bg-gradient-to-r ${t.bgPreview} mb-2.5 flex items-center justify-center opacity-85 shadow-inner`}
                    >
                      <Sparkles className="w-4 h-4 text-white/70" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${t.accentColor}`}>{t.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                        {t.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. ANIMATION INTENSITY SLIDERS */}
          <div className="space-y-5 border-t border-slate-800/80 pt-5">
            <h4 className="text-xs font-semibold text-slate-300 font-display tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-cyan-400" /> PENGATUR INTENSITAS ANIMASI:
            </h4>

            {/* Wind Intensity Slider */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-2 font-medium">
                  <Wind className="w-4 h-4 text-cyan-400" /> Kecepatan & Kepadatan Aliran Angin
                </span>
                <span className="font-mono font-semibold text-cyan-300 tabular-nums">
                  {(config.windIntensity || 1.0).toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.1"
                value={config.windIntensity || 1.0}
                onChange={(e) => onUpdateConfig({ windIntensity: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.2x (Sangat Tenang)</span>
                <span>1.0x (Normal)</span>
                <span>3.0x (Hembusan Ekstrem)</span>
              </div>
            </div>

            {/* Cloud Density Slider */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-2 font-medium">
                  <Cloud className="w-4 h-4 text-blue-400" /> Kepadatan & Skala Volume Awan
                </span>
                <span className="font-mono font-semibold text-blue-300 tabular-nums">
                  {Math.round((config.cloudDensity || 1.0) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.2"
                step="0.1"
                value={config.cloudDensity || 1.0}
                onChange={(e) => onUpdateConfig({ cloudDensity: parseFloat(e.target.value) })}
                className="w-full accent-blue-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>20% (Awan Tipis)</span>
                <span>100% (Sesuai Satelit)</span>
                <span>220% (Awan Sangat Padat)</span>
              </div>
            </div>

            {/* Rain Precipitation Intensity Slider */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-2 font-medium">
                  <CloudRain className="w-4 h-4 text-indigo-400" /> Pengali Intensitas Presipitasi Hujan
                </span>
                <span className="font-mono font-semibold text-indigo-300 tabular-nums">
                  {(config.rainIntensity || 1.0).toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.5"
                step="0.1"
                value={config.rainIntensity || 1.0}
                onChange={(e) => onUpdateConfig({ rainIntensity: parseFloat(e.target.value) })}
                className="w-full accent-indigo-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.2x (Rintik Halus)</span>
                <span>1.0x (Alami)</span>
                <span>2.5x (Guyuran Lebat)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Kembalikan ke Standar</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors shadow-lg"
          >
            Terapkan & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
