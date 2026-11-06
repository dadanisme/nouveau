import type { FormIcon } from '@/components/native-form-types';

/** One first-run value page (#78): a symbol in a tinted circle, a title and a line of body. */
export type OnboardingPage = {
  key: string;
  icon: FormIcon;
  title: string;
  body: string;
};

/**
 * The value pages: a swipeable pager with page dots and a Continue button under it. Controlled:
 * `page` is the page shown, Continue calls `onContinue` (which moves `page` on, animated, or leaves
 * after the last page), and a swipe reports the page it settles on through `onPageChange`.
 */
export type OnboardingPagerProps = {
  pages: readonly OnboardingPage[];
  page: number;
  onPageChange: (page: number) => void;
  continueLabel: string;
  /** The page dots' spoken label, e.g. "Page 1 of 3". */
  pageIndicatorLabel: string;
  onContinue: () => void;
};

/** The Welcome screen: the logo, a title and body, Get Started, and the Sign In link under it. */
export type OnboardingWelcomeProps = {
  title: string;
  body: string;
  getStartedLabel: string;
  onGetStarted: () => void;
  /** "Already have an account?", in the secondary text color. */
  signInPrompt: string;
  /** "Sign In", the accent link; also the row's spoken label. */
  signInLabel: string;
  onSignIn: () => void;
};
