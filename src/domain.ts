export type ThemeMode = 'auto' | 'light' | 'dark'
export type AIProvider = 'Gemini' | 'Groq' | 'Custom'

export type Note = {
  id: string
  title: string
  body: string
  folderId: string | null
  originalFolderId: string | null
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}

export type Folder = { id: string; name: string }
export type Task = { id: string; text: string; done: boolean; createdAt: number }

export type Settings = {
  theme: ThemeMode
  provider: AIProvider
  geminiModel: string
  groqModel: string
  customModel: string
  customBaseUrl: string
  welcomeDone: boolean
  privacyNoticeAcknowledged: boolean
}

export const initialSettings: Settings = {
  theme: 'auto',
  provider: 'Gemini',
  geminiModel: 'gemini-3.5-flash-lite',
  groqModel: 'openai/gpt-oss-20b',
  customModel: '',
  customBaseUrl: '',
  welcomeDone: false,
  privacyNoticeAcknowledged: false,
}
