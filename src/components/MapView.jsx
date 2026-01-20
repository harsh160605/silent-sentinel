import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, ZoomControl, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMapStore } from '../stores/mapStore';
import { fetchReportsInArea, fetchPatterns } from '../services/reportService';
import { requestUserLocation } from '../services/geolocation';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Color coding for risk levels
const RISK_COLORS = {
  low: '#10b981',    // Green
  medium: '#f59e0b', // Amber
  high: '#ef4444',   // Red
};

// Create custom circle marker icon
const createCircleIcon = (color, size = 18) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      border: 3px solid rgba(255, 255, 255, 0.4);
      border-radius: 50%;
      box-shadow: 0 0 15px ${color}, 0 4px 8px rgba(0,0,0,0.5);
      position: relative;
    ">
      <div style="
        position: absolute;
        inset: 0;
        border-radius: 50%;
        border: 1px solid white;
        opacity: 0.8;
      "></div>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// User location icon (Deep Blue with high-end glow)
const userLocationIcon = createCircleIcon('#3b82f6', 20);

// Mouse Position Tracking Component
function MousePosition() {
  const [coords, setCoords] = useState({ lat: 0, lng: 0 });
  const map = useMap();

  useEffect(() => {
    const handleMouseMove = (e) => {
      setCoords(e.latlng);
    };
    map.on('mousemove', handleMouseMove);
    return () => map.off('mousemove', handleMouseMove);
  }, [map]);

  return (
    <div className="map-coords-display">
      <span className="coord-label">LAT:</span>
      <span className="coord-val">{coords.lat.toFixed(5)}</span>
      <span className="coord-divider">|</span>
      <span className="coord-label">LNG:</span>
      <span className="coord-val">{coords.lng.toFixed(5)}</span>
    </div>
  );
}

// Map events component
function MapEvents({ onCenterChange }) {
  const map = useMap();

  useEffect(() => {
    const handleMoveEnd = () => {
      const center = map.getCenter();
      onCenterChange({
        lat: center.lat,
        lng: center.lng,
      });
    };

    map.on('moveend', handleMoveEnd);
    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [map, onCenterChange]);

  return null;
}

// Component to handle programmatic map recentering
function RecenterMap({ location }) {
  const map = useMap();
  const hasCentered = useRef(false);

  useEffect(() => {
    if (location && !hasCentered.current) {
      map.setView([location.lat, location.lng], 14);
      hasCentered.current = true;
    }
  }, [location, map]);

  return null;
}

const MapView = () => {
  const {
    center,
    setCenter,
    zoom,
    userLocation,
    setUserLocation,
    selectedLayers,
    reports,
    setReports,
    patterns,
    setPatterns,
  } = useMapStore();

  const [loading, setLoading] = useState(false);
  const [initialCenter, setInitialCenter] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const isInitialized = useRef(false);

  // Request user location on mount
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    requestUserLocation()
      .then((location) => {
        setUserLocation(location);
        setCenter({ lat: location.lat, lng: location.lng });
        setInitialCenter({ lat: location.lat, lng: location.lng });
      })
      .catch((error) => {
        console.warn('Location permission denied or unavailable:', error.message);
        // Use default location (India)
        setInitialCenter({ lat: 20.5937, lng: 78.9629 });
      });
  }, [setUserLocation, setCenter]);

  // Load reports for current map area
  useEffect(() => {
    if (!center) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [reportsData, patternsData] = await Promise.all([
          fetchReportsInArea(center, 5).catch(() => []),
          fetchPatterns(center).catch(() => []),
        ]);
        setReports(reportsData || []);
        setPatterns(patternsData || []);
      } catch (error) {
        console.error('Error loading map data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the data loading
    const timeoutId = setTimeout(loadData, 500);
    return () => clearTimeout(timeoutId);
  }, [center, setReports, setPatterns]);

  // Stable callback for center changes
  const handleCenterChange = useCallback((newCenter) => {
    setCenter(newCenter);
  }, [setCenter]);

  // Default center
  const mapCenter = initialCenter || center || { lat: 20.5937, lng: 78.9629 };

  // Wait for initial center to be set
  if (!mapCenter) {
    return (
      <div className="map-container">
        <div className="map-loading">
          <div className="map-loading-spinner"></div>
          <p>ESTABLISHING SECURE PROTOCOL...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`map-container ${darkMode ? 'map-dark-mode' : 'map-light-mode'}`}>
      <div className="map-vignette"></div>
      <div className="map-center-crosshair"></div>

      {/* Dark Mode Toggle Button */}
      <button 
        className="dark-mode-toggle"
        onClick={() => setDarkMode(!darkMode)}
        title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label="Toggle dark mode"
      >
        {darkMode ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        )}
      </button>

      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={darkMode 
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          }
        />

        <ZoomControl position="bottomright" />
        <MousePosition />
        <MapEvents onCenterChange={handleCenterChange} />
        <RecenterMap location={userLocation} />

        {/* User location marker */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userLocationIcon}
          />
        )}

        {/* Report markers - Perception Layer */}
        {selectedLayers.perception &&
          reports
            .filter((r) => r.reportType === 'perception')
            .map((report) => (
              <Circle
                key={report.id}
                center={[report.location.lat, report.location.lng]}
                radius={150}
                pathOptions={{
                  fillColor: RISK_COLORS[report.riskLevel],
                  fillOpacity: 0.15,
                  color: RISK_COLORS[report.riskLevel],
                  opacity: 0.4,
                  weight: 2,
                  dashArray: '5, 10',
                  lineCap: 'round'
                }}
              />
            ))}

        {/* Report markers - Crime Layer */}
        {selectedLayers.crime &&
          reports
            .filter((r) => r.reportType === 'crime')
            .map((report) => (
              <Marker
                key={report.id}
                position={[report.location.lat, report.location.lng]}
                icon={createCircleIcon(RISK_COLORS[report.riskLevel], 20)}
              >
                <Popup className="premium-popup">
                  <div className="popup-card">
                    <div className={`popup-risk-badge ${report.riskLevel}`}>
                      {report.riskLevel.toUpperCase()} RISK
                    </div>
                    <div className="popup-content-main">
                      <h4 className="popup-title">{report.category || 'Incident Report'}</h4>
                      <p className="popup-desc">{report.description}</p>
                      <div className="popup-footer">
                        <span className="popup-time">
                          {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {report.confirmCount > 0 && (
                          <span className="popup-confirmed">
                            • {report.confirmCount} Confirmed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

        {/* Pattern clusters */}
        {selectedLayers.patterns &&
          patterns.map((pattern) => (
            <Circle
              key={pattern.id}
              center={[pattern.location.lat, pattern.location.lng]}
              radius={pattern.radius || 200}
              pathOptions={{
                fillColor: '#8b5cf6',
                fillOpacity: 0.15 * pattern.confidence,
                color: '#8b5cf6',
                opacity: 0.6,
                weight: 2,
              }}
            />
          ))}
      </MapContainer>

      {loading && (
        <div className="map-overlay">
          <div className="spinner-small"></div>
        </div>
      )}
    </div>
  );
};

export default MapView;
