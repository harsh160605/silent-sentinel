/**
 * Rating Service - Handles Safety Ratings for locations
 * Rate areas on lighting, foot traffic, security, etc.
 */

import { getFirebaseDb } from './firebase';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    getDoc,
    Timestamp,
    orderBy,
    limit
} from 'firebase/firestore';
import ngeohash from 'ngeohash';

/**
 * Get geohash for location (5-character precision ~5km area)
 */
const getLocationHash = (lat, lng) => {
    return ngeohash.encode(lat, lng, 5);
};

/**
 * Submit a safety rating for a location
 */
export const submitRating = async (location, ratings, userId) => {
    const db = getFirebaseDb();

    if (!db) {
        console.warn('Firebase not initialized - using demo mode');
        return { success: true, demo: true };
    }

    try {
        const geohash = getLocationHash(location.lat, location.lng);

        const rating = {
            geohash,
            location: {
                lat: location.lat,
                lng: location.lng
            },
            userId,
            lighting: ratings.lighting || 0,
            footTraffic: ratings.footTraffic || 0,
            security: ratings.security || 0,
            businesses: ratings.businesses || 0,
            overall: calculateOverall(ratings),
            comment: ratings.comment || '',
            timestamp: Timestamp.now()
        };

        await addDoc(collection(db, 'locationRatings'), rating);

        // Update aggregate rating for the location
        await updateAggregateRating(geohash, ratings);

        return { success: true };
    } catch (error) {
        console.error('Error submitting rating:', error);
        throw error;
    }
};

/**
 * Calculate overall score from individual ratings
 */
const calculateOverall = (ratings) => {
    const values = [
        ratings.lighting || 0,
        ratings.footTraffic || 0,
        ratings.security || 0,
        ratings.businesses || 0
    ].filter(v => v > 0);

    if (values.length === 0) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
};

/**
 * Update aggregate rating for a location geohash
 */
const updateAggregateRating = async (geohash, newRating) => {
    const db = getFirebaseDb();
    if (!db) return;

    try {
        const aggRef = doc(db, 'locationAggregates', geohash);
        const aggSnap = await getDoc(aggRef);

        if (aggSnap.exists()) {
            const current = aggSnap.data();
            const count = (current.ratingCount || 0) + 1;

            await updateDoc(aggRef, {
                lighting: ((current.lighting || 0) * (count - 1) + (newRating.lighting || 0)) / count,
                footTraffic: ((current.footTraffic || 0) * (count - 1) + (newRating.footTraffic || 0)) / count,
                security: ((current.security || 0) * (count - 1) + (newRating.security || 0)) / count,
                businesses: ((current.businesses || 0) * (count - 1) + (newRating.businesses || 0)) / count,
                ratingCount: count,
                updatedAt: Timestamp.now()
            });
        } else {
            // Use setDoc with the geohash as the document ID
            const { setDoc } = await import('firebase/firestore');
            await setDoc(aggRef, {
                geohash,
                lighting: newRating.lighting || 0,
                footTraffic: newRating.footTraffic || 0,
                security: newRating.security || 0,
                businesses: newRating.businesses || 0,
                ratingCount: 1,
                updatedAt: Timestamp.now()
            });
        }
    } catch (error) {
        console.error('Error updating aggregate:', error);
    }
};

/**
 * Get ratings for a location
 */
export const getLocationRatings = async (lat, lng, radiusKm = 1) => {
    const db = getFirebaseDb();

    if (!db) {
        // Return demo data
        return {
            aggregate: {
                lighting: 3.5,
                footTraffic: 4,
                security: 2.5,
                businesses: 4,
                overall: 3.5,
                ratingCount: 15
            },
            recent: [
                { lighting: 4, footTraffic: 5, security: 3, businesses: 4, comment: 'Well-lit main road' }
            ]
        };
    }

    try {
        const geohash = getLocationHash(lat, lng);

        // Get aggregate
        const aggRef = doc(db, 'locationAggregates', geohash);
        const aggSnap = await getDoc(aggRef);

        let aggregate = null;
        if (aggSnap.exists()) {
            const data = aggSnap.data();
            aggregate = {
                ...data,
                overall: (data.lighting + data.footTraffic + data.security + data.businesses) / 4
            };
        }

        // Get recent individual ratings
        const q = query(
            collection(db, 'locationRatings'),
            where('geohash', '==', geohash),
            orderBy('timestamp', 'desc'),
            limit(10)
        );

        const snapshot = await getDocs(q);
        const recent = [];

        snapshot.forEach(doc => {
            recent.push({ id: doc.id, ...doc.data() });
        });

        return { aggregate, recent };
    } catch (error) {
        console.error('Error getting ratings:', error);
        return { aggregate: null, recent: [] };
    }
};

/**
 * Get user's rating for a location
 */
export const getUserRating = async (lat, lng, userId) => {
    const db = getFirebaseDb();
    if (!db) return null;

    try {
        const geohash = getLocationHash(lat, lng);

        const q = query(
            collection(db, 'locationRatings'),
            where('geohash', '==', geohash),
            where('userId', '==', userId),
            limit(1)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;

        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    } catch (error) {
        console.error('Error getting user rating:', error);
        return null;
    }
};

/**
 * Rating categories with labels
 */
export const RATING_CATEGORIES = [
    { key: 'lighting', label: 'Lighting', icon: '💡', description: 'How well-lit is the area?' },
    { key: 'footTraffic', label: 'Foot Traffic', icon: '🚶', description: 'How busy is it?' },
    { key: 'security', label: 'Security', icon: '🛡️', description: 'Visible guards/cameras?' },
    { key: 'businesses', label: 'Nearby Businesses', icon: '🏪', description: 'Stores, restaurants open?' }
];

