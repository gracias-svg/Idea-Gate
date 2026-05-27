// src/lib/supabase.ts
//
// Supabase client for IdeaGate V3.1.
// Activates when NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.
// Until then: returns null and all callers fall back to filesystem/localStorage.
//
// To activate:
// 1. Create project at https://supabase.com
// 2. Copy URL and anon key from Project Settings → API
// 3. Add to .env.local:
//    NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
//    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
// 4. npm install @supabase/supabase-js

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ── Client factory (isomorphic — works in browser and server) ─────────────────
export function createSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Supabase not configured — return null, callers use local fallback
    return null;
  }

  try {
    // Dynamic import avoids build failure if package isn't installed yet
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createClient } = require('@supabase/supabase-js');
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch {
    console.warn('[supabase] @supabase/supabase-js not installed. Run: npm install @supabase/supabase-js');
    return null;
  }
}

// Singleton for browser-side use
let _client: ReturnType<typeof createSupabaseClient> = undefined as any;

export function getSupabase() {
  if (typeof window === 'undefined') {
    // Server-side: always create fresh client
    return createSupabaseClient();
  }
  // Browser: use singleton
  if (_client === undefined) {
    _client = createSupabaseClient();
  }
  return _client;
}

// ── Status helper ─────────────────────────────────────────────────────────────
export function isSupabaseActive(): boolean {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}

// ── Type helpers (partial — expand as tables are used) ───────────────────────
export interface DbProject {
  id:            string;
  user_id:       string;
  name:          string;
  idea:          string;
  status:        'running' | 'complete' | 'error' | 'archived';
  current_stage: number;
  total_stages:  number;
  workspace_path: string | null;
  created_at:    string;
  updated_at:    string;
}

export interface DbArtifact {
  id:              string;
  project_id:      string;
  stage_num:       number;
  stage_name:      string;
  file_name:       string;
  content:         string;
  content_parsed:  string | null;
  content_format:  'markdown' | 'json_wrapped' | 'raw';
  version:         number;
  created_at:      string;
  updated_at:      string;
}

export interface DbImprovement {
  id:              string;
  artifact_id:     string;
  project_id:      string;
  user_id:         string;
  intent:          string;
  extent:          string;
  scope:           string;
  content_before:  string;
  content_after:   string;
  reasoning:       string | null;
  impact_warnings: string[];
  model:           string;
  tokens_input:    number;
  tokens_output:   number;
  tokens_total:    number;
  cost_usd:        number;
  ref_doc_count:   number;
  created_at:      string;
}

export interface DbProfile {
  id:           string;
  email:        string;
  display_name: string | null;
  role:         'user' | 'admin';
  plan:         'free' | 'pro' | 'team';
  token_quota:  number;
  tokens_used:  number;
  created_at:   string;
}
