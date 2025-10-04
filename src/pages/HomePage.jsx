/**
 * HomePage - Welcome and getting started page
 */

import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>Welcome to PitchKaraoke! 🎤</h1>
        <p className="hero-subtitle">
          Practice singing with real-time pitch detection and vocal separation technology
        </p>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">🎵</div>
            <h3>Real-time Pitch Detection</h3>
            <p>Get instant feedback on your singing with advanced pitch analysis</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎤</div>
            <h3>Vocal Separation</h3>
            <p>Remove background music to practice with isolated vocals using AI</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Performance Analysis</h3>
            <p>Track your progress with detailed analytics and visual feedback</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Pitch Comparison</h3>
            <p>Compare your voice with the original song for perfect practice</p>
          </div>
        </div>

        <div className="quick-start">
          <h2>Quick Start Guide</h2>
          <div className="steps">
            <div className="step">
              <span className="step-number">1</span>
              <div className="step-content">
                <h4>Import Audio</h4>
                <p>Upload your favorite song to get started</p>
              </div>
            </div>

            <div className="step">
              <span className="step-number">2</span>
              <div className="step-content">
                <h4>Start Practicing</h4>
                <p>Use the practice mode to sing along and get feedback</p>
              </div>
            </div>

            <div className="step">
              <span className="step-number">3</span>
              <div className="step-content">
                <h4>Test Vocal Separation</h4>
                <p>Try our AI-powered vocal separation tools</p>
              </div>
            </div>

            <div className="step">
              <span className="step-number">4</span>
              <div className="step-content">
                <h4>Analyze Results</h4>
                <p>Review your performance and track improvement</p>
              </div>
            </div>
          </div>
        </div>

        <div className="cta-section">
          <Link to="/practice" className="cta-button primary">
            Start Practicing Now 🎵
          </Link>
          <Link to="/vocal-test" className="cta-button secondary">
            Try Vocal Separation 🧪
          </Link>
        </div>
      </div>

      <style jsx>{`
        .home-page {
          min-height: calc(100vh - 120px);
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2a2a2a 100%);
          padding: 40px 20px;
        }

        .hero-section {
          max-width: 1200px;
          margin: 0 auto;
          text-align: center;
        }

        .hero-section h1 {
          font-size: 3.5rem;
          color: #4CAF50;
          margin-bottom: 20px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }

        .hero-subtitle {
          font-size: 1.3rem;
          color: #ccc;
          margin-bottom: 50px;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 30px;
          margin-bottom: 60px;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          padding: 30px;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(76, 175, 80, 0.2);
          border-color: rgba(76, 175, 80, 0.3);
        }

        .feature-icon {
          font-size: 3rem;
          margin-bottom: 20px;
        }

        .feature-card h3 {
          color: #fff;
          font-size: 1.4rem;
          margin-bottom: 15px;
        }

        .feature-card p {
          color: #ccc;
          line-height: 1.6;
        }

        .quick-start {
          margin-bottom: 60px;
        }

        .quick-start h2 {
          color: #fff;
          font-size: 2.2rem;
          margin-bottom: 40px;
        }

        .steps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 30px;
          max-width: 1000px;
          margin: 0 auto;
        }

        .step {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          text-align: left;
        }

        .step-number {
          background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        .step-content h4 {
          color: #4CAF50;
          font-size: 1.2rem;
          margin-bottom: 8px;
        }

        .step-content p {
          color: #ccc;
          line-height: 1.5;
          margin: 0;
        }

        .cta-section {
          display: flex;
          gap: 20px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .cta-button {
          padding: 15px 30px;
          border-radius: 10px;
          text-decoration: none;
          font-weight: 600;
          font-size: 1.1rem;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .cta-button.primary {
          background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
        }

        .cta-button.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
        }

        .cta-button.secondary {
          background: transparent;
          color: #4CAF50;
          border: 2px solid #4CAF50;
        }

        .cta-button.secondary:hover {
          background: #4CAF50;
          color: white;
          transform: translateY(-2px);
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .hero-section h1 {
            font-size: 2.5rem;
          }

          .hero-subtitle {
            font-size: 1.1rem;
          }

          .feature-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .feature-card {
            padding: 20px;
          }

          .quick-start h2 {
            font-size: 1.8rem;
          }

          .steps {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .cta-section {
            flex-direction: column;
            align-items: center;
          }

          .cta-button {
            width: 100%;
            max-width: 300px;
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .home-page {
            padding: 20px 15px;
          }

          .hero-section h1 {
            font-size: 2rem;
          }

          .hero-subtitle {
            font-size: 1rem;
          }

          .step {
            flex-direction: column;
            text-align: center;
          }

          .step-content {
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;