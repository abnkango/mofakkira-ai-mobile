import { usePathname, useRouter } from 'expo-router'
import { View } from 'react-native'
import { BottomNav, FAB } from './Controls'
import { useTheme } from '../providers'
import { useAppState } from '../appState'
import { KeyboardAwareView } from './KeyboardAware'
import type { ReactElement, PropsWithChildren } from 'react'

export const TabsShell = ({ children }: PropsWithChildren): ReactElement => {
  const router = useRouter()
  const path = usePathname()
  const { palette } = useTheme()
  const { createNote } = useAppState()
  const active = path.includes('tasks') ? 'tasks' : 'notes'
  const createAndOpen = async (): Promise<void> => { const note = await createNote(null); router.push(`/note/${note.id}`) }
  return <View style={{ flex: 1, backgroundColor: palette.bg }}><KeyboardAwareView><View style={{ flex: 1 }}>{children}</View></KeyboardAwareView>{active === 'notes' && <FAB label="ملاحظة جديدة" side="start" onPress={createAndOpen} />}<FAB label="المساعد" side="end" onPress={() => router.push({ pathname: '/assistant', params: { from: active } })} /><BottomNav active={active} onChange={(value) => router.replace(`/${value}`)} /></View>
}
