import type { Note } from '../domain'

export const recycleWindowMs = 30 * 86_400_000
export const chatRetentionMs = 30 * 86_400_000

export const recycleCutoff = (nowMs: number): number => nowMs - recycleWindowMs
export const chatMessageCutoff = (nowMs: number): number => nowMs - chatRetentionMs

export const isEmptyNote = (note: Pick<Note, 'title' | 'body'>): boolean => note.title.trim().length === 0 && note.body.trim().length === 0

export const nextUpdatedAt = (note: Pick<Note, 'title' | 'body' | 'updatedAt'>, patch: Pick<Note, 'title' | 'body'>, timestamp: number): number => patch.title === note.title && patch.body === note.body ? note.updatedAt : timestamp
