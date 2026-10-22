import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import type { AIProvider, Settings } from '../domain'
import { initialSettings } from '../domain'

const settingsKey = 'mofakkira.settings.v1'
const legacyApiKeyKey = 'mofakkira.api-key.v1'
const apiKeyKey = (provider: AIProvider): string => `mofakkira.api-key.v2.${provider.toLowerCase()}`
const rtlReloadMarker = 'mofakkira.rtl.reload-attempted.v1'

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
  async readApiKey(provider: AIProvider = 'Gemini'): Promise<string> {
    const key = apiKeyKey(provider)
    const saved = await SecureStore.getItemAsync(key)
    if (saved !== null) return saved
    if (provider !== 'Gemini') return ''
    const legacy = await SecureStore.getItemAsync(legacyApiKeyKey)
    if (legacy === null) return ''
    await SecureStore.setItemAsync(key, legacy)
    await SecureStore.deleteItemAsync(legacyApiKeyKey)
    return legacy
  },
  async saveApiKey(value: string, provider: AIProvider = 'Gemini'): Promise<void> { await SecureStore.setItemAsync(apiKeyKey(provider), value) },
  async deleteApiKey(provider: AIProvider = 'Gemini'): Promise<void> { await SecureStore.deleteItemAsync(apiKeyKey(provider)) },
  async reset(): Promise<void> {
    await AsyncStorage.multiRemove([settingsKey, rtlReloadMarker])
    await Promise.all([SecureStore.deleteItemAsync(legacyApiKeyKey), ...(['Gemini', 'Groq', 'Custom'] as const).map((provider) => SecureStore.deleteItemAsync(apiKeyKey(provider)))])
  },
}
