# طبقة البيانات الدائمة

## النطاق

تستخدم المفكرة SQLite عبر `expo-sqlite@57.0.4` المطابق لـ Expo SDK 57. لا تصل الشاشات إلى SQLite مباشرة؛ المسار هو:

> الشاشة ← `appState` ← repositories ← `src/data/database.ts` ← SQLite

قاعدة البيانات هي مصدر الحقيقة الوحيد. مصفوفات `appState` نسخة عرض مؤقتة تُحدّث بعد نجاح الكتابة فقط.

## المخطط، الإصدار 1

يفتح التطبيق `mofakkira.db`، يفعل `PRAGMA foreign_keys = ON`، ثم يقرأ `PRAGMA user_version`. الترحيل داخل `withExclusiveTransactionAsync`، ويمكن تشغيله مرات متعددة بأمان عبر `CREATE TABLE IF NOT EXISTS` وفحص الإصدار.

| الجدول | الحقول | الملاحظات |
|---|---|---|
| `folders` | `id TEXT PRIMARY KEY`, `name TEXT NOT NULL` | لا تُخزّن صفوف «الكل» أو «غير مصنف». |
| `notes` | `id`, `title`, `body`, `folder_id`, `original_folder_id`, `created_at`, `updated_at`, `deleted_at` | الأوقات `INTEGER` بميلي ثانية epoch. معرفا المجلد يقبلان NULL. الحذف الناعم يضع `deleted_at` و`original_folder_id` ويجعل `folder_id` NULL. |
| `tasks` | `id`, `text`, `done`, `created_at` | `done` قيمة SQLite صحيحة 0/1. |
| `meta` | `key TEXT PRIMARY KEY`, `value TEXT NOT NULL` | مساحة ترحيلات/بيانات وصفية مستقبلية؛ لا تحمل بذورًا. |

المفاتيح الأجنبية في الملاحظات تشير إلى المجلدات مع `ON DELETE SET NULL`. حذف المجلد نفسه يسبقُه تحديث صريح لـ`folder_id` و`original_folder_id` لكل الملاحظات الحية والمحذوفة داخل transaction واحدة.

## الترحيل والجاهزية

- يبقى Splash ظاهرًا حتى تحميل Tajawal وفتح/ترحيل SQLite.
- فشل فتح القاعدة أو الترحيل يعرض شاشة خطأ واضحة بدل رسم التطبيق أو الانهيار الصامت.
- أداة التطوير المخفية في الإعدادات تستدعي `resetDatabase`، فتسقط الجداول وتعيد إنشاء المخطط الفارغ، ولا تزرع بيانات مثال.

## المستودعات

- `notesRepo`: list/search، purge، إزالة الصفوف الفارغة، create/update/move/softDelete/restore/permanentlyDelete، وعدادات SQL.
- `foldersRepo`: list/create/rename/remove/count؛ `remove` ذري مع تحديث كل الملاحظات.
- `tasksRepo`: list/create/toggle/remove.
- الكتابات متعددة الخطوات تستخدم transaction. أخطاء repositories تُسجل في `console.error` وتُعاد للمستدعي بدل ابتلاعها، وعمليات الكتابة التي تمر عبر `appState` تعرض تنبيهًا مؤقتًا `تعذر حفظ التغيير. حاول مرة أخرى.` دون إزالة الشاشة.
- البحث يطابق التنفيذ السابق (`title + ' ' + body`, case-insensitive، substring) عبر `lower(title || ' ' || body) LIKE lower(?)` داخل SQLite.
- عدادات «الكل» و«غير مصنف» وكل مجلد تأتي من `COUNT(*)`، لا من عدّ مصفوفة الذاكرة.

## قواعد المجال المعزولة

الدوال في `src/data/rules.ts` لا تعتمد على SQLite:

- `recycleCutoff(nowMs)`: كل حذف أقدم من 30 يومًا قابل للتنقية.
- `isEmptyNote`: العنوان والمتن فارغان بعد `trim`.
- `nextUpdatedAt`: لا يتغير `updatedAt` إلا إذا تغيّر العنوان أو المتن.

## قرارات التشغيل

- أول تشغيل يبدأ بقاعدة فارغة تمامًا: لا seed folders/notes/tasks ولا علامة seeded.
- زر + ينشئ مسودة ذاكرة فقط. أول كتابة غير فارغة تحفظ الصف؛ الرجوع دون كتابة يزيل المسودة بلا أثر.
- الملاحظة المحفوظة التي يفرغها المستخدم تُحذف حذفًا ناعمًا عند الرجوع. العنوان فقط أو المتن فقط صالحان للحفظ.
- عند الإقلاع تُنقّى السلة القديمة وتُحذف أي ملاحظة حية فارغة بقيت كشبكة أمان.
- الحفظ تلقائي عند رجوع الرأس أو Back المادي من المحرر.
