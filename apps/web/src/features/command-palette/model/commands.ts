import type { Dictionary, Locale } from '@/shared/i18n';

export type CommandGroup = 'go' | 'demo' | 'other';

export type CommandAction =
  | { type: 'scroll'; target: string }
  | { type: 'demo'; target: string; command: string }
  | { type: 'link'; href: string; external: boolean }
  | { type: 'shortcuts' };

export interface PaletteCommand {
  id: string;
  group: CommandGroup;
  label: string;
  detail: string;
  keywords: string;
  action: CommandAction;
}

export const DEMO_SECTIONS = [
  'hero',
  'design',
  'api',
  'deploy',
  'security',
  'performance',
  'outstaff',
] as const;

export type DemoSection = (typeof DEMO_SECTIONS)[number];

export const OPEN_PALETTE_EVENT = 'syntaxis:palette';

function chaptersOf(t: Dictionary, section: DemoSection): readonly string[] {
  return section === 'hero' ? t.build.chapters : t[section].chapters;
}

function targetOf(section: DemoSection): string {
  return section === 'hero' ? 'top' : section;
}

interface BuildOptions {
  t: Dictionary;
  otherLocalePath: string;
  telegram: string;
}

export function buildCommands({ t, otherLocalePath, telegram }: BuildOptions): PaletteCommand[] {
  const names = t.ui.palette.sections;
  const go: PaletteCommand[] = [
    ...DEMO_SECTIONS.map((section) => ({
      id: `go.${section}`,
      group: 'go' as const,
      label: names[section],
      detail: '',
      keywords: chaptersOf(t, section).join(' '),
      action: { type: 'scroll' as const, target: targetOf(section) },
    })),
    ...(['services', 'terms', 'process', 'brief', 'faq'] as const).map((id) => ({
      id: `go.${id}`,
      group: 'go' as const,
      label: t.nav[id],
      detail: '',
      keywords: id,
      action: { type: 'scroll' as const, target: id },
    })),
  ];

  const demo = DEMO_SECTIONS.flatMap((section) => [
    {
      id: `demo.${section}.replay`,
      group: 'demo' as const,
      label: t.ui.palette.replay,
      detail: names[section],
      keywords: `${names[section]} ${section}`,
      action: { type: 'demo' as const, target: targetOf(section), command: `${section}.replay` },
    },
    ...chaptersOf(t, section).map((chapter, index) => ({
      id: `demo.${section}.${index}`,
      group: 'demo' as const,
      label: chapter,
      detail: names[section],
      keywords: `${names[section]} ${section}`,
      action: {
        type: 'demo' as const,
        target: targetOf(section),
        command: `${section}.chapter.${index}`,
      },
    })),
  ]);

  const other: PaletteCommand[] = [
    {
      id: 'other.telegram',
      group: 'other',
      label: t.ui.palette.telegram,
      detail: '@gmblesssed',
      keywords: 'telegram contact',
      action: { type: 'link', href: telegram, external: true },
    },
    {
      id: 'other.language',
      group: 'other',
      label: t.ui.palette.language,
      detail: '',
      keywords: 'language мова english українська',
      action: { type: 'link', href: otherLocalePath, external: false },
    },
    {
      id: 'other.shortcuts',
      group: 'other',
      label: t.ui.palette.shortcuts,
      detail: '?',
      keywords: 'keyboard keys клавіші',
      action: { type: 'shortcuts' },
    },
  ];

  return [...go, ...demo, ...other];
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’'ʼ`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function filterCommands(
  commands: readonly PaletteCommand[],
  query: string,
): PaletteCommand[] {
  const words = normalize(query).split(' ').filter(Boolean);
  if (words.length === 0) return [...commands];
  return commands.filter((command) => {
    const haystack = normalize(`${command.label} ${command.detail} ${command.keywords}`);
    return words.every((word) => haystack.includes(word));
  });
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'uk' ? 'en' : 'uk';
}
