"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Crown, LogOut } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useSupabaseSession } from "@/lib/supabase/useSupabaseSession";

export function LoginForm() {
    const { configured, status, email, error: sessionError } = useSupabaseSession();
    const [emailInput, setEmailInput] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ message: string; error: boolean } | null>(null);

    const signIn = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        setFeedback(null);

        const supabase = getSupabaseBrowserClient();
        if (!supabase) {
            setFeedback({ message: "Cloud is not configured. Add the Supabase URL and publishable key to enable sign-in.", error: true });
            setIsSubmitting(false);
            return;
        }

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: emailInput.trim(),
                password,
            });
            if (error) {
                setFeedback({ message: error.message, error: true });
            } else {
                setPassword("");
                setFeedback({ message: "Signed in. Cloud sync is available. Open Settings to review or initialize synchronization.", error: false });
            }
        } catch (error: unknown) {
            setFeedback({
                message: error instanceof Error ? error.message : "Unable to sign in. Please try again.",
                error: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const signOut = async () => {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) {
            setFeedback({ message: "Cloud is not configured.", error: true });
            return;
        }

        setIsSubmitting(true);
        setFeedback(null);
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                setFeedback({ message: error.message, error: true });
            } else {
                setFeedback({ message: "You have been signed out.", error: false });
            }
        } catch (error: unknown) {
            setFeedback({
                message: error instanceof Error ? error.message : "Unable to sign out. Please try again.",
                error: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-xl items-center px-4 py-8 sm:px-6">
            <section className="w-full rounded-3xl border border-slate-800 bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.14),transparent_55%),linear-gradient(145deg,#0d1d30,#07111e_80%)] p-6 shadow-[0_16px_48px_rgba(2,6,23,0.32)] sm:p-8">
                <Link href="/dashboard" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
                    <ArrowLeft size={15} />
                    Back to dashboard
                </Link>

                <div className="mb-6 flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl border border-sky-400/30 bg-sky-500/10 text-sky-200">
                        <Crown size={24} />
                    </span>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">Future Mindset Coach</p>
                        <h1 className="mt-1 text-2xl font-semibold text-white">Account access</h1>
                    </div>
                </div>

                {status === "not-configured" ? (
                    <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
                        <p className="font-medium text-amber-100">Cloud not configured.</p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                            Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> to your environment to enable account access. Your local app remains available.
                        </p>
                    </div>
                ) : status === "signed-in" ? (
                    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
                        <p className="font-medium text-emerald-100">Signed in</p>
                        {email ? <p className="mt-1 text-sm text-slate-300">{email}</p> : null}
                        <p className="mt-3 text-sm leading-6 text-slate-400">
                            Cloud sync is available. Open Settings to review or initialize synchronization.
                        </p>
                        <button
                            type="button"
                            onClick={signOut}
                            disabled={isSubmitting}
                            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <LogOut size={15} />
                            {isSubmitting ? "Signing out…" : "Sign out"}
                        </button>
                    </div>
                ) : (
                    <form onSubmit={signIn} className="space-y-4">
                        <p className="text-sm leading-6 text-slate-400">
                            Sign in with the email and password configured for your Supabase project.
                        </p>
                        <label className="block text-sm text-slate-300">
                            Email
                            <input
                                type="email"
                                autoComplete="email"
                                required
                                value={emailInput}
                                onChange={(event) => setEmailInput(event.target.value)}
                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white outline-none transition focus:border-violet-500"
                            />
                        </label>
                        <label className="block text-sm text-slate-300">
                            Password
                            <input
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white outline-none transition focus:border-violet-500"
                            />
                        </label>
                        {status === "loading" ? <p className="text-xs text-slate-500">Checking account…</p> : null}
                        <button
                            type="submit"
                            disabled={!configured || status === "loading" || isSubmitting}
                            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isSubmitting ? "Signing in…" : "Sign in"}
                        </button>
                    </form>
                )}

                {sessionError || feedback ? (
                    <p
                        className={`mt-4 rounded-xl border px-3 py-2 text-sm ${feedback?.error || status === "error"
                            ? "border-rose-400/20 bg-rose-400/5 text-rose-200"
                            : "border-emerald-400/20 bg-emerald-400/5 text-emerald-200"}`}
                        role={feedback?.error || status === "error" ? "alert" : "status"}
                    >
                        {feedback?.message ?? sessionError}
                    </p>
                ) : null}
            </section>
        </main>
    );
}
