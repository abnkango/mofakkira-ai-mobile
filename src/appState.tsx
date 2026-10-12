import { createContext, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren, type ReactElement } from 'react'
import { assistantMock, foldersRepo, isEmptyNote, nextUpdatedAt, notesRepo, settingsRepo, tasksRepo } from './data/index'
import type { Folder, Note, Task } from './domain'

export type AppStateValue = {
  ready: boolean
  error: string | null
  notes: Note[]
  folders: Folder[]
  tasks: Task[]
  apiKey: string
  createNote: (folderId: string | null) => Promise<Note>
  updateNote: (id: string, patch: Pick<Note, 'title' | 'body'>) => Promise<void>
  saveNoteOnExit: (id: string) => Promise<void>
  moveNote: (id: string, folderId: string | null) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  restoreNote: (id: string) => Promise<void>
  permanentlyDeleteNote: (id: string) => Promise<void>
  addFolder: (name: string) => Promise<void>
  renameFolder: (id: string, name: string) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
  addTask: (text: string) => Promise<void>
  toggleTask: (id: string) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  saveApiKey: (value: string) => Promise<void>
  deleteApiKey: () => Promise<void>
  assistantReply: (text: string) => string
}

const AppStateContext = createContext<AppStateValue | null>(null)
const now = (): number => Date.now()
const id = (prefix: string): string => `${prefix}-${now()}-${Math.random().toString(36).slice(2, 7)}`

export const AppStateProvider = ({ children }: PropsWithChildren): ReactElement => {
  const [ready, setReady] = useState(false); const [error, setError] = useState<string | null>(null); const [notes, setNotes] = useState<Note[]>([]); const [folders, setFolders] = useState<Folder[]>([]); const [tasks, setTasks] = useState<Task[]>([]); const [apiKey, setApiKey] = useState(''); const draftIds = useRef(new Set<string>())
  useEffect(() => { void (async () => { try { await notesRepo.purgeExpired(); await notesRepo.removeEmptyLive(); const [loadedNotes, loadedFolders, loadedTasks, loadedKey] = await Promise.all([notesRepo.list(), foldersRepo.list(), tasksRepo.list(), settingsRepo.readApiKey()]); setNotes(loadedNotes); setFolders(loadedFolders); setTasks(loadedTasks); setApiKey(loadedKey); setReady(true) } catch (cause) { console.error('[mofakkira] app state initialization failed', cause); setError(cause instanceof Error ? cause.message : 'تعذر تحميل البيانات') } })() }, [])

  const value = useMemo<AppStateValue>(() => {
    const createNote = async (folderId: string | null): Promise<Note> => { const timestamp = now(); const note: Note = { id: id('note'), title: '', body: '', folderId, originalFolderId: null, createdAt: timestamp, updatedAt: timestamp, deletedAt: null }; draftIds.current.add(note.id); setNotes((current) => [note, ...current]); return note }
    const updateNote = async (noteId: string, patch: Pick<Note, 'title' | 'body'>): Promise<void> => { const current = notes.find((note) => note.id === noteId); if (!current) return; const updatedAt = nextUpdatedAt(current, patch, now()); const next = { ...current, ...patch, updatedAt }; if (draftIds.current.has(noteId)) { if (!isEmptyNote(next)) { await notesRepo.create(next); draftIds.current.delete(noteId) } } else await notesRepo.update(noteId, next.title, next.body, updatedAt); setNotes((items) => items.map((note) => note.id === noteId ? next : note)) }
    const saveNoteOnExit = async (noteId: string): Promise<void> => { const current = notes.find((note) => note.id === noteId); if (!current) return; if (draftIds.current.has(noteId)) { if (isEmptyNote(current)) { draftIds.current.delete(noteId); setNotes((items) => items.filter((note) => note.id !== noteId)) } else { await notesRepo.create(current); draftIds.current.delete(noteId) } return } if (isEmptyNote(current) && current.deletedAt === null) { await notesRepo.softDelete(noteId, now(), current.folderId); setNotes((items) => items.map((note) => note.id === noteId ? { ...note, deletedAt: now(), originalFolderId: current.folderId, folderId: null } : note)) } }
    const moveNote = async (noteId: string, folderId: string | null): Promise<void> => { await notesRepo.move(noteId, folderId); setNotes((items) => items.map((note) => note.id === noteId ? { ...note, folderId } : note)) }
    const deleteNote = async (noteId: string): Promise<void> => { const current = notes.find((note) => note.id === noteId); if (!current) return; if (draftIds.current.has(noteId)) { draftIds.current.delete(noteId); setNotes((items) => items.filter((note) => note.id !== noteId)); return } const deletedAt = now(); await notesRepo.softDelete(noteId, deletedAt, current.folderId); setNotes((items) => items.map((note) => note.id === noteId ? { ...note, deletedAt, originalFolderId: current.folderId, folderId: null } : note)) }
    const restoreNote = async (noteId: string): Promise<void> => { const current = notes.find((note) => note.id === noteId); if (!current) return; const folderId = current.originalFolderId && folders.some((folder) => folder.id === current.originalFolderId) ? current.originalFolderId : null; await notesRepo.restore(noteId, folderId); setNotes((items) => items.map((note) => note.id === noteId ? { ...note, deletedAt: null, folderId, originalFolderId: null } : note)) }
    const permanentlyDeleteNote = async (noteId: string): Promise<void> => { await notesRepo.permanentlyDelete(noteId); setNotes((items) => items.filter((note) => note.id !== noteId)) }
    const addFolder = async (name: string): Promise<void> => { const folder = { id: id('folder'), name: name.trim() }; await foldersRepo.create(folder); setFolders((items) => [...items, folder]) }
    const renameFolder = async (folderId: string, name: string): Promise<void> => { const clean = name.trim(); await foldersRepo.rename(folderId, clean); setFolders((items) => items.map((folder) => folder.id === folderId ? { ...folder, name: clean } : folder)) }
    const deleteFolder = async (folderId: string): Promise<void> => { await foldersRepo.remove(folderId); setFolders((items) => items.filter((folder) => folder.id !== folderId)); setNotes((items) => items.map((note) => note.folderId === folderId || note.originalFolderId === folderId ? { ...note, folderId: null, originalFolderId: null } : note)) }
    const addTask = async (text: string): Promise<void> => { const task = { id: id('task'), text: text.trim(), done: false, createdAt: now() }; await tasksRepo.create(task); setTasks((items) => [task, ...items]) }
    const toggleTask = async (taskId: string): Promise<void> => { const current = tasks.find((task) => task.id === taskId); if (!current) return; await tasksRepo.toggle(taskId, !current.done); setTasks((items) => items.map((task) => task.id === taskId ? { ...task, done: !task.done } : task)) }
    const deleteTask = async (taskId: string): Promise<void> => { await tasksRepo.remove(taskId); setTasks((items) => items.filter((task) => task.id !== taskId)) }
    return { ready, error, notes, folders, tasks, apiKey, createNote, updateNote, saveNoteOnExit, moveNote, deleteNote, restoreNote, permanentlyDeleteNote, addFolder, renameFolder, deleteFolder, addTask, toggleTask, deleteTask, saveApiKey: async (valueToSave: string) => { const clean = valueToSave.trim(); await settingsRepo.saveApiKey(clean); setApiKey(clean) }, deleteApiKey: async () => { await settingsRepo.deleteApiKey(); setApiKey('') }, assistantReply: (text: string) => assistantMock(text, tasks.filter((task) => !task.done).map((task) => task.text)) }
  }, [apiKey, folders, notes, ready, tasks, error])

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export const useAppState = (): AppStateValue => { const value = useContext(AppStateContext); if (!value) throw new Error('useAppState must be used inside AppStateProvider'); return value }
