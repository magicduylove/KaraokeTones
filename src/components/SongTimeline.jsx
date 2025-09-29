/**
 * Song Timeline Component - Shows song structure and navigation
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export const SongTimeline = ({ song, currentTime, onSeek }) => {
  if (!song || !song.timeline.length) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No timeline data available</Text>
      </View>
    );
  }

  /**
   * Format time as MM:SS
   */
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Get display properties for segment
   */
  const getSegmentDisplay = (segment) => {
    const displayNote = segment.note === '--' ? 'Rest' : segment.note;
    const typeIcon = segment.type === 'vocal' ? '🎤' : 
                    segment.type === 'instrumental' ? '🎵' : '🔇';
    const isActive = currentTime >= segment.startTime && currentTime < segment.endTime;
    
    return {
      displayNote,
      typeIcon,
      isActive,
      timeRange: `${formatTime(segment.startTime)} - ${formatTime(segment.endTime)}`
    };
  };

  /**
   * Handle segment tap to seek
   */
  const handleSegmentPress = (segment) => {
    if (onSeek) {
      onSeek(segment.startTime);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎼 Song Timeline</Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.scrollContainer}
      >
        <View style={styles.timelineContainer}>
          {song.timeline.slice(0, 20).map((segment) => {
            const display = getSegmentDisplay(segment);
            
            return (
              <TouchableOpacity
                key={segment.id}
                style={[
                  styles.segment,
                  display.isActive && styles.activeSegment
                ]}
                onPress={() => handleSegmentPress(segment)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.segmentNote,
                  display.isActive && styles.activeSegmentText
                ]}>
                  {display.typeIcon} {display.displayNote}
                </Text>
                <Text style={[
                  styles.segmentTime,
                  display.isActive && styles.activeSegmentTime
                ]}>
                  {display.timeRange}
                </Text>
                {segment.frequency > 0 && (
                  <Text style={styles.segmentFreq}>
                    {Math.round(segment.frequency)}Hz
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
          
          {song.timeline.length > 20 && (
            <View style={styles.segment}>
              <Text style={styles.segmentNote}>...</Text>
              <Text style={styles.segmentTime}>
                +{song.timeline.length - 20} more
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Timeline Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { 
                width: `${(currentTime / song.totalDuration) * 100}%` 
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {formatTime(currentTime)} / {formatTime(song.totalDuration)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  scrollContainer: {
    marginBottom: 15,
  },
  timelineContainer: {
    flexDirection: 'row',
    paddingVertical: 5,
  },
  segment: {
    backgroundColor: '#333',
    padding: 10,
    marginHorizontal: 3,
    borderRadius: 8,
    minWidth: 85,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeSegment: {
    backgroundColor: '#ff6b35',
    borderColor: '#ff6b35',
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  segmentNote: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  activeSegmentText: {
    color: '#000',
  },
  segmentTime: {
    color: '#ccc',
    fontSize: 9,
    textAlign: 'center',
    marginBottom: 2,
  },
  activeSegmentTime: {
    color: '#000',
  },
  segmentFreq: {
    color: '#999',
    fontSize: 8,
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ff6b35',
    borderRadius: 2,
  },
  progressText: {
    color: '#ccc',
    fontSize: 12,
    fontFamily: 'monospace',
  },
});