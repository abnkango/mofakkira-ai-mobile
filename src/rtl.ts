import AsyncStorage from '@react-native-async-storage/async-storage'
import { I18nManager } from 'react-native'
import * as Updates from 'expo-updates'

const reloadMarker = 'mofakkira.rtl.reload-attempted.v1'

I18nManager.allowRTL(true)

const configureRtl = async (): Promise<void> => {
  if (I18nManager.isRTL) return
  I18nManager.forceRTL(true)
  const attempted = await AsyncStorage.getItem(reloadMarker)
  if (attempted === '1') {
    console.warn('[mofakkira] RTL was not reported as enabled after the single permitted reload attempt. No further reload will run, so the app will continue without getting stuck. Restart Expo Go if the layout is not right.')
    return
  }
  await AsyncStorage.setItem(reloadMarker, '1')
  try {
    await Updates.reloadAsync()
  } catch (error) {
    console.warn('[mofakkira] The single RTL reload attempt failed. No retry will run; the app will continue without getting stuck.', error)
  }
}

void configureRtl().catch((error) => {
  console.warn('[mofakkira] RTL setup failed. The app will continue without another reload attempt.', error)
})
