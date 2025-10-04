/**
 * VocalTestView - Test interface for vocal separation functions
 */

import React, { useState, useRef } from 'react';

const VocalTestView = ({ controller }) => {
  const [testState, setTestState] = useState({
    isLoading: false,
    status: 'Ready to test vocal separation',
    analysisResult: null,
    error: null,
    currentTestAudio: null
  });

  const currentTestAudioRef = useRef(null);

  /**
   * Test vocal separation and play result
   */
  const handleTestVocalSeparation = async () => {
    if (!controller?.audioService?.hasAudio()) {
      setTestState(prev => ({ ...prev, error: 'Please load an audio file first' }));
      return;
    }

    setTestState(prev => ({
      ...prev,
      isLoading: true,
      status: 'Separating vocals from background...',
      error: null
    }));

    try {
      // Stop any currently playing test audio
      if (currentTestAudioRef.current) {
        currentTestAudioRef.current.pause();
        currentTestAudioRef.current = null;
      }

      const vocalAudio = await controller.audioService.testVocalSeparation();
      currentTestAudioRef.current = vocalAudio;

      setTestState(prev => ({
        ...prev,
        isLoading: false,
        status: 'Playing separated vocals (background removed)',
        currentTestAudio: vocalAudio
      }));

      // Update status when audio ends
      vocalAudio.addEventListener('ended', () => {
        setTestState(prev => ({
          ...prev,
          status: 'Vocal separation test completed'
        }));
      });

    } catch (error) {
      setTestState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
        status: 'Vocal separation test failed'
      }));
    }
  };

  /**
   * Analyze vocal separation without playback
   */
  const handleAnalyzeVocalSeparation = async () => {
    if (!controller?.audioService?.hasAudio()) {
      setTestState(prev => ({ ...prev, error: 'Please load an audio file first' }));
      return;
    }

    setTestState(prev => ({
      ...prev,
      isLoading: true,
      status: 'Analyzing vocal separation...',
      error: null
    }));

    try {
      const analysisResult = await controller.audioService.analyzeVocalSeparation();

      setTestState(prev => ({
        ...prev,
        isLoading: false,
        status: 'Analysis completed',
        analysisResult: analysisResult
      }));

    } catch (error) {
      setTestState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
        status: 'Analysis failed'
      }));
    }
  };

  /**
   * Compare original vs separated vocals
   */
  const handleCompareAudio = async () => {
    if (!controller?.audioService?.hasAudio()) {
      setTestState(prev => ({ ...prev, error: 'Please load an audio file first' }));
      return;
    }

    setTestState(prev => ({
      ...prev,
      isLoading: true,
      status: 'Starting audio comparison...',
      error: null
    }));

    try {
      // Stop any currently playing test audio
      if (currentTestAudioRef.current) {
        currentTestAudioRef.current.pause();
        currentTestAudioRef.current = null;
      }

      const result = await controller.audioService.compareOriginalWithVocals();
      currentTestAudioRef.current = result.vocalAudio;

      setTestState(prev => ({
        ...prev,
        isLoading: false,
        status: 'Comparison completed - played original then separated vocals',
        currentTestAudio: result.vocalAudio
      }));

    } catch (error) {
      setTestState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
        status: 'Audio comparison failed'
      }));
    }
  };

  /**
   * Stop current test audio
   */
  const handleStopTestAudio = () => {
    if (currentTestAudioRef.current) {
      currentTestAudioRef.current.pause();
      currentTestAudioRef.current.currentTime = 0;
      currentTestAudioRef.current = null;
      setTestState(prev => ({
        ...prev,
        status: 'Test audio stopped',
        currentTestAudio: null
      }));
    }
  };

  /**
   * Clear test results
   */
  const handleClearResults = () => {
    handleStopTestAudio();
    setTestState({
      isLoading: false,
      status: 'Ready to test vocal separation',
      analysisResult: null,
      error: null,
      currentTestAudio: null
    });
  };

  const hasAudio = controller?.audioService?.hasAudio();

  return (
    <div className="vocal-test-view">
      <h3>🎤 Vocal Separation Testing</h3>

      {/* Status Display */}
      <div className={`test-status ${
        testState.error ? 'status-error' :
        testState.isLoading ? 'status-loading' :
        'status-success'
      }`}>
        {testState.isLoading && <span className="loading-spinner">⏳</span>}
        {testState.status}
      </div>

      {/* Error Display */}
      {testState.error && (
        <div className="error-message">
          ❌ {testState.error}
        </div>
      )}

      {/* Test Controls */}
      <div className="test-controls">
        <div className="test-buttons">
          <button
            onClick={handleAnalyzeVocalSeparation}
            disabled={!hasAudio || testState.isLoading}
            className="analyze-button"
          >
            <span className="icon">📊</span>
            Analyze Separation
          </button>

          <button
            onClick={handleTestVocalSeparation}
            disabled={!hasAudio || testState.isLoading}
            className="test-button"
          >
            <span className="icon">🎵</span>
            Test & Play Vocals
          </button>

          <button
            onClick={handleCompareAudio}
            disabled={!hasAudio || testState.isLoading}
            className="compare-button"
          >
            <span className="icon">🔄</span>
            Compare Original vs Vocals
          </button>
        </div>

        <div className="control-buttons">
          {testState.currentTestAudio && (
            <button
              onClick={handleStopTestAudio}
              className="stop-button"
            >
              <span className="icon">⏹️</span>
              Stop Test Audio
            </button>
          )}

          <button
            onClick={handleClearResults}
            className="clear-button"
            disabled={testState.isLoading}
          >
            <span className="icon">🧹</span>
            Clear Results
          </button>
        </div>
      </div>

      {/* Analysis Results */}
      {testState.analysisResult && (
        <div className="analysis-results">
          <h4>📈 Analysis Results</h4>
          <div className="analysis-grid">
            <div className="analysis-item">
              <span className="label">Model:</span>
              <span className="value">{testState.analysisResult.model}</span>
            </div>
            <div className="analysis-item">
              <span className="label">Input File:</span>
              <span className="value">{testState.analysisResult.input_file}</span>
            </div>
            <div className="analysis-item">
              <span className="label">Input Size:</span>
              <span className="value">{testState.analysisResult.input_size_mb} MB</span>
            </div>
            <div className="analysis-item">
              <span className="label">Vocal Size:</span>
              <span className="value">{testState.analysisResult.vocal_size_mb} MB</span>
            </div>
            <div className="analysis-item">
              <span className="label">Accompaniment Size:</span>
              <span className="value">{testState.analysisResult.accompaniment_size_mb} MB</span>
            </div>
            <div className="analysis-item">
              <span className="label">Vocal Extracted:</span>
              <span className={`value ${testState.analysisResult.vocal_extracted ? 'success' : 'error'}`}>
                {testState.analysisResult.vocal_extracted ? '✅ Yes' : '❌ No'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="instructions">
        <h4>ℹ️ How to Test</h4>
        <ol>
          <li><strong>Analyze Separation:</strong> Get info about the separation process without playing audio</li>
          <li><strong>Test & Play Vocals:</strong> Separate vocals and automatically play the result (background removed)</li>
          <li><strong>Compare:</strong> Play original audio for 10 seconds, then play separated vocals for comparison</li>
        </ol>
        <p className="note">
          <strong>Note:</strong> Make sure the Python backend is running on port 5000 for vocal separation to work.
        </p>
      </div>

      <style jsx>{`
        .vocal-test-view {
          width: 100%;
          max-width: 700px;
          margin: 0 auto;
          padding: 20px;
          background: #1a1a1a;
          border-radius: 10px;
          margin-bottom: 20px;
        }

        .vocal-test-view h3 {
          color: #fff;
          text-align: center;
          margin-bottom: 20px;
        }

        .test-status {
          padding: 12px 16px;
          border-radius: 6px;
          text-align: center;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .test-status.status-loading {
          background: rgba(33, 150, 243, 0.1);
          border: 1px solid #2196F3;
          color: #2196F3;
        }

        .test-status.status-success {
          background: rgba(76, 175, 80, 0.1);
          border: 1px solid #4CAF50;
          color: #4CAF50;
        }

        .test-status.status-error {
          background: rgba(244, 67, 54, 0.1);
          border: 1px solid #f44336;
          color: #f44336;
        }

        .loading-spinner {
          animation: spin 1s linear infinite;
        }

        .error-message {
          background: rgba(244, 67, 54, 0.1);
          border: 1px solid #f44336;
          color: #f44336;
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          text-align: center;
        }

        .test-controls {
          margin-bottom: 30px;
        }

        .test-buttons,
        .control-buttons {
          display: flex;
          gap: 15px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 15px;
        }

        .test-buttons button {
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          color: white;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 160px;
          justify-content: center;
        }

        .analyze-button {
          background: #2196F3;
        }

        .analyze-button:hover:not(:disabled) {
          background: #1976D2;
        }

        .test-button {
          background: #4CAF50;
        }

        .test-button:hover:not(:disabled) {
          background: #45a049;
        }

        .compare-button {
          background: #FF9800;
        }

        .compare-button:hover:not(:disabled) {
          background: #F57C00;
        }

        .control-buttons button {
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          color: white;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .stop-button {
          background: #f44336;
        }

        .stop-button:hover:not(:disabled) {
          background: #d32f2f;
        }

        .clear-button {
          background: #666;
        }

        .clear-button:hover:not(:disabled) {
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

        .analysis-results {
          background: #2a2a2a;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
        }

        .analysis-results h4 {
          color: #fff;
          margin-bottom: 15px;
          text-align: center;
        }

        .analysis-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .analysis-item {
          display: flex;
          justify-content: space-between;
          padding: 10px;
          background: #1a1a1a;
          border-radius: 6px;
        }

        .label {
          color: #ccc;
          font-weight: 500;
        }

        .value {
          color: #fff;
          font-weight: bold;
        }

        .value.success {
          color: #4CAF50;
        }

        .value.error {
          color: #f44336;
        }

        .instructions {
          background: #2a2a2a;
          border-radius: 8px;
          padding: 20px;
        }

        .instructions h4 {
          color: #fff;
          margin-bottom: 15px;
        }

        .instructions ol {
          color: #ccc;
          margin-bottom: 15px;
          padding-left: 20px;
        }

        .instructions ol li {
          margin-bottom: 8px;
          line-height: 1.4;
        }

        .instructions strong {
          color: #fff;
        }

        .note {
          color: #ff9800;
          font-style: italic;
          margin: 0;
          padding: 10px;
          background: rgba(255, 152, 0, 0.1);
          border-radius: 6px;
          border-left: 3px solid #ff9800;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 600px) {
          .vocal-test-view {
            padding: 15px;
          }

          .test-buttons,
          .control-buttons {
            flex-direction: column;
            align-items: center;
          }

          .test-buttons button {
            min-width: 200px;
          }

          .analysis-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default VocalTestView;