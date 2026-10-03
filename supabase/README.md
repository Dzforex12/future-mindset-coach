# Cloud state sync

The app uses the authenticated `user_app_state` row for cross-device state. The signed-in user is derived on the server from the Supabase cookie session; clients cannot choose a row owner. All table access remains subject to the table's RLS policies.

## Initial migration and local storage

Settings compares the authenticated cloud row with validated supported local storage. When one side has data, the user must explicitly choose upload or restore. When both sides have data, neither is selected automatically. A cancelled choice leaves migration unresolved. Only the supported keys listed by the backup system are included; unrelated browser storage is untouched.

Cloud restores validate every supported module, snapshot all supported local keys in memory, roll back if a storage write fails, and rehydrate the persisted memory store only after the writes succeed. Manual JSON export/import remains available. An imported backup marks the local state dirty and uses the normal revision-checked sync path.

After a user resolves initial migration, supported local changes are saved after a short debounce. Local storage remains available for offline use. A device with pending local changes does not automatically accept a newer cloud revision; Settings offers an explicit conflict action.

## Revisions

`revision` starts at 1. Server writes compare the expected revision atomically: initial creation uses an insert, and later writes update only the authenticated user's row whose revision still matches. A successful update increments the bigint revision; a mismatch returns a conflict instead of overwriting newer state. The `updated_at` database trigger tracks successful updates.

The database migration in `migrations/001_user_app_state.sql` remains the schema/RLS reference. This implementation expects it to have been applied and the authenticated-only policies and grants to remain enabled.
