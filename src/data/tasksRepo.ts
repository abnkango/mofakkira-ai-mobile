import { seedTasks } from '../data'
import type { Task } from '../domain'

export const tasksRepo = {
  async list(): Promise<Task[]> {
    return JSON.parse(JSON.stringify(seedTasks)) as Task[]
  },
}
