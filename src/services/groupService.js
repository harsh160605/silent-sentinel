/**
 * Group Service - Handles Community Watch Groups
 * Create, join, and manage private safety groups
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
    deleteDoc,
    arrayUnion,
    arrayRemove,
    getDoc,
    Timestamp,
    orderBy,
    limit
} from 'firebase/firestore';

/**
 * Generate a random invite code
 */
const generateInviteCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

/**
 * Create a new community watch group
 */
export const createGroup = async (groupData, userId) => {
    const db = getFirebaseDb();

    if (!db) {
        console.warn('Firebase not initialized - using demo mode');
        return { id: 'demo-group', ...groupData, demo: true };
    }

    try {
        const group = {
            name: groupData.name,
            description: groupData.description || '',
            createdBy: userId,
            inviteCode: generateInviteCode(),
            members: [userId],
            memberCount: 1,
            isPrivate: groupData.isPrivate !== false,
            icon: groupData.icon || '🏘️',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        };

        const docRef = await addDoc(collection(db, 'groups'), group);
        return { id: docRef.id, ...group };
    } catch (error) {
        console.error('Error creating group:', error);
        throw error;
    }
};

/**
 * Join a group using invite code
 */
export const joinGroupByCode = async (inviteCode, userId) => {
    const db = getFirebaseDb();

    if (!db) {
        return { success: false, error: 'Firebase not initialized' };
    }

    try {
        const q = query(
            collection(db, 'groups'),
            where('inviteCode', '==', inviteCode.toUpperCase())
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return { success: false, error: 'Invalid invite code' };
        }

        const groupDoc = snapshot.docs[0];
        const groupData = groupDoc.data();

        // Check if already a member
        if (groupData.members.includes(userId)) {
            return { success: false, error: 'Already a member of this group' };
        }

        // Add user to group
        await updateDoc(doc(db, 'groups', groupDoc.id), {
            members: arrayUnion(userId),
            memberCount: groupData.memberCount + 1,
            updatedAt: Timestamp.now()
        });

        return {
            success: true,
            group: { id: groupDoc.id, ...groupData }
        };
    } catch (error) {
        console.error('Error joining group:', error);
        throw error;
    }
};

/**
 * Leave a group
 */
export const leaveGroup = async (groupId, userId) => {
    const db = getFirebaseDb();
    if (!db) return { success: false };

    try {
        const groupRef = doc(db, 'groups', groupId);
        const groupSnap = await getDoc(groupRef);

        if (!groupSnap.exists()) {
            return { success: false, error: 'Group not found' };
        }

        const groupData = groupSnap.data();

        // If creator is leaving, delete the group
        if (groupData.createdBy === userId) {
            await deleteDoc(groupRef);
            return { success: true, deleted: true };
        }

        // Otherwise just remove user
        await updateDoc(groupRef, {
            members: arrayRemove(userId),
            memberCount: Math.max(0, groupData.memberCount - 1),
            updatedAt: Timestamp.now()
        });

        return { success: true };
    } catch (error) {
        console.error('Error leaving group:', error);
        throw error;
    }
};

/**
 * Get user's groups
 */
export const getUserGroups = async (userId) => {
    const db = getFirebaseDb();

    if (!db) {
        // Return demo groups
        return [
            { id: 'demo-1', name: 'Downtown Watch', icon: '🏘️', memberCount: 12, inviteCode: 'DEMO01' },
            { id: 'demo-2', name: 'Campus Safety', icon: '🎓', memberCount: 45, inviteCode: 'DEMO02' }
        ];
    }

    try {
        const q = query(
            collection(db, 'groups'),
            where('members', 'array-contains', userId),
            orderBy('updatedAt', 'desc'),
            limit(20)
        );

        const snapshot = await getDocs(q);
        const groups = [];

        snapshot.forEach(doc => {
            groups.push({ id: doc.id, ...doc.data() });
        });

        return groups;
    } catch (error) {
        console.error('Error getting user groups:', error);
        return [];
    }
};

/**
 * Get group details
 */
export const getGroupDetails = async (groupId) => {
    const db = getFirebaseDb();
    if (!db) return null;

    try {
        const groupRef = doc(db, 'groups', groupId);
        const groupSnap = await getDoc(groupRef);

        if (!groupSnap.exists()) return null;

        return { id: groupSnap.id, ...groupSnap.data() };
    } catch (error) {
        console.error('Error getting group details:', error);
        return null;
    }
};

/**
 * Get reports shared with a group
 */
export const getGroupReports = async (groupId, limitCount = 50) => {
    const db = getFirebaseDb();
    if (!db) return [];

    try {
        const q = query(
            collection(db, 'reports'),
            where('groupId', '==', groupId),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        const reports = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            reports.push({
                id: doc.id,
                ...data,
                timestamp: data.timestamp?.toDate()
            });
        });

        return reports;
    } catch (error) {
        console.error('Error getting group reports:', error);
        return [];
    }
};

