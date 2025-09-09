function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var data = JSON.parse(e.postData.contents);
  
  if (data.action == 'update_admin_password') {
    var sheet = ss.getSheetByName('admin') || ss.insertSheet('admin');
    if (sheet.getLastRow() == 0) sheet.appendRow(['admin', 'admin123']);
    sheet.getRange(1, 2).setValue(data.newPassword);
    return ContentService.createTextOutput('{"success":true}').setMimeType(ContentService.MimeType.JSON);
  }
  
  if (data.action == 'update_form_credentials') {
    var sheet = ss.getSheetByName('form') || ss.insertSheet('form');
    if (sheet.getLastRow() == 0) sheet.appendRow(['form', 'form123']);
    if (data.newUsername) sheet.getRange(1, 1).setValue(data.newUsername);
    if (data.newPassword) sheet.getRange(1, 2).setValue(data.newPassword);
    return ContentService.createTextOutput('{"success":true}').setMimeType(ContentService.MimeType.JSON);
  }
  
  if (data.action == 'add_submission') {
    var sheet = ss.getSheetByName('data') || ss.insertSheet('data');
    sheet.appendRow([new Date(), data.villageName, data.totalPeople, data.totalAmount, data.location, data.submittedBy]);
    return ContentService.createTextOutput('{"success":true}').setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput('{"success":false}').setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var action = e.parameter.action;
  
  if (action == 'get_admin_credentials') {
    var sheet = ss.getSheetByName('admin');
    if (!sheet) return ContentService.createTextOutput('{"username":"admin","password":"admin123"}').setMimeType(ContentService.MimeType.JSON);
    return ContentService.createTextOutput('{"username":"' + (sheet.getRange(1,1).getValue() || 'admin') + '","password":"' + (sheet.getRange(1,2).getValue() || 'admin123') + '"}').setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action == 'get_form_credentials') {
    var sheet = ss.getSheetByName('form');
    if (!sheet) return ContentService.createTextOutput('{"username":"form","password":"form123"}').setMimeType(ContentService.MimeType.JSON);
    return ContentService.createTextOutput('{"username":"' + (sheet.getRange(1,1).getValue() || 'form') + '","password":"' + (sheet.getRange(1,2).getValue() || 'form123') + '"}').setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action == 'get_reports') {
    var sheet = ss.getSheetByName('data');
    if (!sheet || sheet.getLastRow() == 0) {
      return ContentService.createTextOutput('{"data":[],"stats":{"totalPeople":0,"totalAmount":0,"totalSubmissions":0}}').setMimeType(ContentService.MimeType.JSON);
    }
    
    var data = sheet.getDataRange().getValues();
    var submissions = [];
    var totalPeople = 0;
    var totalAmount = 0;
    
    for (var i = 0; i < data.length; i++) {
      submissions.push({
        'التاريخ': data[i][0],
        'القرية': data[i][1],
        'العدد': data[i][2],
        'المبلغ': data[i][3],
        'المكان': data[i][4],
        'المندوب': data[i][5]
      });
      totalPeople += Number(data[i][2]) || 0;
      totalAmount += Number(data[i][3]) || 0;
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
  
  return ContentService.createTextOutput('{"error":"unknown"}').setMimeType(ContentService.MimeType.JSON);
}

function test() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('data') || ss.insertSheet('data');
  sheet.appendRow([new Date(), 'قرية تجريبية', 100, 5000, 'مكان تجريبي', 'مختبر']);
  Logger.log('تم الاختبار');
}
