/**
 * Vote Service - Handles report verification voting
 * Allows users to confirm or dispute reports
 */

import { getFirebaseDb } from './firebase';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    deleteDoc,
    doc,
    updateDoc,
    increment,
    Timestamp,
    getDoc
} from 'firebase/firestore';

/**
 * Vote on a report (confirm or dispute)
 * @param {string} reportId - The report ID to vote on
 * @param {string} odId - Anonymous session ID
 * @param {string} voteType - 'confirm' or 'dispute'
 * @param {string} comment - Optional comment
 */
export const voteOnReport = async (reportId, odId, voteType, comment = '') => {
    const db = getFirebaseDb();

    if (!db) {
        console.warn('Firebase not initialized - using demo mode');
        return { success: true, demo: true };
    }

    try {
        // Check if user already voted
        const existingVote = await getUserVote(reportId, odId);

        if (existingVote) {
            // Update existing vote
            const voteRef = doc(db, 'reportVotes', existingVote.id);
            await updateDoc(voteRef, {
                vote: voteType,
                comment: comment,
                updatedAt: Timestamp.now()
            });
        } else {
            // Create new vote
            await addDoc(collection(db, 'reportVotes'), {
                reportId,
                odId,
                vote: voteType,
                comment: comment,
                timestamp: Timestamp.now()
            });
        }

        // Update report vote counts
        await updateReportVoteCounts(reportId);

        return { success: true };
    } catch (error) {
        console.error('Error voting on report:', error);
        throw error;
    }
};

/**
 * Get user's vote on a specific report
 */
export const getUserVote = async (reportId, odId) => {
    const db = getFirebaseDb();

    if (!db) return null;

    try {
        const q = query(
            collection(db, 'reportVotes'),
            where('reportId', '==', reportId),
            where('odId', '==', odId)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;

        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    } catch (error) {
        console.error('Error getting user vote:', error);
        return null;
    }
};

/**
 * Get vote counts for a report
 */
export const getReportVoteCounts = async (reportId) => {
    const db = getFirebaseDb();

    if (!db) {
        return { confirms: 0, disputes: 0 };
    }

    try {
        const q = query(
            collection(db, 'reportVotes'),
            where('reportId', '==', reportId)
        );

        const snapshot = await getDocs(q);

        let confirms = 0;
        let disputes = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.vote === 'confirm') confirms++;
            else if (data.vote === 'dispute') disputes++;
        });

        return { confirms, disputes };
    } catch (error) {
        console.error('Error getting vote counts:', error);
        return { confirms: 0, disputes: 0 };
    }
};

/**
 * Update the cached vote counts on the report document
 */
const updateReportVoteCounts = async (reportId) => {
    const db = getFirebaseDb();
    if (!db) return;

    try {
        const counts = await getReportVoteCounts(reportId);
        const reportRef = doc(db, 'reports', reportId);

        await updateDoc(reportRef, {
            confirmCount: counts.confirms,
            disputeCount: counts.disputes,
            credibilityScore: calculateCredibility(counts.confirms, counts.disputes)
        });
    } catch (error) {
        console.error('Error updating report vote counts:', error);
    }
};

/**
 * Calculate credibility score based on votes
 * Returns a value between 0 and 100
 */
const calculateCredibility = (confirms, disputes) => {
    const total = confirms + disputes;
    if (total === 0) return 50; // Neutral

    const ratio = confirms / total;
    return Math.round(ratio * 100);
};

/**
 * Remove user's vote from a report
 */
export const removeVote = async (reportId, odId) => {
    const db = getFirebaseDb();
    if (!db) return { success: true, demo: true };

    try {
        const existingVote = await getUserVote(reportId, odId);

        if (existingVote) {
            await deleteDoc(doc(db, 'reportVotes', existingVote.id));
            await updateReportVoteCounts(reportId);
        }

        return { success: true };
    } catch (error) {
        console.error('Error removing vote:', error);
        throw error;
    }
};

/**
 * Get all comments for a report
 */
export const getReportComments = async (reportId, limit = 20) => {
    const db = getFirebaseDb();

    if (!db) return [];

    try {
        const q = query(
            collection(db, 'reportVotes'),
            where('reportId', '==', reportId)
        );

        const snapshot = await getDocs(q);
        const comments = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.comment && data.comment.trim()) {
                comments.push({
                    id: doc.id,
                    text: data.comment,
                    voteType: data.vote,
                    timestamp: data.timestamp?.toDate() || new Date()
                });
            }
        });

        // Sort by timestamp descending
        comments.sort((a, b) => b.timestamp - a.timestamp);

        return comments.slice(0, limit);
    } catch (error) {
        console.error('Error getting comments:', error);
        return [];
    }
};

