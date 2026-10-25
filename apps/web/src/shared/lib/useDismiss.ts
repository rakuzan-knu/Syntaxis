import { useEffect, type RefObject } from 'react';

export function useDismiss<T extends HTMLElement>(
  ref: RefObject<T | null>,
  open: boolean,
  onDismiss: () => void,
): void {
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (event.target instanceof Node && ref.current?.contains(event.target)) return;
      onDismiss();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss();
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, open, onDismiss]);
}
