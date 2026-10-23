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
import { isEmptyNote } from '../src/data/rules'
import { useGoBackOrNotes } from '../src/navigation'
import { AssistantError, chat } from '../src/assistant/client'
import { appendPreviousSourceNotes, buildAnswerMessages, buildContext, buildMetadataPrompt, boundNotes, latestCandidates, localSearchFallback, MAX_CONTEXT_EXCHANGES, MAX_CONTEXT_MESSAGE_CHARS, parseRelevantIds, parseSourceIds, type CandidateNote } from '../src/assistant/assistantService'
import { getProviderConfig } from '../src/assistant/providerConfig'

type Message = { id: string; role: 'user' | 'assistant'; text: string; sourceIds?: string[]; error?: boolean; retryQuestion?: string; retryUserMessageId?: string; afterMessageId?: string }
const suggestions = ['ما المهام غير المنجزة؟', 'لخّص ملاحظات هذا المجلد', 'على ماذا أركز اليوم؟']
const noNotesText = 'لا توجد ملاحظات في هذا النطاق بعد.'
const welcomeMessage: Message = { id: 'welcome', role: 'assistant', text: 'مرحباً، أنا هنا لأساعدك على ترتيب أفكارك وتحويلها إلى خطوات.' }
const clockNow = (): number => Date.now()

export default function AssistantScreen(): ReactElement {
  const { from } = useLocalSearchParams<{ from?: string }>(); const router = useRouter(); const goBack = useGoBackOrNotes(); const { notes, folders, apiKey, selectedNotesFolderId, chatMessages, addChatMessage, purgeChatHistory } = useAppState(); const settings = useSettings(); const updateSettings = useUpdateSettings(); const { palette } = useTheme(); const insets = useSafeAreaInsets(); const [scope, setScope] = useState<'folder' | 'all'>(from === 'tasks' ? 'all' : 'folder'); const [value, setValue] = useState(''); const [loading, setLoading] = useState(false); const [keyboardVisible, setKeyboardVisible] = useState(false); const [temporaryMessages, setTemporaryMessages] = useState<Message[]>([]); const listRef = useRef<FlatList<Message>>(null); const controllerRef = useRef<AbortController | null>(null); const mounted = useRef(true); const opened = useRef(false)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controllerRef.current?.abort() } }, [])
  useEffect(() => { if (opened.current) return; opened.current = true; void purgeChatHistory() }, [purgeChatHistory])
  useEffect(() => { if (!settings.privacyNoticeAcknowledged) Alert.alert('قبل استخدام المساعد', 'ملاحظاتك تُرسل إلى مزود الذكاء الاصطناعي عند استخدام المساعد', [{ text: 'فهمت', onPress: () => void updateSettings({ privacyNoticeAcknowledged: true }) }]) }, [settings.privacyNoticeAcknowledged, updateSettings])
  useEffect(() => { const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true)); const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false)); return () => { show.remove(); hide.remove() } }, [])
  const messages: Message[] = [welcomeMessage, ...chatMessages.flatMap((record) => {
    const saved: Message = { id: record.id, role: record.role, text: record.content, sourceIds: record.sources ?? undefined }
    return [saved, ...temporaryMessages.filter((message) => message.afterMessageId === record.id)]
  }), ...temporaryMessages.filter((message) => !message.afterMessageId || !chatMessages.some((record) => record.id === message.afterMessageId))]
  const runQuery = async (question: string, includeUser: boolean, retryUserMessageId?: string): Promise<void> => {
    if (!apiKey || loading) return
    const history = buildContext(chatMessages, MAX_CONTEXT_EXCHANGES, MAX_CONTEXT_MESSAGE_CHARS)
    const controller = new AbortController(); controllerRef.current?.abort(); controllerRef.current = controller
    setLoading(true)
    let userMessageId = retryUserMessageId
    const metrics = __DEV__ ? { startedAt: clockNow(), path: 'single' as 'single' | 'two-step', scopeNotes: 0, titlesSent: 0, selectedIds: 0, charsSent: 0, calls: 0 } : null
    try {
      if (includeUser) userMessageId = (await addChatMessage('user', question)).id
      const scopeFilter = { mode: scope, selectedFolderId: selectedNotesFolderId }
      const retrievalCandidates = latestCandidates(notes, folders, scopeFilter, 300)
      if (metrics) metrics.scopeNotes = retrievalCandidates.length
      if (!retrievalCandidates.length) { await addChatMessage('assistant', noNotesText, []); return }
      const provider = getProviderConfig(settings)
      const totalContentLength = retrievalCandidates.reduce((total, note) => total + note.title.length + note.body.length, 0)
      const previousSources = [...chatMessages].reverse().find((message) => message.role === 'assistant')?.sources ?? []
      const path = totalContentLength < 6000 ? 'single' : 'two-step'
      if (metrics) metrics.path = path
      let selectedNotes: CandidateNote[]
      if (path === 'single') {
        selectedNotes = boundNotes(appendPreviousSourceNotes(retrievalCandidates, previousSources, notes, folders, scopeFilter))
        if (metrics) { metrics.titlesSent += selectedNotes.length; metrics.charsSent += selectedNotes.reduce((total, note) => total + note.title.length + note.body.length, 0) }
      } else {
        if (metrics) { metrics.titlesSent += retrievalCandidates.length; metrics.charsSent += retrievalCandidates.reduce((total, note) => total + note.title.length, 0); metrics.calls += 1 }
        const metadataReply = await chat({ ...provider, apiKey, messages: buildMetadataPrompt(question, retrievalCandidates, folders, history), signal: controller.signal, temperature: 0, maxTokens: 1200 })
        const ids = parseRelevantIds(metadataReply, new Set(retrievalCandidates.map((note) => note.id)), 8)
        if (metrics) metrics.selectedIds = ids?.length ?? 0
        if (ids !== null && ids.length === 0) { if (metrics) metrics.calls += 1; const answer = await chat({ ...provider, apiKey, messages: buildAnswerMessages(question, [], folders, history), signal: controller.signal, temperature: 0.35, maxTokens: 1400 }); const parsed = parseSourceIds(answer, new Set()); await addChatMessage('assistant', parsed.text, []); return }
        const retrieved = ids === null ? localSearchFallback(question, retrievalCandidates, 8) : ids.map((id) => retrievalCandidates.find((note) => note.id === id)).filter((note): note is CandidateNote => Boolean(note))
        selectedNotes = boundNotes(appendPreviousSourceNotes(retrieved, previousSources, notes, folders, scopeFilter))
        if (metrics) { metrics.titlesSent += selectedNotes.length; metrics.charsSent += selectedNotes.reduce((total, note) => total + note.title.length + note.body.length, 0) }
      }
      if (!selectedNotes.length) { await addChatMessage('assistant', 'لم أجد ملاحظات مرتبطة بهذا السؤال في النطاق المحدد.', []); return }
      if (metrics) metrics.calls += 1
      const answer = await chat({ ...provider, apiKey, messages: buildAnswerMessages(question, selectedNotes, folders, history), signal: controller.signal, temperature: 0.35, maxTokens: 1400 })
      const validIds = new Set(selectedNotes.map((note) => note.id)); const parsed = parseSourceIds(answer, validIds); const content = parsed.text; const sourceIds = parsed.sourceIds
      await addChatMessage('assistant', content, sourceIds)
    } catch (error) {
      if (error instanceof AssistantError && error.kind === 'cancelled') return
      const message = error instanceof AssistantError ? error.message : new AssistantError('network').message
      if (mounted.current) setTemporaryMessages((current) => [...current, { id: `error-${userMessageId ?? 'pending'}`, role: 'assistant', text: message, error: true, retryQuestion: question, retryUserMessageId: userMessageId, afterMessageId: userMessageId }])
    } finally {
      if (metrics) console.info(`[assistant] path=${metrics.path} scopeNotes=${metrics.scopeNotes} titlesSent=${metrics.titlesSent} selectedIds=${metrics.selectedIds} charsSent=${metrics.charsSent} calls=${metrics.calls} contextMsgs=${history.length} durationMs=${clockNow() - metrics.startedAt}`)
      if (controllerRef.current === controller) controllerRef.current = null
      if (mounted.current) setLoading(false)
    }
  }
  const send = (): void => { const clean = value.trim(); if (!clean || loading || !apiKey) return; setValue(''); void runQuery(clean, true) }
  const retry = (question: string, userMessageId: string): void => { if (loading) return; setTemporaryMessages((current) => current.filter((message) => message.retryUserMessageId !== userMessageId)); void runQuery(question, false, userMessageId) }
  const openNote = (note: Note): void => router.replace(`/note/${note.id}`)
  const close = (): void => { controllerRef.current?.abort(); goBack() }
  return <KeyboardAwareView style={[styles.screen, { backgroundColor: palette.bg }]}><View style={[styles.head, { borderBottomColor: palette.border, paddingTop: insets.top + 12 }]}><View style={styles.heading}><View style={[styles.brand, { backgroundColor: palette.accent }]}><Sparkles size={17} color="#FFFFFF" /></View><View><Text style={[styles.title, { color: palette.text }]}>المساعد</Text><Text style={{ color: palette.muted, fontFamily: 'Tajawal_400Regular' }}>{scope === 'folder' ? 'هذا المجلد' : 'كل الملاحظات'}</Text></View></View><IconButton accessibilityLabel="إغلاق" onPress={close}><X size={19} color={palette.muted} /></IconButton></View><View style={styles.scope}><Pressable onPress={() => setScope('folder')} style={[styles.scopeButton, { backgroundColor: scope === 'folder' ? palette.accentBg : palette.surface, borderColor: palette.border }]}><Text style={{ color: scope === 'folder' ? palette.accent : palette.muted, fontFamily: 'Tajawal_700Bold' }}>هذا المجلد</Text></Pressable><Pressable onPress={() => setScope('all')} style={[styles.scopeButton, { backgroundColor: scope === 'all' ? palette.accentBg : palette.surface, borderColor: palette.border }]}><Text style={{ color: scope === 'all' ? palette.accent : palette.muted, fontFamily: 'Tajawal_700Bold' }}>كل الملاحظات</Text></Pressable></View><FlatList style={styles.messages} ref={listRef} data={messages} keyExtractor={(item) => item.id} contentContainerStyle={{ padding: 16, gap: 11 }} onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })} renderItem={({ item }) => <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : [styles.assistantBubble, { backgroundColor: palette.surface, borderColor: palette.border }]]}><Text style={{ color: item.role === 'user' ? '#FFFFFF' : palette.text, fontFamily: 'Tajawal_400Regular', lineHeight: 25, textAlign: 'right' }}>{item.text}</Text>{item.error && item.retryQuestion && item.retryUserMessageId && <Pressable onPress={() => retry(item.retryQuestion as string, item.retryUserMessageId as string)} style={styles.retry}><Text style={{ color: palette.accent, fontFamily: 'Tajawal_700Bold', textAlign: 'right' }}>أعد المحاولة</Text></Pressable>}{item.sourceIds?.map((sourceId) => { const source = notes.find((note) => note.id === sourceId && note.deletedAt === null && !isEmptyNote(note)); if (!source) return null; return <Pressable key={sourceId} onPress={() => openNote(source)}><Text style={{ color: palette.accent, fontFamily: 'Tajawal_700Bold', textDecorationLine: 'underline', marginTop: 7 }}>{source.title || 'فتح الملاحظة المصدر'}</Text></Pressable> })}</View>} ListFooterComponent={<>{loading && <Text style={{ color: palette.muted, padding: 16 }}>•••</Text>}{!apiKey && <View style={[styles.missing, { backgroundColor: palette.surface, borderColor: palette.border }]}><Text style={{ color: palette.text, fontFamily: 'Tajawal_400Regular' }}>أضف مفتاح API من الإعدادات لاستخدام المساعد.</Text><Pressable onPress={() => { router.replace('/settings') }} style={styles.settingsLink}><Settings size={14} color={palette.accent} /><Text style={{ color: palette.accent, fontFamily: 'Tajawal_700Bold' }}>الذهاب للإعدادات</Text></Pressable></View>}</>} />{!loading && <HorizontalScrollRow style={styles.suggestions}>{suggestions.map((item) => <Pressable key={item} onPress={() => setValue(item)} style={[styles.suggestion, { backgroundColor: palette.accentBg }]}><Text numberOfLines={1} style={{ color: palette.accent, fontFamily: 'Tajawal_700Bold', fontSize: 12 }}>{item}</Text></Pressable>)}</HorizontalScrollRow>}<View style={[styles.inputBar, { borderTopColor: palette.border, paddingBottom: keyboardVisible ? 0 : Math.max(insets.bottom, 18) }]}><Input value={value} onChangeText={setValue} onSubmitEditing={send} placeholder="اسأل المساعد..." style={styles.chatInput} /><IconButton accessibilityLabel="إرسال" onPress={send} disabled={!apiKey || loading} style={{ backgroundColor: palette.accent, borderColor: palette.accent }}><Send size={17} color="#FFFFFF" /></IconButton></View></KeyboardAwareView>
}

const styles = StyleSheet.create({ screen: { flex: 1 }, head: { paddingHorizontal: 16, paddingBottom: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 }, heading: { flexDirection: 'row', alignItems: 'center', gap: 10 }, brand: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, title: { fontFamily: 'Tajawal_700Bold', fontSize: 23 }, scope: { flexDirection: 'row', gap: 7, padding: 12 }, messages: { flex: 1 }, scopeButton: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }, bubble: { maxWidth: '85%', borderRadius: 17, padding: 12, alignSelf: 'flex-end' }, userBubble: { backgroundColor: '#687A62', alignSelf: 'flex-start' }, assistantBubble: { borderWidth: 1 }, missing: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 9 }, settingsLink: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-end' }, suggestions: { flexGrow: 0, flexShrink: 0, flexDirection: 'row', gap: 7, paddingHorizontal: 16, paddingBottom: 10 }, suggestion: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }, inputBar: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 17, borderTopWidth: 1 }, chatInput: { flex: 1 }, retry: { marginTop: 8 },
})
