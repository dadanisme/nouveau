import { BrandMark } from '@/components/brand-mark';

interface AuthLayoutProps {
  heading: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthLayout({ heading, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-full items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <BrandMark className="mb-8" />
        <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
        <p className="mt-1.5 text-muted-foreground">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
