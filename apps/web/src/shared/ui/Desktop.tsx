import type { ReactNode } from 'react';

function Wallpaper() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMax slice"
      className="pointer-events-none absolute inset-0 -z-10 size-full"
    >
      <circle cx="860" cy="250" r="90" fill="var(--sun)" opacity="0.85" />
      <path
        d="M0 380 C 180 300 320 330 470 290 S 760 250 900 300 S 1110 280 1200 250 V600 H0Z"
        fill="var(--hill-far)"
      />
      <path
        d="M0 450 C 160 390 300 420 460 380 S 720 360 880 410 S 1100 380 1200 360 V600 H0Z"
        fill="var(--hill-mid)"
      />
      <path
        d="M0 520 C 200 470 380 500 560 470 S 860 450 1000 490 S 1150 480 1200 470 V600 H0Z"
        fill="var(--hill-near)"
      />
    </svg>
  );
}

interface DesktopProps {
  children: ReactNode;
  className?: string;
}

export function Desktop({ children, className = '' }: DesktopProps) {
  return (
    <div className={`desktop p-3 sm:p-6 lg:p-10 ${className}`}>
      <Wallpaper />
      {children}
    </div>
  );
}
