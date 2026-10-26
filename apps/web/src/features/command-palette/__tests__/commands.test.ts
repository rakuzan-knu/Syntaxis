import { describe, expect, it } from 'vitest';
import { getDictionary } from '@/shared/i18n/server';
import { buildCommands, filterCommands, otherLocale } from '../model/commands';

const commands = buildCommands({
  t: getDictionary('uk'),
  otherLocalePath: '/en',
  telegram: 'https://t.me/gmblesssed',
});

describe('command palette', () => {
  it('offers a replay and every chapter for each demo', () => {
    const deploy = commands.filter((command) => command.id.startsWith('demo.deploy.'));
    expect(deploy.map((command) => command.label)).toEqual([
      'Показати все демо',
      'Реліз',
      'Зламаний коміт',
      'Відкат',
      'Поступовий реліз',
    ]);
  });

  it('finds commands by words in any order and ignores apostrophes', () => {
    const found = filterCommands(commands, 'коміт деплой');
    expect(found.map((command) => command.id)).toEqual(['go.deploy', 'demo.deploy.1']);
    expect(filterCommands(commands, 'превю').some((command) => command.id === 'go.hero')).toBe(
      true,
    );
  });

  it('returns everything for an empty query and nothing for nonsense', () => {
    expect(filterCommands(commands, '  ')).toHaveLength(commands.length);
    expect(filterCommands(commands, 'zzzz')).toEqual([]);
  });

  it('switches to the other locale', () => {
    expect(otherLocale('uk')).toBe('en');
    expect(otherLocale('en')).toBe('uk');
  });
});
