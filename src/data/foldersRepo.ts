import { seedFolders } from '../data'
import type { Folder } from '../domain'

export const foldersRepo = {
  async list(): Promise<Folder[]> {
    return JSON.parse(JSON.stringify(seedFolders)) as Folder[]
  },
}
