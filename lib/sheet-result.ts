import type { Tables } from '@/types/supabase';

/**
 * Results that sheet routes (`app/(sheets)/*`) hand back to the screen that presented them.
 *
 * A sheet gets its inputs as serializable route params (including a `requestId`), and returns its
 * result in memory through this one-shot pub/sub: the sheet emits once, then leaves
 * (`goBackOrHome`). Nothing is stored, so a result nobody is listening for is dropped. Add one
 * entry per sheet route, keyed by the route name.
 */
export interface SheetResultPayloads {
  'category-picker': { category: Tables<'categories'> };
  'icon-picker': { icon: string };
  'color-picker': { color: string };
  /** The guest's choice on the sign-in prompt (#100); the presenter closes it and goes on. */
  'sign-in-prompt': { choice: 'signIn' | 'notNow' };
  /** The paywall (#79): Premium was bought or restored, so the held feature can go on. */
  paywall: { purchased: boolean };
  /** The AI consent prompt (#122): Allow or Not Now; the presenter closes it and goes on. */
  'ai-consent': { choice: 'allow' | 'notNow' };
}

export type SheetKey = keyof SheetResultPayloads;

export interface SheetResult<K extends SheetKey> {
  /** Identifies the presenter that opened the sheet (several screens can open the same sheet). */
  requestId: string;
  payload: SheetResultPayloads[K];
}

type Listener<K extends SheetKey> = (result: SheetResult<K>) => void;

const listeners: { [K in SheetKey]?: Set<Listener<K>> } = {};

function getListeners<K extends SheetKey>(key: K): Set<Listener<K>> {
  let set = listeners[key] as Set<Listener<K>> | undefined;
  if (!set) {
    set = new Set();
    (listeners as Record<K, Set<Listener<K>>>)[key] = set;
  }
  return set;
}

/** Delivers a sheet's result to everyone subscribed to `key` (they filter by `requestId`). */
export function emitSheetResult<K extends SheetKey>(
  key: K,
  requestId: string,
  payload: SheetResultPayloads[K],
): void {
  for (const listener of [...getListeners(key)]) {
    listener({ requestId, payload });
  }
}

/** Subscribes to every result of `key`. Returns the unsubscribe function. */
export function subscribeSheetResult<K extends SheetKey>(
  key: K,
  listener: Listener<K>,
): () => void {
  const set = getListeners(key);
  set.add(listener);
  return () => {
    set.delete(listener);
  };
}

let requestCounter = 0;

/** A process-unique id a presenter passes to a sheet as its `requestId` param. */
export function createSheetRequestId(): string {
  requestCounter += 1;
  return `sheet-${Date.now().toString(36)}-${requestCounter}`;
}
