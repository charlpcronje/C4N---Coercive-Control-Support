import { AppData, Note, Resource } from '../types';

const DB_NAME = 'NADE_DB';
const DB_VERSION = 1;
const STORES = {
  DATA: 'data',
  NOTES: 'notes',
  RESOURCES: 'videos', // Keeping 'videos' name for backward compatibility with original
  SETTINGS: 'settings'
};

export class StorageService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORES.DATA)) {
          db.createObjectStore(STORES.DATA);
        }
        if (!db.objectStoreNames.contains(STORES.NOTES)) {
          const store = db.createObjectStore(STORES.NOTES, { keyPath: 'id', autoIncrement: true });
          store.createIndex('sectionKey', 'sectionKey', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.RESOURCES)) {
          const store = db.createObjectStore(STORES.RESOURCES, { keyPath: 'id', autoIncrement: true });
          store.createIndex('sectionKey', 'sectionKey', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS);
        }
      };
    });
  }

  private getStore(storeName: string, mode: IDBTransactionMode): IDBObjectStore {
    if (!this.db) throw new Error('Database not initialized');
    const tx = this.db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  }

  async getAppData(): Promise<AppData | null> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.DATA, 'readonly');
      const request = store.get('appData');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveAppData(data: AppData): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.DATA, 'readwrite');
      const request = store.put(data, 'appData');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getDataHash(): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.DATA, 'readonly');
      const request = store.get('dataHash');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveDataHash(hash: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.DATA, 'readwrite');
      const request = store.put(hash, 'dataHash');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getNotes(sectionKey: string): Promise<Note[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.NOTES, 'readonly');
      const index = store.index('sectionKey');
      const request = index.getAll(sectionKey);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getNotesByItem(itemRef: string): Promise<Note[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.NOTES, 'readonly');
      const request = store.getAll();
      request.onsuccess = () => {
        const allNotes = request.result as Note[];
        const filtered = allNotes.filter(note => note.itemRef === itemRef);
        resolve(filtered);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllNotes(): Promise<Note[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.NOTES, 'readonly');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async addNote(note: Note): Promise<number> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.NOTES, 'readwrite');
      const request = store.add(note);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteNote(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.NOTES, 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getResources(sectionKey: string): Promise<Resource[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.RESOURCES, 'readonly');
      const index = store.index('sectionKey');
      const request = index.getAll(sectionKey);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async addResource(resource: Resource): Promise<number> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.RESOURCES, 'readwrite');
      const request = store.add(resource);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteResource(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(STORES.RESOURCES, 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async exportData(): Promise<string> {
    const appData = await this.getAppData();
    const allNotes = await this.getAll(STORES.NOTES);
    const allResources = await this.getAll(STORES.RESOURCES);
    
    return JSON.stringify({
      data: appData,
      notes: allNotes,
      videos: allResources,
      exported: new Date().toISOString()
    }, null, 2);
  }

  private async getAll(storeName: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readonly');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export const dbService = new StorageService();