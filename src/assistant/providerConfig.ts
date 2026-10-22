import type { Settings } from '../domain'

export const getProviderConfig = (settings: Settings): { baseUrl: string; model: string } => {
  if (settings.provider === 'Gemini') return { baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', model: settings.geminiModel || 'gemini-3.5-flash-lite' }
  if (settings.provider === 'Groq') return { baseUrl: 'https://api.groq.com/openai/v1', model: settings.groqModel || 'openai/gpt-oss-20b' }
  return { baseUrl: settings.customBaseUrl, model: settings.customModel }
}
