import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FirebaseAuthProvider, useFirebaseAuth } from './contexts/FirebaseAuthContext';
import Login from './components/Login';
import RepresentativeForm from './components/RepresentativeForm';
import AdminDashboard from './components/AdminDashboard';
import Navbar from './components/Navbar';

function ProtectedRoute({ children, adminOnly = false }) {
  const { userProfile, currentUser } = useFirebaseAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && userProfile?.role !== 'admin') {
    return <Navigate to="/form" replace />;
  }
  
  return children;
}

function UnifiedLogin() {
  const { currentUser, userProfile } = useFirebaseAuth();
  const [isFormAuthenticated, setIsFormAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const formAuth = sessionStorage.getItem('formAuthenticated');
    setIsFormAuthenticated(formAuth === 'true');
    setIsLoading(false);
  }, []);

  const handleLogin = async (credentials) => {
    try {
      // Check form credentials first
      const storedFormCreds = localStorage.getItem('formCredentials');
      if (storedFormCreds) {
        const formCreds = JSON.parse(storedFormCreds);
        if (credentials.username === formCreds.username && credentials.password === formCreds.password) {
          setIsFormAuthenticated(true);
          sessionStorage.setItem('formAuthenticated', 'true');
          return { type: 'form' };
        }
      }
      
      // If not form credentials, check if it's admin (Firebase auth)
      // This would need to be handled by the Login component
      return { type: 'admin', credentials };
    } catch (error) {
      throw new Error('خطأ في تسجيل الدخول');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user is authenticated with Firebase, show dashboard
  if (currentUser) {
    return userProfile?.role === 'admin' ? 
      <Navigate to="/dashboard" replace /> : 
      <Navigate to="/form" replace />;
  }

  // If user is authenticated for form only, show form
  if (isFormAuthenticated) {
    return <Navigate to="/form" replace />;
  }

  // Show unified login
  return <Login onUnifiedLogin={handleLogin} />;
}

function AppRoutes() {
  const { currentUser, userProfile } = useFirebaseAuth();
  
  return (
    <div className="min-h-screen bg-gray-50">
      {currentUser && <Navbar />}
      <Routes>
        <Route 
          path="/login" 
          element={
            currentUser ? 
            <Navigate to={userProfile?.role === 'admin' ? '/dashboard' : '/form'} replace /> : 
            <Login />
          } 
        />
        <Route 
          path="/form" 
          element={
            sessionStorage.getItem('formAuthenticated') === 'true' ? 
              <RepresentativeForm /> : 
              <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/" 
          element={
            <Navigate to={currentUser ? (userProfile?.role === 'admin' ? '/dashboard' : '/form') : '/login'} replace />
          } 
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <FirebaseAuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </FirebaseAuthProvider>
  );
}

export default App;
