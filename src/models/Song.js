/**
 * Song Model - Core data structure for songs
 */

export class Song {
  constructor(id, title, artist, filePath, totalDuration = 0) {
    this.id = id;
    this.title = title;
    this.artist = artist;
    this.filePath = filePath;
    this.totalDuration = totalDuration;
    this.timeline = [];
    this.metadata = {
      version: '1.0',
      analyzedAt: new Date().toISOString(),
      sampleRate: 44100,
      bpm: null,
      key: null,
      vocalRange: { lowest: null, highest: null },
      segmentCount: 0
    };
  }

  /**
   * Add a pitch segment to the timeline
   */
  addSegment(startTime, duration, note, frequency, type = 'vocal', lyric = null) {
    const segment = new PitchSegment(
      `segment_${this.timeline.length}`,
      startTime,
      duration,
      note,
      frequency,
      type,
      lyric
    );
    
    this.timeline.push(segment);
    this.timeline.sort((a, b) => a.startTime - b.startTime);
    this.metadata.segmentCount = this.timeline.length;
    
    return segment;
  }

  /**
   * Get segment at specific time
   */
  getSegmentAtTime(currentTime) {
    return this.timeline.find(segment => 
      currentTime >= segment.startTime && currentTime < segment.endTime
    );
  }

  /**
   * Get segments within time range
   */
  getSegmentsInRange(startTime, endTime) {
    return this.timeline.filter(segment =>
      segment.startTime < endTime && segment.endTime > startTime
    );
  }

  /**
   * Update metadata
   */
  updateMetadata(metadata) {
    this.metadata = { ...this.metadata, ...metadata };
  }

  /**
   * Serialize to JSON
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      artist: this.artist,
      filePath: this.filePath,
      totalDuration: this.totalDuration,
      timeline: this.timeline.map(segment => segment.toJSON()),
      metadata: this.metadata
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(data) {
    const song = new Song(
      data.id,
      data.title,
      data.artist,
      data.filePath,
      data.totalDuration
    );
    
    song.timeline = (data.timeline || []).map(segmentData => 
      PitchSegment.fromJSON(segmentData)
    );
    song.metadata = data.metadata || song.metadata;
    
    return song;
  }

  /**
   * Generate unique song ID
   */
  static generateId(filePath) {
    const fileName = filePath.split('/').pop().replace('.mp3', '');
    const timestamp = Date.now().toString(36);
    return `${fileName}_${timestamp}`;
  }
}

export class PitchSegment {
  constructor(id, startTime, duration, note, frequency, type = 'vocal', lyric = null) {
    this.id = id;
    this.startTime = startTime;
    this.duration = duration;
    this.endTime = startTime + duration;
    this.note = note;
    this.frequency = frequency;
    this.type = type; // 'vocal', 'instrumental', 'silence'
    this.lyric = lyric;
  }

  /**
   * Check if segment is active at given time
   */
  isActiveAt(time) {
    return time >= this.startTime && time < this.endTime;
  }

  /**
   * Get display properties
   */
  getDisplayProperties() {
    return {
      displayNote: this.note === '--' ? 'Rest' : this.note,
      typeIcon: this.type === 'vocal' ? '🎤' : this.type === 'instrumental' ? '🎵' : '🔇',
      color: this.type === 'vocal' ? '#00ff00' : this.type === 'instrumental' ? '#00aaff' : '#888888'
    };
  }

  /**
   * Serialize to JSON
   */
  toJSON() {
    return {
      id: this.id,
      startTime: this.startTime,
      duration: this.duration,
      endTime: this.endTime,
      note: this.note,
      frequency: this.frequency,
      type: this.type,
      lyric: this.lyric
    };
  }

  /**
   * Create from JSON
   */
  static fromJSON(data) {
    return new PitchSegment(
      data.id,
      data.startTime,
      data.duration,
      data.note,
      data.frequency,
      data.type,
      data.lyric
    );
  }
}