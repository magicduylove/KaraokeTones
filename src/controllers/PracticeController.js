/**
 * PracticeController - Main controller for practice sessions
 */

import { Session } from '../models/Session.js';
import { PitchDetectionService } from '../services/PitchDetectionService.js';
import { AudioService } from '../services/AudioService.js';
import { SongAnalysisService } from '../services/SongAnalysisService.js';
import { PitchComparisonService } from '../services/PitchComparisonService.js';

export class PracticeController {
  constructor() {
    this.session = new Session();
    this.pitchService = new PitchDetectionService();
    this.audioService = new AudioService();
    this.songAnalysisService = new SongAnalysisService();
    this.pitchComparisonService = new PitchComparisonService();
    this.listeners = new Map();

    // Bind service callbacks
    this.setupServiceCallbacks();
  }

  /**
   * Setup callbacks for services
   */
  setupServiceCallbacks() {
    // Audio service callbacks
    this.audioService.onTimeUpdate = (currentTime, duration) => {
      this.emit('audioTimeUpdate', { currentTime, duration });
    };

    this.audioService.onEnded = () => {
      this.emit('audioEnded');
    };

    this.audioService.onError = (error) => {
      this.emit('audioError', error);
    };
  }

  /**
   * Event listener management
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Import audio file for practice
   */
  async importAudio(file) {
    try {
      // Load audio file for playback
      const audioFile = await this.audioService.loadAudioFile(file);
      this.session.setAudioFile(audioFile);

      this.emit('audioImported', {
        audioFile,
        audioInfo: this.audioService.getAudioInfo()
      });

      // Start song analysis for pitch comparison
      this.emit('songAnalysisStarted', { fileName: file.name });

      try {
        const analysisData = await this.songAnalysisService.analyzeSong(file);
        this.pitchComparisonService.setSongAnalysis(analysisData);

        this.emit('songAnalysisCompleted', {
          analysisData,
          analysisInfo: this.songAnalysisService.getAnalysisInfo()
        });

        console.log('✅ Audio imported and analyzed successfully');
      } catch (analysisError) {
        console.warn('⚠️ Song analysis failed, but audio playback will work:', analysisError.message);
        this.emit('songAnalysisFailed', {
          error: analysisError.message
        });
      }

      return audioFile;

    } catch (error) {
      this.emit('error', {
        type: 'audio_import',
        message: error.message,
        error
      });
      throw error;
    }
  }

  /**
   * Remove current audio file
   */
  removeAudio() {
    this.audioService.removeAudioFile();
    this.session.setAudioFile(null);
    this.songAnalysisService.clearAnalysis();
    this.pitchComparisonService.clearHistory();
    this.emit('audioRemoved');
  }

  /**
   * Start recording and pitch detection
   */
  async startRecording() {
    if (this.session.isRecording) {
      console.warn('Recording is already active');
      return;
    }

    try {
      // Check if pitch detection is supported
      if (!PitchDetectionService.isSupported()) {
        throw new Error('Pitch detection is not supported in this browser');
      }

      // Start session
      this.session.startRecording();

      // Start pitch detection with callback
      await this.pitchService.start((frequency, note, confidence) => {
        const pitchData = this.session.addPitchData(frequency, note, confidence);

        // Perform pitch comparison if song analysis is available
        let pitchComparison = null;
        if (this.songAnalysisService.hasAnalysis() && this.audioService.isPlaying) {
          const currentTime = this.audioService.currentTime;
          pitchComparison = this.pitchComparisonService.comparePitch(pitchData, currentTime);
        }

        this.emit('pitchDetected', {
          pitchData,
          currentPitch: this.session.currentPitch,
          recentHistory: this.session.getRecentPitchHistory(),
          pitchComparison: pitchComparison
        });
      });

      this.emit('recordingStarted', {
        sessionId: this.session.id,
        startTime: this.session.startTime
      });

      console.log('✅ Recording started');

    } catch (error) {
      this.session.isRecording = false;
      this.emit('error', {
        type: 'recording_start',
        message: error.message,
        error
      });
      throw error;
    }
  }

  /**
   * Stop recording and pitch detection
   */
  stopRecording() {
    if (!this.session.isRecording) {
      console.warn('Recording is not active');
      return;
    }

    // Stop pitch detection
    this.pitchService.stop();

    // Stop session
    this.session.stopRecording();

    this.emit('recordingStopped', {
      sessionId: this.session.id,
      duration: this.session.getDuration(),
      stats: this.session.stats,
      pitchHistory: this.session.pitchHistory
    });

    console.log('🛑 Recording stopped');
  }

  /**
   * Clear current session
   */
  clearSession() {
    // Stop recording if active
    if (this.session.isRecording) {
      this.stopRecording();
    }

    // Stop audio
    this.audioService.stop();

    // Clear session data
    this.session.clear();

    this.emit('sessionCleared');
    console.log('🗑️ Session cleared');
  }

  /**
   * Audio playback controls
   */
  async playAudio() {
    try {
      await this.audioService.play();
      this.emit('audioPlaybackStarted');
    } catch (error) {
      this.emit('error', {
        type: 'audio_playback',
        message: error.message,
        error
      });
      throw error;
    }
  }

  pauseAudio() {
    this.audioService.pause();
    this.emit('audioPlaybackPaused');
  }

  stopAudio() {
    this.audioService.stop();
    this.emit('audioPlaybackStopped');
  }

  seekAudio(time) {
    this.audioService.seekTo(time);
    this.emit('audioSeeked', { time });
  }

  setAudioVolume(volume) {
    this.audioService.setVolume(volume);
    this.emit('audioVolumeChanged', { volume });
  }

  /**
   * Get current application state
   */
  getState() {
    return {
      session: this.session.toJSON(),
      audio: this.audioService.getState(),
      pitchDetection: this.pitchService.getStatus(),
      isRecording: this.session.isRecording,
      hasAudio: this.audioService.hasAudio()
    };
  }

  /**
   * Get session statistics
   */
  getSessionStats() {
    const basicStats = {
      ...this.session.stats,
      duration: this.session.getFormattedDuration(),
      pitchCount: this.session.pitchHistory.length
    };

    // Add pitch comparison stats if available
    if (this.songAnalysisService.hasAnalysis()) {
      const comparisonStats = this.pitchComparisonService.getSessionStats();
      return {
        ...basicStats,
        pitchComparison: comparisonStats,
        hasSongAnalysis: true
      };
    }

    return {
      ...basicStats,
      hasSongAnalysis: false
    };
  }

  /**
   * Export session data
   */
  exportSession() {
    return {
      ...this.session.toJSON(),
      exportedAt: Date.now(),
      version: '1.0'
    };
  }

  /**
   * Cleanup resources
   */
  dispose() {
    // Stop any active operations
    this.stopRecording();
    this.audioService.dispose();

    // Clear session
    this.session.clear();

    // Clear event listeners
    this.listeners.clear();

    console.log('Practice controller disposed');
  }
}