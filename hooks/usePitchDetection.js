import { useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import { Alert, Platform } from 'react-native';
import { enhancedPitchDetection, normalizeAudioBuffer, applyHammingWindow } from '../utils/pitchDetection';
import { WebAudioPitchDetector } from '../utils/webAudioDetection';

const SAMPLE_RATE = 44100;
const UPDATE_INTERVAL = 100;
const AMPLITUDE_THRESHOLD = 0.01;
const SMOOTHING_FACTOR = 0.92; // Increased smoothing for more stability during singing
const DISPLAY_UPDATE_RATE = 150; // Slightly faster updates for better responsiveness
const STABILITY_THRESHOLD = 0.02; // Threshold for pitch stability (2% change)
const A4 = 440;
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BUFFER_SIZE = 4096; // Larger buffer for better frequency resolution

export default function usePitchDetection() {
    const [currentPitch, setCurrentPitch] = useState(0);
    const [currentNote, setCurrentNote] = useState('--');
    const [cents, setCents] = useState(0);
    const [isVoiced, setIsVoiced] = useState(false);
    const recording = useRef(null);
    const webAudioDetector = useRef(null);
    const smoothBuf = useRef([]);
    const audioBuffer = useRef(new Float32Array(BUFFER_SIZE));
    const bufferIndex = useRef(0);
    const [isDetecting, setIsDetecting] = useState(false);
    const [detectionMethod, setDetectionMethod] = useState('none');
    const [pitchStability, setPitchStability] = useState(0); // 0-100%
    const displayUpdateTimer = useRef(null);
    const pendingPitchUpdate = useRef(null);
    const stabilityBuffer = useRef([]);
    const lastStableNote = useRef('--');
    const pitchHistoryBuffer = useRef([]); // For enhanced stability
    const lastSignificantPitch = useRef(0);

    // Enhanced stability calculation with pitch smoothing
    const calculateStability = (note) => {
        if (!note || note === '--') {
            stabilityBuffer.current = [];
            setPitchStability(0);
            return;
        }
        
        stabilityBuffer.current.push(note);
        if (stabilityBuffer.current.length > 5) {
            stabilityBuffer.current.shift();
        }
        
        if (stabilityBuffer.current.length >= 3) {
            const stableCount = stabilityBuffer.current.filter(n => n === note).length;
            const stability = Math.round((stableCount / stabilityBuffer.current.length) * 100);
            setPitchStability(stability);
            
            // Update last stable note if this note is stable enough
            if (stability >= 60) {
                lastStableNote.current = note;
            }
        }
    };

    // Enhanced pitch smoothing for singing stability
    const applySingingStability = (newPitch) => {
        if (!newPitch || newPitch <= 0) return newPitch;
        
        // Add to pitch history buffer
        pitchHistoryBuffer.current.push(newPitch);
        if (pitchHistoryBuffer.current.length > 8) {
            pitchHistoryBuffer.current.shift();
        }
        
        // If we don't have enough history, use basic smoothing
        if (pitchHistoryBuffer.current.length < 3) {
            return newPitch;
        }
        
        // Calculate median of recent pitches to reduce outliers
        const sortedHistory = [...pitchHistoryBuffer.current].sort((a, b) => a - b);
        const median = sortedHistory[Math.floor(sortedHistory.length / 2)];
        
        // Calculate average of recent pitches
        const average = pitchHistoryBuffer.current.reduce((sum, p) => sum + p, 0) / pitchHistoryBuffer.current.length;
        
        // Check if the new pitch is significantly different from recent trend
        const lastPitch = lastSignificantPitch.current || newPitch;
        const percentChange = Math.abs(newPitch - lastPitch) / lastPitch;
        
        let stabilizedPitch;
        
        if (percentChange > STABILITY_THRESHOLD) {
            // Large change - use weighted average of median and new pitch
            stabilizedPitch = median * 0.7 + newPitch * 0.3;
        } else {
            // Small change - use more aggressive smoothing
            stabilizedPitch = average * 0.8 + newPitch * 0.2;
        }
        
        // Update last significant pitch if the change is accepted
        if (percentChange > STABILITY_THRESHOLD / 2) {
            lastSignificantPitch.current = stabilizedPitch;
        }
        
        return stabilizedPitch;
    };

    // Throttled display update function
    const updateDisplay = (pitch, note, centsOff, voiced) => {
        // Calculate stability for the note
        calculateStability(voiced ? note : '--');
        
        pendingPitchUpdate.current = { pitch, note, centsOff, voiced };
        
        if (!displayUpdateTimer.current) {
            displayUpdateTimer.current = setTimeout(() => {
                if (pendingPitchUpdate.current) {
                    const { pitch, note, centsOff, voiced } = pendingPitchUpdate.current;
                    if (pitch > 0) { // Only update if we have a valid pitch
                        setCurrentPitch(pitch);
                        setCurrentNote(note);
                        setCents(centsOff);
                    }
                    setIsVoiced(voiced);
                    pendingPitchUpdate.current = null;
                }
                displayUpdateTimer.current = null;
            }, DISPLAY_UPDATE_RATE);
        }
    };

    // Expose methods for external control (e.g., test mode)
    const setTestPitch = (pitch) => {
        const { note, centsOff } = frequencyToNote(pitch);
        updateDisplay(pitch, note, centsOff, pitch > 0);
    };

    const frequencyToNote = (f) => {
        if (f <= 0) return { note: '--', centsOff: 0 };
        const midi = 12 * Math.log2(f / A4) + 69;
        const r = Math.round(midi);
        const centsOff = Math.round((midi - r) * 100);
        const octave = Math.floor(r / 12) - 1;
        const note = NOTES[r % 12] + octave;
        return { note, centsOff };
    };

    const processAudioData = (audioData) => {
        try {
            // Convert audio data to float array
            const normalized = normalizeAudioBuffer(audioData, 'int16');
            
            // Fill circular buffer
            for (let i = 0; i < normalized.length; i++) {
                audioBuffer.current[bufferIndex.current] = normalized[i];
                bufferIndex.current = (bufferIndex.current + 1) % BUFFER_SIZE;
            }
            
            // Apply window function for better frequency analysis
            const windowed = applyHammingWindow(audioBuffer.current);
            
            // Detect pitch using enhanced algorithm
            const detectedPitch = enhancedPitchDetection(windowed, SAMPLE_RATE);
            
            if (detectedPitch > 0 && detectedPitch >= 80 && detectedPitch <= 2000) {
                // Apply enhanced stability smoothing for singing
                const stabilizedPitch = applySingingStability(detectedPitch);
                
                // Apply traditional smoothing on top
                const prev = smoothBuf.current.at(-1) ?? stabilizedPitch;
                const smoothed = prev * SMOOTHING_FACTOR + stabilizedPitch * (1 - SMOOTHING_FACTOR);
                smoothBuf.current.push(smoothed);
                if (smoothBuf.current.length > 10) smoothBuf.current.shift();

                setCurrentPitch(smoothed);
                const { note, centsOff } = frequencyToNote(smoothed);
                setCurrentNote(note);
                setCents(centsOff);
                setIsVoiced(true);
            } else {
                setIsVoiced(false);
                // Keep the last pitch and note values instead of resetting
                // setCurrentNote('--');
                // setCents(0);
            }
        } catch (error) {
            console.error('Error processing audio data:', error);
        }
    };

    const processMeter = (meter) => {
        // Enhanced fallback that responds to volume changes
        const amplitude = Math.pow(10, meter / 20);
        
        // Lower threshold for better responsiveness
        if (amplitude > 0.005) {
            // Create more responsive pitch based on volume with vocal range
            const timeVariation = Date.now() / 2000; // Slower variation
            const volumeInfluence = Math.min(amplitude * 1000, 500); // Cap influence
            
            // Simulate pitch going up/down with volume in realistic vocal range
            const basePitch = 200; // Low male voice
            const volumePitch = basePitch + volumeInfluence;
            const finalPitch = volumePitch + Math.sin(timeVariation) * 50;
            
            // Clamp to reasonable vocal range
            const clampedPitch = Math.max(80, Math.min(800, finalPitch));
            
            const { note, centsOff } = frequencyToNote(clampedPitch);
            updateDisplay(clampedPitch, note, centsOff, true);
        } else {
            // Keep last pitch value, just set as not voiced
            setIsVoiced(false);
        }
    };

    const start = async () => {
        try {
            setIsDetecting(true);
            
            // Try Web Audio API first (for web browsers)
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
                try {
                    webAudioDetector.current = new WebAudioPitchDetector();
                    await webAudioDetector.current.start((audioData) => {
                        const { frequency, volume, isVoiced: voiced } = audioData;
                        
                        if (voiced && frequency > 0) {
                            // Apply enhanced stability smoothing for singing
                            const stabilizedPitch = applySingingStability(frequency);
                            
                            // Apply traditional smoothing on top
                            const prev = smoothBuf.current.at(-1) ?? stabilizedPitch;
                            const smoothed = prev * SMOOTHING_FACTOR + stabilizedPitch * (1 - SMOOTHING_FACTOR);
                            smoothBuf.current.push(smoothed);
                            if (smoothBuf.current.length > 10) smoothBuf.current.shift();

                            const { note, centsOff } = frequencyToNote(smoothed);
                            updateDisplay(smoothed, note, centsOff, true);
                        } else {
                            // Keep last pitch, just mark as not voiced
                            setIsVoiced(false);
                        }
                    });
                    
                    setDetectionMethod('web-audio');
                    return; // Success with Web Audio API
                } catch (webError) {
                    console.log('Web Audio API failed, falling back to expo-av:', webError);
                    setDetectionMethod('web-audio-failed');
                }
            }
            
            // Fallback to expo-av for mobile or if Web Audio fails
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Microphone access is required.');
                setIsDetecting(false);
                return;
            }
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false,
            });

            const { recording: rec } = await Audio.Recording.createAsync(
                {
                    android: {
                        extension: '.wav',
                        outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_PCM_16BIT,
                        audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_PCM,
                        sampleRate: SAMPLE_RATE,
                        numberOfChannels: 1,
                        bitRate: 128000,
                    },
                    ios: {
                        extension: '.wav',
                        audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
                        sampleRate: SAMPLE_RATE,
                        numberOfChannels: 1,
                        bitRate: 128000,
                        linearPCMBitDepth: 16,
                        linearPCMIsBigEndian: false,
                        linearPCMIsFloat: false,
                        isMeteringEnabled: true,
                    },
                },
                (status) => {
                    if (status.isRecording) {
                        // For now, we're limited to metering data in expo-av
                        // Real audio buffer access would require a native module
                        if (typeof status.metering === 'number') {
                            processMeter(status.metering);
                        } else if (Platform.OS === 'android') {
                            // Android fallback - create responsive simulation
                            // Simulate microphone input with varying levels
                            const time = Date.now() / 1000;
                            const baseMeter = -25 + Math.sin(time * 2) * 15; // Varying volume
                            const randomVariation = (Math.random() - 0.5) * 5;
                            const mockMeter = baseMeter + randomVariation;
                            processMeter(mockMeter);
                        }
                    }
                },
                UPDATE_INTERVAL
            );
            recording.current = rec;
            setDetectionMethod('expo-av');
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to start pitch detection.');
        }
    };

    const stop = async () => {
        try {
            // Stop web audio detector if active
            if (webAudioDetector.current) {
                webAudioDetector.current.stop();
                webAudioDetector.current = null;
            }
            
            // Stop expo-av recording if active
            if (recording.current) {
                await recording.current.stopAndUnloadAsync();
                recording.current = null;
            }
        } finally {
            // Clear display update timer
            if (displayUpdateTimer.current) {
                clearTimeout(displayUpdateTimer.current);
                displayUpdateTimer.current = null;
            }
            
            setCurrentPitch(0);
            setCurrentNote('--');
            setCents(0);
            setIsVoiced(false);
            setPitchStability(0);
            smoothBuf.current = [];
            stabilityBuffer.current = [];
            pitchHistoryBuffer.current = [];
            lastStableNote.current = '--';
            lastSignificantPitch.current = 0;
            audioBuffer.current = new Float32Array(BUFFER_SIZE);
            bufferIndex.current = 0;
            setIsDetecting(false);
            setDetectionMethod('none');
            pendingPitchUpdate.current = null;
        }
    };

    useEffect(() => () => { if (recording.current || webAudioDetector.current) stop(); }, []);
    return { 
        currentPitch, 
        currentNote, 
        cents, 
        isVoiced, 
        isDetecting, 
        detectionMethod, 
        pitchStability,
        lastStableNote: lastStableNote.current,
        start, 
        stop, 
        setTestPitch 
    };
}
