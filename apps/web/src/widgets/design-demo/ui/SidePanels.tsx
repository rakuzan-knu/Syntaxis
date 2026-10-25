import { ArrowRight, Check, Copy, MousePointerClick, Play } from 'lucide-react';
import type { Dictionary } from '@/shared/i18n';
import { useCopyToClipboard } from '@/shared/lib';
import { CodeBlock } from '@/shared/ui';
import { cssFor } from '../model/css';
import { PROTOTYPE_LINKS, nameOf, nodeById, type DesignDoc, type PageId } from '../model/document';

interface SidePanelsProps {
  panel: 'prototype' | 'inspect';
  copy: Dictionary['design']['figma'];
  doc: DesignDoc;
  selected: string | null;
  onSelect: (id: string, page: PageId) => void;
  onPresent: () => void;
}

export default function SidePanels({
  panel,
  copy,
  doc,
  selected,
  onSelect,
  onPresent,
}: SidePanelsProps) {
  const { copied, copy: copyText } = useCopyToClipboard();

  if (panel === 'inspect') {
    const lines = selected ? cssFor(doc, selected) : [];
    return (
      <div className="px-4 py-3.5">
        {lines.length === 0 ? (
          <p className="text-[0.75rem] text-win-muted">{copy.inspectEmpty}</p>
        ) : (
          <>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[0.6875rem] font-semibold text-win-text">CSS</p>
              <button
                type="button"
                onClick={() => void copyText(lines.join('\n'))}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-[0.6875rem] text-win-muted hover:bg-win-raised hover:text-win-text"
              >
                {copied ? (
                  <Check aria-hidden="true" className="size-3.5 text-win-accent" />
                ) : (
                  <Copy aria-hidden="true" className="size-3.5" />
                )}
                <span aria-live="polite">{copied ? copy.copied : copy.copy}</span>
              </button>
            </div>
            <CodeBlock
              language="tsx"
              numbered={false}
              className="rounded-md bg-win-raised px-3 py-2.5"
              lines={lines.map((line) => [line])}
            />
          </>
        )}
      </div>
    );
  }

  const links = selected
    ? PROTOTYPE_LINKS.filter((link) => link.from === selected)
    : PROTOTYPE_LINKS;

  return (
    <div className="px-4 py-3.5 text-[0.75rem]">
      <button
        type="button"
        onClick={onPresent}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-win-accent px-3 py-2 font-medium text-white hover:opacity-90"
      >
        <Play aria-hidden="true" className="size-3.5 fill-current" />
        {copy.present}
      </button>
      <p className="mt-4 mb-2 text-[0.6875rem] font-semibold text-win-text">{copy.flow.title}</p>
      {links.length === 0 ? (
        <p className="text-win-muted">{copy.flow.empty}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {links.map((link) => {
            const page = nodeById(link.from)?.page ?? 'subscribe';
            return (
              <li key={link.from}>
                <button
                  type="button"
                  onClick={() => onSelect(link.from, page)}
                  className={`w-full cursor-pointer rounded-md border p-2.5 text-left transition-colors ${selected === link.from ? 'border-win-accent bg-win-accent/5' : 'border-win-line hover:border-win-accent/50'}`}
                >
                  <span className="flex items-center gap-1.5 font-medium text-win-text">
                    {nameOf(doc, link.from)}
                    <ArrowRight aria-hidden="true" className="size-3 text-win-muted" />
                    {copy.pageNames[link.to]}
                  </span>
                  <span className="mt-1.5 flex items-center gap-1.5 text-win-muted">
                    <MousePointerClick aria-hidden="true" className="size-3" />
                    {copy.flow.trigger} · {copy.flow.navigate} «{copy.pageNames[link.to]}»
                  </span>
                  <span className="mt-0.5 block text-win-muted">{copy.flow.animation}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
