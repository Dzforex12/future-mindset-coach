const FALLBACK_STORAGE = new Map<string, string>();
let isDispatchingStorageUpdate = false;

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function getStorage(): StorageLike | null {
    if (typeof window !== "undefined") {
        try {
            return window.localStorage;
        } catch {
            return null;
        }
    }

    return {
        getItem: (key: string) => FALLBACK_STORAGE.get(key) ?? null,
        setItem: (key: string, value: string) => {
            FALLBACK_STORAGE.set(key, value);
        },
        removeItem: (key: string) => {
            FALLBACK_STORAGE.delete(key);
        },
    };
}

export function readStorageJson<T>(key: string, fallback: T): T {
    const storage = getStorage();
    if (!storage) {
        return fallback;
    }

    try {
        const rawValue = storage.getItem(key);
        if (!rawValue) {
            return fallback;
        }

        return JSON.parse(rawValue) as T;
    } catch {
        return fallback;
    }
}

export function writeStorageJson<T>(key: string, value: T): T {
    const storage = getStorage();
    if (!storage) {
        return value;
    }

    try {
        storage.setItem(key, JSON.stringify(value));
    } catch {
        // Ignore storage quota or browser privacy errors and keep the in-memory value.
    }

    if (!isDispatchingStorageUpdate && typeof window !== "undefined") {
        isDispatchingStorageUpdate = true;
        try {
            window.dispatchEvent(new Event("mindset-store-update"));
        } finally {
            isDispatchingStorageUpdate = false;
        }
    }

    return value;
}

export function removeStorageKey(key: string): void {
    const storage = getStorage();
    if (!storage) {
        return;
    }

    storage.removeItem(key);

    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("mindset-store-update"));
    }
}
