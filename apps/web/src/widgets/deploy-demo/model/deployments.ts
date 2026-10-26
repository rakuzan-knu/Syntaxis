export type DeployStatus = 'building' | 'ready' | 'error';

export interface Commit {
  sha: string;
  message: string;
}

export type DeployTarget = 'production' | 'preview' | 'canary';

export interface Deployment extends Commit {
  id: string;
  status: DeployStatus;
  version: number;
  fresh: boolean;
  target: DeployTarget;
}

export interface DeployState {
  deployments: readonly Deployment[];
  production: string;
  selected: string;
}

export const VERSION_ACCENTS: readonly string[] = [
  '#8A4B2A',
  '#3F3F46',
  '#2F3BFF',
  '#2F3BFF',
  '#0F8A5F',
];
export const PREVIEW_VERSION = 4;
export const MAX_DEPLOYMENTS = 6;

export function initialState(history: readonly Commit[]): DeployState {
  const deployments = history
    .map((commit, index) => ({
      ...commit,
      id: `dpl_h${index}`,
      status: 'ready' as const,
      version: index,
      fresh: false,
      target: 'production' as const,
    }))
    .reverse();
  const live = deployments[0]?.id ?? '';
  return { deployments, production: live, selected: live };
}

export function begin(
  state: DeployState,
  commit: Commit,
  version: number,
  sequence: number,
  target: DeployTarget = 'production',
): DeployState {
  const id = `dpl_${sequence}`;
  const deployment: Deployment = {
    ...commit,
    id,
    status: 'building',
    version,
    fresh: true,
    target,
  };
  return {
    ...state,
    deployments: [deployment, ...state.deployments].slice(0, MAX_DEPLOYMENTS),
    selected: id,
  };
}

export function settle(state: DeployState, id: string, ok: boolean): DeployState {
  return {
    ...state,
    deployments: state.deployments.map((item) =>
      item.id === id ? { ...item, status: ok ? 'ready' : 'error' } : item,
    ),
    production:
      ok && state.deployments.find((item) => item.id === id)?.target !== 'preview'
        ? id
        : state.production,
  };
}

export function promote(state: DeployState, id: string): DeployState {
  const target = state.deployments.find((item) => item.id === id);
  if (!target || target.status !== 'ready') return state;
  return {
    ...state,
    deployments: state.deployments.map((item) =>
      item.id === id ? { ...item, target: 'production' } : item,
    ),
    production: id,
    selected: id,
  };
}

export function rollback(state: DeployState, id: string): DeployState {
  const target = state.deployments.find((item) => item.id === id);
  if (!target || target.status !== 'ready') return state;
  return { ...state, production: id, selected: id };
}

export function select(state: DeployState, id: string): DeployState {
  return state.deployments.some((item) => item.id === id) ? { ...state, selected: id } : state;
}

export function productionOf(state: DeployState): Deployment | undefined {
  return state.deployments.find((item) => item.id === state.production);
}

export function isBuilding(state: DeployState): boolean {
  return state.deployments.some((item) => item.status === 'building');
}
