import { Fragment, useState, type ReactNode } from 'react';
import { Check, CheckCheck, ChevronDown, Copy, Paperclip, Send, Smile } from 'lucide-react';
import { useI18n, type Choice } from '@/shared/i18n';
import {
  parseTemplate,
  telegramLink,
  useCopyToClipboard,
  usePrefersReducedMotion,
  useTimers,
} from '@/shared/lib';
import { Hotspot, LogoMark, Window } from '@/shared/ui';
import {
  composeBrief,
  defaultSelection,
  toggleFocus,
  type BriefSelection,
} from '../model/composeBrief';

interface InlineSelectProps {
  label: string;
  value: string;
  choices: readonly Choice[];
  onChange: (value: string) => void;
}

const TYPING_MS = 900;

function InlineSelect({ label, value, choices, onChange }: InlineSelectProps) {
  return (
    <span className="relative inline-flex items-baseline">
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="cursor-pointer appearance-none rounded-md bg-win-accent/10 py-0.5 pr-7 pl-2 font-medium text-win-accent [field-sizing:content] hover:bg-win-accent/15"
      >
        {choices.map((choice) => (
          <option key={choice.value} value={choice.value} className="bg-win text-win-text">
            {choice.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-win-accent"
      />
    </span>
  );
}

export function BriefComposer() {
  const { t, locale } = useI18n();
  const copy = t.brief;
  const [selection, setSelection] = useState<BriefSelection>(() => defaultSelection(copy));
  const { copied, copy: copyText } = useCopyToClipboard();
  const [typing, setTyping] = useState(false);
  const [changed, setChanged] = useState(false);
  const reduceMotion = usePrefersReducedMotion();
  const timers = useTimers();
  const message = composeBrief(selection, copy, locale);
  const reply = copy.replies[selection.project] ?? '';

  const respond = () => {
    setChanged(true);
    timers.clear();
    if (reduceMotion) return;
    setTyping(true);
    timers.schedule(() => setTyping(false), TYPING_MS);
  };

  const update = (patch: Partial<BriefSelection>) => {
    setSelection((current) => ({ ...current, ...patch }));
    respond();
  };

  const slots: Record<string, ReactNode> = {
    project: (
      <InlineSelect
        label={copy.projectLabel}
        value={selection.project}
        choices={copy.projects}
        onChange={(project) => update({ project })}
      />
    ),
    focus: (
      <span
        role="group"
        aria-label={copy.focusLabel}
        className="inline-flex flex-wrap gap-1.5 align-middle"
      >
        {copy.focuses.map((choice) => {
          const pressed = selection.focuses.includes(choice.value);
          return (
            <button
              key={choice.value}
              type="button"
              aria-pressed={pressed}
              onClick={() => {
                setSelection((current) => toggleFocus(current, choice.value));
                respond();
              }}
              className={`cursor-pointer rounded-md px-2 py-0.5 text-step--1 font-medium transition-colors ${pressed ? 'bg-win-accent text-white' : 'bg-win-raised text-win-muted hover:text-win-text'}`}
            >
              {choice.label}
            </button>
          );
        })}
      </span>
    ),
    timeline: (
      <InlineSelect
        label={copy.timelineLabel}
        value={selection.timeline}
        choices={copy.timelines}
        onChange={(timeline) => update({ timeline })}
      />
    ),
    budget: (
      <InlineSelect
        label={copy.budgetLabel}
        value={selection.budget}
        choices={copy.budgets}
        onChange={(budget) => update({ budget })}
      />
    ),
  };

  const templates = [copy.projectTemplate, copy.focusTemplate, copy.detailsTemplate];

  return (
    <Window title={copy.window} tone="light">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="border-b border-win-line p-6 sm:p-8 lg:border-r lg:border-b-0">
          <p className="text-[0.75rem] font-semibold text-win-muted">{copy.builderLabel}</p>
          <div className="mt-4 space-y-4 text-step-1 leading-[2]">
            {templates.map((template, step) => (
              <div key={template} className="relative">
                <p className="text-[0.75rem] leading-normal font-semibold text-win-muted">
                  {step + 1}. {copy.steps[step]}
                </p>
                <p>
                  {parseTemplate(template).map((token, index) => (
                    <Fragment key={index}>
                      {token.kind === 'text' ? token.value : slots[token.name]}
                    </Fragment>
                  ))}
                </p>
                {step === 0 ? (
                  <Hotspot
                    label={copy.hints[0] ?? ''}
                    visible={!changed}
                    className="top-12 right-4"
                    side="bottom"
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="flex min-h-[26rem] flex-col">
          <div className="flex items-center gap-3 border-b border-win-line px-4 py-3">
            <LogoMark className="size-9" />
            <div className="min-w-0">
              <p className="text-[0.875rem] font-semibold">Syntaxis</p>
              <p className="truncate text-[0.75rem] text-win-muted">{copy.online}</p>
            </div>
          </div>
          <div className="flex flex-1 flex-col justify-end gap-3 bg-[#dfe7d3] bg-[radial-gradient(circle_at_20%_20%,rgb(255_255_255/0.35)_0,transparent_40%),radial-gradient(circle_at_80%_60%,rgb(255_255_255/0.25)_0,transparent_45%)] p-4">
            <p className="max-w-[85%] self-start rounded-2xl rounded-bl-sm bg-white px-3.5 py-2 text-[0.875rem] text-[#1b1f27] shadow-sm">
              {copy.greeting}
              <span className="ml-2 align-bottom text-[0.6875rem] text-[#8a919c]">10:24</span>
            </p>
            <p id="brief-preview-label" className="sr-only">
              {copy.previewLabel}
            </p>
            <output
              key={message}
              aria-labelledby="brief-preview-label"
              aria-live="polite"
              className="ink-in block max-w-[88%] self-end rounded-2xl rounded-br-sm bg-[#e3fcce] px-3.5 py-2 text-[0.875rem] text-[#1b1f27] shadow-sm"
            >
              {message}
              <span className="ml-2 inline-flex items-center gap-0.5 align-bottom text-[0.6875rem] text-[#4fae4e]">
                10:25 <CheckCheck aria-hidden="true" className="size-3.5" />
              </span>
            </output>
            {typing ? (
              <p className="ink-in flex items-center gap-2 self-start rounded-2xl rounded-bl-sm bg-white px-3.5 py-2 text-[0.8125rem] text-[#8a919c] shadow-sm">
                <span aria-hidden="true" className="flex gap-1">
                  <span className="size-1.5 animate-pulse rounded-full bg-current" />
                  <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:150ms]" />
                  <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:300ms]" />
                </span>
                {copy.typing}
              </p>
            ) : (
              <div
                key={reply}
                aria-live="polite"
                className="ink-in max-w-[85%] self-start rounded-2xl rounded-bl-sm bg-white px-3.5 py-2 text-[0.875rem] text-[#1b1f27] shadow-sm"
              >
                <p>{reply}</p>
                <p className="mt-1.5 border-t border-black/10 pt-1.5 text-[0.6875rem] text-[#8a919c]">
                  {copy.replyNote}
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 border-t border-win-line px-3 py-2.5">
            <Paperclip aria-hidden="true" className="size-5 shrink-0 text-win-muted" />
            <button
              type="button"
              onClick={() => void copyText(message)}
              className="inline-flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[0.8125rem] text-win-muted hover:bg-win-raised"
            >
              {copied ? (
                <Check aria-hidden="true" className="size-4 shrink-0 text-ok" />
              ) : (
                <Copy aria-hidden="true" className="size-4 shrink-0" />
              )}
              <span aria-live="polite" className="truncate">
                {copied ? copy.copied : copy.copy}
              </span>
            </button>
            <Smile aria-hidden="true" className="hidden size-5 shrink-0 text-win-muted sm:block" />
            <span className="relative shrink-0">
              <a
                href={telegramLink(message)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#1677b5] px-4 py-2 text-[0.8125rem] font-medium text-white transition-colors hover:bg-[#12669c]"
              >
                <Send aria-hidden="true" className="size-4" />
                {copy.send}
              </a>
              {changed && !typing ? (
                <Hotspot
                  label={copy.hints[1] ?? ''}
                  visible
                  className="-top-1 left-1/2"
                  side="top"
                />
              ) : null}
            </span>
          </div>
          <p className="px-4 pb-3 text-[0.6875rem] text-win-muted">{copy.hint}</p>
        </div>
      </div>
    </Window>
  );
}
