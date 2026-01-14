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

const Sidebar = ({ onCreateReport, onToggleFeed, feedOpen, onToggleGroups, groupsOpen, onRate }) => {
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
    <nav className="top-nav" ref={dropdownRef}>
      <div className="nav-content">
        {/* Create Report Button */}
        <button className="btn-create-report" onClick={onCreateReport}>
          <Plus size={18} />
          <span>Report Concern</span>
        </button>

        {/* Activity Feed Toggle */}
        <button
          className={`nav-dropdown-trigger ${feedOpen ? 'active' : ''}`}
          onClick={onToggleFeed}
        >
          <Activity size={18} />
          <span>Activity</span>
        </button>

        {/* Groups Toggle */}
        <button
          className={`nav-dropdown-trigger ${groupsOpen ? 'active' : ''}`}
          onClick={onToggleGroups}
        >
          <Users size={18} />
          <span>Groups</span>
        </button>

        {/* Rate Area */}
        <button
          className="nav-dropdown-trigger"
          onClick={onRate}
        >
          <Star size={18} />
          <span>Rate</span>
        </button>

        {/* Divider */}
        <div className="nav-divider"></div>

        {/* Map Layers Dropdown */}
        <div className="nav-dropdown">
          <button
            className={`nav-dropdown-trigger ${openDropdown === 'layers' ? 'active' : ''}`}
            onClick={() => toggleDropdown('layers')}
          >
            <Layers size={18} />
            <span>Map Layers</span>
            <ChevronDown size={16} className={`chevron ${openDropdown === 'layers' ? 'rotated' : ''}`} />
          </button>

          {openDropdown === 'layers' && (
            <div className="nav-dropdown-panel">
              <div className="dropdown-header">
                <Layers size={16} />
                <span>Toggle Map Layers</span>
              </div>

              <label className="layer-toggle">
                <input
                  type="checkbox"
                  checked={selectedLayers.perception}
                  onChange={() => toggleLayer('perception')}
                />
                <div className="layer-info">
                  <Eye size={16} className="layer-icon perception" />
                  <div>
                    <span className="layer-name">Perception Layer</span>
                    <span className="layer-desc">User feels unsafe</span>
                  </div>
                </div>
              </label>

              <label className="layer-toggle">
                <input
                  type="checkbox"
                  checked={selectedLayers.crime}
                  onChange={() => toggleLayer('crime')}
                />
                <div className="layer-info">
                  <AlertTriangle size={16} className="layer-icon crime" />
                  <div>
                    <span className="layer-name">Crime Reports</span>
                    <span className="layer-desc">Verified incidents</span>
                  </div>
                </div>
              </label>

              <label className="layer-toggle">
                <input
                  type="checkbox"
                  checked={selectedLayers.patterns}
                  onChange={() => toggleLayer('patterns')}
                />
                <div className="layer-info">
                  <TrendingUp size={16} className="layer-icon patterns" />
                  <div>
                    <span className="layer-name">Pattern Detection</span>
                    <span className="layer-desc">AI-detected clusters</span>
                  </div>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Statistics Dropdown */}
        <div className="nav-dropdown">
          <button
            className={`nav-dropdown-trigger ${openDropdown === 'stats' ? 'active' : ''}`}
            onClick={() => toggleDropdown('stats')}
          >
            <BarChart3 size={18} />
            <span>Statistics</span>
            <span className="stat-badge">{stats.total}</span>
            <ChevronDown size={16} className={`chevron ${openDropdown === 'stats' ? 'rotated' : ''}`} />
          </button>

          {openDropdown === 'stats' && (
            <div className="nav-dropdown-panel stats-panel">
              <div className="dropdown-header">
                <Shield size={16} />
                <span>Active Reports</span>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-value">{stats.total}</span>
                  <span className="stat-label">Total</span>
                </div>
                <div className="stat-card stat-high">
                  <span className="stat-value">{stats.high}</span>
                  <span className="stat-label">High Risk</span>
                </div>
                <div className="stat-card stat-medium">
                  <span className="stat-value">{stats.medium}</span>
                  <span className="stat-label">Medium</span>
                </div>
                <div className="stat-card stat-low">
                  <span className="stat-value">{stats.low}</span>
                  <span className="stat-label">Low</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Legend Dropdown */}
        <div className="nav-dropdown">
          <button
            className={`nav-dropdown-trigger ${openDropdown === 'legend' ? 'active' : ''}`}
            onClick={() => toggleDropdown('legend')}
          >
            <Info size={18} />
            <span>Legend</span>
            <ChevronDown size={16} className={`chevron ${openDropdown === 'legend' ? 'rotated' : ''}`} />
          </button>

          {openDropdown === 'legend' && (
            <div className="nav-dropdown-panel legend-panel">
              <div className="dropdown-header">
                <Info size={16} />
                <span>Risk Level Colors</span>
              </div>

              <div className="legend">
                <div className="legend-item">
                  <div className="legend-color high"></div>
                  <div>
                    <span className="legend-name">High Risk</span>
                    <span className="legend-desc">Immediate safety concern</span>
                  </div>
                </div>
                <div className="legend-item">
                  <div className="legend-color medium"></div>
                  <div>
                    <span className="legend-name">Medium Risk</span>
                    <span className="legend-desc">Caution advised</span>
                  </div>
                </div>
                <div className="legend-item">
                  <div className="legend-color low"></div>
                  <div>
                    <span className="legend-name">Low Risk</span>
                    <span className="legend-desc">Minor concern</span>
                  </div>
                </div>
                <div className="legend-item">
                  <div className="legend-color pattern"></div>
                  <div>
                    <span className="legend-name">Pattern Detected</span>
                    <span className="legend-desc">Multiple reports clustered</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Privacy Badge */}
        <div className="privacy-badge">
          <Lock size={14} />
          <span>Anonymous • Auto-expire 30d</span>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
