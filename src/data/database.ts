import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite'

const databaseName = 'mofakkira.db'
const latestVersion = 2

let databasePromise: Promise<SQLiteDatabase> | null = null

const migrate = async (db: SQLiteDatabase): Promise<void> => {
  await db.execAsync('PRAGMA foreign_keys = ON;')
  await db.withExclusiveTransactionAsync(async (transaction) => {
    const row = await transaction.getFirstAsync<{ user_version: number }>('PRAGMA user_version')
    const currentVersion = row?.user_version ?? 0
    if (currentVersion < 1) {
      await transaction.execAsync(`
        CREATE TABLE IF NOT EXISTS folders (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS notes (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          body TEXT NOT NULL,
          folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
          original_folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          deleted_at INTEGER
        );
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY NOT NULL,
          text TEXT NOT NULL,
          done INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS meta (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );
        PRAGMA user_version = 1;
      `)
    }
    if (currentVersion < 2) {
      await transaction.execAsync(`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id TEXT PRIMARY KEY NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
          content TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          sources TEXT
        );
        PRAGMA user_version = 2;
      `)
    }
  })
}

export const initializeDatabase = async (): Promise<SQLiteDatabase> => {
  if (!databasePromise) {
    databasePromise = openDatabaseAsync(databaseName).then(async (db) => {
      await migrate(db)
      const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version')
      if ((version?.user_version ?? 0) !== latestVersion) throw new Error(`Unsupported database schema version: ${version?.user_version ?? 0}`)
      return db
    }).catch((error: unknown) => {
      databasePromise = null
      throw error
    })
  }
  return databasePromise
}

export const getDatabase = async (): Promise<SQLiteDatabase> => initializeDatabase()

export const resetDatabase = async (): Promise<void> => {
  const db = await getDatabase()
  await db.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.execAsync('DROP TABLE IF EXISTS notes; DROP TABLE IF EXISTS tasks; DROP TABLE IF EXISTS folders; DROP TABLE IF EXISTS chat_messages; DROP TABLE IF EXISTS meta; PRAGMA user_version = 0;')
  })
  await migrate(db)
}
