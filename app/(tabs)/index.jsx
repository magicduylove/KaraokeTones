// app/(tabs)/index.jsx
import 'react-native-reanimated'; // MUST be first
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import usePitchDetection from '../../hooks/usePitchDetection';
import { testMicrophoneAccess } from '../../utils/webAudioDetection';

// --- constants ---
const SAMPLE_RATE = 44100;
const UPDATE_INTERVAL = 100; // ms
const A4 = 440;
const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const AMPLITUDE_THRESHOLD = 0.01;
const SMOOTHING = 0.9;

// --- helpers ---
const midiToFrequency = (midi) => A4 * Math.pow(2, (midi - 69) / 12);
function frequencyToNote(f) {
  if (!f || f <= 0) return { note: '--', centsOff: 0 };
  const midi = 12 * Math.log2(f / A4) + 69;
  const r = Math.round(midi);
  const centsOff = Math.round((midi - r) * 100);
  const octave = Math.floor(r / 12) - 1;
  const note = NOTES[r % 12] + octave;
  return { note, centsOff };
}

// --- tiny inline component: vertical pitch bar ---
function PitchBar({ pitchHz, min = 80, max = 1000 }) {
  const h = useSharedValue(0);
  useEffect(() => {
    const clamped = Math.min(1, Math.max(0, (pitchHz - min) / (max - min)));
    h.value = withTiming(clamped, { duration: 120 });
  }, [pitchHz]);
  const style = useAnimatedStyle(() => ({
    height: 8 + h.value * 120,
    borderRadius: 6,
  }));
  return (
    <View style={{height: 140, width: 18, backgroundColor: '#111', borderRadius: 8, overflow: 'hidden', marginLeft: 12}}>
      <Animated.View style={[{ backgroundColor: '#4ade80', width: '100%' }, style]} />
    </View>
  );
}

export default function Index() {
  // Use the improved pitch detection hook
  const { 
    currentPitch, 
    currentNote, 
    cents, 
    isVoiced, 
    isDetecting, 
    detectionMethod,
    pitchStability,
    lastStableNote,
    start: startPitchDetection, 
    stop: stopPitchDetection,
    setTestPitch
  } = usePitchDetection();
  
  const [lastMeter, setLastMeter] = useState(null); // diagnostics
  const [debugInfo, setDebugInfo] = useState('Ready');
  const [micTestResult, setMicTestResult] = useState(null);

  // score & playback
  const [score, setScore] = useState(null);
  const [tempo, setTempo] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [targetNote, setTargetNote] = useState(null);

  // TEST MODE
  const [testMode, setTestMode] = useState(false);

  // refs
  const timerRef = useRef(null);
  const testTimerRef = useRef(null);

  // animated playhead
  const playheadX = useSharedValue(0);
  useEffect(() => {
    playheadX.value = withTiming(playbackPosition * 100, { duration: UPDATE_INTERVAL });
  }, [playbackPosition]);
  const playheadStyle = useAnimatedStyle(() => ({ transform: [{ translateX: playheadX.value }] }));

  // permissions once
  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Microphone access is required for pitch detection.');
      }
    })();
  }, []);

  const startDetection = async () => {
    // stop test mode if active
    if (testMode) stopTestMode();
    
    try {
      setDebugInfo('Starting detection...');
      await startPitchDetection();
      if (detectionMethod === 'web-audio') {
        setDebugInfo('Web: Real microphone detection active! 🎤');
      } else if (detectionMethod === 'web-audio-failed') {
        setDebugInfo('Web: Microphone access failed - using fallback');
      } else if (Platform.OS === 'android') {
        setDebugInfo('Android: Enhanced simulation mode');
      } else {
        setDebugInfo('iOS: Microphone metering mode');
      }
    } catch (e) {
      console.error(e);
      setDebugInfo(`Error: ${e.message}`);
      Alert.alert('Error', 'Failed to start pitch detection.');
    }
  };

  const stopDetection = async () => {
    try {
      await stopPitchDetection();
      setLastMeter(null);
      setDebugInfo('Detection stopped');
    } catch (e) {
      console.error(e);
      setDebugInfo(`Stop error: ${e.message}`);
    }
  };

  // ---- TEST MODE (simulate a singer) ----
  const startTestMode = () => {
    stopDetection();
    setTestMode(true);
    // Test mode now simulates better pitch patterns
    let t = 0;
    testTimerRef.current = setInterval(() => {
      // Simulate singing a melody with realistic pitch changes
      t += UPDATE_INTERVAL / 1000;
      
      // Create a more realistic melody pattern
      const baseFreq = 220; // A3
      const melodyPattern = [
        { freq: 220, duration: 2 },  // A3
        { freq: 247, duration: 2 },  // B3
        { freq: 262, duration: 2 },  // C4
        { freq: 294, duration: 2 },  // D4
        { freq: 330, duration: 2 },  // E4
        { freq: 349, duration: 2 },  // F4
        { freq: 392, duration: 2 },  // G4
        { freq: 440, duration: 2 },  // A4
      ];
      
      const totalDuration = melodyPattern.reduce((sum, note) => sum + note.duration, 0);
      const cycleTime = t % totalDuration;
      
      let currentTime = 0;
      let targetFreq = 220;
      
      for (const note of melodyPattern) {
        if (cycleTime >= currentTime && cycleTime < currentTime + note.duration) {
          targetFreq = note.freq;
          break;
        }
        currentTime += note.duration;
      }
      
      // Add some vibrato and slight pitch variations to make it realistic
      const vibrato = Math.sin(t * 5) * 3; // 5Hz vibrato, ±3 cents
      const drift = Math.sin(t * 0.3) * 10; // Slow pitch drift ±10 cents
      const finalFreq = targetFreq * Math.pow(2, (vibrato + drift) / 1200);
      
      // Update the pitch using the hook's test method
      setTestPitch(finalFreq);
    }, UPDATE_INTERVAL);
  };

  const stopTestMode = () => {
    if (testTimerRef.current) clearInterval(testTimerRef.current);
    testTimerRef.current = null;
    setTestMode(false);
    // Reset pitch display
    setTestPitch(0);
  };

  // Test microphone access
  const testMicrophone = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Info', 'Microphone test is only available on web browsers.');
      return;
    }
    
    setMicTestResult('Testing...');
    try {
      const result = await testMicrophoneAccess();
      setMicTestResult(result.message);
      
      if (result.success) {
        Alert.alert('Microphone Test', result.message);
      } else {
        Alert.alert('Microphone Test Failed', result.message);
      }
    } catch (error) {
      setMicTestResult('Test failed: ' + error.message);
      Alert.alert('Error', 'Microphone test failed: ' + error.message);
    }
  };

  // score loading
  const loadDemoScore = () => {
    const demo = [
      { start: 0.0, dur: 0.5, midi: 60, note: 'C4' },
      { start: 0.5, dur: 0.5, midi: 62, note: 'D4' },
      { start: 1.0, dur: 0.5, midi: 64, note: 'E4' },
      { start: 1.5, dur: 0.5, midi: 65, note: 'F4' },
      { start: 2.0, dur: 0.5, midi: 67, note: 'G4' },
      { start: 2.5, dur: 0.5, midi: 69, note: 'A4' },
      { start: 3.0, dur: 0.5, midi: 71, note: 'B4' },
      { start: 3.5, dur: 0.5, midi: 72, note: 'C5' },
    ];
    setScore(demo);
  };

  const loadScore = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.type === 'success') {
        const content = await FileSystem.readAsStringAsync(result.uri);
        const data = JSON.parse(content);
        setScore(data);
        Alert.alert('Success', 'Score loaded successfully');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to load score');
    }
  };

  // playback
  const startPlayback = () => {
    if (!score?.length || timerRef.current) return;
    setIsPlaying(true);
    setPlaybackPosition(0);
    timerRef.current = setInterval(() => {
      setPlaybackPosition((prev) => {
        const pos = prev + (UPDATE_INTERVAL / 1000) * tempo;
        const cur = score.find(n => pos >= n.start && pos < n.start + n.dur) || null;
        setTargetNote(cur ? { ...cur, frequency: midiToFrequency(cur.midi) } : null);
        const end = score[score.length - 1].start + score[score.length - 1].dur;
        return pos > end ? 0 : pos;
      });
    }, UPDATE_INTERVAL);
  };

  const stopPlayback = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setIsPlaying(false);
    setPlaybackPosition(0);
    setTargetNote(null);
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (isDetecting) stopDetection();
      if (timerRef.current) stopPlayback();
      if (testTimerRef.current) stopTestMode();
    };
  }, []);

  // feedback helpers
  const getComparisonColor = () => {
    if (!isVoiced || !targetNote) return 'gray';
    const deltaCents = 1200 * Math.log2(currentPitch / targetNote.frequency);
    const tol = 15;
    if (deltaCents > tol) return '#4CAF50';   // sharp (higher)
    if (deltaCents < -tol) return '#F44336';  // flat (lower)
    return '#00BCD4'; // in tune
  };
  const getComparisonText = () => {
    if (!isVoiced || !targetNote) return 'Sing!';
    const deltaCents = 1200 * Math.log2(currentPitch / targetNote.frequency);
    const tol = 15;
    if (deltaCents > tol) return 'TOO HIGH ↑';
    if (deltaCents < -tol) return 'TOO LOW ↓';
    return 'PERFECT! ✓';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>PitchKaraoke</Text>
        <Text style={styles.subtitle}>Real-time Pitch Detection & Training</Text>
      </View>

      {/* Live Pitch */}
      <View style={styles.pitchDisplay}>
        <Text style={styles.sectionTitle}>
          Live Pitch {isDetecting && '🎤'} {testMode && '🧪'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.noteDisplay}>
            <Text style={[styles.noteText, { color: isVoiced ? '#000' : '#999' }]}>{currentNote}</Text>
            
            {isVoiced && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.centsText, {
                  color: Math.abs(cents) <= 15 ? '#4CAF50'
                      : Math.abs(cents) <= 30 ? '#FF9800' : '#F44336'
                }]}>
                  {cents > 0 ? '+' : ''}{cents}¢
                </Text>
                
                {/* Stability indicator */}
                <Text style={[styles.stabilityText, {
                  color: pitchStability >= 80 ? '#4CAF50' 
                      : pitchStability >= 60 ? '#FF9800' : '#F44336'
                }]}>
                  {pitchStability}%
                </Text>
              </View>
            )}
            
            {isVoiced && <Text style={styles.frequencyText}>{Math.round(currentPitch)} Hz</Text>}
            
            {/* Show last stable note when not currently voiced */}
            {!isVoiced && lastStableNote !== '--' && isDetecting && (
              <Text style={[styles.frequencyText, { color: '#4CAF50' }]}>
                Last stable: {lastStableNote}
              </Text>
            )}
            
            {!isVoiced && lastStableNote === '--' && isDetecting && (
              <Text style={[styles.frequencyText, { color: '#2196F3' }]}>
                Listening... {Platform.OS === 'web' ? 'Make some noise!' : 'Try speaking/singing!'}
              </Text>
            )}
          </View>
          <PitchBar pitchHz={currentPitch} />
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, isDetecting && styles.buttonActive]}
          onPress={isDetecting ? stopDetection : startDetection}
        >
          <Text style={styles.buttonText}>
            {isDetecting ? '🎤 Stop Detection' : '▶️ Start Detection'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={loadDemoScore}>
          <Text style={styles.buttonText}>Load Demo Score</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={loadScore}>
          <Text style={styles.buttonText}>Import Score (JSON)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, testMode && styles.buttonActive]}
          onPress={testMode ? stopTestMode : startTestMode}
        >
          <Text style={styles.buttonText}>{testMode ? 'Stop Test Mode' : 'Test Mode (Simulate Pitch)'}</Text>
        </TouchableOpacity>

        {Platform.OS === 'web' && (
          <TouchableOpacity style={styles.button} onPress={testMicrophone}>
            <Text style={styles.buttonText}>🔧 Test Microphone</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Score */}
      {score && (
        <View style={styles.scoreSection}>
          <Text style={styles.sectionTitle}>Score</Text>

          <View style={styles.scoreVisualizer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.scoreTrack}>
                {score.map((n, i) => (
                  <View
                    key={i}
                    style={[
                      styles.noteBlock,
                      {
                        left: n.start * 100,
                        width: n.dur * 100,
                        bottom: (n.midi - 60) * 10,
                        backgroundColor: targetNote && targetNote.midi === n.midi ? '#2196F3' : '#9E9E9E'
                      }
                    ]}
                  >
                    <Text style={styles.noteLabel}>{n.note}</Text>
                  </View>
                ))}
                {isPlaying && <Animated.View style={[styles.playhead, playheadStyle]} />}
              </View>
            </ScrollView>
          </View>

          {/* Playback */}
          <View style={styles.playbackControls}>
            <TouchableOpacity style={styles.button} onPress={isPlaying ? stopPlayback : startPlayback}>
              <Text style={styles.buttonText}>{isPlaying ? 'Stop' : 'Play'}</Text>
            </TouchableOpacity>

            <View style={styles.tempoControl}>
              <Text>Tempo: {tempo}x</Text>
              <View style={styles.tempoButtons}>
                <TouchableOpacity onPress={() => setTempo(Math.max(0.5, tempo - 0.25))} style={styles.tempoButton}><Text>-</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setTempo(Math.min(2.0, tempo + 0.25))} style={styles.tempoButton}><Text>+</Text></TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Comparison */}
          {targetNote && (isDetecting || testMode) && (
            <View style={[styles.comparisonDisplay, { backgroundColor: getComparisonColor() }]}>
              <Text style={styles.targetText}>Target: {targetNote.note}</Text>
              <Text style={styles.comparisonText}>{getComparisonText()}</Text>
              {isVoiced && (
                <Text style={styles.deviationText}>
                  {Math.round(1200 * Math.log2(currentPitch / targetNote.frequency))}¢
                </Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* Diagnostics */}
      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>Diagnostics</Text>
        <Text style={styles.instructionText}>
          Platform: {Platform.OS}{'\n'}
          Detection Method: {detectionMethod}{'\n'}
          Detection Active: {isDetecting ? 'yes' : 'no'}{'\n'}
          Status: {debugInfo}{'\n'}
          Test Mode: {testMode ? 'ON' : 'OFF'}{'\n'}
          Current Pitch: {currentPitch > 0 ? Math.round(currentPitch) + ' Hz' : 'none'}{'\n'}
          Is Voiced: {isVoiced ? 'YES' : 'NO'}{'\n'}
          Pitch Stability: {pitchStability}%{'\n'}
          Last Stable Note: {lastStableNote}{'\n'}
          Volume Level: {detectionMethod === 'web-audio' ? 'Real-time' : 'Simulated'}{'\n'}
          {micTestResult && `Mic Test: ${micTestResult}`}
        </Text>
        {Platform.OS === 'android' && (
          <Text style={[styles.instructionText, { marginTop: 6 }]}>
            Note: Android + expo-av has limited audio access. This version includes improved fallback behavior.
            For full pitch detection, consider using a custom dev client with native audio processing libraries.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingTop: 50, paddingBottom: 20, backgroundColor: '#2196F3', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: 'white' },
  subtitle: { fontSize: 16, color: 'white', marginTop: 5 },

  pitchDisplay: {
    backgroundColor: 'white', margin: 15, padding: 20, borderRadius: 10, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10, color: '#333' },
  noteDisplay: { alignItems: 'center' },
  noteText: { fontSize: 48, fontWeight: 'bold' },
  centsText: { fontSize: 24, marginLeft: 10 },
  stabilityText: { fontSize: 16, marginLeft: 10, fontWeight: 'bold' },
  frequencyText: { fontSize: 14, color: '#666', marginTop: 5 },

  controls: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 15 },
  button: { backgroundColor: '#2196F3', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, margin: 5 },
  buttonActive: { backgroundColor: '#F44336' },
  buttonText: { color: 'white', fontWeight: '600' },

  scoreSection: {
    backgroundColor: 'white', margin: 15, padding: 20, borderRadius: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  scoreVisualizer: { height: 150, backgroundColor: '#f0f0f0', borderRadius: 8, marginVertical: 10, overflow: 'hidden' },
  scoreTrack: { height: 150, width: 800, position: 'relative' },
  noteBlock: { position: 'absolute', height: 20, borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  noteLabel: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  playhead: { position: 'absolute', width: 2, height: 150, backgroundColor: '#FF5722', top: 0 },

  playbackControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  tempoControl: { flexDirection: 'row', alignItems: 'center' },
  tempoButtons: { flexDirection: 'row', marginLeft: 10 },
  tempoButton: { backgroundColor: '#e0e0e0', paddingHorizontal: 15, paddingVertical: 5, marginHorizontal: 5, borderRadius: 5 },

  comparisonDisplay: { padding: 15, borderRadius: 8, marginTop: 15, alignItems: 'center' },
  targetText: { color: 'white', fontSize: 16, fontWeight: '600' },
  comparisonText: { color: 'white', fontSize: 24, fontWeight: 'bold', marginTop: 5 },
  deviationText: { color: 'white', fontSize: 18, marginTop: 5 },

  instructions: {
    backgroundColor: 'white', margin: 15, padding: 20, borderRadius: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  instructionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10, color: '#333' },
  instructionText: { fontSize: 14, color: '#666', lineHeight: 20 },
});
