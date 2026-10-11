import { ScrollView, StyleSheet } from 'react-native'
import type { PropsWithChildren, ReactElement } from 'react'

export const HorizontalScrollRow = ({ children, style }: PropsWithChildren<{ style?: object }>): ReactElement => <ScrollView horizontal showsHorizontalScrollIndicator={false} directionalLockEnabled contentContainerStyle={styles.content} style={[styles.row, style]}>{children}</ScrollView>

const styles = StyleSheet.create({
  row: { direction: 'rtl' },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 1 },
})
