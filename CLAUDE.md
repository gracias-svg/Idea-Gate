# IdeaGate PMOS — Claude Code Operating Instructions

> This file is auto-loaded at the start of every Claude Code session. It is the
> non-negotiable core. Two halves: ENGINEERING (how to work safely in this repo) and
> DESIGN (how every visual decision must be made). Obey both without being asked.

---

# ═══════════════════════════════════════════════
# PART A — ENGINEERING & SAFETY
# ═══════════════════════════════════════════════

## PROJECT LOCATIONS
```
CLI Engine (authoritative backend):   /Users/apple/idea-gate-ui-safe
UI Layer (visualization):             /Users/apple/agent-zero-data/workdir/ui-layer
```
- DO NOT create new directories anywhere on the filesystem.
- DO NOT create files outside these two locations.
- DO NOT duplicate any file you are modifying.
- DO NOT move files between these two locations.

## MODEL REGISTRY — CANONICAL SOURCE
```
Location:  /Users/apple/agent-zero-data/workdir/ui-layer/src/lib/model-registry.ts
Spec:      /Users/apple/idea-gate-ui-safe/IDEAGATE-MODEL-PLATFORM-SPECIFICATION.md
```
RULES — NEVER VIOLATE:
- Model IDs are defined ONLY in model-registry.ts
- NEVER hardcode a model ID anywhere else in the codebase
- NEVER add MODEL_IDS or MODEL_LABELS constants to any new file
- Use resolveModelId() for all model key/ID resolution
- Use validateModelId() at every API boundary before resolveModelId()
- LEGACY_KEY_MAP ensures backward compatibility — never remove entries from it

ADDING A NEW MODEL: edit model-registry.ts only. No other file changes needed.
DEPRECATING A MODEL: set enabled:false and status:'deprecated'. No other changes.

## PROTECTED FILES — DO NOT MODIFY UNLESS THE SESSION GOAL IS EXPLICITLY THAT FILE
```
/Users/apple/idea-gate-ui-safe/src/config.js
/Users/apple/idea-gate-ui-safe/src/utils/llm.js
/Users/apple/idea-gate-ui-safe/src/core/lifecycle-engine.js
/Users/apple/idea-gate-ui-safe/src/core/coordinator-v2.js
/Users/apple/idea-gate-ui-safe/src/core/journey-engine.js
/Users/apple/idea-gate-ui-safe/workspace/            (runtime artifacts — never touch)
/Users/apple/agent-zero-data/workdir/ui-layer/src/lib/parseContent.ts
/Users/apple/agent-zero-data/workdir/ui-layer/src/app/desk/page.tsx
```
Protected-file exception protocol (all six required): (1) rollback tag pushed before the
first edit; (2) file read completely, relevant sections quoted; (3) additive changes only;
(4) TypeScript 0 errors after each change; (5) owner smoke test before push; (6) if
anything fails, STOP and report.

## SESSION PROTOCOL
1. Run `git status` before touching anything
2. Fix one named thing per session — not a list of things
3. Read the file before editing it
4. Make the smallest change that fixes the problem
5. Run `git diff` before committing
6. Commit message format: `fix: [filename] [what changed] — [why]`
7. Never commit without reading the diff first
8. At ~75% context: stop cleanly, commit what's complete, produce a continuation handoff

## HARD SAFETY RULES
NEVER RUN without explicit user approval:
```
rm -rf              git reset --hard      git clean -fd
git push --force    git checkout -- .     git restore .
```
Before deleting, moving, renaming, replacing, or overwriting files:
1. Explain why.  2. Show affected files.  3. Wait for approval.

Before every commit:
1. Show `git status`   2. Show `git diff`   3. Explain the change

- Never modify more than one subsystem per session.
- Never create IdeaGate_v2 / _new / _fixed / _copy / alternative runtimes.
- Never modify workspace artifacts, generated markdown, or runtime output folders.
- Work only inside the two locations above.

## WHAT CURRENTLY WORKS — DO NOT REGRESS
- OpenRouter model routing (UI selection reaches OpenRouter correctly)
- 14-stage lifecycle execution (runs to completion with coordinator-v2)
- Artifact generation (comprehensive markdown written to workspace)
- Journey timing tracking (durationMs accurate)
- Coordinator iteration guard (lifecycle no longer deadlocks)
- API key routing (hardened run-route.ts reads CLI .env directly)
- 22-model selector (TopBar + Settings parity)
- Studio: IMPROVE NOW + ACCEPT + version tracking + stale propagation
- Stop clears the lock file · New Idea resets RuntimeContext + desk dismissal latch
- Real-time stage banner

## REGRESSION SUITE — run before declaring any visual batch complete
- [ ] Lifecycle runs end to end
- [ ] Stop mid-run clears the lock file
- [ ] Improve an artifact + Accept it
- [ ] New Idea resets the workspace/rail
- [ ] Model selector hits the real API
- [ ] Desk / Studio / Office all still work

---

# ═══════════════════════════════════════════════
# PART B — DESIGN SYSTEM  (auto-loaded — obey without being asked)
# ═══════════════════════════════════════════════

Full visual language:   docs/IDEAGATE-VISUAL-GRAMMAR.md
Governance & authority:  docs/IDEAGATE-DESIGN-CONSTITUTION.md
Build order & sprint:    docs/IDEAGATE-DESIGN-EXECUTION-BLUEPRINT.md

This block is the non-negotiable core. When it and a batch prompt disagree, this wins.
When this and the Visual Grammar disagree, the Grammar wins (it is the fuller source).

## THE STOP RULE — the single most important line in this file
**If the Grammar is silent on a visual decision, STOP AND ASK.**
Silence is NOT permission to improvise. Every flat, generic thing ever produced in this
codebase came from a gap where the spec said nothing and the model used its training-data
average. Do not fill visual gaps with guesses. Stop and ask.

## AUTHORITY (from the Constitution)
- Code wins on matters of FACT (what the store actually holds, what a file contains).
  Verify reality before building — never assume a data shape from a document.
- The Grammar wins on matters of INTENT (how a thing should be constructed).
- Claude Code has NO design authority. Composition and "is this premium?" are human calls.

## TOKENS
- `--ig-*` tokens only. NEVER a raw hex value inside a component.
- Agent identity uses `var(--ig-agent-{co,ps,re,ux,ar,qa})` — never `agentDefs.color`.

## TYPOGRAPHY
- Geist Sans for anything a human reads. JetBrains Mono ONLY for machine data (codes,
  labels, telemetry, logs, IDs, stage numbers), applied per-element — NEVER a global default.
- Stats: 40px/700 numeral + 10px mono label. The 4:1 ratio is mandatory.
- KNOWN DEFECT: layout.tsx `<body>` forces mono globally, overriding Geist Sans app-wide.
  Fixing this is W0. Until fixed, the whole app renders monospace.

## MATERIAL
- Every raised surface: 4 stacked light layers (top-edge highlight, hairline, contact
  shadow, ambient shadow) + a vertical surface gradient. NEVER a 1px border.
- Light always comes from above.
- Grain: one global SVG turbulence overlay at ~2.5%. This is texture, NOT glassmorphism.

## NODES
- A node is a stack of layers, not a shape. Coordinator ≥7 layers, 96px hexagon (the only
  hexagon in the product). Specialists ≥5 layers, 56px circles. Hub:agent ratio 1.7:1.
- Orthogonal encoding: identity = stroke colour, state = emerald glow. Two channels, never merged.
- Build against refs/REF-node-construction.png — LOOK at the image, match its layer count.
  Extract CONSTRUCTION only, never its sci-fi colours or HUD chrome.

## MOTION
- Every animation maps to a real state change. Exactly ONE alive element at any instant.
  ALL motion stops when idle or complete. Everything gates on useReducedMotion.

## INTERACTION — four states, all simultaneously distinguishable
- Hover (surface lightens) · Focus (ring, keyboard only) · Selection (bracket corners) ·
  Active-work (emerald glow + breathe, system-driven).
- Same gesture = same meaning everywhere: Click=select, Esc=back, Enter=open, Cmd+K=command,
  `/`=search, Cmd+Enter=primary action.
- An action with no keyboard path is incomplete. Never a bare spinner — name the operation.

## TELEMETRY — product state only, in canvas negative space, bracketed mono
- PERMITTED: [stage 07/14] [research] [awaiting review] [2 agents active] [confidence: high]
- BANNED: [CPU] [MEM] [GPU] [TEMP] — we are a Product OS, not a machine monitor.
- Real data only. If a value isn't resolved yet, show less — never fabricate to fill space.

## EMPTY STATES
- The structure renders at rest: six dimmed nodes, fifteen pending dots — an organisation
  WAITING. Never blank. Never a bare spinner. Never "no data".
- Empty ≠ Loading ≠ Error. Three states, three treatments. Errors give plain language + a
  next action, never a stack trace.

## BANNED PERMANENTLY
glassmorphism · backdrop-blur · translucency · neon · particles · KPI-card grids ·
device mockups · purple gradients · decorative motion · motion on a timer ·
bracket corners as ambient decoration (they are the SELECTION state only).

## DEFINITION OF DONE (full version: Execution Blueprint §16)
A batch is complete only when: TypeScript 0 errors · build succeeds · no protected file
touched · Phaser never unmounts · regression suite passes · all 9 review lenses pass ·
AND a human has opened a browser and approved it. Otherwise: return to iteration.

---

# ═══════════════════════════════════════════════
# PART C — PROJECT STATE
# ═══════════════════════════════════════════════

## CURRENT BASELINE
```
Tag:     v5.2-pre-mission-control  (commit 82aea5d)
GitHub:  https://github.com/gracias-svg/Idea-Gate
```

## MISSION HISTORY (condensed)
- M1–M11: forensic audit → coordinator output coercion → parseContent full extraction →
  run persistence → Stop button → live stage indicator → coordinator stability →
  content quality → Model Registry foundation (22 models, v4.0-registry-foundation)
- M12: Premium 22-model selector dropdown (v4.1-model-selector)
- M13: config/token fixes, New Idea reset, ModelSelector parity (v4.2-stable)
- M14 / Foundation: OKLCH tokens, Tailwind v4 + shadcn, Geist/JetBrains loaded, motion
  primitives, composition primitives, Zustand execution store, selection contract
  (v5.1-foundation-complete)
- Mission Control M0–M2.5: pure adapter, viz primitives, storytelling motion — built on
  the /mc-scratch route, NOT yet integrated into /office (v5.2-pre-mission-control, 82aea5d)

## CURRENT WORK — Design System sync + Mission Control (Live Orchestration)
Immediate order (see Execution Blueprint):
1. Design sync: append this file, amend Mission Control Spec to defer construction to the
   Grammar (one source of truth), resolve doc duplicates.
2. Install: frontend-design skill, Vercel web-design-guidelines skill, Figma MCP.
3. Run the regression suite as a BASELINE (never done) before any global change.
4. W0 — Material Foundation (GLOBAL, changes every screen): unlock typography, define
   --ig-t-* as real CSS, 4-layer elevation, grain, canvas vignette. Rollback tag +
   before/after screenshots of Desk/Studio/Office first (highest-risk batch).
5. 👀 Human review. Then W1 — node reconstruction + integration into /office.

DO NOT touch coordinator-v2, lifecycle-engine, journey-engine, llm.js, parseContent, or
desk/page.tsx unless the session's explicit goal names that file and the exception
protocol is followed.
