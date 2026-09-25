<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Future Mindset Coach

## Commands

- Install reproducibly with `npm ci`.
- Run the development server with `npm run dev`.
- Run validation with `npm run lint`, `npx tsc --noEmit`, and `npm run build` when the change affects the production bundle.
- There is currently no automated test script. Add focused tests only when introducing a testable shared behavior; do not assume a test runner is configured.

## Project Structure

- This is a Next.js 16 App Router application. Feature pages are under `app/` (`dashboard`, `goals`, `habits`, `mindset`, `trading`, `analytics`, `summary`, and `settings`). The root page redirects to `/dashboard`.
- `app/layout.tsx` owns the global shell, font, sidebar, mobile navigation, header, and content spacing. Keep page-specific layout inside the feature route.
- `app/api/` contains server route handlers for AI generation, reports, summaries, and coaching. Keep secrets and provider calls on the server.
- `app/state/` contains the domain engines, selectors, persistence helpers, and the Zustand memory store. Put domain normalization, clamping, IDs, and cross-feature relationships in the owning engine rather than duplicating them in pages.
- `components/` contains shared feature components and `components/ui/` contains shadcn/Base UI primitives. Reuse existing components before adding new variants.

## Client And Server Boundaries

- Interactive feature pages and components normally use `"use client"`; server components are primarily the root layout, redirect page, and API handlers.
- Do not read `window`, `localStorage`, or browser-persisted Zustand state during server rendering. Load browser state in `useEffect` or follow the hydration pattern used by neighboring pages.
- API handlers must validate request data, handle missing provider configuration, timeouts, and upstream failures, and return structured `NextResponse` errors.
- `GROQ_API_KEY` is server-only. Never expose it through client code or a `NEXT_PUBLIC_*` variable, and do not log its value.

## State And Persistence

- Use `app/state/persistence.ts` for JSON storage access. Existing engines use explicit local-storage keys and dispatch `mindset-store-update` after writes so other views can refresh.
- `app/state/memoryStore.ts` uses Zustand `persist` with the `future-mindset-memory` key. Preserve its types and persisted shape when changing profile, goals, habits, mindset, roadmap, or trading data.
- Components commonly subscribe to `mindset-store-update` and, where appropriate, the browser `storage` event. Preserve those synchronization paths when adding derived views.
- Do not introduce a second storage key or bypass an existing engine without considering migration, reset behavior, and cross-tab synchronization.

## UI Conventions

- Styling uses Tailwind CSS v4 through `app/globals.css`, with the existing dark navy dashboard visual language, slate borders, blue/violet accents, panels, and responsive layouts.
- Use `lucide-react` for icons and follow the navigation patterns in `components/Sidebar.tsx` and `components/Header.tsx`.
- Use the shared primitives in `components/ui/` and follow the configured shadcn conventions in `components.json`; preserve nearby page styling when a shared primitive has different defaults.
- Keep mobile navigation and the global shell in mind when changing page spacing or introducing fixed-position controls.

## Working Rules

- Read the nearest existing page, component, or state engine before creating a new pattern.
- Keep AI-generated content grounded in persisted user context. For trading-related behavior, preserve the existing safety posture: process and risk coaching, no guaranteed outcomes, signal selling, or unsafe leverage advice.
- Update the relevant API, state engine, and UI together when changing a persisted field. Verify with lint and typecheck before widening the change.
- The starter [README.md](README.md) still contains create-next-app boilerplate; treat `package.json` and the current source tree as authoritative for commands and architecture.

