# IDEAGATE DESIGN EXECUTION BLUEPRINT
## Version 1.0 | The Implementation Playbook
### July 2026

> **This is the last document.** It contains no aesthetics, no philosophy, no governance.
> It answers one question: *exactly what do we build, in what order, with which tools,
> with which checkpoints, and how do we know we can move on?*
>
> **Binding clause:** No further design, governance, or strategy documents are written
> until Live Orchestration is rendered, integrated into `/office`, and approved by a
> human under the nine review lenses (Grammar §12). If a gap appears, it is fixed in the
> Grammar — not in
> a new document.
>
> **Companion documents:** THE CONSTITUTION (authority) · THE GRAMMAR (visual language)
> · THE LOG (tool + reference history). This blueprint executes them.

---

# 1. PURPOSE

**Why now.** The bottleneck is no longer *what premium looks like* — the Grammar defines
that. It is no longer *who decides* — the Constitution defines that. It is no longer
*what tools exist* — the Log defines that.

The bottleneck is **executing premium consistently, without drift, without repeating
work, and without another planning cycle.**

**Why no more governance documents.** Eight documents exist. Zero premium pixels have
shipped. Every additional governance layer increases the surface area for contradiction —
this project has already lost a full Claude Code session to two documents disagreeing
about Tailwind. The next artifact is a screen.

---

# 2. CURRENT PROJECT STATE (verified, not assumed)

## What is done
| | Evidence |
|---|---|
| Foundation complete | tag `v5.1-foundation-complete` — OKLCH tokens, Tailwind v4 + shadcn, Geist/JetBrains loaded, motion primitives, composition primitives, execution store, selection contract |
| Providers wired, store hydrating live | commit `2c23d1d` — verified: `currentStage: 13`, 14 stages, 28 events from real `/api/journey-state` |
| Mission Control M0–M2.5 | tag `v5.2-pre-mission-control` @ `82aea5d`; adapter `690ba2f`; viz primitives `c83e844` + `dc92a10`; storytelling `0c5f920` |
| Adapter layer clean | Pure function. Runtime → Store → Adapter → Viz Models → Components. Engine untouched. |
| Reference library curated | 3 adopt / 4 reject, with reasons. Two crops extracted. |
| Tool evaluation complete | Figma MCP, shadcn MCP, 21st.dev, Magic UI, Aceternity, Mobbin — all adjudicated |
| Constitution + Grammar written | V3 |

## What is NOT done — the honest list
| Gap | Consequence |
|---|---|
| **Mission Control is on `/mc-scratch`, not `/office`** | The user has been looking at the OLD flat graph for three batches |
| **`<body>` forces JetBrains Mono globally** (`layout.tsx` inline style) | Every screen in the app renders in monospace at 11–13px. Zero type hierarchy. |
| **`--ig-t-*` type scale never became CSS** | The 4:1 stat ratio is impossible to build |
| **`--ig-elev-1` is `inset 0 0 0 1px border`** | One layer. This *is* the "flat" complaint. |
| **Canvas is hardcoded `#020609`** | Not even the OKLCH token |
| **Nodes are 2 layers** (circle + stroke) | Reference is 7. This *is* the "engineering prototype" complaint. |
| **Manual regression gate NEVER RUN** | Lifecycle / Stop / Improve+Accept / New Idea / model selector — never verified end-to-end |
| **`frontend-design` skill not installed** | Approved weeks ago, never done |
| **Figma MCP not installed** | — |
| **Reference images not in repo** | Claude Code cannot see them |
| **No human has ever reviewed a rendered batch** | The root cause of everything above |

## Deferred, deliberately
Agent Activity (Phaser) — preserve byte-identical, do not design for it.
Intelligence & Quality, Insights & Performance — after Live Orchestration is proven.

---

# 3. BUILD ORDER (Waves)

**The critical insight that reorders everything:** the material system is **not part of
Mission Control**. It is the substrate every screen sits on. Unlocking typography changes
Desk, Studio, and Office *simultaneously*. It must be its own wave, and it must come
first.

| Wave | Contains | Why this order |
|---|---|---|
| **W0 — Material Foundation** *(global)* | Type unlock · `--ig-t-*` as CSS · 4-layer elevation · grain · canvas vignette · Lucide consistency | Every subsequent wave inherits it. Building Mission Control on a wireframe substrate wastes the work. |
| **W1 — Live Orchestration** ⭐ | 7-layer Coordinator · 6-layer agents · bloomed travelling-pulse edges · in-canvas telemetry · stage rail · vitals · **integration into `/office`** | **The Grammar's proof of concept.** One screen, done properly, human-approved. |
| **🚦 HARD GATE** | Human approval under the nine review lenses (Grammar §12) | **Nothing proceeds until this passes.** |
| **W2 — Intelligence & Quality + Insights & Performance** | Reuse StageRail / MetricGrid / ActivityStream / OrchestrationCanvas with new adapters | Cheap *once W1 is validated*. Expensive and wasteful before. |
| **W3 — Desk (Artifact Reading)** | Reading · navigation · typography · annotations | Highest-traffic surface. Protected file → exception protocol required. |
| **W4 — Studio** | Improve · AI editing · versions · AI collaboration | The Grammar's real stress test. If Studio needs a new metaphor, the Grammar was too shallow. |
| **W5 — Blueprint** | Lifecycle viz · dependency graph · architecture explorer | Reuses `OrchestrationCanvas` with a new adapter — **no redesign** |
| **W6 — Agent Activity** | Pixel environment | Deferred indefinitely. May never be re-done. |

**Design Director call — W1 is Live Orchestration ONLY, not all three analytics screens.**
Building three screens before *any* has been human-approved is the same mistake at 3×
the cost. Prove one.

---

# 4. THE EIGHT LAYERS (every screen, every wave)

Each wave is built in this order. **A layer is not started until the one above it passes.**

| # | Layer | Owner | Exit criterion |
|---|---|---|---|
| 1 | **Data** | Claude Code | Adapter is pure; no viz prop mentions a runtime field; verified against a live run |
| 2 | **Layout** | Human (blueprint) → Claude Code | Composition Blueprint approved. Hero ≥1.7:1. Reading order explicit. |
| 3 | **Visual hierarchy** | Claude Code, per Grammar | ≥3 type sizes · 4:1 stat ratio · ≥3 shadow layers · ≥5 node layers |
| 4 | **Motion** | Claude Code, per Grammar | Every animation maps to a state change. Exactly one alive element. **Everything stops when idle.** |
| 5 | **Micro-interactions** | Claude Code | Hover / focus / active-work / selection are four *distinguishable* states |
| 6 | **Accessibility** | Claude Code | Keyboard-reachable · contrast passes · `useReducedMotion` honoured · never colour-only |
| 7 | **Performance** | Claude Code | 60fps with graph animating. SVG filters profiled. No layout thrash. |
| 8 | **Human QA** | **Human, in a browser** | The nine review lenses (Grammar §12) pass. **Non-negotiable.** |

---

# 5. TOOL PIPELINE (no ambiguity)

```
REFERENCE IMAGE (refs/*.png)
        ↓
CLAUDE CHAT  ──────────→  Composition Blueprint (wireframe, no colour)
        ↓
   🚨 HUMAN APPROVES the blueprint
        ↓
[optional fork] FIGMA MCP  ← only if composition is uncertain or W1 review fails
        ↓
CLAUDE CODE  ← frontend-design skill active
             ← reads THE GRAMMAR by section
             ← LOOKS AT the reference image
             ← 21st.dev / shadcn MCP for CHROME ONLY (never the graph)
             ← Magic UI: 3 extracted patterns only, hand-implemented
        ↓
BROWSER (integrated route — never a scratch page)
        ↓
   🚨 HUMAN REVIEW — nine lenses (Grammar §12)
        ↓
REVISION (targeted, never a rebuild)
        ↓
REGRESSION → TAG
```

**Figma's placement is deliberate and narrow.** The Grammar is specific enough (96px
hexagon, 7 named layers, exact values) that Claude Code can build W1 from spec + image.
Figma earns its place where composition is genuinely *open* — Desk and Studio — and as
the **escape hatch** if W1's human review fails and we need to explore alternatives
visually instead of iterating blind.

---

# 6. HUMAN REVIEW PROTOCOL

Not "look at it." A sequence, in order, on the **integrated route**:

```
1.  HIERARCHY      → Cover the hero with your hand. Does the screen lose its centre?
2.  SPACING        → Does the hero breathe, or is it crowded?
3.  TYPOGRAPHY     → Count the distinct sizes. Fewer than 3 = fail.
4.  MATERIAL       → Does a panel look like a surface, or like a 1px rectangle?
5.  COMPOSITION    → Is there a reading order, or is it a grid?
6.  MOTION         → Does breathe read as ALIVE or as PULSING?
                     Does the edge read as WORK MOVING or as a BARBER POLE?
                     When idle — does EVERYTHING stop?
7.  INTERACTION    → Are hover / focus / selection visibly different from each other?
8.  STORYTELLING   → Does it show what CHANGED and WHY — or only WHO is working?
9.  ACCESSIBILITY  → Tab through it. Can you reach everything?
10. PORTFOLIO      → Screenshot it. Would you show this to a hiring manager
                     WITHOUT APOLOGISING?
        ↓
    APPROVE  or  SPECIFIC NOTES ("the hub is too small" — never "make it premium")
```

**Time required: 10–15 minutes.** This has never happened once in this project. Five
batches shipped while the entire application rendered in monospace. No tool would have
caught that. A person, for ten minutes, would have.

---

# 7. EXTERNAL TOOL MATRIX

| Tool | Exact problem it solves | When used | Who runs it | Cost |
|---|---|---|---|---|
| **`frontend-design` skill** | Claude Code defaults to generic output when the spec is silent | **Every implementation batch** | Claude Code | Free |
| **Figma MCP** | Visual iteration has no surface; judgment can't act in prompt-space | Composition uncertainty · W1 review failure · W3/W4 | **Human** | Free (beta) |
| **shadcn MCP** | Chrome components from scratch is slow | Component implementation, **chrome only** | Claude Code | Free |
| **21st.dev skill** | Same — app-interface component patterns | Chrome only. **Never the graph.** Review output (injection advisories). | Claude Code | Free tier |
| **Magic UI** | Interaction vocabulary: Number Ticker, Blur Fade, Noise Texture | Extracted by hand (~20 lines each). **Not installed.** | Claude Code | Free |
| **@xyflow/react** | Graph rendering with React-component nodes | Mission Control, Blueprint | Claude Code | Free |
| **framer-motion** | Motion grammar | Every wave | Claude Code | Free |
| **Perfect Pixel** (browser ext.) | "Does it match the reference?" answered objectively | Human review — overlay ref on live render | **Human** | Free |
| **axe DevTools / WebAIM** | Accessibility verification | Layer 6 | Human | Free |
| **Mobbin** | Reference grounding | **Deferred** — Figma + human eyes is the free equivalent | — | $10/mo |
| **Aceternity / react-bits** | — | **Rejected.** Landing-page spectacle. Nothing maps to orchestration. | — | — |

---

# 8. FUTURE EVOLUTION (pre-adjudicated — no redesign required)

| Event | Absorbed how | New rule? |
|---|---|---|
| More agents (7–12) | Layout constant expands; arc radius grows | No |
| **Parallel execution** | Would break one-alive-element. **Resolution:** a parallel group is ONE container that breathes as a unit; members static; hover expands | Grouping |
| Nested execution | Node becomes expandable; drill-in reuses `OrchestrationCanvas` + new adapter | No |
| Branching | The travelling pulse **splits** at the branch point | No |
| Conditional routing | A diamond gate — **the last shape in the budget** | One shape |
| New lifecycle stages | Rail is data-driven; re-renders *(the hardcoded 15 becomes length-derived)* | No |
| New metrics | Stored once; viewed as three perspectives (state / evolution / trend) | No |

---

# 9. QUALITY GATES

**A wave does not advance unless every gate passes.** TypeScript passing is not a gate —
it is a precondition.

```
✓ Data          adapter pure · no runtime leak into viz props · verified on a live run
✓ Hierarchy     one hero ≥1.7:1 · reading order explicit
✓ Spacing       hero breathing room ≥25% of its own box
✓ Typography    ≥3 sizes · 4:1 on every stat · mono only on machine surfaces
✓ Material      ≥3 shadow layers + surface gradient + grain · ≥5 node layers · ≥7 for CO
✓ Motion        every animation ↔ a real state change · ONE alive element · STOPS when idle
✓ Interaction   4 distinguishable states
✓ Storytelling  shows what changed + why + what's next
✓ Accessibility keyboard · contrast · reduced-motion · not colour-only
✓ Performance   60fps with the graph animating
✓ Identity      no glassmorphism / neon / particles / KPI-card grid / device mockup
✓ Regression    lifecycle · Stop clears lock · Improve+Accept · New Idea · model selector
✓ PORTFOLIO     screenshot survives a hiring manager without apology
✓ HUMAN         a person opened a browser and said yes
```

---

# 10. TIME ESTIMATION

Units are **Claude Code sessions** (~1 batch each, stop at 75% context) and **human
hours**. Calendar days assume one focused session per day.

| Wave | CC sessions | Human hours | Calendar |
|---|---|---|---|
| Setup (tools, docs, regression baseline) | 0 | 2h | Day 1 |
| Composition Blueprint | 0 (Chat) | 1h review | Day 2 |
| **W0 — Material Foundation** | 1–2 | 0.5h review | Day 3 |
| **W1a — Node reconstruction** | 1–2 | 0.5h review | Day 4 |
| **W1b — Integration + human QA** | 1 | **1.5h review** | Day 5 |
| W1 iteration (assume 1–2 rounds) | 1–2 | 1h | Days 6–7 |
| **→ Mission Control complete** | **~6–8 sessions** | **~7h human** | **~1 week** |
| W2 — Intelligence & Insights | 3–4 | 2h | Week 2 |
| W3 — Desk | 3–4 | 2h | Week 3 |
| W4 — Studio | 4–6 | 3h | Weeks 4–5 |
| W5 — Blueprint | 3–4 | 2h | Week 6 |

**Honest caveat:** these assume the human review actually happens and produces specific
notes. If it doesn't, the estimate is meaningless — that's the variable that has broken
every previous estimate in this project.

---

# 11. RISK REGISTER

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| **R1** | **Human review skipped again** | **High** (100% historical) | **Fatal** | It is a Stop Condition in the Constitution. A batch without it is *not complete*, regardless of tags. |
| **R2** | Grammar drift — Claude Code improvises in a gap | High | Severe | *Silence in the Grammar is a STOP.* Codified in Constitution §5. |
| **R3** | **Material system breaks existing screens** — the type unlock is **global** | **High** | Severe | W0 is its own batch. Screenshot Desk + Studio + Office before AND after. Rollback tag first. |
| **R4** | Performance — SVG bloom filters + grain overlay on every frame | Medium | Moderate | Profile in W1. Bloom only on the *active* node (1 of 6). Grain is a static overlay, not per-frame. If it drops frames, reduce `stdDeviation` before removing the effect. |
| **R5** | Phaser unmounts on toggle | Medium | Severe | `display:none` only. Never conditional render. Verify with a diff. |
| **R6** | Protected file breach (`desk/page.tsx` in W3) | Medium | Severe | Exception protocol: rollback tag → read fully → additive only → owner smoke test |
| **R7** | Context exhaustion mid-batch | Medium | Moderate | Stop at 75%, commit, hand off. Already codified. |
| **R8** | Figma divergence — two sources of truth | Medium | Moderate | Figma is a *workspace*, not an authority. Code + Grammar are truth. Never let a Figma file drift into being "the design." |
| **R9** | Scratch route persists | Medium | Moderate | `/mc-scratch` is **deleted in W1b**. Non-negotiable. |
| **R10** | Grammar turns out to be wrong | **Certain, in part** | Moderate | Expected. Fix the Grammar, propagate to all surfaces (Constitution §9). Do not patch one screen. |

---

# 12. EXIT CRITERIA — "Mission Control is complete"

All must be true. No partial credit.

```
□ /office Analytics renders the new Mission Control (not /mc-scratch)
□ /mc-scratch deleted
□ Agent Activity toggle works; Phaser never unmounts; no flicker
□ Coordinator: 96px hexagon, ≥7 construction layers, dominates at ≥1.7:1
□ Agents: 56px, ≥5 layers, orthogonal encoding (stroke=identity, glow=state)
□ Edges: travelling bloomed pulse. Not a barber pole. Idle edges recede.
□ Canvas: vignette + dot grid + grain (3 layers, not flat)
□ Panels: ≥3 shadow layers + surface gradient
□ Typography: Geist Sans for reading, mono ONLY on machine surfaces, 4:1 stat ratio
□ In-canvas bracketed mono telemetry present
□ Exactly one alive element; ALL motion stops when idle/complete
□ Empty state reads as "a team waiting," never as broken
□ 60fps with the graph animating
□ Keyboard-reachable; contrast passes; reduced-motion honoured
□ Regression: lifecycle · Stop · Improve+Accept · New Idea · model selector · Desk/Studio intact
□ 0 TypeScript errors; production build succeeds
□ 🚨 HUMAN approved under the nine review lenses (Grammar §12)
□ Tagged v5.3-mission-control
```

---

# 13. DECISION REGISTER (settled — do not re-litigate)

| Question | Decision |
|---|---|
| Adopt Figma MCP (official)? | **YES** — workspace, not solution. Official only (Framelink has an RCE CVE). |
| Install `frontend-design` skill? | **YES** — every batch |
| Extract Magic UI patterns? | **YES — 3 only** (Number Ticker, Blur Fade, Noise Texture), hand-implemented. **Do not install.** |
| Install Aceternity / react-bits? | **NO** — landing-page spectacle |
| shadcn MCP / 21st.dev? | **YES — chrome only. Never the graph.** |
| Buy Mobbin? | **DEFER** — Figma + human eyes is the free equivalent |
| Replace XYFlow? | **NO** — React-component nodes are exactly why we chose it |
| Add d3-shape? | **NO** — `getBezierPath` at curvature 0.4 suffices |
| Install `motion` package? | **NO** — conflicts with installed `framer-motion@12` |
| ECharts in Live Orchestration? | **NO** — charts answer a different screen's question |
| Glassmorphism / neon / reflections? | **NO** — permanently. Depth via layered light, never blur. |
| Build all 3 analytics screens in W1? | **NO** — prove one first |
| Agent Activity redesign? | **NO** — deferred indefinitely |

---

# 14. THE IMMEDIATE SPRINT

## DAY 1 — Setup (human, ~2 hours, zero code)

```bash
# 1. Save the reference crops into the repo
mkdir -p /Users/apple/agent-zero-data/workdir/ui-layer/refs
# → drop REF-node-construction.png and REF-stat-typography.png in there

# 2. Save Constitution + Grammar into docs/

cd /Users/apple/agent-zero-data/workdir/ui-layer
git add refs/ docs/
git commit -m "docs: design constitution, grammar, and visual references"
git push origin main
```

**3. Install the tools** — in Claude Code:
- `/plugin` → install `frontend-design` skill
- `/plugin` → install `figma` → authorize (OAuth)

**4. 🚨 RUN THE REGRESSION BASELINE — this has never been done.**
In the browser: run a full lifecycle · Stop mid-run (confirm the lock file clears) ·
Improve an artifact · Accept it · New Idea (confirm the rail resets) · switch models
(confirm it hits the real API).

**Exit:** tools connected · docs and refs in the repo · **the app is verified working
before we change anything global.**

---

## DAY 2 — Composition Blueprint (Claude Chat + human, ~1 hour)

Claude Chat produces the wireframe for Live Orchestration: hero size, region weights,
reading order, density. **No colour. No type. No motion.** Boxes and numbers.

**🚨 You approve it before a single component is touched.**

**Exit:** an approved wireframe.

---

## DAY 3 — W0: Material Foundation (Claude Code, 1 session)

The global substrate. **This changes every screen in the app.**

- Remove the `<body>` mono override in `layout.tsx`; replace `#020609` with `var(--ig-canvas)`
- Define `--ig-t-hero/display/title/body/label/caption` as real CSS custom properties
- Rebuild `--ig-elev-1/2` as 4 stacked light layers + surface gradient
- Add the global grain overlay (SVG turbulence, 2.5%)
- Canvas: vignette + XYFlow dot Background
- Enforce Lucide icons (replace unicode glyphs)

**Rollback tag first.** Screenshot Desk, Studio, and Office **before and after** — this
is R3, the highest-impact risk in the register.

**🚨 Human review:** does the app still work? Is type hierarchy now visible? Do panels
look like surfaces?

**Exit:** material system live · zero regressions · type hierarchy visibly present.

---

## DAY 4 — W1a: Node Reconstruction (Claude Code, 1–2 sessions)

Against `refs/REF-node-construction.png` — **Claude Code LOOKS at the image.**

- Coordinator: 96px hexagon, 7 layers (bloom · bracket corners · outer frame · dome
  gradient · top highlight · core glow · content + `[stage 07/14]`)
- Agents: 56px, 6 layers
- Edges: bloomed travelling pulse; wire fades at endpoints
- In-canvas bracketed mono telemetry
- SVG `<defs>`: `ig-bloom` (feGaussianBlur + feMerge), `ig-dome` (radialGradient)

**Exit:** side-by-side against the reference. Do our nodes have as many layers as the
reference's nodes? If not, keep going.

---

## DAY 5 — W1b: Integration + Human QA (Claude Code + human, ~1.5h human)

- Replace **only** the children of the analytics wrapper in `office/page.tsx`
- **Phaser untouched.** `display:none` only. Show the diff.
- Delete `/mc-scratch`
- Regression suite

**🚨 HUMAN REVIEW — the whole point of everything.** The nine review lenses (Grammar §12),
in the browser, on `/office`. 10–15 minutes. Specific notes.

**Exit fork:**
- **Pass** → iterate on notes → tag `v5.3-mission-control` → W2
- **Fail** → **this is where Figma enters.** Send `/office` to Figma, redesign the failing
  aspect on the canvas, send it back. Do not iterate blind in prompt-space — that is the
  loop that cost two months.

---

# 15. THE ONE THING

If everything else in this document is ignored, this is the one that matters:

> **Day 5's human review is the entire project.**
>
> Not the tools. Not the Grammar. Not the Constitution. Every failure in this project's
> history — the monospace app, the two-layer nodes, the scratch route nobody looked at,
> the flat panels — would have been caught by one person, in a browser, for ten minutes,
> once.
>
> Everything in the previous eight documents exists to make that ten minutes possible.
> If it doesn't happen, nothing else does.

---
# 17 — EXPRESS SPRINT CRITERIA

Per sprint: **one concern · one rollback point · one regression check · one visual review ·
one obvious user-visible improvement.**

> **A sprint that is technically correct but imperceptible to the user is a failed sprint.**

Move quickly; never rush architecture. Small, measurable, reviewable, reversible batches.
Additive over replacement. When several small fixes appear, group them into a reusable pattern
rather than page-specific patches — **every sprint leaves the Design System stronger.**

The documentation phase is closed. If a rule is missing, amend the Grammar; do not write a
new document.

# 18 — THE DESIGN ACQUISITION PIPELINE

Runs in full **only** when introducing a new reusable principle. Most sprints enter at
Implementation.

*IdeaGate Design Execution Blueprint v1.0*
*The last document. The next artifact is a screen.*