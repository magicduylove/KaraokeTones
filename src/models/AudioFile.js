/**
 * AudioFile Model - Represents imported audio files
 */

export class AudioFile {
  constructor(file) {
    this.file = file;
    this.name = file.name;
    this.size = file.size;
    this.type = file.type;
    this.lastModified = file.lastModified;
    this.url = null;
    this.duration = null;
    this.isLoaded = false;
    this.id = this.generateId();
  }

  /**
   * Generate unique ID for audio file
   */
  generateId() {
    return `audio_${this.lastModified}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create object URL for audio playback
   */
  createObjectURL() {
    if (!this.url) {
      this.url = URL.createObjectURL(this.file);
    }
    return this.url;
  }

  /**
   * Revoke object URL to free memory
   */
  revokeObjectURL() {
    if (this.url) {
      URL.revokeObjectURL(this.url);
      this.url = null;
    }
  }

  /**
   * Get file extension
   */
  getExtension() {
    return this.name.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Check if file type is supported
   */
  isSupported() {
    const supportedTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
      'audio/m4a', 'audio/aac', 'audio/flac'
    ];
    return supportedTypes.includes(this.type) ||
           this.type.startsWith('audio/');
  }

  /**
   * Format file size for display
   */
  getFormattedSize() {
    if (this.size === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(this.size) / Math.log(k));
    return parseFloat((this.size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format duration for display
   */
  getFormattedDuration() {
    if (!this.duration) return 'Unknown';
    const minutes = Math.floor(this.duration / 60);
    const seconds = Math.floor(this.duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Load audio metadata (duration, etc.)
   */
  async loadMetadata() {
    return new Promise((resolve, reject) => {
      const audio = new Audio();

      audio.onloadedmetadata = () => {
        this.duration = audio.duration;
        this.isLoaded = true;
        resolve(this);
      };

      audio.onerror = () => {
        reject(new Error('Failed to load audio metadata'));
      };

      audio.src = this.createObjectURL();
    });
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      size: this.size,
      type: this.type,
      lastModified: this.lastModified,
      duration: this.duration,
      isLoaded: this.isLoaded
    };
  }

  /**
   * Cleanup resources
   */
  dispose() {
    this.revokeObjectURL();
  }
}