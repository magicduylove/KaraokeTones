/**
 * Analysis Service - Handles song analysis via API and direct audio analysis
 */

import { Song } from '../models/Song.js';
import { AudioAnalysisService } from './AudioAnalysisService.js';

const API_BASE_URL = 'http://localhost:3001';

export class AnalysisService {
  /**
   * Analyze audio file directly using Web Audio API
   */
  static async analyzeAudioFile(filePath, songTitle, artist = 'Unknown Artist') {
    try {
      const analysisService = new AudioAnalysisService();
      const analysisResult = await analysisService.analyzeAudioFile(filePath);
      
      // Convert to Song model
      const song = new Song(
        Song.generateId(filePath),
        songTitle,
        artist,
        filePath,
        analysisResult.duration
      );

      // Convert timeline to segments
      const timeline = analysisResult.toTimeline();
      timeline.forEach(segment => {
        song.addSegment(
          segment.startTime,
          segment.duration,
          segment.note,
          segment.frequency,
          segment.type || 'instrumental'
        );
      });

      await analysisService.cleanup();
      return song;
      
    } catch (error) {
      console.error('Direct audio analysis failed:', error);
      throw new Error(`Audio analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze audio file via API
   */
  static async analyzeSong(filePath, songTitle, artist = 'Unknown Artist') {
    try {
      // Create form data
      const formData = new FormData();
      
      // Add file - this would need proper file handling in a real app
      const file = await this._getFileFromPath(filePath);
      formData.append('audio', file);
      formData.append('songTitle', songTitle);
      formData.append('artist', artist);

      // Send to analysis API
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      // Convert API result to Song model
      return this._convertApiResultToSong(result.analysis, filePath);
      
    } catch (error) {
      console.error('Analysis failed:', error);
      throw new Error(`Song analysis failed: ${error.message}`);
    }
  }

  /**
   * Import analysis result from JSON
   */
  static importAnalysisFromJSON(jsonData, originalFilePath = null) {
    try {
      const analysisData = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      
      if (!analysisData.success || !analysisData.analysis) {
        throw new Error('Invalid analysis format');
      }

      return this._convertApiResultToSong(analysisData.analysis, originalFilePath);
      
    } catch (error) {
      console.error('Import failed:', error);
      throw new Error(`Failed to import analysis: ${error.message}`);
    }
  }

  /**
   * Check API health
   */
  static async checkApiHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const result = await response.json();
      return response.ok && result.status === 'ok';
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }

  /**
   * Get API status and capabilities
   */
  static async getApiStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/status`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get API status:', error);
      return null;
    }
  }

  /**
   * Private: Convert API result to Song model
   */
  static _convertApiResultToSong(analysisData, filePath) {
    const song = new Song(
      analysisData.songId || Song.generateId(filePath || analysisData.title),
      analysisData.title,
      analysisData.artist,
      filePath || analysisData.filePath,
      analysisData.totalDuration
    );

    // Add segments
    if (analysisData.timeline && Array.isArray(analysisData.timeline)) {
      analysisData.timeline.forEach(segment => {
        song.addSegment(
          segment.startTime,
          segment.duration,
          segment.note,
          segment.frequency,
          segment.type || 'vocal',
          segment.lyric
        );
      });
    }

    // Update metadata
    if (analysisData.metadata) {
      song.updateMetadata(analysisData.metadata);
    }

    return song;
  }

  /**
   * Private: Get file from path (placeholder for proper file handling)
   */
  static async _getFileFromPath(filePath) {
    // In a real implementation, this would handle file reading properly
    // For now, we'll assume the file is available as a blob or file object
    
    try {
      // Try to fetch as URL first
      const response = await fetch(filePath);
      const blob = await response.blob();
      return new File([blob], filePath.split('/').pop(), { type: 'audio/mpeg' });
    } catch (error) {
      console.error('File not accessible via URL:', error);
      throw new Error('Cannot access audio file for analysis');
    }
  }

  /**
   * Validate analysis result
   */
  static validateAnalysisResult(analysisData) {
    const required = ['songId', 'title', 'totalDuration', 'timeline'];
    const missing = required.filter(field => !(field in analysisData));
    
    if (missing.length > 0) {
      throw new Error(`Analysis result missing required fields: ${missing.join(', ')}`);
    }

    if (!Array.isArray(analysisData.timeline)) {
      throw new Error('Timeline must be an array');
    }

    return true;
  }
}