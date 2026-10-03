"use client";

import { useEffect } from "react";
import { useSupabaseSession } from "@/lib/supabase/useSupabaseSession";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useMemoryStore } from "@/app/state/memoryStore";
import {
    applyCloudSnapshot,
    canonicalizeCloudState,
    compareRevisions,
    createCloudStateFromLocal,
    createLocalSnapshotFromCloud,
    isApplyingCloudSnapshot,
    isValidRevision,
    readCloudSyncMetadata,
    summarizeLocalCloudState,
    validateCloudState,
    writeCloudSyncMetadata,
    type CloudSyncMetadata,
    type LocalStateSummary,
} from "@/app/state/cloudState";
import { SUPPORTED_BACKUP_KEYS } from "@/app/state/backup";
import {
    currentCloudSyncView,
    publishCloudSyncView,
    registerCloudSyncActions,
    type CloudRecord,
    type CloudSyncAction,
    type CloudSyncView,
} from "@/app/state/cloudSyncView";

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toCloudRecord(value: unknown): CloudRecord {
    if (!isRecord(value) || typeof value.userId !== "string" ||
        !Number.isInteger(value.schemaVersion) || !isValidRevision(value.revision) ||
        typeof value.createdAt !== "string" || typeof value.updatedAt !== "string" ||
        !validateCloudState(value.data) || value.schemaVersion !== value.data.schemaVersion) {
        throw new Error("The cloud returned a malformed app state. Local data was left unchanged.");
    }
    return value as CloudRecord;
}

async function fetchCloudRecord(): Promise<CloudRecord | null> {
    const response = await fetch("/api/user-app-state", { cache: "no-store" });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
        const message = isRecord(body) && isRecord(body.error) && typeof body.error.message === "string"
            ? body.error.message
            : `Cloud request failed (${response.status}).`;
        throw new CloudHttpError(message, response.status);
    }
    if (!isRecord(body) || !("record" in body)) {
        throw new Error("Cloud returned an invalid response.");
    }
    return body.record === null ? null : toCloudRecord(body.record);
}

async function saveCloudRecord(data: ReturnType<typeof createCloudStateFromLocal>, expectedRevision: number | string | null): Promise<CloudRecord> {
    const response = await fetch("/api/user-app-state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ data, expectedRevision }),
    });
    const body: unknown = await response.json().catch(() => null);
    if (response.status === 409) {
        throw new CloudConflictError("Your cloud data changed on another device.");
    }
    if (!response.ok) {
        const message = isRecord(body) && isRecord(body.error) && typeof body.error.message === "string"
            ? body.error.message
            : `Cloud save failed (${response.status}).`;
        throw new CloudHttpError(message, response.status);
    }
    if (!isRecord(body) || !("record" in body)) throw new Error("Cloud returned an invalid save response.");
    const saved = toCloudRecord(body.record);
    const expectedNextRevision = expectedRevision === null ? BigInt(1) : BigInt(expectedRevision) + BigInt(1);
    if (BigInt(saved.revision) !== expectedNextRevision ||
        canonicalizeCloudState(saved.data) !== canonicalizeCloudState(data)) {
        throw new Error("The cloud write could not be verified. Local data remains available.");
    }
    return saved;
}

class CloudConflictError extends Error {}
class CloudHttpError extends Error {
    constructor(message: string, readonly status: number) {
        super(message);
    }
}

async function fingerprintLocalState(): Promise<string> {
    const data = createCloudStateFromLocal();
    if (!globalThis.crypto?.subtle) throw new Error("This browser cannot safely verify local sync changes.");
    const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalizeCloudState(data)));
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function toRevision(value: number | string | null): string | null {
    return value === null ? null : String(value);
}

function metadataFor(
    userId: string,
    revision: number | string | null,
    fingerprint: string,
    options: Partial<CloudSyncMetadata> = {},
): CloudSyncMetadata {
    return {
        version: 1,
        userId,
        revision: toRevision(revision),
        lastSyncedAt: new Date().toISOString(),
        lastLocalChangedAt: options.lastLocalChangedAt ?? null,
        localFingerprint: fingerprint,
        pendingChanges: false,
        initialMigrationResolved: true,
    };
}

function isOfflineError(error: unknown): boolean {
    return typeof navigator !== "undefined" && !navigator.onLine ||
        (error instanceof CloudHttpError && error.status >= 500) ||
        (error instanceof TypeError && /fetch|network/i.test(error.message));
}

export function CloudSyncManager() {
    const { status, email } = useSupabaseSession();

    useEffect(() => {
        let active = true;
        let userId: string | null = null;
        let timer: number | undefined;
        let busy = false;
        let pausedForConflict = false;

        const setStatus = (next: Partial<CloudSyncView>) => {
            if (!active) return;
            publishCloudSyncView({ ...currentCloudSyncView, email, userId, ...next });
        };

        const showConflict = (cloud: CloudRecord | null, local: LocalStateSummary, message = "Your cloud data changed on another device.") => {
            pausedForConflict = true;
            setStatus({
                phase: "conflict",
                decision: null,
                cloud,
                local,
                revision: cloud ? toRevision(cloud.revision) : currentCloudSyncView.revision,
                pendingChanges: true,
                message,
                error: null,
            });
        };

        const restoreRecord = async (record: CloudRecord, local: LocalStateSummary) => {
            if (!userId || record.userId !== userId) throw new Error("The cloud row belongs to a different account.");
            const snapshot = createLocalSnapshotFromCloud(record.data);
            const fingerprint = await fingerprintLocalStateForSnapshot(record.data);
            const restoredLocal = summarizeLocalCloudState(record.data as ReturnType<typeof createCloudStateFromLocal>);
            const metadata = metadataFor(userId, record.revision, fingerprint, {
                lastLocalChangedAt: null,
            });
            await applyCloudSnapshot(snapshot, metadata);
            pausedForConflict = false;
            setStatus({
                phase: "synced",
                decision: null,
                cloud: record,
                local: { ...restoredLocal, lastChangedAt: local.lastChangedAt },
                revision: toRevision(record.revision),
                lastSyncedAt: metadata.lastSyncedAt,
                pendingChanges: false,
                message: "Cloud data restored to this device.",
                error: null,
            });
        };

        const fingerprintLocalStateForSnapshot = async (data: unknown): Promise<string> => {
            if (!globalThis.crypto?.subtle) throw new Error("This browser cannot safely verify local sync changes.");
            const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalizeCloudState(data)));
            return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
        };

        const initialize = async () => {
            setStatus({
                phase: "checking",
                decision: null,
                local: null,
                cloud: null,
                revision: null,
                lastSyncedAt: null,
                pendingChanges: false,
                error: null,
                message: null,
            });
            const supabase = getSupabaseBrowserClient();
            if (!supabase) {
                setStatus({ phase: "error", error: "Supabase browser client is unavailable." });
                return;
            }
            const { data, error: authError } = await supabase.auth.getUser();
            if (authError) throw authError;
            if (!data.user) {
                setStatus({ phase: "signed-out", userId: null });
                return;
            }
            userId = data.user.id;
            const [cloud, localState, fingerprint] = await Promise.all([
                fetchCloudRecord(),
                Promise.resolve(createCloudStateFromLocal()),
                fingerprintLocalState(),
            ]);
            if (!active) return;
            if (cloud && cloud.userId !== userId) throw new Error("The cloud response does not match the signed-in account.");
            const previous = readCloudSyncMetadata();
            const local = summarizeLocalCloudState(
                localState,
                previous?.userId === userId ? previous.lastLocalChangedAt : null,
            );
            const sameResolvedAccount = previous?.userId === userId && previous.initialMigrationResolved;

            if (sameResolvedAccount) {
                const localChanged = previous.localFingerprint !== null && fingerprint !== previous.localFingerprint;
                const pendingChanges = previous.pendingChanges || localChanged;
                const metadata = {
                    ...previous,
                    pendingChanges,
                    lastLocalChangedAt: localChanged ? new Date().toISOString() : previous.lastLocalChangedAt,
                };
                if (pendingChanges) writeCloudSyncMetadata(metadata);
                const remoteComparison = compareRevisions(cloud ? toRevision(cloud.revision) : null, previous.revision);
                const remoteChanged = remoteComparison !== 0;
                if (remoteChanged && pendingChanges) {
                    showConflict(cloud, { ...local, lastChangedAt: metadata.lastLocalChangedAt });
                    return;
                }
                if (remoteChanged && remoteComparison > 0 && cloud) {
                    await restoreRecord(cloud, local);
                    return;
                }
                if (remoteChanged) {
                    showConflict(null, local, "The cloud record was removed or rolled back on another device. Your local data is preserved.");
                    return;
                }
                setStatus({
                    phase: pendingChanges ? "ready" : "synced",
                    decision: null,
                    cloud,
                    local,
                    revision: toRevision(cloud?.revision ?? previous.revision),
                    lastSyncedAt: previous.lastSyncedAt,
                    pendingChanges,
                    message: pendingChanges ? "Local changes are waiting to sync." : "Cloud sync is active.",
                    error: null,
                });
                if (pendingChanges) scheduleSave();
                return;
            }

            const cloudHasData = cloud ? summarizeLocalCloudState(cloud.data as ReturnType<typeof createCloudStateFromLocal>).hasData : false;
            if (local.hasData && cloudHasData) {
                setStatus({ phase: "migration", decision: "both", cloud, local, revision: toRevision(cloud?.revision ?? null), message: "Data exists both on this device and in the cloud." });
            } else if (local.hasData) {
                setStatus({ phase: "migration", decision: "upload-local", cloud, local, revision: toRevision(cloud?.revision ?? null), message: "Your current device has Future Mindset Coach data, but your cloud account is empty." });
            } else if (cloudHasData && cloud) {
                setStatus({ phase: "migration", decision: "restore-cloud", cloud, local, revision: toRevision(cloud.revision), message: "Cloud data was found for your account." });
            } else {
                const metadata = metadataFor(userId, cloud?.revision ?? null, fingerprint);
                metadata.lastSyncedAt = cloud?.updatedAt ?? null;
                writeCloudSyncMetadata(metadata);
                setStatus({ phase: "synced", decision: null, cloud, local, revision: metadata.revision, lastSyncedAt: metadata.lastSyncedAt, pendingChanges: false, message: "Cloud sync ready." });
            }
        };

        const conflictFromCurrentCloud = async (local: LocalStateSummary) => {
            try {
                const latest = await fetchCloudRecord();
                showConflict(latest, local);
            } catch (error) {
                setStatus({ phase: isOfflineError(error) ? "offline" : "error", error: error instanceof Error ? error.message : "Unable to check cloud state." });
            }
        };

        const syncPending = async () => {
            if (!active || !userId || busy || pausedForConflict) return;
            busy = true;
            setStatus({ phase: "syncing", error: null, message: "Syncing changes…" });
            try {
                const metadata = readCloudSyncMetadata();
                if (!metadata || metadata.userId !== userId || !metadata.initialMigrationResolved) {
                    await initialize();
                    return;
                }
                if (!metadata.pendingChanges) {
                    await inspectRemote();
                    return;
                }
                const localState = createCloudStateFromLocal();
                const [fingerprint, cloud] = await Promise.all([fingerprintLocalState(), fetchCloudRecord()]);
                const local = summarizeLocalCloudState(localState, metadata.lastLocalChangedAt);
                if (cloud && cloud.userId !== userId) throw new Error("The cloud response does not match the signed-in account.");
                const cloudRevision = cloud ? toRevision(cloud.revision) : null;
                if (compareRevisions(cloudRevision, metadata.revision) !== 0) {
                    showConflict(cloud, local);
                    return;
                }
                const updated = await saveCloudRecord(localState, cloudRevision);
                if (updated.userId !== userId) throw new Error("The saved cloud row does not match the signed-in account.");
                const currentFingerprint = await fingerprintLocalState();
                const stillChanged = currentFingerprint !== fingerprint;
                const nextMetadata = {
                    ...metadataFor(userId, updated.revision, fingerprint, {
                        lastLocalChangedAt: stillChanged ? new Date().toISOString() : metadata.lastLocalChangedAt,
                    }),
                    pendingChanges: stillChanged,
                };
                writeCloudSyncMetadata(nextMetadata);
                pausedForConflict = false;
                setStatus({
                    phase: "synced",
                    decision: null,
                    cloud: updated,
                    local,
                    revision: toRevision(updated.revision),
                    lastSyncedAt: nextMetadata.lastSyncedAt,
                    pendingChanges: stillChanged,
                    message: stillChanged ? "Newer local changes are waiting to sync." : "Synced.",
                    error: null,
                });
                if (stillChanged) scheduleSave();
            } catch (error) {
                if (error instanceof CloudConflictError) {
                    await conflictFromCurrentCloud(currentCloudSyncView.local ?? summarizeLocalCloudState());
                } else if (isOfflineError(error)) {
                    setStatus({ phase: "offline", pendingChanges: true, message: "Offline — changes saved on this device.", error: null });
                } else {
                    setStatus({ phase: "error", pendingChanges: true, error: error instanceof Error ? error.message : "Cloud sync failed." });
                }
            } finally {
                busy = false;
                const latestMetadata = readCloudSyncMetadata();
                if (active && !pausedForConflict && currentCloudSyncView.phase === "synced" &&
                    latestMetadata?.userId === userId && latestMetadata.pendingChanges) {
                    scheduleSave();
                }
            }
        };

        const scheduleSave = () => {
            if (timer !== undefined) window.clearTimeout(timer);
            timer = window.setTimeout(() => {
                timer = undefined;
                void syncPending();
            }, 1500);
        };

        const onLocalMutation = () => {
            if (!active || isApplyingCloudSnapshot() || !userId) return;
            const metadata = readCloudSyncMetadata();
            if (!metadata || metadata.userId !== userId || !metadata.initialMigrationResolved) return;
            const changedAt = new Date().toISOString();
            try {
                writeCloudSyncMetadata({ ...metadata, pendingChanges: true, lastLocalChangedAt: changedAt });
                setStatus({
                    pendingChanges: true,
                    local: currentCloudSyncView.local ? { ...currentCloudSyncView.local, lastChangedAt: changedAt } : currentCloudSyncView.local,
                    message: "Local changes are waiting to sync.",
                });
                if (navigator.onLine && !pausedForConflict) scheduleSave();
                else setStatus({ phase: "offline", pendingChanges: true, message: "Offline — changes saved on this device." });
            } catch (error) {
                setStatus({ phase: "error", error: error instanceof Error ? error.message : "Unable to save sync status locally." });
            }
        };

        const inspectRemote = async () => {
            if (!active || !userId || pausedForConflict) return;
            const metadata = readCloudSyncMetadata();
            if (!metadata || metadata.userId !== userId || !metadata.initialMigrationResolved) {
                await initialize();
                return;
            }
            try {
                const cloud = await fetchCloudRecord();
                if (cloud && cloud.userId !== userId) throw new Error("The cloud response does not match the signed-in account.");
                const localState = createCloudStateFromLocal();
                const local = summarizeLocalCloudState(localState, metadata.lastLocalChangedAt);
                const fingerprint = await fingerprintLocalState();
                const localDirty = metadata.pendingChanges || (metadata.localFingerprint !== null && metadata.localFingerprint !== fingerprint);
                const remoteComparison = compareRevisions(cloud ? toRevision(cloud.revision) : null, metadata.revision);
                const remoteChanged = remoteComparison !== 0;
                if (remoteChanged && localDirty) {
                    showConflict(cloud, local);
                } else if (remoteChanged && remoteComparison > 0 && cloud) {
                    await restoreRecord(cloud, local);
                } else if (remoteChanged) {
                    showConflict(null, local, "The cloud record was removed or rolled back on another device. Your local data is preserved.");
                } else if (localDirty) {
                    if (!metadata.pendingChanges) {
                        writeCloudSyncMetadata({ ...metadata, pendingChanges: true, lastLocalChangedAt: new Date().toISOString() });
                    }
                    scheduleSave();
                } else {
                    setStatus({
                        phase: "synced",
                        cloud,
                        local,
                        revision: toRevision(cloud?.revision ?? metadata.revision),
                        lastSyncedAt: metadata.lastSyncedAt,
                        pendingChanges: false,
                        message: "Cloud sync is up to date.",
                        error: null,
                    });
                }
            } catch (error) {
                setStatus({
                    phase: isOfflineError(error) ? "offline" : "error",
                    pendingChanges: readCloudSyncMetadata()?.pendingChanges ?? currentCloudSyncView.pendingChanges,
                    message: isOfflineError(error) ? "Offline — changes saved on this device." : null,
                    error: isOfflineError(error) ? null : error instanceof Error ? error.message : "Unable to check cloud state.",
                });
            }
        };

        const performAction = async (action: CloudSyncAction) => {
            if (!active || !userId) return;
            if (action === "cancel") {
                if (currentCloudSyncView.phase === "conflict") {
                    pausedForConflict = true;
                    setStatus({ phase: "ready", decision: null, message: "Sync paused. Your local data is preserved.", error: null });
                } else {
                    setStatus({ phase: "ready", decision: null, message: "Sync setup paused. Your data remains on this device.", error: null });
                }
                return;
            }
            if (action === "sync") {
                pausedForConflict = false;
                if (timer !== undefined) {
                    window.clearTimeout(timer);
                    timer = undefined;
                }
                const metadata = readCloudSyncMetadata();
                if (!metadata || metadata.userId !== userId || !metadata.initialMigrationResolved) {
                    await initialize();
                    return;
                }
                if (metadata.pendingChanges) await syncPending();
                else await inspectRemote();
                return;
            }
            if (action === "load-latest" || action === "use-cloud" || action === "restore-cloud") {
                const decisionCloud = currentCloudSyncView.cloud;
                if (!decisionCloud) {
                    setStatus({ phase: "error", error: "No cloud data is available to restore." });
                    return;
                }
                try {
                    const latest = await fetchCloudRecord();
                    const localState = createCloudStateFromLocal();
                    const storedMetadata = readCloudSyncMetadata();
                    const local = summarizeLocalCloudState(
                        localState,
                        storedMetadata?.userId === userId ? storedMetadata.lastLocalChangedAt : null,
                    );
                    if (!latest) {
                        setStatus({ phase: "error", error: "No cloud data is available to restore." });
                        return;
                    }
                    if (action !== "load-latest" && compareRevisions(latest.revision, decisionCloud.revision) !== 0) {
                        showConflict(latest, local);
                        return;
                    }
                    await restoreRecord(latest, local);
                } catch (error) {
                    setStatus({
                        phase: isOfflineError(error) ? "offline" : "error",
                        error: error instanceof Error ? error.message : "Cloud restore failed.",
                    });
                }
                return;
            }
            if (action === "upload-local") {
                try {
                    const currentCloud = await fetchCloudRecord();
                    const expectedRevision = currentCloudSyncView.cloud ? toRevision(currentCloudSyncView.cloud.revision) : null;
                    if ((currentCloud ? toRevision(currentCloud.revision) : null) !== expectedRevision) {
                        showConflict(currentCloud, currentCloudSyncView.local ?? summarizeLocalCloudState());
                        return;
                    }
                    const localState = createCloudStateFromLocal();
                    const fingerprint = await fingerprintLocalState();
                    const storedMetadata = readCloudSyncMetadata();
                    const local = summarizeLocalCloudState(
                        localState,
                        storedMetadata?.userId === userId ? storedMetadata.lastLocalChangedAt : null,
                    );
                    const saved = await saveCloudRecord(localState, expectedRevision);
                    if (saved.userId !== userId) throw new Error("The saved cloud row does not match the signed-in account.");
                    const currentFingerprint = await fingerprintLocalState();
                    const stillChanged = currentFingerprint !== fingerprint;
                    const metadata = {
                        ...metadataFor(userId, saved.revision, fingerprint, {
                            lastLocalChangedAt: stillChanged ? new Date().toISOString() : null,
                        }),
                        pendingChanges: stillChanged,
                    };
                    writeCloudSyncMetadata(metadata);
                    pausedForConflict = false;
                    setStatus({
                        phase: "synced", decision: null, cloud: saved, local,
                        revision: toRevision(saved.revision), lastSyncedAt: metadata.lastSyncedAt,
                        pendingChanges: stillChanged, message: stillChanged ? "Uploaded. Newer local changes are waiting to sync." : "This device was uploaded to the cloud.", error: null,
                    });
                    if (stillChanged) scheduleSave();
                } catch (error) {
                    if (error instanceof CloudConflictError) {
                        await conflictFromCurrentCloud(currentCloudSyncView.local ?? summarizeLocalCloudState());
                    } else {
                        setStatus({
                            phase: isOfflineError(error) ? "offline" : "error",
                            error: isOfflineError(error) ? null : error instanceof Error ? error.message : "Upload failed.",
                            message: isOfflineError(error) ? "Offline — your local data is unchanged." : null,
                        });
                    }
                }
            }
        };

        if (status === "signed-out" || status === "not-configured") {
            publishCloudSyncView({
                phase: status === "signed-out" ? "signed-out" : "idle",
                email,
                userId: null,
                decision: null,
                local: null,
                cloud: null,
                revision: null,
                lastSyncedAt: null,
                pendingChanges: false,
                message: null,
                error: null,
            });
            return () => {
                active = false;
            };
        }
        if (status !== "signed-in") {
            publishCloudSyncView({ ...currentCloudSyncView, phase: status === "error" ? "error" : "checking", email });
            return () => {
                active = false;
            };
        }

        const unregisterActions = registerCloudSyncActions((action) => performAction(action));
        const storageListener = (event: StorageEvent) => {
            if (event.key === null) {
                pausedForConflict = true;
                const local = summarizeLocalCloudState();
                showConflict(
                    currentCloudSyncView.cloud,
                    local,
                    "Browser storage was cleared in another tab. Cloud data has not been changed.",
                );
                return;
            }
            if (SUPPORTED_BACKUP_KEYS.includes(event.key as (typeof SUPPORTED_BACKUP_KEYS)[number])) onLocalMutation();
        };
        const customStorageListener = () => onLocalMutation();
        const focusListener = () => void inspectRemote();
        const onlineListener = () => {
            pausedForConflict = false;
            void inspectRemote();
        };
        window.addEventListener("storage", storageListener);
        window.addEventListener("mindset-store-update", customStorageListener);
        window.addEventListener("focus", focusListener);
        window.addEventListener("online", onlineListener);
        const unsubscribeMemory = useMemoryStore.subscribe(() => onLocalMutation());

        void initialize().catch((error: unknown) => {
            setStatus({
                phase: isOfflineError(error) ? "offline" : "error",
                message: isOfflineError(error) ? "Offline — changes saved on this device." : null,
                error: isOfflineError(error) ? null : error instanceof Error ? error.message : "Unable to initialize cloud sync.",
            });
        });

        return () => {
            active = false;
            if (timer !== undefined) window.clearTimeout(timer);
            window.removeEventListener("storage", storageListener);
            window.removeEventListener("mindset-store-update", customStorageListener);
            window.removeEventListener("focus", focusListener);
            window.removeEventListener("online", onlineListener);
            unsubscribeMemory();
            unregisterActions?.();
        };
    }, [email, status]);

    return null;
}
