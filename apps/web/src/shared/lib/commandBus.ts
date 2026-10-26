import { useEffect, useRef } from 'react';
import type { DemoPlayer } from './useAutoplay';

type Handler = () => void;

const handlers = new Map<string, Handler>();
const pending = new Set<string>();

export function registerCommand(id: string, handler: Handler): () => void {
  handlers.set(id, handler);
  if (pending.delete(id)) window.setTimeout(() => handlers.get(id)?.(), 0);
  return () => {
    if (handlers.get(id) === handler) handlers.delete(id);
  };
}

export function runCommand(id: string): void {
  const handler = handlers.get(id);
  if (handler) handler();
  else pending.add(id);
}

export function useDemoCommands(section: string, player: DemoPlayer): void {
  const latest = useRef(player);

  useEffect(() => {
    latest.current = player;
  });

  const count = player.chapters.length;

  useEffect(() => {
    const disposers = [
      registerCommand(`${section}.replay`, () => latest.current.replay()),
      ...Array.from({ length: count }, (_, index) =>
        registerCommand(`${section}.chapter.${index}`, () => latest.current.seek(index)),
      ),
    ];
    return () => disposers.forEach((dispose) => dispose());
  }, [section, count]);
}
