import { I18nManager } from 'react-native'
import * as Updates from 'expo-updates'

I18nManager.allowRTL(true)
if (!I18nManager.isRTL) {
  I18nManager.forceRTL(true)
  void Updates.reloadAsync().catch(() => undefined)
}
