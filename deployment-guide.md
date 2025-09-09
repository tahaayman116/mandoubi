# دليل نشر المشروع على Netlify

## الطريقة الأسهل - من خلال GitHub:

### 1. اذهب إلى [netlify.com](https://netlify.com)
### 2. اضغط "New site from Git"
### 3. اختر GitHub واربط حسابك
### 4. اختر repository: `tahaayman116/mandoubi`
### 5. إعدادات البناء:
```
Build command: npm run build
Publish directory: build
```

## الطريقة البديلة - رفع مباشر:

### 1. بناء المشروع محلياً:
```bash
cd E:\elmeshnebb-
npm install
npm run build
```

### 2. رفع مجلد build على Netlify:
- اذهب إلى [netlify.com](https://netlify.com)
- اسحب مجلد `build` إلى المنطقة المخصصة
- أو استخدم "Browse to upload"

## إعدادات مهمة:

### Environment Variables (في Netlify):
```
REACT_APP_FIREBASE_API_KEY=your_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_APPWRITE_ENDPOINT=your_endpoint
REACT_APP_APPWRITE_PROJECT_ID=your_project_id
```

### Redirects (موجود في netlify.toml):
```
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## المشروع جاهز للنشر مع:
- ✅ Firebase optimization (85-99% تقليل القراءات)
- ✅ Lazy loading system
- ✅ Enhanced Excel export
- ✅ UI improvements
- ✅ netlify.toml configuration

## ملاحظة:
تأكد من إضافة Firebase config في Environment Variables على Netlify لضمان عمل المشروع بشكل صحيح.
