/**
 * AudioService - Handles audio file management and playback
 */

import { AudioFile } from '../models/AudioFile.js';

export class AudioService {
  constructor() {
    this.currentAudio = null;
    this.audioElement = null;
    this.isPlaying = false;
    this.volume = 1.0;
    this.currentTime = 0;
    this.duration = 0;
    this.onTimeUpdate = null;
    this.onEnded = null;
    this.onError = null;
  }

  /**
   * Load audio file
   */
  async loadAudioFile(file) {
    try {
      // Validate file
      if (!file || !(file instanceof File)) {
        throw new Error('Invalid file provided');
      }

      if (!file.type.startsWith('audio/')) {
        throw new Error('File is not an audio file');
      }

      // Create AudioFile model
      const audioFile = new AudioFile(file);

      // Load metadata
      await audioFile.loadMetadata();

      // Store current audio
      this.currentAudio = audioFile;

      console.log('✅ Audio file loaded:', audioFile.name);
      return audioFile;

    } catch (error) {
      console.error('❌ Failed to load audio file:', error);
      throw error;
    }
  }

  /**
   * Create audio element for playback
   */
  createAudioElement() {
    if (!this.currentAudio) {
      throw new Error('No audio file loaded');
    }

    // Cleanup existing audio element
    this.disposeAudioElement();

    // Create new audio element
    this.audioElement = new Audio();
    this.audioElement.src = this.currentAudio.createObjectURL();
    this.audioElement.volume = this.volume;

    // Setup event listeners
    this.setupAudioEventListeners();

    return this.audioElement;
  }

  /**
   * Setup audio element event listeners
   */
  setupAudioEventListeners() {
    if (!this.audioElement) return;

    this.audioElement.addEventListener('loadedmetadata', () => {
      this.duration = this.audioElement.duration;
    });

    this.audioElement.addEventListener('timeupdate', () => {
      this.currentTime = this.audioElement.currentTime;
      if (this.onTimeUpdate) {
        this.onTimeUpdate(this.currentTime, this.duration);
      }
    });

    this.audioElement.addEventListener('ended', () => {
      this.isPlaying = false;
      if (this.onEnded) {
        this.onEnded();
      }
    });

    this.audioElement.addEventListener('error', (event) => {
      const error = new Error(`Audio playback error: ${event.message}`);
      if (this.onError) {
        this.onError(error);
      }
      console.error('❌ Audio error:', error);
    });

    this.audioElement.addEventListener('play', () => {
      this.isPlaying = true;
    });

    this.audioElement.addEventListener('pause', () => {
      this.isPlaying = false;
    });
  }

  /**
   * Play audio
   */
  async play() {
    try {
      if (!this.audioElement) {
        this.createAudioElement();
      }

      await this.audioElement.play();
      this.isPlaying = true;
      console.log('▶️ Audio playback started');

    } catch (error) {
      console.error('❌ Failed to play audio:', error);
      throw error;
    }
  }

  /**
   * Pause audio
   */
  pause() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.isPlaying = false;
      console.log('⏸️ Audio playback paused');
    }
  }

  /**
   * Stop audio
   */
  stop() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.isPlaying = false;
      this.currentTime = 0;
      console.log('⏹️ Audio playback stopped');
    }
  }

  /**
   * Seek to specific time
   */
  seekTo(time) {
    if (this.audioElement) {
      this.audioElement.currentTime = Math.max(0, Math.min(time, this.duration));
      this.currentTime = this.audioElement.currentTime;
    }
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
  }

  /**
   * Get current playback progress (0.0 to 1.0)
   */
  getProgress() {
    if (this.duration > 0) {
      return this.currentTime / this.duration;
    }
    return 0;
  }

  /**
   * Format time for display (mm:ss)
   */
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get audio file info
   */
  getAudioInfo() {
    if (!this.currentAudio) return null;

    return {
      name: this.currentAudio.name,
      size: this.currentAudio.getFormattedSize(),
      duration: this.currentAudio.getFormattedDuration(),
      type: this.currentAudio.type,
      isLoaded: this.currentAudio.isLoaded
    };
  }

  /**
   * Remove current audio file
   */
  removeAudioFile() {
    this.stop();
    this.disposeAudioElement();

    if (this.currentAudio) {
      this.currentAudio.dispose();
      this.currentAudio = null;
    }

    this.duration = 0;
    this.currentTime = 0;

    console.log('🗑️ Audio file removed');
  }

  /**
   * Dispose audio element
   */
  disposeAudioElement() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement.load(); // Reset the element
      this.audioElement = null;
    }
  }

  /**
   * Cleanup all resources
   */
  dispose() {
    this.removeAudioFile();
    this.onTimeUpdate = null;
    this.onEnded = null;
    this.onError = null;
  }

  /**
   * Check if audio is currently loaded
   */
  hasAudio() {
    return !!this.currentAudio;
  }

  /**
   * Test function to hear audio after background removal
   * Sends audio to backend for vocal separation and plays the result
   */
  async testVocalSeparation() {
    if (!this.currentAudio) {
      throw new Error('No audio file loaded');
    }

    try {
      console.log('🎵 Starting vocal separation test...');

      // Stop current playback
      this.stop();

      // Create FormData to send to backend
      const formData = new FormData();
      formData.append('audio', this.currentAudio.file);

      // Send to backend for vocal separation
      const response = await fetch('http://localhost:5000/separate-vocals', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.note && errorData.note.includes('PyTorch')) {
          throw new Error(`Vocal separation failed due to PyTorch compatibility. Falling back to original audio. ${errorData.error}`);
        }
        throw new Error(`Vocal separation failed: ${errorData.error}`);
      }

      // Get the separated vocal audio as blob
      const vocalBlob = await response.blob();

      console.log('✅ Vocal separation completed');
      console.log(`📦 Vocal file size: ${(vocalBlob.size / 1024 / 1024).toFixed(2)} MB`);

      // Create a new audio element for the separated vocals
      const vocalAudio = new Audio();
      const vocalUrl = URL.createObjectURL(vocalBlob);
      vocalAudio.src = vocalUrl;

      // Play the separated vocals
      await vocalAudio.play();

      console.log('🎤 Playing separated vocals (background removed)');

      // Clean up URL when audio ends
      vocalAudio.addEventListener('ended', () => {
        URL.revokeObjectURL(vocalUrl);
        console.log('🔄 Vocal test playback completed');
      });

      // Return audio element for further control if needed
      return vocalAudio;

    } catch (error) {
      console.error('❌ Vocal separation test failed:', error);
      throw error;
    }
  }

  /**
   * Test function to analyze vocal separation without playback
   * Returns information about the separation process
   */
  async analyzeVocalSeparation() {
    if (!this.currentAudio) {
      throw new Error('No audio file loaded');
    }

    try {
      console.log('📊 Analyzing vocal separation...');

      const formData = new FormData();
      formData.append('audio', this.currentAudio.file);

      const response = await fetch('http://localhost:5000/analyze-vocals', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Analysis failed: ${errorData.error}`);
      }

      const analysisResult = await response.json();
      console.log('📈 Vocal separation analysis:', analysisResult);

      return analysisResult;

    } catch (error) {
      console.error('❌ Vocal separation analysis failed:', error);
      throw error;
    }
  }

  /**
   * Compare original and separated vocals by playing them sequentially
   */
  async compareOriginalWithVocals() {
    if (!this.currentAudio) {
      throw new Error('No audio file loaded');
    }

    try {
      console.log('🔄 Starting audio comparison test...');

      // First, play original for 10 seconds
      console.log('🎵 Playing original audio (10 seconds)...');
      await this.play();

      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      this.pause();

      // Brief pause
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Then get and play separated vocals
      console.log('🎤 Getting separated vocals...');
      const vocalAudio = await this.testVocalSeparation();

      return {
        message: 'Comparison completed - played original then separated vocals',
        originalDuration: this.duration,
        vocalAudio: vocalAudio
      };

    } catch (error) {
      console.error('❌ Audio comparison failed:', error);
      throw error;
    }
  }

  /**
   * Get current state
   */
  getState() {
    return {
      hasAudio: this.hasAudio(),
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      duration: this.duration,
      volume: this.volume,
      progress: this.getProgress(),
      audioInfo: this.getAudioInfo()
    };
  }
}