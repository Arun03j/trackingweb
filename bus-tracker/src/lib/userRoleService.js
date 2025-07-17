// User role service for managing driver verification and permissions
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase.js';

// User roles
export const USER_ROLES = {
  STUDENT: 'student',
  DRIVER: 'driver',
  ADMIN: 'admin'
};

// Driver verification status
export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

/**
 * Create or update user profile with role
 */
export const createUserProfile = async (userId, email, displayName, role = USER_ROLES.STUDENT) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      email,
      displayName,
      role,
      verificationStatus: role === USER_ROLES.DRIVER ? VERIFICATION_STATUS.PENDING : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error('Error creating user profile:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user profile and role
 */
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { success: true, data: userSnap.data() };
    } else {
      return { success: false, error: 'User profile not found' };
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Request driver verification
 */
export const requestDriverVerification = async (userId, driverInfo) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: USER_ROLES.DRIVER,
      verificationStatus: VERIFICATION_STATUS.PENDING,
      driverInfo: {
        licenseNumber: driverInfo.licenseNumber,
        busNumber: driverInfo.busNumber,
        route: driverInfo.route,
        phoneNumber: driverInfo.phoneNumber,
        requestedAt: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error requesting driver verification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verify driver (admin function)
 */
export const verifyDriver = async (userId, status, adminNotes = '') => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      verificationStatus: status,
      adminNotes,
      verifiedAt: status === VERIFICATION_STATUS.APPROVED ? serverTimestamp() : null,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error verifying driver:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get pending driver verifications (admin function)
 */
export const getPendingDriverVerifications = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', USER_ROLES.DRIVER),
      where('verificationStatus', '==', VERIFICATION_STATUS.PENDING)
    );
    
    const querySnapshot = await getDocs(q);
    const pendingDrivers = [];
    
    querySnapshot.forEach((doc) => {
      pendingDrivers.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, data: pendingDrivers };
  } catch (error) {
    console.error('Error getting pending verifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if user can share location (is verified driver)
 */
export const canShareLocation = async (userId) => {
  try {
    const profile = await getUserProfile(userId);
    if (!profile.success) return false;
    
    const userData = profile.data;
    return userData.role === USER_ROLES.DRIVER && 
           userData.verificationStatus === VERIFICATION_STATUS.APPROVED;
  } catch (error) {
    console.error('Error checking location sharing permission:', error);
    return false;
  }
};

/**
 * Listen to user profile changes
 */
export const listenToUserProfile = (userId, callback) => {
  const userRef = doc(db, 'users', userId);
  return onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      callback({ success: true, data: doc.data() });
    } else {
      callback({ success: false, error: 'User profile not found' });
    }
  });
};

/**
 * Get all verified drivers
 */
export const getVerifiedDrivers = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', USER_ROLES.DRIVER),
      where('verificationStatus', '==', VERIFICATION_STATUS.APPROVED)
    );
    
    const querySnapshot = await getDocs(q);
    const verifiedDrivers = [];
    
    querySnapshot.forEach((doc) => {
      verifiedDrivers.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, data: verifiedDrivers };
  } catch (error) {
    console.error('Error getting verified drivers:', error);
    return { success: false, error: error.message };
  }
};

