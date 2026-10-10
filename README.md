# المفكرة AI Mobile

نقل تطبيق «المفكرة AI» العربي RTL إلى Expo + TypeScript + Expo Router.

## الحالة

تم إنجاز **Phase 0 – Audit**، وبعد اعتماد التصحيحات بدأت **Phase 1 – Foundation**. راجع [`docs/PORTING_AUDIT.md`](docs/PORTING_AUDIT.md) للتدقيق والقرارات الملزمة.

## Expo SDK

يستخدم المشروع **Expo SDK 57.0.27** مع Expo Router `~57.0.25` وReact Native `0.86.3`. ثبّت حزم Expo الجديدة دائمًا عبر `npx expo install` حتى يطابق الإصدار SDK.

## التشغيل على الهاتف: Termux + Expo Go

1. ثبّت Node.js وGit في Termux، ثم استنسخ المستودع الخاص على الهاتف.
2. من مجلد المشروع نفّذ `npm install`.
3. شغّل `npx expo start --lan`.
4. افتح Expo Go على **الهاتف نفسه**، ثم امسح QR أو أدخل عنوان LAN الظاهر في Termux.
5. لا تستخدم `npm run android` في هذا المسار؛ لا يحتاج تشغيل Expo Go إلى emulator أو build مخصص.

لم أتمكن من تشغيل Expo Go أو اختبار هاتف Android فعلي من بيئة التنفيذ الحالية؛ لذلك الخطوتان 3–4 **غير متحقق منهما عمليًا** حتى الآن.

## مصدر الحقيقة

- المستودع الأصلي: https://github.com/abnkango/mofakkira-ai
- الالتزام المدقق: `a9a97f454e767a3da2c33e79c5b47f4699d57432`
- النموذج المنشور: https://abnkango.github.io/mofakkira-ai/

إصدار Expo SDK الدقيق وخطوات Termux + Expo Go ستُثبت هنا بعد اكتمال scaffold واختيار الإصدار المدعوم من Expo Go الحالي.

## قرارات RTL وAndroid المعتمدة

- التطبيق يملأ الشاشة بالكامل؛ لا يوجد إطار هاتف أو خلفية خارجية. تُستخدم safe-area insets للحشو حول المحتوى، الرأس، شريط التنقل، والأزرار العائمة.
- في RTL، `inline-start` هو يمين الشاشة و`inline-end` هو يسارها. لذلك زر `+` يستخدم في RN `start: 18`، وزر `✦` يستخدم `end: 18`، للحفاظ على مواضع النموذج الأصلية.
- سيُستدعى `I18nManager.allowRTL(true)` و`I18nManager.forceRTL(true)` قبل أول render. إذا تطلب Android إعادة تحميل لمرة واحدة، سيُوثق ذلك بعد التحقق في Expo Go.
- زر الرجوع في Android يغلق المساعد أولًا، ثم يرجع من المحرر/المجلدات/الإعدادات/السلة، وعند شاشة الملاحظات الرئيسية يخرج من التطبيق.

حالة البدء (`welcomeDone`) وإقرار الخصوصية (`privacyNoticeAcknowledged`) محفوظان في `settingsRepo` باستخدام AsyncStorage.

في أول تشغيل، إذا بقي `I18nManager.isRTL` خاطئًا، يستدعي التطبيق `Updates.reloadAsync()` بعد تفعيل RTL. يجب أن تكون إعادة التحميل لمرة واحدة فقط، ولا يجوز عرض واجهة LTR قبلها.

## ملاحظات استكشاف الأخطاء

- إذا لم يتصل Expo Go، تأكد من أن الهاتف وTermux على شبكة Wi‑Fi نفسها، ثم أعد تشغيل `npx expo start --lan`.
- إذا بقيت واجهة RTL قديمة بعد تحديث الكود، أغلق المشروع من Expo Go وافتحه مجددًا؛ هذا يعيد تطبيق إعداد RTL دون تغيير بيانات AsyncStorage.
- إذا لم يظهر الخط، أعد تشغيل Metro مع مسح cache عبر `npx expo start -c`.

## الخصوصية

لا توجد أسرار أو مفاتيح API في هذا المستودع.
