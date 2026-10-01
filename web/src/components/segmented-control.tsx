import { cn } from '@/lib/utils';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
  /** What the group chooses, for assistive technology. */
  label: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** A row of mutually exclusive options in one bordered pill; the picked one is tinted amber. */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('flex h-7 rounded-lg border p-0.5', className)}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2 text-[0.8rem] font-medium text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-3.5',
            value === option.value ? 'bg-primary-soft text-foreground' : 'hover:text-foreground',
          )}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}
