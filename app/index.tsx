import { StyleSheet, Text, View } from 'react-native'
import type { ReactElement } from 'react'
import { useTheme } from '../src/providers'
import { Card } from '../src/components/Primitives'
import { strings } from '../src/strings'

export default function FoundationScreen(): ReactElement {
  const { palette } = useTheme()
  return <View style={[styles.screen, { backgroundColor: palette.bg }]}><View style={styles.content}><Text style={[styles.brand, { color: palette.accent }]}>{strings.appName}</Text><Card style={styles.card}><Text style={[styles.title, { color: palette.text }]}>{strings.foundationPhase}</Text><Text style={[styles.body, { color: palette.muted }]}>{strings.foundationReady}</Text></Card></View></View>
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 64 },
  brand: { fontFamily: 'Tajawal_700Bold', fontSize: 32, textAlign: 'right', marginBottom: 24 },
  card: { padding: 18 },
  title: { fontFamily: 'Tajawal_700Bold', fontSize: 20, textAlign: 'right', marginBottom: 8 },
  body: { fontFamily: 'Tajawal_400Regular', fontSize: 16, textAlign: 'right', lineHeight: 28 },
})
