import { FRAME_WIDTH, nameOf, nodeById, styleOf, type DesignDoc } from './document';

const PADDING = { compact: 18, comfortable: 24 } as const;
const SHADOW = {
  none: 'none',
  soft: '0 12px 40px -12px rgb(0 0 0 / 0.25)',
  strong: '0 24px 60px -16px rgb(0 0 0 / 0.45)',
} as const;
const FONT = { sans: "'Geologica', sans-serif", mono: "'JetBrains Mono', monospace" } as const;

export function paddingPx(padding: keyof typeof PADDING = 'comfortable'): number {
  return PADDING[padding];
}

export function shadowCss(shadow: keyof typeof SHADOW = 'soft'): string {
  return SHADOW[shadow];
}

export function fontCss(font: DesignDoc['font']): string {
  return FONT[font];
}

export function className(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `.${slug === '' ? 'layer' : slug}`;
}

export function cssFor(doc: DesignDoc, id: string): string[] {
  const node = nodeById(id);
  if (!node) return [];
  const style = styleOf(doc, id);
  const body: string[] = [];
  switch (node.kind) {
    case 'frame':
      body.push(
        `width: ${style.width ?? FRAME_WIDTH}px;`,
        `padding: ${paddingPx(style.padding)}px;`,
        `border-radius: ${style.radius ?? 0}px;`,
        `box-shadow: ${shadowCss(style.shadow)};`,
        'background: var(--surface-background);',
        'color: var(--text-primary);',
      );
      break;
    case 'text':
      body.push(
        `font: ${style.weight ?? 400} ${style.size ?? 14}px/1.3 ${fontCss(doc.font)};`,
        `color: var(${node.id === 'text' ? '--text-secondary' : '--text-primary'});`,
      );
      break;
    case 'button':
      body.push(
        `background: ${(style.color ?? doc.accent).toUpperCase()};`,
        `border-radius: ${style.radius ?? 0}px;`,
        'padding: 10px 16px;',
        `font: 500 14px ${fontCss(doc.font)};`,
        '&:hover { filter: brightness(1.08); }',
        '&:active { scale: 0.98; filter: brightness(0.9); }',
        '&:disabled { opacity: 0.45; }',
      );
      break;
    case 'badge':
      body.push(
        `background: ${(style.color ?? doc.accent).toUpperCase()};`,
        'border-radius: 6px;',
        'padding: 2px 8px;',
        'font-size: 11px;',
      );
      break;
    case 'component':
      body.push(`--accent: ${doc.accent.toUpperCase()};`, `font-family: ${fontCss(doc.font)};`);
      break;
  }
  return [`${className(nameOf(doc, id))} {`, ...body.map((line) => `  ${line}`), '}'];
}
