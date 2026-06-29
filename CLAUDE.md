# IdeaGate PMOS — Claude Code Operating Instructions

## PROJECT LOCATIONS
CLI Engine (authoritative backend):     /Users/apple/idea-gate-ui-safe
UI Layer (visualization):               /Users/apple/agent-zero-data/workdir/ui-layer

DO NOT create new directories anywhere on the filesystem.
DO NOT create files outside these two locations.
DO NOT duplicate any file you are modifying.
DO NOT move files between these two locations.

## MODEL REGISTRY — CANONICAL SOURCE (added Mission 11D)

Location:  /Users/apple/agent-zero-data/workdir/ui-layer/src/lib/model-registry.ts
Spec:      /Users/apple/idea-gate-ui-safe/IDEAGATE-MODEL-PLATFORM-SPECIFICATION.md

RULES — NEVER VIOLATE:
- Model IDs are defined ONLY in model-registry.ts
- NEVER hardcode a model ID anywhere else in the codebase
- NEVER add MODEL_IDS or MODEL_LABELS constants to any new file
- Use resolveModelId() for all model key/ID resolution
- Use validateModelId() at every API boundary before resolveModelId()
- LEGACY_KEY_MAP ensures backward compatibility — never remove entries from it

ADDING A NEW MODEL: edit model-registry.ts only. No other file changes needed.
DEPRECATING A MODEL: set enabled:false and status:'deprecated'. No other changes.

QUALITY FINDINGS FROM VALIDATION RUN (Mission 11B):
- 52% truncation rate observed with Owl Alpha (4,000 token max_tokens cap)
- Fix tracked as P-NEW-1 in IDEAGATE-MASTER-TODO.md — implement after Mission 11D

## PROTECTED FILES — DO NOT MODIFY UNLESS SESSION GOAL IS EXPLICITLY THIS FILE
/Users/apple/idea-gate-ui-safe/src/config.js
/Users/apple/idea-gate-ui-safe/src/utils/llm.js
/Users/apple/idea-gate-ui-safe/src/core/lifecycle-engine.js
/Users/apple/idea-gate-ui-safe/workspace/  (runtime artifacts — never touch)

## SESSION PROTOCOL
1. Run git status before touching anything
2. Fix one named thing per session — not a list of things
3. Read the file before editing it
4. Make the smallest change that fixes the problem
5. Run git diff before committing
6. Commit message format: fix: [filename] [what changed] — [why]
7. Never commit without reading the diff first

## WHAT CURRENTLY WORKS — DO NOT REGRESS
- OpenRouter model routing (UI selection reaches OpenRouter correctly)
- 14-stage lifecycle execution (runs to completion with coordinator-v2)
- Artifact generation (comprehensive markdown written to workspace)
- Journey timing tracking (durationMs now accurate)
- Coordinator iteration guard (lifecycle no longer deadlocks)
- API key routing (hardened run-route.ts reads CLI .env directly)

## HARD SAFETY RULES

NEVER RUN:

rm -rf
git reset --hard
git clean -fd
git push --force
git checkout -- .
git restore .

WITHOUT EXPLICIT USER APPROVAL.

Before deleting, moving, renaming, replacing, or overwriting files:

1. Explain why.
2. Show affected files.
3. Wait for approval.

Before every commit:

1. Show git status
2. Show git diff
3. Explain change

Never modify more than one subsystem per session.

Never create:
- IdeaGate_v2
- IdeaGate_new
- IdeaGate_fixed
- IdeaGate_copy
- alternative runtimes

Work only inside:

/Users/apple/idea-gate-ui-safe

/Users/apple/agent-zero-data/workdir/ui-layer

Never modify workspace artifacts.

Never modify generated markdown files.

Never touch runtime output folders.

## MISSIONS COMPLETED (June 2026)

Mission 1: Forensic audit — identified Modes B/C in coordinator-v2.js,
           confirmed rendering pipeline, produced failure-mode evidence table
Mission 2: coordinator-v2.js — eliminated [object Object] (Mode B) via outputStr
           coercion; eliminated raw JSON dumps (Mode C) via char-by-char extraction
Mission 3: parseContent.ts indexOf → lastIndexOf — full content extraction
           (was 70–150 words per stage, now 1,000–2,500 words);
           desk/page.tsx 4-second polling (new artifacts appear without tab switch)
Mission 4: Acceptance testing — all 10 programmatic checks passed
Mission 5: Production readiness audit — 12-item roadmap, architecture analysis
Mission 6A: Repository secured — TypeScript clean, 10 uncommitted files committed,
            v3.3-stable tagged and pushed, ENGINEERING_STATUS.md created
Mission 6B: Run persistence (.current-run.json, GET /api/run restore)
Mission 7:  Stop button (DELETE /api/run, SIGTERM/SIGKILL, PID file)
Mission 8:  Live stage indicator (TopBar banner, STAGE_LABELS map)
Mission 9:  Coordinator stability (type-safe output, quality gate, model fallback)
Mission 10: Content quality (context injection, field sanitization, off-topic detection)
Mission 11: Model Registry Foundation
  11A: model-registry.ts created (22 models, full capability matrix) — 56b5553
  11B: run/route.ts + improve/route.ts migrated to registry — 3470e8f
  11C: GlobalStore.tsx + improve/page.tsx migrated to registry — 0a90ea6
  11D: Documentation + validation + v4.0-registry-foundation tag

## STABLE BASELINE
Tag: v4.0-registry-foundation (2026-06-30)
GitHub: https://github.com/gracias-svg/Idea-Gate

## NEXT SESSIONS
Mission 12: Premium Model Selector Dropdown UI
  - Replace current ModelDropdown with registry-driven 22-model categorized dropdown
  - 7 tier groupings, search/filter, model metadata badges
  - REGISTRY_MODELS already available in improve/page.tsx for this work

DO NOT touch coordinator, lifecycle engine, llm.js, parseContent, desk
unless that mission's explicit goal names those files.