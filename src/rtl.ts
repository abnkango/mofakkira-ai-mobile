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
    console.warn('[mofakkira] RTL is still disabled after the one permitted reload attempt; continuing without another reload.')
    return
  }
  await AsyncStorage.setItem(reloadMarker, '1')
  try {
    await Updates.reloadAsync()
  } catch (error) {
    console.warn('[mofakkira] RTL reload attempt failed; continuing without retry.', error)
  }
}

void configureRtl().catch((error) => {
  console.warn('[mofakkira] RTL setup failed; continuing without reload.', error)
})
