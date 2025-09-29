/**
 * Pitch Visualization Component - Shows real-time pitch comparison
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export const PitchVisualization = ({
  visualizationData,
  currentUserPitch,
  expectedPitch,
  currentTime
}) => {
  const { songData = [], userData = [], windowStart = 0, windowEnd = 10 } = visualizationData || {};
  
  const visualWidth = Math.max(screenWidth - 40, 600);
  const visualHeight = 200;
  const windowDuration = windowEnd - windowStart;

  /**
   * Convert frequency to Y position
   */
  const frequencyToY = (frequency) => {
    if (!frequency || frequency <= 0) return visualHeight / 2;
    
    const minFreq = 80;
    const maxFreq = 800;
    const logFreq = Math.log(Math.max(frequency, minFreq));
    const logMin = Math.log(minFreq);
    const logMax = Math.log(maxFreq);
    
    const normalizedY = (logFreq - logMin) / (logMax - logMin);
    return visualHeight - (normalizedY * visualHeight * 0.8);
  };

  /**
   * Convert time to X position
   */
  const timeToX = (time) => {
    return ((time - windowStart) / windowDuration) * visualWidth;
  };

  /**
   * Get color for segment type
   */
  const getSegmentColor = (type) => {
    switch (type) {
      case 'vocal': return '#00ff00';
      case 'instrumental': return '#00aaff';
      default: return '#888888';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[styles.visualization, { width: visualWidth, height: visualHeight }]}>
          
          {/* Frequency reference lines */}
          {[100, 200, 300, 400, 500, 600, 700, 800].map(freq => (
            <View 
              key={freq}
              style={[
                styles.frequencyLine,
                { top: frequencyToY(freq) }
              ]}
            >
              <Text style={styles.frequencyLabel}>{freq}Hz</Text>
            </View>
          ))}
          
          {/* Song pitch segments */}
          {songData.map((segment, index) => {
            if (segment.note === '--' || !segment.frequency) return null;
            
            const x = timeToX(segment.startTime);
            const width = timeToX(segment.endTime) - x;
            const y = frequencyToY(segment.frequency);
            
            return (
              <View
                key={`song-${index}`}
                style={[
                  styles.songSegment,
                  {
                    left: x,
                    top: y - 4,
                    width: Math.max(width, 4),
                    backgroundColor: getSegmentColor(segment.type),
                  }
                ]}
              />
            );
          })}
          
          {/* User pitch points */}
          {userData.map((pitch, index) => {
            if (!pitch.frequency) return null;
            
            const x = timeToX(pitch.time);
            const y = frequencyToY(pitch.frequency);
            
            return (
              <View
                key={`user-${index}`}
                style={[
                  styles.userPitch,
                  {
                    left: x - 1,
                    top: y - 2,
                  }
                ]}
              />
            );
          })}
          
          {/* Current time indicator */}
          <View
            style={[
              styles.timeIndicator,
              { left: timeToX(currentTime) }
            ]}
          />
          
        </View>
      </ScrollView>
      
      {/* Overlay with current pitch info */}
      <View style={styles.overlay}>
        <View style={styles.pitchInfo}>
          <Text style={styles.pitchLabel}>Expected: {expectedPitch?.getNoteString() || '--'}</Text>
          <Text style={styles.pitchLabel}>Your Voice: {currentUserPitch?.getNoteString() || '--'}</Text>
        </View>
      </View>
      
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#00ff00' }]} />
          <Text style={styles.legendText}>🎤 Vocal</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#00aaff' }]} />
          <Text style={styles.legendText}>🎵 Instrumental</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#ff0000' }]} />
          <Text style={styles.legendText}>Your Voice</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 10,
    overflow: 'hidden',
  },
  visualization: {
    backgroundColor: '#111',
    position: 'relative',
  },
  frequencyLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
  },
  frequencyLabel: {
    color: '#666',
    fontSize: 10,
    marginLeft: 5,
  },
  songSegment: {
    position: 'absolute',
    height: 8,
    borderRadius: 2,
    opacity: 0.8,
  },
  userPitch: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: '#ff0000',
    borderRadius: 2,
    opacity: 0.7,
  },
  timeIndicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#ffffff',
    opacity: 0.8,
  },
  overlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
  },
  pitchInfo: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5,
  },
  pitchLabel: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 8,
    height: 8,
    marginRight: 4,
    borderRadius: 1,
  },
  legendText: {
    color: '#ccc',
    fontSize: 10,
  },
});