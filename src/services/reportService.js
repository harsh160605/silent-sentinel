import { getFirebaseDb } from './firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { generateGeohash } from './geolocation';

/**
 * Submit a new safety report
 */
export const submitReport = async (reportData) => {
  const db = getFirebaseDb();
  if (!db) {
    throw new Error('Firebase Database not initialized. Check configuration.');
  }

  const report = {
    ...reportData,
    timestamp: Timestamp.now(),
    status: 'unverified',
    expiresAt: Timestamp.fromDate(
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days expiry
    ),
    location: {
      lat: reportData.location.lat,
      lng: reportData.location.lng,
      geohash: generateGeohash(reportData.location.lat, reportData.location.lng),
    },
  };

  try {
    const docRef = await addDoc(collection(db, 'reports'), report);
    return { id: docRef.id, ...report };
  } catch (error) {
    console.error('Error submitting report:', error);
    throw error;
  }
};

/**
 * Fetch reports within a geographic area
 */
export const fetchReportsInArea = async (center, radiusKm = 5) => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn('Database not ready. Returning empty reports list.');
    return [];
  }

  // Calculate geohash prefix for approximate area
  const geohashPrefix = generateGeohash(center.lat, center.lng).substring(0, 4);

  try {
    const q = query(
      collection(db, 'reports'),
      where('location.geohash', '>=', geohashPrefix),
      where('location.geohash', '<=', geohashPrefix + '\uf8ff'),
      orderBy('location.geohash'),
      orderBy('timestamp', 'desc'),
      limit(500)
    );

    const querySnapshot = await getDocs(q);
    const reports = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Filter out expired reports
      if (data.expiresAt && data.expiresAt.toDate() > new Date()) {
        reports.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp.toDate(),
          expiresAt: data.expiresAt.toDate(),
        });
      }
    });

    return reports;
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
};

/**
 * Fetch pattern clusters
 */
export const fetchPatterns = async (center) => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn('Database not ready. Returning empty patterns list.');
    return [];
  }
  const geohashPrefix = generateGeohash(center.lat, center.lng).substring(0, 4);

  try {
    const q = query(
      collection(db, 'patterns'),
      where('location.geohash', '>=', geohashPrefix),
      where('location.geohash', '<=', geohashPrefix + '\uf8ff'),
      orderBy('location.geohash'),
      orderBy('confidence', 'desc'),
      limit(100)
    );

    const querySnapshot = await getDocs(q);
    const patterns = [];

    querySnapshot.forEach((doc) => {
      patterns.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return patterns;
  } catch (error) {
    console.error('Error fetching patterns:', error);
    throw error;
  }
};

