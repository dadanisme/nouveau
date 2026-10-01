/** Sends the real DELETE for the given ids. A rejection means the rows were not deleted. */
export type CommitDelete = (ids: string[]) => Promise<unknown>;

interface Batch {
  ids: string[];
  timer: ReturnType<typeof setTimeout>;
  commit: CommitDelete;
  /** Called once when the batch stops waiting, whether it was committed or cancelled. */
  onLeave?: () => void;
}

const NO_IDS: ReadonlySet<string> = new Set();

/**
 * Deletes that are waiting for their Undo window to pass. Rows in a waiting batch are hidden
 * from the UI but still in the database; the DELETE is only sent when the batch is committed
 * (its delay runs out, its toast is dismissed, or everything is flushed). Cancelling a batch
 * sends nothing. Batches are independent, so a second delete never replaces the first.
 *
 * No React or Supabase in here: the caller supplies the function that sends the DELETE.
 */
export class PendingDeleteQueue {
  private nextId = 1;
  private readonly waiting = new Map<number, Batch>();
  /** Ids whose DELETE is in flight; they stay hidden until it settles. */
  private readonly committing = new Map<string, number>();
  private readonly inFlight = new Set<Promise<void>>();
  private readonly listeners = new Set<() => void>();
  private hidden: ReadonlySet<string> = NO_IDS;

  /** Hides `ids` and commits them after `delayMs` unless cancelled first. Returns the batch id. */
  schedule(ids: string[], delayMs: number, commit: CommitDelete, onLeave?: () => void): number {
    const batchId = this.nextId++;
    const timer = setTimeout(() => this.commit(batchId), delayMs);
    this.waiting.set(batchId, { ids, timer, commit, onLeave });
    this.refresh();
    return batchId;
  }

  /** Undo: the rows come back and nothing is sent. False when the batch is no longer waiting. */
  cancel(batchId: number): boolean {
    const batch = this.take(batchId);
    if (!batch) return false;
    this.refresh();
    batch.onLeave?.();
    return true;
  }

  /** Sends the DELETE for one batch now. Does nothing if it was already committed or cancelled. */
  commit(batchId: number, commitWith?: CommitDelete): void {
    const batch = this.take(batchId);
    if (!batch) return;

    for (const id of batch.ids) this.committing.set(id, (this.committing.get(id) ?? 0) + 1);
    this.refresh();

    let sent: Promise<unknown>;
    try {
      sent = (commitWith ?? batch.commit)(batch.ids);
    } catch (error) {
      sent = Promise.reject(error);
    }
    const settled: Promise<void> = sent
      .catch(() => undefined) // The caller's commit function reports its own errors.
      .then(() => {
        for (const id of batch.ids) {
          const count = (this.committing.get(id) ?? 1) - 1;
          if (count > 0) this.committing.set(id, count);
          else this.committing.delete(id);
        }
        this.inFlight.delete(settled);
        this.refresh();
      });
    this.inFlight.add(settled);
    batch.onLeave?.();
  }

  /**
   * Commits every waiting batch now and resolves once all DELETEs (including ones already in
   * flight) have settled. `commitWith` replaces the batches' own commit function, for the
   * page-unload path that needs a keepalive request.
   */
  flush(commitWith?: CommitDelete): Promise<void> {
    for (const batchId of [...this.waiting.keys()]) this.commit(batchId, commitWith);
    return Promise.all([...this.inFlight]).then(() => undefined);
  }

  get hasWaiting(): boolean {
    return this.waiting.size > 0;
  }

  /** Ids to leave out of the UI. The same set object is returned until it changes. */
  getHiddenIds = (): ReadonlySet<string> => this.hidden;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private take(batchId: number): Batch | undefined {
    const batch = this.waiting.get(batchId);
    if (!batch) return undefined;
    clearTimeout(batch.timer);
    this.waiting.delete(batchId);
    return batch;
  }

  private refresh() {
    const ids = new Set<string>(this.committing.keys());
    for (const batch of this.waiting.values()) for (const id of batch.ids) ids.add(id);
    this.hidden = ids.size === 0 ? NO_IDS : ids;
    for (const listener of this.listeners) listener();
  }
}

/** The app's queue. Module-level so it outlives the transactions page (navigation, sign-out). */
export const pendingDeletes = new PendingDeleteQueue();
