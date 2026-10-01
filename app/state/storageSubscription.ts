"use client";

import { useSyncExternalStore } from "react";

export const SERVER_STORAGE_SNAPSHOT = "__server_storage_snapshot__";

function subscribeToStorageUpdates(onStoreChange: () => void): () => void {
    if (typeof window === "undefined") {
        return () => undefined;
    }

    window.addEventListener("mindset-store-update", onStoreChange);
    window.addEventListener("storage", onStoreChange);
    return () => {
        window.removeEventListener("mindset-store-update", onStoreChange);
        window.removeEventListener("storage", onStoreChange);
    };
}

function getStorageSnapshot(keys: readonly string[]): string {
    try {
        return JSON.stringify(keys.map((key) => [key, window.localStorage.getItem(key)]));
    } catch {
        return "__storage_unavailable__";
    }
}

export function useStorageSnapshot(keys: readonly string[]): string {
    return useSyncExternalStore(
        subscribeToStorageUpdates,
        () => getStorageSnapshot(keys),
        () => SERVER_STORAGE_SNAPSHOT,
    );
}

export function getStorageValueFromSnapshot(snapshot: string, key: string): string | null {
    if (snapshot === SERVER_STORAGE_SNAPSHOT) {
        return null;
    }

    try {
        const entries = JSON.parse(snapshot) as Array<[string, string | null]>;
        return entries.find(([snapshotKey]) => snapshotKey === key)?.[1] ?? null;
    } catch {
        return null;
    }
}

function subscribeToLocationSearch(onStoreChange: () => void): () => void {
    if (typeof window === "undefined") {
        return () => undefined;
    }

    window.addEventListener("popstate", onStoreChange);
    return () => window.removeEventListener("popstate", onStoreChange);
}

export function useLocationSearchSnapshot(): string {
    return useSyncExternalStore(subscribeToLocationSearch, () => window.location.search, () => "");
}

function getBrowserDateKey(): string {
    const date = new Date();
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function subscribeToBrowserDate(onStoreChange: () => void): () => void {
    if (typeof window === "undefined") {
        return () => undefined;
    }

    const notifyOnResume = () => onStoreChange();
    window.addEventListener("focus", notifyOnResume);
    document.addEventListener("visibilitychange", notifyOnResume);

    return () => {
        window.removeEventListener("focus", notifyOnResume);
        document.removeEventListener("visibilitychange", notifyOnResume);
    };
}

export function useBrowserDateKey(): string {
    return useSyncExternalStore(subscribeToBrowserDate, getBrowserDateKey, () => "");
}
