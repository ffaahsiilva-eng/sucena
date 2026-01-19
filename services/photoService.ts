
const DB_NAME = 'PainelSucena_Photos';
const STORE_NAME = 'photos';
const DB_VERSION = 1;

export interface PhotoRecord {
  id: string;
  data: string; // Base64 string
  name: string;
  createdAt: string;
  createdBy?: string; // Username
  authorName?: string; // Nome Completo
  authorRole?: string; // Cargo
  category?: string; // Nova categoria para filtrar origem (ex: EVIDENCE, GENERAL)
  relatedRecordId?: string; // ID do registro pai (ex: ID do DDS, ID da Vistoria)
}

export const PhotoService = {
  async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  },

  async savePhoto(
      file: File, 
      createdBy: string = 'Sistema', 
      authorName: string = 'Sistema', 
      authorRole: string = 'Automático', 
      category: string = 'GENERAL',
      relatedRecordId?: string
    ): Promise<string> {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const db = await this.openDB();
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    const record: PhotoRecord = {
      id,
      data: base64,
      name: file.name,
      createdAt: new Date().toISOString(),
      createdBy,
      authorName,
      authorRole,
      category,
      relatedRecordId
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.add(record);

      request.onsuccess = () => resolve(base64); // Retorna o base64 para uso imediato
      request.onerror = () => reject(request.error);
    });
  },

  async deletePhoto(id: string): Promise<void> {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const request = store.delete(id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
      });
  },

  async getPhoto(id: string): Promise<PhotoRecord | undefined> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getAllPhotos(): Promise<PhotoRecord[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => {
        // Ordenar do mais recente para o mais antigo
        const results = request.result as PhotoRecord[];
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  },

  async getPhotosByRelatedId(relatedId: string): Promise<PhotoRecord[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const results = request.result as PhotoRecord[];
        // Filtra na memória (idealmente seria um índice, mas para simplificar mantemos assim)
        const filtered = results.filter(p => p.relatedRecordId === relatedId);
        resolve(filtered);
      };
      request.onerror = () => reject(request.error);
    });
  }
};
