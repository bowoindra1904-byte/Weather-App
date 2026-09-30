/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { CurrentWeather, Simulation3DConfig } from '../types/weather';
import { atmosphereAudio } from '../services/audioAtmosphere';
import {
  Compass,
  Eye,
  Maximize2,
  Minimize2,
  RotateCcw,
  Wind,
  Cloud,
  CloudRain,
  Droplets,
  Zap,
  Sliders,
  Palette,
  Sparkles,
  Volume2,
  VolumeX,
  Sun,
  Moon
} from 'lucide-react';

interface Weather3DCanvasProps {
  currentWeather: CurrentWeather;
  locationName: string;
  districtName: string;
  latitude: number;
  longitude: number;
  config: Simulation3DConfig;
  onConfigChange: (newConfig: Partial<Simulation3DConfig>) => void;
  onOpenCustomizer?: () => void;
  isSimulatingHour?: boolean;
  simulationHourLabel?: string;
}

export const Weather3DCanvas: React.FC<Weather3DCanvasProps> = ({
  currentWeather,
  locationName,
  districtName,
  latitude,
  longitude,
  config,
  onConfigChange,
  onOpenCustomizer,
  isSimulatingHour = false,
  simulationHourLabel,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraPreset, setCameraPreset] = useState<'free' | 'wind' | 'clouds' | 'station'>('free');
  const [fps, setFps] = useState(60);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);

  const toggleAudio = () => {
    const next = !isAudioEnabled;
    setIsAudioEnabled(next);
    atmosphereAudio.setEnabled(next);
    if (next) {
      atmosphereAudio.updateAtmosphere(windSpeed, precipitation);
    }
  };

  // References to keep Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Animation objects refs
  const windParticlesRef = useRef<THREE.Points | null>(null);
  const windVelocitiesRef = useRef<Float32Array | null>(null);
  const cloudsGroupRef = useRef<THREE.Group | null>(null);
  const rainParticlesRef = useRef<THREE.Points | null>(null);
  const rainVelocitiesRef = useRef<Float32Array | null>(null);
  const humidityFogMeshRef = useRef<THREE.Mesh | null>(null);
  const anemometerCupsRef = useRef<THREE.Group | null>(null);
  const windVaneRef = useRef<THREE.Group | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const lightningLightRef = useRef<THREE.PointLight | null>(null);

  // Orbit control interaction state
  const isDraggingRef = useRef(false);
  const prevMousePos = useRef({ x: 0, y: 0 });
  const cameraSpherical = useRef({ radius: 24, theta: 0.8, phi: 1.1 });
  const cameraTarget = useRef(new THREE.Vector3(0, 3, 0));

  // Current weather values extracted for simulation
  const windSpeed = currentWeather.windSpeed; // km/h
  const windDirection = currentWeather.windDirection; // 0-360 deg
  const precipitation = currentWeather.precipitation; // mm
  const cloudCover = currentWeather.cloudCover; // 0-100%
  const humidity = currentWeather.relativeHumidity; // 0-100%
  const isThunderstorm = [95, 96, 99].includes(currentWeather.weatherCode);

  // Intensity factors
  const windMult = config.windIntensity || 1.0;
  const cloudMult = config.cloudDensity || 1.0;
  const rainMult = config.rainIntensity || 1.0;
  const theme = config.theme || 'realistic';

  // Convert wind direction (meteorological: coming FROM degree) to radians
  const windRad = (windDirection * Math.PI) / 180;
  // Direction vector towards which the wind is blowing
  const windDirX = -Math.sin(windRad);
  const windDirZ = -Math.cos(windRad);

  // Camera presets handler
  const setPreset = useCallback((preset: 'free' | 'wind' | 'clouds' | 'station') => {
    setCameraPreset(preset);
    if (preset === 'free') {
      cameraSpherical.current = { radius: 25, theta: 0.8, phi: 1.1 };
      cameraTarget.current.set(0, 3, 0);
    } else if (preset === 'wind') {
      cameraSpherical.current = { radius: 18, theta: windRad + Math.PI, phi: 1.4 };
      cameraTarget.current.set(0, 2, 0);
    } else if (preset === 'clouds') {
      cameraSpherical.current = { radius: 30, theta: 1.2, phi: 0.35 };
      cameraTarget.current.set(0, 8, 0);
    } else if (preset === 'station') {
      cameraSpherical.current = { radius: 9, theta: 0.4, phi: 1.3 };
      cameraTarget.current.set(0, 2.5, 0);
    }
  }, [windRad]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. SCENE SETUP WITH THEME-SPECIFIC BACKGROUNDS
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    let bgColor = 0x091322;
    let fogColor = 0x0f172a;
    let fogDensity = 0.015;

    if (theme === 'cartoon') {
      bgColor = currentWeather.isDay ? 0x60a5fa : 0x312e81; // Bright sky blue or stylized indigo
      fogColor = currentWeather.isDay ? 0x93c5fd : 0x1e1b4b;
      fogDensity = 0.008;
    } else if (theme === 'futuristic') {
      bgColor = 0x020617; // Deep cyberpunk obsidian
      fogColor = 0x030712;
      fogDensity = 0.018;
    } else {
      // Realistic
      bgColor = currentWeather.isDay ? 0x0a1628 : 0x030712;
      fogColor = currentWeather.isDay ? 0x0f1e36 : 0x020617;
      fogDensity = 0.014;
    }

    scene.background = new THREE.Color(bgColor);
    scene.fog = new THREE.FogExp2(fogColor, fogDensity);

    // 2. CAMERA SETUP
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.set(20, 16, 20);
    camera.lookAt(cameraTarget.current);

    // 3. RENDERER SETUP
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. LIGHTING SETUP
    let ambientIntensity = currentWeather.isDay ? 1.2 : 0.4;
    let sunIntensity = currentWeather.isDay ? 2.0 : 0.5;

    if (theme === 'cartoon') {
      ambientIntensity = 1.6; // Soft, high ambient for toon feel
      sunIntensity = 2.4;
    } else if (theme === 'futuristic') {
      ambientIntensity = 0.6; // High contrast for neon glow
      sunIntensity = 1.0;
    }

    const ambientLight = new THREE.AmbientLight(
      theme === 'futuristic' ? 0x06b6d4 : (theme === 'cartoon' ? 0xfef08a : 0x94a3b8),
      ambientIntensity
    );
    scene.add(ambientLight);

    const sunColor = theme === 'futuristic' ? 0x00f5ff : (theme === 'cartoon' ? 0xffedd5 : 0xfff7ed);
    const sunLight = new THREE.DirectionalLight(sunColor, sunIntensity);
    sunLight.position.set(30, 45, 20);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // Theme-based accent rim light
    const rimLightColor = theme === 'futuristic' ? 0xd946ef : (theme === 'cartoon' ? 0x38bdf8 : 0x0ea5e9);
    const rimLight = new THREE.DirectionalLight(rimLightColor, theme === 'futuristic' ? 1.5 : 0.8);
    rimLight.position.set(-20, 10, -20);
    scene.add(rimLight);

    // Lightning point light
    const lightning = new THREE.PointLight(theme === 'futuristic' ? 0x00ffff : 0xe0f2fe, 0, 140);
    lightning.position.set(0, 18, 0);
    scene.add(lightning);
    lightningLightRef.current = lightning;

    // -------------------------------------------------------------
    // BUILD SCENE: 1. GROUND & TELEMETRY PLATE
    // -------------------------------------------------------------
    const groundGroup = new THREE.Group();

    let groundBaseColor = 0x0a1120;
    let gridCenterColor = 0x0284c7;
    let gridLineColor = 0x1e293b;

    if (theme === 'cartoon') {
      groundBaseColor = 0x15803d; // Stylized lush green island ground
      gridCenterColor = 0x22c55e;
      gridLineColor = 0x166534;
    } else if (theme === 'futuristic') {
      groundBaseColor = 0x030712;
      gridCenterColor = 0xd946ef; // Magenta / Cyan laser grid
      gridLineColor = 0x0891b2;
    }

    const groundGeo = new THREE.CylinderGeometry(28, 28, 0.6, 64);
    const groundMat = new THREE.MeshStandardMaterial({
      color: groundBaseColor,
      roughness: theme === 'cartoon' ? 0.9 : 0.7,
      metalness: theme === 'futuristic' ? 0.8 : 0.3,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.y = -0.3;
    groundMesh.receiveShadow = true;
    groundGroup.add(groundMesh);

    // Radar / Coordinate Grid
    const gridHelper = new THREE.GridHelper(50, 25, gridCenterColor, gridLineColor);
    gridHelper.position.y = 0.02;
    groundGroup.add(gridHelper);

    // Concentric Range Rings
    const createRing = (radius: number, color: number) => {
      const ringGeo = new THREE.RingGeometry(radius - 0.08, radius + 0.08, 64);
      const ringMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.45 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.03;
      return ring;
    };

    const ringColor1 = theme === 'futuristic' ? 0x06b6d4 : 0x38bdf8;
    const ringColor2 = theme === 'futuristic' ? 0xd946ef : 0x0284c7;
    groundGroup.add(createRing(8, ringColor1));
    groundGroup.add(createRing(16, ringColor2));
    groundGroup.add(createRing(24, 0x0369a1));

    // Cardinal Markers on Ground
    const createMarker = (text: string, x: number, z: number, color: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = color;
        ctx.font = theme === 'cartoon' ? 'bold 60px "Plus Jakarta Sans", sans-serif' : 'bold 54px "Chakra Petch", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 64, 64);
      }
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.85 });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.set(x, 0.5, z);
      sprite.scale.set(2.5, 2.5, 1);
      return sprite;
    };

    groundGroup.add(createMarker('U (0°)', 0, -25.5, theme === 'futuristic' ? '#00f5ff' : '#38bdf8'));
    groundGroup.add(createMarker('S (180°)', 0, 25.5, '#94a3b8'));
    groundGroup.add(createMarker('T (90°)', 25.5, 0, '#94a3b8'));
    groundGroup.add(createMarker('B (270°)', -25.5, 0, '#94a3b8'));

    scene.add(groundGroup);

    // -------------------------------------------------------------
    // BUILD SCENE: 2. BANGKA BARAT SENSOR STATION PEDESTAL
    // -------------------------------------------------------------
    const stationGroup = new THREE.Group();
    stationGroup.position.set(0, 0, 0);

    const pedestalMat = new THREE.MeshStandardMaterial({
      color: theme === 'futuristic' ? 0x0f172a : (theme === 'cartoon' ? 0xf8fafc : 0x1e293b),
      metalness: theme === 'futuristic' ? 0.9 : 0.4,
      roughness: theme === 'cartoon' ? 0.8 : 0.3,
    });
    const pedestalGeo = new THREE.CylinderGeometry(0.8, 1.2, 0.5, 32);
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = 0.25;
    stationGroup.add(pedestal);

    // Glowing Neon Ring on Pedestal
    const ringGeo = new THREE.TorusGeometry(1.0, 0.05, 16, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: theme === 'futuristic' ? 0xd946ef : 0x00f5ff });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.35;
    stationGroup.add(ringMesh);

    // Mast
    const mastGeo = new THREE.CylinderGeometry(0.12, 0.16, 4.2, 16);
    const mastMat = new THREE.MeshStandardMaterial({
      color: theme === 'futuristic' ? 0x334155 : (theme === 'cartoon' ? 0x94a3b8 : 0x475569),
      metalness: 0.8,
      roughness: 0.2,
    });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.y = 2.4;
    stationGroup.add(mast);

    // Crossbar
    const crossGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.6, 12);
    const cross = new THREE.Mesh(crossGeo, mastMat);
    cross.rotation.z = Math.PI / 2;
    cross.position.y = 4.2;
    stationGroup.add(cross);

    // Anemometer (Left side of crossbar)
    const anemometerGroup = new THREE.Group();
    anemometerGroup.position.set(-0.7, 4.2, 0);

    const cupsGroup = new THREE.Group();
    for (let c = 0; c < 3; c++) {
      const angle = (c * 2 * Math.PI) / 3;
      const armGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.45, 8);
      const arm = new THREE.Mesh(armGeo, mastMat);
      arm.rotation.z = Math.PI / 2;
      arm.rotation.y = angle;
      arm.position.set((Math.cos(angle) * 0.45) / 2, 0.05, (Math.sin(angle) * 0.45) / 2);

      const cupGeo = new THREE.SphereGeometry(0.1, 16, 16, 0, Math.PI);
      const cupColor = theme === 'futuristic' ? 0x00f5ff : (theme === 'cartoon' ? 0xf59e0b : 0x38bdf8);
      const cupMat = new THREE.MeshStandardMaterial({ color: cupColor, roughness: 0.4 });
      const cup = new THREE.Mesh(cupGeo, cupMat);
      cup.rotation.y = angle - Math.PI / 2;
      cup.position.set(Math.cos(angle) * 0.45, 0.05, Math.sin(angle) * 0.45);

      cupsGroup.add(arm);
      cupsGroup.add(cup);
    }
    anemometerGroup.add(cupsGroup);
    anemometerCupsRef.current = cupsGroup;
    stationGroup.add(anemometerGroup);

    // Wind Vane (Right side of crossbar)
    const windVaneGroup = new THREE.Group();
    windVaneGroup.position.set(0.7, 4.2, 0);

    const vaneHeadGeo = new THREE.ConeGeometry(0.12, 0.4, 8);
    const vaneHeadColor = theme === 'futuristic' ? 0xd946ef : (theme === 'cartoon' ? 0xef4444 : 0x06b6d4);
    const vaneHeadMat = new THREE.MeshStandardMaterial({ color: vaneHeadColor, roughness: 0.3 });
    const vaneHead = new THREE.Mesh(vaneHeadGeo, vaneHeadMat);
    vaneHead.rotation.x = Math.PI / 2;
    vaneHead.position.z = 0.5;

    const vaneShaftGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8);
    const vaneShaft = new THREE.Mesh(vaneShaftGeo, mastMat);
    vaneShaft.rotation.x = Math.PI / 2;

    const vaneFinGeo = new THREE.BoxGeometry(0.02, 0.3, 0.35);
    const vaneFinMat = new THREE.MeshStandardMaterial({ color: theme === 'futuristic' ? 0x06b6d4 : 0x0284c7 });
    const vaneFin = new THREE.Mesh(vaneFinGeo, vaneFinMat);
    vaneFin.position.z = -0.4;

    const vaneAssembly = new THREE.Group();
    vaneAssembly.add(vaneHead);
    vaneAssembly.add(vaneShaft);
    vaneAssembly.add(vaneFin);
    windVaneGroup.add(vaneAssembly);
    windVaneRef.current = vaneAssembly;
    stationGroup.add(windVaneGroup);

    scene.add(stationGroup);

    // -------------------------------------------------------------
    // BUILD SCENE: 3. DYNAMIC 3D WIND STREAMLINES (WITH CUSTOM INTENSITY)
    // -------------------------------------------------------------
    const baseParticleCount = 1400;
    const windParticleCount = Math.round(baseParticleCount * Math.min(2.0, Math.max(0.4, windMult)));
    const windGeometry = new THREE.BufferGeometry();
    const windPositions = new Float32Array(windParticleCount * 3);
    const windColors = new Float32Array(windParticleCount * 3);
    const windVelocities = new Float32Array(windParticleCount * 3);

    // Color palettes by theme
    let colorA = new THREE.Color(0x38bdf8); // Cyan
    let colorB = new THREE.Color(0x2dd4bf); // Teal

    if (theme === 'cartoon') {
      colorA = new THREE.Color(0x38bdf8); // Bright sky
      colorB = new THREE.Color(0xf472b6); // Playful pink
    } else if (theme === 'futuristic') {
      colorA = new THREE.Color(0x00f5ff); // Laser cyan
      colorB = new THREE.Color(0xd946ef); // Neon magenta
    }

    const windBounds = { minX: -26, maxX: 26, minY: 0.5, maxY: 16, minZ: -26, maxZ: 26 };

    for (let i = 0; i < windParticleCount; i++) {
      const i3 = i * 3;
      windPositions[i3] = (Math.random() - 0.5) * 50;
      windPositions[i3 + 1] = Math.random() * (windBounds.maxY - windBounds.minY) + windBounds.minY;
      windPositions[i3 + 2] = (Math.random() - 0.5) * 50;

      windVelocities[i3] = (Math.random() * 0.4 + 0.8) * windMult;
      windVelocities[i3 + 1] = (Math.random() - 0.5) * 0.15;
      windVelocities[i3 + 2] = (Math.random() * 0.4 + 0.8) * windMult;

      const pColor = Math.random() > 0.5 ? colorA.clone() : colorB.clone();
      windColors[i3] = pColor.r;
      windColors[i3 + 1] = pColor.g;
      windColors[i3 + 2] = pColor.b;
    }

    windGeometry.setAttribute('position', new THREE.BufferAttribute(windPositions, 3));
    windGeometry.setAttribute('color', new THREE.BufferAttribute(windColors, 3));

    // Particle sprite
    const windCanvas = document.createElement('canvas');
    windCanvas.width = 64;
    windCanvas.height = 64;
    const wCtx = windCanvas.getContext('2d');
    if (wCtx) {
      const grad = wCtx.createRadialGradient(32, 32, 2, 32, 32, 30);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.4, theme === 'futuristic' ? 'rgba(0, 245, 255, 0.9)' : 'rgba(56, 189, 248, 0.8)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      wCtx.fillStyle = grad;
      wCtx.fillRect(0, 0, 64, 64);
    }
    const windTexture = new THREE.CanvasTexture(windCanvas);

    const windMaterial = new THREE.PointsMaterial({
      size: theme === 'cartoon' ? 1.0 : (theme === 'futuristic' ? 0.85 : 0.7),
      vertexColors: true,
      map: windTexture,
      transparent: true,
      opacity: theme === 'futuristic' ? 0.9 : 0.8,
      blending: theme === 'cartoon' ? THREE.NormalBlending : THREE.AdditiveBlending,
      depthWrite: false,
    });

    const windPoints = new THREE.Points(windGeometry, windMaterial);
    scene.add(windPoints);
    windParticlesRef.current = windPoints;
    windVelocitiesRef.current = windVelocities;

    // -------------------------------------------------------------
    // BUILD SCENE: 4. 3D RAIN CLOUDS (WITH CUSTOM DENSITY & THEME)
    // -------------------------------------------------------------
    const cloudsGroup = new THREE.Group();
    const isDarkRainCloud = precipitation > 0.5 || [61, 63, 65, 80, 81, 82, 95, 96, 99].includes(currentWeather.weatherCode);

    let cloudColorHex = isDarkRainCloud ? 0x273549 : (currentWeather.isDay ? 0xe2e8f0 : 0x475569);
    if (theme === 'cartoon') {
      cloudColorHex = isDarkRainCloud ? 0x475569 : 0xffffff; // Crisp fluffy white or cartoon storm gray
    } else if (theme === 'futuristic') {
      cloudColorHex = isDarkRainCloud ? 0x1e1b4b : 0x0f2744; // Cyber purple or dark neon blue
    }

    // Dynamic cloud count scaled by user cloudDensity multiplier
    const baseCloudCount = Math.max(4, Math.round((cloudCover / 100) * 16));
    const cloudCount = Math.round(baseCloudCount * cloudMult);

    for (let c = 0; c < cloudCount; c++) {
      const cluster = new THREE.Group();
      const cx = (Math.random() - 0.5) * 44;
      const cy = 11 + Math.random() * 4;
      const cz = (Math.random() - 0.5) * 44;
      cluster.position.set(cx, cy, cz);

      const puffCount = Math.round((7 + Math.floor(Math.random() * 5)) * Math.min(1.5, cloudMult));
      const puffMat = new THREE.MeshStandardMaterial({
        color: cloudColorHex,
        roughness: theme === 'cartoon' ? 0.4 : 0.95,
        metalness: theme === 'futuristic' ? 0.4 : 0.05,
        transparent: true,
        opacity: isDarkRainCloud ? 0.92 : 0.85,
        flatShading: theme === 'cartoon', // Cel-shaded flat shading
      });

      for (let p = 0; p < puffCount; p++) {
        const radius = (1.8 + Math.random() * 2.2) * Math.min(1.4, Math.max(0.6, cloudMult));
        const puffGeo = theme === 'cartoon' ? new THREE.DodecahedronGeometry(radius, 1) : new THREE.IcosahedronGeometry(radius, 2);
        const puffMesh = new THREE.Mesh(puffGeo, puffMat);
        puffMesh.position.set(
          (Math.random() - 0.5) * 5.0,
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 5.0
        );
        puffMesh.castShadow = true;
        cluster.add(puffMesh);
      }

      cloudsGroup.add(cluster);
    }

    scene.add(cloudsGroup);
    cloudsGroupRef.current = cloudsGroup;

    // -------------------------------------------------------------
    // BUILD SCENE: 5. 3D RAINDROPS & SPLASHES (WITH CUSTOM INTENSITY)
    // -------------------------------------------------------------
    const baseRainCount = precipitation > 0 ? Math.min(3000, Math.max(500, Math.round(precipitation * 600))) : 0;
    const rainCount = Math.round(baseRainCount * rainMult);

    if (rainCount > 0) {
      const rainGeo = new THREE.BufferGeometry();
      const rainPositions = new Float32Array(rainCount * 3);
      const rainVelocities = new Float32Array(rainCount * 3);

      for (let r = 0; r < rainCount; r++) {
        const r3 = r * 3;
        rainPositions[r3] = (Math.random() - 0.5) * 45;
        rainPositions[r3 + 1] = Math.random() * 14 + 1;
        rainPositions[r3 + 2] = (Math.random() - 0.5) * 45;

        rainVelocities[r3] = windDirX * (windSpeed * 0.02 * windMult);
        rainVelocities[r3 + 1] = -(Math.random() * 8 + 14) * Math.min(1.8, Math.max(0.6, rainMult));
        rainVelocities[r3 + 2] = windDirZ * (windSpeed * 0.02 * windMult);
      }

      rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));

      // Rain drop streak texture
      const rainCanvas = document.createElement('canvas');
      rainCanvas.width = 16;
      rainCanvas.height = 64;
      const rCtx = rainCanvas.getContext('2d');
      if (rCtx) {
        const rGrad = rCtx.createLinearGradient(8, 0, 8, 64);
        rGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        rGrad.addColorStop(0.3, theme === 'futuristic' ? 'rgba(0, 245, 255, 0.4)' : 'rgba(186, 230, 253, 0.4)');
        rGrad.addColorStop(1, theme === 'futuristic' ? 'rgba(217, 70, 239, 0.9)' : 'rgba(147, 197, 253, 0.9)');
        rCtx.fillStyle = rGrad;
        rCtx.fillRect(6, 0, 4, 64);
      }
      const rainTexture = new THREE.CanvasTexture(rainCanvas);

      const rainMat = new THREE.PointsMaterial({
        size: theme === 'cartoon' ? 1.2 : 0.9,
        map: rainTexture,
        transparent: true,
        opacity: 0.85,
        blending: theme === 'futuristic' ? THREE.AdditiveBlending : THREE.NormalBlending,
        depthWrite: false,
      });

      const rainPoints = new THREE.Points(rainGeo, rainMat);
      scene.add(rainPoints);
      rainParticlesRef.current = rainPoints;
      rainVelocitiesRef.current = rainVelocities;
    }

    // -------------------------------------------------------------
    // BUILD SCENE: 6. 3D HUMIDITY VAPOR LAYER
    // -------------------------------------------------------------
    const fogOpacity = Math.max(0.04, (humidity / 100) * 0.45);
    const humidityFogGeo = new THREE.CylinderGeometry(25, 25, 2.5, 32);
    const humidityFogMat = new THREE.MeshBasicMaterial({
      color: theme === 'futuristic' ? 0x0284c7 : (theme === 'cartoon' ? 0xbae6fd : 0x94a3b8),
      transparent: true,
      opacity: theme === 'futuristic' ? fogOpacity * 0.7 : fogOpacity,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const humidityFogMesh = new THREE.Mesh(humidityFogGeo, humidityFogMat);
    humidityFogMesh.position.y = 1.3;
    scene.add(humidityFogMesh);
    humidityFogMeshRef.current = humidityFogMesh;

    // -------------------------------------------------------------
    // BUILD SCENE: 7. 3D GLOBE MODE (WITH BANGKA BARAT PIN)
    // -------------------------------------------------------------
    const globeGroup = new THREE.Group();
    globeGroup.position.set(0, 6, 0);

    const globeGeo = new THREE.SphereGeometry(6, 64, 64);
    const globeCanvas = document.createElement('canvas');
    globeCanvas.width = 1024;
    globeCanvas.height = 512;
    const gCtx = globeCanvas.getContext('2d');
    if (gCtx) {
      gCtx.fillStyle = theme === 'futuristic' ? '#030712' : '#0a192f';
      gCtx.fillRect(0, 0, 1024, 512);

      gCtx.fillStyle = theme === 'futuristic' ? '#0891b2' : '#1e3a5f';
      gCtx.ellipse(650, 180, 140, 70, 0, 0, Math.PI * 2);
      gCtx.fill();

      // Bangka Belitung Archipelago Highlight
      gCtx.fillStyle = theme === 'futuristic' ? '#00f5ff' : '#10b981';
      gCtx.fillRect(720, 260, 90, 20);
      gCtx.fillRect(740, 285, 80, 15);
      // Pinpoint Bangka Island dot
      gCtx.fillStyle = '#f59e0b';
      gCtx.beginPath();
      gCtx.arc(735, 268, 8, 0, Math.PI * 2);
      gCtx.fill();
    }
    const globeTexture = new THREE.CanvasTexture(globeCanvas);

    const globeMat = new THREE.MeshStandardMaterial({
      map: globeTexture,
      roughness: 0.6,
      metalness: theme === 'futuristic' ? 0.7 : 0.1,
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globeMesh);

    // Glowing Halo
    const haloGeo = new THREE.SphereGeometry(6.4, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: theme === 'futuristic' ? 0xd946ef : 0x38bdf8,
      transparent: true,
      opacity: 0.22,
      side: THREE.BackSide,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    globeGroup.add(haloMesh);

    // Precise Pinpoint on Bangka Barat
    const pinGroup = new THREE.Group();
    const phi = (90 - latitude) * (Math.PI / 180);
    const theta = (longitude + 180) * (Math.PI / 180);
    const radiusR = 6.15;
    const pinX = -(radiusR * Math.sin(phi) * Math.cos(theta));
    const pinZ = radiusR * Math.sin(phi) * Math.sin(theta);
    const pinY = radiusR * Math.cos(phi);

    pinGroup.position.set(pinX, pinY, pinZ);
    pinGroup.lookAt(new THREE.Vector3(0, 0, 0));

    const pinMarkerGeo = new THREE.SphereGeometry(0.25, 16, 16);
    const pinMarkerMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const pinMarker = new THREE.Mesh(pinMarkerGeo, pinMarkerMat);
    pinGroup.add(pinMarker);

    const pinRingGeo = new THREE.RingGeometry(0.35, 0.48, 32);
    const pinRingMat = new THREE.MeshBasicMaterial({ color: 0x00f5ff, side: THREE.DoubleSide });
    const pinRing = new THREE.Mesh(pinRingGeo, pinRingMat);
    pinGroup.add(pinRing);

    globeGroup.add(pinGroup);
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // -------------------------------------------------------------
    // BUILD SCENE: 8. CELESTIAL SUN / MOON DISC IN 3D SKY DOME
    // -------------------------------------------------------------
    const celestialGroup = new THREE.Group();
    const celestialGeo = new THREE.SphereGeometry(1.8, 32, 32);
    const celestialColor = currentWeather.isDay ? 0xfffbeb : 0xe0e7ff;
    const celestialMat = new THREE.MeshBasicMaterial({ color: celestialColor });
    const celestialMesh = new THREE.Mesh(celestialGeo, celestialMat);

    const coronaGeo = new THREE.RingGeometry(1.9, 3.4, 32);
    const coronaColor = currentWeather.isDay
      ? theme === 'cartoon'
        ? 0xfbbf24
        : 0xfde047
      : theme === 'futuristic'
      ? 0xd946ef
      : 0x93c5fd;
    const coronaMat = new THREE.MeshBasicMaterial({
      color: coronaColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
    });
    const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    celestialGroup.add(celestialMesh);
    celestialGroup.add(coronaMesh);

    // Position high in the sky dome
    celestialGroup.position.set(28, 26, -20);
    celestialGroup.lookAt(0, 0, 0);
    scene.add(celestialGroup);

    // Visibility toggles
    const isAtmosphere = config.mode === 'atmosphere';
    groundGroup.visible = isAtmosphere;
    stationGroup.visible = isAtmosphere && config.showSensorPedestal;
    windPoints.visible = isAtmosphere && config.showWindParticles;
    cloudsGroup.visible = isAtmosphere && config.showClouds;
    if (rainParticlesRef.current) rainParticlesRef.current.visible = isAtmosphere && config.showRain;
    humidityFogMesh.visible = isAtmosphere && config.showHumidityFog;
    celestialGroup.visible = isAtmosphere;
    globeGroup.visible = !isAtmosphere;

    // -------------------------------------------------------------
    // ANIMATION & RENDER LOOP
    // -------------------------------------------------------------
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTimer = performance.now();
    let lightningTimer = 0;

    const animate = (time: number) => {
      animFrameId.current = requestAnimationFrame(animate);

      const delta = (time - lastTime) * 0.001;
      lastTime = time;

      frameCount++;
      if (time - fpsTimer >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        fpsTimer = time;
      }

      const speedMult = (config.animationSpeed || 1.0) * windMult;

      // Update Camera based on spherical coords
      const sc = cameraSpherical.current;
      camera.position.x = cameraTarget.current.x + sc.radius * Math.sin(sc.phi) * Math.sin(sc.theta);
      camera.position.y = cameraTarget.current.y + sc.radius * Math.cos(sc.phi);
      camera.position.z = cameraTarget.current.z + sc.radius * Math.sin(sc.phi) * Math.cos(sc.theta);
      camera.lookAt(cameraTarget.current);

      if (config.mode === 'atmosphere') {
        // 1. ANEMOMETER SPINNING PROPORTIONAL TO BANGKA BARAT WIND
        if (anemometerCupsRef.current) {
          const rotSpeed = Math.max(0.4, (windSpeed / 10) * 2.8) * speedMult * delta;
          anemometerCupsRef.current.rotation.y += rotSpeed;
        }

        // 2. WIND VANE SMOOTH ALIGNMENT
        if (windVaneRef.current) {
          const targetVaneRot = windRad + Math.PI;
          windVaneRef.current.rotation.y = THREE.MathUtils.lerp(
            windVaneRef.current.rotation.y,
            targetVaneRot,
            0.05
          );
        }

        // 3. 3D WIND STREAMLINES
        if (windParticlesRef.current && config.showWindParticles) {
          const positions = windParticlesRef.current.geometry.attributes.position.array as Float32Array;
          const velocities = windVelocitiesRef.current;
          const baseVelocity = Math.max(2.5, windSpeed * 0.45) * speedMult * delta;

          for (let i = 0; i < windParticleCount; i++) {
            const i3 = i * 3;
            const vMod = velocities ? velocities[i3] : 1.0;
            positions[i3] += windDirX * baseVelocity * vMod;
            positions[i3 + 2] += windDirZ * baseVelocity * vMod;

            if (positions[i3] > windBounds.maxX) positions[i3] = windBounds.minX;
            if (positions[i3] < windBounds.minX) positions[i3] = windBounds.maxX;
            if (positions[i3 + 2] > windBounds.maxZ) positions[i3 + 2] = windBounds.minZ;
            if (positions[i3 + 2] < windBounds.minZ) positions[i3 + 2] = windBounds.maxZ;
          }
          windParticlesRef.current.geometry.attributes.position.needsUpdate = true;
        }

        // 4. CLOUD DRIFT ALONG REAL WIND VECTOR
        if (cloudsGroupRef.current && config.showClouds) {
          const cloudDriftSpeed = Math.max(0.2, (windSpeed * 0.05)) * speedMult * delta;
          cloudsGroupRef.current.children.forEach((cluster) => {
            cluster.position.x += windDirX * cloudDriftSpeed;
            cluster.position.z += windDirZ * cloudDriftSpeed;

            if (cluster.position.x > 30) cluster.position.x = -30;
            if (cluster.position.x < -30) cluster.position.x = 30;
            if (cluster.position.z > 30) cluster.position.z = -30;
            if (cluster.position.z < -30) cluster.position.z = 30;
          });
        }

        // 5. RAINDROP PARTICLES WITH WIND DEFLECTION
        if (rainParticlesRef.current && config.showRain) {
          const rPos = rainParticlesRef.current.geometry.attributes.position.array as Float32Array;
          const rVel = rainVelocitiesRef.current;

          for (let r = 0; r < rainCount; r++) {
            const r3 = r * 3;
            rPos[r3 + 1] += (rVel ? rVel[r3 + 1] : -16) * speedMult * delta;
            rPos[r3] += windDirX * (windSpeed * 0.03) * speedMult * delta;
            rPos[r3 + 2] += windDirZ * (windSpeed * 0.03) * speedMult * delta;

            if (rPos[r3 + 1] <= 0.1) {
              rPos[r3 + 1] = 14 + Math.random() * 2;
              rPos[r3] = (Math.random() - 0.5) * 45;
              rPos[r3 + 2] = (Math.random() - 0.5) * 45;
            }
          }
          rainParticlesRef.current.geometry.attributes.position.needsUpdate = true;
        }

        // 6. HUMIDITY FOG ROTATION
        if (humidityFogMeshRef.current && config.showHumidityFog) {
          humidityFogMeshRef.current.rotation.y += 0.04 * speedMult * delta;
        }

        // 7. LIGHTNING FLASHES
        if (isThunderstorm && lightningLightRef.current) {
          lightningTimer += delta;
          if (lightningTimer > 3.0 + Math.random() * 4.0) {
            lightningLightRef.current.intensity = theme === 'futuristic' ? 22 : 16;
            lightningLightRef.current.position.set((Math.random() - 0.5) * 20, 16, (Math.random() - 0.5) * 20);
            if (isAudioEnabled) {
              atmosphereAudio.triggerThunder();
            }
            setTimeout(() => {
              if (lightningLightRef.current) lightningLightRef.current.intensity = 0;
            }, 80);
            setTimeout(() => {
              if (lightningLightRef.current) lightningLightRef.current.intensity = 10;
            }, 130);
            setTimeout(() => {
              if (lightningLightRef.current) lightningLightRef.current.intensity = 0;
            }, 200);
            lightningTimer = 0;
          }
        }
      } else {
        if (globeGroupRef.current) {
          globeGroupRef.current.rotation.y += 0.15 * speedMult * delta;
        }
      }

      renderer.render(scene, camera);
    };

    animFrameId.current = requestAnimationFrame(animate);

    // MOUSE & TOUCH LISTENERS
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - prevMousePos.current.x;
      const dy = e.clientY - prevMousePos.current.y;
      prevMousePos.current = { x: e.clientX, y: e.clientY };

      const rotSpeed = 0.006;
      cameraSpherical.current.theta -= dx * rotSpeed;
      cameraSpherical.current.phi = Math.max(0.15, Math.min(Math.PI / 2 - 0.05, cameraSpherical.current.phi - dy * rotSpeed));
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY * 0.02;
      const minRadius = config.mode === 'globe' ? 10 : 6;
      const maxRadius = config.mode === 'globe' ? 35 : 45;
      cameraSpherical.current.radius = Math.max(minRadius, Math.min(maxRadius, cameraSpherical.current.radius + zoomFactor));
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        prevMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - prevMousePos.current.x;
      const dy = e.touches[0].clientY - prevMousePos.current.y;
      prevMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

      const rotSpeed = 0.007;
      cameraSpherical.current.theta -= dx * rotSpeed;
      cameraSpherical.current.phi = Math.max(0.15, Math.min(Math.PI / 2 - 0.05, cameraSpherical.current.phi - dy * rotSpeed));
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('wheel', onWheel, { passive: false });
    domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      resizeObserver.disconnect();
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('wheel', onWheel);
      domElement.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      container.innerHTML = '';
    };
  }, [
    currentWeather,
    config.mode,
    config.theme,
    config.showWindParticles,
    config.showClouds,
    config.showRain,
    config.showHumidityFog,
    config.showSensorPedestal,
    config.animationSpeed,
    config.windIntensity,
    config.cloudDensity,
    config.rainIntensity,
    windMult,
    cloudMult,
    rainMult,
    theme,
    latitude,
    longitude,
  ]);

  const themeLabel =
    theme === 'realistic' ? 'Realistis' : theme === 'cartoon' ? 'Gaya Kartun' : 'Futuristik Cyber';

  return (
    <div
      className={`relative w-full overflow-hidden transition-all duration-300 rounded-3xl border border-slate-800/80 bg-slate-950/80 shadow-2xl ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'h-[480px] md:h-[560px]'
      }`}
    >
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing select-none" />

      {/* Top Left: Simulation Status & Telemetry Overlay */}
      <div className="absolute top-4 left-4 pointer-events-none flex flex-col gap-2 max-w-[280px]">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60 shadow-lg pointer-events-auto">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-semibold text-slate-200 font-display tracking-wider">
            {config.mode === 'atmosphere' ? 'ATMOSFER 3D' : 'RADAR GLOBE 3D'} · {themeLabel.toUpperCase()}
          </span>
          {isSimulatingHour && (
            <span className="text-[10px] font-mono font-semibold text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-700/60">
              {simulationHourLabel}
            </span>
          )}
        </div>

        {/* Live Vector Indicator Box for Bangka Barat */}
        <div className="p-3 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-800/90 shadow-xl space-y-2 pointer-events-auto">
          <div className="text-[11px] font-semibold text-cyan-300 border-b border-slate-800/80 pb-1.5 flex items-center justify-between">
            <span>{districtName}</span>
            <span className="font-mono text-slate-400 text-[10px]">BABAR</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-cyan-400" /> Vektor Angin
            </span>
            <span className="font-mono font-semibold text-cyan-300 tabular-nums">
              {windSpeed} km/j · {windDirection}°
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-teal-400" /> Kelembapan
            </span>
            <span className="font-mono font-semibold text-teal-300 tabular-nums">
              {humidity}% RH
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-blue-400" /> Tutupan Awan
            </span>
            <span className="font-mono font-semibold text-blue-300 tabular-nums">
              {cloudCover}% (×{cloudMult.toFixed(1)})
            </span>
          </div>

          {precipitation > 0 && (
            <div className="flex items-center justify-between text-xs border-t border-slate-800/80 pt-1.5">
              <span className="text-slate-400 flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-indigo-400" /> Curah Hujan
              </span>
              <span className="font-mono font-semibold text-indigo-300 tabular-nums">
                {precipitation} mm/jam
              </span>
            </div>
          )}

          {isThunderstorm && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-300 bg-amber-950/40 p-1.5 rounded border border-amber-800/40">
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
              <span>Aktivitas Petir Atmosfer Aktif</span>
            </div>
          )}
        </div>
      </div>

      {/* Top Right: Customization Drawer Trigger & View Modes */}
      <div className="absolute top-4 right-4 flex items-center gap-2 pointer-events-auto">
        {/* Procedural Ambient Sound Toggle */}
        <button
          onClick={toggleAudio}
          className={`p-2 rounded-xl backdrop-blur-md border transition-all shadow-lg ${
            isAudioEnabled
              ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
              : 'bg-slate-900/85 text-slate-400 border-slate-700/60 hover:text-slate-200'
          }`}
          title={isAudioEnabled ? 'Matikan Suara Atmosfer Real-Time' : 'Aktifkan Suara Atmosfer Real-Time (Angin & Hujan)'}
        >
          {isAudioEnabled ? <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Kustomisasi Tampilan 3D Button */}
        {onOpenCustomizer && (
          <button
            onClick={onOpenCustomizer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-950/90 to-blue-950/90 border border-cyan-500/40 text-cyan-300 hover:border-cyan-400 hover:text-white transition-all shadow-lg text-xs font-medium"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Kustomisasi 3D</span>
          </button>
        )}

        {/* Mode Selector */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60 shadow-lg">
          <button
            onClick={() => onConfigChange({ mode: 'atmosphere' })}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              config.mode === 'atmosphere'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Stasiun 3D
          </button>
          <button
            onClick={() => onConfigChange({ mode: 'globe' })}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              config.mode === 'globe'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Globe Babel
          </button>
        </div>

        {/* Fullscreen Button */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors shadow-lg"
          title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Bottom Center: Camera Presets & Layer Toggles */}
      <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 flex flex-wrap items-center justify-between md:justify-end gap-2 pointer-events-auto">
        {/* Camera Angles */}
        {config.mode === 'atmosphere' && (
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-800/90 shadow-lg">
            <span className="text-[11px] font-medium text-slate-400 px-2 flex items-center gap-1">
              <Eye className="w-3 h-3 text-cyan-400" /> Sudut:
            </span>
            <button
              onClick={() => setPreset('free')}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors whitespace-nowrap ${
                cameraPreset === 'free' ? 'bg-slate-700/80 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Bebas
            </button>
            <button
              onClick={() => setPreset('wind')}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors whitespace-nowrap ${
                cameraPreset === 'wind' ? 'bg-slate-700/80 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Aliran Angin
            </button>
            <button
              onClick={() => setPreset('clouds')}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors whitespace-nowrap ${
                cameraPreset === 'clouds' ? 'bg-slate-700/80 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Awan
            </button>
            <button
              onClick={() => setPreset('station')}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors whitespace-nowrap ${
                cameraPreset === 'station' ? 'bg-slate-700/80 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sensor
            </button>
          </div>
        )}

        {/* Layer Toggles */}
        {config.mode === 'atmosphere' && (
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-800/90 shadow-lg text-xs">
            <button
              onClick={() => onConfigChange({ showWindParticles: !config.showWindParticles })}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors ${
                config.showWindParticles ? 'text-cyan-300 bg-cyan-950/60 border border-cyan-800/50' : 'text-slate-500'
              }`}
            >
              <Wind className="w-3 h-3" /> Angin
            </button>
            <button
              onClick={() => onConfigChange({ showClouds: !config.showClouds })}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors ${
                config.showClouds ? 'text-blue-300 bg-blue-950/60 border border-blue-800/50' : 'text-slate-500'
              }`}
            >
              <Cloud className="w-3 h-3" /> Awan
            </button>
            <button
              onClick={() => onConfigChange({ showRain: !config.showRain })}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors ${
                config.showRain ? 'text-indigo-300 bg-indigo-950/60 border border-indigo-800/50' : 'text-slate-500'
              }`}
            >
              <CloudRain className="w-3 h-3" /> Hujan
            </button>
            <button
              onClick={() => onConfigChange({ showHumidityFog: !config.showHumidityFog })}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors ${
                config.showHumidityFog ? 'text-teal-300 bg-teal-950/60 border border-teal-800/50' : 'text-slate-500'
              }`}
            >
              <Droplets className="w-3 h-3" /> Uap
            </button>
          </div>
        )}
      </div>

      {/* Bottom Left Note */}
      <div className="absolute bottom-4 left-4 hidden lg:flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/70 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-800/60 pointer-events-none">
        <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
        <span>Drag untuk rotasi 360° · Scroll untuk zoom</span>
        <span className="font-mono text-slate-500 ml-2">FPS: {fps}</span>
      </div>
    </div>
  );
};
