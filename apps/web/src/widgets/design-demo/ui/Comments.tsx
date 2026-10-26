import { useState, type FormEvent } from 'react';
import type { Dictionary } from '@/shared/i18n';

export interface CommentPin {
  id: number;
  page: string;
  x: number;
  y: number;
  text: string;
  reply: string | null;
}

interface CommentsProps {
  copy: Dictionary['design']['figma']['comments'];
  pins: readonly CommentPin[];
  draft: { x: number; y: number } | null;
  scale: number;
  onSubmit: (text: string) => void;
  onCancel: () => void;
}

function Bubble({ initial, tone }: { initial: string; tone: 'you' | 'team' }) {
  return (
    <span
      className={`grid size-7 place-items-center rounded-full rounded-bl-none border-2 border-white text-[0.6875rem] font-semibold text-white shadow-md ${tone === 'you' ? 'bg-[#2f3bff]' : 'bg-[#E5484D]'}`}
    >
      {initial}
    </span>
  );
}

export function Comments({ copy, pins, draft, scale, onSubmit, onCancel }: CommentsProps) {
  const [open, setOpen] = useState<number | null>(null);
  const [text, setText] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (text.trim() === '') return;
    onSubmit(text.trim());
    setText('');
  };

  const place = (x: number, y: number) => ({
    left: `${x}%`,
    top: `${y}%`,
    scale: `${1 / scale}`,
    transformOrigin: '0 100%',
  });

  return (
    <>
      {pins.map((pin) => (
        <div key={pin.id} className="absolute z-20 -translate-y-full" style={place(pin.x, pin.y)}>
          <button
            type="button"
            aria-label={pin.text}
            aria-expanded={open === pin.id}
            onClick={(event) => {
              event.stopPropagation();
              setOpen((current) => (current === pin.id ? null : pin.id));
            }}
            className="cursor-pointer"
          >
            <Bubble initial={copy.you.slice(0, 1)} tone="you" />
          </button>
          {open === pin.id ? (
            <div
              onClick={(event) => event.stopPropagation()}
              className="ink-in absolute top-0 left-9 w-56 rounded-xl border border-black/10 bg-white p-3 text-[0.75rem] text-[#14161c] shadow-xl"
            >
              <p className="font-semibold">{copy.you}</p>
              <p className="mt-0.5">{pin.text}</p>
              {pin.reply ? (
                <div className="ink-in mt-2 border-t border-black/10 pt-2">
                  <p className="font-semibold">{copy.author}</p>
                  <p className="mt-0.5">{pin.reply}</p>
                </div>
              ) : (
                <p className="mt-2 text-black/50">{copy.author}…</p>
              )}
            </div>
          ) : null}
        </div>
      ))}
      {draft ? (
        <div className="absolute z-30 -translate-y-full" style={place(draft.x, draft.y)}>
          <form
            onSubmit={submit}
            onClick={(event) => event.stopPropagation()}
            className="flex items-end gap-2"
          >
            <Bubble initial={copy.you.slice(0, 1)} tone="you" />
            <span className="flex w-60 gap-1.5 rounded-xl border border-black/10 bg-white p-1.5 shadow-xl">
              <input
                autoFocus
                value={text}
                aria-label={copy.placeholder}
                placeholder={copy.placeholder}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                  event.stopPropagation();
                  if (event.key === 'Escape') onCancel();
                }}
                className="min-w-0 flex-1 rounded-md px-2 py-1 text-[0.75rem] text-[#14161c] outline-none"
              />
              <button
                type="submit"
                className="cursor-pointer rounded-md bg-[#2f3bff] px-2.5 py-1 text-[0.75rem] font-medium text-white"
              >
                {copy.send}
              </button>
            </span>
          </form>
        </div>
      ) : null}
    </>
  );
}
