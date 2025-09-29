/**
 * PitchVisualizationView - View component for pitch detection visualization (piano-roll view)
 */

import { useId, useMemo } from 'react';

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
  // ===== Constants & helpers =====
  const C4_FREQ = 261.63; // reference for note calc
  const VIEW = { left: 70, top: 24, width: 760, height: 240 }; // drawing box
  const staffGridId = useId(); // reserved (no external collisions if you add <defs> later)
  const toNoteNum = (f) => 12 * Math.log2(f / C4_FREQ);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const safeDen = (x) => (x === 0 ? 1 : x);

  const buildPath = (pts) => {
    if (!pts?.length) return '';
    let d = `M ${VIEW.left + pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) d += ` L ${VIEW.left + pts[i].x} ${pts[i].y}`;
    return d;
  };

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
   * Get pitch bar height based on frequency (for recent history mini-graph)
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
   * Returns: { minNote, maxNote, noteLabels, minFreq, maxFreq, range, showOnlyMainNotes }
   */
  const getMusicalRange = () => {
    if (!songAnalysis || !songAnalysis.pitchTimeline) return null;

    const validPitches = songAnalysis.pitchTimeline.filter(p => p.frequency && p.frequency > 80);
    if (validPitches.length === 0) return null;

    const frequencies = validPitches.map(p => p.frequency);
    const minFreq = Math.min(...frequencies);
    const maxFreq = Math.max(...frequencies);

    // Convert to note numbers (C4 = 0)
    const minNoteRaw = 12 * Math.log2(minFreq / C4_FREQ);
    const maxNoteRaw = 12 * Math.log2(maxFreq / C4_FREQ);

    // Round to nearest semitone and add some padding
    const minNote = Math.floor(minNoteRaw) - 2; // Add 2 semitones padding below
    const maxNote = Math.ceil(maxNoteRaw) + 2;  // Add 2 semitones padding above
    const totalRange = Math.max(1, maxNote - minNote);

    // Create note labels with smart filtering
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const showOnlyMainNotes = totalRange > 15;

    const noteLabels = [];
    for (let noteNum = minNote; noteNum <= maxNote; noteNum++) {
      const octave = Math.floor(noteNum / 12) + 4;
      const noteIndex = ((noteNum % 12) + 12) % 12;
      const noteName = noteNames[noteIndex];
      const frequency = C4_FREQ * Math.pow(2, noteNum / 12);

      // Filter out some sharps/flats if range is too large
      const isSharp = noteName.includes('#');
      const shouldShow = !showOnlyMainNotes || !isSharp || ['C#', 'F#', 'G#'].includes(noteName);

      if (shouldShow) {
        noteLabels.push({
          noteNum,
          name: `${noteName}${octave}`,
          frequency,
          isSharp,
          y: VIEW.top + VIEW.height
            - ((noteNum - minNote) / totalRange) * VIEW.height // map to piano-roll Y
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
   * Get pitch timeline data (downsampled + smoothed) for song line
   */
  const getPitchTimelineData = () => {
    if (!songAnalysis?.pitchTimeline) return [];
    const musicalRange = getMusicalRange();
    if (!musicalRange) return [];

    const songDuration = songAnalysis.duration || duration || 1;
    const raw = songAnalysis.pitchTimeline.filter(p => p.frequency && p.frequency > 80);
    if (!raw.length) return [];

    // Downsample to keep it readable (~1000 points)
    const step = Math.ceil(raw.length / 1000) || 1;
    const sampled = [];
    for (let i = 0; i < raw.length; i += step) {
      const p = raw[i];
      const noteNum = toNoteNum(p.frequency);
      const x = clamp((p.time / songDuration) * VIEW.width, 0, VIEW.width);
      const y = VIEW.top + VIEW.height
        - ((noteNum - musicalRange.minNote) / safeDen(musicalRange.maxNote - musicalRange.minNote)) * VIEW.height;
      sampled.push({ x, y, time: p.time, frequency: p.frequency, confidence: p.confidence });
    }

    // Light moving-average smoothing on Y
    const k = 5;
    return sampled.map((p, i) => {
      let acc = 0, cnt = 0;
      for (let j = i - Math.floor(k / 2); j <= i + Math.floor(k / 2); j++) {
        if (j >= 0 && j < sampled.length) { acc += sampled[j].y; cnt++; }
      }
      return { ...p, y: acc / cnt };
    });
  };

  /**
   * Get user pitch overlay path points (line)
   */
  const getUserPathData = () => {
    if (!isRecording || !pitchHistory.length) return [];
    const musicalRange = getMusicalRange();
    if (!musicalRange) return [];
    const songDuration = songAnalysis?.duration || duration || 1;

    const pts = pitchHistory
      .filter(p => p?.frequency)
      .map((p, idx) => {
        const timeProgress = (currentTime - (pitchHistory.length - idx) * 0.1) / songDuration;
        const noteNum = toNoteNum(p.frequency);
        const x = clamp(timeProgress * VIEW.width, 0, VIEW.width);
        const y = VIEW.top + VIEW.height
          - ((noteNum - musicalRange.minNote) / safeDen(musicalRange.maxNote - musicalRange.minNote)) * VIEW.height;
        return { x, y };
      })
      .filter(p => p.x >= 0 && p.x <= VIEW.width);

    // Tiny smoothing
    const k = 3;
    return pts.map((p, i) => {
      let acc = 0, c = 0;
      for (let j = i - 1; j <= i + 1; j++) if (j >= 0 && j < pts.length) { acc += pts[j].y; c++; }
      return { ...p, y: acc / c };
    });
  };

  // ===== Memoized computations =====
  const musicalRange = useMemo(() => getMusicalRange(), [songAnalysis, duration]);
  const timelineData = useMemo(
    () => getPitchTimelineData(),
    [songAnalysis, duration, musicalRange?.minNote, musicalRange?.maxNote]
  );
  const songPath = useMemo(() => buildPath(timelineData), [timelineData]);

  const userData = useMemo(
    () => getUserPathData(),
    [pitchHistory, currentTime, isRecording, songAnalysis?.duration, duration, musicalRange?.minNote, musicalRange?.maxNote]
  );
  const userPath = useMemo(() => buildPath(userData), [userData]);

  const playDen = (songAnalysis?.duration || duration || 1);

  return (
    <div className="pitch-visualization-view">
      {/* Current Pitch Display */}
      <div className="current-pitch-section">
        <h3>Current Pitch</h3>
        <div className="pitch-display">
          <div className="pitch-value" aria-live="polite">
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

      {/* Piano-Roll Pitch Map (clean view) */}
      {songAnalysis && (songAnalysis.duration > 0 || duration > 0) && musicalRange && (
        <div className="pitch-timeline-section">
          <h3>Pitch Map (Piano-Roll) {isPlaying && '(Playing)'}</h3>
          <div className="musical-timeline">
            <svg
              width={VIEW.left + VIEW.width + 80}
              height={VIEW.top + VIEW.height + 60}
              className="musical-timeline-svg"
            >
              {/* Background */}
              <rect
                x={VIEW.left}
                y={VIEW.top}
                width={VIEW.width}
                height={VIEW.height}
                rx="6"
                fill="#0b0b0b"
              />

              {/* Horizontal lanes (natural notes only, alternating rows) */}
              {musicalRange.noteLabels
                .filter(n => !n.isSharp)
                .map((nl, i) => (
                  <g key={nl.name}>
                    <rect
                      x={VIEW.left}
                      y={nl.y - (VIEW.height / safeDen(musicalRange.maxNote - musicalRange.minNote)) / 2}
                      width={VIEW.width}
                      height={VIEW.height / safeDen(musicalRange.maxNote - musicalRange.minNote)}
                      fill={i % 2 ? '#101010' : '#141414'}
                      opacity="0.9"
                    />
                    <line
                      x1={VIEW.left}
                      x2={VIEW.left + VIEW.width}
                      y1={nl.y}
                      y2={nl.y}
                      stroke="#2d2d2d"
                      strokeWidth="1"
                    />
                  </g>
                ))}

              {/* Y-axis labels removed - notes are now shown inside dots */}

              {/* Song pitch dots with note labels */}
              {timelineData.map((point, index) => {
                const noteNum = toNoteNum(point.frequency);
                const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
                const octave = Math.floor(noteNum / 12) + 4;
                const noteIndex = ((Math.round(noteNum) % 12) + 12) % 12;
                const noteName = noteNames[noteIndex];
                const shortNote = noteName.length > 1 ? noteName : noteName; // Keep as is for now

                return (
                  <g key={`song-${index}`}>
                    <circle
                      cx={VIEW.left + point.x}
                      cy={point.y}
                      r="12"
                      fill={getPitchColor(point.confidence)}
                      opacity="0.85"
                      stroke="#333"
                      strokeWidth="2"
                    >
                      <title>Song: {noteName}{octave} ({formatFrequency(point.frequency)}) at {point.time.toFixed(1)}s</title>
                    </circle>
                    <text
                      x={VIEW.left + point.x}
                      y={point.y + 4}
                      fill="#000"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {shortNote}
                    </text>
                  </g>
                );
              })}

              {/* User pitch overlay dots with note labels */}
              {isRecording && userData.map((userPitch, index) => {
                if (!userPitch.frequency) return null;
                const noteNum = toNoteNum(userPitch.frequency);
                const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
                const octave = Math.floor(noteNum / 12) + 4;
                const noteIndex = ((Math.round(noteNum) % 12) + 12) % 12;
                const noteName = noteNames[noteIndex];

                return (
                  <g key={`user-${index}`}>
                    <circle
                      cx={VIEW.left + userPitch.x}
                      cy={userPitch.y}
                      r="14"
                      fill="#ff5555"
                      opacity="0.9"
                      stroke="#fff"
                      strokeWidth="3"
                    >
                      <title>Your Voice: {noteName}{octave} ({formatFrequency(userPitch.frequency)})</title>
                    </circle>
                    <text
                      x={VIEW.left + userPitch.x}
                      y={userPitch.y + 4}
                      fill="#fff"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {noteName}
                    </text>
                  </g>
                );
              })}

              {/* Current time cursor */}
              {(isPlaying || isRecording) && (
                <line
                  x1={VIEW.left + (currentTime / playDen) * VIEW.width}
                  y1={VIEW.top}
                  x2={VIEW.left + (currentTime / playDen) * VIEW.width}
                  y2={VIEW.top + VIEW.height}
                  stroke="#00ff00"
                  strokeWidth="3"
                  opacity="0.8"
                />
              )}

              {/* Time labels on X-axis */}
              {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                const timelineDuration = songAnalysis.duration || duration || 0;
                const x = VIEW.left + ratio * VIEW.width;
                return (
                  <g key={ratio}>
                    <line
                      x1={x}
                      y1={VIEW.top + VIEW.height}
                      x2={x}
                      y2={VIEW.top + VIEW.height + 10}
                      stroke="#666"
                      strokeWidth="2"
                    />
                    <text
                      x={x}
                      y={VIEW.top + VIEW.height + 28}
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
              <text
                x={VIEW.left + VIEW.width / 2}
                y={16}
                fill="#fff"
                fontSize="14"
                textAnchor="middle"
                fontWeight="bold"
              >
                Time →
              </text>
              <text
                x="25"
                y={VIEW.top + VIEW.height / 2}
                fill="#fff"
                fontSize="14"
                textAnchor="middle"
                fontWeight="bold"
                transform={`rotate(-90, 25, ${VIEW.top + VIEW.height / 2})`}
              >
                Notes ↑
              </text>
            </svg>
          </div>

          <div className="timeline-legend">
            <div className="legend-item">
              <div className="legend-line-song">C</div><span>Song Notes</span>
            </div>
            <div className="legend-item">
              <div className="legend-line-user">G</div><span>Your Voice</span>
            </div>
            <div className="legend-item">
              <div className="legend-line"></div><span>Current Position</span>
            </div>
          </div>
        </div>
      )}

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
          <h4>Song Analysis Results</h4>
          <div className="analysis-details">
            <p>✅ Song analyzed: {songAnalysis.validPitches} vocal points detected</p>
            <p>📊 Coverage: {songAnalysis.coverage}% of song has vocal content</p>
            <p>⏱️ Duration: {songAnalysis.duration.toFixed(1)} seconds</p>
            <p>🎵 Pitch points: {songAnalysis.pitchTimeline?.length || 0}</p>
            <p>📈 Timeline data: {timelineData.length} visual points</p>
            {songAnalysis.analysisType && (
              <p className={`analysis-type ${songAnalysis.isVocalOnly ? 'vocal-only' : 'full-mix'}`}>
                🎯 Analysis: {songAnalysis.analysisType}
                <span className="accuracy-badge">({songAnalysis.accuracy} accuracy)</span>
              </p>
            )}
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

        .legend-line-song {
          width: 24px;
          height: 24px;
          background: #4CAF50;
          border-radius: 50%;
          border: 2px solid #333;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: bold;
          color: #000;
        }

        .legend-line-user {
          width: 28px;
          height: 28px;
          background: #ff5555;
          border-radius: 50%;
          border: 3px solid #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: bold;
          color: #fff;
        }

        .legend-line {
          width: 24px;
          height: 0;
          border-top: 3px solid #00ff00;
          border-radius: 2px;
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

        .accuracy-display {
          text-align: center;
          margin-top: 10px;
        }

        .accuracy-badge {
          display: inline-block;
          padding: 15px;
          border-radius: 10px;
          min-width: 200px;
          color: white;
          background: linear-gradient(135deg, #2196F3, #1976D2);
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

        .analysis-type {
          font-weight: bold !important;
          padding: 8px 12px;
          border-radius: 6px;
          margin: 8px 0 !important;
        }

        .analysis-type.vocal-only {
          background: rgba(76, 175, 80, 0.2);
          border: 1px solid #4CAF50;
          color: #4CAF50 !important;
        }

        .analysis-type.full-mix {
          background: rgba(255, 152, 0, 0.2);
          border: 1px solid #ff9800;
          color: #ff9800 !important;
        }

        .accuracy-badge {
          font-size: 0.8em;
          opacity: 0.8;
          margin-left: 8px;
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
