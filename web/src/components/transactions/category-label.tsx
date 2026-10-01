import { cn } from '@/lib/utils';
import { getCategoryIconSvg } from '@/lib/category-icons';
import type { TransactionCategory } from '@/types/transaction';
import { categoryTint } from '@/utils/category';

interface CategoryIconProps {
  icon: string | null;
  color: string;
  className?: string;
}

/** The category's Ionicon in its colour on a tinted tile; a dot when it has no known icon. */
export function CategoryIcon({ icon, color, className }: CategoryIconProps) {
  const svg = getCategoryIconSvg(icon);
  return (
    <span
      aria-hidden
      className={cn('flex size-5 shrink-0 items-center justify-center rounded-sm', className)}
      style={{ backgroundColor: categoryTint(color), color }}
    >
      {svg ? (
        <span
          className="size-3/5 [&>svg]:size-full [&>svg]:fill-current"
          // Static markup from the `ionicons` package, looked up by name; never user input.
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <span className="size-2/5 rounded-full bg-current" />
      )}
    </span>
  );
}

interface CategoryLabelProps {
  category: Pick<TransactionCategory, 'name' | 'color' | 'icon'>;
  className?: string;
}

export function CategoryLabel({ category, className }: CategoryLabelProps) {
  return (
    <span className={cn('flex min-w-0 items-center gap-2', className)}>
      <CategoryIcon icon={category.icon} color={category.color} />
      <span className="truncate">{category.name}</span>
    </span>
  );
}
