# المفكرة AI Mobile

نقل تطبيق «المفكرة AI» العربي RTL إلى Expo + TypeScript + Expo Router.

## الحالة

تم إنجاز **Phase 0 – Audit** و**Phase 1 – Foundation** و**Phase 2 – Screens** و**Phase 3 – Verification** و**Phase 4 – Persistent SQLite Data Layer**، وأُضيف المساعد الحقيقي عبر OpenAI-compatible API مع استرجاع الملاحظات واستخراج المهام. راجع [`docs/PORTING_AUDIT.md`](docs/PORTING_AUDIT.md) للتدقيق والقرارات الملزمة، و[`docs/PARITY_REPORT.md`](docs/PARITY_REPORT.md) لنتائج التحقق والاختلافات، و[`docs/DATA_LAYER.md`](docs/DATA_LAYER.md) للمخطط والقواعد، و[`docs/ASSISTANT.md`](docs/ASSISTANT.md) لبنية المساعد وسياسة الخصوصية، و[`docs/ASSISTANT_TEST_PLAN.md`](docs/ASSISTANT_TEST_PLAN.md) للاختبارات اليدوية.

## Expo SDK

يستخدم المشروع **Expo SDK 57.0.31** مع Expo Router `~57.0.29` وReact Native `0.86.3`. ثبّت حزم Expo الجديدة دائمًا عبر `npx expo install` حتى يطابق الإصدار SDK.

## المساعد ومزودو الذكاء الاصطناعي

يدعم المساعد Gemini وGroq ومزود OpenAI-compatible مخصصًا. أسماء النماذج قابلة للتعديل من الإعدادات، ولكل مزود مفتاحه المستقل في SecureStore. الافتراضي في Gemini هو `gemini-3.5-flash-lite`؛ والافتراضي في Groq هو `openai/gpt-oss-20b`. يرسل المساعد نص السؤال وبعض الملاحظات ذات الصلة إلى المزود بعد إشعار الخصوصية. يظل سجل المحادثة في الذاكرة فقط. راجع [`docs/ASSISTANT.md`](docs/ASSISTANT.md) لمعرفة حدود البيانات وسياسة الأخطاء والروابط المصدرية.

أداة إنشاء بيانات اختبار المساعد وتسجيل إحصاءات المسار متاحة في build التطوير فقط (`__DEV__`): اضغط مطولًا على «الإصدار» في الإعدادات. لا تظهر الأداة ولا تطبع السجل في build الإنتاج. راجع [`docs/ASSISTANT_TEST_PLAN.md`](docs/ASSISTANT_TEST_PLAN.md).

## بناء APK عبر EAS من Termux

ملف `eas.json` يحدد `preview` لتوزيع داخلي بصيغة APK، و`production` بصيغة Android App Bundle (AAB)، ويستخدم `cli.appVersionSource: local`. لا يحتوي الملف على أسرار أو بيانات اعتماد. لا تنفذ هذه الأوامر إلا في مجلد المشروع على هاتفك؛ يتطلب الربط حساب Expo الخاص بك، ولم أشغّل `eas login` أو `eas init` أو `eas build` نيابة عنك.

```sh
pkg update -y
pkg install -y git nodejs-lts

git clone https://github.com/abnkango/mofakkira-ai-mobile.git
cd mofakkira-ai-mobile
npm ci
npm install --global eas-cli

eas login
eas whoami
eas init
```

أثناء `eas init` سجّل الدخول واختر حساب Expo الذي تريد أن يملك المشروع، ثم اربط مستودع المفكرة بمشروع EAS أو أنشئ مشروعًا جديدًا له. يضيف الربط إلى `app.json` قيمة `expo.extra.eas.projectId` ومعها غالبًا `expo.owner` باسم الحساب. راجع الفرق قبل المتابعة:

```sh
git diff -- app.json
```

هذه القيم تربط إعدادات المستودع بمشروع EAS الخاص بك؛ لا تحذفها. ارفع التعديل ليبقى الربط محفوظًا في Git:

```sh
git add app.json
git commit -m "Link Expo EAS project"
git push origin main
```

بعدها اطلب بناء APK:

```sh
eas build --platform android --profile preview
```

اتبع رابط صفحة البناء الذي يعرضه CLI لمتابعة السجل والحالة. ويمكنك عرض أحدث البناءات بالأمر:

```sh
eas build:list --platform android --limit 5
```

عند اكتمال البناء افتح صفحة تفاصيله في هاتفك واضغط **Download** لتنزيل ملف `.apk`، أو افتح رابط التثبيت الذي يعرضه EAS. إذا نزّلت الملف من Termux، افتح مجلد التنزيلات بتطبيق الملفات واضغط APK. سيطلب Android السماح بتثبيت التطبيقات من هذا المصدر؛ وافق على الإذن لـTermux أو للمتصفح/مدير الملفات الذي فتح الملف، ثم أكّد التثبيت. أسماء القوائم تختلف قليلًا حسب إصدار Android وواجهة الهاتف.

التثبيت فوق APK سابق يحتفظ ببياناته فقط إذا كان `android.package` وتوقيع التطبيق متوافقين. بيانات Expo Go منفصلة عن APK مستقل، لذلك لن تنتقل ملاحظات Expo Go أو إعداداته إلى التثبيت الجديد.

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

إصدار Expo SDK المستخدم هو **57.0.31**، ونسخة `expo-sqlite` هي **57.0.4** المطابقة لـSDK 57. راجع أعلاه مساري Termux + Expo Go وبناء APK عبر EAS.

## قرارات RTL وAndroid المعتمدة

- التطبيق يملأ الشاشة بالكامل؛ لا يوجد إطار هاتف أو خلفية خارجية. تُستخدم safe-area insets للحشو حول المحتوى، الرأس، شريط التنقل، والأزرار العائمة.
- في RTL، `inline-start` هو يمين الشاشة و`inline-end` هو يسارها. لذلك زر `+` يستخدم في RN `start: 18`، وزر `✦` يستخدم `end: 18`، للحفاظ على مواضع النموذج الأصلية.
- سيُستدعى `I18nManager.allowRTL(true)` و`I18nManager.forceRTL(true)` قبل أول render. إذا كانت `I18nManager.isRTL` خاطئة، تُكتب علامة `mofakkira.rtl.reload-attempted.v1` في AsyncStorage قبل إعادة تحميل واحدة عبر `reloadAppAsync` من حزمة `expo`. اخترناها لأنها تعيد تشغيل الحزمة الحالية حتى عندما تكون Expo Updates معطلة، بخلاف `Updates.reloadAsync()` التي ترفض عند تعطيل Updates أو في وضع التطوير/Expo Go؛ لا توجد حلقة إعادة تحميل.
- زر الرجوع في Android يغلق المساعد أولًا، ثم يرجع من المحرر/المجلدات/الإعدادات/السلة، وعند شاشة الملاحظات الرئيسية يخرج من التطبيق.

حالة البدء (`welcomeDone`) وإقرار الخصوصية (`privacyNoticeAcknowledged`) محفوظان في `settingsRepo` باستخدام AsyncStorage.

في SDK 57، RTL مفعّل افتراضيًا في تطبيقات standalone وفق دليل Expo؛ كما أكد prebuild أن manifest يحتوي `android:supportsRtl="true"`. على جهاز عربي ينبغي أن يأتي الاتجاه صحيحًا من النظام قبل الحاجة إلى المسار الاحتياطي. عند اضطرار التطبيق لإجبار RTL، يعيد `reloadAppAsync` تشغيل التطبيق بنفس JavaScript الحالية ولا يتطلب إعداد EAS Update. تحفظ العلامة محاولة واحدة فقط قبل الاستدعاء لتجنب حلقة إعادة تشغيل. هذا تحقق static عبر config/manifest وليس اختبارًا على جهاز فعلي.

## تدقيق Android Manifest والنسخ الاحتياطي

فُحص manifest مولد محليًا بـ`npx expo prebuild --platform android --no-install` ثم حُذف مجلد `android/` المولد ولم يُضمّن في المستودع. تحتاج اتصالات المساعد إلى `INTERNET`؛ وحُجبت `READ_EXTERNAL_STORAGE` و`WRITE_EXTERNAL_STORAGE` لأنها جاءت من `expo-file-system` غير المستخدم، ولا يوجد في التطبيق منتقي ملفات أو كود يقرأ أو يكتب ملفات مشتركة. أظهر prebuild علامتي إزالة لهاتين الصلاحيتين. يصرّح القالب أيضًا بـ`SYSTEM_ALERT_WINDOW` و`VIBRATE` ضمن إعداد Expo/React Native الأساسيين، وأبقيناهما بدل تعطيل سلوكيات المنصة دون حاجة.

قيم التطبيق المولدة هي `android:supportsRtl="true"` و`android:allowBackup="true"`. يضيف config plugin لـSecureStore قواعد تستثني SharedPreferences المسماة `SecureStore` من النسخ لأنها مشفرة بمفتاح Android Keystore؛ لكن بيانات SQLite الخاصة بالتطبيق قد تظل ضمن النسخ الاحتياطي التلقائي للنظام. لذلك قد تنتقل الملاحظات حسب إعدادات النقل/النسخ في Android، بينما لا ينبغي توقع انتقال مفاتيح API المخزنة في SecureStore. لم نغيّر `allowBackup`.

لم نضف `expo-localization` أو `expo-system-ui` أو أي native dependency جديدة. أظهر prebuild تنبيهًا بأن `userInterfaceStyle: "automatic"` لا يفعّل تكامل مظهر Android مع النظام ما لم تكن `expo-system-ui` مثبتة؛ أبقينا القيمة كما هي امتثالًا لقيد عدم إضافة native dependencies. ينبغي اعتبار دعم auto dark mode الخاص بالنظام غير متحقق على Android إلى أن يُختبر البناء الفعلي.

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
