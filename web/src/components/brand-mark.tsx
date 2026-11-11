import { cn } from '@/lib/utils';
import { en } from '@/locales/en';

/** The Nouveau mark (same paths as `assets/images/logo.svg`): white arches and a dot on the brand orange. */
function NouveauMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 1024 1024" className={className}>
      <rect width="1024" height="1024" rx="228" fill="#E24A00" />
      <g fill="#FFFFFF">
        <path d="M248 728 V528 A264 264 0 0 1 776 528 V728 A32 32 0 0 1 712 728 V528 A200 200 0 0 0 312 528 V728 A32 32 0 0 1 248 728 Z" />
        <path d="M376 728 V528 A136 136 0 0 1 648 528 V728 A32 32 0 0 1 584 728 V528 A72 72 0 0 0 440 528 V728 A32 32 0 0 1 376 728 Z" />
        <circle cx="512" cy="636" r="46" />
      </g>
    </svg>
  );
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 text-sm font-semibold', className)}>
      <NouveauMark className="size-6" />
      {en.common.appName}
    </div>
  );
}
