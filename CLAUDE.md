# IdeaGate PMOS — Claude Code Operating Instructions

## PROJECT LOCATIONS
CLI Engine (authoritative backend):     /Users/apple/idea-gate-ui-safe
UI Layer (visualization):               /Users/apple/agent-zero-data/workdir/ui-layer

DO NOT create new directories anywhere on the filesystem.
DO NOT create files outside these two locations.
DO NOT duplicate any file you are modifying.
DO NOT move files between these two locations.

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
Mission 6B: Run persistence — this session (fix/run-persistence branch)

## STABLE BASELINE
Tag: v3.3-stable (2026-06-27)
GitHub: https://github.com/gracias-svg/Idea-Gate

## NEXT SESSIONS
Mission 6B (current): fix/run-persistence
  write .current-run.json on lifecycle start
  restore isRunning + idea on browser refresh via GET /api/run
  files: src/app/api/run/route.ts, src/components/TopBar.tsx

Mission 7: fix/stop-button
  write .current-run.pid, DELETE /api/run, Stop UI button in TopBar

Mission 8: fix/live-stage-indicator
  stage name + active agent in TopBar banner while lifecycle runs

DO NOT touch coordinator, lifecycle engine, llm.js, parseContent, desk
unless that mission's explicit goal names those files.