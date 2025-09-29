/**
 * PitchDetectionService - Handles real-time pitch detection using Web Audio API
 */

import PitchFinder from 'pitchfinder';

export class PitchDetectionService {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.pitchDetector = null;
    this.isActive = false;
    this.animationFrameId = null;
    this.onPitchDetected = null;

    // Note names for frequency conversion
    this.noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    // Initialize pitch detector
    this.initializePitchDetector();
  }

  /**
   * Initialize the pitch detection algorithm
   */
  initializePitchDetector() {
    try {
      this.pitchDetector = PitchFinder.YIN({
        sampleRate: 44100,
        threshold: 0.1
      });
    } catch (error) {
      console.error('Failed to initialize pitch detector:', error);
    }
  }

  /**
   * Convert frequency to musical note
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
   * Start pitch detection
   */
  async start(onPitchDetected) {
    if (this.isActive) {
      console.warn('Pitch detection is already active');
      return;
    }

    this.onPitchDetected = onPitchDetected;

    try {
      await this.setupAudioContext();
      await this.setupMicrophone();
      this.startDetectionLoop();
      this.isActive = true;
      console.log('✅ Pitch detection started');
    } catch (error) {
      console.error('❌ Failed to start pitch detection:', error);
      this.cleanup();
      throw error;
    }
  }

  /**
   * Stop pitch detection
   */
  stop() {
    if (!this.isActive) return;

    this.isActive = false;
    this.cleanup();
    console.log('🛑 Pitch detection stopped');
  }

  /**
   * Setup audio context
   */
  async setupAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Resume context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 4096;
      this.analyser.smoothingTimeConstant = 0.8;
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;

    } catch (error) {
      throw new Error(`Failed to setup audio context: ${error.message}`);
    }
  }

  /**
   * Setup microphone input
   */
  async setupMicrophone() {
    try {
      const constraints = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100
        }
      };

      this.microphone = await navigator.mediaDevices.getUserMedia(constraints);
      const source = this.audioContext.createMediaStreamSource(this.microphone);
      source.connect(this.analyser);

    } catch (error) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Microphone access denied. Please allow microphone permissions.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No microphone found. Please connect a microphone.');
      } else {
        throw new Error(`Failed to access microphone: ${error.message}`);
      }
    }
  }

  /**
   * Start the pitch detection loop
   */
  startDetectionLoop() {
    const bufferLength = this.analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);

    const detectPitch = () => {
      if (!this.isActive) return;

      // Get audio data
      this.analyser.getFloatTimeDomainData(dataArray);

      // Detect pitch using YIN algorithm
      let frequency = null;
      let note = null;
      let confidence = 0;

      try {
        frequency = this.pitchDetector(dataArray);

        if (frequency && frequency > 0) {
          note = this.frequencyToNote(frequency);
          confidence = this.calculateConfidence(dataArray, frequency);
        }
      } catch (error) {
        console.warn('Pitch detection error:', error);
      }

      // Call callback with detected pitch
      if (this.onPitchDetected) {
        this.onPitchDetected(frequency, note, confidence);
      }

      // Schedule next detection
      this.animationFrameId = requestAnimationFrame(detectPitch);
    };

    detectPitch();
  }

  /**
   * Calculate confidence level for detected pitch
   */
  calculateConfidence(dataArray, frequency) {
    if (!frequency) return 0;

    // Simple confidence calculation based on signal strength
    const rms = Math.sqrt(dataArray.reduce((sum, val) => sum + val * val, 0) / dataArray.length);
    const confidence = Math.min(rms * 10, 1); // Normalize to 0-1 range

    return confidence;
  }

  /**
   * Cleanup audio resources
   */
  cleanup() {
    // Cancel animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Stop microphone
    if (this.microphone) {
      this.microphone.getTracks().forEach(track => track.stop());
      this.microphone = null;
    }

    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.onPitchDetected = null;
  }

  /**
   * Check if pitch detection is supported
   */
  static isSupported() {
    return !!(navigator.mediaDevices &&
              navigator.mediaDevices.getUserMedia &&
              (window.AudioContext || window.webkitAudioContext));
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isActive: this.isActive,
      hasAudioContext: !!this.audioContext,
      hasMicrophone: !!this.microphone,
      hasAnalyser: !!this.analyser,
      sampleRate: this.audioContext?.sampleRate || null
    };
  }
}