# THE IDEAGATE VISUAL GRAMMAR
## The Single Source of Truth for Visual Construction
### Version 1.0 | July 2026

> **What this document is.** The visual language of IdeaGate. Every construction rule —
> how a node is built, how a panel gets depth, what a motion means, how interaction works.
>
> **Who reads it.** Claude Code, on every implementation batch, without exception.
>
> **Its authority.** Construction rules live ONLY here. If any other document — including
> the Mission Control Spec — disagrees with this one on construction, **this document
> wins.** Other documents describe *what to build*; this one describes *how it is made*.
>
> **The stop rule.** If this Grammar is silent on a visual decision, **STOP AND ASK.**
> Silence is not permission to improvise. Every flat, generic thing in this codebase was
> produced in a gap where the specification said nothing.

---

## HOW TO READ THE STATUS TAGS

Every rule carries one. Nothing is permanent until it survives implementation.

| Tag | Meaning |
|---|---|
| ✅ **VALIDATED** | Built in this codebase. Rendered. Works. |
| 🏛 **INDUSTRY-PROVEN** | Standard practice at Linear/Stripe/Vercel. Unbuilt here, but low risk. |
| 🔬 **EXPERIMENTAL** | Reasoned, unbuilt, may not survive contact. Expect revision. |
| 🧪 **HYPOTHESIS** | Derived from a single reference. Weakest evidence in the document. |
| ❌ **REJECTED** | Considered and refused. Recorded so it is never re-litigated. |

**A 🧪 rule that fails human review is not a failure of the project. It is the Grammar
doing its job.** Fix the rule, propagate to all surfaces, move on.

---

# §1 — MATERIAL LANGUAGE

## 1.1 Elevation — four layers, never one 🏛

The single largest craft defect in the current build: `--ig-elev-1` is
`inset 0 0 0 1px border`. **One layer. That is why every panel reads as a wireframe.**

Every raised surface is constructed from four light layers:

| Layer | Purpose | Value |
|---|---|---|
| 1. Top-edge highlight | Light hits the top edge first | `inset 0 1px 0 0 oklch(100% 0 0 / 0.05)` |
| 2. Hairline border | Definition, not decoration | `inset 0 0 0 1px var(--ig-border-subtle)` |
| 3. Contact shadow | The surface sits *on* something | `0 1px 2px 0 oklch(0% 0 0 / 0.28)` |
| 4. Ambient shadow | Depth in the room | `0 8px 24px -8px oklch(0% 0 0 / 0.25)` |

## 1.2 Surface gradient — never a flat fill 🏛
`linear-gradient(180deg, var(--ig-surface-raised), var(--ig-surface))`

## 1.3 Grain 🔬
One SVG turbulence filter, applied **once globally**, ~2.5% opacity:
```
<feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4"/>
<feColorMatrix type="saturate" values="0"/>
```
Grain is *material texture* — opaque, physical. It is **not** glassmorphism (translucency
+ blur, permanently banned). This is the technique that most separates "flat vector" from
"real surface."

*Experimental because: it may render invisible at 2.5%, or read as noise. Verify at human
review. It is also a full-viewport overlay — profile it.*

## 1.4 Light direction is fixed 🏛
**Light always comes from above.** Every highlight on a top edge. Every shadow falls down.
No exceptions — inconsistent light is the fastest way to look machine-generated.

## 1.5 Banned permanently ❌
Glassmorphism · backdrop-blur · translucency · neon · RGB decoration · particle
backgrounds · oversized glow · gradient-as-decoration · device mockups.

---

# §2 — NODE CONSTRUCTION

## 2.1 The core principle 🧪
**A node is a stack of layers, not a shape.**

Our current agent node is a circle plus a 1.5px stroke — **two layers**. That is a
wireframe. A constructed node reads as an object.

*Hypothesis because: the layer counts below are derived from counting one reference image.
The principle (depth requires layers) is sound. The exact number may not be.*

## 2.2 Coordinator — 96px hexagon, seven layers 🧪

Outer → inner:
1. **Bloom halo** *(active only)* — the hex duplicated, emerald, through SVG
   `feGaussianBlur stdDeviation=6` + `feMerge`. **Real light, not a CSS radial-gradient div.**
2. **Selection brackets** *(selection state only — see §8.2)* — four L-shaped corner marks
3. **Outer frame** — 1px hex outline, emerald @12%, offset 8px
4. **Main hexagon** — fill is a **radial gradient** (`--ig-surface-raised` centre →
   `--ig-surface` edge) so it reads as a **dome**, not a flat disc. 2px emerald stroke.
5. **Top-edge highlight** — 1px path along the upper two edges, white @6%
6. **Inner core glow** *(active only)* — tight emerald radial at centre
7. **Content** — mono code + product telemetry tag (§4.2)

**The only hexagon in the entire product.**

## 2.3 Specialist Agent — 56px circle, six layers 🧪
Bloom *(active)* → selection brackets *(selection only)* → 2px status ring (agent colour)
→ dome-gradient surface → top-arc highlight (white @8%) → mono two-letter code.

## 2.4 The size ratio is grammar, not taste 🏛
**96 : 56 ≈ 1.7 : 1.** The hub must *dominate*. At 1.4:1 it reads as "slightly bigger,"
which reads as no hierarchy at all.

## 2.5 Orthogonal encoding ✅
- **Identity = stroke colour** (which agent this is)
- **State = emerald glow** (whether it is working)

Two independent channels. An agent's colour never changes to show state; a node's glow
never changes to show identity. **This is what lets a stranger read the graph without a
legend.** *(Validated: built in M2, works.)*

## 2.6 Colour tokens only ✅
`var(--ig-agent-{co,ps,re,ux,ar,qa})`. **Never `agentDefs.color` raw hex in the viz layer.**

---

# §3 — EDGE CONSTRUCTION

## 3.1 Work travels. Wires do not shimmer. ✅

A dashed line scrolling along its own path is a **barber pole**. It reads as decoration and
it is the most common tell of a generated orchestration graph. **Banned.**

**An active edge is two paths sharing one `d`:**
1. **The wire** — solid emerald, 1.5px, opacity 0.22. Always visible. It is the *route*.
2. **The pulse** — same path, `stroke-dasharray: "10 240"`, animated `stroke-dashoffset`
   via **CSS keyframes** (not JS — cheaper, reliably 60fps), passed through the bloom
   filter so the travelling segment *glows*.

Result: a discrete packet of work moving from Coordinator to agent. **That is a handoff.**

*(Validated: built in M2. Works.)*

## 3.2 Edge states ✅

| State | Construction |
|---|---|
| Active | wire + travelling bloomed pulse |
| Waiting | dashed, `--ig-border-default`, opacity ~0.35, static — **must recede** so the active edge sings |
| Blocked | severed (visible gap mid-path), `--ig-danger` *(reserved — engine has no blocked state yet)* |
| Complete | wire only, no pulse |

## 3.3 Edges fade at their endpoints 🔬
A `linearGradient` stroke going transparent at both ends, so edges **emerge from** nodes
rather than hard-terminating against their borders. Hard termination is a diagram.
Emergence is a system.

## 3.4 Curvature ~0.4 ✅
XYFlow's `getBezierPath` default (0.25) is too tight and reads mechanical.

---

# §4 — CANVAS

## 4.1 Three layers, never one flat colour 🔬
1. **Vignette** — `radial-gradient(ellipse 80% 60% at 50% 35%, oklch(20% 0.02 165 / 0.45), transparent 70%)` — a soft light behind the hub, pulling the eye to the centre of gravity
2. **Dot grid** — XYFlow `<Background variant="dots" gap={24} size={1} />` at ~3% opacity
3. **Grain** — the global overlay from §1.3

*(Current canvas is a hardcoded `#020609` — not even the OKLCH token.)*

## 4.2 In-canvas telemetry — PRODUCT state only 🔬

Bracketed mono, 9px, `--ig-text-tertiary` @60%, floating in the graph's **negative space** —
not in a panel. This extends the machine voice into the hero itself and makes the canvas
feel *instrumented* rather than *empty*.

**The test:** *does this tell the user something about their product's journey — or is it
set dressing borrowed from a different product category?*

| ✅ Permitted — product telemetry | ❌ Banned — hardware telemetry |
|---|---|
| `[stage 07/14]` | `[CPU: IDLE]` |
| `[research]` | `[MEM: 93.3KB]` |
| `[awaiting review]` | `[GPU]` |
| `[2 agents active]` | `[TEMP]` |
| `[elapsed 12m]` | anything a machine-room dashboard shows |
| `[confidence: high]` | |
| `[validation pending]` | |

**IdeaGate is a Product Operating System, not a GPU monitor.** The bracketed-mono *format*
is on-identity — we are CLI-native by design. The *content* must be about the product.

**Real data only.** If confidence is unresolved mid-stage, show the stage label alone.
Never fabricate text to fill the space.

---

# §5 — TYPOGRAPHY

## 5.0 The order of operations 🏛
**Attention → Hierarchy → Typography.**

Typography, spacing, material and motion are *mechanisms*. They are never the objective.
Every batch must answer: **how does this change where the user's attention goes?**

Four hierarchies are optimised simultaneously: **information · attention · interaction ·
cognitive.**

**Composition outranks styling.** Perfect typography on an inside-out composition still reads
as assembled. Establish hero and reading order first; style second. *(Proven: Studio's
typography changed and it still failed review, because the hero container was half-width.)*

## 5.1 Two voices, strictly assigned 🏛
- **Geist Sans** — anything a *human reads*: titles, prose, reasoning, stat numerals
- **JetBrains Mono** — anything a *machine produced*: codes, labels, telemetry, logs, IDs, timestamps, stage numbers

**Mono is applied explicitly, per element. It is never a global default.**

> ⚠️ **Currently broken.** The `<body>` inline style in `layout.tsx` forces
> `fontFamily: "'JetBrains Mono','Fira Code',monospace"` on the entire application. Geist
> Sans is loaded and correctly set on `<html>`, then immediately overridden. **Every screen
> in IdeaGate renders in monospace.** This is the single largest typographic defect and it
> blocks every rule below.



## 5.2 The scale — as real CSS custom properties 🏛

| Token | Value | Voice |
|---|---|---|
| `--ig-t-hero` | 40px / 700 / -0.02em | Sans |
| `--ig-t-display` | 28px / 700 / -0.01em | Sans |
| `--ig-t-title` | 18px / 600 | Sans |
| `--ig-t-body` | 14px / 400 / 1.6 | Sans |
| `--ig-t-label` | 10px / 600 / 0.08em / uppercase | **Mono** |
| `--ig-t-caption` | 11px / 500 | **Mono** |

> ⚠️ **These do not exist in CSS.** They live only in a markdown table. Nothing in the
> running app can reference them.

## 5.3 The 4:1 rule 🏛
Every stat pairs `--ig-t-hero` (40px) with `--ig-t-label` (10px). **That ratio *is* the
premium signal.** The current build renders both at ~12px — a 1:1 ratio — which is exactly
why nothing on screen has hierarchy.

## 5.4 Label/Content Authority ✅
**A label MARKS content. It must never OUTWEIGH it.**

A label is a signpost, not the destination. Its job is to name a region quietly; the
information it introduces must always read as the more prominent of the two.

- **Labels** — `--ig-t-label`, uppercase, letter-spaced, and set in a **dim/muted color**.
  A label may carry a high `font-weight` (e.g. 600), but that weight is spent on
  *structure, not emphasis*: uppercase + tracking + low luminance keep its **effective
  visual weight** (its perceived heaviness on a dark surface) **low**.
- **Content the label describes** must read as *more prominent than its label* through
  **two coordinated signals, never one axis alone**:
  1. **Higher luminance contrast** against the background than its label — measurably, not
     marginally. A few points of luminance above a dim label is not authority; the content
     must sit clearly brighter.
  2. **Font-weight ≥ the label's *effective visual weight*** — never lighter. Because a dim,
     tracked, uppercase label has low effective weight, content typically achieves this at a
     mid weight (≈500) *combined with* the luminance lift — not by jumping to a heavy weight
     on the weight axis alone.

**This is a weight-and-luminance composition rule layered onto §5.2 — it does not change any
`--ig-t-*` size value.** Size is a third, separate lever; do not reach for it to manufacture
authority the weight/color layer should already provide.

**The relationship is proportional, not tied to one size pair.** It holds at every density
tier — caption, body, title — and governs *information hierarchy in general*, so it applies
equally to future non-prose tenants (diagrams, reasoning threads, comparison views,
dependency graphs, timelines), not only to text lists. Wherever a marker introduces
information, the information wins.

**Luminance is the load-bearing channel.** Validated on Studio (commit `3e45431`, nine-lens
review determination: lift clearly visible): a +37.5 luminance separation between label and
content produced clear, glanceable tier separation, while the accompanying 400→500 weight
step contributed almost nothing perceptible at caption size. **Weight alone is not a tier —
it is a modifier on a tier that luminance has already created.** Reach for luminance first;
use weight to reinforce, never to substitute.

**Evidence:** rendered `/improve`, five label→content pairs (`PRESETS`, `EXTENT`, `SCOPE`,
`ARTIFACTS`, `DOWNSTREAM`), each legible as two tiers at a glance without reading either line.

---

# §6 — SPACING 🏛

4px base unit. Panel padding 24px (comfortable) / 16px (compact). Section gaps 32px.

**Hero breathing room ≥ 25% of the hero's own bounding box on every side.** Crowding is the
second-fastest tell of a generated interface, after uniform type size.

---

# §7 — MOTION

## 7.1 Every motion answers one of three questions ✅
**What changed · Why · What should I look at now.** If it answers none of them, delete it.

| Behaviour | Trigger | Construction | Status |
|---|---|---|---|
| **Breathe** | An agent owns `currentStage` and the run is live | scale 1 → 1.03 → 1, 2.4s, ease-in-out, infinite | ✅ |
| **Handoff** | Work moving CO → agent | the travelling pulse (§3.1) | ✅ |
| **Propagate** | A stage completes | one-shot ring expanding from the owning node. **Emerald if confident, `--ig-caution` if not — the ripple itself carries the confidence signal.** No separate indicator. | ✅ |
| **Reveal** | Content enters | opacity 0→1, translateY 8→0, 0.3s ease-out | ✅ |
| **Sweep** | Run completes | one left-to-right emerald pass across the stage rail. 400ms. Once. Never repeated. | ✅ |
| **Settle** | Content moves into the record | scale 0.9, translateY 24, fade out, 0.4s | 🔬 *(unused — do not force it)* |

## 7.2 The one-alive-element law ✅
**Exactly one node is alive at any instant** — the agent that owns `currentStage`. That may
be a specialist *or* the Coordinator (CO owns stages 0, 6, 11).

When CO is the active agent, **no edge animates** — nothing is being handed off; CO is doing
the work itself.

## 7.3 The stillness rule ✅
**When nothing is executing, nothing moves.** A still screen is the honest signal that no
cognition is happening. Ambient motion on an idle system is a lie, and users feel it as noise.

## 7.4 Reduced motion ✅
Everything gates on `useReducedMotion`. No exceptions.

## 7.5 Curation is mandatory 🏛
References are **evidence, not inspiration.** Extract transferable *construction principles*;
never imitate layouts or copy components.

**Verify category before extracting.** In the first reference packet, **4 of 7 images were
marketing or stock concept art, not product UI** — using them would have pushed IdeaGate
toward the exact cliché it exists to avoid. Design-gallery sites (Dribbble, Godly,
recent.design, Land-book) skew heavily toward landing pages. Treat everything from them with
that suspicion.

**Who extracts:** the human or Claude Chat. **Never Claude Code** — it has no browser-research
mandate and no design authority.

---

# §8 — INTERACTION GRAMMAR

## 8.1 The core law 🏛
**The same gesture means the same thing on every surface.** Desk, Studio, Office, Blueprint —
one interaction language, learned once.

| Gesture | Meaning, everywhere |
|---|---|
| Click | Select |
| Double-click | Open / drill in |
| `Esc` | Back / deselect / close |
| `Enter` | Open the selected thing |
| `Cmd+K` | Command palette |
| `/` | Search |
| `Cmd+Enter` | Primary action of the current context |
| Arrow keys | Traverse |

## 8.2 Four states — all simultaneously distinguishable 🏛

| State | Signal | Driven by |
|---|---|---|
| **Hover** | Surface lightens one step, 80ms | Mouse |
| **Focus** | 2px `--ig-emerald-muted` ring | Keyboard only |
| **Selection** | **Bracket corners** — four L-shaped corner marks | User choice |
| **Active-work** | Emerald glow + breathe | **The system**, not the user |

**On brackets 🏛:** corner handles are the universal canvas-selection convention — Figma,
Sketch, Illustrator, every design tool ever built. **As a selection state they are craft.**

❌ **As permanent ambient decoration on every node, they are sci-fi HUD cosplay — banned.**
Brackets appear on selection and only on selection.

**Why this matters:** these four states must never collide. A ring, a glow, a bracket, and a
surface lift are four unmistakably different signals. Collapsing any two is the most common
interaction-grammar failure in software.

## 8.3 Keyboard-first 🏛
**An action with no keyboard path is incomplete.** Not "nice to have" — incomplete.
Visible focus everywhere. Tab order follows reading order.

## 8.4 Optimistic feedback 🏛
**Never a bare spinner when the current operation can be named.**
❌ `⟳` · ✅ `Coordinator is validating stage 7…`

## 8.5 Selection is library-agnostic ✅
One `selected` entity in the store. XYFlow, charts, and every future view **subscribe** to
it. No view owns its own selection state. *(This is what will let Intelligence & Quality
open already-focused on whatever you clicked in Live Orchestration.)*

---

# §9 — INFORMATION GRAMMAR

## 9.1 The density budget 🏛
Per screen, visible at once:

| Element | Maximum |
|---|---|
| Hierarchy levels | **3** |
| Stat blocks | **4** |
| Accent colours | **1** |
| Alive elements | **1** |
| Charts in Live Orchestration | **0** |

## 9.2 One screen, one question 🏛
| Screen | Its question |
|---|---|
| Live Orchestration | *What is happening right now?* |
| Intelligence & Quality | *Can I trust the output?* |
| Insights & Performance | *How is it performing over time?* |
| Desk | *What did the system produce, and how good is it?* |
| Studio | *How do I improve this?* |

**If two visualizations answer the same question, one of them should not exist.**

## 9.3 Store once, view many 🏛
A metric is **stored once** and viewed as *perspectives* — never recomputed, never
re-displayed on two screens. Confidence is one value seen three ways: as **state** (Live),
as **evolution** (Intelligence), as **trend** (Insights).

## 9.4 Status has one home 🏛
Run state lives in the **vitals band**. It is never also scattered into cards, badges, and
panel headers. Duplicated status is how dashboards become noise.

## 9.5 Reading order is designed, not emergent 🏛
Every screen has an explicit 1st / 2nd / 3rd stop, established by **size and luminance** —
not by grid position. A grid has no reading order. A composition does.

---

# §10 — EMPTY STATE GRAMMAR

## 10.1 The structure renders at rest 🏛
**An empty Live Orchestration shows six dimmed nodes and fifteen pending stage dots.**
All edges dashed. No glow. No motion. A caption near the Coordinator:
*"Run an idea to see the organization work."*

It reads as **an organization waiting** — never as broken, never as blank, never as loading.

## 10.2 Never "no data" 🏛
Every empty state says two things: **what will appear here**, and **how to make it appear.**
One action. No dead ends.

## 10.3 Empty ≠ Broken ≠ Loading 🏛
Three different states. Three different treatments. Never one generic void.

- **Empty** — structure at rest, an invitation
- **Loading** — the named operation, in progress
- **Error** — plain language + the next action. Never a stack trace. Errors do not apologize and are never vague.

## 10.4 The three-second test 🏛
Show the empty state to a stranger for three seconds. **If they ask "is it broken?", it
failed.**

---

# §11 — COMPONENT DNA

## Coordinator Node
| Field | Value |
|---|---|
| **Purpose** | The centre of gravity. Answers *who is orchestrating*. |
| **Hierarchy** | Rank 1. The visual hero of the entire product. |
| **Construction** | 96px hexagon, 7 layers (§2.2). The only hexagon in IdeaGate. |
| **Motion** | Breathes *only* when it owns `currentStage` (stages 0, 6, 11). When CO is active, **no edge animates.** |
| **Selection** | Bracket corners. All other nodes dim to 60%. |
| **Accessibility** | Keyboard-focusable. State announced, never colour-only. |
| **Evolution** | Multiple coordinators → hexagons cluster; the active one keeps full scale, peers at 0.8× and desaturated. |

## Agent Node
| Field | Value |
|---|---|
| **Purpose** | A specialist's identity and current state |
| **Construction** | 56px circle, 6 layers (§2.3) |
| **Motion** | Breathes only when it owns `currentStage`. Ripples once when its stage completes. |
| **States** | active / done / waiting. Blocked reserved. |
| **Evolution** | Parallel execution → multiple breathers would violate §7.2. **Resolution:** a parallel group renders as ONE container that breathes as a unit; members visible but static; hover expands. One alive element preserved. |

## Execution Edge
| Field | Value |
|---|---|
| **Purpose** | Show work *travelling* — not that a connection exists |
| **Construction** | Two-path travelling pulse (§3.1) |
| **Evolution** | Branching → the pulse **splits** at the branch point. Conditional routing → the untaken branch renders `waiting` and dims. |

## Stage Rail
| Field | Value |
|---|---|
| **Purpose** | *Where are we in the mission* — answerable in under one second |
| **Hierarchy** | Rank 3. Lives **inside** the hero. Never a separate tab. |
| **Construction** | **15 nodes, hardcoded.** Never sized from `metrics.totalStages`, which reports 14. 8px dots; current = 10px + 3px ring. |
| **States** | done (emerald) · current (emerald + ring) · low-confidence (amber, **overrides** done) · pending (outline) |
| **Typography** | Tiny mono stage *numbers* — never truncated names (noise at 15 nodes). The current stage's full name renders **once**, beneath the rail. |
| **Evolution** | Sub-workflows → a stage node becomes expandable, revealing a nested rail inline. |

## StatBlock
| Field | Value |
|---|---|
| **Purpose** | One fact, and what it means |
| **Construction** | `--ig-t-hero` numeral + `--ig-t-label` mono label + one "so what" line. **4:1 mandatory.** |
| **Motion** | Number ticks up on change (hand-implemented, ~20 lines) |
| **Anti-pattern** | A grid of four identical cards. If they all look the same, none of them matters. |

## Panel
| Field | Value |
|---|---|
| **Construction** | Four-layer elevation + surface gradient + grain (§1) |
| **Anti-pattern** | **A 1px border. That is a wireframe, not a panel.** |

## Reasoning Tag
| Field | Value |
|---|---|
| **Purpose** | The *why*, at the moment it matters |
| **Construction** | Ephemeral mono caption near the active node, in canvas negative space |
| **Honesty rule** | **Real data only.** If confidence is unresolved mid-stage, show the stage label alone. **Never invent text to fill the space.** |

---

# §12 — THE NINE REVIEW LENSES

Every screen, every batch, reviewed under all nine. **Failing one means it does not ship.**

1. **Hierarchy** — one hero at ≥1.7:1. Cover it with your hand: does the screen lose its centre?
   - *Composition* — is there a real reading order, or is it a grid?
   - *Negative space* — does the hero breathe, or is it crowded?
2. **Typography** — ≥3 distinct sizes · 4:1 on every stat · mono only on machine surfaces
3. **Material** — panels ≥3 shadow layers + gradient · nodes ≥5 layers · never a 1px border
4. **Motion** — every animation ↔ a real state change · ONE alive element · **stops when idle**
5. **Interaction** — hover / focus / selection / active-work all distinguishable · keyboard-complete
6. **Information architecture** — ≤4 stats · 1 accent · nothing duplicated · one question answered
   - *Execution storytelling* — does it show what changed and why — not only who is working?
7. **Accessibility** — contrast passes · reduced-motion honoured · never colour-only
8. **Identity** — recognisable as IdeaGate with the logo removed · zero banned aesthetics
9. **Portfolio** — **would you show this screenshot to a hiring manager without apologising?**

---

# §13 — THE EXCEPTION PROTOCOL

When a new surface genuinely needs a rule this Grammar does not have:

1. **Propose** the rule
2. **Justify** it against the Constitution's Ten Values
3. **Approve** — the human decides, and only the human
4. **Amend** this document, versioned and dated
5. **Propagate** — **every existing surface adopts the new rule**

**Step 5 is load-bearing. There are no one-off exceptions.** If a rule is good enough for a
new screen, it is good enough for every screen — and if it isn't, it was never a rule, it
was a hack. This clause is what stops Desk and Office from quietly becoming two different
products.

---

*THE IDEAGATE VISUAL GRAMMAR v1.0*
*Construction rules live only here. Silence is a STOP, not a licence to improvise.*
*Nothing is permanent until it survives implementation.*