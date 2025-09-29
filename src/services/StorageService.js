/**
 * Storage Service - Handles persistent storage of songs
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Song } from '../models/Song.js';

const STORAGE_KEY = '@PitchKaraoke:Songs';
const SETTINGS_KEY = '@PitchKaraoke:Settings';

export class StorageService {
  /**
   * Save a song to storage
   */
  static async saveSong(song) {
    try {
      const existingSongs = await this.getAllSongs();
      existingSongs[song.id] = song.toJSON();
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existingSongs));
      console.log(`Song saved: ${song.title}`);
      return true;
    } catch (error) {
      console.error('Failed to save song:', error);
      throw new Error('Failed to save song to storage');
    }
  }

  /**
   * Load a song by ID
   */
  static async loadSong(songId) {
    try {
      const allSongs = await this.getAllSongs();
      const songData = allSongs[songId];
      
      if (!songData) {
        return null;
      }
      
      return Song.fromJSON(songData);
    } catch (error) {
      console.error('Failed to load song:', error);
      throw new Error('Failed to load song from storage');
    }
  }

  /**
   * Get all songs from storage
   */
  static async getAllSongs() {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      return storedData ? JSON.parse(storedData) : {};
    } catch (error) {
      console.error('Failed to get songs:', error);
      return {};
    }
  }

  /**
   * Get list of all songs for display
   */
  static async getSongList() {
    try {
      const allSongs = await this.getAllSongs();
      return Object.values(allSongs).map(songData => ({
        id: songData.id,
        title: songData.title,
        artist: songData.artist,
        duration: songData.totalDuration,
        segmentCount: songData.timeline?.length || 0,
        analyzedAt: songData.metadata?.analyzedAt,
        filePath: songData.filePath
      }));
    } catch (error) {
      console.error('Failed to get song list:', error);
      return [];
    }
  }

  /**
   * Delete a song
   */
  static async deleteSong(songId) {
    try {
      const allSongs = await this.getAllSongs();
      delete allSongs[songId];
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allSongs));
      console.log(`Song deleted: ${songId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete song:', error);
      throw new Error('Failed to delete song');
    }
  }

  /**
   * Find song by file path
   */
  static async findSongByPath(filePath) {
    try {
      const allSongs = await this.getAllSongs();
      const foundSong = Object.values(allSongs).find(song => 
        song.filePath === filePath
      );
      return foundSong ? foundSong.id : null;
    } catch (error) {
      console.error('Failed to find song by path:', error);
      return null;
    }
  }

  /**
   * Clear all songs
   */
  static async clearAllSongs() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Failed to clear songs:', error);
      throw new Error('Failed to clear songs');
    }
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats() {
    try {
      const allSongs = await this.getAllSongs();
      const songCount = Object.keys(allSongs).length;
      const totalSegments = Object.values(allSongs).reduce(
        (sum, song) => sum + (song.timeline?.length || 0), 0
      );
      
      return {
        songCount,
        totalSegments,
        averageSegmentsPerSong: songCount > 0 ? Math.round(totalSegments / songCount) : 0
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return { songCount: 0, totalSegments: 0, averageSegmentsPerSong: 0 };
    }
  }

  /**
   * Save user settings
   */
  static async saveSettings(settings) {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw new Error('Failed to save settings');
    }
  }

  /**
   * Load user settings
   */
  static async loadSettings() {
    try {
      const settingsData = await AsyncStorage.getItem(SETTINGS_KEY);
      return settingsData ? JSON.parse(settingsData) : this._getDefaultSettings();
    } catch (error) {
      console.error('Failed to load settings:', error);
      return this._getDefaultSettings();
    }
  }

  /**
   * Get default settings
   */
  static _getDefaultSettings() {
    return {
      volume: 1.0,
      pitchDetectionSensitivity: 0.5,
      autoPlay: true,
      showFrequencyLines: true,
      practiceMode: 'comparison', // 'comparison', 'follow-along', 'free-practice'
      theme: 'dark'
    };
  }
}