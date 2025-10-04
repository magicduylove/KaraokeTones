/**
 * VocalTestPage - Dedicated page for vocal separation testing
 */

import React from 'react';
import VocalTestView from '../views/VocalTestView.jsx';

const VocalTestPage = ({ controller, appState }) => {
  return (
    <div className="vocal-test-page">
      <div className="test-container">
        <div className="page-header">
          <h1>🧪 Vocal Separation Lab</h1>
          <p>Test AI-powered vocal separation and background removal technology</p>
        </div>

        {/* Current Audio Status */}
        <div className="audio-status">
          {appState?.hasAudio ? (
            <div className="status-card success">
              <span className="status-icon">✅</span>
              <div className="status-info">
                <h3>Audio Loaded</h3>
                <p>File: {appState.audioInfo?.name}</p>
                <p>Duration: {appState.audioInfo?.duration}</p>
              </div>
            </div>
          ) : (
            <div className="status-card warning">
              <span className="status-icon">⚠️</span>
              <div className="status-info">
                <h3>No Audio File</h3>
                <p>Please go to Practice page to load an audio file first</p>
                <a href="/practice" className="load-audio-link">
                  Load Audio File →
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Vocal Test Interface */}
        <VocalTestView controller={controller} />

        {/* Technology Info */}
        <div className="tech-info">
          <h3>🔬 Technology Behind Vocal Separation</h3>
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">🤖</div>
              <h4>Demucs v4 AI Model</h4>
              <p>
                State-of-the-art neural network trained on thousands of songs to separate
                vocals from instrumental tracks with high accuracy.
              </p>
            </div>

            <div className="info-card">
              <div className="info-icon">🎵</div>
              <h4>Stem Separation</h4>
              <p>
                Advanced audio processing that can isolate vocals, drums, bass, and other
                instruments into separate audio streams.
              </p>
            </div>

            <div className="info-card">
              <div className="info-icon">⚡</div>
              <h4>Real-time Processing</h4>
              <p>
                Optimized for fast processing while maintaining high quality audio output
                suitable for practice and analysis.
              </p>
            </div>

            <div className="info-card">
              <div className="info-icon">🎯</div>
              <h4>Practice Benefits</h4>
              <p>
                Isolated vocals help you focus on pitch accuracy and timing without
                background music interference.
              </p>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="usage-instructions">
          <h3>📋 How to Use Vocal Separation</h3>
          <div className="instruction-steps">
            <div className="instruction-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Load Audio</h4>
                <p>Import an audio file in the Practice section first</p>
              </div>
            </div>

            <div className="instruction-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Analyze</h4>
                <p>Click "Analyze Separation" to get file size and processing info</p>
              </div>
            </div>

            <div className="instruction-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Test & Listen</h4>
                <p>Use "Test & Play Vocals" to hear the separated vocal track</p>
              </div>
            </div>

            <div className="instruction-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Compare</h4>
                <p>Try "Compare" to hear original vs separated vocals side-by-side</p>
              </div>
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="requirements">
          <h3>⚙️ System Requirements</h3>
          <div className="requirement-list">
            <div className="requirement-item">
              <span className="req-icon">🐍</span>
              <span>Python backend running on port 5000</span>
            </div>
            <div className="requirement-item">
              <span className="req-icon">📦</span>
              <span>Demucs library installed (pip install demucs)</span>
            </div>
            <div className="requirement-item">
              <span className="req-icon">💾</span>
              <span>Sufficient disk space for temporary files</span>
            </div>
            <div className="requirement-item">
              <span className="req-icon">🌐</span>
              <span>Internet connection for model downloads (first run)</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .vocal-test-page {
          min-height: calc(100vh - 80px);
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
          padding: 20px;
        }

        .test-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header {
          text-align: center;
          margin-bottom: 30px;
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

        .audio-status {
          margin-bottom: 30px;
        }

        .status-card {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid;
        }

        .status-card.success {
          background: rgba(76, 175, 80, 0.1);
          border-color: #4CAF50;
        }

        .status-card.warning {
          background: rgba(255, 152, 0, 0.1);
          border-color: #ff9800;
        }

        .status-icon {
          font-size: 2rem;
        }

        .status-info h3 {
          color: #fff;
          margin: 0 0 8px 0;
        }

        .status-info p {
          color: #ccc;
          margin: 4px 0;
        }

        .load-audio-link {
          color: #4CAF50;
          text-decoration: none;
          font-weight: 500;
          display: inline-block;
          margin-top: 8px;
        }

        .load-audio-link:hover {
          text-decoration: underline;
        }

        .tech-info,
        .usage-instructions,
        .requirements {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 30px;
          margin-bottom: 30px;
          backdrop-filter: blur(10px);
        }

        .tech-info h3,
        .usage-instructions h3,
        .requirements h3 {
          color: #4CAF50;
          font-size: 1.6rem;
          margin-bottom: 25px;
          text-align: center;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .info-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 25px;
          text-align: center;
          transition: all 0.3s ease;
        }

        .info-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(76, 175, 80, 0.15);
          border-color: rgba(76, 175, 80, 0.3);
        }

        .info-icon {
          font-size: 2.5rem;
          margin-bottom: 15px;
          display: block;
        }

        .info-card h4 {
          color: #fff;
          font-size: 1.2rem;
          margin-bottom: 12px;
        }

        .info-card p {
          color: #ccc;
          line-height: 1.6;
          margin: 0;
        }

        .instruction-steps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 25px;
        }

        .instruction-step {
          display: flex;
          align-items: flex-start;
          gap: 15px;
        }

        .step-number {
          background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
          color: white;
          width: 35px;
          height: 35px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          flex-shrink: 0;
        }

        .step-content h4 {
          color: #4CAF50;
          margin-bottom: 8px;
        }

        .step-content p {
          color: #ccc;
          margin: 0;
          line-height: 1.5;
        }

        .requirement-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 15px;
        }

        .requirement-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 15px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          color: #ccc;
        }

        .req-icon {
          font-size: 1.3rem;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .vocal-test-page {
            padding: 15px;
          }

          .page-header h1 {
            font-size: 2rem;
          }

          .status-card {
            flex-direction: column;
            text-align: center;
            gap: 15px;
          }

          .info-grid,
          .instruction-steps {
            grid-template-columns: 1fr;
          }

          .instruction-step {
            flex-direction: column;
            text-align: center;
          }

          .requirement-list {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .vocal-test-page {
            padding: 10px;
          }

          .page-header h1 {
            font-size: 1.8rem;
          }

          .tech-info,
          .usage-instructions,
          .requirements {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default VocalTestPage;