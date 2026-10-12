import '../src/rtl'
import '../src/typography'
import { useEffect, useState, type ReactElement } from 'react'
import { BackHandler, Text, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Stack, usePathname, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { useFonts, Tajawal_400Regular, Tajawal_500Medium, Tajawal_700Bold } from '@expo-google-fonts/tajawal'
import { AppProviders, useTheme } from '../src/providers'
import { AppStateProvider, useAppState } from '../src/appState'
import { goBackOrNotes } from '../src/navigation'
import { initializeDatabase } from '../src/data/database'
import { Toast } from '../src/components/Controls'

SplashScreen.preventAutoHideAsync().catch(() => undefined)

const Navigation = (): ReactElement => {
  const { palette } = useTheme()
  const { ready, error, operationError, clearOperationError } = useAppState()
  useEffect(() => { if (!operationError) return; const timer = setTimeout(clearOperationError, 2600); return () => clearTimeout(timer) }, [clearOperationError, operationError])
  if (error) return <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}><Text style={{ color: palette.text, fontFamily: 'Tajawal_700Bold', fontSize: 18, textAlign: 'center' }}>تعذر تحميل بيانات المفكرة</Text><Text style={{ color: palette.muted, fontFamily: 'Tajawal_400Regular', marginTop: 10, textAlign: 'center' }}>{error}</Text></View>
  if (!ready) return <View style={{ flex: 1, backgroundColor: palette.bg }} />
  return <><AndroidBackHandler /><StatusBar style={palette.bg === '#151614' ? 'light' : 'dark'} /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg } }} />{operationError && <Toast message={operationError} />}</>
}

const AndroidBackHandler = (): null => {
  const pathname = usePathname(); const router = useRouter(); const { saveNoteOnExit } = useAppState()
  useEffect(() => BackHandler.addEventListener('hardwareBackPress', () => { if (pathname === '/notes' || pathname === '/') return false; if (pathname.startsWith('/note/')) { const noteId = pathname.slice('/note/'.length); void saveNoteOnExit(noteId).then(() => goBackOrNotes(router)); return true }; goBackOrNotes(router); return true }).remove, [pathname, router, saveNoteOnExit])
  return null
}

export default function RootLayout(): ReactElement | null {
  const [fontsLoaded] = useFonts({ Tajawal_400Regular, Tajawal_500Medium, Tajawal_700Bold })
  const [databaseReady, setDatabaseReady] = useState(false)
  const [databaseError, setDatabaseError] = useState<string | null>(null)
  useEffect(() => { if (!fontsLoaded) return; initializeDatabase().then(() => setDatabaseReady(true)).catch((error: unknown) => setDatabaseError(error instanceof Error ? error.message : 'تعذر فتح قاعدة البيانات')).finally(() => SplashScreen.hideAsync().catch(() => undefined)) }, [fontsLoaded])
  if (!fontsLoaded || (!databaseReady && !databaseError)) return <View style={{ flex: 1, backgroundColor: '#F7F7F5' }}><Text style={{ opacity: 0 }}>تحميل</Text></View>
  if (databaseError) return <View style={{ flex: 1, backgroundColor: '#F7F7F5', alignItems: 'center', justifyContent: 'center', padding: 24 }}><Text style={{ color: '#252622', fontFamily: 'Tajawal_700Bold', fontSize: 18, textAlign: 'center' }}>تعذر فتح بيانات المفكرة</Text><Text style={{ color: '#777970', fontFamily: 'Tajawal_400Regular', marginTop: 10, textAlign: 'center' }}>{databaseError}</Text></View>
  return <GestureHandlerRootView style={{ flex: 1 }}><AppProviders><AppStateProvider><Navigation /></AppStateProvider></AppProviders></GestureHandlerRootView>
}
