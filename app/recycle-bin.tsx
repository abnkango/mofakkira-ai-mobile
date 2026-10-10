import { useMemo, useState, type ReactElement } from 'react'
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Recycle, Trash2 } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ScreenHeader } from '../src/components/ScreenHeader'
import { Button, Card } from '../src/components/Primitives'
import { useAppState } from '../src/appState'
import { useTheme } from '../src/providers'

export default function RecycleBinScreen(): ReactElement {
  const { notes, restoreNote, permanentlyDeleteNote } = useAppState(); const { palette } = useTheme(); const insets = useSafeAreaInsets(); const [currentTime] = useState(() => Date.now()); const deleted = useMemo(() => notes.filter((note) => note.deletedAt !== null), [notes]); const days = (timestamp: number): number => Math.max(0, 30 - Math.floor((currentTime - timestamp) / 86_400_000))
  const permanent = (id: string): void => Alert.alert('حذف نهائي؟', 'لا يمكن التراجع عن حذف هذه الملاحظة نهائياً.', [{ text: 'إلغاء', style: 'cancel' }, { text: 'حذف نهائي', style: 'destructive', onPress: () => permanentlyDeleteNote(id) }])
  return <View style={[styles.screen, { backgroundColor: palette.bg, paddingTop: insets.top + 16 }]}><ScreenHeader title="سلة المحذوفات" /><FlatList data={deleted} keyExtractor={(item) => item.id} contentContainerStyle={{ gap: 10, paddingBottom: 30 }} renderItem={({ item }) => <Card style={styles.card}><View style={styles.main}><View><Text style={[styles.title, { color: palette.text }]}>{item.title || 'ملاحظة بلا عنوان'}</Text><Text style={{ color: palette.danger, fontFamily: 'Tajawal_400Regular' }}>تبقى {days(item.deletedAt ?? currentTime)} يومًا</Text></View><Trash2 size={18} color={palette.muted} /></View><View style={styles.actions}><Button onPress={() => restoreNote(item.id)}>استعادة</Button><Pressable onPress={() => permanent(item.id)}><Text style={{ color: palette.danger, fontFamily: 'Tajawal_700Bold' }}>حذف نهائي</Text></Pressable></View></Card>} ListEmptyComponent={<View style={styles.empty}><Recycle size={31} color={palette.accent} /><Text style={{ color: palette.muted, fontFamily: 'Tajawal_400Regular' }}>سلة المحذوفات فارغة</Text></View>} /></View>
}

const styles = StyleSheet.create({ screen: { flex: 1, paddingHorizontal: 16 }, card: { padding: 15, gap: 12 }, main: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, title: { fontFamily: 'Tajawal_700Bold', fontSize: 16, textAlign: 'right', marginBottom: 5 }, actions: { flexDirection: 'row', alignItems: 'center', gap: 12 }, empty: { alignItems: 'center', gap: 12, paddingTop: 38 },
})
