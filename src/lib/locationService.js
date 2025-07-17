// Live location service for managing driver location sharing
import { 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  onSnapshot,
  serverTimestamp,
  query,
  where 
} from 'firebase/firestore';
import { db } from './firebase.js';

/**
 * Start sharing live location for a driver
 */
export const startLocationSharing = async (userId, userEmail, driverInfo) => {
  try {
    const locationRef = doc(db, 'driverLocations', userId);
    
    // Get current position
    const position = await getCurrentPosition();
    
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
 * Stop sharing live location
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
 * Get current position using Geolocation API
 */
export const getCurrentPosition = (options = {}) => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000, // 1 minute
      ...options
    };

    navigator.geolocation.getCurrentPosition(
      resolve,
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
        
        reject(new Error(errorMessage));
      },
      defaultOptions
    );
  });
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
    timeout: 10000,
    maximumAge: 30000, // 30 seconds
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
 * Request location permission
 */
export const requestLocationPermission = async () => {
  try {
    if (!isLocationAvailable()) {
      throw new Error('Geolocation is not supported by this browser');
    }

    // Try to get current position to trigger permission request
    await getCurrentPosition({ timeout: 5000 });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

