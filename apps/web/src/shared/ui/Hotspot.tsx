interface HotspotProps {
  label: string;
  visible: boolean;
  className?: string;
  side?: 'right' | 'left' | 'bottom' | 'top';
}

const SIDES = {
  right: 'left-5 top-1/2 -translate-y-1/2',
  left: 'right-5 top-1/2 -translate-y-1/2',
  bottom: 'top-5 left-1/2 -translate-x-1/2',
  top: 'bottom-5 left-1/2 -translate-x-1/2',
} as const;

export function Hotspot({ label, visible, className = '', side = 'right' }: HotspotProps) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute z-20 transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'} ${className}`}
    >
      <span className="relative block size-3">
        <span className="hotspot-ring absolute inset-0 rounded-full bg-accent" />
        <span className="absolute inset-0 rounded-full border-2 border-white bg-accent shadow-md" />
      </span>
      <span
        className={`absolute rounded-lg bg-ink px-2.5 py-1.5 text-step--2 font-medium whitespace-nowrap text-bg shadow-lg ${SIDES[side]}`}
      >
        {label}
      </span>
    </span>
  );
}
