/**
 * Practice Controller - Manages practice session logic
 */

import { AudioService } from '../services/AudioService.js';
import { PitchDetectionService } from '../services/PitchDetectionService.js';
import { PitchData } from '../models/PitchData.js';

export class PracticeController {
  constructor(songController) {
    this.songController = songController;
    this.audioService = new AudioService();
    this.pitchDetectionService = new PitchDetectionService();
    
    this.isActive = false;
    this.currentUserPitch = null;
    this.userPitchHistory = [];
    this.practiceStats = {
      totalNotes: 0,
      correctNotes: 0,
      accuracy: 0
    };
    
    // Callbacks
    this.onPlaybackUpdate = null;
    this.onPitchDetected = null;
    this.onStatsUpdated = null;
  }

  /**
   * Initialize practice session
   */
  async initialize() {
    await this.audioService.initialize();
    await this.pitchDetectionService.initialize();
    
    // Set up audio playback callback
    this.audioService.setPlaybackStatusUpdateCallback((status) => {
      if (this.onPlaybackUpdate) {
        this.onPlaybackUpdate(status);
      }
      
      // Update practice stats based on current position
      this._updatePracticeStats(status.currentPosition);
    });
    
    // Set up pitch detection callback
    this.pitchDetectionService.start((pitchData) => {
      this.currentUserPitch = pitchData;
      
      if (this.isActive && pitchData.isValid()) {
        this.userPitchHistory.push({
          ...pitchData,
          timestamp: this.audioService.currentPosition
        });
        
        // Keep history manageable
        if (this.userPitchHistory.length > 1000) {
          this.userPitchHistory = this.userPitchHistory.slice(-500);
        }
      }
      
      if (this.onPitchDetected) {
        this.onPitchDetected(pitchData);
      }
    });
  }

  /**
   * Start practice session
   */
  async startPractice(filePath) {
    try {
      const currentSong = this.songController.getCurrentSong();
      if (!currentSong) {
        throw new Error('No song loaded for practice');
      }

      // Load audio
      await this.audioService.loadAudio(filePath);
      
      // Start pitch detection
      this.pitchDetectionService.start((pitchData) => {
        this.currentUserPitch = pitchData;
        
        if (this.isActive && pitchData.isValid()) {
          this.userPitchHistory.push({
            ...pitchData,
            timestamp: this.audioService.currentPosition
          });
          
          // Keep history manageable
          if (this.userPitchHistory.length > 1000) {
            this.userPitchHistory = this.userPitchHistory.slice(-500);
          }
        }
        
        if (this.onPitchDetected) {
          this.onPitchDetected(pitchData);
        }
      });
      
      this.isActive = true;
      this._resetStats();
      
      return true;
    } catch (error) {
      console.error('Failed to start practice:', error);
      throw error;
    }
  }

  /**
   * Stop practice session
   */
  async stopPractice() {
    this.isActive = false;
    await this.audioService.stop();
    this.pitchDetectionService.stop();
    this._resetStats();
  }

  /**
   * Play/pause audio
   */
  async togglePlayback() {
    if (this.audioService.isPlaying) {
      await this.audioService.pause();
    } else {
      await this.audioService.play();
    }
  }

  /**
   * Seek to specific time
   */
  async seekTo(timeSeconds) {
    await this.audioService.seekTo(timeSeconds);
  }

  /**
   * Get current playback state
   */
  getPlaybackState() {
    return this.audioService.getPlaybackState();
  }

  /**
   * Get current user pitch
   */
  getCurrentUserPitch() {
    return this.currentUserPitch;
  }

  /**
   * Get expected pitch at current time
   */
  getCurrentExpectedPitch() {
    const currentTime = this.audioService.currentPosition;
    const segment = this.songController.getSegmentAtTime(currentTime);
    
    if (!segment || segment.note === '--') {
      return null;
    }
    
    return PitchData.fromFrequency(segment.frequency);
  }

  /**
   * Get pitch comparison at current time
   */
  getCurrentPitchComparison() {
    const userPitch = this.getCurrentUserPitch();
    const expectedPitch = this.getCurrentExpectedPitch();
    
    if (!userPitch || !expectedPitch) {
      return null;
    }
    
    return userPitch.compareTo(expectedPitch);
  }

  /**
   * Get user pitch history for visualization
   */
  getUserPitchHistory() {
    return this.userPitchHistory;
  }

  /**
   * Get practice statistics
   */
  getPracticeStats() {
    return { ...this.practiceStats };
  }

  /**
   * Set event callbacks
   */
  setCallbacks(onPlaybackUpdate, onPitchDetected, onStatsUpdated) {
    this.onPlaybackUpdate = onPlaybackUpdate;
    this.onPitchDetected = onPitchDetected;
    this.onStatsUpdated = onStatsUpdated;
  }

  /**
   * Get visualization data for current time window
   */
  getVisualizationData(windowDuration = 10) {
    const currentTime = this.audioService.currentPosition;
    const song = this.songController.getCurrentSong();
    
    if (!song) return { songData: [], userData: [] };
    
    const startTime = Math.max(0, currentTime - windowDuration / 2);
    const endTime = currentTime + windowDuration / 2;
    
    // Get song segments in window
    const songSegments = song.getSegmentsInRange(startTime, endTime);
    
    // Get user pitch history in window
    const userPitches = this.userPitchHistory.filter(pitch => 
      pitch.timestamp >= startTime && pitch.timestamp <= endTime
    );
    
    return {
      songData: songSegments.map(segment => ({
        startTime: segment.startTime,
        endTime: segment.endTime,
        frequency: segment.frequency,
        note: segment.note,
        type: segment.type
      })),
      userData: userPitches.map(pitch => ({
        time: pitch.timestamp,
        frequency: pitch.frequency,
        note: pitch.getNoteString()
      })),
      currentTime,
      windowStart: startTime,
      windowEnd: endTime
    };
  }

  /**
   * Private: Update practice statistics
   */
  _updatePracticeStats(currentTime) {
    const comparison = this.getCurrentPitchComparison();
    
    if (comparison) {
      this.practiceStats.totalNotes++;
      
      if (comparison.isOnPitch) {
        this.practiceStats.correctNotes++;
      }
      
      this.practiceStats.accuracy = this.practiceStats.totalNotes > 0
        ? (this.practiceStats.correctNotes / this.practiceStats.totalNotes) * 100
        : 0;
      
      if (this.onStatsUpdated) {
        this.onStatsUpdated(this.practiceStats);
      }
    }
  }

  /**
   * Private: Reset statistics
   */
  _resetStats() {
    this.practiceStats = {
      totalNotes: 0,
      correctNotes: 0,
      accuracy: 0
    };
    this.userPitchHistory = [];
    this.currentUserPitch = null;
    
    if (this.onStatsUpdated) {
      this.onStatsUpdated(this.practiceStats);
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    this.isActive = false;
    await this.audioService.cleanup();
    await this.pitchDetectionService.cleanup();
    this._resetStats();
  }
}