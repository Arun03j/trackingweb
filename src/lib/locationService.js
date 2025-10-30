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
 * Get current position using Geolocation API with fallback strategies
 */
export const getCurrentPosition = async (options = {}) => {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by this browser');
  }

  // Multiple strategies to try
  const strategies = [
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options
    },
    {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 5000
    },
    {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 60000
    }
  ];

  let lastError = null;

  for (const strategy of strategies) {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          strategy
        );
      });

      return position; // Success!
    } catch (error) {
      lastError = error;
      console.warn('Location strategy failed, trying next...', error);
    }
  }

  // All strategies failed
  let errorMessage = 'Unknown location error';

  if (lastError) {
    switch (lastError.code) {
      case 1: // PERMISSION_DENIED
        errorMessage = 'Location access denied. Please enable location permissions in your browser.';
        break;
      case 2: // POSITION_UNAVAILABLE
        errorMessage = 'Location unavailable. Please check if location services are enabled on your device.';
        break;
      case 3: // TIMEOUT
        errorMessage = 'Location request timed out. Please check your connection and try again.';
        break;
    }
  }

  throw new Error(errorMessage);
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

