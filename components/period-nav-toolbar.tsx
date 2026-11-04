import { Stack } from 'expo-router';
import type { ReactElement, ReactNode } from 'react';
import { Platform } from 'react-native';

import { useLanguage } from '@/contexts/language';
import type { PeriodNavigation } from '@/hooks/use-period-navigation';
import { useSymbolIcon } from '@/hooks/use-symbol-icon';
import { k } from '@/locales/keys';
import { formatMonthName, isSamePeriod } from '@/utils/date';

export interface PeriodNavToolbar {
  /**
   * iOS: a left `Stack.Toolbar` with the controls; render it in the screen. Null on Android.
   */
  leftToolbar: ReactNode;
  /**
   * Android: the controls as `Stack.Toolbar.*` items, to lead the screen's own right toolbar
   * (Material keeps the leading slot for navigation). Empty on iOS.
   */
  rightItems: ReactElement[];
}

/**
 * Native header controls for a {@link PeriodNavigation}: previous chevron, a period menu (This
 * Month / This Year, then a submenu per year listing its months; the years themselves in year
 * mode), next chevron. The screen title shows the period label; the screen sets it.
 *
 * A screen keeps one `Stack.Toolbar` per placement and iOS reads only direct `Stack.Toolbar.*`
 * children, so the controls come back as elements, not a component: on iOS a left toolbar of
 * their own (a grouped ‹ calendar › cluster across from the screen's actions), on Android items
 * for the screen to put first in its right toolbar.
 */
export function usePeriodNavToolbar(nav: PeriodNavigation): PeriodNavToolbar {
  const { t, locale } = useLanguage();
  const previousIcon = useSymbolIcon({ sf: 'chevron.left', md: 'chevron_left' });
  const nextIcon = useSymbolIcon({ sf: 'chevron.right', md: 'chevron_right' });
  const menuIcon = useSymbolIcon({ sf: 'calendar', md: 'calendar_month' });

  const isMonth = nav.mode === 'month';
  const items: ReactElement[] = [];

  if (previousIcon) {
    items.push(
      <Stack.Toolbar.Button
        key="period-previous"
        icon={previousIcon}
        accessibilityLabel={isMonth ? t(k.transactions.previousMonth) : t(k.insights.previousYear)}
        onPress={nav.goToPrevious}
      />,
    );
  }

  if (menuIcon) {
    const chooseLabel = isMonth ? t(k.periodNav.chooseMonth) : t(k.periodNav.chooseYear);
    items.push(
      <Stack.Toolbar.Menu
        key="period-menu"
        icon={menuIcon}
        // No `title`: on a root menu it would also become the bar button's text label.
        accessibilityLabel={`${chooseLabel}, ${nav.label}`}
      >
        {/* Disabled on the current period. Android's toolbar menu draws disabled items at full
            color, so there it is hidden instead. */}
        <Stack.Toolbar.MenuAction
          disabled={nav.isCurrent}
          hidden={Platform.OS === 'android' && nav.isCurrent}
          onPress={nav.goToCurrent}
        >
          {isMonth ? t(k.periodNav.thisMonth) : t(k.periodNav.thisYear)}
        </Stack.Toolbar.MenuAction>
        {isMonth ? (
          nav.menuYears.map(({ year, months }) => (
            <Stack.Toolbar.Menu key={year} title={String(year)}>
              {months.map((month) => (
                <Stack.Toolbar.MenuAction
                  key={month}
                  isOn={isSamePeriod('month', nav.period, { year, month })}
                  onPress={() => nav.goTo({ year, month })}
                >
                  {formatMonthName(month, locale)}
                </Stack.Toolbar.MenuAction>
              ))}
            </Stack.Toolbar.Menu>
          ))
        ) : (
          <Stack.Toolbar.Menu inline>
            {nav.menuYears.map(({ year }) => (
              <Stack.Toolbar.MenuAction
                key={year}
                isOn={nav.period.year === year}
                onPress={() => nav.goTo({ year, month: nav.period.month })}
              >
                {String(year)}
              </Stack.Toolbar.MenuAction>
            ))}
          </Stack.Toolbar.Menu>
        )}
      </Stack.Toolbar.Menu>,
    );
  }

  if (nextIcon) {
    items.push(
      <Stack.Toolbar.Button
        key="period-next"
        icon={nextIcon}
        accessibilityLabel={isMonth ? t(k.transactions.nextMonth) : t(k.insights.nextYear)}
        onPress={nav.goToNext}
      />,
    );
  }

  if (Platform.OS === 'ios') {
    return {
      leftToolbar: <Stack.Toolbar placement="left">{items}</Stack.Toolbar>,
      rightItems: [],
    };
  }
  return { leftToolbar: null, rightItems: items };
}
