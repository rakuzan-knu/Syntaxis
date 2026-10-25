import { useState } from 'react';
import { Eye, EyeOff, FileText, Frame, Lock, Square, Type, Unlock, Component } from 'lucide-react';
import type { Dictionary } from '@/shared/i18n';
import { nameOf, nodesOn, type DesignDoc, type NodeKind, type PageId } from '../model/document';

interface LayersPanelProps {
  copy: Dictionary['design']['figma'];
  doc: DesignDoc;
  page: PageId;
  selected: string | null;
  onPage: (page: PageId) => void;
  onSelect: (id: string) => void;
  onToggleHidden: (id: string) => void;
  onToggleLocked: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

const ICONS: Record<NodeKind, typeof Frame> = {
  frame: Frame,
  text: Type,
  button: Component,
  badge: Square,
  component: Component,
};

const PAGES: readonly PageId[] = ['subscribe', 'checkout'];

export function LayersPanel({
  copy,
  doc,
  page,
  selected,
  onPage,
  onSelect,
  onToggleHidden,
  onToggleLocked,
  onRename,
}: LayersPanelProps) {
  const [renaming, setRenaming] = useState<string | null>(null);

  return (
    <div className="text-[0.75rem]">
      <p className="px-4 pt-3 pb-1.5 text-[0.6875rem] font-semibold text-win-text">{copy.pages}</p>
      <ul className="pb-2">
        {PAGES.map((id) => (
          <li key={id}>
            <button
              type="button"
              aria-current={page === id ? 'page' : undefined}
              onClick={() => onPage(id)}
              className={`flex w-full cursor-pointer items-center gap-2 px-4 py-1.5 text-left ${page === id ? 'font-semibold text-win-text' : 'text-win-muted hover:bg-win-raised hover:text-win-text'}`}
            >
              <FileText aria-hidden="true" className="size-3.5 shrink-0 opacity-60" />
              {copy.pageNames[id]}
            </button>
          </li>
        ))}
      </ul>
      <p className="border-t border-win-line px-4 pt-3 pb-1.5 text-[0.6875rem] font-semibold text-win-text">
        {copy.layers}
      </p>
      <ul>
        {nodesOn(page).map((node) => {
          const Icon = ICONS[node.kind];
          const hidden = doc.hidden.includes(node.id);
          const locked = doc.locked.includes(node.id);
          const active = selected === node.id;
          const name = nameOf(doc, node.id);
          return (
            <li
              key={node.id}
              className={`group flex items-center pr-1.5 ${active ? 'bg-win-accent/10 text-win-accent' : 'text-win-text hover:bg-win-raised'}`}
            >
              {renaming === node.id ? (
                <input
                  autoFocus
                  defaultValue={name}
                  aria-label={name}
                  onFocus={(event) => event.currentTarget.select()}
                  onBlur={(event) => {
                    onRename(node.id, event.currentTarget.value);
                    setRenaming(null);
                  }}
                  onKeyDown={(event) => {
                    event.stopPropagation();
                    if (event.key === 'Enter') event.currentTarget.blur();
                    if (event.key === 'Escape') setRenaming(null);
                  }}
                  className={`my-0.5 min-w-0 flex-1 rounded-sm border border-win-accent bg-win px-1.5 py-1 text-win-text outline-none ${node.depth === 0 ? 'ml-2' : 'ml-7'}`}
                />
              ) : (
                <button
                  type="button"
                  aria-pressed={active}
                  title={copy.editHint}
                  onClick={() => onSelect(node.id)}
                  onDoubleClick={() => setRenaming(node.id)}
                  className={`flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-1.5 text-left ${node.depth === 0 ? 'pl-3' : 'pl-8'} ${hidden ? 'opacity-45' : ''}`}
                >
                  <Icon aria-hidden="true" className="size-3.5 shrink-0 opacity-60" />
                  <span className="truncate">{name}</span>
                </button>
              )}
              {node.depth === 1 ? (
                <>
                  <button
                    type="button"
                    aria-label={`${locked ? copy.unlock : copy.lock}: ${name}`}
                    title={locked ? copy.unlock : copy.lock}
                    aria-pressed={locked}
                    onClick={() => onToggleLocked(node.id)}
                    className={`grid size-6 shrink-0 cursor-pointer place-items-center rounded text-win-muted hover:text-win-text ${locked ? '' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100'}`}
                  >
                    {locked ? (
                      <Lock aria-hidden="true" className="size-3" />
                    ) : (
                      <Unlock aria-hidden="true" className="size-3" />
                    )}
                  </button>
                  <button
                    type="button"
                    aria-label={`${hidden ? copy.show : copy.hide}: ${name}`}
                    title={hidden ? copy.show : copy.hide}
                    aria-pressed={hidden}
                    onClick={() => onToggleHidden(node.id)}
                    className={`grid size-6 shrink-0 cursor-pointer place-items-center rounded text-win-muted hover:text-win-text ${hidden ? '' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100'}`}
                  >
                    {hidden ? (
                      <EyeOff aria-hidden="true" className="size-3" />
                    ) : (
                      <Eye aria-hidden="true" className="size-3" />
                    )}
                  </button>
                </>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
