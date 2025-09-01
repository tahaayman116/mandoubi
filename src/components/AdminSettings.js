import React, { useState, useEffect } from 'react';
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext';

function AdminSettings({ isOpen, onClose }) {
  const { userProfile } = useFirebaseAuth();
  const [settings, setSettings] = useState({
    googleSheetsUrl: '',
    enableGoogleSheets: false
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('adminSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);

    try {
      // Save settings to localStorage
      localStorage.setItem('adminSettings', JSON.stringify(settings));
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('حدث خطأ أثناء حفظ الإعدادات');
    }
    
    setLoading(false);
  };

  const testGoogleSheets = async () => {
    if (!settings.googleSheetsUrl) {
      alert('يرجى إدخال رابط Google Sheets أولاً');
      return;
    }

    setLoading(true);
    try {
      const testData = {
        date: new Date().toLocaleDateString('ar-EG'),
        time: new Date().toLocaleTimeString('ar-EG'),
        villageName: 'اختبار الاتصال',
        representativeName: userProfile?.name || 'مدير النظام',
        totalPeople: 10,
        receivedMoney: 8,
        notReceived: 2,
        amountPerPerson: 50,
        totalAmount: 400,
        timestamp: new Date().toISOString()
      };

      // Use no-cors mode for Google Apps Script
      await fetch(settings.googleSheetsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain', // Changed to avoid CORS preflight
        },
        body: JSON.stringify(testData),
        mode: 'no-cors' // Required for Google Apps Script
      });

      // With no-cors, we can't read the response, so we assume success if no error
      alert('تم إرسال طلب الاختبار! تحقق من Google Sheets لرؤية البيانات التجريبية');
      
    } catch (error) {
      console.error('Google Sheets test failed:', error);
      
      let errorMessage = 'فشل الاختبار. ';
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        errorMessage += 'تأكد من:\n• صحة رابط Apps Script\n• نشر Script كـ Web App\n• صلاحية "Anyone" في الإعدادات';
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

          {/* Google Sheets Integration Section */}
          <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-xl p-6 border border-blue-200/30">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center ml-3">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">تكامل Google Sheets</h3>
            </div>

            <div className="space-y-4">
              {/* Enable/Disable Toggle */}
              <div className="flex items-center justify-between p-4 bg-white/60 rounded-lg border border-gray-200/50">
                <div>
                  <h4 className="font-medium text-gray-800">تفعيل Google Sheets</h4>
                  <p className="text-sm text-gray-600">إرسال البيانات تلقائياً إلى Google Sheets</p>
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

              {/* Google Sheets URL Input */}
              <div>
                <label htmlFor="googleSheetsUrl" className="block text-sm font-semibold text-gray-700 mb-2">
                  رابط Google Apps Script *
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
                <p className="text-xs text-gray-500 mt-2">
                  أدخل رابط Google Apps Script الذي سيستقبل البيانات
                </p>
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
