// Web-specific audio detection using Web Audio API
// This provides real microphone access on web browsers

export class WebAudioPitchDetector {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.dataArray = null;
    this.isActive = false;
    this.onPitchDetected = null;
  }

  async start(callback) {
    if (typeof window === 'undefined' || !navigator.mediaDevices) {
      throw new Error('Web Audio API not available');
    }

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100
        } 
      });

      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.microphone = this.audioContext.createMediaStreamSource(stream);

      // Configure analyser
      this.analyser.fftSize = 4096;
      this.analyser.smoothingTimeConstant = 0.8;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      // Connect microphone to analyser
      this.microphone.connect(this.analyser);
      
      this.onPitchDetected = callback;
      this.isActive = true;
      
      // Start detection loop
      this.detectPitch();
      
      return true;
    } catch (error) {
      console.error('Failed to start web audio detection:', error);
      throw error;
    }
  }

  detectPitch() {
    if (!this.isActive) return;

    // Get frequency data
    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Calculate volume (RMS)
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i] * this.dataArray[i];
    }
    const rms = Math.sqrt(sum / this.dataArray.length);
    const volume = rms / 255.0;

    // Find peak frequency
    let maxIndex = 0;
    let maxValue = 0;
    
    // Look for peaks in vocal range (80-2000 Hz)
    const sampleRate = this.audioContext.sampleRate;
    const minIndex = Math.floor(80 * this.dataArray.length / (sampleRate / 2));
    const maxIndex_limit = Math.floor(2000 * this.dataArray.length / (sampleRate / 2));
    
    for (let i = minIndex; i < Math.min(maxIndex_limit, this.dataArray.length); i++) {
      if (this.dataArray[i] > maxValue) {
        maxValue = this.dataArray[i];
        maxIndex = i;
      }
    }

    // Convert index to frequency
    const frequency = maxIndex * (sampleRate / 2) / this.dataArray.length;
    
    // Only report if there's sufficient signal and reasonable frequency
    const isVoiced = volume > 0.01 && maxValue > 50 && frequency > 80 && frequency < 2000;
    
    if (this.onPitchDetected) {
      this.onPitchDetected({
        frequency: isVoiced ? frequency : 0,
        volume: volume,
        isVoiced: isVoiced,
        rawData: { maxValue, maxIndex, rms }
      });
    }

    // Continue detection
    requestAnimationFrame(() => this.detectPitch());
  }

  stop() {
    this.isActive = false;
    
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.analyser = null;
    this.dataArray = null;
    this.onPitchDetected = null;
  }
}

// Simple test function to check if microphone is working
export async function testMicrophoneAccess() {
  if (typeof window === 'undefined' || !navigator.mediaDevices) {
    return { success: false, error: 'Web Audio API not available' };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Test for a few seconds
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);
    
    analyser.fftSize = 256;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    return new Promise((resolve) => {
      let sampleCount = 0;
      let totalVolume = 0;
      
      const testInterval = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avgVolume = sum / dataArray.length;
        totalVolume += avgVolume;
        sampleCount++;
        
        if (sampleCount >= 10) { // Test for ~1 second
          clearInterval(testInterval);
          
          // Cleanup
          microphone.disconnect();
          audioContext.close();
          stream.getTracks().forEach(track => track.stop());
          
          const avgOverall = totalVolume / sampleCount;
          resolve({
            success: true,
            averageVolume: avgOverall,
            isWorking: avgOverall > 1, // If we detect any audio activity
            message: avgOverall > 1 ? 'Microphone is working!' : 'Microphone access granted but no audio detected'
          });
        }
      }, 100);
    });
    
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      message: 'Failed to access microphone. Please check browser permissions.'
    };
  }
}