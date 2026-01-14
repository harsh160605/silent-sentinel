import React, { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useMapStore } from '../stores/mapStore';
import { calculateDistance } from '../services/geolocation';

const PROXIMITY_THRESHOLD = 500; // meters

const ProximityAlert = () => {
  const { userLocation, reports } = useMapStore();
  const [alerts, setAlerts] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());

  useEffect(() => {
    if (!userLocation || !reports.length) {
      setAlerts([]);
      return;
    }

    // Find high-risk areas near user
    const nearbyHighRisk = reports.filter((report) => {
      if (report.riskLevel !== 'high') return false;
      if (dismissed.has(report.id)) return false;

      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        report.location.lat,
        report.location.lng
      );

      return distance <= PROXIMITY_THRESHOLD;
    });

    if (nearbyHighRisk.length > 0 && alerts.length === 0) {
      setAlerts(nearbyHighRisk);
    }
  }, [userLocation, reports, dismissed, alerts.length]);

  const handleDismiss = (reportId) => {
    setDismissed((prev) => new Set([...prev, reportId]));
    setAlerts((prev) => prev.filter((a) => a.id !== reportId));
  };

  if (alerts.length === 0) return null;

  return (
    <div className="proximity-alerts">
      {alerts.map((alert) => (
        <div key={alert.id} className="proximity-alert">
          <AlertCircle size={20} />
          <div className="alert-content">
            <strong>Safety Advisory</strong>
            <p>Higher-risk zone nearby: {alert.reason}</p>
          </div>
          <button className="alert-dismiss" onClick={() => handleDismiss(alert.id)}>
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ProximityAlert;

