import type { Task } from '../domain'
import { getDatabase } from './database'

type TaskRow = { id: string; text: string; done: number; created_at: number }
const report = (operation: string, error: unknown): never => { console.error(`[mofakkira] tasksRepo.${operation} failed`, error); throw error }

export const tasksRepo = {
  async list(): Promise<Task[]> { try { const db = await getDatabase(); return (await db.getAllAsync<TaskRow>('SELECT id, text, done, created_at FROM tasks ORDER BY created_at DESC')).map((row) => ({ id: row.id, text: row.text, done: row.done === 1, createdAt: row.created_at })) } catch (error) { return report('list', error) } },
  async create(task: Task): Promise<void> { try { const db = await getDatabase(); await db.runAsync('INSERT INTO tasks (id, text, done, created_at) VALUES (?, ?, ?, ?)', task.id, task.text, task.done ? 1 : 0, task.createdAt) } catch (error) { return report('create', error) } },
  async toggle(id: string, done: boolean): Promise<void> { try { const db = await getDatabase(); await db.runAsync('UPDATE tasks SET done = ? WHERE id = ?', done ? 1 : 0, id) } catch (error) { return report('toggle', error) } },
  async remove(id: string): Promise<void> { try { const db = await getDatabase(); await db.runAsync('DELETE FROM tasks WHERE id = ?', id) } catch (error) { return report('remove', error) } },
}
