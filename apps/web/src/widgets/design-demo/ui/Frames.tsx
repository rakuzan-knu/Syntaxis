import { createContext, use, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { Dictionary } from '@/shared/i18n';
import { fontCss, paddingPx, shadowCss } from '../model/css';
import { modeStyle } from '../model/variables';
import {
  FRAME_WIDTH,
  NARROW_FRAME,
  clampWidth,
  nodeById,
  defaultText,
  isTextNode,
  linkFrom,
  styleOf,
  type ButtonState,
  type DesignDoc,
  type PageId,
} from '../model/document';

type DesignCopy = Dictionary['design'];

export interface FrameProps {
  page: PageId;
  doc: DesignDoc;
  copy: DesignCopy;
  mode: 'edit' | 'present';
  selected?: string | null;
  editing?: string | null;
  flash?: boolean;
  onSelect?: (id: string | null) => void;
  onEdit?: (id: string | null) => void;
  onText?: (id: string, text: string) => void;
  onNavigate?: (page: PageId) => void;
  onResize?: (id: string, width: number) => void;
}

function EditableText({
  value,
  editing,
  onCommit,
  onCancel,
}: {
  value: string;
  editing: boolean;
  onCommit: (value: string) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(value);
  if (!editing) return <>{value}</>;
  return (
    <input
      autoFocus
      value={draft}
      aria-label={value}
      onChange={(event) => setDraft(event.target.value)}
      onFocus={(event) => event.currentTarget.select()}
      onBlur={() => onCommit(draft)}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === 'Enter') onCommit(draft);
        if (event.key === 'Escape') onCancel();
      }}
      onClick={(event) => event.stopPropagation()}
      className="m-0 w-full min-w-[4ch] bg-transparent p-0 text-inherit outline-none [font:inherit] selection:bg-[#2f3bff]/25"
      style={{ width: `${Math.max(draft.length, 4) + 1}ch` }}
    />
  );
}

const FrameContext = createContext<FrameProps | null>(null);

function useFrame(): FrameProps {
  const props = use(FrameContext);
  if (!props) throw new Error('FrameContext is missing');
  return props;
}

function NodeText({ id }: { id: string }) {
  const { doc, copy, mode, editing, onEdit, onText } = useFrame();
  const current = styleOf(doc, id).text ?? defaultText(id, copy);
  const active = mode === 'edit' && editing === id;
  return (
    <EditableText
      key={active ? 'edit' : 'view'}
      value={current}
      editing={active}
      onCommit={(value) => {
        const next = value.trim();
        if (next !== '' && next !== current) onText?.(id, next);
        onEdit?.(null);
      }}
      onCancel={() => onEdit?.(null)}
    />
  );
}

const CORNERS = [
  '-top-[3px] -left-[3px]',
  '-top-[3px] -right-[3px]',
  '-bottom-[3px] -left-[3px]',
  '-right-[3px] -bottom-[3px]',
] as const;

function Box({
  id,
  className = '',
  style,
  children,
}: {
  id: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const { doc, mode, selected, editing, flash, onSelect, onEdit, onNavigate, onResize } =
    useFrame();
  if (doc.hidden.includes(id)) return null;
  const link = linkFrom(id);

  if (mode === 'present') {
    return (
      <div
        data-present={id}
        className={`relative ${link ? 'cursor-pointer' : ''} ${className}`}
        style={style}
        onClick={
          link
            ? (event) => {
                event.stopPropagation();
                onNavigate?.(link);
              }
            : undefined
        }
      >
        {children}
        {link && flash ? (
          <span
            aria-hidden="true"
            className="ink-in pointer-events-none absolute -inset-1 rounded-md border-2 border-[#2f3bff] bg-[#2f3bff]/10"
          />
        ) : null}
      </div>
    );
  }

  const locked = doc.locked.includes(id);
  const active = selected === id;
  const isEditing = editing === id;
  const resizable = active && !locked && nodeById(id)?.kind === 'frame' && onResize;
  return (
    <div
      data-node={id}
      onClick={(event) => {
        if (locked) return;
        event.stopPropagation();
        onSelect?.(id);
      }}
      onDoubleClick={(event) => {
        if (locked || !isTextNode(id)) return;
        event.stopPropagation();
        onSelect?.(id);
        onEdit?.(id);
      }}
      className={`relative outline-offset-2 ${isEditing ? '' : '[&_button]:pointer-events-none [&_input]:pointer-events-none'} ${active ? 'outline-[1.5px] outline-[#2f3bff] outline-solid' : locked ? '' : 'hover:outline-1 hover:outline-[#2f3bff]/50 hover:outline-solid'} ${className}`}
      style={style}
    >
      {children}
      {resizable ? <ResizeHandle id={id} onResize={onResize} /> : null}
      {active && !isEditing ? (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0">
          {CORNERS.map((corner) => (
            <span
              key={corner}
              className={`absolute size-1.5 border border-[#2f3bff] bg-white ${corner}`}
            />
          ))}
        </span>
      ) : null}
    </div>
  );
}

function stateStyle(state: ButtonState | undefined): CSSProperties {
  if (state === 'hover') return { filter: 'brightness(1.08)' };
  if (state === 'pressed') return { filter: 'brightness(0.9)', scale: '0.98' };
  if (state === 'disabled') return { opacity: 0.45 };
  return {};
}

function ResizeHandle({
  id,
  onResize,
}: {
  id: string;
  onResize: (id: string, width: number) => void;
}) {
  const start = useRef<{ x: number; width: number; scale: number } | null>(null);
  return (
    <span
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize frame"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => {
        event.stopPropagation();
        const frame = event.currentTarget.parentElement;
        if (!frame) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        start.current = {
          x: event.clientX,
          width: frame.offsetWidth,
          scale: frame.getBoundingClientRect().width / frame.offsetWidth || 1,
        };
      }}
      onPointerMove={(event) => {
        const origin = start.current;
        if (!origin) return;
        onResize(id, clampWidth(origin.width + (event.clientX - origin.x) / origin.scale));
      }}
      onPointerUp={() => {
        start.current = null;
      }}
      className="absolute top-1/2 -right-[6px] z-10 h-9 w-3 -translate-y-1/2 cursor-ew-resize rounded-full border-2 border-[#2f3bff] bg-white shadow"
    />
  );
}

function frameStyle(doc: DesignDoc, id: string): CSSProperties {
  const style = styleOf(doc, id);
  return {
    width: style.width ?? FRAME_WIDTH,
    borderRadius: style.radius ?? 0,
    boxShadow: shadowCss(style.shadow),
    fontFamily: fontCss(doc.font),
    padding: paddingPx(style.padding),
    gap: paddingPx(style.padding) * 0.66,
    ...modeStyle(doc.mode),
  };
}

function SubscribeFrame(props: FrameProps) {
  const { doc, copy, mode } = props;
  const [tab, setTab] = useState(0);
  const narrow = (styleOf(doc, 'card').width ?? FRAME_WIDTH) < NARROW_FRAME;
  const [reminder, setReminder] = useState(true);
  const title = styleOf(doc, 'title');
  const body = styleOf(doc, 'text');
  const primary = styleOf(doc, 'primary');
  const badge = styleOf(doc, 'badge');
  const radius = styleOf(doc, 'card').radius ?? 0;
  const control = Math.round(radius * 0.6);

  return (
    <Box
      id="card"
      className="flex flex-col bg-[var(--surface-background)] text-[var(--text-primary)] transition-[border-radius,box-shadow,padding,background-color,color] duration-300"
      style={frameStyle(doc, 'card')}
    >
      <div className="flex items-start justify-between gap-3">
        <Box id="title">
          <p
            className="tracking-[-0.01em] transition-[font-size]"
            style={{ fontSize: title.size, fontWeight: title.weight, lineHeight: 1.25 }}
          >
            <NodeText id="title" />
          </p>
        </Box>
        <Box id="badge" className="shrink-0">
          <span
            className="block rounded-md px-2 py-0.5 text-[0.6875rem] font-medium text-white transition-colors duration-300"
            style={{ backgroundColor: badge.color ?? doc.accent }}
          >
            <NodeText id="badge" />
          </span>
        </Box>
      </div>
      <Box id="text">
        <p
          className="text-[var(--text-secondary)]"
          style={{ fontSize: body.size, fontWeight: body.weight, lineHeight: 1.45 }}
        >
          <NodeText id="text" />
        </p>
      </Box>
      <Box id="tabs">
        <div
          role="tablist"
          aria-label={copy.kit.title}
          className="grid grid-cols-2 bg-[var(--surface-subtle)] p-1"
          style={{ borderRadius: control }}
        >
          {copy.kit.tabs.map((label, index) => (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={tab === index}
              tabIndex={mode === 'present' ? 0 : -1}
              onClick={() => setTab(index)}
              className={`cursor-pointer py-1.5 text-[0.8125rem] font-medium transition-colors ${tab === index ? 'bg-[var(--surface-raised)] shadow-sm' : 'text-[var(--text-secondary)]'}`}
              style={{ borderRadius: Math.max(control - 3, 0) }}
            >
              {label}
            </button>
          ))}
        </div>
      </Box>
      <Box id="email">
        <label className="block text-[0.75rem] font-medium text-[var(--text-secondary)]">
          {copy.kit.emailLabel}
          <input
            type="email"
            tabIndex={mode === 'present' ? 0 : -1}
            readOnly={mode === 'edit'}
            placeholder={copy.kit.emailPlaceholder}
            className="mt-1.5 block w-full border border-[var(--border-default)] bg-[var(--surface-background)] px-3 py-2 text-[0.875rem] outline-none placeholder:text-[var(--text-secondary)]"
            style={{ borderRadius: control }}
          />
        </label>
      </Box>
      <Box id="toggle">
        <button
          type="button"
          role="switch"
          aria-checked={reminder}
          tabIndex={mode === 'present' ? 0 : -1}
          onClick={() => setReminder((value) => !value)}
          className="flex w-full cursor-pointer items-center justify-between gap-3 text-left text-[0.8125rem]"
        >
          {copy.kit.toggle}
          <span
            aria-hidden="true"
            className="relative h-5 w-9 shrink-0 rounded-full transition-colors duration-300"
            style={{ backgroundColor: reminder ? doc.accent : 'var(--border-default)' }}
          >
            <span
              className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform duration-300 ${reminder ? 'translate-x-4' : ''}`}
            />
          </span>
        </button>
      </Box>
      <div className={narrow ? 'flex flex-col gap-2' : 'flex gap-2'}>
        <Box id="primary" className="flex-1">
          <span
            className="block py-2.5 text-center text-[0.875rem] font-medium text-white transition-[background-color,border-radius] duration-300"
            style={{
              backgroundColor: primary.color ?? doc.accent,
              borderRadius: primary.radius,
              ...stateStyle(primary.state),
            }}
          >
            <NodeText id="primary" />
          </span>
        </Box>
        <Box id="secondary" className="flex-1">
          <span
            className="block border border-[var(--border-default)] py-2.5 text-center text-[0.875rem] font-medium"
            style={{ borderRadius: primary.radius }}
          >
            {copy.kit.secondary}
          </span>
        </Box>
      </div>
    </Box>
  );
}

function CheckoutFrame(props: FrameProps) {
  const { doc, copy } = props;
  const heading = styleOf(doc, 'heading');
  const pay = styleOf(doc, 'pay');
  const radius = styleOf(doc, 'checkout').radius ?? 0;
  const labels = copy.figma.checkout;

  return (
    <Box
      id="checkout"
      className="flex flex-col bg-[var(--surface-background)] text-[var(--text-primary)] transition-[border-radius,box-shadow,padding,background-color,color] duration-300"
      style={frameStyle(doc, 'checkout')}
    >
      <Box id="back" className="self-start">
        <span className="flex items-center gap-1 text-[0.8125rem] text-[var(--text-secondary)]">
          <ArrowLeft aria-hidden="true" className="size-3.5" />
          {labels.back}
        </span>
      </Box>
      <Box id="heading">
        <p
          className="tracking-[-0.01em]"
          style={{ fontSize: heading.size, fontWeight: heading.weight, lineHeight: 1.25 }}
        >
          <NodeText id="heading" />
        </p>
      </Box>
      <Box id="summary">
        <div
          className="flex flex-col gap-2 bg-[var(--surface-subtle)] p-3.5 text-[0.8125rem]"
          style={{ borderRadius: Math.round(radius * 0.6) }}
        >
          <span className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="size-9 shrink-0 rounded-lg"
              style={{ backgroundColor: `${doc.accent}22` }}
            />
            <span className="min-w-0">
              <span className="block truncate font-medium">{labels.plan}</span>
              <span className="block text-[var(--text-secondary)]">{labels.delivery}</span>
            </span>
          </span>
          <span className="flex justify-between border-t border-[var(--border-default)] pt-2 font-semibold">
            {labels.total}
            <span className="tabular-nums">420 ₴</span>
          </span>
        </div>
      </Box>
      <Box id="pay">
        <span
          className="block py-2.5 text-center text-[0.875rem] font-medium text-white transition-[background-color,border-radius] duration-300"
          style={{
            backgroundColor: pay.color ?? doc.accent,
            borderRadius: pay.radius,
            ...stateStyle(pay.state),
          }}
        >
          <NodeText id="pay" />
        </span>
      </Box>
    </Box>
  );
}

export function PageFrame(props: FrameProps) {
  return (
    <FrameContext value={props}>
      {props.page === 'subscribe' ? <SubscribeFrame {...props} /> : <CheckoutFrame {...props} />}
    </FrameContext>
  );
}
