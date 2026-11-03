import type { FormIcon } from '@/components/native-form-types';

/** Props shared by the iOS and Android builds of the form extras (refreshable form, rows, placeholders). */

export type RefreshableFormProps = {
  /** Pull-to-refresh handler; resolves when the refresh is done. */
  onRefresh: () => Promise<void>;
  /** Android only: whether the refresh indicator shows (iOS tracks the promise itself). */
  isRefreshing: boolean;
  children: React.ReactNode;
};

/** A status glyph trailing a detail row. */
export type FormRowStatus = {
  tone: 'positive' | 'negative';
  /** Spoken in place of the glyph. */
  label: string;
};

export type FormDetailRowProps = {
  title: string;
  /** Secondary line under the title. */
  subtitle?: string;
  icon?: FormIcon;
  status?: FormRowStatus;
  /** Lets the user select and copy the title (e.g. shared text). */
  selectable?: boolean;
};

export type FormImageRowProps = {
  /** A local `file://` or remote image URI. */
  uri: string;
  accessibilityLabel?: string;
};

export type ContentPlaceholderProps = {
  title: string;
  message?: string;
  icon: FormIcon;
};
