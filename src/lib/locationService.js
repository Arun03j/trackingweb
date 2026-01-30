// Live location service for managing driver location sharing
import { 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  onSnapshot,
  serverTimestamp,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from './firebase.js';

/**
 * Create driver location record
 */
export const startLocationSharing = async (userId, userEmail, driverInfo) => {
  try {
    const locationRef = doc(db, 'driverLocations', userId);
    
    // Get current position
    const position = await getCurrentPosition({
      enableHighAccuracy: false,
      timeout: 20000,
      maximumAge: 300000
    });
    
    await setDoc(locationRef, {
      userId,
      email: userEmail,
      displayName: driverInfo.displayName || 'Driver',
      busNumber: driverInfo.busNumber || 'Unknown',
      route: driverInfo.route || 'Unknown Route',
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      heading: position.coords.heading || 0,
      speed: position.coords.speed || 0,
      timestamp: serverTimestamp(),
      isActive: true,
      lastSeen: serverTimestamp()
    });
    
    return { success: true, position };
  } catch (error) {
    console.error('Error starting location sharing:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update driver location
 */
export const updateDriverLocation = async (userId, position) => {
  try {
    const locationRef = doc(db, 'driverLocations', userId);
    
    await setDoc(locationRef, {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      heading: position.coords.heading || 0,
      speed: position.coords.speed || 0,
      timestamp: serverTimestamp(),
      lastSeen: serverTimestamp()
    }, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating location:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove driver location record
 */
export const stopLocationSharing = async (userId) => {
  try {
    const locationRef = doc(db, 'driverLocations', userId);
    await deleteDoc(locationRef);
    
    return { success: true };
  } catch (error) {
    console.error('Error stopping location sharing:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get current position using Geolocation API with fallback strategies
 */
export const getCurrentPosition = async (options = {}) => {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by this browser');
  }

  // Detect if on mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Multiple strategies to try - optimized for mobile
  const strategies = [
    {
      // Mobile: Fast with cached location
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: isMobile ? 600000 : 300000, // Accept older cache on mobile
      ...options
    },
    {
      // Mobile/Desktop: Medium accuracy with longer timeout
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: isMobile ? 300000 : 60000
    },
    {
      // Desktop: High accuracy with longest timeout
      enableHighAccuracy: isMobile ? false : true,
      timeout: isMobile ? 20000 : 30000,
      maximumAge: isMobile ? 60000 : 0
    }
  ];

  let lastError = null;

  for (let i = 0; i < strategies.length; i++) {
    try {
      const position = await new Promise((resolve, reject) => {
        const timeoutHandle = setTimeout(() => {
          reject(new Error(`Timeout on strategy ${i + 1}`));
        }, strategies[i].timeout + 1000);

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            clearTimeout(timeoutHandle);
            resolve(pos);
          },
          (err) => {
            clearTimeout(timeoutHandle);
            reject(err);
          },
          strategies[i]
        );
      });

      return position; // Success!
    } catch (error) {
      lastError = error;
      console.warn(`Location strategy ${i + 1} failed:`, error.message);
    }
  }

  // Fallback: try watchPosition once, then stop
  try {
    const position = await new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        navigator.geolocation.clearWatch(watchId);
        reject(new Error('Watch position timeout'));
      }, 25000);

      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          clearTimeout(timeoutHandle);
          navigator.geolocation.clearWatch(watchId);
          resolve(pos);
        },
        (err) => {
          clearTimeout(timeoutHandle);
          navigator.geolocation.clearWatch(watchId);
          reject(err);
        },
        {
          enableHighAccuracy: false,
          timeout: 20000,
          maximumAge: isMobile ? 300000 : 60000
        }
      );
    });

    return position;
  } catch (error) {
    lastError = error;
  }

  // All strategies failed
  let errorMessage = 'Unknown location error';
  let errorCode = lastError?.code;

  if (lastError) {
    switch (lastError.code) {
      case 1: // PERMISSION_DENIED
        if (isMobile) {
          errorMessage = '🔒 Location access denied.\n\nOn your phone:\n1. Go to Settings\n2. Find Safari/Browser → Location Services\n3. Select "Always" or "While Using"\n4. Come back and try again';
        } else {
          errorMessage = '🔒 Location access denied.\n\nPlease enable location in your browser settings and try again.';
        }
        break;
      case 2: // POSITION_UNAVAILABLE
        if (isMobile) {
          errorMessage = '📡 Location services not available.\n\nOn your phone:\n1. Enable Location Services in Settings\n2. Ensure WiFi or Cellular is ON\n3. Try again in a moment (GPS takes time)';
        } else {
          errorMessage = '📡 Location unavailable.\n\nPlease ensure location services are enabled on your device.';
        }
        break;
      case 3: // TIMEOUT
        errorMessage = '⏱️ Location request timed out.\n\nThis can happen if:\n• You\'re in a building or underground\n• Location services are slow\n• GPS signal is weak\n\nTry again or use demo location.';
        break;
    }
  }

  const error = new Error(errorMessage);
  error.code = errorCode;
  throw error;
};

/**
 * Watch position changes
 */
export const watchPosition = (callback, errorCallback, options = {}) => {
  if (!navigator.geolocation) {
    errorCallback(new Error('Geolocation is not supported by this browser'));
    return null;
  }

  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 20000,
    maximumAge: 60000, // 60 seconds
    ...options
  };

  return navigator.geolocation.watchPosition(
    callback,
    (error) => {
      let errorMessage = 'Unknown location error';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location access denied by user';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information unavailable';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out';
          break;
      }
      
      errorCallback(new Error(errorMessage));
    },
    defaultOptions
  );
};

/**
 * Listen to all active driver locations
 */
export const listenToDriverLocations = (callback) => {
  const q = query(
    collection(db, 'driverLocations'),
    where('isActive', '==', true)
  );
  
  return onSnapshot(q, (snapshot) => {
    const drivers = [];
    snapshot.forEach((doc) => {
      drivers.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(drivers);
  });
};

/**
 * Check if location services are available
 */
export const isLocationAvailable = () => {
  return 'geolocation' in navigator;
};

/**
 * Delete a specific driver location by user ID
 */
export const deleteDriverLocation = async (userId) => {
  try {
    const locationRef = doc(db, 'driverLocations', userId);
    await deleteDoc(locationRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting driver location:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Clean up old/stale driver locations (older than specified hours)
 */
export const cleanupStaleDriverLocations = async (hoursOld = 24) => {
  try {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursOld);
    
    const locationsQuery = collection(db, 'driverLocations');
    const snapshot = await getDocs(locationsQuery);
    
    const deletePromises = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const lastSeen = data.lastSeen?.toDate() || data.timestamp?.toDate();
      
      if (lastSeen && lastSeen < cutoffTime) {
        deletePromises.push(deleteDoc(doc.ref));
      }
    });
    
    await Promise.all(deletePromises);
    return { success: true, deleted: deletePromises.length };
  } catch (error) {
    console.error('Error cleaning up stale locations:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Request location permission
 */
export const requestLocationPermission = async () => {
  try {
    if (!isLocationAvailable()) {
      throw new Error('Geolocation is not supported by this browser');
    }

    // Try to get current position to trigger permission request
    await getCurrentPosition({ timeout: 15000, maximumAge: 60000 });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Check if a driver is currently sharing their location
 */
export const getDriverLocation = async (userId) => {
  try {
    const { getDoc } = await import('firebase/firestore');
    const locationRef = doc(db, 'driverLocations', userId);
    const docSnap = await getDoc(locationRef);
    
    if (docSnap.exists()) {
      return { 
        success: true, 
        isSharing: true,
        data: { id: docSnap.id, ...docSnap.data() }
      };
    }
    
    return { success: true, isSharing: false, data: null };
  } catch (error) {
    console.error('Error checking driver location:', error);
    return { success: false, error: error.message };
  }
};

