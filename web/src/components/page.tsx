import { cn } from '@/lib/utils';

interface PageProps {
  title: string;
  /**
   * Fill the viewport height and let the content manage its own scrolling and padding
   * (used by full-bleed pages such as the transactions table).
   */
  fill?: boolean;
  children?: React.ReactNode;
}

/** Standard page frame for authenticated routes: a title bar with content below. */
export function Page({ title, fill = false, children }: PageProps) {
  return (
    <div className={cn('flex flex-col', fill ? 'h-full' : 'min-h-full')}>
      <header className="flex h-12 shrink-0 items-center border-b px-6">
        <h1 className="text-base font-semibold">{title}</h1>
      </header>
      <div className={fill ? 'flex min-h-0 flex-1 flex-col' : 'flex-1 px-6 py-4'}>{children}</div>
    </div>
  );
}
