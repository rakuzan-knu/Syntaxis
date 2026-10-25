import { useCallback, useRef, useState } from 'react';
import { Box, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDismiss } from '@/shared/lib';
import { ROOT, ancestors, childrenOf, parentPath } from '../../model/fileSystem';
import { FileIcon } from './FileIcon';

interface BreadcrumbsProps {
  path: string;
  symbol?: string;
  onOpen: (path: string) => void;
}

export function Breadcrumbs({ path, symbol, onOpen }: BreadcrumbsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<{ anchor: number; folder: string } | null>(null);
  const close = useCallback(() => setMenu(null), []);
  useDismiss(rootRef, menu !== null, close);

  const segments = [...ancestors(path), path];
  const items = menu ? childrenOf(menu.folder) : [];

  return (
    <div ref={rootRef} className="relative shrink-0">
      <nav
        aria-label="Breadcrumbs"
        className="scrollbar-none flex items-center overflow-x-auto px-3 py-1 text-[0.75rem] text-win-muted"
      >
        {segments.map((segment, index) => {
          const name = segment.split('/').at(-1) ?? segment;
          const open = menu?.anchor === index;
          return (
            <span key={segment} className="flex shrink-0 items-center">
              {index > 0 ? (
                <ChevronRight aria-hidden="true" className="size-3.5 opacity-60" />
              ) : null}
              <button
                type="button"
                aria-expanded={open}
                aria-haspopup="menu"
                onClick={() =>
                  setMenu(open ? null : { anchor: index, folder: parentPath(segment) })
                }
                className={`flex cursor-pointer items-center gap-1 rounded px-1 py-0.5 transition-colors hover:bg-win-raised hover:text-win-text ${open ? 'bg-win-raised text-win-text' : ''}`}
              >
                {index === segments.length - 1 ? <FileIcon name={name} /> : null}
                {name}
              </button>
            </span>
          );
        })}
        {symbol ? (
          <span className="flex shrink-0 items-center">
            <ChevronRight aria-hidden="true" className="size-3.5 opacity-60" />
            <span className="flex items-center gap-1 px-1">
              <Box aria-hidden="true" className="syn-keyword size-3.5" />
              {symbol}
            </span>
          </span>
        ) : null}
      </nav>

      {menu ? (
        <div
          role="menu"
          aria-label={menu.folder || ROOT.name}
          className="ink-in absolute top-full left-3 z-40 max-h-72 w-64 overflow-y-auto rounded-md border border-win-line bg-win-raised py-1 text-[0.8125rem] shadow-2xl"
        >
          {menu.folder ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => setMenu({ ...menu, folder: parentPath(menu.folder) })}
              className="flex w-full cursor-pointer items-center gap-1.5 px-2 py-1 text-left text-win-muted transition-colors hover:bg-win-accent/20 hover:text-win-text"
            >
              <ChevronLeft aria-hidden="true" className="size-3.5" />
              {parentPath(menu.folder).split('/').at(-1) || ROOT.name}
            </button>
          ) : null}
          {items.map((item) => (
            <button
              key={item.path}
              type="button"
              role="menuitem"
              onClick={() => {
                if (item.kind === 'folder') {
                  setMenu({ ...menu, folder: item.path });
                } else {
                  onOpen(item.path);
                  setMenu(null);
                }
              }}
              className={`flex w-full cursor-pointer items-center gap-1.5 px-2 py-1 text-left transition-colors hover:bg-win-accent/20 ${item.path === path || segments.includes(item.path) ? 'bg-win-accent/15 text-win-text' : 'text-win-text/85'}`}
            >
              {item.kind === 'folder' ? (
                <ChevronRight aria-hidden="true" className="size-3.5 shrink-0" />
              ) : (
                <FileIcon name={item.name} />
              )}
              {item.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
