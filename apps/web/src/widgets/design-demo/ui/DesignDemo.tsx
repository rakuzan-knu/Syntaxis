import { Suspense, lazy, useCallback, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronDown, Hand, MessageCircle, MousePointer2, Play, Redo2, Undo2 } from 'lucide-react';
import { useI18n } from '@/shared/i18n';
import { useAutoplay, useDemoCommands } from '@/shared/lib';
import {
  Avatar,
  Callout,
  CodeBlock,
  DemoPlayer,
  DesktopWindow,
  GuideCursor,
  Hotspot,
  Showcase,
  Window,
} from '@/shared/ui';
import { fontCss, paddingPx } from '../model/css';
import { modeCss } from '../model/variables';
import { subscriptionSvg } from '../model/svg';
import {
  ACCENTS,
  createDoc,
  nameOf,
  nodeById,
  rename,
  styleOf,
  toggleHidden,
  toggleLocked,
  updateNode,
  type DesignDoc,
  type NodeStyle,
  type PageId,
} from '../model/document';
import { commit, createUndo, redo, undo, type UndoHistory } from '../model/history';
import { Canvas, type Tool } from './Canvas';
import { Comments, type CommentPin } from './Comments';
import { PageFrame } from './Frames';
import { Inspector } from './Inspector';
import { LayersPanel } from './LayersPanel';

const SidePanels = lazy(() => import('./SidePanels'));
const PresentMode = lazy(() => import('./PresentMode'));

type Panel = 'layers' | 'design' | 'prototype' | 'inspect';

const FRAME_OF: Record<PageId, string> = { subscribe: 'card', checkout: 'checkout' };
const CHAPTERS = [0, 3000, 8800] as const;

export function DesignDemo() {
  const { t } = useI18n();
  const copy = t.design;
  const figma = copy.figma;
  const rootRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<UndoHistory<DesignDoc>>(() =>
    createUndo(createDoc(ACCENTS[0])),
  );
  const [page, setPage] = useState<PageId>('subscribe');
  const [selected, setSelected] = useState<string | null>('card');
  const [editing, setEditing] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>('move');
  const [pins, setPins] = useState<readonly CommentPin[]>([]);
  const [draftPin, setDraftPin] = useState<{ x: number; y: number } | null>(null);
  const [panel, setPanel] = useState<Panel>('design');
  const [presenting, setPresenting] = useState(false);
  const doc = history.present;

  const reset = () => {
    setHistory(createUndo(createDoc(ACCENTS[0])));
    setPage('subscribe');
    setSelected('card');
    setEditing(null);
    setTool('move');
    setPanel('design');
    setPresenting(false);
    setPins([]);
    setDraftPin(null);
  };

  const { touched, interrupt, player, schedule } = useAutoplay(
    rootRef,
    (later) => {
      later(() => undefined, 700, { target: '[data-node="title"]', press: true });
      later(() => undefined, 1900, { target: '[data-node="primary"]', press: true });
      later(() => undefined, CHAPTERS[1] ?? 0, {
        target: `[data-guide="swatch-${ACCENTS[1].toLowerCase()}"]`,
        press: true,
      });
      later(() => undefined, (CHAPTERS[1] ?? 0) + 1300, {
        target: '[data-guide="slider"]',
        value: '22',
        click: true,
      });
      later(() => undefined, (CHAPTERS[1] ?? 0) + 2600, {
        target: '[data-guide="undo"]',
        press: true,
      });
      later(() => undefined, (CHAPTERS[1] ?? 0) + 3500, {
        target: '[data-guide="redo"]',
        press: true,
      });
      later(() => undefined, (CHAPTERS[1] ?? 0) + 4400, {
        target: '[data-node="card"]',
        press: true,
      });
      later(() => undefined, (CHAPTERS[1] ?? 0) + 5200, {
        target: '[data-guide="mode-dark"]',
        press: true,
      });
      later(() => undefined, CHAPTERS[2] ?? 0, { target: '[data-guide="present"]', press: true });
      later(() => undefined, (CHAPTERS[2] ?? 0) + 1600, {
        target: '[data-present="primary"]',
        press: true,
      });
      later(() => undefined, (CHAPTERS[2] ?? 0) + 3300, {
        target: '[data-present="back"]',
        press: true,
      });
      later(() => undefined, (CHAPTERS[2] ?? 0) + 4800, {
        target: '[data-guide="close-present"]',
        press: true,
      });
    },
    { reset, chapters: CHAPTERS },
  );

  useDemoCommands('design', player);

  const takeOver = () => {
    if (touched) return;
    interrupt();
  };

  const change = (next: DesignDoc, key?: string) => {
    takeOver();
    setHistory((current) => commit(current, next, key ?? null));
  };

  const updateDoc = (apply: (current: DesignDoc) => DesignDoc, key?: string) => {
    takeOver();
    setHistory((current) => commit(current, apply(current.present), key ?? null));
  };

  const select = (id: string | null) => {
    takeOver();
    setSelected(id);
    if (id === null) setEditing(null);
  };

  const goToPage = (next: PageId) => {
    takeOver();
    setPage(next);
    setSelected(FRAME_OF[next]);
    setEditing(null);
  };

  const step = (direction: 'undo' | 'redo') => {
    takeOver();
    setEditing(null);
    setHistory((current) => (direction === 'undo' ? undo(current) : redo(current)));
  };

  const present = () => {
    takeOver();
    setEditing(null);
    setPresenting(true);
  };

  const closePresent = useCallback(() => setPresenting(false), []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLInputElement || presenting) return;
    const key = event.key.toLowerCase();
    const mod = event.ctrlKey || event.metaKey;
    if (mod && key === 'z') {
      event.preventDefault();
      step(event.shiftKey ? 'redo' : 'undo');
    } else if (mod && key === 'y') {
      event.preventDefault();
      step('redo');
    } else if (!mod && key === 'v') {
      setTool('move');
    } else if (!mod && key === 'h') {
      setTool('hand');
    } else if (!mod && key === 'c') {
      setTool('comment');
    } else if (key === 'escape') {
      select(null);
    }
  };

  const onNode = (id: string, patch: NodeStyle, key?: string) =>
    updateDoc((current) => updateNode(current, id, patch), key);

  const addComment = (text: string) => {
    if (!draftPin) return;
    const id = pins.length + 1;
    setPins((current) => [...current, { id, page, ...draftPin, text, reply: null }]);
    setDraftPin(null);
    schedule(() => {
      setPins((current) =>
        current.map((pin) => (pin.id === id ? { ...pin, reply: figma.comments.reply } : pin)),
      );
    }, 1600);
  };

  const exportSvg = () => {
    const svg = subscriptionSvg(doc, {
      title: copy.kit.title,
      badge: copy.kit.badge,
      text: copy.kit.text,
      primary: copy.kit.primary,
      secondary: copy.kit.secondary,
    });
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'zerno-subscription.svg';
    link.click();
    URL.revokeObjectURL(url);
  };

  const selectedNode = selected ? nodeById(selected) : undefined;
  const space = paddingPx(styleOf(doc, 'card').padding) / 16;
  const panels: readonly { id: Panel; label: string; className?: string }[] = [
    { id: 'layers', label: figma.panels.layers, className: 'xl:hidden' },
    { id: 'design', label: figma.panels.design },
    { id: 'prototype', label: figma.panels.prototype },
    { id: 'inspect', label: figma.panels.inspect },
  ];

  const inspector = (
    <Inspector
      copy={copy}
      doc={doc}
      selected={selected}
      onNode={onNode}
      onAccent={(accent) => change({ ...doc, accent })}
      onFont={(font) => change({ ...doc, font })}
      onMode={(mode) => change({ ...doc, mode })}
    />
  );

  const layers = (
    <LayersPanel
      copy={figma}
      doc={doc}
      page={page}
      selected={selected}
      onPage={goToPage}
      onSelect={(id) => select(id)}
      onToggleHidden={(id) => updateDoc((current) => toggleHidden(current, id))}
      onToggleLocked={(id) => updateDoc((current) => toggleLocked(current, id))}
      onRename={(id, name) => updateDoc((current) => rename(current, id, name))}
    />
  );

  return (
    <Showcase
      id="design"
      title={copy.title}
      lead={copy.lead}
      benefit={copy.benefit}
      callouts={copy.callouts}
      glossary={copy.glossary}
      player={<DemoPlayer player={player} labels={copy.chapters} />}
    >
      <div ref={rootRef} onKeyDown={onKeyDown} className="relative lg:h-full">
        <GuideCursor cursor={player.cursor} name={t.ui.player.guide} />
        <DesktopWindow id="main" title={copy.window} className="lg:h-full">
          <Window title={copy.window} tone="light" className="h-full">
            <div className="relative flex h-full flex-col">
              <div className="flex h-11 shrink-0 items-center gap-0.5 border-b border-win-line px-2 text-win-muted sm:px-3">
                {(
                  [
                    ['move', MousePointer2, figma.tools.move],
                    ['hand', Hand, figma.tools.hand],
                    ['comment', MessageCircle, figma.tools.comment],
                  ] as const
                ).map(([id, Icon, label]) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={tool === id}
                    aria-label={label}
                    title={label}
                    onClick={() => {
                      takeOver();
                      setTool(id);
                    }}
                    className={`grid size-8 cursor-pointer place-items-center rounded-md ${tool === id ? 'bg-win-accent text-white' : 'hover:bg-win-raised hover:text-win-text'}`}
                  >
                    <Icon aria-hidden="true" className="size-4" />
                  </button>
                ))}
                <span aria-hidden="true" className="mx-1 h-5 w-px bg-win-line" />
                {(
                  [
                    ['undo', Undo2, figma.tools.undo, history.past.length > 0],
                    ['redo', Redo2, figma.tools.redo, history.future.length > 0],
                  ] as const
                ).map(([id, Icon, label, enabled]) => (
                  <button
                    key={id}
                    type="button"
                    aria-label={label}
                    title={label}
                    disabled={!enabled}
                    data-guide={id}
                    onClick={() => step(id)}
                    className="grid size-8 cursor-pointer place-items-center rounded-md hover:bg-win-raised hover:text-win-text disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent"
                  >
                    <Icon aria-hidden="true" className="size-4" />
                  </button>
                ))}
                <span className="mx-auto hidden items-center gap-1 text-[0.8125rem] text-win-text md:flex">
                  <span className="text-win-muted">Zerno /</span> {figma.pageNames[page]}
                  <ChevronDown aria-hidden="true" className="size-3.5" />
                </span>
                <span className="relative ml-auto flex items-center gap-2 md:ml-0">
                  <Hotspot
                    label={copy.hints[1] ?? ''}
                    visible={!touched}
                    side="left"
                    className="top-1/2 -left-5 -mt-1.5"
                  />
                  <span className="hidden -space-x-1.5 sm:flex">
                    <Avatar name="Oleh K" size="sm" />
                    <Avatar name="Mykhailo A" size="sm" />
                  </span>
                  <span className="relative">
                    <button
                      type="button"
                      data-guide="present"
                      onClick={present}
                      aria-label={figma.present}
                      title={figma.present}
                      className="grid size-8 cursor-pointer place-items-center rounded-md text-win-text hover:bg-win-raised"
                    >
                      <Play aria-hidden="true" className="size-4 fill-current" />
                    </button>
                  </span>
                  <span className="rounded-md bg-win-accent px-3 py-1 text-[0.75rem] font-medium text-white">
                    Share
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_16rem] lg:min-h-0 lg:flex-1 lg:grid-rows-[minmax(0,1fr)] xl:grid-cols-[13rem_minmax(0,1fr)_16rem]">
                <div className="scroll-area relative hidden border-r border-win-line xl:block">
                  <Callout n={1} className="top-3 right-3" />
                  {layers}
                </div>

                <div className="relative flex min-w-0 flex-col lg:min-h-0">
                  <Callout n={2} className="top-3 left-3 z-30" />
                  <Canvas
                    key={page}
                    copy={figma}
                    tool={tool}
                    label={nameOf(doc, FRAME_OF[page])}
                    onBackground={() => select(null)}
                    onPlace={(x, y) => {
                      takeOver();
                      setDraftPin({ x, y });
                    }}
                    overlay={(scale) => (
                      <Comments
                        copy={figma.comments}
                        pins={pins.filter((pin) => pin.page === page)}
                        draft={draftPin}
                        scale={scale}
                        onSubmit={addComment}
                        onCancel={() => setDraftPin(null)}
                      />
                    )}
                  >
                    <div className="relative">
                      <PageFrame
                        page={page}
                        doc={doc}
                        copy={copy}
                        mode="edit"
                        selected={selected}
                        editing={editing}
                        onSelect={select}
                        onEdit={setEditing}
                        onText={(id, text) => onNode(id, { text })}
                        onResize={(id, width) => onNode(id, { width }, `${id}:width`)}
                      />
                      {page === 'subscribe' ? (
                        <Hotspot
                          label={copy.hints[0] ?? ''}
                          visible={!touched}
                          side="left"
                          className="-top-5 right-8"
                        />
                      ) : null}
                    </div>
                  </Canvas>
                  <div className="scroll-area shrink-0 border-t border-win-line bg-win-raised lg:max-h-[38%]">
                    <p className="px-4 pt-2.5 text-[0.6875rem] font-semibold text-win-muted">
                      Dev Mode · CSS
                    </p>
                    <CodeBlock
                      language="tsx"
                      numbered={false}
                      className="px-4 pt-1 pb-3"
                      lines={[
                        [':root {'],
                        [`  --accent: ${doc.accent};`],
                        [`  --radius: ${styleOf(doc, 'card').radius ?? 0}px;`],
                        [`  --space: ${space}rem;`],
                        [`  --font: ${fontCss(doc.font)};`],
                        ...modeCss(doc.mode).map((line) => [line]),
                        ['}'],
                      ]}
                    />
                  </div>
                </div>

                <div className="relative flex flex-col border-t border-win-line md:border-t-0 md:border-l lg:min-h-0">
                  <Callout n={3} className="top-3 right-3" />
                  <div
                    role="tablist"
                    aria-label={figma.panels.design}
                    className="flex shrink-0 gap-1 border-b border-win-line px-2 text-[0.75rem]"
                  >
                    {panels.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        role="tab"
                        aria-selected={panel === item.id}
                        onClick={() => {
                          takeOver();
                          setPanel(item.id);
                        }}
                        className={`relative cursor-pointer px-2 py-2.5 ${panel === item.id ? 'font-semibold text-win-text' : 'text-win-muted hover:text-win-text'} ${item.className ?? ''} ${item.id === 'design' && panel === 'layers' ? 'xl:font-semibold xl:text-win-text' : ''}`}
                      >
                        {item.label}
                        {item.id === 'prototype' ? (
                          <Callout n={4} className="-top-1 -right-2" />
                        ) : null}
                      </button>
                    ))}
                  </div>
                  {selectedNode ? (
                    <p className="shrink-0 truncate border-b border-win-line px-4 py-2 text-[0.6875rem] text-win-muted">
                      {nameOf(doc, selectedNode.id)}
                    </p>
                  ) : null}
                  <div
                    role="tabpanel"
                    className="scroll-area max-h-[30rem] lg:max-h-none lg:min-h-0 lg:flex-1"
                  >
                    {panel === 'layers' ? (
                      <>
                        <div className="xl:hidden">{layers}</div>
                        <div className="hidden xl:block">{inspector}</div>
                      </>
                    ) : panel === 'design' ? (
                      inspector
                    ) : (
                      <Suspense fallback={<div className="h-32" />}>
                        <SidePanels
                          panel={panel}
                          copy={figma}
                          doc={doc}
                          selected={selected}
                          onSelect={(id, target) => {
                            if (target !== page) goToPage(target);
                            select(id);
                          }}
                          onPresent={present}
                          onExport={page === 'subscribe' ? exportSvg : null}
                        />
                      </Suspense>
                    )}
                  </div>
                </div>
              </div>

              {presenting ? (
                <Suspense fallback={null}>
                  <PresentMode copy={copy} doc={doc} start={page} onClose={closePresent} />
                </Suspense>
              ) : null}
            </div>
          </Window>
        </DesktopWindow>
      </div>
    </Showcase>
  );
}
