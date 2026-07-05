---
# IDEAGATE-STATE-NOW.md
# Current system state snapshot — IdeaGate PMOS
# Version 3.0 | July 2026 | Created after Mission 13 completion
# This is the first document to read in any new Claude or Claude Code session.
# All facts are verified as of tag v4.2-stable unless marked [INFERRED].

---

## CURRENT RELEASE

Tag:    v4.2-stable (Mission 13 — Stabilisation complete)
Branch: main (both repos)
GitHub: github.com/gracias-svg/Idea-Gate

Previous tag: v4.1-model-selector (Mission 12 complete)

## REPOSITORY PATHS

CLI Engine:  /Users/apple/idea-gate-ui-safe/       (branch: main)
UI Layer:    /Users/apple/agent-zero-data/workdir/ui-layer/  (branch: main)
Dev server:  cd ui-layer && npm run dev → http://localhost:3000

Both local directories push to the same GitHub remote. This is intentional.
A commit pushed from either path appears in both git logs after pull.

## WHAT WORKS (verified end-to-end as of Mission 13)

- Full 14-stage lifecycle via any active OpenRouter model
- 22-model selector in TopBar and Settings AI Models tab (4 categories)
- Model selection flows end-to-end: Settings/TopBar → GlobalStore → run/route.ts → OpenRouter
- Studio flow (URL: /improve): IMPROVE NOW + ACCEPT + version tracking + stale propagation
- Stop button: kills coordinator process, cleans .current-run.json lock file
- New Idea button: clears left rail, resets RuntimeContext, dismissal latch on desk page
- Real-time stage indicator in TopBar banner during lifecycle execution
- OpenRouter cost accounting shows real cost in UI

## WHAT IS AT RISK

P-NEW-18 [HIGH]: coordinator-v2.js has openrouter/owl-alpha hardcoded at lines 213
  (agent-level fallback) AND 379 (merge-level fallback), independent of model-registry.ts.
  Batch A did NOT fix this. Every lifecycle run wastes 2 failed API calls + ~9 seconds
  per stage before recovering. Protected file. Requires explicit Mission 14 scope.

P-NEW-19 [MEDIUM]: xAI Grok 4.1 Fast model ID (x-ai/grok-4-1-fast) at line 412 of
  model-registry.ts returns HTTP 400 from OpenRouter. Correct slug needs verification
  at openrouter.ai/models. Non-protected file, low-risk fix.

RECOVERY_MODEL_IDS third entry (nvidia/nemotron-3-ultra-550b-a55b:free) has no
  ModelEntry in MODEL_REGISTRY. Safe today — RECOVERY_MODEL_IDS is inert until Mission 14
  wires Transparent Recovery Mode. Add ModelEntry before Mission 14 uses this list.

## CURRENT MODEL REGISTRY CONSTANTS (as of Mission 13 Batch A)

In src/lib/model-registry.ts (UI Layer):
  FALLBACK_MODEL_ID  = 'nvidia/nemotron-3-super-120b-a12b:free'
  DEFAULT_MODEL_ID   = 'nvidia/nemotron-3-super-120b-a12b:free'
  RECOVERY_MODEL_IDS = [
    'nvidia/nemotron-3-super-120b-a12b:free',   // primary, production-proven
    'openai/gpt-oss-120b:free',                  // second, catalog-confirmed
    'nvidia/nemotron-3-ultra-550b-a55b:free',    // third, no ModelEntry yet
  ]

In src/config.js (CLI Engine):
  maxTokens: 8000  (raised from 4000 in Mission 13 Batch A)

## PROTECTED FILES (never modify without explicit mission scope)

/Users/apple/idea-gate-ui-safe/src/core/coordinator-v2.js
/Users/apple/idea-gate-ui-safe/src/core/lifecycle-engine.js
/Users/apple/idea-gate-ui-safe/src/core/journey-engine.js
/Users/apple/idea-gate-ui-safe/src/utils/llm.js
/Users/apple/agent-zero-data/workdir/ui-layer/src/lib/parseContent.ts
/Users/apple/agent-zero-data/workdir/ui-layer/src/app/desk/page.tsx

## DOCUMENTATION OWNERSHIP (as of Mission 13)

IDEAGATE-STATE-NOW.md     → current verified runtime state (this file)
IDEAGATE-MASTER-TODO.md   → active backlog and P-NEW items
ENGINEERING_STATUS.md     → historical engineering log
CLAUDE.md                 → operating rules for Claude Code sessions
Mission spec/plan/runbook → planning archive (historical after mission closes)

Note: CLAUDE.md contains sections "WHAT CURRENTLY WORKS" and "PROTECTED FILES"
that partially overlap with this document. Those sections in CLAUDE.md are
superseded by this file. Mission 14 documentation task: update CLAUDE.md to
point to IDEAGATE-STATE-NOW.md for runtime state and remove the overlap.

## IMMEDIATE NEXT MISSION

Mission 14 — Premium UI Foundation
Starting tag: v4.2-stable
Requires: Mission 14 Specification document (not yet written)
Do NOT begin Mission 14 without a Specification document reviewed and approved
in Claude chat first.

Priority prerequisites before Mission 14 implementation begins:
  1. P-NEW-18: coordinator-v2.js owl-alpha fallback (lines 213 + 379)
  2. P-NEW-19: xAI Grok model ID correction in model-registry.ts
  3. RECOVERY_MODEL_IDS third entry: add ModelEntry for nemotron-3-ultra-550b-a55b

*Version 3.0 | July 2026 | First committed version of this document*
---
