import { createContext, useContext, useState } from 'react';

import type { Period } from '@/utils/date';

interface PeriodContextValue {
  /** The month Transactions and Insights show (Insights' year mode reads only its year). */
  period: Period;
  setPeriod: (period: Period) => void;
}

const PeriodContext = createContext<PeriodContextValue | null>(null);

function currentPeriod(): Period {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

/**
 * The selected period, shared by Transactions and Insights so a change on one tab shows on the
 * other (#93). One value for every workspace, kept in memory only: a cold launch opens on the
 * current month.
 */
export function PeriodProvider({ children }: { children: React.ReactNode }) {
  const [period, setPeriod] = useState<Period>(currentPeriod);

  return <PeriodContext.Provider value={{ period, setPeriod }}>{children}</PeriodContext.Provider>;
}

export function usePeriod() {
  const context = useContext(PeriodContext);
  if (!context) {
    throw new Error('usePeriod must be used within a PeriodProvider');
  }
  return context;
}
