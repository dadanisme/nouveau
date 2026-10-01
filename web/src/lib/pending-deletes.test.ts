import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PendingDeleteQueue } from '@/lib/pending-deletes';

const DELAY = 6000;

function setup() {
  const queue = new PendingDeleteQueue();
  const commit = vi.fn((_ids: string[]) => Promise.resolve());
  return { queue, commit };
}

const hidden = (queue: PendingDeleteQueue) => [...queue.getHiddenIds()].sort();

describe('PendingDeleteQueue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('hides rows at once but sends nothing until the delay passes', async () => {
    const { queue, commit } = setup();
    queue.schedule(['a', 'b'], DELAY, commit);
    expect(hidden(queue)).toEqual(['a', 'b']);

    vi.advanceTimersByTime(DELAY - 1);
    expect(commit).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(commit).toHaveBeenCalledExactlyOnceWith(['a', 'b']);
    // Hidden until the DELETE settles, so the rows do not flash back.
    expect(hidden(queue)).toEqual(['a', 'b']);
    await queue.flush();
    expect(hidden(queue)).toEqual([]);
  });

  it('undo brings the rows back and never sends the delete', () => {
    const { queue, commit } = setup();
    const batch = queue.schedule(['a'], DELAY, commit);
    expect(queue.cancel(batch)).toBe(true);
    expect(hidden(queue)).toEqual([]);

    vi.advanceTimersByTime(DELAY * 2);
    expect(commit).not.toHaveBeenCalled();
    expect(queue.cancel(batch)).toBe(false);
  });

  it('commits once even when dismissed and expired', () => {
    const { queue, commit } = setup();
    const batch = queue.schedule(['a'], DELAY, commit);
    queue.commit(batch);
    queue.commit(batch);
    vi.advanceTimersByTime(DELAY);
    expect(commit).toHaveBeenCalledTimes(1);
    // Too late to undo.
    expect(queue.cancel(batch)).toBe(false);
  });

  it('keeps a first delete when a second one starts', () => {
    const { queue, commit } = setup();
    const first = queue.schedule(['a'], DELAY, commit);
    vi.advanceTimersByTime(4000);
    queue.schedule(['b'], DELAY, commit);
    expect(hidden(queue)).toEqual(['a', 'b']);

    vi.advanceTimersByTime(2000);
    expect(commit).toHaveBeenCalledExactlyOnceWith(['a']);
    expect(queue.cancel(first)).toBe(false);

    vi.advanceTimersByTime(4000);
    expect(commit).toHaveBeenLastCalledWith(['b']);
    expect(commit).toHaveBeenCalledTimes(2);
  });

  it('undoing one batch leaves the other pending', () => {
    const { queue, commit } = setup();
    const first = queue.schedule(['a'], DELAY, commit);
    queue.schedule(['b'], DELAY, commit);
    queue.cancel(first);
    expect(hidden(queue)).toEqual(['b']);
    vi.advanceTimersByTime(DELAY);
    expect(commit).toHaveBeenCalledExactlyOnceWith(['b']);
  });

  it('flush commits everything waiting and resolves when the deletes settle', async () => {
    const { queue } = setup();
    const finish: (() => void)[] = [];
    const slow = vi.fn(
      (_ids: string[]) => new Promise<void>((resolve) => finish.push(() => resolve())),
    );
    queue.schedule(['a'], DELAY, slow);
    queue.schedule(['b'], DELAY, slow);

    let done = false;
    const flushed = queue.flush().then(() => {
      done = true;
    });
    expect(slow).toHaveBeenCalledTimes(2);
    expect(queue.hasWaiting).toBe(false);
    await Promise.resolve();
    expect(done).toBe(false);
    expect(hidden(queue)).toEqual(['a', 'b']);

    finish.forEach((resolve) => resolve());
    await flushed;
    expect(done).toBe(true);
    expect(hidden(queue)).toEqual([]);

    // The timers were cleared: nothing is sent a second time.
    vi.advanceTimersByTime(DELAY);
    expect(slow).toHaveBeenCalledTimes(2);
  });

  it('flush can commit with a different sender (page unload)', async () => {
    const { queue, commit } = setup();
    const keepalive = vi.fn((_ids: string[]) => Promise.resolve());
    queue.schedule(['a'], DELAY, commit);
    await queue.flush(keepalive);
    expect(keepalive).toHaveBeenCalledExactlyOnceWith(['a']);
    expect(commit).not.toHaveBeenCalled();
    expect(hidden(queue)).toEqual([]);
  });

  it('unhides the rows when the delete fails', async () => {
    const queue = new PendingDeleteQueue();
    const batch = queue.schedule(['a'], DELAY, () => Promise.reject(new Error('nope')));
    queue.commit(batch);
    await queue.flush();
    expect(hidden(queue)).toEqual([]);
  });

  it('tells the caller when a batch stops waiting, and notifies subscribers', () => {
    const { queue, commit } = setup();
    const onLeave = vi.fn();
    const listener = vi.fn();
    queue.subscribe(listener);

    const first = queue.schedule(['a'], DELAY, commit, onLeave);
    expect(listener).toHaveBeenCalledTimes(1);
    queue.cancel(first);
    expect(onLeave).toHaveBeenCalledTimes(1);

    queue.schedule(['b'], DELAY, commit, onLeave);
    vi.advanceTimersByTime(DELAY);
    expect(onLeave).toHaveBeenCalledTimes(2);
  });

  it('returns a stable hidden set between changes', () => {
    const { queue, commit } = setup();
    const empty = queue.getHiddenIds();
    queue.schedule(['a'], DELAY, commit);
    const one = queue.getHiddenIds();
    expect(one).not.toBe(empty);
    expect(queue.getHiddenIds()).toBe(one);
  });
});
