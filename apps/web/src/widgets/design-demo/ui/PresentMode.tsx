import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { Dictionary } from '@/shared/i18n';
import { useTimers } from '@/shared/lib';
import type { DesignDoc, PageId } from '../model/document';
import { PageFrame } from './Frames';

const FLASH_MS = 500;

interface PresentModeProps {
  copy: Dictionary['design'];
  doc: DesignDoc;
  start: PageId;
  onClose: () => void;
}

export default function PresentMode({ copy, doc, start, onClose }: PresentModeProps) {
  const [page, setPage] = useState<PageId>(start);
  const [flash, setFlash] = useState(false);
  const { schedule, clear } = useTimers();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={copy.figma.present}
      className="absolute inset-0 z-40 flex flex-col bg-[#1e1e1e] text-white"
    >
      <div className="flex h-11 shrink-0 items-center justify-between gap-3 px-3 text-[0.75rem]">
        <span className="truncate text-white/60">
          {copy.figma.file} / <span className="text-white">{copy.figma.pageNames[page]}</span>
        </span>
        <span className="hidden text-white/50 md:block">{copy.figma.presentHint}</span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={copy.figma.exitPresent}
          title={copy.figma.exitPresent}
          className="grid size-8 cursor-pointer place-items-center rounded-md text-white/70 hover:bg-white/10 hover:text-white"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>
      <div
        onClick={() => {
          clear();
          setFlash(true);
          schedule(() => setFlash(false), FLASH_MS);
        }}
        className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-4"
      >
        <div key={page} className="ink-in origin-center scale-[0.82] sm:scale-100">
          <PageFrame
            page={page}
            doc={doc}
            copy={copy}
            mode="present"
            flash={flash}
            onNavigate={setPage}
          />
        </div>
      </div>
      <p className="pb-3 text-center text-[0.6875rem] text-white/50 md:hidden">
        {copy.figma.presentHint}
      </p>
    </div>
  );
}
