function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (data.action === 'update_admin_password') {
      var adminSheet = ss.getSheetByName('admin_settings');
      if (!adminSheet) {
        adminSheet = ss.insertSheet('admin_settings');
        adminSheet.appendRow(['username', 'password']);
        adminSheet.appendRow(['admin', 'admin123']);
      }
      adminSheet.getRange(2, 2).setValue(data.newPassword);
      return ContentService.createTextOutput('{"success":true,"message":"تم تحديث باسورد الأدمن"}').setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === 'update_form_credentials') {
      var formSheet = ss.getSheetByName('form_settings');
      if (!formSheet) {
        formSheet = ss.insertSheet('form_settings');
        formSheet.appendRow(['username', 'password']);
        formSheet.appendRow(['form', 'form123']);
      }
      if (data.newUsername) formSheet.getRange(2, 1).setValue(data.newUsername);
      if (data.newPassword) formSheet.getRange(2, 2).setValue(data.newPassword);
      return ContentService.createTextOutput('{"success":true,"message":"تم تحديث بيانات الفورم"}').setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === 'add_submission') {
      var submissionSheet = ss.getSheetByName('submissions');
      if (!submissionSheet) {
        submissionSheet = ss.insertSheet('submissions');
        submissionSheet.appendRow(['التاريخ', 'القرية', 'العدد', 'المبلغ', 'المكان', 'المندوب']);
      }
      submissionSheet.appendRow([new Date(), data.villageName || '', data.totalPeople || 0, data.totalAmount || 0, data.location || '', data.submittedBy || '']);
      return ContentService.createTextOutput('{"success":true,"message":"تم حفظ التقرير"}').setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput('{"success":false,"message":"إجراء غير معروف"}').setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput('{"success":false,"error":"' + error.toString() + '"}').setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var action = e.parameter.action;
    
    // Get admin credentials
    if (action === 'get_admin_credentials') {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName('admin_settings');
      
      if (!sheet) {
        return ContentService
          .createTextOutput(JSON.stringify({
            username: 'admin',
            password: 'admin123'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      var username = sheet.getRange('A2').getValue() || 'admin';
      var password = sheet.getRange('B2').getValue() || 'admin123';
      
      return ContentService
        .createTextOutput(JSON.stringify({
          username: username,
          password: password
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get form credentials
    if (action === 'get_form_credentials') {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName('form_settings');
      
      if (!sheet) {
        return ContentService
          .createTextOutput(JSON.stringify({
            username: 'form',
            password: 'form123'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      var username = sheet.getRange('A2').getValue() || 'form';
      var password = sheet.getRange('B2').getValue() || 'form123';
      
      return ContentService
        .createTextOutput(JSON.stringify({
          username: username,
          password: password
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get reports
    if (action === 'get_reports') {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName('submissions');
      
      if (!sheet || sheet.getLastRow() <= 1) {
        return ContentService
          .createTextOutput(JSON.stringify({
            data: [],
            stats: {
              totalPeople: 0,
              totalAmount: 0,
              totalSubmissions: 0
            }
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      var lastRow = sheet.getLastRow();
      var data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
      
      var submissions = [];
      var totalPeople = 0;
      var totalAmount = 0;
      
      for (var i = 0; i < data.length; i++) {
        var row = data[i];
        submissions.push({
          'التاريخ': row[0],
          'القرية': row[1],
          'العدد': row[2],
          'المبلغ': row[3],
          'المكان': row[4],
          'المندوب': row[5]
        });
        
        totalPeople += Number(row[2]) || 0;
        totalAmount += Number(row[3]) || 0;
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({
          data: submissions,
          stats: {
            totalSubmissions: submissions.length,
            totalPeople: totalPeople,
            totalAmount: totalAmount
          }
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        error: 'إجراء غير معروف'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function - creates sample data
function createTestData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create admin settings
  var adminSheet = ss.getSheetByName('admin_settings');
  if (!adminSheet) {
    adminSheet = ss.insertSheet('admin_settings');
    adminSheet.getRange('A1').setValue('username');
    adminSheet.getRange('B1').setValue('password');
    adminSheet.getRange('A2').setValue('admin');
    adminSheet.getRange('B2').setValue('admin123');
  }
  
  // Create form settings
  var formSheet = ss.getSheetByName('form_settings');
  if (!formSheet) {
    formSheet = ss.insertSheet('form_settings');
    formSheet.getRange('A1').setValue('username');
    formSheet.getRange('B1').setValue('password');
    formSheet.getRange('A2').setValue('form');
    formSheet.getRange('B2').setValue('form123');
  }
  
  // Create submissions with test data
  var submissionsSheet = ss.getSheetByName('submissions');
  if (!submissionsSheet) {
    submissionsSheet = ss.insertSheet('submissions');
    submissionsSheet.getRange('A1').setValue('التاريخ');
    submissionsSheet.getRange('B1').setValue('القرية');
    submissionsSheet.getRange('C1').setValue('العدد');
    submissionsSheet.getRange('D1').setValue('المبلغ');
    submissionsSheet.getRange('E1').setValue('المكان');
    submissionsSheet.getRange('F1').setValue('المندوب');
  }
  
  // Add test submission
  var lastRow = submissionsSheet.getLastRow();
  var newRow = lastRow + 1;
  
  submissionsSheet.getRange(newRow, 1).setValue(new Date());
  submissionsSheet.getRange(newRow, 2).setValue('قرية تجريبية');
  submissionsSheet.getRange(newRow, 3).setValue(100);
  submissionsSheet.getRange(newRow, 4).setValue(5000);
  submissionsSheet.getRange(newRow, 5).setValue('مكان تجريبي');
  submissionsSheet.getRange(newRow, 6).setValue('مختبر النظام');
  
  Logger.log('تم إنشاء البيانات التجريبية بنجاح');
}
