import '../src/rtl'
import '../src/typography'
import { useEffect, type ReactElement } from 'react'
import { BackHandler, Text, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Stack, usePathname, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { useFonts, Tajawal_400Regular, Tajawal_500Medium, Tajawal_700Bold } from '@expo-google-fonts/tajawal'
import { AppProviders, useTheme } from '../src/providers'
import { AppStateProvider } from '../src/appState'
import { goBackOrNotes } from '../src/navigation'

SplashScreen.preventAutoHideAsync().catch(() => undefined)

const Navigation = (): ReactElement => {
  const { palette } = useTheme()
  return <><AndroidBackHandler /><StatusBar style={palette.bg === '#151614' ? 'light' : 'dark'} /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg } }} /></>
}

const AndroidBackHandler = (): null => {
  const pathname = usePathname(); const router = useRouter()
  useEffect(() => BackHandler.addEventListener('hardwareBackPress', () => { if (pathname === '/notes' || pathname === '/') return false; goBackOrNotes(router); return true }).remove, [pathname, router])
  return null
}

export default function RootLayout(): ReactElement | null {
  const [fontsLoaded] = useFonts({ Tajawal_400Regular, Tajawal_500Medium, Tajawal_700Bold })
  useEffect(() => { if (fontsLoaded) SplashScreen.hideAsync().catch(() => undefined) }, [fontsLoaded])
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: '#F7F7F5' }}><Text style={{ opacity: 0 }}>تحميل</Text></View>
  return <GestureHandlerRootView style={{ flex: 1 }}><AppProviders><AppStateProvider><Navigation /></AppStateProvider></AppProviders></GestureHandlerRootView>
}
