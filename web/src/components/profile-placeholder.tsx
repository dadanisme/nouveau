import { FormMessage } from '@/components/auth/form-message';
import { Page } from '@/components/page';
import { Button } from '@/components/ui/button';
import { useSession, useSignOut } from '@/hooks/use-auth';
import { en } from '@/locales/en';

export function ProfilePlaceholder() {
  const { session } = useSession();
  const signOut = useSignOut();

  return (
    <Page title={en.profile.title}>
      <div className="flex max-w-sm flex-col items-start gap-3">
        <p className="text-muted-foreground">{session?.user.email}</p>
        {signOut.error && (
          <FormMessage
            variant="error"
            title={en.profile.signOutFailed}
            message={signOut.error.message}
          />
        )}
        <Button variant="outline" onClick={() => signOut.mutate()} disabled={signOut.isPending}>
          {signOut.isPending ? en.common.pleaseWait : en.profile.signOut}
        </Button>
      </div>
    </Page>
  );
}
