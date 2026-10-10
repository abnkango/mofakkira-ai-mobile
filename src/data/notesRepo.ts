import { seedNotes } from '../data'
import type { Note } from '../domain'

const recycleWindow = 30 * 86_400_000
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T

export const notesRepo = {
  async list(): Promise<Note[]> {
    const cutoff = Date.now() - recycleWindow
    return clone(seedNotes).filter((note) => note.deletedAt === null || note.deletedAt >= cutoff)
  },
}
