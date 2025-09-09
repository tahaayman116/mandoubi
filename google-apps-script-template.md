# Google Apps Script Template للتكامل مع نظام مندوبي الحملة

## خطوات الإعداد:

### 1. إنشاء Google Sheet جديد
- اذهب إلى [Google Sheets](https://sheets.google.com)
- أنشئ sheet جديد
- أضف العناوين التالية في الصف الأول:
  ```
  التاريخ | الوقت | اسم القرية | اسم المندوب | العدد الكلي | عدد المستلمين | عدد غير المستلمين | مبلغ الفرد | المبلغ الإجمالي | الطابع الزمني
  ```

### 2. فتح Apps Script
- من القائمة: Extensions → Apps Script
- احذف الكود الموجود والصق الكود التالي:

```javascript
function doPost(e) {
  try {
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    
    // Get the active spreadsheet and sheet
    const sheet = SpreadsheetApp.getActiveSheet();
    
    // Prepare the row data
    const rowData = [
      data.date || new Date().toLocaleDateString('ar-EG'),
      data.time || new Date().toLocaleTimeString('ar-EG'),
      data.villageName || '',
      data.representativeName || '',
      data.totalPeople || 0,
      data.receivedMoney || 0,
      data.notReceived || 0,
      data.amountPerPerson || 50,
      data.totalAmount || 0,
      data.timestamp || new Date().toISOString()
    ];
    
    // Add the data to the sheet
    sheet.appendRow(rowData);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'تم إضافة البيانات بنجاح'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Optional: Function to get data (for future use)
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        data: data
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

### 3. نشر Script كـ Web App
1. اضغط على "Deploy" → "New deployment"
2. اختر Type: "Web app"
3. في Execute as: اختر "Me" (مهم جداً)
4. في Who has access: اختر "Anyone" (مهم جداً)
5. اضغط "Deploy"
6. **مهم:** قد يطلب منك تسجيل الدخول والموافقة على الصلاحيات
7. انسخ الرابط الذي سيظهر (يجب أن ينتهي بـ /exec)

### ⚠️ ملاحظات مهمة للنشر:
- تأكد من اختيار "Anyone" وليس "Anyone with Google account"
- الرابط يجب أن يكون بالشكل: `https://script.google.com/macros/s/YOUR_ID/exec`
- إذا غيرت الكود، يجب إعادة النشر (New deployment)

### 4. إضافة الرابط في النظام
1. سجل دخول كأدمين في النظام
2. اضغط على أيقونة الإعدادات ⚙️ في الأعلى
3. فعل "تفعيل Google Sheets"
4. الصق الرابط في حقل "رابط Google Apps Script"
5. اضغط "اختبار الاتصال" للتأكد
6. احفظ الإعدادات

## البيانات المرسلة:

النظام سيرسل البيانات التالية لكل submission:

```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "date": "1/1/2024",
  "time": "12:00:00 PM",
  "villageName": "اسم القرية",
  "representativeName": "اسم المندوب",
  "totalPeople": 100,
  "receivedMoney": 80,
  "notReceived": 20,
  "amountPerPerson": 50,
  "totalAmount": 4000
}
```

## ملاحظات مهمة:

- ✅ التكامل اختياري - يمكن تشغيل النظام بدونه
- ✅ البيانات تُحفظ في Firebase أولاً، ثم ترسل لـ Google Sheets
- ✅ إذا فشل الإرسال لـ Google Sheets، لن يؤثر على حفظ البيانات
- ✅ يمكن اختبار الاتصال قبل الحفظ
- ✅ يمكن تفعيل/إلغاء التفعيل في أي وقت

## استكشاف الأخطاء:

### إذا فشل اختبار الاتصال:

#### 1. تحقق من الرابط:
- يجب أن ينتهي بـ `/exec`
- مثال صحيح: `https://script.google.com/macros/s/AKfycbz.../exec`
- **لا** يجب أن يحتوي على `/dev` أو `/edit`

#### 2. تحقق من إعدادات النشر:
- Execute as: **Me** (وليس User accessing the web app)
- Who has access: **Anyone** (وليس Anyone with Google account)
- إذا غيرت أي شيء، اعمل **New deployment** وليس Manage deployments

#### 3. تحقق من الكود:
- تأكد من نسخ الكود كاملاً
- تأكد من وجود دالة `doPost`
- احفظ الكود قبل النشر

#### 4. اختبار يدوي:
```bash
# جرب هذا في Terminal أو Command Prompt:
curl -X POST "YOUR_SCRIPT_URL" \
  -H "Content-Type: application/json" \
  -d '{"villageName":"test","totalPeople":10}'
```

#### 5. أخطاء شائعة:
- **"Failed to fetch"**: مشكلة في الرابط أو الصلاحيات
- **"Script function not found"**: لم يتم حفظ الكود أو نشره
- **"Authorization required"**: غير إعدادات "Who has access"

### إذا لم تظهر البيانات:
1. تحقق من console المتصفح للأخطاء
2. تأكد من أن Sheet مفتوح ومتاح
3. تحقق من صلاحيات Google Account

## مثال على الاستخدام:

بعد الإعداد، عندما يرسل المندوب بيانات جديدة:
1. ✅ تُحفظ في Firebase
2. ✅ تُرسل تلقائياً لـ Google Sheets
3. ✅ تظهر في الـ Dashboard
4. ✅ تظهر في Google Sheets للمتابعة والتحليل

هذا يوفر backup إضافي ومرونة في التحليل والمشاركة مع الفريق.
