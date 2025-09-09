# إعداد GitHub Personal Access Token

## الخطوات:

### 1. إنشاء Personal Access Token:
1. اذهب إلى: https://github.com/settings/tokens
2. اضغط "Generate new token" → "Generate new token (classic)"
3. في Token name: اكتب "Mandoub Project"
4. في Expiration: اختار "90 days" أو "No expiration"
5. في Select scopes: اختار ✅ **repo** (Full control of private repositories)
6. اضغط "Generate token"
7. **انسخ الـ Token فوراً** (لن تراه مرة أخرى!)

### 2. استخدام الـ Token:
بعد ما تنسخ الـ Token، استخدم الأمر ده:

```bash
git remote set-url origin https://YOUR_TOKEN@github.com/tahaayman116/mandoub-project.git
```

استبدل `YOUR_TOKEN` بالـ Token اللي نسخته.

### 3. رفع المشروع:
```bash
git push -u origin main
```

## مثال:
إذا كان الـ Token بتاعك: `ghp_abc123xyz789`
```bash
git remote set-url origin https://ghp_abc123xyz789@github.com/tahaayman116/mandoub-project.git
git push -u origin main
```
