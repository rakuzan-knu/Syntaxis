import { useEffect, useRef, useState, type RefObject } from 'react';
import { ChevronRight, CircleX, Info, TriangleAlert, X } from 'lucide-react';

export interface ConsoleEntry {
  id: number;
  level: 'info' | 'warning' | 'error';
  text: string;
}

interface DomNode {
  id: number;
  tag: string;
  label: string;
  text: string;
  children: DomNode[];
}

interface Inspected {
  tag: string;
  label: string;
  styles: readonly (readonly [string, string])[];
}

type Tab = 'elements' | 'console';

const MAX_DEPTH = 7;
const STYLE_KEYS = [
  'display',
  'color',
  'background-color',
  'font-size',
  'padding',
  'border-radius',
];

function labelOf(element: Element): string {
  const guide = element.getAttribute('data-guide');
  if (guide) return `[data-guide="${guide}"]`;
  const aria = element.getAttribute('aria-label');
  if (aria) return `[aria-label="${aria.slice(0, 24)}"]`;
  const className = element
    .getAttribute('class')
    ?.split(' ')
    .find((name) => /^[a-z@]/.test(name));
  return className ? `.${className.replace(/[[\]/:]/g, '')}` : '';
}

function snapshot(root: Element, registry: Map<number, Element>): DomNode[] {
  let next = 0;
  const walk = (element: Element, depth: number): DomNode => {
    next += 1;
    const id = next;
    registry.set(id, element);
    const children =
      depth < MAX_DEPTH
        ? Array.from(element.children)
            .filter((child) => !['svg', 'path', 'script'].includes(child.tagName.toLowerCase()))
            .map((child) => walk(child, depth + 1))
        : [];
    const own = Array.from(element.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent?.trim() ?? '')
      .join(' ')
      .trim();
    return {
      id,
      tag: element.tagName.toLowerCase(),
      label: labelOf(element),
      text: own.slice(0, 40),
      children,
    };
  };
  registry.clear();
  return Array.from(root.children).map((child) => walk(child, 0));
}

interface DevToolsProps {
  target: RefObject<HTMLDivElement | null>;
  stage: RefObject<HTMLDivElement | null>;
  entries: readonly ConsoleEntry[];
  onClose: () => void;
}

export function DevTools({ target, stage, entries, onClose }: DevToolsProps) {
  const [tab, setTab] = useState<Tab>('elements');
  const [tree, setTree] = useState<DomNode[]>([]);
  const [open, setOpen] = useState<ReadonlySet<number>>(() => new Set([1, 2]));
  const [hovered, setHovered] = useState<{ x: number; y: number; w: number; h: number } | null>(
    null,
  );
  const [inspected, setInspected] = useState<Inspected | null>(null);
  const registry = useRef(new Map<number, Element>());
  const frame = useRef(0);

  useEffect(() => {
    const root = target.current;
    if (!root) return;
    const map = registry.current;
    const rebuild = () => setTree(snapshot(root, map));
    frame.current = window.requestAnimationFrame(rebuild);
    const observer = new MutationObserver(() => {
      window.cancelAnimationFrame(frame.current);
      frame.current = window.requestAnimationFrame(rebuild);
    });
    observer.observe(root, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame.current);
    };
  }, [target]);

  const highlight = (id: number | null) => {
    const element = id === null ? undefined : registry.current.get(id);
    const box = stage.current?.getBoundingClientRect();
    if (!element || !box) {
      setHovered(null);
      return;
    }
    const rect = element.getBoundingClientRect();
    setHovered({ x: rect.left - box.left, y: rect.top - box.top, w: rect.width, h: rect.height });
  };

  const inspect = (node: DomNode) => {
    const element = registry.current.get(node.id);
    if (!element) return;
    const computed = window.getComputedStyle(element);
    setInspected({
      tag: node.tag,
      label: node.label,
      styles: STYLE_KEYS.map((key) => [key, computed.getPropertyValue(key)] as const),
    });
    element.scrollIntoView({ block: 'nearest' });
  };

  const toggle = (id: number) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const renderNode = (node: DomNode, depth: number) => {
    const expanded = open.has(node.id);
    return (
      <li key={node.id}>
        <div
          onMouseEnter={() => highlight(node.id)}
          onMouseLeave={() => highlight(null)}
          onClick={() => inspect(node)}
          className="flex cursor-default items-center gap-1 rounded-sm py-px pr-2 whitespace-nowrap hover:bg-[#cfe8fc]"
          style={{ paddingLeft: depth * 12 + 4 }}
        >
          {node.children.length > 0 ? (
            <button
              type="button"
              aria-label={expanded ? 'Collapse' : 'Expand'}
              onClick={(event) => {
                event.stopPropagation();
                toggle(node.id);
              }}
              className="grid size-3.5 cursor-pointer place-items-center text-[#5f6368]"
            >
              <ChevronRight
                aria-hidden="true"
                className={`size-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
              />
            </button>
          ) : (
            <span className="size-3.5" />
          )}
          <span className="text-[#881280]">&lt;{node.tag}</span>
          {node.label ? <span className="text-[#994500]">{node.label}</span> : null}
          <span className="text-[#881280]">&gt;</span>
          {node.text ? <span className="truncate text-[#1d1d1f]">{node.text}</span> : null}
        </div>
        {expanded && node.children.length > 0 ? (
          <ul>{node.children.map((child) => renderNode(child, depth + 1))}</ul>
        ) : null}
      </li>
    );
  };

  const icon = (level: ConsoleEntry['level']) =>
    level === 'error' ? (
      <CircleX aria-hidden="true" className="mt-0.5 size-3 shrink-0" />
    ) : level === 'warning' ? (
      <TriangleAlert aria-hidden="true" className="mt-0.5 size-3 shrink-0" />
    ) : (
      <Info aria-hidden="true" className="mt-0.5 size-3 shrink-0 text-[#5f6368]" />
    );

  return (
    <>
      {hovered ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute z-30 border border-[#1a73e8] bg-[#1a73e8]/15"
          style={{ left: hovered.x, top: hovered.y, width: hovered.w, height: hovered.h }}
        />
      ) : null}
      <div className="absolute inset-x-0 bottom-0 z-40 flex h-[45%] min-h-40 flex-col border-t border-[#cbcdd1] bg-white font-mono text-[0.6875rem] text-[#1d1d1f]">
        <div className="flex h-7 shrink-0 items-center gap-3 border-b border-[#e0e0e0] bg-[#f1f3f4] px-2 font-sans text-[0.6875rem]">
          {(['elements', 'console'] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`h-full cursor-pointer border-b-2 px-1 capitalize ${tab === id ? 'border-[#1a73e8] text-[#1d1d1f]' : 'border-transparent text-[#5f6368] hover:text-[#1d1d1f]'}`}
            >
              {id}
              {id === 'console' && entries.some((entry) => entry.level !== 'info') ? (
                <span className="ml-1 rounded-full bg-[#fce8e6] px-1 text-[#c5221f]">
                  {entries.filter((entry) => entry.level !== 'info').length}
                </span>
              ) : null}
            </button>
          ))}
          <button
            type="button"
            aria-label="Close DevTools"
            onClick={onClose}
            className="ml-auto grid size-5 cursor-pointer place-items-center rounded text-[#5f6368] hover:bg-[#e0e0e0]"
          >
            <X aria-hidden="true" className="size-3" />
          </button>
        </div>
        {tab === 'elements' ? (
          <div className="flex min-h-0 flex-1">
            <ul className="min-w-0 flex-1 overflow-auto py-1">
              {tree.map((node) => renderNode(node, 0))}
            </ul>
            {inspected ? (
              <div className="hidden w-44 shrink-0 overflow-auto border-l border-[#e0e0e0] p-2 sm:block">
                <p className="mb-1 font-sans font-semibold">
                  {inspected.tag}
                  <span className="font-mono font-normal text-[#994500]">{inspected.label}</span>
                </p>
                <dl>
                  {inspected.styles.map(([key, value]) => (
                    <div key={key} className="flex gap-1 py-px">
                      <dt className="shrink-0 text-[#c80000]">{key}:</dt>
                      <dd className="truncate">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
          </div>
        ) : (
          <ul aria-live="polite" className="min-h-0 flex-1 overflow-auto">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className={`flex gap-1.5 border-b border-[#f1f3f4] px-2 py-1 ${entry.level === 'error' ? 'bg-[#fce8e6] text-[#c5221f]' : entry.level === 'warning' ? 'bg-[#fef7e0] text-[#8a5a00]' : ''}`}
              >
                {icon(entry.level)}
                <span className="min-w-0 break-words">{entry.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
