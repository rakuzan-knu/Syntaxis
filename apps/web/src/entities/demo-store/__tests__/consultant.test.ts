import { describe, expect, it } from 'vitest';
import {
  EMPTY_PREFERENCES,
  grindFor,
  nextMove,
  readPreferences,
  recommend,
} from '../model/consultant';

const signals = {
  bright: ['кислинк', 'fruity'],
  balanced: ['збалансован'],
  bold: ['шоколад', 'міцн'],
  sweet: ['солодк'],
  espresso: ['еспресо'],
  filter: ['фільтр', 'пуровер'],
  turkish: ['турк', 'турц'],
  milk: ['молок', 'капучино'],
  budget: ['дешев', 'недорог'],
};
const products = [
  { sku: 'ethiopia', price: 420 },
  { sku: 'colombia', price: 380 },
  { sku: 'brazil', price: 340 },
];

describe('consultant', () => {
  it('reads taste and brew method from free text', () => {
    expect(readPreferences('Люблю з кислинкою, варю у фільтрі', signals)).toEqual({
      taste: 'bright',
      brew: 'filter',
      budget: false,
    });
  });

  it('keeps earlier answers and lets the latest word win', () => {
    const first = readPreferences('щось шоколадне', signals);
    const second = readPreferences('в турці, але краще еспресо і недорого', signals, first);
    expect(second).toEqual({ taste: 'bold', brew: 'espresso', budget: true });
  });

  it('understands inflected words', () => {
    expect(readPreferences('варю в турці', signals).brew).toBe('turkish');
  });

  it('asks before recommending', () => {
    expect(nextMove(EMPTY_PREFERENCES)).toBe('askTaste');
    expect(nextMove({ ...EMPTY_PREFERENCES, taste: 'sweet' })).toBe('askBrew');
    expect(nextMove({ ...EMPTY_PREFERENCES, brew: 'milk' })).toBe('recommend');
  });

  it('ranks coffee by taste, method and price', () => {
    const bright = recommend({ taste: 'bright', brew: 'filter', budget: false }, products);
    expect(bright.map((pick) => pick.sku)).toEqual(['ethiopia', 'colombia']);
    expect(bright[0]?.reasons).toEqual(['bright', 'filter']);

    const milk = recommend({ taste: null, brew: 'milk', budget: true }, products);
    expect(milk[0]).toEqual({ sku: 'brazil', score: 3, reasons: ['milk', 'budget'] });
  });

  it('matches the grind to the method', () => {
    expect(grindFor('filter')).toBe('filter');
    expect(grindFor('turkish')).toBe('espresso');
    expect(grindFor(null)).toBe('beans');
  });
});
