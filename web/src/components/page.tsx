interface PageProps {
  title: string;
  children?: React.ReactNode;
}

/** Standard page frame for authenticated routes: a title bar with content below. */
export function Page({ title, children }: PageProps) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex h-12 shrink-0 items-center border-b px-6">
        <h1 className="text-base font-semibold">{title}</h1>
      </header>
      <div className="flex-1 px-6 py-4">{children}</div>
    </div>
  );
}
