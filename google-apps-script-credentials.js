/**
 * Google Apps Script for receiving form credentials updates
 * This script is attached to your Google Sheet
 */

function doPost(e) {
  try {
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    
    // استخدام الشيت الحالي المرتبط بهذا السكريبت
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getActiveSheet();
    
    // التحقق من وجود العناوين، إذا لم توجد أضفها
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, 8).setValues([
        ['Timestamp', 'Date', 'Time', 'Username', 'Password', 'Updated By', 'Change Type', 'Google Sheets URL']
      ]);
      
      // تنسيق العناوين
      const headerRange = sheet.getRange(1, 1, 1, 8);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('white');
    }
    
    // Add the new data
    const timestamp = new Date();
    const rowData = [
      data.timestamp || timestamp.toISOString(),
      data.date || timestamp.toLocaleDateString('ar-EG'),
      data.time || timestamp.toLocaleTimeString('ar-EG'),
      data.username || '',
      data.password || '',
      data.updatedBy || 'مدير النظام',
      data.changeType || 'Form Password Update',
      data.googleSheetsUrl || ''
    ];
    
    sheet.appendRow(rowData);
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, 8);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Form credentials updated successfully',
        timestamp: timestamp.toISOString(),
        spreadsheetUrl: spreadsheet.getUrl(),
        rowsCount: sheet.getLastRow()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error processing request:', error);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString(),
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // Handle GET requests (for testing)
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Mandoub Form Credentials API is working',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Test function to verify the script works
 * Run this function in the Apps Script editor to test
 */
function testCredentialsUpdate() {
  const testData = {
    postData: {
      contents: JSON.stringify({
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString('ar-EG'),
        time: new Date().toLocaleTimeString('ar-EG'),
        username: 'testuser',
        password: 'testpass123',
        updatedBy: 'مدير النظام',
        changeType: 'Form Password Update',
        googleSheetsUrl: 'https://script.google.com/macros/s/test/exec'
      })
    }
  };
  
  const result = doPost(testData);
  console.log('Test result:', result.getContent());
}
