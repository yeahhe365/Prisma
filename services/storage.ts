/**
 * Simple IndexedDB wrapper for chat sessions storage.
 * Replaces localStorage to handle larger data (base64 attachments).
 */

const DB_NAME = 'prisma-sessions';
const DB_VERSION = 2;
const STORE_NAME = 'sessions';
const GROUPS_STORE_NAME = 'groups';
const MAX_SESSIONS = 50;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(GROUPS_STORE_NAME)) {
        db.createObjectStore(GROUPS_STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => db.close();
  });
}

async function getFromStore<T>(storeName: string, id: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => db.close();
  });
}

async function putInStore<T extends { id: string }>(storeName: string, value: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.put(value);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

async function deleteFromStore(storeName: string, id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.delete(id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function getAllSessions<T>(): Promise<T[]> {
  return getAllFromStore<T>(STORE_NAME);
}

export async function getSession<T>(id: string): Promise<T | undefined> {
  return getFromStore<T>(STORE_NAME, id);
}

export async function putSession<T extends { id: string }>(session: T): Promise<void> {
  return putInStore(STORE_NAME, session);
}

export async function deleteSession(id: string): Promise<void> {
  return deleteFromStore(STORE_NAME, id);
}

export async function getAllGroups<T>(): Promise<T[]> {
  return getAllFromStore<T>(GROUPS_STORE_NAME);
}

export async function putGroup<T extends { id: string }>(group: T): Promise<void> {
  return putInStore(GROUPS_STORE_NAME, group);
}

export async function deleteGroup(id: string): Promise<void> {
  return deleteFromStore(GROUPS_STORE_NAME, id);
}

/**
 * Auto-cleanup: remove oldest sessions if count exceeds MAX_SESSIONS.
 */
export async function autoCleanup(): Promise<void> {
  const sessions = await getAllSessions<{ id: string; createdAt: number }>();
  if (sessions.length <= MAX_SESSIONS) return;

  // Sort by createdAt ascending, delete oldest
  const sorted = sessions.sort((a, b) => a.createdAt - b.createdAt);
  const toDelete = sorted.slice(0, sorted.length - MAX_SESSIONS);

  for (const session of toDelete) {
    await deleteSession(session.id);
  }
}

/**
 * Migrate sessions from localStorage to IndexedDB (one-time).
 */
export async function migrateFromLocalStorage(): Promise<void> {
  const MIGRATION_KEY = 'prisma-sessions-migrated';
  if (localStorage.getItem(MIGRATION_KEY)) return;

  const legacyData =
    localStorage.getItem('prisma-sessions') || localStorage.getItem('deepthink-sessions');
  if (!legacyData) {
    localStorage.setItem(MIGRATION_KEY, 'true');
    return;
  }

  try {
    const sessions = JSON.parse(legacyData);
    if (Array.isArray(sessions) && sessions.length > 0) {
      for (const session of sessions) {
        await putSession(session);
      }
    }
    localStorage.removeItem('prisma-sessions');
    localStorage.removeItem('deepthink-sessions');
  } catch (e) {
    console.warn('[Storage] Migration failed:', e);
  }

  localStorage.setItem(MIGRATION_KEY, 'true');
}
