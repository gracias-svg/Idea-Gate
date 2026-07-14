# THE IDEAGATE DESIGN CONSTITUTION
## Version 3.0 | The Permanent Governance Document
### July 2026

> **What changed in V3.** V2 was a manual — it *explained*. V3 is a governance system —
> it *decides*. A manual tells you what good looks like. Governance tells you who
> decides, on what grounds, and what happens when they disagree.
>
> **This document does not contain the visual language.** That lives in THE GRAMMAR
> (`IDEAGATE-VISUAL-GRAMMAR.md` — currently Section 3+4 of V2, to be split out).
> This document contains the *authority* over that language.
>
> **Document architecture — three, not seven:**
> - **THE CONSTITUTION** (this) — identity, values, governance. Changes rarely.
> - **THE GRAMMAR** — visual language + component DNA. Changes only via §9's protocol.
> - **THE LOG** — tool evaluations + curated references, dated and append-only.

---

# PART I — THE CONSTITUTION

## 1. Identity

IdeaGate is an **AI-native Product Operating System**. It makes coordinated product
thinking visible.

It is not a dashboard, not a chat application, not a document generator, not a workflow
builder, not an observability tool, not a graph viewer, not an admin panel.

Every surface must communicate that an intelligent organization is operating around the
user's product idea. When that communication and any other goal conflict, that
communication wins.

## 2. The Ten Values

These are the appeal court. When any decision is contested — a component, a colour, a
motion, a tool, a whole screen — it is adjudicated against these, in this order:

1. **Clarity** — the user knows what is happening without being told.
2. **Confidence** — the interface never looks uncertain about itself.
3. **Calmness** — nothing competes; nothing shouts; stillness is the default.
4. **Signal** — every element carries meaning. Decoration is a defect.
5. **Craftsmanship** — construction quality is visible in the details nobody names.
6. **Human trust** — the system shows its work; it never asks to be believed.
7. **Intelligence** — sophistication is demonstrated through behaviour, never announced.
8. **Intentionality** — nothing is accidental, inherited, or default.
9. **Professionalism** — it belongs in a working day, not in a demo reel.
10. **Portfolio quality** — a screenshot survives being shown to a hiring manager
    without apology.

**A proposal that strengthens none of these is rejected regardless of how good it is.**

## 3. The Supremacy Clause

This project has already lost a full working session to two documents contradicting each
other. That must never recur. The order of authority:

**On matters of INTENT (what *should* be true):**
1. The Constitution (values, governance)
2. The Grammar (visual language)
3. Batch specifications
4. Everything else

**On matters of FACT (what *is* true):**
> **The codebase always wins.** Always. Without exception.

If a document says the execution store holds per-agent state and the store does not,
**the store is right and the document is corrected.** If the code renders a two-layer
node and the Grammar demands seven, **the Grammar is right and the code is fixed.**

The distinction: *documents describe intent; code reports reality.* Never let a document
assert a fact. Verify, then write.

---

# PART II — GOVERNANCE

## 4. Decision Rights

| Decision | Decided by | May never be decided by |
|---|---|---|
| Product identity & values | **Human (owner)** | Any AI |
| Changes to the Grammar | **Human**, on Claude Chat's recommendation | Claude Code |
| Composition (hero, hierarchy, reading order) | **Human**, on a wireframe or in Figma | Claude Code |
| Component construction (layer counts, exact values) | **The Grammar decides.** Neither AI nor human improvises per-batch. | Anyone, ad hoc |
| Tool adoption | **Human**, on Claude Chat's evaluation | Claude Code |
| "Is this premium?" | **Human, in a browser** | Anyone else. Ever. |
| Implementation approach | Claude Code | — |
| "Does it compile / regress?" | Claude Code | Human intuition |
| Architecture changes | **Human**, with a recorded decision | Claude Code |
| When to stop and ask | **Claude Code** — and it is *obligated* to | — |

## 5. Roles — and Non-Responsibilities

**The non-responsibilities matter more than the responsibilities.** Every failure in this
project's history traces to a participant acting outside its authority.

### The Human (Owner / Design Director)
- **Owns:** identity, values, composition, visual judgment, tool approval, final approval.
- **Must:** open the browser and look at every visual batch before it is called complete.
- **May not:** delegate the question *"is this premium?"* to anyone or anything.

### Claude Chat (Principal Design Director / Architect)
- **Owns:** specifications, grammar proposals, tool evaluation, critique, batch prompts.
- **Must:** flag `🚨 MANUAL DESIGN REVIEW REQUIRED` the moment a question becomes a matter
  of taste rather than correctness. Must refuse to specify what it cannot see.
- **May not:** write production code. May not approve its own specifications. May not
  assert a fact about the codebase without verification.

### Claude Code (Implementation Engineer)
- **Owns:** implementation, verification, regression safety, TypeScript correctness.
- **Must:** read before editing. Verify reality before building. Stop on ambiguity.
- **Has NO design authority.** When it encounters a visual judgment call, it **stops**.
  It does not choose a colour, a size, a spacing, or a motion that the Grammar does not
  already specify. **Silence in the Grammar is a STOP, not a licence to improvise.**

### Figma (Primary Design Workspace)
- **Owns:** nothing. It is a surface.
- **Provides:** a canvas where human judgment can act — resize, reposition, compare
  side by side, see the whole. It changes the *medium* of design work, not its *source*.
- **Authority:** the human's judgment *expressed in* Figma has authority. Figma has none.

### External Tools
- **Own:** nothing. They supply *vocabulary*, never *identity*.
- Every tool is a source of design intelligence to be studied and extracted from — never
  a component library to be installed wholesale and inherited from.

## 6. Stop Conditions

Implementation halts immediately — no workaround, no best guess — when:

1. A protected file would need to change.
2. Two documents contradict each other.
3. The Grammar is silent on a visual decision that must be made.
4. A regression check fails.
5. A batch would ship without a human having seen it rendered.
6. An acceptance criterion cannot be met additively.
7. Phaser would unmount or re-initialize.

## 7. Drift Alarms

Design languages do not collapse. They *erode*. Each of the following is a STOP, because
each is the first visible symptom of erosion:

- A screen introduces a colour that is not in the token set.
- A component defines its own elevation, spacing, or type size.
- Two components solve the same problem in two different ways.
- A motion runs on a timer rather than a state change.
- A metric is stored or computed twice instead of viewed from two perspectives.
- A visualization answers a question another visualization already answers.
- A scratch route survives more than one batch.
- **A batch ships without a human looking at it.**

---

# PART III — THE INHERITANCE CONTRACT

## 8. What every new surface inherits

**New surfaces inherit everything and invent nothing.**

| | |
|---|---|
| **MUST inherit** | Tokens · type scale · spacing scale · elevation system · motion primitives · interaction states · composition primitives · selection contract · icon system · visual grammar |
| **MAY extend** | New adapters · new data shapes · new *content* |
| **MAY NEVER invent** | A new colour with a new meaning · a new shape · a new motion behaviour · a new elevation recipe · a new type size · a new interaction state |

**The consequence, stated plainly:** Desk, Blueprint, Studio, Intelligence & Quality, and
Insights & Performance do not get to *look different*. They get to *contain different
things*. That is the whole point of a grammar.

## 9. The Exception Protocol — how the Grammar legally changes

When a new surface genuinely needs a rule the Grammar does not have:

1. **Propose** — Claude Chat states the gap and the proposed rule.
2. **Justify** — against §2's Ten Values. Which value does it strengthen?
3. **Approve** — the human decides. Only the human.
4. **Amend the Grammar** — the rule enters THE GRAMMAR, versioned and dated.
5. **Propagate** — **every existing surface adopts the new rule.**

Step 5 is the load-bearing one. **There are no one-off exceptions.** If a rule is good
enough for a new screen, it is good enough for every screen — and if it isn't, it wasn't
a rule, it was a hack. This single clause is what prevents Desk and Office from slowly
becoming two different products.

## 10. Evolution scenarios (pre-adjudicated)

| Event | Ruling |
|---|---|
| **New screen appears** | Inherits everything. Invents nothing. Composition Blueprint first, human-approved, before any component. |
| **New visualization appears** | Must answer a question no existing visualization answers. If it doesn't, it isn't built. |
| **New lifecycle stage appears** | Rail is data-driven. It re-renders. No design change. |
| **New agent appears** | Layout constant expands. Node construction unchanged. Colour drawn from the reserved agent palette — **not invented.** |
| **Parallel execution arrives** | Would break the one-alive-element law. **Resolution (pre-approved):** a parallel group renders as one container that breathes *as a unit*; members visible but static; hover expands. One alive element preserved. |
| **Conditional routing arrives** | A diamond gate. This is the **last shape** in the budget. Spend it deliberately; there is no fourth. |
| **Studio evolves** | Test of the Grammar. If Studio requires a new visual metaphor, the Grammar was too shallow and must be deepened — not bypassed. |

---

# PART IV — THE VISUAL REVIEW FRAMEWORK

## 11. The Sixteen Lenses

Every screen is reviewed under all sixteen, every time, in this order. **Failing one lens
means the screen does not ship.** Not "ships with a note" — does not ship.

**Composition (does the eye know where to go?)**
1. **Hierarchy** — is there one unambiguous hero at ≥1.7:1 over anything else?
2. **Composition** — is there a real reading order, or is it a grid?
3. **Negative space** — does the hero breathe, or is it crowded?
4. **Density** — dense *and* scannable, or cramped?

**Craft (was this built or assembled?)**
5. **Typography** — ≥3 distinct sizes with genuine weight contrast; 4:1 on every stat.
6. **Material** — real constructed depth. Never a 1px border pretending to be a panel.
7. **Consistency** — could any element be dropped into another IdeaGate screen unchanged?

**Behaviour (is it alive, and honestly so?)**
8. **Interaction** — are hover / focus / active-work / selection four *distinguishable* states?
9. **Motion** — does every animation map to a real state change? Does everything stop when idle?
10. **Execution storytelling** — does it show *what changed, why, and what's next* — or only *who is working*?

**The human (can a person actually use this?)**
11. **Cognitive load** — is "what is happening" answerable in under 3 seconds?
12. **Signal-to-noise** — could anything be removed with no loss? Then remove it.
13. **Accessibility** — keyboard-reachable, contrast-passing, `useReducedMotion`-honouring, never colour-only.

**Identity (is this IdeaGate, or is it anything?)**
14. **Product identity** — would this be recognisable as IdeaGate with the logo removed?
15. **Anti-goal check** — zero glassmorphism, neon, particles, KPI-card grids, device mockups.
16. **Portfolio quality** — **would you show this screenshot to a hiring manager without apologising?**

## 12. The Review Ritual

- **Who:** the human. Not Claude Chat relaying Claude Code's screenshot description. The
  human, in a browser, on the *integrated route* — never a scratch page.
- **When:** after every visual batch. Before the word "complete" is used.
- **What is produced:** specific notes. *"The hub is too small."* Not *"make it premium."*
- **What happens on failure:** targeted iteration against the failing lens. Never a rebuild.
- **Non-negotiable:** this project shipped five batches without this step, and the entire
  application was rendering in monospace the whole time. No tool would have caught that.
  A person, for ten minutes, would have.

---

# PART V — LIVING DESIGN INTELLIGENCE

## 13. The Quarterly Question

Not *"what tools should we install?"* — that is a shopping list.

**"What should IdeaGate learn this quarter?"** — that is a design practice.

Each quarter, survey: new MCP servers · new Claude Skills · the React Flow, Figma, and
motion ecosystems · graph and visualization libraries · AI-native UI workflows · design
engineering writing (GitHub, Reddit, X, YouTube, engineering blogs).

For each finding, ask the only question that matters: **what *vocabulary* does this
contribute?** Not *what components can I install?*

## 14. The Adoption Gate

Every tool, every quarter, must clear all five. **Failing one is rejection, regardless of
how good the tool is:**

1. It solves a **named** problem we actually have.
2. It is **additive** — no rewrite of engine, adapters, or protected files.
3. It **preserves the Grammar** — it does not import a competing visual identity.
4. It is **zero-cost**, or its cost is justified against a specific, named failure.
5. It does not make **Studio, Desk, or Blueprint harder to build.**

## 15. The Decision Log

Every evaluation is recorded in THE LOG, permanently, with a date and a verdict —
**including rejections, and why.** Rejections are the most valuable entries: they are
what stops a future contributor (human or AI) from re-litigating a settled question and
losing another week.

Format: `[DATE] · Tool · Adopt / Defer / Reject · Reason · Revisit-when`

---

# PART VI — THE HONEST ROADMAP

## 16. What gets written, and when

| Document | Status | Written when |
|---|---|---|
| **THE CONSTITUTION** | ✅ This document | Now |
| **THE GRAMMAR** | Exists as V2 §3–4 | Split out now. **Frozen until validated.** |
| **THE LOG** | Partial (tool evals + reference curation exist) | Start now, append forever |
| Composition Blueprint Library | ❌ Zero entries | **At Stage 4** — when the first blueprint exists |
| Everything else | ❌ | **Only after one screen proves the Grammar works** |

## 17. The warning this Constitution exists to enforce

**The Grammar has never rendered a pixel.**

Seven-layer nodes, four-layer elevation, 4:1 type ratios, travelling-pulse edges, grain
overlays, bracket corners — every one of them is specified and none of them is built.
Some are wrong. They always are.

**A design system is extracted from working screens. It is not projected onto unbuilt
ones.** Linear's design system describes Linear. Ours currently describes a hypothesis.

Therefore, the binding rule of this Constitution's first chapter:

> **Build one screen to the Grammar. Look at it. Then codify what actually worked.**
>
> No further governance documents are written until Live Orchestration renders, is
> integrated into `/office`, and has been approved by a human in a browser under all
> sixteen lenses.

The next artifact is not a document. It is a Composition Blueprint — wireframe only, no
colour, no type, no motion — for Live Orchestration. And then a screen.

---

*The IdeaGate Design Constitution v3.0*
*The Grammar is the language. This is the authority over it.*
*Code wins on fact. The Grammar wins on intent. A human decides what is premium.*
*Nothing ships that a person has not seen.*
