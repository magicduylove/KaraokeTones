/**
 * Audio Analysis System for Pitch Extraction from MP3 Files
 * Extracts pitch data and timing information from audio files
 */

// Web Audio API based pitch detection using autocorrelation
export class AudioAnalyzer {
  constructor() {
    this.audioContext = null;
    this.audioBuffer = null;
    this.sampleRate = 44100;
    this.frameSize = 4096;
    this.hopSize = 1024;
  }

  /**
   * Initialize audio context
   */
  async initializeAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.sampleRate = this.audioContext.sampleRate;
    }
    
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Load and decode MP3 file (Simplified for demo)
   */
  async loadAudioFile(filePath) {
    try {
      // For now, create a mock audio buffer since Web Audio API file loading 
      // may not work in Expo environment
      console.log('Mock loading audio file:', filePath);
      
      // Create mock audio data for demonstration
      this.audioBuffer = this.createMockAudioBuffer();
      
      console.log(`Mock audio loaded: ${this.audioBuffer.duration.toFixed(2)}s`);
      return this.audioBuffer;
    } catch (error) {
      console.error('Error loading audio file:', error);
      throw error;
    }
  }

  /**
   * Create mock audio buffer for demonstration
   */
  createMockAudioBuffer() {
    const duration = 30; // 30 second mock song
    const sampleRate = 44100;
    const length = duration * sampleRate;
    const audioData = new Float32Array(length);
    
    // Generate mock audio with varying frequency content
    for (let i = 0; i < length; i++) {
      const time = i / sampleRate;
      // Create a simple melody pattern
      const frequency = 220 + Math.sin(time * 0.5) * 100; // Varies between 120-320 Hz
      audioData[i] = Math.sin(2 * Math.PI * frequency * time) * 0.1;
    }
    
    return {
      duration: duration,
      sampleRate: sampleRate,
      length: length,
      getChannelData: () => audioData
    };
  }

  /**
   * Autocorrelation-based pitch detection
   */
  detectPitch(audioData, sampleRate) {
    const bufferSize = audioData.length;
    const autocorrelation = new Float32Array(bufferSize);
    
    // Calculate autocorrelation
    for (let lag = 0; lag < bufferSize; lag++) {
      let sum = 0;
      for (let i = 0; i < bufferSize - lag; i++) {
        sum += audioData[i] * audioData[i + lag];
      }
      autocorrelation[lag] = sum;
    }
    
    // Find the first peak after the initial peak
    const minPeriod = Math.floor(sampleRate / 800); // Highest frequency ~800Hz
    const maxPeriod = Math.floor(sampleRate / 80);  // Lowest frequency ~80Hz
    
    let maxVal = 0;
    let bestPeriod = 0;
    
    for (let period = minPeriod; period < Math.min(maxPeriod, bufferSize / 2); period++) {
      if (autocorrelation[period] > maxVal) {
        maxVal = autocorrelation[period];
        bestPeriod = period;
      }
    }
    
    if (bestPeriod === 0) return 0;
    
    // Parabolic interpolation for more accurate frequency
    const y1 = autocorrelation[bestPeriod - 1] || 0;
    const y2 = autocorrelation[bestPeriod];
    const y3 = autocorrelation[bestPeriod + 1] || 0;
    
    const a = (y1 - 2 * y2 + y3) / 2;
    const b = (y3 - y1) / 2;
    
    let adjustedPeriod = bestPeriod;
    if (a !== 0) {
      adjustedPeriod = bestPeriod - b / (2 * a);
    }
    
    return sampleRate / adjustedPeriod;
  }

  /**
   * Convert frequency to musical note
   */
  frequencyToNote(frequency) {
    if (frequency <= 0) return { note: '--', octave: 0, cents: 0 };
    
    const A4 = 440;
    const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    const semitones = 12 * Math.log2(frequency / A4);
    const midiNote = Math.round(semitones) + 69;
    const cents = Math.round((semitones - Math.round(semitones)) * 100);
    
    const octave = Math.floor(midiNote / 12) - 1;
    const noteIndex = midiNote % 12;
    
    return {
      note: NOTES[noteIndex],
      octave: octave,
      cents: cents,
      frequency: frequency,
      midiNote: midiNote
    };
  }

  /**
   * Detect onset (note start) using spectral flux
   */
  detectOnset(audioData, previousAudioData) {
    if (!previousAudioData) return 0;
    
    const fftSize = 512;
    const fft = this.simpleFFT(audioData.slice(0, fftSize));
    const prevFFT = this.simpleFFT(previousAudioData.slice(0, fftSize));
    
    let spectralFlux = 0;
    for (let i = 0; i < fft.length; i++) {
      const magnitude = Math.sqrt(fft[i].real * fft[i].real + fft[i].imag * fft[i].imag);
      const prevMagnitude = Math.sqrt(prevFFT[i].real * prevFFT[i].real + prevFFT[i].imag * prevFFT[i].imag);
      
      const diff = magnitude - prevMagnitude;
      if (diff > 0) {
        spectralFlux += diff;
      }
    }
    
    return spectralFlux;
  }

  /**
   * Simple FFT implementation for onset detection
   */
  simpleFFT(signal) {
    const N = signal.length;
    if (N <= 1) return [{ real: signal[0] || 0, imag: 0 }];
    
    // Simplified FFT - for production, use a proper FFT library
    const result = new Array(N);
    for (let k = 0; k < N; k++) {
      let real = 0, imag = 0;
      for (let n = 0; n < N; n++) {
        const angle = -2 * Math.PI * k * n / N;
        real += signal[n] * Math.cos(angle);
        imag += signal[n] * Math.sin(angle);
      }
      result[k] = { real, imag };
    }
    return result;
  }

  /**
   * Analyze entire audio file and extract pitch data
   */
  async analyzeAudioFile() {
    if (!this.audioBuffer) {
      throw new Error('No audio file loaded');
    }

    const audioData = this.audioBuffer.getChannelData(0); // Get mono channel
    const duration = this.audioBuffer.duration;
    const frameTime = this.hopSize / this.sampleRate;
    
    const pitchData = [];
    let previousFrame = null;
    
    console.log('Starting pitch analysis...');
    
    for (let offset = 0; offset < audioData.length - this.frameSize; offset += this.hopSize) {
      const frame = audioData.slice(offset, offset + this.frameSize);
      const timeStamp = offset / this.sampleRate;
      
      // Calculate RMS for volume detection
      const rms = Math.sqrt(frame.reduce((sum, val) => sum + val * val, 0) / frame.length);
      
      // Only analyze frames with sufficient volume
      let pitch = 0;
      let note = { note: '--', octave: 0, cents: 0 };
      
      if (rms > 0.001) { // Noise threshold
        pitch = this.detectPitch(frame, this.sampleRate);
        if (pitch > 80 && pitch < 2000) { // Valid vocal range
          note = this.frequencyToNote(pitch);
        }
      }
      
      // Detect onset
      const onset = previousFrame ? this.detectOnset(frame, previousFrame) : 0;
      
      pitchData.push({
        time: timeStamp,
        frequency: pitch,
        note: note.note,
        octave: note.octave,
        cents: note.cents,
        rms: rms,
        onset: onset,
        isVocal: pitch > 80 && pitch < 2000 && rms > 0.001
      });
      
      previousFrame = frame;
      
      // Progress logging
      if (Math.floor(timeStamp * 10) % 10 === 0 && offset % (this.hopSize * 10) === 0) {
        console.log(`Analysis progress: ${(timeStamp / duration * 100).toFixed(1)}%`);
      }
    }
    
    console.log('Pitch analysis complete!');
    return pitchData;
  }

  /**
   * Convert pitch data to SongPitchMap format
   */
  convertToSongPitchMap(pitchData, filePath, songTitle = 'Unknown Song', artist = 'Unknown Artist') {
    // Import SongPitchMap here to avoid circular imports
    const { SongPitchMap } = require('./songStorage');
    
    const totalDuration = pitchData[pitchData.length - 1]?.time || 0;
    const songId = require('./songStorage').SongStorage.generateSongId(filePath);
    
    // Create new SongPitchMap
    const songMap = new SongPitchMap(songId, songTitle, artist, filePath, totalDuration);
    
    let currentNote = null;
    let noteStart = 0;
    let currentFrequency = 0;
    
    // Group consecutive similar pitches into timeline segments
    for (let i = 0; i < pitchData.length; i++) {
      const data = pitchData[i];
      
      if (data.isVocal) {
        const noteString = `${data.note}${data.octave}`;
        
        if (!currentNote || currentNote !== noteString) {
          // End previous note segment
          if (currentNote && currentNote !== '--') {
            const duration = data.time - noteStart;
            if (duration > 0.1) { // Minimum segment duration
              songMap.addPitchSegment(noteStart, duration, currentNote, currentFrequency);
            }
          }
          
          // Start new note segment
          currentNote = noteString;
          noteStart = data.time;
          currentFrequency = data.frequency;
        }
      } else {
        // End current note on silence
        if (currentNote && currentNote !== '--') {
          const duration = data.time - noteStart;
          if (duration > 0.1) {
            songMap.addPitchSegment(noteStart, duration, currentNote, currentFrequency);
          }
        }
        currentNote = '--';
        noteStart = data.time;
        currentFrequency = 0;
      }
    }
    
    // Add final segment
    if (currentNote && currentNote !== '--') {
      const duration = totalDuration - noteStart;
      if (duration > 0.1) {
        songMap.addPitchSegment(noteStart, duration, currentNote, currentFrequency);
      }
    }
    
    // Update metadata
    const notes = songMap.timeline.filter(segment => segment.note !== '--');
    songMap.updateMetadata({
      bpm: this.estimateBPM(notes),
      key: this.estimateKey(notes),
      vocalRange: this.calculateVocalRange(notes)
    });
    
    return songMap;
  }

  /**
   * Calculate vocal range from notes
   */
  calculateVocalRange(notes) {
    if (notes.length === 0) return { lowest: null, highest: null };
    
    const frequencies = notes.map(note => note.frequency).filter(f => f > 0);
    if (frequencies.length === 0) return { lowest: null, highest: null };
    
    const minFreq = Math.min(...frequencies);
    const maxFreq = Math.max(...frequencies);
    
    return {
      lowest: this.frequencyToNote(minFreq).note + this.frequencyToNote(minFreq).octave,
      highest: this.frequencyToNote(maxFreq).note + this.frequencyToNote(maxFreq).octave,
      minFrequency: minFreq,
      maxFrequency: maxFreq
    };
  }

  /**
   * Estimate BPM from note patterns
   */
  estimateBPM(notes) {
    if (notes.length < 4) return 120;
    
    const intervals = [];
    for (let i = 1; i < notes.length; i++) {
      intervals.push(notes[i].time - notes[i-1].time);
    }
    
    intervals.sort((a, b) => a - b);
    const medianInterval = intervals[Math.floor(intervals.length / 2)];
    
    // Convert to BPM (assuming quarter notes)
    return Math.round(60 / (medianInterval * 4));
  }

  /**
   * Estimate musical key from note frequencies
   */
  estimateKey(notes) {
    const noteCount = {};
    const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    notes.forEach(noteData => {
      const note = noteData.note.replace(/\d+/, ''); // Remove octave
      noteCount[note] = (noteCount[note] || 0) + noteData.duration;
    });
    
    // Find most common note
    let maxCount = 0;
    let mostCommonNote = 'C';
    
    for (const [note, count] of Object.entries(noteCount)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonNote = note;
      }
    }
    
    return `${mostCommonNote} Major`; // Simplified key detection
  }
}

// Export for use in other modules
export default AudioAnalyzer;