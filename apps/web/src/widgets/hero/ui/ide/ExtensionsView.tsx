import { useState } from 'react';

const EXTENSIONS = [
  {
    id: 'eslint',
    name: 'ESLint',
    publisher: 'Microsoft',
    description: 'Integrates ESLint into VS Code.',
    color: '#4b32c3',
  },
  {
    id: 'prettier',
    name: 'Prettier - Code formatter',
    publisher: 'Prettier',
    description: 'Code formatter using prettier.',
    color: '#1a2b34',
  },
  {
    id: 'tailwind',
    name: 'Tailwind CSS IntelliSense',
    publisher: 'Tailwind Labs',
    description: 'Intelligent Tailwind CSS tooling.',
    color: '#0ea5e9',
  },
  {
    id: 'vitest',
    name: 'Vitest',
    publisher: 'Vitest',
    description: 'Run and debug Vitest tests.',
    color: '#729b1b',
  },
  {
    id: 'gitlens',
    name: 'GitLens',
    publisher: 'GitKraken',
    description: 'Supercharge Git inside the editor.',
    color: '#e8590c',
  },
] as const;

export function ExtensionsView() {
  const [disabled, setDisabled] = useState<ReadonlySet<string>>(new Set());

  const toggle = (id: string) =>
    setDisabled((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="flex h-9 shrink-0 items-center px-4 text-[0.6875rem] tracking-wide text-win-muted">
        EXTENSIONS
      </p>
      <p className="px-4 pb-1 text-[0.6875rem] font-semibold text-win-muted">
        INSTALLED{' '}
        <span className="ml-1 rounded-full bg-win-raised px-1.5">{EXTENSIONS.length}</span>
      </p>
      <ul className="min-h-0 flex-1 overflow-y-auto">
        {EXTENSIONS.map((extension) => {
          const off = disabled.has(extension.id);
          return (
            <li
              key={extension.id}
              className="flex gap-2.5 px-3 py-2 transition-colors hover:bg-win-raised"
            >
              <span
                aria-hidden="true"
                className={`grid size-8 shrink-0 place-items-center rounded text-[0.75rem] font-bold text-white ${off ? 'grayscale' : ''}`}
                style={{ backgroundColor: extension.color }}
              >
                {extension.name[0]}
              </span>
              <span className={`min-w-0 flex-1 ${off ? 'opacity-50' : ''}`}>
                <span className="block truncate text-[0.8125rem] font-semibold text-win-text">
                  {extension.name}
                </span>
                <span className="block truncate text-[0.6875rem] text-win-muted">
                  {extension.description}
                </span>
                <span className="mt-0.5 flex items-center justify-between gap-2 text-[0.6875rem] text-win-muted">
                  {extension.publisher}
                  <button
                    type="button"
                    onClick={() => toggle(extension.id)}
                    className="cursor-pointer rounded bg-win-raised px-1.5 py-0.5 text-win-text transition-colors hover:bg-win-line"
                  >
                    {off ? 'Enable' : 'Disable'}
                  </button>
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
