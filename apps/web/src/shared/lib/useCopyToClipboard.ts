import { useCallback, useEffect, useRef, useState } from 'react';

const RESET_MS = 2000;

export function useCopyToClipboard(): { copied: boolean; copy: (text: string) => Promise<void> } {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), RESET_MS);
    } catch {
      setCopied(false);
    }
  }, []);

  return { copied, copy };
}
