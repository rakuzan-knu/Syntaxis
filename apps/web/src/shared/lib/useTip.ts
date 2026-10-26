import { useCallback, useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react';
import { useTimers } from './useTimers';

export function useTip(anchor: RefObject<HTMLElement | null>) {
  const [open, setOpen] = useState(false);
  const pointer = useRef('mouse');
  const tapping = useRef(false);
  const { schedule, clear } = useTimers();

  const show = useCallback(() => {
    clear();
    setOpen(true);
  }, [clear]);

  const hide = useCallback(() => {
    clear();
    setOpen(false);
  }, [clear]);

  const flash = useCallback(
    (ms: number) => {
      clear();
      setOpen(true);
      schedule(() => setOpen(false), ms);
    },
    [clear, schedule],
  );

  useEffect(() => {
    if (!open) return;
    const onOutside = (event: globalThis.PointerEvent) => {
      if (event.target instanceof Node && anchor.current?.contains(event.target)) return;
      hide();
    };
    document.addEventListener('pointerdown', onOutside, { capture: true });
    return () => document.removeEventListener('pointerdown', onOutside, { capture: true });
  }, [open, anchor, hide]);

  const triggers = {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      pointer.current = event.pointerType;
      tapping.current = event.pointerType !== 'mouse';
    },
    onPointerEnter: (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType === 'mouse') show();
    },
    onPointerLeave: (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType === 'mouse') hide();
    },
    onFocus: () => {
      if (!tapping.current) show();
    },
    onBlur: hide,
    onClick: () => {
      if (pointer.current === 'mouse') return;
      tapping.current = false;
      if (open) hide();
      else show();
    },
  };

  return { open, show, hide, flash, triggers };
}
