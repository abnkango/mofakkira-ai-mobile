import { useMemo, useState, type ReactElement } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Check, ListTodo, Plus } from 'lucide-react-native'
import { PanGestureHandler, type HandlerStateChangeEvent } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TabsShell } from '../src/components/TabsShell'
import { ScreenHeader } from '../src/components/ScreenHeader'
import { IconButton } from '../src/components/Primitives'
import { Input } from '../src/components/Controls'
import { useAppState } from '../src/appState'
import { useTheme } from '../src/providers'

type Filter = 'all' | 'open' | 'done'

export default function TasksScreen(): ReactElement {
  const { tasks, addTask, toggleTask, deleteTask } = useAppState(); const { palette } = useTheme(); const insets = useSafeAreaInsets(); const [value, setValue] = useState(''); const [filter, setFilter] = useState<Filter>('all')
  const shown = useMemo(() => [...tasks].filter((task) => filter === 'all' || (filter === 'open' ? !task.done : task.done)).sort((a, b) => Number(a.done) - Number(b.done)), [filter, tasks])
  const submit = async (): Promise<void> => { if (value.trim()) { await addTask(value); setValue('') } }
  return <TabsShell><View style={[styles.screen, { backgroundColor: palette.bg, paddingTop: insets.top + 16 }]}><ScreenHeader title="المهام" /><View style={styles.add}><Input value={value} onChangeText={setValue} onSubmitEditing={submit} returnKeyType="done" placeholder="أضف مهمة سريعة" style={styles.addInput} /><IconButton accessibilityLabel="إضافة مهمة" onPress={submit} style={{ backgroundColor: palette.accent, borderColor: palette.accent }}><Plus size={21} color="#FFFFFF" /></IconButton></View><View style={[styles.filters, { backgroundColor: palette.surface2 }]}>{[['all', 'الكل'], ['open', 'غير المنجزة'], ['done', 'المنجزة']].map(([key, label]) => <Pressable key={key} onPress={() => setFilter(key as Filter)} style={[styles.filter, filter === key && { backgroundColor: palette.surface }]}><Text style={{ color: filter === key ? palette.text : palette.muted, fontFamily: 'Tajawal_700Bold', fontSize: 13 }}>{label}</Text></Pressable>)}</View><FlatList data={shown} keyExtractor={(item) => item.id} contentContainerStyle={{ paddingBottom: 160, gap: 10 }} renderItem={({ item }) => <TaskRow id={item.id} text={item.text} done={item.done} onToggle={toggleTask} onDelete={deleteTask} />} ListEmptyComponent={<View style={styles.empty}><ListTodo size={30} color={palette.accent} /><Text style={{ color: palette.muted, fontFamily: 'Tajawal_400Regular' }}>لا توجد مهام {filter === 'open' ? 'غير منجزة' : filter === 'done' ? 'منجزة' : ''}</Text></View>} /></View></TabsShell>
}

const TaskRow = ({ id, text, done, onToggle, onDelete }: { id: string; text: string; done: boolean; onToggle: (id: string) => void; onDelete: (id: string) => void }): ReactElement => { const { palette } = useTheme(); const onGesture = (event: HandlerStateChangeEvent): void => { if (Math.abs(Number(event.nativeEvent.translationX ?? 0)) > 80) void onDelete(id) }; return <PanGestureHandler onEnded={onGesture} activeOffsetX={[-20, 20]}><View style={[styles.task, { backgroundColor: palette.surface, borderColor: palette.border }]}><Pressable accessibilityLabel={done ? 'إلغاء الإنجاز' : 'إنجاز المهمة'} onPress={() => onToggle(id)} style={[styles.checkbox, { borderColor: done ? palette.accent : palette.muted, backgroundColor: done ? palette.accent : 'transparent' }]}>{done && <Check size={15} color="#FFFFFF" />}</Pressable><Text style={[styles.taskText, { color: done ? palette.muted : palette.text, textDecorationLine: done ? 'line-through' : 'none' }]}>{text}</Text></View></PanGestureHandler> }

const styles = StyleSheet.create({ screen: { flex: 1, paddingHorizontal: 16 }, add: { flexDirection: 'row', gap: 9, marginBottom: 18 }, addInput: { flex: 1 }, filters: { flexDirection: 'row', padding: 4, borderRadius: 14, gap: 3, marginBottom: 14 }, filter: { flex: 1, minHeight: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, task: { minHeight: 58, borderWidth: 1, borderRadius: 16, paddingHorizontal: 15, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 11 }, checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' }, taskText: { flex: 1, fontFamily: 'Tajawal_700Bold', lineHeight: 26, textAlign: 'right' }, empty: { alignItems: 'center', gap: 12, paddingTop: 38 },
})
