# IDEAGATE — SESSION BOOTSTRAP
## The project's operational memory. Read this first, every session.

> **What this is.** Not a summary. This is how IdeaGate *thinks*. A new Claude Chat that
> reads this file plus the attached design documents should reason, review, prioritise and
> direct implementation exactly as the founding conversation concluded — with no loss of
> design philosophy, product philosophy, workflow, or architectural memory.
>
> **What this is not.** It does not restate the Grammar, the Constitution, or the Execution
> Blueprint. Those are attached and canonical. This file holds only what has no other home,
> plus what changes each sprint.
>
> **Structure.** §1–§10 are **STABLE** — change rarely. §11–§16 are **VOLATILE** — updated at
> the end of every sprint. If you are updating this file, you are almost certainly only
> touching §11 onward.

---

# ═══ STABLE ═══

## 1 — IDENTITY & THE FEEL WE ARE BUILDING TOWARD

IdeaGate is an **AI-native Product Operating System**. A coordinator agent orchestrates six
specialists through a 15-stage PM lifecycle (0–14), producing structured artifacts. Stages
are enforced and cannot be skipped. **That enforcement is the product.**

It is also a portfolio piece. Every screen must survive being shown to a senior PM, a design
lead, a hiring manager, or a YC partner **for five seconds, without apology.**

**The feel, stated precisely:** calm · confident · information-first · editorial ·
executive · high signal-to-noise · unmistakably IdeaGate. Premium emerges from composition,
hierarchy, typography, rhythm, spacing, material, interaction and motion — **never from
decoration**.

**The bar:** Linear, Stripe, Vercel, Raycast, Arc, Cursor, Notion. Not because we imitate
them — because we share their level of craft and restraint.

**It is not:** a dashboard · a chatbot · a document editor · an admin panel · a graph viewer
· an AI toy · a hackathon demo. When "make it work" and "make it feel like an operating
system built by a world-class team" conflict — **the second one wins.**

---

## 2 — THE LONG-TERM PRODUCT VISION

*Do not build these now. Never make a decision that makes them harder to build later.*

**Studio is a collaborative thinking surface, not a document editor.** Its hero is a **slot**,
not a type (Design Direction §1.5). Today an artifact occupies it. Eventually the same room
hosts, without philosophical amendment:

- **Representations** — PRDs · architecture docs · UX specs · comparisons · AI reasoning ·
  dependency graphs · Mermaid diagrams · ER diagrams · IA diagrams · journey maps · mind maps
  · decision trees · timelines · whiteboards · validation results
- **Collaboration** — project / artifact / inline / selection comments · Slack-style reply
  threads · AI replies and summarisation · resolve & reopen · mentions · notifications ·
  decision log · review workflow · presentation mode · **future multiplayer**
- **The PM workbook layer** — text highlights · sticky notes · saved excerpts · personal notes
  · research snippets · AI explanations · linked highlights · cross-artifact references

**Blueprint** eventually becomes an explorer set, not an analytics screen: Lifecycle Explorer
· Dependency Explorer · Decision Explorer · Execution Replay · Agent Memory Explorer ·
Knowledge Graph · Architecture Explorer · Artifact Lineage · Reasoning Explorer · Prompt
Lineage · Journey Timeline · Version Diff Explorer.

**Office → Analytics** is three flagship screens, each answering exactly **one** question —
this is what prevents repetitive dashboards:

| Screen | Its question | Status |
|---|---|---|
| Live Orchestration | *What is happening right now?* | Spec exists · W1 |
| Intelligence & Quality | *Can I trust the output, and why?* | After W1 |
| Insights & Performance | *How is the system performing over time?* | After W1 |

**Workspace Landing Page** (concept): every project should feel alive before any artifact is
opened — project identity, mission summary, health, timeline, recent activity, agents,
artifact progress, north star, quick actions, discussion.

**Agent Activity** (Phaser pixel office) is deliberately deprioritised. Preserve
byte-identical. Do not design for it.

---

## 3 — HOW TO THINK: ATTENTION BEFORE EVERYTHING

**The corrected mental model — this supersedes any typography-first reasoning:**

```
ATTENTION  →  HIERARCHY  →  TYPOGRAPHY / SPACING / MATERIAL / MOTION
```

Typography, spacing, surfaces and motion are **implementation mechanisms**. They are never
the objective. Every batch must explicitly answer: *how does this improve where the user's
attention goes?*

**Four hierarchies are optimised simultaneously:** information · attention · interaction ·
cognitive.

**Composition outranks styling.** A screen with perfect typography on an inside-out
composition still reads as assembled. Establish hero and reading order first; style second.
*(This was proven: Studio's typography changed and it still failed review, because the hero
container was half-width.)*

---

## 4 — THE AI TEAM: ROLES AND HARD BOUNDARIES

| Actor | Owns | May never |
|---|---|---|
| **Human (owner)** | Identity · values · composition approval · **final taste authority** · tool approval | Delegate *"is this premium?"* to anyone |
| **Claude Chat** | Design Director: reference curation · principle extraction · specs · batch prompts · critique · **visual validation via vision** | Write production code · approve its own specs · assert a codebase fact without verification |
| **Claude Code** | Implementation · measurement · regression · TypeScript/build correctness | **Any design authority.** Improvise where specs are silent. Browse for design references. Self-assess premium-ness. |
| **Browser tooling** (Playwright/DevTools) | **Measurement of facts** | Judge taste. It answers *what is*, never *what should be*. |

**Claude Chat vision is the validation instrument.** Claude Chat can see images. Every time a
rendered screenshot has reached it, the review was accurate and specific (the half-width hero
bug was caught by *looking*, not by measuring). **The gap was never tooling — it was process.**

**Do not make Claude Code invent premium design from first principles.** Claude Chat extracts
and adapts; Claude Code implements. That division is the whole operating model.

---

## 5 — THE VALIDATION RULE (the project's hardest-won lesson)

> **Numeric proof that something changed is not evidence that the change is perceptible.**

Three consecutive sprints shipped with verified computed-style deltas, clean TypeScript,
passing builds, passing regression — and produced **no perceived improvement**. The cause was
not bad code. **It was that nobody with taste authority looked at a rendered screen.**

**Therefore:** no sprint is complete until a human or Claude Chat has viewed an **actual
rendered screenshot**. A computed-style report is a precondition, never a substitute.

Corollary, also earned: **size alone never creates a hierarchy tier.** A 1–2px change is a
rounding error. Tiers require coordinated signals — weight *and* luminance *and* (sometimes)
size. *(Grammar §5.4 now encodes this.)*

---

## 6 — DESIGN ACQUISITION

**Philosophy:** references are **evidence, not inspiration**. Extract transferable
*principles*; never imitate layouts or copy components. Explain *why* a reference feels
premium, then express that principle in IdeaGate's own language.

**Curation is mandatory and non-obvious.** In the first reference packet, **4 of 7 images were
marketing art or stock concept art, not product UI** — using them would have pushed IdeaGate
toward the exact cliché it exists to avoid. Verify category before extracting. Design-gallery
sites (Dribbble, Godly, recent.design, Land-book) skew heavily toward landing pages; treat
everything from them with that suspicion.

**The pipeline** — runs in full *only* when introducing a new reusable principle. Most sprints
enter at Implementation:

```
Reference → Extraction → Classification → Principle → Adaptation → Grammar
                                                                      ↓
                                            (most sprints enter here) ↓
                                    Implementation → VALIDATION → Regression → Promotion
```

**Who extracts:** Human or Claude Chat. **Never Claude Code** — it has no browser-research
mandate and no design authority, and blurring that line breaks §4.

---

## 7 — EXPRESS SPRINT DISCIPLINE

Per sprint: **one concern · one rollback point · one regression check · one visual review ·
one obvious user-visible improvement.**

> **A sprint that is technically correct but imperceptible to the user is a failed sprint.**

Move quickly; never rush architecture. Prefer small, measurable, reviewable, reversible
batches. Additive over replacement. Do not create documentation unless it materially reduces
implementation risk — **the documentation phase is closed**; amend the Grammar instead.

**Every sprint must leave the Design System stronger than before.** When several small fixes
appear, group them into a reusable pattern rather than page-specific patches.

---

## 8 — SUCCESS CRITERIA

Two tests. Both are perceptual; neither is satisfiable by a build passing.

1. **The five-second test.** A VP Product, Principal Designer, Head of Design, YC partner or
   hiring manager sees one screenshot for five seconds. Do they believe an experienced product
   design team built this?
2. **The first-time-PM test.** Can a newcomer distinguish **labels · information · actions ·
   metadata** without consciously reading each element?

Full gates: the nine review lenses (Grammar §12) · Execution Blueprint's Definition of Done.

**The behavioural half of premium — currently documented only here.** Everything in the
Grammar is *visual* premium. Linear feels like Linear equally because of behaviour, and
IdeaGate has none of it yet:

optimistic UI (nothing spins that needn't) · `Cmd+K` reaching everything · every action
keyboard-reachable · state surviving navigation · no screen is a dead end · waits are *named*,
never bare spinners · the same gesture means the same thing everywhere · undo, so nothing
feels risky.

**The AI half is already canonical** — Design Direction §9.5's five Product Operating
Principles (Journey over Documents · Context Accumulates · Reasoning is Observable · Trust
Before Speed · Lifecycle is the Operating Model). Those govern how the *system* behaves; the
list above governs how the *interface* behaves. **Premium requires both** — fixing keyboard
navigation alone does not close this gap.

**This is a real, open gap.** A future sprint should address it; it may deliver more perceived
quality per hour than further visual refinement.

---

## 9 — RECURRING MISTAKES (never repeat)

- **TypeScript casts ≠ runtime safety.** Use safe accessors.
- **Long prompts cause drift.** One batch, one STOP, one confirmation.
- **Verify code before updating docs that describe it.** Documents describe intent; only code
  reports reality.
- **HSL vs OKLCH are different scales.** A load-bearing architectural argument was once built
  on comparing them — caught only by measurement. **Treat every unrendered Grammar material
  claim as unvalidated until a human has seen it.**
- **Prose under-specifies construction.** Attach a reference image, not an adjective.
- **A scratch route must never outlive one batch.** `/mc-scratch` lived for three while
  `/office` showed the old graph — so nobody was reviewing the real thing.
- **Never run destructive commands as a "verification step."** `rm -rf` on a screenshots
  directory happened once; files survived only because they were committed.
- **Silence in the spec is a question, not a licence.** Every flat, generic thing this
  codebase produced came from a gap where the spec said nothing.

---

## 10 — WORKING AGREEMENTS

**Emoji markers** — always flag anything requiring the owner's action:

🟢 safe to proceed · 🟡 decision required · 🔴 stop · 📸 screenshot required ·
🧪 human visual review · 🛠 manual work · 🔵 investigate · 🟣 architectural decision ·
⚠ risk needing approval · 🔖 remember / deferred

**Continuation strategy.** Stay in-thread; context continuity outweighs an attachment limit.
Economise: **1–2 decisive images per sprint**, not five-shot batches (that is what exhausted
the budget). Escape valve if genuinely exhausted: a short-lived side thread opened for one
visual review, bootstrapped with a compact briefing — never a full re-onboarding.

**Deferred artifact — Experience Principles.** A UX-philosophy document ("the system feels one
step ahead" · "AI explains before it asks" · "no empty screen feels abandoned") is a valuable
*future* artifact. It must be **distilled from a built, validated surface — never projected
onto an unbuilt one.** Do not create it until at least one workspace is complete.
**This is governance, not preference:** principles are *extracted from* working software,
never *projected onto* unbuilt software.

---

# ═══ VOLATILE — update at the end of every sprint ═══

## 11 — WHERE WE ARE

```
Active workspace : Studio (/improve) — the PILOT. Its validated patterns become the
                   reference implementation for Desk, Office, Blueprint, Mission Control.
Phase            : Sprint S1 series complete (implementation); visual validation OUTSTANDING
Rollback tag     : v-pre-s1-studio
```

**Studio is the pilot.** Do not redesign Desk, Office, or Blueprint until Studio is validated
and its patterns extracted.

## 12 — SPRINT LEDGER

| Sprint | Commit | What it did |
|---|---|---|
| W0-B | `f9f24b7` | Type scale as real CSS · 4-layer elevation · grain filter · canvas var |
| W0-C1 | `864fdfc` | Bridged 16 legacy Mission-14 tokens → Foundation (`--ig-*`) |
| W0-C2 | `de2ca24` | De-occluded Studio + Office roots to `--ig-canvas` (Desk left as control) |
| S1 | `b9f8f27` | Studio composition + typography (Two Voices introduced) |
| S1 Revision | `b065f06` | Hero container width fix — 326px → 571px, centred |
| S1 Polish | `8e5c1ff` | Content rows → caption/body tokens (**imperceptible — 1–2px**) |
| Grammar §5.4 | `e6c5948` | Label/Content Authority pattern |
| Content Authority | `3e45431` | Weight 400→500 + luminance +6.7→+37.5 on chrome rows |

**Tags:** `v5.2-pre-mission-control` · `v5.2.1-pre-w0` · `v-pre-s1-studio`

## 13 — HARD-WON CODEBASE FACTS (expensive to rediscover)

- All **49** `fontFamily` sites set mono **explicitly** → typography is a migration, not a
  switch. **The global `<body>` flip was tried and discarded** — it changes almost nothing.
- The `Panel` primitive has **exactly one consumer** (`/mc-scratch`) — **the design system is
  built but not connected to the product.** This is the root of "looks flat."
- Desk / Studio / Office each hardcode a `#020609` root; **Desk's is in a protected file**
- Legacy OKLCH ladder: sunken 11.6 · base 14.0 · raised 17.5 · overlay 20.7 —
  `--surface-base` ≈ `--ig-canvas` (both ~14%); the real defect was sRGB compression near black
- Coordinator renders **80×72** from a constant **duplicated in two files** (Grammar wants 96px)
- `metrics.totalStages` reports **14** but **15** stages exist · CO owns stages 0/6/11 ·
  stages 3 & 9 are low-confidence
- Studio's central region is **722px, not 960px** (a global nav rail sits outside Studio's rail)
- **`ch` resolves against inherited font-size** — an 8px inherited base collapsed 68ch to 326px
- Legacy `--font-sans` is **Inter**; Foundation is **Geist** — unresolved divergence
- Settings: Studio **does** subscribe to `GlobalStore`; **Desk and Office do not** (trivial fix)

## 14 — TOOL LEDGER

| Verdict | Tools |
|---|---|
| **Adopted** | shadcn/ui + Radix · `framer-motion@12` · `@xyflow/react` · Playwright · Lucide · Geist + JetBrains Mono · OKLCH tokens |
| **Extracted, not installed** | Magic UI — three patterns only (Number Ticker, Blur Fade, Noise Texture) |
| **Approved, never installed** 🔖 | `frontend-design` skill · Vercel `web-design-guidelines` skill |
| **Deferred** | Figma MCP (**official only** — Framelink has RCE CVE-2025-15061) · Mobbin ($10/mo) · Origin UI (case-by-case, MIT, shadcn-compatible) · Rive / Lottie |
| **Rejected** | Aceternity · react-bits · d3-shape · Cytoscape / Sigma / WebGL graph engines |
| **Never install** | the `motion` package — same engine as `framer-motion`, breaks the build |
| **Unevaluated** | Park UI |

**Adoption gate (all five):** solves a *named* problem · additive only · preserves the Grammar
· zero-cost or justified · doesn't make future workspaces harder.

## 15 — OPEN DECISIONS & DEFERRED ITEMS

| # | Item | Type | Status |
|---|---|---|---|
| 1 | 🧪 **Visual verification of Content Authority** | Blocking | **Outstanding — the loop has not closed** |
| 2 | 🔖 Sidebar typography perception | Deferred | May be resolved by §5.4; unverified |
| 3 | 🟣 Desk body 17px vs Grammar `--ig-t-body` 14px | Grammar ruling | Pending owner |
| 4 | 🟣 Content weight 500 vs 600 | Taste ruling | Pending owner |
| 5 | 🧩 Install `frontend-design` + Vercel guidelines skills | Setup | Approved, not done |
| 6 | 🔵 Settings: wire Desk/Office to `GlobalStore` | Trivial fix | Deferred |
| 7 | 🔵 "New Idea" leaves stale Overview panel | Pre-existing | Documented, deferred — **never a sprint regression** |
| 8 | 📋 Unicode glyphs → Lucide icons | W0.5 | Backlog |
| 9 | 📋 Dead legacy tokens cleanup (`--surface-overlay`, `--surface-sunken`, 4 of 5 `--status-*`) | W0.5 | Backlog |
| 10 | 📋 Coordinator size constant duplicated in two files | W1 | Must export one shared constant |

## 16 — DESIGN EXPLORATION BACKLOG (ranked, not scheduled)

1. **Reasoning-as-hero-content** — AI rationale currently sits in a side panel; Direction §7 /
   Principle P3 say it belongs beside the change it explains. Highest leverage.
2. **Contextual empty-state intelligence** — explain *why* a suggested starting artifact is
   suggested (dependency data already exists). Serves P1.
3. **Behavioural premium pass** — `Cmd+K`, keyboard completeness, named waits (see §8).
4. **Progressive disclosure on the right panel** — may become unnecessary once attention work lands.
5. **Keyboard-first artifact switching** · **hover/focus micro-interactions** (motion sprint).

---

## NEXT ACTION

🧪 **Close the validation loop.** One screenshot of `/improve` — artifact selected,
hard-refreshed, freshly restarted server — reviewed by the owner or by Claude Chat vision.

Everything downstream depends on the answer: whether Content Authority landed, whether the
next sprint is a larger confident jump on the same axes, or whether we proceed to material
(S2) with real confidence rather than hope.

---

*IDEAGATE-SESSION-BOOTSTRAP.md — operational memory.*
*Attention before hierarchy before typography. Numbers are not perception. A human looks at every batch.*
