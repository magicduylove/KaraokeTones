/**
 * AudioImportView - View component for audio file import functionality
 */

import React, { useRef } from 'react';

const AudioImportView = ({
  audioFile,
  onAudioImport,
  onAudioRemove,
  audioInfo,
  isLoading = false
}) => {
  const fileInputRef = useRef();

  /**
   * Handle file selection
   */
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && onAudioImport) {
      onAudioImport(file);
    }
  };

  /**
   * Open file dialog
   */
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  /**
   * Handle file removal
   */
  const handleRemoveFile = () => {
    if (onAudioRemove) {
      onAudioRemove();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="audio-import-view">
      <div className="file-input-container">
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          id="audio-file-input"
          disabled={isLoading}
        />

        {!audioFile ? (
          <div className="empty-state">
            <div className="upload-area" onClick={openFileDialog}>
              <div className="upload-icon">🎵</div>
              <h3>Choose Audio File</h3>
              <p>Upload your backing track to practice with</p>
              <div className="supported-formats">
                <small>Supported: MP3, WAV, OGG, M4A</small>
              </div>
            </div>
          </div>
        ) : (
          <div className="current-file">
            <div className="file-header">
              <span className="file-icon">🎵</span>
              <div className="file-details">
                <h4>{audioInfo?.name || audioFile.name}</h4>
                <div className="file-meta">
                  {audioInfo?.size && <span>Size: {audioInfo.size}</span>}
                  {audioInfo?.duration && <span> • Duration: {audioInfo.duration}</span>}
                </div>
              </div>
            </div>

            <div className="file-actions">
              <button
                onClick={openFileDialog}
                className="secondary-button"
                disabled={isLoading}
              >
                🔄 Change File
              </button>
              <button
                onClick={handleRemoveFile}
                className="danger-button"
                disabled={isLoading}
              >
                🗑️ Remove
              </button>
            </div>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <span>Loading audio file...</span>
        </div>
      )}

      <div className="tips">
        <h4>💡 Tips for Better Practice:</h4>
        <ul>
          <li>Use instrumental or backing track versions</li>
          <li>Choose songs in your vocal range</li>
          <li>Ensure good audio quality for better detection</li>
        </ul>
      </div>

      <style jsx>{`
        .audio-import-view {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
        }

        .file-input-container input[type="file"] {
          display: none;
        }

        .empty-state {
          margin: 20px 0;
        }

        .upload-area {
          border: 2px dashed #666;
          border-radius: 10px;
          padding: 40px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #1a1a1a;
        }

        .upload-area:hover {
          border-color: #4CAF50;
          background: #252525;
        }

        .upload-icon {
          font-size: 3em;
          margin-bottom: 15px;
        }

        .upload-area h3 {
          margin: 10px 0;
          color: #fff;
        }

        .upload-area p {
          color: #ccc;
          margin: 10px 0;
        }

        .supported-formats {
          margin-top: 15px;
        }

        .supported-formats small {
          color: #999;
          font-size: 0.9em;
        }

        .current-file {
          background: #2a2a2a;
          border-radius: 10px;
          padding: 20px;
          margin: 20px 0;
        }

        .file-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 15px;
        }

        .file-icon {
          font-size: 2em;
        }

        .file-details h4 {
          margin: 0 0 5px 0;
          color: #4CAF50;
          word-break: break-word;
        }

        .file-meta {
          color: #ccc;
          font-size: 0.9em;
        }

        .file-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
        }

        .secondary-button {
          padding: 8px 16px;
          background: #555;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .secondary-button:hover {
          background: #666;
        }

        .danger-button {
          padding: 8px 16px;
          background: #f44336;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .danger-button:hover {
          background: #d32f2f;
        }

        .secondary-button:disabled,
        .danger-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .loading-state {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 20px;
          color: #4CAF50;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #333;
          border-top: 2px solid #4CAF50;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .tips {
          background: #1a1a1a;
          border-radius: 10px;
          padding: 20px;
          margin-top: 20px;
        }

        .tips h4 {
          margin: 0 0 10px 0;
          color: #4CAF50;
        }

        .tips ul {
          margin: 0;
          padding-left: 20px;
          color: #ccc;
        }

        .tips li {
          margin: 5px 0;
          font-size: 0.9em;
        }
      `}</style>
    </div>
  );
};

export default AudioImportView;