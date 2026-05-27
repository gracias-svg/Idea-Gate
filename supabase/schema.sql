-- ============================================================
-- IdeaGate V3.1 — Supabase Database Schema
-- ============================================================
-- Run this in your Supabase project's SQL Editor.
-- Enable Row Level Security (RLS) on all tables.
-- Uses Supabase Auth (auth.users) for user identity.
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── User profiles ─────────────────────────────────────────────
-- Mirrors auth.users with additional IdeaGate-specific fields.
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  display_name    text,
  role            text not null default 'user' check (role in ('user', 'admin')),
  plan            text not null default 'free' check (plan in ('free', 'pro', 'team')),
  token_quota     integer not null default 100000,   -- monthly token limit
  tokens_used     integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Auto-create profile on new auth.users signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Projects ──────────────────────────────────────────────────
-- One row per lifecycle run (per idea).
create table if not exists public.projects (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  name            text not null,                   -- human name, e.g. "Lumi Marketplace"
  idea            text not null,                   -- the original one-line idea
  status          text not null default 'running'
                  check (status in ('running', 'complete', 'error', 'archived')),
  current_stage   integer not null default 0,
  total_stages    integer not null default 14,
  workspace_path  text,                            -- local filesystem path (V3.0 compat)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── Artifacts ─────────────────────────────────────────────────
-- One row per lifecycle stage artifact.
create table if not exists public.artifacts (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  stage_num       integer not null check (stage_num between 0 and 14),
  stage_name      text not null,
  file_name       text not null,                   -- e.g. "1-discovery.md"
  content         text not null default '',        -- full markdown content
  content_parsed  text,                            -- pre-extracted clean content (V2 parse bug output)
  content_format  text not null default 'markdown' check (content_format in ('markdown', 'json_wrapped', 'raw')),
  version         integer not null default 1,      -- incremented on each improvement
  word_count      integer,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (project_id, stage_num)
);

-- ── Improvement history ────────────────────────────────────────
-- Every accepted improvement is logged here permanently.
create table if not exists public.improvements (
  id              uuid primary key default uuid_generate_v4(),
  artifact_id     uuid not null references public.artifacts(id) on delete cascade,
  project_id      uuid not null references public.projects(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  intent          text not null,
  extent          text not null check (extent in ('light', 'medium', 'strong')),
  scope           text not null check (scope in ('block', 'stage', 'project')),
  content_before  text not null,
  content_after   text not null,
  reasoning       text,                            -- LLM's PM reasoning
  impact_warnings text[],                          -- downstream stage warnings
  model           text not null,                   -- full OpenRouter model string
  tokens_input    integer not null default 0,
  tokens_output   integer not null default 0,
  tokens_total    integer not null default 0,
  cost_usd        numeric(10, 6) not null default 0,
  ref_doc_count   integer not null default 0,
  created_at      timestamptz not null default now()
);

-- ── Reference documents ───────────────────────────────────────
-- Uploaded reference files associated with a project.
create table if not exists public.ref_documents (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  file_name       text not null,
  file_type       text not null,                   -- pdf, docx, txt, md
  file_size_kb    integer,
  extracted_text  text not null,
  char_count      integer,
  was_truncated   boolean not null default false,
  created_at      timestamptz not null default now()
);

-- ── Snapshots ─────────────────────────────────────────────────
-- Saved lifecycle state checkpoints (Git-style PM versioning).
create table if not exists public.snapshots (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  name            text not null,                   -- user-given snapshot name
  description     text,
  stage_at_save   integer not null,
  artifact_count  integer not null,
  artifact_snapshot jsonb not null,                -- { "1-discovery.md": "content...", ... }
  created_at      timestamptz not null default now()
);

-- ── Comments and annotations ──────────────────────────────────
-- Per-artifact comments and PM notes.
create table if not exists public.comments (
  id              uuid primary key default uuid_generate_v4(),
  artifact_id     uuid not null references public.artifacts(id) on delete cascade,
  project_id      uuid not null references public.projects(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  content         text not null,
  comment_type    text not null default 'note' check (comment_type in ('note', 'question', 'blocker', 'insight')),
  resolved        boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── Usage log (admin visibility) ─────────────────────────────
-- Every LLM call is logged for admin monitoring.
create table if not exists public.usage_log (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  project_id      uuid references public.projects(id) on delete set null,
  operation       text not null,                   -- 'improve_preview', 'improve_accept', 'run_lifecycle'
  model           text,
  tokens_input    integer default 0,
  tokens_output   integer default 0,
  cost_usd        numeric(10, 6) default 0,
  success         boolean not null default true,
  error_message   text,
  created_at      timestamptz not null default now()
);

-- ── Indexes ───────────────────────────────────────────────────
create index if not exists idx_projects_user_id        on public.projects(user_id);
create index if not exists idx_artifacts_project_id    on public.artifacts(project_id);
create index if not exists idx_improvements_artifact   on public.improvements(artifact_id);
create index if not exists idx_improvements_project    on public.improvements(project_id);
create index if not exists idx_improvements_user       on public.improvements(user_id);
create index if not exists idx_ref_docs_project        on public.ref_documents(project_id);
create index if not exists idx_snapshots_project       on public.snapshots(project_id);
create index if not exists idx_comments_artifact       on public.comments(artifact_id);
create index if not exists idx_usage_log_user          on public.usage_log(user_id);
create index if not exists idx_usage_log_created       on public.usage_log(created_at desc);

-- ── Updated_at auto-update ────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated   before update on public.profiles   for each row execute function public.set_updated_at();
create trigger trg_projects_updated   before update on public.projects   for each row execute function public.set_updated_at();
create trigger trg_artifacts_updated  before update on public.artifacts  for each row execute function public.set_updated_at();
create trigger trg_comments_updated   before update on public.comments   for each row execute function public.set_updated_at();

-- ── Row Level Security ────────────────────────────────────────
alter table public.profiles      enable row level security;
alter table public.projects      enable row level security;
alter table public.artifacts     enable row level security;
alter table public.improvements  enable row level security;
alter table public.ref_documents enable row level security;
alter table public.snapshots     enable row level security;
alter table public.comments      enable row level security;
alter table public.usage_log     enable row level security;

-- Profiles: users can read/update their own
create policy "users_own_profile"
  on public.profiles for all using (auth.uid() = id);

-- Admins can read all profiles
create policy "admins_read_all_profiles"
  on public.profiles for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Projects: users own their projects
create policy "users_own_projects"
  on public.projects for all using (auth.uid() = user_id);

-- Artifacts: users access via project ownership
create policy "users_access_artifacts"
  on public.artifacts for all
  using (exists (select 1 from public.projects where id = project_id and user_id = auth.uid()));

-- Improvements: users access via project ownership
create policy "users_access_improvements"
  on public.improvements for all
  using (auth.uid() = user_id);

-- Ref docs
create policy "users_own_ref_docs"
  on public.ref_documents for all using (auth.uid() = user_id);

-- Snapshots
create policy "users_own_snapshots"
  on public.snapshots for all using (auth.uid() = user_id);

-- Comments
create policy "users_own_comments"
  on public.comments for all using (auth.uid() = user_id);

-- Usage log: users read own, admins read all
create policy "users_own_usage"
  on public.usage_log for all using (auth.uid() = user_id);

create policy "admins_read_usage"
  on public.usage_log for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ============================================================
-- V3.1 SETUP COMPLETE
-- Next steps:
-- 1. Add to .env.local:
--    NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
--    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
--    SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (server-side only)
-- 2. npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
-- 3. Add src/lib/supabase.ts (provided separately)
-- 4. Wrap app in Supabase SessionContext in layout.tsx
-- ============================================================
