// Real pitch detection algorithms
// This replaces the mock amplitude-based detection

/**
 * YIN pitch detection algorithm
 * More accurate than autocorrelation for voiced signals
 */
export function yinPitchDetection(buffer, sampleRate, threshold = 0.15) {
  const bufferSize = buffer.length;
  const halfSize = Math.floor(bufferSize / 2);
  const yinBuffer = new Float32Array(halfSize);
  
  // Step 1: Calculate difference function
  for (let tau = 0; tau < halfSize; tau++) {
    let sum = 0;
    for (let i = 0; i < halfSize; i++) {
      const delta = buffer[i] - buffer[i + tau];
      sum += delta * delta;
    }
    yinBuffer[tau] = sum;
  }
  
  // Step 2: Calculate cumulative mean normalized difference function
  yinBuffer[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau < halfSize; tau++) {
    runningSum += yinBuffer[tau];
    yinBuffer[tau] *= tau / runningSum;
  }
  
  // Step 3: Search for absolute minimum
  let tauEstimate = -1;
  for (let tau = 2; tau < halfSize; tau++) {
    if (yinBuffer[tau] < threshold) {
      while (tau + 1 < halfSize && yinBuffer[tau + 1] < yinBuffer[tau]) {
        tau++;
      }
      tauEstimate = tau;
      break;
    }
  }
  
  if (tauEstimate === -1) {
    // No clear pitch found
    return 0;
  }
  
  // Step 4: Parabolic interpolation for better accuracy
  let betterTau = tauEstimate;
  if (tauEstimate > 0 && tauEstimate < halfSize - 1) {
    const x0 = yinBuffer[tauEstimate - 1];
    const x1 = yinBuffer[tauEstimate];
    const x2 = yinBuffer[tauEstimate + 1];
    
    const a = (x0 - 2 * x1 + x2) / 2;
    const b = (x2 - x0) / 2;
    
    if (a !== 0) {
      betterTau = tauEstimate - b / (2 * a);
    }
  }
  
  return sampleRate / betterTau;
}

/**
 * Autocorrelation pitch detection
 * Simpler but less accurate than YIN
 */
export function autocorrelationPitchDetection(buffer, sampleRate, minFreq = 80, maxFreq = 2000) {
  const bufferSize = buffer.length;
  const minPeriod = Math.floor(sampleRate / maxFreq);
  const maxPeriod = Math.floor(sampleRate / minFreq);
  
  let maxCorrelation = 0;
  let bestPeriod = 0;
  
  // Calculate RMS for noise threshold
  let rms = 0;
  for (let i = 0; i < bufferSize; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / bufferSize);
  
  // If signal is too weak, return 0
  if (rms < 0.01) {
    return 0;
  }
  
  // Find best correlation
  for (let period = minPeriod; period < Math.min(maxPeriod, bufferSize / 2); period++) {
    let correlation = 0;
    let normalizer = 0;
    
    for (let i = 0; i < bufferSize - period; i++) {
      correlation += buffer[i] * buffer[i + period];
      normalizer += buffer[i] * buffer[i];
    }
    
    if (normalizer > 0) {
      correlation /= normalizer;
    }
    
    if (correlation > maxCorrelation) {
      maxCorrelation = correlation;
      bestPeriod = period;
    }
  }
  
  // Require minimum correlation strength
  if (maxCorrelation < 0.3) {
    return 0;
  }
  
  return bestPeriod > 0 ? sampleRate / bestPeriod : 0;
}

/**
 * FFT-based pitch detection using harmonic analysis
 */
export function fftPitchDetection(buffer, sampleRate) {
  // This is a simplified version - in practice you'd use a proper FFT library
  const bufferSize = buffer.length;
  const nyquist = sampleRate / 2;
  
  // Simple magnitude spectrum calculation (simplified)
  const spectrum = new Float32Array(bufferSize / 2);
  for (let k = 0; k < spectrum.length; k++) {
    let real = 0, imag = 0;
    for (let n = 0; n < bufferSize; n++) {
      const angle = -2 * Math.PI * k * n / bufferSize;
      real += buffer[n] * Math.cos(angle);
      imag += buffer[n] * Math.sin(angle);
    }
    spectrum[k] = Math.sqrt(real * real + imag * imag);
  }
  
  // Find peak frequency
  let maxMagnitude = 0;
  let peakIndex = 0;
  
  // Look for peaks in reasonable vocal range (80-2000 Hz)
  const minIndex = Math.floor(80 * bufferSize / sampleRate);
  const maxIndex = Math.floor(2000 * bufferSize / sampleRate);
  
  for (let i = minIndex; i < maxIndex && i < spectrum.length; i++) {
    if (spectrum[i] > maxMagnitude) {
      maxMagnitude = spectrum[i];
      peakIndex = i;
    }
  }
  
  if (maxMagnitude < 0.01) {
    return 0; // Too weak signal
  }
  
  return peakIndex * sampleRate / bufferSize;
}

/**
 * Enhanced pitch detection that combines multiple methods
 */
export function enhancedPitchDetection(buffer, sampleRate) {
  if (!buffer || buffer.length < 512) {
    return 0;
  }
  
  // Try YIN first (most accurate for voiced signals)
  const yinResult = yinPitchDetection(buffer, sampleRate);
  if (yinResult > 0) {
    return yinResult;
  }
  
  // Fall back to autocorrelation
  const autocorrResult = autocorrelationPitchDetection(buffer, sampleRate);
  if (autocorrResult > 0) {
    return autocorrResult;
  }
  
  // Last resort: FFT
  return fftPitchDetection(buffer, sampleRate);
}

/**
 * Convert audio buffer from various formats to Float32Array
 */
export function normalizeAudioBuffer(audioData, format = 'int16') {
  let buffer;
  
  if (audioData instanceof Float32Array) {
    return audioData;
  }
  
  if (format === 'int16') {
    // Convert 16-bit PCM to float (-1 to 1)
    buffer = new Float32Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      buffer[i] = audioData[i] / 32768.0;
    }
  } else if (format === 'uint8') {
    // Convert 8-bit PCM to float
    buffer = new Float32Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      buffer[i] = (audioData[i] - 128) / 128.0;
    }
  } else {
    // Assume already normalized
    buffer = new Float32Array(audioData);
  }
  
  return buffer;
}

/**
 * Apply window function to reduce spectral leakage
 */
export function applyHammingWindow(buffer) {
  const windowed = new Float32Array(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    const w = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (buffer.length - 1));
    windowed[i] = buffer[i] * w;
  }
  return windowed;
}