import type { Folder, Note, Task } from './domain'

const day = 86_400_000
const daysAgo = (days: number, hour = 12, minute = 0): number => {
  const date = new Date(Date.now() - days * day)
  date.setHours(hour, minute, 0, 0)
  return date.getTime()
}

export const seedFolders: Folder[] = [
  { id: 'work', name: 'العمل' },
  { id: 'ideas', name: 'أفكار' },
  { id: 'personal', name: 'شخصي' },
]

export const seedNotes: Note[] = [
  { id: 'n1', title: 'خطة إطلاق المنتج', body: 'تجهيز صفحة الهبوط، مراجعة الرسائل الأساسية، وتنسيق موعد الإطلاق مع الفريق.', folderId: 'work', originalFolderId: null, createdAt: daysAgo(8), updatedAt: daysAgo(1, 10, 15), deletedAt: null },
  { id: 'n2', title: 'اجتماع فريق التصميم', body: 'نحتاج إلى توحيد ألوان الواجهة وتبسيط خطوة التسجيل قبل نهاية الأسبوع.', folderId: 'work', originalFolderId: null, createdAt: daysAgo(6), updatedAt: daysAgo(2, 16, 40), deletedAt: null },
  { id: 'n3', title: 'أفكار للمحتوى', body: 'سلسلة قصيرة عن تنظيم اليوم، قالب أسبوعي، وتجربة خلف الكواليس.', folderId: 'ideas', originalFolderId: null, createdAt: daysAgo(5), updatedAt: daysAgo(2, 9, 5), deletedAt: null },
  { id: 'n4', title: 'مقهى هادئ للعمل', body: 'قائمة بأماكن مريحة فيها إضاءة طبيعية وإنترنت جيد للاجتماعات الصباحية.', folderId: 'personal', originalFolderId: null, createdAt: daysAgo(12), updatedAt: daysAgo(3, 13, 25), deletedAt: null },
  { id: 'n5', title: 'قائمة قراءة الصيف', body: 'كتاب عن العادات، رواية قصيرة، ومقال طويل عن أثر المساحات الهادئة.', folderId: 'personal', originalFolderId: null, createdAt: daysAgo(20), updatedAt: daysAgo(5, 18, 45), deletedAt: null },
  { id: 'n6', title: 'ملاحظة سريعة', body: 'اسأل عن موعد الرحلة القادمة وتحقق من حالة الطقس قبل الحجز.', folderId: null, originalFolderId: null, createdAt: daysAgo(2), updatedAt: daysAgo(0, 0, 5), deletedAt: null },
  { id: 'n7', title: 'تحسين روتين الصباح', body: 'إبعاد الهاتف أول نصف ساعة، شرب الماء، وكتابة أهم مهمة لليوم.', folderId: 'ideas', originalFolderId: null, createdAt: daysAgo(10), updatedAt: daysAgo(6, 7, 30), deletedAt: null },
  { id: 'n8', title: 'مشتريات المنزل', body: 'مصابيح دافئة، نبات صغير للمكتب، ودفتر ملاحظات جديد.', folderId: null, originalFolderId: null, createdAt: daysAgo(4), updatedAt: daysAgo(1, 21, 10), deletedAt: null },
  { id: 'n9', title: 'رحلة مؤجلة', body: 'مقارنة الخيارات والعودة إلى الميزانية بعد الهدوء.', folderId: null, originalFolderId: 'personal', createdAt: daysAgo(28), updatedAt: daysAgo(24), deletedAt: daysAgo(4) },
  { id: 'n10', title: 'مسودة قديمة', body: 'أفكار لم تعد أولوية، يمكن الاحتفاظ بها للمراجعة لاحقاً.', folderId: 'ideas', originalFolderId: 'ideas', createdAt: daysAgo(40), updatedAt: daysAgo(38), deletedAt: daysAgo(31) },
]

export const seedTasks: Task[] = [
  { id: 't1', text: 'مراجعة صفحة الهبوط', done: false, createdAt: daysAgo(1) },
  { id: 't2', text: 'إرسال ملخص الاجتماع', done: false, createdAt: daysAgo(2) },
  { id: 't3', text: 'حجز موعد الطبيب', done: false, createdAt: daysAgo(3) },
  { id: 't4', text: 'شراء نبات للمكتب', done: true, createdAt: daysAgo(5) },
  { id: 't5', text: 'تحديث قائمة القراءة', done: true, createdAt: daysAgo(6) },
  { id: 't6', text: 'ترتيب ملفات المشروع', done: false, createdAt: daysAgo(7) },
]

export const formatNoteDate = (timestamp: number): string => {
  const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
  const date = new Date(timestamp)
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${date.getDate()} ${arabicMonths[date.getMonth()]} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
