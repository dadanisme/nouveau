/**
 * Checks the month bounds the signed-in query sends (`getMonthBounds`, `utils/month-bounds.ts`, #134):
 * `transactions.date` is a timestamptz, so a month is `date >= start AND date < nextStart`.
 * - December rolls the year over, February respects leap years;
 * - a row late on a month's last day (2026-10-31T10:05Z) falls inside that month and not the next;
 * - the bounds match the guest store's `monthRange` (`lib/local-db/queries.ts`).
 *
 * Run: bun scripts/check-month-range.ts (exits 1 on any failure).
 */
import { monthRange } from '../lib/local-db/queries';
import { getMonthBounds } from '../utils/month-bounds';

let passes = 0;
let failures = 0;

function check(name: string, ok: boolean, detail = '') {
  if (ok) {
    passes += 1;
  } else {
    failures += 1;
    console.error(`FAIL ${name}${detail ? `: ${detail}` : ''}`);
  }
}

function eq(name: string, actual: unknown, expected: unknown) {
  check(name, actual === expected, `got ${String(actual)}, want ${String(expected)}`);
}

// Same comparison Postgres makes: timestamptz against the bound read as midnight UTC.
function inMonth(timestamp: string, year: number, month: number): boolean {
  const { start, nextStart } = getMonthBounds(year, month);
  const at = Date.parse(timestamp);
  return at >= Date.parse(`${start}T00:00:00Z`) && at < Date.parse(`${nextStart}T00:00:00Z`);
}

eq('Dec nextStart rolls the year', getMonthBounds(2026, 11).nextStart, '2027-01-01');
eq('Dec start', getMonthBounds(2026, 11).start, '2026-12-01');
eq('Jan start', getMonthBounds(2026, 0).start, '2026-01-01');
eq('Jan nextStart', getMonthBounds(2026, 0).nextStart, '2026-02-01');
eq('Feb leap year nextStart', getMonthBounds(2024, 1).nextStart, '2024-03-01');
eq('Feb common year nextStart', getMonthBounds(2026, 1).nextStart, '2026-03-01');
eq('Oct nextStart', getMonthBounds(2026, 9).nextStart, '2026-11-01');

const lastDayRow = '2026-10-31T10:05:00+00:00';
check('last-day row is in October', inMonth(lastDayRow, 2026, 9));
check('last-day row is not in November', !inMonth(lastDayRow, 2026, 10));
check('Oct 31 23:59:59.999Z is in October', inMonth('2026-10-31T23:59:59.999Z', 2026, 9));
check(
  'Nov 1 00:00Z is in November only',
  inMonth('2026-11-01T00:00:00Z', 2026, 10) && !inMonth('2026-11-01T00:00:00Z', 2026, 9),
);
check('Dec 31 evening is in December', inMonth('2026-12-31T22:00:00Z', 2026, 11));
check('Feb 29 (leap) evening is in February', inMonth('2024-02-29T18:00:00Z', 2024, 1));

// The old bound, `date <= last day`, dropped the row: keep the regression visible.
check(
  'old <= YYYY-10-31 bound would miss the row',
  Date.parse(lastDayRow) > Date.parse('2026-10-31T00:00:00Z'),
);

for (let month = 0; month < 12; month += 1) {
  const { start, nextStart } = getMonthBounds(2026, month);
  const [localStart, localEnd] = monthRange(2026, month);
  check(
    `month ${month + 1} matches the guest store`,
    start === localStart && nextStart === localEnd,
  );
}

console.log(`${passes} passed, ${failures} failed`);
if (failures > 0) process.exit(1);
