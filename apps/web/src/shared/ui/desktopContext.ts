import { createContext, use } from 'react';

export interface DesktopApi {
  enabled: boolean;
  order: readonly string[];
  minimized: readonly string[];
  solo: string | null;
  generation: number;
  register: (id: string, title: string) => void;
  focus: (id: string) => void;
  minimize: (id: string) => void;
  restore: (id: string) => void;
  toggleSolo: (id: string) => void;
}

export interface WindowControls {
  id: string;
  close: () => void;
  minimize: () => void;
  zoom: () => void;
  solo: boolean;
}

export const DesktopContext = createContext<DesktopApi | null>(null);

export const WindowControlsContext = createContext<WindowControls | null>(null);

export function useWindowControls(): WindowControls | null {
  return use(WindowControlsContext);
}
