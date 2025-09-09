function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  try {
    var data = JSON.parse(e.postData.contents);
    
    // تحديث باسورد الأدمن
    if (data.action === 'update_admin_password') {
      var sheet = ss.getSheetByName('AdminSettings');
      if (!sheet) {
        sheet = ss.insertSheet('AdminSettings');
        sheet.getRange('A1').setValue('admin');
        sheet.getRange('B1').setValue('admin123');
      }
      sheet.getRange('B1').setValue(data.newPassword);
      return ContentService.createTextOutput(JSON.stringify({success: true, message: 'تم تحديث الباسورد'})).setMimeType(ContentService.MimeType.JSON);
    }
    
    // تحديث بيانات الفورم
    if (data.action === 'update_form_credentials') {
      var sheet = ss.getSheetByName('FormSettings');
      if (!sheet) {
        sheet = ss.insertSheet('FormSettings');
        sheet.getRange('A1').setValue('form');
        sheet.getRange('B1').setValue('form123');
      }
      if (data.newUsername) sheet.getRange('A1').setValue(data.newUsername);
      if (data.newPassword) sheet.getRange('B1').setValue(data.newPassword);
      return ContentService.createTextOutput(JSON.stringify({success: true, message: 'تم تحديث بيانات الفورم'})).setMimeType(ContentService.MimeType.JSON);
    }
    
    // إضافة تقرير
    if (data.action === 'add_submission') {
      var sheet = ss.getSheetByName('Submissions');
      if (!sheet) {
        sheet = ss.insertSheet('Submissions');
        sheet.getRange('A1:F1').setValues([['التاريخ', 'القرية', 'العدد', 'المبلغ', 'المكان', 'المندوب']]);
      }
      var lastRow = sheet.getLastRow() + 1;
      sheet.getRange(lastRow, 1, 1, 6).setValues([[
        new Date(),
        data.villageName || '',
        Number(data.totalPeople) || 0,
        Number(data.totalAmount) || 0,
        data.location || '',
        data.submittedBy || ''
      ]]);
      return ContentService.createTextOutput(JSON.stringify({success: true, message: 'تم حفظ التقرير'})).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({success: false, message: 'إجراء غير معروف'})).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({success: false, error: error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  try {
    var action = e.parameter.action;
    
    // جلب بيانات الأدمن
    if (action === 'get_admin_credentials') {
      var sheet = ss.getSheetByName('AdminSettings');
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({username: 'admin', password: 'admin123'})).setMimeType(ContentService.MimeType.JSON);
      }
      var username = sheet.getRange('A1').getValue() || 'admin';
      var password = sheet.getRange('B1').getValue() || 'admin123';
      return ContentService.createTextOutput(JSON.stringify({username: username, password: password})).setMimeType(ContentService.MimeType.JSON);
    }
    
    // جلب بيانات الفورم
    if (action === 'get_form_credentials') {
      var sheet = ss.getSheetByName('FormSettings');
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({username: 'form', password: 'form123'})).setMimeType(ContentService.MimeType.JSON);
      }
      var username = sheet.getRange('A1').getValue() || 'form';
      var password = sheet.getRange('B1').getValue() || 'form123';
      return ContentService.createTextOutput(JSON.stringify({username: username, password: password})).setMimeType(ContentService.MimeType.JSON);
    }
    
    // جلب التقارير
    if (action === 'get_reports') {
      var sheet = ss.getSheetByName('Submissions');
      if (!sheet || sheet.getLastRow() <= 1) {
        return ContentService.createTextOutput(JSON.stringify({
          data: [],
          stats: {totalPeople: 0, totalAmount: 0, totalSubmissions: 0}
        })).setMimeType(ContentService.MimeType.JSON);
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
      
      return ContentService.createTextOutput(JSON.stringify({
        data: submissions,
        stats: {
          totalSubmissions: submissions.length,
          totalPeople: totalPeople,
          totalAmount: totalAmount
        }
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({error: 'إجراء غير معروف'})).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({error: error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // إنشاء شيت الأدمن
  var adminSheet = ss.getSheetByName('AdminSettings');
  if (!adminSheet) {
    adminSheet = ss.insertSheet('AdminSettings');
    adminSheet.getRange('A1').setValue('admin');
    adminSheet.getRange('B1').setValue('admin123');
  }
  
  // إنشاء شيت الفورم
  var formSheet = ss.getSheetByName('FormSettings');
  if (!formSheet) {
    formSheet = ss.insertSheet('FormSettings');
    formSheet.getRange('A1').setValue('form');
    formSheet.getRange('B1').setValue('form123');
  }
  
  // إنشاء شيت التقارير
  var submissionsSheet = ss.getSheetByName('Submissions');
  if (!submissionsSheet) {
    submissionsSheet = ss.insertSheet('Submissions');
    submissionsSheet.getRange('A1:F1').setValues([['التاريخ', 'القرية', 'العدد', 'المبلغ', 'المكان', 'المندوب']]);
    // إضافة بيانات تجريبية
    submissionsSheet.getRange('A2:F2').setValues([[new Date(), 'قرية تجريبية', 100, 5000, 'مكان تجريبي', 'مختبر النظام']]);
  }
  
  Logger.log('تم إنشاء جميع الشيتس بنجاح');
}
