import { Pressable, StyleSheet, Text, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native'
import type { ReactElement, ReactNode } from 'react'
import { useTheme } from '../providers'

export const Button = ({ children, variant = 'primary', style, ...props }: PressableProps & { variant?: 'primary' | 'ghost'; children: string; style?: StyleProp<ViewStyle> }): ReactElement => {
  const { palette } = useTheme()
  return <Pressable {...props} style={({ pressed }) => [styles.button, variant === 'primary' ? { backgroundColor: palette.accent } : { backgroundColor: 'transparent' }, style, pressed && styles.pressed]}><Text style={[styles.buttonText, { color: variant === 'primary' ? '#FFFFFF' : palette.muted }]}>{children}</Text></Pressable>
}

export const IconButton = ({ children, style, ...props }: PressableProps & { children: ReactElement; style?: StyleProp<ViewStyle> }): ReactElement => {
  const { palette } = useTheme()
  return <Pressable {...props} style={({ pressed }) => [styles.iconButton, { backgroundColor: palette.surface, borderColor: palette.border }, style, pressed && styles.pressed]}>{children}</Pressable>
}

export const Card = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }): ReactElement => {
  const { palette } = useTheme()
  return <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }, style]}>{children}</View>
}

export const Chip = ({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }): ReactElement => {
  const { palette } = useTheme()
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, { backgroundColor: active ? palette.accent : palette.surface, borderColor: active ? palette.accent : palette.border }, pressed && styles.pressed]}><Text numberOfLines={1} style={[styles.chipText, { color: active ? '#FFFFFF' : palette.muted }]}>{label}</Text></Pressable>
}

const styles = StyleSheet.create({
  button: { minHeight: 48, borderRadius: 15, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: 'Tajawal_700Bold', fontSize: 15 },
  iconButton: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  card: { borderWidth: 1, borderRadius: 16 },
  chip: { minHeight: 40, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontFamily: 'Tajawal_700Bold', fontSize: 14, lineHeight: 22, textAlign: 'right', writingDirection: 'rtl' },
  pressed: { opacity: 0.75 },
})
