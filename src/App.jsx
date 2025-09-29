/**
 * PitchKaraoke - Web-based singing practice app with MVC architecture
 */

import React, { useState, useEffect, useRef } from 'react';
import { PracticeController } from './controllers/PracticeController.js';
import AudioImportView from './views/AudioImportView.jsx';
import PitchVisualizationView from './views/PitchVisualizationView.jsx';
import AudioControlsView from './views/AudioControlsView.jsx';
import './App.css';

export default function App() {
  // State
  const [appState, setAppState] = useState({
    hasAudio: false,
    isRecording: false,
    isPlaying: false,
    audioInfo: null,
    currentPitch: null,
    pitchHistory: [],
    sessionStats: null,
    status: 'Ready to practice singing!',
    error: null,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    songAnalysis: null,
    isAnalyzing: false,
    pitchComparison: null
  });

  // Controller reference
  const controllerRef = useRef(null);

  /**
   * Initialize controller and setup event listeners
   */
  useEffect(() => {
    const controller = new PracticeController();
    controllerRef.current = controller;

    // Setup event listeners
    setupEventListeners(controller);

    setAppState(prev => ({
      ...prev,
      status: 'Application initialized. Import an audio file to start!'
    }));

    // Cleanup on unmount
    return () => {
      controller.dispose();
    };
  }, []);

  /**
   * Setup event listeners for the controller
   */
  const setupEventListeners = (controller) => {
    // Audio import events
    controller.on('audioImported', (data) => {
      setAppState(prev => ({
        ...prev,
        hasAudio: true,
        audioInfo: data.audioInfo,
        status: `Audio loaded: ${data.audioFile.name}`,
        error: null,
        isLoading: false
      }));
    });

    controller.on('audioRemoved', () => {
      setAppState(prev => ({
        ...prev,
        hasAudio: false,
        audioInfo: null,
        isPlaying: false,
        status: 'Audio removed. Import a new file to continue.',
        currentTime: 0,
        duration: 0
      }));
    });

    // Recording events
    controller.on('recordingStarted', () => {
      setAppState(prev => ({
        ...prev,
        isRecording: true,
        status: 'Recording and analyzing your voice...',
        pitchHistory: [],
        sessionStats: null,
        error: null
      }));
    });

    controller.on('recordingStopped', (data) => {
      setAppState(prev => ({
        ...prev,
        isRecording: false,
        sessionStats: data.stats,
        status: `Recording completed. Duration: ${controller.session.getFormattedDuration()}`
      }));
    });

    // Pitch detection events
    controller.on('pitchDetected', (data) => {
      setAppState(prev => ({
        ...prev,
        currentPitch: data.currentPitch,
        pitchHistory: data.recentHistory,
        pitchComparison: data.pitchComparison
      }));
    });

    // Audio playback events
    controller.on('audioPlaybackStarted', () => {
      setAppState(prev => ({ ...prev, isPlaying: true }));
    });

    controller.on('audioPlaybackPaused', () => {
      setAppState(prev => ({ ...prev, isPlaying: false }));
    });

    controller.on('audioPlaybackStopped', () => {
      setAppState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
    });

    controller.on('audioTimeUpdate', (data) => {
      setAppState(prev => ({
        ...prev,
        currentTime: data.currentTime,
        duration: data.duration
      }));
    });

    controller.on('audioVolumeChanged', (data) => {
      setAppState(prev => ({ ...prev, volume: data.volume }));
    });

    // Session events
    controller.on('sessionCleared', () => {
      setAppState(prev => ({
        ...prev,
        isRecording: false,
        isPlaying: false,
        currentPitch: null,
        pitchHistory: [],
        sessionStats: null,
        status: 'Session cleared. Ready for new practice!',
        currentTime: 0
      }));
    });

    // Song analysis events
    controller.on('songAnalysisStarted', (data) => {
      setAppState(prev => ({
        ...prev,
        isAnalyzing: true,
        status: `Analyzing song for pitch comparison: ${data.fileName}...`
      }));
    });

    controller.on('songAnalysisCompleted', (data) => {
      setAppState(prev => ({
        ...prev,
        isAnalyzing: false,
        songAnalysis: data.analysisInfo,
        status: `Song analyzed! Ready for pitch comparison practice.`
      }));
    });

    controller.on('songAnalysisFailed', (data) => {
      setAppState(prev => ({
        ...prev,
        isAnalyzing: false,
        status: `Song analysis failed: ${data.error}. Playback will work without pitch comparison.`
      }));
    });

    // Error events
    controller.on('error', (errorData) => {
      setAppState(prev => ({
        ...prev,
        error: errorData.message,
        status: `Error: ${errorData.message}`,
        isLoading: false,
        isRecording: false,
        isAnalyzing: false
      }));
      console.error('Application error:', errorData);
    });
  };

  /**
   * Handle audio file import
   */
  const handleAudioImport = async (file) => {
    if (!controllerRef.current) return;

    setAppState(prev => ({ ...prev, isLoading: true, status: 'Loading audio file...' }));

    try {
      await controllerRef.current.importAudio(file);
    } catch (error) {
      setAppState(prev => ({
        ...prev,
        error: error.message,
        status: `Failed to load audio: ${error.message}`,
        isLoading: false
      }));
    }
  };

  /**
   * Handle audio file removal
   */
  const handleAudioRemove = () => {
    if (!controllerRef.current) return;
    controllerRef.current.removeAudio();
  };

  /**
   * Handle recording start
   */
  const handleStartRecording = async () => {
    if (!controllerRef.current) return;

    try {
      await controllerRef.current.startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  /**
   * Handle recording stop
   */
  const handleStopRecording = () => {
    if (!controllerRef.current) return;
    controllerRef.current.stopRecording();
  };

  /**
   * Handle session clear
   */
  const handleClearSession = () => {
    if (!controllerRef.current) return;
    controllerRef.current.clearSession();
  };

  /**
   * Audio playback handlers
   */
  const handlePlay = async () => {
    if (!controllerRef.current) return;
    try {
      await controllerRef.current.playAudio();
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  };

  const handlePause = () => {
    if (!controllerRef.current) return;
    controllerRef.current.pauseAudio();
  };

  const handleStop = () => {
    if (!controllerRef.current) return;
    controllerRef.current.stopAudio();
  };

  const handleSeek = (time) => {
    if (!controllerRef.current) return;
    controllerRef.current.seekAudio(time);
  };

  const handleVolumeChange = (volume) => {
    if (!controllerRef.current) return;
    controllerRef.current.setAudioVolume(volume);
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
          appState.error ? 'status-error' :
          appState.isRecording ? 'status-info' :
          'status-success'
        }`}>
          {appState.status}
        </div>

        {/* Audio Import Section */}
        <AudioImportView
          audioFile={appState.hasAudio ? { name: appState.audioInfo?.name } : null}
          onAudioImport={handleAudioImport}
          onAudioRemove={handleAudioRemove}
          audioInfo={appState.audioInfo}
          isLoading={appState.isLoading}
        />

        {/* Audio Controls */}
        <AudioControlsView
          hasAudio={appState.hasAudio}
          isPlaying={appState.isPlaying}
          isRecording={appState.isRecording}
          currentTime={appState.currentTime}
          duration={appState.duration}
          volume={appState.volume}
          onPlay={handlePlay}
          onPause={handlePause}
          onStop={handleStop}
          onSeek={handleSeek}
          onVolumeChange={handleVolumeChange}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onClearSession={handleClearSession}
        />

        {/* Pitch Visualization */}
        <PitchVisualizationView
          currentPitch={appState.currentPitch}
          pitchHistory={appState.pitchHistory}
          isRecording={appState.isRecording}
          sessionStats={appState.sessionStats}
          pitchComparison={appState.pitchComparison}
          songAnalysis={appState.songAnalysis}
        />
      </main>

      <footer className="app-footer">
        <p>Web-only • MVC Architecture • Real-time pitch detection</p>
      </footer>
    </div>
  );
}