export type TemplateToken = { kind: 'text'; value: string } | { kind: 'slot'; name: string };

const SLOT = /\{(\w+)\}/g;

export function parseTemplate(template: string): TemplateToken[] {
  const tokens: TemplateToken[] = [];
  let cursor = 0;
  for (const match of template.matchAll(SLOT)) {
    const [whole, name] = match;
    if (match.index > cursor) {
      tokens.push({ kind: 'text', value: template.slice(cursor, match.index) });
    }
    if (name) tokens.push({ kind: 'slot', name });
    cursor = match.index + whole.length;
  }
  if (cursor < template.length) tokens.push({ kind: 'text', value: template.slice(cursor) });
  return tokens;
}

export function fillTemplate(template: string, values: Readonly<Record<string, string>>): string {
  return template.replace(SLOT, (whole, name: string) => values[name] ?? whole);
}
