"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { LogOut, RefreshCw } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useSupabaseSession } from "@/lib/supabase/useSupabaseSession";
import {
    getCloudSyncServerSnapshot,
    getCloudSyncSnapshot,
    performCloudSyncAction,
    subscribeCloudSync,
} from "@/app/state/cloudSyncView";
import {
    summarizeLocalCloudState,
    validateCloudState,
} from "@/app/state/cloudState";

function formatDate(value: string | null | undefined): string {
    if (!value) return "Not available";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleString();
}

export function CloudSyncStatus() {
    const session = useSupabaseSession();
    const sync = useSyncExternalStore(subscribeCloudSync, getCloudSyncSnapshot, getCloudSyncServerSnapshot);
    const [actionError, setActionError] = useState<string | null>(null);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const isBusy = sync.phase === "checking" || sync.phase === "syncing";

    const signOut = async () => {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) {
            setActionError("Cloud is not configured.");
            return;
        }
        setIsSigningOut(true);
        setActionError(null);
        try {
            const { error } = await supabase.auth.signOut();
            if (error) setActionError(error.message);
        } catch (error: unknown) {
            setActionError(error instanceof Error ? error.message : "Unable to sign out.");
        } finally {
            setIsSigningOut(false);
        }
    };

    const run = async (action: Parameters<typeof performCloudSyncAction>[0]) => {
        setActionError(null);
        try {
            await performCloudSyncAction(action);
        } catch (error: unknown) {
            setActionError(error instanceof Error ? error.message : "Cloud sync action failed.");
        }
    };

    const statusText = !session.configured
        ? "Not configured"
        : session.status === "loading" || sync.phase === "checking"
            ? "Checking account…"
            : session.status === "signed-out" || sync.phase === "signed-out"
                ? "Signed out"
                : sync.phase === "syncing"
                    ? "Syncing…"
                    : sync.phase === "synced"
                    ? sync.message === "Cloud sync ready." ? "Cloud ready" : "Synced"
                        : sync.phase === "offline"
                            ? "Offline"
                            : sync.phase === "conflict"
                                ? "Conflict"
                                : sync.phase === "error" || session.status === "error"
                                    ? "Sync error"
                                    : sync.phase === "migration"
                                        ? "Action needed"
                                        : sync.phase === "ready"
                                            ? "Cloud ready"
                                            : "Cloud ready";

    const showMigration = session.status === "signed-in" && sync.phase === "migration" && sync.decision;
    const showConflict = session.status === "signed-in" && sync.phase === "conflict";
    const showAccountControls = session.status === "signed-in" || Boolean(sync.userId);
    const cloudSummary = sync.cloud && validateCloudState(sync.cloud.data)
        ? summarizeLocalCloudState(sync.cloud.data)
        : null;

    return (
        <section className="rounded-2xl border border-slate-800/90 bg-slate-900/65 p-4 shadow-[0_10px_28px_rgba(2,6,23,0.14)] sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <h2 className="text-base font-semibold text-white sm:text-lg">Cloud Sync</h2>
                    <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
                        {sync.phase === "synced" && sync.decision === null && sync.message === "Cloud sync ready."
                            ? "Cloud sync is ready."
                            : sync.phase === "synced" && sync.revision
                                ? "Cloud sync is active."
                                : "Your data is currently stored on this device until you choose a migration option."}
                    </p>
                    <p className="mt-3 text-sm font-medium text-sky-200" role="status">{statusText}</p>
                    {(sync.email || session.email) ? <p className="mt-1 break-all text-xs text-slate-400">{sync.email ?? session.email}</p> : null}
                    {sync.message && !showMigration && !showConflict ? (
                        <p className="mt-2 text-sm text-slate-300">{sync.message}</p>
                    ) : null}
                    {sync.error || actionError || session.error ? (
                        <p className="mt-2 text-sm text-rose-300" role="alert">{actionError ?? sync.error ?? session.error}</p>
                    ) : null}
                    {session.status === "signed-out" ? (
                        <p className="mt-2 text-sm text-slate-400">Local data remains available on this device.</p>
                    ) : null}
                    {session.status === "not-configured" ? (
                        <p className="mt-2 text-sm text-slate-400">Add Supabase credentials to enable account access.</p>
                    ) : null}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                    {session.status === "signed-in" && !showMigration && !showConflict ? (
                        <button
                            type="button"
                            onClick={() => void run("sync")}
                            disabled={isBusy}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white disabled:opacity-60"
                        >
                            <RefreshCw size={15} />
                            {isBusy ? "Checking…" : "Sync now"}
                        </button>
                    ) : null}
                    {showAccountControls ? (
                        <button
                            type="button"
                            onClick={signOut}
                            disabled={isSigningOut}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <LogOut size={15} />
                            {isSigningOut ? "Signing out…" : "Sign out"}
                        </button>
                    ) : session.status === "signed-out" ? (
                        <Link
                            href="/login"
                            className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500"
                        >
                            Sign in
                        </Link>
                    ) : null}
                </div>
            </div>

            {showMigration ? (
                <div className="mt-5 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
                    <p className="text-sm font-semibold text-white">{sync.message}</p>
                    {sync.decision === "both" ? (
                        <div className="mt-3 grid gap-3 text-xs text-slate-300 sm:grid-cols-2">
                            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                                <p className="font-semibold text-slate-100">This device</p>
                                <p className="mt-1">Last available change: {formatDate(sync.local?.lastChangedAt)}</p>
                                <p className="mt-1">{sync.local?.goals ?? 0} goals · {sync.local?.habits ?? 0} habits · {sync.local?.trades ?? 0} trades · {sync.local?.projects ?? 0} projects</p>
                            </div>
                            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                                <p className="font-semibold text-slate-100">Cloud</p>
                                <p className="mt-1">Updated: {formatDate(sync.cloud?.updatedAt)}</p>
                                <p className="mt-1">Revision {sync.cloud?.revision ?? "Unavailable"} · {cloudSummary?.goals ?? 0} goals · {cloudSummary?.habits ?? 0} habits · {cloudSummary?.trades ?? 0} trades · {cloudSummary?.projects ?? 0} projects</p>
                            </div>
                        </div>
                    ) : (
                        <p className="mt-2 text-xs leading-5 text-slate-300">
                            {sync.decision === "upload-local"
                                ? "Uploading is explicit. Nothing will be sent until you choose the button below."
                                : `Cloud updated ${formatDate(sync.cloud?.updatedAt)} · revision ${sync.cloud?.revision ?? "Unavailable"}.`}
                        </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                        {(sync.decision === "upload-local" || sync.decision === "both") ? (
                            <button type="button" disabled={isBusy} onClick={() => void run("upload-local")} className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-60">Upload this device to cloud</button>
                        ) : null}
                        {(sync.decision === "restore-cloud" || sync.decision === "both") ? (
                            <button type="button" disabled={isBusy} onClick={() => void run("use-cloud")} className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-medium text-white hover:bg-sky-500 disabled:opacity-60">{sync.decision === "both" ? "Use cloud data" : "Restore cloud data to this device"}</button>
                        ) : null}
                        <button type="button" disabled={isBusy} onClick={() => void run("cancel")} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 hover:border-slate-500 disabled:opacity-60">Not now</button>
                    </div>
                </div>
            ) : null}

            {showConflict ? (
                <div className="mt-5 rounded-xl border border-rose-500/25 bg-rose-500/5 p-4">
                    <p className="text-sm font-semibold text-rose-100">{sync.message ?? "Your cloud data changed on another device."}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-300">
                        Your local changes have not been replaced. Cloud revision {sync.cloud?.revision ?? "unavailable"} · updated {formatDate(sync.cloud?.updatedAt)}.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" disabled={isBusy || !sync.cloud} onClick={() => void run("load-latest")} className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-medium text-white hover:bg-sky-500 disabled:opacity-60">Load latest cloud data</button>
                        <button type="button" onClick={() => void run("cancel")} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 hover:border-slate-500">Cancel</button>
                    </div>
                </div>
            ) : null}

            {showAccountControls && !showMigration && !showConflict ? (
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-slate-800 pt-3 text-xs text-slate-400">
                    <span>Last successful sync: {formatDate(sync.lastSyncedAt)}</span>
                    <span>Cloud revision: {sync.revision ?? "Not yet created"}</span>
                    {sync.pendingChanges ? <span className="text-amber-200">Unsynced changes are kept on this device.</span> : null}
                </div>
            ) : null}
        </section>
    );
}
