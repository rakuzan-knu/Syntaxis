import { useEffect, useRef } from 'react';
import { useInView, useTimers, useTip } from '@/shared/lib';
import { FloatingTip, type TipSide } from './FloatingTip';

interface HotspotProps {
  label: string;
  visible: boolean;
  className?: string;
  side?: TipSide;
}

const INTRO_MS = 3500;
const INTRO_GAP_MS = 250;

let nextIntroAt = 0;

function reserveIntro(): number {
  const now = performance.now();
  const start = Math.max(now, nextIntroAt);
  nextIntroAt = start + INTRO_MS + INTRO_GAP_MS;
  return start - now;
}

export function Hotspot({ label, visible, className = '', side = 'right' }: HotspotProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const introduced = useRef(false);
  const inView = useInView(ref, { amount: 0.5 });
  const tip = useTip(ref);
  const { flash, hide } = tip;
  const { schedule, clear } = useTimers();

  useEffect(() => {
    if (!visible) {
      clear();
      hide();
      return;
    }
    if (!inView || introduced.current) return;
    introduced.current = true;
    schedule(() => flash(INTRO_MS), reserveIntro());
  }, [visible, inView, flash, hide, schedule, clear]);

  return (
    <span
      aria-hidden="true"
      className={`absolute z-20 transition-opacity duration-500 ${visible ? 'opacity-100' : 'pointer-events-none opacity-0'} ${className}`}
    >
      <span
        ref={ref}
        {...tip.triggers}
        className="relative block size-3 cursor-help before:absolute before:-inset-2 before:content-['']"
      >
        <span className="hotspot-ring absolute inset-0 rounded-full bg-accent" />
        <span className="absolute inset-0 rounded-full border-2 border-white bg-accent shadow-md" />
      </span>
      {visible && tip.open ? (
        <FloatingTip
          anchor={ref}
          side={side}
          className="rounded-lg px-2.5 py-1.5 text-step--2 font-medium"
        >
          {label}
        </FloatingTip>
      ) : null}
    </span>
  );
}
