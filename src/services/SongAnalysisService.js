/**
 * SongAnalysisService - Analyzes audio files to extract pitch information
 * HIGH ACCURACY VERSION with Demucs v4 vocal separation:
 *
 * STEP 1: Vocal Separation (Backend)
 * - Demucs v4 (htdemucs_ft) vocal stem extraction
 * - Clean vocal isolation from mixed audio
 * - Maximum accuracy vocal-only analysis
 *
 * STEP 2: Pitch Analysis (Frontend)
 * - Mono downmix, Centered frame timestamps
 * - Silence gating (dBFS), Hann windowing
 * - YIN detector, Normalized autocorrelation confidence (0..1)
 * - Light octave snapping, Progress yielding
 */

import PitchFinder from 'pitchfinder';

export class SongAnalysisService {
  constructor() {
    this.analysisData = null;
    this.isAnalyzing = false;
    this.noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    this.config = {
      windowSize: 4096,        // analysis window
      hopSize: 2048,           // hop between windows
      minFreq: 120,            // Focus on vocal range (was 80)
      maxFreq: 800,            // Focus on vocal range (was 1000)
      silenceThresholdDb: -40, // frames below this treated as no pitch (more strict)
      yieldEveryFrames: 200,   // yield to the browser every N frames
      // Backend configuration
      backendUrl: 'http://localhost:5000',
      useVocalSeparation: true  // Enable vocal separation
    };

    this._hann = null; // cached Hann window
  }

  /**
   * Analyze an audio file to extract pitch information over time
   * HIGH ACCURACY: Uses Demucs v4 vocal separation for clean vocal analysis
   * @param {File|Blob} audioFile
   * @returns {Promise<{
   *  duration:number, sampleRate:number, pitchTimeline:Array, fileName:string, analyzedAt:number, isVocalOnly:boolean
   * }>}
   */
  async analyzeSong(audioFile) {
    if (this.isAnalyzing) {
      throw new Error('Analysis already in progress');
    }

    this.isAnalyzing = true;

    try {
      console.log('🎵 Starting HIGH ACCURACY song analysis with vocal separation...');

      let audioToAnalyze = audioFile;
      let isVocalOnly = false;

      // STEP 1: Vocal Separation (if enabled and backend available)
      if (this.config.useVocalSeparation) {
        try {
          console.log('🎤 Separating vocals using Demucs v4...');
          audioToAnalyze = await this.separateVocals(audioFile);
          isVocalOnly = true;
          console.log('✅ Vocal separation successful - analyzing clean vocals only');
        } catch (vocalError) {
          console.warn('⚠️ Vocal separation failed, falling back to full mix:', vocalError.message);
          console.log('📝 Tip: Start the backend with "cd backend && python app.py"');
          audioToAnalyze = audioFile;
          isVocalOnly = false;
        }
      }

      // STEP 2: Audio Processing
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const arrayBuffer = await audioToAnalyze.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Free hardware resources early
      try { await audioContext.close(); } catch (_) {}

      const analysisType = isVocalOnly ? 'VOCAL-ONLY' : 'FULL-MIX';
      console.log(`📊 ${analysisType} audio loaded: ${audioBuffer.duration.toFixed(2)}s, ${audioBuffer.sampleRate}Hz`);

      // STEP 3: Pitch Analysis
      const pitchData = await this.extractPitchTimeline(audioBuffer);

      this.analysisData = {
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        pitchTimeline: pitchData,
        fileName: audioFile.name ?? 'unknown',
        analyzedAt: Date.now(),
        isVocalOnly: isVocalOnly,
        analysisType: analysisType
      };

      console.log(`✅ ${analysisType} analysis complete: ${pitchData.length} pitch points extracted`);
      console.log(`🎯 Accuracy level: ${isVocalOnly ? 'MAXIMUM (vocal-only)' : 'STANDARD (full-mix)'}`);

      return this.analysisData;

    } catch (error) {
      console.error('❌ Song analysis failed:', error);
      throw new Error(`Failed to analyze song: ${error.message}`);
    } finally {
      this.isAnalyzing = false;
    }
  }

  /**
   * Separate vocals from mixed audio using Demucs v4 backend
   * @param {File|Blob} audioFile - Original mixed audio
   * @returns {Promise<Blob>} - Vocal stem audio file
   */
  async separateVocals(audioFile) {
    const formData = new FormData();
    formData.append('audio', audioFile);

    console.log(`🔄 Uploading to Demucs backend: ${audioFile.name} (${(audioFile.size / 1024 / 1024).toFixed(1)}MB)`);

    const response = await fetch(`${this.config.backendUrl}/separate-vocals`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend vocal separation failed: ${response.status} - ${errorText}`);
    }

    const vocalBlob = await response.blob();
    console.log(`🎤 Received vocal stem: ${(vocalBlob.size / 1024 / 1024).toFixed(1)}MB`);

    return vocalBlob;
  }

  /**
   * Extract pitch data over time from an AudioBuffer
   * - Downmix to mono
   * - Hann window each frame
   * - Use YIN detector
   * - dBFS silence gating
   * - Confidence via normalized autocorrelation
   * - Frame timestamp = center of the analysis window
   */
  async extractPitchTimeline(audioBuffer) {
    const { windowSize, hopSize, minFreq, maxFreq, silenceThresholdDb, yieldEveryFrames } = this.config;
    const sr = audioBuffer.sampleRate;

    // Downmix to mono (average all channels)
    const mono = this._downmixToMono(audioBuffer);

    // Detector & Hann window (cached)
    const detector = PitchFinder.YIN({ sampleRate: sr });
    if (!this._hann || this._hann.length !== windowSize) {
      this._hann = this._hannWindow(windowSize);
    }

    const pitchTimeline = [];
    const work = new Float32Array(windowSize); // reusable frame
    let prevFreq = null;
    let frames = 0;

    const totalFrames = Math.max(0, Math.floor((mono.length - windowSize) / hopSize) + 1);
    for (let i = 0; i <= mono.length - windowSize; i += hopSize) {
      // Windowed frame (Hann)
      for (let k = 0; k < windowSize; k++) {
        work[k] = mono[i + k] * this._hann[k];
      }

      // Frame center time (aligns better with UI cursor)
      const time = (i + windowSize * 0.5) / sr;

      // Silence gate in dBFS
      let sumsq = 0;
      for (let k = 0; k < windowSize; k++) sumsq += work[k] * work[k];
      const rms = Math.sqrt(sumsq / windowSize);
      const db = 20 * Math.log10(rms + 1e-12);

      if (db < silenceThresholdDb) {
        pitchTimeline.push({ time, frequency: null, note: null, confidence: 0 });
      } else {
        let frequency = detector(work) || null;

        // Keep only within UI-friendly band
        if (frequency && (frequency < minFreq || frequency > maxFreq)) {
          frequency = null;
        }

        // Light octave sanity vs previous frame (reduce 2x / 0.5x flips)
        if (frequency && prevFreq) {
          const r = frequency / prevFreq;
          if (r > 1.95 && r < 2.05) frequency = prevFreq * 2;
          else if (r > 0.48 && r < 0.52) frequency = prevFreq / 2;
        }

        // Confidence via normalized autocorrelation at expected lag
        let confidence = frequency
          ? this._autocorrConfidence(work, Math.max(2, Math.round(sr / frequency)))
          : 0;

        // ADDITIONAL FILTERING for mixed audio (until vocal separation is available)
        // Only keep high-confidence detections to reduce instrument interference
        if (confidence < 0.6) {
          frequency = null;
          confidence = 0;
        }

        pitchTimeline.push({
          time,
          frequency,
          note: frequency ? this.frequencyToNote(frequency) : null,
          confidence
        });

        if (frequency) prevFreq = frequency;
      }

      frames++;
      // Periodically yield to keep the UI responsive
      if (frames % yieldEveryFrames === 0) {
        await new Promise(requestAnimationFrame);
        const pct = (frames / totalFrames) * 100;
        console.log(`📈 Analysis progress: ${Math.min(pct, 100).toFixed(0)}%`);
      }
    }

    return pitchTimeline;
  }

  /**
   * Convert frequency (Hz) to note name using MIDI mapping
   * A4 = 440 Hz -> MIDI 69
   */
  frequencyToNote(frequency) {
    if (!frequency) return null;
    const midi = Math.round(69 + 12 * Math.log2(frequency / 440));
    const noteIndex = ((midi % 12) + 12) % 12;
    const octave = Math.floor(midi / 12) - 1;
    return `${this.noteNames[noteIndex]}${octave}`;
  }

  /**
   * Normalized autocorrelation confidence (0..1) at given lag.
   * Approximates periodicity confidence; robust for voiced frames.
   */
  _autocorrConfidence(frame, lag) {
    const n = frame.length - lag;
    if (n <= 1) return 0;
    let num = 0, den0 = 0, den1 = 0;
    for (let t = 0; t < n; t++) {
      const a = frame[t], b = frame[t + lag];
      num  += a * b;
      den0 += a * a;
      den1 += b * b;
    }
    const den = Math.sqrt(den0 * den1) + 1e-12;
    const r = num / den;
    // Clamp to [0,1]
    return r < 0 ? 0 : (r > 1 ? 1 : r);
  }

  /**
   * Hann window generator (cached in this._hann)
   */
  _hannWindow(N) {
    const w = new Float32Array(N);
    for (let n = 0; n < N; n++) {
      w[n] = 0.5 * (1 - Math.cos((2 * Math.PI * n) / (N - 1)));
    }
    return w;
  }

  /**
   * Mixes all channels down to mono by averaging.
   * @param {AudioBuffer} audioBuffer
   * @returns {Float32Array}
   */
  _downmixToMono(audioBuffer) {
    const { numberOfChannels, length } = audioBuffer;
    if (numberOfChannels === 1) {
      // Return a copy to avoid mutating the original channel data
      const src = audioBuffer.getChannelData(0);
      const out = new Float32Array(src.length);
      out.set(src);
      return out;
    }
    const out = new Float32Array(length);
    for (let ch = 0; ch < numberOfChannels; ch++) {
      const data = audioBuffer.getChannelData(ch);
      for (let i = 0; i < length; i++) out[i] += data[i];
    }
    const inv = 1 / numberOfChannels;
    for (let i = 0; i < length; i++) out[i] *= inv;
    return out;
  }

  /**
   * Get pitch at specific time (closest frame)
   */
  getPitchAtTime(time) {
    if (!this.analysisData || !this.analysisData.pitchTimeline?.length) {
      return null;
    }

    const timeline = this.analysisData.pitchTimeline;
    // Binary search could be used, but linear is fine for moderate sizes
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
   * Get pitch data for a time range [startTime, endTime]
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
   * Get analysis metadata aligned with UI expectations
   */
  getAnalysisInfo() {
    if (!this.analysisData) return null;

    const { pitchTimeline, fileName, duration, analyzedAt, isVocalOnly, analysisType } = this.analysisData;
    const totalPitches = pitchTimeline.length || 0;
    const validPitches = pitchTimeline.filter(p => p.frequency && p.frequency >= this.config.minFreq).length;

    return {
      fileName,
      duration,
      totalPoints: totalPitches,
      validPitches,
      coverage: totalPitches ? ((validPitches / totalPitches) * 100).toFixed(1) : '0.0',
      analyzedAt: new Date(analyzedAt).toLocaleString(),
      isVocalOnly: isVocalOnly ?? false,
      analysisType: analysisType ?? 'UNKNOWN',
      accuracy: isVocalOnly ? 'MAXIMUM' : 'STANDARD'
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
   * Export analysis data (shallow copy)
   */
  exportAnalysis() {
    return this.analysisData ? { ...this.analysisData } : null;
  }
}
