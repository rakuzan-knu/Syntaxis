import { fontCss, paddingPx } from './css';
import { FRAME_WIDTH, styleOf, type DesignDoc } from './document';
import { tokenValue } from './variables';

export interface SvgTexts {
  title: string;
  badge: string;
  text: string;
  primary: string;
  secondary: string;
}

function escape(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function wrap(text: string, width: number, size: number): string[] {
  const perLine = Math.max(8, Math.floor(width / (size * 0.56)));
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > perLine && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function subscriptionSvg(doc: DesignDoc, texts: SvgTexts): string {
  const card = styleOf(doc, 'card');
  const title = styleOf(doc, 'title');
  const body = styleOf(doc, 'text');
  const primary = styleOf(doc, 'primary');
  const badge = styleOf(doc, 'badge');
  const width = card.width ?? FRAME_WIDTH;
  const pad = paddingPx(card.padding);
  const inner = width - pad * 2;
  const font = fontCss(doc.font).replaceAll("'", '');
  const titleSize = title.size ?? 18;
  const bodySize = body.size ?? 14;
  const bodyLines = wrap(styleOf(doc, 'text').text ?? texts.text, inner, bodySize);
  const titleY = pad + titleSize;
  const bodyY = titleY + pad * 0.66 + bodySize;
  const buttonsY = bodyY + (bodyLines.length - 1) * bodySize * 1.45 + pad;
  const buttonHeight = 40;
  const height = buttonsY + buttonHeight + pad;
  const half = (inner - 8) / 2;
  const accent = primary.color ?? doc.accent;
  const badgeText = badge.text ?? texts.badge;
  const badgeWidth = badgeText.length * 6.6 + 16;
  const color = (token: string) => tokenValue(token, doc.mode);
  const surface = color('--surface-background');
  const ink = color('--text-primary');
  const muted = color('--text-secondary');
  const line = color('--border-default');

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${Math.round(height)}" viewBox="0 0 ${width} ${Math.round(height)}" font-family="${font}">`,
    `  <rect width="${width}" height="${Math.round(height)}" rx="${card.radius ?? 0}" fill="${surface}"/>`,
    `  <text x="${pad}" y="${titleY}" font-size="${titleSize}" font-weight="${title.weight ?? 600}" fill="${ink}">${escape(title.text ?? texts.title)}</text>`,
    `  <rect x="${width - pad - badgeWidth}" y="${pad}" width="${badgeWidth}" height="20" rx="6" fill="${badge.color ?? doc.accent}"/>`,
    `  <text x="${width - pad - badgeWidth / 2}" y="${pad + 14}" font-size="11" text-anchor="middle" fill="#FFFFFF">${escape(badgeText)}</text>`,
    ...bodyLines.map(
      (line, index) =>
        `  <text x="${pad}" y="${bodyY + index * bodySize * 1.45}" font-size="${bodySize}" fill="${muted}">${escape(line)}</text>`,
    ),
    `  <rect x="${pad}" y="${buttonsY}" width="${half}" height="${buttonHeight}" rx="${primary.radius ?? 0}" fill="${accent}"/>`,
    `  <text x="${pad + half / 2}" y="${buttonsY + 25}" font-size="14" font-weight="500" text-anchor="middle" fill="#FFFFFF">${escape(primary.text ?? texts.primary)}</text>`,
    `  <rect x="${pad + half + 8.5}" y="${buttonsY + 0.5}" width="${half - 1}" height="${buttonHeight - 1}" rx="${primary.radius ?? 0}" fill="none" stroke="${line}"/>`,
    `  <text x="${pad + half + 8 + half / 2}" y="${buttonsY + 25}" font-size="14" font-weight="500" text-anchor="middle" fill="${ink}">${escape(texts.secondary)}</text>`,
    '</svg>',
  ].join('\n');
}
