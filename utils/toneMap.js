/**
 * Tone Map utility for karaoke pitch comparison
 * A tone map represents the expected pitch progression of a song
 */

// Tone map data structure
export class ToneMap {
  constructor(songId, title, artist, timeSignature = '4/4') {
    this.songId = songId;
    this.title = title;
    this.artist = artist;
    this.timeSignature = timeSignature;
    this.pitchData = []; // Array of pitch points with timing
    this.duration = 0; // Total song duration in milliseconds
  }

  /**
   * Add a pitch point to the tone map
   * @param {number} timestamp - Time in milliseconds from song start
   * @param {number} frequency - Expected frequency in Hz (0 for silence/rest)
   * @param {string} lyric - Lyric syllable at this point
   * @param {number} duration - Duration of this pitch in ms
   */
  addPitchPoint(timestamp, frequency, lyric = '', duration = 100) {
    this.pitchData.push({
      timestamp,
      frequency,
      lyric,
      duration,
      note: frequency > 0 ? frequencyToNote(frequency).note : '--'
    });
    
    // Update total duration
    this.duration = Math.max(this.duration, timestamp + duration);
  }

  /**
   * Get expected pitch at a specific time
   * @param {number} timestamp - Time in milliseconds
   * @returns {Object} Pitch data at that time
   */
  getPitchAtTime(timestamp) {
    // Find the pitch point that contains this timestamp
    for (let i = 0; i < this.pitchData.length; i++) {
      const point = this.pitchData[i];
      if (timestamp >= point.timestamp && timestamp <= point.timestamp + point.duration) {
        return point;
      }
    }
    
    // Return silence if no pitch found
    return {
      timestamp,
      frequency: 0,
      lyric: '',
      duration: 0,
      note: '--'
    };
  }

  /**
   * Get all pitch points within a time range
   * @param {number} startTime - Start time in ms
   * @param {number} endTime - End time in ms
   * @returns {Array} Array of pitch points in range
   */
  getPitchRange(startTime, endTime) {
    return this.pitchData.filter(point => 
      point.timestamp >= startTime && point.timestamp <= endTime
    );
  }

  /**
   * Export tone map to JSON
   */
  toJSON() {
    return {
      songId: this.songId,
      title: this.title,
      artist: this.artist,
      timeSignature: this.timeSignature,
      duration: this.duration,
      pitchData: this.pitchData
    };
  }

  /**
   * Create tone map from JSON data
   */
  static fromJSON(data) {
    const toneMap = new ToneMap(data.songId, data.title, data.artist, data.timeSignature);
    toneMap.duration = data.duration;
    toneMap.pitchData = data.pitchData || [];
    return toneMap;
  }
}

/**
 * Convert frequency to musical note
 */
function frequencyToNote(frequency) {
  if (frequency <= 0) return { note: '--', cents: 0 };
  
  const A4 = 440;
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  const midi = 12 * Math.log2(frequency / A4) + 69;
  const noteIndex = Math.round(midi) % 12;
  const octave = Math.floor(Math.round(midi) / 12) - 1;
  const cents = Math.round((midi - Math.round(midi)) * 100);
  
  return {
    note: notes[noteIndex] + octave,
    cents
  };
}

/**
 * Convert musical note to frequency
 * @param {string} note - Note like "C4", "F#3"
 * @returns {number} Frequency in Hz
 */
export function noteToFrequency(note) {
  if (!note || note === '--') return 0;
  
  const A4 = 440;
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  // Parse note (e.g., "C4", "F#3")
  const match = note.match(/^([A-G]#?)(\d+)$/);
  if (!match) return 0;
  
  const noteName = match[1];
  const octave = parseInt(match[2]);
  
  const noteIndex = notes.indexOf(noteName);
  if (noteIndex === -1) return 0;
  
  const midi = (octave + 1) * 12 + noteIndex;
  return A4 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Compare user pitch with expected pitch from tone map
 * @param {number} userFreq - User's sung frequency
 * @param {number} expectedFreq - Expected frequency from tone map
 * @returns {Object} Comparison result
 */
export function comparePitch(userFreq, expectedFreq) {
  if (expectedFreq === 0) {
    return {
      accuracy: userFreq === 0 ? 100 : 0, // Perfect if both silent
      centsDiff: 0,
      isOnPitch: userFreq === 0,
      feedback: userFreq === 0 ? 'silence' : 'should_be_silent'
    };
  }
  
  if (userFreq === 0) {
    return {
      accuracy: 0,
      centsDiff: 0,
      isOnPitch: false,
      feedback: 'no_voice_detected'
    };
  }
  
  // Calculate cents difference
  const centsDiff = 1200 * Math.log2(userFreq / expectedFreq);
  const absCentsDiff = Math.abs(centsDiff);
  
  // Accuracy scoring (100% at perfect pitch, decreasing with distance)
  const accuracy = Math.max(0, 100 - absCentsDiff * 2); // 2 points per cent
  
  // Determine if on pitch (within 50 cents is considered good)
  const isOnPitch = absCentsDiff <= 50;
  
  // Feedback based on cents difference
  let feedback;
  if (absCentsDiff <= 25) feedback = 'perfect';
  else if (absCentsDiff <= 50) feedback = 'good';
  else if (absCentsDiff <= 100) feedback = 'fair';
  else feedback = 'off_pitch';
  
  return {
    accuracy: Math.round(accuracy),
    centsDiff: Math.round(centsDiff),
    isOnPitch,
    feedback,
    direction: centsDiff > 0 ? 'sharp' : 'flat'
  };
}

/**
 * Create a tone map from a simple melody representation
 * @param {string} songId - Unique song identifier
 * @param {string} title - Song title
 * @param {string} artist - Artist name
 * @param {Array} melody - Array of {note, duration, lyric} objects
 * @param {number} bpm - Beats per minute
 * @returns {ToneMap} Generated tone map
 */
export function createToneMapFromMelody(songId, title, artist, melody, bpm = 120) {
  const toneMap = new ToneMap(songId, title, artist);
  
  // Calculate time per beat in ms
  const msPerBeat = (60 / bpm) * 1000;
  
  let currentTime = 0;
  
  melody.forEach(({ note, duration, lyric = '' }) => {
    const frequency = noteToFrequency(note);
    const durationMs = duration * msPerBeat; // duration is in beats
    
    toneMap.addPitchPoint(currentTime, frequency, lyric, durationMs);
    currentTime += durationMs;
  });
  
  return toneMap;
}

/**
 * Calculate overall performance score for a singing session
 * @param {Array} pitchComparisons - Array of pitch comparison results
 * @returns {Object} Performance metrics
 */
export function calculatePerformanceScore(pitchComparisons) {
  if (pitchComparisons.length === 0) {
    return {
      overallScore: 0,
      averageAccuracy: 0,
      perfectNotes: 0,
      goodNotes: 0,
      totalNotes: 0,
      pitchStability: 0
    };
  }
  
  const totalNotes = pitchComparisons.length;
  const accuracySum = pitchComparisons.reduce((sum, comp) => sum + comp.accuracy, 0);
  const averageAccuracy = accuracySum / totalNotes;
  
  const perfectNotes = pitchComparisons.filter(comp => comp.feedback === 'perfect').length;
  const goodNotes = pitchComparisons.filter(comp => comp.feedback === 'good').length;
  
  // Calculate pitch stability (how consistent the singing is)
  const centsDiffs = pitchComparisons.map(comp => Math.abs(comp.centsDiff));
  const variance = centsDiffs.reduce((sum, diff, i, arr) => {
    const mean = arr.reduce((a, b) => a + b) / arr.length;
    return sum + Math.pow(diff - mean, 2);
  }, 0) / centsDiffs.length;
  const pitchStability = Math.max(0, 100 - Math.sqrt(variance));
  
  // Overall score combines accuracy and stability
  const overallScore = (averageAccuracy * 0.7) + (pitchStability * 0.3);
  
  return {
    overallScore: Math.round(overallScore),
    averageAccuracy: Math.round(averageAccuracy),
    perfectNotes,
    goodNotes,
    totalNotes,
    pitchStability: Math.round(pitchStability)
  };
}