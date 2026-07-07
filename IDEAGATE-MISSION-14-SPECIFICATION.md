# IDEAGATE-MISSION-14-SPECIFICATION.md
# Mission 14 — Premium UI Foundation & Platform Shell
# Version 1.0 | July 2026
# Status: PLANNING — awaiting owner approval before any code is written
# Governing methodology: MES-V1 (documentation-first, phased, additive, regression-safe)

---

## 0. DOCUMENT PURPOSE AND READING ORDER

This is the scope contract for Mission 14. It defines what is in, what is out, the
experience the product must deliver, the phases and their gates, the risk register, the
protected-file exceptions, and the rollback strategy. It is the first of five Mission 14
documents and every other document references it.

Mission 14 document set (each approved before the next is written):
1. IDEAGATE-MISSION-14-SPECIFICATION.md      ← this document (scope + experience contract)
2. IDEAGATE-MISSION-14-DESIGN-SYSTEM.md       (visual + component contract)
3. IDEAGATE-MISSION-14-IMPLEMENTATION-PLAN.md (file-by-file engineering plan)
4. IDEAGATE-MISSION-14-CLAUDE-CODE-RUNBOOK.md (checkpoint prompts + verification gates)
5. IDEAGATE-MISSION-14-STARTER-PROMPT.md      (Claude Code session opener)

This document does not contain implementation code. Per the v4.0 system instructions,
planning happens in Claude chat; implementation happens in Claude Code.

---

## 1. MISSION STATEMENT

**One sentence:** Transform IdeaGate from three functional-but-generic pages into one
coherent, premium, platform-grade Product Management Operating System — establishing a
global application shell, a live orchestration analytics experience, and a design system —
without breaking a single working behaviour and without adding any capability the engine
does not already support.

**What this mission is:** A UI and experience mission. It makes what already works look
and feel like the premium product it is, and it adds exactly one genuinely new capability —
the Office Analytics orchestration view — using data the engine already produces.

**What this mission is not:** It is not a feature mission. It adds no lifecycle stages, no
agents, no auth, no database, no cloud deployment, no upload capability, no collaboration.
It does not rebuild the coordinator. It does not change how artifacts are generated.

---

## 2. WHY THIS MISSION EXISTS (the gap it closes)

IdeaGate's engine is strong. Its 14-stage lifecycle produces genuinely senior-quality PM
artifacts. But the current UI *undersells* that sophistication. A recruiter looking at the
current Desk for twelve minutes cannot tell, from the visual alone, that they are looking at
a multi-agent orchestration system producing enforced, validated, structured output.

The gap is not features. The gap is legibility and credibility. Mission 14 closes it by
making the system's real sophistication visible: the pipeline becomes a living node chain,
the agents become a live orchestration graph fed by the real execution stream, the artifacts
become quality-scored cards, and the whole product gains a consistent premium shell.

This is a portfolio-critical mission. Its audiences are, in priority order: recruiters and
hiring managers (12-minute impression window), the owner running live interview demos, and
eventually 20-25 invited beta users (Mission 17+).

---

## 3. EXPERIENCE PRINCIPLES (the spine of this mission — testable, not decorative)

These principles govern every screen, component, and interaction in Mission 14. They are not
aspirations. Each is a gate criterion: a component or phase does not pass its checkpoint until
it satisfies the principles that apply to it. The Implementation Plan converts each into a
concrete per-component checklist item.

**EP-1 — One question per screen.**
Every primary screen answers exactly one clear Product Management question. Any element that
does not serve that screen's question is cut or moved.
- Desk answers: "What did the system produce, and how good is it?"
- Office answers: "How did the agents produce it, and what happened during the run?"
- Studio answers: "How do I make this specific artifact better?"

**EP-2 — Motion means state.**
No decorative animation. Every animation communicates a real, meaningful system state: a
pulsing node means active work, a travelling edge dot means context transfer between agents,
a ticking counter means real tokens/cost accruing. If a motion does not map to a system fact,
it is removed. This is both a premium-feel rule and a performance rule.

**EP-3 — Every number is real.**
No mocked metrics, ever. Every value displayed traces to journey.json, the live SSE stream,
GlobalStore, or RuntimeContext. If data for a metric does not exist, the metric shows an
honest empty state — it is never faked to look impressive. Faking data is the fastest way to
look junior and the fastest way to fail a live demo follow-up question.

**EP-4 — Empty states educate.**
Every empty state teaches the user what will appear and how to make it appear, rather than
merely reporting absence. "No active run — enter an idea and press Run to see the 14-stage
pipeline execute" is correct. "No data" is not.

**EP-5 — Loading states reassure.**
Every loading state communicates that the system is working and roughly what it is doing,
never leaving the user unsure whether the product is alive. Loading states reference the real
operation in progress wherever possible.

**EP-6 — Interactions reduce cognitive load.**
Progressive disclosure is the default: one primary answer visible, detail on demand. The user
is never shown everything at once. Secondary information is one click, hover, or expand away.

**EP-7 — One coherent platform.**
Every view reinforces that IdeaGate is a single operating system, not a collection of pages.
The shell (nav rail, status bar, type system, colour) is identical everywhere. Navigating
between Desk, Studio, and Office feels like moving rooms in one building, not opening three
different apps.

**EP-8 — Reasoning is visible, not just results.**
Wherever the coordinator made a decision (stage confidence, go/no-go, conflicts noted), that
reasoning is surfaced to the user — not buried. IdeaGate's differentiator is that it *thinks*
in a structured way; the UI must show the thinking, not only the output. This data already
exists in journey.json and is currently invisible. Making it visible is Mission 14's single
largest untapped credibility gain.

---

## 4. ARCHITECTURAL DECISIONS (confirmed, with reasoning)

These decisions are locked for Mission 14. Each has been evaluated against the alternative.

**AD-1 — Left navigation rail replaces horizontal tab navigation.**
Reason: separates navigation identity from command execution. The current TopBar does two
jobs (navigation + run controls) and does neither with full clarity. A permanent left rail
gives the product a persistent identity and matches every premium reference. The three tabs
(Desk/Studio/Office) become rail items. TopBar becomes a pure command bar.

**AD-2 — Global application shell before any page redesign.**
Reason: the shell (rail, status bar, layout) is established and verified once, in Phase 1.
Every subsequent phase fills content into a fixed, stable chrome. This prevents relayout work
being done repeatedly and guarantees platform coherence (EP-7).

**AD-3 — Bottom status bar, slot-based.**
Reason: a persistent strip showing live model/execution/cost data communicates that real work
is happening (EP-2, EP-3). Slot-based layout (left/center/right zones) reserves space for
future context (workspace, execution mode, environment) without future relayout.

**AD-4 — Analytics is the default Office experience; Agent Activity (pixel art) is preserved
as a switchable secondary view.**
Reason: the live orchestration graph is the credibility anchor a recruiter should see first.
The pixel art is a genuine differentiator and memorable demo moment — it is never removed,
only moved to secondary. Confirmed and locked.

**AD-5 — Design tokens before component implementation.**
Reason: establishing the token system (colour, spacing, radius, shadow, motion, type) in
Phase 0 means every component speaks one visual language. Retrofitting consistency later is
expensive; establishing it first is nearly free.

**AD-6 — Standalone components before protected-file integration.**
Reason: every new component is built and TypeScript-verified as an isolated file before any
existing page (especially protected desk/page.tsx and office/page.tsx) is touched. Blast
radius stays at one new file until integration. This is the core regression-safety mechanism.

**AD-7 — Additive implementation, never replacement.**
Reason: new components are inserted alongside working logic, not swapped for it. Artifact
loading, SSE subscription, polling, the Mission 13 dismissal latch, the improve flow — all
remain untouched at the logic level. Only presentation changes.

**AD-8 — Phase 0 engine cleanup before premium UI.**
Reason: building premium UI on an engine that wastes 28 API calls per run (P-NEW-18) and
silently swaps the user's model choice (P-NEW-19) would raise expectations the runtime then
violates in a live demo. The engine is made honest and fast first, then made beautiful.

**AD-9 — Data-driven agent graph, not hardcoded.**
Reason: the orchestration graph renders from an AGENTS registry array (six entries today),
not hardcoded node positions. Adding a future agent is one array entry, zero component
changes. Costs nothing in Mission 14, removes a future redesign. The *render* is six agents
because the system genuinely has six; the *model* is extensible.

**AD-10 — Navigation and status bar reserve extension space.**
Reason: NavRail renders from a NAV_ITEMS array with a "core" section (Desk/Studio/Office) and
a reserved, empty "platform" section (future: Library, Templates, Reports, Knowledge). Status
bar reserves slots. The IA is sectioned for growth without building any of it now.

**AD-11 — Studio treats its subject as a context envelope, not a raw string.**
Reason: the single forward-accommodation Studio needs. The improve call operates on
`{ primary, attachments[], references[] }` where attachments and references are always empty
in Mission 14. Mission 16 can populate them (uploads, attached artifacts, references) without
redesigning the improve flow. This is one type-shape decision, not a feature.

**AD-12 — Routing reserves an outer boundary without building it.**
Reason: the app shell is structured so a future unauthenticated outer layer (landing at `/`,
authenticated tree under the app shell) can be nested later without rewriting the shell.
Mission 14 renders everything at current routes. Mission 17 adds the boundary. The shell does
not hardcode assumptions that would make that a rewrite.

---

## 5. PHASE STRUCTURE

Mission 14 executes in five phases with a hard verification gate between each. No phase begins
until the previous phase's gate is confirmed by the owner. Phases map to batches in the
Implementation Plan; batches map to checkpoints in the Runbook.

```
Phase 0 — Engine Foundation & Safe Build Baseline
Phase 1 — Global Application Shell (NavRail, StatusBar, layout, TopBar refinement)
Phase 2 — Desk Command Center (LifecycleNodeChain, ArtifactCard, RunInsightPanel)
Phase 3 — Office Analytics (OrchestrationGraph, ExecutionSummary, LiveLogStream, tab switch)
Phase 4 — Studio Premium (VersionTimeline, ImprovementMetrics, context envelope, motion)
Final   — Documentation sync + release tag v4.3-premium-ui
```

### Phase 0 — Engine Foundation & Safe Build Baseline

**Objective:** Make the engine honest and fast, install UI dependencies, establish design
tokens. Nothing visual is built until this phase is verified clean.

**In scope:**
- coordinator-v2.js (PROTECTED — explicit Phase 0 exception): replace `openrouter/owl-alpha`
  at lines 213 and 379 with `nvidia/nemotron-3-super-120b-a12b:free` (P-NEW-18). Two string
  literal replacements only. No logic change.
- model-registry.ts: correct the xAI Grok model ID at line 412 (P-NEW-19) after verifying the
  correct slug at openrouter.ai/models. One field change.
- package.json: add framer-motion and recharts. npm install. Verify TypeScript 0 errors.
- globals.css: add the design token custom-property block (additive — nothing reads it yet).

**Out of scope:** any component, any page change, any layout change.

**Gate criteria:** TypeScript 0 errors; dev server builds and all three pages load; a full
14-stage lifecycle run shows zero owl-alpha 404s in OpenRouter logs and nemotron-3-super
serving directly; framer-motion and recharts import cleanly in a throwaway test component that
is then removed; rollback tag `v4.3-pre-m14` created and pushed.

### Phase 1 — Global Application Shell

**Objective:** Establish the permanent premium chrome. After Phase 1 the layout is complete
and stable; every later phase fills content into it.

**In scope (all new files except the two noted):**
- NavRail.tsx (new): left rail, data-driven from NAV_ITEMS with reserved platform section.
- StatusBar.tsx (new): bottom slot-based strip, live model/execution/cost from existing state.
- layout.tsx (MODIFIED, root layout — not on protected list): wrap children in app-shell with
  NavRail and StatusBar. Page components themselves untouched.
- TopBar.tsx (MODIFIED — not on protected list): remove the tab-navigation links (they move to
  NavRail). Keep model selector, Run, Stop, New Idea, idea input, stage banner untouched.

**Out of scope:** any change to page content, artifact logic, run logic.

**Gate criteria:** all three pages load without visual regression; NavRail highlights active
route; TopBar model selection + Run + Stop + New Idea all function identically to the
v4.2-stable baseline; StatusBar shows honest empty state on load and populates during a run; a
full lifecycle completes all 14 stages; Mission 13 features (New Idea reset, Stop, Settings
model selector) verified intact; TypeScript 0 errors.

### Phase 2 — Desk Command Center

**Objective:** Make the Desk a lifecycle command center. Information architecture unchanged;
visual language becomes premium; coordinator reasoning becomes visible (EP-8).

**In scope:**
- LifecycleNodeChain.tsx (new): horizontal 15-node pipeline reading journey.json; per-node
  status, agent, duration, confidence; click navigates to artifact.
- ArtifactCard.tsx (new): replaces flat artifact list items; shows word count, confidence,
  generating agent.
- RunInsightPanel.tsx (new): post-run summary (time, model, cost, tokens, confidence
  breakdown) from journey.json; includes surfaced coordinator reasoning per stage (EP-8).
- desk/page.tsx (PROTECTED — explicit Phase 2 exception): wire in the three new components.
  Additive only. Artifact loading, polling, SSE subscription, RuntimeContext consumption, and
  the Mission 13 dismissal latch are NOT changed.

**Out of scope:** artifact generation logic, the improve flow, any coordinator change.

**Gate criteria:** Desk renders correctly with and without run data; node chain reflects
journey.json accurately; clicking a stage node opens the correct artifact; artifact loading
and Studio hand-off work identically to baseline; dismissal latch still works; TypeScript 0
errors.

### Phase 3 — Office Analytics

**Objective:** Make multi-agent orchestration visible and visceral — the demo's anchor screen.

**In scope:**
- OfficeTabSwitcher.tsx (new): switches Analytics (default) / Agent Activity. Local state only,
  no routing change.
- OrchestrationGraph.tsx (new): SVG graph, data-driven from AGENTS registry (six today);
  coordinator hub + agent nodes; animated edges on active context transfer (EP-2); fed by the
  SSE stream already consumed by the Office page.
- ExecutionSummary.tsx (new): live metric cards from journey.json / RuntimeContext.
- LiveLogStream.tsx (new): scrolling real-event log from the SSE stream; surfaces per-stage
  coordinator decisions (EP-8).
- office/page.tsx (PROTECTED-adjacent — explicit Phase 3 exception): add tab switching; render
  Analytics as default; preserve the existing pixel art Phaser view as the secondary tab.
  Critical constraint: Phaser initializes once; tab switch toggles visibility (CSS display),
  it does not re-initialize the canvas.

**Out of scope:** any change to the pixel art scene logic itself; any new agent.

**Gate criteria:** Analytics renders in empty and post-run states; Agent Activity renders pixel
art unchanged and Phaser does not re-initialize on tab switch; SVG graph reflects live run
state; log stream populates during a run; TypeScript 0 errors.

### Phase 4 — Studio Premium

**Objective:** Bring Studio to visual parity and establish the context-envelope seam (AD-11).

**In scope:**
- improve/page.tsx (MODIFIED — not on protected list): rename displayed label Improve → Studio
  (URL stays /improve, no redirect, no file rename); add Framer Motion transitions between
  idle/loading/split-view states.
- VersionTimeline.tsx (new): navigable version history reading existing versioned artifact
  files.
- ImprovementMetrics.tsx (new): quality delta (word/token delta, frameworks added) from the
  existing improve response.
- Context envelope: structure the improve request as `{ primary, attachments[], references[] }`
  with attachments/references always empty in Mission 14. Seam only — no upload UI.

**Out of scope:** uploads, attachments UI, comparison modes, review modes, scoring engines,
approval workflows — all explicitly deferred to Mission 16 and reserved by AD-11.

**Gate criteria:** Studio label correct in NavRail and header; IMPROVE NOW + ACCEPT work
identically to baseline; version timeline loads and switches versions; motion transitions have
no layout shift; full regression across Desk + Studio + Office; TypeScript 0 errors; tag
`v4.3-premium-ui` created and pushed.

---

## 6. EXPLICIT OUT OF SCOPE (scope-creep prevention)

If any batch finds itself touching an item below, STOP and report — do not proceed.

| Item | Why excluded | Where it belongs |
|---|---|---|
| Studio uploads (PDF, PPT, screenshots, spreadsheets, references) | New capability + storage | Mission 16 (reserved by AD-11 envelope) |
| Artifact/version comparison, AI review modes, quality scoring engine | New surfaces + logic | Mission 16 |
| Approval workflow, reviewer comments, reusable snippets/prompt blocks | New collaboration surface | Mission 16+ |
| New specialist agents (e.g. DataAgent) | Coordinator change | Future (graph already extensible via AD-9) |
| Auth, login, workspace selection, landing page | New outer layer | Mission 17 / 19 (reserved by AD-12) |
| Database / persistence / cloud storage | Infrastructure | Mission 17 |
| Team collaboration, org workspaces, RBAC | Multi-tenant scope | Post-Mission-20 |
| Mermaid diagrams / RICE tables in artifacts (artifact intelligence) | Lifecycle prompt change | Mission 15 |
| Continue/Resume for stalled runs (P-NEW-5) | Coordinator state change | Mission 16 |
| Nav items: Library, Templates, Reports, Knowledge, Portfolio | Future workspaces | Future (IA reserved by AD-10) |
| Status bar: workspace/mode/environment fields | Future context | Future (slots reserved by AD-3) |
| Cost display in model dropdown | GenerationLog dependency | Future |
| Provider logo image assets | Cosmetic | Future polish |

---

## 7. PROTECTED FILE EXCEPTIONS

Three protected or sensitive files are touched in Mission 14. Each is explicitly scoped here
and governed by the full exception protocol below.

| File | Phase | Change | Nature |
|---|---|---|---|
| coordinator-v2.js | 0 | Two string-literal fallback replacements (lines 213, 379) | Engine fix, no logic change |
| desk/page.tsx | 2 | Insert three new components; wire props | Additive; core logic untouched |
| office/page.tsx | 3 | Add tab switcher; render Analytics default; preserve pixel art | Additive; Phaser init untouched |

**Exception protocol (applies to each protected-file change):**
1. Rollback tag created and pushed BEFORE the first edit to that file.
2. The file is read completely and relevant sections quoted before any change is proposed.
3. Changes are additive; existing logic is not rewritten.
4. TypeScript verified 0 errors after each change.
5. A manual smoke test of the affected page is confirmed by the owner before the commit.
6. If any verification fails, STOP and report — no workaround, no proceeding.

---

## 8. RISK REGISTER

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-1 | coordinator-v2.js edit breaks the lifecycle | Low | Critical | Two-string-only change; rollback tag; full lifecycle smoke test before push (Phase 0 gate) |
| R-2 | Grok slug still wrong after fix | Low | Low | Verify at openrouter.ai/models before editing; smoke test with Grok selected |
| R-3 | New dependency (framer-motion/recharts) introduces TS or build conflict | Low | Medium | Installed and verified in Phase 0 before any component uses them; throwaway test import |
| R-4 | layout.tsx shell change disrupts Next.js route nesting | Medium | Medium | Read app/ directory structure first; shell wraps children without changing page internals; per-page load test at Phase 1 gate |
| R-5 | desk/page.tsx integration disrupts polling/SSE/dismissal latch | Medium | High | Components built standalone first (AD-6); additive insertion only; dismissal latch explicitly re-tested at Phase 2 gate |
| R-6 | office/page.tsx tab switch re-initializes Phaser (crash / perf) | Medium | High | Phaser renders once; tab switch toggles CSS visibility, never unmounts the canvas; explicit gate test |
| R-7 | SVG orchestration graph performance on animation | Low | Low | CSS/SVG only (no WebGL); ≤7 nodes; motion only during active run (EP-2) |
| R-8 | Scope creep into Studio uploads / comparison | Medium | Medium | Section 6 hard boundary; AD-11 envelope satisfies future need without building it |
| R-9 | Visual inconsistency across phases | Low | Medium | Design tokens locked in Phase 0 (AD-5); Component Philosophy contract in Design System |
| R-10 | A demo metric shows fake data | Low | High | EP-3 forbids mocked metrics; every value traced to a real source at each component gate |

---

## 9. ROLLBACK STRATEGY

- `v4.2-stable` is the pre-mission baseline (Mission 13 close). Full restore point.
- `v4.3-pre-m14` is created in Phase 0 before the first production edit. Restore with
  `git reset --hard v4.3-pre-m14`.
- Each protected-file phase (2, 3) creates its own pre-edit checkpoint tag before touching the
  protected file.
- Because every phase is additive and standalone components precede integration, a failed phase
  can be reverted to its pre-phase tag without affecting earlier completed phases.
- `v4.3-premium-ui` is created only at the Final gate, after full regression passes.

---

## 10. COST CONSTRAINT (locked)

Every Mission 14 addition is zero-cost or near-zero-cost and free-to-run:
- All UI is CSS, SVG, Framer Motion, and Recharts — all free, all in-bundle.
- No Three.js, no WebGL, no paid rendering, no paid services.
- No new API costs — all new views read data the engine already produces (journey.json, SSE).
- The only project spend remains the custom domain (Mission 19) and pay-per-token OpenRouter
  usage that already exists.

---

## 11. SUCCESS CRITERIA (Mission 14 is complete when all are true)

**Engine (Phase 0):**
- No API call routes to openrouter/owl-alpha anywhere (registry or coordinator).
- A lifecycle run shows zero owl-alpha 404s and the selected model serving directly.
- Selecting a valid model runs that model (Grok fix verified).

**Shell (Phase 1):**
- Left nav rail present on all pages, highlights active route, renders from NAV_ITEMS.
- Status bar present, slot-based, shows real data during a run and honest empty state at rest.
- TopBar is a pure command bar; all run controls function identically to baseline.

**Desk (Phase 2):**
- Lifecycle node chain renders real journey.json state; nodes are navigable.
- Artifacts render as quality-scored cards.
- Run insight panel surfaces coordinator reasoning (EP-8).

**Office (Phase 3):**
- Analytics is the default Office view; orchestration graph reflects live run state.
- Agent Activity (pixel art) preserved and switchable; Phaser does not re-initialize on switch.
- Live log stream shows real events including coordinator decisions.

**Studio (Phase 4):**
- Labelled "Studio"; improve + accept + version tracking work identically to baseline.
- Version timeline navigable; improvement metrics show real deltas.
- Improve request uses the context-envelope shape (attachments/references empty).

**Experience (all phases):**
- Every EP-1 through EP-8 principle satisfied at each relevant component gate.
- No mocked data anywhere (EP-3).
- Every empty and loading state educates/reassures (EP-4, EP-5).

**Engineering (all phases):**
- TypeScript 0 errors at every gate.
- Every protected-file change followed the exception protocol.
- Full regression (Desk lifecycle, Studio improve, Office analytics) passes.
- Tag `v4.3-premium-ui` created and pushed.
- Documentation synced: STATE-NOW, MASTER-TODO, ENGINEERING_STATUS updated.

---

## 12. WHAT THIS MISSION DELIBERATELY LEAVES FOR LATER (extensibility ledger)

Recorded so future missions inherit a flexible foundation, not a redesign:
- Agent graph is data-driven (AD-9) → future agents are array entries.
- Nav IA is sectioned (AD-10) → future workspaces (Library, Reports…) drop into the reserved
  platform section.
- Status bar is slot-based (AD-3) → future context (workspace, mode, environment) drops into
  reserved slots.
- Studio operates on a context envelope (AD-11) → future uploads/attachments/references
  populate existing fields.
- App shell reserves an outer routing boundary (AD-12) → future landing/auth nests without
  shell rewrite.

None of the above is built in Mission 14. All of it is made cheap for later.

---

*Mission 14 Specification v1.0 | July 2026*
*Next document: IDEAGATE-MISSION-14-DESIGN-SYSTEM.md (written only after this is approved)*
*No code is written until all five Mission 14 documents are approved.*
