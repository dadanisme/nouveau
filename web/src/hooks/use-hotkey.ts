import { useEffect, useEffectEvent } from 'react';

import { isEditableTarget } from '@/utils/dom';

/**
 * Runs `handler` when a single key is pressed without modifiers, unless the user is typing
 * in a field or a dialog is open.
 */
export function useHotkey(key: string, handler: () => void, enabled = true) {
  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.key.toLowerCase() !== key.toLowerCase()) return;
    if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
    if (isEditableTarget(event.target)) return;
    if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
    event.preventDefault();
    handler();
  });

  useEffect(() => {
    if (!enabled) return;
    const listener = (event: KeyboardEvent) => onKey(event);
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [enabled]);
}
