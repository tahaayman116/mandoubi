# إنشاء Collection للمندوبين في Appwrite

## الخطوات المطلوبة:

### 1. الدخول إلى Appwrite Console
- اذهب إلى: https://cloud.appwrite.io/console
- اختر مشروع `mandoub-db`

### 2. إنشاء Collection جديدة
1. اذهب إلى **Databases** → **mandoub-db**
2. اضغط **Create Collection**
3. ضع الاسم: `representatives`
4. Collection ID: `representatives`

### 3. إضافة الحقول (Attributes):

#### الحقل الأول: name
- **Key**: `name`
- **Type**: String
- **Size**: 255
- **Required**: ✅ Yes
- **Array**: ❌ No

#### الحقل الثاني: role
- **Key**: `role`
- **Type**: String  
- **Size**: 50
- **Required**: ✅ Yes
- **Array**: ❌ No

#### الحقل الثالث: active
- **Key**: `active`
- **Type**: Boolean
- **Required**: ✅ Yes
- **Array**: ❌ No
- **Default**: true

#### الحقل الرابع: createdAt
- **Key**: `createdAt`
- **Type**: String
- **Size**: 50
- **Required**: ✅ Yes
- **Array**: ❌ No

### 4. إعداد الصلاحيات (Permissions):
- **Read**: Any
- **Write**: Any
- **Update**: Any
- **Delete**: Any

### 5. حفظ وتفعيل Collection

بعد إنشاء الـ Collection، سيكون النظام جاهز لحفظ بيانات المندوبين والمشرفين في Appwrite! 🎉

## ملاحظة:
يمكنك أيضاً استخدام الملف `appwrite-collections-schema.json` المحدث لإنشاء الـ Collection تلقائياً باستخدام Appwrite CLI.
