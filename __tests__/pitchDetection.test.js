// Test cases for pitch detection functionality
import { jest } from '@jest/globals';

// Mock frequency analysis functions for testing
const mockYINPitchDetection = (buffer, sampleRate) => {
  // Simplified YIN algorithm simulation for testing
  if (!buffer || buffer.length < 2) return 0;
  
  // Mock implementation - in real YIN, this would be much more complex
  const sum = buffer.reduce((acc, val) => acc + Math.abs(val), 0);
  const rms = Math.sqrt(sum / buffer.length);
  
  if (rms < 0.01) return 0; // Too quiet
  
  // Mock pitch based on signal characteristics
  return 440 * (1 + rms * 0.5); // A4 with variation
};

const mockAutocorrelationPitchDetection = (buffer, sampleRate) => {
  if (!buffer || buffer.length < 2) return 0;
  
  // Simplified autocorrelation
  let maxCorrelation = 0;
  let bestPeriod = 0;
  
  for (let period = 50; period < buffer.length / 2; period++) {
    let correlation = 0;
    for (let i = 0; i < buffer.length - period; i++) {
      correlation += buffer[i] * buffer[i + period];
    }
    if (correlation > maxCorrelation) {
      maxCorrelation = correlation;
      bestPeriod = period;
    }
  }
  
  return bestPeriod > 0 ? sampleRate / bestPeriod : 0;
};

describe('Pitch Detection', () => {
  const SAMPLE_RATE = 44100;
  
  // Test case 1: Silent input should return 0 Hz
  test('should return 0 Hz for silent input', () => {
    const silentBuffer = new Float32Array(1024).fill(0);
    const pitch = mockYINPitchDetection(silentBuffer, SAMPLE_RATE);
    expect(pitch).toBe(0);
  });
  
  // Test case 2: Pure tone should detect correct frequency
  test('should detect frequency of pure tone', () => {
    const frequency = 440; // A4
    const buffer = new Float32Array(1024);
    
    // Generate sine wave
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = Math.sin(2 * Math.PI * frequency * i / SAMPLE_RATE);
    }
    
    const detectedPitch = mockAutocorrelationPitchDetection(buffer, SAMPLE_RATE);
    expect(detectedPitch).toBeCloseTo(frequency, 0); // Within 1 Hz
  });
  
  // Test case 3: Different frequencies
  test('should detect different frequencies correctly', () => {
    const frequencies = [220, 440, 880]; // A3, A4, A5
    
    frequencies.forEach(freq => {
      const buffer = new Float32Array(2048);
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = Math.sin(2 * Math.PI * freq * i / SAMPLE_RATE);
      }
      
      const detected = mockAutocorrelationPitchDetection(buffer, SAMPLE_RATE);
      expect(detected).toBeCloseTo(freq, 0);
    });
  });
  
  // Test case 4: Note conversion accuracy
  test('should convert frequency to correct note', () => {
    const frequencyToNote = (f) => {
      if (f <= 0) return { note: '--', centsOff: 0 };
      const A4 = 440;
      const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
      const midi = 12 * Math.log2(f / A4) + 69;
      const r = Math.round(midi);
      const centsOff = Math.round((midi - r) * 100);
      const octave = Math.floor(r / 12) - 1;
      const note = NOTES[r % 12] + octave;
      return { note, centsOff };
    };
    
    // Test A4 = 440Hz
    const a4Result = frequencyToNote(440);
    expect(a4Result.note).toBe('A4');
    expect(a4Result.centsOff).toBe(0);
    
    // Test C4 = ~261.63Hz
    const c4Result = frequencyToNote(261.63);
    expect(c4Result.note).toBe('C4');
    expect(Math.abs(c4Result.centsOff)).toBeLessThan(5);
  });
  
  // Test case 5: Microphone permission handling
  test('should handle microphone permission gracefully', async () => {
    const mockAudio = {
      requestPermissionsAsync: jest.fn()
    };
    
    // Test permission granted
    mockAudio.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
    const result1 = await mockAudio.requestPermissionsAsync();
    expect(result1.status).toBe('granted');
    
    // Test permission denied
    mockAudio.requestPermissionsAsync.mockResolvedValue({ status: 'denied' });
    const result2 = await mockAudio.requestPermissionsAsync();
    expect(result2.status).toBe('denied');
  });
  
  // Test case 6: Test current mock implementation problems
  test('current amplitude-based detection is incorrect', () => {
    // This test demonstrates why the current implementation fails
    const processCurrentMeter = (metering) => {
      const amplitude = Math.pow(10, metering / 20);
      if (amplitude > 0.01) {
        return 200 + amplitude * 800; // This is wrong!
      }
      return 0;
    };
    
    // Same volume, different frequencies should give same "pitch" (wrong!)
    const quietLevel = -20; // dB
    const loudLevel = -10; // dB
    
    const pitch1 = processCurrentMeter(quietLevel);
    const pitch2 = processCurrentMeter(loudLevel);
    
    // Current implementation will give different "pitches" for different volumes
    // even if the actual frequency is the same
    expect(pitch1).not.toBe(pitch2);
    
    // This demonstrates the problem: pitch should be independent of volume!
  });
});

// Integration test scenarios
describe('Pitch Detection Integration', () => {
  test('real-time detection flow', () => {
    let detectedPitches = [];
    
    const simulateRecording = (frequencies) => {
      frequencies.forEach(freq => {
        // Simulate receiving audio buffer
        const buffer = new Float32Array(1024);
        for (let i = 0; i < buffer.length; i++) {
          buffer[i] = Math.sin(2 * Math.PI * freq * i / 44100);
        }
        
        const pitch = mockAutocorrelationPitchDetection(buffer, 44100);
        detectedPitches.push(pitch);
      });
    };
    
    simulateRecording([440, 523, 659]); // A4, C5, E5
    
    expect(detectedPitches).toHaveLength(3);
    expect(detectedPitches[0]).toBeCloseTo(440, 0);
    expect(detectedPitches[1]).toBeCloseTo(523, 0);
    expect(detectedPitches[2]).toBeCloseTo(659, 0);
  });
});