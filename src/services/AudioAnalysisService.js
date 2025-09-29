/**
 * Audio Analysis Service - Real audio file analysis
 */

import { PitchAnalysisResult, PitchData } from '../models/PitchData.js';

export class AudioAnalysisService {
  constructor() {
    this.audioContext = null;
    this.sampleRate = 44100;
    this.frameSize = 4096;
    this.hopSize = 1024;
  }

  /**
   * Initialize audio context
   */
  async initialize() {
    if (typeof window === 'undefined' || !window.AudioContext) {
      throw new Error('Web Audio API not available');
    }

    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.sampleRate = this.audioContext.sampleRate;
    
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Analyze audio file and extract pitch data
   */
  async analyzeAudioFile(filePath) {
    try {
      await this.initialize();
      
      // Load and decode audio file
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio file: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      console.log(`Analyzing audio: ${audioBuffer.duration.toFixed(2)}s, ${audioBuffer.numberOfChannels} channels`);
      
      // Get mono audio data
      const audioData = audioBuffer.getChannelData(0);
      const duration = audioBuffer.duration;
      
      // Extract pitch data
      const pitchData = await this._extractPitchData(audioData, duration);
      
      return new PitchAnalysisResult(pitchData, duration, this.sampleRate);
      
    } catch (error) {
      console.error('Audio analysis failed:', error);
      throw new Error(`Audio analysis failed: ${error.message}`);
    }
  }

  /**
   * Private: Extract pitch data from audio samples
   */
  async _extractPitchData(audioData, duration) {
    const pitchData = [];
    const frameTime = this.hopSize / this.sampleRate;
    
    for (let offset = 0; offset < audioData.length - this.frameSize; offset += this.hopSize) {
      const frame = audioData.slice(offset, offset + this.frameSize);
      const timeStamp = offset / this.sampleRate;
      
      // Calculate RMS for volume detection
      const rms = Math.sqrt(frame.reduce((sum, val) => sum + val * val, 0) / frame.length);
      
      // Detect pitch using autocorrelation
      const frequency = this._detectPitch(frame, rms);
      const confidence = this._calculateConfidence(frame, frequency, rms);
      
      // Create pitch data
      const pitch = PitchData.fromFrequency(frequency, confidence);
      pitchData.push(pitch);
      
      // Progress reporting
      if (Math.floor(timeStamp * 10) % 50 === 0) {
        const progress = (timeStamp / duration * 100).toFixed(1);
        console.log(`Analysis progress: ${progress}%`);
      }
    }
    
    return pitchData;
  }

  /**
   * Private: Detect pitch using autocorrelation
   */
  _detectPitch(frame, rms) {
    const bufferSize = frame.length;
    
    // Too quiet - no pitch
    if (rms < 0.0005) return 0;
    
    // Apply high-pass filter
    const filteredData = this._applyHighPassFilter(frame);
    
    // Apply window function
    const windowedData = this._applyHannWindow(filteredData);
    
    // Normalize
    const normalizedData = windowedData.map(val => val / rms);
    
    // Calculate autocorrelation
    const autocorrelation = new Float32Array(bufferSize);
    for (let lag = 0; lag < bufferSize; lag++) {
      let sum = 0;
      let count = 0;
      for (let i = 0; i < bufferSize - lag; i++) {
        sum += normalizedData[i] * normalizedData[i + lag];
        count++;
      }
      autocorrelation[lag] = count > 0 ? sum / count : 0;
    }
    
    // Find best period within vocal range
    const minPeriod = Math.floor(this.sampleRate / 4000); // Max 4kHz
    const maxPeriod = Math.floor(this.sampleRate / 60);   // Min 60Hz
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
    
    if (bestPeriod === 0 || maxVal < threshold) return 0;
    
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
    
    return this.sampleRate / adjustedPeriod;
  }

  /**
   * Private: Calculate confidence score
   */
  _calculateConfidence(frame, frequency, rms) {
    if (frequency === 0 || rms < 0.0005) return 0;
    
    // Simple confidence based on RMS and frequency stability
    const volumeScore = Math.min(1, rms / 0.1);
    const frequencyScore = frequency > 60 && frequency < 4000 ? 1 : 0;
    
    return volumeScore * frequencyScore;
  }

  /**
   * Private: Apply high-pass filter
   */
  _applyHighPassFilter(audioData, cutoffFreq = 80) {
    const filtered = new Float32Array(audioData.length);
    const RC = 1 / (2 * Math.PI * cutoffFreq);
    const dt = 1 / this.sampleRate;
    const alpha = RC / (RC + dt);
    
    filtered[0] = audioData[0];
    for (let i = 1; i < audioData.length; i++) {
      filtered[i] = alpha * (filtered[i-1] + audioData[i] - audioData[i-1]);
    }
    
    return filtered;
  }

  /**
   * Private: Apply Hann window
   */
  _applyHannWindow(audioData) {
    const windowed = new Float32Array(audioData.length);
    const N = audioData.length;
    
    for (let i = 0; i < N; i++) {
      const window = 0.5 * (1 - Math.cos(2 * Math.PI * i / (N - 1)));
      windowed[i] = audioData[i] * window;
    }
    
    return windowed;
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
  }
}