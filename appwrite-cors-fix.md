# إصلاح مشكلة CORS و Authentication في Appwrite 🔧

## 🚨 **المشكلة:**
- **CORS Error**: `Access-Control-Allow-Origin` header مفقود
- **401 Unauthorized**: مشكلة في الصلاحيات
- **Failed to fetch**: خطأ في الاتصال

---

## ✅ **الحلول:**

### 1. **إضافة Domain للمشروع في Appwrite Console**

1. اذهب لـ **Appwrite Console**
2. اختر مشروعك **"Mandoub"**
3. اذهب لـ **Settings** → **Domains**
4. اضغط **"Add Domain"**
5. أضف هذه الـ domains:
   - `http://localhost:3000`
   - `http://localhost:3001`
   - `http://127.0.0.1:3000`
   - `http://127.0.0.1:3001`
6. اضغط **"Add"**

### 2. **تحديث Platform Settings**

1. في **Settings** → **Platforms**
2. اضغط **"Add Platform"**
3. اختر **"Web App"**
4. أدخل:
   - **Name**: `Mandoub Local`
   - **Hostname**: `localhost`
5. اضغط **"Add"**

### 3. **إنشاء API Key (اختياري)**

1. اذهب لـ **Settings** → **API Keys**
2. اضغط **"Create API Key"**
3. أدخل:
   - **Name**: `Mandoub Client`
   - **Scopes**: اختر جميع الصلاحيات المطلوبة
4. انسخ الـ **API Key**

---

## 🔧 **تحديث الكود:**

### إذا أردت استخدام API Key:

```javascript
// في appwriteService.js
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey('your-api-key-here'); // أضف هذا السطر
```

### أو استخدم Anonymous Sessions:

```javascript
// في appwriteService.js - أضف هذا في init()
async init() {
  try {
    console.log('Initializing Appwrite...');
    
    // إنشاء anonymous session
    try {
      await account.createAnonymousSession();
      console.log('✅ Anonymous session created');
    } catch (sessionError) {
      console.log('ℹ️ Session already exists or not needed');
    }
    
    // Test connection
    await databases.list();
    console.log('✅ Appwrite connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Appwrite connection failed:', error);
    return false;
  }
}
```

---

## 🎯 **الحل السريع - تحديث الصلاحيات:**

### في Appwrite Console:

1. **اذهب لكل Collection** (submissions, settings)
2. **Settings** → **Permissions**
3. **احذف جميع الصلاحيات الحالية**
4. **اضغط "Add Role"**
5. **اختر "Any"**
6. **فعّل جميع الصلاحيات:**
   - ✅ **Create**
   - ✅ **Read**  
   - ✅ **Update**
   - ✅ **Delete**
7. **اضغط "Update"**

---

## 🔄 **بعد التحديثات:**

1. **أعد تشغيل التطبيق**: `npm start`
2. **امسح Cache المتصفح**: Ctrl+Shift+R
3. **جرب إضافة بيانات جديدة**
4. **راقب Console** للتأكد من عدم وجود أخطاء

---

## 🆘 **إذا استمرت المشكلة:**

### استخدم هذا الكود المؤقت:

```javascript
// في appwriteService.js - استبدل addSubmission
async addSubmission(data) {
  try {
    console.log('Adding submission to Appwrite:', data);
    
    // محاولة إنشاء anonymous session أولاً
    try {
      await account.createAnonymousSession();
    } catch (e) {
      // Session موجودة بالفعل أو غير مطلوبة
    }
    
    const document = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_SUBMISSIONS_COLLECTION,
      ID.unique(),
      {
        villageName: data.villageName,
        representativeName: data.representativeName,
        totalPeople: parseInt(data.totalPeople) || 0,
        receivedMoney: parseInt(data.receivedMoney) || 0,
        notReceived: parseInt(data.notReceived) || 0,
        amountPerPerson: parseInt(data.amountPerPerson) || 50,
        totalAmount: parseInt(data.totalAmount) || 0,
        timestamp: data.timestamp || new Date().toISOString(),
        date: data.date || new Date().toLocaleDateString('ar-EG'),
        time: data.time || new Date().toLocaleTimeString('ar-EG')
      },
      [Permission.read(Role.any()), Permission.write(Role.any())] // صلاحيات مباشرة
    );
    
    console.log('✅ Submission added to Appwrite:', document.$id);
    return { success: true, id: document.$id, data: document };
  } catch (error) {
    console.error('❌ Error adding submission to Appwrite:', error);
    throw error;
  }
}
```

---

## 🎉 **النتيجة المتوقعة:**

بعد تطبيق هذه الحلول، ستحصل على:

```
📝 Adding to Firebase...
✅ Firebase: Success
📝 Adding to Appwrite...
✅ Appwrite: Success
📝 Submission added to dual database: {success: true, results: {...}}
```

**اتبع الخطوات بالترتيب وستعمل Appwrite بنجاح!** 🚀
