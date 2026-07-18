# IdeaGate PMOS — Claude Code Bootstrap

> Auto-loaded every session. This is a **bootstrap document, not a specification.**
> It tells you who you are, what you must not break, how to decide, and where to look.
> It deliberately does not restate the design system — the Grammar owns that.
>
> Read this. Then read what it points you to. Then work.

---

## 1 — IDENTITY

IdeaGate is an **AI-native Product Operating System**. A coordinator agent orchestrates six
specialists through a 15-stage PM lifecycle (0–14), producing structured artifacts. Stages
are enforced and cannot be skipped. **That enforcement is the product.**

It is also a portfolio piece. Every screen must survive being shown to a senior PM, a design
lead, or a hiring manager **for three seconds, without apology.**

It is **not** a dashboard, chatbot, admin panel, graph viewer, or document generator. When
"make it work" and "make it feel like an operating system built by a world-class team"
conflict — **the second one wins.**

---

## 2 — THE STOP RULES

Hard halts. Not warnings. Stop, report, wait for a human.

1. **All four documents are silent on a visual decision.**
   If the Grammar, the Constitution, the Execution Blueprint, and the relevant Screen Spec
   *all* fail to answer it — **STOP AND ASK. Do not invent. Do not infer. Do not improvise.**
   Silence is not permission. Every flat, generic thing this codebase has ever produced came
   from a gap where the specs said nothing and the model filled it with its training-data
   average. **A gap is a question, not a licence.**
2. A protected file would need to change (§5).
3. Two documents contradict each other. Report it — never resolve it silently.
4. An unexpected uncommitted change appears in a tracked file.
5. A regression check fails.
6. A batch would ship without a human having seen it rendered.
7. Phaser would unmount or re-initialise.
8. An acceptance criterion cannot be met additively.

---

## 3 — DECISION HIERARCHY

**On FACT — what *is* true:**
> **The codebase always wins.** Verify reality before building. Never assume a data shape, a
> token's existence, or a file's contents from a document. Read the file. Grep the token.
> Log the store. Documents describe intent; only code reports reality.

**On INTENT — what *should* be true:**
```
1. THE GRAMMAR       docs/IDEAGATE-VISUAL-GRAMMAR.md        all visual construction
2. THE CONSTITUTION  docs/IDEAGATE-DESIGN-CONSTITUTION.md   authority, values, review lenses
3. THE BLUEPRINT     docs/IDEAGATE-DESIGN-EXECUTION-BLUEPRINT.md  build order, Definition of Done
4. SCREEN SPECS      docs/IDEAGATE-MISSION-CONTROL-SPEC.md  composition, adapter, batches
5. This file
```
A screen spec never defines construction. If a spec and the Grammar disagree on **how a
thing is built**, the Grammar wins.

**You have NO design authority.** You implement the Grammar. Composition, spacing judgment,
and "is this premium?" are human calls — always.

---

## 4 — PRE-FLIGHT (before any visual batch)

Re-read, with intent — each answers a different question:

| Document | The question it answers |
|---|---|
| **Visual Grammar** | *How is this constructed?* — layers, tokens, type scale, motion, interaction, empty states |
| **Constitution** | *Who decides, and what are the review lenses?* |
| **Execution Blueprint** | *What am I building now, and what does "done" mean?* |
| **Screen Spec** | *What is specific to this screen?* — composition, adapter, batch order |

Then: `git status` · confirm the current milestone in the Blueprint · confirm the rollback
tag exists and is **pushed** · confirm what is explicitly **out of scope** for this batch.

---

## 5 — PROTECTED FILES

```
idea-gate-ui-safe/src/core/coordinator-v2.js        ← most protected
idea-gate-ui-safe/src/core/lifecycle-engine.js
idea-gate-ui-safe/src/core/journey-engine.js
idea-gate-ui-safe/src/utils/llm.js
idea-gate-ui-safe/src/config.js
idea-gate-ui-safe/workspace/                        ← runtime artifacts, never touch
ui-layer/src/lib/parseContent.ts
ui-layer/src/app/desk/page.tsx
```
**Exception protocol — all six, or stop:** (1) rollback tag pushed first · (2) file read
completely, relevant sections quoted · (3) additive changes only · (4) TypeScript 0 errors
after each change · (5) owner smoke-tests before push · (6) anything fails → **STOP**.

**Model IDs live ONLY in `ui-layer/src/lib/model-registry.ts`.** Never hardcode one
elsewhere. Never add `MODEL_IDS`/`MODEL_LABELS` to a new file. Use `resolveModelId()`, and
`validateModelId()` at every API boundary. Never remove a `LEGACY_KEY_MAP` entry. Adding or
deprecating a model = edit that one file, nothing else.

---

## 6 — REPOSITORY

```
CLI Engine (backend, authoritative):  /Users/apple/idea-gate-ui-safe
UI Layer (frontend):                  /Users/apple/agent-zero-data/workdir/ui-layer
GitHub:                               github.com/gracias-svg/Idea-Gate
```
Two directories, one remote. Work **only** inside them. Never create new directories. Never
create `_v2` / `_new` / `_fixed` / `_copy` / alternative runtimes. Never duplicate a file you
are modifying. Never move files between the two locations.

---

## 7 — SESSION PROTOCOL

1. `git status` before touching anything.
2. **One concern per session.** Not a list of things.
3. Read the file completely before editing it.
4. Smallest change that solves the problem. **Additive over replacement** — new code wraps
   existing logic, it does not replace it. That is the blast-radius control.
5. `git diff` before every commit — show it, explain it.
6. Never commit without reading the diff.
7. At ~75% context: stop cleanly, commit what's complete, write a handoff.

**Never run without explicit approval:**
`rm -rf` · `git reset --hard` · `git clean -fd` · `git push --force` · `git checkout -- .` ·
`git restore .`

Before deleting, moving, renaming, or overwriting anything: explain why → show affected
files → wait.

---

## 8 — WHAT WORKS. DO NOT REGRESS.

OpenRouter model routing · 15-stage lifecycle to completion · artifact generation · journey
timing · coordinator iteration guard · API key routing · 22-model selector (TopBar +
Settings) · Studio improve / accept / versioning / stale propagation · Stop clears the lock
file · New Idea resets · real-time stage banner.

**Regression suite — run before declaring any visual batch complete:**
lifecycle end-to-end · Stop clears the lock file · Improve + Accept · New Idea resets ·
model selector hits the real API · Desk / Studio / Office all still work.

**Known pre-existing defect — documented, deliberately deferred, NOT a regression of any
later batch:** New Idea clears the left artifact panel but the Overview/Lifecycle panel
retains stale state. Evidence in `docs/regression/`. **Do not fix it inside another batch.**

---

## 9 — DESIGN PHILOSOPHY

The Grammar owns the **rules**. This is the **taste** — the tie-breaker when two
implementations are both technically correct and both correctly authorised.

**Premium is restraint, not spectacle.**
- **Hierarchy before decoration.** Earn attention with weight, scale, and position — never effects.
- **Calm under information density.** Dense is fine. Cluttered is failure.
- **Motion communicates state, never entertainment.** If an animation doesn't say *what
  changed*, *why*, or *what to look at now* — delete it.
- **Stillness is honest.** When nothing is executing, **nothing moves.**
- **Every pixel earns its place.** If removing an element loses no meaning, remove it.
- **Every interaction is intentional.** An action with no keyboard path is incomplete.
- **The graph reads as a team working**, not as a system rendering.

**Permanently banned. No exceptions. No "just this once."**
glassmorphism · backdrop-blur · translucency · neon · particles · sci-fi HUD · decorative
glow · KPI-card grids · device mockups · purple gradients · decorative motion · motion on a
timer · fake hardware telemetry (`[CPU]` `[MEM]` `[GPU]`) · AI-aesthetic signalling of any kind.

**The bar:** Linear, Stripe, Vercel, Raycast, Arc — not because we copy them, but because we
share their level of craft. And still unmistakably IdeaGate.

**Everything else — layer counts, exact values, tokens, type scale, node/edge/panel
construction, motion primitives, the four interaction states, empty states — is in THE
GRAMMAR. Read it. Do not re-derive it here.**

Studio Design Direction (source of truth for Studio's redesign): docs/ui-audit/studio/04-studio-design-direction.md (includes v1.1 Product Operating Principles + v1.2 Thinking Surface)


---

## 9.5 — THE CRAFT STANDARD

IdeaGate must feel like a best-in-class product of the mid-2026 era, not merely a
functioning interface. Every screen, transition, graph, panel, tooltip, loading state,
hover state, and empty state must communicate deliberate craftsmanship.

Premium is achieved through clarity, hierarchy, rhythm, spacing, typography, motion,
material depth, and restraint — never through decoration.

**The question every surface must pass:**
> *"Would this feel credible beside the best SaaS products of 2026, while remaining
> unmistakably IdeaGate?"*

**Premium is a quality bar, not a finishing pass.** It is not something added at the end.

**But you do not answer that question.** If craft, hierarchy, readability, or motion
quality feel uncertain or improvable, **do not self-refine and do not iterate on taste —
flag it for human review and say specifically what feels weak.** Assessing premium-ness is
a human call (§3). Your job is to build to the Grammar and to name what you're unsure of.

Do not research external design patterns mid-batch. Reference curation happens between
batches, by a human. Build from the Grammar and the reference images in `refs/`.

---

## 10 — DEFINITION OF DONE

TypeScript 0 errors · build succeeds · no protected file touched · Phaser never unmounts ·
regression suite passes · **all 9 review lenses pass** (Grammar §12) · **and a human opened a
browser and approved it.**

Full gate: Execution Blueprint §16. **"It compiles" is not done.**

---

## 11 — SETTLED DECISIONS — do not re-open, do not re-litigate

These are closed. If you find yourself proposing one of these, stop — it has been decided.

- **The Grammar is the single source of visual construction.** Screen specs point to it;
  they never redefine it.
- **The documentation phase is complete.** If a rule is missing, **amend the Grammar** —
  never create a new document. There will be no more design documents.
- **The orchestration graph is hand-built.** No component library, template, or registry
  supplies it. Chrome may be templated; the hero never is.
- **Stack is fixed:** Next.js · TypeScript · Tailwind · shadcn/ui · @xyflow/react ·
  framer-motion · Zustand · OKLCH · Geist Sans + JetBrains Mono. Do not propose replacements.
- **Zero-cost, additive, reversible.** No new dependency without a named problem it solves.

---

## 12 — WHERE WE ARE

```
Baseline tag:  v5.2-pre-mission-control (82aea5d)
Phase:         Pre-W0 baseline verification → W0 Material Foundation
```

**Built:** 15-stage engine · 22-model registry · Studio improve/accept · Foundation (OKLCH
tokens, Tailwind v4 + shadcn, Geist + JetBrains loaded, motion primitives, composition
primitives, Zustand execution store, selection contract) · Mission Control M0–M2.5 (pure
adapter, viz primitives, storytelling motion).

**Known gaps — real, verified, not yet fixed:**
- **The entire app renders in monospace.** `layout.tsx`'s `<body>` forces JetBrains Mono
  globally, overriding Geist Sans. This is why nothing has typographic hierarchy.
- `--ig-t-*` type scale exists only in a markdown table — **not as CSS.**
- `--ig-elev-1` is a **1px border**, not the Grammar's 4-layer elevation.
- Mission Control lives on `/mc-scratch`; **`/office` still renders the old flat graph.**
- Selection is not wired. The Coordinator renders at 80×72, not the Grammar's 96px.

**Do not beautify `/office` or `/mc-scratch` as they exist today.** They are scheduled for
full replacement. Polishing deprecated components is negative-value work.

> **The current milestone, its scope, its exclusions, and its acceptance criteria live in
> the Execution Blueprint — not here.** Read it at the start of every batch. This file tells
> you the standing rules; the Blueprint tells you today's job.


