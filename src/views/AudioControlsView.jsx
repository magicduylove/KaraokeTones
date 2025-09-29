/**
 * AudioControlsView - View component for audio playback controls
 */

import React from 'react';

const AudioControlsView = ({
  hasAudio,
  isPlaying,
  isRecording,
  currentTime = 0,
  duration = 0,
  volume = 1,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onVolumeChange,
  onStartRecording,
  onStopRecording,
  onClearSession
}) => {
  /**
   * Format time for display (mm:ss)
   */
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  /**
   * Get playback progress (0-1)
   */
  const getProgress = () => {
    return duration > 0 ? currentTime / duration : 0;
  };

  /**
   * Handle seek bar change
   */
  const handleSeek = (event) => {
    if (duration > 0 && onSeek) {
      const newTime = (event.target.value / 100) * duration;
      onSeek(newTime);
    }
  };

  /**
   * Handle volume change
   */
  const handleVolumeChange = (event) => {
    if (onVolumeChange) {
      onVolumeChange(event.target.value / 100);
    }
  };

  return (
    <div className="audio-controls-view">
      {/* Recording Controls */}
      <div className="recording-controls">
        <h3>Practice Controls</h3>
        <div className="control-buttons">
          <button
            onClick={isRecording ? onStopRecording : onStartRecording}
            className={`record-button ${isRecording ? 'recording' : ''}`}
            disabled={!hasAudio && !isRecording}
          >
            {isRecording ? (
              <>
                <span className="icon">🛑</span>
                Stop Recording
              </>
            ) : (
              <>
                <span className="icon">🎤</span>
                Start Recording
              </>
            )}
          </button>

          <button
            onClick={onClearSession}
            className="clear-button"
            disabled={isRecording}
          >
            <span className="icon">🔄</span>
            Clear Session
          </button>
        </div>
      </div>

      {/* Audio Playback Controls */}
      {hasAudio && (
        <div className="playback-controls">
          <h3>Audio Playback</h3>

          {/* Transport Controls */}
          <div className="transport-controls">
            <button
              onClick={isPlaying ? onPause : onPlay}
              className="play-pause-button"
              disabled={isRecording}
            >
              {isPlaying ? (
                <>
                  <span className="icon">⏸️</span>
                  Pause
                </>
              ) : (
                <>
                  <span className="icon">▶️</span>
                  Play
                </>
              )}
            </button>

            <button
              onClick={onStop}
              className="stop-button"
              disabled={isRecording}
            >
              <span className="icon">⏹️</span>
              Stop
            </button>
          </div>

          {/* Progress Bar */}
          <div className="progress-section">
            <div className="time-display">
              <span className="current-time">{formatTime(currentTime)}</span>
              <span className="separator">/</span>
              <span className="total-time">{formatTime(duration)}</span>
            </div>

            <div className="progress-bar-container">
              <input
                type="range"
                min="0"
                max="100"
                value={getProgress() * 100}
                onChange={handleSeek}
                className="progress-bar"
                disabled={isRecording || duration === 0}
              />
            </div>
          </div>

          {/* Volume Control */}
          <div className="volume-control">
            <span className="volume-icon">🔊</span>
            <input
              type="range"
              min="0"
              max="100"
              value={volume * 100}
              onChange={handleVolumeChange}
              className="volume-slider"
            />
            <span className="volume-value">{Math.round(volume * 100)}%</span>
          </div>
        </div>
      )}

      {/* Status Messages */}
      <div className="status-messages">
        {!hasAudio && (
          <div className="status-message info">
            💡 Import an audio file to enable playback controls
          </div>
        )}

        {hasAudio && isRecording && (
          <div className="status-message warning">
            ⚠️ Audio playback is disabled while recording
          </div>
        )}
      </div>

      <style jsx>{`
        .audio-controls-view {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }

        .recording-controls,
        .playback-controls {
          background: #1a1a1a;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .recording-controls h3,
        .playback-controls h3 {
          color: #fff;
          margin-bottom: 15px;
          text-align: center;
        }

        .control-buttons,
        .transport-controls {
          display: flex;
          gap: 15px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .record-button {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          background: #4CAF50;
          color: white;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .record-button.recording {
          background: #f44336;
          animation: pulse 1s infinite;
        }

        .record-button:hover:not(:disabled) {
          background: #45a049;
        }

        .record-button.recording:hover:not(:disabled) {
          background: #d32f2f;
        }

        .clear-button {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          background: #666;
          color: white;
          cursor: pointer;
          font-size: 16px;
          transition: background 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .clear-button:hover:not(:disabled) {
          background: #777;
        }

        .play-pause-button,
        .stop-button {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          background: #2196F3;
          color: white;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.3s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .stop-button {
          background: #666;
        }

        .play-pause-button:hover:not(:disabled) {
          background: #1976D2;
        }

        .stop-button:hover:not(:disabled) {
          background: #777;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        button:disabled:hover {
          background: inherit !important;
        }

        .icon {
          font-size: 1.1em;
        }

        .progress-section {
          margin: 20px 0;
        }

        .time-display {
          text-align: center;
          margin-bottom: 10px;
          color: #ccc;
          font-family: monospace;
        }

        .separator {
          margin: 0 5px;
          color: #666;
        }

        .progress-bar-container {
          margin: 10px 0;
        }

        .progress-bar {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: #333;
          outline: none;
          -webkit-appearance: none;
        }

        .progress-bar::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #4CAF50;
          cursor: pointer;
        }

        .progress-bar::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #4CAF50;
          cursor: pointer;
          border: none;
        }

        .volume-control {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 15px;
        }

        .volume-icon {
          font-size: 1.2em;
        }

        .volume-slider {
          width: 100px;
          height: 4px;
          border-radius: 2px;
          background: #333;
          outline: none;
          -webkit-appearance: none;
        }

        .volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #2196F3;
          cursor: pointer;
        }

        .volume-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #2196F3;
          cursor: pointer;
          border: none;
        }

        .volume-value {
          color: #ccc;
          font-size: 0.9em;
          min-width: 35px;
          text-align: right;
        }

        .status-messages {
          margin-top: 20px;
        }

        .status-message {
          padding: 12px 16px;
          border-radius: 6px;
          text-align: center;
          margin-bottom: 10px;
        }

        .status-message.info {
          background: rgba(33, 150, 243, 0.1);
          border: 1px solid #2196F3;
          color: #2196F3;
        }

        .status-message.warning {
          background: rgba(255, 152, 0, 0.1);
          border: 1px solid #ff9800;
          color: #ff9800;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        @media (max-width: 600px) {
          .audio-controls-view {
            padding: 10px;
          }

          .control-buttons,
          .transport-controls {
            flex-direction: column;
            align-items: center;
          }

          .volume-control {
            flex-direction: column;
            gap: 5px;
          }

          .volume-slider {
            width: 150px;
          }
        }
      `}</style>
    </div>
  );
};

export default AudioControlsView;