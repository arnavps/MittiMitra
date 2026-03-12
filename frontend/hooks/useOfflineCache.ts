import { useEffect, useState } from 'react';
import { openDB } from 'idb';

const DB_NAME = 'mittimitra_db';
const STORE_NAME = 'routes';

export function useOfflineCache(key: string, initialData: any = null) {
    const [isOnline, setIsOnline] = useState(true);
    const [syncQueue, setSyncQueue] = useState<any[]>([]);
    const [cachedData, setCachedData] = useState<any>(initialData);

    // Initialize IDB
    const initDB = async () => {
        return openDB(DB_NAME, 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            },
        });
    };

    // Offline Math Helper
    const calculateOfflineSpoilage = (base_q10: number, current_temp: number, target_temp: number, duration_hours: number) => {
        const q10_factor = 2.5;
        const accelerated_rate = base_q10 * Math.pow(q10_factor, (current_temp - target_temp) / 10.0);
        return Math.min(accelerated_rate * duration_hours * 100, 100); // return as percentage
    };

    useEffect(() => {
        // Initial check
        if (typeof window !== 'undefined') {
            setIsOnline(navigator.onLine);

            // Load from local storage
            const localData = localStorage.getItem(key);
            if (localData) {
                try {
                    setCachedData(JSON.parse(localData));
                } catch (e) {
                    console.error("Failed to parse cached data", e);
                }
            }

            const localQueue = localStorage.getItem('krishi_sync_queue');
            if (localQueue) {
                try {
                    setSyncQueue(JSON.parse(localQueue));
                } catch (e) { }
            }

            const handleOnline = () => {
                setIsOnline(true);
                processSyncQueue();
            };

            const handleOffline = () => setIsOnline(false);

            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);

            return () => {
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
            };
        }
    }, [key]);

    const saveToCache = (data: any) => {
        setCachedData(data);
        localStorage.setItem(key, JSON.stringify(data));
    };

    const saveRouteToIDB = async (routeId: string, routeData: any) => {
        try {
            const db = await initDB();
            await db.put(STORE_NAME, routeData, routeId);
        } catch (e) {
            console.error("Failed to save route to IDB", e);
        }
    };

    const getRouteFromIDB = async (routeId: string) => {
        try {
            const db = await initDB();
            return await db.get(STORE_NAME, routeId);
        } catch (e) {
            console.error("Failed to get route from IDB", e);
            return null;
        }
    };

    const addToSyncQueue = (action: any) => {
        const newQueue = [...syncQueue, { ...action, timestamp: Date.now() }];
        setSyncQueue(newQueue);
        localStorage.setItem('krishi_sync_queue', JSON.stringify(newQueue));
    };

    const processSyncQueue = async () => {
        if (typeof window === 'undefined') return;
        const queue = JSON.parse(localStorage.getItem('krishi_sync_queue') || '[]');
        if (queue.length === 0) return;

        console.log("Processing background sync queue:", queue);
        localStorage.removeItem('krishi_sync_queue');
        setSyncQueue([]);
    };

    return { 
        isOnline, 
        cachedData, 
        saveToCache, 
        addToSyncQueue, 
        syncQueueLength: syncQueue.length, 
        calculateOfflineSpoilage,
        saveRouteToIDB,
        getRouteFromIDB
    };
}
