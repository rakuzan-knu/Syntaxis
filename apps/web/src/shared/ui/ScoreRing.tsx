const RADIUS = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function tone(value: number): string {
  if (value >= 90) return 'text-ok';
  if (value >= 50) return 'text-warn';
  return 'text-bad';
}

interface ScoreRingProps {
  value: number;
  label: string;
  size?: 'sm' | 'md';
}

export function ScoreRing({ value, label, size = 'md' }: ScoreRingProps) {
  const dimension = size === 'md' ? 'size-16' : 'size-12';
  return (
    <figure className="flex flex-col items-center gap-2">
      <span className={`relative grid place-items-center ${dimension} ${tone(value)}`}>
        <svg aria-hidden="true" viewBox="0 0 44 44" className="absolute inset-0 -rotate-90">
          <circle className="ring-track" cx="22" cy="22" r={RADIUS} fill="none" strokeWidth="3.5" />
          <circle
            className="ring-value"
            cx="22"
            cy="22"
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - value / 100)}
          />
        </svg>
        <span
          className={`font-mono font-semibold tabular-nums ${size === 'md' ? 'text-step-0' : 'text-step--1'}`}
        >
          {value}
        </span>
      </span>
      <figcaption className="text-center text-step--2 text-win-muted">{label}</figcaption>
    </figure>
  );
}
