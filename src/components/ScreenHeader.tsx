import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ArrowRight, Folder, Settings, Trash2 } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useTheme } from '../providers'
import type { ReactElement } from 'react'

export const ScreenHeader = ({ title, back = true, action }: { title: string; back?: boolean; action?: 'settings' | 'folders' | 'recycle' }): ReactElement => {
  const router = useRouter(); const { palette } = useTheme()
  const icon = action === 'settings' ? <Settings size={19} color={palette.muted} /> : action === 'folders' ? <Folder size={19} color={palette.muted} /> : <Trash2 size={19} color={palette.muted} />
  return <View style={styles.row}>{back ? <Pressable onPress={() => router.back()} style={styles.back}><ArrowRight size={19} color={palette.muted} /><Text style={[styles.backText, { color: palette.muted }]}>رجوع</Text></Pressable> : <View style={styles.side} />}<Text style={[styles.title, { color: palette.text }]}>{title}</Text>{action ? <Pressable accessibilityLabel={action === 'settings' ? 'الإعدادات' : action === 'folders' ? 'المجلدات' : 'سلة المحذوفات'} onPress={() => router.push(action === 'settings' ? '/settings' : action === 'folders' ? '/folders' : '/recycle-bin')} style={[styles.icon, { backgroundColor: palette.surface, borderColor: palette.border }]}>{icon}</Pressable> : <View style={styles.side} />}</View>
}

const styles = StyleSheet.create({ row: { height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }, title: { fontFamily: 'Tajawal_700Bold', fontSize: 25 }, back: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 70 }, backText: { fontFamily: 'Tajawal_700Bold', fontSize: 15 }, icon: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, side: { width: 70 },
})
