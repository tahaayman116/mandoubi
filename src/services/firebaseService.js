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
const FORM_SETTINGS_COLLECTION = 'formSettings';

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
  // Form Settings Services
  async saveFormSettings(settings) {
    try {
      // Check if form settings already exist
      const existingSettings = await this.getFormSettings();
      
      if (existingSettings) {
        // Update existing document instead of creating new one
        console.log('Updating existing form settings document:', existingSettings.id);
        const result = await this.updateFormSettings(existingSettings.id, settings);
        
        // Also save to Appwrite
        try {
          const { appwriteService } = await import('./appwriteService');
          await appwriteService.saveFormSettings(settings);
          console.log('Form settings synced to Appwrite');
        } catch (appwriteError) {
          console.error('Failed to sync form settings to Appwrite:', appwriteError);
        }
        
        return result;
      } else {
        // Create new document only if none exists
        console.log('Creating new form settings document');
        const settingsRef = collection(db, FORM_SETTINGS_COLLECTION);
        const docRef = await addDoc(settingsRef, {
          ...settings,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        const result = { id: docRef.id, ...settings };
        
        // Also save to Appwrite
        try {
          const { appwriteService } = await import('./appwriteService');
          await appwriteService.saveFormSettings(settings);
          console.log('Form settings synced to Appwrite');
        } catch (appwriteError) {
          console.error('Failed to sync form settings to Appwrite:', appwriteError);
        }
        
        return result;
      }
    } catch (error) {
      console.error('Error saving form settings:', error);
      throw error;
    }
  },

  async getFormSettings() {
    try {
      const settingsRef = collection(db, FORM_SETTINGS_COLLECTION);
      const q = query(settingsRef, orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting form settings:', error);
      return null;
    }
  },

  async updateFormSettings(settingsId, newSettings) {
    try {
      const settingsRef = doc(db, FORM_SETTINGS_COLLECTION, settingsId);
      await updateDoc(settingsRef, {
        ...newSettings,
        updatedAt: new Date().toISOString()
      });
      return { id: settingsId, ...newSettings };
    } catch (error) {
      console.error('Error updating form settings:', error);
      throw error;
    }
  },

  // Clean up duplicate form settings - keep only the latest
  async cleanupDuplicateFormSettings() {
    try {
      const settingsRef = collection(db, FORM_SETTINGS_COLLECTION);
      const q = query(settingsRef, orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.size <= 1) {
        console.log('No duplicate form settings found');
        return 0;
      }
      
      // Keep the first (latest) document, delete the rest
      const docsToDelete = querySnapshot.docs.slice(1);
      console.log(`Found ${docsToDelete.length} duplicate form settings to delete`);
      
      const deletePromises = docsToDelete.map(docSnapshot => {
        console.log('Deleting duplicate form setting:', docSnapshot.id, docSnapshot.data());
        return deleteDoc(docSnapshot.ref);
      });
      
      await Promise.all(deletePromises);
      console.log(`Cleaned up ${docsToDelete.length} duplicate form settings`);
      return docsToDelete.length;
    } catch (error) {
      console.error('Error cleaning up duplicate form settings:', error);
      throw error;
    }
  },

  // Submissions
  async addSubmission(submissionData) {
    try {
      console.log('Firebase service - adding submission:', submissionData);
      
      // Clean the data - remove any undefined values
      const cleanData = {};
      Object.keys(submissionData).forEach(key => {
        if (submissionData[key] !== undefined) {
          cleanData[key] = submissionData[key];
        } else {
          console.warn(`Removing undefined field: ${key}`);
        }
      });
      
      console.log('Firebase service - clean data:', cleanData);
      
      const submissionsRef = collection(db, SUBMISSIONS_COLLECTION);
      const docRef = await addDoc(submissionsRef, {
        ...cleanData,
        createdAt: new Date().toISOString()
      });
      
      const result = { id: docRef.id, ...cleanData };
      
      // Note: Appwrite sync is handled by dualDatabaseService to avoid duplicates
      
      return result;
    } catch (error) {
      console.error('Error adding submission:', error);
      throw error;
    }
  },

  async getSubmissions() {
    try {
      // Try different field names for ordering
      let q;
      try {
        q = query(collection(db, SUBMISSIONS_COLLECTION), orderBy('timestamp', 'desc'));
      } catch (orderError) {
        console.log('timestamp field not found, trying createdAt');
        try {
          q = query(collection(db, SUBMISSIONS_COLLECTION), orderBy('createdAt', 'desc'));
        } catch (orderError2) {
          console.log('createdAt field not found, getting all without ordering');
          q = collection(db, SUBMISSIONS_COLLECTION);
        }
      }
      
      const querySnapshot = await getDocs(q);
      const submissions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('Retrieved submissions:', submissions.length);
      console.log('Submissions data:', submissions);
      
      return submissions;
    } catch (error) {
      console.error('Error getting submissions:', error);
      throw error;
    }
  },

  async deleteSubmission(id) {
    try {
      await deleteDoc(doc(db, SUBMISSIONS_COLLECTION, id));
      return id;
    } catch (error) {
      console.error('Error deleting submission:', error);
      throw error;
    }
  },

  // Real-time submissions listener
  onSubmissionsChange(callback) {
    // Try different field names for ordering
    let q;
    try {
      q = query(collection(db, SUBMISSIONS_COLLECTION), orderBy('timestamp', 'desc'));
    } catch (orderError) {
      console.log('timestamp field not found in listener, trying createdAt');
      try {
        q = query(collection(db, SUBMISSIONS_COLLECTION), orderBy('createdAt', 'desc'));
      } catch (orderError2) {
        console.log('createdAt field not found in listener, getting all without ordering');
        q = collection(db, SUBMISSIONS_COLLECTION);
      }
    }
    
    return onSnapshot(q, (querySnapshot) => {
      const submissions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Real-time submissions listener triggered:', submissions.length);
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
      
      const result = { id: docRef.id, ...repData, active: true };
      
      // Note: Appwrite sync is handled by dualDatabaseService to avoid duplicates
      
      return result;
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

  // Clear all representatives data
  async clearAllRepresentatives() {
    try {
      const querySnapshot = await getDocs(collection(db, REPRESENTATIVES_COLLECTION));
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      console.log(`Cleared ${querySnapshot.size} representatives from Firebase`);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error clearing all representatives:', error);
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
      console.log('updateAdminSettings called with:', settings);
      const querySnapshot = await getDocs(collection(db, ADMIN_SETTINGS_COLLECTION));
      console.log('Query snapshot empty?', querySnapshot.empty);
      console.log('Number of docs found:', querySnapshot.size);
      
      if (!querySnapshot.empty) {
        // Update existing settings
        const existingDoc = querySnapshot.docs[0];
        console.log('Existing document ID:', existingDoc.id);
        console.log('Existing document data:', existingDoc.data());
        
        const docRef = doc(db, ADMIN_SETTINGS_COLLECTION, existingDoc.id);
        const updateData = {
          ...settings,
          updatedAt: new Date().toISOString()
        };
        console.log('Updating with data:', updateData);
        
        await updateDoc(docRef, updateData);
        console.log('Document updated successfully');
        return { id: existingDoc.id, ...settings };
      } else {
        // Create new settings document
        console.log('Creating new settings document');
        const newDocData = {
          ...settings,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        console.log('Creating with data:', newDocData);
        
        const docRef = await addDoc(collection(db, ADMIN_SETTINGS_COLLECTION), newDocData);
        console.log('New document created with ID:', docRef.id);
        return { id: docRef.id, ...settings };
      }
    } catch (error) {
      console.error('Error updating admin settings:', error);
      console.error('Error details:', error.message, error.code);
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
