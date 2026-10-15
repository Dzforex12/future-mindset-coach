import { NextResponse } from "next/server";
import { buildContextSummary, buildGroundedModuleReply } from "@/app/api/chat/route";
import { validateCloudState } from "@/app/state/cloudState";
import { buildServerCoachRequestBody } from "@/lib/coach/cloudContext";
import {
    buildCoachSystemPrompt,
    COACH_GROQ_ENDPOINT,
    COACH_MODEL,
    type CoachLanguageMode,
} from "@/lib/coach/prompt";
import { getUserAppState } from "@/lib/supabase/userAppState";

const DESKTOP_HEADER = "x-future-mindset-desktop";
const DESKTOP_HEADER_VALUE = "1";
const COACH_ORIGIN = "https://future-mindset-coach.vercel.app";
const MAX_MESSAGE_LENGTH = 5_000;
const MAX_REQUEST_BYTES = 24_000;
const MAX_PROVIDER_RESPONSE_BYTES = 1_048_576;
const MAX_RESPONSE_LENGTH = 12_000;
const REQUEST_TIMEOUT_MS = 18_000;

const LANGUAGE_MODES = new Set<CoachLanguageMode>([
    "english",
    "italian",
    "albanian-standard",
    "albanian-kosovo",
]);

function errorResponse(code: string, message: string, status: number) {
    return NextResponse.json(
        { success: false, error: { code, message } },
        { status, headers: { "Cache-Control": "no-store" } },
    );
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseRequestBody(value: unknown): { message: string; languageMode: CoachLanguageMode } | null {
    if (!isRecord(value)) return null;

    const keys = Object.keys(value);
    if (keys.some((key) => key !== "message" && key !== "languageMode")) return null;
    if (typeof value.message !== "string" || typeof value.languageMode !== "string") return null;

    const message = value.message.trim();
    const languageMode = value.languageMode as CoachLanguageMode;
    if (!message || message.length > MAX_MESSAGE_LENGTH || !LANGUAGE_MODES.has(languageMode)) return null;

    return { message, languageMode };
}

function providerReply(value: unknown): string | null {
    if (!isRecord(value) || !Array.isArray(value.choices)) return null;
    const firstChoice = value.choices[0];
    if (!isRecord(firstChoice) || !isRecord(firstChoice.message) || typeof firstChoice.message.content !== "string") return null;
    const reply = firstChoice.message.content.trim();
    return reply && reply.length <= MAX_RESPONSE_LENGTH ? reply : null;
}

export async function POST(request: Request) {
    if (request.headers.get(DESKTOP_HEADER) !== DESKTOP_HEADER_VALUE) {
        return errorResponse("desktop_header_required", "This Coach endpoint is available only to the desktop agent.", 403);
    }

    const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
    if (contentType !== "application/json") {
        return errorResponse("json_required", "The Coach request must use JSON.", 415);
    }

    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
        return errorResponse("request_too_large", "The Coach question is too large.", 413);
    }

    const origin = request.headers.get("origin");
    if (origin && origin !== COACH_ORIGIN) {
        return errorResponse("origin_not_allowed", "The Coach request origin is not allowed.", 403);
    }

    let input: { message: string; languageMode: CoachLanguageMode } | null = null;
    try {
        input = parseRequestBody(await request.json());
    } catch {
        input = null;
    }
    if (!input) {
        return errorResponse("invalid_request", "The Coach request is invalid.", 400);
    }

    const cloud = await getUserAppState();
    if (cloud.error) {
        if (cloud.error.code === "unauthenticated") {
            return errorResponse("unauthenticated", "Sign in to Future Mindset Coach before asking Coach.", 401);
        }
        return errorResponse("cloud_unavailable", "Your authenticated Coach context is unavailable right now.", 503);
    }
    if (!cloud.data || !validateCloudState(cloud.data.data)) {
        return errorResponse("cloud_state_missing", "Your saved Coach context is unavailable. Open Coach and sync your account first.", 503);
    }

    const coachBody = buildServerCoachRequestBody(input.message, cloud.data.data);
    const groundedReply = input.languageMode === "english"
        ? buildGroundedModuleReply(input.message, coachBody)
        : null;
    if (groundedReply) {
        return NextResponse.json({ success: true, response: groundedReply }, { headers: { "Cache-Control": "no-store" } });
    }

    if (!process.env.GROQ_API_KEY) {
        return errorResponse("provider_unavailable", "Coach is temporarily unavailable.", 503);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(COACH_GROQ_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            },
            signal: controller.signal,
            body: JSON.stringify({
                model: COACH_MODEL,
                messages: [
                    {
                        role: "system",
                        content: `${buildCoachSystemPrompt({ languageMode: input.languageMode })}\n\nUser context:\n${buildContextSummary(coachBody)}`,
                    },
                    { role: "user", content: input.message },
                ],
                temperature: 0.7,
                max_tokens: 500,
            }),
        });

        const rawText = await response.text();
        if (rawText.length > MAX_PROVIDER_RESPONSE_BYTES || !response.ok) {
            return errorResponse("provider_failed", "Coach could not respond right now. Please try again.", 502);
        }

        let data: unknown = null;
        try {
            data = rawText ? JSON.parse(rawText) : null;
        } catch {
            data = null;
        }

        const reply = providerReply(data);
        if (!reply) {
            return errorResponse("provider_failed", "Coach returned an unreadable response. Please try again.", 502);
        }

        return NextResponse.json({ success: true, response: reply }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
        const isAbort = error instanceof Error && error.name === "AbortError";
        return errorResponse(isAbort ? "timeout" : "network_error", "Coach could not be reached. Check your connection and try again.", 504);
    } finally {
        clearTimeout(timeoutId);
    }
}
