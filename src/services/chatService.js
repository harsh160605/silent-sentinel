/**
 * Chat Service - Handles Anonymous Group Chat
 * Send and receive messages within community groups
 */

import { getFirebaseDb } from './firebase';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    Timestamp,
    onSnapshot
} from 'firebase/firestore';

/**
 * Generate anonymous display name
 */
const generateAnonName = (userId, groupId) => {
    const hash = (userId + groupId).split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
    }, 0);

    const adjectives = ['Anonymous', 'Hidden', 'Secret', 'Unknown', 'Masked', 'Silent', 'Shadow', 'Phantom'];
    const nouns = ['User', 'Member', 'Guardian', 'Watcher', 'Sentinel', 'Citizen', 'Neighbor', 'Ally'];

    const adjIndex = Math.abs(hash) % adjectives.length;
    const nounIndex = Math.abs(hash >> 4) % nouns.length;

    return `${adjectives[adjIndex]} ${nouns[nounIndex]}`;
};

/**
 * Send a message to a group chat
 */
export const sendMessage = async (groupId, userId, text) => {
    const db = getFirebaseDb();

    if (!db) {
        console.warn('Firebase not initialized - using demo mode');
        return { success: true, demo: true };
    }

    try {
        const message = {
            groupId,
            text: text.trim(),
            anonName: generateAnonName(userId, groupId),
            timestamp: Timestamp.now()
        };

        await addDoc(collection(db, 'groupMessages'), message);
        return { success: true };
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};

/**
 * Get messages for a group
 */
export const getGroupMessages = async (groupId, limitCount = 50) => {
    const db = getFirebaseDb();

    if (!db) {
        // Return demo messages
        return [
            { id: '1', anonName: 'Anonymous Guardian', text: 'Has anyone seen activity near the park?', timestamp: new Date(Date.now() - 3600000) },
            { id: '2', anonName: 'Silent Watcher', text: 'All clear on my end', timestamp: new Date(Date.now() - 1800000) },
            { id: '3', anonName: 'Hidden Sentinel', text: 'Stay safe everyone', timestamp: new Date(Date.now() - 900000) }
        ];
    }

    try {
        const q = query(
            collection(db, 'groupMessages'),
            where('groupId', '==', groupId),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        const messages = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            messages.push({
                id: doc.id,
                ...data,
                timestamp: data.timestamp?.toDate() || new Date()
            });
        });

        // Sort locally by timestamp ascending (chronological order)
        // This bypasses the need for a composite index
        return messages.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
        console.error('Error getting messages:', error);
        return [];
    }
};

/**
 * Subscribe to real-time messages
 */
export const subscribeToMessages = (groupId, callback) => {
    const db = getFirebaseDb();

    if (!db) {
        // Demo mode - just call callback once
        getGroupMessages(groupId).then(callback);
        return () => { };
    }

    try {
        const q = query(
            collection(db, 'groupMessages'),
            where('groupId', '==', groupId),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const messages = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                messages.push({
                    id: doc.id,
                    ...data,
                    timestamp: data.timestamp?.toDate() || new Date()
                });
            });
            // Sort locally (asc) and return
            callback(messages.sort((a, b) => a.timestamp - b.timestamp));
        });

        return unsubscribe;
    } catch (error) {
        console.error('Error subscribing to messages:', error);
        return () => { };
    }
};

