create table public.user_app_state (
    user_id uuid primary key references auth.users(id) on delete cascade,
    schema_version integer not null default 1 check (schema_version > 0),
    data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
    revision bigint not null default 1 check (revision > 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.user_app_state enable row level security;

revoke all on table public.user_app_state from public, anon, authenticated;
grant select, insert, update, delete on table public.user_app_state to authenticated;

create policy "Users can read their own app state"
    on public.user_app_state
    for select
    to authenticated
    using ((select auth.uid()) = user_id);

create policy "Users can create their own app state"
    on public.user_app_state
    for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

create policy "Users can update their own app state"
    on public.user_app_state
    for update
    to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

create policy "Users can delete their own app state"
    on public.user_app_state
    for delete
    to authenticated
    using ((select auth.uid()) = user_id);

create function public.set_user_app_state_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger set_user_app_state_updated_at
    before update on public.user_app_state
    for each row
    execute function public.set_user_app_state_updated_at();
