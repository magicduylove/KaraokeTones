/**
 * Song Controller - Manages song-related business logic
 */

import { StorageService } from '../services/StorageService.js';
import { AnalysisService } from '../services/AnalysisService.js';
import { Song } from '../models/Song.js';

export class SongController {
  constructor() {
    this.currentSong = null;
    this.songList = [];
    this.onSongChanged = null;
    this.onSongListUpdated = null;
  }

  /**
   * Initialize controller
   */
  async initialize() {
    await this.loadSongList();
  }

  /**
   * Load list of all songs
   */
  async loadSongList() {
    try {
      this.songList = await StorageService.getSongList();
      if (this.onSongListUpdated) {
        this.onSongListUpdated(this.songList);
      }
      return this.songList;
    } catch (error) {
      console.error('Failed to load song list:', error);
      throw error;
    }
  }

  /**
   * Load a specific song
   */
  async loadSong(songId) {
    try {
      const song = await StorageService.loadSong(songId);
      if (song) {
        this.currentSong = song;
        if (this.onSongChanged) {
          this.onSongChanged(this.currentSong);
        }
      }
      return song;
    } catch (error) {
      console.error('Failed to load song:', error);
      throw error;
    }
  }

  /**
   * Import song from analysis JSON
   */
  async importSongFromAnalysis(analysisJSON, originalFilePath = null) {
    try {
      const song = AnalysisService.importAnalysisFromJSON(analysisJSON, originalFilePath);
      
      // Save to storage
      await StorageService.saveSong(song);
      
      // Update lists
      await this.loadSongList();
      
      // Set as current song
      this.currentSong = song;
      if (this.onSongChanged) {
        this.onSongChanged(this.currentSong);
      }
      
      return song;
    } catch (error) {
      console.error('Failed to import song:', error);
      throw error;
    }
  }

  /**
   * Analyze song via API
   */
  async analyzeSong(filePath, songTitle, artist) {
    try {
      const song = await AnalysisService.analyzeSong(filePath, songTitle, artist);
      
      // Save to storage
      await StorageService.saveSong(song);
      
      // Update lists
      await this.loadSongList();
      
      // Set as current song
      this.currentSong = song;
      if (this.onSongChanged) {
        this.onSongChanged(this.currentSong);
      }
      
      return song;
    } catch (error) {
      console.error('Failed to analyze song:', error);
      throw error;
    }
  }

  /**
   * Delete a song
   */
  async deleteSong(songId) {
    try {
      await StorageService.deleteSong(songId);
      
      // Update song list
      await this.loadSongList();
      
      // Clear current song if it was deleted
      if (this.currentSong && this.currentSong.id === songId) {
        this.currentSong = null;
        if (this.onSongChanged) {
          this.onSongChanged(null);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to delete song:', error);
      throw error;
    }
  }

  /**
   * Find song by file path
   */
  async findSongByPath(filePath) {
    try {
      const songId = await StorageService.findSongByPath(filePath);
      if (songId) {
        return await this.loadSong(songId);
      }
      return null;
    } catch (error) {
      console.error('Failed to find song by path:', error);
      return null;
    }
  }

  /**
   * Get current song
   */
  getCurrentSong() {
    return this.currentSong;
  }

  /**
   * Get song list
   */
  getSongList() {
    return this.songList;
  }

  /**
   * Get segment at specific time
   */
  getSegmentAtTime(time) {
    if (!this.currentSong) return null;
    return this.currentSong.getSegmentAtTime(time);
  }

  /**
   * Get segments in time range
   */
  getSegmentsInRange(startTime, endTime) {
    if (!this.currentSong) return [];
    return this.currentSong.getSegmentsInRange(startTime, endTime);
  }

  /**
   * Get timeline summary for display
   */
  getTimelineSummary() {
    if (!this.currentSong) return [];
    
    return this.currentSong.timeline.map(segment => ({
      ...segment.toJSON(),
      ...segment.getDisplayProperties(),
      timeRange: `${this._formatTime(segment.startTime)} - ${this._formatTime(segment.endTime)}`
    }));
  }

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    return await StorageService.getStorageStats();
  }

  /**
   * Set event callbacks
   */
  setCallbacks(onSongChanged, onSongListUpdated) {
    this.onSongChanged = onSongChanged;
    this.onSongListUpdated = onSongListUpdated;
  }

  /**
   * Check if API is available
   */
  async checkApiAvailability() {
    return await AnalysisService.checkApiHealth();
  }

  /**
   * Private: Format time as MM:SS
   */
  _formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.currentSong = null;
    this.songList = [];
    this.onSongChanged = null;
    this.onSongListUpdated = null;
  }
}