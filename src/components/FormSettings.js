import React, { useState, useEffect } from 'react';
import { dbService } from '../services/firebaseService';

function FormSettings({ isOpen, onClose }) {
  const [adminData, setAdminData] = useState({ username: '', password: '', googleSheetsUrl: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Get current username from localStorage
  const getCurrentUsernameLocal = () => {
    try {
      const storedCredentials = localStorage.getItem('formCredentials');
      if (storedCredentials) {
        const creds = JSON.parse(storedCredentials);
        return creds.username || 'admin';
      }
      return 'admin';
    } catch (error) {
      return 'admin';
    }
  };

  // Get current Google Sheets URL from Firebase/Appwrite
  const getCurrentGoogleSheetsUrl = async () => {
    try {
      const firebaseSettings = await dbService.getFormSettings();
      if (firebaseSettings?.googleSheetsUrl) {
        return firebaseSettings.googleSheetsUrl;
      }
      
      
      return '';
    } catch (error) {
      return '';
    }
  };

  useEffect(() => {
    const loadCurrentSettings = async () => {
      try {
        const currentUsername = getCurrentUsernameLocal();
        const currentUrl = await getCurrentGoogleSheetsUrl();
        
        setAdminData(prev => ({
          ...prev,
          username: currentUsername,
          googleSheetsUrl: currentUrl
        }));
      } catch (error) {
        console.error('Error loading current settings:', error);
      }
    };

    if (isOpen) {
      loadCurrentSettings();
    }
  }, [isOpen]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (adminData.username && adminData.password) {
      setIsLoading(true);
      try {
        // Update credentials in localStorage
        const newCredentials = {
          username: adminData.username,
          password: adminData.password
        };
        localStorage.setItem('formCredentials', JSON.stringify(newCredentials));
        
        // Save settings to both Firebase and Appwrite
        const settingsData = {
          googleSheetsUrl: adminData.googleSheetsUrl,
          formCredentials: {
            username: adminData.username,
            lastUpdated: new Date().toISOString()
          }
        };

        const result = await dbService.saveFormSettings(settingsData);
        const firebaseSuccess = !!result;

        // Send to Google Sheets if URL is provided
        if (adminData.googleSheetsUrl) {
          try {
            const adminUpdateData = {
              type: 'form_credentials_update',
              username: adminData.username,
              password: adminData.password,
              timestamp: new Date().toISOString(),
              updatedBy: getCurrentUsernameLocal()
            };

            await fetch(adminData.googleSheetsUrl, {
              method: 'POST',
              mode: 'no-cors',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(adminUpdateData)
            });
          } catch (sheetsError) {
            console.log('Google Sheets update failed, but local update succeeded');
          }
        }

        let message = 'تم تحديث بيانات تسجيل الدخول بنجاح!';
        if (firebaseSuccess) {
          message += '\n✅ تم الحفظ في قاعدة البيانات';
        } else {
          message += '\n❌ فشل في حفظ البيانات';
        }

        alert(message);
        setAdminData({ username: '', password: '', googleSheetsUrl: '' });
        onClose();
      } catch (error) {
        console.error('Error updating credentials:', error);
        alert('حدث خطأ أثناء تحديث بيانات تسجيل الدخول');
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">⚙️ إعدادات الفورم</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              👤 اسم المستخدم الجديد
            </label>
            <input
              type="text"
              value={adminData.username}
              onChange={(e) => setAdminData({ ...adminData, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ادخل اسم المستخدم الجديد"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔑 كلمة المرور الجديدة
            </label>
            <input
              type="password"
              value={adminData.password}
              onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ادخل كلمة المرور الجديدة"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📊 رابط Google Sheets (Apps Script URL)
            </label>
            <input
              type="url"
              value={adminData.googleSheetsUrl}
              onChange={(e) => setAdminData({ ...adminData, googleSheetsUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 اتركه فارغاً إذا لم تريد تحديث الرابط
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  جاري الحفظ...
                </div>
              ) : (
                '💾 حفظ التغييرات'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            💡 سيتم حفظ الإعدادات في Firebase و Appwrite للنسخ الاحتياطي
          </p>
        </div>
      </div>
    </div>
  );
}

export default FormSettings;
