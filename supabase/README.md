# Cloud state foundation

The migration in `migrations/001_user_app_state.sql` is prepared for review only; do not apply it until a Supabase project is connected and its policies have been verified. The app does not read or write this table in this phase.

## Local-data migration plan

1. After sign-in, read the authenticated user's `user_app_state` row and inspect the existing supported local-storage keys without changing them.
2. If the user has local Future Mindset data and no cloud row exists, offer an explicit import/confirmation before creating a cloud document.
3. If a cloud row already exists, never replace it automatically with local data. Show the user a deliberate conflict/recovery choice instead.
4. Once an import is confirmed, make cloud state canonical while retaining local storage as a cache/offline fallback and keeping JSON export/import available as a manual backup.
5. `revision` starts at 1. When synchronization is designed, advance/check it atomically alongside `updated_at` so stale devices surface conflicts instead of silently overwriting newer state. The prepared database helpers do not yet implement revision conflict handling.

Authentication and this schema are scaffolding only. `lib/supabase/userAppState.ts` provides authenticated, server-side table helpers for future use; they are not called by the app. No automatic sync, import, local-storage migration, or access gating is implemented.
