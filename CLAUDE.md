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
