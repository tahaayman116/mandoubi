function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // تحديث باسورد الأدمن
    if (data.action === 'update_admin_password') {
      var sheet = ss.getSheetByName('AdminSettings') || ss.insertSheet('AdminSettings');
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(['Username', 'Password', 'LastUpdated']);
        sheet.appendRow(['admin', 'admin123', new Date()]);
      }
      sheet.getRange(2, 2).setValue(data.newPassword);
      sheet.getRange(2, 3).setValue(new Date());
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'تم تحديث باسورد الأدمن بنجاح',
        timestamp: new Date()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // تحديث بيانات الفورم
    if (data.action === 'update_form_credentials') {
      var sheet = ss.getSheetByName('FormSettings') || ss.insertSheet('FormSettings');
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(['Username', 'Password', 'LastUpdated']);
        sheet.appendRow(['form', 'form123', new Date()]);
      }
      if (data.newUsername) sheet.getRange(2, 1).setValue(data.newUsername);
      if (data.newPassword) sheet.getRange(2, 2).setValue(data.newPassword);
      sheet.getRange(2, 3).setValue(new Date());
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'تم تحديث بيانات الفورم بنجاح',
        timestamp: new Date()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // إضافة تقرير جديد
    if (data.action === 'add_submission') {
      var sheet = ss.getSheetByName('Submissions') || ss.insertSheet('Submissions');
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(['التاريخ', 'القرية', 'العدد', 'المبلغ', 'المكان', 'المندوب', 'النوع', 'الحالة']);
      }
      sheet.appendRow([
        new Date(),
        data.villageName || '',
        Number(data.totalPeople) || 0,
        Number(data.totalAmount) || 0,
        data.location || '',
        data.submittedBy || '',
        data.representativeRole || 'مندوب',
        'مؤكد'
      ]);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'تم حفظ التقرير بنجاح',
        submissionId: sheet.getLastRow() - 1,
        timestamp: new Date()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // إضافة مندوب/مشرف
    if (data.action === 'add_representative') {
      var sheet = ss.getSheetByName('Representatives') || ss.insertSheet('Representatives');
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(['الاسم', 'النوع', 'المكان', 'تاريخ الإضافة', 'نشط', 'عدد التقارير', 'آخر نشاط']);
      }
      sheet.appendRow([
        data.name || '',
        data.role || 'مندوب',
        data.location || '',
        new Date(),
        data.active !== false ? 'نعم' : 'لا',
        0,
        new Date()
      ]);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'تم إضافة المندوب/المشرف بنجاح',
        representativeId: sheet.getLastRow() - 1,
        timestamp: new Date()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // حذف تقرير
    if (data.action === 'delete_submission') {
      var sheet = ss.getSheetByName('Submissions');
      if (sheet && data.rowIndex && data.rowIndex > 0) {
        sheet.deleteRow(data.rowIndex + 1);
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: 'تم حذف التقرير بنجاح',
          timestamp: new Date()
        })).setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: 'لم يتم العثور على التقرير المطلوب حذفه'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // حذف مندوب
    if (data.action === 'delete_representative') {
      var sheet = ss.getSheetByName('Representatives');
      if (sheet && data.rowIndex && data.rowIndex > 0) {
        sheet.deleteRow(data.rowIndex + 1);
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: 'تم حذف المندوب/المشرف بنجاح',
          timestamp: new Date()
        })).setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: 'لم يتم العثور على المندوب/المشرف المطلوب حذفه'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'إجراء غير معروف: ' + data.action
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString(),
      timestamp: new Date()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var action = e.parameter.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // جلب بيانات الأدمن
    if (action === 'get_admin_credentials') {
      var sheet = ss.getSheetByName('AdminSettings');
      if (!sheet || sheet.getLastRow() <= 1) {
        return ContentService.createTextOutput(JSON.stringify({
          username: 'admin',
          password: 'admin123',
          lastUpdated: new Date()
        })).setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService.createTextOutput(JSON.stringify({
        username: sheet.getRange(2, 1).getValue() || 'admin',
        password: sheet.getRange(2, 2).getValue() || 'admin123',
        lastUpdated: sheet.getRange(2, 3).getValue() || new Date()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // جلب بيانات الفورم
    if (action === 'get_form_credentials') {
      var sheet = ss.getSheetByName('FormSettings');
      if (!sheet || sheet.getLastRow() <= 1) {
        return ContentService.createTextOutput(JSON.stringify({
          username: 'form',
          password: 'form123',
          lastUpdated: new Date()
        })).setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService.createTextOutput(JSON.stringify({
        username: sheet.getRange(2, 1).getValue() || 'form',
        password: sheet.getRange(2, 2).getValue() || 'form123',
        lastUpdated: sheet.getRange(2, 3).getValue() || new Date()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // جلب جميع التقارير
    if (action === 'get_reports') {
      var sheet = ss.getSheetByName('Submissions');
      if (!sheet || sheet.getLastRow() <= 1) {
        return ContentService.createTextOutput(JSON.stringify({
          data: [],
          stats: {
            totalSubmissions: 0,
            totalPeople: 0,
            totalAmount: 0,
            uniqueVillages: 0,
            uniqueRepresentatives: 0
          },
          timestamp: new Date()
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var rows = data.slice(1);
      
      var submissions = [];
      var totalPeople = 0;
      var totalAmount = 0;
      var villages = new Set();
      var representatives = new Set();
      
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var submission = { rowIndex: i };
        
        for (var j = 0; j < headers.length; j++) {
          submission[headers[j]] = row[j];
        }
        
        submissions.push(submission);
        totalPeople += Number(row[2]) || 0;
        totalAmount += Number(row[3]) || 0;
        if (row[1]) villages.add(row[1]);
        if (row[5]) representatives.add(row[5]);
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        data: submissions,
        stats: {
          totalSubmissions: submissions.length,
          totalPeople: totalPeople,
          totalAmount: totalAmount,
          uniqueVillages: villages.size,
          uniqueRepresentatives: representatives.size
        },
        timestamp: new Date()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // جلب جميع المندوبين والمشرفين
    if (action === 'get_representatives') {
      var sheet = ss.getSheetByName('Representatives');
      if (!sheet || sheet.getLastRow() <= 1) {
        return ContentService.createTextOutput(JSON.stringify({
          data: [],
          stats: {
            totalRepresentatives: 0,
            mandoubCount: 0,
            moshrefCount: 0,
            activeCount: 0
          },
          timestamp: new Date()
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var rows = data.slice(1);
      
      var representatives = [];
      var mandoubCount = 0;
      var moshrefCount = 0;
      var activeCount = 0;
      
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var rep = { rowIndex: i };
        
        for (var j = 0; j < headers.length; j++) {
          rep[headers[j]] = row[j];
        }
        
        representatives.push(rep);
        if (row[1] === 'مندوب') mandoubCount++;
        if (row[1] === 'مشرف') moshrefCount++;
        if (row[4] === 'نعم') activeCount++;
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        data: representatives,
        stats: {
          totalRepresentatives: representatives.length,
          mandoubCount: mandoubCount,
          moshrefCount: moshrefCount,
          activeCount: activeCount
        },
        timestamp: new Date()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // إحصائيات شاملة
    if (action === 'get_all_stats') {
      var submissionsResponse = JSON.parse(doGet({parameter: {action: 'get_reports'}}).getContent());
      var representativesResponse = JSON.parse(doGet({parameter: {action: 'get_representatives'}}).getContent());
      
      return ContentService.createTextOutput(JSON.stringify({
        submissions: submissionsResponse.stats,
        representatives: representativesResponse.stats,
        system: {
          lastUpdated: new Date(),
          totalSheets: ss.getSheets().length,
          scriptVersion: '2.0'
        }
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // تصدير البيانات كـ CSV
    if (action === 'export_csv') {
      var type = e.parameter.type || 'submissions';
      var sheet = ss.getSheetByName(type === 'representatives' ? 'Representatives' : 'Submissions');
      
      if (!sheet) {
        return ContentService.createTextOutput('لا توجد بيانات للتصدير').setMimeType(ContentService.MimeType.TEXT);
      }
      
      var data = sheet.getDataRange().getValues();
      var csv = '';
      
      for (var i = 0; i < data.length; i++) {
        csv += data[i].join(',') + '\n';
      }
      
      return ContentService.createTextOutput(csv).setMimeType(ContentService.MimeType.TEXT);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      error: 'إجراء غير معروف: ' + action,
      availableActions: [
        'get_admin_credentials',
        'get_form_credentials', 
        'get_reports',
        'get_representatives',
        'get_all_stats',
        'export_csv'
      ]
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString(),
      timestamp: new Date()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function setupCompleteSystem() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // إنشاء شيت إعدادات الأدمن
  var adminSheet = ss.getSheetByName('AdminSettings');
  if (!adminSheet) {
    adminSheet = ss.insertSheet('AdminSettings');
    adminSheet.getRange('A1:C1').setValues([['Username', 'Password', 'LastUpdated']]);
    adminSheet.getRange('A2:C2').setValues([['admin', 'admin123', new Date()]]);
    adminSheet.getRange('A1:C1').setFontWeight('bold');
    adminSheet.getRange('A1:C1').setBackground('#4285f4');
    adminSheet.getRange('A1:C1').setFontColor('white');
  }
  
  // إنشاء شيت إعدادات الفورم
  var formSheet = ss.getSheetByName('FormSettings');
  if (!formSheet) {
    formSheet = ss.insertSheet('FormSettings');
    formSheet.getRange('A1:C1').setValues([['Username', 'Password', 'LastUpdated']]);
    formSheet.getRange('A2:C2').setValues([['form', 'form123', new Date()]]);
    formSheet.getRange('A1:C1').setFontWeight('bold');
    formSheet.getRange('A1:C1').setBackground('#34a853');
    formSheet.getRange('A1:C1').setFontColor('white');
  }
  
  // إنشاء شيت التقارير
  var submissionsSheet = ss.getSheetByName('Submissions');
  if (!submissionsSheet) {
    submissionsSheet = ss.insertSheet('Submissions');
    submissionsSheet.getRange('A1:H1').setValues([['التاريخ', 'القرية', 'العدد', 'المبلغ', 'المكان', 'المندوب', 'النوع', 'الحالة']]);
    submissionsSheet.getRange('A1:H1').setFontWeight('bold');
    submissionsSheet.getRange('A1:H1').setBackground('#ea4335');
    submissionsSheet.getRange('A1:H1').setFontColor('white');
    
    // إضافة بيانات تجريبية
    submissionsSheet.getRange('A2:H2').setValues([[
      new Date(),
      'قرية تجريبية',
      100,
      5000,
      'مكان تجريبي',
      'مختبر النظام',
      'مندوب',
      'مؤكد'
    ]]);
  }
  
  // إنشاء شيت المندوبين والمشرفين
  var representativesSheet = ss.getSheetByName('Representatives');
  if (!representativesSheet) {
    representativesSheet = ss.insertSheet('Representatives');
    representativesSheet.getRange('A1:G1').setValues([['الاسم', 'النوع', 'المكان', 'تاريخ الإضافة', 'نشط', 'عدد التقارير', 'آخر نشاط']]);
    representativesSheet.getRange('A1:G1').setFontWeight('bold');
    representativesSheet.getRange('A1:G1').setBackground('#ff9900');
    representativesSheet.getRange('A1:G1').setFontColor('white');
    
    // إضافة بيانات تجريبية
    representativesSheet.getRange('A2:G2').setValues([[
      'أحمد محمد',
      'مندوب',
      'مركز تجريبي',
      new Date(),
      'نعم',
      1,
      new Date()
    ]]);
  }
  
  // إنشاء شيت السجلات
  var logsSheet = ss.getSheetByName('SystemLogs');
  if (!logsSheet) {
    logsSheet = ss.insertSheet('SystemLogs');
    logsSheet.getRange('A1:D1').setValues([['التاريخ', 'النوع', 'الإجراء', 'التفاصيل']]);
    logsSheet.getRange('A1:D1').setFontWeight('bold');
    logsSheet.getRange('A1:D1').setBackground('#9c27b0');
    logsSheet.getRange('A1:D1').setFontColor('white');
    
    logsSheet.getRange('A2:D2').setValues([[
      new Date(),
      'SYSTEM',
      'SETUP',
      'تم إنشاء النظام بنجاح'
    ]]);
  }
  
  Logger.log('تم إنشاء النظام الكامل بنجاح!');
  Logger.log('الشيتس المنشأة: AdminSettings, FormSettings, Submissions, Representatives, SystemLogs');
  Logger.log('النظام جاهز للاستخدام!');
}

function cleanupDuplicates() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  
  for (var i = 0; i < sheets.length; i++) {
    var sheet = sheets[i];
    var name = sheet.getName();
    
    // حذف الشيتس المكررة أو غير المرغوب فيها
    if (name.includes('Copy') || name === 'Sheet1' || name === 'Sheet2') {
      ss.deleteSheet(sheet);
      Logger.log('تم حذف الشيت: ' + name);
    }
  }
  
  Logger.log('تم تنظيف الشيتس المكررة');
}

function backupData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var backupSheet = ss.getSheetByName('Backup_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy_MM_dd'));
  
  if (!backupSheet) {
    backupSheet = ss.insertSheet('Backup_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy_MM_dd'));
    
    var submissionsSheet = ss.getSheetByName('Submissions');
    if (submissionsSheet) {
      var data = submissionsSheet.getDataRange().getValues();
      backupSheet.getRange(1, 1, data.length, data[0].length).setValues(data);
    }
    
    Logger.log('تم إنشاء نسخة احتياطية للبيانات');
  }
}
