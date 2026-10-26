import type { Dictionary } from '@/shared/i18n';
import type { ThemeMode } from './variables';

export type NodeKind = 'frame' | 'text' | 'button' | 'badge' | 'component';
export type PageId = 'subscribe' | 'checkout';
export type Padding = 'compact' | 'comfortable';
export type Shadow = 'none' | 'soft' | 'strong';
export type Font = 'sans' | 'mono';
export type ButtonState = 'default' | 'hover' | 'pressed' | 'disabled';

export interface NodeStyle {
  text?: string;
  size?: number;
  weight?: number;
  color?: string;
  radius?: number;
  padding?: Padding;
  shadow?: Shadow;
  width?: number;
  state?: ButtonState;
}

export interface DesignNode {
  id: string;
  name: string;
  kind: NodeKind;
  page: PageId;
  depth: 0 | 1;
  defaults: NodeStyle;
}

export const NODES: readonly DesignNode[] = [
  {
    id: 'card',
    name: 'Subscription card',
    kind: 'frame',
    page: 'subscribe',
    depth: 0,
    defaults: { radius: 18, padding: 'comfortable', shadow: 'soft' },
  },
  {
    id: 'title',
    name: 'Title',
    kind: 'text',
    page: 'subscribe',
    depth: 1,
    defaults: { size: 18, weight: 600 },
  },
  { id: 'badge', name: 'Badge', kind: 'badge', page: 'subscribe', depth: 1, defaults: {} },
  {
    id: 'text',
    name: 'Description',
    kind: 'text',
    page: 'subscribe',
    depth: 1,
    defaults: { size: 14, weight: 400 },
  },
  { id: 'tabs', name: 'Tabs', kind: 'component', page: 'subscribe', depth: 1, defaults: {} },
  {
    id: 'email',
    name: 'Input / Email',
    kind: 'component',
    page: 'subscribe',
    depth: 1,
    defaults: {},
  },
  { id: 'toggle', name: 'Toggle', kind: 'component', page: 'subscribe', depth: 1, defaults: {} },
  {
    id: 'primary',
    name: 'Button / Primary',
    kind: 'button',
    page: 'subscribe',
    depth: 1,
    defaults: { radius: 12 },
  },
  {
    id: 'secondary',
    name: 'Button / Secondary',
    kind: 'component',
    page: 'subscribe',
    depth: 1,
    defaults: {},
  },
  {
    id: 'checkout',
    name: 'Checkout',
    kind: 'frame',
    page: 'checkout',
    depth: 0,
    defaults: { radius: 18, padding: 'comfortable', shadow: 'soft' },
  },
  { id: 'back', name: 'Back', kind: 'component', page: 'checkout', depth: 1, defaults: {} },
  {
    id: 'heading',
    name: 'Heading',
    kind: 'text',
    page: 'checkout',
    depth: 1,
    defaults: { size: 18, weight: 600 },
  },
  {
    id: 'summary',
    name: 'Order summary',
    kind: 'component',
    page: 'checkout',
    depth: 1,
    defaults: {},
  },
  {
    id: 'pay',
    name: 'Button / Pay',
    kind: 'button',
    page: 'checkout',
    depth: 1,
    defaults: { radius: 12 },
  },
];

export const PROTOTYPE_LINKS: readonly { from: string; to: PageId }[] = [
  { from: 'primary', to: 'checkout' },
  { from: 'back', to: 'subscribe' },
];

export interface DesignDoc {
  accent: string;
  font: Font;
  nodes: Readonly<Record<string, NodeStyle>>;
  hidden: readonly string[];
  locked: readonly string[];
  names: Readonly<Record<string, string>>;
  mode: ThemeMode;
}

export function createDoc(accent: string): DesignDoc {
  return { accent, font: 'sans', nodes: {}, hidden: [], locked: [], names: {}, mode: 'light' };
}

export function nodeById(id: string): DesignNode | undefined {
  return NODES.find((node) => node.id === id);
}

export function nodesOn(page: PageId): DesignNode[] {
  return NODES.filter((node) => node.page === page);
}

export function styleOf(doc: DesignDoc, id: string): NodeStyle {
  return { ...nodeById(id)?.defaults, ...doc.nodes[id] };
}

export function nameOf(doc: DesignDoc, id: string): string {
  return doc.names[id] ?? nodeById(id)?.name ?? id;
}

export function updateNode(doc: DesignDoc, id: string, patch: NodeStyle): DesignDoc {
  return { ...doc, nodes: { ...doc.nodes, [id]: { ...doc.nodes[id], ...patch } } };
}

function toggle(list: readonly string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

export function toggleHidden(doc: DesignDoc, id: string): DesignDoc {
  return { ...doc, hidden: toggle(doc.hidden, id) };
}

export function toggleLocked(doc: DesignDoc, id: string): DesignDoc {
  return { ...doc, locked: toggle(doc.locked, id) };
}

export function rename(doc: DesignDoc, id: string, name: string): DesignDoc {
  const trimmed = name.trim();
  if (trimmed === '' || trimmed === nameOf(doc, id)) return doc;
  return { ...doc, names: { ...doc.names, [id]: trimmed } };
}

export function linkFrom(id: string): PageId | undefined {
  return PROTOTYPE_LINKS.find((link) => link.from === id)?.to;
}

export const ACCENTS = ['#2F3BFF', '#C2410C', '#0F8A5F', '#7C3AED'] as const;
export const FRAME_WIDTH = 384;
export const MIN_FRAME_WIDTH = 280;
export const MAX_FRAME_WIDTH = 560;
export const NARROW_FRAME = 340;

export function clampWidth(value: number): number {
  return Math.round(Math.min(MAX_FRAME_WIDTH, Math.max(MIN_FRAME_WIDTH, value)));
}
export const ZOOM_PRESETS = [0.5, 1, 2] as const;

export function clampZoom(value: number): number {
  return Math.min(4, Math.max(0.25, Math.round(value * 100) / 100));
}

const TEXT_NODES = new Set(['title', 'badge', 'text', 'primary', 'heading', 'pay']);

export function isTextNode(id: string): boolean {
  return TEXT_NODES.has(id);
}

export function defaultText(id: string, copy: Dictionary['design']): string {
  const texts: Record<string, string> = {
    title: copy.kit.title,
    badge: copy.kit.badge,
    text: copy.kit.text,
    primary: copy.kit.primary,
    heading: copy.figma.checkout.title,
    pay: copy.figma.checkout.pay,
  };
  return texts[id] ?? '';
}
