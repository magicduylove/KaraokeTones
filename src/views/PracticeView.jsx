/**
 * Practice View - Main karaoke practice interface
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Alert } from 'react-native';
import { ControlPanel } from '../components/ControlPanel.jsx';
import { PitchVisualization } from '../components/PitchVisualization.jsx';
import { SongTimeline } from '../components/SongTimeline.jsx';
import { PracticeStats } from '../components/PracticeStats.jsx';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const PracticeView = ({ 
  practiceController, 
  songController,
  onImportSong,
  onSelectSong 
}) => {
  const [currentSong, setCurrentSong] = useState(null);
  const [playbackState, setPlaybackState] = useState({
    isPlaying: false,
    currentPosition: 0,
    duration: 0
  });
  const [currentUserPitch, setCurrentUserPitch] = useState(null);
  const [practiceStats, setPracticeStats] = useState({
    totalNotes: 0,
    correctNotes: 0,
    accuracy: 0
  });
  const [isRecording, setIsRecording] = useState(false);
  const [isPracticeActive, setIsPracticeActive] = useState(false);

  // Initialize controllers and set up callbacks
  useEffect(() => {
    const initializeControllers = async () => {
      try {
        // Set up song controller callbacks
        songController.setCallbacks(
          (song) => setCurrentSong(song),
          () => {} // Song list updates handled elsewhere
        );

        // Set up practice controller callbacks
        practiceController.setCallbacks(
          (playback) => setPlaybackState(playback),
          (pitch) => setCurrentUserPitch(pitch),
          (stats) => setPracticeStats(stats)
        );

        // Initialize practice controller
        await practiceController.initialize();

        // Load current song if available
        const song = songController.getCurrentSong();
        if (song) {
          setCurrentSong(song);
        }
      } catch (error) {
        console.error('Failed to initialize practice view:', error);
        Alert.alert('Initialization Error', error.message);
      }
    };

    initializeControllers();

    // Cleanup on unmount
    return () => {
      if (isPracticeActive) {
        practiceController.stopPractice().catch(console.error);
      }
    };
  }, []);

  /**
   * Start practice session
   */
  const handleStartPractice = async () => {
    if (!currentSong) {
      Alert.alert('No Song', 'Please load a song first');
      return;
    }

    try {
      await practiceController.startPractice(currentSong.filePath);
      setIsPracticeActive(true);
    } catch (error) {
      console.error('Failed to start practice:', error);
      Alert.alert('Practice Error', error.message);
    }
  };

  /**
   * Stop practice session
   */
  const handleStopPractice = async () => {
    try {
      await practiceController.stopPractice();
      setIsPracticeActive(false);
      setIsRecording(false);
    } catch (error) {
      console.error('Failed to stop practice:', error);
    }
  };

  /**
   * Toggle playback
   */
  const handleTogglePlayback = async () => {
    if (!isPracticeActive) {
      await handleStartPractice();
    }
    
    try {
      await practiceController.togglePlayback();
    } catch (error) {
      console.error('Playback error:', error);
      Alert.alert('Playback Error', error.message);
    }
  };

  /**
   * Toggle microphone recording
   */
  const handleToggleRecording = () => {
    setIsRecording(!isRecording);
    // Note: Actual pitch detection is handled by the controller
  };

  /**
   * Seek to specific time
   */
  const handleSeek = async (timeSeconds) => {
    try {
      await practiceController.seekTo(timeSeconds);
    } catch (error) {
      console.error('Seek error:', error);
    }
  };

  /**
   * Get current expected pitch
   */
  const getCurrentExpectedPitch = () => {
    return practiceController.getCurrentExpectedPitch();
  };

  /**
   * Get current pitch comparison
   */
  const getCurrentPitchComparison = () => {
    return practiceController.getCurrentPitchComparison();
  };

  /**
   * Get visualization data
   */
  const getVisualizationData = () => {
    return practiceController.getVisualizationData();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Pitch Karaoke Practice</Text>
        {currentSong && (
          <View style={styles.songInfo}>
            <Text style={styles.songTitle}>{currentSong.title}</Text>
            <Text style={styles.songArtist}>{currentSong.artist}</Text>
            <Text style={styles.songMeta}>
              Duration: {formatTime(currentSong.totalDuration)} • 
              Segments: {currentSong.timeline.length}
            </Text>
          </View>
        )}
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Pitch Visualization */}
        <View style={styles.visualizationContainer}>
          <PitchVisualization
            visualizationData={getVisualizationData()}
            currentUserPitch={currentUserPitch}
            expectedPitch={getCurrentExpectedPitch()}
            currentTime={playbackState.currentPosition}
          />
        </View>

        {/* Current Pitch Display */}
        <View style={styles.pitchDisplay}>
          <View style={styles.pitchBox}>
            <Text style={styles.pitchLabel}>Expected</Text>
            <Text style={styles.pitchValue}>
              {getCurrentExpectedPitch()?.getNoteString() || '--'}
            </Text>
          </View>
          
          <View style={styles.pitchBox}>
            <Text style={styles.pitchLabel}>Your Voice</Text>
            <Text style={[styles.pitchValue, styles.userPitch]}>
              {currentUserPitch?.getNoteString() || '--'}
            </Text>
          </View>

          <View style={styles.pitchBox}>
            <Text style={styles.pitchLabel}>Accuracy</Text>
            <Text style={styles.pitchValue}>
              {getCurrentPitchComparison()?.accuracy || 0}%
            </Text>
          </View>
        </View>

        {/* Song Timeline */}
        {currentSong && (
          <SongTimeline
            song={currentSong}
            currentTime={playbackState.currentPosition}
            onSeek={handleSeek}
          />
        )}
      </View>

      {/* Practice Stats */}
      <PracticeStats stats={practiceStats} />

      {/* Control Panel */}
      <ControlPanel
        isPlaying={playbackState.isPlaying}
        isRecording={isRecording}
        isPracticeActive={isPracticeActive}
        currentTime={playbackState.currentPosition}
        duration={playbackState.duration}
        hasSong={!!currentSong}
        onTogglePlayback={handleTogglePlayback}
        onToggleRecording={handleToggleRecording}
        onStartPractice={handleStartPractice}
        onStopPractice={handleStopPractice}
        onImportSong={onImportSong}
        onSelectSong={onSelectSong}
      />
    </View>
  );
};

/**
 * Format time as MM:SS
 */
const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  songInfo: {
    alignItems: 'center',
  },
  songTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  songArtist: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 5,
  },
  songMeta: {
    fontSize: 12,
    color: '#999',
  },
  mainContent: {
    flex: 1,
  },
  visualizationContainer: {
    height: 200,
    marginBottom: 20,
  },
  pitchDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  pitchBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 10,
    borderRadius: 8,
    minWidth: 80,
  },
  pitchLabel: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 5,
  },
  pitchValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00ff00',
  },
  userPitch: {
    color: '#ff4444',
  },
});