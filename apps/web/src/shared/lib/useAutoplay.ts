import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { flushSync } from 'react-dom';
import {
  addCue,
  chapterAt,
  createTimeline,
  endOf,
  nextCue,
  runUntil,
  type CueOptions,
  type Timeline,
} from './timeline';
import { useInView } from './useInView';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import { useTimers } from './useTimers';

type Schedule = (callback: () => void, delay: number) => void;
export type Later = (callback: () => void, delay: number, options?: CueOptions) => void;

const REVEAL_MARGIN = 24;

function revealWithin(element: Element, root: Element) {
  for (let node = element.parentElement; node && node !== root; node = node.parentElement) {
    if (node.scrollHeight <= node.clientHeight) continue;
    const overflow = getComputedStyle(node).overflowY;
    if (overflow !== 'auto' && overflow !== 'scroll') continue;
    const box = node.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    if (rect.top < box.top + REVEAL_MARGIN) {
      node.scrollTop -= box.top + REVEAL_MARGIN - rect.top;
    } else if (rect.bottom > box.bottom - REVEAL_MARGIN) {
      node.scrollTop += Math.min(rect.bottom - box.bottom + REVEAL_MARGIN, rect.top - box.top);
    }
  }
}

export type PlayerState = 'waiting' | 'playing' | 'paused' | 'done' | 'yours';

export interface GuideCursor {
  x: number;
  y: number;
  click: number;
  visible: boolean;
}

export interface DemoPlayer {
  state: PlayerState;
  elapsed: number;
  total: number;
  chapter: number;
  chapters: readonly number[];
  cursor: GuideCursor;
  play: () => void;
  pause: () => void;
  replay: () => void;
  seek: (chapter: number) => void;
}

interface AutoplayOptions {
  reset?: () => void;
  chapters?: readonly number[];
}

const CURSOR_LEAD = 650;
const VISIBLE_BAND = '-30% 0px -30% 0px';
const AUTOMATION_GRACE = 1100;
const PROGRESS_TICK = 200;
const FAR_FUTURE = 1e9;
const HIDDEN_CURSOR: GuideCursor = { x: 0, y: 0, click: 0, visible: false };

export function useAutoplay<T extends HTMLElement>(
  ref: RefObject<T | null>,
  play: (schedule: Later) => void,
  { reset, chapters = [0] }: AutoplayOptions = {},
): {
  inView: boolean;
  touched: boolean;
  schedule: Schedule;
  interrupt: () => void;
  player: DemoPlayer;
} {
  const inView = useInView(ref, { margin: VISIBLE_BAND, once: false });
  const reduceMotion = usePrefersReducedMotion();
  const { schedule, clear } = useTimers();
  const [touched, setTouched] = useState(false);
  const [state, setState] = useState<PlayerState>('waiting');
  const [elapsed, setElapsed] = useState(0);
  const [total, setTotal] = useState(0);
  const [cursor, setCursor] = useState<GuideCursor>(HIDDEN_CURSOR);

  const playRef = useRef(play);
  const resetRef = useRef(reset);
  const timeline = useRef<Timeline>(createTimeline());
  const timer = useRef<number | undefined>(undefined);
  const base = useRef(0);
  const resumedAt = useRef(0);
  const running = useRef(false);
  const autoPaused = useRef(false);
  const stateRef = useRef<PlayerState>('waiting');
  const automating = useRef(false);
  const automatedUntil = useRef(0);
  const pumpRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    playRef.current = play;
    resetRef.current = reset;
  });

  const setPlayerState = useCallback((next: PlayerState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const now = useCallback(
    () => (running.current ? base.current + performance.now() - resumedAt.current : base.current),
    [],
  );

  const moveCursor = useCallback(
    (target: string, click: boolean) => {
      const root = ref.current;
      const element = root?.querySelector(target);
      if (!root || !element) return;
      revealWithin(element, root);
      const box = root.getBoundingClientRect();
      const rect = element.getBoundingClientRect();
      setCursor((current) => ({
        x: rect.left - box.left + rect.width / 2,
        y: rect.top - box.top + rect.height / 2,
        click: click ? current.click + 1 : current.click,
        visible: true,
      }));
    },
    [ref],
  );

  const act = useCallback(
    (target: string, options: CueOptions) => {
      const element = ref.current?.querySelector(target);
      if (!element) return;
      automating.current = true;
      try {
        if (options.value !== undefined && element instanceof HTMLInputElement) {
          const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
          setter?.call(element, options.value);
          element.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (options.press && element instanceof HTMLElement) {
          element.click();
        }
      } finally {
        automating.current = false;
        automatedUntil.current = performance.now() + AUTOMATION_GRACE;
      }
    },
    [ref],
  );

  const later = useCallback<Later>(
    (callback, delay, options = {}) => {
      const { target } = options;
      if (target) {
        addCue(timeline.current, () => moveCursor(target, false), delay - CURSOR_LEAD);
        addCue(
          timeline.current,
          () => {
            moveCursor(target, options.click ?? options.press ?? false);
            act(target, options);
            callback();
          },
          delay,
          options,
        );
        return;
      }
      addCue(timeline.current, callback, delay, options);
    },
    [act, moveCursor],
  );

  const stopTimer = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
  }, []);

  const finish = useCallback(() => {
    running.current = false;
    base.current = timeline.current.now;
    setElapsed(base.current);
    setTotal(base.current);
    setPlayerState('done');
    window.setTimeout(() => setCursor((current) => ({ ...current, visible: false })), 900);
  }, [setPlayerState]);

  const pump = useCallback(() => {
    stopTimer();
    const at = now();
    runUntil(timeline.current, at);
    setTotal(endOf(timeline.current));
    const next = nextCue(timeline.current, FAR_FUTURE);
    if (!next) {
      finish();
      return;
    }
    timer.current = window.setTimeout(() => pumpRef.current(), Math.max(0, next.at - at));
  }, [finish, now, stopTimer]);

  useEffect(() => {
    pumpRef.current = pump;
  }, [pump]);

  const resume = useCallback(() => {
    if (running.current) return;
    running.current = true;
    resumedAt.current = performance.now();
    setPlayerState('playing');
    pump();
  }, [pump, setPlayerState]);

  const halt = useCallback(() => {
    if (!running.current) return;
    base.current = now();
    running.current = false;
    stopTimer();
    setElapsed(base.current);
  }, [now, stopTimer]);

  const load = useCallback(
    (until: number, sync: boolean) => {
      halt();
      timeline.current = createTimeline();
      base.current = 0;
      playRef.current(later);
      runUntil(timeline.current, until, sync ? (run) => flushSync(run) : undefined);
      base.current = until;
      setElapsed(until);
      setTotal(endOf(timeline.current));
    },
    [halt, later],
  );

  const start = useCallback(
    (from = 0, sync = true) => {
      clear();
      setTouched(false);
      if (stateRef.current !== 'waiting') resetRef.current?.();
      if (reduceMotion) {
        load(FAR_FUTURE, sync);
        setCursor(HIDDEN_CURSOR);
        finish();
        return;
      }
      load(from, sync && from > 0);
      resume();
    },
    [clear, finish, load, reduceMotion, resume],
  );

  useEffect(() => {
    if (!inView) {
      if (running.current) {
        halt();
        autoPaused.current = true;
        setPlayerState('paused');
      }
      return;
    }
    if (stateRef.current === 'waiting') {
      start(0, false);
      return;
    }
    if (autoPaused.current) {
      autoPaused.current = false;
      resume();
    }
  }, [inView, start, halt, resume, setPlayerState]);

  useEffect(() => {
    if (!running.current) return;
    const id = window.setInterval(() => setElapsed(now()), PROGRESS_TICK);
    return () => window.clearInterval(id);
  }, [state, now]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const takeControl = useCallback(() => {
    const at = now();
    const pending = timeline.current.cues.filter((cue) => cue.options.process);
    clear();
    if (stateRef.current === 'yours') return;
    halt();
    timeline.current.cues = [];
    for (const cue of pending) schedule(cue.run, Math.max(0, cue.at - at));
    autoPaused.current = false;
    setTouched(true);
    setCursor(HIDDEN_CURSOR);
    setPlayerState('yours');
  }, [clear, halt, now, schedule, setPlayerState]);

  const interrupt = useCallback(() => {
    if (automating.current || performance.now() < automatedUntil.current) return;
    takeControl();
  }, [takeControl]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const onUser = (event: Event) => {
      if (event.isTrusted && (stateRef.current === 'playing' || stateRef.current === 'paused'))
        takeControl();
    };
    root.addEventListener('pointerdown', onUser);
    root.addEventListener('keydown', onUser);
    return () => {
      root.removeEventListener('pointerdown', onUser);
      root.removeEventListener('keydown', onUser);
    };
  }, [ref, takeControl]);

  const pause = useCallback(() => {
    halt();
    autoPaused.current = false;
    setPlayerState('paused');
  }, [halt, setPlayerState]);

  const playAction = useCallback(() => {
    if (stateRef.current === 'paused') {
      resume();
      return;
    }
    start();
  }, [resume, start]);

  const seek = useCallback(
    (index: number) => {
      start(chapters[index] ?? 0);
    },
    [chapters, start],
  );

  const routed = useCallback<Schedule>(
    (callback, delay) => {
      if (automating.current) {
        addCue(timeline.current, callback, delay, { process: true });
        return;
      }
      schedule(callback, delay);
    },
    [schedule],
  );

  return {
    inView,
    touched,
    schedule: routed,
    interrupt,
    player: {
      state,
      elapsed,
      total,
      chapter: chapterAt(chapters, elapsed),
      chapters,
      cursor,
      play: playAction,
      pause,
      replay: () => start(),
      seek,
    },
  };
}
