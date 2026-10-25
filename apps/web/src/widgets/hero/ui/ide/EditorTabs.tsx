import { X } from 'lucide-react';
import { FileIcon } from './FileIcon';

interface EditorTabsProps {
  tabs: readonly string[];
  active: string | null;
  modifiedPath: string | null;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
}

export function EditorTabs({ tabs, active, modifiedPath, onSelect, onClose }: EditorTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Open editors"
      className="scrollbar-none flex h-9 shrink-0 items-stretch overflow-x-auto border-b border-win-line bg-win-raised/40 text-[0.8125rem]"
    >
      {tabs.map((path) => {
        const name = path.split('/').at(-1) ?? path;
        const selected = path === active;
        const dirty = path === modifiedPath;
        return (
          <div
            key={path}
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(path)}
            onAuxClick={(event) => {
              if (event.button === 1) onClose(path);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onSelect(path);
            }}
            className={`group flex shrink-0 cursor-pointer items-center gap-1.5 border-r border-win-line pr-1.5 pl-3 transition-colors ${selected ? 'border-t-2 border-t-win-accent bg-win text-win-text' : 'border-t-2 border-t-transparent text-win-muted hover:bg-win-raised hover:text-win-text'}`}
          >
            <FileIcon name={name} />
            {name}
            <button
              type="button"
              title="Close (Ctrl+F4)"
              aria-label={`Close ${name}`}
              onClick={(event) => {
                event.stopPropagation();
                onClose(path);
              }}
              className={`relative grid size-6 cursor-pointer place-items-center rounded transition-colors hover:bg-win-line ${selected ? '' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'} ${dirty ? 'opacity-100' : ''}`}
            >
              {dirty ? (
                <>
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-full bg-win-text group-hover:hidden"
                  />
                  <X aria-hidden="true" className="hidden size-3.5 group-hover:block" />
                </>
              ) : (
                <X aria-hidden="true" className="size-3.5" />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
