import React, { useState } from 'react';
import { Activity, Filter, ChevronDown, X } from 'lucide-react';
import { useMapStore } from '../stores/mapStore';
import ReportCard from './ReportCard';

const ReportsFeed = ({ isOpen, onClose, onLocationClick }) => {
    const { reports } = useMapStore();
    const [filter, setFilter] = useState('all'); // all, perception, crime
    const [sortBy, setSortBy] = useState('recent'); // recent, risk, confirmed

    // Filter and sort reports
    const filteredReports = reports
        .filter(report => {
            if (filter === 'all') return true;
            return report.reportType === filter;
        })
        .sort((a, b) => {
            if (sortBy === 'recent') {
                return new Date(b.timestamp) - new Date(a.timestamp);
            }
            if (sortBy === 'risk') {
                const riskOrder = { high: 3, medium: 2, low: 1 };
                return (riskOrder[b.riskLevel] || 0) - (riskOrder[a.riskLevel] || 0);
            }
            if (sortBy === 'confirmed') {
                return (b.confirmCount || 0) - (a.confirmCount || 0);
            }
            return 0;
        });

    if (!isOpen) return null;

    return (
        <div className="reports-feed-panel">
            {/* Header */}
            <div className="feed-header">
                <div className="feed-title">
                    <Activity size={18} />
                    <h3>Nearby Activity</h3>
                    <span className="feed-count">{filteredReports.length}</span>
                </div>
                <button className="feed-close" onClick={onClose}>
                    <X size={18} />
                </button>
            </div>

            {/* Filters */}
            <div className="feed-filters">
                <div className="filter-group">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Reports</option>
                        <option value="perception">Safety Concerns</option>
                        <option value="crime">Incidents</option>
                    </select>
                </div>
                <div className="filter-group">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="filter-select"
                    >
                        <option value="recent">Most Recent</option>
                        <option value="risk">Highest Risk</option>
                        <option value="confirmed">Most Confirmed</option>
                    </select>
                </div>
            </div>

            {/* Reports List */}
            <div className="feed-content">
                {filteredReports.length > 0 ? (
                    filteredReports.map(report => (
                        <ReportCard
                            key={report.id}
                            report={report}
                            onLocationClick={onLocationClick}
                        />
                    ))
                ) : (
                    <div className="no-reports">
                        <Activity size={32} />
                        <p>No reports in this area yet.</p>
                        <span>Be the first to report a safety concern.</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportsFeed;

