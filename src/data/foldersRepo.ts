import type { Folder } from '../domain'
import { getDatabase } from './database'

type FolderRow = { id: string; name: string }
const report = (operation: string, error: unknown): never => { console.error(`[mofakkira] foldersRepo.${operation} failed`, error); throw error }

export const foldersRepo = {
  async list(): Promise<Folder[]> { try { const db = await getDatabase(); return (await db.getAllAsync<FolderRow>('SELECT id, name FROM folders ORDER BY rowid ASC')).map((row) => ({ id: row.id, name: row.name })) } catch (error) { return report('list', error) } },
  async create(folder: Folder): Promise<void> { try { const db = await getDatabase(); await db.runAsync('INSERT INTO folders (id, name) VALUES (?, ?)', folder.id, folder.name) } catch (error) { return report('create', error) } },
  async rename(id: string, name: string): Promise<void> { try { const db = await getDatabase(); await db.runAsync('UPDATE folders SET name = ? WHERE id = ?', name, id) } catch (error) { return report('rename', error) } },
  async remove(id: string): Promise<void> { try { const db = await getDatabase(); await db.withExclusiveTransactionAsync(async (transaction) => { await transaction.runAsync('UPDATE notes SET folder_id = NULL, original_folder_id = NULL WHERE folder_id = ? OR original_folder_id = ?', id, id); await transaction.runAsync('DELETE FROM folders WHERE id = ?', id) }) } catch (error) { return report('remove', error) } },
  async countNotes(id: string | null): Promise<number> { try { const db = await getDatabase(); const row = id === null ? await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM notes WHERE deleted_at IS NULL AND folder_id IS NULL') : await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM notes WHERE deleted_at IS NULL AND folder_id = ?', id); return row?.count ?? 0 } catch (error) { return report('countNotes', error) } },
}
