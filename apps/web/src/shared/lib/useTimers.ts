import { useCallback, useEffect, useRef } from 'react';

export function useTimers(): {
  schedule: (callback: () => void, delay: number) => void;
  clear: () => void;
} {
  const ids = useRef<number[]>([]);

  const clear = useCallback(() => {
    for (const id of ids.current) window.clearTimeout(id);
    ids.current = [];
  }, []);

  const schedule = useCallback((callback: () => void, delay: number) => {
    ids.current.push(window.setTimeout(callback, delay));
  }, []);

  useEffect(() => clear, [clear]);

  return { schedule, clear };
}
