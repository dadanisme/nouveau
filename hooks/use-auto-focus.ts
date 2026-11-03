import { useEffect, useEffectEvent, useRef, type RefObject } from 'react';

// A field focused while its sheet or modal is still presenting doesn't take focus (seen on iOS 18
// and Android, longest on the first presentation after a cold launch), so keep trying every
// interval until the field reports focus, for a bounded time.
const AUTO_FOCUS_INTERVAL_MS = 400;
const AUTO_FOCUS_MAX_ATTEMPTS = 6;

type Focusable = { focus: () => unknown };

/** Focuses a field, ignoring a rejection from a native view that isn't ready yet. */
export function focusField(ref: RefObject<Focusable | null>): void {
  Promise.resolve(ref.current?.focus()).catch(() => {});
}

/**
 * Focuses a field once its screen has presented: retries until the field reports focus. Returns
 * the handler to pass as the field's focus-change callback.
 */
export function useAutoFocus(
  ref: RefObject<Focusable | null>,
  enabled: boolean | undefined,
): (focused: boolean) => void {
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    let attempts = 0;
    const timer = setInterval(() => {
      if (focusedRef.current || attempts >= AUTO_FOCUS_MAX_ATTEMPTS) {
        clearInterval(timer);
        return;
      }
      attempts += 1;
      focusField(ref);
    }, AUTO_FOCUS_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [enabled, ref]);

  return (focused) => {
    focusedRef.current = focused;
  };
}

/**
 * Runs `onReset` whenever `resetKey` changes after mount, e.g. to reload a native field's text
 * after a form reset. Resetting the mounted field (rather than remounting it with a new `key`)
 * keeps its native view, so it can be focused again right away.
 */
export function useResetEffect(resetKey: number, onReset: () => void): void {
  const lastKey = useRef(resetKey);
  const handleReset = useEffectEvent(onReset);

  useEffect(() => {
    if (lastKey.current === resetKey) return;
    lastKey.current = resetKey;
    handleReset();
  }, [resetKey]);
}
