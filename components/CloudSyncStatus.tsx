"use client";

import Link from "next/link";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useSupabaseSession } from "@/lib/supabase/useSupabaseSession";

export function CloudSyncStatus() {
    const { status, email, error } = useSupabaseSession();
    const [actionError, setActionError] = useState<string | null>(null);
    const [isSigningOut, setIsSigningOut] = useState(false);

    const signOut = async () => {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) {
            setActionError("Cloud is not configured.");
            return;
        }

        setIsSigningOut(true);
        setActionError(null);
        try {
            const { error: signOutError } = await supabase.auth.signOut();
            if (signOutError) {
                setActionError(signOutError.message);
            }
        } catch (signOutError: unknown) {
            setActionError(signOutError instanceof Error ? signOutError.message : "Unable to sign out.");
        } finally {
            setIsSigningOut(false);
        }
    };

    const statusText = {
        "not-configured": "Not configured",
        loading: "Checking account…",
        "signed-out": "Signed out",
        "signed-in": "Signed in",
        error: "Unable to check account",
    }[status];

    return (
        <section className="rounded-2xl border border-slate-800/90 bg-slate-900/65 p-4 shadow-[0_10px_28px_rgba(2,6,23,0.14)] sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-base font-semibold text-white sm:text-lg">Cloud Sync</h2>
                    <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
                        Account access is being prepared. Your app data remains stored on this device.
                    </p>
                    <p className="mt-3 text-sm font-medium text-sky-200" role="status">
                        {statusText}
                    </p>
                    {email ? <p className="mt-1 text-xs text-slate-400">{email}</p> : null}
                    {error || actionError ? (
                        <p className="mt-2 text-sm text-rose-300" role="alert">{actionError ?? error}</p>
                    ) : null}
                </div>
                {status === "signed-in" ? (
                    <button
                        type="button"
                        onClick={signOut}
                        disabled={isSigningOut}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <LogOut size={15} />
                        {isSigningOut ? "Signing out…" : "Sign out"}
                    </button>
                ) : status === "not-configured" ? (
                    <span className="text-sm text-slate-500">Add Supabase credentials to enable account access.</span>
                ) : status === "signed-out" ? (
                    <Link
                        href="/login"
                        className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500"
                    >
                        Sign in
                    </Link>
                ) : null}
            </div>
        </section>
    );
}
