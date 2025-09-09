import { dbService } from './firebaseService';

// Google Sheets integration service
const googleSheetsService = {
  // Get settings helper function
  async getSettings() {
    try {
      console.log('Getting admin settings from Firebase...');
      const settings = await dbService.getAdminSettings();
      console.log('Settings from Firebase:', settings);
      return settings;
    } catch (error) {
      console.log('Firebase failed, trying localStorage:', error);
      const savedSettings = localStorage.getItem('adminSettings');
      if (savedSettings) {
        try {
          return JSON.parse(savedSettings);
        } catch (parseError) {
          console.log('Failed to parse localStorage settings:', parseError);
        }
      }
      return { enableGoogleSheets: false, googleSheetsUrl: '' };
    }
  },

  async sendToGoogleSheets(data) {
    // Send to Google Sheets in background (non-blocking)
    const sendInBackground = async () => {
      try {
        console.log('🔄 Starting Google Sheets send process...');
        const settings = await googleSheetsService.getSettings();
        
        if (!settings || !settings.enableGoogleSheets || !settings.googleSheetsUrl) {
          console.log('❌ Google Sheets not configured or disabled');
          return;
        }

        const sheetsData = {
          action: 'add_submission',
          timestamp: data.timestamp || new Date().toISOString(),
          personName: data.personName || data.submittedBy || '',
          submittedBy: data.personName || data.submittedBy || '',
          location: data.location || data.villageName || '',
          villageName: data.location || data.villageName || '',
          totalPeople: parseInt(data.totalPeople) || 0,
          amountPerPerson: parseInt(data.amountPerPerson) || 50,
          totalAmount: parseInt(data.totalAmount) || 0,
          representativeName: data.representativeName || 'غير محدد'
        };

        console.log('📤 Sending to Google Sheets:', sheetsData);

        const formData = new FormData();
        formData.append('data', JSON.stringify(sheetsData));

        const response = await fetch(settings.googleSheetsUrl, {
          method: 'POST',
          body: formData
        });

        console.log('📥 Google Sheets response status:', response.status);
        
        if (response.ok) {
          const responseText = await response.text();
          console.log('📥 Google Sheets response:', responseText);
          
          try {
            const parsedResponse = JSON.parse(responseText);
            if (parsedResponse.success) {
              console.log('✅ Google Sheets confirmed data received');
            } else {
              console.log('❌ Google Sheets returned error:', parsedResponse.error || parsedResponse.message);
            }
          } catch (parseError) {
            console.log('⚠️ Response is not JSON, but request was successful');
          }
        } else {
          console.log('❌ Google Sheets request failed:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('❌ Google Sheets background error:', error);
      }
    };

    // Start background process but don't wait for it
    sendInBackground();
    
    // Return immediately for faster form response
    return { success: true, message: 'تم إرسال البيانات (Google Sheets في الخلفية)' };
  },

  // Test connection to Google Sheets
  async testConnection(url) {
    try {
      const testData = {
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString('ar-EG'),
        time: new Date().toLocaleTimeString('ar-EG'),
        villageName: 'اختبار الاتصال',
        representativeName: 'نظام الاختبار',
        totalPeople: 10,
        receivedMoney: 8,
        notReceived: 2,
        amountPerPerson: 50,
        totalAmount: 400
      };

      // Using void to explicitly ignore the response
      void await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
        mode: 'no-cors'
      });

      return { success: true, message: 'تم الاختبار بنجاح' };
    } catch (error) {
      console.error('Google Sheets test failed:', error);
      return { success: false, message: 'فشل الاختبار: ' + error.message };
    }
  },

  // Send password change notification to Google Sheets
  async sendPasswordNotification(url, passwordData) {
    try {
      console.log('Sending password notification to Google Sheets:', passwordData);

      // Using void to explicitly ignore the response
      void await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'password_change',
          ...passwordData
        }),
        mode: 'no-cors'
      });

      console.log('Password notification sent successfully');
      return { success: true, message: 'تم إرسال إشعار تغيير كلمة المرور بنجاح' };

    } catch (error) {
      console.error('Error sending password notification:', error);
      return { 
        success: false, 
        message: 'فشل في إرسال إشعار كلمة المرور: ' + error.message 
      };
    }
  }
};

export default googleSheetsService;

/*
Google Apps Script Code (to be deployed as a web app):

function doPost(e) {
  try {
    let data;
    
    // Handle different data formats from different sources
    if (e.postData.contents) {
      // Standard JSON data
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter.data) {
      // Form data format
      data = JSON.parse(e.parameter.data);
    } else if (e.parameters && e.parameters.data) {
      // Alternative form data format
      data = JSON.parse(e.parameters.data[0]);
    } else {
      // Try to parse parameters directly
      data = e.parameter;
    }
    
    console.log('Received data:', data);
    
    // Handle different types of data
    if (data.type === 'password_change') {
      return handlePasswordChange(data);
    } else {
      return handleSubmissionData(data);
    }
    
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleSubmissionData(data) {
  // Get the submissions sheet
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName('البيانات') || spreadsheet.getActiveSheet();
  
  // Add headers if the sheet is empty
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 10).setValues([[
      'التاريخ', 'الوقت', 'اسم القرية', 'اسم المندوب', 
      'إجمالي الأشخاص', 'المستلمين', 'غير المستلمين', 
      'المبلغ للشخص', 'إجمالي المبلغ', 'الطابع الزمني'
    ]]);
  }
  
  // Add the data to the sheet
  sheet.appendRow([
    data.date,
    data.time,
    data.villageName,
    data.representativeName,
    data.totalPeople,
    data.receivedMoney,
    data.notReceived,
    data.amountPerPerson,
    data.totalAmount,
    data.timestamp
  ]);
  
  return ContentService
    .createTextOutput(JSON.stringify({success: true}))
    .setMimeType(ContentService.MimeType.JSON);
}

function handlePasswordChange(data) {
  // Get or create the passwords sheet
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let passwordSheet = spreadsheet.getSheetByName('كلمات المرور');
  
  if (!passwordSheet) {
    passwordSheet = spreadsheet.insertSheet('كلمات المرور');
  }
  
  // Add headers if the sheet is empty
  if (passwordSheet.getLastRow() === 0) {
    passwordSheet.getRange(1, 1, 1, 7).setValues([[
      'التاريخ', 'الوقت', 'اسم المدير', 'كلمة المرور الجديدة', 
      'سبب التغيير', 'عنوان IP', 'الطابع الزمني'
    ]]);
  }
  
  // Add the password change data
  passwordSheet.appendRow([
    data.date,
    data.time,
    data.adminName,
    data.newPassword,
    data.changeReason,
    data.ipAddress,
    data.timestamp
  ]);
  
  return ContentService
    .createTextOutput(JSON.stringify({success: true, message: 'تم حفظ كلمة المرور الجديدة'}))
}

function doGet(e) {
try {
  // Handle data submission via GET (for Netlify compatibility)
  if (e.parameter.villageName) {
    return handleSubmissionData(e.parameter);
  }
  
  // Handle password change via GET
  if (e.parameter.type === 'password_change') {
    return handlePasswordChange(e.parameter);
  }
  
  // Handle data retrieval
  if (e.parameter.action === 'getData') {
    const sheet = SpreadsheetApp.getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, data: data}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({success: false, message: 'Invalid request'}))
    .setMimeType(ContentService.MimeType.JSON);
    
} catch (error) {
  console.error('Error in doGet:', error);
  return ContentService
    .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
    .setMimeType(ContentService.MimeType.JSON);
}
}
*/
