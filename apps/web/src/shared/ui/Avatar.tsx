const PALETTE = ['#2f3bff', '#0f8a5f', '#c2410c', '#7c3aed', '#0e7490'] as const;

function hash(value: string): number {
  let result = 0;
  for (const char of value) result = (result * 31 + char.charCodeAt(0)) >>> 0;
  return result;
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full font-semibold text-white ${size === 'md' ? 'size-8 text-step--2' : 'size-5 text-[0.5625rem]'}`}
      style={{ backgroundColor: PALETTE[hash(name) % PALETTE.length] }}
    >
      {initials}
    </span>
  );
}
