import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  onSnapshot 
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, db } from '../firebase/config';

// Collections
const SUBMISSIONS_COLLECTION = 'submissions';
const REPRESENTATIVES_COLLECTION = 'representatives';
const ADMIN_SETTINGS_COLLECTION = 'adminSettings';

// Authentication Services
export const authService = {
  // Sign up new user
  async signUp(email, password, userData) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Add user data to Firestore
      await addDoc(collection(db, REPRESENTATIVES_COLLECTION), {
        uid: user.uid,
        email: user.email,
        ...userData,
        createdAt: new Date().toISOString(),
        active: true
      });
      
      return user;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  },

  // Sign in user
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  },

  // Sign out user
  async signOut() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },

  // Listen to auth state changes
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }
};

// Database Services
export const dbService = {
  // Submissions
  async addSubmission(submissionData) {
    try {
      const docRef = await addDoc(collection(db, SUBMISSIONS_COLLECTION), {
        ...submissionData,
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
      return { id: docRef.id, ...submissionData };
    } catch (error) {
      console.error('Error adding submission:', error);
      throw error;
    }
  },

  async getSubmissions() {
    try {
      const q = query(collection(db, SUBMISSIONS_COLLECTION), orderBy('submittedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting submissions:', error);
      throw error;
    }
  },

  // Real-time submissions listener
  onSubmissionsChange(callback) {
    const q = query(collection(db, SUBMISSIONS_COLLECTION), orderBy('submittedAt', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
      const submissions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(submissions);
    });
  },

  // Representatives
  async addRepresentative(repData) {
    try {
      const docRef = await addDoc(collection(db, REPRESENTATIVES_COLLECTION), {
        ...repData,
        createdAt: new Date().toISOString(),
        active: true
      });
      return { id: docRef.id, ...repData };
    } catch (error) {
      console.error('Error adding representative:', error);
      throw error;
    }
  },

  async getRepresentatives() {
    try {
      const querySnapshot = await getDocs(collection(db, REPRESENTATIVES_COLLECTION));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting representatives:', error);
      throw error;
    }
  },

  async updateRepresentative(id, updates) {
    try {
      const docRef = doc(db, REPRESENTATIVES_COLLECTION, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      return { id, ...updates };
    } catch (error) {
      console.error('Error updating representative:', error);
      throw error;
    }
  },

  async deleteRepresentative(id) {
    try {
      await deleteDoc(doc(db, REPRESENTATIVES_COLLECTION, id));
      return id;
    } catch (error) {
      console.error('Error deleting representative:', error);
      throw error;
    }
  },

  // Real-time representatives listener
  onRepresentativesChange(callback) {
    return onSnapshot(collection(db, REPRESENTATIVES_COLLECTION), (querySnapshot) => {
      const representatives = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(representatives);
    });
  },

  // Get representative by UID
  async getRepresentativeByUid(uid) {
    try {
      const q = query(collection(db, REPRESENTATIVES_COLLECTION), where('uid', '==', uid));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting representative by UID:', error);
      throw error;
    }
  },

  // Admin Settings
  async getAdminSettings() {
    try {
      const querySnapshot = await getDocs(collection(db, ADMIN_SETTINGS_COLLECTION));
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting admin settings:', error);
      throw error;
    }
  },

  async updateAdminSettings(settings) {
    try {
      const querySnapshot = await getDocs(collection(db, ADMIN_SETTINGS_COLLECTION));
      
      if (!querySnapshot.empty) {
        // Update existing settings
        const docRef = doc(db, ADMIN_SETTINGS_COLLECTION, querySnapshot.docs[0].id);
        await updateDoc(docRef, {
          ...settings,
          updatedAt: new Date().toISOString()
        });
        return { id: querySnapshot.docs[0].id, ...settings };
      } else {
        // Create new settings document
        const docRef = await addDoc(collection(db, ADMIN_SETTINGS_COLLECTION), {
          ...settings,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        return { id: docRef.id, ...settings };
      }
    } catch (error) {
      console.error('Error updating admin settings:', error);
      throw error;
    }
  },

  // Admin Password Management
  async getAdminPassword() {
    try {
      console.log('Getting admin password from Firebase...');
      const settings = await this.getAdminSettings();
      console.log('Admin settings from Firebase:', settings);
      const password = settings?.adminPassword || 'admin123';
      console.log('Retrieved password:', password);
      return password;
    } catch (error) {
      console.error('Error getting admin password:', error);
      // Also check localStorage as fallback
      const localPassword = localStorage.getItem('adminPassword');
      console.log('Fallback to localStorage password:', localPassword);
      return localPassword || 'admin123';
    }
  },

  async updateAdminPassword(newPassword) {
    try {
      console.log('Updating admin password in Firebase:', newPassword);
      const currentSettings = await this.getAdminSettings();
      console.log('Current settings before update:', currentSettings);
      
      const updatedSettings = {
        ...currentSettings,
        adminPassword: newPassword,
        passwordLastChanged: new Date().toISOString()
      };
      
      console.log('Settings to update:', updatedSettings);
      const result = await this.updateAdminSettings(updatedSettings);
      console.log('Update result:', result);
      
      // Also save to localStorage as backup
      localStorage.setItem('adminPassword', newPassword);
      console.log('Password also saved to localStorage');
      
      return result;
    } catch (error) {
      console.error('Error updating admin password:', error);
      // Save to localStorage as fallback
      localStorage.setItem('adminPassword', newPassword);
      console.log('Password saved to localStorage as fallback');
      throw error;
    }
  }
};

const firebaseService = { authService, dbService };
export default firebaseService;
