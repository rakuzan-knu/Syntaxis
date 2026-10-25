import type { ReactNode } from 'react';
import {
  ChevronDown,
  ChevronRight,
  CopyMinus,
  Ellipsis,
  FilePlus,
  FolderPlus,
  RefreshCw,
} from 'lucide-react';
import { ROOT, type TreeNode } from '../../model/fileSystem';
import { FileIcon } from './FileIcon';

interface ExplorerViewProps {
  expanded: ReadonlySet<string>;
  activePath: string | null;
  modifiedPath: string | null;
  onToggle: (path: string) => void;
  onOpen: (path: string) => void;
  onCollapseAll: () => void;
}

function HeaderButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="grid size-6 cursor-pointer place-items-center rounded text-win-muted transition-colors hover:bg-win-raised hover:text-win-text"
    >
      {children}
    </button>
  );
}

export function ExplorerView({
  expanded,
  activePath,
  modifiedPath,
  onToggle,
  onOpen,
  onCollapseAll,
}: ExplorerViewProps) {
  const rootOpen = expanded.has('');

  const render = (node: TreeNode, depth: number): ReactNode => {
    const indent = { paddingLeft: `${0.5 + depth * 0.75}rem` };
    if (node.kind === 'folder') {
      const open = expanded.has(node.path);
      const dirty = modifiedPath?.startsWith(`${node.path}/`) ?? false;
      return (
        <li key={node.path}>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => onToggle(node.path)}
            style={indent}
            className="flex w-full cursor-pointer items-center gap-1 py-[3px] pr-3 text-left text-win-text/85 transition-colors hover:bg-win-raised"
          >
            {open ? (
              <ChevronDown aria-hidden="true" className="size-3.5 shrink-0" />
            ) : (
              <ChevronRight aria-hidden="true" className="size-3.5 shrink-0" />
            )}
            <span className={`truncate ${dirty ? 'text-warn' : ''}`}>{node.name}</span>
            {dirty ? (
              <span aria-hidden="true" className="ml-auto size-1.5 rounded-full bg-warn" />
            ) : null}
          </button>
          {open ? <ul>{node.children.map((child) => render(child, depth + 1))}</ul> : null}
        </li>
      );
    }
    const active = node.path === activePath;
    const dirty = node.path === modifiedPath;
    return (
      <li key={node.path}>
        <button
          type="button"
          aria-current={active ? 'true' : undefined}
          onClick={() => onOpen(node.path)}
          style={{ paddingLeft: `${1.4 + depth * 0.75}rem` }}
          className={`flex w-full cursor-pointer items-center gap-1 py-[3px] pr-3 text-left transition-colors ${active ? 'bg-win-accent/20 text-win-text outline outline-1 -outline-offset-1 outline-win-accent/60' : 'text-win-text/85 hover:bg-win-raised'}`}
        >
          <FileIcon name={node.name} />
          <span className={`truncate ${dirty ? 'text-warn' : ''}`}>{node.name}</span>
          {dirty ? <span className="ml-auto text-[0.6875rem] text-warn">M</span> : null}
        </button>
      </li>
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-9 shrink-0 items-center justify-between px-4 text-[0.6875rem] tracking-wide text-win-muted">
        EXPLORER
        <HeaderButton label="Views and More Actions...">
          <Ellipsis aria-hidden="true" className="size-4" />
        </HeaderButton>
      </div>
      <div className="group flex h-6 shrink-0 items-center gap-1 pr-2 pl-1 text-[0.6875rem] font-semibold">
        <button
          type="button"
          aria-expanded={rootOpen}
          onClick={() => onToggle('')}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-1 text-left text-win-text"
        >
          {rootOpen ? (
            <ChevronDown aria-hidden="true" className="size-3.5" />
          ) : (
            <ChevronRight aria-hidden="true" className="size-3.5" />
          )}
          <span className="truncate whitespace-nowrap">{ROOT.name.toUpperCase()}</span>
        </button>
        <span className="flex opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <HeaderButton label="New File...">
            <FilePlus aria-hidden="true" className="size-3.5" />
          </HeaderButton>
          <HeaderButton label="New Folder...">
            <FolderPlus aria-hidden="true" className="size-3.5" />
          </HeaderButton>
          <HeaderButton label="Refresh Explorer">
            <RefreshCw aria-hidden="true" className="size-3.5" />
          </HeaderButton>
          <HeaderButton label="Collapse Folders in Explorer" onClick={onCollapseAll}>
            <CopyMinus aria-hidden="true" className="size-3.5" />
          </HeaderButton>
        </span>
      </div>
      {rootOpen ? (
        <ul className="min-h-0 flex-1 overflow-y-auto pb-2 font-sans text-[0.8125rem]">
          {ROOT.children.map((node) => render(node, 0))}
        </ul>
      ) : null}
    </div>
  );
}
