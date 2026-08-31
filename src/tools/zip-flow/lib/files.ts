// ============================================================================
// ZipFlow — file/DOM helpers kept out of the component
// ============================================================================

import type { EntryMeta, TreeNode } from '../types';

export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : decimals)} ${units[i]}`;
}

export function formatMs(ms: number): string {
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`;
}

export function formatDate(ms: number, locale: string): string {
  if (!ms) return '—';
  try {
    return new Date(ms).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: '2-digit' });
  } catch {
    return new Date(ms).toISOString().slice(0, 10);
  }
}

/**
 * Saves a Blob without the classic footgun: revoking the object URL in the
 * same tick as the click aborts the download in Firefox and Safari, which is
 * exactly what the old implementation did.
 */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** `photo.png` → `photo (2).png`, so a duplicate never silently overwrites. */
export function uniquePath(path: string, taken: Set<string>): string {
  if (!taken.has(path)) return path;
  const slash = path.lastIndexOf('/');
  const dir = slash >= 0 ? path.slice(0, slash + 1) : '';
  const name = slash >= 0 ? path.slice(slash + 1) : path;
  const dot = name.lastIndexOf('.');
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  for (let n = 2; ; n++) {
    const candidate = `${dir}${stem} (${n})${ext}`;
    if (!taken.has(candidate)) return candidate;
  }
}

/** Strips `..` segments, absolute roots and Windows drive letters (zip-slip). */
export function sanitizePath(path: string): string {
  return path
    .replace(/\\/g, '/')
    .replace(/^[a-zA-Z]:/, '')
    .split('/')
    .filter(part => part && part !== '.' && part !== '..')
    .join('/');
}

// ---------------------------------------------------------------------------
// Dropping folders
// ---------------------------------------------------------------------------

interface DroppedFile {
  file: File;
  path: string;
}

interface FsEntry {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  fullPath: string;
  file?: (cb: (f: File) => void, err: (e: unknown) => void) => void;
  createReader?: () => { readEntries: (cb: (e: FsEntry[]) => void, err: (e: unknown) => void) => void };
}

function entryFile(entry: FsEntry): Promise<File | null> {
  return new Promise(resolve => {
    entry.file?.(f => resolve(f), () => resolve(null));
  });
}

function readAll(reader: ReturnType<NonNullable<FsEntry['createReader']>>): Promise<FsEntry[]> {
  // readEntries hands back at most 100 children per call and signals the end
  // with an empty batch, so a single call silently truncates big folders.
  return new Promise(resolve => {
    const all: FsEntry[] = [];
    const step = () =>
      reader.readEntries(batch => {
        if (!batch.length) return resolve(all);
        all.push(...batch);
        step();
      }, () => resolve(all));
    step();
  });
}

async function walk(entry: FsEntry, prefix: string, out: DroppedFile[], budget: { left: number }): Promise<void> {
  if (budget.left <= 0) return;
  if (entry.isFile) {
    const file = await entryFile(entry);
    if (file) {
      out.push({ file, path: prefix ? `${prefix}/${entry.name}` : entry.name });
      budget.left--;
    }
    return;
  }
  if (entry.isDirectory && entry.createReader) {
    const children = await readAll(entry.createReader());
    const next = prefix ? `${prefix}/${entry.name}` : entry.name;
    for (const child of children) await walk(child, next, out, budget);
  }
}

/**
 * Expands a drop into files, recursing into dropped folders so the archive
 * keeps the directory structure. Falls back to the flat `dataTransfer.files`
 * when the browser has no entry API.
 */
export async function filesFromDrop(dt: DataTransfer, maxFiles = 5000): Promise<DroppedFile[]> {
  // The item list is invalidated as soon as the handler yields, so grab every
  // entry synchronously before the first await.
  const entries: FsEntry[] = [];
  if (dt.items && dt.items.length) {
    for (let i = 0; i < dt.items.length; i++) {
      const item = dt.items[i] as DataTransferItem & { webkitGetAsEntry?: () => FsEntry | null };
      const entry = item.webkitGetAsEntry?.();
      if (entry) entries.push(entry);
    }
  }

  if (!entries.length) {
    return Array.from(dt.files).map(file => ({ file, path: file.name }));
  }

  const out: DroppedFile[] = [];
  const budget = { left: maxFiles };
  for (const entry of entries) await walk(entry, '', out, budget);
  return out;
}

/** `<input webkitdirectory>` exposes the folder structure here. */
export function pathOfInputFile(file: File): string {
  const relative = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
  return relative && relative.length ? relative : file.name;
}

// ---------------------------------------------------------------------------
// Tree
// ---------------------------------------------------------------------------

/**
 * Folds the flat entry list into a tree, aggregating sizes upwards so a folder
 * row can show what it actually weighs.
 */
export function buildTree(entries: EntryMeta[]): TreeNode {
  const root: TreeNode = { name: '', path: '', dir: true, size: 0, packed: 0, entry: null, children: [] };
  const index = new Map<string, TreeNode>([['', root]]);

  const ensure = (path: string, name: string, parent: TreeNode): TreeNode => {
    const existing = index.get(path);
    if (existing) return existing;
    const node: TreeNode = { name, path, dir: true, size: 0, packed: 0, entry: null, children: [] };
    index.set(path, node);
    parent.children.push(node);
    return node;
  };

  for (const entry of entries) {
    const parts = entry.path.split('/').filter(Boolean);
    if (!parts.length) continue;
    let parent = root;
    let current = '';
    parts.forEach((part, i) => {
      current = current ? `${current}/${part}` : part;
      const last = i === parts.length - 1;
      if (last && !entry.dir) {
        const leaf: TreeNode = {
          name: part,
          path: current,
          dir: false,
          size: entry.size,
          packed: entry.packed,
          entry,
          children: [],
        };
        // A file can arrive after a folder of the same name in malformed
        // archives; the file entry wins, but never duplicates the row.
        const clash = index.get(current);
        if (clash) {
          clash.dir = false;
          clash.entry = entry;
          clash.size = entry.size;
          clash.packed = entry.packed;
        } else {
          index.set(current, leaf);
          parent.children.push(leaf);
        }
      } else {
        parent = ensure(current, part, parent);
        if (last) parent.entry = entry;
      }
    });
  }

  const sum = (node: TreeNode): { size: number; packed: number } => {
    if (!node.dir) return { size: node.size, packed: node.packed };
    let size = 0;
    let packed = 0;
    for (const child of node.children) {
      const totals = sum(child);
      size += totals.size;
      packed += totals.packed;
    }
    node.size = size;
    node.packed = packed;
    // Folders first, then alphabetically — the order a file manager uses.
    node.children.sort((a, b) => (a.dir === b.dir ? a.name.localeCompare(b.name) : a.dir ? -1 : 1));
    return { size, packed };
  };
  sum(root);

  return root;
}

// ---------------------------------------------------------------------------
// File System Access API
// ---------------------------------------------------------------------------

interface DirectoryHandle {
  getDirectoryHandle: (name: string, opts?: { create?: boolean }) => Promise<DirectoryHandle>;
  getFileHandle: (name: string, opts?: { create?: boolean }) => Promise<{
    createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }>;
  }>;
}

export function supportsDirectoryPicker(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

export async function pickDirectory(): Promise<DirectoryHandle | null> {
  const picker = (window as unknown as { showDirectoryPicker?: (o?: unknown) => Promise<DirectoryHandle> })
    .showDirectoryPicker;
  if (!picker) return null;
  try {
    return await picker({ mode: 'readwrite' });
  } catch {
    // The user dismissed the picker.
    return null;
  }
}

/** Writes one entry into the picked folder, creating the sub-folders it needs. */
export async function writeInto(root: DirectoryHandle, path: string, blob: Blob): Promise<void> {
  const parts = sanitizePath(path).split('/');
  const name = parts.pop();
  if (!name) return;
  let dir = root;
  for (const part of parts) dir = await dir.getDirectoryHandle(part, { create: true });
  const handle = await dir.getFileHandle(name, { create: true });
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
}
