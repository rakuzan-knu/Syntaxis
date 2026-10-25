export type Language = 'tsx' | 'json' | 'http' | 'bash';

export type TokenKind =
  'keyword' | 'string' | 'number' | 'tag' | 'attr' | 'comment' | 'punct' | 'plain';

export interface Token {
  kind: TokenKind;
  text: string;
}

type Rule = readonly [RegExp, TokenKind];

const RULES: Record<Language, readonly Rule[]> = {
  tsx: [
    [/\/\/.*/y, 'comment'],
    [/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/y, 'string'],
    [/<\/?[A-Za-z][\w.]*/y, 'tag'],
    [
      /\b(?:import|export|from|const|let|function|return|async|await|default|type|interface|extends|new|if|else)\b/y,
      'keyword',
    ],
    [/\b\d+(?:\.\d+)?\b/y, 'number'],
    [/\b[a-zA-Z_][\w-]*(?==)/y, 'attr'],
    [/[{}()[\];,.<>/=:?!&|+*-]+/y, 'punct'],
  ],
  json: [
    [/"(?:\\.|[^"\\])*"(?=\s*:)/y, 'attr'],
    [/"(?:\\.|[^"\\])*"/y, 'string'],
    [/\b(?:true|false|null)\b/y, 'keyword'],
    [/-?\b\d+(?:\.\d+)?\b/y, 'number'],
    [/[{}[\],:]/y, 'punct'],
  ],
  http: [
    [/^(?:GET|POST|PUT|PATCH|DELETE)\b/y, 'keyword'],
    [/^HTTP\/\d(?:\.\d)?/y, 'keyword'],
    [/\b\d{3}\b/y, 'number'],
    [/^[\w-]+(?=:)/y, 'attr'],
    [/\/[\w/.-]*/y, 'tag'],
    [/[:;=]/y, 'punct'],
  ],
  bash: [
    [/#.*/y, 'comment'],
    [/^\$/y, 'punct'],
    [/'(?:[^'])*'|"(?:\\.|[^"\\])*"/y, 'string'],
    [/\s--?[\w-]+/y, 'attr'],
    [/\b(?:pnpm|npm|vercel|docker|git|node)\b/y, 'keyword'],
  ],
};

export function highlight(line: string, language: Language): Token[] {
  const rules = RULES[language];
  const tokens: Token[] = [];
  let plain = '';
  let index = 0;

  const flush = () => {
    if (plain) tokens.push({ kind: 'plain', text: plain });
    plain = '';
  };

  outer: while (index < line.length) {
    for (const [pattern, kind] of rules) {
      pattern.lastIndex = index;
      const match = pattern.exec(line);
      if (match && match[0].length > 0) {
        flush();
        tokens.push({ kind, text: match[0] });
        index += match[0].length;
        continue outer;
      }
    }
    plain += line[index];
    index += 1;
  }
  flush();
  return tokens;
}
