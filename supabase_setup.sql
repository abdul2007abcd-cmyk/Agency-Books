-- ============================================================================
-- SCALE MAGNET - SUPABASE SETUP SCRIPT
-- Business Finance Dashboard for Abdul & Punith (50/50 Revenue Split)
-- ============================================================================

-- 1. Enable extension if not present
create extension if not exists "pgcrypto";

-- 2. Drop existing triggers & tables if recreating
drop trigger if exists on_entry_change_activity on public.entries;
drop function if exists public.log_entry_activity();
drop table if exists public.activity cascade;
drop table if exists public.entries cascade;

-- 3. Create 'entries' table
create table public.entries (
  id uuid default gen_random_uuid() primary key,
  kind text not null check (kind in ('client', 'expense', 'saving')),
  month_key text not null, -- Format: YYYY-MM (e.g. 2026-11)
  name text not null check (char_length(trim(name)) > 0 and char_length(name) <= 120),
  detail text check (detail is null or char_length(detail) <= 500),
  amount numeric not null check (amount > 0),
  type text check (type in ('add', 'withdraw') or type is null),
  status text check (status in ('paid', 'pending', 'overdue') or status is null),
  due_date date,
  paid_by text check (paid_by in ('Abdul', 'Punith') or paid_by is null),
  entry_date date not null default current_date,
  deleted_at timestamptz,
  by_email text not null default coalesce(auth.jwt()->>'email', 'abdul@scalemagnet.app'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Create 'activity' table (immutable audit trail)
create table public.activity (
  id uuid default gen_random_uuid() primary key,
  action text not null check (action in ('add', 'edit', 'delete', 'restore', 'import', 'clear')),
  summary text not null,
  old_value jsonb,
  new_value jsonb,
  by_email text not null default coalesce(auth.jwt()->>'email', 'system@scalemagnet.app'),
  created_at timestamptz not null default now()
);

-- 5. Indexes for fast query performance
create index if not exists idx_entries_month_kind on public.entries (month_key, kind) where deleted_at is null;
create index if not exists idx_entries_deleted_at on public.entries (deleted_at);
create index if not exists idx_entries_kind on public.entries (kind);
create index if not exists idx_entries_created_at on public.entries (created_at desc);
create index if not exists idx_activity_created_at on public.activity (created_at desc);

-- 6. Trigger to automatically log all entry operations
create or replace function public.log_entry_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_user text;
  display_name text;
  act_type text;
  act_summary text;
begin
  -- Resolve acting user email from JWT
  acting_user := coalesce(auth.jwt()->>'email', 'abdul@scalemagnet.app');
  if acting_user ilike 'abdul%' then
    display_name := 'Abdul';
  elsif acting_user ilike 'punith%' then
    display_name := 'Punith';
  else
    display_name := split_part(acting_user, '@', 1);
  end if;

  if (TG_OP = 'INSERT') then
    act_type := 'add';
    act_summary := display_name || ' added ' || NEW.kind || ': ' || NEW.name || ' · ₹' || to_char(NEW.amount, 'FM99,99,99,999');
    insert into public.activity (action, summary, old_value, new_value, by_email, created_at)
    values (act_type, act_summary, null, to_jsonb(NEW), acting_user, now());
    return NEW;

  elsif (TG_OP = 'UPDATE') then
    -- Check if soft delete
    if (OLD.deleted_at is null and NEW.deleted_at is not null) then
      act_type := 'delete';
      act_summary := display_name || ' deleted ' || NEW.kind || ': ' || NEW.name || ' · ₹' || to_char(NEW.amount, 'FM99,99,99,999');
      insert into public.activity (action, summary, old_value, new_value, by_email, created_at)
      values (act_type, act_summary, to_jsonb(OLD), to_jsonb(NEW), acting_user, now());
    -- Check if restore
    elsif (OLD.deleted_at is not null and NEW.deleted_at is null) then
      act_type := 'restore';
      act_summary := display_name || ' restored ' || NEW.kind || ': ' || NEW.name || ' · ₹' || to_char(NEW.amount, 'FM99,99,99,999');
      insert into public.activity (action, summary, old_value, new_value, by_email, created_at)
      values (act_type, act_summary, to_jsonb(OLD), to_jsonb(NEW), acting_user, now());
    else
      -- Regular edit
      act_type := 'edit';
      act_summary := display_name || ' updated ' || NEW.kind || ': ' || NEW.name;
      if (OLD.amount <> NEW.amount) then
        act_summary := act_summary || ' (Amount changed: ₹' || to_char(OLD.amount, 'FM99,99,99,999') || ' → ₹' || to_char(NEW.amount, 'FM99,99,99,999') || ')';
      end if;
      insert into public.activity (action, summary, old_value, new_value, by_email, created_at)
      values (act_type, act_summary, to_jsonb(OLD), to_jsonb(NEW), acting_user, now());
    end if;

    NEW.updated_at := now();
    return NEW;

  elsif (TG_OP = 'DELETE') then
    act_type := 'delete';
    act_summary := display_name || ' permanently removed ' || OLD.kind || ': ' || OLD.name;
    insert into public.activity (action, summary, old_value, new_value, by_email, created_at)
    values (act_type, act_summary, to_jsonb(OLD), null, acting_user, now());
    return OLD;
  end if;

  return null;
end;
$$;

create trigger on_entry_change_activity
  after insert or update or delete on public.entries
  for each row execute function public.log_entry_activity();

-- 7. Row Level Security (RLS)
alter table public.entries enable row level security;
alter table public.activity enable row level security;

-- Strictly allow only the two partner emails full access to entries
create policy "Allow partners full access to entries"
  on public.entries
  for all
  to authenticated
  using (
    (auth.jwt()->>'email') in ('abdul@scalemagnet.app', 'punith@scalemagnet.app')
  )
  with check (
    (auth.jwt()->>'email') in ('abdul@scalemagnet.app', 'punith@scalemagnet.app')
  );

-- Activity is read-only for partners; updates and deletes are blocked for users
create policy "Allow partners to view activity"
  on public.activity
  for select
  to authenticated
  using (
    (auth.jwt()->>'email') in ('abdul@scalemagnet.app', 'punith@scalemagnet.app')
  );

-- 8. Add both tables to Supabase Realtime publication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'entries'
  ) then
    alter publication supabase_realtime add table public.entries;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'activity'
  ) then
    alter publication supabase_realtime add table public.activity;
  end if;
end;
$$;
