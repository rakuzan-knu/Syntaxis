import { BRAND } from '@/shared/config';

export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className={className}>
      <rect width="32" height="32" rx="8" fill="var(--accent)" />
      <path
        d="M18.4 9.6c-1.1-1-2.6-1.5-4.2-1.5-2.7 0-4.6 1.4-4.6 3.5 0 4.6 9.3 2.8 9.3 7.3 0 2.2-2 3.6-4.8 3.6-2 0-3.7-.7-4.9-1.9"
        fill="none"
        stroke="var(--on-accent)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="23.2" cy="21.6" r="2.1" fill="var(--on-accent)" />
    </svg>
  );
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="size-7" />
      <span className="text-[1.1875rem] font-semibold tracking-[-0.02em]">{BRAND}</span>
    </span>
  );
}
