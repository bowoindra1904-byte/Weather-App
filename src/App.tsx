/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CompleteWeatherData,
  CurrentWeather,
  ExtremeAlert,
  NotificationPreferences,
  Simulation3DConfig,
  SpatialWeatherPoint,
  WeatherLocation
} from './types/weather';
import {
  BANGKA_BARAT_DISTRICTS,
  detectExtremeWeather,
  fetchWeatherData,
  fetchBangkaBaratSpatialWeather,
  getWeatherCondition,
  getWindDirectionCardinal
} from './services/weatherApi';
import { Weather3DCanvas } from './components/Weather3DCanvas';
import { WindGauge } from './components/WindGauge';
import { HumidityCard } from './components/HumidityCard';
import { CloudRainRadar } from './components/CloudRainRadar';
import { HourlyTimeline } from './components/HourlyTimeline';
import { DailyForecast } from './components/DailyForecast';
import { ExtremeWeatherPanel } from './components/ExtremeWeatherPanel';
import { BangkaBaratDistrictSelector } from './components/BangkaBaratDistrictSelector';
import { BangkaBaratWeatherMap } from './components/BangkaBaratWeatherMap';
import { BangkaBaratComparisonTable } from './components/BangkaBaratComparisonTable';
import { CustomizationModal } from './components/CustomizationModal';
import { MaritimeRadarSection } from './components/MaritimeRadarSection';
import { AtmosphericDiagnosticsModal } from './components/AtmosphericDiagnosticsModal';
import { AtmosphericVerticalProfile } from './components/AtmosphericVerticalProfile';
import { HazeSmokeDetector } from './components/HazeSmokeDetector';
import { atmosphereAudio } from './services/audioAtmosphere';
import {
  MapPin,
  RefreshCw,
  Wind,
  Droplets,
  Cloud,
  Thermometer,
  Sun,
  ShieldCheck,
  Compass,
  Sliders,
  Sparkles,
  Radio,
  Clock,
  Anchor,
  Palette,
  Volume2,
  VolumeX,
  FileText,
  Layers,
  Waves
} from 'lucide-react';

export default function App() {
  // Default focused on Mentok (Muntok), Ibukota Kabupaten Bangka Barat
  const [selectedLocation, setSelectedLocation] = useState<WeatherLocation>(BANGKA_BARAT_DISTRICTS[0]);
  const [weatherData, setWeatherData] = useState<CompleteWeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState<boolean>(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(false);
  const [spatialData, setSpatialData] = useState<SpatialWeatherPoint[]>([]);
  const [nextRefreshSec, setNextRefreshSec] = useState<number>(60);
  const [isSimulatingExtremeDemo, setIsSimulatingExtremeDemo] = useState<boolean>(false);

  // 3D Canvas configuration state with Themes & Intensities
  const [simConfig, setSimConfig] = useState<Simulation3DConfig>({
    mode: 'atmosphere',
    theme: 'realistic',
    showWindParticles: true,
    showClouds: true,
    showRain: true,
    showHumidityFog: true,
    showSensorPedestal: true,
    animationSpeed: 1.0,
    windIntensity: 1.0,
    cloudDensity: 1.0,
    rainIntensity: 1.0,
    activeHourIndex: null,
  });

  // User Notification Preferences for Extreme Weather
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    thunderstorm: true,
    gale: true,
    flood: true,
    heatwave: true,
    soundEnabled: true,
  });

  // Fetch weather data for Bangka Barat
  const loadWeather = useCallback(async (loc: WeatherLocation) => {
    setIsLoading(true);
    setError(null);
    try {
      const [data, spatial] = await Promise.all([
        fetchWeatherData(loc.latitude, loc.longitude, loc.name, loc.district),
        fetchBangkaBaratSpatialWeather()
      ]);
      setWeatherData(data);
      setSpatialData(spatial);
      setNextRefreshSec(60);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data satelit cuaca Bangka Barat. Silakan periksa koneksi internet atau coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadWeather(selectedLocation);
  }, [selectedLocation, loadWeather]);

  // Real-time automatic countdown timer (60s on-time refresh)
  useEffect(() => {
    const timer = setInterval(() => {
      setNextRefreshSec((prev) => {
        if (prev <= 1) {
          loadWeather(selectedLocation);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedLocation, loadWeather]);

  const handleConfigChange = (newConfig: Partial<Simulation3DConfig>) => {
    setSimConfig((prev) => ({ ...prev, ...newConfig }));
  };

  const handleUpdatePreferences = (newPrefs: Partial<NotificationPreferences>) => {
    setNotificationPrefs((prev) => ({ ...prev, ...newPrefs }));
  };

  // Derive active weather state for 3D simulation
  const effectiveWeather: CurrentWeather | null = useMemo(() => {
    if (!weatherData) return null;
    if (simConfig.activeHourIndex === null) {
      return weatherData.current;
    }
    const targetHourly = weatherData.hourly[simConfig.activeHourIndex];
    if (!targetHourly) return weatherData.current;

    return {
      ...weatherData.current,
      temperature: targetHourly.temperature,
      relativeHumidity: targetHourly.relativeHumidity,
      precipitation: targetHourly.precipitation,
      rain: targetHourly.precipitation,
      weatherCode: targetHourly.weatherCode,
      cloudCover: targetHourly.cloudCover,
      windSpeed: targetHourly.windSpeed,
      windDirection: targetHourly.windDirection,
      surfacePressure: targetHourly.surfacePressure,
      dewPoint: Math.round((targetHourly.temperature - (100 - targetHourly.relativeHumidity) / 5) * 10) / 10,
    };
  }, [weatherData, simConfig.activeHourIndex]);

  const toggleAudio = () => {
    const nextState = !isAudioEnabled;
    setIsAudioEnabled(nextState);
    atmosphereAudio.setEnabled(nextState);
    if (nextState && effectiveWeather) {
      atmosphereAudio.updateAtmosphere(
        effectiveWeather.windSpeed,
        effectiveWeather.rain || effectiveWeather.precipitation
      );
    }
  };

  // Modulate atmospheric soundscape based on live meteorological telemetry
  useEffect(() => {
    if (isAudioEnabled && effectiveWeather) {
      atmosphereAudio.updateAtmosphere(
        effectiveWeather.windSpeed,
        effectiveWeather.rain || effectiveWeather.precipitation
      );
      if ([95, 96, 99].includes(effectiveWeather.weatherCode) || isSimulatingExtremeDemo) {
        atmosphereAudio.triggerThunder();
      }
    }
  }, [effectiveWeather, isAudioEnabled, isSimulatingExtremeDemo]);

  // Extreme Weather Detection Logic (or Demo Mode)
  const detectedAlerts: ExtremeAlert[] = useMemo(() => {
    if (!weatherData || !effectiveWeather) return [];

    if (isSimulatingExtremeDemo) {
      // Demo alerts showcasing all 4 hazardous conditions in Bangka Barat
      return [
        {
          id: 'demo-alert-thunderstorm',
          type: 'thunderstorm',
          title: 'Peringatan Dini Badai Petir Tropis & Kilat',
          severity: 'awas',
          durationHours: 3,
          estimatedEndTime: '17:30 WIB',
          description: `Massa awan konvektif kumulonimbus aktif melintas di atas ${selectedLocation.name}. Terdeteksi muatan listrik atmosfer tinggi dan lonjakan kilat di sekitar lereng Bukit Menumbing.`,
          metricValue: '18 mm/jam · 95% tutupan awan kumulonimbus',
          recommendations: [
            'Segera berlindung di dalam bangunan tertutup berpenangkal petir.',
            'Jauhi ruang terbuka, tiang antena, dan pohon tinggi di lereng Bukit Menumbing.',
            'Nelayan di perairan Selat Bangka segera kembali ke dermaga terdekat.',
          ],
          impactAreas: [selectedLocation.name, 'Kawasan Hutan Konservasi Menumbing', 'Pesisir Selat Bangka'],
          detectedAt: '14:30 WIB',
        },
        {
          id: 'demo-alert-gale',
          type: 'gale',
          title: 'Peringatan Angin Kencang & Gelombang Selat Bangka',
          severity: 'siaga',
          durationHours: 4,
          estimatedEndTime: '18:30 WIB',
          description: `Hembusan angin barat daya mencapai 48 km/jam dengan hembusan puncak 62 km/jam di wilayah ${selectedLocation.name}. Berpotensi menimbulkan gelombang laut 2.0 - 3.5 meter di Selat Bangka.`,
          metricValue: 'Kecepatan 48 km/jam · Gust 62 km/jam',
          recommendations: [
            'Operator penyeberangan kapal ferry di Pelabuhan Tanjung Kalian waspadai ombak tinggi.',
            'Nelayan perahu kecil di Tempilang & Mentok tunda aktivitas melaut.',
            'Waspadai dahan pohon patah di jalur lintas Mentok-Pangkalpinang.',
          ],
          impactAreas: ['Pelabuhan Tanjung Kalian', 'Pesisir Mentok', 'Pantai Pasir Kuning Tempilang'],
          detectedAt: '14:30 WIB',
        },
        {
          id: 'demo-alert-flood',
          type: 'flood',
          title: 'Peringatan Potensi Genangan & Luapan Sungai Mentok',
          severity: 'siaga',
          durationHours: 5,
          estimatedEndTime: '19:30 WIB',
          description: `Akumulasi presipitasi curah hujan intensitas lebat berpotensi memicu luapan debit air pada aliran drainase utama dan sungai dataran rendah di sekitar ${selectedLocation.name}.`,
          metricValue: 'Curah Hujan 22 mm/jam · Akumulasi 45 mm',
          recommendations: [
            'Waspadai luapan air di Kampung Ulu, Pasar Mentok, dan cekungan rendah Tempilang.',
            'Amankan arsip dan instalasi listrik ke tempat yang lebih tinggi.',
          ],
          impactAreas: ['Kampung Ulu Mentok', 'Bantaran Sungai Mentok', 'Kawasan Jebus Hilir'],
          detectedAt: '14:30 WIB',
        },
        {
          id: 'demo-alert-heatwave',
          type: 'heatwave',
          title: 'Peringatan Indeks Panas Ekstrem Tropis',
          severity: 'waspada',
          durationHours: 4,
          estimatedEndTime: '16:00 WIB',
          description: `Indeks panas semu (Heat Index) terukur tinggi pada siang hari akibat kombinasi suhu 34°C dan kelembapan 78% di daratan Bangka Barat.`,
          metricValue: 'Suhu Semu: 39°C · Indeks UV 9 (Sangat Tinggi)',
          recommendations: [
            'Hindari aktivitas berat di bawah terik matahari terbuka antara jam 11:00-14:00 WIB.',
            'Pekerja tambang dan perkebunan sawit perbanyak konsumsi air putih.',
          ],
          impactAreas: ['Perkebunan Rakyat Parittiga', 'Area Terbuka Kelapa'],
          detectedAt: '12:00 WIB',
        },
      ];
    }

    return detectExtremeWeather(effectiveWeather, weatherData.hourly, selectedLocation.name);
  }, [weatherData, effectiveWeather, isSimulatingExtremeDemo, selectedLocation.name]);

  const currentCondition = weatherData ? getWeatherCondition(weatherData.current.weatherCode) : null;
  const currentHourlyItem = weatherData?.hourly[0];
  const windCardinal = weatherData ? getWindDirectionCardinal(weatherData.current.windDirection) : null;
  const windHeadingDeg = weatherData ? (weatherData.current.windDirection + 180) % 360 : 0;
  const windHeadingCardinal = weatherData ? getWindDirectionCardinal(windHeadingDeg) : null;

  const simulationLabel = simConfig.activeHourIndex !== null && weatherData?.hourly[simConfig.activeHourIndex]
    ? `Simulasi Jam ${new Date(weatherData.hourly[simConfig.activeHourIndex].time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
    : undefined;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP BAR CONTRACT (Strict 3-zone architecture)               */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 py-3.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Zone 1: Single text wordmark */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Compass className="w-4 h-4 text-white animate-spin-slow" />
            </div>
            <a href="/" className="text-lg font-bold tracking-tight text-white font-display">
              ATMOSFERA <span className="text-cyan-400">BANGKA BARAT</span>
            </a>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 text-xs font-medium text-slate-400">
            <a href="#peringatan-ekstrem" className="hover:text-rose-400 transition-colors">
              Peringatan Dini
            </a>
            <a href="#peta-spasial" className="hover:text-cyan-300 transition-colors">
              Peta Spasial
            </a>
            <a href="#matriks-komparasi" className="hover:text-cyan-300 transition-colors">
              Matriks Komparasi
            </a>
            <a href="#viewport-3d" className="hover:text-cyan-300 transition-colors">
              Kanvas 3D
            </a>
            <a href="#radar-maritim" className="hover:text-cyan-300 transition-colors">
              Radar Maritim
            </a>
            <a href="#profil-vertikal" className="hover:text-cyan-300 transition-colors">
              Profil Vertikal
            </a>
            <a href="#kabut-asap" className="hover:text-amber-400 transition-colors">
              Kabut Asap & Angin
            </a>
            <a href="#dinamika-angin" className="hover:text-cyan-300 transition-colors">
              Dinamika Angin
            </a>
            <a href="#prakiraan" className="hover:text-cyan-300 transition-colors">
              Prakiraan 24 Jam
            </a>
          </nav>

          {/* Zone 3: Primary Actions (Customization, Audio & Auto-Sync) */}
          <div className="flex items-center gap-2">
            {/* Audio Ambient Synthesizer Button */}
            <button
              onClick={toggleAudio}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
                isAudioEnabled
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title={
                isAudioEnabled
                  ? 'Matikan Suara Atmosfer Web Audio'
                  : 'Aktifkan Suara Atmosfer Real-Time (Angin & Hujan)'
              }
            >
              {isAudioEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{isAudioEnabled ? 'Audio Live' : 'Audio Suasana'}</span>
            </button>

            {/* Official Diagnostic Bulletin Button */}
            {weatherData && (
              <button
                onClick={() => setIsDiagnosticsOpen(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-indigo-300 bg-indigo-950/60 border border-indigo-700/60 rounded-xl hover:bg-indigo-900/80 transition-all shadow-sm"
                title="Buka Buletin Diagnostik Meteorologi Bangka Barat (Cetak / PDF)"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Buletin Resmi</span>
              </button>
            )}

            {/* Customization Button */}
            <button
              onClick={() => setIsCustomizerOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-cyan-300 bg-cyan-950/60 border border-cyan-700/60 rounded-xl hover:bg-cyan-900/80 transition-all shadow-sm"
              title="Kustomisasi tema 3D & pengatur animasi"
            >
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Tema 3D ({simConfig.theme})</span>
            </button>

            {/* Refresh countdown button */}
            <button
              onClick={() => loadWeather(selectedLocation)}
              disabled={isLoading}
              title="Perbarui data cuaca satelit sekarang"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 hover:text-cyan-300 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline-block tabular-nums">{nextRefreshSec}s</span>
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONTAINER                                                */}
      {/* ------------------------------------------------------------- */}
      <main className="grow max-w-7xl mx-auto w-full px-4 md:px-8 py-6 space-y-6">
        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => loadWeather(selectedLocation)}
              className="px-3 py-1 bg-rose-800 hover:bg-rose-700 rounded-lg text-white font-medium"
            >
              Coba Ulang
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* HERO SECTION: Bangka Barat Focus Overview Card                */}
        {/* ------------------------------------------------------------- */}
        {weatherData && (
          <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl shadow-2xl">
            {/* Ambient atmospheric backdrop */}
            <div
              className="absolute inset-0 opacity-15 bg-cover bg-center pointer-events-none"
              style={{
                backgroundImage: 'url(/src/assets/images/atmosphere_sky_backdrop_1790774415594.jpg)',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Left Column: Location, Current Weather, Temp */}
              <div className="space-y-3">
                {/* Metadata without pills (Frontend design rule) */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className="text-cyan-400 font-semibold flex items-center gap-1">
                    {selectedLocation.isMaritime ? <Anchor className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                    {selectedLocation.name}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-slate-300">{selectedLocation.district}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {selectedLocation.latitude.toFixed(4)}°LS, {selectedLocation.longitude.toFixed(4)}°BT
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    Pembaruan: {weatherData.lastUpdated} WIB
                  </span>
                </div>

                {/* Big Temperature & Condition */}
                <div className="flex flex-wrap items-baseline gap-4">
                  <div className="flex items-baseline">
                    <span className="text-5xl sm:text-6xl font-bold font-mono tracking-tighter text-white tabular-nums">
                      {weatherData.current.temperature}
                    </span>
                    <span className="text-3xl font-light text-cyan-400 ml-1">°C</span>
                  </div>

                  <div className="border-l border-slate-700/80 pl-4 space-y-0.5">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-100 font-display">
                      {currentCondition?.label}
                    </h2>
                    <p className="text-xs text-slate-400 max-w-lg">
                      {currentCondition?.description}. Aliran angin bertiup dari{' '}
                      <strong className="text-cyan-300 font-mono font-medium">
                        {windCardinal?.full} ({weatherData.current.windDirection}°)
                      </strong>{' '}
                      menuju{' '}
                      <strong className="text-slate-200 font-mono">
                        {windHeadingCardinal?.full} ({windHeadingDeg}°)
                      </strong>
                      , dengan suhu terasa seperti{' '}
                      <strong className="text-slate-200 font-mono">
                        {weatherData.current.apparentTemperature}°C
                      </strong>
                      .
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Key Met-Metric Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 lg:w-auto w-full">
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/90 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Wind className="w-3 h-3 text-cyan-400" /> Arah Angin
                    </span>
                    <span className="font-mono text-cyan-400 text-[10px] font-bold">
                      {windCardinal?.short} ({weatherData.current.windDirection}°)
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-base font-bold font-mono text-cyan-300 tabular-nums">
                      {weatherData.current.windSpeed}{' '}
                      <span className="text-xs font-normal text-slate-400">km/j</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Ke {windHeadingCardinal?.short}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/90 flex flex-col justify-between">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-teal-400" /> Kelembapan
                  </span>
                  <span className="text-base font-bold font-mono text-teal-300 mt-1 tabular-nums">
                    {weatherData.current.relativeHumidity}
                    <span className="text-xs font-normal text-slate-400">%</span>
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/90 flex flex-col justify-between">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Cloud className="w-3 h-3 text-blue-400" /> Awan
                  </span>
                  <span className="text-base font-bold font-mono text-blue-300 mt-1 tabular-nums">
                    {weatherData.current.cloudCover}
                    <span className="text-xs font-normal text-slate-400">%</span>
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/90 flex flex-col justify-between">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Sun className="w-3 h-3 text-amber-400" /> Indeks UV
                  </span>
                  <span className="text-base font-bold font-mono text-amber-300 mt-1 tabular-nums">
                    {weatherData.current.uvIndex}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 2. BANGKA BARAT DISTRICT SELECTOR                             */}
        {/* ------------------------------------------------------------- */}
        <section id="distrik-babar">
          <BangkaBaratDistrictSelector
            currentLocation={selectedLocation}
            onSelectDistrict={(loc) => {
              setSelectedLocation(loc);
              handleConfigChange({ activeHourIndex: null });
            }}
          />
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 2B. LEAFLET SPATIAL WEATHER MAP (BANGKA BARAT)                */}
        {/* ------------------------------------------------------------- */}
        <section id="peta-spasial">
          <BangkaBaratWeatherMap
            selectedLocation={selectedLocation}
            onSelectDistrict={(loc) => {
              setSelectedLocation(loc);
              handleConfigChange({ activeHourIndex: null });
            }}
          />
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 2C. DISTRICT COMPARISON MATRIX TABLE                          */}
        {/* ------------------------------------------------------------- */}
        {spatialData.length > 0 && (
          <section id="matriks-komparasi">
            <BangkaBaratComparisonTable
              spatialData={spatialData}
              selectedLocation={selectedLocation}
              onSelectLocation={(loc) => {
                setSelectedLocation(loc);
                handleConfigChange({ activeHourIndex: null });
              }}
            />
          </section>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 3. EXTREME WEATHER WARNING & EARLY DETECTION SYSTEM           */}
        {/* ------------------------------------------------------------- */}
        <section id="peringatan-ekstrem">
          <ExtremeWeatherPanel
            alerts={detectedAlerts}
            locationName={selectedLocation.name}
            preferences={notificationPrefs}
            onUpdatePreferences={handleUpdatePreferences}
            isSimulatingExtremeDemo={isSimulatingExtremeDemo}
            onToggleExtremeDemo={() => setIsSimulatingExtremeDemo(!isSimulatingExtremeDemo)}
          />
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 4. THE 3D INTERACTIVE ATMOSPHERE & CUSTOMIZABLE VIEWPORT      */}
        {/* ------------------------------------------------------------- */}
        <section id="viewport-3d" className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-100 font-display flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                SIMULASI 3D ATMOSFER {selectedLocation.name.toUpperCase()}
              </h2>
              <p className="text-xs text-slate-400">
                Gaya visual:{' '}
                <strong className="text-cyan-300">
                  {simConfig.theme === 'realistic'
                    ? 'Realistis (Alami)'
                    : simConfig.theme === 'cartoon'
                    ? 'Gaya Kartun (Cel-Shaded)'
                    : 'Futuristik Cyber (Hologram)'}
                </strong>{' '}
                · Vektor angin: {(simConfig.windIntensity || 1.0).toFixed(1)}x · Kepadatan awan:{' '}
                {Math.round((simConfig.cloudDensity || 1.0) * 100)}%
              </p>
            </div>

            <button
              onClick={() => setIsCustomizerOpen(true)}
              className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Buka Kustomisasi 3D</span>
            </button>
          </div>

          {effectiveWeather ? (
            <Weather3DCanvas
              currentWeather={effectiveWeather}
              locationName={selectedLocation.name}
              districtName={selectedLocation.district}
              latitude={selectedLocation.latitude}
              longitude={selectedLocation.longitude}
              config={simConfig}
              onConfigChange={handleConfigChange}
              onOpenCustomizer={() => setIsCustomizerOpen(true)}
              isSimulatingHour={simConfig.activeHourIndex !== null}
              simulationHourLabel={simulationLabel}
            />
          ) : (
            <div className="h-[480px] rounded-3xl bg-slate-900/60 border border-slate-800 flex items-center justify-center text-slate-400 text-xs">
              Memuat visualisasi 3D Bangka Barat...
            </div>
          )}
        </section>

        {/* ------------------------------------------------------------- */}
        {/* 4B. MARITIME & COASTAL RADAR (SELAT BANGKA & TANJUNG KALIAN)   */}
        {/* ------------------------------------------------------------- */}
        {weatherData && (
          <section id="radar-maritim">
            <MaritimeRadarSection current={weatherData.current} location={selectedLocation} />
          </section>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 4C. ATMOSPHERIC VERTICAL SOUNDING PROFILE (TROPOSFER BANGKA)   */}
        {/* ------------------------------------------------------------- */}
        {effectiveWeather && (
          <section id="profil-vertikal">
            <AtmosphericVerticalProfile current={effectiveWeather} location={selectedLocation} />
          </section>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 4D. PENDETEKSI KABUT ASAP & DISPERSI ANGIN BANGKA BARAT       */}
        {/* ------------------------------------------------------------- */}
        {effectiveWeather && (
          <section id="kabut-asap">
            <HazeSmokeDetector current={effectiveWeather} location={selectedLocation} />
          </section>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 5. PRIMARY METEOROLOGICAL TELEMETRY SENSORS                   */}
        {/* ------------------------------------------------------------- */}
        {weatherData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <section id="dinamika-angin">
              <WindGauge current={weatherData.current} />
            </section>

            <section id="kelembapan">
              <HumidityCard current={weatherData.current} />
            </section>

            <section id="massa-awan">
              <CloudRainRadar current={weatherData.current} currentHourly={currentHourlyItem} />
            </section>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 6. 24-HOUR INTERACTIVE TIMELINE & SIMULATION SCRUBBER         */}
        {/* ------------------------------------------------------------- */}
        {weatherData && (
          <section id="prakiraan">
            <HourlyTimeline
              hourly={weatherData.hourly}
              activeHourIndex={simConfig.activeHourIndex}
              onSelectHour={(idx) => handleConfigChange({ activeHourIndex: idx })}
            />
          </section>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 7. 7-DAY OUTLOOK IN BANGKA BARAT                             */}
        {/* ------------------------------------------------------------- */}
        {weatherData && (
          <section id="prospek-7hari">
            <DailyForecast daily={weatherData.daily} />
          </section>
        )}
      </main>

      {/* ------------------------------------------------------------- */}
      {/* FOOTER                                                        */}
      {/* ------------------------------------------------------------- */}
      <footer className="mt-12 border-t border-slate-800/80 bg-slate-950 px-4 md:px-8 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300 font-display">ATMOSFERA BANGKA BARAT 3D</span>
            <span aria-hidden="true">·</span>
            <span>Kabupaten Bangka Barat, Kepulauan Bangka Belitung</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Pelabuhan Tanjung Kalian & Selat Bangka</span>
            <span aria-hidden="true">·</span>
            <span>Bukit Menumbing</span>
            <span aria-hidden="true">·</span>
            <span>Sensor Satelit On-Time</span>
          </div>
        </div>
      </footer>

      {/* 3D Customization Modal */}
      <CustomizationModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        config={simConfig}
        onUpdateConfig={handleConfigChange}
      />

      {/* Official Atmospheric Diagnostics Bulletin Modal */}
      {weatherData && (
        <AtmosphericDiagnosticsModal
          isOpen={isDiagnosticsOpen}
          onClose={() => setIsDiagnosticsOpen(false)}
          weatherData={weatherData}
        />
      )}
    </div>
  );
}
