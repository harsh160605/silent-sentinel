import React, { useState, useEffect } from 'react';
import { X, Star, MapPin, Loader, Send } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { submitRating, getLocationRatings, RATING_CATEGORIES } from '../services/ratingService';

const StarRating = ({ value, onChange, readonly = false }) => {
    const [hover, setHover] = useState(0);

    return (
        <div className="star-rating">
            {[1, 2, 3, 4, 5].map(star => (
                <button
                    key={star}
                    type="button"
                    className={`star ${star <= (hover || value) ? 'filled' : ''}`}
                    onClick={() => !readonly && onChange?.(star)}
                    onMouseEnter={() => !readonly && setHover(star)}
                    onMouseLeave={() => !readonly && setHover(0)}
                    disabled={readonly}
                >
                    <Star size={20} />
                </button>
            ))}
        </div>
    );
};

const SafetyRatingModal = ({ location, onClose }) => {
    const { user } = useAuthStore();
    const [ratings, setRatings] = useState({
        lighting: 0,
        footTraffic: 0,
        security: 0,
        businesses: 0,
        comment: ''
    });
    const [existingRatings, setExistingRatings] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [loadingExisting, setLoadingExisting] = useState(true);

    // Load existing ratings for this location
    useEffect(() => {
        const loadRatings = async () => {
            if (!location) return;

            try {
                const data = await getLocationRatings(location.lat, location.lng);
                setExistingRatings(data);
            } catch (error) {
                console.error('Error loading ratings:', error);
            } finally {
                setLoadingExisting(false);
            }
        };

        loadRatings();
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check if at least one rating is provided
        const hasRating = Object.keys(ratings)
            .filter(k => k !== 'comment')
            .some(k => ratings[k] > 0);

        if (!hasRating) return;

        setLoading(true);

        try {
            await submitRating(location, ratings, user?.uid || 'anonymous');
            setSubmitted(true);
        } catch (error) {
            console.error('Error submitting rating:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRatingChange = (key, value) => {
        setRatings(prev => ({ ...prev, [key]: value }));
    };

    if (!location) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-rating" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>
                    <X size={24} />
                </button>

                {submitted ? (
                    <div className="rating-success">
                        <div className="success-checkmark">✓</div>
                        <h2>Thanks for rating!</h2>
                        <p>Your rating helps others stay safe.</p>
                        <button className="btn-primary" onClick={onClose}>Done</button>
                    </div>
                ) : (
                    <>
                        <div className="rating-header">
                            <div>
                                <h2>Node Safety Rating</h2>
                                <span className="location-coords">
                                    <MapPin size={10} />
                                    COORD: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                                </span>
                            </div>
                        </div>

                        {/* Existing Aggregate Ratings */}
                        {loadingExisting ? (
                            <div className="loading-ratings">
                                <Loader size={20} className="spinner" />
                                <span>Loading ratings...</span>
                            </div>
                        ) : existingRatings?.aggregate ? (
                            <div className="existing-ratings">
                                <h4>Community Ratings</h4>
                                <div className="ratings-summary">
                                    {RATING_CATEGORIES.map(cat => (
                                        <div key={cat.key} className="rating-summary-item">
                                            <span className="summary-icon">{cat.icon}</span>
                                            <span className="summary-label">{cat.label}</span>
                                            <div className="summary-stars">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <Star
                                                        key={star}
                                                        size={12}
                                                        className={star <= Math.round(existingRatings.aggregate[cat.key] || 0) ? 'filled' : ''}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <span className="rating-count">
                                    Based on {existingRatings.aggregate.ratingCount} rating(s)
                                </span>
                            </div>
                        ) : (
                            <div className="no-existing-ratings">
                                <p>Be the first to rate this area!</p>
                            </div>
                        )}

                        {/* Submit New Rating */}
                        <form onSubmit={handleSubmit} className="rating-form">
                            <h4>Your Rating</h4>

                            {RATING_CATEGORIES.map(category => (
                                <div key={category.key} className="rating-category">
                                    <div className="category-header">
                                        <span className="category-label">{category.label}</span>
                                    </div>
                                    <StarRating
                                        value={ratings[category.key]}
                                        onChange={(val) => handleRatingChange(category.key, val)}
                                    />
                                </div>
                            ))}

                            <div className="rating-comment">
                                <label>Additional Comments (optional)</label>
                                <textarea
                                    value={ratings.comment}
                                    onChange={(e) => setRatings(prev => ({ ...prev, comment: e.target.value }))}
                                    placeholder="e.g., 'Well-lit main road but side streets are dark'"
                                    rows={3}
                                    maxLength={200}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={loading || !Object.values(ratings).some(v => typeof v === 'number' && v > 0)}
                            >
                                {loading ? (
                                    <>
                                        <Loader size={16} className="spinner" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send size={16} />
                                        Submit Rating
                                    </>
                                )}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default SafetyRatingModal;

