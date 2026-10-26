import { use, useEffect, useMemo, useRef, type PointerEvent, type ReactNode } from 'react';
import { DesktopContext, WindowControlsContext, type WindowControls } from './desktopContext';

interface DesktopWindowProps {
  id: string;
  title: string;
  className?: string;
  children: ReactNode;
}

const INTERACTIVE = 'button, a, input, select, textarea, [role="tab"], [contenteditable="true"]';
const BASE_LAYER = 10;

export function DesktopWindow({ id, title, className = '', children }: DesktopWindowProps) {
  const desktop = use(DesktopContext);
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const offset = useRef({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const enabled = desktop?.enabled ?? false;
  const register = desktop?.register;
  const generation = desktop?.generation ?? 0;

  useEffect(() => {
    register?.(id, title);
  }, [register, id, title]);

  useEffect(() => {
    offset.current = { x: 0, y: 0 };
    inner.current?.style.removeProperty('translate');
  }, [generation, enabled]);

  const controls = useMemo<WindowControls | null>(
    () =>
      desktop && enabled
        ? {
            id,
            close: () => desktop.minimize(id),
            minimize: () => desktop.minimize(id),
            zoom: () => desktop.toggleSolo(id),
            solo: desktop.solo === id,
          }
        : null,
    [desktop, enabled, id],
  );

  const minimized = enabled && (desktop?.minimized.includes(id) ?? false);
  const layer = BASE_LAYER + Math.max(0, desktop?.order.indexOf(id) ?? 0);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!enabled || !desktop) return;
    desktop.focus(id);
    if (event.button !== 0 || !(event.target instanceof Element)) return;
    if (!event.target.closest('[data-drag-handle]') || event.target.closest(INTERACTIVE)) return;
    event.preventDefault();
    outer.current?.setPointerCapture(event.pointerId);
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      startX: offset.current.x,
      startY: offset.current.y,
    };
    inner.current?.classList.add('is-dragging');
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    const element = inner.current;
    if (!start || !element) return;
    const parent = outer.current?.closest('.desktop')?.getBoundingClientRect();
    const box = outer.current?.getBoundingClientRect();
    let x = start.startX + event.clientX - start.x;
    let y = start.startY + event.clientY - start.y;
    if (parent && box) {
      const left = box.left - parent.left;
      const top = box.top - parent.top;
      x = Math.min(parent.width - left - 80, Math.max(-left - box.width + 120, x));
      y = Math.min(parent.height - top - 48, Math.max(-top, y));
    }
    offset.current = { x, y };
    element.style.translate = `${x}px ${y}px`;
  };

  const endDrag = () => {
    drag.current = null;
    inner.current?.classList.remove('is-dragging');
  };

  return (
    <div
      ref={outer}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={className}
      style={enabled ? { zIndex: layer } : undefined}
    >
      <div
        ref={inner}
        aria-hidden={minimized || undefined}
        inert={minimized}
        className={`desktop-window h-full ${minimized ? 'is-minimized' : ''}`}
      >
        <WindowControlsContext value={controls}>{children}</WindowControlsContext>
      </div>
    </div>
  );
}
