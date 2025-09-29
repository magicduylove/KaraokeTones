/**
 * Session Model - Represents a practice session
 */

import { PitchData } from './PitchData.js';
import { AudioFile } from './AudioFile.js';

export class Session {
  constructor() {
    this.id = this.generateId();
    this.audioFile = null;
    this.pitchHistory = [];
    this.isRecording = false;
    this.startTime = null;
    this.endTime = null;
    this.currentPitch = null;
    this.stats = {
      totalPitches: 0,
      validPitches: 0,
      silentPitches: 0,
      averageFrequency: 0,
      frequencyRange: { min: null, max: null }
    };
  }

  /**
   * Generate unique session ID
   */
  generateId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set audio file for this session
   */
  setAudioFile(file) {
    if (file instanceof File) {
      this.audioFile = new AudioFile(file);
    } else if (file instanceof AudioFile) {
      this.audioFile = file;
    } else {
      this.audioFile = null;
    }
  }

  /**
   * Start recording session
   */
  startRecording() {
    this.isRecording = true;
    this.startTime = Date.now();
    this.pitchHistory = [];
    this.resetStats();
  }

  /**
   * Stop recording session
   */
  stopRecording() {
    this.isRecording = false;
    this.endTime = Date.now();
    this.calculateStats();
  }

  /**
   * Add pitch data to session
   */
  addPitchData(frequency, note, confidence = 0) {
    const pitchData = new PitchData(frequency, note, confidence);
    this.pitchHistory.push(pitchData);
    this.currentPitch = pitchData;

    // Keep only last 1000 pitch points for performance
    if (this.pitchHistory.length > 1000) {
      this.pitchHistory = this.pitchHistory.slice(-1000);
    }

    this.updateStats(pitchData);
    return pitchData;
  }

  /**
   * Get recent pitch history (last N points)
   */
  getRecentPitchHistory(count = 20) {
    return this.pitchHistory.slice(-count);
  }

  /**
   * Get session duration in milliseconds
   */
  getDuration() {
    if (!this.startTime) return 0;
    const endTime = this.endTime || Date.now();
    return endTime - this.startTime;
  }

  /**
   * Get formatted session duration
   */
  getFormattedDuration() {
    const duration = this.getDuration();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Reset session statistics
   */
  resetStats() {
    this.stats = {
      totalPitches: 0,
      validPitches: 0,
      silentPitches: 0,
      averageFrequency: 0,
      frequencyRange: { min: null, max: null }
    };
  }

  /**
   * Update statistics with new pitch data
   */
  updateStats(pitchData) {
    this.stats.totalPitches++;

    if (pitchData.isValid()) {
      this.stats.validPitches++;
      const freq = pitchData.frequency;

      // Update frequency range
      if (this.stats.frequencyRange.min === null || freq < this.stats.frequencyRange.min) {
        this.stats.frequencyRange.min = freq;
      }
      if (this.stats.frequencyRange.max === null || freq > this.stats.frequencyRange.max) {
        this.stats.frequencyRange.max = freq;
      }
    } else {
      this.stats.silentPitches++;
    }
  }

  /**
   * Calculate final session statistics
   */
  calculateStats() {
    const validPitches = this.pitchHistory.filter(p => p.isValid());

    if (validPitches.length > 0) {
      const totalFreq = validPitches.reduce((sum, p) => sum + p.frequency, 0);
      this.stats.averageFrequency = totalFreq / validPitches.length;
    }

    this.stats.validPitches = validPitches.length;
    this.stats.silentPitches = this.pitchHistory.length - validPitches.length;
    this.stats.totalPitches = this.pitchHistory.length;
  }

  /**
   * Clear session data
   */
  clear() {
    this.audioFile?.dispose();
    this.audioFile = null;
    this.pitchHistory = [];
    this.currentPitch = null;
    this.isRecording = false;
    this.startTime = null;
    this.endTime = null;
    this.resetStats();
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON() {
    return {
      id: this.id,
      audioFile: this.audioFile?.toJSON() || null,
      pitchHistory: this.pitchHistory.map(p => p.toJSON()),
      isRecording: this.isRecording,
      startTime: this.startTime,
      endTime: this.endTime,
      currentPitch: this.currentPitch?.toJSON() || null,
      stats: this.stats,
      duration: this.getDuration()
    };
  }
}