/**
 * Pitch Data Model - Represents pitch detection results
 */

export class PitchData {
  constructor(frequency, note, octave, cents = 0, confidence = 0) {
    this.frequency = frequency;
    this.note = note;
    this.octave = octave;
    this.cents = cents;
    this.confidence = confidence;
    this.timestamp = Date.now();
  }

  /**
   * Check if pitch is valid (within vocal range)
   */
  isValid() {
    return this.frequency > 80 && this.frequency < 2000 && this.confidence > 0.5;
  }

  /**
   * Check if pitch is musical (wider range for instruments)
   */
  isMusical() {
    return this.frequency > 60 && this.frequency < 4000 && this.confidence > 0.3;
  }

  /**
   * Get note string representation
   */
  getNoteString() {
    if (!this.isValid()) return '--';
    return `${this.note}${this.octave}`;
  }

  /**
   * Compare with another pitch
   */
  compareTo(otherPitch) {
    if (!this.isValid() || !otherPitch.isValid()) {
      return {
        centsDiff: 0,
        accuracy: 0,
        isOnPitch: false
      };
    }

    const centsDiff = 1200 * Math.log2(this.frequency / otherPitch.frequency);
    const absCentsDiff = Math.abs(centsDiff);
    const accuracy = Math.max(0, 100 - absCentsDiff * 2);
    const isOnPitch = absCentsDiff <= 50;

    return {
      centsDiff: Math.round(centsDiff),
      accuracy: Math.round(accuracy),
      isOnPitch,
      direction: centsDiff > 0 ? 'sharp' : 'flat'
    };
  }

  /**
   * Create from frequency
   */
  static fromFrequency(frequency, confidence = 1.0) {
    if (frequency <= 0) {
      return new PitchData(0, '--', 0, 0, 0);
    }

    const A4 = 440.0;
    const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    const semitones = 12 * Math.log2(frequency / A4);
    const midiNote = semitones + 69;
    const roundedMidi = Math.round(midiNote);
    const cents = Math.round((midiNote - roundedMidi) * 100);
    
    if (roundedMidi < 12 || roundedMidi > 127) {
      return new PitchData(frequency, '--', 0, cents, confidence);
    }
    
    const octave = Math.floor(roundedMidi / 12) - 1;
    const noteIndex = roundedMidi % 12;
    
    return new PitchData(
      frequency,
      NOTES[noteIndex],
      octave,
      cents,
      confidence
    );
  }
}

export class PitchAnalysisResult {
  constructor(pitchDataArray, duration, sampleRate) {
    this.pitchData = pitchDataArray;
    this.duration = duration;
    this.sampleRate = sampleRate;
    this.analyzedAt = new Date().toISOString();
  }

  /**
   * Get musical segments (filtering noise)
   */
  getMusicalSegments() {
    return this.pitchData.filter(pitch => pitch.isMusical());
  }

  /**
   * Get vocal segments only
   */
  getVocalSegments() {
    return this.pitchData.filter(pitch => pitch.isValid());
  }

  /**
   * Convert to timeline format
   */
  toTimeline(minSegmentDuration = 0.05) {
    const segments = [];
    let currentNote = null;
    let segmentStart = 0;
    let currentFrequency = 0;

    this.pitchData.forEach((pitch, index) => {
      const time = index * (1024 / this.sampleRate); // Assuming hop size of 1024
      const noteString = pitch.getNoteString();

      if (pitch.isMusical()) {
        if (!currentNote || currentNote !== noteString) {
          // End previous segment
          if (currentNote && currentNote !== '--') {
            const duration = time - segmentStart;
            if (duration >= minSegmentDuration) {
              segments.push({
                startTime: segmentStart,
                duration,
                note: currentNote,
                frequency: currentFrequency,
                type: this.pitchData[index - 1]?.isValid() ? 'vocal' : 'instrumental'
              });
            }
          }

          // Start new segment
          currentNote = noteString;
          segmentStart = time;
          currentFrequency = pitch.frequency;
        }
      } else {
        // End current segment on silence
        if (currentNote && currentNote !== '--') {
          const duration = time - segmentStart;
          if (duration >= minSegmentDuration) {
            segments.push({
              startTime: segmentStart,
              duration,
              note: currentNote,
              frequency: currentFrequency,
              type: 'silence'
            });
          }
        }
        currentNote = '--';
        segmentStart = time;
        currentFrequency = 0;
      }
    });

    return segments;
  }
}