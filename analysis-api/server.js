const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { detectPitch } = require('node-pitch-detection');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

/**
 * Enhanced pitch detection using autocorrelation
 */
class PitchAnalyzer {
  constructor() {
    this.sampleRate = 44100;
    this.frameSize = 4096;
    this.hopSize = 1024;
  }

  /**
   * Convert MP3 to WAV for analysis
   */
  async convertToWav(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat('wav')
        .audioFrequency(this.sampleRate)
        .audioChannels(1) // Mono
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .save(outputPath);
    });
  }

  /**
   * Extract audio data from WAV file
   */
  async extractAudioData(wavPath) {
    const buffer = await fs.readFile(wavPath);
    
    // Skip WAV header (44 bytes) and convert to float32 array
    const dataStart = 44;
    const audioBuffer = buffer.slice(dataStart);
    const samples = new Float32Array(audioBuffer.length / 2);
    
    // Convert 16-bit PCM to float32 (-1 to 1 range)
    for (let i = 0; i < samples.length; i++) {
      const sample = audioBuffer.readInt16LE(i * 2);
      samples[i] = sample / 32768.0;
    }
    
    return samples;
  }

  /**
   * Detect pitch using autocorrelation
   */
  detectPitch(audioData, sampleRate) {
    const bufferSize = audioData.length;
    
    // Apply high-pass filter
    const filteredData = this.applyHighPassFilter(audioData, sampleRate, 80);
    
    // Apply window function
    const windowedData = this.applyHannWindow(filteredData);
    
    // Calculate RMS for volume detection
    const rms = Math.sqrt(windowedData.reduce((sum, val) => sum + val * val, 0) / bufferSize);
    if (rms < 0.001) return 0; // Too quiet
    
    // Normalize
    const normalizedData = windowedData.map(val => val / rms);
    
    // Autocorrelation
    const autocorrelation = new Float32Array(bufferSize);
    for (let lag = 0; lag < bufferSize; lag++) {
      let sum = 0;
      let count = 0;
      for (let i = 0; i < bufferSize - lag; i++) {
        sum += normalizedData[i] * normalizedData[i + lag];
        count++;
      }
      autocorrelation[lag] = count > 0 ? sum / count : 0;
    }
    
    // Find best period
    const minPeriod = Math.floor(sampleRate / 1000);
    const maxPeriod = Math.floor(sampleRate / 80);
    const threshold = autocorrelation[0] * 0.3;
    
    let maxVal = 0;
    let bestPeriod = 0;
    
    for (let period = minPeriod; period < Math.min(maxPeriod, bufferSize / 2); period++) {
      if (autocorrelation[period] > threshold && autocorrelation[period] > maxVal) {
        const prev = autocorrelation[period - 1] || 0;
        const next = autocorrelation[period + 1] || 0;
        
        if (autocorrelation[period] >= prev && autocorrelation[period] >= next) {
          maxVal = autocorrelation[period];
          bestPeriod = period;
        }
      }
    }
    
    if (bestPeriod === 0 || maxVal < threshold) return 0;
    
    // Parabolic interpolation
    const y1 = autocorrelation[bestPeriod - 1] || 0;
    const y2 = autocorrelation[bestPeriod];
    const y3 = autocorrelation[bestPeriod + 1] || 0;
    
    const a = (y1 - 2 * y2 + y3) / 2;
    const b = (y3 - y1) / 2;
    
    let adjustedPeriod = bestPeriod;
    if (Math.abs(a) > 0.0001) {
      const offset = -b / (2 * a);
      if (Math.abs(offset) < 1) {
        adjustedPeriod = bestPeriod + offset;
      }
    }
    
    return sampleRate / adjustedPeriod;
  }

  /**
   * Apply high-pass filter
   */
  applyHighPassFilter(audioData, sampleRate, cutoffFreq) {
    const filtered = new Float32Array(audioData.length);
    const RC = 1 / (2 * Math.PI * cutoffFreq);
    const dt = 1 / sampleRate;
    const alpha = RC / (RC + dt);
    
    filtered[0] = audioData[0];
    for (let i = 1; i < audioData.length; i++) {
      filtered[i] = alpha * (filtered[i-1] + audioData[i] - audioData[i-1]);
    }
    
    return filtered;
  }

  /**
   * Apply Hann window
   */
  applyHannWindow(audioData) {
    const windowed = new Float32Array(audioData.length);
    const N = audioData.length;
    
    for (let i = 0; i < N; i++) {
      const window = 0.5 * (1 - Math.cos(2 * Math.PI * i / (N - 1)));
      windowed[i] = audioData[i] * window;
    }
    
    return windowed;
  }

  /**
   * Convert frequency to note
   */
  frequencyToNote(frequency) {
    if (frequency <= 0 || frequency < 80 || frequency > 2000) {
      return { note: '--', octave: 0, cents: 0, frequency: 0 };
    }
    
    const A4 = 440.0;
    const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    const semitones = 12 * Math.log2(frequency / A4);
    const midiNote = semitones + 69;
    const roundedMidi = Math.round(midiNote);
    const cents = Math.round((midiNote - roundedMidi) * 100);
    
    if (roundedMidi < 12 || roundedMidi > 127) {
      return { note: '--', octave: 0, cents: 0, frequency: frequency };
    }
    
    const octave = Math.floor(roundedMidi / 12) - 1;
    const noteIndex = roundedMidi % 12;
    
    return {
      note: NOTES[noteIndex],
      octave: octave,
      cents: cents,
      frequency: frequency
    };
  }

  /**
   * Analyze entire audio file
   */
  async analyzeAudioFile(audioData, sampleRate) {
    const frameTime = this.hopSize / sampleRate;
    const pitchData = [];
    
    console.log(`Analyzing audio: ${audioData.length} samples, ${(audioData.length / sampleRate).toFixed(2)}s`);
    
    for (let offset = 0; offset < audioData.length - this.frameSize; offset += this.hopSize) {
      const frame = audioData.slice(offset, offset + this.frameSize);
      const timeStamp = offset / sampleRate;
      
      const frequency = this.detectPitch(frame, sampleRate);
      const noteInfo = this.frequencyToNote(frequency);
      
      // Calculate RMS for volume
      const rms = Math.sqrt(frame.reduce((sum, val) => sum + val * val, 0) / frame.length);
      
      pitchData.push({
        time: timeStamp,
        frequency: frequency,
        note: noteInfo.note,
        octave: noteInfo.octave,
        cents: noteInfo.cents,
        rms: rms,
        isVocal: frequency > 80 && frequency < 2000 && rms > 0.001
      });
      
      // Progress logging
      if (Math.floor(timeStamp * 10) % 50 === 0 && offset % (this.hopSize * 10) === 0) {
        console.log(`Analysis progress: ${(timeStamp / (audioData.length / sampleRate) * 100).toFixed(1)}%`);
      }
    }
    
    return pitchData;
  }

  /**
   * Convert pitch data to timeline format
   */
  convertToTimeline(pitchData, songTitle, artist = 'Unknown Artist') {
    const timeline = [];
    let currentNote = null;
    let noteStart = 0;
    let currentFrequency = 0;
    
    for (let i = 0; i < pitchData.length; i++) {
      const data = pitchData[i];
      
      if (data.isVocal) {
        const noteString = `${data.note}${data.octave}`;
        
        if (!currentNote || currentNote !== noteString) {
          // End previous note
          if (currentNote && currentNote !== '--') {
            const duration = data.time - noteStart;
            if (duration > 0.1) {
              timeline.push({
                startTime: noteStart,
                endTime: data.time,
                duration: duration,
                note: currentNote,
                frequency: currentFrequency,
                id: `segment_${timeline.length}`
              });
            }
          }
          
          // Start new note
          currentNote = noteString;
          noteStart = data.time;
          currentFrequency = data.frequency;
        }
      } else {
        // End current note on silence
        if (currentNote && currentNote !== '--') {
          const duration = data.time - noteStart;
          if (duration > 0.1) {
            timeline.push({
              startTime: noteStart,
              endTime: data.time,
              duration: duration,
              note: currentNote,
              frequency: currentFrequency,
              id: `segment_${timeline.length}`
            });
          }
        }
        currentNote = '--';
        noteStart = data.time;
        currentFrequency = 0;
      }
    }
    
    // Add final note
    if (currentNote && currentNote !== '--') {
      const totalDuration = pitchData[pitchData.length - 1]?.time || 0;
      const duration = totalDuration - noteStart;
      if (duration > 0.1) {
        timeline.push({
          startTime: noteStart,
          endTime: totalDuration,
          duration: duration,
          note: currentNote,
          frequency: currentFrequency,
          id: `segment_${timeline.length}`
        });
      }
    }
    
    const totalDuration = pitchData[pitchData.length - 1]?.time || 0;
    
    return {
      songId: `${songTitle.toLowerCase().replace(/\s+/g, '-')}_${Date.now()}`,
      title: songTitle,
      artist: artist,
      filePath: 'analyzed_via_api',
      totalDuration: totalDuration,
      timeline: timeline,
      metadata: {
        version: '1.0',
        analyzedAt: new Date().toISOString(),
        sampleRate: this.sampleRate,
        segmentCount: timeline.length,
        analysisMethod: 'api_autocorrelation'
      }
    };
  }
}

// Initialize analyzer
const analyzer = new PitchAnalyzer();

// API Routes

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Pitch Analysis API is running',
    timestamp: new Date().toISOString() 
  });
});

/**
 * Analyze audio file endpoint
 */
app.post('/analyze', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log(`Processing file: ${req.file.originalname}`);
    
    const { songTitle, artist } = req.body;
    const inputPath = req.file.path;
    const wavPath = path.join(path.dirname(inputPath), `${path.basename(inputPath, path.extname(inputPath))}.wav`);
    
    try {
      // Convert to WAV
      console.log('Converting to WAV...');
      await analyzer.convertToWav(inputPath, wavPath);
      
      // Extract audio data
      console.log('Extracting audio data...');
      const audioData = await analyzer.extractAudioData(wavPath);
      
      // Analyze pitch
      console.log('Analyzing pitch...');
      const pitchData = await analyzer.analyzeAudioFile(audioData, analyzer.sampleRate);
      
      // Convert to timeline
      console.log('Converting to timeline format...');
      const timeline = analyzer.convertToTimeline(
        pitchData, 
        songTitle || req.file.originalname.replace('.mp3', ''),
        artist || 'Unknown Artist'
      );
      
      console.log(`Analysis complete: ${timeline.timeline.length} segments, ${timeline.totalDuration.toFixed(2)}s`);
      
      // Cleanup files
      await fs.remove(inputPath);
      await fs.remove(wavPath);
      
      res.json({
        success: true,
        analysis: timeline,
        stats: {
          totalSegments: timeline.timeline.length,
          duration: timeline.totalDuration,
          analyzedAt: new Date().toISOString()
        }
      });
      
    } catch (analysisError) {
      console.error('Analysis error:', analysisError);
      
      // Cleanup files on error
      await fs.remove(inputPath).catch(() => {});
      await fs.remove(wavPath).catch(() => {});
      
      res.status(500).json({ 
        error: 'Analysis failed', 
        details: analysisError.message 
      });
    }
    
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      details: error.message 
    });
  }
});

/**
 * Get analysis status endpoint
 */
app.get('/status', (req, res) => {
  res.json({
    server: 'Pitch Analysis API',
    version: '1.0.0',
    capabilities: [
      'MP3 to WAV conversion',
      'Autocorrelation pitch detection', 
      'Timeline generation',
      'Vietnamese song optimization'
    ],
    supportedFormats: ['mp3', 'wav', 'm4a'],
    maxFileSize: '50MB'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
    }
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎵 Pitch Analysis API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🎤 Analysis endpoint: POST http://localhost:${PORT}/analyze`);
});

module.exports = app;