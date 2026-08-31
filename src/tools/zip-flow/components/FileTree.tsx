import React from 'react';
import { ChevronDown, ChevronRight, Download, File as FileIcon, Folder, FolderOpen } from 'lucide-react';
import type { TreeNode } from '../types';
import { formatBytes } from '../lib/files';

interface FileTreeProps {
  node: TreeNode;
  depth?: number;
  expanded: Set<string>;
  selected: Set<string>;
  activePath: string | null;
  onToggleExpand: (path: string) => void;
  onToggleSelect: (node: TreeNode) => void;
  onOpen: (node: TreeNode) => void;
  onDownload: (node: TreeNode) => void;
  /** Every file path under each folder, so a folder checkbox knows its state. */
  filesUnder: Map<string, string[]>;
  labels: { download: string; ratio: string };
}

function ratioOf(size: number, packed: number): number | null {
  if (!size) return null;
  return Math.max(0, Math.round((1 - packed / size) * 100));
}

export const FileTree: React.FC<FileTreeProps> = props => {
  const { node, depth = 0, expanded, selected, activePath, filesUnder, labels } = props;

  // The synthetic root is a container, not a row.
  if (node.path === '') {
    return (
      <div className="space-y-0.5">
        {node.children.map(child => (
          <FileTree key={child.path} {...props} node={child} depth={0} />
        ))}
      </div>
    );
  }

  const isOpen = expanded.has(node.path);
  const children = filesUnder.get(node.path) || [];
  const picked = node.dir
    ? children.filter(p => selected.has(p)).length
    : selected.has(node.path)
      ? 1
      : 0;
  const all = node.dir ? children.length > 0 && picked === children.length : picked === 1;
  const some = picked > 0 && !all;
  const ratio = ratioOf(node.size, node.packed);
  const active = activePath === node.path;

  return (
    <div>
      <div
        className={`group flex items-center gap-2 py-1.5 pr-2 rounded-xl transition-colors ${
          active ? 'bg-amber-500/10 ring-1 ring-amber-500/30' : 'hover:bg-white/[0.04]'
        }`}
        style={{ paddingLeft: `${depth * 16 + 6}px` }}
      >
        <input
          type="checkbox"
          checked={all}
          ref={el => {
            if (el) el.indeterminate = some;
          }}
          onChange={() => props.onToggleSelect(node)}
          className="w-3.5 h-3.5 shrink-0 accent-amber-500 cursor-pointer"
          aria-label={node.path}
        />

        {node.dir ? (
          <button
            onClick={() => props.onToggleExpand(node.path)}
            className="shrink-0 text-slate-500 hover:text-white bg-transparent border-none p-0 cursor-pointer outline-none"
            aria-expanded={isOpen}
            aria-label={node.name}
          >
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        <button
          onClick={() => (node.dir ? props.onToggleExpand(node.path) : props.onOpen(node))}
          className="flex items-center gap-2 min-w-0 flex-1 bg-transparent border-none p-0 text-left cursor-pointer outline-none"
        >
          {node.dir ? (
            isOpen ? (
              <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-amber-500 shrink-0" />
            )
          ) : (
            <FileIcon className="w-4 h-4 text-slate-400 shrink-0" />
          )}
          <span className={`text-sm truncate ${node.dir ? 'font-bold text-slate-200' : 'font-medium text-slate-300'}`}>
            {node.name}
          </span>
        </button>

        <span className="hidden sm:inline text-[11px] font-mono text-slate-500 shrink-0 tabular-nums">
          {formatBytes(node.size)}
        </span>
        {ratio !== null && (
          <span
            title={labels.ratio}
            className={`hidden md:inline text-[10px] font-mono font-bold shrink-0 tabular-nums w-10 text-right ${
              ratio > 0 ? 'text-emerald-400/80' : 'text-slate-600'
            }`}
          >
            −{ratio}%
          </span>
        )}

        {!node.dir && (
          <button
            onClick={() => props.onDownload(node)}
            title={labels.download}
            aria-label={`${labels.download}: ${node.name}`}
            className="shrink-0 p-1.5 rounded-lg text-amber-500 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/25 hover:text-white transition-all cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100 outline-none"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* The guide line is absolutely positioned instead of being a margin, so
          it never compounds with the rows' own depth padding. */}
      {node.dir && isOpen && node.children.length > 0 && (
        <div className="relative">
          <span
            aria-hidden="true"
            className="absolute top-0 bottom-0 w-px bg-white/[0.07]"
            style={{ left: `${depth * 16 + 13}px` }}
          />
          {node.children.map(child => (
            <FileTree key={child.path} {...props} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FileTree;
