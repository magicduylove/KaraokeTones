/**
 * Song Storage System - Save and load analyzed pitch maps
 * Stores songs with their pitch timeline data locally
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@PitchKaraoke:AnalyzedSongs';
const SONG_VERSION = '1.0'; // For future data structure updates

/**
 * Timeline-based pitch map data structure
 * Example: { time: 61.5, duration: 1.5, note: 'C#4', frequency: 277.18 }
 */
export class SongPitchMap {
  constructor(songId, title, artist, filePath, totalDuration) {
    this.songId = songId;
    this.title = title;
    this.artist = artist;
    this.filePath = filePath; // Path to MP3 file
    this.totalDuration = totalDuration; // Total song duration in seconds
    this.timeline = []; // Array of pitch segments
    this.metadata = {
      version: SONG_VERSION,
      analyzedAt: new Date().toISOString(),
      sampleRate: 44100,
      bpm: null, // To be estimated
      key: null, // To be estimated
      vocalRange: { lowest: null, highest: null }
    };
  }

  /**
   * Add a pitch segment to the timeline
   * @param {number} startTime - Start time in seconds (e.g., 61.0 for 1:01)
   * @param {number} duration - Duration in seconds
   * @param {string} note - Musical note (e.g., 'C#4')
   * @param {number} frequency - Frequency in Hz
   * @param {string} lyric - Optional lyric text
   */
  addPitchSegment(startTime, duration, note, frequency, lyric = null) {
    this.timeline.push({
      startTime,
      endTime: startTime + duration,
      duration,
      note,
      frequency,
      lyric,
      id: `segment_${this.timeline.length}`
    });
    
    // Sort timeline by start time
    this.timeline.sort((a, b) => a.startTime - b.startTime);
  }

  /**
   * Get pitch segment at specific time
   * @param {number} currentTime - Time in seconds
   * @returns {Object|null} Active pitch segment or null
   */
  getPitchAtTime(currentTime) {
    return this.timeline.find(segment => 
      currentTime >= segment.startTime && currentTime < segment.endTime
    );
  }

  /**
   * Get all pitch segments within a time range
   * @param {number} startTime - Start time in seconds
   * @param {number} endTime - End time in seconds
   * @returns {Array} Array of pitch segments
   */
  getPitchRange(startTime, endTime) {
    return this.timeline.filter(segment =>
      segment.startTime < endTime && segment.endTime > startTime
    );
  }

  /**
   * Convert time to readable format (MM:SS)
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted time string
   */
  static formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Get timeline summary for display
   * @returns {Array} Summary of pitch segments with formatted times
   */
  getTimelineSummary() {
    return this.timeline.map(segment => ({
      ...segment,
      timeRange: `${SongPitchMap.formatTime(segment.startTime)} - ${SongPitchMap.formatTime(segment.endTime)}`,
      displayNote: segment.note === '--' ? 'Rest' : segment.note
    }));
  }

  /**
   * Update metadata after analysis
   * @param {Object} metadata - Metadata object with bpm, key, vocalRange
   */
  updateMetadata(metadata) {
    this.metadata = { ...this.metadata, ...metadata };
  }

  /**
   * Export to JSON format for storage
   * @returns {Object} JSON-serializable object
   */
  toJSON() {
    return {
      songId: this.songId,
      title: this.title,
      artist: this.artist,
      filePath: this.filePath,
      totalDuration: this.totalDuration,
      timeline: this.timeline,
      metadata: this.metadata
    };
  }

  /**
   * Create from JSON data
   * @param {Object} data - JSON data
   * @returns {SongPitchMap} New SongPitchMap instance
   */
  static fromJSON(data) {
    const song = new SongPitchMap(
      data.songId,
      data.title,
      data.artist,
      data.filePath,
      data.totalDuration
    );
    song.timeline = data.timeline || [];
    song.metadata = data.metadata || song.metadata;
    return song;
  }
}

/**
 * Song Storage Manager
 */
export class SongStorage {
  /**
   * Save analyzed song to storage
   * @param {SongPitchMap} songPitchMap - Song pitch map to save
   */
  static async saveSong(songPitchMap) {
    try {
      const existingSongs = await this.getAllSongs();
      existingSongs[songPitchMap.songId] = songPitchMap.toJSON();
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existingSongs));
      console.log(`Song saved: ${songPitchMap.title} (ID: ${songPitchMap.songId})`);
      return true;
    } catch (error) {
      console.error('Error saving song:', error);
      return false;
    }
  }

  /**
   * Load specific song by ID
   * @param {string} songId - Song ID to load
   * @returns {SongPitchMap|null} Song pitch map or null if not found
   */
  static async loadSong(songId) {
    try {
      const allSongs = await this.getAllSongs();
      const songData = allSongs[songId];
      
      if (songData) {
        return SongPitchMap.fromJSON(songData);
      }
      return null;
    } catch (error) {
      console.error('Error loading song:', error);
      return null;
    }
  }

  /**
   * Get all stored songs
   * @returns {Object} Object with song IDs as keys and song data as values
   */
  static async getAllSongs() {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      return storedData ? JSON.parse(storedData) : {};
    } catch (error) {
      console.error('Error getting all songs:', error);
      return {};
    }
  }

  /**
   * Get list of all songs for display
   * @returns {Array} Array of song summaries
   */
  static async getSongList() {
    try {
      const allSongs = await this.getAllSongs();
      return Object.values(allSongs).map(songData => ({
        songId: songData.songId,
        title: songData.title,
        artist: songData.artist,
        duration: songData.totalDuration,
        analyzedAt: songData.metadata?.analyzedAt,
        segmentCount: songData.timeline?.length || 0,
        filePath: songData.filePath
      }));
    } catch (error) {
      console.error('Error getting song list:', error);
      return [];
    }
  }

  /**
   * Delete song from storage
   * @param {string} songId - Song ID to delete
   */
  static async deleteSong(songId) {
    try {
      const allSongs = await this.getAllSongs();
      delete allSongs[songId];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allSongs));
      console.log(`Song deleted: ${songId}`);
      return true;
    } catch (error) {
      console.error('Error deleting song:', error);
      return false;
    }
  }

  /**
   * Check if song is already analyzed
   * @param {string} filePath - File path to check
   * @returns {string|null} Song ID if exists, null otherwise
   */
  static async findSongByPath(filePath) {
    try {
      const allSongs = await this.getAllSongs();
      const foundSong = Object.values(allSongs).find(song => song.filePath === filePath);
      return foundSong ? foundSong.songId : null;
    } catch (error) {
      console.error('Error finding song by path:', error);
      return null;
    }
  }

  /**
   * Clear all stored songs (for development/testing)
   */
  static async clearAllSongs() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log('All songs cleared from storage');
      return true;
    } catch (error) {
      console.error('Error clearing songs:', error);
      return false;
    }
  }

  /**
   * Generate unique song ID from file path
   * @param {string} filePath - File path
   * @returns {string} Unique song ID
   */
  static generateSongId(filePath) {
    const fileName = filePath.split('/').pop().replace('.mp3', '');
    const timestamp = Date.now().toString(36);
    return `${fileName}_${timestamp}`;
  }

  /**
   * Get storage statistics
   * @returns {Object} Storage stats
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
      console.error('Error getting storage stats:', error);
      return { songCount: 0, totalSegments: 0, averageSegmentsPerSong: 0 };
    }
  }
}

export default SongStorage;