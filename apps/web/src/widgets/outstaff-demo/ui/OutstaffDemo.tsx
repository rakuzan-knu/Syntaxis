import { Fragment, useRef, useState } from 'react';
import {
  Check,
  CircleDot,
  FileCode,
  GitCommitHorizontal,
  GitMerge,
  GitPullRequest,
  LoaderCircle,
  MessageSquare,
  Plus,
  Rocket,
  Send,
} from 'lucide-react';
import { useI18n, type Dictionary } from '@/shared/i18n';
import { fillTemplate, telegramLink, useAutoplay, usePrefersReducedMotion } from '@/shared/lib';
import { ActionLink, Avatar, Callout, Hotspot, Showcase, Window } from '@/shared/ui';
import { DIFF, diffStats, type DiffKind } from '../model/diff';
import {
  INITIAL_REVIEW,
  approve,
  comment,
  merge,
  resolve,
  type ReviewState,
} from '../model/review';

type Schedule = (callback: () => void, delay: number) => void;

const REPLY_DELAY = 1800;
type Tab = 'conversation' | 'commits' | 'checks' | 'files';

const LINE_TONE: Record<DiffKind, string> = {
  hunk: 'bg-win-accent/10 text-win-muted',
  context: '',
  add: 'bg-ok/10',
  del: 'bg-bad/10',
};

const SIGN: Record<DiffKind, string> = { hunk: '', context: ' ', add: '+', del: '-' };

const CHECK_TIMES = ['18s', '42s', '1m 12s', '35s'] as const;

export function OutstaffDemo() {
  const { t } = useI18n();
  const copy = t.outstaff;
  const rootRef = useRef<HTMLDivElement>(null);
  const reduceMotion = usePrefersReducedMotion();
  const [passed, setPassed] = useState(0);
  const [review, setReview] = useState<ReviewState>(INITIAL_REVIEW);
  const [tab, setTab] = useState<Tab>('conversation');
  const [draft, setDraft] = useState<{ file: string; line: number } | null>(null);
  const [draftText, setDraftText] = useState('');

  const runChecks = (later: Schedule, delay: number) => {
    setPassed(0);
    copy.pr.checks.forEach((_, index) => {
      later(() => setPassed(index + 1), reduceMotion ? 0 : delay + index * 600);
    });
  };

  const { inView, touched, interrupt, schedule } = useAutoplay(rootRef, (later) => {
    runChecks(later, 700);
  });

  const allPassed = passed >= copy.pr.checks.length;
  const stage = review.stage;
  const merged = stage === 'merged';
  const commits = review.fixes > 0 ? [...copy.pr.commits, copy.fixCommit] : copy.pr.commits;

  const submitComment = (target: { file: string; line: number; text: string }) => {
    interrupt();
    const next = comment(review, target);
    if (next === review) return;
    setReview(next);
    setDraft(null);
    setDraftText('');
    const id = next.comments.length;
    schedule(
      () => {
        setReview((current) =>
          resolve(current, id, fillTemplate(copy.reply, { sha: copy.fixCommit.sha })),
        );
        runChecks(schedule, 300);
      },
      reduceMotion ? 0 : REPLY_DELAY,
    );
  };

  const caption = merged
    ? copy.plain.merged
    : stage === 'approved'
      ? copy.plain.approved
      : stage === 'fixing'
        ? copy.plain.fixing
        : review.fixes > 0
          ? copy.plain.fixed
          : allPassed
            ? copy.plain.ready
            : passed > 0
              ? copy.plain.checking
              : copy.plain.idle;
  const stats = diffStats(DIFF);

  const tabs: readonly { id: Tab; label: string; count: number; icon: typeof MessageSquare }[] = [
    {
      id: 'conversation',
      label: 'Conversation',
      count: 2 + review.comments.length,
      icon: MessageSquare,
    },
    { id: 'commits', label: 'Commits', count: commits.length, icon: GitCommitHorizontal },
    { id: 'checks', label: 'Checks', count: copy.pr.checks.length, icon: Check },
    { id: 'files', label: 'Files changed', count: DIFF.length, icon: FileCode },
  ];

  const checkList = (
    <ul className="divide-y divide-win-line">
      {copy.pr.checks.map((check, index) => {
        const done = index < passed;
        const running = index === passed && inView;
        return (
          <li key={check} className="flex items-center gap-3 px-4 py-2 text-[0.8125rem]">
            {done ? (
              <Check aria-hidden="true" className="size-4 text-ok" />
            ) : running ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-[spin_0.8s_linear_infinite] text-warn"
              />
            ) : (
              <CircleDot aria-hidden="true" className="size-4 text-win-muted" />
            )}
            <span className={done ? 'text-win-text' : 'text-win-muted'}>{check}</span>
            <span className="ml-auto font-mono text-[0.6875rem] text-win-muted">
              {done ? CHECK_TIMES[index] : running ? 'In progress' : 'Queued'}
            </span>
          </li>
        );
      })}
    </ul>
  );

  const footer = (
    <div className="mt-10 grid gap-8 md:grid-cols-[repeat(3,minmax(0,1fr))_auto] md:items-end">
      {copy.points.map((point) => (
        <div key={point.title} className="border-l-2 border-accent pl-4">
          <p className="font-semibold">{point.title}</p>
          <p className="mt-1 text-step--1 text-muted">{point.text}</p>
        </div>
      ))}
      <ActionLink
        href={telegramLink(copy.message)}
        target="_blank"
        rel="noopener noreferrer"
        icon={<Send aria-hidden="true" className="size-4" />}
      >
        {copy.cta}
      </ActionLink>
    </div>
  );

  return (
    <Showcase
      id="outstaff"
      title={copy.title}
      lead={copy.lead}
      benefit={copy.benefit}
      callouts={copy.callouts}
      footer={footer}
      caption={caption}
      glossary={copy.glossary}
    >
      <div ref={rootRef} className="relative">
        <div className="lg:mr-[14%]">
          <Window title={copy.window} tone="light">
            <div className="px-5 pt-5">
              <h3 className="text-step-1 font-semibold">
                {copy.pr.title} <span className="font-normal text-win-muted">{copy.pr.number}</span>
              </h3>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-[0.8125rem] text-win-muted">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.75rem] font-medium text-white ${merged ? 'bg-[#8250df]' : 'bg-ok'}`}
                >
                  {merged ? (
                    <GitMerge aria-hidden="true" className="size-3.5" />
                  ) : (
                    <GitPullRequest aria-hidden="true" className="size-3.5" />
                  )}
                  {merged ? 'Merged' : 'Open'}
                </span>
                <span className="font-medium text-win-text">{copy.pr.author}</span>
                <span>
                  {merged ? 'merged' : 'wants to merge'} {commits.length} commits into
                </span>
                <code className="rounded bg-win-accent/10 px-1.5 text-[0.75rem] text-win-accent">
                  main
                </code>
                from
                <code className="rounded bg-win-accent/10 px-1.5 text-[0.75rem] text-win-accent">
                  feat/monobank-pay
                </code>
              </p>
            </div>

            <div
              role="tablist"
              aria-label={copy.window}
              className="mt-4 flex gap-1 overflow-x-auto border-b border-win-line px-4"
            >
              {tabs.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === item.id}
                    onClick={() => setTab(item.id)}
                    className={`relative -mb-px inline-flex shrink-0 cursor-pointer items-center gap-1.5 border-b-2 px-3 py-2 text-[0.8125rem] ${tab === item.id ? 'border-[#fd8c73] text-win-text' : 'border-transparent text-win-muted hover:text-win-text'}`}
                  >
                    <Icon aria-hidden="true" className="size-4" />
                    {item.label}
                    <span className="rounded-full bg-win-raised px-1.5 text-[0.6875rem]">
                      {item.count}
                    </span>
                    {item.id === 'files' ? (
                      <Hotspot
                        label={copy.hints[1] ?? ''}
                        visible={
                          touched &&
                          allPassed &&
                          stage === 'open' &&
                          review.comments.length === 0 &&
                          tab !== 'files'
                        }
                        className="top-1/2 right-1 -mt-1.5"
                        side="right"
                      />
                    ) : null}
                  </button>
                );
              })}
              <span className="ml-auto hidden shrink-0 items-center gap-1 px-2 font-mono text-[0.75rem] md:flex">
                <span className="text-ok">+{stats.additions}</span>
                <span className="text-bad">−{stats.deletions}</span>
              </span>
            </div>

            <div className="min-h-[24rem] p-5">
              {tab === 'conversation' ? (
                <div className="flex flex-col gap-4">
                  <div className="relative flex gap-3">
                    <Callout n={1} className="-top-2 right-2" />
                    <Avatar name={copy.pr.author} />
                    <div className="min-w-0 flex-1 overflow-hidden rounded-lg border border-win-line">
                      <p className="border-b border-win-line bg-win-raised px-3 py-2 text-[0.75rem] text-win-muted">
                        <span className="font-medium text-win-text">{copy.pr.author}</span>{' '}
                        commented
                      </p>
                      <p className="px-3 py-3 text-[0.8125rem]">{copy.pr.description}</p>
                    </div>
                  </div>
                  <ul className="ml-4 border-l-2 border-win-line pl-6 text-[0.75rem]">
                    {commits.map((commit) => (
                      <li key={commit.sha} className="flex items-center gap-2 py-1">
                        <GitCommitHorizontal
                          aria-hidden="true"
                          className="-ml-[2.15rem] size-4 rounded-full bg-win text-win-muted"
                        />
                        <span className="min-w-0 truncate text-win-text">{commit.message}</span>
                        <code className="ml-auto shrink-0 text-win-muted">{commit.sha}</code>
                      </li>
                    ))}
                  </ul>
                  {review.comments.map((item) => (
                    <Thread key={item.id} item={item} copy={copy} />
                  ))}
                  {stage === 'approved' || merged ? (
                    <div className="ink-in flex gap-3">
                      <Avatar name={copy.pr.review.author} />
                      <div className="min-w-0 flex-1 overflow-hidden rounded-lg border border-ok/40">
                        <p className="flex items-center gap-1.5 border-b border-ok/30 bg-ok/10 px-3 py-2 text-[0.75rem] text-win-text">
                          <Check aria-hidden="true" className="size-3.5 text-ok" />
                          <span className="font-medium">{copy.pr.review.author}</span> approved
                          these changes
                        </p>
                        <p className="px-3 py-3 text-[0.8125rem]">{copy.pr.review.text}</p>
                      </div>
                    </div>
                  ) : null}

                  <div className="relative overflow-hidden rounded-lg border border-win-line">
                    <Callout n={2} className="top-2 right-2" />
                    <p
                      className={`flex items-center gap-2 border-b border-win-line px-4 py-3 text-[0.8125rem] font-semibold ${allPassed ? 'text-ok' : 'text-warn'}`}
                    >
                      {allPassed ? (
                        <Check aria-hidden="true" className="size-4" />
                      ) : (
                        <LoaderCircle
                          aria-hidden="true"
                          className="size-4 animate-[spin_0.8s_linear_infinite]"
                        />
                      )}
                      {allPassed ? copy.checksPassed : 'Some checks haven’t completed yet'}
                    </p>
                    {checkList}
                    <div
                      aria-live="polite"
                      className="relative flex flex-wrap items-center gap-3 border-t border-win-line bg-win-raised px-4 py-3"
                    >
                      <Callout n={3} className="-top-3 left-3" />
                      {merged ? (
                        <>
                          <p className="ink-in inline-flex items-center gap-2 text-[0.8125rem] font-medium text-[#8250df]">
                            <GitMerge aria-hidden="true" className="size-4" />
                            {copy.merged}
                          </p>
                          <p className="ink-in inline-flex items-center gap-2 text-[0.8125rem] text-win-muted">
                            <Rocket aria-hidden="true" className="size-4 text-win-accent" />
                            {copy.deploying}
                          </p>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={stage !== 'open'}
                            onClick={() => {
                              interrupt();
                              setReview(approve);
                            }}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-win-line bg-win px-3 py-1.5 text-[0.8125rem] font-medium hover:bg-win-raised disabled:cursor-default disabled:text-ok"
                          >
                            <Check aria-hidden="true" className="size-4" />
                            {copy.approve}
                          </button>
                          <button
                            type="button"
                            disabled={!allPassed || stage !== 'approved'}
                            onClick={() => setReview((current) => merge(current, allPassed))}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-ok px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            <GitMerge aria-hidden="true" className="size-4" />
                            {copy.merge}
                          </button>
                          <button
                            type="button"
                            disabled={stage !== 'open'}
                            onClick={() =>
                              submitComment({
                                file: DIFF[0]?.path ?? '',
                                line: 14,
                                text: copy.changesText,
                              })
                            }
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-[0.8125rem] font-medium text-win-muted hover:text-win-text disabled:cursor-default disabled:opacity-45"
                          >
                            <MessageSquare aria-hidden="true" className="size-4" />
                            {copy.requestChanges}
                          </button>
                          <Hotspot
                            label={copy.hints[0] ?? ''}
                            visible={!touched && allPassed}
                            className="top-0 left-16"
                            side="top"
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : tab === 'commits' ? (
                <ul className="overflow-hidden rounded-lg border border-win-line">
                  {commits.map((commit) => (
                    <li
                      key={commit.sha}
                      className="flex items-center gap-3 border-b border-win-line px-4 py-3 last:border-b-0"
                    >
                      <Avatar name={copy.pr.author} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.8125rem] font-medium">
                          {commit.message}
                        </span>
                        <span className="text-[0.6875rem] text-win-muted">
                          {copy.pr.author} · {commit.time}
                        </span>
                      </span>
                      <code className="rounded border border-win-line px-1.5 py-0.5 text-[0.6875rem] text-win-muted">
                        {commit.sha}
                      </code>
                    </li>
                  ))}
                </ul>
              ) : tab === 'checks' ? (
                <div className="overflow-hidden rounded-lg border border-win-line">{checkList}</div>
              ) : (
                <div className="flex flex-col gap-4">
                  {DIFF.map((file) => (
                    <div
                      key={file.path}
                      className="overflow-hidden rounded-lg border border-win-line"
                    >
                      <p className="border-b border-win-line bg-win-raised px-3 py-2 font-mono text-[0.75rem] text-win-text">
                        {file.path}
                      </p>
                      <div className="overflow-x-auto font-mono text-[0.75rem] leading-[1.7]">
                        <table className="w-full min-w-max border-collapse">
                          <tbody>
                            {file.lines.map((line, index) => {
                              const lineNumber = line.newNumber;
                              const open =
                                draft !== null &&
                                draft.file === file.path &&
                                draft.line === lineNumber;
                              const thread = review.comments.filter(
                                (item) => item.file === file.path && item.line === lineNumber,
                              );
                              return (
                                <Fragment key={index}>
                                  <tr className={`group ${LINE_TONE[line.kind]}`}>
                                    <td className="w-7 pl-1 select-none">
                                      {lineNumber !== undefined && !merged ? (
                                        <button
                                          type="button"
                                          aria-label={fillTemplate(copy.commentLine, {
                                            line: String(lineNumber),
                                          })}
                                          onClick={() => {
                                            interrupt();
                                            setDraft({ file: file.path, line: lineNumber });
                                          }}
                                          className="grid size-5 cursor-pointer place-items-center rounded bg-win-accent text-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-60"
                                        >
                                          <Plus aria-hidden="true" className="size-3" />
                                        </button>
                                      ) : null}
                                    </td>
                                    <td className="w-10 px-2 text-right text-win-muted/80 select-none">
                                      {line.oldNumber ?? ''}
                                    </td>
                                    <td className="w-10 px-2 text-right text-win-muted/80 select-none">
                                      {line.newNumber ?? ''}
                                    </td>
                                    <td
                                      className={`w-4 select-none ${line.kind === 'add' ? 'text-ok' : line.kind === 'del' ? 'text-bad' : ''}`}
                                    >
                                      {SIGN[line.kind]}
                                    </td>
                                    <td className="pr-4 whitespace-pre">{line.text}</td>
                                  </tr>
                                  {thread.length > 0 || open ? (
                                    <tr>
                                      <td
                                        colSpan={5}
                                        className="bg-win-raised/60 px-4 py-3 font-sans"
                                      >
                                        <div className="flex max-w-[40rem] flex-col gap-3">
                                          {thread.map((item) => (
                                            <Thread key={item.id} item={item} copy={copy} />
                                          ))}
                                          {open ? (
                                            <form
                                              onSubmit={(event) => {
                                                event.preventDefault();
                                                submitComment({
                                                  file: file.path,
                                                  line: lineNumber ?? 0,
                                                  text: draftText,
                                                });
                                              }}
                                              className="flex flex-col gap-2 rounded-lg border border-win-line bg-win p-3"
                                            >
                                              <div className="flex flex-wrap gap-1.5">
                                                {copy.suggestions.map((suggestion) => (
                                                  <button
                                                    key={suggestion}
                                                    type="button"
                                                    onClick={() => setDraftText(suggestion)}
                                                    className="cursor-pointer rounded-full border border-win-line px-2.5 py-1 text-[0.75rem] text-win-muted hover:border-win-accent hover:text-win-text"
                                                  >
                                                    {suggestion}
                                                  </button>
                                                ))}
                                              </div>
                                              <textarea
                                                value={draftText}
                                                onChange={(event) =>
                                                  setDraftText(event.target.value)
                                                }
                                                placeholder={copy.commentPlaceholder}
                                                aria-label={copy.commentPlaceholder}
                                                rows={2}
                                                className="w-full resize-none rounded-md border border-win-line bg-win px-2.5 py-2 text-[0.8125rem] text-win-text outline-none focus:border-win-accent"
                                              />
                                              <div className="flex justify-end gap-2">
                                                <button
                                                  type="button"
                                                  onClick={() => setDraft(null)}
                                                  className="cursor-pointer rounded-md px-3 py-1.5 text-[0.75rem] text-win-muted hover:text-win-text"
                                                >
                                                  {copy.cancel}
                                                </button>
                                                <button
                                                  type="submit"
                                                  disabled={draftText.trim() === ''}
                                                  className="cursor-pointer rounded-md bg-ok px-3 py-1.5 text-[0.75rem] font-medium text-white disabled:cursor-not-allowed disabled:opacity-45"
                                                >
                                                  {copy.commentButton}
                                                </button>
                                              </div>
                                            </form>
                                          ) : null}
                                        </div>
                                      </td>
                                    </tr>
                                  ) : null}
                                </Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Window>
        </div>

        <div
          aria-live="polite"
          className={`absolute inset-x-3 top-3 z-10 transition-[opacity,translate] duration-700 ease-[var(--ease-out)] sm:inset-x-auto sm:right-3 sm:w-[22rem] lg:top-6 lg:right-0 ${allPassed ? 'opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'}`}
        >
          <div className="window flex items-start gap-3 p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#2aabee] text-white">
              <Send aria-hidden="true" className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="flex items-center justify-between gap-3 text-[0.75rem] text-win-muted">
                <span className="font-semibold text-win-text">Telegram</span>
                now
              </p>
              <p className="mt-1 text-[0.8125rem] text-win-text/90">{copy.pr.notification}</p>
            </div>
          </div>
        </div>
      </div>
    </Showcase>
  );
}

function Thread({
  item,
  copy,
}: {
  item: ReviewState['comments'][number];
  copy: Dictionary['outstaff'];
}) {
  return (
    <div className="ink-in flex flex-col gap-2 text-[0.8125rem]">
      <div className="flex gap-2.5">
        <Avatar name={copy.pr.review.author} size="sm" />
        <div className="min-w-0 flex-1 rounded-lg border border-win-line bg-win px-3 py-2">
          <p className="text-[0.6875rem] text-win-muted">
            <span className="font-medium text-win-text">{copy.you}</span> ·{' '}
            {fillTemplate(copy.commentLine, { line: String(item.line) })}
          </p>
          <p className="mt-1">{item.text}</p>
        </div>
      </div>
      {item.reply ? (
        <div className="ink-in ml-8 flex gap-2.5">
          <Avatar name={copy.pr.author} size="sm" />
          <div className="min-w-0 flex-1 rounded-lg border border-ok/40 bg-ok/5 px-3 py-2">
            <p className="text-[0.6875rem] font-medium text-win-text">{copy.pr.author}</p>
            <p className="mt-1">{item.reply}</p>
          </div>
        </div>
      ) : (
        <p className="ml-8 flex items-center gap-2 text-[0.75rem] text-win-muted">
          <LoaderCircle
            aria-hidden="true"
            className="size-3.5 animate-[spin_0.8s_linear_infinite]"
          />
          {copy.pr.author}…
        </p>
      )}
    </div>
  );
}
