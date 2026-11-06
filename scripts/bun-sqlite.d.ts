// The slice of Bun's built-in `bun:sqlite` that `check-guest-store.ts` uses. The app has no
// bun-types dependency, and this keeps `tsc --noEmit` checking the script.
declare module 'bun:sqlite' {
  type Binding = string | number | bigint | boolean | null | Uint8Array;

  interface Statement {
    run(...params: Binding[]): unknown;
    all(...params: Binding[]): unknown[];
    get(...params: Binding[]): unknown;
  }

  export class Database {
    constructor(filename?: string);
    query(sql: string): Statement;
    run(sql: string): unknown;
    close(): void;
  }
}
