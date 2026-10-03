import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "./config";

export async function getSupabaseServerClient() {
    const config = getSupabasePublicConfig();
    if (!config) {
        return null;
    }

    const cookieStore = await cookies();

    return createServerClient(config.url, config.publishableKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options);
                    });
                } catch (error) {
                    if (
                        error instanceof Error &&
                        error.message.includes("Cookies can only be modified in a Server Action or Route Handler")
                    ) {
                        return;
                    }

                    throw error;
                }
            },
        },
    });
}
