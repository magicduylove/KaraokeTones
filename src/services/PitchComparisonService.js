/**
 * PitchComparisonService - Compares user voice pitch with song pitch
 */

export class PitchComparisonService {
  constructor() {
    this.songAnalysis = null;
    this.comparisonHistory = [];
    this.scoringConfig = {
      perfectThreshold: 10, // Hz - considered perfect match
      goodThreshold: 25,    // Hz - considered good match
      okThreshold: 50,      // Hz - considered ok match
      maxScore: 100,        // Maximum score per note
      timeWindow: 0.1       // Time window for comparison (seconds)
    };
  }

  /**
   * Set song analysis data for comparison
   */
  setSongAnalysis(analysisData) {
    this.songAnalysis = analysisData;
    this.comparisonHistory = [];
    console.log('🎯 Song analysis loaded for pitch comparison');
  }

  /**
   * Compare user pitch with song pitch at current time
   */
  comparePitch(userPitch, currentTime) {
    if (!this.songAnalysis || !userPitch || !userPitch.frequency) {
      return null;
    }

    // Get expected song pitch at current time
    const songPitch = this.getSongPitchAtTime(currentTime);

    if (!songPitch || !songPitch.frequency) {
      return {
        time: currentTime,
        userPitch: userPitch,
        songPitch: null,
        score: 0,
        accuracy: 'no-target',
        message: 'No vocal part detected in song'
      };
    }

    // Calculate pitch difference
    const frequencyDiff = Math.abs(userPitch.frequency - songPitch.frequency);
    const semitonesDiff = this.frequencyToSemitones(frequencyDiff, songPitch.frequency);

    // Calculate score based on accuracy
    const score = this.calculateScore(frequencyDiff);
    const accuracy = this.getAccuracyLevel(frequencyDiff);

    const comparison = {
      time: currentTime,
      userPitch: userPitch,
      songPitch: songPitch,
      frequencyDiff: frequencyDiff,
      semitonesDiff: semitonesDiff,
      score: score,
      accuracy: accuracy,
      message: this.getAccuracyMessage(accuracy, semitonesDiff)
    };

    // Add to history
    this.comparisonHistory.push(comparison);

    // Keep only recent history (last 100 comparisons)
    if (this.comparisonHistory.length > 100) {
      this.comparisonHistory.shift();
    }

    return comparison;
  }

  /**
   * Get song pitch at specific time
   */
  getSongPitchAtTime(time) {
    if (!this.songAnalysis || !this.songAnalysis.pitchTimeline) {
      return null;
    }

    const timeline = this.songAnalysis.pitchTimeline;

    // Find pitch points within time window
    const timeWindow = this.scoringConfig.timeWindow;
    const relevantPoints = timeline.filter(
      point => Math.abs(point.time - time) <= timeWindow && point.frequency
    );

    if (relevantPoints.length === 0) {
      return null;
    }

    // Return the closest point or average if multiple points
    if (relevantPoints.length === 1) {
      return relevantPoints[0];
    }

    // Average frequency of nearby points for smoother comparison
    const avgFrequency = relevantPoints.reduce((sum, point) => sum + point.frequency, 0) / relevantPoints.length;
    const avgConfidence = relevantPoints.reduce((sum, point) => sum + point.confidence, 0) / relevantPoints.length;

    return {
      time: time,
      frequency: avgFrequency,
      note: this.frequencyToNote(avgFrequency),
      confidence: avgConfidence
    };
  }

  /**
   * Calculate score based on frequency difference
   */
  calculateScore(frequencyDiff) {
    const { perfectThreshold, goodThreshold, okThreshold, maxScore } = this.scoringConfig;

    if (frequencyDiff <= perfectThreshold) {
      return maxScore; // Perfect!
    } else if (frequencyDiff <= goodThreshold) {
      // Linear scaling from perfect to good
      const ratio = (goodThreshold - frequencyDiff) / (goodThreshold - perfectThreshold);
      return Math.round(maxScore * 0.7 + (maxScore * 0.3 * ratio));
    } else if (frequencyDiff <= okThreshold) {
      // Linear scaling from good to ok
      const ratio = (okThreshold - frequencyDiff) / (okThreshold - goodThreshold);
      return Math.round(maxScore * 0.4 + (maxScore * 0.3 * ratio));
    } else {
      // Poor performance - minimal score based on distance
      const maxDiff = 200; // Hz - maximum difference for any score
      const ratio = Math.max(0, (maxDiff - frequencyDiff) / maxDiff);
      return Math.round(maxScore * 0.1 * ratio);
    }
  }

  /**
   * Get accuracy level based on frequency difference
   */
  getAccuracyLevel(frequencyDiff) {
    const { perfectThreshold, goodThreshold, okThreshold } = this.scoringConfig;

    if (frequencyDiff <= perfectThreshold) return 'perfect';
    if (frequencyDiff <= goodThreshold) return 'good';
    if (frequencyDiff <= okThreshold) return 'ok';
    return 'poor';
  }

  /**
   * Get user-friendly accuracy message
   */
  getAccuracyMessage(accuracy, semitonesDiff) {
    switch (accuracy) {
      case 'perfect':
        return 'Perfect! 🎯';
      case 'good':
        return `Great! ${semitonesDiff.toFixed(1)} semitones off 👍`;
      case 'ok':
        return `Good try! ${semitonesDiff.toFixed(1)} semitones off 😊`;
      case 'poor':
        return `Keep trying! ${semitonesDiff.toFixed(1)} semitones off 💪`;
      case 'no-target':
        return 'No vocal part to match 🎵';
      default:
        return 'Keep singing! 🎤';
    }
  }

  /**
   * Convert frequency difference to semitones
   */
  frequencyToSemitones(frequencyDiff, baseFrequency) {
    if (baseFrequency === 0) return 0;
    return 12 * Math.log2((baseFrequency + frequencyDiff) / baseFrequency);
  }

  /**
   * Convert frequency to note name
   */
  frequencyToNote(frequency) {
    if (!frequency || frequency < 80) return null;

    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const A4 = 440;
    const C0 = A4 * Math.pow(2, -4.75);

    if (frequency > C0) {
      const h = Math.round(12 * Math.log2(frequency / C0));
      const octave = Math.floor(h / 12);
      const n = h % 12;
      return noteNames[n] + octave;
    }
    return null;
  }

  /**
   * Get overall session statistics
   */
  getSessionStats() {
    if (this.comparisonHistory.length === 0) {
      return {
        totalComparisons: 0,
        averageScore: 0,
        perfectHits: 0,
        goodHits: 0,
        okHits: 0,
        poorHits: 0,
        accuracy: 0
      };
    }

    const validComparisons = this.comparisonHistory.filter(c => c.accuracy !== 'no-target');
    const totalScore = validComparisons.reduce((sum, c) => sum + c.score, 0);
    const averageScore = totalScore / validComparisons.length;

    const accuracyCounts = {
      perfect: validComparisons.filter(c => c.accuracy === 'perfect').length,
      good: validComparisons.filter(c => c.accuracy === 'good').length,
      ok: validComparisons.filter(c => c.accuracy === 'ok').length,
      poor: validComparisons.filter(c => c.accuracy === 'poor').length
    };

    return {
      totalComparisons: validComparisons.length,
      averageScore: Math.round(averageScore),
      perfectHits: accuracyCounts.perfect,
      goodHits: accuracyCounts.good,
      okHits: accuracyCounts.ok,
      poorHits: accuracyCounts.poor,
      accuracy: Math.round((averageScore / this.scoringConfig.maxScore) * 100)
    };
  }

  /**
   * Get recent comparison history
   */
  getRecentComparisons(count = 10) {
    return this.comparisonHistory.slice(-count);
  }

  /**
   * Clear comparison history
   */
  clearHistory() {
    this.comparisonHistory = [];
    console.log('🗑️ Pitch comparison history cleared');
  }

  /**
   * Update scoring configuration
   */
  updateScoringConfig(newConfig) {
    this.scoringConfig = { ...this.scoringConfig, ...newConfig };
    console.log('⚙️ Scoring configuration updated:', this.scoringConfig);
  }
}