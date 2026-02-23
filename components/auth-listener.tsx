import { useAuthListener } from '@/hooks/use-auth-listener';

export function AuthListener({ children }: { children: React.ReactNode }) {
  useAuthListener();
  return children;
}
