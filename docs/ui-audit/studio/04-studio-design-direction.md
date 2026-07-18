# 04 — Studio Design Direction
## The Reference Implementation of the IdeaGate Design Language
### Input: Design Intelligence Library · 01-evidence.md · 02-screenshot.png · 03-machine-readable-analysis.md

> **What this document is.** The redesign *direction* for Studio — product experience,
> composition, hierarchy, interaction philosophy, visual language, and success criteria.
> It is not implementation. No CSS, no components, no code — those belong in the Execution
> Blueprint that follows.
>
> **What this document is *for*.** Studio is the pilot. Every pattern named here is written
> to become the platform reference for Desk, Office, Blueprint, and Mission Control. Where a
> decision is a **platform pattern** (reusable) rather than a **Studio detail** (local), it
> is marked ⬡ PLATFORM PATTERN. Those are the load-bearing lines.

---

## 1 — THE ONE-SENTENCE DIAGNOSIS

The evidence and the screenshot agree, and together they say something sharper than either
alone:

> **Studio is composed inside-out. The chrome shouts; the stage is empty.**

The largest region of the screen — the center, the natural hero — currently holds a
placeholder and an instruction box. The **loudest, densest, most visually active** elements
are the two side panels of controls. A user's eye is pulled to the configuration, not the
work. That is the root of "assembled, not designed": a designed workspace makes the *work*
the protagonist and lets the tools recede until needed. Studio does the reverse.

Everything else GPT's analysis correctly catalogued — uniform weight, border-only depth, no
type hierarchy, 18 arbitrary font sizes, one alive token in 300 declarations — is real, and
downstream of this one structural fact. **Fix the composition and the rest becomes styling.
Fix the styling without the composition and it still reads as a prototype.**

So this direction is ordered deliberately: **Composition → Typography → Material → Motion.**
Each layer assumes the one above it is settled. This ordering is itself the first platform
pattern.

⬡ **PLATFORM PATTERN — The Order of Operations.** Every IdeaGate screen is designed
composition-first: establish the hero and the reading order before any color, type, or
material decision. Desk, Office, and Blueprint each inherit this sequence. A screen that
starts from styling will always look assembled.

1.5 — STUDIO IS A THINKING SURFACE, NOT A DOCUMENT EDITOR

The model this document has been implicitly using

Read literally, the document so far describes:

Workspace → Artifact → AI → Decision

That's accurate for what Studio does today, and it's not wrong — it's incomplete. It
quietly assumes the hero is always prose: an artifact, read and diffed. That assumption
was never stated as a design decision. It was inherited from the current implementation,
where prose is the only representation Studio has ever needed to hold.

The model Studio is actually built to support

Product Thinking → Shared Understanding → Current Unit of Work
  → Collaboration → AI Collaboration → Decision → Propagation
  → Organizational Knowledge

The phrase that matters is Current Unit of Work, replacing Artifact. An artifact is
one instance of a unit of work. It is not the only one, and Studio's philosophy should never
have depended on it being the only one.

The hero is a slot, not a type

This is the one idea this section exists to establish, and it resolves the gap without
touching anything else in the document:


The hero zone hosts whichever representation of product thinking the current work
requires. It is defined by its role in the room — dominant, calm, most clearly lit — never
by its content type.



A PRD, an architecture document, a comparison, AI reasoning, a dependency graph, a Mermaid
diagram, a journey map, a mind map, a whiteboard, validation results, stakeholder review
comments — each is a tenant of the hero, not a variant of Studio. The room doesn't change.
What's sitting in the light does.

This is why §2's Shifting-Emphasis Room already works without amendment: it was specified as
zones changing prominence, never described in terms of what the hero contains. §4's
Editorial Hierarchy, §5's Three Surface Levels, §6's Motion principles — all defined in terms
of the hero's role, not its shape. They were built correctly. This section simply says so
out loud, so the next contributor doesn't have to infer it.

Collaboration is not a future add-on — it is a hero tenant

The same reasoning extends to how people work in the room, not just what's displayed in it.
Review, annotation, highlighting, discussion, critique, presentation — these are not features
bolted onto an editor. They are additional modes of occupying the hero, governed by the same
patterns: one hero, calm and dominant; aides that recede; light that communicates depth;
motion that communicates state, never spectacle. A discussion thread beside a PRD under
review follows §5 and §7 exactly as a diff view does. Nothing new is invented for it.

What this changes about how Studio is judged

Nothing in the Ledger changes. Nothing in v1.1's principles changes. What changes is a single
question a future contributor should ask before building any new capability into Studio:


Does this need a new room — or is it simply a new tenant of the hero?



Almost everything on the list — diagrams, comparisons, reasoning traces, review threads,
alternative visual frameworks the orchestration layer might eventually produce — is a tenant.
The room already knows how to hold it. This is what makes Studio's philosophy durable rather
than something the next orchestration mode forces a rewrite of.

What this does not authorize

This section future-proofs the philosophy. It does not pull any of these representations
into the current roadmap. Sprint S1–S5 remain scoped exactly as planned — composition and
typography on the artifact-as-hero, because that is the unit of work Studio hosts today.
Nothing here adds implementation scope. It ensures that when a new representation genuinely
arrives, it enters a room already built to hold it, instead of triggering a redesign.

---

## 2 — THE WORKSPACE MODEL: ONE ROOM THAT EVOLVES

You asked for a continuous operational workflow, not states stitched together. That
requires a spatial model, and it is the most important product decision in this document.

**Studio is one room with three zones whose *emphasis shifts* as work progresses — the zones
never move, only their prominence changes.**

```
   ORIENT              WORK (the hero)             DIRECT
   ┌─────────┐   ┌───────────────────────────┐   ┌─────────┐
   │ where   │   │                           │   │ what to │
   │ am I,   │   │   the artifact — read,    │   │ improve,│
   │ what    │   │   understand, compare,    │   │ how,    │
   │ can I   │   │   accept, collaborate                  │   │ how much│
   │ work on │   │                           │   │         │
   └─────────┘   └───────────────────────────┘   └─────────┘
    recedes            always dominant             recedes
```

The critical move: **the center is the hero in *every* state, including empty.** Today the
empty state wastes the hero on an instruction box. Instead:

- **Empty state** — the center is a calm, editorial *invitation to begin*, not a manual. It
  should feel like an open book waiting, not a form waiting. The single most useful next
  action (the suggested-start artifact) lives *here, in the hero*, not buried in the rail.
  The side zones are present but quiet.
- **Reading state** — the artifact fills the hero as a genuine reading surface: editorial
  typography, generous measure, calm. This is where "reading is as important as editing"
  becomes visible. The controls recede further.
- **Improving state** — the AI's proposed change occupies the hero as a comparison. The
  reasoning behind the change is *part of the hero's story*, not a footnote in the panel.
- **Accepted state** — resolution happens in the hero: what changed, what it affected
  downstream, what's next. The eye never leaves the center to find out what the system did.

The user should never feel they've changed screens. The room is constant; the light moves to
where the work is.

⬡ **PLATFORM PATTERN — The Shifting-Emphasis Room.** Every IdeaGate workspace is one
persistent spatial frame whose zones change *prominence*, never *position*, as the user's
task evolves. Office's graph, Desk's artifacts, Blueprint's lifecycle — each is the "hero
zone" of its own room, with orient/direct zones that recede. Continuity of place is how the
product feels like one operating system rather than a set of tabs.

---

## 3 — COMPOSITION & HIERARCHY

### 3.1 The hero must dominate, measurably

The center is not "one of three columns." It is the subject, and it should *read* as the
subject within the first two seconds — GPT's own two-to-three-second test, currently failed.

Dominance comes from three things, in order: **area, calm, and light.** The hero is the
largest zone (it already is, by area — the problem is it doesn't *feel* it). It is the
*calmest* zone — fewest competing elements, most breathing room. And it is the most clearly
*lit* — the one surface that reads as elevated and primary while the side zones sit quieter
and flatter. A loud, dense panel beside a calm, spacious one: the calm one wins the eye. That
inversion is the entire compositional fix.

### 3.2 The side zones must recede — without losing capability

GPT is right that the answer is not removing functionality. The presets, extent, scope,
reference docs, build destination — all stay. The fix is **subordination through visual
weight and progressive disclosure**, not subtraction.

- **Orient (left)** answers one question: *what can I work on, and where does it sit in the
  lifecycle?* The artifact list and its lifecycle position. Quiet, scannable, secondary.
- **Direct (right)** answers one question: *how do I want this improved?* But it should
  reveal itself in *layers* — the primary act (describe intent, improve) is always visible;
  the refinements (extent, scope, presets, reference docs, build destination) are present but
  visually recessive, becoming prominent only when the user engages configuration.

The evidence shows eleven preset chips, three extent buttons, three scope buttons, a
ten-button builder grid, all at roughly equal visual weight to the improve action itself.
That is the "controls compete with the workspace" problem in concrete form. **One primary
action per zone, loud; everything else supporting, quiet.**

⬡ **PLATFORM PATTERN — One Hero, Two Aides.** Every IdeaGate screen has exactly one hero
zone and supporting zones that recede. Within each supporting zone, exactly one primary
action is prominent; refinements are progressively disclosed. This is how density stays high
while cognitive load stays low — the platform's central tension, resolved the same way
everywhere.

### 3.3 Reading order is designed, established by weight and light

The eye should travel: **hero first** (what am I working on) → **orient** (what else, where
in the lifecycle) → **direct** (how do I act). Today, because every region shares weight, the
eye has no path and must scan. The redesign establishes the path through size and luminance —
never through position alone, and never through color as the primary signal.

⬡ **PLATFORM PATTERN — Luminance Leads.** Reading order across IdeaGate is established
primarily by *light* (what's elevated and bright vs. recessed and quiet) and *scale*, not by
color. Color is reserved for meaning (state, identity), never spent on hierarchy. This keeps
the palette calm and the hierarchy legible to everyone, including in the product's dark-only
environment.

---

## 4 — TYPOGRAPHY: FROM INSTRUMENT TO EDITORIAL

The evidence is unambiguous: 18 distinct font sizes from 8px to 24px, every one mono, every
one an arbitrary inline literal, zero use of the type scale that already exists. This is the
clearest single signal of "engineering prototype," and it is the fastest premium win.

### 4.1 Two voices, strictly assigned

⬡ **PLATFORM PATTERN — The Two Voices.**
- **The human voice — a warm, confident sans (Geist Sans).** Everything a person reads *to
  think*: the artifact prose, section identity, the reasoning the AI offers, headings. This
  voice carries hierarchy through real weight and scale contrast.
- **The machine voice — mono (JetBrains Mono).** Everything the *system* emits as data:
  metadata, version markers, token counts, stage codes, status labels, timestamps, model IDs.
  Precise, technical, quiet.

This is not decoration — it is *semantic*. The two voices tell the user, pre-consciously,
what is *thinking* versus what is *state*. It is also the single biggest lever for flipping
Studio's character from "terminal" to "editorial workspace." Right now everything is the
machine voice, which is why the whole screen reads as a console. The artifact — the *product
thinking* — deserves the human voice.

### 4.2 A real hierarchy, not eighteen sizes

Collapse the 18 arbitrary sizes into a disciplined scale with genuine contrast between levels:
a confident hero/display size for artifact and section identity, a comfortable reading size
for prose, a small quiet size for the machine voice's labels and metadata. The exact scale
already exists in the design system; this document's point is *editorial contrast* — a person
should distinguish page identity, section identity, reading content, and metadata **without
reading a single word**, purely by typographic weight and size. GPT's "editorial hierarchy"
recommendation, made concrete.

The artifact prose specifically deserves treatment as *reading matter*: a comfortable measure
(line length), generous line height, real paragraph rhythm. "Reading is as important as
editing" is a typographic commitment before it is anything else.

⬡ **PLATFORM PATTERN — Editorial Hierarchy.** Every IdeaGate screen distinguishes identity /
section / content / metadata through four clearly-separated typographic levels. A user scans
structure by weight and size alone. Desk's documents, Office's panels, Blueprint's nodes all
inherit this — the product reads like considered software because its type is considered.

---

## 5 — MATERIAL: FROM OUTLINED BOXES TO LAYERED SURFACES

The evidence: zero box-shadow anywhere, five inline-hex flat backgrounds, borders doing all
structural work. GPT's read — "the workspace presents itself as a collection of equally
important panels rather than a layered operational environment" — is exactly right.

### 5.1 Depth communicates hierarchy, not decoration

⬡ **PLATFORM PATTERN — Three Surface Levels.** The workspace establishes depth through light,
not outlines:
- **The room** — the canvas everything sits on. Deepest, quietest.
- **Primary surface** — the hero. Clearly *raised*: it catches light on its top edge and
  casts a soft shadow, so it reads as sitting *on* the canvas, closest to the user.
- **Supporting surfaces** — the side zones. Present, but *lower* — less lifted, quieter, so
  they recede beneath the hero's prominence.

The difference between a surface that is *outlined* (a 1px border on a flat fill — today) and
one that is *raised* (edge-light + shadow, sitting on the canvas) is the difference between a
wireframe and a product. This is the material fix, and it directly reinforces the composition:
the hero is raised *and* dominant; the aides are lower *and* quieter. Light and hierarchy say
the same thing.

### 5.2 Restraint is the discipline

The Design Intelligence Library's own guidance — and IdeaGate's identity — bans the easy
version of "depth": no glassmorphism, no heavy glow, no neon, no decorative gradients. Depth
comes from *believable light from a consistent direction*, the way it does in Linear and
Vercel. Subtle, physical, calm. The moment depth becomes an effect the user notices *as* an
effect, it has failed. It should be felt, not seen.

⬡ **PLATFORM PATTERN — Light, Not Ornament.** Depth everywhere in IdeaGate comes from
consistent, restrained light — edge-highlights and soft shadows — never from translucency,
glow, or gradient decoration. This is what lets the product feel *expensive* rather than
*flashy*, and it is the same physics on every screen.

---

## 6 — MOTION: CONTINUITY AND CONFIDENCE

Motion in Studio has one job: **make the continuous-workspace model *felt*.** When the room's
emphasis shifts — empty → reading → improving → accepted — the transition should be a
*continuous evolution of one space*, not a cut between screens. Content settling into place,
the hero receiving focus, a proposed change arriving with calm authority.

Three principles, all platform-level:

⬡ **PLATFORM PATTERN — Motion Communicates State.** Every animation maps to a real change in
the work: an artifact loading, a change arriving, a state resolving. Nothing moves for
delight alone.

⬡ **PLATFORM PATTERN — Continuity Over Transition.** State changes are *continuous* — the same
room evolving — never hard cuts. This is what makes the workflow feel unbroken and the product
feel like one operating system.

⬡ **PLATFORM PATTERN — Stillness Is the Default.** When the user is reading or thinking,
nothing moves. Calm is the resting state. Motion is the exception that signals something
genuinely happened — which is exactly what makes it trustworthy when it appears.

The AI's work specifically deserves *confident* motion, not busy motion. When an improvement
is generating, the feedback should feel like a considered colleague working — named, calm,
progressing — never a spinner, never frantic. "AI is an intelligent collaborator, not
spectacle" is a motion commitment as much as a copy one.

---

## 7 — THE AI AS COLLABORATOR, NOT INTERFACE

A specific identity point, because it shapes several decisions above. In Studio, the AI is
*not* the primary surface — the artifact is. The AI acts *on* the work, and its presence
should be felt at three moments:

- **Before** — the improvement intent is where the user *briefs* the collaborator. It
  deserves prominence as the primary act of the Direct zone, phrased as intent, not
  configuration.
- **During** — generation feedback is confident and legible: *what* is being done, by which
  model, calmly progressing.
- **After** — the reasoning the AI offers is *first-class content in the hero*, part of
  understanding the proposed change — not a small block buried in a side panel, which is where
  the evidence shows it lives today. The user should be able to read *why* the AI proposed a
  change as easily as they read the change itself.

⬡ **PLATFORM PATTERN — AI Acts on the Work.** Across IdeaGate, AI is a collaborator that
operates *on* the hero content, surfacing its reasoning as readable content, not as chrome.
Office's agents, Blueprint's analysis, Desk's suggestions all inherit this posture: the
product thinking is the hero; the AI is the intelligent hand acting on it.

---

## 8 — WHAT MUST BE PRESERVED

Refinement, not reinvention. These are strengths the evidence and analysis both confirm, and
they must survive the redesign intact:

- **The three-zone operational model.** It is correct. It becomes a platform pattern. Do not
  restructure it — re-weight it.
- **Context never disappears.** Navigation, lifecycle position, artifact selection, and
  controls coexist without modal interruptions. GPT rightly calls this a core strength. Preserve it.
- **Information density.** This is a professional tool for product work. The answer to
  "cluttered" is hierarchy, never sparseness. Density stays; competition for attention goes.
- **The lifecycle is always visible.** The artifact graph communicates that outputs belong to
  an interconnected process. That is IdeaGate's differentiator from a document editor. Keep it
  present — but subordinate it to the hero rather than letting it compete.
- **Semantic domain language.** "Improvement Intent," "Artifact," "Runtime," "Reference Docs"
  — this vocabulary *is* the product. Unchanged.
- **Restraint in color.** Accent reserved for meaning, not decoration. Already right. Preserve.

---

## 9 — SUCCESS CRITERIA

Not "does it match the spec." The bar is perceptual, and it is the bar you named:

**The five-second test.** A VP Product, Principal Designer, Staff PM, or YC partner sees a
screenshot of Studio for five seconds. Do they believe it was designed by an experienced
product design team building a serious operating system? Today: no. After this direction is
executed well: yes.

Concretely, Studio has succeeded when:

1. **The hero is unmistakable in two seconds.** Cover the center with a hand and the screen
   loses its subject. The eye goes to the work first, the controls second — without effort.
2. **The two voices are legible.** A glance distinguishes *thinking* (editorial sans) from
   *state* (mono), and the artifact reads like considered reading matter, not console output.
3. **Surfaces are layered, not outlined.** The hero reads as raised and primary; the aides
   recede beneath it. Depth is felt, not noticed as an effect.
4. **It's the same room throughout.** Moving empty → reading → improving → accepted feels like
   one workspace evolving with the work, never like switching screens.
5. **Density reads as calm, not cluttered.** All the capability is still present; none of it
   competes with the work. A user knows where to begin without scanning.
6. **It could stand beside Linear, Vercel, Raycast** — sharing their discipline (calm,
   hierarchy, restraint, considered type and light), while looking unmistakably like IdeaGate,
   not like any of them.
7. **Every pattern here is reusable.** Nothing in the redesign is a Studio-only trick. Desk,
   Office, and Blueprint can adopt the shifting-emphasis room, the two voices, the three
   surface levels, luminance-led hierarchy, and motion-as-state without amendment.

9.5 — THE PRODUCT OPERATING PRINCIPLES

The twelve items in the Ledger are patterns — how the product behaves. These five are
principles — what the product believes. Principles generate patterns; when a design
question isn't answered by a pattern, it is answered here.

These five are what separate IdeaGate from a well-designed SaaS application. They cannot be
inferred from general design maturity, because they are not design ideas — they are Product
Operating System ideas that happen to have design consequences. Every one of them is already
true in the system's architecture. The work of the redesign is to make them perceptible.


P1 — Journey over Documents

An artifact is never a file. It is a position in a living product lifecycle.

Studio edits one stage, but the system always knows what sits downstream of that stage, and
what a change costs. This is architecturally true today — improvements propagate, dependent
artifacts are marked stale, transitive downstream impact is computed — and it is the single
clearest reason IdeaGate is not a document editor.

What it demands of the design: consequence must be visible at the moment of decision,
not discovered afterward. Before a user accepts a change, they should already understand what
it touches. Downstream impact is not a notification — it is part of the decision. The
lifecycle graph is not decoration in the header; it is the artifact's address, always
legible.

The failure mode this prevents: a beautiful editor that lets a PM confidently corrupt six
downstream artifacts without noticing.


P2 — Context Accumulates

The system remembers. The user should never re-explain their own work.

Improvement history, version lineage, reasoning from prior passes, uploaded reference
material, session state — the product already holds all of it. Context compounds as the
journey progresses; the tenth improvement should be better-informed than the first.

What it demands of the design: accumulated context should be quietly present rather
than requested. The interface should feel like it has been paying attention. Where the system
already knows something — which artifact is strongest, what was improved last, what a prior
pass concluded — it should offer that rather than present an empty field. Asking a user for
information the system already holds is the fastest way to feel like a tool instead of a
colleague.

The failure mode this prevents: a powerful system that behaves like a stateless form.


P3 — Reasoning is Observable

Thinking should be inspectable, not magical.

The AI's rationale already exists as first-class data — reasoning chains, PM rationale,
impact warnings. It is currently buried where the user is least likely to read it.

What it demands of the design: enough reasoning to establish why, never so much that it
competes with the work. Reasoning belongs beside the change it explains, readable at the
moment of judgment, and inspectable in more depth on demand — never hidden, never dumped.
Progressive depth is the mechanism: a line by default, a full trace when asked.

The failure mode this prevents: a user accepting AI output because it looks confident rather
than because they understood it. That is the difference between a professional instrument and
a slot machine.

(This principle deepens §7 — AI Acts on the Work. §7 establishes the AI's posture; P3
establishes its obligation.)


P4 — Trust Before Speed

Professional product work values confidence above velocity.

The improvement model is already built on this: nothing is committed until it is previewed;
every proposal can be discarded; every change is versioned. That is a deliberate trade of
speed for confidence, and it is correct.

What it demands of the design: every interaction is measured first against predictability,
reversibility, and transparency — and only then against speed. Nothing consequential happens
without a visible, understood step. Destructive or propagating actions are never one careless
click. The user should always be able to answer three questions without effort: what is about
to happen, what will it affect, and can I undo it.

Speed comes from removing friction the user didn't need — never from removing the moment where
they decide.

The failure mode this prevents: an efficient interface that professionals don't trust with
real work.


P5 — Lifecycle is the Operating Model

Navigation exposes the workspace. The lifecycle is the product.

Desk, Studio, Office, Blueprint are not four applications sharing a shell. They are four
vantage points on one continuous journey — the same artifacts, the same stages, the same
accumulating context, viewed for different purposes.

What it demands of the design: every workspace must express its position in the same
journey, using the same lifecycle vocabulary and the same visual language for stage, artifact,
and progression. A user moving between workspaces should feel they changed perspective, not
application. Stage, artifact identity, and downstream state must look and mean the same
thing everywhere.

This is the principle that makes the Shifting-Emphasis Room a platform decision rather than a
Studio one: continuity of place within a screen, and continuity of journey across screens,
are the same idea at two scales.

The failure mode this prevents: four well-designed screens that don't add up to an operating
system.


How these are used

When a design decision isn't settled by a pattern in the Ledger, resolve it against these five
— in order. P4 (Trust) outranks convenience. P1 (Journey) outranks local elegance. A choice
that makes one screen more beautiful while making the journey less legible is the wrong choice.

They are also the acceptance criteria that matter most in a portfolio review. A VP Product
recognises craft immediately, but what makes them believe a product operating system exists
is seeing that the interface understands consequence, remembers context, shows its reasoning,
earns trust before speed, and treats the lifecycle as the spine. That is not a look. It is a
point of view — and it is IdeaGate's.


---

## 10 — THE PLATFORM PATTERN LEDGER

Studio is the pilot. These are the patterns it exists to prove, extracted for reuse. When
Desk, Office, Blueprint, and Mission Control are designed, this is the reference:

| # | Pattern | The rule |
|---|---|---|
| 1 | **Order of Operations** | Compose first (hero + reading order), then type, then material, then motion. |
| 2 | **Shifting-Emphasis Room** | One persistent spatial frame; zones change prominence, never position, as work evolves. |
| 3 | **One Hero, Two Aides** | Exactly one hero zone; supporting zones recede; one primary action per aide, refinements disclosed progressively. |
| 4 | **Luminance Leads** | Hierarchy from light and scale; color reserved for meaning, never spent on emphasis. |
| 5 | **The Two Voices** | Sans for human thinking; mono for machine state. Semantic, not stylistic. |
| 6 | **Editorial Hierarchy** | Four distinct type levels — identity / section / content / metadata — scannable by weight alone. |
| 7 | **Three Surface Levels** | Room / primary (raised) / supporting (lower). Depth from light, reinforcing hierarchy. |
| 8 | **Light, Not Ornament** | Depth from consistent restrained light; never glass, glow, neon, or gradient decoration. |
| 9 | **Motion Communicates State** | Every animation maps to a real change in the work. |
| 10 | **Continuity Over Transition** | State changes are continuous evolutions of one space, never hard cuts. |
| 11 | **Stillness Is the Default** | Calm at rest; motion is the exception that signals something happened. |
| 12 | **AI Acts on the Work** | AI operates on the hero content and surfaces reasoning as readable content, never as chrome. |

---

*04-studio-design-direction.md — the reference implementation of the IdeaGate design language.*
*Composition before type before material before motion. Design for the platform, not the page.*
*The artifact is always the hero. Next: the Studio Execution Blueprint.*
