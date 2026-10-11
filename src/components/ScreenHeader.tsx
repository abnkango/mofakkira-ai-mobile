import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ArchiveRestore, ArrowRight, Folder, Settings } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useTheme } from '../providers'
import type { ReactElement } from 'react'
import { useGoBackOrNotes } from '../navigation'

type HeaderAction = 'settings' | 'folders' | 'recycle'
const labels: Record<HeaderAction, string> = { settings: 'الإعدادات', folders: 'المجلدات', recycle: 'سلة المحذوفات' }

export const ScreenHeader = ({ title, back = true, action, secondaryAction }: { title: string; back?: boolean; action?: HeaderAction; secondaryAction?: HeaderAction }): ReactElement => {
  const router = useRouter(); const goBack = useGoBackOrNotes(); const { palette } = useTheme()
  const renderAction = (value: HeaderAction): ReactElement => { const icon = value === 'settings' ? <Settings size={19} color={palette.muted} /> : value === 'folders' ? <Folder size={19} color={palette.muted} /> : <ArchiveRestore size={19} color={palette.muted} />; const route = value === 'settings' ? '/settings' : value === 'folders' ? '/folders' : '/recycle-bin'; return <Pressable key={value} accessibilityLabel={labels[value]} onPress={() => router.push(route)} style={[styles.icon, { backgroundColor: palette.surface, borderColor: palette.border }]}>{icon}</Pressable> }
  return <View style={styles.row}>{back ? <Pressable onPress={goBack} style={styles.back}><ArrowRight size={19} color={palette.muted} /><Text style={[styles.backText, { color: palette.muted }]}>رجوع</Text></Pressable> : <View style={styles.side} />}<Text pointerEvents="none" style={[styles.title, { color: palette.text }]}>{title}</Text><View style={styles.actions}>{action && renderAction(action)}{secondaryAction && renderAction(secondaryAction)}</View></View>
}

const styles = StyleSheet.create({ row: { position: 'relative', minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 }, title: { position: 'absolute', start: 0, end: 0, fontFamily: 'Tajawal_700Bold', fontSize: 25, textAlign: 'center', writingDirection: 'rtl' }, back: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 70, zIndex: 1 }, backText: { fontFamily: 'Tajawal_700Bold', fontSize: 15, textAlign: 'right', writingDirection: 'rtl' }, actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginStart: 'auto', zIndex: 1 }, icon: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, side: { width: 70 },
})
