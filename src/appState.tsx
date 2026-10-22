import { createContext, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren, type ReactElement } from 'react'
import { assistantMock, foldersRepo, isEmptyNote, nextUpdatedAt, notesRepo, resetDatabase, settingsRepo, tasksRepo } from './data/index'
import type { Folder, Note, Task } from './domain'

export type AppStateValue = {
  ready: boolean
  error: string | null
  operationError: string | null
  clearOperationError: () => void
  notes: Note[]
  folders: Folder[]
  tasks: Task[]
  noteCounts: Record<string, number>
  apiKey: string
  createNote: (folderId: string | null) => Promise<Note>
  updateNote: (id: string, patch: Pick<Note, 'title' | 'body'>) => Promise<void>
  saveNoteOnExit: (id: string, title?: string, body?: string) => Promise<void>
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
  resetData: () => Promise<void>
  saveApiKey: (value: string) => Promise<void>
  deleteApiKey: () => Promise<void>
  assistantReply: (text: string) => string
}

const AppStateContext = createContext<AppStateValue | null>(null)
const now = (): number => Date.now()
const id = (prefix: string): string => `${prefix}-${now()}-${Math.random().toString(36).slice(2, 7)}`

export const AppStateProvider = ({ children }: PropsWithChildren): ReactElement => {
  const [ready, setReady] = useState(false); const [error, setError] = useState<string | null>(null); const [operationError, setOperationError] = useState<string | null>(null); const [notes, setNotes] = useState<Note[]>([]); const [folders, setFolders] = useState<Folder[]>([]); const [tasks, setTasks] = useState<Task[]>([]); const [noteCounts, setNoteCounts] = useState<Record<string, number>>({}); const [apiKey, setApiKey] = useState(''); const draftIds = useRef(new Set<string>()); const noteQueues = useRef(new Map<string, Promise<void>>()); const noteSnapshots = useRef(new Map<string, Pick<Note, 'title' | 'body' | 'updatedAt'>>())
  useEffect(() => { void (async () => { try { await notesRepo.purgeExpired(); await notesRepo.removeEmptyLive(); const [loadedNotes, loadedFolders, loadedTasks, loadedKey] = await Promise.all([notesRepo.list(), foldersRepo.list(), tasksRepo.list(), settingsRepo.readApiKey()]); const countRows = await Promise.all([notesRepo.count(), notesRepo.count(null), ...loadedFolders.map((folder) => notesRepo.count(folder.id))]); noteSnapshots.current = new Map(loadedNotes.map((note) => [note.id, { title: note.title, body: note.body, updatedAt: note.updatedAt }])); setNotes(loadedNotes); setFolders(loadedFolders); setTasks(loadedTasks); setNoteCounts({ all: countRows[0], uncategorized: countRows[1], ...Object.fromEntries(loadedFolders.map((folder, index) => [folder.id, countRows[index + 2]])) }); setApiKey(loadedKey); setReady(true) } catch (cause) { console.error('[mofakkira] app state initialization failed', cause); setError(cause instanceof Error ? cause.message : 'تعذر تحميل البيانات') } })() }, [])

  const value = useMemo<AppStateValue>(() => {
    const persist = async <T,>(operation: string, action: () => Promise<T>): Promise<T> => { try { return await action() } catch (cause) { console.error(`[mofakkira] ${operation} failed`, cause); setOperationError('تعذر حفظ التغيير. حاول مرة أخرى.'); throw cause } }
    const createNote = async (folderId: string | null): Promise<Note> => { const timestamp = now(); const note: Note = { id: id('note'), title: '', body: '', folderId, originalFolderId: null, createdAt: timestamp, updatedAt: timestamp, deletedAt: null }; draftIds.current.add(note.id); noteSnapshots.current.set(note.id, { title: '', body: '', updatedAt: timestamp }); setNotes((current) => [note, ...current]); return note }
    const enqueueNote = <T,>(noteId: string, action: () => Promise<T>): Promise<T> => { const previous = noteQueues.current.get(noteId) ?? Promise.resolve(); const current = previous.catch(() => undefined).then(action); const tail = current.then(() => undefined, () => undefined); noteQueues.current.set(noteId, tail); void tail.finally(() => { if (noteQueues.current.get(noteId) === tail) noteQueues.current.delete(noteId) }); return current }
    const updateNote = async (noteId: string, patch: Pick<Note, 'title' | 'body'>): Promise<void> => enqueueNote(noteId, async () => { const current = notes.find((note) => note.id === noteId); if (!current) return; const baseline = noteSnapshots.current.get(noteId) ?? current; const updatedAt = nextUpdatedAt(baseline, patch, now()); const next = { ...current, ...patch, updatedAt }; if (draftIds.current.has(noteId)) { if (!isEmptyNote(next)) { draftIds.current.delete(noteId); try { await persist('notes.create', () => notesRepo.create(next)); await refreshCounts() } catch (error) { draftIds.current.add(noteId); throw error } } } else await persist('notes.update', () => notesRepo.update(noteId, next.title, next.body, updatedAt)); noteSnapshots.current.set(noteId, { title: next.title, body: next.body, updatedAt }); setNotes((items) => items.map((note) => note.id === noteId ? next : note)) })
    const saveNoteOnExit = async (noteId: string, title?: string, body?: string): Promise<void> => enqueueNote(noteId, async () => { const current = notes.find((note) => note.id === noteId); if (!current) return; const patch = { title: title ?? current.title, body: body ?? current.body }; const baseline = noteSnapshots.current.get(noteId) ?? current; const updatedAt = nextUpdatedAt(baseline, patch, now()); const next = { ...current, ...patch, updatedAt }; if (draftIds.current.has(noteId)) { if (isEmptyNote(next)) { draftIds.current.delete(noteId); noteSnapshots.current.delete(noteId); setNotes((items) => items.filter((note) => note.id !== noteId)); return } draftIds.current.delete(noteId); try { await persist('notes.create', () => notesRepo.create(next)); await refreshCounts() } catch (error) { draftIds.current.add(noteId); throw error } } else if (isEmptyNote(next) && current.deletedAt === null) { const deletedAt = now(); await persist('notes.softDelete', () => notesRepo.softDelete(noteId, deletedAt, current.folderId)); noteSnapshots.current.set(noteId, { title: next.title, body: next.body, updatedAt }); setNotes((items) => items.map((note) => note.id === noteId ? { ...next, deletedAt, originalFolderId: current.folderId, folderId: null } : note)); await refreshCounts(); return } else await persist('notes.update', () => notesRepo.update(noteId, next.title, next.body, updatedAt)); noteSnapshots.current.set(noteId, { title: next.title, body: next.body, updatedAt }); setNotes((items) => items.map((note) => note.id === noteId ? next : note)) })
    const refreshCounts = async (currentFolders = folders): Promise<void> => { const rows = await Promise.all([notesRepo.count(), notesRepo.count(null), ...currentFolders.map((folder) => notesRepo.count(folder.id))]); setNoteCounts({ all: rows[0], uncategorized: rows[1], ...Object.fromEntries(currentFolders.map((folder, index) => [folder.id, rows[index + 2]])) }) }
    const moveNote = async (noteId: string, folderId: string | null): Promise<void> => { await persist('notes.move', () => notesRepo.move(noteId, folderId)); setNotes((items) => items.map((note) => note.id === noteId ? { ...note, folderId } : note)); await refreshCounts() }
    const deleteNote = async (noteId: string): Promise<void> => { const current = notes.find((note) => note.id === noteId); if (!current) return; if (draftIds.current.has(noteId)) { draftIds.current.delete(noteId); setNotes((items) => items.filter((note) => note.id !== noteId)); return } const deletedAt = now(); await persist('notes.softDelete', () => notesRepo.softDelete(noteId, deletedAt, current.folderId)); setNotes((items) => items.map((note) => note.id === noteId ? { ...note, deletedAt, originalFolderId: current.folderId, folderId: null } : note)); await refreshCounts() }
    const restoreNote = async (noteId: string): Promise<void> => { const current = notes.find((note) => note.id === noteId); if (!current) return; const folderId = current.originalFolderId && folders.some((folder) => folder.id === current.originalFolderId) ? current.originalFolderId : null; await persist('notes.restore', () => notesRepo.restore(noteId, folderId)); setNotes((items) => items.map((note) => note.id === noteId ? { ...note, deletedAt: null, folderId, originalFolderId: null } : note)); await refreshCounts() }
    const permanentlyDeleteNote = async (noteId: string): Promise<void> => { await persist('notes.permanentlyDelete', () => notesRepo.permanentlyDelete(noteId)); setNotes((items) => items.filter((note) => note.id !== noteId)); await refreshCounts() }
    const addFolder = async (name: string): Promise<void> => { const folder = { id: id('folder'), name: name.trim() }; await persist('folders.create', () => foldersRepo.create(folder)); setFolders((items) => [...items, folder]) }
    const renameFolder = async (folderId: string, name: string): Promise<void> => { const clean = name.trim(); await persist('folders.rename', () => foldersRepo.rename(folderId, clean)); setFolders((items) => items.map((folder) => folder.id === folderId ? { ...folder, name: clean } : folder)) }
    const deleteFolder = async (folderId: string): Promise<void> => { const nextFolders = folders.filter((folder) => folder.id !== folderId); await persist('folders.remove', () => foldersRepo.remove(folderId)); setFolders(nextFolders); setNotes((items) => items.map((note) => note.folderId === folderId || note.originalFolderId === folderId ? { ...note, folderId: null, originalFolderId: null } : note)); await refreshCounts(nextFolders) }
    const addTask = async (text: string): Promise<void> => { const task = { id: id('task'), text: text.trim(), done: false, createdAt: now() }; await persist('tasks.create', () => tasksRepo.create(task)); setTasks((items) => [task, ...items]) }
    const toggleTask = async (taskId: string): Promise<void> => { const current = tasks.find((task) => task.id === taskId); if (!current) return; await persist('tasks.toggle', () => tasksRepo.toggle(taskId, !current.done)); setTasks((items) => items.map((task) => task.id === taskId ? { ...task, done: !task.done } : task)) }
    const deleteTask = async (taskId: string): Promise<void> => { await persist('tasks.remove', () => tasksRepo.remove(taskId)); setTasks((items) => items.filter((task) => task.id !== taskId)) }
    const resetData = async (): Promise<void> => { await persist('database.reset', () => resetDatabase()); draftIds.current.clear(); noteSnapshots.current.clear(); setNotes([]); setFolders([]); setTasks([]); setNoteCounts({}) }
    return { ready, error, operationError, clearOperationError: () => setOperationError(null), notes, folders, tasks, noteCounts, apiKey, createNote, updateNote, saveNoteOnExit, moveNote, deleteNote, restoreNote, permanentlyDeleteNote, addFolder, renameFolder, deleteFolder, addTask, toggleTask, deleteTask, resetData, saveApiKey: async (valueToSave: string) => { const clean = valueToSave.trim(); await persist('saveApiKey', () => settingsRepo.saveApiKey(clean)); setApiKey(clean) }, deleteApiKey: async () => { await persist('deleteApiKey', () => settingsRepo.deleteApiKey()); setApiKey('') }, assistantReply: (text: string) => assistantMock(text, tasks.filter((task) => !task.done).map((task) => task.text)) }
  }, [apiKey, folders, notes, noteCounts, operationError, ready, tasks, error])

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export const useAppState = (): AppStateValue => { const value = useContext(AppStateContext); if (!value) throw new Error('useAppState must be used inside AppStateProvider'); return value }
