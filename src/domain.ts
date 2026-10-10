export type ThemeMode = 'auto' | 'light' | 'dark'

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
  provider: 'Gemini' | 'Groq'
  welcomeDone: boolean
  privacyNoticeAcknowledged: boolean
}

export const initialSettings: Settings = {
  theme: 'auto',
  provider: 'Gemini',
  welcomeDone: false,
  privacyNoticeAcknowledged: false,
}
