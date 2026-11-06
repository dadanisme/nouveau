import { OnboardingWelcome } from '@/components/onboarding-welcome';
import { useLanguage } from '@/contexts/language';
import { useWelcomeScreen } from '@/hooks/use-welcome-screen';
import { k } from '@/locales/keys';

/**
 * Welcome (#78): where the value pages end and where signing out lands. Get Started uses the app
 * without an account (#100); "Already have an account? Sign In" opens Login.
 */
export default function WelcomeScreen() {
  const { t } = useLanguage();
  const screen = useWelcomeScreen();

  return (
    <OnboardingWelcome
      title={t(k.onboarding.welcomeTitle)}
      body={t(k.onboarding.welcomeBody)}
      getStartedLabel={t(k.onboarding.getStarted)}
      onGetStarted={screen.getStarted}
      signInPrompt={t(k.onboarding.haveAccount)}
      signInLabel={t(k.login.signIn)}
      onSignIn={screen.signIn}
    />
  );
}
