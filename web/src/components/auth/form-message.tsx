import { cn } from '@/lib/utils';

interface FormMessageProps {
  variant: 'error' | 'info';
  title: string;
  message: string;
}

export function FormMessage({ variant, title, message }: FormMessageProps) {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-md border px-3 py-2',
        variant === 'error'
          ? 'border-destructive/30 bg-destructive/5'
          : 'border-primary/40 bg-primary-soft',
      )}
    >
      <p className={cn('font-medium', variant === 'error' && 'text-destructive')}>{title}</p>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
