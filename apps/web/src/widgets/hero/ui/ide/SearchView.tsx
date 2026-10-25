import { useState } from 'react';
import { CaseSensitive, ChevronDown, ChevronRight, Regex, WholeWord } from 'lucide-react';
import { searchFiles } from '../../model/fileSystem';
import { FileIcon } from './FileIcon';

interface SearchViewProps {
  sources: Record<string, string>;
  onOpen: (path: string, line: number) => void;
}

export function SearchView({ sources, onOpen }: SearchViewProps) {
  const [query, setQuery] = useState('accent');
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const results = searchFiles(query, sources);
  const total = results.reduce((sum, result) => sum + result.matches.length, 0);

  const toggle = (path: string) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="flex h-9 shrink-0 items-center px-4 text-[0.6875rem] tracking-wide text-win-muted">
        SEARCH
      </p>
      <div className="px-3">
        <label className="flex items-center gap-1 rounded border border-win-line bg-win-raised pr-1 focus-within:border-win-accent">
          <span className="sr-only">Search</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            className="min-w-0 flex-1 bg-transparent px-2 py-1 text-[0.8125rem] text-win-text outline-none placeholder:text-win-muted"
          />
          {[CaseSensitive, WholeWord, Regex].map((Icon, index) => (
            <Icon key={index} aria-hidden="true" className="size-4 text-win-muted" />
          ))}
        </label>
        <p className="mt-2 text-[0.6875rem] text-win-muted">
          {query.trim().length < 2
            ? 'Type at least 2 characters'
            : `${total} result${total === 1 ? '' : 's'} in ${results.length} file${results.length === 1 ? '' : 's'}`}
        </p>
      </div>
      <ul className="mt-2 min-h-0 flex-1 overflow-y-auto pb-2 text-[0.8125rem]">
        {results.map((result) => {
          const open = !collapsed.has(result.path);
          const name = result.path.split('/').at(-1) ?? result.path;
          return (
            <li key={result.path}>
              <button
                type="button"
                aria-expanded={open}
                onClick={() => toggle(result.path)}
                className="flex w-full cursor-pointer items-center gap-1 py-[3px] pr-3 pl-2 text-left transition-colors hover:bg-win-raised"
              >
                {open ? (
                  <ChevronDown aria-hidden="true" className="size-3.5 shrink-0" />
                ) : (
                  <ChevronRight aria-hidden="true" className="size-3.5 shrink-0" />
                )}
                <FileIcon name={name} />
                <span className="truncate text-win-text">{name}</span>
                <span className="ml-auto rounded-full bg-win-raised px-1.5 text-[0.625rem] text-win-muted">
                  {result.matches.length}
                </span>
              </button>
              {open ? (
                <ul>
                  {result.matches.map((match) => {
                    const before = match.text.slice(0, match.start).trimStart();
                    const hit = match.text.slice(match.start, match.start + query.trim().length);
                    const after = match.text.slice(match.start + hit.length);
                    return (
                      <li key={match.line}>
                        <button
                          type="button"
                          onClick={() => onOpen(result.path, match.line)}
                          className="block w-full cursor-pointer truncate py-[3px] pr-3 pl-10 text-left font-mono text-[0.75rem] text-win-muted transition-colors hover:bg-win-raised hover:text-win-text"
                        >
                          {before.slice(-24)}
                          <mark className="rounded-sm bg-warn/30 text-win-text">{hit}</mark>
                          {after}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
