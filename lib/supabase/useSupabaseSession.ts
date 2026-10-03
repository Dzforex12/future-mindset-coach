"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "./config";
import { getSupabaseBrowserClient } from "./browser";

export type SupabaseSessionStatus = "not-configured" | "loading" | "signed-out" | "signed-in" | "error";

export function useSupabaseSession() {
    const configured = getSupabasePublicConfig() !== null;
    const [status, setStatus] = useState<SupabaseSessionStatus>(configured ? "loading" : "not-configured");
    const [email, setEmail] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!configured) {
            return;
        }

        const supabase = getSupabaseBrowserClient();
        if (!supabase) {
            return;
        }

        let active = true;
        let unsubscribe: (() => void) | undefined;
        const applySession = (session: Session | null) => {
            setStatus(session ? "signed-in" : "signed-out");
            setEmail(session?.user.email ?? null);
            setError(null);
        };
        void Promise.resolve().then(async () => {
            if (!active) {
                return null;
            }

            const client = getSupabaseBrowserClient();
            if (!client) {
                throw new Error("Supabase browser client is unavailable.");
            }

            const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
                if (active) {
                    applySession(session);
                }
            });
            unsubscribe = () => subscription.unsubscribe();

            const { data, error: sessionError } = await client.auth.getSession();
            if (sessionError) {
                throw sessionError;
            }

            return data.session;
        }).then((session) => {
            if (active) {
                applySession(session);
            }
        }).catch((sessionError: unknown) => {
            if (active) {
                setStatus("error");
                setError(sessionError instanceof Error ? sessionError.message : "Unable to check your Supabase session.");
            }
        });

        return () => {
            active = false;
            unsubscribe?.();
        };
    }, [configured]);

    return { configured, status, email, error };
}
