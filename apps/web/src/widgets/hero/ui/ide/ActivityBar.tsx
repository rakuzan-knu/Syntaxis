import { CircleUserRound, Files, GitBranch, Puzzle, Search, Settings } from 'lucide-react';

export type SidebarView = 'explorer' | 'search' | 'scm' | 'extensions';

const ITEMS = [
  { id: 'explorer', label: 'Explorer (Ctrl+Shift+E)', Icon: Files },
  { id: 'search', label: 'Search (Ctrl+Shift+F)', Icon: Search },
  { id: 'scm', label: 'Source Control (Ctrl+Shift+G)', Icon: GitBranch },
  { id: 'extensions', label: 'Extensions (Ctrl+Shift+X)', Icon: Puzzle },
] as const;

interface ActivityBarProps {
  view: SidebarView | null;
  changes: number;
  onSelect: (view: SidebarView) => void;
}

export function ActivityBar({ view, changes, onSelect }: ActivityBarProps) {
  return (
    <nav
      aria-label="Activity Bar"
      className="flex w-10 shrink-0 flex-col items-center border-r border-win-line py-1 sm:w-12"
    >
      {ITEMS.map(({ id, label, Icon }) => {
        const active = view === id;
        return (
          <button
            key={id}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={active}
            onClick={() => onSelect(id)}
            className={`relative grid size-10 cursor-pointer place-items-center transition-colors sm:size-12 ${active ? 'text-win-text' : 'text-win-muted hover:text-win-text'}`}
          >
            {active ? (
              <span aria-hidden="true" className="absolute inset-y-2 left-0 w-0.5 bg-win-text" />
            ) : null}
            <Icon aria-hidden="true" className="size-5" strokeWidth={1.75} />
            {id === 'scm' && changes > 0 ? (
              <span className="absolute right-2 bottom-2 grid size-4 place-items-center rounded-full bg-win-accent text-[0.5625rem] font-semibold text-win">
                {changes}
              </span>
            ) : null}
          </button>
        );
      })}
      <span className="mt-auto flex flex-col">
        {[
          { label: 'Accounts', Icon: CircleUserRound },
          { label: 'Manage', Icon: Settings },
        ].map(({ label, Icon }) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            className="hidden size-12 cursor-pointer place-items-center text-win-muted transition-colors hover:text-win-text sm:grid"
          >
            <Icon aria-hidden="true" className="size-5" strokeWidth={1.75} />
          </button>
        ))}
      </span>
    </nav>
  );
}
