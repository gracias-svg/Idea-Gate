# IDEAGATE-MISSION-14-DESIGN-SYSTEM.md
# Mission 14 — Design System & Visual Operating System
# Version 1.0 | July 2026
# Status: PLANNING — approve after Specification, before Implementation Plan
# Depends on: IDEAGATE-MISSION-14-SPECIFICATION.md (Experience Principles EP-1..EP-8)

---

## 0. PURPOSE

This document defines *how IdeaGate looks, feels, and behaves* — the visual and experiential
operating system every current and future workspace inherits. The Specification defined scope
and experience principles; this defines the concrete visual language, motion vocabulary,
component contract, and the trust and brand foundations that make IdeaGate feel like one
coherent premium product rather than a collection of pages.

It is grounded in independent research of the mid-to-late-2026 premium AI-native SaaS
landscape (Linear, Vercel, Anthropic, Perplexity, Raycast, Cursor, Notion; LangGraph-style
orchestration visualizers). The goal is not imitation. It is to understand *why* the strongest
products feel trustworthy, productive, and memorable — and to apply only what strengthens
IdeaGate's own identity.

---

## 1. BRAND PROMISE

**What a user should remember after using IdeaGate:**

> "It thought through my idea the way a senior product team would — and I could watch it think."

**The one-line brand feeling:**

> Calm everywhere. Alive where the intelligence is working.

**The three-word essence:** Structured. Transparent. Premium.

Everything in this design system serves that promise. If a design choice does not make
IdeaGate feel more structured, more transparent, or more premium, it is removed.

---

## 2. DESIGN PERSONALITY

IdeaGate is a **calm command center operated by a senior product mind** — not a spaceship
cockpit, not a gamer UI, not a generic AI dashboard.

**Core personality (the dominant register — ~90% of the product):**
calm · intelligent · deliberate · trustworthy · technical · premium · structured · confident

**Controlled energy (the accent register — reserved for one place only):**
The live orchestration graph in Office is the *single* location where subtle futuristic
energy is permitted — earned glow, animated context flow, premium motion — because there it
represents real agents doing real work (EP-2). This controlled contrast *is* the brand: the
product is quiet and disciplined everywhere, and comes visibly alive exactly where the
multi-agent intelligence is executing.

**Explicitly forbidden** (these make a product read as junior or dated in 2026):
cyberpunk · heavy neon · glow-everywhere · decorative animation · flashy-for-flashy's-sake ·
a second accent color · gradient overload · WebGL shaders · fake "AI-powered" badges.

**Why this balance (from research):** The techno-futurist aesthetic (dark + neon + shaders +
bento everywhere) is now *commodity* in 2026 — it no longer signals quality because everyone
has it. The differentiator at the top of the category is *restraint and point of view*
(Linear, Anthropic, Vercel). IdeaGate wins by being calm and disciplined, with its one
moment of visible intelligence earning its energy honestly.

---

## 3. CONFIDENCE & TRUST DESIGN

The single most important lesson from researching why premium AI products feel trustworthy:
**trust is built by transparency of process, not polish of surface.** Perplexity won the
trust battle in 2026 by *showing its work* — inline citations, visible sources, "a research
assistant that actually shows its work." IdeaGate's equivalent is showing the coordinator's
reasoning and the agents' real execution. Polish supports trust; it does not create it.

IdeaGate builds confidence through seven honest-interaction rules. Each is a design mandate,
and several are testable gates.

**CT-1 — Honest system state.**
The UI never shows a state that isn't real. If a run is idle, it says idle. If a model fell
back, the UI reflects the model that actually ran, not the one selected. No optimistic lies.
(Directly enforces EP-3: every number is real.)

**CT-2 — Transparent execution.**
The user can always see what the system is doing right now and what it did. The Office
orchestration graph, the live log stream, and the lifecycle node chain exist to make the
execution legible. The system never works behind an opaque spinner when it could show the
real step in progress.

**CT-3 — Visible reasoning.**
Wherever the coordinator made a decision (stage confidence, go/no-go, conflicts noted), that
reasoning is surfaced, not buried. This is IdeaGate's Perplexity-citation equivalent and its
single largest trust and credibility lever. (Enforces EP-8.)

**CT-4 — Meaningful progress feedback.**
Every operation communicates progress against something real: stage X of 14, tokens accruing,
elapsed time, the specific agent working. Progress is never a decorative bar with no referent.
(Enforces EP-5.)

**CT-5 — Predictable navigation.**
The shell (nav rail, status bar, layout) is identical on every screen. The user always knows
where they are and how to get anywhere. Navigation never surprises. (Enforces EP-7.)

**CT-6 — Truthful empty and error states.**
Empty states educate ("enter an idea and press Run to see the pipeline execute") rather than
report absence ("no data"). Errors state exactly what happened and what to do, in plain
language, never a raw stack trace to the user. (Enforces EP-4.)

**CT-7 — Reversible, low-consequence interaction.**
Actions that change state (New Idea, Accept, Stop) are clear about their consequence and, where
possible, reversible or confirmable. The user never fears clicking. Confidence comes from
knowing nothing is a trap.

**Trust test (applied at every component gate):** For each component, ask — "Does this show
the user something true, and does it help them trust what the system is doing?" If a component
adds polish but obscures truth, the polish is wrong.

---

## 4. EXPERIENCE LANGUAGE (how the product behaves)

The Design System defines how things look; the Experience Language defines how the product
*moves and feels* as the user works. These are behavioral rules, distinct from visual tokens.

**Reading flow.** Every screen respects F-pattern scanning (validated by eye-tracking
research): the most important element sits top-left, primary metrics scan left-to-right across
the top, detail flows down the left. The user's eye is never forced to hunt.

**One question, one action (per screen).** Each primary screen answers exactly one PM
question and encourages exactly one primary action. Secondary actions are present but visually
subordinate. (EP-1.)
- Desk → "What did the system produce, and how good is it?" → primary action: read/open.
- Office → "What is happening / what happened during the run?" → primary action: observe.
- Studio → "How do I make this artifact better?" → primary action: improve.

**Progressive disclosure (default everywhere).** Show the minimum needed for the next
decision; reveal depth on demand. Working memory holds 4-7 chunks — screens open calm (5-7
summary elements) and expand on click/hover. This is the single most-cited premium pattern of
2026 and the backbone of IdeaGate's calm feel. (EP-6.)

**Continuity.** Moving between Desk, Studio, and Office feels like moving rooms in one
building. Same shell, spacing, motion, type, iconography, empty-state voice, loading behavior.
The user is never unsure they're still inside IdeaGate. (EP-7, CT-5.)

**Confidence-building rhythm.** The product feels deliberate, never frantic. Transitions are
smooth and purposeful. Nothing flashes or jumps. Calm pacing signals a system in control,
which signals a system to trust.

---

## 5. MOTION VOCABULARY (motion = state, always)

No motion without meaning (EP-2). Every animation type maps to a specific real system event.
This is both the premium-feel rule and the performance rule (idle screens do not animate).

| Motion | Meaning (system event) | Where | Technique |
|---|---|---|---|
| Node pulse (soft opacity breathe) | An agent is actively working | Orchestration graph, node chain | CSS keyframe, only while status=active |
| Travelling edge dot | Context transferring between agents | Orchestration graph edges | CSS offset-path along SVG path, only during active transfer |
| Stage fill sweep | A stage completed | Lifecycle node chain | Framer Motion layout transition on status change |
| Counter tick | Real tokens / cost accruing | Status bar, execution summary | Number transition, only during active run |
| Panel slide-in | New real content arrived (split view, insight panel) | Studio, Desk | Framer Motion AnimatePresence, one direction |
| Card hover lift (2px + shadow) | Element is interactive | Artifact cards, nav items | CSS transform on hover |
| Log line append (fade+slide 1 line) | A real event occurred | Live log stream | CSS, only on new SSE event |

**Motion constants (from tokens):** fast 150ms (hover, micro), normal 300ms (panel, card),
slow 500ms (stage transitions, entrance). Easing: `cubic-bezier(0.4, 0, 0.2, 1)` (standard
ease-in-out) everywhere for consistency. Nothing bounces. Nothing overshoots. Deliberate, not
playful.

**Idle rule:** When no run is active, the product is visually still except for interactive
hover states. Stillness at rest is part of the calm identity and saves animation frames.

---

## 6. COLOR SYSTEM

Dark-first (the 2026 default for developer/technical tools) with a single green accent. One
accent, used with discipline — no second accent is permitted anywhere.

```css
/* SURFACES (dark-first) */
--surface-base:     #020c06;   /* app background — near-black green-tinted */
--surface-raised:   #06140c;   /* cards, panels, nav rail */
--surface-overlay:  #0a1c11;   /* hover, selected, elevated */
--surface-sunken:   #010704;   /* wells, code blocks, log stream bg */

/* BORDERS (green-tinted, low opacity for calm) */
--border-subtle:    rgba(74,222,128,0.08);
--border-default:   rgba(74,222,128,0.15);
--border-strong:    rgba(74,222,128,0.30);

/* ACCENT (the single signature color — green) */
--accent-primary:   #4ade80;   /* actions, active state, brand */
--accent-hover:     #6ee79b;   /* accent hover */
--accent-muted:     rgba(74,222,128,0.12);  /* accent backgrounds, pills */
--accent-glow:      rgba(74,222,128,0.06);  /* reserved: orchestration graph only */

/* TEXT (calm contrast hierarchy) */
--text-primary:     #f1f5f4;   /* headings, key values */
--text-secondary:   #9ca3af;   /* labels, body */
--text-tertiary:    #6b7280;   /* captions, metadata, timestamps */
--text-accent:      #4ade80;   /* links, active labels */
--text-on-accent:   #020c06;   /* text on a green fill */

/* STATUS (semantic — not decorative) */
--status-active:    #4ade80;   /* running, healthy, go */
--status-pending:   #fbbf24;   /* waiting, medium confidence */
--status-error:     #f87171;   /* failed, low confidence, no-go */
--status-idle:      #6b7280;   /* not started */
--status-info:      #60a5fa;   /* neutral information (used sparingly) */
```

**Rules:**
- One accent only. `--status-info` blue appears only for genuinely neutral info, never as a
  second brand color.
- Confidence maps to status color consistently everywhere: high=green, medium=amber, low=red.
  A user learns the mapping once and it holds across Desk, Office, and Studio (CT-5).
- `--accent-glow` is reserved for the orchestration graph. It must not appear elsewhere.

---

## 7. TYPOGRAPHY

Two families. Inter for the interface (calm, neutral, the 2026 standard). JetBrains Mono for
data, metrics, model IDs, timestamps, and technical readouts (signals precision and
"technical" personality; already in the project).

```
--font-sans: 'Inter', system-ui, sans-serif;   /* UI, headings, body */
--font-mono: 'JetBrains Mono', monospace;       /* data, IDs, timestamps, cost, tokens */
```

**Type scale (rem, calm hierarchy — typography does the heavy lifting, not icons):**

| Token | Size | Weight | Use |
|---|---|---|---|
| --text-display | 1.75rem (28px) | 600 | Workspace title (one per screen) |
| --text-h1 | 1.375rem (22px) | 600 | Section headers |
| --text-h2 | 1.125rem (18px) | 600 | Card titles, panel headers |
| --text-body | 0.875rem (14px) | 400 | Body, descriptions |
| --text-label | 0.75rem (12px) | 500 | Labels, nav, badges |
| --text-caption | 0.6875rem (11px) | 400 | Metadata, timestamps, captions |
| --text-mono-value | 0.875rem (14px) | 500 | Metric values (JetBrains Mono) |
| --text-mono-caption | 0.6875rem (11px) | 400 | Technical metadata (JetBrains Mono) |

**Rules:** One display-size title per screen (reinforces one-question-per-screen). Numbers and
technical strings are always mono (precision cue). Line-height 1.5 for body, 1.2 for headings.
Letter-spacing slightly negative (-0.01em) on large sizes for the tight premium feel.

---

## 8. SPACING, RADIUS, ELEVATION

Generous whitespace is a functional tool, not decoration — it creates the calm the brand
depends on.

```css
/* SPACING (4px base grid) */
--space-1: 4px;   --space-2: 8px;   --space-3: 12px;  --space-4: 16px;
--space-5: 24px;  --space-6: 32px;  --space-7: 48px;  --space-8: 64px;

/* RADIUS */
--radius-sm: 6px;    /* pills, badges, small controls */
--radius-md: 10px;   /* buttons, inputs */
--radius-card: 12px; /* cards, panels */
--radius-lg: 16px;   /* large containers, modals */

/* ELEVATION (subtle — calm products avoid heavy shadows) */
--shadow-card:  0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px var(--border-subtle);
--shadow-panel: 0 4px 12px rgba(0,0,0,0.5), 0 0 0 1px var(--border-default);
--shadow-glow:  0 0 20px var(--accent-glow);  /* orchestration graph only */
```

**Density rule (from research — premium ≠ empty):** IdeaGate presents substantial information
without overwhelming. The method is hierarchy and disclosure, not removal. Comfortable default
padding (--space-4 in cards), generous section gaps (--space-6), and progressive disclosure
for depth. Dense where the user is analyzing (Office metrics, artifact data); calm where the
user is deciding (Desk primary view).

---

## 9. ICONOGRAPHY

One icon set: **lucide-react** (already in the project). Consistent stroke weight (1.5px),
consistent size (16px in nav and controls, 14px inline). Icons support labels; they do not
replace them in primary navigation (calm products let typography lead). No emoji in the
premium UI surfaces. No mixed icon sets.

---

## 10. COMPONENT PHILOSOPHY (the contract every component signs)

Every IdeaGate component — in Mission 14 and every future mission — must satisfy this contract.
It is what keeps the platform coherent as it grows.

**Every component is:**
reusable · composable · data-driven · resilient · accessible · responsive · extensible ·
consistent with these tokens (never hardcoded values).

**Every component must explicitly define and render all seven states.** A component is not
"done" until all seven are specified and handled. This is a per-component gate in the
Implementation Plan.

| State | Requirement |
|---|---|
| **loading** | Reassures; references the real operation where possible (EP-5, CT-4). Never a bare spinner if the real step can be named. |
| **empty** | Educates; tells the user what will appear and how to make it appear (EP-4, CT-6). Never "no data". |
| **success** | The normal populated state. Calm, scannable, one primary focus. |
| **running** | Live state during active execution. Motion = state (EP-2). Shows real progress. |
| **partial** | Some data present, some pending (e.g. run stopped mid-lifecycle). Honest about what is and isn't there (CT-1). |
| **warning** | Degraded but functional (e.g. low-confidence stage, fallback model used). Amber, clear, non-alarming. |
| **error** | Plain-language explanation + next action (CT-6). Never a raw stack trace to the user. |

**Data-driven mandate (extensibility):** components render from data structures, never
hardcoded content. The orchestration graph renders from an AGENTS array; the nav renders from
NAV_ITEMS; the status bar renders from slot data. Adding an agent, a nav item, or a status
field is a data change, not a component rewrite (Specification AD-9, AD-10, AD-3).

---

## 11. THE GLOBAL SHELL (component anatomy)

### NavRail
Purpose: permanent left navigation, product identity, predictable navigation (CT-5).
- Width 56px. Background --surface-raised. Right border --border-subtle.
- Renders from NAV_ITEMS array with two sections separated by a divider:
  - CORE (Mission 14): Desk, Studio, Office.
  - PLATFORM (reserved, empty in Mission 14): future Library, Templates, Reports, Knowledge.
- Each item: 16px lucide icon + tooltip label on hover. Active item: 3px left accent bar +
  icon --accent-primary + background --accent-muted. Inactive: --text-tertiary.
- Bottom-anchored: Settings gear.
- Motion: hover color transition 150ms. No entrance animation (calm at rest).
- States used: success (normal), running (subtle active-route indicator if a run is executing
  on that workspace).

### StatusBar
Purpose: honest, live execution metadata, always present (CT-1, CT-2).
- Height 32px. Fixed bottom. Background --surface-base. Top border --border-subtle.
- Slot-based (reserved for future context — AD-3):
  - LEFT slot: model dot (colored by cost tier) + model display name (mono) + provider.
  - CENTER slot: stage "X/14" + elapsed timer (mono). [reserved future: workspace, mode]
  - RIGHT slot: tokens (mono) + cost (mono) + live pulse dot (green animate during run).
- Empty state: "No active run" centered, metrics show "—".
- Motion: pulse dot animates only during active run; counters tick only during active run.
- Data: GlobalStore (model), RuntimeContext (stage, tokens, cost, isRunning).

### TopBar (refined — command bar only)
Purpose: run controls and model selection, cleanly separated from navigation.
- Keeps: model selector, idea input, Run, Stop, New Idea, live stage banner.
- Loses: the Desk/Studio/Office tab links (they move to NavRail).
- The freed horizontal space gives the command elements room to breathe.

---

## 12. WORKSPACE IDENTITY (memorable where read, calm where navigated)

Nav labels stay plain and scannable (Desk / Studio / Office) — calm products don't use grand
nav titles. But each workspace header carries a one-line identity statement, so the product
feels purposeful and memorable at the point of reading, without adding navigation friction.

| Workspace | Nav label | Header identity line |
|---|---|---|
| Desk | Desk | "Product Workspace — read and refine what the system produced." |
| Office | Office | "Mission Control — live multi-agent operations." |
| Studio | Studio | "Product Workshop — improve any artifact with AI." |

Future workspaces (reserved, not built) would follow the same pattern: plain nav label + a
one-line identity in the header.

---

## 13. KEY COMPONENT ANATOMY (Mission 14 new components)

Each references tokens above and must implement the seven-state contract. Full props
interfaces are specified in the Implementation Plan; this is the visual/experiential anatomy.

**LifecycleNodeChain (Desk).** Horizontal chain of 15 nodes. Node = 28px circle + stage
number, stage name (≤8 chars) below, agent badge below that, duration right of node when
complete. Confidence dot maps to status color. Connectors: --border-subtle (pending) →
--accent-primary (complete). Click navigates to artifact. Empty state: 15 pending nodes +
"Enter an idea and press Run to execute the 14-stage pipeline." Running: active node pulses,
completed nodes fill via Framer Motion sweep. Reasoning surfaced on node hover (EP-8/CT-3).

**ArtifactCard (Desk).** Card in the left rail. Stage-number pill (--accent-muted) + stage
name; word count + confidence dot; "by [Agent]" in --text-tertiary. Active: 3px left accent +
--surface-overlay. Hover: 2px lift. Uses --shadow-card.

**RunInsightPanel (Desk).** Post-run summary. "Run Complete" + checkmark; 2-col metric grid
(time, model, cost, tokens, stages, confidence breakdown); per-stage coordinator reasoning
(CT-3). Collapsible. Only appears when journey.json has completedAt (CT-1 — never faked).

**OrchestrationGraph (Office — the hero, the one place energy is earned).** SVG. Coordinator
hub center; agent nodes from AGENTS array (six today) in hex arrangement. Edges: bezier paths,
--border-subtle idle → --accent-primary active. Travelling dot on active context transfer.
Active node: --status-active fill + --shadow-glow (the only glow in the product). Empty state:
static nodes + "Waiting for a lifecycle run." Data from the live SSE stream.

**ExecutionSummary (Office).** 2-col metric cards. Label (--text-secondary 11px) + value
(--text-primary 20px mono). All values real (EP-3). Live during run, static after.

**LiveLogStream (Office).** Scrolling real-event log. Timestamp (mono, --text-tertiary) +
agent pill + message. Surfaces coordinator decisions (CT-3). Auto-scroll unless user scrolled
up. Empty: "No events yet. Start a run to see agent activity." Background --surface-sunken.

**OfficeTabSwitcher (Office).** Two tabs: Analytics (default), Agent Activity. Active: accent
text + bottom border. Local state only — no route change. Pixel-art view toggles via CSS
visibility so Phaser initializes once (Specification R-6).

**VersionTimeline (Studio).** Vertical version list (v1, v2…) with relative timestamps + active
dot. Click loads that version. Reads existing versioned files (CT-1).

**ImprovementMetrics (Studio).** Post-improve deltas: word delta, token count, frameworks
added. All from the real improve response (EP-3).

---

## 14. COMMAND PALETTE (Cmd+K) — scope note

Research finds Cmd+K is now a *baseline expectation* for any 10+ feature product in 2026 and a
strong senior-product signal in a live demo. It fits Phase 1 (Global Shell) as a single new
component wired to navigation + run actions.

**Status: pending owner decision (raised in planning).** If approved for Mission 14, it is
specified here and built in Phase 1: overlay triggered by Cmd/Ctrl+K, fuzzy list of actions
(navigate to Desk/Studio/Office, Run, Stop, New Idea, open Settings, switch model), keyboard
driven, dark overlay using --surface-raised + --border-strong. If deferred, it becomes an
early Mission 15 item and this section is the ready-made spec. No other design decision depends
on the outcome.

---

## 15. ACCESSIBILITY (non-negotiable, all components)

- Contrast: all text meets WCAG AA against its background. --text-secondary on --surface-base
  and all status colors verified.
- Keyboard: every interactive element reachable and operable by keyboard; visible focus ring
  (--border-strong). Command palette (if built) is fully keyboard-driven.
- Motion: respect `prefers-reduced-motion` — all EP-2 motion has a reduced/none fallback.
- Semantics: nav is a `<nav>`, status bar is a landmark, buttons are buttons, icons that
  convey meaning have aria-labels.

---

## 17. PLATFORM EVOLUTION & THE NAVIGATION PRINCIPLE

**The governing navigation principle:**

> **The shell is permanent; the workspace changes.**

The nav rail, status bar, command palette, type system, and colour are constant on every
screen and in every future mission. Only the content area (the workspace) changes. This one
rule is what keeps IdeaGate coherent as it grows from three workspaces to many — a user who
learns the shell once never has to relearn navigation, and every new capability plugs into a
familiar frame (EP-7, CT-5, Specification AD-1/AD-2).

**Platform Evolution Philosophy.**
Mission 14 builds a Visual Operating System, not three redesigned pages. Its job is to create
*extension points*, not features. Every architectural decision reserves room for future growth
without requiring a rewrite:
- New workspaces (Library, Templates, Reports, Knowledge, Portfolio) → NAV_ITEMS platform
  section (already reserved).
- New lifecycle modes (discovery mode, prioritization mode, case-study mode) → new content in
  the permanent shell.
- Collaboration, plugins, presentations, templates, public APIs, enterprise capabilities →
  additive surfaces on the same shell, the same tokens, the same component contract.
None of these are built in Mission 14. All of them are made cheap for later by building the
shell, the data-driven components, the token system, and the seven-state contract now.

**Future navigation flow (documented, NOT built in Mission 14).**
This is the target journey so future missions (17 auth, 19 deploy) have a clear direction and
today's shell does not paint tomorrow into a corner (Specification AD-12):

```
Landing (public)
   ↓
Authentication (Google OAuth — Mission 17)
   ↓
Workspace Selection (personal workspace — Mission 17)
   ↓
Project Dashboard (choose/create a project)
   ↓
IdeaGate Platform Shell (permanent)
   ↓
Desk / Office / Studio (+ future workspaces)
```

Mission 14 renders everything at the current routes with no outer boundary. The shell is
structured so this outer flow can nest above it later without rewriting the shell.

---

## 18. PRODUCT EXPERIENCE PRINCIPLES (behavioral capstone)

A single quotable summary of how IdeaGate should *behave*, consolidating the Experience
Principles (Specification EP-1..EP-8) and Confidence & Trust rules (§3) into one reference.
This does not replace those sources; it is the pocket version.

1. **Reduce cognitive load.** Progressive disclosure by default; one primary focus per screen.
2. **Make feedback visible.** The user always sees what the system is doing and what it did.
3. **One primary question per screen.** Each workspace answers one PM question, invites one
   primary action.
4. **Explain long-running tasks.** Lifecycle runs show real progress — stage, agent, tokens,
   time — never an opaque spinner.
5. **Keep actions reversible.** State-changing actions are clear and, where possible,
   confirmable or reversible. The user never fears clicking.
6. **Make metrics actionable.** Every number is real and tied to a decision or insight —
   never vanity data.
7. **Build confidence through honesty.** Truthful state, transparent execution, visible
   reasoning. Trust is earned by showing the work, not by polishing the surface.

---

## 19. PLATFORM INVARIANTS (permanent — never change without an ADR)

A small set of rules that hold across every mission, every workspace, and every future
capability. They are the constitution of the platform. Any change requires a new Architecture
Decision Record that explicitly supersedes the invariant.

1. **The shell is permanent; the workspace changes.** Nav rail, status bar, command palette,
   tokens, and type are constant everywhere. Only the content area changes.
2. **Components are driven by configuration and data, never hardcoded assumptions.** Nav from
   NAV_ITEMS, graph from AGENTS, status from slots, lifecycle from a stage array.
3. **Lifecycle rendering is always data-driven, never fixed-length.** The node chain and
   orchestration graph render from the stage array, so future subset modes just work.
4. **Real execution is always preferred over mocked behaviour.** Every value traces to a real
   source. Mocks live only in isolated dev harnesses, never shipped.
5. **Motion communicates meaningful system state.** No decorative animation.
6. **Protected architectural boundaries are respected.** Protected files change only under an
   explicit, scoped, approved mission with the exception protocol.
7. **New capabilities plug into extension points; they do not require redesign.** Every future
   feature is additive to a reserved seam.
8. **Content and metadata never mix; nothing is duplicated.** (Shared with the Workspace
   Operating System — prose in files, state in JSON, references not copies.)
9. **Zero-cost, local-first by default.** The only spend is the custom domain and pay-per-token
   model usage. No architecture decision introduces per-seat cost or lock-in without an ADR.

---

## 16. WHAT THIS DESIGN SYSTEM DELIBERATELY DOES NOT DO

- It does not introduce a second accent color, WebGL, shaders, or bento-everywhere layouts
  (commodity/dated per research; against the calm identity).
- It does not add "AI-powered" badges or announce the AI — the sophistication is shown through
  execution, not labels (2026 maturity signal from research).
- It does not build future workspaces, uploads, comparison, or collaboration — only reserves
  their patterns (Specification Section 6, AD-9..AD-12).
- It does not decorate. Every visual and every motion earns its place by serving structure,
  transparency, or premium calm (the Brand Promise).

---

*Mission 14 Design System v1.0 | July 2026*
*Next document: IDEAGATE-MISSION-14-IMPLEMENTATION-PLAN.md (after this is approved)*
*Grounded in independent 2026 premium AI-native SaaS research; applied only where it*
*strengthens IdeaGate's own identity.*
