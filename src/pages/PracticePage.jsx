/**
 * PracticePage - Main practice interface with audio controls and pitch visualization
 */

import React from 'react';
import AudioImportView from '../views/AudioImportView.jsx';
import AudioControlsView from '../views/AudioControlsView.jsx';
import PitchVisualizationView from '../views/PitchVisualizationView.jsx';

const PracticePage = ({
  appState,
  controllerRef,
  handleAudioImport,
  handleAudioRemove,
  handlePlay,
  handlePause,
  handleStop,
  handleSeek,
  handleVolumeChange,
  handleStartRecording,
  handleStopRecording,
  handleClearSession
}) => {
  return (
    <div className="practice-page">
      <div className="practice-container">
        <div className="practice-header">
          <h1>🎵 Practice Mode</h1>
          <p>Upload a song and start practicing with real-time pitch feedback</p>
        </div>

        {/* Status Display */}
        <div className={`status-message ${
          appState.error ? 'status-error' :
          appState.isRecording ? 'status-info' :
          'status-success'
        }`}>
          {appState.status}
        </div>

        {/* Audio Import Section */}
        <div className="section-card">
          <AudioImportView
            audioFile={appState.hasAudio ? { name: appState.audioInfo?.name } : null}
            onAudioImport={handleAudioImport}
            onAudioRemove={handleAudioRemove}
            audioInfo={appState.audioInfo}
            isLoading={appState.isLoading}
          />
        </div>

        {/* Audio Controls */}
        <div className="section-card">
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
        </div>

        {/* Pitch Visualization */}
        <div className="section-card">
          <PitchVisualizationView
            currentPitch={appState.currentPitch}
            pitchHistory={appState.pitchHistory}
            isRecording={appState.isRecording}
            sessionStats={appState.sessionStats}
            pitchComparison={appState.pitchComparison}
            songAnalysis={appState.songAnalysis}
            currentTime={appState.currentTime}
            duration={appState.duration}
            isPlaying={appState.isPlaying}
          />
        </div>

        {/* Practice Tips */}
        <div className="tips-section">
          <h3>💡 Practice Tips</h3>
          <div className="tips-grid">
            <div className="tip-card">
              <span className="tip-icon">🎤</span>
              <h4>Microphone Setup</h4>
              <p>Make sure your microphone is close to your mouth for best pitch detection</p>
            </div>
            <div className="tip-card">
              <span className="tip-icon">🔊</span>
              <h4>Audio Quality</h4>
              <p>Use headphones to prevent feedback and get clearer audio separation</p>
            </div>
            <div className="tip-card">
              <span className="tip-icon">🎯</span>
              <h4>Pitch Accuracy</h4>
              <p>Watch the pitch visualization to see how close you are to the target notes</p>
            </div>
            <div className="tip-card">
              <span className="tip-icon">⏱️</span>
              <h4>Practice Sessions</h4>
              <p>Start with short sessions and gradually increase practice time</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .practice-page {
          min-height: calc(100vh - 80px);
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
          padding: 20px;
        }

        .practice-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .practice-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .practice-header h1 {
          color: #4CAF50;
          font-size: 2.5rem;
          margin-bottom: 10px;
        }

        .practice-header p {
          color: #ccc;
          font-size: 1.1rem;
        }

        .status-message {
          padding: 15px 20px;
          border-radius: 8px;
          text-align: center;
          margin-bottom: 30px;
          font-weight: 500;
        }

        .status-message.status-error {
          background: rgba(244, 67, 54, 0.1);
          border: 1px solid #f44336;
          color: #f44336;
        }

        .status-message.status-info {
          background: rgba(33, 150, 243, 0.1);
          border: 1px solid #2196F3;
          color: #2196F3;
        }

        .status-message.status-success {
          background: rgba(76, 175, 80, 0.1);
          border: 1px solid #4CAF50;
          color: #4CAF50;
        }

        .section-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          margin-bottom: 25px;
          overflow: hidden;
          backdrop-filter: blur(10px);
        }

        .tips-section {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 30px;
          margin-top: 30px;
          backdrop-filter: blur(10px);
        }

        .tips-section h3 {
          color: #4CAF50;
          text-align: center;
          margin-bottom: 25px;
          font-size: 1.6rem;
        }

        .tips-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .tip-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 20px;
          text-align: center;
          transition: all 0.3s ease;
        }

        .tip-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(76, 175, 80, 0.15);
          border-color: rgba(76, 175, 80, 0.3);
        }

        .tip-icon {
          font-size: 2.5rem;
          display: block;
          margin-bottom: 15px;
        }

        .tip-card h4 {
          color: #fff;
          font-size: 1.2rem;
          margin-bottom: 10px;
        }

        .tip-card p {
          color: #ccc;
          line-height: 1.5;
          margin: 0;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .practice-page {
            padding: 15px;
          }

          .practice-header h1 {
            font-size: 2rem;
          }

          .practice-header p {
            font-size: 1rem;
          }

          .tips-grid {
            grid-template-columns: 1fr;
          }

          .tips-section {
            padding: 20px;
          }
        }

        @media (max-width: 480px) {
          .practice-page {
            padding: 10px;
          }

          .practice-header h1 {
            font-size: 1.8rem;
          }

          .status-message {
            padding: 12px 15px;
            font-size: 0.9rem;
          }

          .tip-card {
            padding: 15px;
          }

          .tip-icon {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default PracticePage;