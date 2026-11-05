import { Keyboard } from 'react-native';

type Blur = () => Promise<void>;

// RN's `Keyboard.dismiss` blurs only RN `TextInput`s, so a focused `@expo/ui` (SwiftUI) field kept
// the keyboard up, and an action sheet presented then sat under it. Fields report their focus here
// instead, and `dismissKeyboard` blurs the one that has it.
//
// Tapping a pushed screen's Back while a held navigation (`useDiscardGuard`) is pending resigns
// the field for a moment: UIKit gives it focus back ~0.1 s later, when the pop is cancelled, and
// a blur sent in between is a no-op. A field that lost focus just now is waited for and blurred
// once it's back.
let lastField: Blur | null = null;
let isFocused = false;
let lostFocusAt = 0;
let onRefocus: (() => void) | null = null;

/** How recent a focus loss counts as that transient one, and how long to wait for its return. */
const REFOCUS_WINDOW_MS = 300;

/** `FormTextFieldRow` (iOS) reports focus changes here with a stable `blur`, then `'unmounted'`. */
export function reportFieldFocus(blur: Blur, focused: boolean | 'unmounted') {
  if (focused === 'unmounted') {
    if (lastField === blur) lastField = null;
    return;
  }
  if (focused) {
    lastField = blur;
    isFocused = true;
    onRefocus?.();
  } else if (lastField === blur && isFocused) {
    isFocused = false;
    lostFocusAt = Date.now();
  }
}

function refocused(): Promise<boolean> {
  return new Promise((resolve) => {
    const finish = (value: boolean) => {
      clearTimeout(timeout);
      onRefocus = null;
      resolve(value);
    };
    const timeout = setTimeout(() => finish(false), REFOCUS_WINDOW_MS);
    onRefocus = () => finish(true);
  });
}

/**
 * Closes the keyboard, whether an RN `TextInput` or a native form field holds it. Use it instead
 * of `Keyboard.dismiss`. Resolves once the field has been blurred, so an action sheet shown after
 * it isn't covered by the keyboard.
 */
export async function dismissKeyboard(): Promise<void> {
  // eslint-disable-next-line no-restricted-properties -- the one place RN's dismiss is called.
  Keyboard.dismiss();
  const field = lastField;
  if (!field) return;
  if (!isFocused) {
    if (Date.now() - lostFocusAt > REFOCUS_WINDOW_MS || !(await refocused())) return;
  }
  // Marked unfocused first, so the blur event this causes isn't taken for a transient loss.
  isFocused = false;
  lostFocusAt = 0;
  await field().catch(() => undefined);
}
