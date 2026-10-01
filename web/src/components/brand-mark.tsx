import { cn } from '@/lib/utils';
import { en } from '@/locales/en';

export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 text-sm font-semibold', className)}>
      <span
        aria-hidden
        className="flex size-5 items-center justify-center rounded-sm bg-primary text-xs font-bold text-primary-foreground"
      >
        N
      </span>
      {en.common.appName}
    </div>
  );
}
