import type { CSSProperties } from 'react';

export type ThemeMode = 'light' | 'dark';

export interface ColorVariable {
  name: string;
  token: string;
  light: string;
  dark: string;
}

export const MODES: readonly ThemeMode[] = ['light', 'dark'];

export const VARIABLES: readonly ColorVariable[] = [
  { name: 'surface/background', token: '--surface-background', light: '#FFFFFF', dark: '#17191F' },
  { name: 'surface/subtle', token: '--surface-subtle', light: '#F1F2F4', dark: '#23262D' },
  { name: 'surface/raised', token: '--surface-raised', light: '#FFFFFF', dark: '#2E323A' },
  { name: 'text/primary', token: '--text-primary', light: '#14161C', dark: '#F2F3F5' },
  { name: 'text/secondary', token: '--text-secondary', light: '#5E626B', dark: '#A4A9B3' },
  { name: 'border/default', token: '--border-default', light: '#D9DBE0', dark: '#3A3E47' },
];

export function valueOf(variable: ColorVariable, mode: ThemeMode): string {
  return mode === 'dark' ? variable.dark : variable.light;
}

export function tokenValue(token: string, mode: ThemeMode): string {
  const variable = VARIABLES.find((item) => item.token === token);
  return variable ? valueOf(variable, mode) : '';
}

export function modeStyle(mode: ThemeMode): CSSProperties {
  return Object.fromEntries(VARIABLES.map((variable) => [variable.token, valueOf(variable, mode)]));
}

export function modeCss(mode: ThemeMode): string[] {
  return VARIABLES.map((variable) => `  ${variable.token}: ${valueOf(variable, mode)};`);
}
