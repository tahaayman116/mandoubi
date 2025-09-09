# GitHub Setup Commands

## بعد إنشاء Repository على GitHub، استخدم الأوامر دي:

```bash
# إضافة remote origin (استبدل USERNAME بـ username بتاعك)
git remote add origin https://github.com/USERNAME/mandoub-project.git

# تغيير اسم الـ branch الرئيسي
git branch -M main

# رفع المشروع لأول مرة
git push -u origin main
```

## أو إذا كان عندك SSH key:

```bash
git remote add origin git@github.com:USERNAME/mandoub-project.git
git branch -M main
git push -u origin main
```

## للتأكد من الـ remote:
```bash
git remote -v
```

## إذا احتجت تغيير الـ remote:
```bash
git remote set-url origin https://github.com/USERNAME/mandoub-project.git
```
