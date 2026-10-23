# المفكرة AI Mobile

نقل تطبيق «المفكرة AI» العربي RTL إلى Expo + TypeScript + Expo Router.

## الحالة

تم إنجاز **Phase 0 – Audit** و**Phase 1 – Foundation** و**Phase 2 – Screens** و**Phase 3 – Verification** و**Phase 4 – Persistent SQLite Data Layer**، وأُضيف المساعد الحقيقي عبر OpenAI-compatible API مع استرجاع الملاحظات واستخراج المهام. راجع [`docs/PORTING_AUDIT.md`](docs/PORTING_AUDIT.md) للتدقيق والقرارات الملزمة، و[`docs/PARITY_REPORT.md`](docs/PARITY_REPORT.md) لنتائج التحقق والاختلافات، و[`docs/DATA_LAYER.md`](docs/DATA_LAYER.md) للمخطط والقواعد، و[`docs/ASSISTANT.md`](docs/ASSISTANT.md) لبنية المساعد وسياسة الخصوصية، و[`docs/ASSISTANT_TEST_PLAN.md`](docs/ASSISTANT_TEST_PLAN.md) للاختبارات اليدوية.

## Expo SDK

يستخدم المشروع **Expo SDK 57.0.27** مع Expo Router `~57.0.25` وReact Native `0.86.3`. ثبّت حزم Expo الجديدة دائمًا عبر `npx expo install` حتى يطابق الإصدار SDK.

## المساعد ومزودو الذكاء الاصطناعي

يدعم المساعد Gemini وGroq ومزود OpenAI-compatible مخصصًا. أسماء النماذج قابلة للتعديل من الإعدادات، ولكل مزود مفتاحه المستقل في SecureStore. الافتراضي في Gemini هو `gemini-3.5-flash-lite`؛ والافتراضي في Groq هو `openai/gpt-oss-20b`. يرسل المساعد نص السؤال وبعض الملاحظات ذات الصلة إلى المزود بعد إشعار الخصوصية. يظل سجل المحادثة في الذاكرة فقط. راجع [`docs/ASSISTANT.md`](docs/ASSISTANT.md) لمعرفة حدود البيانات وسياسة الأخطاء والروابط المصدرية.

أداة إنشاء بيانات اختبار المساعد وتسجيل إحصاءات المسار متاحة في build التطوير فقط (`__DEV__`): اضغط مطولًا على «الإصدار» في الإعدادات. لا تظهر الأداة ولا تطبع السجل في build الإنتاج. راجع [`docs/ASSISTANT_TEST_PLAN.md`](docs/ASSISTANT_TEST_PLAN.md).

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

إصدار Expo SDK المستخدم هو **57.0.27**، ونسخة `expo-sqlite` هي **57.0.4** المطابقة لـSDK 57. خطوات Termux + Expo Go أعلاه هي مسار التشغيل الحالي.

## قرارات RTL وAndroid المعتمدة

- التطبيق يملأ الشاشة بالكامل؛ لا يوجد إطار هاتف أو خلفية خارجية. تُستخدم safe-area insets للحشو حول المحتوى، الرأس، شريط التنقل، والأزرار العائمة.
- في RTL، `inline-start` هو يمين الشاشة و`inline-end` هو يسارها. لذلك زر `+` يستخدم في RN `start: 18`، وزر `✦` يستخدم `end: 18`، للحفاظ على مواضع النموذج الأصلية.
- سيُستدعى `I18nManager.allowRTL(true)` و`I18nManager.forceRTL(true)` قبل أول render. عند اكتشاف RTL خاطئ، تُكتب علامة `mofakkira.rtl.reload-attempted.v1` في AsyncStorage **قبل** طلب `Updates.reloadAsync()`، لذلك لا يُسمح إلا بمحاولة إعادة تحميل واحدة.
- زر الرجوع في Android يغلق المساعد أولًا، ثم يرجع من المحرر/المجلدات/الإعدادات/السلة، وعند شاشة الملاحظات الرئيسية يخرج من التطبيق.

حالة البدء (`welcomeDone`) وإقرار الخصوصية (`privacyNoticeAcknowledged`) محفوظان في `settingsRepo` باستخدام AsyncStorage.

في أول تشغيل، إذا بقي `I18nManager.isRTL` خاطئًا، يستدعي التطبيق `Updates.reloadAsync()` بعد تفعيل RTL. في التشغيل اللاحق إذا بقي خاطئًا، تُطبع `console.warn` فقط ويستمر التطبيق دون إعادة تحميل ثانية أو تعطل. لم يُتحقق هذا السلوك على جهاز Android في بيئة التنفيذ الحالية.

## ملاحظات استكشاف الأخطاء

- إذا لم يتصل Expo Go، تأكد من أن الهاتف وTermux على شبكة Wi‑Fi نفسها، ثم أعد تشغيل `npx expo start --lan`.
- إذا بقيت واجهة RTL قديمة بعد تحديث الكود، أغلق المشروع من Expo Go وافتحه مجددًا؛ هذا يعيد تطبيق إعداد RTL دون تغيير بيانات AsyncStorage.
- إذا لم يظهر الخط، أعد تشغيل Metro مع مسح cache عبر `npx expo start -c`.

## حالة التحقق النهائية

`npx tsc --noEmit` و`npx expo lint` و`npx expo export --platform android` تمر بنجاح. قاعدة البيانات الدائمة تستخدم SQLite، ويبدأ التثبيت الجديد بلا ملاحظات أو مجلدات أو مهام مثال. لم يُشغّل التطبيق على هاتف Android فعلي من هذه البيئة؛ راجع [`docs/DATA_LAYER_TEST_PLAN.md`](docs/DATA_LAYER_TEST_PLAN.md) للاختبارات اليدوية.

## بنود اختبار عند أول APK

- التحقق من اتجاه RTL الحقيقي على بناء APK فعلي، وليس الاعتماد فقط على `direction: 'rtl'`.
- التحقق من أن محاولة إعادة تحميل RTL لا تتكرر، وأن التطبيق لا يدخل حلقة splash/تحميل.
- التحقق من مواضع Safe Area ولوحة المفاتيح على هاتف Android فعلي.

## الخصوصية

لا توجد أسرار أو مفاتيح API في هذا المستودع.
