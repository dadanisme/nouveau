import type { Database } from 'bun:sqlite';

import type { SqlAdapter, SqlValue } from '../lib/local-db/adapter';

/**
 * `SqlAdapter` (`lib/local-db/adapter.ts`) on a `bun:sqlite` database, so the scripts run the
 * guest store's SQL as the app runs it on expo-sqlite.
 */
export function adaptBunSqlite(db: Database): SqlAdapter {
  const adapter: SqlAdapter = {
    async run(sql: string, params: SqlValue[] = []) {
      db.query(sql).run(...params);
    },
    async getAll<T>(sql: string, params: SqlValue[] = []) {
      return db.query(sql).all(...params) as T[];
    },
    async getFirst<T>(sql: string, params: SqlValue[] = []) {
      return (db.query(sql).get(...params) ?? null) as T | null;
    },
    async exclusiveTransaction<T>(task: (tx: SqlAdapter) => Promise<T>) {
      db.run('BEGIN EXCLUSIVE');
      try {
        const result = await task(adapter);
        db.run('COMMIT');
        return result;
      } catch (error) {
        db.run('ROLLBACK');
        throw error;
      }
    },
  };
  return adapter;
}
