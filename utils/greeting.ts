import i18n from '@/lib/i18n';
import { k } from '@/locales/keys';

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return i18n.t(k.greeting.morning);
  if (hour < 17) return i18n.t(k.greeting.afternoon);
  return i18n.t(k.greeting.evening);
}
