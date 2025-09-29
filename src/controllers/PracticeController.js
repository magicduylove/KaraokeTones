/**
 * PracticeController - Main controller for practice sessions
 */

import { Session } from '../models/Session.js';
import { PitchDetectionService } from '../services/PitchDetectionService.js';
import { AudioService } from '../services/AudioService.js';

export class PracticeController {
  constructor() {
    this.session = new Session();
    this.pitchService = new PitchDetectionService();
    this.audioService = new AudioService();
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
   */\n  async importAudio(file) {\n    try {\n      const audioFile = await this.audioService.loadAudioFile(file);\n      this.session.setAudioFile(audioFile);\n      \n      this.emit('audioImported', {\n        audioFile,\n        audioInfo: this.audioService.getAudioInfo()\n      });\n      \n      console.log('✅ Audio imported successfully');\n      return audioFile;\n      \n    } catch (error) {\n      this.emit('error', {\n        type: 'audio_import',\n        message: error.message,\n        error\n      });\n      throw error;\n    }\n  }\n\n  /**\n   * Remove current audio file\n   */\n  removeAudio() {\n    this.audioService.removeAudioFile();\n    this.session.setAudioFile(null);\n    this.emit('audioRemoved');\n  }\n\n  /**\n   * Start recording and pitch detection\n   */\n  async startRecording() {\n    if (this.session.isRecording) {\n      console.warn('Recording is already active');\n      return;\n    }\n\n    try {\n      // Check if pitch detection is supported\n      if (!PitchDetectionService.isSupported()) {\n        throw new Error('Pitch detection is not supported in this browser');\n      }\n\n      // Start session\n      this.session.startRecording();\n\n      // Start pitch detection with callback\n      await this.pitchService.start((frequency, note, confidence) => {\n        const pitchData = this.session.addPitchData(frequency, note, confidence);\n        \n        this.emit('pitchDetected', {\n          pitchData,\n          currentPitch: this.session.currentPitch,\n          recentHistory: this.session.getRecentPitchHistory()\n        });\n      });\n\n      this.emit('recordingStarted', {\n        sessionId: this.session.id,\n        startTime: this.session.startTime\n      });\n\n      console.log('✅ Recording started');\n\n    } catch (error) {\n      this.session.isRecording = false;\n      this.emit('error', {\n        type: 'recording_start',\n        message: error.message,\n        error\n      });\n      throw error;\n    }\n  }\n\n  /**\n   * Stop recording and pitch detection\n   */\n  stopRecording() {\n    if (!this.session.isRecording) {\n      console.warn('Recording is not active');\n      return;\n    }\n\n    // Stop pitch detection\n    this.pitchService.stop();\n\n    // Stop session\n    this.session.stopRecording();\n\n    this.emit('recordingStopped', {\n      sessionId: this.session.id,\n      duration: this.session.getDuration(),\n      stats: this.session.stats,\n      pitchHistory: this.session.pitchHistory\n    });\n\n    console.log('🛑 Recording stopped');\n  }\n\n  /**\n   * Clear current session\n   */\n  clearSession() {\n    // Stop recording if active\n    if (this.session.isRecording) {\n      this.stopRecording();\n    }\n\n    // Stop audio\n    this.audioService.stop();\n\n    // Clear session data\n    this.session.clear();\n\n    this.emit('sessionCleared');\n    console.log('🗑️ Session cleared');\n  }\n\n  /**\n   * Audio playback controls\n   */\n  async playAudio() {\n    try {\n      await this.audioService.play();\n      this.emit('audioPlaybackStarted');\n    } catch (error) {\n      this.emit('error', {\n        type: 'audio_playback',\n        message: error.message,\n        error\n      });\n      throw error;\n    }\n  }\n\n  pauseAudio() {\n    this.audioService.pause();\n    this.emit('audioPlaybackPaused');\n  }\n\n  stopAudio() {\n    this.audioService.stop();\n    this.emit('audioPlaybackStopped');\n  }\n\n  seekAudio(time) {\n    this.audioService.seekTo(time);\n    this.emit('audioSeeked', { time });\n  }\n\n  setAudioVolume(volume) {\n    this.audioService.setVolume(volume);\n    this.emit('audioVolumeChanged', { volume });\n  }\n\n  /**\n   * Get current application state\n   */\n  getState() {\n    return {\n      session: this.session.toJSON(),\n      audio: this.audioService.getState(),\n      pitchDetection: this.pitchService.getStatus(),\n      isRecording: this.session.isRecording,\n      hasAudio: this.audioService.hasAudio()\n    };\n  }\n\n  /**\n   * Get session statistics\n   */\n  getSessionStats() {\n    return {\n      ...this.session.stats,\n      duration: this.session.getFormattedDuration(),\n      pitchCount: this.session.pitchHistory.length\n    };\n  }\n\n  /**\n   * Export session data\n   */\n  exportSession() {\n    return {\n      ...this.session.toJSON(),\n      exportedAt: Date.now(),\n      version: '1.0'\n    };\n  }\n\n  /**\n   * Cleanup resources\n   */\n  dispose() {\n    // Stop any active operations\n    this.stopRecording();\n    this.audioService.dispose();\n    \n    // Clear session\n    this.session.clear();\n    \n    // Clear event listeners\n    this.listeners.clear();\n    \n    console.log('🧹 Practice controller disposed');\n  }\n}