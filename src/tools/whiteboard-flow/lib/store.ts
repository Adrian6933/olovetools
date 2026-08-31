import type { BoardDoc } from '../types';

// ============================================================================
// Board persistence
// ----------------------------------------------------------------------------
// IndexedDB rather than localStorage: a board can hold pasted screenshots, and
// a single 1080p PNG base64-encoded already blows past the 5 MB localStorage
// quota. IndexedDB stores the Blob itself, so nothing is re-encoded.
// ============================================================================

const DB_NAME = 'olovetools-whiteboard';
const STORE = 'boards';
const KEY = 'current';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    db =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = run(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        t.oncomplete = () => db.close();
      })
  );
}

/** The stored shape: the document minus anything that cannot be cloned. */
interface Stored {
  version: 2;
  layout: BoardDoc['layout'];
  nodes: BoardDoc['nodes'];
  edges: BoardDoc['edges'];
  viewport: BoardDoc['viewport'];
}

export async function saveBoard(doc: BoardDoc): Promise<void> {
  try {
    const payload: Stored = {
      version: 2,
      layout: doc.layout,
      nodes: doc.nodes,
      edges: doc.edges,
      viewport: doc.viewport,
    };
    await tx('readwrite', s => s.put(payload, KEY));
  } catch {
    // Private-mode Safari and hardened browsers refuse IndexedDB. The board
    // still works for the session; it just will not come back on reload.
  }
}

export async function loadBoard(): Promise<BoardDoc | null> {
  try {
    const stored = (await tx<Stored | undefined>('readonly', s => s.get(KEY))) as Stored | undefined;
    if (!stored || !Array.isArray(stored.nodes) || stored.nodes.length === 0) return null;
    return {
      version: 2,
      layout: stored.layout === 'free' ? 'free' : 'kanban',
      nodes: stored.nodes,
      edges: Array.isArray(stored.edges) ? stored.edges : [],
      viewport: stored.viewport || { x: 0, y: 0, scale: 1 },
    };
  } catch {
    return null;
  }
}

export async function clearBoard(): Promise<void> {
  try {
    await tx('readwrite', s => s.delete(KEY));
  } catch {
    // Nothing to clear if the database was never reachable.
  }
}
