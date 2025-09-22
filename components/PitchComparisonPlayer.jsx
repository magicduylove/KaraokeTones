import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Alert } from 'react-native';
import { Audio } from 'expo-av';
import AudioAnalyzer from '../utils/audioAnalyzer';
import SongStorage, { SongPitchMap } from '../utils/songStorage';
import usePitchDetection from '../hooks/usePitchDetection';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const PitchComparisonPlayer = ({ audioFile = 'musicstore/BeoDatMayTroi.mp3' }) => {
  const [songPitchMap, setSongPitchMap] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [audioSound, setAudioSound] = useState(null);
  const [audioStatus, setAudioStatus] = useState(null);
  const [savedSongs, setSavedSongs] = useState([]);
  const [showSongList, setShowSongList] = useState(false);
  
  const [userPitchHistory, setUserPitchHistory] = useState([]);
  
  // Use existing pitch detection hook for user's voice
  const { 
    currentPitch: userFrequency, 
    currentNote: userNote, 
    isDetecting: micRecording,
    start: startRecording,
    stop: stopRecording 
  } = usePitchDetection();

  /**
   * Load saved songs on component mount
   */
  useEffect(() => {
    loadSavedSongs();
    checkForExistingSong();
  }, []);

  /**
   * Load list of saved songs
   */
  const loadSavedSongs = async () => {
    try {
      const songList = await SongStorage.getSongList();
      setSavedSongs(songList);
    } catch (error) {
      console.error('Error loading saved songs:', error);
    }
  };

  /**
   * Check if current song is already analyzed
   */
  const checkForExistingSong = async () => {
    try {
      const existingSongId = await SongStorage.findSongByPath(audioFile);
      if (existingSongId) {
        const existingSong = await SongStorage.loadSong(existingSongId);
        if (existingSong) {
          setSongPitchMap(existingSong);
          console.log('Loaded existing song analysis:', existingSong.title);
        }
      }
    } catch (error) {
      console.error('Error checking for existing song:', error);
    }
  };


  /**
   * Import analysis result from API
   */
  const importAnalysisResult = () => {
    Alert.prompt(
      'Import Analysis Result',
      'Paste the analysis JSON result from the API:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Import', 
          onPress: async (jsonText) => {
            try {
              const analysisResult = JSON.parse(jsonText);
              
              if (analysisResult.success && analysisResult.analysis) {
                const songMap = SongPitchMap.fromJSON(analysisResult.analysis);
                
                // Save to storage
                const saveSuccess = await SongStorage.saveSong(songMap);
                if (saveSuccess) {
                  setSongPitchMap(songMap);
                  loadSavedSongs();
                  Alert.alert('Import Success', `Analysis for "${songMap.title}" has been imported successfully!`);
                } else {
                  Alert.alert('Save Error', 'Failed to save imported analysis.');
                }
              } else {
                Alert.alert('Invalid Format', 'The provided JSON does not contain valid analysis data.');
              }
            } catch (error) {
              Alert.alert('Import Error', 'Invalid JSON format. Please check the format and try again.');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  /**
   * Initialize audio permissions
   */
  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Audio permissions are required to play songs.');
      }
    })();
  }, []);

  /**
   * Load and play the original MP3 file
   */
  const playAudio = async () => {
    try {
      if (isPlaying && audioSound) {
        // Pause if currently playing
        await audioSound.pauseAsync();
        setIsPlaying(false);
        return;
      }

      // Load audio if not already loaded
      if (!audioSound) {
        console.log('Loading audio for playback:', audioFile);
        
        // Try different path formats for local files
        const pathsToTry = [
          // Try require() for bundled assets first
          (() => {
            try {
              return require('../musicstore/BeoDatMayTroi.mp3');
            } catch {
              return null;
            }
          })(),
          // Try relative paths
          { uri: './musicstore/BeoDatMayTroi.mp3' },
          { uri: 'musicstore/BeoDatMayTroi.mp3' },
          { uri: '/musicstore/BeoDatMayTroi.mp3' },
          // Try original path
          { uri: audioFile },
          // Try file:// protocol  
          { uri: `file://${audioFile}` },
          { uri: `file:///${audioFile}` },
          // Try asset:// protocol
          { uri: `asset:/musicstore/BeoDatMayTroi.mp3` },
        ].filter(Boolean); // Remove null entries

        let audioSource = null;
        let sound = null;

        for (const testSource of pathsToTry) {
          try {
            console.log('Attempting to load:', testSource);
            const result = await Audio.Sound.createAsync(
              testSource,
              { 
                shouldPlay: false, 
                isLooping: false,
                volume: 1.0,
                progressUpdateIntervalMillis: 100
              },
              onPlaybackStatusUpdate
            );
            
            sound = result.sound;
            audioSource = testSource;
            console.log('✅ Successfully loaded audio with:', testSource);
            break;
          } catch (err) {
            console.log('❌ Failed to load with:', testSource, err.message);
          }
        }

        if (!sound) {
          throw new Error('Could not load audio file with any path format');
        }

        setAudioSound(sound);
        
        // Start playing
        await sound.playAsync();
        setIsPlaying(true);
      } else {
        // Resume playing
        await audioSound.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      console.error('Audio file path:', audioFile);
      Alert.alert('Playback Error', `Failed to play audio file: ${error.message}\n\nFile: ${audioFile}\n\nMake sure the MP3 file exists in the musicstore folder.`);
    }
  };

  /**
   * Handle playback status updates
   */
  const onPlaybackStatusUpdate = (status) => {
    setAudioStatus(status);
    
    if (status.isLoaded) {
      // Update current time
      const timeInSeconds = status.positionMillis / 1000;
      setCurrentTime(timeInSeconds);
      
      // Check if playback finished
      if (status.didJustFinish) {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    }
  };

  /**
   * Stop audio playback
   */
  const stopAudio = async () => {
    try {
      if (audioSound) {
        await audioSound.stopAsync();
        await audioSound.setPositionAsync(0);
        setIsPlaying(false);
        setCurrentTime(0);
      }
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  };

  /**
   * Load selected song from storage
   */
  const loadSelectedSong = async (songId) => {
    try {
      const song = await SongStorage.loadSong(songId);
      if (song) {
        setSongPitchMap(song);
        setUserPitchHistory([]); // Clear user history
        console.log('Loaded song:', song.title);
        Alert.alert('Song Loaded', `"${song.title}" is ready for practice!`);
      }
    } catch (error) {
      console.error('Error loading selected song:', error);
      Alert.alert('Error', 'Failed to load selected song.');
    }
  };

  /**
   * Toggle microphone recording
   */
  const toggleRecording = () => {
    if (micRecording) {
      stopRecording();
      setIsRecording(false);
    } else {
      startRecording();
      setIsRecording(true);
    }
  };

  /**
   * Get current expected note from song
   */
  const getCurrentSongNote = () => {
    if (!songPitchMap) return null;
    
    return songPitchMap.getPitchAtTime(currentTime);
  };

  /**
   * Convert frequency to Y position on canvas
   */
  const frequencyToY = (frequency) => {
    if (!frequency || frequency <= 0) return screenHeight / 2;
    
    // Map frequency range (80-800Hz) to canvas height
    const minFreq = 80;
    const maxFreq = 800;
    const logFreq = Math.log(Math.max(frequency, minFreq));
    const logMin = Math.log(minFreq);
    const logMax = Math.log(maxFreq);
    
    const normalizedY = (logFreq - logMin) / (logMax - logMin);
    return screenHeight * 0.8 - (normalizedY * screenHeight * 0.6);
  };

  /**
   * Create visual blocks for pitch visualization
   */
  const createPitchBlocks = () => {
    const blocks = [];
    const blockWidth = 4;
    const visualWidth = screenWidth - 40;
    const visualHeight = 200;
    
    // Song pitch blocks (green)
    if (songPitchMap && songPitchMap.timeline) {
      songPitchMap.timeline.forEach((segment, index) => {
        if (segment.note !== '--') {
          const noteFreq = segment.frequency;
          const x = (segment.startTime / (songPitchMap.totalDuration || 60)) * visualWidth;
          const y = frequencyToY(noteFreq) * (visualHeight / 300); // Scale to container
          const width = Math.max(blockWidth, (segment.duration / (songPitchMap.totalDuration || 60)) * visualWidth);
          
          blocks.push({
            type: 'song',
            x: x,
            y: Math.max(0, visualHeight - y - 10),
            width: width,
            height: 8,
            frequency: noteFreq,
            note: segment.note,
            key: `song-${index}`
          });
        }
      });
    }
    
    // User pitch blocks (red)
    userPitchHistory.forEach((entry, index) => {
      const x = (entry.time / (songPitchMap?.totalDuration || 60)) * visualWidth;
      const y = frequencyToY(entry.frequency) * (visualHeight / 300);
      
      blocks.push({
        type: 'user',
        x: x,
        y: Math.max(0, visualHeight - y - 5),
        width: blockWidth,
        height: 6,
        frequency: entry.frequency,
        key: `user-${index}`
      });
    });
    
    return blocks;
  };

  /**
   * Update user pitch history
   */
  useEffect(() => {
    if (userFrequency && userFrequency > 0 && songPitchMap && isPlaying) {
      setUserPitchHistory(prev => {
        const newEntry = { 
          frequency: userFrequency, 
          time: currentTime,
          note: userNote 
        };
        const newHistory = [...prev, newEntry];
        // Keep last 200 entries for performance
        return newHistory.slice(-200);
      });
    }
  }, [userFrequency, currentTime, songPitchMap, isPlaying, userNote]);

  /**
   * Convert note string to frequency
   */
  const noteToFrequency = (noteString) => {
    const noteRegex = /([A-G]#?)(\d+)/;
    const match = noteString.match(noteRegex);
    if (!match) return 440;
    
    const [, note, octave] = match;
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteIndex = noteNames.indexOf(note);
    
    if (noteIndex === -1) return 440;
    
    const midiNote = (parseInt(octave) + 1) * 12 + noteIndex;
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  };

  // Clear pitch history when song changes
  useEffect(() => {
    setUserPitchHistory([]);
  }, [songPitchMap]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioSound) {
        audioSound.unloadAsync();
      }
    };
  }, [audioSound]);

  const currentSongNote = getCurrentSongNote();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Pitch Comparison Practice</Text>
        <Text style={styles.subtitle}>
          {songPitchMap ? songPitchMap.title : 'No song loaded'}
        </Text>
        {songPitchMap && (
          <Text style={styles.metadata}>
            Duration: {SongPitchMap.formatTime(songPitchMap.totalDuration)} | 
            Segments: {songPitchMap.timeline.length} | 
            {songPitchMap.metadata.key && ` Key: ${songPitchMap.metadata.key}`}
          </Text>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>🎵 How to Use:</Text>
        <Text style={styles.instructionsText}>
          1. Run API Server (in separate terminal):{'\n'}
          <Text style={styles.codeText}>cd analysis-api{'\n'}npm install{'\n'}npm start</Text>
          {'\n\n'}2. Analyze Song (via API):{'\n'}
          <Text style={styles.codeText}>curl -X POST http://localhost:3001/analyze \{'\n'}  -F "audio=@musicstore/BeoDatMayTroi.mp3" \{'\n'}  -F "songTitle=BeoDatMayTroi"</Text>
          {'\n\n'}3. Import Result - Copy JSON output and paste into "📥 Import Analysis"
          {'\n\n'}4. Practice - Play song + Start mic to compare your pitch vs song
        </Text>
      </View>

      {/* Pitch Visualization using React Native Views */}
      <View style={styles.canvasContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.pitchVisualization}>
            {/* Frequency reference lines */}
            {[100, 200, 300, 400, 500, 600, 700, 800].map(freq => (
              <View 
                key={freq}
                style={[
                  styles.frequencyLine,
                  { 
                    top: frequencyToY(freq) * (200 / 300),
                    opacity: 0.3 
                  }
                ]}
              >
                <Text style={styles.frequencyLabel}>{freq}Hz</Text>
              </View>
            ))}
            
            {/* Pitch blocks */}
            {createPitchBlocks().map((block) => (
              <View
                key={block.key}
                style={[
                  styles.pitchBlock,
                  {
                    left: block.x,
                    top: block.y,
                    width: block.width,
                    height: block.height,
                    backgroundColor: block.type === 'song' ? '#00ff00' : '#ff0000',
                    opacity: block.type === 'song' ? 0.8 : 0.6,
                  }
                ]}
              />
            ))}
            
            {/* Current time indicator */}
            {songPitchMap && (
              <View
                style={[
                  styles.timeIndicator,
                  {
                    left: (currentTime / (songPitchMap.totalDuration || 60)) * (screenWidth - 40),
                  }
                ]}
              />
            )}
          </View>
        </ScrollView>
        
        {/* Overlay with note information */}
        <View style={styles.overlay}>
          <View style={styles.noteDisplay}>
            <Text style={styles.noteLabel}>Song:</Text>
            <Text style={styles.noteValue}>
              {currentSongNote ? currentSongNote.note : '--'}
            </Text>
          </View>
          
          <View style={styles.noteDisplay}>
            <Text style={styles.noteLabel}>Your Voice:</Text>
            <Text style={[styles.noteValue, { color: '#ff4444' }]}>
              {userNote || '--'}
            </Text>
          </View>
        </View>
      </View>

      {/* Time display */}
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>
          {SongPitchMap.formatTime(currentTime)}
          {songPitchMap && ` / ${SongPitchMap.formatTime(songPitchMap.totalDuration)}`}
        </Text>
        {audioStatus && audioStatus.isLoaded && (
          <Text style={styles.statusText}>
            Status: {isPlaying ? 'Playing' : 'Paused'} | 
            Buffer: {Math.round((audioStatus.positionMillis / audioStatus.durationMillis) * 100)}%
          </Text>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>

        <TouchableOpacity 
          style={[styles.button, !songPitchMap && styles.buttonDisabled]}
          onPress={playAudio}
          disabled={!songPitchMap}
        >
          <Text style={styles.buttonText}>
            {isPlaying ? 'Pause' : 'Play Song'}
          </Text>
        </TouchableOpacity>

        {isPlaying && (
          <TouchableOpacity 
            style={styles.button}
            onPress={stopAudio}
          >
            <Text style={styles.buttonText}>Stop</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: '#3498db' }]}
          onPress={importAnalysisResult}
        >
          <Text style={styles.buttonText}>📥 Import Analysis</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: '#ff6b35' }]}
          onPress={() => setShowSongList(!showSongList)}
        >
          <Text style={styles.buttonText}>
            {showSongList ? 'Hide Songs' : `Songs (${savedSongs.length})`}
          </Text>
        </TouchableOpacity>


        <TouchableOpacity 
          style={[styles.button, isRecording && styles.buttonActive]}
          onPress={toggleRecording}
        >
          <Text style={styles.buttonText}>
            {isRecording ? 'Stop Mic' : 'Start Mic'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Song Library */}
      {showSongList && (
        <View style={styles.songLibrary}>
          <Text style={styles.libraryTitle}>🎵 Analyzed Songs</Text>
          {savedSongs.length === 0 ? (
            <Text style={styles.noSongsText}>No songs imported yet. Use "📥 Import Analysis" to add songs.</Text>
          ) : (
            <ScrollView style={styles.songListContainer}>
              {savedSongs.map((song) => (
                <TouchableOpacity
                  key={song.songId}
                  style={[
                    styles.songListItem,
                    songPitchMap?.songId === song.songId && styles.selectedSongItem
                  ]}
                  onPress={() => loadSelectedSong(song.songId)}
                >
                  <View style={styles.songInfo}>
                    <Text style={styles.songTitle}>{song.title}</Text>
                    <Text style={styles.songDetails}>
                      {SongPitchMap.formatTime(song.duration)} • {song.segmentCount} segments
                    </Text>
                  </View>
                  <View style={styles.songActions}>
                    {songPitchMap?.songId === song.songId && (
                      <Text style={styles.currentSongIndicator}>▶</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* Current Song Timeline Summary */}
      {songPitchMap && (
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>🎼 Pitch Timeline</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.timelineContainer}>
              {songPitchMap.getTimelineSummary().slice(0, 20).map((segment) => (
                <View
                  key={segment.id}
                  style={[
                    styles.timelineSegment,
                    currentTime >= segment.startTime && currentTime < segment.endTime && styles.activeSegment
                  ]}
                >
                  <Text style={styles.segmentNote}>{segment.displayNote}</Text>
                  <Text style={styles.segmentTime}>{segment.timeRange}</Text>
                </View>
              ))}
              {songPitchMap.timeline.length > 20 && (
                <View style={styles.timelineSegment}>
                  <Text style={styles.segmentNote}>...</Text>
                  <Text style={styles.segmentTime}>+{songPitchMap.timeline.length - 20} more</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#00ff00' }]} />
          <Text style={styles.legendText}>Song Pitch</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#ff0000' }]} />
          <Text style={styles.legendText}>Your Pitch</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#ffffff' }]} />
          <Text style={styles.legendText}>Current Time</Text>
        </View>
      </View>
    </View>
  );
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
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
  },
  canvasContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#111',
    borderRadius: 10,
    overflow: 'hidden',
  },
  pitchVisualization: {
    width: Math.max(screenWidth - 40, 600),
    height: 200,
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
  pitchBlock: {
    position: 'absolute',
    borderRadius: 1,
  },
  timeIndicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#ffffff',
  },
  overlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  noteDisplay: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  noteLabel: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 2,
  },
  noteValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00ff00',
  },
  timeContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  timeText: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'monospace',
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: '#333',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
    margin: 5,
  },
  buttonActive: {
    backgroundColor: '#ff4444',
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
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    marginRight: 5,
  },
  legendText: {
    color: '#ccc',
    fontSize: 12,
  },
  // New styles for storage features
  metadata: {
    fontSize: 12,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 5,
  },
  statusText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
  },
  songLibrary: {
    backgroundColor: '#222',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    maxHeight: 300,
  },
  libraryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  noSongsText: {
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  songListContainer: {
    maxHeight: 200,
  },
  songListItem: {
    backgroundColor: '#333',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedSongItem: {
    backgroundColor: '#444',
    borderWidth: 2,
    borderColor: '#ff6b35',
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  songDetails: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 2,
  },
  songMeta: {
    color: '#999',
    fontSize: 10,
  },
  songActions: {
    alignItems: 'flex-end',
  },
  currentSongIndicator: {
    color: '#ff6b35',
    fontSize: 12,
    fontWeight: 'bold',
  },
  timelineSection: {
    backgroundColor: '#222',
    margin: 15,
    padding: 15,
    borderRadius: 10,
  },
  timelineContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  timelineSegment: {
    backgroundColor: '#333',
    padding: 8,
    marginHorizontal: 2,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  activeSegment: {
    backgroundColor: '#ff6b35',
  },
  segmentNote: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  segmentTime: {
    color: '#ccc',
    fontSize: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  // Instructions card styles
  instructionsCard: {
    backgroundColor: '#f8f9fa',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  instructionsText: {
    fontSize: 13,
    color: '#34495e',
    lineHeight: 18,
  },
  codeText: {
    fontFamily: 'monospace',
    backgroundColor: '#ecf0f1',
    color: '#2c3e50',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 12,
  },
});

export default PitchComparisonPlayer;