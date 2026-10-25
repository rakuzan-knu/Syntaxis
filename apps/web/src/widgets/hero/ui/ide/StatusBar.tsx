import { useCallback, useRef, useState, type ReactNode } from 'react';
import {
  Bell,
  Braces,
  CheckCheck,
  CircleX,
  GitBranch,
  RefreshCw,
  TriangleAlert,
} from 'lucide-react';
import { useDismiss } from '@/shared/lib';

interface StatusBarProps {
  modified: boolean;
  ahead: number;
  errors: number;
  warnings: number;
  line: number;
  column: number;
  language: string;
  onBranch: () => void;
  onProblems: () => void;
}

function Item({
  label,
  onClick,
  className = '',
  children,
}: {
  label: string;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`flex h-full shrink-0 cursor-pointer items-center gap-1 px-1.5 transition-colors hover:bg-white/20 ${className}`}
    >
      {children}
    </button>
  );
}

export function StatusBar({
  modified,
  ahead,
  errors,
  warnings,
  line,
  column,
  language,
  onBranch,
  onProblems,
}: StatusBarProps) {
  const bellRef = useRef<HTMLSpanElement>(null);
  const [notifications, setNotifications] = useState(false);
  const close = useCallback(() => setNotifications(false), []);
  useDismiss(bellRef, notifications, close);

  return (
    <div className="flex h-6 shrink-0 items-stretch bg-win-accent px-1 font-sans text-[0.6875rem] text-win">
      <Item label="main (Git) - Checkout Branch/Tag..." onClick={onBranch}>
        <GitBranch aria-hidden="true" className="size-3" />
        main{modified ? '*' : ''}
      </Item>
      <Item label={`Synchronize Changes: ${ahead} outgoing`} className="hidden sm:flex">
        <RefreshCw aria-hidden="true" className="size-3" />
        {ahead > 0 ? `${ahead}↑` : null}
      </Item>
      <Item label={`Errors: ${errors}, Warnings: ${warnings}`} onClick={onProblems}>
        <CircleX aria-hidden="true" className="size-3" /> {errors}
        <TriangleAlert aria-hidden="true" className="ml-1 size-3" /> {warnings}
      </Item>
      <span className="ml-auto flex items-stretch">
        <Item label="Go to Line/Column" className="hidden sm:flex">
          Ln {line}, Col {column}
        </Item>
        <Item label="Select Indentation" className="hidden md:flex">
          Spaces: 2
        </Item>
        <Item label="Select Encoding" className="hidden md:flex">
          UTF-8
        </Item>
        <Item label="Select End of Line Sequence" className="hidden lg:flex">
          LF
        </Item>
        <Item label="Select Language Mode" className="hidden md:flex">
          <Braces aria-hidden="true" className="size-3" />
          {language}
        </Item>
        <Item label="Prettier: Ready" className="hidden lg:flex">
          <CheckCheck aria-hidden="true" className="size-3" />
          Prettier
        </Item>
        <span ref={bellRef} className="relative flex">
          <Item label="Notifications" onClick={() => setNotifications((value) => !value)}>
            <Bell aria-hidden="true" className="size-3" />
          </Item>
          {notifications ? (
            <span
              role="status"
              className="ink-in absolute right-0 bottom-full z-40 mb-1 w-64 rounded-md border border-win-line bg-win-raised p-3 text-[0.75rem] text-win-text shadow-2xl"
            >
              <span className="block font-semibold">NOTIFICATIONS</span>
              <span className="mt-1 block text-win-muted">No new notifications</span>
            </span>
          ) : null}
        </span>
      </span>
    </div>
  );
}
