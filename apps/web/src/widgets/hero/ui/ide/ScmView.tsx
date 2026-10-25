import { Check, GitCommitHorizontal, RotateCcw } from 'lucide-react';
import { HERO_PATH } from '../../model/fileSystem';
import { FileIcon } from './FileIcon';

export interface CommitEntry {
  sha: string;
  message: string;
}

interface ScmViewProps {
  modified: boolean;
  message: string;
  commits: readonly CommitEntry[];
  onMessage: (value: string) => void;
  onCommit: () => void;
  onDiscard: () => void;
  onOpen: (path: string) => void;
}

export function ScmView({
  modified,
  message,
  commits,
  onMessage,
  onCommit,
  onDiscard,
  onOpen,
}: ScmViewProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="flex h-9 shrink-0 items-center px-4 text-[0.6875rem] tracking-wide text-win-muted">
        SOURCE CONTROL
      </p>
      <div className="px-3">
        <label className="block">
          <span className="sr-only">Commit message</span>
          <textarea
            rows={2}
            value={message}
            onChange={(event) => onMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && modified) onCommit();
            }}
            placeholder="Message (Ctrl+Enter to commit on 'main')"
            className="block w-full resize-none rounded border border-win-line bg-win-raised px-2 py-1.5 text-[0.8125rem] text-win-text outline-none placeholder:text-win-muted focus:border-win-accent"
          />
        </label>
        <button
          type="button"
          disabled={!modified}
          onClick={onCommit}
          className="mt-2 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded bg-win-accent py-1.5 text-[0.8125rem] font-medium text-win transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Check aria-hidden="true" className="size-4" />
          Commit
        </button>
      </div>
      <p className="mt-4 px-4 text-[0.6875rem] font-semibold text-win-muted">
        CHANGES{' '}
        {modified ? <span className="ml-1 rounded-full bg-win-raised px-1.5">1</span> : null}
      </p>
      {modified ? (
        <div className="group mt-1 flex items-center gap-1 pr-2 pl-4 text-[0.8125rem] transition-colors hover:bg-win-raised">
          <button
            type="button"
            onClick={() => onOpen(HERO_PATH)}
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-1 py-[3px] text-left"
          >
            <FileIcon name="Hero.tsx" />
            <span className="truncate text-warn">Hero.tsx</span>
            <span className="truncate text-[0.6875rem] text-win-muted">src/widgets/hero</span>
          </button>
          <button
            type="button"
            title="Discard Changes"
            aria-label="Discard Changes"
            onClick={onDiscard}
            className="grid size-6 cursor-pointer place-items-center rounded text-win-muted opacity-0 transition hover:bg-win-line hover:text-win-text group-hover:opacity-100 focus:opacity-100"
          >
            <RotateCcw aria-hidden="true" className="size-3.5" />
          </button>
          <span className="w-4 text-center text-[0.6875rem] text-warn">M</span>
        </div>
      ) : (
        <p className="px-4 py-1 text-[0.75rem] text-win-muted">No changes in the working tree.</p>
      )}
      {commits.length > 0 ? (
        <>
          <p className="mt-4 px-4 text-[0.6875rem] font-semibold text-win-muted">GRAPH</p>
          <ul className="mt-1 text-[0.75rem]">
            {commits.map((commit) => (
              <li
                key={commit.sha}
                className="log-line flex items-center gap-2 px-4 py-[3px] transition-colors hover:bg-win-raised"
              >
                <GitCommitHorizontal
                  aria-hidden="true"
                  className="size-3.5 shrink-0 text-win-accent"
                />
                <span className="truncate text-win-text">{commit.message}</span>
                <code className="ml-auto shrink-0 text-win-muted">{commit.sha}</code>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
