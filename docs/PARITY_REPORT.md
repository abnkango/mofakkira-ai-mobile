# تقرير Parity النهائي – المفكرة AI Mobile

## النطاق

تم نقل النموذج العربي RTL من الالتزام `a9a97f454e767a3da2c33e79c5b47f4699d57432` إلى Expo SDK `57.0.27` مع Expo Router. المصدر المنشور والفروع البرمجية متوافقان ضمن الفحص المتاح. التطبيق يملأ الشاشة بدل إطار الهاتف، ويستخدم Safe Area insets؛ لا توجد خلفية أو إطار ويب خارجي.

## قرارات طبقة البيانات الجديدة

- **انحراف مقصود:** يبدأ التطبيق الجديد بقاعدة SQLite فارغة تمامًا؛ لا تُزرع بيانات المثال الموجودة في المصدر المرجعي.
- **انحراف مقصود:** زر + ينشئ مسودة ذاكرة، ولا يُنشأ صف SQLite إلا عند أول كتابة غير فارغة. الرجوع من مسودة فارغة يزيلها بلا أثر، بينما تفريغ ملاحظة محفوظة ينقلها إلى السلة حذفًا ناعمًا.
- الحفظ الدائم تلقائي عند الرجوع، وقاعدة البيانات هي مصدر الحقيقة؛ راجع [`DATA_LAYER.md`](DATA_LAYER.md).

## حالة كل شاشة

| الشاشة | الحالة | ملاحظات |
|---|---|---|
| الترحيب + إعداد API | مطابق سلوكيًا | نفس النصوص والخطوتين؛ حالة البدء في `settingsRepo`، والمفتاح في SecureStore. |
| الملاحظات | مطابق بنيويًا وسلوكيًا | بحث، شرائح مجلدات، FlatList، long-press، عدادات، زر + وFAB المساعد، وشريط تنقل ثابت. لا توجد مقارنة بكسلية على جهاز. |
| المجلدات | مطابق سلوكيًا | العناصر والعدادات، إنشاء، long-press، إعادة تسمية Android عبر Modal مخصص، حذف مؤكد ينقل `folderId` إلى `null`. |
| محرر الملاحظة | مطابق سلوكيًا | تحديث تلقائي، ثبات `createdAt`، تغيير `updatedAt` عند العنوان/المتن فقط، نقل، حذف، واستخراج مهام محددة. |
| المهام | مطابق بنيويًا | الفلاتر والإضافة والإنجاز والسحب في الاتجاهين عبر Gesture Handler. لم تُختبر الإيماءة على جهاز فعلي. |
| المساعد | مطابق جزئيًا | النطاقات، الاقتراحات غير المرسلة، loading dots، المفتاح المفقود، الخصوصية، والروابط للملاحظات موجودة. حالة error/retry ليست لها آلية mock فشل تلقائية كما في UI المرجعي، لأن المصدر نفسه لا يطلقها في المسار العادي. كما أن نطاق المجلد الحالي لا يرشح الملاحظات حسب اختيار Notes المشترك بعد؛ هذه نقطة فرق وظيفية مسجلة. |
| الإعدادات | مطابق سلوكيًا | Gemini/Groq، theme auto/light/dark فوري، حفظ AsyncStorage، SecureStore، mask آخر 4، تغيير وحذف مؤكد. |
| سلة المحذوفات | مطابق سلوكيًا مع انحراف بصري مقصود | تنقية 30 يومًا عند repository read، استعادة للمجلد الأصلي إن وجد أو null، وحذف نهائي مؤكد. أزيلت أيقونة السلة الزخرفية من بطاقة العنصر المحذوف عمدًا؛ بقي زر «استعادة» وزر «حذف نهائي» الفعليان. |

## التحقق من السلوكيات الحرجة

| السلوك | طريقة التحقق | النتيجة |
|---|---|---|
| ثبات الشريط العلوي/السفلي وFAB وعدم تغطية آخر عنصر | قراءة الكود + FlatList content padding | شريط المساعد أصبح يضمن `Math.max(insets.bottom, 18)`، وشريط التنقل السفلي يضمن هامشًا لا يقل عن 18dp. محرر الملاحظة يضع الهامش على `toolbar` الداخلي لا على `KeyboardAvoidingView`؛ السبب الفعلي لفقدان الهامش كان اعتماد padding الحاوية التي يعيد `behavior="padding"` قياسها. FAB يبقى فوق شريط التنقل (`bottom: 84`) ولا يعتمد على inset سفلي مباشر. الحوارات السفلية تستخدم `KeyboardAwareDialog` flex-end ولا تحتوي شريط أزرار ثابتًا منفصلًا. لم يُتحقق بصريًا على Android. |
| حذف المجلد يضع `folderId: null` ويحدث العدادات | قراءة `appState.tsx` وTypeScript | متحقق بالكود |
| `updatedAt` يتغير عند تغير العنوان/المتن فقط | قراءة `updateNote` + TypeScript | متحقق بالكود |
| حذف/استعادة/حذف نهائي ونافذة 30 يومًا | قراءة appState وnotesRepo وRecycleBin | متحقق بالكود |
| استخراج المهام واختيار المحدد ورسالة الملاحظة الفارغة | قراءة محرر الملاحظة + TypeScript | متحقق بالكود |
| المساعد: scope/اقتراحات/loading/missing-key/privacy/source link | قراءة شاشة المساعد + TypeScript | متحقق جزئيًا؛ filter للمجلد وerror/retry الفعليان غير متحققين |
| API key: حفظ غير فارغ، mask، آخر 4، تغيير/حذف | قراءة settingsRepo وSettings | متحقق بالكود؛ SecureStore الفعلي غير مختبر على Android |
| الثيم auto/light/dark فوري ومستمر | قراءة SettingsProvider وThemeProvider | متحقق بالكود؛ تبديل الجهاز الفعلي غير مختبر |
| Android Back: assistant أولًا، ثم stack، ثم خروج Notes root | قراءة `AndroidBackHandler` وExpo Router | متحقق بالكود؛ لم يُختبر بزر جهاز فعلي |
| موضع FAB في RTL | قراءة `FAB`: + يستخدم `start:18` و✦ يستخدم `end:18` | متحقق بالقرار والكود؛ الموضع الفيزيائي غير مختبر على Android |

## نتائج الأوامر

| الأمر | النتيجة |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npx expo lint` | PASS |
| `npx expo-doctor` | PASS: `21/21 checks passed. No issues detected!` |
| `npx expo export --platform android` | PASS؛ تم إنشاء `dist` وحزمة Android Hermes |
| `npm install` | PASS |
| تشغيل Expo Go على Redmi/Android فعلي | NOT VERIFIED: لا يوجد هاتف Android فعلي في بيئة التنفيذ |

## dependencies وسبب كل واحدة

| dependency | السبب |
|---|---|
| `expo ~57.0.27` | runtime SDK المستخدم، والمطابق للإصدار المختار من Expo Go |
| `expo-router ~57.0.25` | مسارات native وstack navigation |
| `react-native 0.86.3` و`react 19.2.3` | runtime الأساسي المتوافق مع SDK 57 |
| `@expo-google-fonts/tajawal` | خط Tajawal العربي بالأوزان المستخدمة |
| `expo-font` | تحميل الخطوط قبل إخفاء Splash |
| `expo-splash-screen` | إبقاء splash حتى تحميل الخط |
| `expo-status-bar` | نمط status bar حسب الثيم |
| `expo-safe-area-context` | insets بدل إطار الهاتف الخارجي |
| `@react-native-async-storage/async-storage` | حفظ theme/provider/welcome/privacy في settingsRepo |
| `expo-secure-store` | تخزين API key فقط بصورة آمنة |
| `react-native-gesture-handler` | swipe-to-delete للمهام في Expo Go |
| `lucide-react-native` + `react-native-svg` | الأيقونات المطلوبة |
| `expo-updates` | reloadAsync عند تفعيل RTL في أول تشغيل |
| `expo-constants`, `expo-linking`, `react-native-screens` | تكامل Expo Router/runtime الأساسي |
| `typescript`, `@types/react` | TypeScript strict والتحقق النوعي |
| `eslint`, `eslint-config-expo` | lint الخاص بـ Expo/React Native |

لا توجد Tailwind/NativeWind أو CSS أو مكتبات web أو مكتبة تواريخ أو custom native modules أو dev client أو EAS requirement.

## ما لم يمكن التحقق منه

لم يتوفر جهاز Redmi/Android فعلي أو Expo Go في هذه البيئة. لذلك لم أدّعِ التحقق من: أول render قبل/بعد RTL reload، اتجاه الأيقونات والموضع الفيزيائي للفاب على Android، قصّ Tajawal والأوزان العربية، محاذاة multiline TextInput، سلوك لوحة المفاتيح في المحرر والمساعد، swipe الحقيقي، زر Back المادي، SecureStore الحقيقي، تبديل dark/auto مع إعداد الجهاز، الأداء والتمرير على 360x800، أو التطابق البصري pixel-perfect مع النموذج.

التحقق الشبكي الوحيد كان bundle export محليًا؛ لم تُستخدم screenshots الويب كدليل RTL أو fonts. يجب تنفيذ هذه القائمة على الهاتف قبل اعتبار parity البصري نهائيًا.
