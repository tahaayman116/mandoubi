/**
 * Google Apps Script للتعامل مع شيت المندوبين والمشرفين (Representatives)
 * يتضمن جميع التحديثات الأخيرة: إضافة المكان، حذف الحقول غير المطلوبة
 */

// إعدادات الشيت
const REPRESENTATIVES_SHEET_NAME = 'المندوبين والمشرفين';
const REPRESENTATIVES_HEADERS = [
  'الاسم',
  'النوع',
  'المكان',
  'تاريخ الإضافة',
  'نشط',
  'عدد الإرسالات',
  'إجمالي الأشخاص',
  'إجمالي المبلغ'
];

/**
 * إنشاء شيت المندوبين والمشرفين
 */
function createRepresentativesSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // حذف الشيت إذا كان موجود
  const existingSheet = spreadsheet.getSheetByName(REPRESENTATIVES_SHEET_NAME);
  if (existingSheet) {
    spreadsheet.deleteSheet(existingSheet);
  }
  
  // إنشاء شيت جديد
  const sheet = spreadsheet.insertSheet(REPRESENTATIVES_SHEET_NAME);
  
  // إضافة العناوين
  const headerRange = sheet.getRange(1, 1, 1, REPRESENTATIVES_HEADERS.length);
  headerRange.setValues([REPRESENTATIVES_HEADERS]);
  
  // تنسيق العناوين
  headerRange.setBackground('#34a853');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  // تجميد الصف الأول
  sheet.setFrozenRows(1);
  
  // تعديل عرض الأعمدة
  sheet.setColumnWidth(1, 150); // الاسم
  sheet.setColumnWidth(2, 100); // النوع
  sheet.setColumnWidth(3, 120); // المكان
  sheet.setColumnWidth(4, 120); // تاريخ الإضافة
  sheet.setColumnWidth(5, 80);  // نشط
  sheet.setColumnWidth(6, 120); // عدد الإرسالات
  sheet.setColumnWidth(7, 120); // إجمالي الأشخاص
  sheet.setColumnWidth(8, 120); // إجمالي المبلغ
  
  Logger.log('تم إنشاء شيت المندوبين والمشرفين بنجاح');
}

/**
 * إضافة مندوب/مشرف جديد
 */
function addRepresentative(repData) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(REPRESENTATIVES_SHEET_NAME);
    
    if (!sheet) {
      throw new Error('شيت المندوبين والمشرفين غير موجود');
    }
    
    // التحقق من عدم وجود اسم مكرر
    const existingData = sheet.getDataRange().getValues();
    const nameExists = existingData.some((row, index) => 
      index > 0 && row[0] === repData.name
    );
    
    if (nameExists) {
      throw new Error('الاسم موجود بالفعل');
    }
    
    const newRow = [
      repData.name || '',
      repData.role || 'مندوب',
      repData.location || '',
      new Date(),
      repData.active !== false ? 'نعم' : 'لا',
      0, // عدد الإرسالات - سيتم تحديثه لاحقاً
      0, // إجمالي الأشخاص - سيتم تحديثه لاحقاً
      0  // إجمالي المبلغ - سيتم تحديثه لاحقاً
    ];
    
    sheet.appendRow(newRow);
    
    // تنسيق الصف الجديد
    const lastRow = sheet.getLastRow();
    
    // تنسيق التاريخ
    sheet.getRange(lastRow, 4).setNumberFormat('dd/mm/yyyy');
    
    // تنسيق النوع
    const roleCell = sheet.getRange(lastRow, 2);
    if (repData.role === 'مشرف') {
      roleCell.setBackground('#e1bee7');
      roleCell.setFontColor('#4a148c');
    } else {
      roleCell.setBackground('#bbdefb');
      roleCell.setFontColor('#0d47a1');
    }
    
    // تنسيق حالة النشاط
    const activeCell = sheet.getRange(lastRow, 5);
    if (repData.active !== false) {
      activeCell.setBackground('#c8e6c9');
      activeCell.setFontColor('#2e7d32');
    } else {
      activeCell.setBackground('#ffcdd2');
      activeCell.setFontColor('#c62828');
    }
    
    // تنسيق المبلغ
    sheet.getRange(lastRow, 8).setNumberFormat('#,##0 "ج"');
    
    Logger.log('تم إضافة المندوب/المشرف بنجاح');
    return true;
    
  } catch (error) {
    Logger.log('خطأ في إضافة المندوب/المشرف: ' + error.toString());
    return false;
  }
}

/**
 * الحصول على جميع المندوبين والمشرفين
 */
function getAllRepresentatives() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(REPRESENTATIVES_SHEET_NAME);
    
    if (!sheet) {
      return [];
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    return rows.map(row => {
      const representative = {};
      headers.forEach((header, index) => {
        representative[header] = row[index];
      });
      return representative;
    });
    
  } catch (error) {
    Logger.log('خطأ في جلب المندوبين والمشرفين: ' + error.toString());
    return [];
  }
}

/**
 * تحديث إحصائيات المندوب/المشرف
 */
function updateRepresentativeStats(name, submissionsCount, totalPeople, totalAmount) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(REPRESENTATIVES_SHEET_NAME);
    
    if (!sheet) {
      return false;
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === name) {
        // تحديث الإحصائيات
        sheet.getRange(i + 1, 6).setValue(submissionsCount);
        sheet.getRange(i + 1, 7).setValue(totalPeople);
        sheet.getRange(i + 1, 8).setValue(totalAmount);
        
        // تنسيق المبلغ
        sheet.getRange(i + 1, 8).setNumberFormat('#,##0 "ج"');
        
        Logger.log(`تم تحديث إحصائيات ${name}`);
        return true;
      }
    }
    
    Logger.log(`لم يتم العثور على ${name}`);
    return false;
    
  } catch (error) {
    Logger.log('خطأ في تحديث الإحصائيات: ' + error.toString());
    return false;
  }
}

/**
 * حذف مندوب/مشرف
 */
function deleteRepresentative(name) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(REPRESENTATIVES_SHEET_NAME);
    
    if (!sheet) {
      return false;
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === name) {
        sheet.deleteRow(i + 1);
        Logger.log(`تم حذف ${name}`);
        return true;
      }
    }
    
    Logger.log(`لم يتم العثور على ${name} للحذف`);
    return false;
    
  } catch (error) {
    Logger.log('خطأ في حذف المندوب/المشرف: ' + error.toString());
    return false;
  }
}

/**
 * البحث في المندوبين والمشرفين
 */
function searchRepresentatives(searchTerm, roleFilter = 'all') {
  const allReps = getAllRepresentatives();
  
  let filtered = allReps;
  
  // تطبيق فلتر النوع
  if (roleFilter !== 'all') {
    filtered = filtered.filter(rep => rep['النوع'] === roleFilter);
  }
  
  // تطبيق البحث النصي
  if (searchTerm) {
    filtered = filtered.filter(rep => 
      rep['الاسم'].toLowerCase().includes(searchTerm.toLowerCase()) ||
      rep['المكان'].toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  return filtered;
}

/**
 * إحصائيات المندوبين والمشرفين
 */
function getRepresentativesStats() {
  const representatives = getAllRepresentatives();
  
  const stats = {
    totalRepresentatives: representatives.length,
    activeRepresentatives: 0,
    mandoubCount: 0,
    moshrefCount: 0,
    totalSubmissions: 0,
    totalPeople: 0,
    totalAmount: 0,
    uniqueLocations: new Set()
  };
  
  representatives.forEach(rep => {
    if (rep['نشط'] === 'نعم') {
      stats.activeRepresentatives++;
    }
    
    if (rep['النوع'] === 'مشرف') {
      stats.moshrefCount++;
    } else {
      stats.mandoubCount++;
    }
    
    stats.totalSubmissions += Number(rep['عدد الإرسالات']) || 0;
    stats.totalPeople += Number(rep['إجمالي الأشخاص']) || 0;
    stats.totalAmount += Number(rep['إجمالي المبلغ']) || 0;
    stats.uniqueLocations.add(rep['المكان']);
  });
  
  stats.uniqueLocations = stats.uniqueLocations.size;
  
  return stats;
}

/**
 * تحديث جميع الإحصائيات من شيت الإرسالات
 */
function updateAllRepresentativesStats() {
  try {
    // الحصول على بيانات الإرسالات
    const submissionsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('الإرسالات');
    
    if (!submissionsSheet) {
      Logger.log('شيت الإرسالات غير موجود');
      return;
    }
    
    const submissionsData = submissionsSheet.getDataRange().getValues();
    const submissionsRows = submissionsData.slice(1); // تجاهل العناوين
    
    // حساب الإحصائيات لكل مندوب/مشرف
    const statsMap = {};
    
    submissionsRows.forEach(row => {
      const name = row[5]; // اسم المندوب/المشرف
      const people = Number(row[2]) || 0; // العدد الكلي
      const amount = Number(row[3]) || 0; // المبلغ الإجمالي
      
      if (!statsMap[name]) {
        statsMap[name] = {
          submissionsCount: 0,
          totalPeople: 0,
          totalAmount: 0
        };
      }
      
      statsMap[name].submissionsCount++;
      statsMap[name].totalPeople += people;
      statsMap[name].totalAmount += amount;
    });
    
    // تحديث الإحصائيات في شيت المندوبين والمشرفين
    Object.keys(statsMap).forEach(name => {
      const stats = statsMap[name];
      updateRepresentativeStats(name, stats.submissionsCount, stats.totalPeople, stats.totalAmount);
    });
    
    Logger.log('تم تحديث جميع الإحصائيات بنجاح');
    
  } catch (error) {
    Logger.log('خطأ في تحديث الإحصائيات: ' + error.toString());
  }
}

/**
 * تصدير المندوبين والمشرفين إلى CSV
 */
function exportRepresentativesToCSV() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(REPRESENTATIVES_SHEET_NAME);
  
  if (!sheet) {
    throw new Error('شيت المندوبين والمشرفين غير موجود');
  }
  
  const data = sheet.getDataRange().getValues();
  let csvContent = '';
  
  data.forEach(row => {
    csvContent += row.join(',') + '\n';
  });
  
  const blob = Utilities.newBlob(csvContent, 'text/csv', 'representatives_export.csv');
  
  // حفظ في Google Drive
  DriveApp.createFile(blob);
  
  Logger.log('تم تصدير المندوبين والمشرفين بنجاح');
}

/**
 * اختبار الوظائف
 */
function testRepresentativesSheet() {
  // إنشاء الشيت
  createRepresentativesSheet();
  
  // إضافة بيانات تجريبية
  const testData = [
    {
      name: 'أحمد محمد',
      role: 'مندوب',
      location: 'مركز أول',
      active: true
    },
    {
      name: 'فاطمة علي',
      role: 'مشرف',
      location: 'مركز ثاني',
      active: true
    }
  ];
  
  testData.forEach(rep => {
    addRepresentative(rep);
  });
  
  // عرض الإحصائيات
  const stats = getRepresentativesStats();
  Logger.log('إحصائيات المندوبين والمشرفين: ' + JSON.stringify(stats));
}
