/**
 * Placeholder route behind the Add action in the tab bar (iOS 26.1+). The tab is `disabled`,
 * so the native tab bar never selects it: a tap presents `/add-transaction` instead (see
 * `app/(tabs)/_layout.tsx`). Native tabs render every tab up front, so this must stay inert.
 */
export default function AddActionPlaceholder() {
  return null;
}
