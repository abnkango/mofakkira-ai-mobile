import { Modal, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native'
import { Plus, Sparkles } from 'lucide-react-native'
import type { ReactElement, ReactNode } from 'react'
import { useTheme } from '../providers'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { shadows } from '../theme'

export const Input = (props: TextInputProps): ReactElement => {
  const { palette } = useTheme()
  const singleLine = props.multiline !== true
  return <TextInput {...props} placeholderTextColor={palette.muted} style={[styles.input, singleLine && styles.singleLineInput, { backgroundColor: palette.surface, borderColor: palette.border, color: palette.text }, props.style]} />
}

export const Checkbox = ({ checked, onPress, label }: { checked: boolean; onPress: () => void; label?: string }): ReactElement => {
  const { palette } = useTheme()
  return <Pressable onPress={onPress} style={styles.row}><View style={[styles.checkbox, { borderColor: checked ? palette.accent : palette.muted, backgroundColor: checked ? palette.accent : 'transparent' }]}>{checked && <Text style={{ color: '#FFFFFF' }}>✓</Text>}</View>{label && <Text style={{ color: palette.text, fontFamily: 'Tajawal_500Medium' }}>{label}</Text>}</Pressable>
}

export const FAB = ({ label, onPress, side = 'start' }: { label: string; onPress: () => void; side?: 'start' | 'end' }): ReactElement => {
  const { palette } = useTheme()
  const isNew = side === 'start'
  return <Pressable accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.fab, isNew ? { start: 18, backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1 } : { end: 18, backgroundColor: palette.accent }, shadows.fab, pressed && styles.pressed]}>{isNew ? <Plus size={25} color={palette.accent} /> : <Sparkles size={21} color="#FFFFFF" />}</Pressable>
}

export const BottomNav = ({ active, onChange }: { active: 'notes' | 'tasks'; onChange: (value: 'notes' | 'tasks') => void }): ReactElement => {
  const { palette } = useTheme(); const insets = useSafeAreaInsets()
  return <View style={[styles.bottomNav, { backgroundColor: palette.surface, borderColor: palette.border, marginBottom: Math.max(insets.bottom, 18) }]}><Pressable onPress={() => onChange('notes')} style={[styles.navItem, active === 'notes' && { backgroundColor: palette.accentBg }]}><Text style={{ color: active === 'notes' ? palette.accent : palette.muted, fontFamily: 'Tajawal_700Bold' }}>الملاحظات</Text></Pressable><Pressable onPress={() => onChange('tasks')} style={[styles.navItem, active === 'tasks' && { backgroundColor: palette.accentBg }]}><Text style={{ color: active === 'tasks' ? palette.accent : palette.muted, fontFamily: 'Tajawal_700Bold' }}>المهام</Text></Pressable></View>
}

export const Toast = ({ message }: { message: string }): ReactElement => { const { palette } = useTheme(); return <View style={[styles.toast, { backgroundColor: palette.text }]}><Text style={{ color: palette.bg, fontFamily: 'Tajawal_700Bold' }}>{message}</Text></View> }

export const Dialog = ({ visible, title, children, onClose }: { visible: boolean; title: string; children: ReactNode; onClose: () => void }): ReactElement => { const { palette } = useTheme(); return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><Pressable style={styles.backdrop} onPress={onClose}><View style={[styles.dialog, { backgroundColor: palette.surface }]}><Text style={[styles.dialogTitle, { color: palette.text }]}>{title}</Text>{children}</View></Pressable></Modal> }

export const Sheet = ({ visible, children, onClose }: { visible: boolean; children: ReactNode; onClose: () => void }): ReactElement => { const { palette } = useTheme(); return <Modal visible={visible} animationType="slide" onRequestClose={onClose}><View style={[styles.sheet, { backgroundColor: palette.bg }]}>{children}</View></Modal> }

const styles = StyleSheet.create({
  input: { height: 48, borderWidth: 1, borderRadius: 14, paddingHorizontal: 15, fontFamily: 'Tajawal_400Regular', fontSize: 15, textAlign: 'right', writingDirection: 'rtl' }, singleLineInput: { paddingVertical: 0, includeFontPadding: false, textAlignVertical: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', bottom: 84, width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', zIndex: 4 },
  bottomNav: { height: 60, marginHorizontal: 12, marginBottom: 12, padding: 5, borderWidth: 1, borderRadius: 20, flexDirection: 'row', gap: 5 },
  navItem: { flex: 1, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  toast: { position: 'absolute', bottom: 82, start: 18, end: 18, borderRadius: 13, padding: 12, alignItems: 'center', zIndex: 12 },
  backdrop: { flex: 1, backgroundColor: '#14161361', justifyContent: 'flex-end' },
  dialog: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22 },
  dialogTitle: { fontSize: 19, fontFamily: 'Tajawal_700Bold', marginBottom: 12, textAlign: 'right' },
  sheet: { flex: 1 },
  pressed: { opacity: 0.75 },
})
