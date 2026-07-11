# IDEAGATE FOUNDATION — PHASE 1 IMPLEMENTATION SPECIFICATION
# Buildable artifact. Drop-in files, real contracts, Claude Code batches.
# Version 1.0 | July 2026

> This is not a governance document. It is the smallest foundation that lets Claude Code
> build premium experiences without inventing. Every section is a thing Claude Code applies
> or a contract it implements — not philosophy it interprets. Prose is kept to the minimum
> needed to remove ambiguity.
>
> **Verified stack facts (July 2026):** `motion` v12.42.2 (import `motion/react`) — animates
> OKLCH natively, GPU-accelerated to 120fps. `@xyflow/react` v12.x — MIT, SSR-safe.
> Tailwind + shadcn/ui + CVA + Radix. Zustand + TanStack Query. Apache ECharts (flagship
> viz) + Recharts (KPI only). Geist Sans + JetBrains Mono. Floating UI for overlays.
>
> **Architecture contract:** Everything reads from the Unified Execution Context via adapters.
> The Journey Engine, coordinator, and APIs are never touched. All batches are additive.

---

## 1. VISUAL GRAMMAR (the fixed-meaning table)

Every mark in the product has ONE meaning. No screen invents a new metaphor. This table is
law; Claude Code cites it (`Grammar: agent = circle`) and never deviates.

| Mark | Meaning | Never used for |
|---|---|---|
| **Circle node** | A specialist agent (PS/RE/UX/AR/QA) | Anything else |
| **Hexagon node** | The Coordinator (unique form — the only hexagon) | Any specialist |
| **Node fill: agent color @ 15%** | That agent is active/working now | A done or idle agent |
| **Node fill: surface-raised** | Agent is done (contributed, resting) | An active agent |
| **Node outline only** | Agent is waiting / not yet engaged | An active agent |
| **Emerald glow around node** | Thinking — genuine live cognition right now | Decoration, "selected" state |
| **Solid edge, animated flow** | Active execution — work moving along this path now | A waiting or blocked path |
| **Dashed edge, static** | Waiting — this path is pending | An active path |
| **Severed/broken edge** | Blocked — this path cannot proceed | A merely-slow path |
| **Ripple (expanding ring)** | Confidence propagating outward from a resolved node | Any other event |
| **Emerald** (accent) | Alive / active / high-confidence / go | Decoration |
| **Amber** | Human attention required / low confidence / caution | Mood, "warm" styling |
| **Red** | Failed / blocked | Anything non-critical |
| **Blue** | Informational / neutral-secondary | A success or active state |
| **Slate/muted** | Stale / superseded | An active or current item |
| **Selection ring (2px emerald-muted)** | This entity is the current cross-experience selection | Hover, focus, active-work |

**Rule:** hover, focus, active-work, and selection are FOUR distinct visual states and must
never share a treatment (this is the #1 source of "assembled from a kit" feel). See §7.

---

## 2. DESIGN TOKENS — `globals.css` (drop-in)

OKLCH. Semantic names (meaning, not appearance). Dark-first (IdeaGate has no light mode in
v1). Claude Code pastes this into `globals.css`.

```css
:root {
  /* ── Canvas & surfaces (near-black, emerald undertone) ── */
  --ig-canvas:            oklch(14% 0.012 165);   /* deepest bg */
  --ig-surface:           oklch(17% 0.014 165);   /* default panel */
  --ig-surface-raised:    oklch(21% 0.020 162);   /* raised card, active panel */
  --ig-surface-overlay:   oklch(24% 0.024 162);   /* modal, popover, command palette */

  /* ── Borders ── */
  --ig-border-subtle:     oklch(24% 0.018 162);
  --ig-border-default:    oklch(30% 0.028 160);
  --ig-border-strong:     oklch(40% 0.045 158);

  /* ── Emerald — the protagonist (spent sparingly) ── */
  --ig-emerald:           oklch(76% 0.15 162);
  --ig-emerald-bright:    oklch(85% 0.16 165);
  --ig-emerald-dim:       oklch(52% 0.11 160);
  --ig-emerald-muted:     oklch(76% 0.15 162 / 0.14);   /* tints, active fills */
  --ig-emerald-glow:      oklch(76% 0.15 162 / 0.35);   /* the "thinking" glow */

  /* ── Text ── */
  --ig-text-primary:      oklch(94% 0.010 160);
  --ig-text-secondary:    oklch(72% 0.018 165);
  --ig-text-tertiary:     oklch(52% 0.016 165);
  --ig-text-on-emerald:   oklch(16% 0.02 165);

  /* ── Semantic (meaning only) ── */
  --ig-caution:           oklch(82% 0.15 85);    /* amber — attention/low-conf */
  --ig-danger:            oklch(70% 0.17 25);     /* red — failed/blocked */
  --ig-info:              oklch(72% 0.13 245);    /* blue — informational */
  --ig-stale:             oklch(60% 0.02 250);    /* slate — superseded */

  /* ── Agent palette (data-encoding ONLY, never chrome) ── */
  --ig-agent-co:          oklch(76% 0.15 162);   /* Coordinator — emerald */
  --ig-agent-ps:          oklch(70% 0.15 275);   /* Product Strategy — indigo */
  --ig-agent-re:          oklch(74% 0.13 235);   /* Research — sky */
  --ig-agent-ux:          oklch(72% 0.16 350);   /* UX — pink */
  --ig-agent-ar:          oklch(75% 0.15 55);    /* Architect — orange */
  --ig-agent-qa:          oklch(72% 0.16 305);   /* QA — purple */

  /* ── Radius ── */
  --ig-radius-sm: 4px; --ig-radius-md: 8px; --ig-radius-lg: 12px;
  --ig-radius-xl: 16px; --ig-radius-full: 999px;

  /* ── Elevation (light-based, not heavy shadow) ── */
  --ig-elev-1: inset 0 0 0 1px var(--ig-border-subtle);
  --ig-elev-2: inset 0 0 0 1px var(--ig-border-default), 0 1px 0 0 oklch(100% 0 0 / 0.03);
  --ig-elev-overlay: 0 8px 40px -8px oklch(0% 0 0 / 0.6);
  --ig-glow-active: 0 0 24px -4px var(--ig-emerald-glow);
  --ig-focus-ring: 0 0 0 2px var(--ig-emerald-muted);
}
```

---

## 3. TYPOGRAPHY

Two voices: **Geist Sans** for human/reading surfaces, **JetBrains Mono** for machine
surfaces (logs, metrics, labels, technical data, stage codes). Setup + scale:

```css
:root {
  --ig-font-sans: 'Geist Sans', -apple-system, system-ui, sans-serif;
  --ig-font-mono: 'JetBrains Mono', 'Geist Mono', ui-monospace, monospace;
}
```

| Token | Size / weight / tracking | Font | Use |
|---|---|---|---|
| `--ig-t-hero` | 48px / 700 / -0.02em | sans | The one big number per surface |
| `--ig-t-display` | 32px / 700 / -0.01em | sans | Section metric |
| `--ig-t-title` | 20px / 600 | sans | Panel/card titles, mission sentence |
| `--ig-t-body` | 15px / 400 / lh 1.6 | sans | Reading text |
| `--ig-t-label` | 12px / 600 / 0.06em / uppercase | mono | Machine labels (tracked) |
| `--ig-t-caption` | 11px / 500 | mono | The "so-what" context line |
| `--ig-t-code` | 13px / 400 | mono | Logs, technical values |

**Rule:** mono for anything the system "says" (labels, metrics, logs, codes); sans for
anything said to the user (titles, reading prose). Big value + tiny mono label is the
canonical stat pattern.

---

## 4. SPACING & LAYOUT SCALE

```
--ig-space-1:4px  -2:8px  -3:12px  -4:16px  -6:24px  -8:32px  -12:48px  -16:64px
--ig-rail-width: 240px   --ig-topbar-h: 52px   --ig-statusbar-h: 28px
--ig-content-max: 1440px   --ig-reading-max: 68ch
```

**Rhythm rule (composition, not just tokens):** vertical spacing between sibling blocks steps
in the 4px scale and never uses off-scale values. Panel internal padding is always `--ig-space-4`
(16px) minimum, `--ig-space-6` (24px) for hero panels. Whitespace around the hero element is
≥ the hero's own bounding area (this is the anti-clutter law, enforced in composition primitives §8).

---

## 5. TAILWIND THEME EXTENSION (drop-in `tailwind.config.ts`)

Maps every token to a Tailwind utility so components use `bg-ig-surface`, `text-ig-emerald`,
etc. — never raw values.

```ts
import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'ig-canvas': 'var(--ig-canvas)',
        'ig-surface': 'var(--ig-surface)',
        'ig-surface-raised': 'var(--ig-surface-raised)',
        'ig-surface-overlay': 'var(--ig-surface-overlay)',
        'ig-border': { subtle: 'var(--ig-border-subtle)', DEFAULT: 'var(--ig-border-default)', strong: 'var(--ig-border-strong)' },
        'ig-emerald': { DEFAULT: 'var(--ig-emerald)', bright: 'var(--ig-emerald-bright)', dim: 'var(--ig-emerald-dim)', muted: 'var(--ig-emerald-muted)' },
        'ig-text': { primary: 'var(--ig-text-primary)', secondary: 'var(--ig-text-secondary)', tertiary: 'var(--ig-text-tertiary)' },
        'ig-caution': 'var(--ig-caution)', 'ig-danger': 'var(--ig-danger)', 'ig-info': 'var(--ig-info)', 'ig-stale': 'var(--ig-stale)',
        'ig-agent': { co:'var(--ig-agent-co)', ps:'var(--ig-agent-ps)', re:'var(--ig-agent-re)', ux:'var(--ig-agent-ux)', ar:'var(--ig-agent-ar)', qa:'var(--ig-agent-qa)' },
      },
      fontFamily: { sans: ['var(--ig-font-sans)'], mono: ['var(--ig-font-mono)'] },
      borderRadius: { sm:'var(--ig-radius-sm)', md:'var(--ig-radius-md)', lg:'var(--ig-radius-lg)', xl:'var(--ig-radius-xl)' },
      boxShadow: { 'ig-1':'var(--ig-elev-1)', 'ig-2':'var(--ig-elev-2)', 'ig-overlay':'var(--ig-elev-overlay)', 'ig-glow':'var(--ig-glow-active)', 'ig-focus':'var(--ig-focus-ring)' },
      spacing: { 'ig-rail':'240px', 'ig-topbar':'52px', 'ig-status':'28px' },
    },
  },
} satisfies Config
```

---

## 6. MOTION PRIMITIVES (real `motion/react` variants — `src/lib/motion/primitives.ts`)

Named behaviors, not per-component animations. Every animation in the product composes from
these. Cited by name (`Motion: handoff`). Durations are STARTING values — the human tuning
pass (§12) adjusts them; the names and structure are fixed.

```ts
import type { Variants, Transition } from 'motion/react'

/* Easings — the product's motion signature */
export const easing = {
  standard: [0.4, 0.0, 0.2, 1] as const,   // most transitions
  out:      [0.0, 0.0, 0.2, 1] as const,   // entrances
  in:       [0.4, 0.0, 1, 1] as const,     // exits
}

export const duration = {
  instant: 0.08, quick: 0.16, standard: 0.24, calm: 0.4,   // seconds
}

/* ── breathe: a node is alive/thinking. The ONLY looping ambient motion. ── */
export const breathe: Variants = {
  idle:   { scale: 1 },
  active: { scale: [1, 1.03, 1], transition: { duration: 2.4, ease: 'easeInOut', repeat: Infinity } },
}

/* ── handoff: work moving along an edge from A to B (edge dash-flow) ── */
export const handoffTransition: Transition = { duration: 1.5, ease: 'linear', repeat: Infinity }
// applied to strokeDashoffset on an animated edge; direction reverses when work returns to CO

/* ── propagate: confidence rippling out from a resolved node ── */
export const propagate: Variants = {
  hidden: { scale: 0.6, opacity: 0.5 },
  ripple: { scale: 2.2, opacity: 0, transition: { duration: 0.9, ease: 'easeOut' } },
}

/* ── settle: a briefing/decision moving into the record ── */
export const settle: Variants = {
  live:    { scale: 1, opacity: 1, y: 0 },
  settled: { scale: 0.9, opacity: 0, y: 24, transition: { duration: 0.4, ease: easing.in } },
}

/* ── reveal: content entering (panels, list items, reasoning) ── */
export const reveal: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: easing.out } },
}

/* ── stagger: for lists/grids revealing children in sequence ── */
export const staggerParent: Variants = {
  visible: { transition: { staggerChildren: 0.05 } },
}
```

**These map 1:1 to the visual grammar (§1):** `breathe`↔emerald-glow-thinking,
`handoff`↔solid-animated-edge, `propagate`↔ripple, etc. Motion and grammar are one system.

---

## 7. INTERACTION LANGUAGE (the four distinct states + contracts)

The four states that must never share a treatment:

| State | Treatment | Timing |
|---|---|---|
| **Hover** | Surface lightens one step (`surface`→`surface-raised`); tooltip after 400ms | `duration.instant` (80ms) |
| **Focus** (keyboard) | `--ig-focus-ring` (2px emerald-muted) | instant |
| **Active-work** | Emerald glow + `breathe` (only while genuinely working) | `breathe` loop |
| **Selection** (cross-experience) | 2px emerald-muted ring, persistent, + subtle `surface-raised` fill | `duration.quick` |

**Hover contract:** hover never triggers data fetches; reveals context already loaded.
**Loading contract:** never a bare spinner — name the real operation ("Running Stage 7") or
show a skeleton. **Empty contract:** never "no data" — state what appears and how.
**Overlays:** Floating UI for all tooltips/popovers/menus (positioning, collision, focus).

---

## 8. COMPOSITION PRIMITIVES (the anti-dashboard layer — `src/components/shell/`)

**This is the section that prevents dashboard drift.** Composition is encoded in these
primitives so experiences are ASSEMBLED from correct pieces, not laid out from raw divs.
TypeScript signatures Claude Code implements; hierarchy and rhythm are baked in.

```ts
/* AppShell — the permanent frame. NavRail + content + StatusBar. Never changes per screen. */
interface AppShellProps {
  children: React.ReactNode           // the workspace content area only
}
// Renders: <NavRail/> (240px, config-driven from NAV_ITEMS) | <main> + <StatusBar/> (28px)
// The shell is IDENTICAL on every screen. Only children change. (This is the coherence law.)

/* WorkspaceLayout — one hero + supporting regions, enforces eye-path weight */
interface WorkspaceLayoutProps {
  hero: React.ReactNode               // THE primary element — gets the most visual weight
  supporting?: React.ReactNode        // secondary panels (right/below), never competes
  rail?: React.ReactNode              // optional context rail
  vitals?: React.ReactNode            // thin metric strip, ≤36px, bottom
}
// Enforces: hero occupies ≥55% of area; supporting is visually lighter (smaller type,
// no glow); vitals is capped at 36px. A layout CANNOT put two heroes — the type only
// accepts one `hero`. This is composition-as-constraint.

/* Panel — the standard surface. Consistent padding, elevation, title treatment. */
interface PanelProps {
  title?: string                      // mono label, uppercase, tracked
  children: React.ReactNode
  elevation?: 1 | 2                    // maps to --ig-elev-1|2
  density?: 'comfortable' | 'compact' // padding: 24px | 16px
}

/* StatBlock — the canonical metric. Big value + tiny mono label + so-what context. */
interface StatBlockProps {
  value: string | number
  label: string                       // mono, secondary
  context?: string                    // the "so-what" — REQUIRED for hero stats
  tone?: 'emerald' | 'caution' | 'neutral'
  trend?: number                      // optional inline delta
}
// A StatBlock without `context` is allowed only in the vitals strip. Elsewhere context is
// mandatory (enforces the so-what rule structurally).

/* HeroSlot — wraps whatever is the hero with the correct negative space + glow budget */
interface HeroSlotProps {
  children: React.ReactNode
  alive?: boolean                     // if true, THIS is where the one glow lives
}
// Guarantees ≥ hero-area whitespace around children; owns the single-glow budget so no
// other element can claim "alive" simultaneously.
```

**Composition laws these encode:** one hero per workspace (type-enforced), so-what mandatory
outside vitals (type-enforced), one alive element (HeroSlot owns the budget), consistent
panel rhythm (Panel is the only surface primitive), vitals capped at 36px.

---

## 9. UNIFIED EXECUTION CONTEXT (Zustand store — `src/lib/execution/store.ts`)

One source of truth. Every experience subscribes. Future execution modes (research, debate,
prioritization) extend `ExecutionContext` without renaming.

```ts
interface ExecutionEntity {                 // an agent, stage, or artifact — anything selectable
  id: string
  kind: 'stage' | 'agent' | 'artifact'
}

interface ExecutionContext {
  /* Data (fed by adapters from /api/journey-state via TanStack Query) */
  mode: 'lifecycle' | 'research' | 'debate' | string   // extensible, never a hard enum
  currentStage: number | null
  stages: Record<string, StageState>
  agents: Record<string, AgentState>
  metrics: MetricSnapshot          // confidence/quality/cost/risk EXIST ONCE here
  events: RuntimeEvent[]

  /* Shared interaction state — the cross-experience linkage */
  selected: ExecutionEntity | null
  hovered: ExecutionEntity | null

  /* Actions */
  select: (e: ExecutionEntity | null) => void
  hover: (e: ExecutionEntity | null) => void
}
```

**The metrics-as-perspectives contract:** `metrics` holds each value ONCE. Live Orchestration
renders `metrics.confidence` as node state; Intelligence renders the same value as evolution;
Insights renders it as a trend. No metric is ever stored or computed twice.

---

## 10. THE SELECTION CONTRACT (library-agnostic — `src/lib/execution/selection.ts`)

The primitive that makes XYFlow + ECharts + Recharts behave as one app. Every visualization
adapts to this; none owns selection. Built in batch one so linked selection is never
retrofitted.

```ts
/* The contract every visualization implements — regardless of rendering library */
interface SelectableView {
  /* Called by the view when the user selects within it → writes to the store */
  onSelect: (entity: ExecutionEntity | null) => void
  /* The view SUBSCRIBES to store.selected and reflects it in its own render:
     - XYFlow: applies the selection ring to the matching node
     - ECharts: dispatchAction highlight on the matching series/datum
     - Recharts: applies active styling to the matching element
     The view NEVER holds its own selection state. store.selected is the only truth. */
}

/* Adapter helpers each library uses to map its native selection event → ExecutionEntity */
export const fromXYFlowNode = (nodeId: string): ExecutionEntity => ({ id: nodeId, kind: nodeIdKind(nodeId) })
export const fromEChartsParam = (p: EChartsParam): ExecutionEntity => ({ id: p.name, kind: 'stage' })
```

**Rule:** selecting a stage in the orchestration graph writes `store.select({id, kind:'stage'})`;
every other mounted view re-renders its own highlight from that one write. This is the
"one operating system, three lenses" mechanism, enforced at the data layer.

---

## 11. CLAUDE CODE IMPLEMENTATION BATCHES (Phase 1)

Additive, checkpoint-tagged, TypeScript-gated, engine untouched. One concern per commit.
Each batch STOPS for verification before the next.

**Batch F0 — Pre-flight & dependencies**
- Tag `v5.0-pre-foundation`, push.
- Install: `motion`, `@xyflow/react`, `echarts`, `zustand`, `@tanstack/react-query`,
  `class-variance-authority`, `@floating-ui/react`, `geist`. (Tailwind + shadcn assumed
  present or installed here per the codebase's current state — verify first, report.)
- `npx tsc --noEmit` clean. Commit `chore: foundation dependencies (Batch F0)`.
- **Acceptance:** all installs resolve, 0 TS errors, dev server boots.

**Batch F1 — Tokens & Tailwind**
- Add the `globals.css` token block (§2, §3, §4). Add the Tailwind theme extension (§5).
- Load Geist Sans + JetBrains Mono.
- **Acceptance:** a throwaway test element using `bg-ig-surface text-ig-emerald font-mono`
  renders correct colors/fonts. 0 TS errors. Commit `feat: OKLCH tokens + Tailwind theme (Batch F1)`.

**Batch F2 — Motion primitives & interaction contracts**
- Add `src/lib/motion/primitives.ts` (§6). Add the interaction-state utilities (§7).
- **Acceptance:** primitives import and type-check; a test `motion.div` using `reveal` animates.
  Commit `feat: motion primitives + interaction language (Batch F2)`.

**Batch F3 — Composition primitives**
- Add `AppShell`, `WorkspaceLayout`, `Panel`, `StatBlock`, `HeroSlot` (§8).
- Build STANDALONE first (a scratch route rendering each), verify, THEN they're available.
- Do NOT wire into existing pages yet (that's per-experience work).
- **Acceptance:** each primitive renders in isolation with correct rhythm/elevation; the
  type system rejects two `hero` props. 0 TS errors. Commit `feat: composition primitives (Batch F3)`.

**Batch F4 — Unified Execution Context + Selection Contract**
- Add the Zustand store (§9) and selection contract (§10). Wire the store to `/api/journey-state`
  via TanStack Query (read-only; adapter maps journey-state → ExecutionContext).
- **Acceptance:** the store populates from a real run; `select()` updates `store.selected`;
  a test subscriber re-renders on selection. Engine untouched (confirm `git diff` shows no
  `src/core/` changes). 0 TS errors. Commit `feat: unified execution context + selection contract (Batch F4)`.

**Batch F5 — Tag foundation complete**
- `npx tsc --noEmit` clean, dev server boots, all existing routes still work (regression check:
  full lifecycle runs, Studio improve/accept, model selection, New-Idea reset, Stop).
- Tag `v5.1-foundation-complete`, push.

After F5: Foundation is real and verified. Next document: the Live Orchestration build spec,
built entirely on these primitives.

---

## 12. HUMAN REVIEW — WHERE JUDGMENT BEATS GENERATION

Stated explicitly per your instruction. These CANNOT be one-passed correctly. Claude Code
implements the structure; you tune the feel with these checklists.

**Motion tuning (highest value, ~1–2h in browser after Live Orchestration):**
- [ ] Does `breathe` read as "alive" or as "pulsing"? (Adjust amplitude 1.03 / duration 2.4s.)
- [ ] Does `handoff` edge-flow read as "work moving" or as "a barber pole"? (Adjust dash gap / speed.)
- [ ] Does `propagate` ripple read as "confidence spreading" or as a "click effect"? (Adjust scale/opacity curve.)
- [ ] Does `settle` read as "moving into the record" or "disappearing"? (Adjust y-distance / timing.)
- [ ] Are two animations ever competing for attention? (Enforce: max ONE alive element.)
- [ ] Does motion STOP when nothing is working? (Between stages / on completion — must go still.)

**Composition balance (per experience, ~30min each):**
- [ ] Is there exactly one clear focal point? Cover the hero — does the screen lose its center?
- [ ] Does the eye land on the hero first, unprompted?
- [ ] Is whitespace around the hero ≥ its own area? (Or does it feel crowded?)
- [ ] Do any two elements have equal visual weight competing? (Fix: demote one.)
- [ ] Vitals confined to their strip, never card-like?

**Information density (per experience, ~30min):**
- [ ] Dense but scannable, or cluttered? (Remove until it breathes.)
- [ ] More than 4 stat blocks / 2 charts visible at once? (Over budget — cut.)
- [ ] Every visualization answers a unique question? (If two answer the same, delete one.)

**Graph readability (Live Orchestration, ~30min):**
- [ ] Are edges legible, or a tangle? (Adjust bezier curvature / routing.)
- [ ] Is the Coordinator visually distinct (hexagon) from specialists (circles) at a glance?
- [ ] Is the active agent unambiguous (the one glowing/breathing)?
- [ ] Does the graph read at rest (empty state) without decoding?

**What Claude Code does autonomously (no review needed):** token application, component
structure, layout assembly, store wiring, adapter mapping, chart configuration, accessibility
baseline, the selection contract, TypeScript correctness, regression safety.

---

## CHANGE LOG
| Version | Date | Change |
|---|---|---|
| 1.0 | July 2026 | Phase 1 Foundation: visual grammar, OKLCH tokens, typography, spacing, Tailwind theme, motion primitives, interaction language, composition primitives, Unified Execution Context, selection contract, Claude Code batches F0–F5, human-review checklists. Verified against motion v12.42.2 (OKLCH-native, 120fps) and @xyflow/react v12. |

---

*IdeaGate Foundation — Phase 1. Buildable, not conceptual.*
*Grammar is law. Composition is constraint. Motion is behavior. The engine is untouched.*
*Next: Live Orchestration, built on this.*
