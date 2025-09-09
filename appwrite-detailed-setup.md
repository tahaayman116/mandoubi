# دليل إعداد Appwrite التفصيلي - نظام Mandoub

## معلومات المشروع
- **معرف المشروع**: `68bcdd830036700d6d5b`
- **نقطة النهاية**: `https://nyc.cloud.appwrite.io/v1`
- **معرف قاعدة البيانات**: `سيتم إنشاؤه أثناء الإعداد`

## 📋 الفهرس
1. [إنشاء حساب Appwrite](#إنشاء-حساب-appwrite)
2. [إعداد المشروع](#إعداد-المشروع)
3. [إنشاء قاعدة البيانات](#إنشاء-قاعدة-البيانات)
4. [إنشاء المجموعات (Collections)](#إنشاء-المجموعات-collections)
5. [إعداد الصلاحيات](#إعداد-الصلاحيات)
6. [إعداد المنصات](#إعداد-المنصات)
7. [اختبار الاتصال](#اختبار-الاتصال)
8. [استكشاف الأخطاء](#استكشاف-الأخطاء)

---

## 🚀 إنشاء حساب Appwrite

### الخطوة 1: التسجيل
1. اذهب إلى [Appwrite Cloud](https://cloud.appwrite.io)
2. اضغط على **Sign Up**
3. أدخل بياناتك:
   - الاسم الكامل
   - البريد الإلكتروني
   - كلمة المرور
4. تأكد من البريد الإلكتروني

### الخطوة 2: إنشاء منظمة (Organization)
1. بعد تسجيل الدخول، ستُطلب منك إنشاء منظمة
2. أدخل اسم المنظمة: `Mandoub Campaign`
3. اختر المنطقة: **New York (NYC)** - مهم جداً!

---

## 🏗️ إعداد المشروع

### الخطوة 1: استخدام المشروع الموجود
1. في لوحة التحكم، ستجد المشروع الموجود بمعرف: `68bcdd830036700d6d5b`
2. اضغط على المشروع للدخول إليه
3. تأكد أن المنطقة هي: **New York (NYC)**

### الخطوة 2: الحصول على معرف المشروع
```javascript
// معرف المشروع الخاص بك
const PROJECT_ID = '68bcdd830036700d6d5b';
const ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
```

---

## 🗄️ إنشاء قاعدة البيانات

### الخطوة 1: إنشاء قاعدة البيانات
1. في لوحة التحكم، اذهب إلى **Databases**
2. اضغط على **Create Database**
3. أدخل المعلومات:
   - **اسم قاعدة البيانات**: `Mandoub Database`
   - **معرف قاعدة البيانات**: اختر معرف مناسب (مثل `mandoub-db` أو `main-db`)
4. اضغط **Create**

### الخطوة 2: نسخ معرف قاعدة البيانات
بعد إنشاء قاعدة البيانات:
1. انسخ **معرف قاعدة البيانات** الذي تم إنشاؤه
2. سنحتاج هذا المعرف لاحقاً في إعداد الكود

```bash
✅ Database ID: [المعرف الذي أنشأته]
✅ Database Name: Mandoub Database
✅ Status: Active
```

---

## 📊 إنشاء المجموعات (Collections)

### 1. مجموعة الإرسالات (Submissions)

#### إنشاء المجموعة:
1. داخل قاعدة البيانات `mandoub-db`
2. اضغط **Create Collection**
3. أدخل المعلومات:
   - **اسم المجموعة**: `Submissions`
   - **معرف المجموعة**: `submissions`
4. اضغط **Create**

#### إضافة الحقول (Attributes):
```javascript
// الحقول المطلوبة لمجموعة submissions
const submissionAttributes = [
  { key: 'villageName', type: 'string', size: 255, required: true },
  { key: 'representativeName', type: 'string', size: 255, required: true },
  { key: 'totalPeople', type: 'integer', required: true },
  { key: 'receivedMoney', type: 'integer', required: true },
  { key: 'notReceived', type: 'integer', required: true },
  { key: 'amountPerPerson', type: 'integer', required: true },
  { key: 'totalAmount', type: 'integer', required: true },
  { key: 'submittedBy', type: 'string', size: 255, required: false },
  { key: 'representativeId', type: 'string', size: 255, required: false },
  { key: 'timestamp', type: 'string', size: 255, required: false },
  { key: 'createdAt', type: 'string', size: 255, required: false }
];
```

**إضافة كل حقل:**
1. اضغط **Create Attribute**
2. اختر نوع الحقل (String/Integer)
3. أدخل اسم الحقل
4. حدد الحجم (للنصوص)
5. حدد إذا كان مطلوباً أم لا
6. اضغط **Create**

### 2. مجموعة المندوبين (Representatives)

#### إنشاء المجموعة:
1. اضغط **Create Collection**
2. أدخل المعلومات:
   - **اسم المجموعة**: `Representatives`
   - **معرف المجموعة**: `representatives`

#### إضافة الحقول:
```javascript
const representativeAttributes = [
  { key: 'name', type: 'string', size: 255, required: true },
  { key: 'role', type: 'string', size: 100, required: true }, // مندوب أو مشرف
  { key: 'username', type: 'string', size: 100, required: false },
  { key: 'password', type: 'string', size: 255, required: false },
  { key: 'email', type: 'string', size: 255, required: false },
  { key: 'active', type: 'boolean', required: true, default: true },
  { key: 'createdAt', type: 'string', size: 255, required: false },
  { key: 'updatedAt', type: 'string', size: 255, required: false }
];
```

### 3. مجموعة الإعدادات (Settings)

#### إنشاء المجموعة:
1. اضغط **Create Collection**
2. أدخل المعلومات:
   - **اسم المجموعة**: `Settings`
   - **معرف المجموعة**: `settings`

#### إضافة الحقول:
```javascript
const settingsAttributes = [
  { key: 'googleSheetsUrl', type: 'string', size: 500, required: false },
  { key: 'enableGoogleSheets', type: 'boolean', required: false, default: false },
  { key: 'passwordNotificationUrl', type: 'string', size: 500, required: false },
  { key: 'adminPassword', type: 'string', size: 255, required: false },
  { key: 'passwordLastChanged', type: 'string', size: 255, required: false },
  { key: 'createdAt', type: 'string', size: 255, required: false },
  { key: 'updatedAt', type: 'string', size: 255, required: false }
];
```

### 4. مجموعة إعدادات الفورم (Form Settings)

#### إنشاء المجموعة:
1. اضغط **Create Collection**
2. أدخل المعلومات:
   - **اسم المجموعة**: `Form Settings`
   - **معرف المجموعة**: `formSettings`

#### إضافة الحقول:
```javascript
const formSettingsAttributes = [
  { key: 'username', type: 'string', size: 100, required: true },
  { key: 'password', type: 'string', size: 255, required: true },
  { key: 'googleSheetsUrl', type: 'string', size: 500, required: false },
  { key: 'updatedAt', type: 'string', size: 255, required: false },
  { key: 'updatedBy', type: 'string', size: 255, required: false }
];
```

---

## 🔐 إعداد الصلاحيات

### صلاحيات المجموعات
لكل مجموعة، يجب إعداد الصلاحيات التالية:

#### 1. الذهاب إلى إعدادات المجموعة:
1. اختر المجموعة
2. اذهب إلى تبويب **Settings**
3. اضغط على **Permissions**

#### 2. إضافة صلاحيات القراءة:
```javascript
// صلاحيات القراءة
Role: "any"
Permissions: ["read"]
```

#### 3. إضافة صلاحيات الكتابة:
```javascript
// صلاحيات الكتابة
Role: "any" 
Permissions: ["create", "update", "delete"]
```

#### خطوات التطبيق:
1. اضغط **Add a role**
2. اختر **Any**
3. حدد الصلاحيات المطلوبة:
   - ✅ Read
   - ✅ Create  
   - ✅ Update
   - ✅ Delete
4. اضغط **Update**

### ⚠️ مهم جداً:
يجب تطبيق هذه الصلاحيات على **جميع المجموعات الأربع**:
- submissions
- representatives  
- settings
- formSettings

---

## 🌐 إعداد المنصات

### الخطوة 1: إضافة منصة الويب
1. في لوحة التحكم، اذهب إلى **Overview**
2. في قسم **Platforms**، اضغط **Add Platform**
3. اختر **Web**

### الخطوة 2: إعداد المنصة
أدخل المعلومات التالية:
```javascript
Platform Type: Web
Name: Mandoub Web App
Hostname: localhost
```

### الخطوة 3: إضافة النطاقات المسموحة
في قسم **Domains**، أضف:
```
localhost:3000
localhost:3001  
127.0.0.1:3000
127.0.0.1:3001
localhost:3718
127.0.0.1:3718
```

---

## 🧪 اختبار الاتصال

### 1. اختبار الاتصال الأساسي
```javascript
import { Client, Databases } from 'appwrite';

const client = new Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('68bcdd830036700d6d5b');

const databases = new Databases(client);

// اختبار قراءة قاعدة البيانات
async function testConnection() {
  try {
    const result = await databases.listDocuments(
      'mandoub-db',
      'submissions'
    );
    console.log('✅ Connection successful:', result);
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}
```

### 2. اختبار إضافة بيانات
```javascript
async function testAddData() {
  try {
    const result = await databases.createDocument(
      'mandoub-db',
      'submissions',
      'unique()',
      {
        villageName: 'قرية الاختبار',
        representativeName: 'مندوب الاختبار',
        totalPeople: 10,
        receivedMoney: 8,
        notReceived: 2,
        amountPerPerson: 50,
        totalAmount: 400,
        createdAt: new Date().toISOString()
      }
    );
    console.log('✅ Data added successfully:', result);
  } catch (error) {
    console.error('❌ Failed to add data:', error);
  }
}
```

---

## 🔧 استكشاف الأخطاء

### خطأ CORS
```
Access to fetch at 'https://nyc.cloud.appwrite.io/v1/...' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**الحل:**
1. تأكد من إضافة جميع النطاقات في إعدادات المنصة
2. استخدم خادم البروكسي المحلي:

```javascript
// تشغيل خادم البروكسي
node appwrite-proxy-server.js

// استخدام البروكسي في الكود
const response = await fetch('http://localhost:3001/api/appwrite/submissions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

### خطأ 401 Unauthorized
```
AppwriteException: User (role: guests) missing scope (documents.write)
```

**الحل:**
1. تأكد من إعداد صلاحيات "any" لجميع المجموعات
2. أضف الصلاحيات مباشرة في الكود:

```javascript
import { Permission, Role } from 'appwrite';

await databases.createDocument(
  'mandoub-db',
  'submissions',
  'unique()',
  data,
  [
    Permission.read(Role.any()),
    Permission.write(Role.any())
  ]
);
```

### خطأ 404 Collection Not Found
```
AppwriteException: Collection with the requested ID could not be found
```

**الحل:**
1. تأكد من صحة معرفات المجموعات:
   - `submissions`
   - `representatives`
   - `settings`
   - `formSettings`
2. تأكد من إنشاء جميع المجموعات في قاعدة البيانات `mandoub-db`

### خطأ الاتصال
```
TypeError: Failed to fetch
```

**الحل:**
1. تأكد من صحة نقطة النهاية: `https://nyc.cloud.appwrite.io/v1`
2. تأكد من صحة معرف المشروع: `68bcdd830036700d6d5b`
3. تحقق من الاتصال بالإنترنت

---

## 📝 ملاحظات مهمة

### 1. معرفات المجموعات
```javascript
const COLLECTIONS = {
  SUBMISSIONS: 'submissions',
  REPRESENTATIVES: 'representatives', 
  SETTINGS: 'settings',
  FORM_SETTINGS: 'formSettings'
};
```

### 2. أنواع البيانات المدعومة
- **String**: للنصوص (حد أقصى 2048 حرف)
- **Integer**: للأرقام الصحيحة
- **Boolean**: للقيم المنطقية (true/false)
- **DateTime**: للتواريخ والأوقات

### 3. الحد الأقصى للبيانات
- **المستندات**: 100,000 مستند لكل مجموعة
- **حجم المستند**: 1 ميجابايت لكل مستند
- **الطلبات**: 100,000 طلب شهرياً (خطة مجانية)

### 4. النسخ الاحتياطي
- Appwrite يقوم بالنسخ الاحتياطي تلقائياً
- يمكن تصدير البيانات عبر API
- يُنصح بالنسخ الاحتياطي المحلي للبيانات المهمة

---

## 🚀 التشغيل النهائي

### 1. تأكد من إكمال جميع الخطوات:
- ✅ إنشاء المشروع
- ✅ إنشاء قاعدة البيانات
- ✅ إنشاء جميع المجموعات (4 مجموعات)
- ✅ إضافة جميع الحقول لكل مجموعة
- ✅ إعداد الصلاحيات لجميع المجموعات
- ✅ إضافة المنصة وتكوين النطاقات

### 2. اختبار النظام:
```bash
# تشغيل خادم البروكسي
node appwrite-proxy-server.js

# تشغيل التطبيق
npm start
```

### 3. التحقق من عمل النظام:
1. إضافة إرسال جديد
2. إضافة مندوب جديد  
3. تحديث الإعدادات
4. تغيير كلمة مرور الفورم

---

## 📞 الدعم والمساعدة

### الموارد المفيدة:
- [Appwrite Documentation](https://appwrite.io/docs)
- [Appwrite Discord Community](https://discord.gg/appwrite)
- [Appwrite GitHub](https://github.com/appwrite/appwrite)

### في حالة المشاكل:
1. تحقق من سجلات المتصفح (Console)
2. تحقق من سجلات Appwrite في لوحة التحكم
3. تأكد من صحة المعرفات والصلاحيات
4. استخدم خادم البروكسي لتجاوز مشاكل CORS

---

## ✅ قائمة التحقق النهائية

قبل البدء في استخدام النظام، تأكد من:

### إعداد المشروع:
- [ ] تم إنشاء المشروع بمعرف `68bcdd830036700d6d5b`
- [ ] تم اختيار منطقة New York (NYC)
- [ ] تم إنشاء قاعدة البيانات `mandoub-db`

### المجموعات:
- [ ] مجموعة `submissions` مع جميع الحقول
- [ ] مجموعة `representatives` مع جميع الحقول  
- [ ] مجموعة `settings` مع جميع الحقول
- [ ] مجموعة `formSettings` مع جميع الحقول

### الصلاحيات:
- [ ] صلاحيات "any" للقراءة والكتابة لجميع المجموعات
- [ ] تم اختبار الصلاحيات بنجاح

### المنصة:
- [ ] تم إضافة منصة الويب
- [ ] تم إضافة جميع النطاقات المطلوبة
- [ ] تم اختبار الاتصال بنجاح

### الاختبار:
- [ ] تم اختبار إضافة البيانات
- [ ] تم اختبار قراءة البيانات
- [ ] تم اختبار تحديث البيانات
- [ ] تم اختبار حذف البيانات

---

🎉 **تهانينا! تم إعداد Appwrite بنجاح لنظام Mandoub**

الآن يمكنك استخدام النظام المزدوج (Firebase + Appwrite) بكامل طاقته!
