import React, { useEffect, useState, useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Circle, InfoWindow, Autocomplete } from '@react-google-maps/api';
import { useMapStore } from '../stores/mapStore';
import { fetchReportsInArea, fetchPatterns } from '../services/reportService';
import { requestUserLocation } from '../services/geolocation';
import { Search, X, MapPin } from 'lucide-react';

// Libraries to load
const libraries = ['places'];

// Color coding for risk levels
const RISK_COLORS = {
  low: '#10b981',    // Green
  medium: '#f59e0b', // Amber
  high: '#ef4444',   // Red
};

// Map container style
const containerStyle = {
  width: '100%',
  height: '100%'
};

// Dark mode map styles
const darkModeStyles = [
  { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
  {
    featureType: "administrative.country",
    elementType: "geometry.stroke",
    stylers: [{ color: "#4b6878" }],
  },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [{ color: "#64779e" }],
  },
  {
    featureType: "administrative.province",
    elementType: "geometry.stroke",
    stylers: [{ color: "#4b6878" }],
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry.stroke",
    stylers: [{ color: "#334e87" }],
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [{ color: "#023e58" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#283d6a" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6f9ba5" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#1d2c4d" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry.fill",
    stylers: [{ color: "#023e58" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3C7680" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#304a7d" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#98a5be" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#1d2c4d" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#2c6675" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#255763" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#b0d5ce" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#023e58" }],
  },
  {
    featureType: "transit",
    elementType: "labels.text.fill",
    stylers: [{ color: "#98a5be" }],
  },
  {
    featureType: "transit",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#1d2c4d" }],
  },
  {
    featureType: "transit.line",
    elementType: "geometry.fill",
    stylers: [{ color: "#283d6a" }],
  },
  {
    featureType: "transit.station",
    elementType: "geometry",
    stylers: [{ color: "#3a4762" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0e1626" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4e6d70" }],
  },
];

// Light mode styles
const lightModeStyles = [
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
];

const MapView = () => {
  const {
    center,
    setCenter,
    zoom,
    setZoom,
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
  const [selectedReport, setSelectedReport] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [mouseCoords, setMouseCoords] = useState({ lat: 0, lng: 0 });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [autocomplete, setAutocomplete] = useState(null);
  const isInitialized = useRef(false);
  const searchInputRef = useRef(null);

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Use the hook with Places library
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

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
        setInitialCenter({ lat: 20.5937, lng: 78.9629 });
      });
  }, [setUserLocation, setCenter]);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

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

    const timeoutId = setTimeout(loadData, 500);
    return () => clearTimeout(timeoutId);
  }, [center, setReports, setPatterns]);

  // Handle map center change
  const handleCenterChanged = useCallback(() => {
    if (mapInstance) {
      const newCenter = mapInstance.getCenter();
      if (newCenter) {
        setCenter({
          lat: newCenter.lat(),
          lng: newCenter.lng(),
        });
      }
    }
  }, [mapInstance, setCenter]);

  // Handle mouse move for coordinates display
  const handleMouseMove = useCallback((e) => {
    if (e.latLng) {
      setMouseCoords({
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      });
    }
  }, []);

  // Map load callback
  const onMapLoad = useCallback((map) => {
    setMapInstance(map);
  }, []);

  // Autocomplete load callback
  const onAutocompleteLoad = useCallback((autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
  }, []);

  // Handle place selection
  const onPlaceChanged = useCallback(() => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const newCenter = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setCenter(newCenter);
        setInitialCenter(newCenter);

        // Zoom in on the selected location
        if (mapInstance) {
          mapInstance.panTo(newCenter);
          mapInstance.setZoom(15);
        }

        setSearchValue(place.formatted_address || place.name || '');
        setSearchOpen(false);
      }
    }
  }, [autocomplete, mapInstance, setCenter]);

  // Handle search toggle
  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
    if (!searchOpen) {
      setSearchValue('');
    }
  };

  // Close search on escape
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setSearchOpen(false);
      setSearchValue('');
    }
  };

  // Default center
  const mapCenter = initialCenter || center || { lat: 20.5937, lng: 78.9629 };

  // Create marker icon
  const createMarkerIcon = useCallback((color) => {
    if (!isLoaded || !window.google) return null;
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3,
      scale: 10,
    };
  }, [isLoaded]);

  // User location icon
  const userLocationIcon = useCallback(() => {
    if (!isLoaded || !window.google) return null;
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: '#3b82f6',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3,
      scale: 12,
    };
  }, [isLoaded]);

  // Show error if API key is missing or load failed
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="map-container">
        <div className="map-loading">
          <p style={{ color: '#ef4444', marginBottom: '0.5rem' }}>⚠️ Google Maps API Key not configured</p>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
            Add VITE_GOOGLE_MAPS_API_KEY to your .env file
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="map-container">
        <div className="map-loading">
          <p style={{ color: '#ef4444', marginBottom: '0.5rem' }}>⚠️ Error loading Google Maps</p>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
            {loadError.message}
          </p>
        </div>
      </div>
    );
  }

  // Show loading while Google Maps is loading
  if (!isLoaded) {
    return (
      <div className="map-container">
        <div className="map-loading">
          <div className="map-loading-spinner"></div>
          <p>Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`map-container ${darkMode ? 'map-dark-mode' : 'map-light-mode'}`}>
      <div className="map-vignette"></div>
      <div className="map-center-crosshair"></div>

      {/* Search Bar */}
      <div className={`map-search-container ${searchOpen ? 'open' : ''}`}>
        {searchOpen ? (
          <div className="map-search-box">
            <MapPin size={18} className="search-icon" />
            <Autocomplete
              onLoad={onAutocompleteLoad}
              onPlaceChanged={onPlaceChanged}
              options={{
                types: ['geocode', 'establishment'],
                fields: ['geometry', 'formatted_address', 'name'],
              }}
            >
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for a location..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="map-search-input"
              />
            </Autocomplete>
            <button className="search-close-btn" onClick={toggleSearch}>
              <X size={18} />
            </button>
          </div>
        ) : (
          <button className="map-search-btn" onClick={toggleSearch} title="Search location">
            <Search size={20} />
          </button>
        )}
      </div>

      {/* Coordinates Display */}
      <div className="map-coords-display">
        <span className="coord-label">LAT:</span>
        <span className="coord-val">{mouseCoords.lat.toFixed(5)}</span>
        <span className="coord-divider">|</span>
        <span className="coord-label">LNG:</span>
        <span className="coord-val">{mouseCoords.lng.toFixed(5)}</span>
      </div>

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

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={zoom}
        onLoad={onMapLoad}
        onDragEnd={handleCenterChanged}
        onMouseMove={handleMouseMove}
        options={{
          styles: darkMode ? darkModeStyles : lightModeStyles,
          disableDefaultUI: false,
          zoomControl: true,
          zoomControlOptions: {
            position: window.google?.maps?.ControlPosition?.RIGHT_BOTTOM,
          },
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        }}
      >
        {/* User location marker */}
        {userLocation && userLocationIcon() && (
          <Marker
            position={{ lat: userLocation.lat, lng: userLocation.lng }}
            icon={userLocationIcon()}
            title="Your Location"
          />
        )}

        {/* Report markers - Perception Layer (as circles) */}
        {selectedLayers.perception &&
          reports
            .filter((r) => r.reportType === 'perception')
            .map((report) => (
              <Circle
                key={report.id}
                center={{ lat: report.location.lat, lng: report.location.lng }}
                radius={150}
                options={{
                  fillColor: RISK_COLORS[report.riskLevel],
                  fillOpacity: 0.15,
                  strokeColor: RISK_COLORS[report.riskLevel],
                  strokeOpacity: 0.4,
                  strokeWeight: 2,
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
                position={{ lat: report.location.lat, lng: report.location.lng }}
                icon={createMarkerIcon(RISK_COLORS[report.riskLevel])}
                onClick={() => setSelectedReport(report)}
              />
            ))}

        {/* Pattern clusters */}
        {selectedLayers.patterns &&
          patterns.map((pattern) => (
            <Circle
              key={pattern.id}
              center={{ lat: pattern.location.lat, lng: pattern.location.lng }}
              radius={pattern.radius || 200}
              options={{
                fillColor: '#8b5cf6',
                fillOpacity: 0.15 * pattern.confidence,
                strokeColor: '#8b5cf6',
                strokeOpacity: 0.6,
                strokeWeight: 2,
              }}
            />
          ))}

        {/* Info Window for selected report */}
        {selectedReport && (
          <InfoWindow
            position={{ lat: selectedReport.location.lat, lng: selectedReport.location.lng }}
            onCloseClick={() => setSelectedReport(null)}
          >
            <div className="popup-card" style={{ padding: '12px', minWidth: '200px' }}>
              <div
                className={`popup-risk-badge ${selectedReport.riskLevel}`}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  display: 'inline-block',
                  backgroundColor: RISK_COLORS[selectedReport.riskLevel],
                  color: 'white',
                }}
              >
                {selectedReport.riskLevel.toUpperCase()} RISK
              </div>
              <div className="popup-content-main">
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: '600' }}>
                  {selectedReport.category || 'Incident Report'}
                </h4>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.875rem', color: '#666' }}>
                  {selectedReport.description}
                </p>
                <div className="popup-footer" style={{ fontSize: '0.75rem', color: '#888' }}>
                  <span className="popup-time">
                    {new Date(selectedReport.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {selectedReport.confirmCount > 0 && (
                    <span className="popup-confirmed" style={{ marginLeft: '8px' }}>
                      • {selectedReport.confirmCount} Confirmed
                    </span>
                  )}
                </div>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {loading && (
        <div className="map-overlay">
          <div className="spinner-small"></div>
        </div>
      )}
    </div>
  );
};

export default MapView;
