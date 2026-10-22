import { useEffect, useRef, useState, type ReactElement } from 'react'
import { Alert, FlatList, Keyboard, Pressable, StyleSheet, Text, View } from 'react-native'
import { Send, Settings, Sparkles, X } from 'lucide-react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Input } from '../src/components/Controls'
import { KeyboardAwareView } from '../src/components/KeyboardAware'
import { IconButton } from '../src/components/Primitives'
import { HorizontalScrollRow } from '../src/components/HorizontalScrollRow'
import { useAppState } from '../src/appState'
import { useSettings, useTheme, useUpdateSettings } from '../src/providers'
import type { Note } from '../src/domain'
import { useGoBackOrNotes } from '../src/navigation'
import { AssistantError, chat, type ChatMessage } from '../src/assistant/client'
import { buildAnswerMessages, buildMetadataPrompt, boundNotes, latestCandidates, localSearchFallback, parseRelevantIds, parseSourceIds, type CandidateNote } from '../src/assistant/assistantService'
import { getProviderConfig } from '../src/assistant/providerConfig'

type Message = { id: string; role: 'user' | 'assistant'; text: string; sourceIds?: string[]; error?: boolean; retryQuestion?: string }
const suggestions = ['ما المهام غير المنجزة؟', 'لخّص ملاحظات هذا المجلد', 'على ماذا أركز اليوم؟']
const noNotesText = 'لا توجد ملاحظات في هذا النطاق بعد.'
let messageSequence = 0
const nextMessageId = (): string => `message-${++messageSequence}`

export default function AssistantScreen(): ReactElement {
  const { from } = useLocalSearchParams<{ from?: string }>(); const router = useRouter(); const goBack = useGoBackOrNotes(); const { notes, folders, apiKey, selectedNotesFolderId } = useAppState(); const settings = useSettings(); const updateSettings = useUpdateSettings(); const { palette } = useTheme(); const insets = useSafeAreaInsets(); const [scope, setScope] = useState<'folder' | 'all'>(from === 'tasks' ? 'all' : 'folder'); const [value, setValue] = useState(''); const [loading, setLoading] = useState(false); const [keyboardVisible, setKeyboardVisible] = useState(false); const [messages, setMessages] = useState<Message[]>([{ id: 'welcome', role: 'assistant', text: 'مرحباً، أنا هنا لأساعدك على ترتيب أفكارك وتحويلها إلى خطوات.' }]); const listRef = useRef<FlatList<Message>>(null); const controllerRef = useRef<AbortController | null>(null); const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controllerRef.current?.abort() } }, [])
  useEffect(() => { if (!settings.privacyNoticeAcknowledged) Alert.alert('قبل استخدام المساعد', 'ملاحظاتك تُرسل إلى مزود الذكاء الاصطناعي عند استخدام المساعد', [{ text: 'فهمت', onPress: () => void updateSettings({ privacyNoticeAcknowledged: true }) }]) }, [settings.privacyNoticeAcknowledged, updateSettings])
  useEffect(() => { const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true)); const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false)); return () => { show.remove(); hide.remove() } }, [])
  const append = (message: Message): void => { if (mounted.current) setMessages((current) => [...current, message]) }
  const runQuery = async (question: string, includeUser: boolean): Promise<void> => {
    if (!apiKey || loading) return
    const controller = new AbortController(); controllerRef.current?.abort(); controllerRef.current = controller
    if (includeUser) append({ id: nextMessageId(), role: 'user', text: question })
    setLoading(true)
    try {
      const effectiveScope = { mode: scope, selectedFolderId: selectedNotesFolderId }
      const candidates = latestCandidates(notes, folders, effectiveScope, 300)
      if (!candidates.length) { append({ id: nextMessageId(), role: 'assistant', text: noNotesText }); return }
      const provider = getProviderConfig(settings)
      const totalContentLength = candidates.reduce((total, note) => total + note.title.length + note.body.length, 0)
      let selectedNotes: CandidateNote[]
      if (totalContentLength < 6000) selectedNotes = boundNotes(candidates)
      else {
        const metadataReply = await chat({ ...provider, apiKey, messages: buildMetadataPrompt(question, candidates, folders), signal: controller.signal, temperature: 0, maxTokens: 1200 })
        const ids = parseRelevantIds(metadataReply, new Set(candidates.map((note) => note.id)), 8)
        selectedNotes = ids === null ? localSearchFallback(question, candidates, 8) : ids.map((id) => candidates.find((note) => note.id === id)).filter((note): note is CandidateNote => Boolean(note))
        selectedNotes = boundNotes(selectedNotes)
      }
      if (!selectedNotes.length) { append({ id: nextMessageId(), role: 'assistant', text: 'لم أجد ملاحظات مرتبطة بهذا السؤال في النطاق المحدد.' }); return }
      const history: ChatMessage[] = messages.filter((message) => message.id !== 'welcome' && !message.error).slice(-6).map((message) => ({ role: message.role, content: message.text }))
      const answer = await chat({ ...provider, apiKey, messages: buildAnswerMessages(question, selectedNotes, folders, history), signal: controller.signal, temperature: 0.35, maxTokens: 1400 })
      const validIds = new Set(selectedNotes.map((note) => note.id)); const parsed = parseSourceIds(answer, validIds)
      append({ id: nextMessageId(), role: 'assistant', text: parsed.text || answer, sourceIds: parsed.sourceIds.length ? parsed.sourceIds : selectedNotes.slice(0, 8).map((note) => note.id) })
    } catch (error) {
      if (error instanceof AssistantError && error.kind === 'cancelled') return
      const message = error instanceof AssistantError ? error.message : new AssistantError('network').message
      append({ id: nextMessageId(), role: 'assistant', text: message, error: true, retryQuestion: question })
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null
      if (mounted.current) setLoading(false)
    }
  }
  const send = (): void => { const clean = value.trim(); if (!clean || loading || !apiKey) return; setValue(''); void runQuery(clean, true) }
  const retry = (question: string): void => { if (loading) return; setMessages((current) => current.filter((message) => message.retryQuestion !== question)); void runQuery(question, false) }
  const openNote = (note: Note): void => router.replace(`/note/${note.id}`)
  const close = (): void => { controllerRef.current?.abort(); goBack() }
  return <KeyboardAwareView style={[styles.screen, { backgroundColor: palette.bg }]}><View style={[styles.head, { borderBottomColor: palette.border, paddingTop: insets.top + 12 }]}><View style={styles.heading}><View style={[styles.brand, { backgroundColor: palette.accent }]}><Sparkles size={17} color="#FFFFFF" /></View><View><Text style={[styles.title, { color: palette.text }]}>المساعد</Text><Text style={{ color: palette.muted, fontFamily: 'Tajawal_400Regular' }}>{scope === 'folder' ? 'هذا المجلد' : 'كل الملاحظات'}</Text></View></View><IconButton accessibilityLabel="إغلاق" onPress={close}><X size={19} color={palette.muted} /></IconButton></View><View style={styles.scope}><Pressable onPress={() => setScope('folder')} style={[styles.scopeButton, { backgroundColor: scope === 'folder' ? palette.accentBg : palette.surface, borderColor: palette.border }]}><Text style={{ color: scope === 'folder' ? palette.accent : palette.muted, fontFamily: 'Tajawal_700Bold' }}>هذا المجلد</Text></Pressable><Pressable onPress={() => setScope('all')} style={[styles.scopeButton, { backgroundColor: scope === 'all' ? palette.accentBg : palette.surface, borderColor: palette.border }]}><Text style={{ color: scope === 'all' ? palette.accent : palette.muted, fontFamily: 'Tajawal_700Bold' }}>كل الملاحظات</Text></Pressable></View><FlatList style={styles.messages} ref={listRef} data={messages} keyExtractor={(item) => item.id} contentContainerStyle={{ padding: 16, gap: 11 }} onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })} renderItem={({ item }) => <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : [styles.assistantBubble, { backgroundColor: palette.surface, borderColor: palette.border }]]}><Text style={{ color: item.role === 'user' ? '#FFFFFF' : palette.text, fontFamily: 'Tajawal_400Regular', lineHeight: 25, textAlign: 'right' }}>{item.text}</Text>{item.error && item.retryQuestion && <Pressable onPress={() => retry(item.retryQuestion as string)} style={styles.retry}><Text style={{ color: palette.accent, fontFamily: 'Tajawal_700Bold', textAlign: 'right' }}>أعد المحاولة</Text></Pressable>}{item.sourceIds?.map((sourceId) => { const source = notes.find((note) => note.id === sourceId); if (!source) return null; return <Pressable key={sourceId} onPress={() => openNote(source)}><Text style={{ color: palette.accent, fontFamily: 'Tajawal_700Bold', textDecorationLine: 'underline', marginTop: 7 }}>{source.title || 'فتح الملاحظة المصدر'}</Text></Pressable> })}</View>} ListFooterComponent={<>{loading && <Text style={{ color: palette.muted, padding: 16 }}>•••</Text>}{!apiKey && <View style={[styles.missing, { backgroundColor: palette.surface, borderColor: palette.border }]}><Text style={{ color: palette.text, fontFamily: 'Tajawal_400Regular' }}>أضف مفتاح API من الإعدادات لاستخدام المساعد.</Text><Pressable onPress={() => { router.replace('/settings') }} style={styles.settingsLink}><Settings size={14} color={palette.accent} /><Text style={{ color: palette.accent, fontFamily: 'Tajawal_700Bold' }}>الذهاب للإعدادات</Text></Pressable></View>}</>} />{!loading && <HorizontalScrollRow style={styles.suggestions}>{suggestions.map((item) => <Pressable key={item} onPress={() => setValue(item)} style={[styles.suggestion, { backgroundColor: palette.accentBg }]}><Text numberOfLines={1} style={{ color: palette.accent, fontFamily: 'Tajawal_700Bold', fontSize: 12 }}>{item}</Text></Pressable>)}</HorizontalScrollRow>}<View style={[styles.inputBar, { borderTopColor: palette.border, paddingBottom: keyboardVisible ? 0 : Math.max(insets.bottom, 18) }]}><Input value={value} onChangeText={setValue} onSubmitEditing={send} placeholder="اسأل المساعد..." style={styles.chatInput} /><IconButton accessibilityLabel="إرسال" onPress={send} disabled={!apiKey || loading} style={{ backgroundColor: palette.accent, borderColor: palette.accent }}><Send size={17} color="#FFFFFF" /></IconButton></View></KeyboardAwareView>
}

const styles = StyleSheet.create({ screen: { flex: 1 }, head: { paddingHorizontal: 16, paddingBottom: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 }, heading: { flexDirection: 'row', alignItems: 'center', gap: 10 }, brand: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, title: { fontFamily: 'Tajawal_700Bold', fontSize: 23 }, scope: { flexDirection: 'row', gap: 7, padding: 12 }, messages: { flex: 1 }, scopeButton: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }, bubble: { maxWidth: '85%', borderRadius: 17, padding: 12, alignSelf: 'flex-end' }, userBubble: { backgroundColor: '#687A62', alignSelf: 'flex-start' }, assistantBubble: { borderWidth: 1 }, missing: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 9 }, settingsLink: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-end' }, suggestions: { flexGrow: 0, flexShrink: 0, flexDirection: 'row', gap: 7, paddingHorizontal: 16, paddingBottom: 10 }, suggestion: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }, inputBar: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 17, borderTopWidth: 1 }, chatInput: { flex: 1 }, retry: { marginTop: 8 },
})
