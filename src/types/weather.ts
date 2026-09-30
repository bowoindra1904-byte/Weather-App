/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WeatherLocation {
  name: string;
  district: string; // Kecamatan di Bangka Barat
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  timezone?: string;
  description?: string;
  isMaritime?: boolean;
}

export interface CurrentWeather {
  time: string;
  temperature: number;
  apparentTemperature: number;
  relativeHumidity: number;
  dewPoint: number;
  precipitation: number;
  rain: number;
  weatherCode: number;
  cloudCover: number;
  surfacePressure: number;
  windSpeed: number; // km/h
  windDirection: number; // degrees
  windGusts: number; // km/h
  uvIndex: number;
  visibility?: number; // meters
  isDay: boolean;
}

export interface HourlyForecastItem {
  time: string;
  temperature: number;
  relativeHumidity: number;
  precipitationProbability: number;
  precipitation: number;
  weatherCode: number;
  windSpeed: number;
  windDirection: number;
  cloudCover: number;
  cloudCoverLow: number;
  cloudCoverMid: number;
  cloudCoverHigh: number;
  surfacePressure: number;
  visibility: number; // meters
}

export interface DailyForecastItem {
  date: string;
  weatherCode: number;
  temperatureMax: number;
  temperatureMin: number;
  precipitationSum: number;
  precipitationProbabilityMax: number;
  windSpeedMax: number;
  windDirectionDominant: number;
  sunrise: string;
  sunset: string;
}

export interface CompleteWeatherData {
  location: WeatherLocation;
  current: CurrentWeather;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  lastUpdated: string;
}

export type VisualTheme = 'realistic' | 'cartoon' | 'futuristic';

export interface Simulation3DConfig {
  mode: 'atmosphere' | 'globe';
  theme: VisualTheme;
  showWindParticles: boolean;
  showClouds: boolean;
  showRain: boolean;
  showHumidityFog: boolean;
  showHazeSmokeLayer?: boolean;
  showSensorPedestal: boolean;
  animationSpeed: number; // 0.5, 1, 2
  windIntensity: number; // 0.2x to 3.0x multiplier
  cloudDensity: number; // 0.2x to 2.5x multiplier
  rainIntensity: number; // 0.2x to 2.5x multiplier
  activeHourIndex: number | null; // null = real-time current
}

export interface WeatherConditionInfo {
  code: number;
  label: string;
  description: string;
  iconName: string;
  category: 'clear' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'storm' | 'snow';
  severity: 'low' | 'moderate' | 'high' | 'severe';
}

export type ExtremeAlertType = 'thunderstorm' | 'gale' | 'flood' | 'heatwave';
export type SeverityLevel = 'waspada' | 'siaga' | 'awas';

export interface ExtremeAlert {
  id: string;
  type: ExtremeAlertType;
  title: string;
  severity: SeverityLevel;
  durationHours: number;
  estimatedEndTime: string;
  description: string;
  metricValue: string;
  recommendations: string[];
  impactAreas: string[];
  detectedAt: string;
}

export interface NotificationPreferences {
  thunderstorm: boolean;
  gale: boolean;
  flood: boolean;
  heatwave: boolean;
  soundEnabled: boolean;
}

export interface SpatialWeatherPoint {
  location: WeatherLocation;
  temperature: number;
  apparentTemperature: number;
  relativeHumidity: number;
  windSpeed: number;
  windDirection: number;
  cloudCover: number;
  precipitation: number;
  weatherCode: number;
  visibility?: number;
  isDay: boolean;
}

export interface HazeSmokeStatus {
  severity: 'bersih' | 'waspada' | 'tidak_sehat' | 'berbahaya';
  severityLabel: string;
  severityColor: string;
  visibilityKm: number;
  pm25Estimate: number; // µg/m³
  aqiEstimate: number; // ISPU / AQI index
  smokeSource: string;
  windCarrier: string;
  dispersionHeading: string;
  maskAdvice: 'Tidak Perlu' | 'Disarankan Masker Medis' | 'Wajib Masker N95 / Kurangi Aktivitas Luar';
  healthRecommendations: string[];
  aviationMarineImpact: string;
  isTransboundaryThreat: boolean;
  type: 'asap_karhutla' | 'kabut_embun_radiasi' | 'atmosfer_jernih';
}


