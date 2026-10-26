import type { PricedProduct } from './store';

export const TASTES = ['bright', 'balanced', 'bold', 'sweet'] as const;
export const BREWS = ['espresso', 'filter', 'turkish', 'milk'] as const;

export type Taste = (typeof TASTES)[number];
export type Brew = (typeof BREWS)[number];
export type Reason = Taste | Brew | 'budget';

export type Signals = Readonly<Record<Reason, readonly string[]>>;

export interface Preferences {
  taste: Taste | null;
  brew: Brew | null;
  budget: boolean;
}

export interface Pick {
  sku: string;
  score: number;
  reasons: readonly Reason[];
}

export type NextMove = 'askTaste' | 'askBrew' | 'recommend';

interface Profile {
  tastes: readonly Taste[];
  brews: readonly Brew[];
}

const PROFILES: Readonly<Record<string, Profile>> = {
  ethiopia: { tastes: ['bright'], brews: ['filter'] },
  colombia: { tastes: ['balanced', 'sweet'], brews: ['filter', 'espresso', 'turkish'] },
  brazil: { tastes: ['bold', 'sweet'], brews: ['espresso', 'milk', 'turkish'] },
};

const GRIND: Readonly<Record<Brew, string>> = {
  espresso: 'espresso',
  milk: 'espresso',
  turkish: 'espresso',
  filter: 'filter',
};

export const EMPTY_PREFERENCES: Preferences = { taste: null, brew: null, budget: false };

function lastMatch<T extends Reason>(
  text: string,
  options: readonly T[],
  signals: Signals,
): T | null {
  let found: T | null = null;
  let position = -1;
  for (const option of options) {
    for (const word of signals[option]) {
      const index = text.lastIndexOf(word);
      if (index > position) {
        position = index;
        found = option;
      }
    }
  }
  return found;
}

export function readPreferences(
  input: string,
  signals: Signals,
  previous: Preferences = EMPTY_PREFERENCES,
): Preferences {
  const text = input.toLowerCase();
  return {
    taste: lastMatch(text, TASTES, signals) ?? previous.taste,
    brew: lastMatch(text, BREWS, signals) ?? previous.brew,
    budget: previous.budget || signals.budget.some((word) => text.includes(word)),
  };
}

export function nextMove(preferences: Preferences): NextMove {
  if (preferences.brew) return 'recommend';
  if (preferences.taste) return 'askBrew';
  return 'askTaste';
}

export function recommend(
  preferences: Preferences,
  products: readonly PricedProduct[],
  limit = 2,
): Pick[] {
  const cheapest = Math.min(...products.map((product) => product.price));
  return products
    .map((product) => {
      const profile = PROFILES[product.sku] ?? { tastes: [], brews: [] };
      const reasons: Reason[] = [];
      let score = 0;
      if (preferences.taste && profile.tastes.includes(preferences.taste)) {
        score += 3;
        reasons.push(preferences.taste);
      }
      if (preferences.brew && profile.brews.includes(preferences.brew)) {
        score += 2;
        reasons.push(preferences.brew);
      }
      if (preferences.budget && product.price === cheapest) {
        score += 1;
        reasons.push('budget');
      }
      return { sku: product.sku, score, reasons, price: product.price };
    })
    .sort((a, b) => b.score - a.score || a.price - b.price)
    .slice(0, limit)
    .map(({ sku, score, reasons }) => ({ sku, score, reasons }));
}

export function grindFor(brew: Brew | null): string {
  return brew ? GRIND[brew] : 'beans';
}
