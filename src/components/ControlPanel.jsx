/**
 * Control Panel Component - Main controls for practice session
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

export const ControlPanel = ({
  isPlaying,
  isRecording,
  isPracticeActive,
  currentTime,
  duration,
  hasSong,
  onTogglePlayback,
  onToggleRecording,
  onStartPractice,
  onStopPractice,
  onImportSong,
  onSelectSong
}) => {

  /**
   * Handle import song with JSON input
   */
  const handleImportSong = () => {
    Alert.prompt(
      'Import Analysis Result',
      'Paste the analysis JSON result from the API:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Import', 
          onPress: async (jsonText) => {
            if (jsonText && onImportSong) {
              try {
                await onImportSong(jsonText);
                Alert.alert('Success', 'Song analysis imported successfully!');
              } catch (error) {
                Alert.alert('Import Error', error.message);
              }
            }
          }
        }
      ],
      'plain-text'
    );
  };

  /**
   * Format time display
   */
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      
      {/* Time Display */}
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>
          {formatTime(currentTime)}
          {duration > 0 && ` / ${formatTime(duration)}`}
        </Text>
      </View>

      {/* Main Controls */}
      <View style={styles.controlsRow}>
        
        {/* Playback Control */}
        <TouchableOpacity 
          style={[
            styles.button, 
            styles.primaryButton,
            !hasSong && styles.buttonDisabled
          ]}
          onPress={onTogglePlayback}
          disabled={!hasSong}
        >
          <Text style={styles.buttonText}>
            {isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </Text>
        </TouchableOpacity>

        {/* Stop Button */}
        {isPracticeActive && (
          <TouchableOpacity 
            style={[styles.button, styles.stopButton]}
            onPress={onStopPractice}
          >
            <Text style={styles.buttonText}>⏹️ Stop</Text>
          </TouchableOpacity>
        )}

        {/* Recording Control */}
        <TouchableOpacity 
          style={[
            styles.button,
            isRecording ? styles.recordingButton : styles.secondaryButton
          ]}
          onPress={onToggleRecording}
        >
          <Text style={styles.buttonText}>
            {isRecording ? '🔴 Stop Mic' : '🎤 Start Mic'}
          </Text>
        </TouchableOpacity>
        
      </View>

      {/* Secondary Controls */}
      <View style={styles.controlsRow}>
        
        {/* Import Song */}
        <TouchableOpacity 
          style={[styles.button, styles.importButton]}
          onPress={handleImportSong}
        >
          <Text style={styles.buttonText}>📥 Import Analysis</Text>
        </TouchableOpacity>

        {/* Select Song */}
        <TouchableOpacity 
          style={[styles.button, styles.selectButton]}
          onPress={onSelectSong}
        >
          <Text style={styles.buttonText}>🎵 Select Song</Text>
        </TouchableOpacity>
        
      </View>

      {/* Status Indicators */}
      <View style={styles.statusContainer}>
        <View style={styles.statusItem}>
          <View style={[
            styles.statusIndicator, 
            { backgroundColor: hasSong ? '#00ff00' : '#666' }
          ]} />
          <Text style={styles.statusText}>Song Loaded</Text>
        </View>
        
        <View style={styles.statusItem}>
          <View style={[
            styles.statusIndicator, 
            { backgroundColor: isPracticeActive ? '#00ff00' : '#666' }
          ]} />
          <Text style={styles.statusText}>Practice Active</Text>
        </View>
        
        <View style={styles.statusItem}>
          <View style={[
            styles.statusIndicator, 
            { backgroundColor: isRecording ? '#ff0000' : '#666' }
          ]} />
          <Text style={styles.statusText}>Recording</Text>
        </View>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#222',
    padding: 20,
    borderRadius: 10,
    marginTop: 10,
  },
  timeContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  timeText: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    flexWrap: 'wrap',
  },
  button: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    margin: 5,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  secondaryButton: {
    backgroundColor: '#2196F3',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  recordingButton: {
    backgroundColor: '#ff4444',
  },
  importButton: {
    backgroundColor: '#3498db',
  },
  selectButton: {
    backgroundColor: '#ff6b35',
  },
  buttonDisabled: {
    backgroundColor: '#555',
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  statusText: {
    color: '#ccc',
    fontSize: 10,
  },
});