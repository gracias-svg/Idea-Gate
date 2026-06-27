# IdeaGate PMOS — Engineering Status
Last updated: 2026-06-27
Stable tag: v3.3-stable

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
| A — Stabilization | run-persistence, stop button, refresh recovery | Next (Mission 6B) |
| B — Product Experience | live stage indicator, progress UX, polling improvements | Planned |
| C — Portfolio | 10 PM documents, Loom demo, README rewrite | High ROI, unstarted |
| D — SaaS | Supabase auth, user accounts, persistent storage (schema.sql ready) | Designed, not built |
| E — AI Quality | DataAgent fix, output evaluator, quality scoring | Planned |
