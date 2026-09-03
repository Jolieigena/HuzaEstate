// Browser-based file & photo upload storage service using IndexedDB with fallback

const DB_NAME = "huzaestate_execution_files_db";
const STORE_NAME = "files";
const DB_VERSION = 1;

export interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  uploadedAt: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e: IDBVersionChangeEvent) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

export const ExecutionFileStorageService = {
  async saveFile(file: File): Promise<StoredFile> {
    const id = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const record: StoredFile = {
          id,
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl,
          uploadedAt: new Date().toISOString(),
        };

        try {
          const db = await openDB();
          const tx = db.transaction(STORE_NAME, "readwrite");
          const store = tx.objectStore(STORE_NAME);
          store.put(record);
          tx.oncomplete = () => resolve(record);
          tx.onerror = () => resolve(record); // Fallback return even if IDB store fails
        } catch {
          resolve(record); // Fallback: return dataUrl record directly
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  },

  async getFile(id: string): Promise<StoredFile | null> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);
        req.onsuccess = () => resolve((req.result as StoredFile) || null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  },
};
