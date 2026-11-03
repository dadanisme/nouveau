import type { FormSymbol } from '@/components/native-form-types';

/** What a transaction row shows, already formatted (see `toTransactionRowData` in utils). */
export type TransactionRowData = {
  id: string;
  /** The note, or the category name when there is none. */
  title: string;
  /** The category name (and the date, where rows aren't grouped by day). */
  subtitle: string;
  /** The category's mapped symbol in its system color. */
  symbol: FormSymbol;
  /** Signed amount in the home currency, e.g. "+Rp50K" / "-Rp12K". */
  amount: string;
  isIncome: boolean;
  /** The amount in its original currency, for foreign-currency transactions. */
  originalAmount?: string;
  hasProofs: boolean;
};

export type TransactionRowProps = {
  transaction: TransactionRowData;
  onPress: () => void;
  /** Adds an Edit entry to the long-press menu (omit it when tapping already edits elsewhere). */
  onEdit?: () => void;
  /** Adds a View Proofs entry to the long-press menu; shown only when the row has proofs. */
  onViewProofs?: () => void;
  /**
   * Adds Delete to the long-press menu and, on iOS, a trailing swipe action. The handler should
   * confirm (`Alert.alert`) before deleting.
   */
  onDelete?: () => void;
};
