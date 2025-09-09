function doPost(e) {
  try {
    console.log('doPost called with parameter:', e.parameter);
    console.log('doPost called with postData:', e.postData);
    
    var data = {};
    
    // Try to parse JSON from postData first
    if (e.postData && e.postData.contents) {
      try {
        console.log('Trying to parse postData contents:', e.postData.contents);
        data = JSON.parse(e.postData.contents);
        console.log('Successfully parsed postData:', JSON.stringify(data));
      } catch (parseError) {
        console.log('Failed to parse postData as JSON:', parseError);
        
        // Try to parse as form data
        if (e.parameter && e.parameter.data) {
          try {
            console.log('Trying to parse parameter data:', e.parameter.data);
            data = JSON.parse(e.parameter.data);
            console.log('Successfully parsed parameter data:', JSON.stringify(data));
          } catch (paramError) {
            console.log('Failed to parse parameter data:', paramError);
            data = e.parameter;
          }
        } else {
          data = e.parameter;
        }
      }
    } else if (e.parameter) {
      // Handle form data or URL parameters
      if (e.parameter.data) {
        try {
          console.log('Parsing parameter.data:', e.parameter.data);
          data = JSON.parse(e.parameter.data);
          console.log('Successfully parsed parameter.data:', JSON.stringify(data));
        } catch (error) {
          console.log('Failed to parse parameter.data, using raw parameters:', error);
          data = e.parameter;
        }
      } else {
        console.log('Using raw parameters:', JSON.stringify(e.parameter));
        data = e.parameter;
      }
    }
    
    console.log('Final parsed data:', JSON.stringify(data));
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    console.log('Spreadsheet accessed successfully');
    
    // Handle test connection
    if (data.action === 'test_connection') {
      console.log('Processing test_connection action');
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'تم الاتصال بنجاح',
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // تحديث بيانات الفورم
    if (data.action === 'update_form_credentials') {
      var sheet = ss.getSheetByName('FormSettings') || ss.insertSheet('FormSettings');
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(['Username', 'Password']);
        sheet.appendRow(['form', 'form123']);
      }
      if (data.newUsername) sheet.getRange(2, 1).setValue(data.newUsername);
      if (data.newPassword) sheet.getRange(2, 2).setValue(data.newPassword);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'تم تحديث بيانات الفورم'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // إضافة تقرير
    if (data.action === 'add_submission') {
      console.log('Processing add_submission action');
      var submissionSheet = ss.getSheetByName('Submissions');
      if (!submissionSheet) {
        console.log('Creating new Submissions sheet');
        submissionSheet = ss.insertSheet('Submissions');
        submissionSheet.appendRow(['التاريخ', 'اسم الشخص', 'المكان', 'العدد', 'المبلغ للفرد', 'المبلغ الإجمالي', 'المندوب']);
      } else if (submissionSheet.getLastRow() === 0) {
        console.log('Adding headers to existing empty sheet');
        submissionSheet.appendRow(['التاريخ', 'اسم الشخص', 'المكان', 'العدد', 'المبلغ للفرد', 'المبلغ الإجمالي', 'المندوب']);
      }
      
      // Check for duplicate entries (same person, amount, and time within 10 seconds)
      var existingData = submissionSheet.getDataRange().getValues();
      var currentTime = new Date();
      var personName = data.personName || data.submittedBy || '';
      var totalAmount = Number(data.totalAmount) || 0;
      
      for (var i = 1; i < existingData.length; i++) {
        var existingRow = existingData[i];
        var existingTime = new Date(existingRow[0]);
        var existingPerson = existingRow[1];
        var existingAmount = existingRow[5];
        
        // Check if same person, same amount, and within 10 seconds
        var timeDiff = Math.abs(currentTime - existingTime) / 1000; // seconds
        if (existingPerson === personName && existingAmount === totalAmount && timeDiff < 10) {
          console.log('Duplicate entry detected, skipping...');
          return ContentService.createTextOutput(JSON.stringify({
            success: true,
            message: 'تم تجاهل الإدخال المكرر',
            duplicate: true
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      
      var rowData = [
        currentTime,
        personName,
        data.location || data.villageName || '',
        Number(data.totalPeople) || 0,
        Number(data.amountPerPerson) || 50,
        totalAmount,
        data.representativeName || 'غير محدد'
      ];
      console.log('Adding row data:', JSON.stringify(rowData));
      submissionSheet.appendRow(rowData);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'تم حفظ التقرير',
        rowData: rowData
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // إضافة مندوب
    if (data.action === 'add_representative') {
      console.log('Processing add_representative action');
      var repSheet = ss.getSheetByName('Representatives');
      if (!repSheet) {
        console.log('Creating new Representatives sheet');
        repSheet = ss.insertSheet('Representatives');
        repSheet.appendRow(['الاسم', 'النوع', 'المكان']);
      } else if (repSheet.getLastRow() === 0) {
        console.log('Adding headers to existing empty Representatives sheet');
        repSheet.appendRow(['الاسم', 'النوع', 'المكان']);
      }
      
      var repData = [
        data.name || '',
        data.role || 'مندوب',
        data.location || ''
      ];
      console.log('Adding representative data:', JSON.stringify(repData));
      repSheet.appendRow(repData);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'تم إضافة المندوب',
        repData: repData
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // حذف تقرير
    if (data.action === 'delete_submission') {
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
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'إجراء غير معروف'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    console.log('doGet called with parameter:', e.parameter);
    var action = e.parameter.action;
    var data = e.parameter || {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Handle test connection
    if (action === 'test_connection') {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'تم الاتصال بنجاح (GET)',
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Handle add_submission via GET
    if (action === 'add_submission') {
      console.log('Processing add_submission via GET');
      var submissionSheet = ss.getSheetByName('Submissions');
      if (!submissionSheet) {
        console.log('Creating new Submissions sheet');
        submissionSheet = ss.insertSheet('Submissions');
        submissionSheet.appendRow(['التاريخ', 'اسم الشخص', 'المكان', 'العدد', 'المبلغ للفرد', 'المبلغ الإجمالي', 'المندوب']);
      } else if (submissionSheet.getLastRow() === 0) {
        console.log('Adding headers to existing empty sheet');
        submissionSheet.appendRow(['التاريخ', 'اسم الشخص', 'المكان', 'العدد', 'المبلغ للفرد', 'المبلغ الإجمالي', 'المندوب']);
      }
      
      var rowData = [
        new Date(),
        data.personName || data.submittedBy || '',
        data.location || data.villageName || '',
        Number(data.totalPeople) || 0,
        Number(data.amountPerPerson) || 50,
        Number(data.totalAmount) || 0,
        data.representativeName || 'غير محدد'
      ];
      
      console.log('Adding row data via GET:', JSON.stringify(rowData));
      submissionSheet.appendRow(rowData);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'تم حفظ التقرير (GET)',
        rowData: rowData
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
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
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function setupSystem() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // إنشاء شيت الأدمن
  var adminSheet = ss.getSheetByName('AdminSettings');
  if (!adminSheet) {
    adminSheet = ss.insertSheet('AdminSettings');
    adminSheet.getRange('A1:B1').setValues([['Username', 'Password']]);
    adminSheet.getRange('A2:B2').setValues([['admin', 'admin123']]);
    adminSheet.getRange('A1:B1').setFontWeight('bold');
  }
  
  // إنشاء شيت الفورم
  var formSheet = ss.getSheetByName('FormSettings');
  if (!formSheet) {
    formSheet = ss.insertSheet('FormSettings');
    formSheet.getRange('A1:B1').setValues([['Username', 'Password']]);
    formSheet.getRange('A2:B2').setValues([['form', 'form123']]);
    formSheet.getRange('A1:B1').setFontWeight('bold');
  }
  
  // إنشاء شيت التقارير
  var submissionsSheet = ss.getSheetByName('Submissions');
  if (!submissionsSheet) {
    submissionsSheet = ss.insertSheet('Submissions');
    submissionsSheet.getRange('A1:G1').setValues([['التاريخ', 'اسم الشخص', 'المكان', 'العدد', 'المبلغ للفرد', 'المبلغ الإجمالي', 'المندوب']]);
    submissionsSheet.getRange('A1:G1').setFontWeight('bold');
    
    // بيانات تجريبية
    submissionsSheet.getRange('A2:G2').setValues([[
      new Date(),
      'شخص تجريبي',
      'مكان تجريبي',
      100,
      50,
      5000,
      'مختبر النظام'
    ]]);
  }
  
  // إنشاء شيت المندوبين
  var representativesSheet = ss.getSheetByName('Representatives');
  if (!representativesSheet) {
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
  
  Logger.log('تم إنشاء النظام بنجاح - الحقول الأساسية فقط');
}
