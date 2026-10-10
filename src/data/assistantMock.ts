export const assistantMock = (text: string, openTasks: string[]): string => {
  const clean = text.trim()
  if (clean.includes('المهام')) {
    return openTasks.length > 0 ? `لديك ${openTasks.length} مهام غير منجزة. اقترح البدء بـ«${openTasks[0]}».` : 'رائع، لا توجد مهام غير منجزة حالياً.'
  }
  if (clean.includes('لخّص')) return 'في هذا النطاق، تدور ملاحظاتك حول التخطيط وترتيب الخطوات العملية. أقرب ملاحظة لذلك هي:'
  if (clean.includes('أركز')) return 'ركّز اليوم على مهمة واحدة من العمل، ثم خصص وقتاً قصيراً لترتيب ما بعدها.'
  return 'ابدأ بمهمة واحدة واضحة، ثم اترك مساحة لبقية اليوم. يبدو أن أفضل خطوة الآن هي مراجعة ما هو قريب من موعده.'
}
