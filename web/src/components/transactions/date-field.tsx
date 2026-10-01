import { useState } from 'react';

import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { en } from '@/locales/en';
import { parseDateInput, parseDateKey, toLocalDateString } from '@/utils/date';

interface DateFieldProps {
  /** What is typed: `YYYY-MM-DD`, or a shorthand `parseDateInput` understands. */
  text: string;
  onTextChange: (text: string) => void;
  /** A day was clicked in the calendar. `onTextChange` is called with it first. */
  onPick?: (dateKey: string) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  autoFocus?: boolean;
  invalid?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
}

/**
 * Date cell editor: a text input with a calendar open below it while it has focus. Focus
 * stays in the input when the calendar is clicked, so typing, Enter and Tab keep working.
 */
export function DateField({
  text,
  onTextChange,
  onPick,
  onKeyDown,
  onBlur,
  autoFocus,
  invalid,
  inputRef,
}: DateFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  // Parsed only while the calendar is showing.
  const selectedKey = isFocused ? parseDateInput(text, new Date()) : null;
  const selected = selectedKey ? (parseDateKey(selectedKey) ?? undefined) : undefined;

  return (
    <Popover open={isFocused}>
      <PopoverAnchor asChild>
        <input
          ref={inputRef}
          aria-label={en.transactions.columns.date}
          aria-invalid={invalid || undefined}
          autoFocus={autoFocus}
          autoComplete="off"
          value={text}
          placeholder={en.transactions.datePlaceholder}
          className="h-8 w-full bg-transparent px-2 tabular-nums outline-none placeholder:text-muted-foreground"
          onChange={(event) => onTextChange(event.target.value)}
          onFocus={(event) => {
            setIsFocused(true);
            event.target.select();
          }}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          onKeyDown={onKeyDown}
        />
      </PopoverAnchor>
      <PopoverContent
        align="start"
        sideOffset={2}
        className="w-auto p-0"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        // Keep focus in the input while the calendar is clicked.
        onMouseDown={(event) => event.preventDefault()}
      >
        <Calendar
          // Remount to jump to the typed date's month.
          key={selectedKey ?? 'none'}
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onDayClick={(day) => {
            const dateKey = toLocalDateString(day);
            onTextChange(dateKey);
            onPick?.(dateKey);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
