import React, { useEffect, useState } from 'react';
import { initializeFirebase } from './services/firebase';
import { useAuthStore } from './stores/authStore';
import { useMapStore } from './stores/mapStore';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import ReportModal from './components/ReportModal';
import WelcomeModal from './components/WelcomeModal';
import ProximityAlert from './components/ProximityAlert';
import ReportsFeed from './components/ReportsFeed';
import GroupsPanel from './components/GroupsPanel';
import SafetyRatingModal from './components/SafetyRatingModal';
import Homepage from './components/Homepage';
import { Shield, Home } from 'lucide-react';

function App() {
  const [view, setView] = useState(() => {
    return localStorage.getItem('hasAccessedApp') === 'true' ? 'app' : 'homepage';
  });
  const [showWelcome, setShowWelcome] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showFeed, setShowFeed] = useState(true);
  const [showGroups, setShowGroups] = useState(false);
  const [ratingLocation, setRatingLocation] = useState(null);
  const { user, initializeAuth } = useAuthStore();
  const { center, setCenter } = useMapStore();

  // Open rating modal for current center
  const handleOpenRating = () => {
    setRatingLocation(center);
  };

  // Navigate to report location
  const handleLocationClick = (location) => {
    if (location?.lat && location?.lng) {
      setCenter({ lat: location.lat, lng: location.lng });
    }
  };

  useEffect(() => {
    // Initialize Firebase and Auth
    initializeFirebase();
    initializeAuth();

    // Show welcome modal for first-time users (only if in app view)
    if (view === 'app') {
      const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
      if (!hasSeenWelcome) {
        setShowWelcome(true);
      }
    }
  }, [initializeAuth, view]);

  const handleWelcomeClose = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setShowWelcome(false);
  };

  const handleGetStarted = () => {
    localStorage.setItem('hasAccessedApp', 'true');
    setView('app');
  };

  const handleGoHome = () => {
    localStorage.removeItem('hasAccessedApp');
    setView('homepage');
  };

  if (view === 'homepage') {
    return <Homepage onGetStarted={handleGetStarted} />;
  }

  return (
    <div className="app-container">
      {/* Main Content */}
      <div className="main-content">
        <Sidebar
          onGoHome={handleGoHome}
          onCreateReport={() => setShowReportModal(true)}
          onToggleFeed={() => setShowFeed(!showFeed)}
          feedOpen={showFeed}
          onToggleGroups={() => setShowGroups(!showGroups)}
          groupsOpen={showGroups}
          onRate={handleOpenRating}
        />
        <div className="map-feed-container">
          <MapView />
          <ReportsFeed
            isOpen={showFeed}
            onClose={() => setShowFeed(false)}
            onLocationClick={handleLocationClick}
          />
        </div>
      </div>

      {/* Modals */}
      {showWelcome && <WelcomeModal onClose={handleWelcomeClose} />}
      {showReportModal && <ReportModal onClose={() => setShowReportModal(false)} />}

      {/* Proximity Alerts */}
      <ProximityAlert />

      {/* Groups Panel */}
      <GroupsPanel isOpen={showGroups} onClose={() => setShowGroups(false)} />

      {/* Safety Rating Modal */}
      {ratingLocation && (
        <SafetyRatingModal
          location={ratingLocation}
          onClose={() => setRatingLocation(null)}
        />
      )}

      {/* Anonymous Auth Status */}
      {user && (
        <div className="auth-status">
          <span className="status-dot"></span>
          Anonymous mode active
        </div>
      )}
    </div>
  );
}

export default App;



