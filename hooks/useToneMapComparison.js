import { useState, useEffect, useRef } from 'react';
import { comparePitch, calculatePerformanceScore } from '../utils/toneMap';

/**
 * Hook for comparing user's pitch with tone map data
 */
export default function useToneMapComparison(toneMap, isActive = false) {
  const [currentTime, setCurrentTime] = useState(0);
  const [expectedPitch, setExpectedPitch] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [performanceHistory, setPerformanceHistory] = useState([]);
  const [sessionScore, setSessionScore] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const startTime = useRef(null);
  const animationFrame = useRef(null);
  const comparisonHistory = useRef([]);

  // Update current time and expected pitch
  useEffect(() => {
    if (isActive && toneMap && startTime.current) {
      const updateTime = () => {
        const elapsed = Date.now() - startTime.current;
        setCurrentTime(elapsed);
        
        const expected = toneMap.getPitchAtTime(elapsed);
        setExpectedPitch(expected);
        
        if (elapsed < toneMap.duration) {
          animationFrame.current = requestAnimationFrame(updateTime);
        } else {
          // Song finished, calculate final score
          finishSession();
        }
      };
      
      animationFrame.current = requestAnimationFrame(updateTime);
    }
    
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [isActive, toneMap]);

  /**
   * Start tone map comparison session
   */
  const startSession = () => {
    if (!toneMap) return;
    
    startTime.current = Date.now();
    setCurrentTime(0);
    setComparison(null);
    setPerformanceHistory([]);
    setSessionScore(null);
    setIsRecording(true);
    comparisonHistory.current = [];
  };

  /**
   * Stop tone map comparison session
   */
  const stopSession = () => {
    setIsRecording(false);
    startTime.current = null;
    
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }
    
    finishSession();
  };

  /**
   * Compare user pitch with expected pitch at current time
   */
  const compareUserPitch = (userFrequency) => {
    if (!expectedPitch || !isRecording) return;
    
    const comparisonResult = comparePitch(userFrequency, expectedPitch.frequency);
    
    // Add timestamp and expected data to comparison
    const enhancedComparison = {
      ...comparisonResult,
      timestamp: currentTime,
      userFrequency,
      expectedFrequency: expectedPitch.frequency,
      expectedNote: expectedPitch.note,
      lyric: expectedPitch.lyric
    };
    
    setComparison(enhancedComparison);
    
    // Store for performance analysis
    comparisonHistory.current.push(enhancedComparison);
    
    // Update performance history periodically (every 500ms)
    if (comparisonHistory.current.length % 5 === 0) {
      updatePerformanceHistory();
    }
    
    return enhancedComparison;
  };

  /**
   * Update performance history and running score
   */
  const updatePerformanceHistory = () => {
    if (comparisonHistory.current.length === 0) return;
    
    const recentComparisons = comparisonHistory.current.slice(-10); // Last 10 comparisons
    const score = calculatePerformanceScore(recentComparisons);
    
    setPerformanceHistory(prev => [...prev, {
      timestamp: currentTime,
      score: score.overallScore,
      accuracy: score.averageAccuracy,
      stability: score.pitchStability
    }]);
  };

  /**
   * Finish session and calculate final scores
   */
  const finishSession = () => {
    if (comparisonHistory.current.length === 0) return;
    
    const finalScore = calculatePerformanceScore(comparisonHistory.current);
    setSessionScore(finalScore);
    setIsRecording(false);
  };

  /**
   * Get current progress through the song (0-100%)
   */
  const getProgress = () => {
    if (!toneMap || toneMap.duration === 0) return 0;
    return Math.min(100, (currentTime / toneMap.duration) * 100);
  };

  /**
   * Get upcoming pitch points for preview
   */
  const getUpcomingPitches = (lookaheadMs = 2000) => {
    if (!toneMap) return [];
    
    return toneMap.getPitchRange(currentTime, currentTime + lookaheadMs);
  };

  /**
   * Seek to specific time in the song
   */
  const seekToTime = (timeMs) => {
    if (!toneMap || timeMs < 0 || timeMs > toneMap.duration) return;
    
    setCurrentTime(timeMs);
    startTime.current = Date.now() - timeMs;
    
    const expected = toneMap.getPitchAtTime(timeMs);
    setExpectedPitch(expected);
  };

  /**
   * Get real-time feedback based on current comparison
   */
  const getRealTimeFeedback = () => {
    if (!comparison) return null;
    
    const { feedback, accuracy, direction, centsDiff } = comparison;
    
    let message = '';
    let color = '#666';
    
    switch (feedback) {
      case 'perfect':
        message = '🎯 Perfect!';
        color = '#22c55e';
        break;
      case 'good':
        message = '👍 Good!';
        color = '#84cc16';
        break;
      case 'fair':
        message = direction === 'sharp' ? '📈 Too high' : '📉 Too low';
        color = '#f59e0b';
        break;
      case 'off_pitch':
        message = direction === 'sharp' ? '⬆️ Much too high' : '⬇️ Much too low';
        color = '#ef4444';
        break;
      case 'silence':
        message = '🤐 Silent (correct)';
        color = '#6b7280';
        break;
      case 'should_be_silent':
        message = '🔇 Should be silent';
        color = '#f59e0b';
        break;
      case 'no_voice_detected':
        message = '🎤 Sing here!';
        color = '#3b82f6';
        break;
      default:
        message = '';
    }
    
    return {
      message,
      color,
      accuracy,
      centsDiff: Math.abs(centsDiff)
    };
  };

  return {
    // State
    currentTime,
    expectedPitch,
    comparison,
    performanceHistory,
    sessionScore,
    isRecording,
    
    // Actions
    startSession,
    stopSession,
    compareUserPitch,
    seekToTime,
    
    // Utilities
    getProgress,
    getUpcomingPitches,
    getRealTimeFeedback,
    
    // Computed values
    progress: getProgress(),
    upcomingPitches: getUpcomingPitches(),
    realTimeFeedback: getRealTimeFeedback()
  };
}