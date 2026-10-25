import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { ChevronDown, Minus, Plus } from 'lucide-react';
import type { Dictionary } from '@/shared/i18n';
import { useDismiss } from '@/shared/lib';
import { FRAME_WIDTH, ZOOM_PRESETS, clampZoom } from '../model/document';

export type Tool = 'move' | 'hand';

interface CanvasProps {
  copy: Dictionary['design']['figma'];
  tool: Tool;
  label: string;
  cursor: { x: number; y: number } | null;
  onBackground: () => void;
  children: ReactNode;
}

const PADDING = 48;

export function Canvas({ copy, tool, label, cursor, onBackground, children }: CanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const [zoom, setZoom] = useState<number | null>(null);
  const [fit, setFit] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [space, setSpace] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [menu, setMenu] = useState(false);
  const [height, setHeight] = useState(0);

  useDismiss(menuRef, menu, () => setMenu(false));

  useEffect(() => {
    const viewport = viewportRef.current;
    const frame = frameRef.current;
    if (!viewport || !frame) return;
    const observer = new ResizeObserver(() => {
      const width = (viewport.clientWidth - PADDING) / FRAME_WIDTH;
      const tall = (viewport.clientHeight - PADDING * 1.5) / frame.offsetHeight;
      setFit(Math.min(1, width, tall));
      setHeight(frame.offsetHeight);
    });
    observer.observe(viewport);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const scale = zoom ?? fit;
  const panning = tool === 'hand' || space;

  const setScale = (value: number | null) => {
    setZoom(value === null ? null : clampZoom(value));
    if (value === null) setPan({ x: 0, y: 0 });
    setMenu(false);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!panning) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
    setDragging(true);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start) return;
    setPan({ x: start.panX + event.clientX - start.x, y: start.panY + event.clientY - start.y });
  };

  const endDrag = () => {
    drag.current = null;
    setDragging(false);
  };

  return (
    <div
      ref={viewportRef}
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key === ' ' && !(event.target instanceof HTMLInputElement)) {
          event.preventDefault();
          setSpace(true);
        }
      }}
      onKeyUp={(event) => {
        if (event.key === ' ') setSpace(false);
      }}
      onClick={onBackground}
      className="relative h-[27rem] touch-none overflow-hidden bg-[#f3f4f6] bg-[radial-gradient(circle,#d6d9e0_1px,transparent_1px)] bg-[length:16px_16px] outline-none sm:h-[30rem]"
      style={{ backgroundPosition: `${pan.x}px ${pan.y}px` }}
    >
      <div
        className="absolute top-1/2 left-1/2"
        style={{
          transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${scale})`,
          transition: dragging || zoom === null ? 'none' : 'transform 260ms var(--ease-out)',
        }}
      >
        <span
          className="absolute left-0 whitespace-nowrap text-black/50"
          style={{ top: `${-22 / scale}px`, fontSize: `${0.6875 / scale}rem` }}
        >
          {label}
        </span>
        <div ref={frameRef}>{children}</div>
        <span
          className="absolute left-1/2 -translate-x-1/2 rounded bg-[#2f3bff] px-1.5 py-0.5 font-mono whitespace-nowrap text-white"
          style={{ top: `calc(100% + ${10 / scale}px)`, fontSize: `${0.625 / scale}rem` }}
        >
          {FRAME_WIDTH} × {Math.round(height)}
        </span>
        {cursor ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute z-10 transition-[left,top] duration-700 ease-[var(--ease-out)]"
            style={{ left: `${cursor.x}%`, top: `${cursor.y}%`, scale: `${1 / scale}` }}
          >
            <svg viewBox="0 0 16 16" className="size-4 drop-shadow">
              <path d="M1 1l5 14 2-6 6-2z" fill="#E5484D" stroke="white" strokeWidth="1.2" />
            </svg>
            <span className="absolute top-4 left-3 rounded-full bg-[#E5484D] px-2 py-0.5 text-[0.6875rem] font-medium whitespace-nowrap text-white">
              {copy.collaborator}
            </span>
          </span>
        ) : null}
      </div>

      {panning ? (
        <div
          aria-hidden="true"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClick={(event) => event.stopPropagation()}
          className={`absolute inset-0 z-20 ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        />
      ) : null}

      <div
        ref={menuRef}
        onClick={(event) => event.stopPropagation()}
        className="absolute right-3 bottom-3 z-30 flex items-center rounded-lg border border-win-line bg-win text-[0.75rem] text-win-text shadow-sm"
      >
        <button
          type="button"
          aria-label={copy.tools.zoomOut}
          title={copy.tools.zoomOut}
          onClick={() => setScale(scale / 1.25)}
          className="grid size-8 cursor-pointer place-items-center rounded-l-lg hover:bg-win-raised"
        >
          <Minus aria-hidden="true" className="size-3.5" />
        </button>
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={menu}
          aria-label={`${Math.round(scale * 100)}%, ${copy.tools.zoom}`}
          onClick={() => setMenu((open) => !open)}
          className="flex h-8 w-16 cursor-pointer items-center justify-center gap-0.5 tabular-nums hover:bg-win-raised"
        >
          {Math.round(scale * 100)}%
          <ChevronDown aria-hidden="true" className="size-3" />
        </button>
        <button
          type="button"
          aria-label={copy.tools.zoomIn}
          title={copy.tools.zoomIn}
          onClick={() => setScale(scale * 1.25)}
          className="grid size-8 cursor-pointer place-items-center rounded-r-lg hover:bg-win-raised"
        >
          <Plus aria-hidden="true" className="size-3.5" />
        </button>
        {menu ? (
          <div
            role="menu"
            className="absolute right-0 bottom-full mb-1.5 w-36 rounded-lg border border-win-line bg-win py-1 shadow-lg"
          >
            {ZOOM_PRESETS.map((value) => (
              <button
                key={value}
                type="button"
                role="menuitem"
                onClick={() => setScale(value)}
                className="block w-full cursor-pointer px-3 py-1.5 text-left hover:bg-win-raised"
              >
                {value * 100}%
              </button>
            ))}
            <button
              type="button"
              role="menuitem"
              onClick={() => setScale(null)}
              className="block w-full cursor-pointer border-t border-win-line px-3 py-1.5 text-left hover:bg-win-raised"
            >
              {copy.tools.fit}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
