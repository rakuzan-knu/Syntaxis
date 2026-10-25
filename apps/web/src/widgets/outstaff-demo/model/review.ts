export type Stage = 'open' | 'fixing' | 'approved' | 'merged';

export interface ReviewComment {
  id: number;
  file: string;
  line: number;
  text: string;
  reply: string | null;
}

export interface ReviewState {
  stage: Stage;
  comments: readonly ReviewComment[];
  fixes: number;
}

export const INITIAL_REVIEW: ReviewState = { stage: 'open', comments: [], fixes: 0 };

export function comment(
  state: ReviewState,
  target: { file: string; line: number; text: string },
): ReviewState {
  const text = target.text.trim();
  if (text === '' || state.stage === 'merged') return state;
  const id = state.comments.length + 1;
  return {
    ...state,
    stage: 'fixing',
    comments: [...state.comments, { id, file: target.file, line: target.line, text, reply: null }],
  };
}

export function resolve(state: ReviewState, id: number, reply: string): ReviewState {
  const target = state.comments.find((item) => item.id === id);
  if (!target || target.reply !== null) return state;
  const comments = state.comments.map((item) => (item.id === id ? { ...item, reply } : item));
  const open = comments.some((item) => item.reply === null);
  return { stage: open ? 'fixing' : 'open', comments, fixes: state.fixes + 1 };
}

export function approve(state: ReviewState): ReviewState {
  return state.stage === 'open' ? { ...state, stage: 'approved' } : state;
}

export function merge(state: ReviewState, checksPassed: boolean): ReviewState {
  return state.stage === 'approved' && checksPassed ? { ...state, stage: 'merged' } : state;
}
