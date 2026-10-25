import { badgeOf } from '../../model/fileSystem';

const TONES = {
  ts: 'syn-tag',
  json: 'text-warn',
  html: 'text-[#e8825a]',
  plain: 'text-win-muted',
} as const;

export function FileIcon({ name }: { name: string }) {
  const badge = badgeOf(name);
  return (
    <span
      aria-hidden="true"
      className={`w-5 shrink-0 text-center font-mono text-[0.625rem] font-semibold ${TONES[badge.tone]}`}
    >
      {badge.label}
    </span>
  );
}
