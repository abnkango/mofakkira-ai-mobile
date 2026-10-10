import { useEffect, type ReactElement } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useAppState } from '../src/appState'
import { useSettings, useTheme } from '../src/providers'
import WelcomeScreen from '../src/screens/WelcomeScreen'

export default function IndexScreen(): ReactElement {
  const router = useRouter(); const { palette } = useTheme(); const settings = useSettings(); const { ready } = useAppState()
  useEffect(() => { if (ready && settings.welcomeDone) router.replace('/notes') }, [ready, router, settings.welcomeDone])
  if (!ready || settings.welcomeDone) return <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={palette.accent} /></View>
  return <WelcomeScreen />
}
