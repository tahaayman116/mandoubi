function doPost(e) {
  try {
    console.log('=== POST REQUEST RECEIVED ===');
    console.log('e object keys:', Object.keys(e));
    console.log('e.postData:', e.postData);
    console.log('e.parameter:', e.parameter);
    
    var data;
    
    // Handle FormData (from fetch with FormData)
    if (e.parameter && e.parameter.data) {
      console.log('Processing FormData parameter');
      console.log('Raw parameter data:', e.parameter.data);
      try {
        data = JSON.parse(e.parameter.data);
        console.log('Parsed FormData successfully:', data);
      } catch (parseError) {
        console.error('Failed to parse FormData:', parseError);
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: 'Invalid FormData JSON: ' + parseError.message
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    // Handle direct JSON (from fetch with JSON body)
    else if (e.postData && e.postData.contents) {
      console.log('Processing direct JSON');
      console.log('Raw postData contents:', e.postData.contents);
      try {
        data = JSON.parse(e.postData.contents);
        console.log('Parsed JSON successfully:', data);
      } catch (parseError) {
        console.error('Failed to parse JSON:', parseError);
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: 'Invalid JSON: ' + parseError.message
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    else {
      console.error('No valid data found in request');
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'No data received - check request format'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    console.log('Final parsed data:', JSON.stringify(data));
    console.log('Action:', data.action);
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    console.log('Spreadsheet ID:', ss.getId());
    
    // تحديث باسورد الأدمن
    if (data.action === 'update_admin_password') {
      console.log('=== UPDATING ADMIN PASSWORD ===');
      var adminSheet = ss.getSheetByName('AdminSettings');
      if (!adminSheet) {
        console.log('Creating AdminSettings sheet');
        adminSheet = ss.insertSheet('AdminSettings');
        adminSheet.appendRow(['Username', 'Password']);
        adminSheet.appendRow(['admin', 'admin123']);
      }
      
      if (adminSheet.getLastRow() <= 1) {
        console.log('Adding default admin row');
        adminSheet.appendRow(['admin', 'admin123']);
      }
      
      console.log('Setting new password:', data.newPassword);
      adminSheet.getRange(2, 2).setValue(data.newPassword);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'تم تحديث باسورد الأدمن',
        action: 'update_admin_password'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // تحديث بيانات الفورم
    if (data.action === 'update_form_credentials') {
      console.log('=== UPDATING FORM CREDENTIALS ===');
      var formSheet = ss.getSheetByName('FormSettings');
      if (!formSheet) {
        console.log('Creating FormSettings sheet');
        formSheet = ss.insertSheet('FormSettings');
        formSheet.appendRow(['Username', 'Password']);
        formSheet.appendRow(['form', 'form123']);
      }
      
      if (formSheet.getLastRow() <= 1) {
        console.log('Adding default form row');
        formSheet.appendRow(['form', 'form123']);
      }
      
      console.log('Updating form credentials - Username:', data.newUsername, 'Password:', data.newPassword);
      if (data.newUsername) formSheet.getRange(2, 1).setValue(data.newUsername);
      if (data.newPassword) formSheet.getRange(2, 2).setValue(data.newPassword);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'تم تحديث بيانات الفورم',
        action: 'update_form_credentials'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // إضافة تقرير
    if (data.action === 'add_submission') {
      console.log('=== ADDING SUBMISSION ===');
      var submissionSheet = ss.getSheetByName('Submissions');
      if (!submissionSheet) {
        console.log('Creating Submissions sheet');
        submissionSheet = ss.insertSheet('Submissions');
        submissionSheet.appendRow(['التاريخ', 'المكان', 'العدد', 'المبلغ', 'المندوب']);
      }
      
      if (submissionSheet.getLastRow() === 0) {
        console.log('Adding headers to Submissions sheet');
        submissionSheet.appendRow(['التاريخ', 'المكان', 'العدد', 'المبلغ', 'المندوب']);
      }
      
      var rowData = [
        new Date(),
        data.location || data.villageName || '',
        Number(data.totalPeople) || 0,
        Number(data.totalAmount) || 0,
        data.submittedBy || ''
      ];
      
      console.log('Adding submission row:', rowData);
      submissionSheet.appendRow(rowData);
      console.log('Submission added successfully');
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'تم حفظ التقرير',
        action: 'add_submission',
        rowData: rowData
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // إضافة مندوب
    if (data.action === 'add_representative') {
      console.log('=== ADDING REPRESENTATIVE ===');
      var repSheet = ss.getSheetByName('Representatives');
      if (!repSheet) {
        console.log('Creating Representatives sheet');
        repSheet = ss.insertSheet('Representatives');
        repSheet.appendRow(['الاسم', 'النوع', 'المكان']);
      }
      
      if (repSheet.getLastRow() === 0) {
        console.log('Adding headers to Representatives sheet');
        repSheet.appendRow(['الاسم', 'النوع', 'المكان']);
      }
      
      var repData = [
        data.name || '',
        data.role || 'مندوب',
        data.location || ''
      ];
      
      console.log('Adding representative row:', repData);
      repSheet.appendRow(repData);
      console.log('Representative added successfully');
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'تم إضافة المندوب',
        action: 'add_representative',
        repData: repData
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // حذف تقرير
    if (data.action === 'delete_submission') {
      console.log('=== DELETING SUBMISSION ===');
      var sheet = ss.getSheetByName('Submissions');
      if (sheet && data.rowIndex && data.rowIndex > 0) {
        sheet.deleteRow(data.rowIndex + 1);
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: 'تم حذف التقرير'
        })).setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: 'لم يتم العثور على التقرير'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // حذف مندوب
    if (data.action === 'delete_representative') {
      console.log('=== DELETING REPRESENTATIVE ===');
      var sheet = ss.getSheetByName('Representatives');
      if (sheet && data.rowIndex && data.rowIndex > 0) {
        sheet.deleteRow(data.rowIndex + 1);
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: 'تم حذف المندوب'
        })).setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: 'لم يتم العثور على المندوب'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    console.log('Unknown action:', data.action);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'إجراء غير معروف: ' + data.action
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('=== ERROR IN doPost ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Server error: ' + error.message,
      stack: error.stack
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    console.log('=== GET REQUEST RECEIVED ===');
    console.log('Parameters:', e.parameter);
    
    var action = e.parameter.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // جلب بيانات الأدمن
    if (action === 'get_admin_credentials') {
      var sheet = ss.getSheetByName('AdminSettings');
      if (!sheet || sheet.getLastRow() <= 1) {
        return ContentService.createTextOutput(JSON.stringify({
          username: 'admin',
          password: 'admin123'
        })).setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService.createTextOutput(JSON.stringify({
        username: sheet.getRange(2, 1).getValue() || 'admin',
        password: sheet.getRange(2, 2).getValue() || 'admin123'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // جلب بيانات الفورم
    if (action === 'get_form_credentials') {
      var sheet = ss.getSheetByName('FormSettings');
      if (!sheet || sheet.getLastRow() <= 1) {
        return ContentService.createTextOutput(JSON.stringify({
          username: 'form',
          password: 'form123'
        })).setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService.createTextOutput(JSON.stringify({
        username: sheet.getRange(2, 1).getValue() || 'form',
        password: sheet.getRange(2, 2).getValue() || 'form123'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // جلب التقارير
    if (action === 'get_reports') {
      var sheet = ss.getSheetByName('Submissions');
      if (!sheet || sheet.getLastRow() <= 1) {
        return ContentService.createTextOutput(JSON.stringify({
          data: [],
          stats: {
            totalSubmissions: 0,
            totalPeople: 0,
            totalAmount: 0
          }
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var rows = data.slice(1);
      
      var submissions = [];
      var totalPeople = 0;
      var totalAmount = 0;
      
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var submission = { rowIndex: i };
        
        for (var j = 0; j < headers.length; j++) {
          submission[headers[j]] = row[j];
        }
        
        submissions.push(submission);
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
    
    // جلب المندوبين
    if (action === 'get_representatives') {
      var sheet = ss.getSheetByName('Representatives');
      if (!sheet || sheet.getLastRow() <= 1) {
        return ContentService.createTextOutput(JSON.stringify({
          data: [],
          stats: {
            totalRepresentatives: 0,
            mandoubCount: 0,
            moshrefCount: 0
          }
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var rows = data.slice(1);
      
      var representatives = [];
      var mandoubCount = 0;
      var moshrefCount = 0;
      
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var rep = { rowIndex: i };
        
        for (var j = 0; j < headers.length; j++) {
          rep[headers[j]] = row[j];
        }
        
        representatives.push(rep);
        if (row[1] === 'مندوب') mandoubCount++;
        if (row[1] === 'مشرف') moshrefCount++;
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        data: representatives,
        stats: {
          totalRepresentatives: representatives.length,
          mandoubCount: mandoubCount,
          moshrefCount: moshrefCount
        }
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      error: 'إجراء غير معروف'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('=== ERROR IN doGet ===');
    console.error('Error:', error.message);
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function setupSystem() {
  console.log('=== SETTING UP SYSTEM ===');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // إنشاء شيت الأدمن
  var adminSheet = ss.getSheetByName('AdminSettings');
  if (!adminSheet) {
    console.log('Creating AdminSettings sheet');
    adminSheet = ss.insertSheet('AdminSettings');
    adminSheet.getRange('A1:B1').setValues([['Username', 'Password']]);
    adminSheet.getRange('A2:B2').setValues([['admin', 'admin123']]);
    adminSheet.getRange('A1:B1').setFontWeight('bold');
  }
  
  // إنشاء شيت الفورم
  var formSheet = ss.getSheetByName('FormSettings');
  if (!formSheet) {
    console.log('Creating FormSettings sheet');
    formSheet = ss.insertSheet('FormSettings');
    formSheet.getRange('A1:B1').setValues([['Username', 'Password']]);
    formSheet.getRange('A2:B2').setValues([['form', 'form123']]);
    formSheet.getRange('A1:B1').setFontWeight('bold');
  }
  
  // إنشاء شيت التقارير
  var submissionsSheet = ss.getSheetByName('Submissions');
  if (!submissionsSheet) {
    console.log('Creating Submissions sheet');
    submissionsSheet = ss.insertSheet('Submissions');
    submissionsSheet.getRange('A1:E1').setValues([['التاريخ', 'المكان', 'العدد', 'المبلغ', 'المندوب']]);
    submissionsSheet.getRange('A1:E1').setFontWeight('bold');
    
    // بيانات تجريبية
    submissionsSheet.getRange('A2:E2').setValues([[
      new Date(),
      'مكان تجريبي',
      100,
      5000,
      'مختبر النظام'
    ]]);
  }
  
  // إنشاء شيت المندوبين
  var representativesSheet = ss.getSheetByName('Representatives');
  if (!representativesSheet) {
    console.log('Creating Representatives sheet');
    representativesSheet = ss.insertSheet('Representatives');
    representativesSheet.getRange('A1:C1').setValues([['الاسم', 'النوع', 'المكان']]);
    representativesSheet.getRange('A1:C1').setFontWeight('bold');
    
    // بيانات تجريبية
    representativesSheet.getRange('A2:C2').setValues([[
      'أحمد محمد',
      'مندوب',
      'مركز تجريبي'
    ]]);
  }
  
  console.log('System setup completed successfully!');
  Logger.log('تم إنشاء النظام بنجاح - جميع الشيتس جاهزة');
}

// دالة اختبار سريعة
function testScript() {
  console.log('=== TESTING SCRIPT ===');
  
  // اختبار إضافة تقرير
  var testSubmission = {
    postData: null,
    parameter: {
      data: JSON.stringify({
        action: 'add_submission',
        location: 'اختبار السكريبت',
        totalPeople: 25,
        totalAmount: 1250,
        submittedBy: 'مختبر السكريبت'
      })
    }
  };
  
  console.log('Testing submission...');
  var result = doPost(testSubmission);
  console.log('Test result:', result.getContent());
  
  return 'Test completed - check logs';
}
