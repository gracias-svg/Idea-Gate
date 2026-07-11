# IDEAGATE DESIGN BLUEPRINT

# The Canonical Design & Experience DNA

# Version 1.2 | July 2026 | Living Specification

This document is the single source of truth for how IdeaGate looks, feels, moves, and behaves — across every current and future workspace. It governs the whole product, not one screen. Office is the flagship implementation of this DNA, not its definition.

Every future mission traces back to this Blueprint. Product grows through deliberate evolution, never isolated redesigns. This is a living specification: it evolves alongside IdeaGate while preserving backwards compatibility and design continuity.

**Authority:** Governs visual language, interaction patterns, information hierarchy, motion, spacing, typography, and component architecture. It does NOT govern business logic, the orchestration engine, coordinator, journey state, or lifecycle model — those remain independent and are changed only through their own scoped missions.

---

## PART 0 — HOW TO READ THIS DOCUMENT

This Blueprint is organized so that permanent things come first and change least:

- **Part I — Brand Identity System** (permanent): who IdeaGate is visually.  
- **Part II — Experience Philosophy** (permanent): how IdeaGate behaves.  
- **Part III — Design Tokens** (stable): the concrete values — color, type, space, motion.  
- **Part IV — Component System** (stable): the seven-state contract and primitives.  
- **Part V — Orchestration & Data Visualization** (stable): the graph, timeline, and charts.  
- **Part VI — Workspace Choreography** (evolving): how each surface expresses the DNA.  
- **Part VII — Technology & Adapter Architecture** (evolving): build-vs-adopt decisions.  
- **Part VIII — Governance** (living): premium definition, review, DoD, debt, migration.

When two sections seem to conflict, the earlier part wins — identity outranks convenience.

---

# PART I — BRAND IDENTITY SYSTEM (permanent)

## 1\. The Core Decision (settled)

IdeaGate's identity **evolves its terminal-emerald heritage into a premium AI-native Product Operating System**. It does not defect to a generic violet SaaS aesthetic.

The reasoning, stated once so it is never re-litigated: the green CLI DNA is one of the few things that already makes IdeaGate recognizable as *itself*. Violet is the default of every AI dashboard in 2026 (the reference catalog proves it — nearly every competitor screenshot is purple-on-black). Choosing violet would make IdeaGate look like everyone else. Choosing to *elevate* emerald makes IdeaGate look like no one else while borrowing the craft — spacing, motion, hierarchy, depth — of the best SaaS products.

**One product → one design system → many specialized workspaces.**

## 2\. Brand Personality

IdeaGate is: **Structured. Transparent. Alive. Trustworthy. Technical-but-calm.**

Five adjectives, in tension deliberately. "Structured" and "alive" pull against each other; that tension is the brand. IdeaGate is disciplined like a terminal and warm like a teammate. It is the feeling of watching a senior product team think — rigorous, unhurried, legible.

What IdeaGate is **not**: playful, gimmicky, neon, cluttered, corporate-sterile, or decoration-forward. If a visual choice reads as any of those, it is wrong.

## 3\. Emotional Vocabulary

The words every surface should evoke, and their opposites to avoid:

| Evoke | Avoid |
| :---- | :---- |
| Confidence | Anxiety, uncertainty |
| Clarity | Noise, clutter |
| Intelligence at work | Decoration, theater |
| Trust | Opacity, black-box |
| Calm focus | Overwhelm, urgency-for-its-own-sake |
| Craft | Templated, default, cheap |

## 4\. The Evolved Experience Promise

The original promise — *"Calm everywhere. Alive where the intelligence is working."* — still holds at its core but is evolved to reflect that IdeaGate now reasons, validates, and collaborates, not only executes:

**"Calm everywhere. Intelligent where it matters. Alive where meaningful work is happening."**

"Alive" is expanded beyond animation to mean *visible thinking*: reasoning surfaced, orchestration shown, decisions explained, progress made legible. The surrounding interface stays calm, focused, and free of visual noise. Motion represents genuine system activity — never decoration.

## 5\. Color Philosophy

**Emerald is the protagonist. Everything else is supporting cast.**

Principles:

1. **One protagonist accent.** A single emerald that means "alive / active / the system is working." It is spent sparingly so it always reads as meaningful. If emerald is everywhere, it means nothing.  
2. **Near-black canvas with green undertone.** Not pure black (`#000`), not slate-gray. A deep, slightly green-shifted charcoal that makes emerald glow and feels like a calm, lit-from-within terminal.  
3. **Semantic colors are reserved for meaning, never mood.** Amber \= at-risk / caution. Red \= failed / blocked. Blue \= informational / neutral-secondary. These appear only when they carry that specific meaning. A stage is not amber because amber looks nice; it is amber because its confidence is low.  
4. **Restrained gradients and lighting.** Gradients are used for depth and to make the "alive" surfaces glow — never as flat decorative fills. Think: a subtle radial glow behind an active coordinator node, not a purple-to-pink hero banner.  
5. **Secondary accents are permitted only for data encoding.** When a chart needs to distinguish six agents, the agent colors are a supporting palette — used inside visualizations, never promoted to brand chrome.

The concrete values are in Part III. The philosophy is: **green means alive, dark means calm, semantic color means meaning, and nothing is colored for decoration.**

## 6\. Typography Philosophy

IdeaGate speaks in two voices, and the contrast between them is part of the identity:

1. **Monospace for the machine.** JetBrains Mono (or equivalent) for anything that represents the system thinking: coordinator logs, execution timelines, agent activity, stage labels, metrics, technical surfaces, code, prompts. This is the CLI heritage, preserved where it reinforces engineering credibility.  
2. **A refined sans for the human.** A premium, highly-legible sans (Inter, or similar) for reading surfaces: artifact prose, document bodies, longer explanatory copy, onboarding. This is where IdeaGate is warm and readable rather than technical.

The rule: **mono where the system speaks, sans where it speaks to you.** Weight contrast does the hierarchy work — huge bold numbers against tiny muted mono labels (the "so-what" pattern from the best references: `$124,500` in enormous weight, `↑12.5% driven by paid traffic` in tiny muted type beside it).

## 7\. Lighting & Depth Philosophy

IdeaGate is lit from within, like a terminal in a dark room.

- **Elevation through light, not heavy shadow.** Raised surfaces are slightly lighter than the canvas and may carry a faint inner or edge glow, rather than a drop-shadow that implies a physical card floating in space. The metaphor is *luminance*, not *paper*.  
- **The active element glows.** The one place real work is happening gets a soft emerald radial glow. This is the single most important lighting rule — it is how "alive where the intelligence is working" is expressed. Everything else is calm and unlit.  
- **Depth is subtle and purposeful.** Layers exist to separate concerns (canvas → surface → raised → overlay), not to show off. Three or four elevation levels, no more.

## 8\. Motion Philosophy

**Motion \= state. Always.** (This is inherited verbatim from the original Design Philosophy and is non-negotiable.)

Every animation maps to a real system event. If a motion does not communicate a system fact, it is removed. The active-agent pulse means an agent is working. The flowing edge means data is moving between agents. The stage-node fill means a stage completed. Transitions between views are quick and calm; they orient, they don't perform.

Detailed motion vocabulary and timing budgets are in Part III §14 and governed in Part VIII.

## 9\. Visual Metaphors & Iconography

- **The primary metaphor is the orchestration graph** — a coordinator at the center, specialists around it, work flowing along edges. This is IdeaGate's signature image and its most recognizable asset. It appears (in full or abbreviated form) as the identity anchor of the product.  
- **The secondary metaphor is the lifecycle chain** — 15 nodes, left to right, gated. This represents rigor and enforcement.  
- **Iconography:** a single icon set (lucide-react), one weight, one size scale. No mixing sets, ever. Icons are functional, not decorative — they label and clarify.  
- **Illustration:** IdeaGate does not use spot illustrations, mascots, or 3D blobs. Its "illustration" is its own live data — the real graph, the real timeline, the real logs. This is a deliberate anti-decoration stance: the product's beauty is its genuine intelligence made visible, not artwork layered on top.

## 10\. How Each Workspace Expresses One Identity

Same DNA, different emphasis. Each workspace answers one question (inherited from the original Design Philosophy) and expresses the shared identity through a different balance of the two typographic voices and the calm/alive contrast:

| Workspace | Question it answers | Identity emphasis |
| :---- | :---- | :---- |
| **Desk** | "What did the system produce and how good is it?" | Sans-forward (reading), calm, artifact-centric |
| **Studio** | "How do I improve this artifact?" | Balanced; the diff and improvement are alive |
| **Office** | "How did agents produce it?" | Mono-forward, the flagship "alive" surface |
| **Blueprint** *(future)* | "How is this project structured?" | Structural, map-like, calm |

The shell (nav rail, status bar, command palette, type system, color) is constant on every screen. Only the content area changes. This one rule keeps IdeaGate coherent as it grows.

---

# PART II — EXPERIENCE PHILOSOPHY (permanent)

How IdeaGate behaves, not just how it looks. Every future UI decision must be traceable to one of these principles.

## 11\. Attention Management

The user has one focus at a time. The interface protects it.

- **One question per screen** (inherited). Elements not serving the screen's core question are cut or demoted.  
- **One glowing thing at a time.** The active/alive surface is singular. Two things glowing competes for attention and breaks the "alive where it matters" promise.  
- **Calm is the default state.** 90% of the interface, 90% of the time, is calm and still. Energy is reserved for the moment intelligence is genuinely working.

## 12\. Information Hierarchy

- **Weight contrast carries hierarchy**, not color. The most important number on a panel is the largest and boldest; its context is tiny and muted beside it.  
- **Progressive disclosure** (inherited). Show the minimum needed for the next decision. Reveal depth on interaction. Working memory holds \~7 items — screens open calm and expand.  
- **Every number earns a "so what."** A metric without context is noise. `15/15 stages` is data; `15/15 stages · all high confidence` is information.

## 13\. Reasoning Visibility (Trust through Transparency)

This is IdeaGate's core trust mechanism and its biggest differentiator.

- **Show the coordinator's reasoning, always available.** The RunInsightPanel surfacing why a stage got its decision is more credible than any visual polish. (Perplexity's 2026 trust advantage came from inline citations — showing its work — not from its design. IdeaGate's equivalent is surfaced coordinator reasoning and visible agent execution.)  
- **Never a black box.** Every decision (go / iterate / kill / reshape) is explainable on demand. Every artifact traces to the agents that produced it.  
- **Confidence is always visible and honest.** Low confidence is shown as low confidence, not hidden. Honesty over impressiveness (inherited Product Philosophy).

## 14\. Feedback & System State

- **Every loading state reassures** (inherited). Reference the real operation ("Running Stage 7: PRD"), never a bare spinner when the current step can be named.  
- **Every empty state educates** (inherited). Never "no data." Always: what will appear here and how to make it appear.  
- **Every error is plain language \+ a next action** (inherited). Never a raw stack trace.  
- **Motion confirms state changes.** When a stage completes, its node fills. When an artifact goes stale, it visibly dims. The user never wonders whether something happened.

## 15\. Human-in-the-Loop & Override

IdeaGate is owner-supervised, never autonomous-and-silent (inherited from the Coordinator trust constraint and CT principles).

- **The human can always see what the system is about to do**, and intervene before it does.  
- **Continuous / background work is owner-triggered and reviewable**, never autonomous.  
- **Override is a first-class affordance**, not buried. Stop, redirect, accept, reject — these are always reachable.  
- **The system explains, the human decides.** IdeaGate surfaces reasoning and confidence; it does not make irreversible decisions on the user's behalf.

## 16\. Continuity

- **Returning feels like never having left** (inherited). State is restored, not cleared. Resets are explicit user actions.  
- **The shell is permanent; the workspace changes** (inherited). This is what keeps IdeaGate coherent as capabilities multiply.

---

# PART III — DESIGN TOKENS (stable)

These are the concrete, implementable values. They live in `globals.css` as CSS custom properties. Component code references tokens, never raw hex. Changing a token changes the product everywhere — that is the point.

**Implementation note:** These token *names* are canonical. Some earlier Mission 14 work shipped with provisional names (`--surface-raised`, `--accent-primary`, etc.). Part VIII's Migration Strategy governs reconciling those to these canonical names as Tier-1 work.

## 17\. Color Tokens

### Canvas & Surfaces (the calm dark, green-undertoned)

\--ig-canvas            \#05090B   /\* deepest background, the "terminal in a dark room" \*/

\--ig-surface           \#0A1013   /\* default panel surface, one step up from canvas \*/

\--ig-surface-raised    \#0F1A16   /\* raised cards, active panels — faint green shift \*/

\--ig-surface-overlay   \#12211B   /\* modals, command palette, popovers \*/

\--ig-border-subtle     \#17241E   /\* hairline separators, low emphasis \*/

\--ig-border-default    \#1F3329   /\* standard borders on cards and inputs \*/

\--ig-border-strong     \#2C4A3A   /\* emphasis borders, active/selected states \*/

### Emerald — the protagonist accent (spent sparingly)

\--ig-emerald           \#34D399   /\* the primary "alive / active" accent \*/

\--ig-emerald-bright    \#6EE7B7   /\* highlights, active glow cores \*/

\--ig-emerald-muted     \#34D39922 /\* tints, active backgrounds, subtle fills \*/

\--ig-emerald-glow      \#34D39955 /\* the radial glow behind active elements \*/

\--ig-emerald-dim       \#1F7A5A   /\* pressed / lower-energy emerald \*/

### Text (mono \+ sans share these)

\--ig-text-primary      \#E8F0EC   /\* primary reading text, high legibility on dark \*/

\--ig-text-secondary    \#94A3B8   /\* labels, captions, secondary info \*/

\--ig-text-tertiary     \#5B6B63   /\* de-emphasized, placeholder, disabled \*/

\--ig-text-on-emerald   \#05090B   /\* text sitting on an emerald fill \*/

### Semantic (meaning only, never decoration)

\--ig-status-success    \#34D399   /\* \== emerald: done / high confidence / go \*/

\--ig-status-caution    \#FBBF24   /\* at-risk / low confidence / iterate \*/

\--ig-status-danger     \#F87171   /\* failed / blocked / kill \*/

\--ig-status-info       \#60A5FA   /\* informational / neutral secondary \*/

\--ig-status-stale      \#64748B   /\* superseded / stale artifacts (muted, not alarming) \*/

### Agent Palette (data-encoding only — used INSIDE visualizations, never as chrome)

\--ig-agent-co          \#34D399   /\* Coordinator — emerald, the hub \*/

\--ig-agent-ps          \#818CF8   /\* Product Strategy \*/

\--ig-agent-re          \#38BDF8   /\* Research \*/

\--ig-agent-ux          \#F472B6   /\* UX Design \*/

\--ig-agent-ar          \#FB923C   /\* Architect \*/

\--ig-agent-qa          \#C084FC   /\* Quality Assurance \*/

These six are the only place non-emerald hues appear as identity. They exist to let a viewer distinguish agents in the orchestration graph. They are never promoted to buttons, nav, or brand chrome.

## 18\. Typography Tokens

### Families

\--ig-font-mono   'JetBrains Mono', 'Fira Code', ui-monospace, monospace

\--ig-font-sans   'Inter', \-apple-system, system-ui, sans-serif

### Scale (the "so-what" pattern lives here — big value, tiny label)

\--ig-text-hero      48px / 700 / \-0.02em   /\* the one big number on a panel \*/

\--ig-text-display   32px / 700 / \-0.01em   /\* section-defining metrics \*/

\--ig-text-title     20px / 600             /\* panel and card titles \*/

\--ig-text-body      15px / 400 / 1.6       /\* reading text (sans) \*/

\--ig-text-label     12px / 600 / 0.06em    /\* uppercase mono labels (tracked) \*/

\--ig-text-caption   11px / 500             /\* the tiny "so-what" context \*/

\--ig-text-code      13px / 400             /\* logs, prompts, technical (mono) \*/

Rule: labels and captions are mono \+ uppercase \+ letter-spaced (the CLI voice). Body and titles on reading surfaces are sans (the human voice).

## 19\. Spacing & Layout Tokens

\--ig-space-1   4px      \--ig-space-2   8px      \--ig-space-3   12px

\--ig-space-4   16px     \--ig-space-6   24px     \--ig-space-8   32px

\--ig-space-12  48px     \--ig-space-16  64px

\--ig-radius-sm   4px    \--ig-radius-md   8px     \--ig-radius-lg   12px

\--ig-radius-xl   16px   \--ig-radius-full 999px

\--ig-rail-width       240px   /\* NavRail \*/

\--ig-statusbar-height 28px    /\* StatusBar \*/

\--ig-topbar-height    52px    /\* command bar \*/

\--ig-content-max      1440px  /\* reading-content comfortable max \*/

Generous negative space is a premium signal. When in doubt, add space, not elements.

## 20\. Elevation & Lighting Tokens

\--ig-elev-0   none                                    /\* canvas \*/

\--ig-elev-1   inset 0 0 0 1px var(--ig-border-subtle) /\* surface: light edge, no shadow \*/

\--ig-elev-2   inset 0 0 0 1px var(--ig-border-default),

              0 1px 0 0 \#ffffff08                     /\* raised: faint top highlight \*/

\--ig-elev-overlay  0 8px 40px \-8px \#00000099          /\* modals only: real depth \*/

\--ig-glow-active   0 0 24px \-4px var(--ig-emerald-glow)  /\* the "alive" glow \*/

\--ig-glow-focus    0 0 0 2px var(--ig-emerald-muted)     /\* focus ring \*/

## 21\. Motion Tokens

\--ig-ease-standard  cubic-bezier(0.4, 0.0, 0.2, 1\)    /\* most transitions \*/

\--ig-ease-out       cubic-bezier(0.0, 0.0, 0.2, 1\)    /\* entrances \*/

\--ig-ease-in        cubic-bezier(0.4, 0.0, 1, 1\)      /\* exits \*/

\--ig-dur-instant   80ms    /\* hover, tap feedback \*/

\--ig-dur-quick     160ms   /\* toggles, small state changes \*/

\--ig-dur-standard  240ms   /\* view transitions, panel reveals \*/

\--ig-dur-calm      400ms   /\* larger orientation changes \*/

\--ig-pulse-active  2000ms  /\* the active-agent breathing pulse, scale 1.0→1.04 loop \*/

\--ig-flow-edge     1500ms  /\* animated edge dash-flow when data moves \*/

Motion budget: no single transition exceeds 400ms. Pulses and flows are slow and calm (1.5–2s), never frantic. Respects `prefers-reduced-motion` (Part VIII §35).

---

# PART IV — COMPONENT SYSTEM (stable)

## 22\. The Seven-State Contract (mandatory)

Every data-driven component must explicitly handle all seven states. This is inherited from the Mission 14 component contract and is non-negotiable — it is what makes IdeaGate feel finished rather than demo-grade. A component that only handles the "happy path" is not done.

| State | Meaning | Requirement |
| :---- | :---- | :---- |
| **empty** | no data yet | Educate: what appears here \+ how to make it appear. Never "no data." |
| **loading** | fetching / computing | Reassure: name the real operation. Skeleton, not bare spinner. |
| **partial** | some data present | Render what exists; indicate what's pending. |
| **complete** | fully populated | The normal, resting rendered state. |
| **error** | failed to load/compute | Plain language \+ a next action. Never a stack trace. |
| **stale** | superseded data | Muted treatment \+ clear "stale" signal. |
| **processing** | actively updating live | The "alive" state — glow / pulse tied to real activity. |

Not every state applies to every component (a static nav has no "stale"), but every component must *consciously decide* which apply and handle them. "Not applicable" is a valid, documented choice; silent omission is not.

## 23\. Core Primitives

The shared primitives all workspaces inherit (Tier-1 in the Migration Strategy):

- **Shell:** NavRail (240px, config-driven from NAV\_ITEMS), StatusBar (slot-based), TopBar (command bar), CommandPalette (⌘K, navigation \+ run controls scope).  
- **Surfaces:** Panel, Card, RaisedCard, Overlay — differ only by elevation token.  
- **Data display:** StatCard (the big-number/tiny-label pattern), Chip (confidence/status), Badge, KeyValueRow, LogLine (mono).  
- **Inputs:** Button (primary/secondary/ghost), Input, Select, Toggle, SegmentedControl (the Analytics|Agent-Activity pattern).  
- **Feedback:** Skeleton, EmptyState, ErrorState, Toast.  
- **Navigation within content:** Tabs, Breadcrumb, NodeChain (the lifecycle).

Every primitive is config- and data-driven, never hardcoded (Platform Invariant). Nav from NAV\_ITEMS, graph from the AGENTS array, status from slots, lifecycle from a stage array.

## 24\. Component Acceptance Criteria

A component is accepted into the system only when it meets all of these. (Full checklist in Part VIII §36.)

1. Handles all applicable states of the seven-state contract, explicitly.  
2. Uses design tokens exclusively — zero hardcoded color, spacing, or type values.  
3. Is data/config-driven — no hardcoded content that should come from props or data.  
4. Respects the two-voice typography rule (mono for machine, sans for human).  
5. Has exactly one "alive" affordance at most, tied to real state.  
6. Passes accessibility baseline (§35): contrast, focus, keyboard, reduced-motion.  
7. TypeScript clean, props interface documented.  
8. Additive — wraps or extends existing logic, does not replace working behavior.

---

# PART V — ORCHESTRATION & DATA VISUALIZATION (stable)

This is the heart of IdeaGate's differentiation and where the last month's quality gap lived. The decision here is deliberate and researched.

## 25\. The Adapter Principle (architectural law)

**The visualization layer never touches the engine.** The orchestration engine, coordinator logic, journey state, and lifecycle model remain completely independent of any visualization library. A dedicated **adapter layer** translates IdeaGate's internal state (`journey.json`, decisions, agent execution) into the shape the visualization library consumes.

  Engine (protected)          Adapter (UI-owned)           View (library)

  ─────────────────           ──────────────────           ──────────────

  journey.json          →     toGraphModel()         →     @xyflow/react nodes+edges

  decisions\[\]           →     toTimelineEvents()     →     timeline component

  stages{}              →     toStatModel()          →     Recharts / StatCards

Consequences:

- The engine can evolve without any UI change.  
- The visualization library can be replaced without touching the engine (future-proofing).  
- Regression risk is contained to the adapter and the view, never the protected core.  
- `/api/journey-state` (built in Mission 14 Phase 2\) is the boundary. Adapters consume it.

## 26\. Orchestration Graph — Library Decision: **@xyflow/react (React Flow 12\)**

**Adopt `@xyflow/react`, not hand-authored SVG.** This is the single highest-leverage decision in the Blueprint and the direct fix for the quality gap.

Rationale (evaluated as requested against maintainability, Claude-Code implementation quality, stability, performance, docs, extensibility, premium UX):

- **It is React Flow.** "XYFlow" and "React Flow" are the same project — the xyflow team renamed the package from `reactflow` to `@xyflow/react` at v12. Current stable is **12.11.x**, **MIT licensed**, published within days, \~24k stars, five-person core team, actively maintained (commits July 2026). This is the mature, long-term-safe choice, not a risky newcomer.  
- **SSR-safe** — v12 explicitly added server-side rendering support for Next.js/Astro. This matters: our Next.js App Router needs a graph that renders without `window` errors. (Import the graph in a client component; v12 handles hydration cleanly.)  
- **TypeScript-native, built-in dark mode** (`colorMode` prop), only-changed-nodes re-rendering (performance), custom node/edge types (our emerald coordinator hub, agent nodes, flowing edges are all custom components we fully style with our tokens).  
- **Claude-Code implementation quality:** this is decisive. Hand-authoring premium SVG node graphs is exactly where Claude Code produced the flat, "lame" result. React Flow gives a correct, interactive, pannable/zoomable graph *structure* out of the box, so Claude Code's job becomes *styling custom nodes with our tokens* — a task it does well — instead of *inventing graph layout math* — a task it does poorly. This directly de-risks the rebuild.  
- **Extensibility for the roadmap:** custom nodes/edges, sub-flows, and controlled layouts support future parallel execution, dual pipelines, looping, and debate architectures without a rewrite. The graph model scales to N agents as a data change, not a component rewrite (honors the data-driven AGENTS invariant).

**What we build on top of it** (all custom, all token-styled):

- `CoordinatorNode` — the emerald hub, larger radius, `--ig-glow-active` when orchestrating, breathing pulse (`--ig-pulse-active`) tied to real "processing" state.  
- `AgentNode` — colored by the agent palette, state overlay (done \= filled, idle \= outlined, active \= pulsing), the DONE/ACTIVE chip.  
- `FlowEdge` — directed (arrowhead), animated dash-flow (`--ig-flow-edge`) only when data is actually moving between that pair on the current stage; dim otherwise.  
- `StageBand` — the 15-node lifecycle strip beneath the graph, confidence-colored dots, active stage labeled.

**The engine stays untouched.** A `toGraphModel(journeyState)` adapter produces the nodes and edges array. React Flow renders it. If we ever replace React Flow, we rewrite one adapter's output shape and the node components — never the engine.

## 27\. Execution Timeline — Library Decision

**Recommendation: build a custom timeline as a thin presentation layer over an adapter, using our own components — with a documented option to adopt `vis-timeline` if/when enterprise audit-replay needs exceed what custom sustains.**

Reasoning, weighed as requested:

- The execution timeline in IdeaGate is **not a generic Gantt chart.** It is a decision-flow / swimlane view where every event answers *what happened, why, and what next.* Generic Gantt/timeline libraries (react-calendar-timeline, frappe-gantt) are optimized for date-range scheduling, not reasoning-annotated execution history. Bending them to our semantics costs more than it saves and fights their styling.  
- Our timeline is **bounded and structured**: ≤15 stages, a known set of agents, discrete events. This is well within what custom SVG/flex \+ our tokens handles cleanly and premium-ly (unlike the *graph*, whose layout math is genuinely hard — hence the library there).  
- **The adapter makes this reversible.** `toTimelineEvents(journeyState)` produces a neutral event model. If future needs (execution replay, parallel-lane rendering, enterprise audit trails spanning hundreds of events, virtualized scroll) outgrow custom, we adopt `vis-timeline` (mature, MIT-family, handles large event sets and zoom) behind the *same adapter* — no engine impact.

So: **custom now, library-ready later, adapter-isolated always.** The decision optimizes for the product over several versions, not just Mission 14 — because the adapter guarantees the switch is cheap.

Future-capability check (all supported by the adapter model without rewrite): multiple lifecycle modes → different adapter mappings; parallel execution → lanes in the event model; dual pipelines → two event streams; looping → repeated stage events with iteration index; debate architectures → agent-vs-agent event pairs; replay → the event stream is already time-ordered; audit trails → the event model is the audit record.

## 28\. Data Visualization (charts) — **Recharts** (already installed)

For the ExecutionSummary and Analytics stat surfaces:

- **Recharts** is already in the project (added Mission 14 Phase 0), MIT, React-native, composable, token-styleable. It handles the run-over-time, distribution, and token-usage charts the reference catalog shows.  
- Charts follow the color philosophy: emerald for the primary series, semantic colors only where they mean something, the agent palette only when encoding agents. No rainbow charts.  
- Every chart obeys the "so-what" rule: a title, the value, and the context. A chart that doesn't answer a question is cut.

## 29\. Visualization Governance

- The graph is a **hero object**, not a widget. It gets space, depth, and the one glow.  
- **One live thing at a time** even inside a visualization — the active agent, the current stage, the moving edge. Not all agents pulsing at once.  
- Empty states for visualizations educate ("Run an idea to see the orchestration"), never show a broken or fake graph. **No mocked data ever ships** (inherited Product Philosophy).

---

# PART VI — WORKSPACE CHOREOGRAPHY (evolving)

How the shared DNA is expressed per surface. Each workspace inherits everything above and adds only its specific composition.

## 30\. The North Star Experience (four dimensions)

Rather than one screenshot, the North Star is a complete experience defined on four axes. Every workspace is measured against these:

1. **Emotional Feel:** calm, intelligent, confident, technical-but-warm, trustworthy, alive. You feel you are watching a senior product team think.  
2. **Information Architecture:** executive clarity — the most important thing is the biggest and most legible; depth is one interaction away; every number has a "so-what"; nothing is noise. (Drawn from the premium analytics references.)  
3. **Interaction & Motion:** motion is state; transitions orient not perform; the human can always see-and-intervene; override is first-class. (Drawn from the Mission-Control / thinking-process references.)  
4. **Orchestration & Intelligence:** real agents coordinating, reasoning surfaced, decisions explained, progress legible — the graph as hero. (Drawn from the AI Orchestration Monitor / Multi-Agent Workspace, the primary reference.)

The synthesis, not any single image: *a premium AI-native Product Operating System where you see intelligent work happening in real time, understand why it's happening, intervene when needed, and confidently move from idea to execution — inside a calm, cohesive, beautifully engineered interface.*

## 31\. Per-Workspace Composition

**Office (flagship — "How did agents produce it?")**

- Hero: the React Flow orchestration graph, emerald coordinator hub glowing when active.  
- Supporting: ExecutionSummary (stat cards, "so-what" metrics), LiveLogStream (mono, the CLI voice, real events), the execution timeline.  
- Secondary view preserved: pixel-art Agent Activity (Phaser), reached via SegmentedControl, hidden with `display:none` never unmounted.  
- Emphasis: mono-forward, the most "alive" surface, the identity anchor.

**Desk ("What did the system produce and how good is it?")**

- Hero: the artifact reader (sans-forward, comfortable reading measure).  
- Supporting: LifecycleNodeChain (rigor), ArtifactCard rail, RunInsightPanel (reasoning, confidence, decision, agent attribution — the trust surface).  
- Emphasis: calm, readable, artifact-centric. The one glow is the currently-processing stage.

**Studio ("How do I improve this artifact?")**

- Hero: the artifact \+ the improvement diff.  
- Supporting: VersionTimeline, ImprovementMetrics, the context envelope (`{primary, attachments[], references[]}` — the reserved seam).  
- Emphasis: balanced voices; the improvement is the alive element.

**Blueprint (future — "How is this project structured?")**

- Hero: a structural map of the project/workspace.  
- Emphasis: calm, map-like, structural. Built Tier-3 (native to this Blueprint from day one).

## 32\. Workspace Choreography Rules

- **The shell never moves.** Switching workspaces changes only the content area. Nav, status, command palette, type, and color are constant.  
- **Transitions between workspaces are calm** (`--ig-dur-standard`), a quick cross-fade or content swap — orientation, not spectacle.  
- **State is preserved across navigation** (continuity principle). Leaving Office and returning shows the same view you left.  
- **Each workspace has exactly one hero and one question.** If a second hero appears, the composition is wrong.

---

# PART VII — TECHNOLOGY & ADAPTER ARCHITECTURE (evolving)

## 33\. Technology Decisions (settled for this Blueprint)

| Concern | Decision | Status |
| :---- | :---- | :---- |
| Framework | Next.js \+ TypeScript (App Router) | Locked |
| Styling | Inline style \+ CSS custom properties (NO Tailwind — not configured) | Confirmed |
| Icons | lucide-react, single set | Locked |
| Animation | Framer Motion (installed) | Locked |
| Charts | Recharts (installed) | Locked |
| **Orchestration graph** | **@xyflow/react v12 (React Flow), MIT, SSR-safe** | **New — Blueprint** |
| Execution timeline | Custom over adapter; vis-timeline as documented future option | Blueprint |
| Engine boundary | `/api/journey-state` \+ adapter functions | Locked (Phase 2\) |

**Styling reality (carry forward):** This project does not use Tailwind. All styling is inline `style={{}}` \+ CSS variables, matching existing convention. Any code prompt or spec must respect this. Tailwind class names silently no-op here.

## 34\. Adapter Architecture (the durable seam)

src/lib/adapters/

  toGraphModel.ts       journeyState → { nodes: Node\[\], edges: Edge\[\] }  (React Flow shape)

  toTimelineEvents.ts   journeyState → TimelineEvent\[\]                    (neutral events)

  toStatModel.ts        journeyState → StatModel                         (Recharts/StatCards)

- Adapters are **pure functions**, UI-owned, fully unit-testable, and the *only* code that knows both the engine's shape and the view's shape.  
- Views (`@xyflow/react`, timeline, Recharts) know nothing about `journey.json`.  
- The engine knows nothing about any view.  
- This is what makes every future visualization change a low-risk, contained change.

---

# PART VIII — GOVERNANCE (living)

The rules that keep every future implementation true to the Blueprint.

## 35\. Accessibility Standards (baseline, non-negotiable)

- **Contrast:** text meets WCAG AA against its surface (the token pairs above are chosen to pass). Emerald-on-canvas for text is AA; emerald as accent/fill is fine at any size.  
- **Focus:** every interactive element has a visible focus ring (`--ig-glow-focus`). Keyboard navigation reaches everything the mouse can.  
- **Reduced motion:** `prefers-reduced-motion` disables pulses, edge-flows, and non-essential transitions; state is still communicated (fills, color) without animation.  
- **Semantics:** real semantic elements and ARIA where needed; the graph provides a text-equivalent (the RunInsightPanel already narrates what the graph shows).  
- **Never rely on color alone** for meaning — pair every semantic color with a label, icon, or shape (confidence chip has text, not just a hue).

## 36\. Definition of Premium (the acceptance bar)

A surface is "premium" — and therefore shippable — only when ALL are true. This is the explicit answer to "what does premium mean," so it is never subjective again:

1. **Deliberate hierarchy** — one clear focal point, weight-driven, not color-driven.  
2. **Generous, intentional space** — nothing cramped; negative space is used confidently.  
3. **The "so-what" rule** — every metric has context; no naked numbers.  
4. **One alive element** — exactly one glowing/moving thing, tied to real activity; the rest calm.  
5. **Token-pure** — zero hardcoded values; fully themeable.  
6. **Two-voice typography** — mono for machine surfaces, sans for reading, applied correctly.  
7. **Real data or honest empty state** — never mocked, never fake, never "no data."  
8. **Motion \= state** — every animation maps to a system fact.  
9. **Coherent with the shell** — inherits nav, status, palette, type unchanged.  
10. **Reasoning reachable** — the "why" is available, not hidden.

If a surface fails any one, it is not premium and not done — regardless of how much work went into it. (This is the bar the Office Analytics v1 failed: it had real data and correct architecture but failed \#1, \#3, \#4, and \#6.)

## 37\. Design Review Checklist (run before any UI commit)

- [ ] Uses design tokens exclusively (no hardcoded hex/px/type)?  
- [ ] All applicable seven-states handled explicitly?  
- [ ] Exactly one alive element, tied to real state?  
- [ ] Weight-driven hierarchy with one clear focal point?  
- [ ] Every metric has a "so-what"?  
- [ ] Correct typographic voice (mono vs sans) per surface?  
- [ ] Real data or educating empty state (never mocked)?  
- [ ] Motion maps to system fact; respects reduced-motion?  
- [ ] Inherits the shell unchanged; one hero, one question?  
- [ ] Reasoning/confidence reachable where relevant?  
- [ ] Accessibility baseline (contrast, focus, keyboard)?  
- [ ] Additive — no working behavior removed or restructured?  
- [ ] TypeScript clean?

## 38\. Definition of Done (design-inclusive)

A UI mission is done when: the Design Review Checklist passes on every touched surface; the Definition of Premium is met on every new surface; no regression to the non-negotiable baseline (full lifecycle, Studio improve/accept, model selection, New-Idea reset, Stop, stale-marking); tokens reconciled where touched; and the work is committed with the standard MES-V1 gates (TypeScript clean, owner smoke test, one-concern commits).

## 39\. Performance Budgets

- **Graph:** smooth pan/zoom at 60fps with 6 agents \+ 15 stage nodes (React Flow handles this trivially; only-changed-node rendering keeps it cheap).  
- **Polling:** journey-state polling stays at ≥4s intervals; consolidate the desk/office double-poll into one hook when convenient (documented debt, §41).  
- **Transitions:** none exceed 400ms; no jank on view switch.  
- **Bundle:** React Flow \+ Recharts \+ Framer Motion are the visualization budget; no additional heavy viz libraries without an ADR (timeline stays custom partly for this reason).  
- **Phaser:** initialized once, hidden via `display:none`, never remounted on view switch (Risk R-6, absolute).

## 40\. Design Governance (how the Blueprint changes)

- The Blueprint is a **living document**. Changes to Parts I–II (identity, philosophy) require an explicit decision recorded as an ADR — these are permanent and change rarely.  
- Changes to Parts III–V (tokens, components, viz) are normal evolution, recorded in the change log below, and must preserve backwards compatibility (a token's *meaning* doesn't change even if its value is tuned).  
- Every mission references the Blueprint. Any deviation is either a Blueprint update (deliberate) or design debt (tracked, §41) — never a silent divergence.  
- **One product, one design system.** New visual or interaction paradigms are not introduced ad hoc; they are proposed as Blueprint amendments.

## 41\. Design Debt Tracking

Known gaps between current shipped state and the Blueprint, tracked openly (honest over impressive):

| ID | Debt | Tier | Notes |
| :---- | :---- | :---- | :---- |
| DD-1 | Provisional token names (`--surface-raised` etc.) not yet reconciled to `--ig-*` | 1 | Reconcile in next shell-touch mission |
| DD-2 | Office has 159 hardcoded hex values, 0 tokens | 2 | Migrate as Office receives feature work |
| DD-3 | Orchestration graph is flat custom SVG, not React Flow | 2 | Replace via adapter — highest-value design work |
| DD-4 | ExecutionSummary/StatCards lack "so-what" and weight hierarchy | 2 | Restyle to Definition of Premium |
| DD-5 | Desk/Office double-poll journey-state (unsynchronized) | 3 | Consolidate to one hook |
| DD-6 | Two typographic voices not yet formally split in code | 2 | Introduce sans for reading surfaces |

## 42\. Migration Strategy (three tiers)

How the Blueprint is adopted **incrementally, never disruptively.** Engineering stability is the highest priority; existing behavior, APIs, and data flow are preserved. Design evolution outpaces architectural disruption. Users experience continuous refinement, not periodic redesigns.

**Tier 1 — Immediate Adoption** (shared foundation; adopt now, benefits everything):

- Design tokens (canonical `--ig-*` names in globals.css)  
- Shell primitives: NavRail, StatusBar, TopBar, CommandPalette  
- Typography system (two voices), spacing, elevation, motion tokens  
- Core primitives: StatCard, Chip, Button, Skeleton, EmptyState, ErrorState

**Tier 2 — Progressive Migration** (existing workspaces; adopt as they receive feature work):

- Office (graph → React Flow; hex → tokens) — highest visible impact  
- Desk (right panel, artifact rail → premium composition)  
- Studio (version timeline, improvement metrics → premium)  
- Existing shared components restyled where it improves consistency without architectural risk  
- *Rule:* migrate a surface when you're already touching it for a feature; don't rewrite for its own sake. Functional rewrites only if already in the active mission's scope.

**Tier 3 — Future Native** (built on the Blueprint from day one):

- Blueprint workspace, new lifecycle modes, parallel/dual/looping/debate orchestration patterns, collaboration features, enterprise capabilities (audit, replay, multi-user)  
- These never inherit legacy patterns — they are born premium.

**Migration invariants:** preserve behavior, APIs, data flow, and workflows; visual-only unless an improvement is explicitly planned; every migration step increases consistency and perceived quality while minimizing regression risk; evolution over replacement, always.

---

## PART IX — CHANGE LOG

| Version | Date | Change |
| :---- | :---- | :---- |
| 1.0 | July 2026 | Initial canonical Blueprint. Identity (evolved emerald), experience philosophy, tokens, seven-state contract, React Flow decision, adapter architecture, governance, three-tier migration. |
| 1.1 | July 2026 | Added Part X (Experience Architecture) and Part XI (UI Implementation Specification). Parts I–IX unchanged. Closes the gap between "what the system is" and "what the user feels" — the Office Analytics v1 lesson: correct rendering is not the same as emotional communication. |
| 1.2 | July 2026 | Added Part XIII (Signature Experience & Density Governance). Parts I–XI unchanged. Closes six remaining gaps: visual psychology rationale, timed cognitive-load model, density budgets, per-workspace eye-path hierarchy, motion tier taxonomy, and the capped Signature Moments catalog. Companion document `IDEAGATE-DESIGN-INTELLIGENCE-REPORT.md` created separately as the point-in-time research synthesis backing these decisions — not part of the living Blueprint. |

---

# PART X — EXPERIENCE ARCHITECTURE (permanent)

Parts I–IX define what IdeaGate *is* — its identity, its rules, its tokens, its governance. This Part defines what the user *feels*, moment to moment, and *why* the system exists at all. If Part I is the actors and Part IV is the props, this is the film's direction.

## 43\. Product Operating System Philosophy (why IdeaGate exists)

This is conceptually the opening chapter of the Blueprint — read this before any color or layout decision, because everything downstream justifies itself against this paragraph.

**Traditional PM software stores documents. IdeaGate coordinates product thinking.** **Traditional AI chats. IdeaGate orchestrates a product organization.** **Traditional dashboards display data. IdeaGate visualizes intelligence.**

A document tool is a passive container — you put things in, you take things out, nothing happens in between. IdeaGate is not that. Between the idea going in and the artifact coming out, a coordinated act of reasoning happens — research is weighed, tradeoffs are debated, decisions are made and justified, work is handed off with context intact. That act is the product. The documents are its residue.

This reframes every design decision in this Blueprint:

- A chart in IdeaGate is not "displaying data" — it is **making a decision legible.**  
- A node in the orchestration graph is not "showing an agent" — it is **showing a mind at work.**  
- An empty state is not "no data yet" — it is **the organization has not been asked to think yet.**  
- The five-second test (§44) is not "does this look nice" — it is **does the user immediately sense that something intelligent is about to happen on their behalf.**

Every subsequent section in Part X operationalizes this one philosophy into feeling, flow, motion, personality, and trust.

## 44\. The Experience Narrative — The Complete Journey

The Blueprint has, until now, described the actors (Desk, Studio, Office). This section describes the story: what a real person experiences, second by second, from opening IdeaGate to completing a discovery session. Every UI decision should be traceable to a beat in this narrative.

### Act 1 — Arrival (0–5 seconds)

**What they feel:** *"This is not a chat box. Something is already here, waiting to work."*

**What they immediately understand, without reading anything:**

- This is a workspace, not a conversation — the shell (NavRail, StatusBar, the calm dark canvas) is visible before any content, communicating structure before function.  
- Something *organized* lives here — the lifecycle chain or the orchestration graph is visible even at rest, dimmed and idle, like a stage before the actors arrive. This is the single most important five-second decision: **never show a blank page.** An idle, dimmed graph or chain communicates readiness. A blank page communicates absence.  
- Nothing is urgent, nothing is loud. Calm is the first impression, deliberately, because trust is built by composure, not by energy.

**What must stay hidden:** logs, tokens, model names, API details — anything that would make this feel like a developer console rather than an operating system for product thinking.

### Act 2 — Invitation (5–20 seconds)

**What they feel:** *"I can just... tell it what I'm thinking. And I can see there's a real process behind this, not a black box."*

- The idea-input field is the one obvious, singular affordance. Everything else recedes.  
- The lifecycle chain (dimmed, at rest) quietly communicates *rigor is waiting* — 15 stages, visible even before a single word is typed. This is trust-building through structure: the user senses discipline before they've committed anything.  
- Model selection is present but not demanding — a capable default, changeable, never blocking the first action.

### Act 3 — Ignition (the moment "Run" is pressed)

**What they feel:** *"It's alive now."*

This is the single most important transition in the entire product, and it must be unmistakable. The system flips from *dimmed and waiting* to *lit and working* in one clear motion:

- The idle graph's first node (Coordinator) receives the emerald glow (`--ig-glow-active`) and begins its breathing pulse. This is the birth of "alive" — it should feel like a light turning on inside something that was already there, not like new content appearing.  
- The StatusBar shifts from "Ready" to naming the real operation — "Running Stage 0: Idea Intake" — never a bare spinner (Part II §14).  
- Nothing else changes yet. One thing lighting up, everything else still calm, is the clearest possible signal of *where the intelligence is working right now.*

### Act 4 — Escalating Trust (the first 60 seconds of a run)

**What they feel, in order:** *curiosity → confirmation → confidence.*

Trust is not asserted, it is *earned through visible evidence*, on this schedule:

1. **First 10s — Curiosity.** The Coordinator glows; an edge begins its flow-animation toward the first specialist agent, which lights up in turn. The user watches the graph *do something they didn't have to orchestrate themselves.*  
2. **20–40s — Confirmation.** The first stage completes. Its node in the lifecycle chain fills (from dimmed to solid). An artifact becomes selectable on Desk. The user's first real evidence: *this isn't theater, it produced something.*  
3. **40–60s — Confidence.** The RunInsightPanel becomes populated with real reasoning for that first stage — decision, confidence, the *why*. The user reads an actual justification written by the system about its own choice. This is the single highest-trust moment in the first minute: **the system explaining itself, unprompted, without being asked.**

After this point, the user's mental model has shifted from "I am waiting for an AI to finish a task" to "I am watching an organization work, and I can check its thinking whenever I want." That shift is the entire point of the product.

### Act 5 — Sustained Work (minutes 2–20, the bulk of a run)

**What they feel:** *calm confidence, not vigilance.*

This is the longest phase and the one most at risk of becoming boring, anxious, or noisy if mishandled. The rule: **the interface should require zero attention to trust, and reward attention with depth when given.**

- At rest (not being watched): the graph continues its quiet choreography — one agent active at a time, edges flowing only where work is actually moving, the stage band advancing. Ambient, not demanding.  
- When attention returns (the user glances back after minutes away): the current state should be instantly legible in under two seconds — which stage, which agent, is it healthy. This is the Five Questions from your original vision (§52), always answerable at a glance.  
- If something goes *right* (a stage completes cleanly): a brief, quiet confirmation — the node fills, the glow moves to the next node. No celebration, no toast spam. Confidence is quiet.  
- If something goes *wrong* (low confidence, a retry, a stall): the interface becomes *slightly* more present — the affected node shifts to the caution/danger semantic color, but does not alarm. IdeaGate never panics; it informs.

### Act 6 — Arrival at Meaning (session completion)

**What they feel:** *"I have something real. I understand how it was made. I trust it."*

- The lifecycle chain is fully solid, emerald, at rest — the *same visual object* that opened the session, now complete. This bookend (idle-and-waiting → fully-realized) is deliberate: it makes the whole session feel like a single, coherent act rather than a sequence of screens.  
- The user is naturally drawn to Desk to *read* what was produced — the shift from watching (Office) to consuming (Desk) is the natural next beat, and the shell being unchanged means this transition costs nothing cognitively.  
- Every artifact still carries its reasoning one click away. The trust built in Act 4 doesn't expire — it's retrievable forever via RunInsightPanel.

### The Attention Curve (visualized as a rule, not a chart)

Attention Required

     high │        ╭╮

          │       ╱  ╲

          │      ╱    ╲\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_╮

          │     ╱                          ╲

      low │\_\_\_\_╱                            ╲\_\_\_

          └──────────────────────────────────────→ time

           arrival  ignition   sustained work    completion

                    (spike,    (flat & calm,      (brief

                     then      rewards attention   resolution)

                     settles)  when given)

The only spike in required attention is the Ignition moment — the "it's alive" flip. Every other phase should be low-attention-required, high-attention-rewarding. This is the operational definition of "reduce cognitive load, not increase it" (Part II §12).

## 45\. The Trust Escalation Model

A formalization of Act 4, generalized to any moment in the product, not just session start. Trust in IdeaGate is built through four escalating evidence types, and the interface should always make the *next* level of evidence one interaction away:

| Level | Evidence type | Where it lives |
| :---- | :---- | :---- |
| 0 | **Structure** — the system is organized (chain, graph, shell visible) | Always present, ambient |
| 1 | **Activity** — something is visibly happening | The glow, the pulse, the flow |
| 2 | **Output** — something was actually produced | Artifact appears, node fills |
| 3 | **Reasoning** — the system explains why | RunInsightPanel, one click away |
| 4 | **Confidence** — the system is honest about its certainty | Confidence chip, always visible, never hidden when low |

No level should ever be skipped or faked. Showing Level 1 (activity) without ever delivering Level 2 (output) is theater. Showing Level 2 without Level 3 (reasoning) available is a black box — exactly what IdeaGate is not. Level 4 (honest confidence, including *low* confidence) is what separates trustworthy software from marketing.

## 46\. Information Architecture — The Complete Hierarchy

The requested depth-hierarchy, formalized as the master reference for the entire application. Every layer has exactly one responsibility. Every interaction moves the user exactly one layer deeper. Nothing skips a layer (a card never opens straight to source data without passing through inspection).

IdeaGate                    "I am in a Product Operating System"

  │

  ↓ Global Shell             "Here is where I am, and how I move" — NavRail, StatusBar,

  │                          CommandPalette, TopBar. Constant. Never re-learned.

  ↓ Workspace                "What question does this screen answer?" — Desk / Studio /

  │                          Office / Blueprint. One hero, one question, per §31.

  ↓ Primary Panel            "What is the main thing I'm looking at?" — the artifact reader,

  │                          the orchestration graph, the improvement diff. The hero object.

  ↓ Secondary Panel          "What supports my understanding of the primary panel?" —

  │                          RunInsightPanel, ExecutionSummary, VersionTimeline. Context,

  │                          never competing for the primary focal weight.

  ↓ Card                     "What is one discrete unit of information?" — a stat card, an

  │                          agent node, an artifact card. Self-contained, scannable.

  ↓ Widget                   "What is one piece of that unit?" — a confidence chip, a

  │                          decision icon, a stale badge. Atomic, reused everywhere.

  ↓ Interaction               "What happens when I engage?" — click, hover, expand. This is

  │                          the threshold between glancing and inspecting.

  ↓ Deep Inspection          "Show me everything about this one thing" — the full reasoning

  │                          text, the complete event log for one stage, the full diff.

  ↓ Source Data              "The raw truth underneath" — journey.json's stage object, the

                             artifact markdown file, the actual API response. Rarely

                             surfaced directly, but always traceable if the user insists.

**The one rule that makes this hierarchy work:** at every layer, the *next* layer down must be discoverable through a single, obvious interaction — never buried, never requiring knowledge the user doesn't yet have. A user should never wonder "is there more detail somewhere?" — the affordance to go deeper should be visible at the current layer, even if they don't use it.

**The one rule that protects the top of the hierarchy:** content never *skips upward*. A Widget never becomes as visually loud as a Primary Panel. This is what "nothing competes for attention" (Part II §11) means structurally — it's not just a style guideline, it's an architectural constraint on which layer any given piece of UI is allowed to visually compete within.

## 47\. Visual Storytelling — Each Workspace as a Chapter

Building on Part VI's Workspace Choreography (which defined *composition*), this section defines *narrative* — the story each workspace tells, so that moving between them feels like turning pages in one book, not opening four different apps.

**Desk — The Product Story.** *"Here is what we built, and why it's good."* Desk's narrative arc is retrospective and evaluative: an idea entered the system, and here is the structured, reasoned output. The reading experience should feel like being handed a finished, credible document by someone who can defend every sentence — which is why RunInsightPanel exists adjacent to every artifact, not buried in a separate tab.

**Studio — The Collaboration Story.** *"Here is where you and the system think together."* Studio's narrative arc is active and dialogic: not "read what was made" but "improve what was made, with a partner." The version timeline is the story's spine — every version is a beat in an ongoing conversation between human judgment and AI capability, never a silent overwrite.

**Office — The Orchestration Story.** *"Here is the organization, thinking, in real time."* Office's narrative arc is theatrical and immediate — present-tense, live, the flagship demonstration of "alive where the intelligence is working." This is the only workspace where the story is happening *as you watch* rather than being reconstructed from a finished state.

**Blueprint (future) — The Systems Story.** *"Here is how everything connects."* Blueprint's narrative arc is structural and architectural — zoomed out, relational, answering "how does this project fit together" rather than "what happened" or "what's happening."

**The unifying thread across all four:** every workspace is telling a chapter of the *same* underlying event — one idea's journey through a coordinated intelligence. The shell staying constant (Part VI §32) is what makes the reader feel it's one book. The narrative distinction between workspaces is what makes each chapter worth turning to.

## 48\. Motion as Choreography, Not Timing

Part III §21 defined motion's *timing* (durations, easings). This section defines its *sequence* — the ordered, causal chain of movement that makes the graph feel like an organization working, not a set of independently animated widgets.

**The canonical choreography for one unit of work** (a single agent completing a task within a stage):

1\. Coordinator glow intensifies slightly    → "I am assigning this"

2\. Edge to the specialist begins flowing    → "work is moving to them"

3\. Specialist node transitions idle→active  → "they have received it"

   (glow appears, pulse begins)

4\. \[specialist works — pulse continues, ambient, no further motion\]

5\. Specialist's confidence indicator fills  → "they are forming a view"

6\. Edge flow reverses toward Coordinator    → "the work is coming back"

7\. Specialist node settles: active→done     → "their part is complete"

   (pulse stops, fills solid)

8\. Coordinator glow briefly intensifies     → "I am reviewing this"

9\. Stage-band node transitions              → "the stage itself has moved"

   pending→current or current→complete

10\. Artifact becomes selectable on Desk     → "the output now exists"

    (silent state change — no motion needed here, Desk isn't being watched)

11\. Glow returns to baseline everywhere     → "calm resumes until next assignment"

**Why this ordering matters:** each step is *caused by* the step before it, and each step's motion has a distinct, nameable meaning (annotated on the right). This is the difference between "isolated effects" (the original critique) and "a coherent language." A motion designer reading this sequence should be able to build it without inventing meaning; a user watching it — even without reading this document — should intuit the causal story from the choreography alone.

**The governing rule for all future motion additions:** before adding any animation, name which step in a causal chain it represents. If it doesn't represent a step — if it's just "this would look nice here" — it is decoration, and Part I §8's law ("motion \= state, always") means it does not ship.

## 49\. AI Interaction Language — Agent Personality

This does not mean six different chat voices or six different fonts. It means: **when an agent's reasoning is surfaced in RunInsightPanel, its tone of stated reasoning is consistent with its role** — one dimension of variation, applied through language choices in the reasoning text and, subtly, through how its node behaves, never through separate visual systems per agent (that would violate the one-design-system principle in Part I §1).

| Agent | Role feeling | How reasoning tends to read | Node behavior nuance |
| :---- | :---- | :---- | :---- |
| **Coordinator (CO)** | Experienced Chief of Staff | Decisive, synthesizing, references the bigger picture | The only node with the "hub" glow treatment; visually the calmest under pressure |
| **Product Strategy (PS)** | Commercially aware | Frames tradeoffs, references market/business context | Standard pulse, no variation |
| **Research (RE)** | Investigative | Evidence-first language, cites what was found | Standard pulse |
| **UX (UX)** | Empathetic | User-centered framing, references the human experience | Standard pulse |
| **Architect (AR)** | Analytical | Structural, precise, references constraints and tradeoffs | Standard pulse |
| **QA (QA)** | Skeptical but constructive | Names risks plainly, suggests concrete mitigations | The only node whose "low confidence" caution state is expected and unremarkable — QA *should* flag things |

**The constraint that keeps this from becoming gimmicky:** personality lives entirely in *word choice within the real reasoning text the system already generates* — it is never a separate "character" layer, never a costume, never anthropomorphized beyond what a real cross-functional team already sounds like. This is achievable by allowing the prompts that generate agent reasoning (already role-scoped in the coordinator's stage definitions) to retain each role's natural voice, rather than flattening every agent's output to the same neutral register. **This is a content/prompt concern, not a new visual component** — it requires no new UI, only awareness when the reasoning-generation prompts are next touched.

## 50\. Real-Time Intelligence Language — The Graph as Operating Theatre

The requested vocabulary for visualizing cognitive states, not just execution states. This extends Part V's graph specification (§26) with the *meaning layer* — what each visual state of the graph communicates, so a user understands the organization's thinking without reading a single log line.

| Cognitive state | Visual expression | Where it lives |
| :---- | :---- | :---- |
| **Reasoning** | Node pulses, RunInsightPanel populates with reasoning text | Node \+ panel |
| **Confidence** | Confidence chip color (emerald/amber/red) \+ explicit label, never color-alone | Panel, node border |
| **Uncertainty / low confidence** | Node border shifts to caution semantic; panel explains why plainly | Node \+ panel |
| **Disagreement** *(future: debate architectures)* | Two agent nodes both active toward the same stage node, edges from both, Coordinator node glows until resolved | Graph |
| **Retry / iteration** | Node briefly returns active→pulsing with a small retry indicator; stage-band node shows iteration count | Node \+ stage band |
| **Memory retrieval** *(future)* | A brief, subtle edge-flow from prior-stage nodes into the active node — showing prior context being drawn on | Graph |
| **Dependency resolution** | Edge from a completed upstream stage lights briefly when its output is consumed by the current stage | Graph (existing dependency-map data) |
| **Validation** | QA node pulse \+ explicit pass/fail state on the stage-band node | Node \+ stage band |
| **Coordinator approval** | Coordinator glow intensifies momentarily as a decision (go/iterate/kill/reshape) is set | Node |
| **Human intervention available** | Override affordance (Stop, redirect) always reachable, never requiring the graph to be paused first | Global (TopBar/StatusBar), not graph-local |
| **Escalation** *(future)* | Node shifts to danger semantic \+ a distinct (not alarming) escalation badge | Node |
| **Waiting** | Node idle-and-dimmed, no pulse — the honest default state, not styled to look busy | Node |
| **Synchronization** *(future: parallel execution)* | Multiple active nodes with edges converging on one downstream node, which stays dimmed until all converge | Graph |
| **Completion** | Node settles to solid fill, pulse stops, edge flow stops | Node |

**The governing principle:** every entry in this table is a *state*, not an *effect*. This table is the direct implementation surface for Part I §8's law — it is the enumerated list of "real system facts" that motion is allowed to represent. Any future visual idea for the graph should be checked against this table first: if the state isn't here, either it's a genuinely new cognitive state worth adding to this table (with a Blueprint amendment, Part VIII §40), or it's decoration and doesn't ship.

## 51\. Progressive Disclosure — Formalized

Part II §12 established the principle. This operationalizes it as a concrete three-tier model applied consistently everywhere in the product:

| Tier | Who sees it, when | Examples |
| :---- | :---- | :---- |
| **Glance** | Everyone, always, no interaction required | Stage-band fill state, node glow, the Five Questions (§52) |
| **Inspect** | One click/hover away, for anyone curious | RunInsightPanel reasoning, artifact word count, dependency map |
| **Excavate** | Deliberately sought, for power users or debugging | Full event log, raw journey.json values, token/cost detail, model routing |

Nothing should require Excavate-tier effort to answer a Glance-tier question. Nothing at Glance tier should show Excavate-tier detail (this is the direct fix for the "isolated effects" problem — raw logs are Excavate, not Glance, and never belonged competing for attention on the primary panel).

## 52\. The Five Questions, Operationalized

The original vision named five questions the interface must always answer. This section makes them concretely checkable against any screen:

1. **What is the system trying to achieve right now?** → Current stage name \+ label, Glance tier, always visible (StatusBar or panel header).  
2. **Is the run healthy?** → Confidence/semantic color at Glance tier — a single glance at node/chip colors answers this without reading anything.  
3. **Which intelligence is leading the work?** → The one glowing/pulsing node — visually unambiguous, never more than one candidate.  
4. **Why is the system making these decisions?** → RunInsightPanel, one click away (Inspect tier) — never buried past Inspect.  
5. **Where are we in the overall mission?** → The stage-band / lifecycle chain, Glance tier, always visible.

**Test for any new screen:** can a user answer all five within two seconds, without reading body text? If not, the screen is not done, regardless of how it looks.

---

# PART XI — UI IMPLEMENTATION SPECIFICATION (living — expected to evolve frequently)

Unlike Parts I–X, this Part is an **engineering contract** meant to change often as the product matures. It translates Part X's experience architecture into implementation-ready guidance a coding agent can build against directly. Where this Part conflicts with a future mission's specific requirements, this Part is updated — it is not permanent doctrine.

## 53\. Reference Design Language — Borrow vs. Copy (explicit boundary)

Stated once, applies to every future use of the reference PDFs or any external inspiration:

**We borrow:** hierarchy, density, rhythm, typography *treatment* (weight contrast, scale relationships), motion *principles* (easing, choreography logic), interaction patterns (hover/focus behavior, disclosure mechanics), information architecture (panel composition, the "so-what" pattern), orchestration *presentation concepts* (hub-and-spoke, live state).

**We never copy:** literal layouts, literal color values, literal typefaces-as-identity, branding elements, or any composition specific enough that a viewer would recognize *which* reference product it came from.

**The test:** if a screenshot of an IdeaGate screen, shown to someone familiar with the reference catalog, would make them say "that's clearly \[Product X\]'s dashboard, rebadged" — it has crossed from borrowing into copying, and must be reworked. If instead they'd say "that reminds me of the quality of \[Product X\], but it's clearly its own thing" — it's correct. IdeaGate must remain recognizably IdeaGate at every reference point (Part I §1's "one product" principle, restated as a concrete visual test).

## 54\. Orchestration Graph — Screen Composition Specification

Concrete composition guidance for the React Flow implementation (extends Part V §26 with layout specifics):

- **Canvas fill:** the graph occupies the full available hero space in Office — it is not a card among other cards, it is the room.  
- **Coordinator position:** center, slightly upper-third (optical center, not mathematical center — the same principle that puts a portrait subject's eyes above the frame's middle).  
- **Specialist arrangement:** the zone-based layout already defined in the AGENT\_DEFS data (STRATEGY / EXECUTION / QA) maps to a loose left-to-right arc around the Coordinator, not a rigid grid — organic spacing reads as "organization," rigid grid reads as "org chart."  
- **Stage band:** anchored to the bottom edge of the canvas, full width, always visible simultaneously with the graph — never a separate tab or scroll-away section. This is the Glance-tier "where are we in the mission" (§52 Q5) and must never require scrolling.  
- **Empty state composition:** the full hub-and-spoke structure renders at rest — dimmed, no pulse, no glow — with the caption "Run an idea to see the orchestration" placed near the Coordinator hub, not as a generic centered message replacing the graph. (Direct implementation of Act 1's "never show a blank page," §44.)  
- **Minimum viable interactivity:** pan and zoom (React Flow default) are available but not required — the default fit-to-view framing must be legible and complete without any user interaction. Interactivity rewards curiosity; it is never required for comprehension.

## 55\. Panel Layout Specification (Desk / Studio reference)

- **Primary panel width:** targets comfortable reading measure for sans-serif body text — approximately 65–80 characters per line at `--ig-text-body` size. Never full-bleed on wide viewports; center or cap at `--ig-content-max`.  
- **Secondary panel (RunInsightPanel, right rail):** fixed width, never resizable by the user in v1 (resizing is a future enhancement, not required for premium). Content within it follows the Inspect tier — reasoning text is the primary content, everything else (agent chips, decision icon) is supporting.  
- **Card grid density:** in stat/summary contexts (ExecutionSummary), no more than 4 stat cards per row on desktop, 2 on constrained widths — density beyond this breaks the "one clear focal point" rule (Part VIII §36.1) by making every card compete equally.

## 56\. Animation Choreography — Implementation Notes

Direct implementation guidance for §48's choreography sequence:

- Steps 1–3 and 6–7 of the choreography (Coordinator↔specialist handoff) are implemented as Framer Motion `AnimatePresence`/`animate` sequences triggered by `journeyState` polling detecting a stage/agent transition — never by a fixed timer. **The choreography is driven by real state changes, not by a rehearsed animation timeline.** This is the direct enforcement of "motion \= state" at the implementation level.  
- Step 4 (ambient pulse while working) uses `--ig-pulse-active` (2000ms loop) and must be the *only* looping animation active per node — a node that is both pulsing and glow-flashing simultaneously violates "one alive element" discipline (Part VIII §36.4) even within a single node's own state.  
- Step 11 (glow returns to baseline) should never be instant — always ease out over `--ig-dur-calm` (400ms), so the transition from "alive" to "calm" itself feels intentional, not like the animation was simply switched off.

## 57\. Interaction States — Hover, Focus, Empty, Loading (consolidated reference)

This section exists so implementers have one place to check all interaction-state guidance already established elsewhere in the Blueprint, rather than searching multiple parts:

| State | Rule | Source |
| :---- | :---- | :---- |
| Hover | Subtle, `--ig-dur-instant` (80ms), never triggers data fetches | Part III §21 |
| Focus | Visible ring, `--ig-glow-focus`, keyboard-reachable | Part VIII §35 |
| Empty | Educates, names what will appear and how | Part II §14, §44 Act 1 |
| Loading | Names the real operation, never bare spinner | Part II §14 |
| Error | Plain language \+ next action | Part II §14 |
| Stale | Muted, clear signal, never alarming | Part IV §22 |
| Active/processing | Exactly one glow per component; tied to §50's state table | Part VIII §36.4, §50 |

## 58\. Enterprise Readiness — Compatibility Notes (not-yet-built, must-not-be-blocked)

Today's decisions must remain compatible with tomorrow's capabilities. This is not a build list — it is a set of constraints on *today's* architecture so none of it becomes a future rewrite:

- **Permissions/collaboration:** the adapter architecture (Part V §25, §34) means any future multi-user state simply extends `journeyState`'s shape — views never assumed single-user.  
- **Audit history / replay:** the timeline's adapter-isolated event model (Part V §27) is already structured as a time-ordered, replayable log — no rework needed to support replay, only a replay *control* added on top.  
- **Explainability:** already the product's core mechanism (Part II §13, Trust Escalation §45) — enterprise "explainability" requirements are satisfied by extending what already exists, not bolting on something new.  
- **Approvals/governance:** the human-override principle (Part II §15) already establishes intervention points as first-class; formal approval gates are a data/workflow extension of an existing UI pattern (the override affordance), not a new paradigm.  
- **Observability/compliance:** the seven-state contract (Part IV §22) and the real-time intelligence language (§50) together already constitute a complete state-observability model — compliance tooling consumes what the UI already tracks.

**The test for any new feature proposal:** does it require a new *kind* of state the current architecture can't express, or does it require *more of* a kind of state already modeled? The former needs a Blueprint amendment; the latter is ordinary Tier-2/3 migration work.

## 59\. Design Token Governance — Philosophy Behind the Tokens

Part III §17–21 defined the token *values*. This defines the *philosophy* future engineers need to extend them correctly:

- **Why raw values are forbidden:** a raw hex or px value is a decision made once, silently, that can never be found or changed again except by hunting through every file it was pasted into. A token is a decision made once, *visibly*, that changes everywhere instantly. Design consistency is not a discipline problem — it is enforced structurally by making the correct choice (use the token) easier than the incorrect one (hardcode).  
- **How tokens evolve:** a token's *name* and *semantic meaning* are permanent once adopted (e.g., `--ig-status-caution` always means "at-risk / low confidence," forever). Its *value* may be tuned (a slightly different amber) without being a breaking change, because every consumer references the name, not the value.  
- **How new tokens are introduced:** a new token is proposed only when an existing token's *meaning* doesn't fit the new need — never to avoid reusing an existing token that's merely inconvenient. New tokens are added to Part III via a Blueprint amendment (§40), never invented ad hoc inside a component file.  
- **How deprecated tokens are retired:** a token is marked deprecated in the Change Log (Part IX) with its replacement named, remains functional for one full migration cycle (Tier 2 timeline), and is removed only once no component references it — verified by a grep, not assumed.  
- **How semantic meaning survives redesigns:** because tokens are named by *meaning* (`--ig-status-danger`) not by *appearance* (`--ig-red`), a future visual refresh can change every value in Part III without any component code changing at all. This is the entire point of a token system, stated explicitly so it's never accidentally violated by a future "quick fix" that hardcodes a color to save five minutes.

---

## PART XIII — SIGNATURE EXPERIENCE & DENSITY GOVERNANCE (permanent)

Part X defined the emotional journey. This Part defines the six remaining prescriptive gaps: the *psychological reason* behind visual devices, a *timed* cognitive-load contract, concrete *density ceilings*, per-workspace *eye-path ordering*, a *motion taxonomy*, and a named *catalog of signature moments*. Where Part X answers "what should the user feel," this Part answers "what specific rule enforces that feeling, checkably."

## 60\. Visual Psychology — The Reason Behind Every Device

Every visual technique in this Blueprint exists because it does specific cognitive work. Stated once here so no future decision uses a device for its aesthetic alone.

| Device | Psychological function | When it is earned |
| :---- | :---- | :---- |
| **Glow** | Signals "this is where attention belongs" faster than any label can — the eye is drawn to light before it reads text | Only on the single active/alive element (Part VIII §36.4) |
| **Blur** (background, not content) | Creates depth-of-field, telling the eye "this layer is behind, not now" — used on overlays/modals to keep the canvas present but subordinate | Modal/overlay backdrops only; never on primary content |
| **Pulse** | Mimics a biological signal (breathing, heartbeat) that reads instantly as "alive and working" without requiring interpretation | Tied to genuine ongoing processing (§50's cognitive-state table) — never idle decoration |
| **Scale** (on interaction) | Confirms a touch/click landed — a physical, almost tactile acknowledgment | Only on direct interaction feedback (`--ig-dur-instant`), never ambient |
| **Elevation** | Encodes z-order/importance without needing color — "raised" reads as "closer, more relevant" instinctively | Reserved for genuine layer distinction (canvas→surface→raised→overlay), never applied for visual variety |
| **Negative space** | Reduces the number of things competing for processing at once — space is the cheapest way to lower cognitive load | Default-generous; density is added only where §62's budget explicitly permits |
| **Weight-driven hierarchy** | The eye processes size/boldness before it processes color or position — hierarchy through weight is faster to parse than hierarchy through hue | The primary mechanism for every panel (Part III §18, Part VIII §36.1) |

**The test for any new visual device:** name which row of this table it belongs to, and which specific cognitive job it's doing. If it doesn't map to a psychological function, it's decoration and Part I §8 applies.

## 61\. The Timed Cognitive Load Model

A concrete, timed contract — more specific than §52's Five Questions, which this section now schedules explicitly:

**Within 3 seconds**, without reading any body text, the user must be able to answer: mission (what is this idea/run), execution health (is it going well), active intelligence (who's working right now), current stage (where in the lifecycle), overall progress (how much is left). This is the Five Questions (§52), with a hard timing requirement attached: if any of the five requires more than a glance, the screen has failed this test regardless of visual polish.

**Within 10 seconds**, the user should understand *the organization* — that six specialized roles exist, that they hand off work to each other, that a coordinator is synthesizing their output. This is achieved by the graph's structure being legible at rest (§54's empty-state composition) — the org chart reads itself without narration.

**Within 60 seconds**, the user should *trust* the system — this is the literal Act 4 Trust Escalation schedule from §44–45, now stated as the acceptance criterion: by 60 seconds, at least Level 3 (Reasoning) of the Trust Escalation Model must have been reached for at least one completed unit of work, or the screen has failed regardless of how the first 10 seconds performed.

**Implementation consequence:** this timed model is directly testable. A design review (§37) for any Office-adjacent screen should include a stopwatch test: hand the screen to someone unfamiliar with IdeaGate, start a timer, and check whether they can state the Five Questions' answers by 3s and articulate "there's a team of specialized agents" by 10s.

## 62\. Visual Density Budgets

Premium is defined as much by omission as inclusion (a principle this Blueprint has held implicitly since §36; this section makes it numeric).

| Surface | Hard ceiling | Rationale |
| :---- | :---- | :---- |
| Stat cards visible at once (any panel) | 4 on desktop, 2 on narrow | Beyond 4, no card can carry primary visual weight (§55) |
| Charts visible at once (any panel) | 2 | A third chart forces the eye to triage rather than absorb |
| Simultaneously "alive" (glowing/pulsing) elements | 1 | Absolute — restated from §44/§48/§60, the single most enforced rule in this Blueprint |
| Nav-level items in any single list/menu | 7 ± 2 | Working-memory limit (already cited in Part II §12) applied as a hard number |
| Colors carrying meaning on one screen (excluding the neutral canvas/text scale) | 4 (emerald \+ up to 3 semantic) | Beyond 4 simultaneous meaningful hues, color stops encoding information and starts reading as noise |
| Depth of nested disclosure to reach any Inspect-tier fact | 1 click from Glance tier | Enforces §51's progressive disclosure structurally |
| Minimum negative space around the single hero object | ≥ the object's own bounding area | Ensures the hero never feels crowded by its supporting panels |

These are ceilings, not targets — a screen that uses fewer stat cards or fewer colors than its budget is not under-designed, it is disciplined. A screen that exceeds a ceiling fails design review (§37) regardless of how well-crafted each individual element is.

## 63\. Eye-Path / Visual Weight Hierarchy per Workspace

Extending §46's information-architecture ladder with the *explicit ranked order* the eye should travel on each workspace's primary screen — the concrete deliverable requested, generalized across all workspaces rather than Office alone.

**Office** (already drafted in review; ratified here):

1\. Execution Health (the single glowing node / semantic color state)

2\. Coordinator (the hub — where synthesis happens)

3\. Current Stage (the stage-band's active node)

4\. Decision Timeline (RunInsightPanel, reachable in one click)

5\. Performance Summary (ExecutionSummary stat cards)

6\. Historical Analytics (trend/comparison views, if present)

7\. Logs (LiveLogStream — deliberately last; Excavate-adjacent, Inspect at best)

**Desk:**

1\. Selected artifact's title \+ stage \+ confidence chip (the reading context)

2\. The artifact body itself (the hero — what was produced)

3\. RunInsightPanel (why it was produced this way)

4\. Lifecycle chain / artifact rail (where this fits in the whole)

5\. Actions (download, edit-in-Studio) — supporting, never competing

**Studio:**

1\. The artifact \+ active improvement diff (the hero — the collaboration happening now)

2\. Version timeline (the history of this collaboration)

3\. Improvement metrics (quantified proof the collaboration is working)

4\. Context envelope indicators (attachments/references, when populated)

**The enforcement rule:** rank order equals visual weight order. Item 1 on each list must be unambiguously the largest/boldest/most central element on its screen; item 7 (or last) must be reachable but never prominent. If a design review finds the rendered visual weight doesn't match this ranking, the screen fails §37 regardless of individual component quality.

## 64\. Motion Hierarchy — Classification

Not every animation deserves equal importance. Every motion in the product is classified into exactly one of four tiers, and only the first two are permitted to dominate a screen:

| Tier | Definition | Examples | Dominance allowed |
| :---- | :---- | :---- | :---- |
| **Mission-Critical** | Directly represents a system-of-record state change | Node idle→active, stage-band fill, glow ignition (Act 3\) | Yes — this IS the product |
| **Contextual** | Supports understanding of a Mission-Critical event without being one itself | Edge flow-animation accompanying a handoff, confidence-chip fill accompanying a reasoning update | Yes — but always subordinate to, and triggered by, a Mission-Critical event |
| **Delight** | Small, optional polish that rewards attention but carries no information a user needs | A subtle easing curve on a hover, a soft settle on a card's entrance | Never dominant; removable without any comprehension loss |
| **Decorative** | Motion with no state basis | Ambient background particles, idle looping effects unrelated to any real activity | **Not permitted in IdeaGate, full stop** — this tier exists in the taxonomy only to be excluded |

Every motion proposed for the product must be assigned a tier before implementation. Anything that cannot be honestly classified as Mission-Critical or Contextual is, by definition, Delight at best and must never compete visually with the two tiers above it. Anything that lands in Decorative does not ship (this is Part I §8's law, now given an explicit taxonomy to be checked against rather than a single abstract rule).

## 65\. Signature Product Moments (the IdeaGate Catalog)

Every category-defining product has 2–4 moments so distinctive that users describe them unprompted to other people. IdeaGate's are enumerated here, deliberately kept few — a "signature moment" that happens constantly stops being signature.

1. **The Coordinator Waking Up.** The transition from the idle, dimmed graph to the first emerald glow at the moment "Run" is pressed (Act 3, §44). This is IdeaGate's equivalent of a product's "first pixel" — the single most rehearsed, most protected animation in the entire product. Any future redesign of the shell must preserve this exact emotional beat even if its implementation changes.  
2. **The Orchestration Graph Becoming Alive.** The choreographed handoff sequence (§48) seen for the first time in a session — the moment a user realizes the graph isn't a static diagram but a live representation of real work. This is the moment that converts a skeptical first-time user into a believer.  
3. **The First Reasoning Appearing.** The RunInsightPanel populating with real, specific justification for the first time (Act 4, Level 3 of Trust Escalation, §45). This is the quiet, high-trust moment — deliberately undramatic, because its power is in being genuine rather than performed.  
4. **The Full Lifecycle Finishing.** The lifecycle chain completing its bookend transition (Act 6, §44) — dimmed-and-waiting at the start, fully solid at the end, the same object transformed. This is IdeaGate's "job well done" moment and should feel earned, not celebrated with confetti or fanfare (Part I §9's anti-goals rule out gimmicks here) — quiet completeness, not spectacle.

**Governance rule for this catalog:** it is capped intentionally. A fifth "signature moment" proposal should be scrutinized hard — if everything is signature, nothing is. New candidates are added only via Blueprint amendment (§40), and only if they meet the same bar: something a real user would voluntarily describe to a colleague.

---

*IdeaGate Design Blueprint v1.2 — the canonical Design & Experience DNA.* *Living specification. Every mission traces back here.* *One product → one design system → many specialized workspaces.* *The architecture explains what the system is. Part X explains what the user feels.* *Part XIII makes every feeling checkable, timed, and bounded.* *Calm everywhere. Intelligent where it matters. Alive where meaningful work is happening.*  
