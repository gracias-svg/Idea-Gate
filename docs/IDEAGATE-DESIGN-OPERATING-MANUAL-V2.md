# IDEAGATE DESIGN OPERATING MANUAL
## Design Toolkit & Visual Language — Version 2.0
### Zero-Cost Edition | July 2026

> **V2 supersedes V1.** V1 was a tool catalogue with a workflow attached. V2 is a
> **visual language** with tools attached. That inversion is the entire point of this
> revision.
>
> **The corrected mental model:**
> ```
> Visual Language → Design Grammar → Composition → Interaction Grammar
>                 → Implementation → Review → Iteration
> ```
> Tools accelerate craftsmanship. They never define it.
>
> **Figma is the Primary Design Workspace — not the Primary Design Solution.**
> A canvas gives visual judgment a surface to act on. It does not supply the judgment.
> The grammar in Section 3 supplies it.

---

# SECTION 1 — WHERE WE ARE

**Engineering is done being the bottleneck.** Journey Engine, Coordinator, adapters,
execution store, composition primitives — all verified, all working, all clean.

**Design intelligence is the bottleneck.** Two months of evidence: specifications
written in prose produced components built to the *minimum viable interpretation* of
that prose. Our agent node is a circle plus a stroke — two layers. A premium node is
seven. Nothing in any spec said "two layers"; nothing said "seven" either. Prose
under-specifies construction, and construction is what premium *is*.

**The fix is not a better adjective. It is a grammar.** A rule that says *an agent node
is constructed from exactly these six layers, in this order, at these values.* That is
buildable by Claude Code, drawable by a human in Figma, and verifiable by looking.

**Immediate scope.** Office → Analytics → **Live Orchestration** first. Everything in
this document is written to serve that build, then to generalize.

```
Office
├── Analytics                    ← THE PRIORITY
│   ├── Live Orchestration       "What is happening right now?"     ← BUILD FIRST
│   ├── Intelligence & Quality   "Can I trust the output?"          ← next
│   └── Insights & Performance   "How is it performing over time?"  ← after
└── Agent Activity (Phaser)      ← DEPRIORITIZED. Preserve byte-identical. Do not design for it.
```

**Studio is not "Improve."** It is IdeaGate's future creation/editing/orchestration
workspace. Every grammar rule below must survive being applied to Studio without
amendment. If a rule only works for a graph, it is not a grammar rule — it is a hack.

---

# SECTION 2 — DESIGN PHILOSOPHY (unchanged from V1, compressed)

**Identity.** Premium, calm, CLI-native AI Product Operating System. Emerald on
near-black. Two voices: Geist Sans (human reading) / JetBrains Mono (machine data).

**Always true:** one hero per screen at ≥1.7:1 weight · color carries meaning only ·
motion maps to a real state change and stops entirely when idle · every surface has
constructed depth · every stat is one big numeral + one small label + one "so what."

**Never true:** glassmorphism · blur-translucency · neon · RGB decoration · particle
backgrounds · device mockups · two elements of equal weight competing · motion on a
timer · duplicated metrics across screens.

---

# SECTION 3 — THE IDEAGATE VISUAL LANGUAGE LIBRARY

**This is the heart of the document.** Everything else serves it. These are not
suggestions — they are the grammar. A human designing in Figma and Claude Code writing
components must both produce objects that obey these rules.

## 3.1 — Material Language (the foundation everything sits on)

The single largest craft defect in the current build: `--ig-elev-1` is
`inset 0 0 0 1px border`. One layer. That is why every panel reads as a wireframe.

**Every raised surface is constructed from four light layers:**

| Layer | Purpose | Value |
|---|---|---|
| 1. Top-edge highlight | Light hits the top edge first | `inset 0 1px 0 0 oklch(100% 0 0 / 0.05)` |
| 2. Hairline border | Definition, not decoration | `inset 0 0 0 1px var(--ig-border-subtle)` |
| 3. Contact shadow | The surface sits *on* something | `0 1px 2px 0 oklch(0% 0 0 / 0.28)` |
| 4. Ambient shadow | Depth in the room | `0 8px 24px -8px oklch(0% 0 0 / 0.25)` |

**Plus a surface gradient** (never a flat fill):
`linear-gradient(180deg, var(--ig-surface-raised), var(--ig-surface))`

**Plus grain** — one SVG turbulence filter, applied once globally at ~2.5% opacity:
```
<feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4"/>
<feColorMatrix type="saturate" values="0"/>
```
Grain is *material texture*. It is opaque and physical. It is **not** glassmorphism
(which is translucency + blur, and is banned). This is the single technique that most
separates "flat vector" from "real surface," and it is free.

**Light direction is fixed: from above.** Every highlight is on a top edge. Every
shadow falls down. No exceptions — inconsistent light is the fastest way to look
generated.

## 3.2 — Node Construction Language

**The rule: a node is a stack of layers, not a shape.** Minimum five for a specialist,
seven for the Coordinator.

**Coordinator (the hub) — 96px hexagon, seven layers, outer → inner:**
1. **Bloom halo** *(active only)* — the hex duplicated, emerald, through an SVG
   `feGaussianBlur stdDeviation=6` + `feMerge`. Real light. Not a CSS radial-gradient div.
2. **Bracket corners** — four L-shaped 1px marks at the bounding-box corners, ~10px
   arms, `--ig-border-strong`. *This is the highest-value-per-line detail available.*
   It costs twelve lines of SVG and it is the single strongest "this was designed"
   signal in the entire reference library.
3. **Outer frame** — 1px hex outline, emerald @12%, offset 8px outward.
4. **Main hexagon** — fill is a **radial gradient** (`--ig-surface-raised` centre →
   `--ig-surface` edge) so it reads as a *dome*, not a flat disc. 2px emerald stroke.
5. **Top-edge highlight** — 1px path along the upper two edges, white @6%.
6. **Inner core glow** *(active only)* — tight emerald radial at centre.
7. **Content** — mono code + a bracketed telemetry tag: `[stage 07/14]`.

**Specialist Agent — 56px circle, six layers:**
bloom *(active)* → bracket corners (agent colour @30%) → 2px status ring (agent colour)
→ dome-gradient surface → top-arc highlight (white @8%) → mono two-letter code.

**The size ratio is grammar, not taste: 96:56 ≈ 1.7:1.** The hub must dominate. At
1.4:1 (the current 80:56) it reads as "slightly bigger," which reads as "no hierarchy."

**Orthogonal encoding — never violate this:**
- **Identity = stroke colour** (which agent this is)
- **State = emerald glow** (whether it is working)

These are two independent channels. An agent's colour never changes to show state; a
node's glow never changes to show identity. This is what lets a stranger read the graph
without a legend.

## 3.3 — Edge Construction Language

**The rule: work travels. Wires do not shimmer.**

A dashed line scrolling along its own path is a **barber pole**. It reads as decoration
and it is the single most common tell of a generated orchestration graph. Banned.

**An active edge is two paths sharing one `d`:**
1. **The wire** — solid emerald, 1.5px, opacity 0.22. Always visible. It is the *route*.
2. **The pulse** — same path, `stroke-dasharray: "10 240"`, animated `stroke-dashoffset`
   via **CSS keyframes** (not JS — cheaper, reliably 60fps), passed through the bloom
   filter so the travelling segment actually *glows*.

Result: a discrete packet of work moving from Coordinator to agent. That is a handoff.

**Edge states:**
| State | Construction |
|---|---|
| Active | wire + travelling bloomed pulse |
| Waiting | dashed, `--ig-border-default`, opacity ~0.35, static — **must recede** so the active edge sings |
| Blocked | severed (visible gap mid-path), `--ig-danger` |
| Complete | wire only, no pulse |

**Edges fade at their endpoints** — a `linearGradient` stroke going transparent at both
ends, so edges *emerge from* nodes rather than hard-terminating against their borders.
Hard termination is a diagram. Emergence is a system.

**Curvature ~0.4** (XYFlow's `getBezierPath` default of 0.25 is too tight and reads
mechanical).

## 3.4 — Canvas Language

Three layers, never one flat colour:
1. **Vignette** — `radial-gradient(ellipse 80% 60% at 50% 35%, oklch(20% 0.02 165 / 0.45), transparent 70%)` — a soft light behind the hub, pulling the eye to the centre of gravity.
2. **Dot grid** — XYFlow `<Background variant="dots" gap={24} size={1} />` at ~3% opacity. Spatial reference, not decoration.
3. **Grain** — the global overlay from §3.1.

**In-canvas telemetry:** bracketed mono, 9px, `--ig-text-tertiary` @60%, floating in the
graph's *negative space* — not in a panel. `[stage 07/14]` under the hub, `[conf: high]`
near the active agent. This extends the machine-voice rule into the hero itself and is
the detail that makes a canvas feel *instrumented* rather than *empty*.

## 3.5 — Typography Grammar

**Two voices, strictly assigned:**
- **Geist Sans** — anything a human reads: titles, prose, reasoning, stat numerals.
- **JetBrains Mono** — anything a machine produced: codes, labels, telemetry, logs, IDs, timestamps, stage numbers.

Mono is applied **explicitly, per element**. It is never a global default. *(Today the
`<body>` inline style forces mono on the entire application, which is why every screen
reads as a terminal. That override must be removed.)*

**The scale — as real CSS custom properties, not a markdown table:**

| Token | Value | Voice |
|---|---|---|
| `--ig-t-hero` | 40px / 700 / -0.02em | Sans |
| `--ig-t-display` | 28px / 700 / -0.01em | Sans |
| `--ig-t-title` | 18px / 600 | Sans |
| `--ig-t-body` | 14px / 400 / 1.6 | Sans |
| `--ig-t-label` | 10px / 600 / 0.08em / uppercase | **Mono** |
| `--ig-t-caption` | 11px / 500 | **Mono** |

**The 4:1 rule.** Every stat pairs `--ig-t-hero` (40px) with `--ig-t-label` (10px).
That ratio *is* the premium signal. The current build renders both at ~12px — a 1:1
ratio — which is precisely why nothing on screen has hierarchy.

## 3.6 — Spacing Grammar

4px base unit. Panel padding 24px (comfortable) / 16px (compact). Section gaps 32px.
**Hero breathing room ≥ 25% of the hero's own bounding box on every side.** Crowding
is the second-fastest tell of a generated interface, after uniform type size.

## 3.7 — Motion Grammar

**Every motion answers: what changed, why, and what should I look at now.** If it
answers none of those, delete it.

| Behaviour | Trigger | Construction |
|---|---|---|
| **Breathe** | An agent owns `currentStage` and the run is live | scale 1 → 1.03 → 1, 2.4s, ease-in-out, infinite. **Exactly one node breathes at any instant.** |
| **Handoff** | Work is moving CO → agent | the travelling pulse (§3.3) |
| **Propagate** | A stage completes | one-shot ring expanding from the owning node. Emerald if confident, `--ig-caution` if not — *the ripple itself carries the confidence signal.* No separate indicator. |
| **Settle** | Content moves into the record | scale 0.9, translateY 24, fade out, 0.4s ease-in |
| **Reveal** | Content enters | opacity 0→1, translateY 8→0, 0.3s ease-out |
| **Sweep** | Run completes | one left-to-right emerald pass across the stage rail. 400ms. Once. Never repeated. |

**The stillness rule:** when nothing is executing, *nothing moves.* A still screen is
the honest signal that no cognition is happening. Ambient motion on an idle system is a
lie, and users feel it as noise.

**Everything gates on `useReducedMotion`.** No exceptions.

## 3.8 — Interaction Grammar (four distinct states, never conflated)

| State | Signal |
|---|---|
| **Hover** | surface lightens one step, 80ms |
| **Focus** | 2px `--ig-emerald-muted` ring (keyboard only) |
| **Active-work** | emerald glow + breathe (system-driven, not user-driven) |
| **Selection** | persistent 2px `--ig-emerald-muted` ring + surface raise |

These must be *visually distinguishable from each other*. Collapsing hover and selection
into the same treatment is the most common interaction-grammar failure.

**Selection is library-agnostic.** One `selected` entity in the store; XYFlow, ECharts,
Recharts and every future view *subscribe* to it. No view owns its own selection state.
This is what will make Intelligence & Quality open already-focused on whatever you
clicked in Live Orchestration.

## 3.9 — Execution / Reasoning / Confidence Grammar

- **Execution** is shown by *movement along edges*, never by a progress bar.
- **Reasoning** appears as ephemeral mono text near the active node, then settles into
  the record. Real data only — if confidence isn't resolved yet, show the stage label
  alone. **Never fabricate flavour text to fill a gap.**
- **Confidence** is expressed three ways, from *one stored value*, never duplicated:
  Live Orchestration → confidence as **current state** (a filling bar / ripple tone).
  Intelligence & Quality → confidence as **evolution** (how it moved, and why).
  Insights & Performance → confidence as **trend** (across many runs).
- **Completion** is quiet: all motion stops, one sweep, one line of resolution. No confetti.
- **Waiting** recedes. **Blocked** severs. **Loading** names the real operation — never a bare spinner.

## 3.10 — Dashboard Grammar (Analytics, not KPI cards)

- The graph is the hero. Panels support it. **Nothing competes.**
- Metrics live in a thin text band or in `StatBlock`s obeying the 4:1 rule — never a grid of equal cards.
- **One screen, one question.** If two visualizations answer the same question, one of them should not exist.
- No charts in Live Orchestration. Charts answer "how did it trend," which is a different screen's question.

---

# SECTION 4 — COMPONENT DNA

Every important component declares its own DNA. This is the contract a Figma frame and
a React component both satisfy.

## Coordinator Node
| Field | Value |
|---|---|
| **Purpose** | The centre of gravity. Answers "who is orchestrating." |
| **Hierarchy** | Rank 1. The visual hero of the entire product. |
| **Construction** | 96px hexagon, seven layers (§3.2). The only hexagon in IdeaGate. |
| **Motion** | Breathes *only* when it owns `currentStage` (stages 0, 6, 11). When CO is active, **no edge animates** — nothing is being handed off. |
| **Materials** | Dome radial gradient, top-edge highlight, bloom filter |
| **Typography** | Mono code (14/600) + bracketed telemetry tag (9px) |
| **Hover** | Surface lightens; tooltip names its role |
| **Selection** | Emerald-muted ring; all other nodes dim to 60% |
| **Accessibility** | Keyboard-focusable; state announced, not colour-only |
| **Evolution** | With multiple coordinators: hexagons cluster; the *active* one keeps full scale, peers render at 0.8× and desaturated |

## Agent Node
| Field | Value |
|---|---|
| **Purpose** | A specialist's identity and current state |
| **Hierarchy** | Rank 2 |
| **Construction** | 56px circle, six layers (§3.2) |
| **Motion** | Breathes only when it owns `currentStage`. Ripples once when its stage completes. |
| **Typography** | Two-letter mono code + name beneath |
| **States** | active / done / waiting (§3.2). Blocked reserved. |
| **Evolution** | Parallel execution → multiple simultaneous breathers is a **grammar violation**; instead, a parallel *cluster* renders as one grouped container that breathes as a unit, expanding on hover |

## Execution Edge
| Field | Value |
|---|---|
| **Purpose** | Show work *travelling*, not connection existing |
| **Construction** | Two-path travelling pulse (§3.3) |
| **Motion** | CSS `stroke-dashoffset`, bloom-filtered |
| **Evolution** | Branching → the pulse *splits* at the branch point. Conditional routing → the untaken branch renders as `waiting` and dims. |

## Stage Rail
| Field | Value |
|---|---|
| **Purpose** | "Where are we in the mission" — answerable in under one second |
| **Hierarchy** | Rank 3. Lives *inside* the hero, never a separate tab. |
| **Construction** | 15 nodes, hardcoded (never sized from `metrics.totalStages`, which reports 14). 8px dots; current = 10px + 3px ring. |
| **States** | done (emerald) / current (emerald + ring) / low-confidence (amber, overrides done) / pending (outline) |
| **Typography** | Tiny mono stage *numbers* — never truncated names (noise at 15 nodes). The current stage's full name renders **once**, beneath the rail. |
| **Evolution** | Sub-workflows → a stage node becomes expandable, revealing a nested rail inline |

## StatBlock
| Field | Value |
|---|---|
| **Purpose** | One fact, and what it means |
| **Construction** | `--ig-t-hero` numeral + `--ig-t-label` mono label + one "so what" line. **The 4:1 ratio is mandatory.** |
| **Motion** | Number ticks up on change (hand-implemented, ~20 lines) |
| **Anti-pattern** | A grid of four identical cards. If they all look the same, none of them matters. |

## Panel
| Field | Value |
|---|---|
| **Construction** | Four-layer elevation + surface gradient + grain (§3.1) |
| **Typography** | Mono uppercase tracked label; sans content |
| **Anti-pattern** | A 1px border. That is a wireframe, not a panel. |

## Reasoning Tag
| Field | Value |
|---|---|
| **Purpose** | The *why*, at the moment it matters |
| **Construction** | Ephemeral mono caption near the active node, in canvas negative space |
| **Honesty rule** | Real data only. If confidence is unresolved mid-stage, show the stage label alone. Never invent text to fill the space. |

---

# SECTION 5 — FUTURE EVOLUTION STRATEGY

The grammar must survive growth **without redesign**. How each future capability maps
onto existing rules:

| Future capability | How the grammar absorbs it | New rule needed? |
|---|---|---|
| **More agents** (7–12) | Layout constant expands; arc radius grows. Node construction unchanged. | No |
| **Parallel execution** | The one-alive-element rule would break with N breathers. **Resolution:** a parallel group renders as a single grouped container that breathes *as a unit*; individual members are visible but static; hover expands the group. One alive element preserved. | One (grouping) |
| **Nested execution / sub-workflows** | A node becomes *expandable*. Clicking drills in; the canvas reuses `OrchestrationCanvas` with a new adapter. Same node/edge grammar, one level down. | No |
| **Branching** | The travelling pulse **splits** at the branch point. Untaken branches render `waiting`. | No |
| **Conditional routing** | A decision point renders as a small diamond gate (a *third* shape — spend this shape budget carefully; it is the only remaining one). | One shape |
| **Multiple coordinators** | Hexagons cluster. The active one keeps full scale; peers at 0.8×, desaturated. | No |
| **Multiple concurrent runs** | Run *switcher* in the shell, not a split canvas. One run visible at a time — the canvas has one centre of gravity by design. | No |
| **Richer telemetry** | More bracketed mono tags in negative space. The canvas was designed to hold them. | No |
| **Lifecycle expansion (>15 stages)** | Rail is data-driven; it re-renders. *(The hardcoded 15 must become a length-derived value at that point.)* | No |

**The load-bearing insight:** almost everything above is absorbed by rules that already
exist. That is the test of a real grammar — if a new capability requires a new visual
metaphor, the grammar was too shallow. Only two genuinely new rules are needed across
every planned capability.

---

# SECTION 6 — EXTERNAL TOOLS AS DESIGN INTELLIGENCE

**The V1 error:** treating tools as software to install.
**The V2 frame:** treating tools as *sources of design vocabulary.* We are not shopping.
We are studying, extracting, and hand-implementing against our own grammar.

## 6.1 — Figma (Primary Design *Workspace*)

**What it solves:** the medium mismatch. Two months were spent doing visual design in
prompt-space, where you can only *describe* design. A canvas is where you *do* it.

**What it does not solve:** the design itself. A blank Figma file produces nothing. The
grammar in Section 3 is what gets drawn there.

**Setup:** Claude Code → `/plugin` → install `figma` → authorize (OAuth). Free during
beta per Figma's own docs. **Use the official server only** — Framelink has an
unauthenticated RCE (CVE-2025-15061). Never run two Figma MCPs at once.

**The loop that matters:** `generate_figma_design` (Claude-Code-exclusive) captures the
*live running localhost UI* into editable Figma layers. So: send the current flat
`/office` → open it as shapes → resize the hub to 96, fix the type scale, add the four
shadow layers → send it back → Claude Code builds it with exact values.

**Risk:** Figma-generated code drifts toward absolute positioning. **Mitigation:** always
prompt "use our existing tokens and Foundation primitives; do not introduce new CSS."

## 6.2 — Claude Skills

| Skill | Design intelligence it supplies | Decision |
|---|---|---|
| **`frontend-design` (Anthropic)** | Constrains Claude Code away from generic visual defaults *before* it writes code. Directly targets our exact failure mode. Free, official, zero risk. | **Adopt — Stage 1** |
| Multi-style UI skills (glassmorphism/neumorphism/brutalism libraries) | None usable — their default modes are our banned aesthetics | **Reject** |

## 6.3 — Component Ecosystems (extract vocabulary, do not install)

| Source | Design vocabulary to extract | Install? |
|---|---|---|
| **shadcn/ui** | Already our foundation. Accessibility + component architecture. | **Yes — already in** |
| **shadcn MCP** | Lets Claude Code browse registries directly. Chrome only. `npx shadcn@latest mcp init --client claude` | **Yes** |
| **Magic UI** | **Three patterns only:** Number Ticker (StatBlock numerals) · Blur Fade (entrances) · **Noise Texture** (the named grain technique — validation that §3.1's grain is a real, established pattern). Hand-implement all three (~20 lines each). | **No — extract, don't install.** The catalogue is ~90% landing-page spectacle (confetti, meteors, neon gradients). Installing risks inheriting it. |
| **21st.dev** | The one registry positioned for *app* interfaces rather than landing pages. Component *construction* patterns for chrome. | **Skill only** (`npx skills add 21st-dev/skill`). Chrome only. **Never the graph.** Review its output — documented prompt-injection advisories. |
| **Aceternity / react-bits** | Checked both catalogues. 3D tilt, spotlight, parallax, auroras, particles. Nothing maps to orchestration or dashboards. | **Reject** |

## 6.4 — Graph & Motion Ecosystems

| Tool | Vocabulary | Decision |
|---|---|---|
| **@xyflow/react** | Node construction language: nodes are *React components*, so our tokens/Tailwind/Framer Motion work **inside** them. This is precisely why WebGL alternatives are a downgrade. | **Keep** |
| Cytoscape / Sigma / WebGL engines | Win at thousands of nodes. We have six. Trading component-based styling for raw canvas is a downgrade dressed as an upgrade. | **Reject** |
| **d3-shape** | XYFlow's `getBezierPath` at curvature 0.4 is sufficient. | **Reject — no dependency** |
| **framer-motion@12 (installed)** | Motion grammar. Animates OKLCH natively. | **Keep. Never install `motion`** — same engine, different name, breaks the build. |
| Rive / Lottie | Authored animation can't respond to live `runState`. | **Defer** |

## 6.5 — Review & QA

| Tool | Purpose | Decision |
|---|---|---|
| Claude Code Preview (screenshot/eval) | Structural self-verification (already caught a real `fitView` bug) | **Adopt — in use** |
| **Perfect Pixel / PixelZoomer** (browser ext.) | Overlay a reference image on the live render at set opacity. **The best zero-cost way to do the side-by-side acceptance check.** | **Adopt** |
| WebAIM Contrast Checker · axe DevTools | Contrast + ARIA | **Adopt** |
| SVGO | Optimize hand-authored SVG (bracket corners, node shapes) | **Adopt, low priority** |
| Chromatic / Percy | Automated visual regression | **Defer** — paid at any real usage |
| **Mobbin MCP** ($10/mo) | 621k production screens as reference grounding | **Defer** — Figma + human review solves the same problem free. Revisit only if that plateaus. |

## 6.6 — Reference Libraries (human browsing; no connector exists)

Godly · Awwwards · Lapa Ninja · SaaSFrame · UI Garage · Dribbble (with heavy curation —
see §7's warning). **You look, you screenshot, you attach it to the batch prompt.**

---

# SECTION 7 — REFERENCE INTELLIGENCE

## Curation is a skill, and it is not optional

From the last reference packet: **four of seven images were marketing art, not product
UI.** Using them as structural references would have actively pushed IdeaGate toward
the cliché it is trying to escape.

| Reference | Verdict | Extract |
|---|---|---|
| **SebaMini orchestrator** | **Adopt — strongest in the set** | Layered node construction; bracket corners; dome-gradient cores; **bracketed mono telemetry in canvas negative space** |
| **Active Flow Map** (stat cards) | **Adopt** | Huge numeral + tiny muted label; one accent used only on the active path |
| **Satellite dashboard — left panel only** | **Adopt** | Dense small-caps data rows; one severity colour per row |
| Adobe Stock "Multi-Agent Orchestration" HUD | **Reject** | Stock concept art. *This is the exact cliché we are escaping.* Useful as a **negative** reference. |
| Hexacore | **Reject** | Landing-page hero animation |
| "Data UI Mega Kit" | **Reject** | Grid of unrelated widgets — the literal KPI anti-pattern |
| Constellation mockup / light-mode CRM | **Reject** | Ambient illustration / wrong mode + purpose |

**Real products — borrow principles, never pixels:** Linear (hierarchy, restraint,
weight contrast) · Stripe (density that stays scannable) · Vercel (calm surfaces,
execution clarity) · Cursor (AI-native interaction — the felt sense of *something
thinking*) · LangGraph Studio / GitHub Actions (execution-graph conventions).

**Never copy:** anyone's brand colour, anyone's chat-first interaction model, or the
generic DevOps-monitoring aesthetic (an explicit anti-goal).

---

# SECTION 8 — HUMAN-IN-THE-LOOP WORKFLOW

**No visual batch is complete until a human has looked at the rendered screen and said
yes.** This has never happened in this project's history. It is the largest process gap
that exists, larger than any tool gap.

```
1  REFERENCE GATHERING     → real screenshots, never descriptions
2  REFERENCE CURATION      → product UI vs. marketing art. Ruthless.
3  COMPOSITION BLUEPRINT   → wireframe only: hero size, reading order, panel weight.
                             No colour. No font. No motion.
   🚨 MANUAL REVIEW — composition approved before a single component is built
4  TOOL SELECTION          → which of §6 applies to *this* batch
5  IMPLEMENTATION          → Claude Code builds against the reference IMAGE + the grammar
6  INTEGRATION             → into the REAL route. Never a permanent scratch page.
   🚨 MANUAL REVIEW — a human opens a browser. Non-negotiable. No exceptions.
7  CRITIQUE                → "the hub is too small," not "make it premium"
8  ITERATION               → targeted fixes only. Never a rebuild.
9  APPROVAL                → explicit yes
10 REGRESSION              → lifecycle run · Stop clears lock · Improve+Accept ·
                             New Idea resets · model selector · Desk/Studio/Office intact
11 TAG                     → done
```

**What a human must judge (and an AI cannot):**
- Does the hub actually *dominate*, or is it just bigger?
- Does the empty state read as *a team waiting* or as *broken*?
- Does breathe read as *alive* or as *pulsing*?
- Does the edge pulse read as *work moving* or as a *barber pole*?
- Is it dense-and-clear, or cramped?
- **Would you put this screenshot in a portfolio without apologising for it?**

**What must never be skipped:** step 6. Everything else is negotiable under time
pressure. That one is not — skipping it is how five batches shipped without anyone
noticing the app was rendering entirely in monospace.

---

# SECTION 9 — VISUAL ACCEPTANCE CRITERIA

A batch is complete when **all** of these pass — not when TypeScript passes.

- [ ] One unambiguous hero at ≥1.7:1 weight over anything else
- [ ] A real reading order (1st / 2nd / 3rd stop), not a grid
- [ ] ≥3 distinct type sizes with genuine weight contrast (not 11/12/13px)
- [ ] Stats obey 4:1 (hero numeral : mono label) and carry a "so what"
- [ ] Panels have ≥3 shadow layers + surface gradient. **Never a 1px border.**
- [ ] Nodes have ≥5 construction layers; the Coordinator has ≥7
- [ ] Canvas has ≥3 layers (vignette + dots + grain)
- [ ] Active edge is a travelling pulse, not a barber pole
- [ ] Idle edges recede and do not compete
- [ ] Exactly one element is alive at any instant; **everything stops when idle**
- [ ] Bracketed mono telemetry lives in the canvas's negative space
- [ ] Removing all motion still leaves a well-composed static screen
- [ ] A stranger identifies "what's happening" in under 3 seconds
- [ ] Empty state reads as *waiting*, never as broken or blank
- [ ] Zero glassmorphism / neon / particles / device mockups
- [ ] **A human opened the browser and approved it**

---

# SECTION 10 — IMMEDIATE ROADMAP

| Stage | Objective | Deliverable | Depends on | Success criteria | Review |
|---|---|---|---|---|---|
| **1** | Install design skills | `frontend-design` skill live in Claude Code | — | Skill appears in `/plugin` | — |
| **2** | Install Figma MCP | Official Figma MCP connected + authorized | 1 | `/mcp` lists figma as connected | — |
| **3** | **Commit this document** | `docs/IDEAGATE-DESIGN-OPERATING-MANUAL.md` in repo | — | Pushed. Every future prompt cites it by section. | — |
| **4** | **Composition Blueprint** — Live Orchestration | Wireframe: hero 96px hub, agent arc, rail inside hero, right column 300px, vitals ≤36px. No colour, no font. | 3 | Hero ratio ≥1.7:1; reading order explicit | 🚨 **You approve the wireframe** |
| **5** | Capture current UI → Figma | `/office` sent to Figma as editable layers | 2, 4 | Editable frames exist | — |
| **6** | **Design it in Figma** | A frame obeying §3's grammar: 4-layer panels, 4:1 type, 7-layer hub | 5 | Frame passes §9 statically | 🚨 **You design / approve** |
| **7** | Implement | Claude Code builds from the Figma frame + §3 grammar. Material system first (type unlock, elevation, grain, canvas), then node reconstruction. | 6 | §9 checklist passes; 0 TS errors | — |
| **8** | **Integrate into `/office`** | Replaces Analytics content. **Phaser untouched, never unmounts.** `/mc-scratch` deleted. | 7 | Toggle works; no Phaser flicker | — |
| **9** | **Human pixel review** | Specific critique | 8 | — | 🚨 **MANDATORY — you open the browser** |
| **10** | Iterate → approve → regression → tag `v5.3-mission-control` | | 9 | Full regression suite passes | 🚨 **You approve** |
| **11** | Intelligence & Quality | Reuses StageRail / MetricGrid / ActivityStream unchanged | 10 | Grammar applies with zero new rules | 🚨 |
| **12** | Insights & Performance | Same reuse | 11 | Same | 🚨 |
| **13** | Desk | Calm workspace. Grammar inherited. shadcn/21st.dev for chrome. | 10 | No new grammar rules needed | 🚨 |
| **14** | Blueprint | Lifecycle/dependency viz. Reuses OrchestrationCanvas with a new adapter. | 13 | Same canvas, new adapter — **no redesign** | 🚨 |
| **15** | Studio | Creation/editing/orchestration workspace | 14 | Grammar survives unamended | 🚨 |

**The test of this entire document:** by Stage 15, if Studio required inventing a new
visual metaphor, the grammar was too shallow. It shouldn't. That's what a grammar is for.

---

# SECTION 11 — CONTINUOUS DESIGN INTELLIGENCE

**Quarterly review** (or when something notable ships):

| Watch | Question to ask |
|---|---|
| New MCP servers | Does this put *design context* into Claude Code that we currently supply by hand? |
| New Claude Skills | Does this constrain generation toward craft, or just add options? |
| New motion / graph / component libraries | What **vocabulary** does this contribute? (Not: what components can I install?) |
| New AI design tools | Does this move judgment closer to a canvas, or further into prompt-space? |

**The adoption gate — all five must be true:**
1. It solves a *named* problem we actually have.
2. It is additive — no rewrite of engine, adapters, or protected files.
3. It preserves the grammar in Section 3.
4. It is zero-cost, or its cost is justified against a specific failure.
5. It does not make Studio, Desk, or Blueprint harder to build.

**Anything failing one of these is rejected regardless of how good it is.** New
technology enhances IdeaGate; it never redefines it.

---

# SECTION 12 — DESIGN DIRECTOR RECOMMENDATIONS

1. **The grammar is the product, not the tools.** Section 3 is the only part of this
   document that would be catastrophic to lose. Everything else is replaceable.
2. **Install `frontend-design` and Figma MCP this week.** Not because they create
   premium design — they don't — but because one constrains generation toward craft and
   the other gives your judgment a surface. Both are free and both take minutes.
3. **Never ship a scratch route again.** `/mc-scratch` has lived for three batches while
   `/office` showed the old graph. Integrate or delete. Every time.
4. **Attach an image, not an adjective.** Every future batch prompt carries a reference
   image. Prose has been proven twice to under-specify construction.
5. **Do not buy Mobbin yet.** Figma + your own eyes is the cheaper fix for the same problem.
6. **The biggest remaining lever is not a tool — it is you, in a browser, for ten
   minutes, after every batch.** Nothing else in this document matters if that doesn't
   happen.

---

*IdeaGate Design Operating Manual v2.0*
*The grammar is law. One thing is alive. A human looks at every batch.*
*Tools accelerate craftsmanship. They never define it.*
