/**
 * Google Apps Script للتعامل مع شيت الإرسالات (Submissions)
 * يتضمن جميع التحديثات الأخيرة: حذف المستلمين/غير المستلمين، إضافة المكان
 */

// إعدادات الشيت
const SUBMISSIONS_SHEET_NAME = 'الإرسالات';
const SUBMISSIONS_HEADERS = [
  'التاريخ',
  'اسم القرية', 
  'العدد الكلي',
  'المبلغ الإجمالي',
  'المكان',
  'اسم المندوب/المشرف',
  'النوع',
  'الوقت'
];

/**
 * إنشاء شيت الإرسالات مع الهيكل الجديد
 */
function createSubmissionsSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // حذف الشيت إذا كان موجود
  const existingSheet = spreadsheet.getSheetByName(SUBMISSIONS_SHEET_NAME);
  if (existingSheet) {
    spreadsheet.deleteSheet(existingSheet);
  }
  
  // إنشاء شيت جديد
  const sheet = spreadsheet.insertSheet(SUBMISSIONS_SHEET_NAME);
  
  // إضافة العناوين
  const headerRange = sheet.getRange(1, 1, 1, SUBMISSIONS_HEADERS.length);
  headerRange.setValues([SUBMISSIONS_HEADERS]);
  
  // تنسيق العناوين
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  // تجميد الصف الأول
  sheet.setFrozenRows(1);
  
  // تعديل عرض الأعمدة
  sheet.setColumnWidth(1, 120); // التاريخ
  sheet.setColumnWidth(2, 150); // اسم القرية
  sheet.setColumnWidth(3, 100); // العدد الكلي
  sheet.setColumnWidth(4, 120); // المبلغ الإجمالي
  sheet.setColumnWidth(5, 120); // المكان
  sheet.setColumnWidth(6, 150); // اسم المندوب/المشرف
  sheet.setColumnWidth(7, 80);  // النوع
  sheet.setColumnWidth(8, 100); // الوقت
  
  Logger.log('تم إنشاء شيت الإرسالات بنجاح');
}

/**
 * إضافة إرسال جديد
 */
function addSubmission(submissionData) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SUBMISSIONS_SHEET_NAME);
    
    if (!sheet) {
      throw new Error('شيت الإرسالات غير موجود');
    }
    
    const newRow = [
      new Date(submissionData.submittedAt || new Date()),
      submissionData.villageName || '',
      submissionData.totalPeople || 0,
      submissionData.totalAmount || 0,
      submissionData.location || '',
      submissionData.submittedBy || '',
      submissionData.representativeRole || 'مندوب',
      Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'HH:mm:ss')
    ];
    
    sheet.appendRow(newRow);
    
    // تنسيق الصف الجديد
    const lastRow = sheet.getLastRow();
    const range = sheet.getRange(lastRow, 1, 1, SUBMISSIONS_HEADERS.length);
    
    // تنسيق التاريخ والوقت
    sheet.getRange(lastRow, 1).setNumberFormat('dd/mm/yyyy');
    sheet.getRange(lastRow, 8).setNumberFormat('hh:mm:ss');
    
    // تنسيق المبلغ
    sheet.getRange(lastRow, 4).setNumberFormat('#,##0 "ج"');
    
    // تنسيق النوع (مندوب/مشرف)
    const roleCell = sheet.getRange(lastRow, 7);
    if (submissionData.representativeRole === 'مشرف') {
      roleCell.setBackground('#e1bee7');
      roleCell.setFontColor('#4a148c');
    } else {
      roleCell.setBackground('#bbdefb');
      roleCell.setFontColor('#0d47a1');
    }
    
    Logger.log('تم إضافة الإرسال بنجاح');
    return true;
    
  } catch (error) {
    Logger.log('خطأ في إضافة الإرسال: ' + error.toString());
    return false;
  }
}

/**
 * الحصول على جميع الإرسالات
 */
function getAllSubmissions() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SUBMISSIONS_SHEET_NAME);
    
    if (!sheet) {
      return [];
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    return rows.map(row => {
      const submission = {};
      headers.forEach((header, index) => {
        submission[header] = row[index];
      });
      return submission;
    });
    
  } catch (error) {
    Logger.log('خطأ في جلب الإرسالات: ' + error.toString());
    return [];
  }
}

/**
 * البحث في الإرسالات
 */
function searchSubmissions(searchTerm) {
  const allSubmissions = getAllSubmissions();
  
  if (!searchTerm) {
    return allSubmissions;
  }
  
  return allSubmissions.filter(submission => 
    submission['اسم القرية'].toLowerCase().includes(searchTerm.toLowerCase()) ||
    submission['اسم المندوب/المشرف'].toLowerCase().includes(searchTerm.toLowerCase()) ||
    submission['المكان'].toLowerCase().includes(searchTerm.toLowerCase())
  );
}

/**
 * إحصائيات الإرسالات
 */
function getSubmissionsStats() {
  const submissions = getAllSubmissions();
  
  const stats = {
    totalSubmissions: submissions.length,
    totalPeople: 0,
    totalAmount: 0,
    uniqueVillages: new Set(),
    uniqueLocations: new Set(),
    mandoubCount: 0,
    moshrefCount: 0
  };
  
  submissions.forEach(submission => {
    stats.totalPeople += Number(submission['العدد الكلي']) || 0;
    stats.totalAmount += Number(submission['المبلغ الإجمالي']) || 0;
    stats.uniqueVillages.add(submission['اسم القرية']);
    stats.uniqueLocations.add(submission['المكان']);
    
    if (submission['النوع'] === 'مشرف') {
      stats.moshrefCount++;
    } else {
      stats.mandoubCount++;
    }
  });
  
  stats.uniqueVillages = stats.uniqueVillages.size;
  stats.uniqueLocations = stats.uniqueLocations.size;
  
  return stats;
}

/**
 * تصدير الإرسالات إلى CSV
 */
function exportSubmissionsToCSV() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SUBMISSIONS_SHEET_NAME);
  
  if (!sheet) {
    throw new Error('شيت الإرسالات غير موجود');
  }
  
  const data = sheet.getDataRange().getValues();
  let csvContent = '';
  
  data.forEach(row => {
    csvContent += row.join(',') + '\n';
  });
  
  const blob = Utilities.newBlob(csvContent, 'text/csv', 'submissions_export.csv');
  
  // حفظ في Google Drive
  DriveApp.createFile(blob);
  
  Logger.log('تم تصدير الإرسالات بنجاح');
}

/**
 * تنظيف البيانات المكررة
 */
function cleanDuplicateSubmissions() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SUBMISSIONS_SHEET_NAME);
  
  if (!sheet) {
    return;
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  const uniqueRows = [];
  const seen = new Set();
  
  rows.forEach(row => {
    const key = `${row[1]}_${row[2]}_${row[3]}_${row[5]}`; // قرية + عدد + مبلغ + مندوب
    
    if (!seen.has(key)) {
      seen.add(key);
      uniqueRows.push(row);
    }
  });
  
  // مسح الشيت وإعادة كتابة البيانات النظيفة
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  if (uniqueRows.length > 0) {
    sheet.getRange(2, 1, uniqueRows.length, headers.length).setValues(uniqueRows);
  }
  
  Logger.log(`تم حذف ${rows.length - uniqueRows.length} صف مكرر`);
}

/**
 * اختبار الوظائف
 */
function testSubmissionsSheet() {
  // إنشاء الشيت
  createSubmissionsSheet();
  
  // إضافة بيانات تجريبية
  const testData = {
    villageName: 'قرية تجريبية',
    totalPeople: 100,
    totalAmount: 5000,
    location: 'مركز تجريبي',
    submittedBy: 'أحمد محمد',
    representativeRole: 'مندوب',
    submittedAt: new Date()
  };
  
  addSubmission(testData);
  
  // عرض الإحصائيات
  const stats = getSubmissionsStats();
  Logger.log('إحصائيات الإرسالات: ' + JSON.stringify(stats));
}
