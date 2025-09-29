/**
 * PitchVisualizationView - View component for pitch detection visualization
 */

import React from 'react';

const PitchVisualizationView = ({
  currentPitch,
  pitchHistory = [],
  isRecording = false,
  sessionStats = null,
  pitchComparison = null,
  songAnalysis = null
}) => {
  /**
   * Get color based on pitch confidence
   */
  const getPitchColor = (confidence) => {
    if (!confidence || confidence === 0) return '#666';
    if (confidence < 0.3) return '#ff9800';
    if (confidence < 0.7) return '#4CAF50';
    return '#2196F3';
  };

  /**
   * Get pitch bar height based on frequency
   */
  const getPitchBarHeight = (frequency) => {
    if (!frequency) return 2;
    // Normalize frequency to a reasonable height (80Hz to 1000Hz range)
    const minFreq = 80;
    const maxFreq = 1000;
    const normalizedFreq = Math.max(0, Math.min(1, (frequency - minFreq) / (maxFreq - minFreq)));
    return Math.max(2, normalizedFreq * 80); // 2px minimum, 80px maximum
  };

  /**
   * Format frequency for display
   */
  const formatFrequency = (frequency) => {
    if (!frequency) return 'Silent';
    return `${frequency.toFixed(1)} Hz`;
  };

  return (
    <div className="pitch-visualization-view">
      {/* Current Pitch Display */}
      <div className="current-pitch-section">
        <h3>Current Pitch</h3>
        <div className="pitch-display">
          <div className="pitch-value">
            {currentPitch ? formatFrequency(currentPitch.frequency) : 'No signal'}
          </div>
          <div className="pitch-note">
            {currentPitch?.note || 'Silent'}
          </div>
          {currentPitch?.confidence > 0 && (
            <div className="confidence-meter">
              <div className="confidence-label">Confidence</div>
              <div className="confidence-bar">
                <div
                  className="confidence-fill"
                  style={{
                    width: `${(currentPitch.confidence * 100)}%`,
                    backgroundColor: getPitchColor(currentPitch.confidence)
                  }}
                />
              </div>
              <div className="confidence-value">
                {Math.round(currentPitch.confidence * 100)}%
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recording Status */}
      <div className="recording-status">
        {isRecording ? (
          <div className="recording-active">
            <div className="recording-dot"></div>
            <span>Recording and analyzing your voice...</span>
          </div>
        ) : (
          <div className="recording-inactive">
            <span>Click "Start Recording" to begin pitch detection</span>
          </div>
        )}
      </div>

      {/* Pitch History Visualization */}
      {pitchHistory.length > 0 && (
        <div className="pitch-history-section">
          <h3>Pitch History</h3>
          <div className="pitch-graph">
            {pitchHistory.map((pitchData, index) => (
              <div
                key={pitchData.id || index}
                className="pitch-bar"
                style={{
                  height: `${getPitchBarHeight(pitchData.frequency)}px`,
                  backgroundColor: getPitchColor(pitchData.confidence)
                }}
                title={`${pitchData.note || 'Silent'} - ${formatFrequency(pitchData.frequency)}`}
              />
            ))}
          </div>
          <div className="graph-labels">
            <span>Time →</span>
          </div>
        </div>
      )}

      {/* Pitch Comparison Display */}
      {pitchComparison && (
        <div className="pitch-comparison">
          <h3>Pitch Comparison</h3>
          <div className="comparison-display">
            <div className="pitch-comparison-row">
              <div className="pitch-type">Your Pitch:</div>
              <div className="pitch-info">
                <span className="pitch-note">{pitchComparison.userPitch.note || 'Silent'}</span>
                <span className="pitch-freq">
                  {pitchComparison.userPitch.frequency ?
                    `${pitchComparison.userPitch.frequency.toFixed(1)} Hz` : 'No signal'
                  }
                </span>
              </div>
            </div>

            {pitchComparison.songPitch && (
              <div className="pitch-comparison-row">
                <div className="pitch-type">Song Pitch:</div>
                <div className="pitch-info">
                  <span className="pitch-note">{pitchComparison.songPitch.note || 'Silent'}</span>
                  <span className="pitch-freq">
                    {pitchComparison.songPitch.frequency ?
                      `${pitchComparison.songPitch.frequency.toFixed(1)} Hz` : 'No signal'
                    }
                  </span>
                </div>
              </div>
            )}

            <div className="accuracy-display">
              <div className={`accuracy-badge accuracy-${pitchComparison.accuracy}`}>
                <div className="score">{pitchComparison.score}/100</div>
                <div className="message">{pitchComparison.message}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Song Analysis Info */}
      {songAnalysis && (
        <div className="song-analysis-info">
          <h4>Song Analysis</h4>
          <div className="analysis-details">
            <p>✅ Song analyzed: {songAnalysis.validPitches} vocal points detected</p>
            <p>📊 Coverage: {songAnalysis.coverage}% of song has vocal content</p>
            <p>⏱️ Duration: {songAnalysis.duration.toFixed(1)} seconds</p>
          </div>
        </div>
      )}

      {/* Session Statistics */}
      {sessionStats && sessionStats.totalPitches > 0 && (
        <div className="session-stats">
          <h3>Session Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{sessionStats.totalPitches}</div>
              <div className="stat-label">Total Pitches</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{sessionStats.validPitches}</div>
              <div className="stat-label">Valid Pitches</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                {sessionStats.averageFrequency ?
                  `${sessionStats.averageFrequency.toFixed(1)} Hz` : 'N/A'
                }
              </div>
              <div className="stat-label">Avg Frequency</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                {sessionStats.validPitches > 0 ?
                  `${Math.round((sessionStats.validPitches / sessionStats.totalPitches) * 100)}%` : '0%'
                }
              </div>
              <div className="stat-label">Accuracy</div>
            </div>
          </div>

          {/* Pitch Comparison Stats */}
          {sessionStats.hasSongAnalysis && sessionStats.pitchComparison && (
            <div className="comparison-stats">
              <h4>Pitch Comparison Performance</h4>
              <div className="comparison-stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{sessionStats.pitchComparison.averageScore}</div>
                  <div className="stat-label">Average Score</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{sessionStats.pitchComparison.accuracy}%</div>
                  <div className="stat-label">Overall Accuracy</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{sessionStats.pitchComparison.perfectHits}</div>
                  <div className="stat-label">Perfect Hits</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{sessionStats.pitchComparison.goodHits}</div>
                  <div className="stat-label">Good Hits</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .pitch-visualization-view {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .current-pitch-section {
          margin-bottom: 30px;
        }

        .current-pitch-section h3 {
          color: #fff;
          margin-bottom: 15px;
          text-align: center;
        }

        .pitch-display {
          background: #1a1a1a;
          border-radius: 10px;
          padding: 25px;
          text-align: center;
        }

        .pitch-value {
          font-size: 2.5em;
          font-weight: bold;
          color: #4CAF50;
          margin-bottom: 10px;
        }

        .pitch-note {
          font-size: 1.5em;
          color: #ccc;
          margin-bottom: 20px;
        }

        .confidence-meter {
          max-width: 300px;
          margin: 0 auto;
        }

        .confidence-label {
          font-size: 0.9em;
          color: #999;
          margin-bottom: 5px;
        }

        .confidence-bar {
          height: 8px;
          background: #333;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 5px;
        }

        .confidence-fill {
          height: 100%;
          transition: width 0.1s ease;
        }

        .confidence-value {
          font-size: 0.9em;
          color: #ccc;
        }

        .recording-status {
          text-align: center;
          margin: 20px 0;
          padding: 15px;
          border-radius: 8px;
        }

        .recording-active {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: #4CAF50;
          background: rgba(76, 175, 80, 0.1);
          border: 1px solid #4CAF50;
          border-radius: 8px;
          padding: 15px;
        }

        .recording-dot {
          width: 12px;
          height: 12px;
          background: #f44336;
          border-radius: 50%;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .recording-inactive {
          color: #999;
          font-style: italic;
        }

        .pitch-history-section {
          margin: 30px 0;
        }

        .pitch-history-section h3 {
          color: #fff;
          margin-bottom: 15px;
          text-align: center;
        }

        .pitch-graph {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          height: 100px;
          gap: 2px;
          background: #000;
          border-radius: 8px;
          padding: 10px;
          overflow-x: auto;
        }

        .pitch-bar {
          min-width: 6px;
          max-width: 8px;
          flex: 1;
          border-radius: 2px;
          transition: height 0.1s ease;
        }

        .graph-labels {
          text-align: center;
          margin-top: 10px;
          color: #999;
          font-size: 0.9em;
        }

        .session-stats {
          background: #1a1a1a;
          border-radius: 10px;
          padding: 20px;
          margin-top: 20px;
        }

        .session-stats h3 {
          color: #fff;
          margin-bottom: 20px;
          text-align: center;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 15px;
        }

        .pitch-comparison {
          background: #1a1a1a;
          border-radius: 10px;
          padding: 20px;
          margin: 20px 0;
          border: 2px solid #4CAF50;
        }

        .pitch-comparison h3 {
          color: #4CAF50;
          margin-bottom: 15px;
          text-align: center;
        }

        .comparison-display {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .pitch-comparison-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          background: #2a2a2a;
          border-radius: 8px;
        }

        .pitch-type {
          font-weight: bold;
          color: #ccc;
          min-width: 100px;
        }

        .pitch-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 5px;
        }

        .pitch-note {
          font-size: 1.2em;
          font-weight: bold;
          color: #4CAF50;
        }

        .pitch-freq {
          font-size: 0.9em;
          color: #999;
        }

        .accuracy-display {
          text-align: center;
          margin-top: 10px;
        }

        .accuracy-badge {
          display: inline-block;
          padding: 15px;
          border-radius: 10px;
          min-width: 200px;
        }

        .accuracy-perfect {
          background: linear-gradient(135deg, #4CAF50, #45a049);
          color: white;
        }

        .accuracy-good {
          background: linear-gradient(135deg, #2196F3, #1976D2);
          color: white;
        }

        .accuracy-ok {
          background: linear-gradient(135deg, #ff9800, #f57c00);
          color: white;
        }

        .accuracy-poor {
          background: linear-gradient(135deg, #f44336, #d32f2f);
          color: white;
        }

        .accuracy-no-target {
          background: linear-gradient(135deg, #666, #555);
          color: white;
        }

        .score {
          font-size: 1.5em;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .message {
          font-size: 0.9em;
          opacity: 0.9;
        }

        .song-analysis-info {
          background: #1a1a1a;
          border-radius: 10px;
          padding: 15px;
          margin: 20px 0;
          border-left: 4px solid #2196F3;
        }

        .song-analysis-info h4 {
          color: #2196F3;
          margin-bottom: 10px;
        }

        .analysis-details p {
          color: #ccc;
          margin: 5px 0;
          font-size: 0.9em;
        }

        .comparison-stats {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #444;
        }

        .comparison-stats h4 {
          color: #4CAF50;
          margin-bottom: 15px;
          text-align: center;
        }

        .comparison-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 15px;
        }

        .stat-item {
          text-align: center;
          padding: 15px;
          background: #2a2a2a;
          border-radius: 8px;
        }

        .stat-value {
          font-size: 1.5em;
          font-weight: bold;
          color: #4CAF50;
          margin-bottom: 5px;
        }

        .stat-label {
          font-size: 0.9em;
          color: #ccc;
        }

        @media (max-width: 600px) {
          .pitch-visualization-view {
            padding: 10px;
          }

          .pitch-value {
            font-size: 2em;
          }

          .pitch-note {
            font-size: 1.2em;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default PitchVisualizationView;