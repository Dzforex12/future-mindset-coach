import { getSupabaseServerClient } from "./server";

export type UserAppStateDocument = {
    schemaVersion: number;
    [key: string]: unknown;
};

export type UserAppStateErrorCode =
    | "not_configured"
    | "unauthenticated"
    | "auth_error"
    | "invalid_state"
    | "database_error"
    | "revision_conflict";

export type UserAppStateError = {
    code: UserAppStateErrorCode;
    message: string;
};

export type UserAppStateResult<T> =
    | { data: T; error: null }
    | { data: null; error: UserAppStateError };

export type UserAppStateRecord = {
    userId: string;
    schemaVersion: number;
    data: UserAppStateDocument;
    revision: number | string;
    createdAt: string;
    updatedAt: string;
};

type UserAppStateDatabaseRow = {
    user_id: string;
    schema_version: number;
    data: unknown;
    revision: number | string;
    created_at: string;
    updated_at: string;
};

function isUserAppStateDatabaseRow(value: unknown): value is UserAppStateDatabaseRow {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }

    const row = value as Record<string, unknown>;
    return (
        typeof row.user_id === "string" &&
        typeof row.schema_version === "number" &&
        Number.isInteger(row.schema_version) &&
        typeof row.data === "object" &&
        row.data !== null &&
        !Array.isArray(row.data) &&
        ((typeof row.revision === "number" && Number.isSafeInteger(row.revision) && row.revision >= 1) ||
            (typeof row.revision === "string" && /^[1-9]\d*$/.test(row.revision))) &&
        typeof row.created_at === "string" &&
        typeof row.updated_at === "string"
    );
}

function toUserAppStateRecord(value: unknown): UserAppStateRecord | null {
    if (!isUserAppStateDatabaseRow(value)) {
        return null;
    }

    const data = value.data as Record<string, unknown>;
    if (typeof data.schemaVersion !== "number" || data.schemaVersion !== value.schema_version) {
        return null;
    }

    return {
        userId: value.user_id,
        schemaVersion: value.schema_version,
        data: { ...data, schemaVersion: data.schemaVersion },
        revision: value.revision,
        createdAt: value.created_at,
        updatedAt: value.updated_at,
    };
}

function serializeStateDocument(value: UserAppStateDocument): string | null {
    try {
        const serialized = JSON.stringify(value);
        if (!serialized) {
            return null;
        }

        const parsed: unknown = JSON.parse(serialized);
        if (
            !parsed ||
            typeof parsed !== "object" ||
            Array.isArray(parsed) ||
            !Number.isInteger((parsed as Record<string, unknown>).schemaVersion)
        ) {
            return null;
        }

        return serialized;
    } catch {
        return null;
    }
}

function error<T>(code: UserAppStateErrorCode, message: string): UserAppStateResult<T> {
    return { data: null, error: { code, message } };
}

async function getAuthenticatedServerClient() {
    try {
        const supabase = await getSupabaseServerClient();
        if (!supabase) {
            return { supabase: null, error: { code: "not_configured", message: "Cloud is not configured." } as const };
        }

        const { data, error: authError } = await supabase.auth.getUser();
        if (authError) {
            return { supabase: null, error: { code: "auth_error", message: authError.message } as const };
        }

        if (!data.user) {
            return { supabase: null, error: { code: "unauthenticated", message: "Sign in before accessing cloud state." } as const };
        }

        return { supabase, userId: data.user.id, error: null };
    } catch (authError: unknown) {
        return {
            supabase: null,
            error: {
                code: "auth_error",
                message: authError instanceof Error ? authError.message : "Unable to verify the current user.",
            } as const,
        };
    }
}

export async function getUserAppState(): Promise<UserAppStateResult<UserAppStateRecord | null>> {
    const auth = await getAuthenticatedServerClient();
    if (auth.error) {
        return error(auth.error.code, auth.error.message);
    }

    let data: unknown;
    try {
        const result = await auth.supabase
            .from("user_app_state")
            .select("user_id, schema_version, data, revision, created_at, updated_at")
            .eq("user_id", auth.userId)
            .maybeSingle();

        if (result.error) {
            return error("database_error", result.error.message);
        }
        data = result.data;
    } catch (queryError: unknown) {
        return error("database_error", queryError instanceof Error ? queryError.message : "Unable to read cloud state.");
    }

    if (data === null) {
        return { data: null, error: null };
    }

    const record = toUserAppStateRecord(data);
    if (!record || record.userId !== auth.userId) {
        return error("invalid_state", "The cloud state row has an invalid or inconsistent format.");
    }

    return { data: record, error: null };
}

export async function upsertUserAppState<T extends UserAppStateDocument>(
    state: T,
    expectedRevision: number | string | null,
): Promise<UserAppStateResult<UserAppStateRecord>> {
    const auth = await getAuthenticatedServerClient();
    if (auth.error) {
        return error(auth.error.code, auth.error.message);
    }

    const serializedData = serializeStateDocument(state);
    if (!serializedData) {
        return error("invalid_state", "Cloud state must be a JSON object with an integer schemaVersion.");
    }

    const data = JSON.parse(serializedData) as Record<string, unknown>;
    if (typeof data.schemaVersion !== "number" || !Number.isInteger(data.schemaVersion)) {
        return error("invalid_state", "Cloud state must be a JSON object with an integer schemaVersion.");
    }
    if (expectedRevision !== null) {
        if ((typeof expectedRevision === "number" && (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1)) ||
            (typeof expectedRevision === "string" && !/^[1-9]\d*$/.test(expectedRevision))) {
            return error("invalid_state", "Expected cloud revision must be a positive integer.");
        }
        try {
            if (BigInt(expectedRevision) < BigInt(1)) {
                return error("invalid_state", "Expected cloud revision must be a positive integer.");
            }
        } catch {
            return error("invalid_state", "Expected cloud revision must be a positive integer.");
        }
    }
    let row: unknown;
    try {
        const query = auth.supabase.from("user_app_state");
        const result = expectedRevision === null
            ? await query
                .insert({
                    user_id: auth.userId,
                    schema_version: data.schemaVersion,
                    data,
                })
                .select("user_id, schema_version, data, revision, created_at, updated_at")
                .maybeSingle()
            : await query
                .update({
                    schema_version: data.schemaVersion,
                    data,
                    revision: (BigInt(expectedRevision) + BigInt(1)).toString(),
                })
                .eq("user_id", auth.userId)
                .eq("revision", String(expectedRevision))
                .select("user_id, schema_version, data, revision, created_at, updated_at")
                .maybeSingle();

        if (result.error) {
            if (result.error.code === "23505" && expectedRevision === null) {
                return error("revision_conflict", "Cloud data changed on another device.");
            }
            return error("database_error", result.error.message);
        }
        if (!result.data) {
            return error("revision_conflict", "Cloud data changed on another device.");
        }
        row = result.data;
    } catch (queryError: unknown) {
        return error("database_error", queryError instanceof Error ? queryError.message : "Unable to save cloud state.");
    }

    const record = toUserAppStateRecord(row);
    if (!record || record.userId !== auth.userId) {
        return error("invalid_state", "The cloud state response has an invalid or inconsistent format.");
    }

    return { data: record, error: null };
}
