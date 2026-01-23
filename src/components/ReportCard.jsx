import React, { useState, useEffect } from 'react';
import {
    ThumbsUp,
    ThumbsDown,
    MessageCircle,
    MapPin,
    Clock,
    ChevronDown,
    ChevronUp,
    Send,
    AlertTriangle,
    Shield,
    Loader,
    Navigation,
    ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { voteOnReport, getUserVote, getReportComments } from '../services/voteService';
import { useAuthStore } from '../stores/authStore';
import { useMapStore } from '../stores/mapStore';

const RISK_COLORS = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
};

const RISK_ICONS = {
    low: Shield,
    medium: AlertTriangle,
    high: AlertTriangle,
};

const ReportCard = ({ report, onLocationClick }) => {
    const { user } = useAuthStore();
    const { navigateToReport, selectedReport } = useMapStore();
    const sessionId = user?.uid || 'anonymous';
    const [userVote, setUserVote] = useState(null);
    const [voteLoading, setVoteLoading] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [confirmCount, setConfirmCount] = useState(report.confirmCount || 0);
    const [disputeCount, setDisputeCount] = useState(report.disputeCount || 0);

    const isSelected = selectedReport?.id === report.id;

    // Load user's existing vote
    useEffect(() => {
        const loadUserVote = async () => {
            if (sessionId && report.id) {
                const vote = await getUserVote(report.id, sessionId);
                if (vote) {
                    setUserVote(vote.vote);
                }
            }
        };
        loadUserVote();
    }, [report.id, sessionId]);

    // Handle voting
    const handleVote = async (voteType) => {
        if (voteLoading) return;

        setVoteLoading(true);
        try {
            // Toggle vote if same type
            const newVoteType = userVote === voteType ? null : voteType;

            if (newVoteType) {
                await voteOnReport(report.id, sessionId, newVoteType, '');
                setUserVote(newVoteType);

                // Update counts locally
                if (newVoteType === 'confirm') {
                    setConfirmCount(prev => prev + 1);
                    if (userVote === 'dispute') setDisputeCount(prev => Math.max(0, prev - 1));
                } else {
                    setDisputeCount(prev => prev + 1);
                    if (userVote === 'confirm') setConfirmCount(prev => Math.max(0, prev - 1));
                }
            } else {
                // Remove vote
                if (userVote === 'confirm') setConfirmCount(prev => Math.max(0, prev - 1));
                else setDisputeCount(prev => Math.max(0, prev - 1));
                setUserVote(null);
            }
        } catch (error) {
            console.error('Error voting:', error);
        } finally {
            setVoteLoading(false);
        }
    };

    // Load comments
    const handleToggleComments = async () => {
        if (!showComments && comments.length === 0) {
            const fetchedComments = await getReportComments(report.id);
            setComments(fetchedComments);
        }
        setShowComments(!showComments);
    };

    // Submit comment with vote
    const handleSubmitComment = async () => {
        if (!newComment.trim()) return;

        setVoteLoading(true);
        try {
            await voteOnReport(report.id, sessionId, 'confirm', newComment);
            setUserVote('confirm');
            setConfirmCount(prev => prev + 1);
            setComments(prev => [{
                id: Date.now().toString(),
                text: newComment,
                voteType: 'confirm',
                timestamp: new Date()
            }, ...prev]);
            setNewComment('');
        } catch (error) {
            console.error('Error submitting comment:', error);
        } finally {
            setVoteLoading(false);
        }
    };

    // Navigate to report location on map
    const handleViewOnMap = (e) => {
        e.stopPropagation();
        navigateToReport(report);
    };

    const RiskIcon = RISK_ICONS[report.riskLevel] || Shield;
    const timeAgo = report.timestamp ? formatDistanceToNow(new Date(report.timestamp), { addSuffix: true }) : '';
    const commentCount = comments.length;

    return (
        <div className={`report-card ${isSelected ? 'selected' : ''}`}>
            {/* Header - Clickable to view on map */}
            <div className="report-card-header" onClick={handleViewOnMap} style={{ cursor: 'pointer' }}>
                <div
                    className="report-risk-indicator"
                    style={{ backgroundColor: RISK_COLORS[report.riskLevel] }}
                >
                    <RiskIcon size={14} />
                </div>
                <div className="report-meta">
                    <span className="report-type">
                        {report.reportType === 'perception' ? 'Safety Concern' : 'Incident Report'}
                    </span>
                    <span className="report-risk-badge" style={{ color: RISK_COLORS[report.riskLevel] }}>
                        {report.riskLevel?.toUpperCase()}
                    </span>
                </div>
                <button
                    className="view-on-map-btn"
                    onClick={handleViewOnMap}
                    title="View on Map"
                >
                    <Navigation size={14} />
                </button>
            </div>

            {/* Content */}
            <div className="report-card-content" onClick={handleViewOnMap} style={{ cursor: 'pointer' }}>
                <p className="report-reason">{report.reason || report.originalText}</p>

                <div className="report-info">
                    <span className="report-location" onClick={(e) => { e.stopPropagation(); onLocationClick?.(report.location); }}>
                        <MapPin size={12} />
                        {report.location?.lat?.toFixed(4)}, {report.location?.lng?.toFixed(4)}
                    </span>
                    <span className="report-time">
                        <Clock size={12} />
                        {timeAgo}
                    </span>
                </div>
            </div>

            {/* Voting Actions */}
            <div className="report-card-actions">
                <button
                    className={`vote-btn confirm ${userVote === 'confirm' ? 'active' : ''}`}
                    onClick={() => handleVote('confirm')}
                    disabled={voteLoading}
                >
                    <ThumbsUp size={14} />
                    <span>{confirmCount}</span>
                </button>

                <button
                    className={`vote-btn dispute ${userVote === 'dispute' ? 'active' : ''}`}
                    onClick={() => handleVote('dispute')}
                    disabled={voteLoading}
                >
                    <ThumbsDown size={14} />
                    <span>{disputeCount}</span>
                </button>

                <button
                    className="comments-btn"
                    onClick={handleToggleComments}
                >
                    <MessageCircle size={14} />
                    <span>{commentCount > 0 ? commentCount : ''}</span>
                    {showComments ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
            </div>

            {/* Credibility Score */}
            {(confirmCount + disputeCount) > 0 && (
                <div className="credibility-bar">
                    <div
                        className="credibility-fill"
                        style={{
                            width: `${(confirmCount / (confirmCount + disputeCount)) * 100}%`,
                            backgroundColor: RISK_COLORS[report.riskLevel]
                        }}
                    />
                </div>
            )}

            {/* Comments Section */}
            {showComments && (
                <div className="report-comments">
                    {/* Add Comment */}
                    <div className="add-comment">
                        <input
                            type="text"
                            placeholder="Add a comment (confirms report)..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
                            maxLength={200}
                        />
                        <button
                            className="send-comment-btn"
                            onClick={handleSubmitComment}
                            disabled={!newComment.trim() || voteLoading}
                        >
                            {voteLoading ? <Loader size={14} className="spinner" /> : <Send size={14} />}
                        </button>
                    </div>

                    {/* Comments List */}
                    {comments.length > 0 ? (
                        <div className="comments-list">
                            {comments.map(comment => (
                                <div key={comment.id} className="comment-item">
                                    <div className="comment-icon">
                                        {comment.voteType === 'confirm' ?
                                            <ThumbsUp size={10} /> :
                                            <ThumbsDown size={10} />
                                        }
                                    </div>
                                    <div className="comment-content">
                                        <p>{comment.text}</p>
                                        <span className="comment-time">
                                            {formatDistanceToNow(comment.timestamp, { addSuffix: true })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="no-comments">No comments yet. Be the first to confirm this report.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default ReportCard;

