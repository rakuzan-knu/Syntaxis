import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { useInView } from './useInView';
import { useTimers } from './useTimers';

type Schedule = (callback: () => void, delay: number) => void;

interface AutoplayOptions {
  amount?: number;
}

export function useAutoplay<T extends Element>(
  ref: RefObject<T | null>,
  play: (schedule: Schedule) => void,
  { amount = 0.4 }: AutoplayOptions = {},
): { inView: boolean; touched: boolean; schedule: Schedule; interrupt: () => void } {
  const inView = useInView(ref, { amount });
  const { schedule, clear } = useTimers();
  const interacted = useRef(false);
  const [touched, setTouched] = useState(false);
  const playRef = useRef(play);

  useEffect(() => {
    playRef.current = play;
  });

  useEffect(() => {
    if (!inView || interacted.current) return;
    playRef.current(schedule);
    return clear;
  }, [inView, schedule, clear]);

  const interrupt = useCallback(() => {
    interacted.current = true;
    setTouched(true);
    clear();
  }, [clear]);

  return { inView, touched, schedule, interrupt };
}
