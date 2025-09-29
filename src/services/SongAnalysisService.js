/**
 * SongAnalysisService - Analyzes audio files to extract pitch information
 */

import PitchFinder from 'pitchfinder';

export class SongAnalysisService {
  constructor() {
    this.analysisData = null;
    this.isAnalyzing = false;
    this.noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  }

  /**
   * Analyze an audio file to extract pitch information over time
   */
  async analyzeSong(audioFile) {
    if (this.isAnalyzing) {
      throw new Error('Analysis already in progress');
    }

    this.isAnalyzing = true;

    try {
      console.log('🎵 Starting song analysis...');

      // Create audio context for analysis
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Load and decode audio file
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      console.log(`📊 Audio loaded: ${audioBuffer.duration.toFixed(2)}s, ${audioBuffer.sampleRate}Hz`);

      // Extract pitch data over time
      const pitchData = await this.extractPitchTimeline(audioBuffer);

      this.analysisData = {
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        pitchTimeline: pitchData,
        fileName: audioFile.name,
        analyzedAt: Date.now()
      };

      console.log(`✅ Analysis complete: ${pitchData.length} pitch points extracted`);

      return this.analysisData;

    } catch (error) {
      console.error('❌ Song analysis failed:', error);
      throw new Error(`Failed to analyze song: ${error.message}`);
    } finally {
      this.isAnalyzing = false;
    }
  }

  /**
   * Extract pitch data over time from audio buffer
   */
  async extractPitchTimeline(audioBuffer) {
    const detector = PitchFinder.YIN({ sampleRate: audioBuffer.sampleRate });
    const channelData = audioBuffer.getChannelData(0); // Use first channel

    const windowSize = 4096; // Analysis window size
    const hopSize = 2048; // Step size between analyses
    const timeStep = hopSize / audioBuffer.sampleRate; // Time between analyses

    const pitchTimeline = [];

    // Analyze audio in overlapping windows
    for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
      const window = channelData.slice(i, i + windowSize);
      const frequency = detector(window);
      const time = i / audioBuffer.sampleRate;

      const pitchPoint = {
        time: time,
        frequency: frequency || null,
        note: frequency ? this.frequencyToNote(frequency) : null,
        confidence: frequency ? this.calculateConfidence(window, frequency) : 0
      };

      pitchTimeline.push(pitchPoint);

      // Progress reporting every 1000 points
      if (pitchTimeline.length % 1000 === 0) {
        console.log(`📈 Analysis progress: ${time.toFixed(1)}s / ${audioBuffer.duration.toFixed(1)}s`);
      }
    }

    return pitchTimeline;
  }

  /**
   * Convert frequency to note name
   */
  frequencyToNote(frequency) {
    if (!frequency || frequency < 80) return null;

    const A4 = 440;
    const C0 = A4 * Math.pow(2, -4.75);

    if (frequency > C0) {
      const h = Math.round(12 * Math.log2(frequency / C0));
      const octave = Math.floor(h / 12);
      const n = h % 12;
      return this.noteNames[n] + octave;
    }
    return null;
  }

  /**
   * Calculate confidence for a detected frequency
   */
  calculateConfidence(window, frequency) {
    if (!frequency) return 0;

    // Simple confidence based on signal strength
    const rms = Math.sqrt(window.reduce((sum, sample) => sum + sample * sample, 0) / window.length);

    // Normalize confidence (0-1)
    return Math.min(1, rms * 10);
  }

  /**
   * Get pitch at specific time
   */
  getPitchAtTime(time) {
    if (!this.analysisData || !this.analysisData.pitchTimeline) {
      return null;
    }

    // Find closest pitch point
    const timeline = this.analysisData.pitchTimeline;
    let closestIndex = 0;
    let minDiff = Math.abs(timeline[0].time - time);

    for (let i = 1; i < timeline.length; i++) {
      const diff = Math.abs(timeline[i].time - time);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }

    return timeline[closestIndex];
  }

  /**
   * Get pitch data for a time range
   */
  getPitchRange(startTime, endTime) {
    if (!this.analysisData || !this.analysisData.pitchTimeline) {
      return [];
    }

    return this.analysisData.pitchTimeline.filter(
      point => point.time >= startTime && point.time <= endTime
    );
  }

  /**
   * Check if song has been analyzed
   */
  hasAnalysis() {
    return this.analysisData !== null;
  }

  /**
   * Get analysis metadata
   */
  getAnalysisInfo() {
    if (!this.analysisData) return null;

    const validPitches = this.analysisData.pitchTimeline.filter(p => p.frequency).length;
    const totalPitches = this.analysisData.pitchTimeline.length;

    return {
      fileName: this.analysisData.fileName,
      duration: this.analysisData.duration,
      totalPoints: totalPitches,
      validPitches: validPitches,
      coverage: (validPitches / totalPitches * 100).toFixed(1),
      analyzedAt: new Date(this.analysisData.analyzedAt).toLocaleString()
    };
  }

  /**
   * Clear analysis data
   */
  clearAnalysis() {
    this.analysisData = null;
    console.log('🗑️ Song analysis data cleared');
  }

  /**
   * Export analysis data
   */
  exportAnalysis() {
    return this.analysisData ? { ...this.analysisData } : null;
  }
}