import { StyleSheet } from 'react-native'
import type { ThemeMode } from './domain'

export type Palette = {
  bg: string
  surface: string
  surface2: string
  text: string
  muted: string
  accent: string
  accentBg: string
  border: string
  danger: string
}

export const lightPalette: Palette = {
  bg: '#F7F7F5', surface: '#FFFFFF', surface2: '#F0F0ED', text: '#252622',
  muted: '#777970', accent: '#687A62', accentBg: '#E8EEE4', border: '#E6E6E0', danger: '#C94C4C',
}

export const darkPalette: Palette = {
  bg: '#151614', surface: '#20211E', surface2: '#292A26', text: '#F1F1EC',
  muted: '#A2A49B', accent: '#A6B89A', accentBg: '#30392D', border: '#34352F', danger: '#F07878',
}

export const shadows = StyleSheet.create({
  card: { shadowColor: '#000000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  fab: { shadowColor: '#000000', shadowOpacity: 0.14, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
})

export const resolvePalette = (mode: ThemeMode, systemDark: boolean): Palette => {
  if (mode === 'dark' || (mode === 'auto' && systemDark)) return darkPalette
  return lightPalette
}
