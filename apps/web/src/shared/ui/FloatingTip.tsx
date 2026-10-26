import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

export type TipSide = 'top' | 'bottom' | 'left' | 'right';

interface Point {
  x: number;
  y: number;
}

const GAP = 10;
const MARGIN = 8;
const OPPOSITE: Record<TipSide, TipSide> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

function place(anchor: DOMRect, width: number, height: number, side: TipSide): Point {
  switch (side) {
    case 'top':
      return { x: anchor.left + anchor.width / 2 - width / 2, y: anchor.top - GAP - height };
    case 'bottom':
      return { x: anchor.left + anchor.width / 2 - width / 2, y: anchor.bottom + GAP };
    case 'left':
      return { x: anchor.left - GAP - width, y: anchor.top + anchor.height / 2 - height / 2 };
    case 'right':
      return { x: anchor.right + GAP, y: anchor.top + anchor.height / 2 - height / 2 };
  }
}

function fits({ x, y }: Point, width: number, height: number): boolean {
  return (
    x >= MARGIN &&
    y >= MARGIN &&
    x + width <= window.innerWidth - MARGIN &&
    y + height <= window.innerHeight - MARGIN
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

interface FloatingTipProps {
  anchor: RefObject<HTMLElement | null>;
  side?: TipSide;
  className?: string;
  children: ReactNode;
}

export function FloatingTip({ anchor, side = 'top', className = '', children }: FloatingTipProps) {
  const tipRef = useRef<HTMLSpanElement>(null);
  const [position, setPosition] = useState<Point | null>(null);

  useLayoutEffect(() => {
    const update = () => {
      const target = anchor.current;
      const tip = tipRef.current;
      if (!target || !tip) return;
      const rect = target.getBoundingClientRect();
      if (
        rect.bottom < 0 ||
        rect.right < 0 ||
        rect.top > window.innerHeight ||
        rect.left > window.innerWidth
      ) {
        setPosition(null);
        return;
      }
      const { width, height } = tip.getBoundingClientRect();
      const order: readonly TipSide[] = [side, OPPOSITE[side], 'top', 'bottom'];
      const best =
        order
          .map((option) => place(rect, width, height, option))
          .find((point) => fits(point, width, height)) ?? place(rect, width, height, side);
      setPosition({
        x: clamp(best.x, MARGIN, window.innerWidth - MARGIN - width),
        y: clamp(best.y, MARGIN, window.innerHeight - MARGIN - height),
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true, capture: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, { capture: true });
      window.removeEventListener('resize', update);
    };
  }, [anchor, side]);

  return createPortal(
    <span
      ref={tipRef}
      role="tooltip"
      className={`ink-in pointer-events-none fixed top-0 left-0 z-[100] w-max max-w-64 bg-ink text-bg shadow-[0_8px_24px_rgb(0_0_0/0.25)] ${className}`}
      style={{
        transform: position ? `translate(${position.x}px, ${position.y}px)` : undefined,
        visibility: position ? 'visible' : 'hidden',
      }}
    >
      {children}
    </span>,
    document.body,
  );
}
