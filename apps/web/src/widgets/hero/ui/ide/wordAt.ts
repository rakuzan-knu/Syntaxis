export function wordAt(x: number, y: number): { word: string; rect: DOMRect } | null {
  const range = document.caretRangeFromPoint?.(x, y) ?? null;
  const node = range?.startContainer;
  if (!range || !node || node.nodeType !== Node.TEXT_NODE) return null;
  const text = node.textContent ?? '';
  let start = range.startOffset;
  let end = range.startOffset;
  while (start > 0 && /[\w$]/.test(text[start - 1] ?? '')) start -= 1;
  while (end < text.length && /[\w$]/.test(text[end] ?? '')) end += 1;
  if (start === end) return null;
  const word = document.createRange();
  word.setStart(node, start);
  word.setEnd(node, end);
  const rect = word.getBoundingClientRect();
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return null;
  return { word: text.slice(start, end), rect };
}
