function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var data = JSON.parse(e.postData.contents);
  
  if (data.action == 'update_admin_password') {
    var sheet = ss.getSheetByName('Admin') || ss.insertSheet('Admin');
    sheet.getRange(1, 1).setValue('admin');
    sheet.getRange(1, 2).setValue(data.newPassword);
    return ContentService.createTextOutput('{"success":true}').setMimeType(ContentService.MimeType.JSON);
  }
  
  if (data.action == 'add_submission') {
    var sheet = ss.getSheetByName('Data') || ss.insertSheet('Data');
    sheet.appendRow([new Date(), data.villageName, data.totalPeople, data.totalAmount]);
    return ContentService.createTextOutput('{"success":true}').setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput('{"success":false}').setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (e.parameter.action == 'get_admin_credentials') {
    var sheet = ss.getSheetByName('Admin');
    if (!sheet) return ContentService.createTextOutput('{"username":"admin","password":"admin123"}').setMimeType(ContentService.MimeType.JSON);
    return ContentService.createTextOutput('{"username":"admin","password":"' + sheet.getRange(1,2).getValue() + '"}').setMimeType(ContentService.MimeType.JSON);
  }
  
  if (e.parameter.action == 'get_reports') {
    var sheet = ss.getSheetByName('Data');
    if (!sheet) return ContentService.createTextOutput('{"data":[]}').setMimeType(ContentService.MimeType.JSON);
    var data = sheet.getDataRange().getValues();
    return ContentService.createTextOutput(JSON.stringify({"data": data})).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput('{"error":"unknown"}').setMimeType(ContentService.MimeType.JSON);
}

function init() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var adminSheet = ss.insertSheet('Admin');
  adminSheet.getRange(1, 1).setValue('admin');
  adminSheet.getRange(1, 2).setValue('admin123');
  
  var dataSheet = ss.insertSheet('Data');
  dataSheet.appendRow([new Date(), 'تجريبي', 100, 5000]);
}
