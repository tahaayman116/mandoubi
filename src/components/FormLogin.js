import React, { useState } from 'react';

const FormLogin = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Import Firebase service
      const { dbService } = await import('../services/firebaseService');
      
      let validCredentials = null;
      
      // First, try to get credentials from Firebase
      try {
        console.log('Checking Firebase for form settings...');
        const formSettings = await dbService.getFormSettings();
        if (formSettings && formSettings.username && formSettings.password) {
          validCredentials = {
            username: formSettings.username,
            password: formSettings.password
          };
          console.log('Found credentials in Firebase:', validCredentials.username);
          
          // Update localStorage with Firebase credentials
          localStorage.setItem('formCredentials', JSON.stringify(validCredentials));
        }
      } catch (firebaseError) {
        console.log('Firebase credentials not found, checking localStorage');
      }
      
      // If not found in Firebase, check localStorage
      if (!validCredentials) {
        const storedCredentials = localStorage.getItem('formCredentials');
        
        if (!storedCredentials) {
          // First time setup - create default credentials
          const defaultCreds = { username: 'admin', password: 'admin123' };
          localStorage.setItem('formCredentials', JSON.stringify(defaultCreds));
          validCredentials = defaultCreds;
          console.log('Using default credentials');
        } else {
          validCredentials = JSON.parse(storedCredentials);
          console.log('Using localStorage credentials:', validCredentials.username);
        }
      }
      
      // Validate credentials
      if (credentials.username === validCredentials.username && credentials.password === validCredentials.password) {
        console.log('Login successful');
        onLogin(true);
        return;
      }
      
      console.log('Login failed - invalid credentials');
      setError('اسم المستخدم أو كلمة المرور غير صحيحة');
    } catch (error) {
      console.error('Login error:', error);
      setError('حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl text-white">🔐</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">تسجيل الدخول</h1>
          <p className="text-gray-600">ادخل بيانات الدخول للوصول إلى النظام</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              👤 اسم المستخدم
            </label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="ادخل اسم المستخدم"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔑 كلمة المرور
            </label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="ادخل كلمة المرور"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm text-center">❌ {error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                جاري تسجيل الدخول...
              </>
            ) : (
              <>
                🚀 دخول
              </>
            )}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700 text-center">
            💡 يتم التحقق من البيانات من الخادم أولاً، ثم محلياً
          </p>
          <p className="text-xs text-blue-600 text-center mt-1">
            البيانات الافتراضية: admin / admin123
          </p>
        </div>
      </div>
    </div>
  );
};

export default FormLogin;
