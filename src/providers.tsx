import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren, type ReactElement } from 'react'
import { useColorScheme, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import type { Palette } from './theme'
import { resolvePalette } from './theme'
import type { Settings, ThemeMode } from './domain'
import { initialSettings } from './domain'
import { settingsRepo } from './data/settingsRepo'

const SettingsContext = createContext<Settings | null>(null)
const SettingsActionsContext = createContext<((patch: Partial<Settings>) => Promise<void>) | null>(null)

export type ThemeContextValue = { mode: ThemeMode; palette: Palette; setMode: (mode: ThemeMode) => void }
const ThemeContext = createContext<ThemeContextValue | null>(null)

const SettingsProvider = ({ children }: PropsWithChildren): ReactElement => {
  const [settings, setSettings] = useState<Settings>(initialSettings)
  useEffect(() => { settingsRepo.read().then(setSettings).catch(() => undefined) }, [])
  const update = async (patch: Partial<Settings>): Promise<void> => { setSettings(await settingsRepo.write(patch)) }
  return <SettingsContext.Provider value={settings}><SettingsActionsContext.Provider value={update}>{children}</SettingsActionsContext.Provider></SettingsContext.Provider>
}

export const useSettings = (): Settings => {
  const value = useContext(SettingsContext)
  if (!value) throw new Error('useSettings must be used inside SettingsProvider')
  return value
}

export const useUpdateSettings = (): ((patch: Partial<Settings>) => Promise<void>) => {
  const value = useContext(SettingsActionsContext)
  if (!value) throw new Error('useUpdateSettings must be used inside SettingsProvider')
  return value
}

export const ThemeProvider = ({ children }: PropsWithChildren): ReactElement => {
  const systemScheme = useColorScheme()
  const { theme: mode } = useSettings()
  const updateSettings = useUpdateSettings()
  const palette = useMemo(() => resolvePalette(mode, systemScheme === 'dark'), [mode, systemScheme])
  const setMode = (nextMode: ThemeMode): void => { void updateSettings({ theme: nextMode }) }
  return <ThemeContext.Provider value={{ mode, palette, setMode }}><View style={{ flex: 1, backgroundColor: palette.bg }}>{children}</View></ThemeContext.Provider>
}

export const useTheme = (): ThemeContextValue => {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme must be used inside ThemeProvider')
  return value
}

export const AppProviders = ({ children }: PropsWithChildren): ReactElement => <SafeAreaProvider><SettingsProvider><ThemeProvider>{children}</ThemeProvider></SettingsProvider></SafeAreaProvider>
