import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'MittiMitra_Community';
const STORE_NAME = 'posts_drafts';

export interface CommunityDraft {
    id: string;
    title: string;
    text_content: string;
    voice_blob?: Blob;
    timestamp: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

const getDB = () => {
    if (typeof window === 'undefined') return null;
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            },
        });
    }
    return dbPromise;
};

export const saveDraft = async (draft: CommunityDraft) => {
    const db = await getDB();
    if (!db) return;
    await db.put(STORE_NAME, draft);
};

export const getDrafts = async (): Promise<CommunityDraft[]> => {
    const db = await getDB();
    if (!db) return [];
    return await db.getAll(STORE_NAME);
};

export const deleteDraft = async (id: string) => {
    const db = await getDB();
    if (!db) return;
    await db.delete(STORE_NAME, id);
};

export const storePostsLocally = async (posts: any[]) => {
    const db = await getDB();
    if (!db) return;
    const tx = db.transaction('posts_cache', 'readwrite');
    // For simplicity, we'll just use another store or cache manually
};
