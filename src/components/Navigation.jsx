/**
 * Navigation - Main navigation component for route management
 */

import React from 'react';
import { NavLink } from 'react-router-dom';

const Navigation = () => {
  return (
    <nav className="main-navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <h1>🎤 PitchKaraoke</h1>
          <span className="nav-tagline">Practice singing with real-time pitch detection</span>
        </div>

        <div className="nav-links">
          <NavLink
            to="/"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            end
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Home</span>
          </NavLink>

          <NavLink
            to="/practice"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">🎵</span>
            <span className="nav-text">Practice</span>
          </NavLink>

          <NavLink
            to="/vocal-test"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">🧪</span>
            <span className="nav-text">Vocal Test</span>
          </NavLink>

          <NavLink
            to="/analysis"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Analysis</span>
          </NavLink>
        </div>
      </div>

      <style jsx>{`
        .main-navigation {
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          border-bottom: 2px solid #333;
          padding: 0;
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
        }

        .nav-brand h1 {
          color: #4CAF50;
          margin: 0;
          font-size: 1.8rem;
          font-weight: bold;
        }

        .nav-tagline {
          color: #ccc;
          font-size: 0.9rem;
          display: block;
          margin-top: 2px;
        }

        .nav-links {
          display: flex;
          gap: 0;
          align-items: center;
        }

        .nav-link {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px 20px;
          text-decoration: none;
          color: #ccc;
          transition: all 0.3s ease;
          border-radius: 8px;
          margin: 0 5px;
          position: relative;
          background: transparent;
        }

        .nav-link:hover {
          color: #4CAF50;
          background: rgba(76, 175, 80, 0.1);
          transform: translateY(-2px);
        }

        .nav-link.active {
          color: #4CAF50;
          background: rgba(76, 175, 80, 0.15);
          box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
        }

        .nav-link.active::before {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 50%;
          transform: translateX(-50%);
          width: 30px;
          height: 3px;
          background: #4CAF50;
          border-radius: 2px;
        }

        .nav-icon {
          font-size: 1.4rem;
          line-height: 1;
        }

        .nav-text {
          font-size: 0.85rem;
          font-weight: 500;
          line-height: 1;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .nav-container {
            flex-direction: column;
            gap: 15px;
            padding: 15px;
          }

          .nav-brand h1 {
            font-size: 1.5rem;
            text-align: center;
          }

          .nav-tagline {
            text-align: center;
            font-size: 0.8rem;
          }

          .nav-links {
            justify-content: center;
            flex-wrap: wrap;
          }

          .nav-link {
            padding: 10px 15px;
            margin: 2px;
          }

          .nav-icon {
            font-size: 1.2rem;
          }

          .nav-text {
            font-size: 0.8rem;
          }
        }

        @media (max-width: 480px) {
          .nav-links {
            width: 100%;
            justify-content: space-around;
          }

          .nav-link {
            flex: 1;
            max-width: 80px;
            padding: 8px 5px;
            margin: 1px;
          }

          .nav-text {
            font-size: 0.75rem;
          }
        }

        /* Animation for active state */
        @keyframes activeGlow {
          0% { box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3); }
          50% { box-shadow: 0 2px 12px rgba(76, 175, 80, 0.5); }
          100% { box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3); }
        }

        .nav-link.active {
          animation: activeGlow 2s ease-in-out infinite;
        }

        /* Hover effects */
        .nav-link:hover .nav-icon {
          transform: scale(1.1);
          transition: transform 0.2s ease;
        }

        .nav-link:hover .nav-text {
          font-weight: 600;
        }
      `}</style>
    </nav>
  );
};

export default Navigation;