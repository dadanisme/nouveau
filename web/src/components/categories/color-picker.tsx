import { CheckIcon } from 'lucide-react';
import { useState } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CATEGORY_COLORS } from '@/lib/category-colors';
import { en } from '@/locales/en';
import { interpolate } from '@/utils/string';

const t = en.categories;

interface ColorPickerProps {
  color: string;
  /** Name of the category, for the button's label. */
  categoryName: string;
  onSelect: (color: string) => void;
}

/**
 * The category's colour as a button that opens mobile's colour palette. A colour outside the
 * palette (set elsewhere) is shown as it is; picking replaces it with a palette colour.
 */
export function ColorPicker({ color, categoryName, onSelect }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const label = interpolate(t.changeColor, { name: categoryName || t.newCategory });

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          title={label}
          className="flex h-8 w-full items-center gap-2 px-2 text-left outline-none hover:bg-muted focus-visible:bg-muted aria-expanded:bg-muted"
        >
          <span
            aria-hidden
            className="size-3.5 shrink-0 rounded-full ring-1 ring-foreground/10 dark:ring-foreground/25"
            style={{ backgroundColor: color }}
          />
          <span className="truncate text-xs text-muted-foreground tabular-nums">
            {color.toUpperCase()}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto gap-2 p-3">
        <p className="font-medium">{t.chooseColor}</p>
        <div className="grid grid-cols-8 gap-1.5">
          {CATEGORY_COLORS.map((option) => {
            const isSelected = option.toLowerCase() === color.toLowerCase();
            return (
              <button
                key={option}
                type="button"
                aria-label={option}
                aria-pressed={isSelected}
                title={option}
                onClick={() => {
                  onSelect(option);
                  setIsOpen(false);
                }}
                className="flex size-6 items-center justify-center rounded-full text-white ring-1 ring-foreground/10 outline-none dark:ring-foreground/25 hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                style={{ backgroundColor: option }}
              >
                {isSelected && <CheckIcon className="size-3.5" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
