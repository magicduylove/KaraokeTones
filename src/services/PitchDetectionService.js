/**
 * Pitch Detection Service - Real-time pitch detection from microphone
 */

import { PitchData } from '../models/PitchData.js';

export class PitchDetectionService {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.rafId = null;
    this.isActive = false;
    this.onPitchDetected = null;
    
    // Detection parameters
    this.fftSize = 4096;
    this.sampleRate = 44100;
    this.minFrequency = 80;
    this.maxFrequency = 2000;
  }

  /**
   * Initialize pitch detection
   */
  async initialize() {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
          sampleRate: this.sampleRate
        }
      });

      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.sampleRate = this.audioContext.sampleRate;

      // Create analyser
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.fftSize;
      this.analyser.smoothingTimeConstant = 0.3;

      // Connect microphone
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);

      return true;
    } catch (error) {
      console.error('Failed to initialize pitch detection:', error);
      throw new Error('Microphone access denied or not available');
    }
  }

  /**
   * Start pitch detection
   */
  start(onPitchDetected) {
    if (!this.analyser) {
      throw new Error('Pitch detection not initialized');
    }

    this.onPitchDetected = onPitchDetected;
    this.isActive = true;
    this._detect();
  }

  /**
   * Stop pitch detection
   */
  stop() {
    this.isActive = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.onPitchDetected = null;
  }

  /**
   * Get current pitch detection state
   */
  getState() {
    return {
      isActive: this.isActive,
      isInitialized: !!this.analyser,
      sampleRate: this.sampleRate
    };
  }

  /**
   * Private: Main detection loop
   */
  _detect() {
    if (!this.isActive) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    this.analyser.getFloatFrequencyData(dataArray);

    // Convert to time domain for autocorrelation
    const timeDomainData = new Float32Array(this.fftSize);
    this.analyser.getFloatTimeDomainData(timeDomainData);

    // Detect pitch using autocorrelation
    const pitch = this._detectPitchAutocorrelation(timeDomainData);
    
    if (this.onPitchDetected && pitch) {
      this.onPitchDetected(pitch);
    }

    this.rafId = requestAnimationFrame(() => this._detect());
  }

  /**
   * Private: Autocorrelation-based pitch detection
   */
  _detectPitchAutocorrelation(buffer) {
    const bufferSize = buffer.length;
    
    // Apply high-pass filter
    const filteredBuffer = this._applyHighPassFilter(buffer);
    
    // Calculate RMS for confidence
    const rms = Math.sqrt(
      filteredBuffer.reduce((sum, val) => sum + val * val, 0) / bufferSize
    );
    
    // Too quiet - no pitch
    if (rms < 0.001) {
      return PitchData.fromFrequency(0, 0);
    }

    // Autocorrelation
    const autocorrelation = new Float32Array(bufferSize);
    for (let lag = 0; lag < bufferSize; lag++) {
      let sum = 0;
      let count = 0;
      for (let i = 0; i < bufferSize - lag; i++) {
        sum += filteredBuffer[i] * filteredBuffer[i + lag];
        count++;
      }
      autocorrelation[lag] = count > 0 ? sum / count : 0;
    }

    // Find pitch period
    const minPeriod = Math.floor(this.sampleRate / this.maxFrequency);
    const maxPeriod = Math.floor(this.sampleRate / this.minFrequency);
    const threshold = autocorrelation[0] * 0.3;

    let maxVal = 0;
    let bestPeriod = 0;

    for (let period = minPeriod; period < Math.min(maxPeriod, bufferSize / 2); period++) {
      if (autocorrelation[period] > threshold && autocorrelation[period] > maxVal) {
        const prev = autocorrelation[period - 1] || 0;
        const next = autocorrelation[period + 1] || 0;
        
        if (autocorrelation[period] >= prev && autocorrelation[period] >= next) {
          maxVal = autocorrelation[period];
          bestPeriod = period;
        }
      }
    }

    if (bestPeriod === 0 || maxVal < threshold) {
      return PitchData.fromFrequency(0, 0);
    }

    // Parabolic interpolation for better accuracy
    const y1 = autocorrelation[bestPeriod - 1] || 0;
    const y2 = autocorrelation[bestPeriod];
    const y3 = autocorrelation[bestPeriod + 1] || 0;
    
    const a = (y1 - 2 * y2 + y3) / 2;
    const b = (y3 - y1) / 2;
    
    let adjustedPeriod = bestPeriod;
    if (Math.abs(a) > 0.0001) {
      const offset = -b / (2 * a);
      if (Math.abs(offset) < 1) {
        adjustedPeriod = bestPeriod + offset;
      }
    }

    const frequency = this.sampleRate / adjustedPeriod;
    const confidence = Math.min(1.0, maxVal / autocorrelation[0]);
    
    return PitchData.fromFrequency(frequency, confidence);
  }

  /**
   * Private: Simple high-pass filter
   */
  _applyHighPassFilter(buffer, cutoffFreq = 80) {
    const filtered = new Float32Array(buffer.length);
    const RC = 1 / (2 * Math.PI * cutoffFreq);
    const dt = 1 / this.sampleRate;
    const alpha = RC / (RC + dt);
    
    filtered[0] = buffer[0];
    for (let i = 1; i < buffer.length; i++) {
      filtered[i] = alpha * (filtered[i-1] + buffer[i] - buffer[i-1]);
    }
    
    return filtered;
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    this.stop();
    
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }
    
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
    
    this.analyser = null;
  }
}