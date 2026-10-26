import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import { useDismiss } from '@/shared/lib';
import { Callout, CodeBlock, Hotspot, Window, type CodeLine } from '@/shared/ui';
import { ACCENTS } from '../model/accents';
import { completion } from '../model/completions';
import { HERO_PATH, ancestors, languageOf, sourcesFor, type HeroState } from '../model/fileSystem';
import { countBySeverity, detectProblems, type Problem } from '../model/problems';
import { runCommand } from '../model/shell';
import { countMatches, quickOpen, replaceAll, symbolsFor, type SymbolInfo } from '../model/symbols';
import { ActivityBar, type SidebarView } from './ide/ActivityBar';
import { BottomPanel, type PanelTab } from './ide/BottomPanel';
import { Breadcrumbs } from './ide/Breadcrumbs';
import {
  ContextMenu,
  FindWidget,
  HoverCard,
  QuickOpen,
  type MenuItem,
  type Point,
} from './ide/EditorOverlays';
import { EditorTabs } from './ide/EditorTabs';
import { ExplorerView } from './ide/ExplorerView';
import type { CommitEntry } from './ide/ScmView';
import { StatusBar } from './ide/StatusBar';
import { wordAt } from './ide/wordAt';

const SearchView = lazy(() =>
  import('./ide/SearchView').then((module) => ({ default: module.SearchView })),
);
const ScmView = lazy(() => import('./ide/ScmView').then((module) => ({ default: module.ScmView })));
const ExtensionsView = lazy(() =>
  import('./ide/ExtensionsView').then((module) => ({ default: module.ExtensionsView })),
);

export type TerminalUpdate = readonly string[] | 'clear';

interface IdeWindowProps {
  title: string;
  initial: HeroState;
  headline: string;
  cta: string;
  accent: string;
  typing: boolean;
  log: readonly string[];
  accentNames: readonly string[];
  accentLabel: string;
  hints: readonly string[];
  suggestions: readonly string[];
  acceptLabel: string;
  showHints: boolean;
  onHeadline: (value: string) => void;
  onCta: (value: string) => void;
  onAccent: (value: string) => void;
  onFocus: () => void;
  onTerminal: (update: TerminalUpdate) => void;
}

const LANGUAGE_LABEL: Record<string, string> = {
  tsx: 'TypeScript JSX',
  ts: 'TypeScript',
  json: 'JSON',
  html: 'HTML',
};

function languageLabel(path: string | null): string {
  if (!path) return 'Plain Text';
  const extension = path.split('.').at(-1) ?? '';
  return LANGUAGE_LABEL[extension] ?? 'Plain Text';
}

function shortSha(seed: number): string {
  return (0x4e1f2c3 + seed * 0x9e3779).toString(16).slice(-7);
}

export function IdeWindow({
  title,
  initial,
  headline,
  cta,
  accent,
  typing,
  log,
  accentNames,
  accentLabel,
  hints,
  suggestions,
  acceptLabel,
  showHints,
  onHeadline,
  onCta,
  onAccent,
  onFocus,
  onTerminal,
}: IdeWindowProps) {
  const pickerRef = useRef<HTMLSpanElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);
  const [picker, setPicker] = useState(false);
  const closePicker = useCallback(() => setPicker(false), []);
  useDismiss(pickerRef, picker, closePicker);

  const [view, setView] = useState<SidebarView | null>('explorer');
  const [sidebarRequested, setSidebarRequested] = useState(false);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(
    () => new Set(['', ...ancestors(HERO_PATH)]),
  );
  const [tabs, setTabs] = useState<readonly string[]>([HERO_PATH, 'src/shared/ui/Button.tsx']);
  const [active, setActive] = useState<string | null>(HERO_PATH);
  const [cursor, setCursor] = useState({ line: 8, column: headline.length + 11 });
  const [jump, setJump] = useState<{ path: string; line: number; seq: number } | null>(null);
  const [panelTab, setPanelTab] = useState<PanelTab>('terminal');
  const [panelOpen, setPanelOpen] = useState(true);
  const [panelMaximized, setPanelMaximized] = useState(false);
  const [baseline, setBaseline] = useState<HeroState>(initial);
  const [commitMessage, setCommitMessage] = useState('');
  const [commits, setCommits] = useState<readonly CommitEntry[]>([]);
  const [hover, setHover] = useState<{ symbol: SymbolInfo; at: Point } | null>(null);
  const [menu, setMenu] = useState<{ at: Point; symbol: SymbolInfo | null } | null>(null);
  const [find, setFind] = useState<{ query: string; replacement: string; index: number } | null>(
    null,
  );
  const [quick, setQuick] = useState<string | null>(null);
  const [headlineFocused, setHeadlineFocused] = useState(false);
  const [dismissed, setDismissed] = useState<string | null>(null);

  const hero: HeroState = { headline, cta, accent };
  const sources = sourcesFor(hero);
  const problems = detectProblems(hero);
  const { errors, warnings } = countBySeverity(problems);
  const dirty = {
    headline: headline !== baseline.headline,
    cta: cta !== baseline.cta,
    accent: accent !== baseline.accent,
  };
  const modified = dirty.headline || dirty.cta || dirty.accent;
  const modifiedPath = modified ? HERO_PATH : null;

  useEffect(() => {
    if (!jump || jump.path !== active) return;
    const container = codeRef.current;
    const row = container?.querySelectorAll('code > span')[jump.line - 1];
    if (container && row instanceof HTMLElement) {
      container.scrollTop = Math.max(0, row.offsetTop - container.clientHeight / 3);
    }
  }, [jump, active]);

  const openFile = (path: string, line?: number) => {
    if (!window.matchMedia('(min-width: 1280px)').matches) setSidebarRequested(false);
    setTabs((current) => (current.includes(path) ? current : [...current, path]));
    setActive(path);
    setExpanded((current) => new Set([...current, '', ...ancestors(path)]));
    const target = line ?? (path === HERO_PATH ? 8 : 1);
    setCursor({ line: target, column: 1 });
    setJump((current) => ({ path, line: target, seq: (current?.seq ?? 0) + 1 }));
  };

  const closeTab = (path: string) => {
    setTabs((current) => {
      const index = current.indexOf(path);
      const next = current.filter((item) => item !== path);
      if (path === active) setActive(next[Math.min(index, next.length - 1)] ?? null);
      return next;
    });
  };

  const selectView = (next: SidebarView) => {
    const visible = sidebarRequested || window.matchMedia('(min-width: 1280px)').matches;
    setSidebarRequested(true);
    setView((current) => (current === next && visible ? null : next));
  };

  const showPanel = (tab: PanelTab) => {
    setPanelOpen(true);
    setPanelTab(tab);
  };

  const toggleFolder = (path: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });

  const commit = () => {
    if (!modified) return;
    const message = commitMessage.trim() || 'Update hero copy';
    const sha = shortSha(commits.length + 1);
    setCommits((current) => [{ sha, message }, ...current]);
    setBaseline(hero);
    setCommitMessage('');
    onTerminal([`$ git commit -m "${message}"`, `[main ${sha}] ${message}`, ' 1 file changed']);
  };

  const discard = () => {
    onFocus();
    onHeadline(baseline.headline);
    onCta(baseline.cta);
    onAccent(baseline.accent);
  };

  const symbols = symbolsFor(sources, accent);
  const activeText = active ? (sources[active] ?? '') : '';
  const matchCount = find ? countMatches(activeText, find.query) : 0;
  const matchIndex =
    matchCount === 0 ? 0 : (((find?.index ?? 0) % matchCount) + matchCount) % matchCount;

  useEffect(() => {
    if (typeof CSS === 'undefined' || !('highlights' in CSS)) return;
    const registry = CSS.highlights;
    registry.delete('ide-find');
    registry.delete('ide-find-current');
    const code = codeRef.current?.querySelector('code');
    const query = find?.query.toLowerCase() ?? '';
    if (!code || query === '') return;
    const ranges: Range[] = [];
    const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent?.toLowerCase() ?? '';
      for (
        let from = text.indexOf(query);
        from !== -1;
        from = text.indexOf(query, from + query.length)
      ) {
        const range = document.createRange();
        range.setStart(node, from);
        range.setEnd(node, from + query.length);
        ranges.push(range);
      }
    }
    if (ranges.length === 0) return;
    registry.set('ide-find', new Highlight(...ranges));
    const current = ranges[matchIndex % ranges.length];
    if (current) {
      registry.set('ide-find-current', new Highlight(current));
      const container = codeRef.current;
      const rect = current.getBoundingClientRect();
      const box = container?.getBoundingClientRect();
      if (container && box && (rect.top < box.top || rect.bottom > box.bottom)) {
        container.scrollTop += rect.top - box.top - box.height / 3;
      }
    }
    return () => {
      registry.delete('ide-find');
      registry.delete('ide-find-current');
    };
  }, [find?.query, matchIndex, active, headline, cta, accent]);

  const pointIn = (rect: DOMRect): Point => {
    const box = codeRef.current?.getBoundingClientRect();
    const container = codeRef.current;
    if (!box || !container) return { x: 0, y: 0 };
    return {
      x: rect.left - box.left + container.scrollLeft,
      y: rect.bottom - box.top + container.scrollTop + 4,
    };
  };

  const symbolAt = (event: MouseEvent) => {
    const hit = wordAt(event.clientX, event.clientY);
    const symbol = hit ? symbols[hit.word] : undefined;
    return hit && symbol ? { symbol, rect: hit.rect } : null;
  };

  const goToDefinition = (symbol: SymbolInfo | null) => {
    if (!symbol?.definition) return;
    onFocus();
    openFile(symbol.definition.path, symbol.definition.line);
  };

  const onCodeMove = (event: MouseEvent) => {
    const hit = symbolAt(event);
    if (!hit) {
      if (hover) setHover(null);
      return;
    }
    const at = pointIn(hit.rect);
    if (hover?.symbol.name === hit.symbol.name && hover.at.x === at.x && hover.at.y === at.y)
      return;
    setHover({ symbol: hit.symbol, at });
  };

  const onCodeClick = (event: MouseEvent) => {
    if (!event.ctrlKey && !event.metaKey) return;
    const hit = symbolAt(event);
    if (!hit) return;
    event.preventDefault();
    setHover(null);
    goToDefinition(hit.symbol);
  };

  const onCodeMenu = (event: MouseEvent) => {
    event.preventDefault();
    const hit = symbolAt(event);
    const box = codeRef.current?.getBoundingClientRect();
    const container = codeRef.current;
    if (!box || !container) return;
    setHover(null);
    setMenu({
      at: {
        x: Math.min(event.clientX - box.left, box.width - 230) + container.scrollLeft,
        y: event.clientY - box.top + container.scrollTop,
      },
      symbol: hit?.symbol ?? null,
    });
  };

  const openFind = () => {
    onFocus();
    setQuick(null);
    setFind((current) => current ?? { query: '', replacement: '', index: 0 });
  };

  const onEditorKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const mod = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();
    if (mod && key === 'f') {
      event.preventDefault();
      openFind();
    } else if (mod && key === 'p') {
      event.preventDefault();
      onFocus();
      setFind(null);
      setQuick('');
    } else if (event.key === 'Escape') {
      setFind(null);
      setQuick(null);
      setMenu(null);
    }
  };

  const menuItems: MenuItem[] = [
    {
      label: 'Go to Definition',
      keys: 'F12',
      disabled: !menu?.symbol?.definition,
      run: () => goToDefinition(menu?.symbol ?? null),
    },
    { label: 'Find', keys: 'Ctrl+F', run: openFind },
    {
      label: 'Go to File…',
      keys: 'Ctrl+P',
      run: () => {
        onFocus();
        setQuick('');
      },
    },
    {
      label: 'Format Document',
      keys: 'Shift+Alt+F',
      disabled: !active,
      run: () =>
        onTerminal([`$ prettier --write ${active ?? ''}`, `${active ?? ''} 9ms (unchanged)`]),
    },
    {
      label: 'Copy Path',
      disabled: !active,
      run: () => void navigator.clipboard?.writeText(active ?? ''),
    },
  ];

  const execute = (input: string) => {
    const result = runCommand(input, { modified, errors, warnings });
    if (result.clear) onTerminal('clear');
    else onTerminal([`$ ${input}`, ...result.output]);
  };

  const ghost =
    (headlineFocused || typing) && dismissed !== headline ? completion(headline, suggestions) : '';

  const acceptGhost = () => {
    onFocus();
    onHeadline(headline + ghost);
  };

  const heroLines: CodeLine[] = [
    ["import { Button } from '@/shared/ui';"],
    ["import { useTranslation } from '@/shared/i18n';"],
    [
      "const accent = '",
      {
        node: (
          <span ref={pickerRef} className="relative inline-block">
            <button
              type="button"
              aria-label={accentLabel}
              aria-expanded={picker}
              data-guide="accent"
              onClick={() => {
                onFocus();
                setPicker((value) => !value);
              }}
              className="mr-1 inline-block size-3 translate-y-[2px] cursor-pointer rounded-[3px] border border-white/40 transition-[background-color,transform] duration-300 hover:scale-125"
              style={{ backgroundColor: accent }}
            />
            <span className="syn-string">{accent}</span>
            <Hotspot
              label={hints[1] ?? ''}
              visible={showHints && !picker}
              className="top-1/2 -right-[calc(2ch+1.25rem)] -translate-y-1/2"
              side="bottom"
            />
            {picker ? (
              <span
                role="radiogroup"
                aria-label={accentLabel}
                className="ink-in absolute top-6 left-0 z-30 flex gap-1.5 rounded-lg border border-win-line bg-win-raised p-2 shadow-xl"
              >
                {ACCENTS.map((value, index) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={accent === value}
                    data-guide={`accent-${index}`}
                    aria-label={accentNames[index] ?? value}
                    title={accentNames[index] ?? value}
                    onClick={() => {
                      onAccent(value);
                      setPicker(false);
                    }}
                    className={`size-6 cursor-pointer rounded-md ring-offset-2 ring-offset-win-raised transition-transform hover:scale-110 ${accent === value ? 'ring-2 ring-win-text' : ''}`}
                    style={{ backgroundColor: value }}
                  />
                ))}
              </span>
            ) : null}
          </span>
        ),
      },
      "';",
    ],
    [],
    ['export function Hero() {'],
    ['  const { t } = useTranslation();'],
    ['  return ('],
    [
      '    <h1>',
      {
        node: (
          <span className="relative">
            <input
              aria-label="h1"
              data-guide="headline"
              className={`code-input ${typing ? 'caret' : ''}`}
              value={headline}
              maxLength={48}
              onFocus={() => {
                onFocus();
                setHeadlineFocused(true);
                setCursor({ line: 8, column: headline.length + 9 });
              }}
              onBlur={() => setHeadlineFocused(false)}
              onKeyDown={(event) => {
                if (event.key === 'Tab' && ghost) {
                  event.preventDefault();
                  acceptGhost();
                } else if (event.key === 'Escape' && ghost) {
                  event.stopPropagation();
                  setDismissed(headline);
                }
              }}
              onSelect={(event) =>
                setCursor({ line: 8, column: (event.currentTarget.selectionStart ?? 0) + 9 })
              }
              onChange={(event) => onHeadline(event.target.value)}
            />
            {ghost ? (
              <button
                type="button"
                tabIndex={-1}
                data-guide="completion"
                title={acceptLabel}
                onMouseDown={(event) => event.preventDefault()}
                onClick={acceptGhost}
                className="cursor-pointer whitespace-pre text-win-muted italic"
              >
                {ghost}
                <kbd className="ml-1.5 rounded border border-win-line bg-win-raised px-1 py-px align-[1px] font-sans text-[0.625rem] text-win-text not-italic">
                  Tab
                </kbd>
              </button>
            ) : null}
            <Hotspot
              label={hints[0] ?? ''}
              visible={showHints}
              className="top-1/2 -left-[calc(6ch+0.375rem)] -translate-y-1/2"
              side="top"
            />
          </span>
        ),
      },
      '</h1>',
    ],
    ["    <p>{t('hero.sub')}</p>"],
    ['    <Button color={accent}>'],
    [
      '      ',
      {
        node: (
          <input
            aria-label="Button"
            className="code-input"
            value={cta}
            maxLength={24}
            onFocus={() => {
              onFocus();
              setCursor({ line: 11, column: cta.length + 7 });
            }}
            onSelect={(event) =>
              setCursor({ line: 11, column: (event.currentTarget.selectionStart ?? 0) + 7 })
            }
            onChange={(event) => onCta(event.target.value)}
          />
        ),
      },
    ],
    ['    </Button>'],
    ['  );'],
    ['}'],
  ];

  const markers: Record<number, 'modified'> = {};
  if (dirty.accent) markers[2] = 'modified';
  if (dirty.headline) markers[7] = 'modified';
  if (dirty.cta) markers[10] = 'modified';

  const problemLines = new Set(problems.map((problem) => problem.line - 1));
  const activeSource = active ? sources[active] : undefined;
  const lines: readonly CodeLine[] =
    active === HERO_PATH ? heroLines : (activeSource ?? '').split('\n').map((line) => [line]);

  const sidebarVisibility = view ? (sidebarRequested ? 'flex' : 'hidden xl:flex') : 'hidden';

  return (
    <Window title={title} className="h-full">
      <div className="flex h-full min-h-0 flex-col">
        <div className="relative flex min-h-0 flex-1">
          <ActivityBar view={view} changes={modified ? 1 : 0} onSelect={selectView} />

          <aside
            aria-label="Side Bar"
            className={`${sidebarVisibility} w-52 shrink-0 flex-col border-r border-win-line bg-win max-xl:absolute max-xl:inset-y-0 max-xl:left-10 max-xl:z-30 max-xl:shadow-2xl sm:max-xl:left-12`}
          >
            {view === 'explorer' ? (
              <ExplorerView
                expanded={expanded}
                activePath={active}
                modifiedPath={modifiedPath}
                onToggle={toggleFolder}
                onOpen={(path) => openFile(path)}
                onCollapseAll={() => setExpanded(new Set(['']))}
              />
            ) : view === 'search' ? (
              <Suspense fallback={null}>
                <SearchView sources={sources} onOpen={openFile} />
              </Suspense>
            ) : view === 'scm' ? (
              <Suspense fallback={null}>
                <ScmView
                  modified={modified}
                  message={commitMessage}
                  commits={commits}
                  onMessage={setCommitMessage}
                  onCommit={commit}
                  onDiscard={discard}
                  onOpen={(path) => openFile(path)}
                />
              </Suspense>
            ) : view === 'extensions' ? (
              <Suspense fallback={null}>
                <ExtensionsView />
              </Suspense>
            ) : null}
          </aside>

          <div className="relative flex min-w-0 flex-1 flex-col">
            <Callout n={1} className="top-14 right-4" />
            {!panelMaximized || !panelOpen ? (
              <>
                {tabs.length > 0 ? (
                  <EditorTabs
                    tabs={tabs}
                    active={active}
                    modifiedPath={modifiedPath}
                    onSelect={(path) => setActive(path)}
                    onClose={closeTab}
                  />
                ) : null}
                {active ? (
                  <Breadcrumbs
                    path={active}
                    {...(active === HERO_PATH ? { symbol: 'Hero' } : {})}
                    onOpen={(path) => openFile(path)}
                  />
                ) : null}
                <div className="relative flex min-h-0 flex-1 flex-col">
                  {find ? (
                    <FindWidget
                      query={find.query}
                      replacement={find.replacement}
                      count={matchCount}
                      current={matchIndex}
                      canReplace={active === HERO_PATH}
                      onQuery={(query) =>
                        setFind((current) => current && { ...current, query, index: 0 })
                      }
                      onReplacement={(replacement) =>
                        setFind((current) => current && { ...current, replacement })
                      }
                      onStep={(direction) =>
                        setFind(
                          (current) => current && { ...current, index: current.index + direction },
                        )
                      }
                      onReplaceAll={() => {
                        onFocus();
                        onHeadline(replaceAll(headline, find.query, find.replacement));
                        onCta(replaceAll(cta, find.query, find.replacement));
                      }}
                      onClose={() => {
                        setFind(null);
                        codeRef.current?.focus({ preventScroll: true });
                      }}
                    />
                  ) : null}
                  {quick !== null ? (
                    <QuickOpen
                      query={quick}
                      results={quickOpen(Object.keys(sources), quick)}
                      onQuery={setQuick}
                      onOpen={(path) => {
                        setQuick(null);
                        openFile(path);
                        codeRef.current?.focus({ preventScroll: true });
                      }}
                      onClose={() => setQuick(null)}
                    />
                  ) : null}
                  <div
                    ref={codeRef}
                    tabIndex={0}
                    onKeyDown={onEditorKey}
                    onMouseMove={onCodeMove}
                    onMouseLeave={() => setHover(null)}
                    onClick={onCodeClick}
                    onContextMenu={onCodeMenu}
                    className="relative min-h-0 flex-1 overflow-auto outline-none"
                  >
                    {hover && !menu ? <HoverCard symbol={hover.symbol} at={hover.at} /> : null}
                    {menu ? (
                      <ContextMenu at={menu.at} items={menuItems} onClose={() => setMenu(null)} />
                    ) : null}
                    {active ? (
                      <CodeBlock
                        key={active}
                        lines={lines}
                        language={languageOf(active)}
                        className="py-2 pr-4"
                        decorate={(index) => {
                          const marker = active === HERO_PATH ? markers[index] : undefined;
                          return {
                            active: index === cursor.line - 1,
                            ...(marker ? { marker } : {}),
                            ...(active === HERO_PATH && problemLines.has(index) && !marker
                              ? { marker: 'removed' as const }
                              : {}),
                          };
                        }}
                      />
                    ) : (
                      <div className="grid h-full place-items-center p-6 text-center font-sans text-[0.8125rem] text-win-muted">
                        <dl className="grid grid-cols-[auto_auto] gap-x-6 gap-y-2 text-left">
                          {[
                            ['Show All Commands', 'Ctrl + Shift + P'],
                            ['Go to File', 'Ctrl + P'],
                            ['Find in Files', 'Ctrl + Shift + F'],
                            ['Toggle Terminal', 'Ctrl + `'],
                          ].map(([label, keys]) => (
                            <div key={label} className="contents">
                              <dt className="text-right">{label}</dt>
                              <dd>
                                <kbd className="rounded border border-win-line bg-win-raised px-1.5 py-0.5 text-[0.6875rem] text-win-text">
                                  {keys}
                                </kbd>
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : null}

            {panelOpen ? (
              <div className={`relative flex min-h-0 flex-col ${panelMaximized ? 'flex-1' : ''}`}>
                <Callout n={2} className="top-2 right-24" />
                <BottomPanel
                  tab={panelTab}
                  maximized={panelMaximized}
                  problems={problems}
                  log={log}
                  gitLog={commits.map(
                    (entry) => `> git commit -m "${entry.message}"  [main ${entry.sha}]`,
                  )}
                  onTab={setPanelTab}
                  onProblem={(problem: Problem) => {
                    openFile(problem.path, problem.line);
                    setCursor({ line: problem.line, column: problem.column });
                  }}
                  onCommand={execute}
                  onClear={() => onTerminal('clear')}
                  onToggleMaximize={() => setPanelMaximized((value) => !value)}
                  onClose={() => {
                    setPanelOpen(false);
                    setPanelMaximized(false);
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>

        <StatusBar
          modified={modified}
          ahead={commits.length}
          errors={errors}
          warnings={warnings}
          line={cursor.line}
          column={cursor.column}
          language={languageLabel(active)}
          onBranch={() => {
            setSidebarRequested(true);
            setView('scm');
          }}
          onProblems={() => showPanel('problems')}
        />
      </div>
    </Window>
  );
}
