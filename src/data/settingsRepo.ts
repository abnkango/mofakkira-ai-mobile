import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import type { Settings } from '../domain'
import { initialSettings } from '../domain'

const settingsKey = 'mofakkira.settings.v1'
const apiKeyKey = 'mofakkira.api-key.v1'

export const settingsRepo = {
  async read(): Promise<Settings> {
    const raw = await AsyncStorage.getItem(settingsKey)
    if (!raw) return initialSettings
    try { return { ...initialSettings, ...(JSON.parse(raw) as Partial<Settings>) } } catch { return initialSettings }
  },
  async write(patch: Partial<Settings>): Promise<Settings> {
    const next = { ...(await settingsRepo.read()), ...patch }
    await AsyncStorage.setItem(settingsKey, JSON.stringify(next))
    return next
  },
  async readApiKey(): Promise<string> { return (await SecureStore.getItemAsync(apiKeyKey)) ?? '' },
  async saveApiKey(value: string): Promise<void> { await SecureStore.setItemAsync(apiKeyKey, value) },
  async deleteApiKey(): Promise<void> { await SecureStore.deleteItemAsync(apiKeyKey) },
}
