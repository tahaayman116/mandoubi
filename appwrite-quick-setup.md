# إعداد Appwrite السريع - Copy & Paste 🚀

## 🎯 طريقتان سريعتان بدلاً من العمل اليدوي

---

## 🔥 **الطريقة الأولى: استيراد JSON Schema**

### 1. انسخ هذا الكود واحفظه كملف JSON:
```json
{
  "database": {
    "databaseId": "mandoub-db",
    "name": "Mandoub Database"
  },
  "collections": [
    {
      "collectionId": "submissions",
      "name": "Submissions",
      "permissions": ["any"],
      "documentSecurity": true,
      "attributes": [
        {
          "key": "villageName",
          "type": "string",
          "size": 255,
          "required": true,
          "array": false
        },
        {
          "key": "representativeName",
          "type": "string", 
          "size": 255,
          "required": true,
          "array": false
        },
        {
          "key": "totalPeople",
          "type": "integer",
          "required": true,
          "array": false,
          "min": 0,
          "max": 999999
        },
        {
          "key": "receivedMoney",
          "type": "integer",
          "required": true,
          "array": false,
          "min": 0,
          "max": 999999
        },
        {
          "key": "notReceived",
          "type": "integer",
          "required": true,
          "array": false,
          "min": 0,
          "max": 999999
        },
        {
          "key": "amountPerPerson",
          "type": "integer",
          "required": true,
          "array": false,
          "min": 0,
          "max": 999999
        },
        {
          "key": "totalAmount",
          "type": "integer",
          "required": true,
          "array": false,
          "min": 0,
          "max": 999999999
        },
        {
          "key": "timestamp",
          "type": "string",
          "size": 50,
          "required": true,
          "array": false
        },
        {
          "key": "date",
          "type": "string",
          "size": 50,
          "required": true,
          "array": false
        },
        {
          "key": "time",
          "type": "string",
          "size": 50,
          "required": true,
          "array": false
        }
      ]
    },
    {
      "collectionId": "settings",
      "name": "Settings",
      "permissions": ["any"],
      "documentSecurity": true,
      "attributes": [
        {
          "key": "googleSheetsUrl",
          "type": "string",
          "size": 500,
          "required": false,
          "array": false
        },
        {
          "key": "enableGoogleSheets",
          "type": "boolean",
          "required": true,
          "array": false
        },
        {
          "key": "passwordNotificationUrl",
          "type": "string",
          "size": 500,
          "required": false,
          "array": false
        },
        {
          "key": "adminPassword",
          "type": "string",
          "size": 255,
          "required": false,
          "array": false
        },
        {
          "key": "createdAt",
          "type": "string",
          "size": 50,
          "required": true,
          "array": false
        },
        {
          "key": "updatedAt",
          "type": "string",
          "size": 50,
          "required": true,
          "array": false
        }
      ]
    }
  ]
}
```

### 2. في Appwrite Console:
- اذهب لـ **Databases**
- اضغط **Import**
- ارفع الملف JSON
- اضغط **Import**

---

## ⚡ **الطريقة الثانية: JavaScript Auto Setup**

### 1. انسخ هذا الكود في Console المتصفح:

```javascript
// إعداد Appwrite تلقائياً - تحميل المكتبة أولاً
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/appwrite@13.0.1';
document.head.appendChild(script);

script.onload = function() {
  console.log('✅ تم تحميل Appwrite');
  setupCollections();
};

async function setupCollections() {
const { Client, Databases, ID } = Appwrite;

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('68bcdd830036700d6d5b'); // ضع معرف مشروعك

const databases = new Databases(client);

async function setupCollections() {
  try {
    console.log('🚀 بدء الإعداد...');
    
    // إنشاء قاعدة البيانات
    try {
      await databases.create('mandoub-db', 'Mandoub Database');
      console.log('✅ قاعدة البيانات');
    } catch (e) { console.log('ℹ️ قاعدة البيانات موجودة'); }
    
    // إنشاء submissions collection
    try {
      await databases.createCollection('mandoub-db', 'submissions', 'Submissions');
      console.log('✅ submissions collection');
      
      // إضافة attributes
      await databases.createStringAttribute('mandoub-db', 'submissions', 'villageName', 255, true);
      await databases.createStringAttribute('mandoub-db', 'submissions', 'representativeName', 255, true);
      await databases.createIntegerAttribute('mandoub-db', 'submissions', 'totalPeople', true, 0, 999999);
      await databases.createIntegerAttribute('mandoub-db', 'submissions', 'receivedMoney', true, 0, 999999);
      await databases.createIntegerAttribute('mandoub-db', 'submissions', 'notReceived', true, 0, 999999);
      await databases.createIntegerAttribute('mandoub-db', 'submissions', 'amountPerPerson', true, 0, 999999);
      await databases.createIntegerAttribute('mandoub-db', 'submissions', 'totalAmount', true, 0, 999999999);
      await databases.createStringAttribute('mandoub-db', 'submissions', 'timestamp', 50, true);
      await databases.createStringAttribute('mandoub-db', 'submissions', 'date', 50, true);
      await databases.createStringAttribute('mandoub-db', 'submissions', 'time', 50, true);
      
      console.log('✅ submissions attributes');
    } catch (e) { console.log('ℹ️ submissions موجود'); }
    
    // إنشاء settings collection
    try {
      await databases.createCollection('mandoub-db', 'settings', 'Settings');
      console.log('✅ settings collection');
      
      // إضافة attributes
      await databases.createStringAttribute('mandoub-db', 'settings', 'googleSheetsUrl', 500, false);
      await databases.createBooleanAttribute('mandoub-db', 'settings', 'enableGoogleSheets', true);
      await databases.createStringAttribute('mandoub-db', 'settings', 'passwordNotificationUrl', 500, false);
      await databases.createStringAttribute('mandoub-db', 'settings', 'adminPassword', 255, false);
      await databases.createStringAttribute('mandoub-db', 'settings', 'createdAt', 50, true);
      await databases.createStringAttribute('mandoub-db', 'settings', 'updatedAt', 50, true);
      
      console.log('✅ settings attributes');
    } catch (e) { console.log('ℹ️ settings موجود'); }
    
    console.log('🎉 تم الإعداد بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  }
}

// تشغيل الإعداد
setupCollections();
```

### 2. الخطوات:
1. اذهب لـ Appwrite Console
2. اضغط F12 لفتح Developer Tools
3. اذهب لتبويب **Console**
4. الصق الكود أعلاه
5. اضغط Enter
6. انتظر رسالة "🎉 تم الإعداد بنجاح!"

---

## 🔧 **الطريقة الثالثة: CLI Commands**

إذا كان لديك Appwrite CLI:

```bash
# إنشاء قاعدة البيانات
appwrite databases create --databaseId mandoub-db --name "Mandoub Database"

# إنشاء submissions collection
appwrite databases createCollection --databaseId mandoub-db --collectionId submissions --name "Submissions"

# إضافة attributes لـ submissions
appwrite databases createStringAttribute --databaseId mandoub-db --collectionId submissions --key villageName --size 255 --required true
appwrite databases createStringAttribute --databaseId mandoub-db --collectionId submissions --key representativeName --size 255 --required true
appwrite databases createIntegerAttribute --databaseId mandoub-db --collectionId submissions --key totalPeople --required true --min 0 --max 999999
appwrite databases createIntegerAttribute --databaseId mandoub-db --collectionId submissions --key receivedMoney --required true --min 0 --max 999999
appwrite databases createIntegerAttribute --databaseId mandoub-db --collectionId submissions --key notReceived --required true --min 0 --max 999999
appwrite databases createIntegerAttribute --databaseId mandoub-db --collectionId submissions --key amountPerPerson --required true --min 0 --max 999999
appwrite databases createIntegerAttribute --databaseId mandoub-db --collectionId submissions --key totalAmount --required true --min 0 --max 999999999
appwrite databases createStringAttribute --databaseId mandoub-db --collectionId submissions --key timestamp --size 50 --required true
appwrite databases createStringAttribute --databaseId mandoub-db --collectionId submissions --key date --size 50 --required true
appwrite databases createStringAttribute --databaseId mandoub-db --collectionId submissions --key time --size 50 --required true

# إنشاء settings collection
appwrite databases createCollection --databaseId mandoub-db --collectionId settings --name "Settings"

# إضافة attributes لـ settings
appwrite databases createStringAttribute --databaseId mandoub-db --collectionId settings --key googleSheetsUrl --size 500 --required false
appwrite databases createBooleanAttribute --databaseId mandoub-db --collectionId settings --key enableGoogleSheets --required true
appwrite databases createStringAttribute --databaseId mandoub-db --collectionId settings --key passwordNotificationUrl --size 500 --required false
appwrite databases createStringAttribute --databaseId mandoub-db --collectionId settings --key adminPassword --size 255 --required false
appwrite databases createStringAttribute --databaseId mandoub-db --collectionId settings --key createdAt --size 50 --required true
appwrite databases createStringAttribute --databaseId mandoub-db --collectionId settings --key updatedAt --size 50 --required true
```

---

## 🎯 **الطريقة الأسرع: JavaScript في Console**

**انسخ والصق الكود JavaScript في Console - هذا الأسرع! ⚡**

1. اذهب لـ Appwrite Console
2. F12 → Console
3. الصق الكود
4. Enter
5. انتهيت! 🎉

---

**اختر الطريقة الأسهل لك وانتهي من الإعداد في دقائق بدلاً من ساعات!** 🚀
