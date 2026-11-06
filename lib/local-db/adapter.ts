/**
 * The few database calls the local store needs, so its SQL (`schema.ts`, `queries.ts`) runs on
 * expo-sqlite in the app and on `bun:sqlite` in `scripts/check-guest-store.ts`. Nothing here may
 * import expo.
 */
export type SqlValue = string | number | null;

export interface SqlAdapter {
  /** Runs one statement. */
  run(sql: string, params?: SqlValue[]): Promise<void>;
  getAll<T>(sql: string, params?: SqlValue[]): Promise<T[]>;
  getFirst<T>(sql: string, params?: SqlValue[]): Promise<T | null>;
  /**
   * Runs `task` in an exclusive transaction: it commits when `task` resolves and rolls back when
   * it throws. Only the `tx` adapter belongs to the transaction.
   */
  exclusiveTransaction<T>(task: (tx: SqlAdapter) => Promise<T>): Promise<T>;
}
