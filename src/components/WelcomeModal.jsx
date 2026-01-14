import React from 'react';
import { Shield, Eye, Lock, Clock, Users, AlertTriangle } from 'lucide-react';

const WelcomeModal = ({ onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-welcome" onClick={(e) => e.stopPropagation()}>
        <div className="welcome-header">
          <Shield size={48} className="welcome-icon" />
          <h1>Welcome to Silent Sentinel</h1>
          <p className="welcome-tagline">Privacy-first community safety intelligence</p>
        </div>

        <div className="welcome-principles">
          <h3>Core Principles</h3>
          <div className="principles-grid">
            <div className="principle-card">
              <Lock size={24} />
              <h4>Anonymous & Private</h4>
              <p>No usernames, no profiles, no tracking</p>
            </div>
            <div className="principle-card">
              <Clock size={24} />
              <h4>Auto-Expiring</h4>
              <p>Reports disappear after 30 days</p>
            </div>
            <div className="principle-card">
              <Eye size={24} />
              <h4>Consent-Based</h4>
              <p>You control your location data</p>
            </div>
            <div className="principle-card">
              <Users size={24} />
              <h4>Community Driven</h4>
              <p>Collective intelligence, not surveillance</p>
            </div>
          </div>
        </div>

        <div className="welcome-features">
          <h3>What This Is NOT</h3>
          <div className="not-list">
            <div className="not-item">
              <AlertTriangle size={18} />
              <span>NOT a crime-tracking app</span>
            </div>
            <div className="not-item">
              <AlertTriangle size={18} />
              <span>NOT a social media platform</span>
            </div>
            <div className="not-item">
              <AlertTriangle size={18} />
              <span>NOT a tool for vigilantism</span>
            </div>
            <div className="not-item">
              <AlertTriangle size={18} />
              <span>NOT a permanent fear map</span>
            </div>
          </div>
        </div>

        <div className="welcome-usage">
          <h3>How to Use</h3>
          <ol>
            <li>
              <strong>Explore the map</strong> to see safety patterns in your area
            </li>
            <li>
              <strong>Report concerns</strong> in natural language - AI will categorize them
            </li>
            <li>
              <strong>Stay informed</strong> about higher-risk zones as you move around
            </li>
            <li>
              <strong>Join discussions</strong> in location-based anonymous chat
            </li>
          </ol>
        </div>

        <button className="btn-primary btn-large" onClick={onClose}>
          Get Started
        </button>

        <p className="welcome-footer">
          By using Silent Sentinel, you agree to use it responsibly and ethically.
        </p>
      </div>
    </div>
  );
};

export default WelcomeModal;

