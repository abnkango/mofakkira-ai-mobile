export const formatNoteDate = (timestamp: number): string => {
  const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
  const date = new Date(timestamp)
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${date.getDate()} ${arabicMonths[date.getMonth()]} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
