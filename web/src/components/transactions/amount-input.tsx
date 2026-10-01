import { useAmountInput } from '@/hooks/use-amount-input';

interface AmountInputProps extends Omit<
  React.ComponentProps<'input'>,
  'value' | 'onChange' | 'type' | 'inputMode'
> {
  /** The plain amount: digits with an optional "." decimal point, e.g. "2000000". */
  value: string;
  onValueChange: (value: string) => void;
  /** The amount's currency and the workspace's: they decide decimals and separators. */
  currency: string;
  homeCurrency: string;
}

/** A text input for an amount that shows thousands separators while typing. */
export function AmountInput({
  value,
  onValueChange,
  currency,
  homeCurrency,
  ref,
  onKeyDown,
  onPaste,
  onCut,
  ...props
}: AmountInputProps) {
  const { inputRef, text, handleChange, rememberSelection } = useAmountInput({
    value,
    onValueChange,
    currency,
    homeCurrency,
  });

  return (
    <input
      {...props}
      ref={(node) => {
        inputRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      autoComplete="off"
      inputMode="decimal"
      value={text}
      onChange={handleChange}
      onKeyDown={(event) => {
        rememberSelection(event.currentTarget);
        onKeyDown?.(event);
      }}
      onPaste={(event) => {
        rememberSelection(event.currentTarget);
        onPaste?.(event);
      }}
      onCut={(event) => {
        rememberSelection(event.currentTarget);
        onCut?.(event);
      }}
    />
  );
}
