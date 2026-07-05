# IdeaGate PMOS — Engineering Status
Last updated: 2026-06-30
Stable tag: v4.0-registry-foundation

## Mission 11 — Model Registry Foundation (COMPLETE — 2026-06-30)

### Mission 11A — Registry Data Layer
Commit (ui-layer): 56b5553
- Created src/lib/model-registry.ts — 22 active models, full capability matrix
- TypeScript interfaces: ModelEntry, ProviderId, ModelCategory, CostTier, Rating
- LEGACY_KEY_MAP: backward-compatible key resolution (haiku, owlalpha, etc.)
- Access functions: resolveModelId, validateModelId, getModelById, getEnabledModels
- validateRegistry(): startup consistency check
- Status: COMPLETE ✅

### Mission 11B — Backend Route Migration
Commit (ui-layer): 3470e8f
- run/route.ts: MODEL_IDS removed, resolveModelId() + validateModelId() added
- improve/route.ts: same pattern; FREE_MODEL_KEYS replaced with isFree registry field
- Validation run (meal planning app, Owl Alpha): ALL 15 stages complete, $0.00 cost
- 33 API calls | 191,325 tokens | 62.5 minutes | cross-stage coherence confirmed
- Stage 14 synthesis produced "FamilyFork" — named product from lifecycle
- B4 lifecycle test: PASS (run manually by user after Claude Code skipped step)
- Status: COMPLETE ✅

### Mission 11C — Frontend State Migration
Commits (ui-layer): 0a90ea6 | (CLI repo): 0be012d
- GlobalStore.tsx: MODEL_REGISTRY + LEGACY_KEY_MAP imported; registry import added
- GlobalStore.tsx: FREE_MODEL_KEYS kept hardcoded (gemini/ring deprecated keys in
  LEGACY_KEY_MAP are isFree but not in ModelKey union — caused runtime crash when
  filtered dynamically; fixed by reverting to hardcoded array)
- improve/page.tsx: Strategy B — REGISTRY_MODELS added alongside MODELS (as const
  constraint + derived ModelKey type made Strategy A unsafe)
- C4 smoke test: PASS — dropdown renders correctly, no runtime errors
- IDEAGATE-MASTER-TODO.md: P-NEW-1 (max_tokens 4K→8K) and P-NEW-2 (Stage 10 prompt)
  added as tracked items for post-Mission-11D implementation
- Status: COMPLETE ✅

### What Changed Across Mission 11
Before: Model IDs hardcoded in 3+ files. 8 models in dropdown. No capability metadata.
After:  model-registry.ts is canonical source. 22 models registered. Full capability
        matrix per model. Adding a new model = edit one file only. Backward compatible.

### Next: Mission 12 — Premium Model Selector Dropdown UI

---

## Architecture Overview

IdeaGate PMOS is structured as a monorepo containing two subsystems committed to the same GitHub repository (`gracias-svg/Idea-Gate`). The **CLI Engine** (`/Users/apple/idea-gate-ui-safe/`) is an authoritative Node.js backend that runs a 14-stage PM lifecycle via `node src/cli.js v2 "idea"`. It uses `coordinator-v2.js` to orchestrate multi-agent LLM calls through OpenRouter, writing 15 markdown artifacts to a timestamped `workspace/{run}/artifacts/` directory and tracking lifecycle state in `journey.json`. The **UI Layer** (`/Users/apple/agent-zero-data/workdir/ui-layer/`) is a Next.js application that reads those artifacts from the filesystem via API routes and renders them across three views: Desk (reading surface), Improve (LLM-assisted editing), and Office (Phaser-based agent visualization).

The two subsystems are coupled by shared filesystem paths: `CLI_DIR` (where the CLI engine lives) and `PROJECT_PATH` (where `workspace/` is written). The UI layer spawns the CLI lifecycle as a child process via `POST /api/run`, then polls the filesystem every 4 seconds to show new artifacts as they appear. All LLM calls route through OpenRouter; model selection travels from the UI dropdown → `run-route.ts` spawn env → `config.js` dotenv (no-override) → `llm.js`. The system is local-only today; cloud deployment requires a persistent-process host (Railway, not Vercel).

## What Is Verified Working

- **14-stage lifecycle execution** — all 15 stages (0–14) complete via `coordinator-v2.js`
- **OpenRouter model routing** — UI model selection reaches OpenRouter correctly; spawn env wins over `.env` defaults
- **Artifact generation** — 15 markdown files written to `workspace/`, 1,000–2,500 words each
- **Desk rendering** — full content extraction via `parseContent.ts` `lastIndexOf` fix; no truncation at internal `---` rules
- **Desk polling** — `setInterval(loadData, 4000)` in `desk/page.tsx`; new artifacts appear without tab switch
- **Coordinator output contract** — `outputStr` coercion eliminates `[object Object]` (Mode B); char-by-char extraction eliminates raw JSON dumps (Mode C)
- **Hardened API key routing** — `run-route.ts` reads `.env` directly off disk, bypassing stale shell exports
- **Journey timing** — `durationMs` accurate; `startedAt` recorded before agents execute
- **Coordinator iteration guard** — max 2 retries per stage before force-advance; no infinite loops
- **GlobalStore V3.1** — 12-model catalog (4 free-tier), 28 settings, localStorage persistence
- **RuntimeContext** — BroadcastChannel cross-tab event bus, stale artifact graph, telemetry
- **TypeScript** — 0 errors in `src/` (10/10 release checks passing)

## Known Issues and Technical Debt

Ranked by impact:

1. **Run persistence gap** (HIGH) — Browser refresh during active lifecycle loses the running state display (`isRunning`, current idea, current stage). The lifecycle itself continues on disk; the UI just can't see it until the next poll cycle surfaces new artifacts. Fix: write `.current-run.json` on lifecycle start, read it on UI mount. Branch: `fix/run-persistence`.

2. **No stop button** (HIGH) — No mechanism to abort a running lifecycle. Fix: write PID to `.current-run.pid`, add `DELETE /api/run`, add Stop button to TopBar. Effort: 3–4 hours.

3. **DataAgent gap** (MEDIUM) — Stages 1, 4, 5 reference `"DataAgent"` in lifecycle-engine.js but `createAgents()` does not register it. These stages run with one fewer agent contributing. Silent — no crash, no warning. Fix: register a DataAgent stub or remove the reference.

4. **`tokenBudgetPerCall` not wired** (MEDIUM) — GlobalStore setting has no path to `llm.js`; max_tokens is hardcoded to 4000 in config.js regardless of UI setting. Fix: propagate via spawn env.

5. **`isRunning` lost on hot reload** (MEDIUM) — `isRunning` is a module-level boolean in `run-route.ts`. Next.js hot reload resets it to `false` while a lifecycle process is still running. Fix: persist to `.current-run.json` (same as item 1).

6. **No lifecycle timeout** (MEDIUM) — A stalled LLM call leaves `isRunning = true` indefinitely, blocking future runs. Fix: set a 30-minute timeout in `run-route.ts`.

7. **Cloud deployment blocked** (MEDIUM) — `spawn()` requires a persistent Node.js process; Vercel serverless functions max at 60–300 seconds. Full lifecycle runs take 5–20 minutes. Fix: deploy to Railway, Render, or Fly.io.

8. **`workspace/` not gitignored** (LOW) — Untracked but not in `.gitignore`. A `git add .` would accidentally stage runtime artifacts. Fix: add `workspace/` to `.gitignore`.

9. **`.bak` files in repo** (LOW) — `src/core/coordinator-v2.js.bak`, `src/utils/llm.js.bak`, `src/utils/config.js.bak`, `.envtouch` merged in from the shared monorepo's `wip: checkpoint` commit. These are tracked but are build-time noise. Fix: `git rm --cached` them and add `*.bak` to `.gitignore`.

10. **No PM portfolio documents** (LOW — highest ROI) — IdeaGate is a portfolio project. No case study, no metrics framework, no architecture decision records, no demo script exist. A working system without portfolio narrative does not land interviews.

11. **agentStates not connected to runtime** (LOW) — `RuntimeContext.DEFAULT_STATE.agentStates` uses short codes (`CO`, `PS`, etc.) that don't match actual agent names in coordinator-v2.js. Agent state UI shows "idle" permanently.

12. **Ollama fallback will hang in cloud** (LOW) — `llm.js` falls back to `http://127.0.0.1:11434` when no OpenRouter key. In any cloud environment this connection is refused and the process hangs. Fix: throw immediately if no key rather than attempting Ollama.

## Branch Strategy

```
main          — stable releases only; must pass 10-check release readiness gate
fix/*         — individual bug fixes (short-lived; merge with --no-ff then delete)
feat/*        — new features (merge when complete and tested)
```

**Never work directly on main.** All changes go through a named branch.

## Release History

| Tag | Date | Description |
|-----|------|-------------|
| v3.3-stable | 2026-06-27 | First full-stack stable release — rendering fixed, model routing fixed, 10/10 checks |
| (pre-v3) | pre-June 2026 | V1/V2 prototype work before June 2026 sessions |

## Next Engineering Sessions

| Mission | Branch | Goal |
|---------|--------|------|
| 6B | `fix/run-persistence` | Write `.current-run.json` on lifecycle start; restore running state on browser refresh |
| 7 | `fix/live-stage-indicator` | Show current stage name and active agent in TopBar during run |
| 8 | `fix/stop-button` | Abort running lifecycle via SIGTERM; PID file + DELETE /api/run |
| 9 | `feat/cloud-deployment-railway` | Railway config, persistent volume for workspace/, env var mapping |
| 10 | `feat/portfolio-documents` | 10 PM portfolio documents (case study, metrics, ADRs, demo script) |

## Deployment Architecture

```
Current:  Local only
          npm run dev   →  Next.js on :3000
          node src/cli.js v2 "idea"  →  CLI lifecycle, writes to workspace/

Blocker:  spawn() creates a long-running child process.
          Vercel: max 60s (hobby) / 300s (pro). Full lifecycle = 5–20 min.
          Vercel is incompatible.

Path:     Railway (simplest)
          - Persistent Node.js process
          - $5–10/month
          - Set CLI_DIR, PROJECT_PATH, OPENROUTER_API_KEY in Railway dashboard
          - Add Railway Persistent Volume at /app/workspace for artifact persistence
          - railway.json: { "build": { "builder": "nixpacks" }, "deploy": { "startCommand": "npm run dev" } }
```

## Product Tracks

| Track | Focus | Status |
|-------|-------|--------|
| A — Stabilization | run-persistence, stop button, refresh recovery | COMPLETE (v3.5-stable) |
| B — Product Experience | live stage indicator, progress UX, polling improvements | Planned |
| C — Portfolio | 10 PM documents, Loom demo, README rewrite | High ROI, unstarted |
| D — SaaS | Supabase auth, user accounts, persistent storage (schema.sql ready) | Designed, not built |
| E — AI Quality | DataAgent fix, output evaluator, quality scoring | Planned |

---

## STABLE BASELINE — v3.5-stable (June 2026)

### What Is Confirmed Working (do not regress)
- 14-stage lifecycle execution via coordinator-v2.js
- OpenRouter model routing — UI selection reaches agents and merge
- Agent-level model fallback — if primary model fails (404/429), agents retry with openrouter/owl-alpha automatically
- Merge-level model fallback — 3-model sequence before agent-output fallback
- Artifact generation — 15 markdown files per run
- Desk rendering — full content (lastIndexOf fix, no truncation)
- Desk polling — 4-second auto-refresh
- JSON artifact recovery — data/route.ts detects and recovers raw JSON
- Coordinator output contract — no [object Object], no raw JSON dumps
- Coordinator crash fix — typeof check prevents .trim() on non-string output
- Quality gate — iterates once if < 150 words + low confidence
- Run persistence — .current-run.json written on spawn, restored on refresh
- Stop button — DELETE /api/run sends SIGTERM to lifecycle process
- New Idea button — dispatches ideagate:refresh event, clears artifact list
- Agent attribution suppression — merge prompt suppresses "Produced by PM Office"

### Known Dead Models (removed from catalog)
- inclusionai/ring-2.6-1t:free → paid tier (404)
- google/gemini-flash-1.5 → no endpoints (404)

### Current Model Catalog (active)
- openrouter/owl-alpha — CONFIRMED WORKING (appears in all successful fallbacks)
- nvidia/nemotron-3-super-120b-a12b:free — in fallback list
- openai/gpt-oss-120b:free — in catalog (has been rate-limited in past)
- anthropic/claude-haiku-4-5 — paid, reliable
- anthropic/claude-sonnet-4-5 — paid, reliable
- meta-llama/llama-3.3-70b-instruct — paid
- openai/gpt-4o — paid
- deepseek/deepseek-r1 — paid
- qwen/qwen-2.5-72b-instruct — paid
- mistralai/mistral-large-2411 — paid

### Known Weak Point (flagged, not fixed)
- QA-Agent.js has a custom buildPrompt() with ~15 words of instruction and JSON.stringify(context) dump.
  All other agents use base-agent.js's buildPrompt() which is substantially stronger.
  Rewrite of QA-Agent prompt requires user approval before Mission 10C.

### PENDING VALIDATION (user must confirm)
- Full 14-stage lifecycle with Owl Alpha produces real PM content
- Stage 0 shows genuine product brief (not BLOCKED)
- Agent fallback fires correctly when user selects unavailable model
- Stop button actually terminates the lifecycle process
- New Idea button clears artifacts and shows clean Desk

### Next Engineering Sessions
- Mission 11: Model Registry (categorized dropdown, 24 models, 7 tiers)
- Mission 12: PM portfolio documents (10-document set)
- Mission 13: Cloud deployment (Railway + Supabase)
See IDEAGATE-MASTER-TODO.md for full prioritized backlog.

---

## MISSION 10D RESULTS — CONFIRMED (2026-06-28)

### What Was Fixed
- Context injection: Every merge prompt now begins with the product idea text
- Prior stage context: buildPriorContext() passes last 3 stage summaries
- Field sanitization: undefined Decision/Reasoning/Summary now defaults to safe values
- Off-topic detection: artifacts containing zero idea keywords → iterate
- Placeholder detection: [Product Idea] / [To Be Defined] → iterate
- ## Generated By: moved inside content zone (before closing ---)
- File size: shown as "⬇ MD (8.2 KB)" next to download button
- New Idea: clears selected artifact (list cleared in Mission 10E)
- Stage name in banner: added in Mission 10E

### Validation Run 2 (Daily Habit Tracker, Qwen 2.5 72B, 2026-06-28)
- 7 stages completed at time of snapshot (run was still active)
- All 7 stages: on-topic, real content, no placeholders, no undefined
- Stage 6 cross-references Stage 5 validation data — continuity confirmed
- Cost: $0.02 for 7 stages
- Model routing: Qwen 2.5 72B worked correctly with owl-alpha fallback

### What Mission 10E Fixed
- New Idea: artifact list now cleared immediately (setArtifacts([]))
- Running banner: shows "Stage 6/14 · Prioritization" (STAGE_LABELS map)
- IDEAGATE-MASTER-TODO.md: canonical checklist for all pending work

### Still Pending
See IDEAGATE-MASTER-TODO.md for full prioritized list.
Next immediate: raise quality gate threshold (150 → 300 words).

## Release History

| Tag | Date | Description |
|-----|------|-------------|
| v3.5-stable | 2026-06-28 | Stop button, agent fallback, New Idea refresh, model catalog cleanup |
| v3.3-stable | 2026-06-27 | First full-stack stable release — rendering fixed, model routing fixed, 10/10 checks |
| (pre-v3) | pre-June 2026 | V1/V2 prototype work before June 2026 sessions |

---

## Mission 13 — Stabilisation + Settings Parity (July 2026)

Status: COMPLETE. All commits pushed to origin/main.

Note: ENGINEERING_STATUS.md is missing Mission 11 and 12 entries. Not backfilled
here — out of Mission 13 scope. Previous entry: Mission 10E / v3.5-stable (2026-06-28).

Batch A (idea-gate-ui-safe + ui-layer):
  8ef7f3b — docs: correct Nemotron Ultra model ID in planning documents
  29d685b — fix(config): maxTokens 4000 → 8000 (config.js, protected-file exception)
  edafe23 — fix(model-registry): retire Owl Alpha as FALLBACK/DEFAULT model
  P-NEW-1 CLOSED, P-NEW-3 CLOSED, P-NEW-10 CLOSED

Batch B (ui-layer):
  0cc9632 — fix(ux): New Idea resets full workspace state via RuntimeContext
  323d36e — fix(desk): dismissal latch preserves cleared state until new lifecycle
  P-NEW-6 CLOSED, P-NEW-8 CLOSED (already present), P-NEW-11 DEFERRED

Batch C (ui-layer):
  1b13cdf — feat(settings): ModelSelector replaces Sel picker in Settings AI Models
  P-NEW-9 CLOSED

Runtime validation: 14-stage lifecycle, nvidia/nemotron-3-super-120b-a12b:free,
  19 minutes 27 seconds, dollar-zero cost, 27/28 API calls finish_reason: stop.

Key discoveries added to backlog as new P-NEW items:
  P-NEW-18 [HIGH]: coordinator-v2.js has owl-alpha hardcoded at lines 213 + 379
  P-NEW-19 [MEDIUM]: xAI Grok model ID x-ai/grok-4-1-fast returns HTTP 400
