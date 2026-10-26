import { useState } from 'react';
import { ExternalLink, Lock, Triangle } from 'lucide-react';
import { DemoStore, type CartLine } from '@/entities/demo-store';
import type { Dictionary } from '@/shared/i18n';
import { fillTemplate } from '@/shared/lib';

interface PreviewCommentProps {
  copy: Dictionary['outstaff']['preview'];
  store: Dictionary['build']['demo'];
  updatedSha: string | null;
}

const ACCENT = '#0F8A5F';

export function PreviewComment({ copy, store, updatedSha }: PreviewCommentProps) {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState('/');
  const [cart, setCart] = useState<CartLine[]>([]);

  return (
    <div className="flex gap-3">
      <span
        aria-hidden="true"
        className="grid size-8 shrink-0 place-items-center rounded-full bg-win-text text-win"
      >
        <Triangle className="size-3.5 fill-current" />
      </span>
      <div className="min-w-0 flex-1 overflow-hidden rounded-lg border border-win-line">
        <p className="flex flex-wrap items-center gap-x-1.5 border-b border-win-line bg-win-raised px-3 py-2 text-[0.75rem] text-win-muted">
          <span className="font-medium text-win-text">{copy.bot}</span>
          <span className="rounded-full border border-win-line px-1.5 text-[0.625rem]">bot</span>
          {updatedSha ? fillTemplate(copy.updated, { sha: updatedSha }) : copy.ready}
        </p>
        <div className="flex flex-col gap-3 px-3 py-3 text-[0.8125rem]">
          <p>{copy.text}</p>
          <div className="overflow-hidden rounded-md border border-win-line">
            <div className="flex items-center gap-1.5 border-b border-win-line bg-win-raised px-2.5 py-1.5 font-mono text-[0.6875rem] text-win-muted">
              <Lock aria-hidden="true" className="size-2.5 shrink-0" />
              <span className="truncate">{copy.url}</span>
            </div>
            {open ? (
              <div className="h-80 overflow-y-auto">
                <DemoStore
                  copy={store}
                  headline={copy.headline}
                  cta={store.cta}
                  accent={ACCENT}
                  path={path}
                  cart={cart}
                  onNavigate={setPath}
                  onCart={setCart}
                />
              </div>
            ) : (
              <div aria-hidden="true" inert className="h-36 overflow-hidden bg-[#f7f4ef]">
                <div className="w-[200%] origin-top-left scale-50">
                  <DemoStore
                    copy={store}
                    headline={copy.headline}
                    cta={store.cta}
                    accent={ACCENT}
                  />
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            data-guide="preview-open"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-md border border-win-line px-3 py-1.5 text-[0.75rem] font-medium hover:bg-win-raised"
          >
            <ExternalLink aria-hidden="true" className="size-3.5" />
            {open ? copy.close : copy.open}
          </button>
        </div>
      </div>
    </div>
  );
}
