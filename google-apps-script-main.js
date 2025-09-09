/**
 * Google Apps Script الرئيسي - يدير جميع العمليات والتكامل بين الشيتات
 * يتضمن جميع التحديثات الأخيرة والتكامل مع Firebase وAppwrite
 */

/**
 * إعداد النظام الكامل - ينشئ جميع الشيتات المطلوبة
 */
function setupCompleteSystem() {
  Logger.log('بدء إعداد النظام الكامل...');
  
  try {
    // إنشاء جميع الشيتات
    createSubmissionsSheet();
    createRepresentativesSheet();
    createAdminSettingsSheet();
    createFormSettingsSheet();
    createSystemStatsSheet();
    
    // تحديث الإحصائيات الأولية
    updateSystemStats();
    
    // إعداد التحديث الدوري
    setupPeriodicStatsUpdate();
    
    Logger.log('تم إعداد النظام الكامل بنجاح!');
    
    // إرسال تقرير بالإعداد
    const setupReport = {
      timestamp: new Date(),
      sheets_created: [
        'الإرسالات',
        'المندوبين والمشرفين', 
        'إعدادات الإدارة',
        'إعدادات النموذج',
        'إحصائيات النظام'
      ],
      status: 'مكتمل'
    };
    
    Logger.log('تقرير الإعداد: ' + JSON.stringify(setupReport));
    
  } catch (error) {
    Logger.log('خطأ في إعداد النظام: ' + error.toString());
  }
}

/**
 * معالج البيانات الواردة من Firebase/Appwrite
 */
function handleIncomingData(data, dataType) {
  try {
    Logger.log(`استقبال بيانات من النوع: ${dataType}`);
    
    switch (dataType) {
      case 'submission':
        return addSubmission(data);
        
      case 'representative':
        return addRepresentative(data);
        
      case 'admin_setting':
        return updateSetting(ADMIN_SETTINGS_SHEET_NAME, data.key, data.value, data.description);
        
      case 'form_setting':
        return updateSetting(FORM_SETTINGS_SHEET_NAME, data.key, data.value, data.description);
        
      default:
        Logger.log('نوع البيانات غير معروف: ' + dataType);
        return false;
    }
    
  } catch (error) {
    Logger.log('خطأ في معالجة البيانات: ' + error.toString());
    return false;
  }
}

/**
 * تزامن البيانات مع قواعد البيانات الخارجية
 */
function syncWithExternalDatabases() {
  try {
    Logger.log('بدء تزامن البيانات...');
    
    // تحديث الإحصائيات
    updateAllRepresentativesStats();
    updateSystemStats();
    
    // إنشاء تقرير التزامن
    const syncReport = {
      timestamp: new Date(),
      submissions_count: getAllSubmissions().length,
      representatives_count: getAllRepresentatives().length,
      system_stats: getAllSettings(SYSTEM_STATS_SHEET_NAME)
    };
    
    Logger.log('تقرير التزامن: ' + JSON.stringify(syncReport));
    
    // إرسال البيانات إلى webhook (إذا كان مطلوب)
    sendDataToWebhook(syncReport);
    
  } catch (error) {
    Logger.log('خطأ في التزامن: ' + error.toString());
  }
}

/**
 * إرسال البيانات إلى webhook خارجي
 */
function sendDataToWebhook(data) {
  try {
    const webhookUrl = getSetting(ADMIN_SETTINGS_SHEET_NAME, 'webhook_url');
    
    if (!webhookUrl) {
      Logger.log('لا يوجد webhook URL محدد');
      return;
    }
    
    const payload = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(data)
    };
    
    const response = UrlFetchApp.fetch(webhookUrl, payload);
    Logger.log('تم إرسال البيانات إلى webhook: ' + response.getResponseCode());
    
  } catch (error) {
    Logger.log('خطأ في إرسال البيانات إلى webhook: ' + error.toString());
  }
}

/**
 * تنظيف وصيانة النظام
 */
function systemMaintenance() {
  try {
    Logger.log('بدء صيانة النظام...');
    
    // تنظيف البيانات المكررة
    cleanDuplicateSubmissions();
    
    // إنشاء نسخة احتياطية
    backupSettings();
    
    // تحديث جميع الإحصائيات
    updateAllRepresentativesStats();
    updateSystemStats();
    
    // حذف النسخ الاحتياطية القديمة (أكثر من 30 يوم)
    cleanOldBackups();
    
    Logger.log('تم إكمال صيانة النظام بنجاح');
    
  } catch (error) {
    Logger.log('خطأ في صيانة النظام: ' + error.toString());
  }
}

/**
 * حذف النسخ الاحتياطية القديمة
 */
function cleanOldBackups() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = spreadsheet.getSheets();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    sheets.forEach(sheet => {
      const sheetName = sheet.getName();
      
      if (sheetName.startsWith('نسخة_احتياطية_')) {
        // استخراج التاريخ من اسم الشيت
        const dateMatch = sheetName.match(/(\d{4})_(\d{2})_(\d{2})/);
        
        if (dateMatch) {
          const sheetDate = new Date(dateMatch[1], dateMatch[2] - 1, dateMatch[3]);
          
          if (sheetDate < thirtyDaysAgo) {
            spreadsheet.deleteSheet(sheet);
            Logger.log('تم حذف النسخة الاحتياطية القديمة: ' + sheetName);
          }
        }
      }
    });
    
  } catch (error) {
    Logger.log('خطأ في حذف النسخ الاحتياطية القديمة: ' + error.toString());
  }
}

/**
 * إنشاء تقرير شامل للنظام
 */
function generateSystemReport() {
  try {
    const submissionsStats = getSubmissionsStats();
    const representativesStats = getRepresentativesStats();
    const adminSettings = getAllSettings(ADMIN_SETTINGS_SHEET_NAME);
    const formSettings = getAllSettings(FORM_SETTINGS_SHEET_NAME);
    
    const report = {
      generated_at: new Date(),
      system_info: {
        total_submissions: submissionsStats.totalSubmissions,
        total_people: submissionsStats.totalPeople,
        total_amount: submissionsStats.totalAmount,
        unique_villages: submissionsStats.uniqueVillages,
        unique_locations: submissionsStats.uniqueLocations,
        mandoub_submissions: submissionsStats.mandoubCount,
        moshref_submissions: submissionsStats.moshrefCount
      },
      representatives_info: {
        total_representatives: representativesStats.totalRepresentatives,
        active_representatives: representativesStats.activeRepresentatives,
        mandoub_count: representativesStats.mandoubCount,
        moshref_count: representativesStats.moshrefCount,
        unique_locations: representativesStats.uniqueLocations
      },
      settings: {
        admin_settings: adminSettings,
        form_settings: formSettings
      }
    };
    
    Logger.log('التقرير الشامل: ' + JSON.stringify(report, null, 2));
    
    // حفظ التقرير في ملف
    const blob = Utilities.newBlob(
      JSON.stringify(report, null, 2), 
      'application/json', 
      `system_report_${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy_MM_dd_HH_mm')}.json`
    );
    
    DriveApp.createFile(blob);
    
    return report;
    
  } catch (error) {
    Logger.log('خطأ في إنشاء التقرير: ' + error.toString());
    return null;
  }
}

/**
 * إعداد المشغلات التلقائية
 */
function setupAutomaticTriggers() {
  try {
    // حذف جميع المشغلات الموجودة
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
    
    // مشغل تحديث الإحصائيات كل ساعة
    ScriptApp.newTrigger('updateSystemStats')
      .timeBased()
      .everyHours(1)
      .create();
    
    // مشغل التزامن كل 6 ساعات
    ScriptApp.newTrigger('syncWithExternalDatabases')
      .timeBased()
      .everyHours(6)
      .create();
    
    // مشغل الصيانة يومياً في الساعة 2 صباحاً
    ScriptApp.newTrigger('systemMaintenance')
      .timeBased()
      .everyDays(1)
      .atHour(2)
      .create();
    
    // مشغل التقرير الأسبوعي
    ScriptApp.newTrigger('generateSystemReport')
      .timeBased()
      .everyWeeks(1)
      .onWeekDay(ScriptApp.WeekDay.SUNDAY)
      .atHour(9)
      .create();
    
    Logger.log('تم إعداد جميع المشغلات التلقائية بنجاح');
    
  } catch (error) {
    Logger.log('خطأ في إعداد المشغلات: ' + error.toString());
  }
}

/**
 * واجهة برمجة التطبيقات للتكامل الخارجي
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const result = handleIncomingData(data.payload, data.type);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: result,
        timestamp: new Date(),
        message: result ? 'تم معالجة البيانات بنجاح' : 'فشل في معالجة البيانات'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('خطأ في معالجة POST request: ' + error.toString());
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        timestamp: new Date()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * واجهة برمجة التطبيقات للاستعلامات
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    let result = {};
    
    switch (action) {
      case 'get_submissions':
        result = getAllSubmissions();
        break;
        
      case 'get_representatives':
        result = getAllRepresentatives();
        break;
        
      case 'get_stats':
        result = {
          submissions: getSubmissionsStats(),
          representatives: getRepresentativesStats()
        };
        break;
        
      case 'get_settings':
        result = {
          admin: getAllSettings(ADMIN_SETTINGS_SHEET_NAME),
          form: getAllSettings(FORM_SETTINGS_SHEET_NAME)
        };
        break;
        
      case 'generate_report':
        result = generateSystemReport();
        break;
        
      default:
        result = { error: 'إجراء غير معروف' };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('خطأ في معالجة GET request: ' + error.toString());
    
    return ContentService
      .createTextOutput(JSON.stringify({
        error: error.toString(),
        timestamp: new Date()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * اختبار شامل للنظام
 */
function runCompleteSystemTest() {
  Logger.log('بدء الاختبار الشامل للنظام...');
  
  try {
    // إعداد النظام
    setupCompleteSystem();
    
    // اختبار الشيتات
    testSubmissionsSheet();
    testRepresentativesSheet();
    testSettingsSheets();
    
    // اختبار التزامن
    syncWithExternalDatabases();
    
    // إنشاء تقرير
    const report = generateSystemReport();
    
    // إعداد المشغلات
    setupAutomaticTriggers();
    
    Logger.log('تم إكمال الاختبار الشامل بنجاح!');
    Logger.log('تقرير النظام: ' + JSON.stringify(report));
    
  } catch (error) {
    Logger.log('خطأ في الاختبار الشامل: ' + error.toString());
  }
}
