# رفع المشروع على الريبو القديم - الخطوات اليدوية

## المشكلة:
Git محتاج authentication للـ push على الريبو القديم.

## الحل الأسرع - GitHub Desktop:

### 1. تحميل GitHub Desktop:
- اذهب إلى: https://desktop.github.com/
- حمل وثبت البرنامج
- سجل دخول بحسابك

### 2. إضافة المشروع:
- اضغط "Add an Existing Repository from your Hard Drive"
- اختار المجلد: `E:\elmeshnebb-`
- اضغط "Add Repository"

### 3. تغيير الـ Repository:
- في GitHub Desktop، اضغط على Repository → Repository Settings
- في Remote tab، غير الـ URL إلى: `https://github.com/tahaayman116/mandoubi.git`

### 4. رفع التحديثات:
- اضغط "Push origin" أو "Publish branch"

## الحل البديل - Personal Access Token:

### 1. إنشاء Token:
- اذهب إلى: https://github.com/settings/tokens
- اضغط "Generate new token (classic)"
- اختار `repo` في الـ Scopes
- انسخ الـ Token

### 2. استخدام Token في Terminal:
```bash
git remote set-url origin https://YOUR_TOKEN@github.com/tahaayman116/mandoubi.git
git push -u origin main
```

## الوضع الحالي:
- ✅ المشروع محضر ومُحسن بالكامل
- ✅ Git repository مُهيأ
- ✅ Remote URL متغير للريبو القديم
- ⏳ محتاج authentication للـ push

استخدم GitHub Desktop للسهولة أو Personal Access Token للـ command line.
