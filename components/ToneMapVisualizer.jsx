import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

/**
 * ToneMapVisualizer - Shows the pitch diagram/tone map for karaoke practice
 */
export default function ToneMapVisualizer({ 
  toneMap, 
  currentTime = 0, 
  userPitch = 0, 
  comparison = null,
  windowMs = 8000, // 8 second window
  style = {} 
}) {
  if (!toneMap) return null;

  // Calculate visible time range
  const startTime = Math.max(0, currentTime - windowMs / 3); // Show past context
  const endTime = startTime + windowMs;
  
  // Get pitch points in visible range
  const visiblePitches = toneMap.getPitchRange(startTime, endTime);
  
  // Find pitch range for scaling
  const frequencies = visiblePitches
    .map(p => p.frequency)
    .filter(f => f > 0);
  
  const minFreq = frequencies.length > 0 ? Math.min(...frequencies) * 0.9 : 200;
  const maxFreq = frequencies.length > 0 ? Math.max(...frequencies) * 1.1 : 600;
  
  // Convert frequency to Y position (0-1, inverted so high pitch is at top)
  const freqToY = (freq) => {
    if (freq === 0) return 0.5; // Center for silence
    return 1 - ((freq - minFreq) / (maxFreq - minFreq));
  };
  
  // Convert time to X position (0-1)
  const timeToX = (time) => {
    return (time - startTime) / windowMs;
  };

  // Current time indicator position
  const currentTimeX = timeToX(currentTime);
  
  return (
    <View style={[styles.container, style]}>
      {/* Header with song info */}
      <View style={styles.header}>
        <Text style={styles.songTitle}>{toneMap.title}</Text>
        <Text style={styles.artist}>{toneMap.artist}</Text>
        {comparison?.lyric && (
          <Text style={styles.currentLyric}>{comparison.lyric}</Text>
        )}
      </View>
      
      {/* Main visualization area */}
      <View style={styles.visualizer}>
        <Animated.View style={styles.pitchArea}>
          {/* Background grid */}
          <PitchGrid minFreq={minFreq} maxFreq={maxFreq} />
          
          {/* Expected pitch line */}
          <ExpectedPitchLine 
            visiblePitches={visiblePitches}
            timeToX={timeToX}
            freqToY={freqToY}
            windowMs={windowMs}
          />
          
          {/* User pitch indicator */}
          {userPitch > 0 && (
            <UserPitchIndicator 
              frequency={userPitch}
              x={currentTimeX}
              y={freqToY(userPitch)}
              comparison={comparison}
            />
          )}
          
          {/* Current time line */}
          <CurrentTimeLine x={currentTimeX} />
          
          {/* Lyrics display */}
          <LyricsDisplay 
            visiblePitches={visiblePitches}
            timeToX={timeToX}
            freqToY={freqToY}
          />
        </Animated.View>
        
        {/* Feedback panel */}
        {comparison && (
          <FeedbackPanel comparison={comparison} />
        )}
      </View>
    </View>
  );
}

// Background grid component
function PitchGrid({ minFreq, maxFreq }) {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const gridLines = [];
  
  // Add horizontal lines for musical notes
  for (let octave = 2; octave <= 6; octave++) {
    notes.forEach((note, index) => {
      const freq = 440 * Math.pow(2, (octave * 12 + index - 69) / 12);
      if (freq >= minFreq && freq <= maxFreq) {
        const y = 1 - ((freq - minFreq) / (maxFreq - minFreq));
        const isMainNote = note === 'C' || note === 'F';
        
        gridLines.push(
          <View 
            key={`${note}${octave}`}
            style={[
              styles.gridLine,
              { top: `${y * 100}%` },
              isMainNote && styles.gridLineMain
            ]}
          />
        );
      }
    });
  }
  
  return <>{gridLines}</>;
}

// Expected pitch line component
function ExpectedPitchLine({ visiblePitches, timeToX, freqToY, windowMs }) {
  if (visiblePitches.length === 0) return null;
  
  return (
    <View style={styles.expectedPitchContainer}>
      {visiblePitches.map((pitch, index) => {
        const x = timeToX(pitch.timestamp);
        const width = (pitch.duration / windowMs);
        const y = freqToY(pitch.frequency);
        
        if (pitch.frequency === 0) {
          // Rest/silence - show as dashed line at center
          return (
            <View
              key={index}
              style={[
                styles.restBlock,
                {
                  left: `${x * 100}%`,
                  width: `${width * 100}%`,
                  top: '48%'
                }
              ]}
            />
          );
        }
        
        return (
          <View
            key={index}
            style={[
              styles.expectedPitchBlock,
              {
                left: `${x * 100}%`,
                width: `${width * 100}%`,
                top: `${y * 100}%`
              }
            ]}
          />
        );
      })}
    </View>
  );
}

// User pitch indicator
function UserPitchIndicator({ frequency, x, y, comparison }) {
  const color = comparison?.isOnPitch ? '#22c55e' : '#ef4444';
  
  return (
    <Animated.View
      style={[
        styles.userPitchIndicator,
        {
          left: `${x * 100}%`,
          top: `${y * 100}%`,
          backgroundColor: color
        }
      ]}
    />
  );
}

// Current time line
function CurrentTimeLine({ x }) {
  return (
    <View
      style={[
        styles.currentTimeLine,
        { left: `${x * 100}%` }
      ]}
    />
  );
}

// Lyrics display
function LyricsDisplay({ visiblePitches, timeToX, freqToY }) {
  return (
    <>
      {visiblePitches
        .filter(pitch => pitch.lyric)
        .map((pitch, index) => {
          const x = timeToX(pitch.timestamp);
          const y = freqToY(pitch.frequency);
          
          return (
            <Text
              key={index}
              style={[
                styles.lyricText,
                {
                  left: `${x * 100}%`,
                  top: `${Math.max(0, y * 100 - 8)}%`
                }
              ]}
            >
              {pitch.lyric}
            </Text>
          );
        })}
    </>
  );
}

// Feedback panel
function FeedbackPanel({ comparison }) {
  const feedback = getRealTimeFeedback(comparison);
  
  return (
    <View style={styles.feedbackPanel}>
      <Text style={[styles.feedbackText, { color: feedback.color }]}>
        {feedback.message}
      </Text>
      <Text style={styles.accuracyText}>
        Accuracy: {comparison.accuracy}%
      </Text>
      {comparison.centsDiff > 0 && (
        <Text style={styles.centsText}>
          {Math.abs(comparison.centsDiff)} cents {comparison.direction}
        </Text>
      )}
    </View>
  );
}

// Helper function for feedback
function getRealTimeFeedback(comparison) {
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
  
  return { message, color };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden'
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    alignItems: 'center'
  },
  songTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4
  },
  artist: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8
  },
  currentLyric: {
    fontSize: 16,
    color: '#4ade80',
    fontWeight: '600'
  },
  visualizer: {
    flex: 1,
    padding: 16
  },
  pitchArea: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#111',
    borderRadius: 8,
    minHeight: 200
  },
  gridLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#333',
    opacity: 0.3
  },
  gridLineMain: {
    backgroundColor: '#555',
    opacity: 0.6
  },
  expectedPitchContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%'
  },
  expectedPitchBlock: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
    marginTop: -2
  },
  restBlock: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#666',
    borderRadius: 1,
    opacity: 0.5,
    borderStyle: 'dashed'
  },
  userPitchIndicator: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
    marginTop: -6,
    borderWidth: 2,
    borderColor: '#fff'
  },
  currentTimeLine: {
    position: 'absolute',
    width: 2,
    height: '100%',
    backgroundColor: '#f59e0b',
    opacity: 0.8
  },
  lyricText: {
    position: 'absolute',
    fontSize: 12,
    color: '#ccc',
    fontWeight: '500',
    transform: [{ translateX: -50 }]
  },
  feedbackPanel: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#222',
    borderRadius: 8,
    alignItems: 'center'
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4
  },
  accuracyText: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 2
  },
  centsText: {
    fontSize: 12,
    color: '#888'
  }
});