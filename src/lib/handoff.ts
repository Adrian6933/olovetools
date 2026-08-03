// ============================================================================
// Cross-tool handoff
// ----------------------------------------------------------------------------
// Lets one tool pass its result straight into another ("remove the background →
// now compress it") without a round trip through the user's Downloads folder.
//
// The file is parked in IndexedDB (Blobs survive there; sessionStorage would
// need a base64 copy and blows past its quota on real photos) and the target
// page is opened with `?handoff=1`. The record is consumed exactly once.
// ============================================================================

const DB_NAME = 'olovetools-handoff';
const STORE = 'files';
const KEY = 'pending';
/** Anything older than this is a leftover from an abandoned navigation. */
const MAX_AGE_MS = 5 * 60 * 1000;

export interface HandoffRecord {
  blob: Blob;
  name: string;
  /** Slug of the tool that produced the file. */
  from: string;
  createdAt: number;
}

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

/** Parks a file for the next tool. Resolves before navigation. */
export async function putHandoff(blob: Blob, name: string, from: string): Promise<void> {
  const record: HandoffRecord = { blob, name, from, createdAt: Date.now() };
  await tx('readwrite', s => s.put(record, KEY));
}

/**
 * Reads and clears the pending file. Returns null when there is nothing waiting
 * (or when it is stale), so callers can always run it unconditionally.
 */
export async function takeHandoff(): Promise<{ file: File; from: string } | null> {
  try {
    const record = (await tx<HandoffRecord | undefined>('readonly', s => s.get(KEY))) as
      | HandoffRecord
      | undefined;
    await tx('readwrite', s => s.delete(KEY));
    if (!record?.blob) return null;
    if (Date.now() - record.createdAt > MAX_AGE_MS) return null;
    const file = new File([record.blob], record.name, {
      type: record.blob.type || 'image/png',
      lastModified: Date.now(),
    });
    return { file, from: record.from };
  } catch {
    // Private-mode Safari and hardened browsers can refuse IndexedDB entirely.
    return null;
  }
}

/** True when the current URL was opened by a handoff navigation. */
export function hasPendingHandoff(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('handoff') === '1';
}

/** Saves the file and navigates to the target tool in the current language. */
export async function sendToTool(
  targetSlug: string,
  lang: string,
  blob: Blob,
  name: string,
  from: string
): Promise<void> {
  try {
    await putHandoff(blob, name, from);
    window.location.href = `/${lang.toLowerCase()}/${targetSlug}/?handoff=1`;
  } catch {
    // Without storage we still send the user there; they can re-upload.
    window.location.href = `/${lang.toLowerCase()}/${targetSlug}/`;
  }
}
