import type { ReactNode } from 'react';
import type { Dictionary } from '@/shared/i18n';
import { Hotspot } from '@/shared/ui';
import type { CartLine } from '../model/store';

export type StoreCopy = Dictionary['build']['demo'];

export interface StorePageProps {
  copy: StoreCopy;
  accent: string;
  cart: readonly CartLine[];
  hint: string | null;
  navigate: (path: string) => void;
  setCart: (cart: CartLine[]) => void;
}

const BEAN_TINTS: Record<string, string> = {
  ethiopia: '#c9875a',
  colombia: '#9b5a3c',
  brazil: '#6f4330',
};

export function Bean({ sku, className = 'size-10' }: { sku: string; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 64 64" className={className}>
      <ellipse
        cx="32"
        cy="32"
        rx="17"
        ry="23"
        transform="rotate(28 32 32)"
        fill={BEAN_TINTS[sku] ?? '#9b5a3c'}
      />
      <path
        d="M26 13c9 9 3 20 12 38"
        fill="none"
        stroke="rgb(0 0 0 / 0.28)"
        strokeWidth="3"
        strokeLinecap="round"
        transform="rotate(28 32 32)"
      />
    </svg>
  );
}

interface StoreButtonProps {
  accent: string;
  children: ReactNode;
  onClick?: () => void;
  variant?: 'solid' | 'outline';
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
  guide?: string | undefined;
}

export function StoreButton({
  accent,
  children,
  onClick,
  variant = 'solid',
  type = 'button',
  disabled = false,
  className = '',
  guide,
}: StoreButtonProps) {
  return (
    <button
      type={type}
      data-guide={guide}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full font-medium transition-[background-color,color,opacity] duration-300 disabled:cursor-wait disabled:opacity-70 ${variant === 'solid' ? 'px-4 py-2 text-[0.8125rem] text-white hover:opacity-90' : 'border px-2.5 py-1 text-[0.6875rem] hover:bg-black/5'} ${className}`}
      style={
        variant === 'solid' ? { backgroundColor: accent } : { borderColor: accent, color: accent }
      }
    >
      {children}
    </button>
  );
}

export function Guide({
  label,
  side = 'top',
  className = '',
}: {
  label: string | null;
  side?: 'right' | 'left' | 'bottom' | 'top';
  className?: string;
}) {
  return label ? <Hotspot label={label} visible side={side} className={className} /> : null;
}

export function PageTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[1.375rem] leading-tight font-semibold tracking-[-0.025em] @md:text-[1.75rem]">
      {children}
    </h2>
  );
}

export function TextLink({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer text-[0.8125rem] text-black/60 underline-offset-4 hover:text-black hover:underline"
    >
      {children}
    </button>
  );
}
