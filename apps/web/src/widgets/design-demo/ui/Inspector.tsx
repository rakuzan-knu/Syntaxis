import { useId, type ReactNode } from 'react';
import type { Dictionary } from '@/shared/i18n';
import {
  ACCENTS,
  defaultText,
  nodeById,
  styleOf,
  type DesignDoc,
  type Font,
  type NodeStyle,
  type Padding,
  type Shadow,
} from '../model/document';

interface InspectorProps {
  copy: Dictionary['design'];
  doc: DesignDoc;
  selected: string | null;
  onNode: (id: string, patch: NodeStyle, key?: string) => void;
  onAccent: (accent: string) => void;
  onFont: (font: Font) => void;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-b border-win-line px-4 py-3.5">
      <p className="mb-2.5 text-[0.6875rem] font-semibold text-win-text">{label}</p>
      {children}
    </div>
  );
}

function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid auto-cols-fr grid-flow-col rounded-md bg-win-raised p-0.5"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={`cursor-pointer truncate rounded px-1.5 py-1 text-[0.75rem] ${value === option.value ? 'bg-win text-win-text shadow-sm' : 'text-win-muted hover:text-win-text'}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center gap-3">
      <input
        id={id}
        aria-label={label}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full cursor-pointer accent-[var(--win-accent)]"
      />
      <output
        htmlFor={id}
        className="w-12 rounded border border-win-line px-1.5 py-0.5 text-right font-mono text-[0.6875rem]"
      >
        {value}
      </output>
    </div>
  );
}

function Swatches({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <>
      <div className="relative flex gap-2">
        {ACCENTS.map((accent) => (
          <button
            key={accent}
            type="button"
            aria-pressed={value.toLowerCase() === accent.toLowerCase()}
            aria-label={accent}
            onClick={() => onChange(accent)}
            className={`size-7 cursor-pointer rounded-md ring-offset-2 ring-offset-win transition-shadow ${value.toLowerCase() === accent.toLowerCase() ? 'ring-2 ring-win-accent' : ''}`}
            style={{ backgroundColor: accent }}
          />
        ))}
      </div>
      <p className="mt-2 font-mono text-[0.6875rem] text-win-muted">{value.toUpperCase()} · 100%</p>
    </>
  );
}

function isPadding(value: string): value is Padding {
  return value === 'compact' || value === 'comfortable';
}

function isShadow(value: string): value is Shadow {
  return value === 'none' || value === 'soft' || value === 'strong';
}

function isFont(value: string): value is Font {
  return value === 'sans' || value === 'mono';
}

export function Inspector({ copy, doc, selected, onNode, onAccent, onFont }: InspectorProps) {
  const labels = copy.figma.props;
  const node = selected ? nodeById(selected) : undefined;
  const style = node ? styleOf(doc, node.id) : {};
  const paddings = copy.densities.flatMap((choice) =>
    isPadding(choice.value) ? [{ value: choice.value, label: choice.label }] : [],
  );
  const shadows = copy.figma.shadows.flatMap((choice) =>
    isShadow(choice.value) ? [{ value: choice.value, label: choice.label }] : [],
  );
  const fonts = copy.fonts.flatMap((choice) =>
    isFont(choice.value) ? [{ value: choice.value, label: choice.label }] : [],
  );

  if (!node || node.kind === 'component') {
    return (
      <>
        <Row label={labels.page}>
          <Swatches value={doc.accent} onChange={onAccent} />
          <p className="mt-2 text-[0.6875rem] text-win-muted">{labels.accentNote}</p>
        </Row>
        <Row label={copy.controls.font}>
          <Choice label={copy.controls.font} value={doc.font} options={fonts} onChange={onFont} />
        </Row>
      </>
    );
  }

  const id = node.id;
  const textRow =
    node.kind === 'text' || node.kind === 'button' || node.kind === 'badge' ? (
      <Row label={labels.text}>
        <input
          key={id}
          value={style.text ?? defaultText(id, copy)}
          aria-label={labels.text}
          onChange={(event) => onNode(id, { text: event.target.value }, `${id}:text`)}
          className="w-full rounded-md border border-win-line bg-win px-2 py-1.5 text-[0.75rem] text-win-text outline-none focus:border-win-accent"
        />
      </Row>
    ) : null;

  return (
    <>
      {node.kind === 'frame' ? (
        <>
          <Row label={labels.radius}>
            <Slider
              label={labels.radius}
              value={style.radius ?? 0}
              min={0}
              max={32}
              onChange={(value) => onNode(id, { radius: value }, `${id}:radius`)}
            />
          </Row>
          <Row label={labels.padding}>
            <Choice
              label={labels.padding}
              value={style.padding ?? 'comfortable'}
              options={paddings}
              onChange={(value) => onNode(id, { padding: value })}
            />
          </Row>
          <Row label={labels.shadow}>
            <Choice
              label={labels.shadow}
              value={style.shadow ?? 'soft'}
              options={shadows}
              onChange={(value) => onNode(id, { shadow: value })}
            />
          </Row>
        </>
      ) : null}
      {textRow}
      {node.kind === 'text' ? (
        <>
          <Row label={labels.size}>
            <Slider
              label={labels.size}
              value={style.size ?? 14}
              min={11}
              max={32}
              onChange={(value) => onNode(id, { size: value }, `${id}:size`)}
            />
          </Row>
          <Row label={labels.weight}>
            <Choice
              label={labels.weight}
              value={String(style.weight ?? 400)}
              options={copy.figma.weights}
              onChange={(value) => onNode(id, { weight: Number(value) })}
            />
          </Row>
        </>
      ) : null}
      {node.kind === 'button' || node.kind === 'badge' ? (
        <Row label={labels.color}>
          <Swatches
            value={style.color ?? doc.accent}
            onChange={(value) => onNode(id, { color: value })}
          />
        </Row>
      ) : null}
      {node.kind === 'button' ? (
        <Row label={labels.radius}>
          <Slider
            label={labels.radius}
            value={style.radius ?? 0}
            min={0}
            max={24}
            onChange={(value) => onNode(id, { radius: value }, `${id}:radius`)}
          />
        </Row>
      ) : null}
    </>
  );
}
