import '../src/rtl'
import { useEffect, type ReactElement } from 'react'
import { Text, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { useFonts, Tajawal_400Regular, Tajawal_500Medium, Tajawal_700Bold } from '@expo-google-fonts/tajawal'
import { AppProviders, useTheme } from '../src/providers'

SplashScreen.preventAutoHideAsync().catch(() => undefined)

const Navigation = (): ReactElement => {
  const { palette } = useTheme()
  return <><StatusBar style={palette.bg === '#151614' ? 'light' : 'dark'} /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg } }} /></>
}

export default function RootLayout(): ReactElement | null {
  const [fontsLoaded] = useFonts({ Tajawal_400Regular, Tajawal_500Medium, Tajawal_700Bold })
  useEffect(() => { if (fontsLoaded) SplashScreen.hideAsync().catch(() => undefined) }, [fontsLoaded])
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: '#F7F7F5' }}><Text style={{ opacity: 0 }}>تحميل</Text></View>
  return <GestureHandlerRootView style={{ flex: 1 }}><AppProviders><Navigation /></AppProviders></GestureHandlerRootView>
}
