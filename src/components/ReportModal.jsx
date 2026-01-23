import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, MapPin, AlertCircle, CheckCircle, Loader, Sparkles, Navigation, Mic, Crosshair } from 'lucide-react';
import { useMapStore } from '../stores/mapStore';
import { requestUserLocation } from '../services/geolocation';
import { parseNaturalLanguageReport, moderateContent } from '../services/aiService';
import { submitReport } from '../services/reportService';
import { getSmartSuggestions, updateKeywordStats, debouncedGetSuggestions } from '../services/keywordService';
import VoiceInput from './VoiceInput';
import { GoogleMap, Marker } from '@react-google-maps/api';

const ReportModal = ({ onClose }) => {
  const { userLocation, center } = useMapStore();
  const [step, setStep] = useState(1); // 1: Input, 2: Review, 3: Success
  const [reportText, setReportText] = useState('');
  const [reportType, setReportType] = useState('perception');
  const [locationMode, setLocationMode] = useState(null); // 'live' | 'manual' | null
  const [location, setLocation] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [pinLocation, setPinLocation] = useState(null);
  const mapRef = useRef(null);

  // Check if Google Maps is loaded (loaded by MapView)
  const isGoogleMapsLoaded = typeof window !== 'undefined' && window.google && window.google.maps;

  // Smart suggestions state
  const [smartSuggestions, setSmartSuggestions] = useState({
    keywords: [],
    templates: [],
    suggestions: [],
  });
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Handle voice transcript
  const handleVoiceTranscript = (transcript) => {
    if (transcript.trim()) {
      setReportText(prev => prev ? prev + ' ' + transcript : transcript);
    }
  };

  // Load initial suggestions on mount
  useEffect(() => {
    const loadInitialSuggestions = async () => {
      setLoadingSuggestions(true);
      try {
        const suggestions = await getSmartSuggestions();
        setSmartSuggestions(suggestions);
      } catch (err) {
        console.error('Failed to load suggestions:', err);
      } finally {
        setLoadingSuggestions(false);
      }
    };
    loadInitialSuggestions();
  }, []);

  // Debounced suggestions as user types
  const handleTextChange = useCallback((e) => {
    const text = e.target.value;
    setReportText(text);

    if (text.length >= 3) {
      setShowSuggestions(true);
      debouncedGetSuggestions(text, (suggestions) => {
        setSmartSuggestions(prev => ({
          ...prev,
          suggestions: suggestions.suggestions || [],
        }));
      });
    } else {
      setShowSuggestions(false);
    }
  }, []);

  // Handle template selection
  const handleTemplateClick = (template) => {
    setReportText(template.template);
    setShowSuggestions(false);
  };

  // Handle keyword/suggestion click
  const handleSuggestionClick = (suggestion) => {
    // If there's existing text, append the suggestion
    if (reportText.trim()) {
      setReportText(prev => prev + ' ' + suggestion);
    } else {
      setReportText(suggestion);
    }
    setShowSuggestions(false);
  };

  // Handle live location request
  const handleLocationRequest = async () => {
    try {
      setLoading(true);
      const loc = await requestUserLocation();
      setLocation(loc);
      setLocationMode('live');
      setError(null);
    } catch (err) {
      setError('Unable to access location. Try pinpointing manually.');
    } finally {
      setLoading(false);
    }
  };

  // Open map picker for manual location
  const handleOpenMapPicker = () => {
    setShowMapPicker(true);
    // Initialize pin to current center or user location
    setPinLocation(userLocation || center || { lat: 20.5937, lng: 78.9629 });
  };

  // Handle map click to place pin
  const handleMapClick = (e) => {
    setPinLocation({
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    });
  };

  // Confirm manually pinned location
  const handleConfirmPin = () => {
    if (pinLocation) {
      setLocation(pinLocation);
      setLocationMode('manual');
      setShowMapPicker(false);
    }
  };

  // Cancel map picker
  const handleCancelMapPicker = () => {
    setShowMapPicker(false);
    setPinLocation(null);
  };

  // Reset location
  const handleResetLocation = () => {
    setLocation(null);
    setLocationMode(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Step 1: Moderate content
      const moderation = await moderateContent(reportText);
      if (!moderation.approved) {
        setError(`Content not approved: ${moderation.reason}`);
        setLoading(false);
        return;
      }

      // Step 2: Parse natural language
      const parsed = await parseNaturalLanguageReport(reportText);
      setParsedData(parsed);

      // Step 3: Determine location
      let finalLocation = location;
      if (!finalLocation) {
        // Use map center if no location provided
        finalLocation = center;
      }

      setStep(2);
    } catch (err) {
      setError('Failed to process report. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const reportData = {
        reportType,
        riskLevel: parsedData.riskLevel,
        reason: parsedData.reason,
        originalText: reportText,
        location: location || center,
        aiParsed: parsedData.aiParsed !== false,
      };

      await submitReport(reportData);

      // Update keyword stats in background (non-blocking)
      updateKeywordStats(reportText, parsedData.category || reportType, parsedData.riskLevel);

      setStep(3);
    } catch (err) {
      setError('Failed to submit report. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Format coordinates for display
  const formatCoordinate = (value, decimals = 4) => {
    return typeof value === 'number' ? value.toFixed(decimals) : 'N/A';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        {step === 1 && (
          <>
            <h2>Incident Triage</h2>
            <p className="modal-subtitle">
              Describe the situation. Our AI protocol will analyze, categorize, and prioritize the intelligence.
            </p>

            {/* Quick Templates Section */}
            <div className="smart-suggestions-section">
              <div className="section-header">
                <Sparkles size={16} className="sparkle-icon" />
                <span>Quick Templates</span>
              </div>
              <div className="templates-grid">
                {loadingSuggestions ? (
                  <div className="loading-placeholder">
                    <Loader size={16} className="spinner" />
                    <span>Loading suggestions...</span>
                  </div>
                ) : (
                  smartSuggestions.templates.slice(0, 4).map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      className="template-card"
                      onClick={() => handleTemplateClick(template)}
                    >
                      <span className="template-icon">{template.icon || '📋'}</span>
                      <span className="template-text">{template.template}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Popular Keywords */}
            {smartSuggestions.keywords.length > 0 && (
              <div className="keywords-section">
                <div className="section-header">
                  <span>Popular Keywords</span>
                </div>
                <div className="keywords-pills">
                  {smartSuggestions.keywords.slice(0, 6).map((kw) => (
                    <button
                      key={kw.id}
                      type="button"
                      className="keyword-pill"
                      onClick={() => handleSuggestionClick(kw.keyword)}
                    >
                      {kw.keyword}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Report Type */}
              <div className="form-group">
                <label>Report Type</label>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      value="perception"
                      checked={reportType === 'perception'}
                      onChange={(e) => setReportType(e.target.value)}
                    />
                    <span>Perception</span>
                    <small>I feel unsafe here</small>
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="crime"
                      checked={reportType === 'crime'}
                      onChange={(e) => setReportType(e.target.value)}
                    />
                    <span>Crime/Incident</span>
                    <small>Something happened</small>
                  </label>
                </div>
              </div>

              {/* Natural Language Input with Autocomplete */}
              <div className="form-group textarea-container">
                <div className="textarea-header">
                  <label htmlFor="report-text">What's happening?</label>
                  <VoiceInput onTranscript={handleVoiceTranscript} disabled={loading} />
                </div>
                <textarea
                  id="report-text"
                  value={reportText}
                  onChange={handleTextChange}
                  placeholder="Type or use voice input: 'Someone has been following people near the library entrance...'"
                  rows={6}
                  required
                  maxLength={500}
                />
                <small>{reportText.length}/500 characters</small>

                {/* Autocomplete Suggestions Dropdown */}
                {showSuggestions && smartSuggestions.suggestions.length > 0 && (
                  <div className="autocomplete-dropdown">
                    {smartSuggestions.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="autocomplete-item"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <Sparkles size={12} />
                        <span>{suggestion}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Location Selection - Live or Manual */}
              <div className="form-group">
                <label>
                  <MapPin size={16} />
                  Incident Location
                </label>

                {!locationMode ? (
                  <div className="location-options">
                    <button
                      type="button"
                      className="location-option-btn"
                      onClick={handleLocationRequest}
                      disabled={loading}
                    >
                      <Navigation size={20} />
                      <div className="option-text">
                        <span>Use Current Location</span>
                        <small>Auto-detect via GPS</small>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="location-option-btn"
                      onClick={handleOpenMapPicker}
                      disabled={loading}
                    >
                      <Crosshair size={20} />
                      <div className="option-text">
                        <span>Pin on Map</span>
                        <small>Select location manually</small>
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="location-status-card">
                    <div className="location-status-header">
                      <CheckCircle size={16} className="text-success" />
                      <span>
                        {locationMode === 'live' ? 'GPS Location captured' : 'Location pinned manually'}
                      </span>
                      <button
                        type="button"
                        className="btn-reset-location"
                        onClick={handleResetLocation}
                        title="Change location"
                      >
                        Change
                      </button>
                    </div>
                    {location && (
                      <div className="location-coordinates">
                        <div className="coordinate-row">
                          <span className="coordinate-label">Lat:</span>
                          <span className="coordinate-value">{formatCoordinate(location.lat)}</span>
                        </div>
                        <div className="coordinate-row">
                          <span className="coordinate-label">Lng:</span>
                          <span className="coordinate-value">{formatCoordinate(location.lng)}</span>
                        </div>
                        {location.accuracy && locationMode === 'live' && (
                          <div className="coordinate-row accuracy">
                            <span className="coordinate-label">Accuracy:</span>
                            <span className="coordinate-value">±{Math.round(location.accuracy)}m</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <small>
                  Your location is only used for this report and never stored with your identity.
                </small>
              </div>

              {/* Map Picker Modal */}
              {showMapPicker && isGoogleMapsLoaded && (
                <div className="map-picker-overlay" onClick={handleCancelMapPicker}>
                  <div className="map-picker-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="map-picker-header">
                      <h3>
                        <Crosshair size={18} />
                        Pin Incident Location
                      </h3>
                      <p>Click or tap on the map to place a pin at the incident location</p>
                    </div>

                    <div className="map-picker-container">
                      <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={pinLocation || center || { lat: 20.5937, lng: 78.9629 }}
                        zoom={15}
                        onClick={handleMapClick}
                        onLoad={(map) => { mapRef.current = map; }}
                        options={{
                          disableDefaultUI: true,
                          zoomControl: true,
                          clickableIcons: false,
                        }}
                      >
                        {pinLocation && (
                          <Marker
                            position={pinLocation}
                            draggable={true}
                            onDragEnd={(e) => {
                              setPinLocation({
                                lat: e.latLng.lat(),
                                lng: e.latLng.lng(),
                              });
                            }}
                          />
                        )}
                      </GoogleMap>

                      {/* Crosshair overlay for precision */}
                      <div className="map-picker-crosshair">
                        <Crosshair size={24} />
                      </div>
                    </div>

                    {pinLocation && (
                      <div className="map-picker-coords">
                        📍 {pinLocation.lat.toFixed(5)}, {pinLocation.lng.toFixed(5)}
                      </div>
                    )}

                    <div className="map-picker-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleCancelMapPicker}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={handleConfirmPin}
                        disabled={!pinLocation}
                      >
                        <CheckCircle size={16} />
                        Confirm Location
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="alert alert-error">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={loading || !reportText.trim()}>
                {loading ? (
                  <>
                    <Loader size={16} className="spinner" />
                    Processing...
                  </>
                ) : (
                  'Next'
                )}
              </button>
            </form>
          </>
        )}

        {step === 2 && parsedData && (
          <>
            <h2>Intelligence Audit</h2>
            <p className="modal-subtitle">Review the data extracted by the Gemini Protocol.</p>

            <div className="review-card">
              <div className="review-item">
                <strong>Risk Level:</strong>
                <span className={`badge badge-${parsedData.riskLevel}`}>
                  {parsedData.riskLevel.toUpperCase()}
                </span>
              </div>
              <div className="review-item">
                <strong>Type:</strong>
                <span>{reportType === 'perception' ? 'Perception' : 'Crime/Incident'}</span>
              </div>
              <div className="review-item">
                <strong>Summary:</strong>
                <p>{parsedData.reason}</p>
              </div>
              <div className="review-item">
                <strong>Location:</strong>
                {location ? (
                  <div className="review-location">
                    <span>
                      {locationMode === 'live' ? '📍 GPS Location' : '📌 Manually Pinned'}
                    </span>
                    <small className="location-coords-inline">
                      ({formatCoordinate(location.lat)}, {formatCoordinate(location.lng)})
                    </small>
                  </div>
                ) : (
                  <span>📍 Map center location</span>
                )}
              </div>
            </div>

            {error && (
              <div className="alert alert-error">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setStep(1)} disabled={loading}>
                Back
              </button>
              <button className="btn-primary" onClick={handleConfirmSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader size={16} className="spinner" />
                    Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="success-container">
              <CheckCircle size={64} className="text-success" />
              <h2>Intelligence Logged</h2>
              <p>
                Your report has been successfully transmitted. Nearby nodes will be updated once the AI verification protocol completes.
              </p>
              <button className="btn-primary" onClick={onClose}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportModal;

