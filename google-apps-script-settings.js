/**
 * Google Apps Script للتعامل مع شيت الإعدادات (Settings)
 * يتضمن إعدادات النظام وإعدادات النموذج
 */

// إعدادات الشيت
const ADMIN_SETTINGS_SHEET_NAME = 'إعدادات الإدارة';
const FORM_SETTINGS_SHEET_NAME = 'إعدادات النموذج';
const SYSTEM_STATS_SHEET_NAME = 'إحصائيات النظام';

const ADMIN_SETTINGS_HEADERS = [
  'المفتاح',
  'القيمة',
  'الوصف',
  'تاريخ التحديث'
];

const FORM_SETTINGS_HEADERS = [
  'المفتاح',
  'القيمة', 
  'الوصف',
  'تاريخ التحديث'
];

const SYSTEM_STATS_HEADERS = [
  'الإحصائية',
  'القيمة',
  'تاريخ آخر تحديث'
];

/**
 * إنشاء شيت إعدادات الإدارة
 */
function createAdminSettingsSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // حذف الشيت إذا كان موجود
  const existingSheet = spreadsheet.getSheetByName(ADMIN_SETTINGS_SHEET_NAME);
  if (existingSheet) {
    spreadsheet.deleteSheet(existingSheet);
  }
  
  // إنشاء شيت جديد
  const sheet = spreadsheet.insertSheet(ADMIN_SETTINGS_SHEET_NAME);
  
  // إضافة العناوين
  const headerRange = sheet.getRange(1, 1, 1, ADMIN_SETTINGS_HEADERS.length);
  headerRange.setValues([ADMIN_SETTINGS_HEADERS]);
  
  // تنسيق العناوين
  headerRange.setBackground('#ff9800');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  // تجميد الصف الأول
  sheet.setFrozenRows(1);
  
  // تعديل عرض الأعمدة
  sheet.setColumnWidth(1, 200); // المفتاح
  sheet.setColumnWidth(2, 200); // القيمة
  sheet.setColumnWidth(3, 300); // الوصف
  sheet.setColumnWidth(4, 150); // تاريخ التحديث
  
  // إضافة الإعدادات الافتراضية
  const defaultSettings = [
    ['admin_username', 'admin', 'اسم المستخدم للإدارة', new Date()],
    ['admin_password', 'admin123', 'كلمة مرور الإدارة', new Date()],
    ['system_title', 'نظام إدارة المندوبين', 'عنوان النظام', new Date()],
    ['max_submissions_per_day', '50', 'الحد الأقصى للإرسالات يومياً', new Date()],
    ['backup_enabled', 'true', 'تفعيل النسخ الاحتياطي', new Date()],
    ['notifications_enabled', 'true', 'تفعيل الإشعارات', new Date()]
  ];
  
  if (defaultSettings.length > 0) {
    sheet.getRange(2, 1, defaultSettings.length, 4).setValues(defaultSettings);
  }
  
  Logger.log('تم إنشاء شيت إعدادات الإدارة بنجاح');
}

/**
 * إنشاء شيت إعدادات النموذج
 */
function createFormSettingsSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // حذف الشيت إذا كان موجود
  const existingSheet = spreadsheet.getSheetByName(FORM_SETTINGS_SHEET_NAME);
  if (existingSheet) {
    spreadsheet.deleteSheet(existingSheet);
  }
  
  // إنشاء شيت جديد
  const sheet = spreadsheet.insertSheet(FORM_SETTINGS_SHEET_NAME);
  
  // إضافة العناوين
  const headerRange = sheet.getRange(1, 1, 1, FORM_SETTINGS_HEADERS.length);
  headerRange.setValues([FORM_SETTINGS_HEADERS]);
  
  // تنسيق العناوين
  headerRange.setBackground('#9c27b0');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  // تجميد الصف الأول
  sheet.setFrozenRows(1);
  
  // تعديل عرض الأعمدة
  sheet.setColumnWidth(1, 200); // المفتاح
  sheet.setColumnWidth(2, 200); // القيمة
  sheet.setColumnWidth(3, 300); // الوصف
  sheet.setColumnWidth(4, 150); // تاريخ التحديث
  
  // إضافة الإعدادات الافتراضية
  const defaultSettings = [
    ['form_username', 'form', 'اسم المستخدم للنموذج', new Date()],
    ['form_password', 'form123', 'كلمة مرور النموذج', new Date()],
    ['form_title', 'نموذج إدخال البيانات', 'عنوان النموذج', new Date()],
    ['required_fields', 'villageName,totalPeople,totalAmount,location', 'الحقول المطلوبة', new Date()],
    ['auto_save_enabled', 'true', 'تفعيل الحفظ التلقائي', new Date()],
    ['validation_enabled', 'true', 'تفعيل التحقق من البيانات', new Date()]
  ];
  
  if (defaultSettings.length > 0) {
    sheet.getRange(2, 1, defaultSettings.length, 4).setValues(defaultSettings);
  }
  
  Logger.log('تم إنشاء شيت إعدادات النموذج بنجاح');
}

/**
 * إنشاء شيت إحصائيات النظام
 */
function createSystemStatsSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // حذف الشيت إذا كان موجود
  const existingSheet = spreadsheet.getSheetByName(SYSTEM_STATS_SHEET_NAME);
  if (existingSheet) {
    spreadsheet.deleteSheet(existingSheet);
  }
  
  // إنشاء شيت جديد
  const sheet = spreadsheet.insertSheet(SYSTEM_STATS_SHEET_NAME);
  
  // إضافة العناوين
  const headerRange = sheet.getRange(1, 1, 1, SYSTEM_STATS_HEADERS.length);
  headerRange.setValues([SYSTEM_STATS_HEADERS]);
  
  // تنسيق العناوين
  headerRange.setBackground('#607d8b');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  // تجميد الصف الأول
  sheet.setFrozenRows(1);
  
  // تعديل عرض الأعمدة
  sheet.setColumnWidth(1, 250); // الإحصائية
  sheet.setColumnWidth(2, 150); // القيمة
  sheet.setColumnWidth(3, 150); // تاريخ آخر تحديث
  
  Logger.log('تم إنشاء شيت إحصائيات النظام بنجاح');
}

/**
 * الحصول على إعداد من شيت الإعدادات
 */
function getSetting(sheetName, key) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    
    if (!sheet) {
      return null;
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        return data[i][1];
      }
    }
    
    return null;
    
  } catch (error) {
    Logger.log('خطأ في جلب الإعداد: ' + error.toString());
    return null;
  }
}

/**
 * تحديث إعداد في شيت الإعدادات
 */
function updateSetting(sheetName, key, value, description = '') {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    
    if (!sheet) {
      return false;
    }
    
    const data = sheet.getDataRange().getValues();
    let found = false;
    
    // البحث عن الإعداد الموجود
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(value);
        sheet.getRange(i + 1, 4).setValue(new Date());
        if (description) {
          sheet.getRange(i + 1, 3).setValue(description);
        }
        found = true;
        break;
      }
    }
    
    // إضافة إعداد جديد إذا لم يكن موجود
    if (!found) {
      const newRow = [key, value, description, new Date()];
      sheet.appendRow(newRow);
    }
    
    Logger.log(`تم تحديث الإعداد ${key} = ${value}`);
    return true;
    
  } catch (error) {
    Logger.log('خطأ في تحديث الإعداد: ' + error.toString());
    return false;
  }
}

/**
 * تحديث إحصائيات النظام
 */
function updateSystemStats() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SYSTEM_STATS_SHEET_NAME);
    
    if (!sheet) {
      createSystemStatsSheet();
      return updateSystemStats();
    }
    
    // حساب الإحصائيات من الشيتات الأخرى
    const submissionsStats = getSubmissionsStats();
    const representativesStats = getRepresentativesStats();
    
    // مسح البيانات الموجودة
    sheet.clear();
    
    // إضافة العناوين
    const headerRange = sheet.getRange(1, 1, 1, SYSTEM_STATS_HEADERS.length);
    headerRange.setValues([SYSTEM_STATS_HEADERS]);
    headerRange.setBackground('#607d8b');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    
    // إضافة الإحصائيات
    const stats = [
      ['إجمالي الإرسالات', submissionsStats.totalSubmissions, new Date()],
      ['إجمالي الأشخاص', submissionsStats.totalPeople, new Date()],
      ['إجمالي المبلغ', submissionsStats.totalAmount + ' ج', new Date()],
      ['عدد القرى', submissionsStats.uniqueVillages, new Date()],
      ['عدد الأماكن', submissionsStats.uniqueLocations, new Date()],
      ['عدد المندوبين', representativesStats.mandoubCount, new Date()],
      ['عدد المشرفين', representativesStats.moshrefCount, new Date()],
      ['إجمالي المندوبين والمشرفين', representativesStats.totalRepresentatives, new Date()],
      ['المندوبين والمشرفين النشطين', representativesStats.activeRepresentatives, new Date()],
      ['متوسط الأشخاص لكل إرسال', submissionsStats.totalSubmissions > 0 ? Math.round(submissionsStats.totalPeople / submissionsStats.totalSubmissions) : 0, new Date()],
      ['متوسط المبلغ لكل إرسال', submissionsStats.totalSubmissions > 0 ? Math.round(submissionsStats.totalAmount / submissionsStats.totalSubmissions) + ' ج' : '0 ج', new Date()]
    ];
    
    if (stats.length > 0) {
      sheet.getRange(2, 1, stats.length, 3).setValues(stats);
    }
    
    // تنسيق الأرقام
    const dataRange = sheet.getRange(2, 1, stats.length, 3);
    dataRange.getColumn(3).setNumberFormat('dd/mm/yyyy hh:mm:ss');
    
    Logger.log('تم تحديث إحصائيات النظام بنجاح');
    
  } catch (error) {
    Logger.log('خطأ في تحديث إحصائيات النظام: ' + error.toString());
  }
}

/**
 * الحصول على جميع الإعدادات
 */
function getAllSettings(sheetName) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    
    if (!sheet) {
      return {};
    }
    
    const data = sheet.getDataRange().getValues();
    const settings = {};
    
    for (let i = 1; i < data.length; i++) {
      settings[data[i][0]] = data[i][1];
    }
    
    return settings;
    
  } catch (error) {
    Logger.log('خطأ في جلب الإعدادات: ' + error.toString());
    return {};
  }
}

/**
 * نسخ احتياطي للإعدادات
 */
function backupSettings() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // إنشاء شيت نسخة احتياطية
    const backupSheetName = `نسخة_احتياطية_${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy_MM_dd_HH_mm')}`;
    const backupSheet = spreadsheet.insertSheet(backupSheetName);
    
    // نسخ إعدادات الإدارة
    const adminSheet = spreadsheet.getSheetByName(ADMIN_SETTINGS_SHEET_NAME);
    if (adminSheet) {
      const adminData = adminSheet.getDataRange().getValues();
      backupSheet.getRange(1, 1, adminData.length, adminData[0].length).setValues(adminData);
    }
    
    // نسخ إعدادات النموذج
    const formSheet = spreadsheet.getSheetByName(FORM_SETTINGS_SHEET_NAME);
    if (formSheet) {
      const formData = formSheet.getDataRange().getValues();
      const startRow = adminSheet ? adminData.length + 3 : 1;
      backupSheet.getRange(startRow, 1, formData.length, formData[0].length).setValues(formData);
    }
    
    Logger.log('تم إنشاء نسخة احتياطية للإعدادات: ' + backupSheetName);
    
  } catch (error) {
    Logger.log('خطأ في إنشاء النسخة الاحتياطية: ' + error.toString());
  }
}

/**
 * تشغيل تحديث دوري للإحصائيات
 */
function setupPeriodicStatsUpdate() {
  // حذف المشغلات الموجودة
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'updateSystemStats') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // إنشاء مشغل جديد كل ساعة
  ScriptApp.newTrigger('updateSystemStats')
    .timeBased()
    .everyHours(1)
    .create();
  
  Logger.log('تم إعداد التحديث الدوري للإحصائيات');
}

/**
 * اختبار جميع وظائف الإعدادات
 */
function testSettingsSheets() {
  // إنشاء جميع الشيتات
  createAdminSettingsSheet();
  createFormSettingsSheet();
  createSystemStatsSheet();
  
  // اختبار تحديث الإعدادات
  updateSetting(ADMIN_SETTINGS_SHEET_NAME, 'test_setting', 'test_value', 'إعداد تجريبي');
  updateSetting(FORM_SETTINGS_SHEET_NAME, 'test_form_setting', 'test_form_value', 'إعداد نموذج تجريبي');
  
  // اختبار جلب الإعدادات
  const adminSettings = getAllSettings(ADMIN_SETTINGS_SHEET_NAME);
  const formSettings = getAllSettings(FORM_SETTINGS_SHEET_NAME);
  
  Logger.log('إعدادات الإدارة: ' + JSON.stringify(adminSettings));
  Logger.log('إعدادات النموذج: ' + JSON.stringify(formSettings));
  
  // تحديث الإحصائيات
  updateSystemStats();
  
  // إنشاء نسخة احتياطية
  backupSettings();
  
  Logger.log('تم اختبار جميع وظائف الإعدادات بنجاح');
}
