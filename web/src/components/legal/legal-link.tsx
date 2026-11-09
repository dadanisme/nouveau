import { cn } from '@/lib/utils';
import { en } from '@/locales/en';

interface LegalLinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
}

/** A link to a legal page (#81): a new tab, announced as one to screen readers. */
export function LegalLink({ href, className, children }: LegalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('underline-offset-4 hover:underline', className)}
    >
      {children}
      <span className="sr-only"> {en.legal.opensInNewTab}</span>
    </a>
  );
}
