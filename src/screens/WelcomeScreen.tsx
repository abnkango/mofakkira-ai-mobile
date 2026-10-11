import { useState, type ReactElement } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { KeyRound, ShieldCheck, Sparkles } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { Button } from '../components/Primitives'
import { Input } from '../components/Controls'
import { useAppState } from '../appState'
import { useTheme, useUpdateSettings } from '../providers'

type Step = 'welcome' | 'key' | 'privacy'

export default function WelcomeScreen(): ReactElement {
  const { palette } = useTheme()
  const router = useRouter()
  const { saveApiKey } = useAppState()
  const updateSettings = useUpdateSettings()
  const [step, setStep] = useState<Step>('welcome')
  const [key, setKey] = useState('')
  const continueToPrivacy = async (withKey: boolean): Promise<void> => { if (withKey && key.trim()) await saveApiKey(key); setStep('privacy') }
  const finish = async (): Promise<void> => { await updateSettings({ welcomeDone: true, privacyNoticeAcknowledged: true }); router.replace('/notes') }
  if (step === 'welcome') return <View style={[styles.screen, { backgroundColor: palette.bg }]}><View style={styles.center}><View style={[styles.brand, { backgroundColor: palette.accent }]}><Sparkles color="#FFFFFF" size={28} /></View><Text style={[styles.title, { color: palette.text }]}>المفكرة AI</Text><Text style={[styles.description, { color: palette.muted }]}>مساحة هادئة تجمع ملاحظاتك ومهامك، وتساعدك على تحويل الأفكار إلى خطوات.</Text></View><View style={styles.footer}><Button onPress={() => setStep('key')}>ابدأ</Button><Text style={[styles.helper, { color: palette.muted }]}>خصوصيتك أولاً، وتتحكم أنت بما تشاركه.</Text></View></View>
  if (step === 'key') return <View style={[styles.screen, { backgroundColor: palette.bg }]}><View style={styles.form}><Button variant="ghost" onPress={() => setStep('welcome')}>رجوع</Button><View style={styles.heading}><View style={[styles.smallBrand, { backgroundColor: palette.accent }]}><KeyRound color="#FFFFFF" size={18} /></View><Text style={[styles.headingText, { color: palette.text }]}>خطوة اختيارية</Text></View><Text style={[styles.helper, { color: palette.muted }]}>يمكنك إضافة مفتاح API الآن، لكنه اختياري. يعمل التطبيق بالكامل بدونه، ويحتاجه المساعد فقط.</Text><Text style={[styles.label, { color: palette.text }]}>مفتاح API</Text><Input value={key} onChangeText={setKey} placeholder="ألصق المفتاح هنا" secureTextEntry /></View><View style={styles.footer}><Button onPress={() => void continueToPrivacy(true)}>حفظ ومتابعة</Button><Button variant="ghost" onPress={() => void continueToPrivacy(false)}>لاحقًا</Button></View></View>
  return <View style={[styles.screen, { backgroundColor: palette.bg }]}><View style={styles.form}><Button variant="ghost" onPress={() => setStep('key')}>رجوع</Button><View style={styles.heading}><View style={[styles.smallBrand, { backgroundColor: palette.accent }]}><ShieldCheck color="#FFFFFF" size={18} /></View><Text style={[styles.headingText, { color: palette.text }]}>خصوصيتك أولاً</Text></View><Text style={[styles.description, { color: palette.muted }]}>تظل ملاحظاتك على جهازك. عند استخدام المساعد، تُرسل الرسالة والملاحظات ذات الصلة إلى مزود الذكاء الاصطناعي لمعالجة طلبك.</Text><Text style={[styles.helper, { color: palette.muted }]}>لن يُرسل أي محتوى إلى المساعد إلا عندما تختار استخدامه.</Text></View><View style={styles.footer}><Button onPress={() => void finish()}>أوافق وأبدأ</Button></View></View>
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 16, paddingTop: 62, paddingBottom: 24, justifyContent: 'space-between' },
  center: { alignItems: 'center', paddingTop: 40 },
  brand: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  title: { fontFamily: 'Tajawal_700Bold', fontSize: 38, textAlign: 'center' },
  description: { fontFamily: 'Tajawal_400Regular', fontSize: 16, lineHeight: 30, textAlign: 'center', maxWidth: 290, marginTop: 12 },
  footer: { gap: 12 },
  helper: { fontFamily: 'Tajawal_400Regular', fontSize: 13, lineHeight: 22, textAlign: 'center' },
  form: { gap: 17 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  smallBrand: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headingText: { fontFamily: 'Tajawal_700Bold', fontSize: 25 },
  label: { fontFamily: 'Tajawal_700Bold', fontSize: 14, textAlign: 'right', marginBottom: -10 },
})
