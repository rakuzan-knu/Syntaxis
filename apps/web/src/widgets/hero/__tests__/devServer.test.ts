import { describe, expect, it } from 'vitest';
import { BOOT_LOG, appendLog, clockTime, hmrLine } from '../model/devServer';

describe('dev server log', () => {
  it('formats a Vite HMR line with a zero-padded clock', () => {
    const date = new Date(2026, 9, 25, 9, 4, 7);
    expect(clockTime(date)).toBe('09:04:07');
    expect(hmrLine(date)).toBe('09:04:07 [vite] (client) hmr update /src/widgets/hero/Hero.tsx');
  });

  it('keeps only the latest lines', () => {
    let log: string[] = [...BOOT_LOG];
    for (let index = 0; index < 300; index += 1) log = appendLog(log, `line ${index}`);
    expect(log).toHaveLength(200);
    expect(log.at(-1)).toBe('line 299');
  });
});
