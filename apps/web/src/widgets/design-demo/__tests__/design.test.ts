import { describe, expect, it } from 'vitest';
import { className, cssFor } from '../model/css';
import {
  createDoc,
  linkFrom,
  nameOf,
  rename,
  styleOf,
  toggleHidden,
  updateNode,
} from '../model/document';
import { commit, createUndo, redo, replace, undo } from '../model/history';

describe('design document', () => {
  it('merges node overrides with defaults', () => {
    const doc = updateNode(createDoc('#2F3BFF'), 'title', { size: 24 });
    expect(styleOf(doc, 'title')).toEqual({ size: 24, weight: 600 });
  });

  it('renames layers and ignores blank names', () => {
    const doc = rename(createDoc('#000'), 'title', '  Hero title ');
    expect(nameOf(doc, 'title')).toBe('Hero title');
    expect(rename(doc, 'title', '   ')).toBe(doc);
  });

  it('toggles visibility', () => {
    const doc = toggleHidden(toggleHidden(createDoc('#000'), 'badge'), 'tabs');
    expect(doc.hidden).toEqual(['badge', 'tabs']);
    expect(toggleHidden(doc, 'badge').hidden).toEqual(['tabs']);
  });

  it('knows prototype links', () => {
    expect(linkFrom('primary')).toBe('checkout');
    expect(linkFrom('title')).toBeUndefined();
  });
});

describe('undo history', () => {
  it('undoes and redoes commits', () => {
    let history = commit(commit(createUndo(1), 2), 3);
    history = undo(undo(history));
    expect(history.present).toBe(1);
    history = redo(history);
    expect(history.present).toBe(2);
    expect(commit(history, 5).future).toEqual([]);
  });

  it('coalesces edits that share a key', () => {
    let history = commit(createUndo(0), 4, 'radius');
    history = commit(history, 8, 'radius');
    history = commit(history, 12, 'radius');
    expect(history.past).toEqual([0]);
    expect(undo(history).present).toBe(0);
  });

  it('replaces without recording', () => {
    const history = replace(createUndo(1), 2);
    expect(history.past).toEqual([]);
    expect(history.present).toBe(2);
  });
});

describe('css export', () => {
  it('exports the selected layer', () => {
    const doc = updateNode(createDoc('#2f3bff'), 'primary', { radius: 20 });
    expect(cssFor(doc, 'primary')).toEqual([
      '.button-primary {',
      '  background: #2F3BFF;',
      '  border-radius: 20px;',
      '  padding: 10px 16px;',
      "  font: 500 14px 'Geologica', sans-serif;",
      '}',
    ]);
  });

  it('builds safe class names', () => {
    expect(className('Кнопка')).toBe('.layer');
    expect(className('Input / Email')).toBe('.input-email');
  });
});
