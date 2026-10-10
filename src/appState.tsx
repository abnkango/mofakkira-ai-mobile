import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren, type ReactElement } from 'react'
import { assistantMock, foldersRepo, notesRepo, settingsRepo, tasksRepo } from './data/index'
import type { Folder, Note, Task } from './domain'

export type AppStateValue = {
  ready: boolean
  notes: Note[]
  folders: Folder[]
  tasks: Task[]
  apiKey: string
  createNote: (folderId: string | null) => Note
  updateNote: (id: string, patch: Pick<Note, 'title' | 'body'>) => void
  moveNote: (id: string, folderId: string | null) => void
  deleteNote: (id: string) => void
  restoreNote: (id: string) => void
  permanentlyDeleteNote: (id: string) => void
  addFolder: (name: string) => void
  renameFolder: (id: string, name: string) => void
  deleteFolder: (id: string) => void
  addTask: (text: string) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  saveApiKey: (value: string) => Promise<void>
  deleteApiKey: () => Promise<void>
  assistantReply: (text: string) => string
}

const AppStateContext = createContext<AppStateValue | null>(null)
const now = (): number => Date.now()
const id = (prefix: string): string => `${prefix}-${now()}-${Math.random().toString(36).slice(2, 7)}`

export const AppStateProvider = ({ children }: PropsWithChildren): ReactElement => {
  const [ready, setReady] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [apiKey, setApiKey] = useState('')
  useEffect(() => { Promise.all([notesRepo.list(), foldersRepo.list(), tasksRepo.list(), settingsRepo.readApiKey()]).then(([loadedNotes, loadedFolders, loadedTasks, loadedKey]) => { setNotes(loadedNotes); setFolders(loadedFolders); setTasks(loadedTasks); setApiKey(loadedKey); setReady(true) }).catch(() => setReady(true)) }, [])

  const value = useMemo<AppStateValue>(() => ({
    ready, notes, folders, tasks, apiKey,
    createNote: (folderId) => { const timestamp = now(); const note: Note = { id: id('note'), title: '', body: '', folderId, originalFolderId: null, createdAt: timestamp, updatedAt: timestamp, deletedAt: null }; setNotes((current) => [note, ...current]); return note },
    updateNote: (noteId, patch) => setNotes((current) => current.map((note) => { if (note.id !== noteId) return note; const changed = patch.title !== note.title || patch.body !== note.body; return { ...note, ...patch, updatedAt: changed ? now() : note.updatedAt } })),
    moveNote: (noteId, folderId) => setNotes((current) => current.map((note) => note.id === noteId ? { ...note, folderId } : note)),
    deleteNote: (noteId) => setNotes((current) => current.map((note) => note.id === noteId ? { ...note, deletedAt: now(), originalFolderId: note.folderId, folderId: null } : note)),
    restoreNote: (noteId) => setNotes((current) => current.map((note) => { if (note.id !== noteId) return note; const validFolder = note.originalFolderId && folders.some((folder) => folder.id === note.originalFolderId) ? note.originalFolderId : null; return { ...note, deletedAt: null, folderId: validFolder, originalFolderId: null } })),
    permanentlyDeleteNote: (noteId) => setNotes((current) => current.filter((note) => note.id !== noteId)),
    addFolder: (name) => setFolders((current) => [...current, { id: id('folder'), name: name.trim() }]),
    renameFolder: (folderId, name) => setFolders((current) => current.map((folder) => folder.id === folderId ? { ...folder, name: name.trim() } : folder)),
    deleteFolder: (folderId) => { setNotes((current) => current.map((note) => note.folderId === folderId ? { ...note, folderId: null } : note)); setFolders((current) => current.filter((folder) => folder.id !== folderId)) },
    addTask: (text) => setTasks((current) => [{ id: id('task'), text: text.trim(), done: false, createdAt: now() }, ...current]),
    toggleTask: (taskId) => setTasks((current) => current.map((task) => task.id === taskId ? { ...task, done: !task.done } : task)),
    deleteTask: (taskId) => setTasks((current) => current.filter((task) => task.id !== taskId)),
    saveApiKey: async (valueToSave) => { await settingsRepo.saveApiKey(valueToSave.trim()); setApiKey(valueToSave.trim()) },
    deleteApiKey: async () => { await settingsRepo.deleteApiKey(); setApiKey('') },
    assistantReply: (text) => assistantMock(text, tasks.filter((task) => !task.done).map((task) => task.text)),
  }), [apiKey, folders, notes, ready, tasks])

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export const useAppState = (): AppStateValue => {
  const value = useContext(AppStateContext)
  if (!value) throw new Error('useAppState must be used inside AppStateProvider')
  return value
}
