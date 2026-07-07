# IDEAGATE-MISSION-14-IMPLEMENTATION-PLAN.md
# Mission 14 — Implementation Plan
# Version 1.0 | July 2026
# Status: PLANNING — approve after Design System, before Runbook
# Depends on: SPECIFICATION.md (scope, phases, EPs) + DESIGN-SYSTEM.md (tokens, components)

---

## 0. PURPOSE AND CONTRACT

This is the engineering contract for Mission 14. It defines, phase by phase and file by file:
what is created, what is modified, the exact props interface for every new component, the
batch boundaries, the seven-state requirement per component, and the regression checklist at
each gate. Its job is to make Claude Code execution deterministic — no invented file paths, no
invented prop names, no guessed structure.

**Governing rules (from Specification + MES-V1):**
- Standalone components are built and TypeScript-verified BEFORE any existing page is touched
  (Specification AD-6). Blast radius stays at one new file until integration.
- Every component implements all seven states: loading / empty / success / running / partial /
  warning / error (Design System §10).
- Every value displayed traces to a real source — journey.json, SSE, GlobalStore,
  RuntimeContext (EP-3). No mocked data.
- Protected-file changes (coordinator-v2.js P0, desk/page.tsx P2, office/page.tsx P3) follow
  the exception protocol (Specification §7).
- Tokens only — no hardcoded colours, spacing, radius, or durations. Everything references the
  CSS custom properties from Design System §6-8.

**Repository paths (from STATE-NOW):**
- CLI Engine: `/Users/apple/idea-gate-ui-safe/`
- UI Layer:   `/Users/apple/agent-zero-data/workdir/ui-layer/`

---

## 1. BATCH MAP (14 batches + final)

```
PHASE 0 — Engine Foundation
  Batch 0A: coordinator-v2.js fallback fix (P-NEW-18) + lifecycle smoke test
  Batch 0B: model-registry.ts Grok fix (P-NEW-19) + deps install + design tokens + verify

PHASE 1 — Global Shell
  Batch 1A: NavRail component + layout.tsx shell integration
  Batch 1B: StatusBar component + layout.tsx integration
  Batch 1C: CommandPalette (Cmd+K) component + wiring
  Batch 1D: TopBar tab removal + full Phase 1 regression

PHASE 2 — Desk Command Center
  Batch 2A: LifecycleNodeChain (standalone)
  Batch 2B: ArtifactCard + RunInsightPanel (standalone)
  Batch 2C: desk/page.tsx integration (PROTECTED — exception protocol)

PHASE 3 — Office Analytics
  Batch 3A: OrchestrationGraph (standalone)
  Batch 3B: ExecutionSummary + LiveLogStream + OfficeTabSwitcher (standalone)
  Batch 3C: office/page.tsx integration (PROTECTED-adjacent — exception protocol)

PHASE 4 — Studio Premium
  Batch 4A: VersionTimeline + ImprovementMetrics (standalone)
  Batch 4B: improve/page.tsx integration + context envelope + motion + Studio rename

FINAL
  Batch F: Documentation sync + tag v4.3-premium-ui
```

One batch = one MES-V1 checkpoint = one STOP for owner approval.

---

## 2. PHASE 0 — ENGINE FOUNDATION

### Batch 0A — Coordinator fallback fix (P-NEW-18)

**Pre-flight:** create and push rollback tag `v4.3-pre-m14` BEFORE any edit.

**File (PROTECTED — Phase 0 exception):**
`/Users/apple/idea-gate-ui-safe/src/core/coordinator-v2.js`

**Procedure:**
1. Read the file completely. Quote lines around 213 and 379.
2. Confirm both contain the literal `'openrouter/owl-alpha'` as a fallback string.
3. Replace both occurrences with `'nvidia/nemotron-3-super-120b-a12b:free'`.
4. Change nothing else. No logic, no structure, no additional lines.

**Verify:**
- `grep -n "owl-alpha" coordinator-v2.js` → returns nothing.
- Run a full 14-stage lifecycle. OpenRouter logs show zero owl-alpha 404 attempts; the
  selected model (or nemotron-3-super) serves directly on first attempt.
- Confirm the ~2 minutes of per-run retry waste is eliminated (compare run duration to the
  Mission 13 baseline 19m27s — expect materially faster).

**Commit:** `fix(coordinator): replace owl-alpha fallback with nemotron-3-super (P-NEW-18)`
Do not push until smoke test confirmed by owner.

### Batch 0B — Grok fix + dependencies + design tokens

**File 1 (not protected):** `.../ui-layer/src/lib/model-registry.ts`
- Before editing: verify the correct OpenRouter slug for xAI Grok 4.1 Fast at
  openrouter.ai/models. Report the confirmed slug.
- Update the `modelId` field for that entry (line ~412) to the confirmed slug. One field only.

**File 2:** `.../ui-layer/package.json`
- Add `framer-motion` (^11) and `recharts` (^2). Run `npm install`.
- Verify: `npx tsc --noEmit` → 0 errors. Dev server starts. All three pages load.
- Create a throwaway component importing both, confirm it compiles, then delete it.

**File 3:** `.../ui-layer/src/app/globals.css`
- Append the complete design-token custom-property block from DESIGN-SYSTEM §6-8
  (surfaces, borders, accent, text, status, spacing, radius, shadows, motion, type).
- Additive only. Nothing reads these yet. Verify no existing style breaks.

**Commits (separate):**
- `fix(model-registry): correct xAI Grok model ID (P-NEW-19)`
- `chore(deps): add framer-motion + recharts for Mission 14`
- `style(tokens): add design system CSS custom properties (Mission 14)`

**Phase 0 gate:** TypeScript 0; lifecycle runs clean with no owl-alpha 404; deps verified;
tokens present in DevTools; `v4.3-pre-m14` pushed. STOP for approval.

---

## 3. PHASE 1 — GLOBAL SHELL

### Batch 1A — NavRail

**Create:** `.../ui-layer/src/components/shell/NavRail.tsx`

```typescript
// NAV_ITEMS drives the rail — adding an item is a data change, not a component change (AD-10)
interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  section: 'core' | 'platform';   // platform section is reserved/empty in Mission 14
}

// Mission 14 NAV_ITEMS:
//   { id:'desk',   label:'Desk',   href:'/desk',    icon: LayoutGrid, section:'core' }
//   { id:'studio', label:'Studio', href:'/improve', icon: PenSquare,  section:'core' }
//   { id:'office', label:'Office', href:'/office',  icon: Activity,   section:'core' }
// PLATFORM section: [] (reserved — do not add Library/Reports/etc in Mission 14)

interface NavRailProps {
  items?: NavItem[];          // defaults to NAV_ITEMS
  activeRunWorkspace?: string | null;  // workspace id with an active run, for subtle indicator
}
```

**Behaviour:** 56px wide; renders core section, divider, then platform section (empty).
Active route (via `usePathname()`) gets 3px left accent bar + `--accent-muted` bg +
`--accent-primary` icon. Inactive `--text-tertiary`. Hover → `--text-secondary` (150ms).
Settings gear bottom-anchored. Tooltip label on hover.

**Seven states:** success (normal); running (active-route dot if a run executes). Others N/A
(nav is not data-loading) — document them as "not applicable, static navigation" explicitly.

**Modify:** `.../ui-layer/src/app/layout.tsx`
- Read completely first. Wrap `{children}` in the app shell:
```
<body>
  <TopBar/>
  <div className="app-shell">   // display:flex; height: calc(100vh - topbar - 32px)
    <NavRail/>
    <main className="content-area">  // flex:1; overflow-y:auto; bg --surface-base
      {children}
    </main>
  </div>
  <StatusBar/>   // added in Batch 1B — placeholder or add now, empty
</body>
```
- Page components themselves are NOT modified. Only the wrapper changes.

**Verify:** all three pages load inside the shell; NavRail highlights active route; navigation
works via Next.js Link (no reload); TypeScript 0.

**Commit:** `feat(shell): add NavRail + app-shell layout (Mission 14 Phase 1)`

### Batch 1B — StatusBar

**Create:** `.../ui-layer/src/components/shell/StatusBar.tsx`

```typescript
// Slot-based — reserved slots for future context (AD-3)
interface StatusBarProps {
  // all data sourced internally from GlobalStore + RuntimeContext; no props required
  // but structured as slots for future extension:
  //   leftSlot:   model indicator (dot + name + provider)
  //   centerSlot: stage counter + elapsed timer   [reserved: workspace, mode]
  //   rightSlot:  tokens + cost + live pulse dot
}
```

**Behaviour:** 32px fixed bottom. Reads: `defaultModel` (GlobalStore → getModelMeta for
display name + cost-tier dot colour), `currentStage`, `sessionTokens`, `sessionCost`,
`isRunning` (RuntimeContext). Values in JetBrains Mono. Pulse dot animates only when
`isRunning`. Counters tick only when `isRunning`.

**Seven states:**
- empty/idle: "No active run", metrics show "—".
- running: live model, stage X/14, ticking tokens/cost, green pulse.
- partial: run stopped mid-way → shows last known stage, static (honest, CT-1).
- error: if a run errored → status dot red, "Run failed" (plain language).
- success: post-run → final metrics static.
- warning: fallback model used → model name shown with subtle amber marker.
- loading: N/A (reads existing state synchronously).

**Modify:** `layout.tsx` — mount `<StatusBar/>` at the bottom (if placeholder from 1A, replace).

**Commit:** `feat(shell): add slot-based StatusBar with live execution metadata (Mission 14)`

### Batch 1C — Command Palette (Cmd+K)

**Create:** `.../ui-layer/src/components/shell/CommandPalette.tsx`

```typescript
interface Command {
  id: string;
  label: string;
  group: 'navigate' | 'run' | 'settings' | 'model';
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // command list built internally from available actions
}

// Mission 14 commands ONLY (advanced deferred to Mission 15+):
//   navigate: Go to Desk, Go to Studio, Go to Office, Open Settings
//   run:      Run lifecycle, Stop run, New Idea
//   model:    Switch model (opens model selector)
```

**Behaviour:** Cmd/Ctrl+K opens overlay. Fuzzy filter over commands. Fully keyboard-driven
(arrow keys, Enter, Esc). Dark overlay `--surface-raised` + `--border-strong`, entrance via
Framer Motion (200ms, no bounce). Respects `prefers-reduced-motion`.

**Seven states:** empty (query matches nothing → "No matching commands"); success (list);
others N/A. Document N/A explicitly.

**Wire:** global keydown listener in layout or a client provider. No existing logic touched —
commands call existing handlers (navigation, run, stop, new idea, settings, model switch).

**Commit:** `feat(shell): add Cmd+K command palette — navigation + run controls (Mission 14)`

### Batch 1D — TopBar refinement + Phase 1 regression

**Modify:** `.../ui-layer/src/components/TopBar.tsx`
- Read completely. Remove ONLY the Desk/Studio/Office tab Link elements and their container.
- Keep: model selector, idea input, Run, Stop, New Idea, stage banner — untouched.
- Do not touch run logic, model-selection logic, or the banner.

**Phase 1 regression checklist (all must pass):**
- [ ] All three pages load in the shell without visual regression.
- [ ] NavRail highlights active route; all three nav items navigate correctly.
- [ ] StatusBar shows empty state on load; populates with real data during a run.
- [ ] Cmd+K opens, filters, executes navigation + Run + Stop + New Idea.
- [ ] TopBar: model selection works; Run starts a lifecycle; Stop halts it; New Idea resets.
- [ ] A full 14-stage lifecycle completes.
- [ ] Mission 13 features intact: New Idea reset, Stop lock-file cleanup, Settings model
      selector parity, dismissal latch on Desk.
- [ ] TypeScript 0 errors.

**Commit:** `refactor(topbar): remove tab nav (moved to NavRail); command-bar only (Mission 14)`
**Phase 1 gate:** regression checklist confirmed by owner. STOP.

---

## 4. PHASE 2 — DESK COMMAND CENTER

### Batch 2A — LifecycleNodeChain (standalone)

**Create:** `.../ui-layer/src/components/desk/LifecycleNodeChain.tsx`

```typescript
interface StageNode {
  stageNumber: number;        // 0..14
  stageName: string;          // full name; component abbreviates to <=8 chars for label
  agent: 'CO'|'PS'|'RE'|'UX'|'AR'|'QA';
  status: 'pending'|'running'|'complete'|'error';
  confidence?: 'high'|'medium'|'low';   // from journey.json
  durationMs?: number;
  reasoning?: string;         // coordinator decision text (EP-8 / CT-3) — shown on hover
}

interface LifecycleNodeChainProps {
  stages: StageNode[];        // built from journey.json by the Desk page
  currentStage: number;
  onStageClick: (stageNumber: number) => void;
}
```

**Behaviour:** horizontal chain, 15 nodes. Node = 28px circle + number; name below; agent
badge below; duration right when complete. Confidence dot uses status colours. Connectors
`--border-subtle` → `--accent-primary`. Active node pulses (running). Completed fill via
Framer Motion sweep. Hover reveals `reasoning` (CT-3).

**Seven states:** empty (15 pending nodes + "Enter an idea and press Run to execute the
14-stage pipeline"); running (active pulse, live fills); partial (stopped — completed +
pending mix, honest); complete/success (all filled); warning (a low-confidence stage shows
amber dot); error (a failed stage shows red); loading (brief skeleton while journey.json
first reads).

**Verify standalone:** render in isolation with mock `stages` prop for each of the seven
states; TypeScript 0. (Mock data is for the isolated dev harness only — never shipped to a
page; the page always feeds real journey.json.)

**Commit:** `feat(desk): add LifecycleNodeChain component (standalone, Mission 14 Phase 2)`

### Batch 2B — ArtifactCard + RunInsightPanel (standalone)

**Create:** `.../ui-layer/src/components/desk/ArtifactCard.tsx`

```typescript
interface ArtifactCardProps {
  stageNumber: number;
  stageName: string;
  agent: string;
  wordCount: number;
  confidence: 'high'|'medium'|'low';
  isActive: boolean;
  onClick: () => void;
}
```

**Create:** `.../ui-layer/src/components/desk/RunInsightPanel.tsx`

```typescript
interface StageReasoning {
  stageNumber: number;
  stageName: string;
  decision: 'go'|'no-go';
  confidence: 'high'|'medium'|'low';
  reasoning: string;          // surfaced (CT-3)
}

interface RunInsightPanelProps {
  totalDurationMs: number;
  modelDisplayName: string;
  cost: number;
  totalTokens: number;
  stagesCompleted: number;
  confidenceBreakdown: { high: number; medium: number; low: number };
  completedAt: string | null;         // null → panel hidden (CT-1, never faked)
  stageReasoning: StageReasoning[];
  defaultCollapsed?: boolean;
}
```

**Behaviour (RunInsightPanel):** appears only when `completedAt` is non-null. 2-col metric
grid + collapsible per-stage reasoning list. All values real (EP-3).

**Seven states each:** ArtifactCard — success/active/hover; empty & loading handled by the
parent list. RunInsightPanel — empty (hidden pre-run), success (post-run), partial (stopped:
shows what completed), warning (low-confidence stages flagged), error (failed run summary).

**Commit:** `feat(desk): add ArtifactCard + RunInsightPanel (standalone, Mission 14 Phase 2)`

### Batch 2C — desk/page.tsx integration (PROTECTED — exception protocol)

**Pre-flight:** create + push `v4.3-pre-desk` before editing.

**Modify:** `.../ui-layer/src/app/desk/page.tsx`
1. Read the file completely. Quote: the journey.json fetch, the artifact-list render, the
   right-panel render, the polling effect, the SSE subscription, and the Mission 13 dismissal
   latch (`dismissedRef` etc).
2. Insert `<LifecycleNodeChain>` between the TopBar area and the artifact list, fed by a
   `stages` array derived from the already-fetched journey.json.
3. Replace flat artifact list items with `<ArtifactCard>` — same data, new presentation.
4. Add `<RunInsightPanel>` to the right panel ABOVE existing context content (additive).

**Do NOT change:** artifact loading logic, polling, SSE subscription, RuntimeContext
consumption, or the dismissal latch. Presentation only.

**Phase 2 regression checklist:**
- [ ] Desk renders correctly with no run (empty node chain educates, not broken).
- [ ] Desk renders correctly post-run (node chain matches journey.json).
- [ ] Clicking a stage node opens the correct artifact.
- [ ] Artifact loading + Studio hand-off unchanged.
- [ ] Dismissal latch still works (New Idea clears; poll does not repopulate).
- [ ] RunInsightPanel shows real reasoning (CT-3), hidden pre-run (CT-1).
- [ ] TypeScript 0.

**Commit:** `feat(desk): integrate node chain, artifact cards, run insight (Mission 14 Phase 2)`
**Phase 2 gate:** checklist confirmed. STOP.

---

## 5. PHASE 3 — OFFICE ANALYTICS

### Batch 3A — OrchestrationGraph (standalone)

**Create:** `.../ui-layer/src/components/office/OrchestrationGraph.tsx`

```typescript
// AGENTS registry drives the graph — adding an agent is a data change (AD-9)
interface AgentNode {
  id: 'CO'|'PS'|'RE'|'UX'|'AR'|'QA';
  label: string;
  role: string;
  x: number; y: number;        // position in viewBox
  status: 'idle'|'active'|'complete'|'error';
  currentTask?: string;
  tokensUsed?: number;
}

interface ContextEdge {
  from: string; to: string;
  active: boolean;             // true → travelling dot animates
}

interface OrchestrationGraphProps {
  agents: AgentNode[];         // defaults to AGENTS (six today)
  edges: ContextEdge[];
  coordinatorStatus: 'idle'|'active'|'complete';
}
```

**Behaviour:** SVG viewBox 0 0 600 400. Coordinator hub center; agents hex arrangement from
AGENTS. Edges bezier; `--border-subtle` idle → `--accent-primary` active with travelling dot
(CSS offset-path). Active node `--status-active` + `--shadow-glow` (the ONLY glow in the
product). Data from the live SSE stream (already consumed by the Office page).

**Seven states:** empty ("Waiting for a lifecycle run" + static nodes); running (live
status + animated edges); partial (some complete, some idle); success (all complete);
warning (an agent hit fallback → amber); error (an agent failed → red node); loading
(brief skeleton).

**Commit:** `feat(office): add OrchestrationGraph SVG component (standalone, Mission 14)`

### Batch 3B — ExecutionSummary + LiveLogStream + OfficeTabSwitcher (standalone)

**Create:** `.../ui-layer/src/components/office/ExecutionSummary.tsx`
```typescript
interface ExecutionSummaryProps {
  totalAgents: number; activeCount: number; completedCount: number;
  pendingCount: number; failedCount: number;
  successRate: number; avgResponseMs: number;
  totalTokens: number; estCost: number;
  activeModels: string[];
}
```

**Create:** `.../ui-layer/src/components/office/LiveLogStream.tsx`
```typescript
interface LogEvent {
  timestamp: string;
  agent: string;
  message: string;            // includes coordinator decisions (CT-3)
  level: 'info'|'warning'|'error';
}
interface LiveLogStreamProps {
  events: LogEvent[];         // from SSE stream
  maxVisible?: number;        // default 50
}
```

**Create:** `.../ui-layer/src/components/office/OfficeTabSwitcher.tsx`
```typescript
interface OfficeTabSwitcherProps {
  active: 'analytics'|'agent-activity';
  onChange: (tab: 'analytics'|'agent-activity') => void;
}
```

**Seven states:** ExecutionSummary — empty (zeros + "No run yet"), running (live), success,
partial, warning, error, loading. LiveLogStream — empty ("No events yet. Start a run to see
agent activity"), running (appending), success (final log), others as applicable.

**Commit:** `feat(office): add ExecutionSummary + LiveLogStream + tab switcher (standalone)`

### Batch 3C — office/page.tsx integration (exception protocol)

**Pre-flight:** create + push `v4.3-pre-office` before editing.

**Modify:** `.../ui-layer/src/app/office/page.tsx`
1. Read completely. Quote the Phaser initialization and the SSE subscription.
2. Add `<OfficeTabSwitcher>`; default `active='analytics'`.
3. Analytics tab: `<OrchestrationGraph>` + `<ExecutionSummary>` + `<LiveLogStream>`, fed by
   the existing SSE subscription.
4. Agent Activity tab: the existing pixel-art Phaser view, unchanged.

**Critical constraint (R-6):** BOTH tabs render; the inactive one is hidden via CSS
`display:none`. Phaser initializes ONCE and is never unmounted on tab switch. Verify the
canvas is not re-created when switching tabs.

**Phase 3 regression checklist:**
- [ ] Analytics is the default view; renders empty and post-run correctly.
- [ ] Agent Activity renders pixel art unchanged; Phaser does NOT re-init on switch.
- [ ] Orchestration graph reflects live run state; edges animate on real transfers.
- [ ] Log stream populates with real events including coordinator decisions.
- [ ] Switching tabs is instant, no reload, no canvas flicker.
- [ ] TypeScript 0.

**Commit:** `feat(office): Analytics default view + preserve pixel art (Mission 14 Phase 3)`
**Phase 3 gate:** checklist confirmed. STOP.

---

## 6. PHASE 4 — STUDIO PREMIUM

### Batch 4A — VersionTimeline + ImprovementMetrics (standalone)

**Create:** `.../ui-layer/src/components/studio/VersionTimeline.tsx`
```typescript
interface ArtifactVersion {
  version: number;            // 1, 2, 3...
  createdAt: string;
  isCurrent: boolean;
}
interface VersionTimelineProps {
  versions: ArtifactVersion[];
  onSelectVersion: (version: number) => void;
}
```

**Create:** `.../ui-layer/src/components/studio/ImprovementMetrics.tsx`
```typescript
interface ImprovementMetricsProps {
  wordDelta: number;          // e.g. +340
  tokensUsed: number;
  frameworksAdded: string[];  // parsed from the real improve response
}
```

**Seven states:** VersionTimeline — empty (only v1 → hidden or "original only"), success
(list), loading (while listing files). ImprovementMetrics — empty (pre-improve, hidden),
success (post-improve), loading (during improve), error (improve failed).

**Commit:** `feat(studio): add VersionTimeline + ImprovementMetrics (standalone, Mission 14)`

### Batch 4B — improve/page.tsx integration

**Modify:** `.../ui-layer/src/app/improve/page.tsx` (not on protected list)
1. Read completely. Quote the IMPROVE NOW call, ACCEPT logic, version-tracking write.
2. Rename displayed label "Improve" → "Studio" (header + any visible label). URL stays
   `/improve`. No redirect, no file rename.
3. Structure the improve request as the context envelope (AD-11):
   `{ primary: artifactContent, attachments: [], references: [] }` — attachments/references
   always empty in Mission 14. This is a request-shape change only; the route reads
   `envelope.primary` exactly as it reads the raw content today. No behaviour change.
4. Add `<VersionTimeline>` to the left rail; `<ImprovementMetrics>` to the right after
   improve completes.
5. Add Framer Motion transitions between idle/loading/split-view states (300ms, no bounce,
   respect reduced-motion).

**Do NOT change:** IMPROVE NOW API logic, ACCEPT logic, version write, stale propagation.

**Phase 4 / Mission 14 final regression checklist:**
- [ ] Studio label in NavRail + header; URL still /improve.
- [ ] IMPROVE NOW + ACCEPT work identically to Mission 13 baseline.
- [ ] Version timeline lists versions; switching loads correct version.
- [ ] ImprovementMetrics shows real deltas (EP-3).
- [ ] Context envelope in use; route reads envelope.primary; no behaviour change.
- [ ] Motion transitions: no layout shift, no flash, reduced-motion respected.
- [ ] Full cross-workspace regression: Desk lifecycle → Studio improve → Office analytics.
- [ ] TypeScript 0.

**Commit:** `feat(studio): premium Studio — version timeline, metrics, envelope, motion (M14)`
**Phase 4 gate:** checklist confirmed. STOP.

---

## 7. FINAL — DOCUMENTATION SYNC + TAG

**Batch F:**
- IDEAGATE-MASTER-TODO.md: close P-NEW-13 (Office Analytics), P-NEW-15 (Studio visual parity),
  P-NEW-18 (coordinator fallback), P-NEW-19 (Grok ID). Note P-NEW-12 (Studio) advanced.
- ENGINEERING_STATUS.md: Mission 14 entry (all batches, commits, regression results).
- IDEAGATE-STATE-NOW.md: update tab structure, model constants (owl-alpha fully retired),
  new components, what-works list; add the Cmd+K palette; note the design token system.
- Tag `v4.3-premium-ui`, push.

**Final gate:** all documentation synced; tag pushed; full regression green. Mission 14 closed.

---

## 8. REGRESSION MASTER LIST (run at every phase gate)

Baseline behaviours that must never break, verified at each gate:
1. A full 14-stage lifecycle completes and writes journey.json + artifacts.
2. Model selection (TopBar + Settings) drives the real OpenRouter call.
3. Studio IMPROVE NOW returns 200; ACCEPT saves; version increments; downstream marked stale.
4. Stop halts the run and clears the lock file (Mission 13 P-NEW-8).
5. New Idea resets workspace + Desk dismissal latch holds (Mission 13 P-NEW-6).
6. Office pixel art renders; Phaser does not crash or re-init.
7. TypeScript 0 errors.
8. No console errors referencing model-registry, getModelMeta, or resolveModelId.

---

## 9. WHAT THE IMPLEMENTATION PLAN FORBIDS

- No hardcoded colours/spacing/durations — tokens only.
- No mocked data shipped to a page — mocks live only in isolated dev harnesses.
- No protected-file edit without its pre-edit rollback tag.
- No batch beginning before the prior batch's gate is owner-confirmed.
- No component considered "done" until all seven states are handled.
- No scope-crept feature from Specification §6 (uploads, comparison, auth, new agents, etc).

---

*Mission 14 Implementation Plan v1.0 | July 2026*
*Next document: IDEAGATE-MISSION-14-CLAUDE-CODE-RUNBOOK.md (after this is approved)*
