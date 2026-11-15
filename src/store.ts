// The log, kept in the browser's local database (IndexedDB) on the iPad.
import type { Entry } from './log';

export type Store = {
  append(e: Entry): Promise<void>;
  all(): Promise<Entry[]>;
};

const DB = 'homework';
const LOG = 'log';

function req<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

export async function openStore(): Promise<Store> {
  const open = indexedDB.open(DB, 1);
  open.onupgradeneeded = () => {
    open.result.createObjectStore(LOG, { keyPath: 'id' });
  };
  const db = await req(open);
  return {
    async append(e) {
      const tx = db.transaction(LOG, 'readwrite');
      // add(), not put(): an existing entry can never be overwritten.
      tx.objectStore(LOG).add(e);
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    },
    async all() {
      const list = await req(db.transaction(LOG).objectStore(LOG).getAll() as IDBRequest<Entry[]>);
      return list.sort((x, y) => x.at.localeCompare(y.at));
    },
  };
}

/** Ask the iPad to never clear this app's data to free space. */
export async function requestPersistence(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}
