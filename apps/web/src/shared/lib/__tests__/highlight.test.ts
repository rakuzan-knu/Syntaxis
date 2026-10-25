import { describe, expect, it } from 'vitest';
import { highlight } from '../highlight';

const kinds = (line: string, language: Parameters<typeof highlight>[1]) =>
  highlight(line, language).map((token) => `${token.kind}:${token.text}`);

describe('highlight', () => {
  it('tokenizes TSX keywords, strings and tags', () => {
    expect(kinds("export const title = 'Hi';", 'tsx')).toEqual([
      'keyword:export',
      'plain: ',
      'keyword:const',
      'plain: title ',
      'punct:=',
      'plain: ',
      "string:'Hi'",
      'punct:;',
    ]);
    expect(kinds('<Button size="lg">', 'tsx')).toEqual([
      'tag:<Button',
      'plain: ',
      'attr:size',
      'punct:=',
      'string:"lg"',
      'punct:>',
    ]);
  });

  it('separates JSON keys from string values', () => {
    expect(kinds('"status": "paid", "total": 420', 'json')).toEqual([
      'attr:"status"',
      'punct::',
      'plain: ',
      'string:"paid"',
      'punct:,',
      'plain: ',
      'attr:"total"',
      'punct::',
      'plain: ',
      'number:420',
    ]);
  });

  it('keeps the original text intact', () => {
    const line = '$ pnpm build --filter web # prod';
    expect(
      highlight(line, 'bash')
        .map((token) => token.text)
        .join(''),
    ).toBe(line);
  });
});
