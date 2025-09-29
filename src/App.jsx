/**
 * PitchKaraoke - Web-based singing practice app with real-time pitch detection
 */

import React, { useState, useEffect, useRef } from 'react';
import PitchDetector from './components/PitchDetector';
import MusicImporter from './components/MusicImporter';
import './App.css';

export default function App() {
  const [audioFile, setAudioFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [pitchData, setPitchData] = useState([]);
  const [currentPitch, setCurrentPitch] = useState(null);
  const [status, setStatus] = useState('Ready to practice singing!');

  /**
   * Handle audio file import
   */
  const handleAudioImport = (file) => {
    setAudioFile(file);
    setStatus(`Loaded: ${file.name}`);
    console.log('✅ Audio file imported:', file.name);
  };

  /**
   * Handle pitch detection data
   */
  const handlePitchData = (pitch, note) => {
    setCurrentPitch({ pitch, note, timestamp: Date.now() });
    setPitchData(prev => [...prev.slice(-100), { pitch, note, timestamp: Date.now() }]);
  };

  /**
   * Toggle recording state
   */
  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setStatus('Recording and analyzing your voice...');
      setPitchData([]);
    } else {
      setStatus('Recording stopped. Import a song to practice!');
    }
  };

  /**
   * Clear current session
   */
  const clearSession = () => {
    setAudioFile(null);
    setPitchData([]);
    setCurrentPitch(null);
    setStatus('Session cleared. Ready for new practice!');
    setIsRecording(false);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎤 PitchKaraoke</h1>
        <p>Practice singing with real-time pitch detection</p>
      </header>

      <main className="pitch-container">
        {/* Status Display */}
        <div className={`status-message ${
          status.includes('Error') ? 'status-error' :
          status.includes('Recording') ? 'status-info' :
          'status-success'
        }`}>
          {status}
        </div>

        {/* Music Import Section */}
        <MusicImporter
          onAudioImport={handleAudioImport}
          audioFile={audioFile}
        />

        {/* Audio Controls */}
        <div className="audio-controls">
          <button
            onClick={toggleRecording}
            className={isRecording ? 'recording' : ''}
          >
            {isRecording ? '🛑 Stop Recording' : '🎤 Start Recording'}
          </button>
          <button onClick={clearSession}>
            🔄 Clear Session
          </button>
        </div>

        {/* Current Pitch Display */}
        {currentPitch && (
          <div className="pitch-display">
            <div className="pitch-value">
              {currentPitch.pitch ? `${currentPitch.pitch.toFixed(1)} Hz` : 'No pitch detected'}
            </div>
            <div className="pitch-note">
              {currentPitch.note || 'Silent'}
            </div>
          </div>
        )}

        {/* Pitch Detection Component */}
        <PitchDetector
          isActive={isRecording}
          onPitchDetected={handlePitchData}
          audioFile={audioFile}
        />

        {/* Pitch History Visualization */}
        {pitchData.length > 0 && (
          <div className="pitch-history">
            <h3>Pitch History</h3>
            <div className="pitch-graph">
              {pitchData.slice(-20).map((data, index) => (
                <div
                  key={index}
                  className="pitch-bar"
                  style={{
                    height: `${Math.min((data.pitch || 0) / 10, 100)}px`,
                    backgroundColor: data.pitch ? '#4CAF50' : '#666'
                  }}
                  title={`${data.note || 'Silent'} - ${(data.pitch || 0).toFixed(1)}Hz`}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Web-only version • No mobile dependencies • Real-time pitch detection</p>
      </footer>
    </div>
  );
}