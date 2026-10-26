export const MIN_PREFIX = 2;

export function completion(value: string, candidates: readonly string[]): string {
  if (value.trim().length < MIN_PREFIX) return '';
  const lower = value.toLowerCase();
  const match = candidates.find(
    (candidate) => candidate.length > value.length && candidate.toLowerCase().startsWith(lower),
  );
  return match ? match.slice(value.length) : '';
}
