# الإعداد اليدوي# إعداد Appwrite يدوياً - حل مشكلة CORS

بسبب مشكلة CORS، سنقوم بإعداد Appwrite يدوياً من خلال لوحة التحكم.

## معلومات المشروع
- **معرف المشروع**: `68bcdd830036700d6d5b`
- **نقطة النهاية**: `https://nyc.cloud.appwrite.io/v1`
- **معرف قاعدة البيانات**: `mandoub-db` (ستقوم بإنشائها)

## الخطوة 1: إنشاء قاعدة البيانات

1. اذهب إلى Appwrite Console: https://cloud.appwrite.io
2. اختر مشروعك: `68bcdd830036700d6d5b`
3. اذهب إلى قسم **Databases**
4. اضغط **Create Database**
5. أدخل:
   - **الاسم**: `Mandoub Database`
   - **معرف قاعدة البيانات**: `mandoub-db`
6. اضغط **Create**

## الخطوة 2: إنشاء المجموعات

### المجموعة 1: submissions
1. داخل `mandoub-db`، اضغط **Create Collection**
2. أدخل:
   - **الاسم**: `Submissions`
   - **معرف المجموعة**: `submissions`
3. اضغط **Create**

#### إضافة الحقول لـ submissions:
اضغط **Create Attribute** لكل حقل:

1. **villageName** - String, الحجم: 255, مطلوب: نعم
2. **representativeName** - String, الحجم: 255, مطلوب: نعم
3. **totalPeople** - Integer, مطلوب: نعم, الحد الأدنى: 0, الحد الأقصى: 999999
4. **receivedMoney** - Integer, مطلوب: نعم, الحد الأدنى: 0, الحد الأقصى: 999999
5. **notReceived** - Integer, مطلوب: نعم, الحد الأدنى: 0, الحد الأقصى: 999999
6. **amountPerPerson** - Integer, مطلوب: نعم, الحد الأدنى: 0, الحد الأقصى: 999999
7. **totalAmount** - Integer, مطلوب: نعم, الحد الأدنى: 0, الحد الأقصى: 999999999
8. **submittedBy** - String, الحجم: 255, مطلوب: لا
9. **representativeId** - String, الحجم: 255, مطلوب: لا
10. **timestamp** - String, الحجم: 255, مطلوب: لا
11. **createdAt** - String, الحجم: 255, مطلوب: لا

### المجموعة 2: representatives
1. اضغط **Create Collection**
2. أدخل:
   - **الاسم**: `Representatives`
   - **معرف المجموعة**: `representatives`

#### إضافة الحقول:
1. **name** - String, الحجم: 255, مطلوب: نعم
2. **role** - String, الحجم: 100, مطلوب: نعم
3. **username** - String, الحجم: 100, مطلوب: لا
4. **password** - String, الحجم: 255, مطلوب: لا
5. **email** - String, الحجم: 255, مطلوب: لا
6. **active** - Boolean, مطلوب: نعم, القيمة الافتراضية: true
7. **createdAt** - String, الحجم: 255, مطلوب: لا
8. **updatedAt** - String, الحجم: 255, مطلوب: لا

### المجموعة 3: settings
1. اضغط **Create Collection**
2. أدخل:
   - **الاسم**: `Settings`
   - **معرف المجموعة**: `settings`

#### إضافة الحقول:
1. **googleSheetsUrl** - String, الحجم: 500, مطلوب: لا
2. **enableGoogleSheets** - Boolean, مطلوب: نعم
3. **passwordNotificationUrl** - String, الحجم: 500, مطلوب: لا
4. **adminPassword** - String, الحجم: 255, مطلوب: لا
5. **passwordLastChanged** - String, الحجم: 255, مطلوب: لا
6. **createdAt** - String, الحجم: 255, مطلوب: لا
7. **updatedAt** - String, الحجم: 255, مطلوب: لا

### المجموعة 4: formSettings
1. اضغط **Create Collection**
2. أدخل:
   - **الاسم**: `Form Settings`
   - **معرف المجموعة**: `formSettings`

#### إضافة الحقول:
1. **username** - String, الحجم: 100, مطلوب: نعم
2. **password** - String, الحجم: 255, مطلوب: نعم
3. **googleSheetsUrl** - String, الحجم: 500, مطلوب: لا
4. **updatedAt** - String, الحجم: 255, مطلوب: لا
5. **updatedBy** - String, الحجم: 255, مطلوب: لا

## الخطوة 3: إعداد الصلاحيات

لـ **كل مجموعة**، اذهب إلى **Settings** → **Permissions** وأضف:

1. اضغط **Add a role**
2. اختر **Any**
3. حدد جميع الصلاحيات:
   - ✅ Read
   - ✅ Create
   - ✅ Update
   - ✅ Delete
4. اضغط **Update**

## الخطوة 4: إضافة المنصة (لحل CORS)

1. اذهب إلى **Overview** في مشروعك
2. في قسم **Platforms**، اضغط **Add Platform**
3. اختر **Web**
4. أدخل:
   - **الاسم**: `Mandoub Web App`
   - **Hostname**: `localhost`

## الخطوة 5: التحقق من الإعداد

بعد إكمال جميع الخطوات، يجب أن يكون لديك:
- ✅ قاعدة البيانات: `mandoub-db`
- ✅ مجموعة: `submissions` (11 حقل)
- ✅ مجموعة: `representatives` (8 حقول)
- ✅ مجموعة: `settings` (7 حقول)
- ✅ مجموعة: `formSettings` (5 حقول)
- ✅ جميع المجموعات لها صلاحيات "Any"
- ✅ تم إضافة منصة الويب

## الخطوة 6: إشعاري عند الانتهاء

بعد إكمال الإعداد اليدوي، أخبرني وسأقوم بـ:
1. تحديث `appwriteService.js` ليستخدم `mandoub-db`
2. اختبار النظام المزدوج (Firebase + Appwrite)
3. التأكد من عمل المزامنة بشكل صحيح

- **Key**: `passwordNotificationUrl`
- **Size**: 500
- **Required**: ❌ No
- اضغط **Create**

#### 4. adminPassword
- **Type**: String
- **Key**: `adminPassword`
- **Size**: 255
- **Required**: ❌ No
- اضغط **Create**

#### 5. createdAt
- **Type**: String
- **Key**: `createdAt`
- **Size**: 50
- **Required**: ✅ Yes
- اضغط **Create**

#### 6. updatedAt
- **Type**: String
- **Key**: `updatedAt`
- **Size**: 50
- **Required**: ✅ Yes
- اضغط **Create**

### 3.3 إعداد الصلاحيات
1. اذهب لتبويب **Settings** في settings collection
2. اضغط **Permissions**
3. اضغط **Add Role**
4. اختر **Any**
5. فعّل جميع الصلاحيات:
   - ✅ **Create**
   - ✅ **Read**
   - ✅ **Update**
   - ✅ **Delete**
6. اضغط **Update**

---

## ✅ **الخطوة 4: التحقق من الإعداد**

### تأكد من وجود:
- ✅ قاعدة البيانات: **mandoub-db**
- ✅ Collection: **submissions** مع 10 attributes
- ✅ Collection: **settings** مع 6 attributes
- ✅ صلاحيات **Any** لكل collection

---

## 🚀 **الخطوة 5: تفعيل النظام المزدوج**

بعد إتمام الإعداد اليدوي، النظام المزدوج سيعمل تلقائياً!

### تحقق من عمل النظام:
1. شغّل التطبيق: `npm start`
2. افتح Developer Tools (F12)
3. ابحث عن رسائل:
   - `✅ Appwrite connected successfully`
   - `✅ Firebase: Success`
   - `✅ Appwrite: Success`

---

## 🎉 **مبروك!**

الآن لديك:
- **Firebase** للاستقرار
- **Appwrite** للقراءة والكتابة غير المحدودة
- **نظام مزدوج** يعمل تلقائياً
- **مزامنة البيانات** بين القاعدتين

**استمتع بالقراءة والكتابة بدون حدود!** 🚀

---

## 💡 **نصائح مهمة:**

1. **لا تحذف Firebase** - هو النظام الأساسي
2. **Appwrite للعمليات الكثيفة** فقط
3. **راقب الأداء** لكلا النظامين
4. **اختبر البيانات** بانتظام

**الإعداد اليدوي أضمن من الأكواد التلقائية!** ✅
