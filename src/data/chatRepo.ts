import { getDatabase } from './database'

export type ChatRecord = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
  sources: string[] | null
}

type ChatRow = { id: string; role: 'user' | 'assistant'; content: string; created_at: number; sources: string | null }
let writeTail: Promise<void> = Promise.resolve()

const enqueueWrite = <T,>(action: () => Promise<T>): Promise<T> => {
  const current = writeTail.then(action, action)
  writeTail = current.then(() => undefined, () => undefined)
  return current
}

const report = (operation: string): void => { console.error(`[mofakkira] chatRepo.${operation} failed`) }
const fromRow = (row: ChatRow): ChatRecord => {
  let sources: string[] | null = null
  if (row.sources !== null) {
    try {
      const value: unknown = JSON.parse(row.sources)
      if (Array.isArray(value) && value.every((item): item is string => typeof item === 'string')) sources = value
    } catch { sources = null }
  }
  return { id: row.id, role: row.role, content: row.content, createdAt: row.created_at, sources }
}

export const createChatMessageId = (): string => `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export const chatRepo = {
  async add(message: ChatRecord): Promise<void> {
    return enqueueWrite(async () => {
      try {
        const db = await getDatabase()
        await db.runAsync('INSERT INTO chat_messages (id, role, content, created_at, sources) VALUES (?, ?, ?, ?, ?)', message.id, message.role, message.content, message.createdAt, message.sources === null ? null : JSON.stringify(message.sources))
      } catch (error) { report('add'); throw error }
    })
  },
  async listAll(): Promise<ChatRecord[]> {
    try {
      const db = await getDatabase()
      const rows = await db.getAllAsync<ChatRow>('SELECT id, role, content, created_at, sources FROM chat_messages ORDER BY created_at ASC, rowid ASC')
      return rows.map(fromRow)
    } catch (error) { report('listAll'); throw error }
  },
  async purgeOlderThan(cutoff: number): Promise<void> {
    return enqueueWrite(async () => {
      try {
        const db = await getDatabase()
        await db.runAsync('DELETE FROM chat_messages WHERE created_at < ?', cutoff)
      } catch (error) { report('purgeOlderThan'); throw error }
    })
  },
  async flushWrites(): Promise<void> { await writeTail },
}
