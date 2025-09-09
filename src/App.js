import React from 'react';
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
