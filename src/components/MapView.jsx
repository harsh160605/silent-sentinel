import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
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
const createCircleIcon = (color, size = 16) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// User location icon (blue)
const userLocationIcon = createCircleIcon('#3b82f6', 16);

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
          <div className="spinner-small"></div>
          <p>Initializing map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="map-container">
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

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
                radius={100}
                pathOptions={{
                  fillColor: RISK_COLORS[report.riskLevel],
                  fillOpacity: 0.2,
                  color: RISK_COLORS[report.riskLevel],
                  opacity: 0.5,
                  weight: 1,
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
              />
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
