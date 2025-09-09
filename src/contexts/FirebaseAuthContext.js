import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, dbService } from '../services/firebaseService';
import { appwriteService } from '../services/appwriteService';

const FirebaseAuthContext = createContext();

export function useFirebaseAuth() {
  return useContext(FirebaseAuthContext);
}

export function FirebaseAuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [representatives, setRepresentatives] = useState([]);
  const [dataLoaded, setDataLoaded] = useState({ submissions: false, representatives: false });

  // Lazy loading functions
  const loadSubmissions = async () => {
    if (!dataLoaded.submissions && currentUser) {
      try {
        console.log('📖 Loading submissions data...');
        const submissionsData = await dbService.getSubmissions();
        setSubmissions(submissionsData);
        setDataLoaded(prev => ({ ...prev, submissions: true }));
        console.log(`✅ Loaded ${submissionsData.length} submissions`);
      } catch (error) {
        console.error('Error loading submissions:', error);
      }
    }
    return submissions;
  };

  const loadRepresentatives = async () => {
    if (!dataLoaded.representatives && currentUser) {
      try {
        console.log('📖 Loading representatives data...');
        const representativesData = await dbService.getRepresentatives();
        setRepresentatives(representativesData);
        setDataLoaded(prev => ({ ...prev, representatives: true }));
        console.log(`✅ Loaded ${representativesData.length} representatives`);
      } catch (error) {
        console.error('Error loading representatives:', error);
      }
    }
    return representatives;
  };

  // Helper function to send data to Google Sheets
  const sendToGoogleSheets = async (data, action) => {
    try {
      // Get Google Sheets URL from admin settings
      const adminSettings = await dbService.getAdminSettings();
      const googleSheetsUrl = adminSettings?.googleSheetsUrl;
      
      if (!googleSheetsUrl) {
        console.log('No Google Sheets URL configured, skipping sync');
        return;
      }

      const payload = {
        action: action,
        ...data,
        timestamp: new Date().toISOString()
      };

      console.log('Sending to Google Sheets:', payload);

      // Use FormData for better compatibility
      const formData = new FormData();
      formData.append('data', JSON.stringify(payload));

      const response = await fetch(googleSheetsUrl, {
        method: 'POST',
        body: formData
      });

      console.log('Google Sheets sync completed');
      
      try {
        const responseText = await response.text();
        console.log('Google Sheets response:', responseText);
      } catch (parseError) {
        console.log('Data sent to Google Sheets but could not read response');
      }
      
    } catch (error) {
      console.error('Failed to send to Google Sheets:', error);
      // Don't throw error - local save was successful
    }
  };

  // Initialize auth state listener
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        // Get user profile from Firestore
        try {
          const profile = await dbService.getRepresentativeByUid(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error getting user profile:', error);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    // Initialize Appwrite separately
    const initAppwrite = async () => {
      try {
        console.log('🔄 Initializing Appwrite...');
        const result = await appwriteService.init();
        console.log('Appwrite status:', result);
      } catch (error) {
        console.error('Error initializing Appwrite:', error);
      }
    };
    
    initAppwrite();

    return unsubscribe;
  }, []);

  // Initialize real-time data listeners
  useEffect(() => {
    let unsubscribeSubmissions;
    let unsubscribeRepresentatives;

    if (currentUser) {
      // Listen to submissions changes
      unsubscribeSubmissions = dbService.onSubmissionsChange((newSubmissions) => {
        console.log('Submissions updated in context:', newSubmissions);
        setSubmissions(newSubmissions);
      });

      // Listen to representatives changes (load for all users, not just admin)
      unsubscribeRepresentatives = dbService.onRepresentativesChange((newRepresentatives) => {
        console.log('Representatives loaded in context:', newRepresentatives);
        setRepresentatives(newRepresentatives);
      });
    }

    return () => {
      if (unsubscribeSubmissions) unsubscribeSubmissions();
      if (unsubscribeRepresentatives) unsubscribeRepresentatives();
    };
  }, [currentUser, userProfile]);

  // Authentication functions
  const signUp = async (email, password, userData) => {
    try {
      const user = await authService.signUp(email, password, userData);
      return user;
    } catch (error) {
      throw error;
    }
  };

  const signIn = async (email, password) => {
    try {
      const user = await authService.signIn(email, password);
      return user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.signOut();
      setCurrentUser(null);
      setUserProfile(null);
      setSubmissions([]);
      setRepresentatives([]);
    } catch (error) {
      throw error;
    }
  };

  // Legacy login function for backward compatibility
  const login = async (username, password) => {
    // Admin login - check against Firebase stored password
    if (username === 'admin') {
      try {
        console.log('Admin login attempt...');
        const storedAdminPassword = await dbService.getAdminPassword();
        console.log('Checking password against stored password');
        if (password === storedAdminPassword) {
          // Create a mock admin user for backward compatibility
          const adminUser = {
            uid: 'admin',
            email: 'admin@campaign.com',
            displayName: 'Admin'
          };
          setCurrentUser(adminUser);
          setUserProfile({
            id: 'admin',
            name: 'المدير',
            role: 'admin',
            active: true
          });
          
          // Load data for admin only when needed (lazy loading)
          console.log('Admin logged in successfully - data will be loaded when accessed');
          
          return { success: true, user: adminUser };
        } else {
          return { success: false, message: 'كلمة المرور غير صحيحة' };
        }
      } catch (error) {
        console.error('Error checking admin password:', error);
        return { success: false, message: 'حدث خطأ أثناء التحقق من كلمة المرور' };
      }
    }

    // Representative login - check against Firestore
    try {
      const reps = await dbService.getRepresentatives();
      const rep = reps.find(r => r.username === username && r.password === password && r.active);
      
      if (rep) {
        const mockUser = {
          uid: rep.id,
          email: rep.email || `${username}@campaign.com`,
          displayName: rep.name
        };
        setCurrentUser(mockUser);
        setUserProfile(rep);
        
        // Data will be loaded when needed (lazy loading)
        console.log('Representative logged in - data will be loaded when accessed');
        
        return mockUser;
      } else {
        throw new Error('بيانات الدخول غير صحيحة');
      }
    } catch (error) {
      throw error;
    }
  };

  // Data management functions
  const addSubmission = async (submissionData) => {
    try {
      console.log('Original submission data:', submissionData);
      console.log('userProfile:', userProfile);
      console.log('currentUser:', currentUser);
      
      const newSubmission = {
        ...submissionData,
        representativeId: userProfile?.id || currentUser?.uid
      };
      
      // Don't override submittedBy if it's already provided
      if (!submissionData.submittedBy) {
        newSubmission.submittedBy = userProfile?.name || currentUser?.displayName || 'غير محدد';
      }
      
      console.log('Final submission data:', newSubmission);
      
      // Use dual database service to save to both Firebase and Appwrite
      const { dualDatabaseService } = await import('../services/dualDatabaseService');
      const result = await dualDatabaseService.addSubmission(newSubmission);
      console.log('📝 Submission added to both databases:', result);
      
      // Send to Google Apps Script automatically
      await sendToGoogleSheets(newSubmission, 'add_submission');
      
      // Return Firebase result for compatibility
      return result.firebase;
    } catch (error) {
      console.error('Error adding submission:', error);
      throw error;
    }
  };

  // Commented out unused function
  // const addSubmissionToAppwrite = async (submissionData) => {
  //   try {
  //     const newSubmission = {
  //       ...submissionData,
  //       submittedBy: userProfile?.name || currentUser?.displayName,
  //       representativeId: userProfile?.id || currentUser?.uid
  //     };
  //     
  //     // Add to Appwrite only
  //     const result = await appwriteService.addSubmission(newSubmission);
  //     console.log('📝 Submission added to Appwrite:', result);
  //     
  //     return result;
  //   } catch (error) {
  //     console.error('Error adding submission to Appwrite:', error);
  //     throw error;
  //   }
  // };

  const addRepresentative = async (repData) => {
    try {
      // Use dual database service to save to both Firebase and Appwrite
      const { dualDatabaseService } = await import('../services/dualDatabaseService');
      const result = await dualDatabaseService.addRepresentative(repData);
      console.log('📝 Representative added to both databases:', result);
      
      // Send to Google Apps Script automatically
      await sendToGoogleSheets(repData, 'add_representative');
      
      // Return Firebase result for compatibility
      return result.firebase;
    } catch (error) {
      throw error;
    }
  };

  // Commented out unused function
  // const addRepresentativeToAppwrite = async (repData) => {
  //   try {
  //     // Add to Appwrite only
  //     const result = await appwriteService.addRepresentative(repData);
  //     console.log('📝 Representative added to Appwrite:', result);
  //     
  //     // Send to Google Apps Script automatically
  //     await sendToGoogleSheets(repData, 'add_representative');
  //     
  //     return result;
  //   } catch (error) {
  //     throw error;
  //   }
  // };

  const updateRepresentative = async (id, updates) => {
    try {
      const result = await dbService.updateRepresentative(id, updates);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const deleteRepresentative = async (id) => {
    try {
      // Delete from Firebase only
      await dbService.deleteRepresentative(id);
      return id;
    } catch (error) {
      throw error;
    }
  };

  const deleteRepresentativeFromAppwrite = async (id) => {
    try {
      // Delete from Appwrite only
      await appwriteService.deleteRepresentative(id);
      return id;
    } catch (error) {
      throw error;
    }
  };

  const clearAllRepresentatives = async () => {
    try {
      // Clear from Firebase only
      const count = await dbService.clearAllRepresentatives();
      setRepresentatives([]);
      return count;
    } catch (error) {
      throw error;
    }
  };

  const clearAllRepresentativesFromAppwrite = async () => {
    try {
      // Clear from Appwrite only
      const count = await appwriteService.clearAllRepresentatives();
      return count;
    } catch (error) {
      throw error;
    }
  };

  // Get data from Appwrite
  const getRepresentatives = async () => {
    try {
      const result = await dbService.getRepresentatives();
      console.log('getRepresentatives called, result:', result);
      setRepresentatives(result);
      return result;
    } catch (error) {
      console.error('Error in getRepresentatives:', error);
      throw error;
    }
  };

  const getRepresentativesFromAppwrite = async () => {
    try {
      const result = await appwriteService.getRepresentatives();
      return result;
    } catch (error) {
      throw error;
    }
  };

  const getSubmissionsFromAppwrite = async () => {
    try {
      const result = await appwriteService.getSubmissions();
      return result;
    } catch (error) {
      throw error;
    }
  };

  const deleteSubmission = async (id) => {
    try {
      await dbService.deleteSubmission(id);
      return id;
    } catch (error) {
      console.error('Error deleting submission:', error);
      throw error;
    }
  };

  // Delete all submissions for a specific person
  const deletePersonSubmissions = async (personName) => {
    try {
      const personSubmissions = submissions.filter(sub => sub.submittedBy === personName);
      const deletePromises = personSubmissions.map(sub => deleteSubmission(sub.id));
      await Promise.all(deletePromises);
      
      // Update local state instead of re-reading from Firebase
      const updatedSubmissions = submissions.filter(sub => sub.submittedBy !== personName);
      setSubmissions(updatedSubmissions);
      
      return personSubmissions.length;
    } catch (error) {
      console.error('Error deleting person submissions:', error);
      throw error;
    }
  };

  // Clear all submissions data
  const clearAllSubmissions = async () => {
    try {
      const deletePromises = submissions.map(sub => deleteSubmission(sub.id));
      await Promise.all(deletePromises);
      
      // Clear local state instead of re-reading from Firebase
      setSubmissions([]);
      
      return submissions.length;
    } catch (error) {
      console.error('Error clearing all submissions:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    userProfile,
    user: userProfile, // For backward compatibility
    submissions,
    representatives,
    loading,
    signUp,
    signIn,
    login,
    logout,
    // Data loading functions (lazy loading)
    loadSubmissions,
    loadRepresentatives,
    // Firebase functions
    addSubmission,
    addRepresentative,
    updateRepresentative,
    deleteRepresentative,
    clearAllRepresentatives,
    deleteRepresentativeFromAppwrite,
    clearAllRepresentativesFromAppwrite,
    getRepresentatives,
    getRepresentativesFromAppwrite,
    getSubmissionsFromAppwrite,
    deletePersonSubmissions,
    clearAllSubmissions
  };

  return (
    <FirebaseAuthContext.Provider value={value}>
      {!loading && children}
    </FirebaseAuthContext.Provider>
  );
}
