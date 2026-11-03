/**
 * Android only: see `add-transaction-fab.android.tsx`. iOS puts the Add action in the tab bar
 * or the Transactions header instead (`getAddActionPlacement`).
 */
export function AddTransactionFab() {
  return null;
}

/** Bottom space a scroll view needs so its last row can clear the FAB. */
export const ADD_FAB_CLEARANCE = 0;
