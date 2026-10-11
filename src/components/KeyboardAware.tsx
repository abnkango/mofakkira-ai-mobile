import { KeyboardAvoidingView, Platform, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { PropsWithChildren, ReactElement } from 'react'

export const KeyboardAwareView = ({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>): ReactElement => {
  const insets = useSafeAreaInsets()
  return <KeyboardAvoidingView behavior="padding" enabled keyboardVerticalOffset={insets.top} style={[styles.root, style]}>{children}</KeyboardAvoidingView>
}

export const KeyboardAwareDialog = ({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>): ReactElement => {
  const insets = useSafeAreaInsets()
  return <KeyboardAvoidingView behavior={Platform.OS === 'android' ? 'padding' : 'padding'} enabled keyboardVerticalOffset={insets.top} style={[styles.dialog, style]}>{children}</KeyboardAvoidingView>
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  dialog: { flex: 1, justifyContent: 'flex-end' },
})
