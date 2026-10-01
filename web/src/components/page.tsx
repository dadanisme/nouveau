import { cn } from '@/lib/utils';

interface PageProps {
  title: string;
  /**
   * Fill the viewport height and let the content manage its own scrolling
   * (used by the transactions table). Its bands take `page-container` themselves.
   */
  fill?: boolean;
  /**
   * A side panel docked against the right edge of the content column. On a window wider
   * than the column plus the panel, the column stays centred and the panel sits next to it;
   * otherwise the panel is at the window's edge and the column gives up the width.
   */
  aside?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Standard page frame for authenticated routes: a title bar with content below, both in the
 * shared content column (`.page-container` in `index.css`: centred, at most `--container-page`).
 */
export function Page({ title, fill = false, aside, children }: PageProps) {
  const hasAside = Boolean(aside);

  return (
    <div
      data-page-aside={hasAside ? '' : undefined}
      className={cn('flex flex-col', fill ? 'h-full' : 'min-h-full')}
    >
      <header className="page-container page-container-full flex h-12 shrink-0 items-center border-b">
        <h1 className="text-base font-semibold">{title}</h1>
      </header>
      <div className="flex min-h-0 flex-1">
        <div className={cn('min-w-0 flex-1', fill ? 'flex flex-col' : 'page-container py-4')}>
          {children}
        </div>
        {aside}
        {hasAside && <PageAsideSpacer />}
      </div>
    </div>
  );
}

/**
 * What is left of the window to the right of a docked side panel: as wide as the centred
 * column's gutter minus the panel, nothing on ordinary widths.
 */
function PageAsideSpacer() {
  return (
    <div
      aria-hidden
      className="w-[max(0px,calc((100%-var(--container-page))/2-var(--container-page-aside)))] shrink-0 overflow-hidden"
    >
      <div className="h-full border-l" />
    </div>
  );
}
