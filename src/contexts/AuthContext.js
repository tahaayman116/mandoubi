import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [representatives, setRepresentatives] = useState([
    { id: 1, username: 'rep1', password: '123456', name: 'أحمد محمد', active: true },
    { id: 2, username: 'rep2', password: '123456', name: 'فاطمة علي', active: true },
    { id: 3, username: 'rep3', password: '123456', name: 'محمود حسن', active: true }
  ]);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedReps = localStorage.getItem('representatives');
    const savedSubmissions = localStorage.getItem('submissions');
    
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsAuthenticated(true);
    }
    
    if (savedReps) {
      setRepresentatives(JSON.parse(savedReps));
    }
    
    if (savedSubmissions) {
      setSubmissions(JSON.parse(savedSubmissions));
    }
  }, []);

  const login = (username, password) => {
    // Admin login
    if (username === 'admin' && password === 'admin123') {
      const adminUser = { id: 0, username: 'admin', role: 'admin', name: 'المدير' };
      setUser(adminUser);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(adminUser));
      return { success: true };
    }

    // Representative login
    const rep = representatives.find(r => 
      r.username === username && r.password === password && r.active
    );
    
    if (rep) {
      const repUser = { ...rep, role: 'representative' };
      setUser(repUser);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(repUser));
      return { success: true };
    }

    return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
  };

  const addRepresentative = (repData) => {
    const newRep = {
      id: Date.now(),
      ...repData,
      active: true
    };
    const updatedReps = [...representatives, newRep];
    setRepresentatives(updatedReps);
    localStorage.setItem('representatives', JSON.stringify(updatedReps));
    return newRep;
  };

  const updateRepresentative = (id, updates) => {
    const updatedReps = representatives.map(rep => 
      rep.id === id ? { ...rep, ...updates } : rep
    );
    setRepresentatives(updatedReps);
    localStorage.setItem('representatives', JSON.stringify(updatedReps));
  };

  const deleteRepresentative = (id) => {
    const updatedReps = representatives.filter(rep => rep.id !== id);
    setRepresentatives(updatedReps);
    localStorage.setItem('representatives', JSON.stringify(updatedReps));
  };

  const addSubmission = (submissionData) => {
    const newSubmission = {
      id: Date.now(),
      ...submissionData,
      submittedAt: new Date().toISOString(),
      submittedBy: user?.name,
      representativeId: user?.id
    };
    const updatedSubmissions = [...submissions, newSubmission];
    setSubmissions(updatedSubmissions);
    localStorage.setItem('submissions', JSON.stringify(updatedSubmissions));
    return newSubmission;
  };

  const value = {
    user,
    isAuthenticated,
    representatives,
    submissions,
    login,
    logout,
    addRepresentative,
    updateRepresentative,
    deleteRepresentative,
    addSubmission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
