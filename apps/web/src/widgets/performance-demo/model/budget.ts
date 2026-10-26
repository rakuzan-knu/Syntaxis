export type Choice = 'none' | 'heavy' | 'light';

export interface Package {
  name: string;
  kb: number;
}

export interface Need {
  id: 'dates' | 'utils' | 'charts';
  heavy: Package;
  light: Package;
}

export const BASE_KB = 94;
export const BUDGET_KB = 110;
export const LCP_BASE_MS = 1150;
export const LCP_MS_PER_KB = 11;

export const NEEDS: readonly Need[] = [
  { id: 'dates', heavy: { name: 'moment', kb: 72 }, light: { name: 'dayjs', kb: 3 } },
  { id: 'utils', heavy: { name: 'lodash', kb: 25 }, light: { name: 'lodash-es/debounce', kb: 1 } },
  {
    id: 'charts',
    heavy: { name: 'chart.js', kb: 64 },
    light: { name: 'chart.js · lazy()', kb: 0 },
  },
];

export type Choices = Readonly<Record<Need['id'], Choice>>;

export const NO_CHOICES: Choices = { dates: 'none', utils: 'none', charts: 'none' };

export function packageOf(need: Need, choice: Choice): Package | null {
  if (choice === 'heavy') return need.heavy;
  if (choice === 'light') return need.light;
  return null;
}

export interface BudgetResult {
  total: number;
  delta: number;
  pass: boolean;
  lcp: number;
  offenders: readonly Need['id'][];
}

export function checkBudget(choices: Choices): BudgetResult {
  const delta = NEEDS.reduce((sum, need) => sum + (packageOf(need, choices[need.id])?.kb ?? 0), 0);
  const total = BASE_KB + delta;
  const offenders =
    total > BUDGET_KB
      ? NEEDS.filter((need) => choices[need.id] === 'heavy').map((need) => need.id)
      : [];
  return {
    total,
    delta,
    pass: total <= BUDGET_KB,
    lcp: LCP_BASE_MS + total * LCP_MS_PER_KB,
    offenders,
  };
}
