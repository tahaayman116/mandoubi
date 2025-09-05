import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, dbService } from '../services/firebaseService';

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

    return unsubscribe;
  }, []);

  // Initialize real-time data listeners
  useEffect(() => {
    let unsubscribeSubmissions;
    let unsubscribeRepresentatives;

    if (currentUser) {
      // Listen to submissions changes
      unsubscribeSubmissions = dbService.onSubmissionsChange((newSubmissions) => {
        setSubmissions(newSubmissions);
      });

      // Listen to representatives changes (admin only)
      if (userProfile?.role === 'admin') {
        unsubscribeRepresentatives = dbService.onRepresentativesChange((newRepresentatives) => {
          setRepresentatives(newRepresentatives);
        });
      }
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
          
          // Load data for admin
          try {
            const submissionsData = await dbService.getSubmissions();
            const representativesData = await dbService.getRepresentatives();
            setSubmissions(submissionsData);
            setRepresentatives(representativesData);
          } catch (error) {
            console.error('Error loading admin data:', error);
          }
          
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
        
        // Load submissions data
        const submissionsData = await dbService.getSubmissions();
        setSubmissions(submissionsData);
        
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
      const newSubmission = {
        ...submissionData,
        submittedBy: userProfile?.name || currentUser?.displayName,
        representativeId: userProfile?.id || currentUser?.uid
      };
      
      const result = await dbService.addSubmission(newSubmission);
      return result;
    } catch (error) {
      console.error('Error adding submission:', error);
      throw error;
    }
  };

  const addRepresentative = async (repData) => {
    try {
      const result = await dbService.addRepresentative(repData);
      return result;
    } catch (error) {
      throw error;
    }
  };

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
      await dbService.deleteRepresentative(id);
      return id;
    } catch (error) {
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
    login, // Legacy function
    logout,
    addSubmission,
    addRepresentative,
    updateRepresentative,
    deleteRepresentative
  };

  return (
    <FirebaseAuthContext.Provider value={value}>
      {!loading && children}
    </FirebaseAuthContext.Provider>
  );
}
