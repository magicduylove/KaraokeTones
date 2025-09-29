/**
 * PitchData Model - Represents pitch detection data
 */

export class PitchData {
  constructor(frequency = null, note = null, confidence = 0, timestamp = Date.now()) {
    this.frequency = frequency;
    this.note = note;
    this.confidence = confidence;
    this.timestamp = timestamp;
    this.id = this.generateId();
  }

  /**
   * Generate unique ID for pitch data
   */
  generateId() {
    return `pitch_${this.timestamp}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if pitch data is valid (has detectable frequency)
   */
  isValid() {
    return this.frequency !== null && this.frequency > 0;
  }

  /**
   * Check if pitch is silent (no detectable frequency)
   */
  isSilent() {
    return !this.isValid();
  }

  /**
   * Get octave number from note
   */
  getOctave() {
    if (!this.note) return null;
    const match = this.note.match(/(\d+)$/);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * Get note name without octave
   */
  getNoteName() {
    if (!this.note) return null;
    return this.note.replace(/\d+$/, '');
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON() {
    return {
      id: this.id,
      frequency: this.frequency,
      note: this.note,
      confidence: this.confidence,
      timestamp: this.timestamp
    };
  }

  /**
   * Create PitchData from plain object
   */
  static fromJSON(data) {
    const pitchData = new PitchData(
      data.frequency,
      data.note,
      data.confidence,
      data.timestamp
    );
    pitchData.id = data.id || pitchData.id;
    return pitchData;
  }

  /**
   * Create silent pitch data
   */
  static createSilent(timestamp = Date.now()) {
    return new PitchData(null, null, 0, timestamp);
  }
}