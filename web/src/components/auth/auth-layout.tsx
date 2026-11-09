import { BrandMark } from '@/components/brand-mark';
import { LegalLink } from '@/components/legal/legal-link';
import { LEGAL_URLS } from '@/lib/legal';
import { en } from '@/locales/en';

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
        <footer
          aria-label={en.legal.footerLabel}
          className="mt-10 text-center text-xs text-muted-foreground"
        >
          <LegalLink href={LEGAL_URLS.terms}>{en.legal.termsShort}</LegalLink>
          <span aria-hidden="true" className="mx-2">
            ·
          </span>
          <LegalLink href={LEGAL_URLS.privacy}>{en.legal.privacyShort}</LegalLink>
        </footer>
      </div>
    </div>
  );
}
