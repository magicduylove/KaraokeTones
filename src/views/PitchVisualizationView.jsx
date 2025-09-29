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
  songAnalysis = null,
  currentTime = 0,
  duration = 0,
  isPlaying = false
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

  /**
   * Get frequency range and musical note mapping
   */
  const getMusicalRange = () => {
    if (!songAnalysis || !songAnalysis.pitchTimeline) return null;

    const validPitches = songAnalysis.pitchTimeline.filter(p => p.frequency && p.frequency > 80);
    if (validPitches.length === 0) return null;

    const frequencies = validPitches.map(p => p.frequency);
    const minFreq = Math.min(...frequencies);
    const maxFreq = Math.max(...frequencies);

    // Convert to note numbers (C4 = 0)
    const minNoteRaw = 12 * Math.log2(minFreq / 261.63);
    const maxNoteRaw = 12 * Math.log2(maxFreq / 261.63);

    // Round to nearest semitone and add some padding
    const minNote = Math.floor(minNoteRaw) - 2; // Add 2 semitones padding below
    const maxNote = Math.ceil(maxNoteRaw) + 2;   // Add 2 semitones padding above

    // Create note labels with smart filtering
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteLabels = [];
    const totalRange = maxNote - minNote;

    // If range is too large (>15 semitones), show only natural notes and important sharps
    const showOnlyMainNotes = totalRange > 15;

    for (let noteNum = minNote; noteNum <= maxNote; noteNum++) {
      const octave = Math.floor(noteNum / 12) + 4;
      const noteIndex = ((noteNum % 12) + 12) % 12;
      const noteName = noteNames[noteIndex];
      const frequency = 261.63 * Math.pow(2, noteNum / 12);

      // Filter out some sharps/flats if range is too large
      const isSharp = noteName.includes('#');
      const shouldShow = !showOnlyMainNotes || !isSharp ||
                        ['C#', 'F#', 'G#'].includes(noteName); // Keep important sharps

      if (shouldShow) {
        noteLabels.push({
          noteNum,
          name: `${noteName}${octave}`,
          frequency,
          isSharp,
          y: 280 - ((noteNum - minNote) / (maxNote - minNote)) * 240 // Map to 280px height with 20px margins
        });
      }
    }

    return {
      minNote,
      maxNote,
      noteLabels,
      minFreq,
      maxFreq,
      range: totalRange,
      showOnlyMainNotes
    };
  };

  /**
   * Get pitch timeline data as musical notes
   */
  const getPitchTimelineData = () => {
    if (!songAnalysis || !songAnalysis.pitchTimeline) {
      return [];
    }

    const musicalRange = getMusicalRange();
    if (!musicalRange) return [];

    const songDuration = songAnalysis.duration || duration;
    const timelineWidth = 800;

    // Filter and map pitch points to visual dots
    return songAnalysis.pitchTimeline
      .filter(p => p.frequency && p.frequency > 80)
      .map(point => {
        const noteNum = 12 * Math.log2(point.frequency / 261.63);
        const x = (point.time / songDuration) * timelineWidth;
        const y = 280 - ((noteNum - musicalRange.minNote) / (musicalRange.maxNote - musicalRange.minNote)) * 240;

        return {
          x: Math.max(0, Math.min(timelineWidth, x)),
          y: Math.max(20, Math.min(280, y)),
          frequency: point.frequency,
          note: point.note,
          confidence: point.confidence,
          time: point.time
        };
      });
  };

  /**
   * Get user pitch overlay data for current session
   */
  const getUserPitchOverlay = () => {
    if (!pitchHistory.length || !duration) return [];

    const musicalRange = getMusicalRange();
    if (!musicalRange) return [];

    const songDuration = songAnalysis?.duration || duration;

    return pitchHistory.map((pitch, index) => {
      if (!pitch.frequency) return null;

      const timeProgress = (currentTime - (pitchHistory.length - index) * 0.1) / songDuration;
      const noteNum = 12 * Math.log2(pitch.frequency / 261.63);
      const x = timeProgress * 800;
      const y = 280 - ((noteNum - musicalRange.minNote) / (musicalRange.maxNote - musicalRange.minNote)) * 240;

      return {
        x: Math.max(0, Math.min(800, x)),
        y: Math.max(20, Math.min(280, y)),
        frequency: pitch.frequency,
        confidence: pitch.confidence,
        note: pitch.note
      };
    }).filter(p => p && p.x >= 0 && p.x <= 800);
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

      {/* Musical Note Timeline Visualization */}
      {songAnalysis && (songAnalysis.duration > 0 || duration > 0) && (() => {
        const musicalRange = getMusicalRange();
        if (!musicalRange) return null;

        return (
          <div className="pitch-timeline-section">
            <h3>Musical Notes Timeline {isPlaying && '(Playing)'}</h3>
            <div className="musical-timeline">
              <svg width="900" height="320" className="musical-timeline-svg">
                {/* Background staff lines */}
                <defs>
                  <pattern id="staffGrid" width="20" height="320" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="320" stroke="#222" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="800" height="280" x="80" y="20" fill="url(#staffGrid)" />

                {/* Note labels on Y-axis */}
                {musicalRange.noteLabels.map((noteLabel, index) => (
                  <g key={noteLabel.name}>
                    {/* Horizontal grid line for each note */}
                    <line
                      x1="80"
                      y1={noteLabel.y}
                      x2="880"
                      y2={noteLabel.y}
                      stroke={noteLabel.isSharp ? '#2a2a2a' : '#444'}
                      strokeWidth={noteLabel.isSharp ? "1" : "1.5"}
                      opacity={noteLabel.isSharp ? "0.3" : "0.6"}
                    />
                    {/* Note name label */}
                    <text
                      x="75"
                      y={noteLabel.y + 4}
                      fill={noteLabel.isSharp ? '#888' : '#ccc'}
                      fontSize={noteLabel.isSharp ? "10" : "12"}
                      textAnchor="end"
                      fontFamily="monospace"
                      fontWeight={noteLabel.isSharp ? "normal" : "bold"}
                    >
                      {noteLabel.name}
                    </text>
                  </g>
                ))}

                {/* Song pitch dots */}
                {getPitchTimelineData().map((point, index) => (
                  <circle
                    key={`song-${index}`}
                    cx={80 + point.x}
                    cy={point.y}
                    r="3"
                    fill={getPitchColor(point.confidence)}
                    opacity="0.8"
                    stroke="#333"
                    strokeWidth="1"
                  >
                    <title>{point.note} - {formatFrequency(point.frequency)} at {point.time.toFixed(1)}s</title>
                  </circle>
                ))}

                {/* User pitch overlay dots */}
                {isRecording && getUserPitchOverlay().map((userPitch, index) => (
                  <circle
                    key={`user-${index}`}
                    cx={80 + userPitch.x}
                    cy={userPitch.y}
                    r="4"
                    fill="#ff4444"
                    opacity="0.9"
                    stroke="#fff"
                    strokeWidth="2"
                  >
                    <title>Your Voice: {userPitch.note} - {formatFrequency(userPitch.frequency)}</title>
                  </circle>
                ))}

                {/* Current time cursor */}
                {(isPlaying || isRecording) && (
                  <line
                    x1={80 + (currentTime / (songAnalysis.duration || duration)) * 800}
                    y1="20"
                    x2={80 + (currentTime / (songAnalysis.duration || duration)) * 800}
                    y2="300"
                    stroke="#00ff00"
                    strokeWidth="3"
                    opacity="0.8"
                  />
                )}

                {/* Time labels on X-axis */}
                {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                  const timelineDuration = songAnalysis.duration || duration;
                  const x = 80 + ratio * 800;
                  return (
                    <g key={ratio}>
                      <line
                        x1={x}
                        y1="300"
                        x2={x}
                        y2="310"
                        stroke="#666"
                        strokeWidth="2"
                      />
                      <text
                        x={x}
                        y="318"
                        fill="#ccc"
                        fontSize="12"
                        textAnchor="middle"
                      >
                        {(ratio * timelineDuration).toFixed(0)}s
                      </text>
                    </g>
                  );
                })}

                {/* Axis labels */}
                <text x="450" y="18" fill="#fff" fontSize="14" textAnchor="middle" fontWeight="bold">
                  Time →
                </text>
                <text x="25" y="160" fill="#fff" fontSize="14" textAnchor="middle" fontWeight="bold" transform="rotate(-90, 25, 160)">
                  Musical Notes ↑
                </text>
              </svg>
            </div>
            <div className="timeline-legend">
              <div className="legend-item">
                <div className="legend-dot song-dot"></div>
                <span>Song Notes</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot user-dot"></div>
                <span>Your Voice</span>
              </div>
              <div className="legend-item">
                <div className="legend-line"></div>
                <span>Current Position</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Pitch History Visualization */}
      {pitchHistory.length > 0 && (
        <div className="pitch-history-section">
          <h3>Recent Pitch History</h3>
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
            <p>🎵 Pitch points: {songAnalysis.pitchTimeline?.length || 0}</p>
            <p>📈 Timeline data: {getPitchTimelineData().length} visual points</p>
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

        .pitch-timeline-section {
          margin: 30px 0;
        }

        .pitch-timeline-section h3 {
          color: #fff;
          margin-bottom: 15px;
          text-align: center;
        }

        .musical-timeline {
          background: #000;
          border-radius: 10px;
          padding: 20px;
          overflow-x: auto;
          display: flex;
          justify-content: center;
        }

        .musical-timeline-svg {
          background: #111;
          border-radius: 8px;
          border: 2px solid #333;
        }

        .timeline-legend {
          display: flex;
          justify-content: center;
          gap: 25px;
          margin-top: 15px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #ccc;
          font-size: 0.95em;
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .song-dot {
          background: #4CAF50;
          border: 1px solid #333;
        }

        .user-dot {
          background: #ff4444;
          border: 2px solid #fff;
        }

        .legend-line {
          width: 20px;
          height: 3px;
          background: #00ff00;
          border-radius: 2px;
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