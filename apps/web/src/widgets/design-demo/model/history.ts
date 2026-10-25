export interface UndoHistory<T> {
  past: readonly T[];
  present: T;
  future: readonly T[];
  key: string | null;
}

export const HISTORY_LIMIT = 50;

export function createUndo<T>(present: T): UndoHistory<T> {
  return { past: [], present, future: [], key: null };
}

export function commit<T>(
  history: UndoHistory<T>,
  next: T,
  key: string | null = null,
): UndoHistory<T> {
  if (next === history.present) return history;
  if (key !== null && key === history.key) return { ...history, present: next, future: [] };
  return {
    past: [...history.past, history.present].slice(-HISTORY_LIMIT),
    present: next,
    future: [],
    key,
  };
}

export function replace<T>(history: UndoHistory<T>, next: T): UndoHistory<T> {
  return { ...history, present: next, key: null };
}

export function undo<T>(history: UndoHistory<T>): UndoHistory<T> {
  const previous = history.past[history.past.length - 1];
  if (previous === undefined) return history;
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
    key: null,
  };
}

export function redo<T>(history: UndoHistory<T>): UndoHistory<T> {
  const [next, ...rest] = history.future;
  if (next === undefined) return history;
  return { past: [...history.past, history.present], present: next, future: rest, key: null };
}
