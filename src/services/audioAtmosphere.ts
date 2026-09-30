/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AtmosphereAudioEngine {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = false;
  private volume: number = 0.35;

  // Audio Nodes
  private masterGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private rainGain: GainNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;

  // Noise generator sources
  private windSource: AudioBufferSourceNode | null = null;
  private rainSource: AudioBufferSourceNode | null = null;

  private initContext() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isEnabled ? this.volume : 0;
      this.masterGain.connect(this.ctx.destination);

      // Create procedural noise buffer (2 seconds loop)
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1; // White noise
      }

      // 1. Wind Channel
      this.windFilter = this.ctx.createBiquadFilter();
      this.windFilter.type = 'lowpass';
      this.windFilter.frequency.value = 280;
      this.windFilter.Q.value = 2.5;

      this.windGain = this.ctx.createGain();
      this.windGain.gain.value = 0.25;

      this.windSource = this.ctx.createBufferSource();
      this.windSource.buffer = noiseBuffer;
      this.windSource.loop = true;
      this.windSource.connect(this.windFilter);
      this.windFilter.connect(this.windGain);
      this.windGain.connect(this.masterGain);
      this.windSource.start();

      // 2. Rain Channel
      this.rainFilter = this.ctx.createBiquadFilter();
      this.rainFilter.type = 'bandpass';
      this.rainFilter.frequency.value = 1600;
      this.rainFilter.Q.value = 0.8;

      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.value = 0; // Off until rain occurs

      this.rainSource = this.ctx.createBufferSource();
      this.rainSource.buffer = noiseBuffer;
      this.rainSource.loop = true;
      this.rainSource.connect(this.rainFilter);
      this.rainFilter.connect(this.rainGain);
      this.rainGain.connect(this.masterGain);
      this.rainSource.start();
    } catch (e) {
      console.warn('AudioContext not supported or blocked by browser policy:', e);
    }
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (enabled && !this.ctx) {
      this.initContext();
    }
    if (this.ctx && this.ctx.state === 'suspended' && enabled) {
      this.ctx.resume();
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(enabled ? this.volume : 0, this.ctx.currentTime, 0.1);
    }
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && this.isEnabled) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  /**
   * Modulates sound pitch and resonance based on real meteorological parameters
   */
  public updateAtmosphere(windSpeedKmh: number, precipitationMm: number) {
    if (!this.ctx || !this.isEnabled) return;

    // Filter frequency scales with wind speed (gentle whistle ~200Hz to strong howling ~800Hz)
    if (this.windFilter) {
      const targetFreq = Math.min(950, 180 + windSpeedKmh * 12);
      this.windFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.2);
    }
    if (this.windGain) {
      const targetWindGain = Math.min(0.6, 0.15 + (windSpeedKmh / 50) * 0.35);
      this.windGain.gain.setTargetAtTime(targetWindGain, this.ctx.currentTime, 0.2);
    }

    // Rain volume modulation
    if (this.rainGain) {
      const targetRainGain = precipitationMm > 0 ? Math.min(0.5, 0.12 + (precipitationMm / 15) * 0.35) : 0;
      this.rainGain.gain.setTargetAtTime(targetRainGain, this.ctx.currentTime, 0.3);
    }
  }

  /**
   * Synthesizes a deep procedural thunder roll
   */
  public triggerThunder() {
    if (!this.ctx || !this.isEnabled) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 1.8);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, now);
      filter.frequency.exponentialRampToValueAtTime(40, now + 2.0);

      oscGain.gain.setValueAtTime(0, now);
      oscGain.gain.linearRampToValueAtTime(0.4, now + 0.1);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

      osc.connect(filter);
      filter.connect(oscGain);
      if (this.masterGain) oscGain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 2.5);
    } catch (e) {
      // Audio transient error safety
    }
  }

  /**
   * Synthesizes an emergency warning alert chime
   */
  public triggerWarningAlert() {
    if (!this.ctx || !this.isEnabled) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.setValueAtTime(659.25, now + 0.18); // E5

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      if (this.masterGain) gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {
      // Audio safety
    }
  }
}

export const atmosphereAudio = new AtmosphereAudioEngine();
