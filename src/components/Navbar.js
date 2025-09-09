import React, { useState } from 'react';
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext';
import AdminSettings from './AdminSettings';

function Navbar() {
  const { userProfile, logout } = useFirebaseAuth();
  const [showSettings, setShowSettings] = useState(false);
  
  // Check if user is in form mode (not Firebase authenticated)
  const isFormMode = !userProfile && sessionStorage.getItem('formAuthenticated') === 'true';

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Mandoub
              </h1>
            </div>
            
            <div className="flex items-center space-x-4 space-x-reverse">
              <span className="text-gray-700">
                {isFormMode ? 'مرحباً، مستخدم الفورم' : `مرحباً، ${userProfile?.name}`}
              </span>
              
              {/* Admin Settings Button - Only for Admin */}
              {userProfile?.role === 'admin' && (
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                  title="الإعدادات"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}
              
              <button
                onClick={() => {
                  if (isFormMode) {
                    sessionStorage.removeItem('formAuthenticated');
                    window.location.href = '/login';
                  } else {
                    logout();
                  }
                }}
                className="btn-secondary text-sm"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Admin Settings Modal */}
      {showSettings && (
        <AdminSettings 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)} 
        />
      )}
      
    </>
  );
}

export default Navbar;
