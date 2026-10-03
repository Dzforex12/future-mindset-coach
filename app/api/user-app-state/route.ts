import { NextResponse } from "next/server";
import { validateCloudState } from "@/app/state/cloudState";
import { getUserAppState, upsertUserAppState } from "@/lib/supabase/userAppState";

export async function GET() {
    const result = await getUserAppState();
    if (result.error) {
        const status = result.error.code === "unauthenticated" ? 401 : 503;
        return NextResponse.json({ error: result.error }, { status, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ record: result.data }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: { code: "invalid_request", message: "Request body must be valid JSON." } },
            { status: 400 },
        );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return NextResponse.json(
            { error: { code: "invalid_request", message: "Request body must be an object." } },
            { status: 400 },
        );
    }
    const input = body as Record<string, unknown>;
    if (!validateCloudState(input.data)) {
        return NextResponse.json(
            { error: { code: "invalid_state", message: "Cloud data is not a valid supported app snapshot." } },
            { status: 400 },
        );
    }
    const expectedRevision = input.expectedRevision;
    if (!(expectedRevision === null || typeof expectedRevision === "string" ||
        (typeof expectedRevision === "number" && Number.isSafeInteger(expectedRevision)))) {
        return NextResponse.json(
            { error: { code: "invalid_revision", message: "Expected revision must be an integer or null." } },
            { status: 400 },
        );
    }

    const result = await upsertUserAppState(input.data, expectedRevision);
    if (result.error) {
        const status = result.error.code === "unauthenticated"
            ? 401
            : result.error.code === "revision_conflict"
                ? 409
                : result.error.code === "invalid_state"
                    ? 400
                    : 503;
        return NextResponse.json({ error: result.error }, { status, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json({ record: result.data }, { headers: { "Cache-Control": "no-store" } });
}
