import { Eye, EyeOff } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { en } from '@/locales/en';

interface PasswordInputProps extends Omit<React.ComponentProps<typeof Input>, 'type'> {
  visible: boolean;
  onToggleVisible: () => void;
}

export function PasswordInput({ visible, onToggleVisible, ...props }: PasswordInputProps) {
  return (
    <div className="relative">
      <Input type={visible ? 'text' : 'password'} className="bg-card pr-9" {...props} />
      <button
        type="button"
        onClick={onToggleVisible}
        aria-label={visible ? en.login.hidePassword : en.login.showPassword}
        className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
