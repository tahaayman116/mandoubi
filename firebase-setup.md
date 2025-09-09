# Firebase Setup Guide

## خطوات إعداد Firebase

### 1. إنشاء مشروع Firebase

1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. انقر على "Add project" أو "إضافة مشروع"
3. اكتب اسم المشروع (مثل: campaign-dashboard)
4. اختر إعدادات Google Analytics (اختياري)
5. انقر على "Create project"

### 2. إعداد Authentication

1. في لوحة تحكم Firebase، اذهب إلى "Authentication"
2. انقر على "Get started"
3. اذهب إلى تبويب "Sign-in method"
4. فعّل "Email/Password"

### 3. إعداد Firestore Database

1. اذهب إلى "Firestore Database"
2. انقر على "Create database"
3. اختر "Start in test mode" للبداية
4. اختر الموقع الجغرافي الأقرب

### 4. الحصول على إعدادات المشروع

1. اذهب إلى "Project Settings" (⚙️)
2. انتقل إلى تبويب "General"
3. انزل إلى "Your apps"
4. انقر على "Web app" (</>)
5. اكتب اسم التطبيق
6. انسخ إعدادات Firebase config

### 5. تحديث ملف التكوين

افتح الملف `src/firebase/config.js` وضع إعدادات مشروعك:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id-here"
};
```

### 6. إعداد قواعد Firestore

اذهب إلى Firestore Database > Rules وضع هذه القواعد:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 7. تشغيل التطبيق

```bash
npm start
```

## ملاحظات مهمة

- Firebase مجاني حتى حدود معينة من الاستخدام
- يمكن ترقية الخطة لاحقاً عند الحاجة
- البيانات محفوظة بشكل آمن في السحابة
- يدعم التزامن الفوري بين المستخدمين

## المميزات الجديدة

✅ حفظ البيانات في السحابة
✅ مزامنة فورية للبيانات
✅ نسخ احتياطية تلقائية
✅ أمان عالي للبيانات
✅ دعم متعدد المستخدمين
