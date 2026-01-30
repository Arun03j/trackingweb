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
      isPending: true,
      isVerified: false,
      isRejected: false,
      driverInfo: {
        licenseNumber: driverInfo.licenseNumber,
        busNumber: driverInfo.busNumber,
        route: driverInfo.route,
        phoneNumber: driverInfo.phoneNumber,
        additionalInfo: driverInfo.additionalInfo,
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
 * Verify/Approve any user (student, driver, admin) - admin function
 */
export const verifyUser = async (userId, isApproved, adminNotes = '') => {
  try {
    console.log('🔵 VERIFY USER CALLED', {
      userId,
      isApproved,
      adminNotes,
      timestamp: new Date().toISOString()
    });

    // First check if the user document exists
    const userRef = doc(db, 'users', userId);
    console.log('📄 Fetching user document:', userId);
    
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.error('❌ User document not found:', userId);
      throw new Error('User document not found');
    }
    
    const currentData = userSnap.data();
    console.log('📋 Current user data:', {
      role: currentData.role,
      displayName: currentData.displayName,
      isPending: currentData.isPending,
      isVerified: currentData.isVerified,
      isRejected: currentData.isRejected
    });
    
    // Allow any user type (student, driver, admin) to be verified
    // Just ensure they exist and are pending
    if (!currentData.isPending) {
      console.warn('⚠️ User is not in pending status:', currentData.isPending);
    }
    
    const updateData = {
      ...currentData,
      adminNotes: adminNotes || currentData.adminNotes || '',
      isPending: false,
      updatedAt: serverTimestamp()
    };
    
    if (isApproved) {
      updateData.isVerified = true;
      updateData.isRejected = false;
      updateData.verifiedAt = serverTimestamp();
      console.log('✅ Setting user as VERIFIED (Role:', currentData.role, ')');
    } else {
      updateData.isVerified = false;
      updateData.isRejected = true;
      updateData.rejectedAt = serverTimestamp();
      console.log('❌ Setting user as REJECTED (Role:', currentData.role, ')');
    }
    
    console.log('💾 Writing update to Firestore...');
    
    // Use setDoc with merge to update the document
    await setDoc(userRef, updateData, { merge: true });
    
    console.log('✅ USER VERIFICATION COMPLETE - Success!');
    return { success: true };
    
  } catch (error) {
    console.error('❌ ERROR IN VERIFY USER:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    return { 
      success: false, 
      error: error.message || 'Failed to verify user',
      code: error.code
    };
  }
};

/**
 * Verify driver (backward compatibility - calls verifyUser)
 */
export const verifyDriver = async (userId, isApproved, adminNotes = '') => {
  return verifyUser(userId, isApproved, adminNotes);
};

/**
 * Get pending driver verifications (admin function)
 */
export const getPendingDriverVerifications = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      where('isPending', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const pendingDrivers = [];
    
    querySnapshot.forEach((doc) => {
      const userData = {
        id: doc.id,
        ...doc.data()
      };
      
      // Filter for drivers that are pending and not verified
      if (userData.role === USER_ROLES.DRIVER && userData.isVerified === false) {
        pendingDrivers.push(userData);
      }
    });
    
    return { success: true, data: pendingDrivers };
  } catch (error) {
    console.error('Error getting pending verifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if user is a verified driver
 */
export const canShareLocation = async (userId) => {
  try {
    const profile = await getUserProfile(userId);
    if (!profile.success) return false;
    
    const userData = profile.data;
    return userData.role === USER_ROLES.DRIVER && 
           userData.isVerified === true && userData.isPending === false;
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
      where('isVerified', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const verifiedDrivers = [];
    
    querySnapshot.forEach((doc) => {
      const userData = {
        id: doc.id,
        ...doc.data()
      };
      
      // Filter for verified drivers only
      if (userData.role === USER_ROLES.DRIVER) {
        verifiedDrivers.push(userData);
      }
    });
    
    return { success: true, data: verifiedDrivers };
  } catch (error) {
    console.error('Error getting verified drivers:', error);
    return { success: false, error: error.message };
  }
};

