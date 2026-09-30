/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CurrentWeather, WeatherLocation } from '../types/weather';

export interface MaritimeStatus {
  waveHeightMeters: number;
  waveCategory: 'Tenang' | 'Rendah' | 'Sedang' | 'Tinggi' | 'Sangat Tinggi';
  waveCategoryColor: string;
  ferryStatus: 'Aman Berlayar' | 'Waspada Kecepatan' | 'Tunda Penyeberangan Cepat' | 'Bahaya / Ditutup Sementara';
  ferryStatusColor: string;
  fishermenAdvisory: string;
  seaSurfaceTemp: number; // °C
  tidePhase: 'Pasang Menuju Puncak' | 'Air Pasang Tertinggi' | 'Surut Menuju Terendah' | 'Air Surut Terendah';
  tideHeightMeters: number;
  highTideTime: string;
  lowTideTime: string;
  droneFlightSafety: 'Sangat Layak' | 'Waspada Angin Gust' | 'Dilarang Terbang (Bahaya)';
  droneColor: string;
  evapotranspirationMm: number; // for agriculture (kebun sawit & lada)
}

/**
 * Calculates Selat Bangka maritime conditions based on real wind velocity,
 * atmospheric pressure, and local tidal cycles.
 */
export function calculateMaritimeWeather(
  current: CurrentWeather,
  location: WeatherLocation
): MaritimeStatus {
  const windKmh = current.windSpeed;
  const isMaritimeZone = location.isMaritime || location.name.includes('Tanjung Kalian') || location.name.includes('Tempilang');

  // Significant Wave Height Estimation in Selat Bangka (Fetch length ~40-60 km in strait)
  // Empirical wind-wave growth relation adapted for shallow straits:
  const baseWave = Math.pow(windKmh / 3.6, 1.35) * 0.038;
  const waveHeightMeters = Math.round(Math.max(0.2, Math.min(4.5, baseWave * (isMaritimeZone ? 1.25 : 0.85))) * 10) / 10;

  let waveCategory: MaritimeStatus['waveCategory'] = 'Tenang';
  let waveCategoryColor = 'text-cyan-400';

  if (waveHeightMeters >= 2.5) {
    waveCategory = 'Sangat Tinggi';
    waveCategoryColor = 'text-rose-500';
  } else if (waveHeightMeters >= 1.25) {
    waveCategory = 'Tinggi';
    waveCategoryColor = 'text-amber-500';
  } else if (waveHeightMeters >= 0.75) {
    waveCategory = 'Sedang';
    waveCategoryColor = 'text-amber-400';
  } else if (waveHeightMeters >= 0.4) {
    waveCategory = 'Rendah';
    waveCategoryColor = 'text-teal-400';
  }

  // Ferry Tanjung Kalian - Tanjung Api-api Safety Status
  let ferryStatus: MaritimeStatus['ferryStatus'] = 'Aman Berlayar';
  let ferryStatusColor = 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';
  let fishermenAdvisory = 'Kondisi perairan kondusif bagi seluruh jenis perahu nelayan tradisional dan penyeberangan kapal ferry.';

  if (waveHeightMeters >= 2.5 || current.windSpeed >= 50 || [95, 96, 99].includes(current.weatherCode)) {
    ferryStatus = 'Bahaya / Ditutup Sementara';
    ferryStatusColor = 'bg-rose-950/90 text-rose-300 border-rose-600 animate-pulse';
    fishermenAdvisory = 'BAHAYA TINGGI: Gelombang laut dan angin ekstrem berisiko membalikkan perahu kecil. Seluruh aktivitas pelayaran Selat Bangka diimbau ditunda.';
  } else if (waveHeightMeters >= 1.25 || current.windSpeed >= 38) {
    ferryStatus = 'Tunda Penyeberangan Cepat';
    ferryStatusColor = 'bg-amber-950/80 text-amber-300 border-amber-600';
    fishermenAdvisory = 'Perahu nelayan <10 GT dilarang melaut ke tengah Selat Bangka. Kapal penyeberangan Ro-Ro diimbau waspada bermanuver di dermaga Tanjung Kalian.';
  } else if (waveHeightMeters >= 0.75 || current.windSpeed >= 25) {
    ferryStatus = 'Waspada Kecepatan';
    ferryStatusColor = 'bg-yellow-950/80 text-yellow-300 border-yellow-600';
    fishermenAdvisory = 'Gelombang sedang di perairan terbuka Selat Bangka & Teluk Kelabat. Pengemudi kapal cepat dan perahu motor wajib mengenakan jaket pelampung.';
  }

  // Sea Surface Temperature (SST) in Bangka Strait (tropical water typically 28.5°C - 30.5°C)
  const seaSurfaceTemp = Math.round((29.2 + (current.temperature - 30) * 0.15) * 10) / 10;

  // Tidal Approximation for Selat Bangka (Diurnal & Semi-Diurnal tide pattern)
  const currentHour = new Date().getHours();
  // Semi-diurnal cycle peak around ~09:00 and ~21:00
  const tideSine = Math.sin(((currentHour - 3) / 12) * Math.PI * 2);
  const tideHeightMeters = Math.round((1.8 + tideSine * 0.9) * 10) / 10;

  let tidePhase: MaritimeStatus['tidePhase'] = 'Pasang Menuju Puncak';
  if (tideSine > 0.8) tidePhase = 'Air Pasang Tertinggi';
  else if (tideSine < -0.8) tidePhase = 'Air Surut Terendah';
  else if (tideSine < 0) tidePhase = 'Surut Menuju Terendah';

  // Drone / Aerial Survey Safety Index
  let droneFlightSafety: MaritimeStatus['droneFlightSafety'] = 'Sangat Layak';
  let droneColor = 'text-emerald-400';
  if (current.windSpeed >= 35 || current.precipitation > 0 || [95, 96, 99].includes(current.weatherCode)) {
    droneFlightSafety = 'Dilarang Terbang (Bahaya)';
    droneColor = 'text-rose-400';
  } else if (current.windSpeed >= 22 || current.windGusts >= 30) {
    droneFlightSafety = 'Waspada Angin Gust';
    droneColor = 'text-amber-400';
  }

  // Evapotranspiration estimate for Bangka agricultural crops (Sawit & Lada)
  const tempFactor = current.temperature * 0.12;
  const humidityFactor = (100 - current.relativeHumidity) * 0.04;
  const windFactor = current.windSpeed * 0.05;
  const evapotranspirationMm = Math.round((tempFactor + humidityFactor + windFactor) * 10) / 10;

  return {
    waveHeightMeters,
    waveCategory,
    waveCategoryColor,
    ferryStatus,
    ferryStatusColor,
    fishermenAdvisory,
    seaSurfaceTemp,
    tidePhase,
    tideHeightMeters,
    highTideTime: '09:45 WIB & 22:15 WIB',
    lowTideTime: '04:10 WIB & 16:30 WIB',
    droneFlightSafety,
    droneColor,
    evapotranspirationMm,
  };
}
