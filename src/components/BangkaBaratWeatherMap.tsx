/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { SpatialWeatherPoint, WeatherLocation } from '../types/weather';
import { fetchBangkaBaratSpatialWeather, getWeatherCondition, getWindDirectionCardinal } from '../services/weatherApi';
import {
  MapPin,
  Layers,
  Wind,
  Droplets,
  CloudRain,
  Thermometer,
  RotateCcw,
  Sparkles,
  Radio,
  Eye,
  Anchor,
  Compass,
  Maximize2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Crosshair,
  X,
  Info,
  Flame
} from 'lucide-react';

interface BangkaBaratWeatherMapProps {
  selectedLocation: WeatherLocation;
  onSelectDistrict: (location: WeatherLocation) => void;
}

export type MapOverlayMode = 'temp' | 'wind' | 'rain' | 'humidity' | 'haze';
export type BasemapType = 'dark' | 'satellite' | 'streets';

interface InspectedCoordinate {
  lat: number;
  lng: number;
  nearestName: string;
  nearestDistrict: string;
  distanceKm: number;
  temp: number;
  windSpeed: number;
  humidity: number;
  elevationEst: number;
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const BangkaBaratWeatherMap: React.FC<BangkaBaratWeatherMapProps> = ({
  selectedLocation,
  onSelectDistrict,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const zonesLayerRef = useRef<L.LayerGroup | null>(null);
  const inspectorLayerRef = useRef<L.LayerGroup | null>(null);
  const radarLayerRef = useRef<L.LayerGroup | null>(null);

  const [spatialData, setSpatialData] = useState<SpatialWeatherPoint[]>([]);
  const [isLoadingSpatial, setIsLoadingSpatial] = useState<boolean>(true);
  const [overlayMode, setOverlayMode] = useState<MapOverlayMode>('temp');
  const [basemap, setBasemap] = useState<BasemapType>('dark');
  const [isFullscreenMap, setIsFullscreenMap] = useState<boolean>(false);
  const [inspectedCoord, setInspectedCoord] = useState<InspectedCoordinate | null>(null);
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const [isRadarScanActive, setIsRadarScanActive] = useState<boolean>(false);

  // Center coordinate of Kabupaten Bangka Barat
  const BABAR_CENTER: [number, number] = [-1.90, 105.45];
  const BABAR_BOUNDS: L.LatLngBoundsLiteral = [
    [-2.25, 105.00], // Southwest (Selat Bangka / Tempilang)
    [-1.55, 105.85], // Northeast (Parittiga / Kelabat / Kelapa)
  ];

  // Fetch live spatial data for all 7 points
  useEffect(() => {
    let isMounted = true;
    const loadSpatial = async () => {
      setIsLoadingSpatial(true);
      const points = await fetchBangkaBaratSpatialWeather();
      if (isMounted) {
        setSpatialData(points);
        setIsLoadingSpatial(false);
      }
    };
    loadSpatial();

    // Auto refresh spatial data every 90 seconds
    const interval = setInterval(loadSpatial, 90000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const map = L.map(mapContainerRef.current, {
      center: BABAR_CENTER,
      zoom: 10,
      minZoom: 9,
      maxZoom: 15,
      zoomControl: false,
      attributionControl: false,
      maxBounds: [
        [-2.5, 104.6],
        [-1.3, 106.2],
      ],
      maxBoundsViscosity: 0.8,
    });

    mapInstanceRef.current = map;

    // Zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Layers
    const zonesGroup = L.layerGroup().addTo(map);
    const markersGroup = L.layerGroup().addTo(map);
    const inspectorGroup = L.layerGroup().addTo(map);
    const radarGroup = L.layerGroup().addTo(map);
    zonesLayerRef.current = zonesGroup;
    markersLayerRef.current = markersGroup;
    inspectorLayerRef.current = inspectorGroup;
    radarLayerRef.current = radarGroup;

    map.fitBounds(BABAR_BOUNDS, { padding: [20, 20] });

    // Click on map to inspect coordinate
    map.on('click', (e: L.LeafletMouseEvent) => {
      const clickedLat = Math.round(e.latlng.lat * 10000) / 10000;
      const clickedLng = Math.round(e.latlng.lng * 10000) / 10000;

      // Find nearest station from spatialData
      setSpatialData((currentData) => {
        if (currentData.length === 0) return currentData;

        let nearest = currentData[0];
        let minDist = 99999;

        currentData.forEach((pt) => {
          const d = getDistanceKm(clickedLat, clickedLng, pt.location.latitude, pt.location.longitude);
          if (d < minDist) {
            minDist = d;
            nearest = pt;
          }
        });

        // Approximate elevation (Bukit Menumbing peak ~ -1.86, 105.17)
        const distToMenumbing = getDistanceKm(clickedLat, clickedLng, -1.862, 105.171);
        let elevationEst = 25;
        if (distToMenumbing < 3.5) {
          elevationEst = Math.round(445 - distToMenumbing * 95);
        } else if (distToMenumbing < 7) {
          elevationEst = Math.round(150 - distToMenumbing * 12);
        }

        const interpolatedTemp = Math.round((nearest.temperature - (elevationEst / 100) * 0.65) * 10) / 10;

        setInspectedCoord({
          lat: clickedLat,
          lng: clickedLng,
          nearestName: nearest.location.name,
          nearestDistrict: nearest.location.district,
          distanceKm: minDist,
          temp: interpolatedTemp,
          windSpeed: nearest.windSpeed,
          humidity: nearest.relativeHumidity,
          elevationEst: Math.max(5, elevationEst),
        });

        return currentData;
      });
    });

    // Handle container resize
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Invalidate map size on fullscreen toggle
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 200);
    }
  }, [isFullscreenMap]);

  // 2. Update Basemap Tiles
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    let subdomains = 'abcd';
    let maxZoom = 19;

    if (basemap === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      subdomains = '';
      maxZoom = 18;
    } else if (basemap === 'streets') {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      subdomains = 'abc';
      maxZoom = 19;
    }

    const newTileLayer = L.tileLayer(url, {
      subdomains,
      maxZoom,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO / Esri',
    });

    newTileLayer.addTo(map);
    tileLayerRef.current = newTileLayer;
  }, [basemap]);

  // 3. Render Custom Spatial Weather Markers & Thematic Zones
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    const zonesGroup = zonesLayerRef.current;
    if (!map || !markersGroup || !zonesGroup || spatialData.length === 0) return;

    markersGroup.clearLayers();
    zonesGroup.clearLayers();

    spatialData.forEach((point) => {
      const isSelected = selectedLocation.name === point.location.name;
      const cardinal = getWindDirectionCardinal(point.windDirection);
      const condition = getWeatherCondition(point.weatherCode);

      // Value to highlight on badge according to overlayMode
      let badgeContent = '';
      let badgeColorClass = 'text-cyan-300 border-cyan-500/50 bg-slate-950/90';
      let haloColor = '#06b6d4';

      if (overlayMode === 'temp') {
        badgeContent = `${point.temperature}°C`;
        haloColor = point.temperature >= 32 ? '#f59e0b' : '#38bdf8';
        badgeColorClass =
          point.temperature >= 32
            ? 'text-amber-300 border-amber-500/70 bg-slate-950/90'
            : 'text-cyan-300 border-cyan-500/60 bg-slate-950/90';
      } else if (overlayMode === 'wind') {
        badgeContent = `${point.windSpeed} km/j`;
        haloColor = point.windSpeed >= 25 ? '#f43f5e' : '#2dd4bf';
        badgeColorClass =
          point.windSpeed >= 25
            ? 'text-rose-300 border-rose-500/80 bg-slate-950/90'
            : 'text-teal-300 border-teal-500/60 bg-slate-950/90';
      } else if (overlayMode === 'rain') {
        badgeContent = point.precipitation > 0 ? `${point.precipitation} mm` : `${point.cloudCover}% awan`;
        haloColor = point.precipitation > 0 ? '#6366f1' : '#38bdf8';
        badgeColorClass =
          point.precipitation > 0
            ? 'text-indigo-300 border-indigo-500/80 bg-slate-950/90'
            : 'text-blue-300 border-blue-500/60 bg-slate-950/90';
      } else if (overlayMode === 'humidity') {
        badgeContent = `${point.relativeHumidity}% RH`;
        haloColor = point.relativeHumidity >= 85 ? '#ec4899' : '#14b8a6';
        badgeColorClass =
          point.relativeHumidity >= 85
            ? 'text-pink-300 border-pink-500/80 bg-slate-950/90'
            : 'text-teal-300 border-teal-500/60 bg-slate-950/90';
      } else if (overlayMode === 'haze') {
        const vis = point.visibility ? Math.round(point.visibility / 1000) : (point.relativeHumidity > 88 ? 4.5 : 10.0);
        badgeContent = `${vis} km visibilitas`;
        haloColor = vis < 5 ? '#f97316' : '#10b981';
        badgeColorClass =
          vis < 5
            ? 'text-orange-300 border-orange-500/80 bg-slate-950/90'
            : 'text-emerald-300 border-emerald-500/60 bg-slate-950/90';
      }

      // 3A. Atmospheric Radius Circle zone
      const circleRadius = point.location.isMaritime ? 7000 : 5500;
      const zoneCircle = L.circle([point.location.latitude, point.location.longitude], {
        radius: circleRadius,
        color: haloColor,
        fillColor: haloColor,
        fillOpacity: isSelected ? 0.22 : 0.08,
        weight: isSelected ? 2 : 1,
        dashArray: isSelected ? undefined : '4, 6',
      });
      zonesGroup.addLayer(zoneCircle);

      // 3B. HTML DivIcon Pin
      const pulseHtml = isSelected
        ? `<div class="absolute -inset-2 rounded-2xl bg-cyan-400/30 animate-ping pointer-events-none"></div>`
        : '';

      const windArrowHtml = `
        <div class="inline-block transform transition-transform" style="transform: rotate(${point.windDirection}deg)">
          <svg class="w-3 h-3 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="19" x2="12" y2="5"></line>
            <polyline points="5 12 12 5 19 12"></polyline>
          </svg>
        </div>
      `;

      const markerHtml = `
        <div class="relative group cursor-pointer select-none">
          ${pulseHtml}
          <div class="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-200 ${badgeColorClass} ${
        isSelected ? 'ring-2 ring-cyan-400 scale-110 shadow-[0_0_20px_rgba(6,182,212,0.5)]' : 'hover:scale-105'
      }">
            <div class="flex items-center gap-1">
              ${windArrowHtml}
              <span class="font-mono font-bold text-xs tabular-nums">${badgeContent}</span>
            </div>
            <span class="text-[10px] font-semibold text-slate-200 border-l border-slate-700/80 pl-1.5 max-w-[85px] truncate">
              ${point.location.name}
            </span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-weather-pin',
        html: markerHtml,
        iconSize: [140, 36],
        iconAnchor: [70, 18],
        popupAnchor: [0, -22],
      });

      const marker = L.marker([point.location.latitude, point.location.longitude], { icon: customIcon });

      // Custom Rich Popup
      const popupHtml = `
        <div class="p-3 text-slate-100 bg-slate-900 rounded-2xl border border-slate-700 min-w-[220px] font-sans shadow-2xl">
          <div class="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <div>
              <h4 class="text-xs font-bold text-cyan-300 font-display">${point.location.name}</h4>
              <p class="text-[10px] text-slate-400">${point.location.district}</p>
            </div>
            <span class="text-[10px] font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-slate-300">
              ${point.location.latitude.toFixed(2)}°, ${point.location.longitude.toFixed(2)}°
            </span>
          </div>

          <div class="my-2.5 space-y-1.5 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Kondisi:</span>
              <span class="font-semibold text-slate-200">${condition.label}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Suhu Udara:</span>
              <span class="font-mono font-bold text-slate-100">${point.temperature}°C (Terasa ${point.apparentTemperature}°C)</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Angin:</span>
              <span class="font-mono text-cyan-300 font-semibold">${point.windSpeed} km/j · ${cardinal.short} (${point.windDirection}°)</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Kelembapan:</span>
              <span class="font-mono text-teal-300 font-semibold">${point.relativeHumidity}% RH</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Tutupan Awan:</span>
              <span class="font-mono text-blue-300">${point.cloudCover}%</span>
            </div>
            ${
              point.precipitation > 0
                ? `<div class="flex items-center justify-between text-indigo-300 border-t border-slate-800 pt-1">
                    <span>Curah Hujan:</span>
                    <span class="font-mono font-bold">${point.precipitation} mm/jam</span>
                  </div>`
                : ''
            }
          </div>

          <div class="pt-2 border-t border-slate-800 flex justify-center">
            <button id="btn-select-${point.location.latitude}" class="w-full py-1.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] transition-colors shadow-md text-center">
              Fokuskan Simulasi 3D ke Sini
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'weather-leaflet-popup',
        maxWidth: 280,
      });

      marker.on('click', () => {
        onSelectDistrict(point.location);
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-select-${point.location.latitude}`);
        if (btn) {
          btn.onclick = () => {
            onSelectDistrict(point.location);
            map.closePopup();
          };
        }
      });

      markersGroup.addLayer(marker);
    });
  }, [spatialData, selectedLocation, overlayMode, onSelectDistrict]);

  // Center on active district when selected from outside
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo([selectedLocation.latitude, selectedLocation.longitude], 11, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [selectedLocation]);

  // Render Inspected Coordinate Pin
  useEffect(() => {
    const inspectorGroup = inspectorLayerRef.current;
    if (!inspectorGroup) return;

    inspectorGroup.clearLayers();

    if (!inspectedCoord) return;

    const crosshairHtml = `
      <div class="relative flex items-center justify-center pointer-events-none">
        <div class="absolute -inset-2.5 rounded-full bg-amber-400/40 animate-ping"></div>
        <div class="w-7 h-7 rounded-full border-2 border-amber-400 bg-slate-950/95 flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.8)]">
          <div class="w-2 h-2 rounded-full bg-amber-400"></div>
        </div>
      </div>
    `;

    const icon = L.divIcon({
      className: 'crosshair-pin',
      html: crosshairHtml,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const marker = L.marker([inspectedCoord.lat, inspectedCoord.lng], { icon });
    inspectorGroup.addLayer(marker);
  }, [inspectedCoord]);

  const handleResetBounds = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.fitBounds(BABAR_BOUNDS, { padding: [30, 30] });
  };

  // Spatial Statistics across Bangka Barat
  const spatialStats = useMemo(() => {
    if (spatialData.length === 0) return null;

    let hottest = spatialData[0];
    let coolest = spatialData[0];
    let windiest = spatialData[0];
    let sumHumidity = 0;

    spatialData.forEach((p) => {
      if (p.temperature > hottest.temperature) hottest = p;
      if (p.temperature < coolest.temperature) coolest = p;
      if (p.windSpeed > windiest.windSpeed) windiest = p;
      sumHumidity += p.relativeHumidity;
    });

    const avgHumidity = Math.round(sumHumidity / spatialData.length);

    return {
      hottest,
      coolest,
      windiest,
      avgHumidity,
    };
  }, [spatialData]);

  // Render Doppler Radar Layer
  useEffect(() => {
    const radarGroup = radarLayerRef.current;
    if (!radarGroup) return;

    radarGroup.clearLayers();

    if (!isRadarScanActive) return;

    const radarCenter: [number, number] = [-1.862, 105.171]; // Mentok Doppler Station

    // 1. Concentric Range Rings (25km, 50km, 75km)
    [25000, 50000, 75000].forEach((radius) => {
      const ring = L.circle(radarCenter, {
        radius,
        color: '#10b981',
        weight: 1,
        fill: false,
        dashArray: '4, 8',
        opacity: 0.6,
      });
      radarGroup.addLayer(ring);
    });

    // 2. Crosshair azimuth lines
    const lineN = L.polyline([radarCenter, [-1.15, 105.171]], { color: '#10b981', weight: 1, opacity: 0.35, dashArray: '3, 6' });
    const lineS = L.polyline([radarCenter, [-2.45, 105.171]], { color: '#10b981', weight: 1, opacity: 0.35, dashArray: '3, 6' });
    const lineE = L.polyline([radarCenter, [-1.862, 105.95]], { color: '#10b981', weight: 1, opacity: 0.35, dashArray: '3, 6' });
    const lineW = L.polyline([radarCenter, [-1.862, 104.50]], { color: '#10b981', weight: 1, opacity: 0.35, dashArray: '3, 6' });
    radarGroup.addLayer(lineN);
    radarGroup.addLayer(lineS);
    radarGroup.addLayer(lineE);
    radarGroup.addLayer(lineW);

    // 3. Radar Center Beacon Marker
    const radarBeaconHtml = `
      <div class="relative flex items-center justify-center pointer-events-none">
        <div class="absolute -inset-2.5 rounded-full bg-emerald-500/40 animate-ping"></div>
        <div class="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.9)]">
          <div class="w-2 h-2 rounded-full bg-white"></div>
        </div>
      </div>
    `;
    const beaconIcon = L.divIcon({
      className: 'radar-beacon',
      html: radarBeaconHtml,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
    const beaconMarker = L.marker(radarCenter, { icon: beaconIcon });
    radarGroup.addLayer(beaconMarker);
  }, [isRadarScanActive]);

  return (
    <div
      className={`relative w-full rounded-3xl border border-slate-800/80 bg-slate-950/80 shadow-2xl overflow-hidden transition-all duration-300 flex flex-col ${
        isFullscreenMap ? 'fixed inset-0 z-50 rounded-none border-none' : 'h-[520px] md:h-[600px]'
      }`}
    >
      {/* Top Overlay Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-[400] flex flex-wrap items-center justify-between gap-2.5 pointer-events-none">
        {/* Left: Map Title & Live Indicator */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-xl pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <div>
            <h3 className="text-xs font-bold text-slate-100 font-display flex items-center gap-1.5">
              PETA DISTRIBUSI SPASIAL BANGKA BARAT
            </h3>
            <p className="text-[10px] text-slate-400">
              7 Titik Pemantauan Cuaca · Selat Bangka & Daratan
            </p>
          </div>
        </div>

        {/* Center: Thematic Overlay Mode Selector */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-xl pointer-events-auto">
          <button
            onClick={() => setOverlayMode('temp')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              overlayMode === 'temp'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
            <span>Suhu</span>
          </button>

          <button
            onClick={() => setOverlayMode('wind')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              overlayMode === 'wind'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wind className="w-3.5 h-3.5 text-teal-400" />
            <span>Angin</span>
          </button>

          <button
            onClick={() => setOverlayMode('rain')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              overlayMode === 'rain'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5 text-indigo-400" />
            <span>Awan & Hujan</span>
          </button>

          <button
            onClick={() => setOverlayMode('humidity')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              overlayMode === 'humidity'
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Droplets className="w-3.5 h-3.5 text-pink-400" />
            <span>Kelembapan</span>
          </button>

          <button
            onClick={() => setOverlayMode('haze')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              overlayMode === 'haze'
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>Kabut Asap</span>
          </button>
        </div>

        {/* Right: Basemap Selector & Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Doppler Radar Sweep Toggle */}
          <button
            onClick={() => setIsRadarScanActive(!isRadarScanActive)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-2xl backdrop-blur-md border shadow-xl transition-all ${
              isRadarScanActive
                ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/70 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:text-emerald-400'
            }`}
            title="Aktifkan simulasi pemindaian radar cuaca Doppler Bangka Barat"
          >
            <Radio className={`w-3.5 h-3.5 ${isRadarScanActive ? 'text-emerald-400 animate-spin-slow' : 'text-slate-400'}`} />
            <span>Radar Doppler</span>
          </button>

          {/* Basemap Switcher */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-xl">
            <button
              onClick={() => setBasemap('dark')}
              className={`px-2.5 py-1 text-xs rounded-xl font-medium transition-colors ${
                basemap === 'dark' ? 'bg-slate-700 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Gelap
            </button>
            <button
              onClick={() => setBasemap('satellite')}
              className={`px-2.5 py-1 text-xs rounded-xl font-medium transition-colors ${
                basemap === 'satellite' ? 'bg-slate-700 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Satelit
            </button>
            <button
              onClick={() => setBasemap('streets')}
              className={`px-2.5 py-1 text-xs rounded-xl font-medium transition-colors ${
                basemap === 'streets' ? 'bg-slate-700 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Jalan
            </button>
          </div>

          {/* Reset Zoom */}
          <button
            onClick={handleResetBounds}
            className="p-2 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-slate-300 hover:text-cyan-400 transition-colors shadow-xl"
            title="Reset ke tampilan seluruh Bangka Barat"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={() => setIsFullscreenMap(!isFullscreenMap)}
            className="p-2 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-slate-300 hover:text-cyan-400 transition-colors shadow-xl"
            title={isFullscreenMap ? 'Keluar Layar Penuh Peta' : 'Layar Penuh Peta'}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Leaflet Map DOM Container */}
      <div ref={mapContainerRef} className="w-full grow z-10 bg-slate-950" />

      {/* Doppler Radar Status Indicator */}
      {isRadarScanActive && (
        <div className="absolute top-20 right-4 z-[400] max-w-xs rounded-2xl bg-slate-900/95 border border-emerald-500/60 p-3 shadow-2xl backdrop-blur-md text-xs space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-1.5 text-emerald-300 font-bold font-display">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-spin-slow" />
            <span>RADAR DOPPLER MENTOK AKTIF</span>
          </div>
          <p className="text-[10px] text-slate-400">
            Jangkauan radius pemindaian: 75 km · Stasiun Menumbing
          </p>
          <div className="space-y-1 pt-1 border-t border-slate-800">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Skala Reflektivitas:</span>
              <span className="font-mono text-emerald-300 font-bold">15 - 55 dBZ</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-rose-600" />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>Gerimis</span>
              <span>Hujan Sedang</span>
              <span>Intensitas Lebat</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Coordinate Inspector Card */}
      {inspectedCoord && (
        <div className="absolute bottom-16 left-4 z-[400] max-w-sm rounded-2xl bg-slate-900/95 border border-amber-500/50 p-3.5 shadow-2xl backdrop-blur-md space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5">
              <Crosshair className="w-4 h-4 text-amber-400 animate-spin-slow" />
              <span className="text-xs font-bold text-amber-300 font-display">
                INSPEKTUR KOORDINAT SPASIAL
              </span>
            </div>
            <button
              onClick={() => setInspectedCoord(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              title="Tutup inspeksi"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-xs space-y-1 text-slate-300">
            <div className="flex justify-between font-mono">
              <span className="text-slate-400">Koordinat:</span>
              <span className="text-slate-100 font-bold">
                {inspectedCoord.lat.toFixed(4)}°LS, {inspectedCoord.lng.toFixed(4)}°BT
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Stasiun Terdekat:</span>
              <span className="text-cyan-300 font-medium">
                {inspectedCoord.distanceKm} km ({inspectedCoord.nearestName})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Estimasi Elevasi:</span>
              <span className="text-emerald-300 font-mono font-medium">
                ~{inspectedCoord.elevationEst} meter dpl
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-800/80 pt-1">
              <span className="text-slate-400">Estimasi Mikro-Klimat:</span>
              <span className="text-amber-300 font-mono font-bold">
                {inspectedCoord.temp}°C · {inspectedCoord.windSpeed} km/j · {inspectedCoord.humidity}% RH
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Legend Overlay */}
      {showLegend && (
        <div className="absolute bottom-16 right-4 z-[400] rounded-2xl bg-slate-900/90 border border-slate-800 p-2.5 shadow-xl backdrop-blur-md text-[11px] space-y-1.5 hidden sm:block">
          <div className="flex items-center justify-between gap-3 text-slate-400 font-medium">
            <span>Legenda: {overlayMode === 'temp' ? 'Suhu' : overlayMode === 'wind' ? 'Kecepatan Angin' : overlayMode === 'rain' ? 'Awan & Hujan' : 'Kelembapan'}</span>
            <button
              onClick={() => setShowLegend(false)}
              className="text-slate-500 hover:text-slate-300"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          {overlayMode === 'temp' && (
            <div className="space-y-1">
              <div className="h-2 w-36 rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 via-amber-400 to-rose-500" />
              <div className="flex justify-between text-[9px] font-mono text-slate-400">
                <span>&lt;27°C (Sejuk)</span>
                <span>30°C</span>
                <span>&gt;33°C (Panas)</span>
              </div>
            </div>
          )}
          {overlayMode === 'wind' && (
            <div className="space-y-1">
              <div className="h-2 w-36 rounded-full bg-gradient-to-r from-teal-400 via-amber-400 to-rose-500" />
              <div className="flex justify-between text-[9px] font-mono text-slate-400">
                <span>&lt;10 km/j</span>
                <span>25 km/j</span>
                <span>&gt;40 km/j (Kencang)</span>
              </div>
            </div>
          )}
          {overlayMode === 'rain' && (
            <div className="space-y-1">
              <div className="h-2 w-36 rounded-full bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-600" />
              <div className="flex justify-between text-[9px] font-mono text-slate-400">
                <span>Cerah / Berawan</span>
                <span>Hujan Ringan</span>
                <span>Hujan Lebat</span>
              </div>
            </div>
          )}
          {overlayMode === 'humidity' && (
            <div className="space-y-1">
              <div className="h-2 w-36 rounded-full bg-gradient-to-r from-teal-400 via-blue-400 to-pink-500" />
              <div className="flex justify-between text-[9px] font-mono text-slate-400">
                <span>&lt;60% (Kering)</span>
                <span>75% (Nyaman)</span>
                <span>&gt;85% (Lembap)</span>
              </div>
            </div>
          )}
          {overlayMode === 'haze' && (
            <div className="space-y-1">
              <div className="h-2 w-36 rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400" />
              <div className="flex justify-between text-[9px] font-mono text-slate-400">
                <span>&lt;3 km (Pekat)</span>
                <span>6 km (Sedang)</span>
                <span>10 km (Jernih)</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Spatial Summary Telemetry Ticker at Bottom */}
      {spatialStats && (
        <div className="relative z-20 border-t border-slate-800 bg-slate-950/95 backdrop-blur-md px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Titik Terpanas:</span>
              <strong className="text-amber-400 font-mono">
                {spatialStats.hottest.location.name} ({spatialStats.hottest.temperature}°C)
              </strong>
            </div>

            <span className="text-slate-700 hidden sm:inline">·</span>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Titik Tersejuk:</span>
              <strong className="text-cyan-300 font-mono">
                {spatialStats.coolest.location.name} ({spatialStats.coolest.temperature}°C)
              </strong>
            </div>

            <span className="text-slate-700 hidden sm:inline">·</span>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Angin Paling Kencang:</span>
              <strong className="text-teal-300 font-mono">
                {spatialStats.windiest.location.name} ({spatialStats.windiest.windSpeed} km/j)
              </strong>
            </div>

            <span className="text-slate-700 hidden md:inline">·</span>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Rerata Kelembapan:</span>
              <strong className="text-slate-200 font-mono">{spatialStats.avgHumidity}% RH</strong>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Klik titik marker untuk memfokuskan sensor & 3D canvas</span>
          </div>
        </div>
      )}
    </div>
  );
};
