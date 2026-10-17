-- ==============================================================================
-- SAATHI — Backend B: Supabase Database Schema
-- Table: public.cases
-- Specification: Saathi Backend B Data Layer
-- ==============================================================================

-- 1. Create the cases table
create table if not exists public.cases (
  ticket          text primary key check (ticket ~ '^[0-9]{4}$'),
  name            text,
  language        text not null default 'hi-IN',
  domain          text not null default 'other' check (domain in ('farming', 'schemes', 'health', 'other')),
  district        text,
  subject         text,
  problem         text,
  problem_key     text,
  severity        text not null default 'low' check (severity in ('low', 'medium', 'high')),
  status          text not null default 'open' check (status in ('open', 'follow_up_due', 'resolved', 'escalated')),
  advice          text,
  sms_text        text,
  icons           text[] not null default '{}',
  turns           jsonb not null default '[]'::jsonb,
  expert_summary  text,
  ring_now        boolean not null default false,
  follow_up_at    timestamptz not null default now() + interval '3 days',
  source          text not null default 'live' check (source in ('live', 'seed')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Indexes for performance and cluster alert queries
create index if not exists cases_created_at_idx on public.cases (created_at desc);
create index if not exists cases_alert_idx on public.cases (district, problem_key);

-- 2. Keep updated_at automatically updated
create or replace function public.touch_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists cases_touch on public.cases;
create trigger cases_touch
  before update on public.cases
  for each row execute function public.touch_updated_at();

-- 3. Atomic append_turns function (avoids race conditions and lost conversation turns)
create or replace function public.append_turns(p_ticket text, p_turns jsonb)
returns void
language sql as $$
  update public.cases
  set turns = coalesce(turns, '[]'::jsonb) || p_turns
  where ticket = p_ticket;
$$;

grant execute on function public.append_turns(text, jsonb) to anon, authenticated;

-- 4. Enable Supabase Realtime publication for public.cases
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'cases'
  ) then
    alter publication supabase_realtime add table public.cases;
  end if;
end $$;

-- 5. Row Level Security & Hackathon Demo Policies
alter table public.cases enable row level security;

-- ==============================================================================
-- SECURITY NOTICE - DEMO ONLY:
-- The policies below permit open read/write access via the Supabase anon key
-- for rapid hackathon prototyping and evaluation.
-- They are NOT safe for production citizen data.
-- Use synthetic test cases exclusively. Never store Aadhaar numbers, bank
-- details, OTPs, or real sensitive citizen personal information.
-- ==============================================================================

drop policy if exists "demo read" on public.cases;
create policy "demo read" on public.cases for select using (true);

drop policy if exists "demo insert" on public.cases;
create policy "demo insert" on public.cases for insert with check (true);

drop policy if exists "demo update" on public.cases;
create policy "demo update" on public.cases for update using (true) with check (true);

drop policy if exists "demo delete" on public.cases;
create policy "demo delete" on public.cases for delete using (true);
