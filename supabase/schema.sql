-- BoardMatch — Supabase schema
-- Run this once in the Supabase project: SQL Editor → New query → paste → Run.
-- Safe to re-run (idempotent).
--
-- Data model: candidates and matches are stored as JSONB blobs keyed by a text id,
-- so the app's TypeScript types map straight onto a row's `data` column. They are
-- written/read ONLY by the serverless functions in /api using the service_role key.
-- Row-Level Security is enabled with NO public policies, so the public anon key (and
-- therefore the browser) can never read or write these tables directly — the server
-- is the only path in. Auth (logins) is handled by Supabase Auth, not these tables.

create table if not exists public.candidates (
  id         text primary key,
  data       jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.matches (
  id           text primary key,
  data         jsonb not null,
  -- denormalised for fast per-company filtering on the server
  company_id   text generated always as (data ->> 'companyId') stored,
  candidate_id text generated always as (data ->> 'candidateId') stored,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists matches_company_id_idx on public.matches (company_id);
create index if not exists matches_candidate_id_idx on public.matches (candidate_id);

-- Keep updated_at fresh on every write.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists candidates_touch on public.candidates;
create trigger candidates_touch before update on public.candidates
  for each row execute function public.touch_updated_at();

drop trigger if exists matches_touch on public.matches;
create trigger matches_touch before update on public.matches
  for each row execute function public.touch_updated_at();

-- Lock the tables down: RLS on, and no policies → only the service_role key
-- (used server-side) can touch them. The browser's anon key gets nothing.
alter table public.candidates enable row level security;
alter table public.matches    enable row level security;
