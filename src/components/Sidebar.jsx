import React, { useState, useRef, useEffect } from 'react';
import { useMapStore } from '../stores/mapStore';
import {
  AlertTriangle,
  Shield,
  Eye,
  TrendingUp,
  Plus,
  Info,
  Layers,
  ChevronDown,
  BarChart3,
  Lock,
  Activity,
  Users,
  Star
} from 'lucide-react';

import logo from '../assets/logo.png';

const Sidebar = ({ onGoHome, onCreateReport, onToggleFeed, feedOpen, onToggleGroups, groupsOpen, onRate }) => {
  const { selectedLayers, toggleLayer, reports } = useMapStore();
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  // Calculate statistics
  const stats = {
    total: reports.length,
    high: reports.filter((r) => r.riskLevel === 'high').length,
    medium: reports.filter((r) => r.riskLevel === 'medium').length,
    low: reports.filter((r) => r.riskLevel === 'low').length,
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (dropdown) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  return (
    <nav className="dashboard-nav" ref={dropdownRef}>
      <div className="nav-left">
        <div className="nav-brand" onClick={onGoHome} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="Logo" className="nav-logo-img" />
          <div className="brand-text">
            <span className="brand-name">SENTINEL</span>
            <span className="brand-status">GROUND ZERO</span>
          </div>
        </div>
      </div>

      <div className="nav-center">
        {/* Create Report Button - Prominent */}
        <button className="btn-action-primary" onClick={onCreateReport}>
          <Plus size={16} strokeWidth={3} />
          <span>REPORT INCIDENT</span>
        </button>

        <div className="nav-v-divider"></div>

        {/* Core Toggles */}
        <div className="toggle-group">
          <button
            className={`nav-icon-btn ${feedOpen ? 'active' : ''}`}
            onClick={onToggleFeed}
            title="Activity Feed"
          >
            <Activity size={20} />
            <span className="btn-label">Activity</span>
          </button>

          <button
            className={`nav-icon-btn ${groupsOpen ? 'active' : ''}`}
            onClick={onToggleGroups}
            title="Community Groups"
          >
            <Users size={20} />
            <span className="btn-label">Groups</span>
          </button>

          <button
            className="nav-icon-btn"
            onClick={onRate}
            title="Rate Current Area"
          >
            <Star size={20} />
            <span className="btn-label">Rate Area</span>
          </button>
        </div>
      </div>

      <div className="nav-right">
        {/* Stats Summary Bubble */}
        <div className="nav-stats-bubble" onClick={() => toggleDropdown('stats')}>
          <div className="stats-dot pulse"></div>
          <span className="stats-count">{stats.total} REPORTS LIVE</span>
          <ChevronDown size={14} className={openDropdown === 'stats' ? 'rotated' : ''} />

          {openDropdown === 'stats' && (
            <div className="nav-panel-stats">
              <div className="panel-row">
                <span>High Risk</span>
                <span className="val-high">{stats.high}</span>
              </div>
              <div className="panel-row">
                <span>Moderate</span>
                <span className="val-med">{stats.medium}</span>
              </div>
              <div className="panel-row">
                <span>Safe/Info</span>
                <span className="val-low">{stats.low}</span>
              </div>
            </div>
          )}
        </div>

        <div className="nav-v-divider"></div>

        {/* Map Layers Dropdown */}
        <button
          className={`nav-icon-btn ${openDropdown === 'layers' ? 'active' : ''}`}
          onClick={() => toggleDropdown('layers')}
        >
          <Layers size={20} />
        </button>

        {openDropdown === 'layers' && (
          <div className="nav-panel-layers">
            <div className="panel-header">
              <Layers size={14} />
              <span>MAP LAYERS</span>
            </div>

            <div className={`layer-item ${selectedLayers.perception ? 'active' : ''}`} onClick={() => toggleLayer('perception')}>
              <div className="layer-visual">
                <Eye size={18} className="layer-icon-svg" />
              </div>
              <div className="layer-label">
                <span>Perception</span>
                <small>User-reported safety feels</small>
              </div>
              <div className={`layer-toggle-switch ${selectedLayers.perception ? 'on' : ''}`}></div>
            </div>

            <div className={`layer-item ${selectedLayers.crime ? 'active' : ''}`} onClick={() => toggleLayer('crime')}>
              <div className="layer-visual">
                <Shield size={18} className="layer-icon-svg" />
              </div>
              <div className="layer-label">
                <span>Verified Incidents</span>
                <small>Confirmed security reports</small>
              </div>
              <div className={`layer-toggle-switch ${selectedLayers.crime ? 'on' : ''}`}></div>
            </div>

            <div className={`layer-item ${selectedLayers.patterns ? 'active' : ''}`} onClick={() => toggleLayer('patterns')}>
              <div className="layer-visual">
                <TrendingUp size={18} className="layer-icon-svg" />
              </div>
              <div className="layer-label">
                <span>Intelligence Patterns</span>
                <small>AI-cluster analysis</small>
              </div>
              <div className={`layer-toggle-switch ${selectedLayers.patterns ? 'on' : ''}`}></div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Sidebar;
