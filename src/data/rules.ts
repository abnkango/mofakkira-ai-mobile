import type { Note } from '../domain'

export const recycleWindowMs = 30 * 86_400_000
export const chatRetentionMs = 30 * 86_400_000

export const recycleCutoff = (nowMs: number): number => nowMs - recycleWindowMs
export const chatMessageCutoff = (nowMs: number): number => nowMs - chatRetentionMs

export const isEmptyNote = (note: Pick<Note, 'title' | 'body'>): boolean => note.title.trim().length === 0 && note.body.trim().length === 0

export type SaveAction = 'none' | 'create' | 'update' | 'delete'
export type SaveActionInput = { exists: boolean; title: string; body: string; lastSavedTitle: string; lastSavedBody: string }

export const decideSaveAction = ({ exists, title, body, lastSavedTitle, lastSavedBody }: SaveActionInput): SaveAction => {
  if (!exists) return isEmptyNote({ title, body }) ? 'none' : 'create'
  if (isEmptyNote({ title, body })) return 'delete'
  if (title === lastSavedTitle && body === lastSavedBody) return 'none'
  return 'update'
}

export const nextUpdatedAt = (note: Pick<Note, 'title' | 'body' | 'updatedAt'>, patch: Pick<Note, 'title' | 'body'>, timestamp: number): number => patch.title === note.title && patch.body === note.body ? note.updatedAt : timestamp
