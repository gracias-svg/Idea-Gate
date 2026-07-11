# IDEAGATE MISSION CONTROL — IMPLEMENTATION SPECIFICATION
# Live Orchestration · The First Flagship Experience
# Version 1.0 | July 2026

> **Prerequisite:** Foundation Phase 1 complete and frozen (`v5.1-foundation-complete`),
> providers wired (`2c23d1d`), Execution Context verified hydrating live data.
>
> **What this builds:** Mission Control replaces the *contents* of the existing Analytics
> sub-tab inside `/office`. The Office route, the `officeView` toggle, the Agent Activity
> (Phaser) view, and the existing agent strip all remain **exactly as they are.**
>
> **What this proves:** that the Foundation produces premium output. Every Foundation
> artifact — visual grammar, motion primitives, composition primitives, Execution Context,
> selection contract — is exercised here. If Mission Control feels premium, the Foundation
> works. If it doesn't, the Foundation gets refined from *this observation* — not from
> new planning.
>
> **Reuse mandate:** every component below lives in `src/components/viz/` (a shared
> visualization layer), NOT in an office-specific folder. Intelligence & Quality and
> Insights & Performance will reuse them. No Mission-Control-only widgets.

---

## 0. STACK RULINGS FOR THIS EXPERIENCE

| Decision | Ruling |
|---|---|
| Graph engine | `@xyflow/react` (already installed F0). Nodes are React components — this is why we chose it. |
| `d3-shape` | **NOT used.** XYFlow's `getBezierPath` + custom SVG is sufficient. No new dependency. |
| ECharts | **NOT used in Mission Control.** No charts here. Charts answer "how did it trend" — that's I&Q / I&P. Mission Control answers "what is happening now." |
| Animation | `framer-motion` (installed). **Edge dash-flow uses CSS animation, not JS** — cheaper and more reliable at 60fps. |
| New dependencies | **Zero.** Everything needed is already installed. |

---

## 1. THE CRITICAL CONSTRAINT (read before anything else)

`src/app/office/page.tsx` already contains, from a previous mission:

- an `officeView` state: `'analytics' | 'agent-activity'`
- a toggle in the persistent AGENT OFFICE header strip
- an **agent-activity wrapper** containing `<PhaserGame/>` + Mission Control panel, shown/hidden
  via `display: officeView === 'agent-activity' ? 'flex' : 'none'`
- an **analytics wrapper**, shown/hidden via the inverse, currently containing
  `OrchestrationGraph`, `ExecutionSummary`, `LiveLogStream`

**Mission Control replaces ONLY the children of the analytics wrapper.**

Absolutely forbidden:
- Touching the `officeView` state or the toggle.
- Touching the agent-activity wrapper, `PhaserGame`, or the existing Mission Control panel.
- Changing `display:none` to conditional rendering. **Phaser must never unmount.** This has
  been the highest-risk integration point in this codebase since day one.
- Changing the AGENT OFFICE header strip or the agent chips within it.
- Modifying routing or navigation.

The old `OrchestrationGraph` / `ExecutionSummary` / `LiveLogStream` components: remove their
imports and usage from `office/page.tsx`, leave the files on disk with a
`// DEPRECATED — superseded by src/components/viz/ (Mission Control v1)` header comment.
Do not delete them in this mission.

---

## 2. COMPOSITION (the screen)

Built from Foundation composition primitives. One hero. Supporting is visually lighter.
Vitals is a thin text band. This is `WorkspaceLayout` used exactly as designed.

```
┌─ AGENT OFFICE header strip (EXISTING — untouched) ──[Analytics|Agent Activity]─┐
├────────────────────────────────────────────────────┬───────────────────────────┤
│  HERO — HeroSlot(alive)                            │  SUPPORTING (300px)       │
│  ┌──────────────────────────────────────────────┐  │  ┌─────────────────────┐  │
│  │                                              │  │  │ RUN SUMMARY         │  │
│  │        OrchestrationCanvas (XYFlow)          │  │  │ MetricGrid          │  │
│  │        hexagon CO · 5 circle specialists     │  │  │ (4 StatBlocks max)  │  │
│  │        custom bezier edges                   │  │  └─────────────────────┘  │
│  │                                              │  │  ┌─────────────────────┐  │
│  ├──────────────────────────────────────────────┤  │  │ ACTIVITY STREAM     │  │
│  │  StageRail — 15 nodes, always visible        │  │  │ (live events)       │  │
│  └──────────────────────────────────────────────┘  │  └─────────────────────┘  │
├────────────────────────────────────────────────────┴───────────────────────────┤
│  VitalsBand — thin mono text line, ≤36px                                        │
└────────────────────────────────────────────────────────────────────────────────┘
```

**Composition laws enforced here:**
- The graph is the **only** hero. Nothing else competes for primary visual weight.
- `StageRail` sits *inside* the hero (below the canvas), because "where are we in the mission"
  must be glance-tier and simultaneously visible with the graph. It is never a separate tab
  and never scrolls out of view.
- Supporting column: smaller type, no glow, `Panel` elevation 1.
- Vitals: mono text only. **No stat cards.** Capped at 36px.
- **No charts anywhere in this experience.**

---

## 3. VISUAL GRAMMAR APPLIED (from Foundation §1 — law, not suggestion)

| Element | Rendering |
|---|---|
| **Coordinator** | **Hexagon**, ~72px, emerald stroke, `--ig-surface-raised` fill, emerald `CO` label. The only hexagon in the product. |
| **Specialist** | **Circle**, ~56px. Stroke + label in that agent's palette color (`--ig-agent-ps/re/ux/ar/qa`). |
| **Agent: active** | Fill = agent color @15%, stroke 2px full agent color, label full opacity. **Emerald glow + `breathe`.** |
| **Agent: done** | Fill = `--ig-surface-raised`, stroke 1px agent color @40%, label @60%. No motion. |
| **Agent: waiting** | Outline only, `--ig-border-default` stroke, label `--ig-text-tertiary`. No motion. |
| **Edge: active** | Solid bezier, emerald, animated dash-flow (CSS). CO → active specialist only. |
| **Edge: waiting** | Dashed bezier, `--ig-border-default`, static. |
| **Edge: blocked** | Severed (gap in the middle of the path), `--ig-danger`. *(Grammar reserved; the current engine has no blocked state. Implement the visual, leave it unused.)* |
| **Stage node: done** | Filled emerald dot. |
| **Stage node: current** | Emerald dot + 3px emerald ring. |
| **Stage node: low-confidence** | Filled `--ig-caution` (amber) dot. |
| **Stage node: pending** | Outlined dot, `--ig-border-default`. |
| **Ripple** | One-shot expanding emerald ring from the agent node whose stage just completed (`propagate` primitive). Confidence resolving. |
| **Selection** | 2px `--ig-emerald-muted` ring, persistent. **Distinct from hover, focus, and active-work.** |

---

## 4. THE ONE-ALIVE-ELEMENT RULE — how it resolves here

> **CORRECTED by M0 reality check (C1) — this section supersedes the original §4.**
> The store has no "between stages" state; there is no data for it. The rule below is
> what the data actually supports.

This is the most important craft decision in the experience, and it must be implemented
exactly:

> **The single alive element is whichever agent OWNS `currentStage`**, per
> `AGENT_DEFS.stages[]`. This may be a specialist **or** the Coordinator — CO owns stages
> 0, 6 and 11 and does real work on them. At any instant **exactly one node is alive**, and
> it is the owner of the current stage.
>
> - When a **specialist** owns the current stage: that specialist glows and `breathe`s, and
>   the `CO → specialist` edge animates (work is being handed off).
> - When the **Coordinator** owns the current stage: CO glows and `breathe`s, and **no edge
>   animates** — nothing is being handed off, CO is doing the work itself.
>
> There is **no** "CO breathes between stages" moment. That idea is deleted.

Consequence: at any instant, **exactly one node is alive** — never zero (while running),
never two. You watch attention move from node to node as stages advance. That movement *is*
the orchestration made visible. Two things breathing at once destroys it.

---

## 5. THE ADAPTER (engine untouched)

**Known data-shape issue to resolve first.** The F4 verification showed the store's `agents`
map keyed `"0".."13"` — i.e. it is currently `agentsByStage` (keyed by stage), **not** a
per-agent state map. Mission Control needs per-agent state (which agent is active/done/waiting).
That state must be **derived**, not assumed to exist.

Create `src/lib/execution/adapters/orchestration.ts` — a **pure function**, unit-testable,
the only code that knows both the store's shape and XYFlow's shape:

```ts
import type { Node, Edge } from '@xyflow/react'

export type AgentStatus = 'active' | 'done' | 'waiting'

export interface OrchestrationModel {
  nodes: Node[]           // 1 coordinator (hexagon) + 5 specialists (circles)
  edges: Edge[]           // CO → each specialist
  stageNodes: StageNode[] // 15 lifecycle nodes for the StageRail
  coordinatorActive: boolean  // true only when no specialist is active (between stages)
}

export function toOrchestrationModel(
  execution: ExecutionState,       // from the Zustand store
  agentDefs: readonly AgentDef[],  // AGENT_DEFS, injected (C3) — no office/ import
  layout: AgentLayout,             // M2: hand-tuned positions, injected (viz/layout.ts)
): OrchestrationModel
```

**Derivation rules (implement exactly):**

1. **Do NOT extract `AGENT_DEFS`. (C3 — supersedes the original rule 1.)** Extracting it out
   of `office/page.tsx` creates a circular import (`page → MissionControl → adapter → page`).
   Instead use **dependency injection**: `toOrchestrationModel(execution, agentDefs)` takes
   `agentDefs` as a parameter; `office/page.tsx` passes `AGENT_DEFS` down as a prop in M3. The
   adapter imports **nothing** from `office/`. Extraction to `src/lib/agents.ts` is a
   post-Mission-Control cleanup, not now.
2. **Active agent** = the agent whose `stages[]` includes `currentStage`, **only when
   `runState === 'running'`**. Ownership is 1:1 (verified M0), so exactly one matches. This may
   be a specialist or the Coordinator (C1).
3. **Done** = the agent owns ≥1 stage with `completedAt` (id-based, primary signal).
   `agentsByStage` class-name matching via `CLASSNAME_TO_ID` is a **secondary reinforcement
   only** — the runtime emits class names (`ProductStrategyAgent`, …), not the short ids.
4. **Waiting** = everything else.
5. **Run state (C2 — new; prevents a real bug).** There is no `isRunning` field; derive it:
   `running` = some stage has `startedAt && !completedAt`; `complete` = nothing in progress;
   `empty` = no stage has `startedAt`. **Staleness guard:** if `metrics.lastUpdated` is older
   than 2 minutes, treat as not-running (otherwise AR, owner of stage 14, breathes forever
   after the run ends). `coordinatorActive` is simply `activeAgentId === 'CO'`.
6. **Stage node state** = `current` if index === `currentStage` while running (and not yet
   complete); else `low-confidence` if `completedAt && confidence === 'low'` (amber, overrides
   `done`); else `done` if `completedAt`; else `pending`. **The rail is 15 nodes (0–14) — C4.**
   Never size it from `metrics.totalStages`, which reports 14.
7. **CodeAgent (C5).** `CodeAgent` is a real runtime contributor (stages 11/12/14) but is
   **not** one of the six graph roles → `CLASSNAME_TO_ID['CodeAgent'] = null`. The graph stays
   six nodes; CodeAgent surfaces later in `ActivityStream` / contributor lists, never as a node.
8. **Node positions** are computed, not hardcoded: CO at optical center (slightly above
   geometric center); the 5 specialists on an arc around it, grouped by their `zone`
   (STRATEGY left, EXECUTION center, QA right). Organic arc, **not a rigid grid** — a grid
   reads as an org chart, an arc reads as a team.

**Before writing this adapter, log the store's actual `stages` / `agents` / `metrics` shape
once and confirm it against these rules.** Do not build on an assumed shape. (Foundation
lesson: reality overrides documentation.)

---

## 6. COMPONENTS TO BUILD (all in `src/components/viz/` — shared, reusable)

Every one of these must be usable by Intelligence & Quality and Insights & Performance later.
None may import from `office/`.

| File | Purpose | Reused later by |
|---|---|---|
| `OrchestrationCanvas.tsx` | XYFlow wrapper: `<ReactFlow>` + provider, custom node/edge types registered, `fitView`, pan/zoom, no minimap, no attribution clutter. Accepts `nodes`/`edges` as props — knows nothing about journey-state. | I&Q (dependency & lineage graphs) |
| `CoordinatorNode.tsx` | The hexagon. Custom XYFlow node. | I&Q |
| `AgentNode.tsx` | The circle. Custom XYFlow node. Handles all three states + selection ring. | I&Q |
| `FlowEdge.tsx` | Custom bezier edge. Variants: active (solid + CSS dash-flow), waiting (dashed), blocked (severed). | I&Q |
| `StageRail.tsx` | 15 lifecycle nodes, horizontal, clickable, four states. | I&Q (quality per stage), I&P (duration per stage) |
| `MetricGrid.tsx` | Grid of Foundation `StatBlock`s. Max 4. Enforces the so-what rule. | I&Q, I&P |
| `ActivityStream.tsx` | Reverse-chronological event list from `execution.events`. Mono. Staggered entry. | I&Q (decision log), I&P (run history) |
| `VitalsBand.tsx` | Thin mono text strip. ≤36px. No cards. | I&Q, I&P |

**XYFlow + Framer Motion gotcha (lock this in):** XYFlow sets `transform` on the node
wrapper to position nodes. **Never apply a Framer Motion transform to the node wrapper** —
it will fight XYFlow and cause jitter. Animate only *inner* elements of the node
(the inner circle's scale, the glow's opacity). This is non-negotiable.

---

## 7. MOTION MAPPING (Foundation §6 primitives — no new animations)

| Primitive | Where it fires | Trigger |
|---|---|---|
| `breathe` | The single active node (specialist, or CO between stages) — inner element only | `status === 'active'` |
| `handoffTransition` | The active edge's `strokeDashoffset` — **via CSS animation, not JS** | Edge is CO→active-specialist |
| `propagate` | One-shot ripple from an agent node | Store detects `currentStage` advanced (stage completed) |
| `reveal` + `staggerParent` | `ActivityStream` items, `MetricGrid` on mount | Mount / new event |
| `settle` | **Unused in Mission Control v1.** It was designed for a different composition. Do not force it. | — |

**Motion stops entirely when nothing is working.** Run complete or idle → no breathe, no
dash-flow, no ripple. A still screen is the honest signal that no cognition is happening.

---

## 8. SELECTION (proving the contract)

- Click an agent node → `select({ id: agent.id, kind: 'agent' })`
- Click a stage rail node → `select({ id: String(stageIndex), kind: 'stage' })`
- Click empty canvas → `select(null)`
- The selected entity renders the **selection ring** (2px `--ig-emerald-muted`) — visually
  distinct from hover (surface lightens), focus (focus ring), and active-work (glow + breathe).
- `ActivityStream` and `MetricGrid` **subscribe** to `store.selected` and dim non-matching
  content when a selection is active. Nothing holds its own selection state.

This is the mechanism that will later make Intelligence & Quality open already-focused on
whatever you selected here. Building it now is what makes "one system, three lenses" real
rather than aspirational.

---

## 9. STATES (Foundation seven-state contract)

| State | What renders |
|---|---|
| **Empty (no run)** | **The full graph renders at rest** — hexagon + 5 circles, all dimmed/outlined, all edges dashed, stage rail all pending. No glow, no motion. Caption near the CO: *"Run an idea to see the organization work."* **Never a blank page. Never a spinner.** |
| **Loading (first fetch)** | Skeleton nodes in the graph's layout positions. Not a spinner. |
| **Active** | §3/§4 exactly. One alive element. |
| **Low confidence** | The stage rail node is amber. The `VitalsBand` names it. Nothing alarms. |
| **Error** | `VitalsBand` shows plain-language cause + a next action. No stack trace, ever. |
| **Complete** | All stage nodes emerald. All agents `done`. **All motion stops.** One single left-to-right emerald sweep across the stage rail (400ms, once, never repeated). Quiet completeness — no confetti. |
| **Stale** | Stage nodes for superseded artifacts render muted (`--ig-stale`). |

---

## 10. IMPLEMENTATION BATCHES

Additive. TypeScript-gated. Checkpoint-tagged. `office/page.tsx` touched only in M3.

**M0 — Pre-flight**
- Tag `v5.2-pre-mission-control`, push.
- Confirm `@xyflow/react` and `framer-motion` are installed (they are — F0). Install nothing.
- Log the store's actual `stages`/`agents`/`metrics`/`events` shape once. Report it. This
  informs the adapter and is the "verify reality" gate.
- **Acceptance:** tag on origin, store shape reported, 0 TS errors.

**M1 — Adapter + agent registry**
- Extract `AGENT_DEFS` from `office/page.tsx` → `src/lib/execution/agents.ts`; import it back
  into `office/page.tsx` (single-source-of-truth; the only permitted refactor there).
- Build `src/lib/execution/adapters/orchestration.ts` per §5.
- **Acceptance:** adapter returns correct nodes/edges/stageNodes for the live run; exactly one
  agent is `active` (or CO is, between stages) — never zero, never two. 0 TS errors.

**M2 — Viz primitives, standalone**
- Build all eight components from §6 on a scratch route (`/mc-scratch`). Do **not** touch
  `office/page.tsx`.
- Render them against real adapter output.
- **Acceptance:** graph renders with hexagon CO + 5 circles, correct grammar colors/states,
  edges bezier and legible, stage rail correct, no console errors. 0 TS errors. Commit.

**M3 — Integration (the risky batch)**
- Read `office/page.tsx` completely. Do **not** print it back.
- Replace **only the children of the analytics wrapper** with the Mission Control composition
  (§2), assembled from `WorkspaceLayout` / `HeroSlot` / `Panel`.
- Deprecate (don't delete) `OrchestrationGraph`, `ExecutionSummary`, `LiveLogStream`.
- **Verify the Phaser wrapper is byte-identical** — `git diff` must show zero changes to the
  agent-activity div, the toggle, or the `PhaserGame` render.
- **Acceptance:** Analytics tab shows Mission Control; Agent Activity tab still shows Phaser,
  no flicker, no re-init on toggle; `/desk` and `/improve` unaffected. Delete `/mc-scratch`.
  0 TS errors. **Show the diff before committing.**

**M4 — Motion + selection**
- Wire the motion primitives (§7) and the selection contract (§8).
- **Acceptance:** exactly one node breathes at any instant; edge dash-flow only on the active
  edge; ripple fires once per stage completion; selecting a node/stage updates the store and
  the ring renders; motion fully stops when the run is idle or complete.

**M5 — Verify + tag**
- `npx tsc --noEmit` clean; `npm run build` succeeds.
- **The manual gate (mandatory, human):** Run a lifecycle end-to-end · Stop mid-run and confirm
  the lock file clears · Improve an artifact and Accept · New Idea and confirm the workspace
  resets · Model selector drives the real call · Desk / Office / Improve all still work.
- Tag `v5.3-mission-control`, push. Produce a summary of files, commits, and deviations.

**Stop conditions:** any protected file in a diff; Phaser re-initializes or flickers on toggle;
any regression in the manual gate; a TypeScript error that can't be fixed additively.

**Context rule:** at ~75% context, stop cleanly mid-batch, commit what's complete, and produce
a continuation handoff. Do not attempt one more batch.

---

## 11. HUMAN REVIEW — what Claude Code cannot get right alone

Run this in the browser after M4. This is the difference between premium and almost-premium.

**Motion tuning (~1h)**
- [ ] Does `breathe` read as *alive*, or as *pulsing*? (Tune amplitude `1.03` / duration `2.4s`.)
- [ ] Does the edge dash-flow read as *work moving*, or as a *barber pole*? (Tune dash gap + speed.)
- [ ] Does the ripple read as *confidence resolving*, or as a *click effect*?
- [ ] Is more than one thing ever moving at once? → **Must be no.**
- [ ] Does everything go completely still when the run is idle/complete? → **Must be yes.**

**Graph readability (~30m)**
- [ ] Is the hexagon Coordinator distinguishable from the circles *at a glance*, without reading?
- [ ] Are the edges legible, or a tangle? (Tune bezier curvature.)
- [ ] Is the active agent unambiguous — could a stranger point to "who's working" in 2 seconds?
- [ ] At rest (empty state), does the graph read as *an organization waiting*, or as *broken*?

**Composition (~30m)**
- [ ] Cover the graph with your hand. Does the screen lose its center? (It should.)
- [ ] Does anything in the supporting column compete with the hero for attention? (It shouldn't.)
- [ ] Is the whitespace around the graph generous, or is it crowded?
- [ ] Vitals: still a text band, or has it crept toward looking like cards? (It must not.)

**The final test — the only one that matters:**
> Show someone the Analytics tab for five seconds. Ask what they saw. If they say
> *"a dashboard,"* we failed. If they say *"a team working on something,"* we succeeded.

---

*Mission Control v1 — the first flagship experience.*
*Grammar is law. One thing is alive. The engine is untouched. Phaser never unmounts.*
