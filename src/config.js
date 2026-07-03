import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ── MODEL ROUTING PRINCIPLE ───────────────────────────────────────────────
// dotenv.config() is called WITHOUT override: true.
//
// IdeaGate uses a spawn-based model routing architecture:
//   UI Selection → run-route.ts → spawn(env: { OPENROUTER_MODEL, OPENROUTER_API_KEY })
//
// The spawn explicitly sets both values in the child process environment
// BEFORE this file is evaluated. dotenv.config() with NO override respects
// values already present in process.env — meaning the caller's explicit
// values always win over .env file defaults.
//
// override: true was the sole cause of the model mismatch (proven by diagnostic):
//   [1] At spawn:      openrouter/owl-alpha   ← UI selected, correct
//   [2] After dotenv:  openrouter/owl-alpha   ← unchanged, correct
//   [3] After config:  anthropic/claude-haiku ← override:true stomped it ← FIXED
//
// Priority hierarchy (highest to lowest):
//   1. Spawn-injected values  (run-route.ts — represents UI selection)
//   2. .env file values       (dotenv.config — terminal run defaults)
//   3. Hardcoded fallbacks    (llm.js model: || "x-ai/grok-4-fast" — last resort)
//
// This file must never use override: true.
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const config = {

  // Legacy model field — not used for OpenRouter routing.
  // OPENROUTER_MODEL in process.env controls the actual model.
  model: process.env.MODEL || "qwen3:8b",

  // Token limit per LLM call. Raised from 4000 → 8000 (Mission 13, P-NEW-1):
  // 4000 caused a 52% truncation rate observed in Mission 11B validation.
  maxTokens: 8000,

  temperature: 0.4,

  // Paths
  rootDir:      join(__dirname, '..'),
  promptsDir:   join(__dirname, 'prompts'),
  templatesDir: join(__dirname, 'templates'),
  workspaceDir: process.env.WORKSPACE_DIR || join(__dirname, '../workspace'),

  debug: process.env.DEBUG === 'true',

  validate() { return true; }

};
