// Google Sheets integration service
const googleSheetsService = {
  async sendToGoogleSheets(data) {
    try {
      // Get admin settings from localStorage
      const adminSettings = localStorage.getItem('adminSettings');
      
      if (!adminSettings) {
        console.log('Google Sheets not configured');
        return { success: false, message: 'Google Sheets غير مكون' };
      }

      const settings = JSON.parse(adminSettings);
      
      if (!settings.enableGoogleSheets || !settings.googleSheetsUrl) {
        console.log('Google Sheets integration disabled or URL not set');
        return { success: false, message: 'تكامل Google Sheets غير مفعل' };
      }

      // Prepare data for Google Sheets
      const sheetsData = {
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString('ar-EG'),
        time: new Date().toLocaleTimeString('ar-EG'),
        villageName: data.villageName,
        representativeName: data.representativeName || 'غير محدد',
        totalPeople: parseInt(data.totalPeople) || 0,
        receivedMoney: parseInt(data.receivedMoney) || 0,
        notReceived: parseInt(data.totalPeople || 0) - parseInt(data.receivedMoney || 0),
        amountPerPerson: parseInt(data.amountPerPerson) || 50,
        totalAmount: (parseInt(data.receivedMoney) || 0) * (parseInt(data.amountPerPerson) || 50)
      };

      console.log('Sending to Google Sheets:', sheetsData);

      // Send data to Google Apps Script
      // Using void to explicitly ignore the response
      void await fetch(settings.googleSheetsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sheetsData),
        mode: 'no-cors' // Required for Google Apps Script
      });

      // Note: With no-cors mode, we can't read the response
      // We'll assume success if no error is thrown
      console.log('Data sent to Google Sheets successfully');
      return { success: true, message: 'تم إرسال البيانات إلى Google Sheets بنجاح' };

    } catch (error) {
      console.error('Error sending to Google Sheets:', error);
      return { 
        success: false, 
        message: 'فشل في إرسال البيانات إلى Google Sheets: ' + error.message 
      };
    }
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
  }
};

export default googleSheetsService;

/*
Google Apps Script Code (to be deployed as a web app):

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'submitData') {
      const sheet = SpreadsheetApp.getActiveSheet();
      const row = [
        new Date(),
        data.data.villageName,
        data.data.totalPeople,
        data.data.receivedMoney,
        data.data.notReceived,
        data.data.totalAmount,
        data.data.submittedBy,
        data.data.representativeId
      ];
      
      sheet.appendRow(row);
      
      return ContentService
        .createTextOutput(JSON.stringify({success: true, message: 'Data saved successfully'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    if (e.parameter.action === 'getData') {
      const sheet = SpreadsheetApp.getActiveSheet();
      const data = sheet.getDataRange().getValues();
      
      return ContentService
        .createTextOutput(JSON.stringify({success: true, data: data}))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
*/
