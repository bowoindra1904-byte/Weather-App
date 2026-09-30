/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WeatherLocation } from '../types/weather';
import { BANGKA_BARAT_DISTRICTS } from '../services/weatherApi';
import { MapPin, Anchor, Landmark, Compass } from 'lucide-react';

interface BangkaBaratDistrictSelectorProps {
  currentLocation: WeatherLocation;
  onSelectDistrict: (location: WeatherLocation) => void;
}

export const BangkaBaratDistrictSelector: React.FC<BangkaBaratDistrictSelectorProps> = ({
  currentLocation,
  onSelectDistrict,
}) => {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl shadow-xl space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/60">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-display">
              WILAYAH KECAMATAN KABUPATEN BANGKA BARAT
            </h3>
            <p className="text-xs text-slate-400">
              Pilih kecamatan atau zona maritim Selat Bangka untuk memantau radar lokal
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-lg border border-cyan-800/60 hidden sm:inline-block">
          7 WILAYAH PANTAU
        </span>
      </div>

      {/* District Buttons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
        {BANGKA_BARAT_DISTRICTS.map((item) => {
          const isSelected = currentLocation.name === item.name;

          return (
            <button
              key={item.name}
              onClick={() => onSelectDistrict(item)}
              className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-cyan-950/80 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400'
                  : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                {item.isMaritime ? (
                  <Anchor className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-300' : 'text-blue-400'}`} />
                ) : (
                  <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-300' : 'text-slate-400'}`} />
                )}
                {item.isMaritime && (
                  <span className="text-[9px] font-mono text-blue-300 bg-blue-950 px-1 rounded border border-blue-800">
                    LAUT
                  </span>
                )}
              </div>

              <span className={`text-xs font-bold truncate block ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                {item.name}
              </span>
              <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                {item.district}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
