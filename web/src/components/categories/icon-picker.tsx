import { useState } from 'react';

import { CategoryIcon } from '@/components/transactions/category-label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CATEGORY_ICON_GROUPS } from '@/lib/category-icon-groups';
import { getCategoryIconSvg } from '@/lib/category-icons';
import { cn } from '@/lib/utils';
import { en } from '@/locales/en';
import { toIconValue } from '@/utils/category';
import { interpolate } from '@/utils/string';

const t = en.categories;

interface IconPickerProps {
  /** Stored value ("Ionicons/fast-food") or null. */
  icon: string | null;
  color: string;
  /** Name of the category, for the button's label. */
  categoryName: string;
  /** Receives the bare Ionicons name ("fast-food"). */
  onSelect: (iconName: string) => void;
}

/**
 * The category's icon as a button that opens the icon grid: the same curated Ionicons, in the
 * same groups, as mobile's icon picker. Picking one closes it, as on mobile.
 */
export function IconPicker({ icon, color, categoryName, onSelect }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const label = interpolate(t.changeIcon, { name: categoryName || t.newCategory });

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          title={label}
          className="flex size-8 w-full items-center justify-center outline-none hover:bg-muted focus-visible:bg-muted aria-expanded:bg-muted"
        >
          <CategoryIcon icon={icon} color={color} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 gap-0 p-0">
        <p className="border-b px-3 py-2 font-medium">{t.chooseIcon}</p>
        <div className="max-h-[min(20rem,calc(var(--radix-popover-content-available-height)-3rem))] overflow-y-auto p-2">
          {CATEGORY_ICON_GROUPS.map((group) => (
            <div key={group.label} role="group" aria-label={group.label}>
              <p className="px-1 pt-2 pb-1 text-xs font-medium text-muted-foreground">
                {group.label}
              </p>
              <div className="grid grid-cols-9 gap-0.5">
                {group.icons.map((name) => {
                  const value = toIconValue(name);
                  const isSelected = value === icon;
                  return (
                    <button
                      key={name}
                      type="button"
                      aria-label={name}
                      aria-pressed={isSelected}
                      title={name}
                      onClick={() => {
                        onSelect(name);
                        setIsOpen(false);
                      }}
                      className={cn(
                        'flex aspect-square items-center justify-center rounded-md text-foreground/70 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring',
                        isSelected && 'text-white hover:opacity-90',
                      )}
                      style={isSelected ? { backgroundColor: color } : undefined}
                    >
                      <span
                        aria-hidden
                        className="size-4 [&>svg]:size-full"
                        // Static markup from the `ionicons` package, looked up by name.
                        dangerouslySetInnerHTML={{ __html: getCategoryIconSvg(value) ?? '' }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
