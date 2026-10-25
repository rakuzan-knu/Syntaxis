import { Fragment, type ReactNode } from 'react';
import { highlight, type Language } from '@/shared/lib';

export type CodeSegment = string | { node: ReactNode };

export type CodeLine = readonly CodeSegment[];

export type LineMarker = 'added' | 'modified' | 'removed';

interface LineDecoration {
  active?: boolean;
  marker?: LineMarker;
}

interface CodeBlockProps {
  lines: readonly CodeLine[];
  language: Language;
  numbered?: boolean;
  className?: string;
  decorate?: (index: number) => LineDecoration;
}

const MARKERS: Record<LineMarker, string> = {
  added: 'bg-ok',
  modified: 'bg-win-accent',
  removed: 'bg-bad',
};

export function CodeBlock({
  lines,
  language,
  numbered = true,
  className = '',
  decorate,
}: CodeBlockProps) {
  return (
    <pre className={`overflow-x-auto font-mono text-[0.8125rem] leading-[1.75] ${className}`}>
      <code className="grid min-w-max">
        {lines.map((line, lineIndex) => {
          const decoration = decorate?.(lineIndex) ?? {};
          return (
            <span
              key={lineIndex}
              className={`relative flex ${decoration.active ? 'bg-win-text/[0.06]' : ''}`}
            >
              {decoration.marker ? (
                <span
                  aria-hidden="true"
                  className={`absolute top-0 bottom-0 left-0 w-[3px] ${MARKERS[decoration.marker]}`}
                />
              ) : null}
              {numbered ? (
                <span
                  aria-hidden="true"
                  className={`w-10 shrink-0 pr-4 text-right select-none ${decoration.active ? 'text-win-text' : 'text-win-muted'}`}
                >
                  {lineIndex + 1}
                </span>
              ) : null}
              <span className="whitespace-pre">
                {line.map((segment, segmentIndex) =>
                  typeof segment === 'string' ? (
                    highlight(segment, language).map((token, tokenIndex) => (
                      <span
                        key={`${segmentIndex}-${tokenIndex}`}
                        className={token.kind === 'plain' ? undefined : `syn-${token.kind}`}
                      >
                        {token.text}
                      </span>
                    ))
                  ) : (
                    <Fragment key={segmentIndex}>{segment.node}</Fragment>
                  ),
                )}
                {line.length === 0 ? ' ' : null}
              </span>
            </span>
          );
        })}
      </code>
    </pre>
  );
}
