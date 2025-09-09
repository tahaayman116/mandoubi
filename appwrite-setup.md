# إعداد Appwrite للمشروع

## 🚀 خطوات الإعداد

### 1. إنشاء حساب Appwrite
1. اذهب إلى [Appwrite Cloud](https://cloud.appwrite.io)
2. أنشئ حساب جديد أو سجل دخول
3. أنشئ مشروع جديد باسم "Mandoub"

### 2. الحصول على معرف المشروع
1. من لوحة تحكم Appwrite
2. انسخ **Project ID** من الإعدادات
3. ضعه في ملف `appwriteService.js` مكان `your-project-id`

### 3. إنشاء قاعدة البيانات
```javascript
// في لوحة تحكم Appwrite:
Database ID: mandoub-db
```

### 4. إنشاء Collections

#### Collection 1: submissions
```json
{
  "collectionId": "submissions",
  "attributes": [
    {
      "key": "villageName",
      "type": "string",
      "size": 255,
      "required": true
    },
    {
      "key": "representativeName", 
      "type": "string",
      "size": 255,
      "required": true
    },
    {
      "key": "totalPeople",
      "type": "integer",
      "required": true
    },
    {
      "key": "receivedMoney",
      "type": "integer", 
      "required": true
    },
    {
      "key": "notReceived",
      "type": "integer",
      "required": true
    },
    {
      "key": "amountPerPerson",
      "type": "integer",
      "required": true
    },
    {
      "key": "totalAmount",
      "type": "integer",
      "required": true
    },
    {
      "key": "timestamp",
      "type": "string",
      "size": 50,
      "required": true
    },
    {
      "key": "date",
      "type": "string", 
      "size": 50,
      "required": true
    },
    {
      "key": "time",
      "type": "string",
      "size": 50,
      "required": true
    }
  ]
}
```

#### Collection 2: settings
```json
{
  "collectionId": "settings",
  "attributes": [
    {
      "key": "googleSheetsUrl",
      "type": "string",
      "size": 500,
      "required": false
    },
    {
      "key": "enableGoogleSheets",
      "type": "boolean",
      "required": true
    },
    {
      "key": "passwordNotificationUrl",
      "type": "string",
      "size": 500,
      "required": false
    },
    {
      "key": "adminPassword",
      "type": "string",
      "size": 255,
      "required": false
    },
    {
      "key": "createdAt",
      "type": "string",
      "size": 50,
      "required": true
    },
    {
      "key": "updatedAt",
      "type": "string",
      "size": 50,
      "required": true
    }
  ]
}
```

### 5. إعداد الصلاحيات
```javascript
// لكل collection:
Permissions:
- Read: Any
- Write: Any
- Update: Any  
- Delete: Any
```

### 6. تحديث الكود
في ملف `src/services/appwriteService.js`:
```javascript
const APPWRITE_PROJECT_ID = 'your-actual-project-id'; // ضع معرف المشروع هنا
```

## 🔧 الاستخدام

### تهيئة النظام المزدوج
```javascript
import { dualDatabaseService } from './services/dualDatabaseService';

// في App.js أو index.js
await dualDatabaseService.init();
```

### إضافة البيانات
```javascript
const result = await dualDatabaseService.addSubmission(data);
// سيحفظ في Firebase و Appwrite معاً
```

### قراءة البيانات
```javascript
const submissions = await dualDatabaseService.getSubmissions();
// سيقرأ من Firebase أولاً، ثم Appwrite كـ backup
```

## 🎯 المميزات

### ✅ مميزات Appwrite
- **قراءة وكتابة غير محدودة**
- **سرعة عالية**
- **واجهة برمجة تطبيقات قوية**
- **إحصائيات مدمجة**

### ✅ النظام المزدوج
- **Firebase كقاعدة بيانات أساسية**
- **Appwrite كنسخة احتياطية**
- **تبديل تلقائي عند الأخطاء**
- **مزامنة البيانات**

## 🚨 ملاحظات مهمة

1. **احتفظ بـ Firebase** كقاعدة البيانات الأساسية
2. **استخدم Appwrite** للعمليات الكثيفة
3. **راقب الأداء** لكلا القاعدتين
4. **اختبر المزامنة** بانتظام

## 🔄 التحديث التدريجي

يمكنك البدء بـ Appwrite تدريجياً:
1. ابدأ بحفظ البيانات الجديدة فقط
2. انقل البيانات القديمة لاحقاً
3. اختبر الأداء والاستقرار
4. قم بالتحويل الكامل عند الثقة

---

**تم إنشاء هذا الدليل لمساعدتك في إعداد Appwrite بجانب Firebase للحصول على نظام قاعدة بيانات قوي وموثوق.**
