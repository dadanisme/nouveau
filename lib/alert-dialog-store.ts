import type { AlertButton } from 'react-native';

/** One dialog for `AlertDialogHost` (Android) to present. */
export type AlertDialogRequest = {
  id: number;
  title: string;
  message?: string;
  /** The confirming action (trailing). Its `style: 'destructive'` renders in the error color. */
  confirm: AlertButton;
  /** The dismissive action (leading), from the `style: 'cancel'` button. */
  dismiss?: AlertButton;
};

let current: AlertDialogRequest | null = null;
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/** For `useSyncExternalStore` in `AlertDialogHost`; a subscribed host presents the dialogs. */
export function subscribeAlertDialog(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getAlertDialog() {
  return current;
}

/** Whether a mounted host will present `presentAlertDialog` requests. */
export function hasAlertDialogHost() {
  return listeners.size > 0;
}

export function presentAlertDialog(request: Omit<AlertDialogRequest, 'id'>) {
  current = { ...request, id: nextId++ };
  emit();
}

/** Closes the dialog, then runs the chosen button's handler (which may show another dialog). */
export function closeAlertDialog(button?: AlertButton) {
  current = null;
  emit();
  button?.onPress?.();
}
