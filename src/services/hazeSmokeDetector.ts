/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CurrentWeather, HazeSmokeStatus, WeatherLocation } from '../types/weather';
import { getWindDirectionCardinal } from './weatherApi';

/**
 * Calculates real-time Haze, Smog, and Wildfire Smoke (Kabut Asap Karhutla)
 * detection tailored to Kabupaten Bangka Barat geography.
 */
export function calculateHazeSmokeStatus(
  current: CurrentWeather,
  location: WeatherLocation,
  isSimulatingSmokeDemo: boolean = false
): HazeSmokeStatus {
  if (isSimulatingSmokeDemo) {
    return {
      severity: 'tidak_sehat',
      severityLabel: 'KABUT ASAP PEKAT (TIDAK SEHAT)',
      severityColor: 'bg-orange-950/90 text-orange-300 border-orange-600',
      visibilityKm: 2.8,
      pm25Estimate: 78.4,
      aqiEstimate: 162,
      smokeSource: 'Terdeteksi kiriman asap Karhutla lintas batas dari perbatasan pesisir timur Sumatera Selatan via Selat Bangka',
      windCarrier: 'Angin Barat Daya (215°) dengan kecepatan 24 km/j membawa sebaran asap tebal',
      dispersionHeading: 'Asap bergerak melintasi Selat Bangka menuju Mentok, Simpang Teritip, dan lereng Bukit Menumbing',
      maskAdvice: 'Wajib Masker N95 / Kurangi Aktivitas Luar',
      healthRecommendations: [
        'Gunakan masker respirator N95 atau masker medis ganda saat berada di luar ruangan.',
        'Kelompok rentan (penderita asma, ISPA, lansia, dan balita) diimbau tetap di dalam rumah.',
        'Tutup jendela dan ventilasi rumah, hidupkan pembersih udara jika tersedia.',
        'Nakhoda kapal di Pelabuhan Tanjung Kalian dan nelayan Selat Bangka nyalakan lampu navigasi kabut (fog light).',
      ],
      aviationMarineImpact: 'Jarak pandang terbatas (2.8 km). Kecepatan jelajah kapal cepat Tanjung Kalian – Tanjung Api-Api diimbau diturunkan.',
      isTransboundaryThreat: true,
      type: 'asap_karhutla',
    };
  }

  // Real-time meteorological calculation
  const windDir = current.windDirection;
  const windSpeed = current.windSpeed;
  const temp = current.temperature;
  const humidity = current.relativeHumidity;
  const dewPoint = current.dewPoint ?? (temp - (100 - humidity) / 5);
  const dewPointSpread = Math.max(0, temp - dewPoint);

  const cardinal = getWindDirectionCardinal(windDir);

  // Determine wind heading (where the wind is blowing towards: windDir + 180 mod 360)
  const headingDeg = (windDir + 180) % 360;
  const headingCardinal = getWindDirectionCardinal(headingDeg);

  // Transboundary threat: wind coming from Sumatra / Selat Bangka (South to West: 170° - 270°)
  const isFromSumatra = windDir >= 170 && windDir <= 270;

  // Natural radiation fog (Kabut Embun Air) around Menumbing or early morning:
  const isHighHumidityFog = humidity >= 88 && dewPointSpread <= 2.5 && current.precipitation === 0;

  // Visibility calculation in km
  let visibilityKm = 10.0;
  if (current.visibility) {
    visibilityKm = Math.round((current.visibility / 1000) * 10) / 10;
  } else if (isHighHumidityFog) {
    visibilityKm = Math.max(1.5, Math.round((4.0 - (humidity - 88) * 0.25) * 10) / 10);
  } else if (isFromSumatra && temp >= 32 && humidity < 68) {
    // Potential dry haze / particulate concentration
    visibilityKm = Math.max(4.5, Math.round((8.5 - (temp - 30) * 0.8) * 10) / 10);
  }

  // PM2.5 and AQI estimates
  let pm25Estimate = 12.0;
  let aqiEstimate = 35;
  let severity: HazeSmokeStatus['severity'] = 'bersih';
  let severityLabel = 'UDARA BERSIH / JAUH DARI KABUT ASAP';
  let severityColor = 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';
  let maskAdvice: HazeSmokeStatus['maskAdvice'] = 'Tidak Perlu';
  let type: HazeSmokeStatus['type'] = 'atmosfer_jernih';

  if (isHighHumidityFog) {
    type = 'kabut_embun_radiasi';
    severity = 'waspada';
    severityLabel = 'KABUT AIR / EMBUN ALAMI (RADIASI OROGRAFIS)';
    severityColor = 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60';
    pm25Estimate = 18.5;
    aqiEstimate = 48;
    maskAdvice = 'Tidak Perlu';
  } else if (visibilityKm < 4.0 || (isFromSumatra && temp >= 33 && humidity < 60)) {
    type = 'asap_karhutla';
    severity = 'tidak_sehat';
    severityLabel = 'TERDETEKSI KABUT ASAP (TIDAK SEHAT)';
    severityColor = 'bg-orange-950/90 text-orange-300 border-orange-600';
    pm25Estimate = Math.round((55 + (10 - visibilityKm) * 6) * 10) / 10;
    aqiEstimate = Math.min(220, Math.round(pm25Estimate * 2.1));
    maskAdvice = 'Disarankan Masker Medis';
  } else if (visibilityKm < 7.0 || (isFromSumatra && windSpeed > 20)) {
    type = 'asap_karhutla';
    severity = 'waspada';
    severityLabel = 'KABUT ASAP RINGAN / HAZE (WASPADA)';
    severityColor = 'bg-yellow-950/80 text-yellow-300 border-yellow-600';
    pm25Estimate = 32.5;
    aqiEstimate = 75;
    maskAdvice = 'Disarankan Masker Medis';
  }

  if (visibilityKm < 2.5 && type === 'asap_karhutla') {
    severity = 'berbahaya';
    severityLabel = 'KABUT ASAP PEKAT (BERBAHAYA)';
    severityColor = 'bg-rose-950/90 text-rose-300 border-rose-600 animate-pulse';
    maskAdvice = 'Wajib Masker N95 / Kurangi Aktivitas Luar';
  }

  const smokeSource =
    type === 'asap_karhutla'
      ? `Terpantau hembusan partikulat asap dari arah ${cardinal.full} (${windDir}°). ${
          isFromSumatra ? 'Potensi asap lintas batas dari koridor Selat Bangka / pesisir timur Sumatera.' : 'Berasal dari pembakaran lokal / semak daratan.'
        }`
      : type === 'kabut_embun_radiasi'
      ? `Kondensasi uap air alami akibat kelembapan tinggi (${humidity}%) di sekitar ${location.name} dan lereng Bukit Menumbing.`
      : `Sirkulasi udara bersih maritim. Tidak terdeteksi konsentrasi asap Karhutla atau kabut tebal di wilayah ${location.name}.`;

  const windCarrier = `Angin berhembus dari ${cardinal.full} (${windDir}°) dengan laju ${windSpeed} km/j`;
  const dispersionHeading = `Massa udara mengalir menuju arah ${headingCardinal.full} (${headingDeg}°), melintasi daratan Bangka Barat`;

  const healthRecommendations =
    severity === 'tidak_sehat' || severity === 'berbahaya'
      ? [
          'Gunakan masker (N95 / medis) jika harus beraktivitas di ruang terbuka.',
          'Penderita asma, ISPA, lansia, dan balita diimbau tetap di dalam ruangan.',
          'Banyak minum air putih untuk menjaga hidrasi dan saluran pernapasan.',
          'Pengendara di jalur Mentok–Pangkalpinang kurangi kecepatan dan nyalakan lampu kabut.',
        ]
      : severity === 'waspada'
      ? [
          'Masyarakat yang sensitif terhadap debu atau polusi disarankan mengenakan masker.',
          'Waspadai penurunan jarak pandang di waktu pagi dan sore hari.',
          'Hindari membuka lahan perkebunan dengan cara membakar di Bangka Barat.',
        ]
      : [
          'Kualitas udara sangat baik untuk seluruh aktivitas luar ruangan dan olahraga.',
          'Sirkulasi angin segar dari laut Selat Bangka memberikan udara bersih alami.',
          'Tetap jaga kelestarian hutan konservasi Menumbing dari risiko kebakaran.',
        ];

  const aviationMarineImpact =
    visibilityKm < 5.0
      ? `Jarak pandang terbatas (${visibilityKm} km). Kapal ferry Tanjung Kalian wajib mengaktifkan radar maritim dan klakson kabut.`
      : `Jarak pandang baik (${visibilityKm} km). Jalur penyeberangan Selat Bangka dan penerbangan helikopter/drone beroperasi normal.`;

  return {
    severity,
    severityLabel,
    severityColor,
    visibilityKm,
    pm25Estimate,
    aqiEstimate,
    smokeSource,
    windCarrier,
    dispersionHeading,
    maskAdvice,
    healthRecommendations,
    aviationMarineImpact,
    isTransboundaryThreat: isFromSumatra && (severity === 'waspada' || severity === 'tidak_sehat'),
    type,
  };
}
