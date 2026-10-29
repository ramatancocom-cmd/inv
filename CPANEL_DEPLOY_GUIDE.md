# دليل رفع وتشغيل الدعوة على cPanel (Node.js App)

تم تجهيز حزمة الرفع بالكامل في ملف مضغوط جاهز بحجم خفيف جداً (**~5.3 ميجابايت فقط**):
📁 **`cpanel-deployment.zip`** (موجود في مجلد المشروع الرئيسي: `inv/cpanel-deployment.zip`)

---

## 🚀 خطوات الرفع والتشغيل خطوة بخطوة

### الخطوة 1: إنشاء تطبيق Node.js في cPanel
1. افتح لوحة تحكم **cPanel**.
2. ابحث عن قسم **Software** واضغط على **"Setup Node.js App"**.
3. اضغط على زر **"Create Application"**.
4. املأ البيانات كالتالي:
   - **Node.js version**: اختر `18.x` أو `20.x`.
   - **Application mode**: اختر `Production`.
   - **Application root**: اكتب اسم المجلد الذي ستضع فيه الملفات (مثلاً: `invitation` أو مسار موقعك).
   - **Application URL**: اختر الدومين أو السب دومين الخاص بك (مثلاً: `invite.yourdomain.com`).
   - **Application startup file**: اكتب `server.js` (أو `app.js`).
5. اضغط على **"Create"** بالأعلى.
6. بعد الإنشاء، اضغط على **"Stop App"** مؤقتاً حتى نرفع الملفات.

---

### الخطوة 2: رفع الملفات عبر File Manager
1. في cPanel، افتح **File Manager** (مدير الملفات).
2. ادخل إلى المجلد الذي حددته في Application root (مثلاً `invitation/`).
3. اضغط على **Upload** بالأعلى، وارفع الملف:
   📦 **`cpanel-deployment.zip`**
4. بعد اكتمال الرفع (يصل إلى 100% باللون الأخضر)، اضغط كليك يمين على `cpanel-deployment.zip` ثم اختر **Extract** (فك الضغط في نفس المجلد).
5. (اختياري) يمكنك حذف ملف الـ `.zip` بعد استخراجه لتوفير المساحة.

---

### الخطوة 3: التحقق من المتغيرات (.env)
الملف المستخرج يحتوي تلقائياً على ملف `.env`:
- كلمة مرور لوحة التحكم `/admin`: `admin123`
- يمكنك فتح وتعديل ملف `.env` في File Manager لتغيير كلمة المرور أو إضافة بيانات إيميل Gmail لإشعارات الـ RSVP إن رغبت.

---

### الخطوة 4: تشغيل التطبيق (Start App)
1. ارجع إلى صفحة **Setup Node.js App** في cPanel.
2. اضغط على زر القلم (تعديل) بجانب التطبيق الخاص بك.
3. اضغط على **"Start App"** (أو **Restart**).
4. اضغط على رابط الموقع بجانب **Application URL**.

🎉 **مبروك! موقع الدعوة يعمل الآن أونلاين على السيرفر!**

---

### 📋 الروابط الهامة بعد التشغيل:
- **رابط الدعوة للضيوف**: `https://yourdomain.com/`
- **لوحة تحكم المسؤول**: `https://yourdomain.com/admin`
  - كلمة المرور: `admin123`
- **ملف الـ RSVP على السيرفر**: يتم حفظ الردود تلقائياً وتحديثها في `data/rsvps.txt`.

---

> [!TIP]
> إذا قمت بعمل أي تعديلات جديدة في الكود لاحقاً على جهازك، كل ما عليك فعله هو تشغيل:
> ```bash
> npm run build
> npm run package:cpanel
> Compress-Archive -Path "cpanel-bundle\*" -DestinationPath "cpanel-deployment.zip" -Force
> ```
> ثم رفع واستخراج ملف `cpanel-deployment.zip` الجديد والضغط على **Restart** في cPanel.
