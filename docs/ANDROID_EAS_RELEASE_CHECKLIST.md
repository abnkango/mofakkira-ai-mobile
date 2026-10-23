# تقرير إعداد Android وEAS وقائمة تحقق APK

التاريخ: 2026-10-23  
النطاق: تهيئة الهوية والأيقونات وEAS وبيان Android وسلوك RTL. لا يشمل هذا التقرير تشغيل حساب Expo أو إصدار APK أو تثبيته على جهاز.

## ملخص البنود

| # | النتيجة | التغيير/الدليل | الحالة |
|---|---|---|---|
| 1 | تثبيت الهوية الدائمة | `expo.android.package = com.abnkango.mofakkira` و`versionCode = 1`، commit `6220ef0` | اكتمل وفُحص config |
| 2 | تركيب الأيقونات وSplash | أصول ZIP محفوظة دون تعديل، Adaptive Icon (foreground/background/monochrome)، أيقونة التطبيق وSplash فاتح/داكن، ومعاينة mask؛ commit `f4a357d` | اكتمل وفُحص config وTypeScript/lint |
| 3 | توافق SDK | `expo install --fix` حدّث إصدارات patch ضمن SDK 57 فقط؛ `expo-doctor` أعاد 21/21؛ commit `31a22ba` | اكتمل |
| 4 | إعداد EAS ودليل الهاتف | profile `preview` داخلي APK، و`production` AAB، `appVersionSource: local`، خطوات Termux في README؛ commit `ec3a832` | الإعداد جاهز؛ الربط والحساب والبناء للمستخدم |
| 5 | تدقيق الصلاحيات | حجب أربع صلاحيات غير مستخدمة؛ إبقاء INTERNET فقط؛ manifest مولد محليًا؛ commits `83cec8c` و`6414af9` | اكتمل ساكنًا، ويحتاج فحص APK النهائي |
| 6 | مسار RTL الآمن | استخدام `expo.reloadAppAsync()` بدل `Updates.reloadAsync()`؛ محاولة واحدة بعلامة محفوظة؛ commit `0b9022b` | تحقق TypeScript/lint؛ تجربة الهاتف معلّقة |
| 7 | تحقق الإصدار | هذه القائمة تفصل ما تم عن اختبار APK/الهاتف | نقاط الهاتف أدناه معلّقة |

## التشخيص والدليل وقرارات التعديل

| البند | SHA للـcommit | ما وُجد في التشخيص والدليل | القرار والملفات | ما لم يُتحقق منه على جهاز |
|---|---|---|---|---|
| 1 | `6220ef02d4dd5696d114e1875f5e4861e723e330` | `app.json` كان يحمل `com.mofakkira.ai.mobile` ولا يحدد `versionCode`؛ الاسم `المفكرة AI` والـslug والإصدار والportrait وautomatic والثيم الحالي موجودة. | غُيّر package إلى `com.abnkango.mofakkira` وأضيف versionCode 1؛ لم تتغير بقية إعدادات Android. | ظهور الاسم وتثبيت الحزمة على Redmi. |
| 2 | `f4a357dfa37a5fa29a53b0e062dc6d6c5527850f` | ZIP يضم الصور الخمس المطلوبة وREADME و`_verify.png`؛ تحققت أبعاد 1024×1024 ومطابقة SHA256 لكل الأصول الأصلية. | نسخ الملفات من دون تعديل، ربط icon/adaptive icon/monochrome/Splash وإنتاج `icon-mask-preview.png`. | قص القناع الحقيقي وAndroid 13 themed icon وSplash على الهاتف. |
| 3 | `31a22bae5f72d37a8fbff455a47d009b9a52ac10` | `expo install --fix` أوصى بإصدارات SDK57 patch؛ Doctor النهائي 21/21. | تغيّر `package.json` فقط: expo `~57.0.27→~57.0.31`، expo-linking `~57.0.12→~57.0.13`، expo-router `~57.0.25→~57.0.29`، expo-splash-screen `~57.0.9→~57.0.10`، expo-updates `~57.0.25→~57.0.26`. `expo-constants` بقي `~57.0.21` في package.json لكن lockfile يحل `57.0.22`. لم تحدث ترقية major. | APK الفعلي. `npm audit` سجل 22 advisory findings ويحتاج فرزًا أمنيًا يدويًا؛ التفاصيل أدناه. |
| 4 | `ec3a8321422b61d057cf44462e7515f5658116fa` | وثائق EAS تميّز APK للتوزيع الداخلي عن AAB للمتجر، وتوضح أن `eas init` يضيف `extra.eas.projectId` و`owner`. | أضيف `eas.json` وشرح Termux في README؛ لم تستخدم بيانات اعتماد. | ربط حساب Expo، إضافة معرّف المشروع ورفعه، البناء والتنزيل والتثبيت. |
| 5 | `83cec8c71856ee0d34618e3c3c1f5276e651eafa` و`6414af90f9006b085ee2cf587288b3fb7de43a82` | manifest المحلي أظهر INTERNET وREAD/WRITE_EXTERNAL_STORAGE وSYSTEM_ALERT_WINDOW وVIBRATE؛ بحث المصدر لم يجد استعمال ملفات مشتركة أو الاهتزاز أو overlay. أعاد prebuild `supportsRtl=true` و`allowBackup=true`. | حُجبت READ/WRITE_EXTERNAL_STORAGE وSYSTEM_ALERT_WINDOW وVIBRATE؛ تبقى INTERNET فقط. لم تتغير allowBackup. تفاصيل backup موضحة أدناه. | يجب فحص manifest المدمج داخل APK وإعادة اختبار المساعد والتطبيق. |
| 6 | `0b9022b503bb04b884651d48a8cfe7e78ae59bd8` | SDK57 docs تقول إن `Updates.reloadAsync()` يرفض عندما Updates معطلة أو في وضع التطوير/Expo Go. أظهر manifest المحلي `updates.ENABLED=false` قبل EAS linking. `expo-localization` guide يوضح أن SDK58+ فقط يغير إعداد RTL الافتراضي؛ السابق يسمح RTL افتراضيًا باستثناء Expo Go. | استبدلت `Updates.reloadAsync()` بـ`reloadAppAsync()` من حزمة `expo`؛ بقي حارس AsyncStorage ومحاولة واحدة، دون native dependency أو تغيير UI. | اتجاه أول تشغيل على هاتف عربي وغير عربي، وعدم وجود وميض/حلقة، والتوافق مع Expo Go. |
| 7 | انظر commit التقرير في Git وسجل التسليم النهائي | `expo export` أنتج HBC Android؛ فُحصت سلاسل الأدوات وسلوك الحراسة في المصدر. | أضيفت هذه الوثيقة و[`RELEASE_CHECKLIST.md`](RELEASE_CHECKLIST.md). | جميع بنود Redmi وAPK مؤجلة للمستخدم. |

## إعداد الحزم

شغّل `npx expo install --fix` على Expo SDK `57.0.31`. رُفعت تبعيات Expo المتوافقة إلى إصدارات patch التي أوصت بها الأداة: `expo 57.0.31`، `expo-constants 57.0.22`، `expo-linking 57.0.13`، `expo-router 57.0.29`، `expo-splash-screen 57.0.10` و`expo-updates 57.0.26`. بقي React `19.2.3` وReact Native `0.86.3` كما هما؛ لم تُنفذ ترقية major. فحص `npx expo-doctor` بعد التحديث: **21/21 checks passed**.

أظهر `npm audit` بعد التحديث **22 finding** (19 high و3 moderate، ولا critical) في الشجرة المحلولة، والعدد بقي نفسه عند الفحص مع `--omit=dev`. كثير من اقتراحات الإصلاح الآلية كانت تخفيضات غير متوافقة إلى Expo 44 أو React Native 0.72، أو الانتقال إلى Router 58؛ لذلك لم نشغّل `npm audit fix` ولم نطبّق تخفيضات/major تلقائية. هذا تنبيه أمني يحتاج فرزًا يدويًا قبل إصدار نهائي؛ نجاح Doctor لا يعني خلو الاعتماديات من advisories، ولا نعلن أن البناء production-ready أمنيًا بناءً على هذه الفحوص وحدها.

## الأيقونات وSplash

الأصول `icon.png` و`adaptive-icon-foreground.png` و`adaptive-icon-background.png` و`adaptive-icon-monochrome.png` و`splash-icon.png` محفوظة من `mofakkira-icons.zip` بالأسماء نفسها. تحققت SHA-256 لكل ملف أصلي ومطابقته byte-for-byte للملف داخل ZIP؛ لم نعدّل أصول المصدر. معاينة القناعين موجودة في [`../assets/icons/icon-mask-preview.png`](../assets/icons/icon-mask-preview.png). إعداد Splash يستخدم `#F7F7F5` في الوضع الفاتح و`#151614` في الوضع الداكن.

## Manifest الناتج محليًا

جرى تشغيل `npx expo prebuild --platform android --no-install` للتدقيق فقط، ثم حذف مجلد `android/` الناتج وإرجاع أي تغييرات آلية غير مطلوبة في scripts. لا يُضمّن مجلد Android المولد في Git.

- الهوية المولدة: `com.abnkango.mofakkira`، و`versionCode` يساوي `1`، واتجاه RTL المسموح `android:supportsRtl="true"`.
- `INTERNET` باقية لاتصال المساعد.
- `expo-file-system` متاح تبعيًا عن Expo لكنه غير مستخدم في شيفرة التطبيق؛ لا توجد استدعاءات FileSystem أو منتقي مستندات أو قراءة/كتابة ملفات مشتركة. حُجبت `READ_EXTERNAL_STORAGE` و`WRITE_EXTERNAL_STORAGE`.
- لا توجد استدعاءات تطبيقية لـ`SYSTEM_ALERT_WINDOW` أو الاهتزاز؛ حُجبت الصلاحيتان اللتان يضيفهما قالب Expo/React Native. يصرح manifest المصدر بعلامات إزالة `tools:node="remove"` لكل الصلاحيات الأربع. بقيت `INTERNET` فقط. يجب تأكيد النتيجة في manifest المدمج داخل APK لأن manifest النهائي ينتج أثناء البناء.
- `android:allowBackup="true"` بقي كما هو مطلوب. config plugin لـ`expo-secure-store` يربط قواعد نسخ تستثني SharedPreferences المسماة `SecureStore` لأن قيمها مشفرة بمفتاح Android Keystore ولا يمكن فكها بعد الاستعادة. قاعدة SQLite في مساحة التطبيق الخاصة قد تدخل ضمن Auto Backup بحسب إعدادات النظام/النقل؛ لا نضمن استعادة كل بيانات الجهاز. لا يُتوقع استرجاع مفاتيح API من Android backup.
- لم تثبت أي مكتبة native جديدة. أظهر prebuild تنبيهًا بأن `userInterfaceStyle: "automatic"` يحتاج `expo-system-ui` لتكامل مظهر النظام على Android؛ أُبقي الإعداد دون إضافة dependency امتثالًا للقيد. لا تعتبر مزامنة المظهر التلقائية متحققة حتى اختبارها على البناء الفعلي.
- في الإعداد المحلي قبل ربط EAS أظهر manifest `expo.modules.updates.ENABLED=false`. لذلك لا نعتمد على `Updates.reloadAsync()` لإعادة تطبيق الاتجاه. توثيق Expo يبين أن `Updates.reloadAsync()` يرفض إذا كانت Updates معطلة أو في التطوير/Expo Go؛ استُبدل بـ`reloadAppAsync()` من حزمة `expo`، الذي يعيد تشغيل JavaScript الحالية ولا يحتاج عنوان EAS Update. هذا لا يضبط خدمة OTA ولا ينشر تحديثات.

### فحص bundle الإنتاج

بعد `npx expo export --platform android`، فُحص ملف `dist/_expo/static/js/android/*.hbc` بمسح بايتات UTF-8 لعلامات محددة. لم توجد `[assistant]` ولا نصوص واجهة «مجلد اختبار المساعد»/الحوار/إضافة رسالة اختبار أو محتوى probe المقروء. ومع ذلك ظهرت معرفات داخلية `createAssistantTestNotes` و`deleteAssistantTestNotes` والبادئة `dev-test-` والقيم الاصطناعية `77231` و`77213` في bundle. لذلك لا ندعي أن كل كود/قيم fixtures حُذفت ماديًا من HBC. من المصدر، مدخل الإعدادات يربط `onLongPress` فقط عندما `__DEV__` صحيح، ودوال الإنشاء/الحذف تضيف حارس `if (!__DEV__) return`; كما أن سطر `[assistant]` محاط بشرط تطوير. الاستنتاج من الفحص الساكن: مدخلات وأدوات التطوير غير معروضة ولا تنفذ عبر واجهة Release المتوقعة، لكن يجب إتمام اختبار البند 17 من `RELEASE_CHECKLIST.md` على APK. لا تعتمد على غياب كامل لقيم fixtures من الحزمة.

## RTL

Expo SDK 57 يسمح RTL افتراضيًا في تطبيقات standalone حسب دليل Expo السابق لـSDK 58؛ كما يظهر في manifest المولد `supportsRtl=true`. جهاز اللغة العربية ينبغي أن يبدأ باتجاهه الأصلي الصحيح. إذا وجد التطبيق `I18nManager.isRTL === false`، يفعّل `allowRTL` و`forceRTL` ثم يكتب علامة `mofakkira.rtl.reload-attempted.v1` قبل محاولة `reloadAppAsync` الواحدة. إذا فشلت العملية، يعرض تحذيرًا غير قاتل ولا يعيد المحاولة في كل تشغيل؛ وعند وجود العلامة لا توجد حلقة إعادة تشغيل. لم يجر اختبار Expo Go أو RTL على جهاز حقيقي في هذه المهمة.

## قرارات للمستخدم

- **النسخ الاحتياطي:** أبقينا `allowBackup=true` كما طُلب. قرر قبل توزيع APK إن كان احتمال نسخ قاعدة SQLite مع Android Auto Backup مناسبًا لك. مفاتيح SecureStore مستثناة بقواعد Expo ولا ينبغي أن تنتقل إلى جهاز جديد. لم نغيّر سياسة النسخ.
- **الصلاحيات:** الإعداد يزيل أربع صلاحيات غير لازمة بعد فحص عدم وجود استعمال تطبيقي لها: `READ_EXTERNAL_STORAGE` و`WRITE_EXTERNAL_STORAGE` و`SYSTEM_ALERT_WINDOW` و`VIBRATE`. المقصود أن تبقى `INTERNET` وحدها؛ تحقق من ذلك في manifest النهائي المدمج بعد EAS build.
- **الهوية القديمة:** المعرف الجديد `com.abnkango.mofakkira` مختلف عن `com.mofakkira.ai.mobile`. لا تحذف التطبيق القديم أو تتوقع ترقية/نقل بياناته تلقائيًا. اختبر تحديثًا فوق إصدار سابق يستخدم المعرف الجديد نفسه ومفتاح التوقيع نفسه.
- **RTL وEAS:** اتجاه RTL مسموح على Android عبر manifest، و`reloadAppAsync` لا يعتمد على Updates. لم نشغّل `eas init` أو `eas update:configure`؛ إعداد OTA غير مفعّل في manifest المحلي. ربط EAS يضيف project ID/owner ولا يعني بذاته أن OTA قد فُعّل.
- **الاعتماديات:** سجل `npm audit` 22 finding (19 high، 3 moderate). لم نطبق التحديثات الآلية التي تقترح تخفيضات major؛ يلزم فرزها يدويًا قبل اعتبار الإصدار خاليًا من مخاطر الاعتماديات.

## إعداد EAS وما لم يُنفذ

`eas.json` لا يحوي أسرارًا أو project IDs:

- `preview`: `distribution: internal` و`android.buildType: apk`؛ مناسب للتثبيت المباشر الداخلي.
- `production`: `android.buildType: app-bundle`؛ ينتج AAB للتوزيع عبر المتجر.
- `cli.appVersionSource: local`.

لم تُنفذ `eas login` أو `eas init` أو `eas build` ولم تُنشأ بيانات اعتماد أو مشروع EAS من هذه البيئة. عند تشغيل `eas init` في Termux، يُتوقع ربط/إنشاء مشروع وتعديل `app.json` بإضافة `expo.extra.eas.projectId` و`expo.owner` باسم الحساب. راجع هذا الفرق، واحتفظ بهذه القيم، ثم commit/push لها قبل إصدار البناء. أوامر APK موجودة في [`README.md`](../README.md).

تغيير application ID من `com.mofakkira.ai.mobile` إلى `com.abnkango.mofakkira` يجعل APK الجديد تطبيقًا مستقلًا عن أي تثبيت سابق يستخدم المعرف القديم؛ لا تحذف التطبيق القديم إذا كانت بياناته مهمة، ولا تتوقع ترحيل SQLite أو إعداداته تلقائيًا إلى الحزمة الجديدة.

## قائمة الاختبار اليدوي قبل اعتبار الإصدار جاهزًا

### EAS وتوقيع APK

- [ ] سجّل الدخول في Termux وتأكد أن `eas whoami` يعرض الحساب المقصود.
- [ ] نفّذ `eas init` واربط المشروع بالحساب الصحيح؛ راجع `app.json` وتأكد من `extra.eas.projectId` و`owner` ثم ارفع التعديل إلى Git.
- [ ] شغّل `eas build --platform android --profile preview` وتأكد من أن الناتج `.apk` ومن نجاح التوقيع والتنزيل.
- [ ] لا تشارك keystore أو مفاتيح API أو ملفات أسرار في المستودع أو المحادثة.
- [ ] تحقق أن تثبيت التطبيق الجديد منفصل عن التثبيت القديم ذي application ID مختلف ولا يحذف بياناته.

### الأيقونات والصلاحيات

- [ ] ثبّت APK على هاتف Android وتحقق من أيقونة launcher بصيغة circle/squircle بحسب قناع النظام.
- [ ] على Android 13+، تحقق من themed icon monochrome عند تفعيل أيقونات الثيم.
- [ ] تحقق من Splash في الوضعين الفاتح والداكن، ومن عدم تشوه الأيقونة.
- [ ] افحص manifest المدمج/قائمة صلاحيات APK وتأكد من بقاء `INTERNET` واختفاء `READ_EXTERNAL_STORAGE` و`WRITE_EXTERNAL_STORAGE`.
- [ ] تحقق من Safe Area ولوحة المفاتيح ووضع `resize` على الجهاز المستهدف.

### اتجاه RTL والبيانات

- [ ] على جهاز مضبوط على العربية، تحقق من RTL منذ أول إطلاق ومن ترتيب عناصر الواجهة والنصوص والأزرار.
- [ ] على جهاز مضبوط على لغة LTR، تحقق من سلوك `forceRTL`، ومن أن إعادة التحميل الواحدة لا تسبب حلقة Splash أو فقدان التنقل.
- [ ] أغلق التطبيق وافتحه عدة مرات للتحقق من عدم وجود إعادة تشغيل متكررة؛ اختبر كذلك مسار فشل إعادة التشغيل إن أمكن.
- [ ] اختبر Expo Go بعد تحديث مسار RTL، كما اختبر APK مستقلًا؛ لا تعتبر أحدهما بديلًا عن الآخر.
- [ ] تأكد من استمرار ملاحظات SQLite بعد إغلاق التطبيق وفتحه، واختبر النسخ/النقل على جهاز تجريبي فقط مع توقع عدم استعادة SecureStore.
- [ ] اختبر المظهر التلقائي الداكن: prebuild حذر من غياب `expo-system-ui`، لذا دوّن النتيجة بدل افتراض نجاحه.

## مراجع Expo الرسمية

- [App config المرجعي لـSDK 57](https://docs.expo.dev/versions/v57.0.0/config/app/)
- [Expo Localization وRTL](https://docs.expo.dev/guides/localization/)
- [Expo SDK 57 Updates API](https://docs.expo.dev/versions/v57.0.0/sdk/updates/)
- [Expo SDK 57 SecureStore وAndroid Auto Backup](https://docs.expo.dev/versions/v57.0.0/sdk/securestore/)
- [إعدادات EAS `eas.json`](https://docs.expo.dev/eas/json/)
- [بناء APK للتثبيت المباشر](https://docs.expo.dev/build-reference/apk/)
- [تهيئة المشروع في EAS وربط `projectId`](https://docs.expo.dev/tutorial/eas/configure-development-build/)
