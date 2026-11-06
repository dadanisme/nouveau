import { randomUUID } from 'expo-crypto';
import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import type { SqlAdapter, SqlValue } from './adapter';
import { createLocalQueries, type LocalQueries } from './queries';
import { migrate, prepareConnection } from './schema';

/** The guest's store: one SQLite file on the device, never synced. */
const DATABASE_NAME = 'guest.db';

/**
 * Wraps an expo-sqlite connection. Exclusive transactions run on a connection of their own (as
 * `withExclusiveTransactionAsync` does, so nothing else on the main connection slips into them),
 * which is prepared like every other connection before it begins.
 */
function adapt(db: SQLiteDatabase): SqlAdapter {
  return {
    async run(sql: string, params: SqlValue[] = []) {
      await db.runAsync(sql, params);
    },
    getAll<T>(sql: string, params: SqlValue[] = []) {
      return db.getAllAsync<T>(sql, params);
    },
    getFirst<T>(sql: string, params: SqlValue[] = []) {
      return db.getFirstAsync<T>(sql, params);
    },
    async exclusiveTransaction<T>(task: (tx: SqlAdapter) => Promise<T>): Promise<T> {
      const connection = await openDatabaseAsync(DATABASE_NAME, { useNewConnection: true });
      try {
        const tx = adapt(connection);
        await prepareConnection(tx);
        await connection.execAsync('BEGIN EXCLUSIVE');
        try {
          const result = await task(tx);
          await connection.execAsync('COMMIT');
          return result;
        } catch (error) {
          try {
            await connection.execAsync('ROLLBACK');
          } catch {
            // SQLite may already have rolled back; keep the original error.
          }
          throw error;
        }
      } finally {
        await connection.closeAsync();
      }
    },
  };
}

let opening: Promise<LocalQueries> | null = null;

async function open(): Promise<LocalQueries> {
  const db = adapt(await openDatabaseAsync(DATABASE_NAME));
  await prepareConnection(db);
  await migrate(db);
  return createLocalQueries(db, randomUUID);
}

/** The guest store's queries, opened (and migrated) once per launch. */
export function getLocalDb(): Promise<LocalQueries> {
  if (!opening) {
    opening = open().catch((error) => {
      // Let the next call try again rather than keep a failed open.
      opening = null;
      throw error;
    });
  }
  return opening;
}

/** Deletes everything the guest stored on this device. */
export async function eraseLocalData(): Promise<void> {
  const db = await getLocalDb();
  await db.eraseAll();
}
