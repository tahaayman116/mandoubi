import React, { useState, useEffect } from 'react';
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext';
import { dbService } from '../services/firebaseService';

function AdminSettings({ isOpen, onClose }) {
  const { userProfile } = useFirebaseAuth();
  const [settings, setSettings] = useState({
    googleSheetsUrl: '',
    enableGoogleSheets: false,
    passwordNotificationUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showFormEditor, setShowFormEditor] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    currentPassword: '',
    password: '',
    confirmPassword: '',
    googleSheetsUrl: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  // Load settings from Firebase on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const adminSettings = await dbService.getAdminSettings();
        if (adminSettings) {
          setSettings({
            googleSheetsUrl: adminSettings.googleSheetsUrl || '',
            enableGoogleSheets: adminSettings.enableGoogleSheets || false,
            passwordNotificationUrl: adminSettings.passwordNotificationUrl || ''
          });
        }
      } catch (error) {
        console.error('Error loading admin settings:', error);
        // Fallback to localStorage for backward compatibility
        const savedSettings = localStorage.getItem('adminSettings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      }
    };

    const loadFormSettings = async () => {
      try {
        const formCreds = localStorage.getItem('formCredentials');
        const formSettings = await dbService.getFormSettings();
        
        if (formCreds) {
          const creds = JSON.parse(formCreds);
          setFormData({
            username: creds.username || '',
            currentPassword: '',
            password: '',
            confirmPassword: '',
            googleSheetsUrl: formSettings?.googleSheetsUrl || ''
          });
        }
      } catch (error) {
        console.error('Error loading form settings:', error);
      }
    };

    if (isOpen) {
      loadSettings();
      loadFormSettings();
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      alert('يرجى ملء جميع الحقول');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('كلمة المرور الجديدة وتأكيدها غير متطابقين');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setPasswordLoading(true);

    try {
      // Check current password from Firebase
      console.log('Checking current password...');
      const currentPassword = await dbService.getAdminPassword();
      console.log('Current password from Firebase:', currentPassword);
      
      if (passwordData.currentPassword !== currentPassword) {
        alert('كلمة المرور الحالية غير صحيحة');
        setPasswordLoading(false);
        return;
      }

      // Save new password to Firebase
      console.log('Updating password in Firebase...');
      const result = await dbService.updateAdminPassword(passwordData.newPassword);
      console.log('Password update result:', result);

      // Send notification to Google Apps Script if URL is provided
      if (settings.googleSheetsUrl) {
        await sendPasswordNotification(passwordData.newPassword);
      }

      setPasswordSuccess(true);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      setTimeout(() => {
        setPasswordSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Error changing password:', error);
      alert('حدث خطأ أثناء تغيير كلمة المرور');
    }

    setPasswordLoading(false);
  };

  const sendPasswordNotification = async (newPassword) => {
    try {
      const notificationData = {
        action: 'update_admin_password',
        newPassword: newPassword,
        timestamp: new Date().toISOString(),
        updatedBy: userProfile?.name || 'مدير النظام'
      };

      console.log('Sending admin password update to Google Apps Script:', notificationData);

      // استخدام FormData لضمان وصول البيانات
      const formData = new FormData();
      formData.append('data', JSON.stringify(notificationData));

      const response = await fetch(settings.googleSheetsUrl, {
        method: 'POST',
        body: formData
      });

      console.log('Admin password notification sent successfully');
      
      // محاولة قراءة الاستجابة
      try {
        const responseText = await response.text();
        console.log('Admin password update response:', responseText);
      } catch (parseError) {
        console.log('Admin password sent but could not read response');
      }
      
    } catch (error) {
      console.error('Failed to send admin password notification:', error);
      // Don't throw error here, as password change was successful
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);

    try {
      console.log('Starting to save settings:', settings);
      
      // Save settings to Firebase
      console.log('Calling dbService.updateAdminSettings...');
      const result = await dbService.updateAdminSettings(settings);
      console.log('Firebase save result:', result);
      
      // Also save to localStorage for backward compatibility
      localStorage.setItem('adminSettings', JSON.stringify(settings));
      console.log('Settings saved to localStorage as backup');
      
      // Verify the save by reading back from Firebase
      console.log('Verifying save by reading back from Firebase...');
      const savedSettings = await dbService.getAdminSettings();
      console.log('Settings read back from Firebase:', savedSettings);
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('حدث خطأ أثناء حفظ الإعدادات: ' + error.message);
    }
    
    setLoading(false);
  };

  const handleFormSettingsUpdate = async () => {
    if (!formData.username || !formData.currentPassword || !formData.password) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert('كلمة المرور الجديدة وتأكيدها غير متطابقين');
      return;
    }

    if (formData.password.length < 3) {
      alert('كلمة المرور الجديدة يجب أن تكون 3 أحرف على الأقل');
      return;
    }

    setFormLoading(true);

    try {
      // Get current password from multiple sources
      let currentPassword = 'admin123'; // Default password
      
      // First, try to get from Firebase form settings
      try {
        const formSettings = await dbService.getFormSettings();
        if (formSettings && formSettings.password) {
          currentPassword = formSettings.password;
          console.log('Found password in Firebase form settings:', currentPassword);
        }
      } catch (error) {
        console.log('No Firebase form settings found, checking localStorage');
      }
      
      // If not found in Firebase, check localStorage
      if (currentPassword === 'admin123') {
        const currentFormCreds = localStorage.getItem('formCredentials');
        if (currentFormCreds) {
          const currentCreds = JSON.parse(currentFormCreds);
          currentPassword = currentCreds.password;
          console.log('Found stored password in localStorage:', currentPassword);
        } else {
          console.log('No stored credentials, using default password:', currentPassword);
        }
      }
      
      console.log('Entered password:', formData.currentPassword);
      console.log('Expected password:', currentPassword);
      
      if (formData.currentPassword !== currentPassword) {
        alert('كلمة المرور الحالية غير صحيحة');
        setFormLoading(false);
        return;
      }
      
      // Check if new password is same as admin password
      if (formData.password === currentPassword) {
        alert('كلمة المرور الجديدة يجب أن تكون مختلفة عن كلمة المرور الحالية');
        setFormLoading(false);
        return;
      }

      // Update form credentials in localStorage
      const newFormCreds = {
        username: formData.username,
        password: formData.password
      };
      
      localStorage.setItem('formCredentials', JSON.stringify(newFormCreds));
      console.log('Updated localStorage with new credentials:', newFormCreds);
      
      // Save credentials and Google Sheets URL to Firebase and Appwrite
      const formSettingsData = {
        username: formData.username,
        password: formData.password,
        googleSheetsUrl: formData.googleSheetsUrl,
        updatedAt: new Date().toISOString(),
        updatedBy: userProfile?.name || 'مدير النظام'
      };

      try {
        // Save to Firebase
        console.log('Saving to Firebase:', formSettingsData);
        await dbService.saveFormSettings(formSettingsData);
        console.log('Saved to Firebase successfully');
        
        // Verify the save by reading back
        const savedSettings = await dbService.getFormSettings();
        console.log('Verified Firebase save:', savedSettings);
      } catch (error) {
        console.error('Firebase save error:', error);
      }

      try {
        // Save to Appwrite
        const appwriteService = await import('../services/appwriteService');
        console.log('Saving to Appwrite:', formSettingsData);
        await appwriteService.appwriteService.saveFormSettings(formSettingsData);
        console.log('Saved to Appwrite successfully');
      } catch (error) {
        console.error('Appwrite save error:', error);
      }

      // Send to Google Apps Script if URL is available
      if (settings.googleSheetsUrl) {
        try {
          const updateData = {
            action: 'update_form_credentials',
            newUsername: formData.username,
            newPassword: formData.password,
            timestamp: new Date().toISOString(),
            updatedBy: userProfile?.name || 'مدير النظام'
          };

          console.log('Sending form credentials to Google Apps Script:', updateData);
          console.log('Google Apps Script URL:', settings.googleSheetsUrl);

          // استخدام FormData لضمان وصول البيانات
          const formDataToSend = new FormData();
          formDataToSend.append('data', JSON.stringify(updateData));

          const response = await fetch(settings.googleSheetsUrl, {
            method: 'POST',
            body: formDataToSend
          });

          console.log('Form credentials sent to Google Apps Script successfully');
          
          // محاولة قراءة الاستجابة
          try {
            const responseText = await response.text();
            console.log('Form credentials update response:', responseText);
          } catch (parseError) {
            console.log('Form credentials sent but could not read response');
          }
        } catch (error) {
          console.error('Google Apps Script send error:', error);
          alert('تم حفظ البيانات محلياً ولكن فشل الإرسال إلى Google Apps Script: ' + error.message);
        }
      } else {
        console.log('No Google Apps Script URL provided');
      }

      // Clean up duplicate form settings after successful update
      try {
        console.log('Cleaning up duplicate form settings...');
        const deletedCount = await dbService.cleanupDuplicateFormSettings();
        if (deletedCount > 0) {
          console.log(`Cleaned up ${deletedCount} duplicate form settings`);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up duplicates:', cleanupError);
        // Don't fail the main operation if cleanup fails
      }

      setFormSuccess(true);
      setShowFormEditor(false);
      
      // Reset form data
      setFormData({
        username: formData.username,
        currentPassword: '',
        password: '',
        confirmPassword: '',
        googleSheetsUrl: formData.googleSheetsUrl
      });
      
      setTimeout(() => {
        setFormSuccess(false);
      }, 3000);

      alert('تم تحديث بيانات الفورم بنجاح!');
      
    } catch (error) {
      console.error('Error updating form settings:', error);
      alert('حدث خطأ أثناء تحديث بيانات الفورم');
    }

    setFormLoading(false);
  };

  // Add cleanup function for manual cleanup
  const handleCleanupDuplicates = async () => {
    try {
      setLoading(true);
      const deletedCount = await dbService.cleanupDuplicateFormSettings();
      alert(`تم حذف ${deletedCount} إعدادات مكررة`);
    } catch (error) {
      console.error('Error cleaning up duplicates:', error);
      alert('حدث خطأ أثناء تنظيف الإعدادات المكررة');
    }
    setLoading(false);
  };

  const testGoogleSheets = async () => {
    if (!settings.googleSheetsUrl) {
      alert('يرجى إدخال رابط Google Apps Script أولاً');
      return;
    }

    setLoading(true);
    try {
      const testData = {
        action: 'add_submission',
        location: 'اختبار الاتصال',
        villageName: 'اختبار الاتصال', 
        totalPeople: 10,
        totalAmount: 500,
        submittedBy: userProfile?.name || 'مدير النظام',
        timestamp: new Date().toISOString()
      };

      console.log('Sending test data to Google Apps Script:', testData);
      console.log('URL:', settings.googleSheetsUrl);

      const formData = new FormData();
      formData.append('data', JSON.stringify(testData));

      const response = await fetch(settings.googleSheetsUrl, {
        method: 'POST',
        body: formData
      });

      console.log('Google Apps Script response received');
      
      try {
        const responseText = await response.text();
        console.log('Response text:', responseText);
        
        if (responseText.includes('success')) {
          alert('تم اختبار الاتصال بنجاح! تحقق من Google Sheets لرؤية البيانات التجريبية.');
        } else {
          alert('تم إرسال البيانات ولكن لم نتمكن من التحقق من النتيجة. تحقق من Google Sheets والـ execution logs.');
        }
      } catch (parseError) {
        console.log('Could not parse response, but request was sent');
        alert('تم إرسال البيانات. تحقق من Google Sheets والـ execution logs في Apps Script.');
      }
      
    } catch (error) {
      console.error('Google Apps Script test failed:', error);
      
      let errorMessage = 'فشل الاختبار. ';
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        errorMessage += 'تأكد من:\n• صحة رابط Apps Script\n• نشر Script كـ Web App\n• صلاحية "Anyone" في الإعدادات\n• تشغيل setupSystem() أولاً';
      } else {
        errorMessage += 'خطأ: ' + error.message;
      }
      
      alert(errorMessage);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center ml-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              إعدادات النظام
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {success && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 text-green-700 px-4 py-3 rounded-xl backdrop-blur-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                تم حفظ الإعدادات بنجاح!
              </div>
            </div>
          )}

          {passwordSuccess && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 text-green-700 px-4 py-3 rounded-xl backdrop-blur-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                تم تغيير كلمة المرور بنجاح!
              </div>
            </div>
          )}

          {formSuccess && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/50 text-purple-700 px-4 py-3 rounded-xl backdrop-blur-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                تم تحديث بيانات الفورم بنجاح!
              </div>
            </div>
          )}

          {/* Password Change Section */}
          <div className="bg-gradient-to-br from-red-50/50 to-pink-50/50 rounded-xl p-6 border border-red-200/30">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center ml-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">تغيير كلمة مرور الإدارة</h3>
            </div>

            <div className="space-y-4">
              {/* Current Password */}
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  كلمة المرور الحالية *
                </label>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 backdrop-blur-sm"
                  placeholder="أدخل كلمة المرور الحالية"
                />
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  كلمة المرور الجديدة *
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 backdrop-blur-sm"
                  placeholder="أدخل كلمة المرور الجديدة (6 أحرف على الأقل)"
                />
              </div>

              {/* Confirm New Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  تأكيد كلمة المرور الجديدة *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 backdrop-blur-sm"
                  placeholder="أعد إدخال كلمة المرور الجديدة"
                />
              </div>


              {/* Change Password Button */}
              <button
                onClick={handlePasswordChange}
                disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passwordLoading ? 'جاري تغيير كلمة المرور...' : 'تغيير كلمة المرور'}
              </button>
            </div>
          </div>

          {/* Google Apps Script Integration Section */}
          <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-xl p-6 border border-blue-200/30">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center ml-3">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">تكامل Google Apps Script</h3>
            </div>

            <div className="space-y-4">
              {/* Enable/Disable Toggle */}
              <div className="flex items-center justify-between p-4 bg-white/60 rounded-lg border border-gray-200/50">
                <div>
                  <h4 className="font-medium text-gray-800">تفعيل Google Apps Script</h4>
                  <p className="text-sm text-gray-600">إدارة شاملة للنظام عبر رابط واحد</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="enableGoogleSheets"
                    checked={settings.enableGoogleSheets}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Single Google Apps Script URL Input */}
              <div>
                <label htmlFor="googleSheetsUrl" className="block text-sm font-semibold text-gray-700 mb-2">
                  رابط Google Apps Script الموحد *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    id="googleSheetsUrl"
                    name="googleSheetsUrl"
                    type="url"
                    value={settings.googleSheetsUrl}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 backdrop-blur-sm"
                    placeholder="https://script.google.com/macros/s/your-script-id/exec"
                    disabled={!settings.enableGoogleSheets}
                  />
                </div>
                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-700 font-medium mb-1">هذا الرابط يدير:</p>
                  <ul className="text-xs text-blue-600 space-y-0.5">
                    <li>• تحديث كلمة مرور الإدارة</li>
                    <li>• تحديث بيانات الفورم</li>
                    <li>• إضافة وحذف التقارير</li>
                    <li>• إدارة المندوبين</li>
                    <li>• عرض الإحصائيات</li>
                  </ul>
                </div>
              </div>

              {/* Test Button */}
              {settings.enableGoogleSheets && settings.googleSheetsUrl && (
                <button
                  onClick={testGoogleSheets}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? 'جاري الاختبار...' : 'اختبار الاتصال'}
                </button>
              )}
            </div>
          </div>

          {/* Form Settings Section */}
          <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-xl p-6 border border-purple-200/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center ml-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">إعدادات الفورم</h3>
              </div>
              <button
                onClick={() => setShowFormEditor(!showFormEditor)}
                className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg transition-all duration-200"
              >
                {showFormEditor ? 'إلغاء' : 'تعديل'}
              </button>
            </div>

            <div className="space-y-4">
              {!showFormEditor ? (
                <div className="bg-white/60 rounded-lg p-4 border border-gray-200/50">
                  <h4 className="font-medium text-gray-800 mb-2">بيانات دخول الفورم الحالية</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">اسم المستخدم:</span>
                      <span className="font-medium text-gray-800 mr-2">
                        {(() => {
                          const formCreds = localStorage.getItem('formCredentials');
                          return formCreds ? JSON.parse(formCreds).username : 'admin';
                        })()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">كلمة المرور:</span>
                      <span className="font-medium text-gray-800 mr-2">••••••</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white/60 rounded-lg p-4 border border-gray-200/50">
                  <h4 className="font-medium text-gray-800 mb-4">تعديل بيانات دخول الفورم</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        اسم المستخدم الجديد *
                      </label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="أدخل اسم المستخدم الجديد"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        كلمة المرور الحالية *
                      </label>
                      <input
                        type="password"
                        value={formData.currentPassword}
                        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="أدخل كلمة المرور الحالية"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        كلمة المرور الجديدة *
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="أدخل كلمة المرور الجديدة"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        تأكيد كلمة المرور الجديدة *
                      </label>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="أعد إدخال كلمة المرور الجديدة"
                      />
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={handleFormSettingsUpdate}
                        disabled={formLoading || !formData.username || !formData.currentPassword || !formData.password || formData.password !== formData.confirmPassword}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {formLoading ? 'جاري الحفظ...' : 'حفظ بيانات الفورم'}
                      </button>
                      <button
                        onClick={handleCleanupDuplicates}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {loading ? 'جاري التنظيف...' : 'تنظيف الإعدادات المكررة'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/50 rounded-xl p-6 border border-amber-200/30">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center ml-3 mt-0.5">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-amber-800 mb-2">كيفية إعداد Google Sheets</h4>
                <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
                  <li>إنشاء Google Sheet جديد</li>
                  <li>الذهاب إلى Extensions → Apps Script</li>
                  <li>إنشاء دالة لاستقبال البيانات عبر POST</li>
                  <li>نشر Script كـ Web App</li>
                  <li>نسخ الرابط ولصقه أعلاه</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            {loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminSettings;
