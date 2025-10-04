/**
 * AnalysisPage - Performance analysis and statistics
 */

import React from 'react';

const AnalysisPage = ({ appState }) => {
  // Mock data for demonstration - in real app this would come from session data
  const mockAnalysisData = {
    totalSessions: 12,
    totalPracticeTime: '2h 45m',
    averagePitchAccuracy: 78,
    improvementRate: 15,
    recentSessions: [
      { date: '2024-01-15', song: 'Perfect - Ed Sheeran', accuracy: 85, duration: '3:45' },
      { date: '2024-01-14', song: 'Shallow - Lady Gaga', accuracy: 72, duration: '4:20' },
      { date: '2024-01-13', song: 'Perfect - Ed Sheeran', accuracy: 68, duration: '3:45' },
      { date: '2024-01-12', song: 'Hello - Adele', accuracy: 81, duration: '4:55' },
    ],
    pitchProgress: [
      { week: 'Week 1', accuracy: 65 },
      { week: 'Week 2', accuracy: 71 },
      { week: 'Week 3', accuracy: 76 },
      { week: 'Week 4', accuracy: 78 },
    ]
  };

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 80) return '#4CAF50';
    if (accuracy >= 60) return '#FF9800';
    return '#f44336';
  };

  const getAccuracyLabel = (accuracy) => {
    if (accuracy >= 80) return 'Excellent';
    if (accuracy >= 60) return 'Good';
    return 'Needs Work';
  };

  return (
    <div className="analysis-page">
      <div className="analysis-container">
        <div className="page-header">
          <h1>📊 Performance Analysis</h1>
          <p>Track your singing progress and get detailed performance insights</p>
        </div>

        {/* Current Session Stats */}
        {appState?.sessionStats && (
          <div className="current-session">
            <h2>🎤 Current Session</h2>
            <div className="session-grid">
              <div className="stat-card">
                <span className="stat-icon">⏱️</span>
                <div className="stat-content">
                  <h3>{appState.sessionStats.duration || '0:00'}</h3>
                  <p>Recording Time</p>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">🎵</span>
                <div className="stat-content">
                  <h3>{appState.sessionStats.pitchCount || 0}</h3>
                  <p>Pitch Detections</p>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">📈</span>
                <div className="stat-content">
                  <h3>{appState.sessionStats.averagePitch || 'N/A'}</h3>
                  <p>Average Pitch</p>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">🎯</span>
                <div className="stat-content">
                  <h3>{appState.sessionStats.accuracy || 'N/A'}%</h3>
                  <p>Accuracy</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Overall Statistics */}
        <div className="overview-stats">
          <h2>📈 Overall Performance</h2>
          <div className="stats-grid">
            <div className="stat-card large">
              <span className="stat-icon">🏆</span>
              <div className="stat-content">
                <h3>{mockAnalysisData.totalSessions}</h3>
                <p>Total Practice Sessions</p>
              </div>
            </div>
            <div className="stat-card large">
              <span className="stat-icon">⏰</span>
              <div className="stat-content">
                <h3>{mockAnalysisData.totalPracticeTime}</h3>
                <p>Total Practice Time</p>
              </div>
            </div>
            <div className="stat-card large">
              <span className="stat-icon">🎯</span>
              <div className="stat-content">
                <h3 style={{ color: getAccuracyColor(mockAnalysisData.averagePitchAccuracy) }}>
                  {mockAnalysisData.averagePitchAccuracy}%
                </h3>
                <p>Average Pitch Accuracy</p>
                <span className="accuracy-label" style={{ color: getAccuracyColor(mockAnalysisData.averagePitchAccuracy) }}>
                  {getAccuracyLabel(mockAnalysisData.averagePitchAccuracy)}
                </span>
              </div>
            </div>
            <div className="stat-card large">
              <span className="stat-icon">📊</span>
              <div className="stat-content">
                <h3 style={{ color: '#4CAF50' }}>+{mockAnalysisData.improvementRate}%</h3>
                <p>Improvement This Month</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Chart */}
        <div className="progress-section">
          <h2>📈 Progress Over Time</h2>
          <div className="progress-chart">
            <div className="chart-container">
              {mockAnalysisData.pitchProgress.map((point, index) => (
                <div key={index} className="chart-bar">
                  <div
                    className="bar"
                    style={{
                      height: `${point.accuracy}%`,
                      backgroundColor: getAccuracyColor(point.accuracy)
                    }}
                  ></div>
                  <span className="bar-label">{point.week}</span>
                  <span className="bar-value">{point.accuracy}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="recent-sessions">
          <h2>🎵 Recent Practice Sessions</h2>
          <div className="sessions-list">
            {mockAnalysisData.recentSessions.map((session, index) => (
              <div key={index} className="session-card">
                <div className="session-info">
                  <h4>{session.song}</h4>
                  <p>{session.date}</p>
                  <p>Duration: {session.duration}</p>
                </div>
                <div className="session-accuracy">
                  <div className="accuracy-circle" style={{ borderColor: getAccuracyColor(session.accuracy) }}>
                    <span style={{ color: getAccuracyColor(session.accuracy) }}>{session.accuracy}%</span>
                  </div>
                  <span className="accuracy-label" style={{ color: getAccuracyColor(session.accuracy) }}>
                    {getAccuracyLabel(session.accuracy)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips and Insights */}
        <div className="insights-section">
          <h2>💡 Performance Insights</h2>
          <div className="insights-grid">
            <div className="insight-card">
              <span className="insight-icon">🎯</span>
              <h4>Accuracy Trend</h4>
              <p>Your pitch accuracy has improved by 15% this month. Keep practicing to maintain this upward trend!</p>
            </div>
            <div className="insight-card">
              <span className="insight-icon">⏰</span>
              <h4>Practice Frequency</h4>
              <p>You've been consistent with 3-4 sessions per week. Try adding one more session for faster improvement.</p>
            </div>
            <div className="insight-card">
              <span className="insight-icon">🎵</span>
              <h4>Song Difficulty</h4>
              <p>You perform better on slower songs. Gradually work on faster tempo songs to expand your range.</p>
            </div>
            <div className="insight-card">
              <span className="insight-icon">📈</span>
              <h4>Next Goal</h4>
              <p>You're close to 80% average accuracy! Focus on breath control and timing for the next breakthrough.</p>
            </div>
          </div>
        </div>

        {/* No Data State */}
        {!appState?.sessionStats && (
          <div className="no-data">
            <span className="no-data-icon">📊</span>
            <h3>No Session Data Yet</h3>
            <p>Start practicing to see your performance analytics here!</p>
            <a href="/practice" className="practice-link">
              Go to Practice Mode →
            </a>
          </div>
        )}
      </div>

      <style jsx>{`
        .analysis-page {
          min-height: calc(100vh - 80px);
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
          padding: 20px;
        }

        .analysis-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .page-header h1 {
          color: #4CAF50;
          font-size: 2.5rem;
          margin-bottom: 10px;
        }

        .page-header p {
          color: #ccc;
          font-size: 1.1rem;
        }

        .current-session,
        .overview-stats,
        .progress-section,
        .recent-sessions,
        .insights-section {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 30px;
          margin-bottom: 30px;
          backdrop-filter: blur(10px);
        }

        .current-session h2,
        .overview-stats h2,
        .progress-section h2,
        .recent-sessions h2,
        .insights-section h2 {
          color: #4CAF50;
          font-size: 1.6rem;
          margin-bottom: 25px;
          text-align: center;
        }

        .session-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 25px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          transition: all 0.3s ease;
        }

        .stat-card.large {
          padding: 25px;
        }

        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(76, 175, 80, 0.15);
          border-color: rgba(76, 175, 80, 0.3);
        }

        .stat-icon {
          font-size: 2.5rem;
          opacity: 0.8;
        }

        .stat-content h3 {
          color: #fff;
          font-size: 1.8rem;
          margin: 0 0 5px 0;
        }

        .stat-card.large .stat-content h3 {
          font-size: 2.2rem;
        }

        .stat-content p {
          color: #ccc;
          margin: 0;
          font-size: 0.9rem;
        }

        .accuracy-label {
          font-size: 0.8rem;
          font-weight: 500;
          margin-top: 5px;
          display: block;
        }

        .progress-chart {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          padding: 30px;
        }

        .chart-container {
          display: flex;
          justify-content: space-around;
          align-items: end;
          height: 200px;
          gap: 20px;
        }

        .chart-bar {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          max-width: 80px;
        }

        .bar {
          width: 40px;
          border-radius: 4px 4px 0 0;
          transition: all 0.3s ease;
          min-height: 20px;
        }

        .bar-label {
          color: #ccc;
          font-size: 0.8rem;
          margin-top: 10px;
        }

        .bar-value {
          color: #fff;
          font-weight: bold;
          font-size: 0.9rem;
          margin-top: 5px;
        }

        .sessions-list {
          display: grid;
          gap: 15px;
        }

        .session-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s ease;
        }

        .session-card:hover {
          transform: translateX(5px);
          border-color: rgba(76, 175, 80, 0.3);
        }

        .session-info h4 {
          color: #fff;
          margin: 0 0 8px 0;
        }

        .session-info p {
          color: #ccc;
          margin: 4px 0;
          font-size: 0.9rem;
        }

        .session-accuracy {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .accuracy-circle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 3px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
        }

        .accuracy-circle span {
          font-weight: bold;
          font-size: 0.9rem;
        }

        .insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .insight-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 25px;
          text-align: center;
          transition: all 0.3s ease;
        }

        .insight-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(76, 175, 80, 0.15);
          border-color: rgba(76, 175, 80, 0.3);
        }

        .insight-icon {
          font-size: 2.5rem;
          margin-bottom: 15px;
          display: block;
        }

        .insight-card h4 {
          color: #4CAF50;
          font-size: 1.2rem;
          margin-bottom: 12px;
        }

        .insight-card p {
          color: #ccc;
          line-height: 1.6;
          margin: 0;
        }

        .no-data {
          text-align: center;
          padding: 60px 20px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
        }

        .no-data-icon {
          font-size: 4rem;
          display: block;
          margin-bottom: 20px;
          opacity: 0.6;
        }

        .no-data h3 {
          color: #fff;
          font-size: 1.5rem;
          margin-bottom: 15px;
        }

        .no-data p {
          color: #ccc;
          margin-bottom: 25px;
        }

        .practice-link {
          color: #4CAF50;
          text-decoration: none;
          font-weight: 500;
          font-size: 1.1rem;
        }

        .practice-link:hover {
          text-decoration: underline;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .analysis-page {
            padding: 15px;
          }

          .page-header h1 {
            font-size: 2rem;
          }

          .session-grid,
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .session-card {
            flex-direction: column;
            gap: 15px;
            text-align: center;
          }

          .chart-container {
            height: 150px;
            gap: 10px;
          }

          .insights-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .analysis-page {
            padding: 10px;
          }

          .current-session,
          .overview-stats,
          .progress-section,
          .recent-sessions,
          .insights-section {
            padding: 20px;
          }

          .stat-card {
            flex-direction: column;
            text-align: center;
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default AnalysisPage;