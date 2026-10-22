import type { Note } from '../domain'
import { getDatabase } from './database'
import { isEmptyNote, recycleCutoff } from './rules'

type NoteRow = { id: string; title: string; body: string; folder_id: string | null; original_folder_id: string | null; created_at: number; updated_at: number; deleted_at: number | null }

const fromRow = (row: NoteRow): Note => ({ id: row.id, title: row.title, body: row.body, folderId: row.folder_id, originalFolderId: row.original_folder_id, createdAt: row.created_at, updatedAt: row.updated_at, deletedAt: row.deleted_at })
const report = (operation: string, error: unknown): never => { console.error(`[mofakkira] notesRepo.${operation} failed`, error); throw error }

export const notesRepo = {
  async list(search = ''): Promise<Note[]> {
    try { const db = await getDatabase(); const query = search ? 'SELECT id, title, body, folder_id, original_folder_id, created_at, updated_at, deleted_at FROM notes WHERE (deleted_at IS NULL OR deleted_at >= ?) AND lower(title || \' \' || body) LIKE lower(?) ORDER BY updated_at DESC' : 'SELECT id, title, body, folder_id, original_folder_id, created_at, updated_at, deleted_at FROM notes WHERE deleted_at IS NULL OR deleted_at >= ? ORDER BY updated_at DESC'; const rows = search ? await db.getAllAsync<NoteRow>(query, recycleCutoff(Date.now()), `%${search}%`) : await db.getAllAsync<NoteRow>(query, recycleCutoff(Date.now())); return rows.map(fromRow) } catch (error) { return report('list', error) }
  },
  async purgeExpired(nowMs = Date.now()): Promise<void> { try { const db = await getDatabase(); await db.runAsync('DELETE FROM notes WHERE deleted_at IS NOT NULL AND deleted_at < ?', recycleCutoff(nowMs)) } catch (error) { return report('purgeExpired', error) } },
  async removeEmptyLive(): Promise<void> { try { const db = await getDatabase(); await db.runAsync("DELETE FROM notes WHERE deleted_at IS NULL AND trim(title) = '' AND trim(body) = ''") } catch (error) { return report('removeEmptyLive', error) } },
  async create(note: Note): Promise<void> { try { const db = await getDatabase(); await db.runAsync('INSERT INTO notes (id, title, body, folder_id, original_folder_id, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET title = excluded.title, body = excluded.body, folder_id = excluded.folder_id, original_folder_id = excluded.original_folder_id, updated_at = excluded.updated_at, deleted_at = excluded.deleted_at', note.id, note.title, note.body, note.folderId, note.originalFolderId, note.createdAt, note.updatedAt, note.deletedAt) } catch (error) { return report('create', error) } },
  async update(id: string, title: string, body: string, updatedAt: number): Promise<void> { try { const db = await getDatabase(); await db.runAsync('UPDATE notes SET title = ?, body = ?, updated_at = ? WHERE id = ?', title, body, updatedAt, id) } catch (error) { return report('update', error) } },
  async move(id: string, folderId: string | null): Promise<void> { try { const db = await getDatabase(); await db.runAsync('UPDATE notes SET folder_id = ? WHERE id = ?', folderId, id) } catch (error) { return report('move', error) } },
  async softDelete(id: string, deletedAt: number, originalFolderId: string | null): Promise<void> { try { const db = await getDatabase(); await db.runAsync('UPDATE notes SET deleted_at = ?, original_folder_id = ?, folder_id = NULL WHERE id = ?', deletedAt, originalFolderId, id) } catch (error) { return report('softDelete', error) } },
  async restore(id: string, folderId: string | null): Promise<void> { try { const db = await getDatabase(); await db.runAsync('UPDATE notes SET deleted_at = NULL, folder_id = ?, original_folder_id = NULL WHERE id = ?', folderId, id) } catch (error) { return report('restore', error) } },
  async permanentlyDelete(id: string): Promise<void> { try { const db = await getDatabase(); await db.runAsync('DELETE FROM notes WHERE id = ?', id) } catch (error) { return report('permanentlyDelete', error) } },
  async count(folderId?: string | null): Promise<number> { try { const db = await getDatabase(); const row = folderId === undefined ? await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM notes WHERE deleted_at IS NULL') : folderId === null ? await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM notes WHERE deleted_at IS NULL AND folder_id IS NULL') : await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM notes WHERE deleted_at IS NULL AND folder_id = ?', folderId); return row?.count ?? 0 } catch (error) { return report('count', error) } },
  isEmptyNote,
}
