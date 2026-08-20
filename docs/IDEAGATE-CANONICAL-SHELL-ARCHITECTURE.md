# IDEAGATE — CANONICAL SHELL ARCHITECTURE
## Reverse-Engineered from Build Reference Implementation
### Version 1.0 · August 2026 · AUTHORITATIVE — Do not override without owner approval

---

> **This document is permanent architecture governance.**
> It describes what IdeaGate IS, not what it might become.
> Every orchestration extension must conform to this contract.
> Nothing in this document may be changed to accommodate a new feature.

---

## 1. WHAT IDEAGATE IS

IdeaGate is a **Multi-Agent Product Operating System** with a fixed product shell and variable orchestration contents.

The shell is permanent. The orchestration inside it changes per mission type.

```
FIXED (shell — never changes):
  Composer → Desk/Workspace → Studio → Mission Control

VARIABLE (orchestration — changes per mission type):
  Agents · Topology · Methodology · Artifacts · Graph nodes
```

This distinction is the most important architectural fact in the system.
A new orchestration type (Research, Investigate, Plan, etc.) is new **contents** placed inside the existing **package**. It is never a new package.

---

## 2. THE CANONICAL SHELL — FOUR SURFACES

### 2.1 Composer
**Location:** `src/app/composer/page.tsx`
**Role:** Universal mission entry point. Accepts intent, outcome, depth, context. Routes to execution.

**Invariants:**
- One Composer serves ALL orchestration types
- Outcome selection determines which orchestration runs; it does not change the Composer surface
- Mission Brief (crystallization) is presentation-only — it reads from the artifact contract, never redefines it
- Composer does NOT know how agents work; it produces a RunConfig and hands off

**What changes per orchestration:**
- Outcome selection label and description
- "What You'll Receive" artifact list (read from D5 artifact contract)
- Depth options and their meanings (if different per outcome)

**What NEVER changes:**
- The Composer component itself
- The card expansion interaction
- The intent input surface
- The depth selector
- The context attachment zone
- The Run Mission button behavior
- The routing to Mission Control after run starts

---

### 2.2 Desk / Workspace Explorer
**Location:** `src/app/desk/page.tsx`, `src/components/shared/WorkspaceExplorer.tsx`
**Role:** Artifact navigation. Shows the tree of produced artifacts. Clicking opens artifact in the right panel.

**Key components:**
- `WorkspaceExplorer` — the left sidebar tree (invariant component)
- `WorkspaceNode` — data shape for tree items
- `ArtifactInspector` / right panel — renders selected artifact

**Invariants:**
- ONE workspace sidebar for ALL orchestration types
- The `WorkspaceExplorer` component accepts `WorkspaceNode[]` and renders them identically regardless of origin
- Clicking a node sets `activeNodeId` and calls `onNodeSelect` — the same for Build and any future orchestration
- The right panel that opens is the SAME artifact viewer for all artifact types

**What changes per orchestration:**
- The `WorkspaceNode[]` data fed to `WorkspaceExplorer` (different artifact names, different tree structure)
- The `artifact-index.json` that describes available artifacts for a run

**What NEVER changes:**
- `WorkspaceExplorer.tsx` component code
- The `WorkspaceNode` type contract
- The `onNodeSelect` → `activeNodeId` state flow
- The right-panel artifact viewer
- The workspace sidebar's visual design

**CRITICAL RULE — Context isolation:**
The workspace tree must be derived from the **CURRENT ACTIVE RUN**. Research artifacts must not appear in a Build workspace and vice versa. The condition `outcome === 'research'` must guard Research-specific tree nodes. This is enforced at the data layer (which `WorkspaceNode[]` array is passed), not with CSS/display:none.

**ACTIVE WORKSPACE ISOLATION (mandatory rule for all orchestrations):**

The canonical shell is shared. The workspace DATA is not.

WorkspaceExplorer must receive EITHER Build nodes OR Research nodes — never both simultaneously. The tree is mutually exclusive by active outcome:

```
IF v3RunInfo?.outcome === 'research' AND v3Artifacts.length > 0:
  WorkspaceExplorer receives research-only tree
  (Project root → Documents → Research Intelligence → artifacts)
  Build project tree must NOT render

ELSE:
  WorkspaceExplorer receives Build project tree only
  Research Intelligence folder must NOT render
```

Implementation: the `workspaceTree` useMemo in `desk/page.tsx` must return early with the Research-only tree when `isResearchActive`. The Build tree code path must never append Research nodes — mutual exclusion is enforced by `return` before the Build tree is constructed.

Historical runs remaining on disk are acceptable and expected. They must NOT enter the active workspace merely because they exist in storage. **ARTIFACT CO-OCCURRENCE IS NOT ACTIVE CONTEXT.**

---

### 2.3 Studio — Universal Collaborative Document Editor
**Location:** `src/app/improve/page.tsx`
**Editor component:** `Doc` (inline function) → `TipTapRenderer` → `FormattingToolbar`
**Store flag:** `useTipTapRenderer: true` in `src/lib/GlobalStore.tsx` (MUST remain true)

**Role:** Universal artifact editing. Any artifact from any orchestration type enters Studio and is edited through the same surface.

**Key components:**
- `Doc` — top-level wrapper that dispatches to the correct renderer
- `TipTapRenderer` — TipTap-based rich text editor
- `FormattingToolbar` — the canonical toolbar with:
  - Group 1: ✦ AI menu + TextType dropdown (Paragraph / H1 / H2 / H3 / H4)
  - Group 2: Bold / Italic / Underline / TextColor dropdown
  - Group 3: Alignment dropdown (Left / Center / Right / Justify)
  - Group 4: Attach submenu (Link / Image / Video / Code / Table / Doc / Web)
  - Group 5: Strikethrough / TaskList / OrderedList / InlineCode / More…
- Right panel: Improvement Intent / Model selector / Presets / Extent / Scope / Improve button / Accept button

**Invariants (the "One Editor" law):**
```
BUILD ARTIFACT   → Doc → TipTapRenderer → FormattingToolbar
RESEARCH ARTIFACT → Doc → TipTapRenderer → FormattingToolbar
INVESTIGATE ARTIFACT → Doc → TipTapRenderer → FormattingToolbar
[ANY FUTURE ARTIFACT] → Doc → TipTapRenderer → FormattingToolbar
```
There is ONE editor. There is ONE toolbar. Orchestration type is irrelevant at this layer.

**What changes per orchestration:**
- The artifact content loaded into `rawContent`
- The artifact title and metadata shown in the header
- The Improve prompt context (which artifact is being improved)
- The persistence path for the improved version (v2.md location)

**What NEVER changes:**
- `TipTapRenderer.tsx`
- `FormattingToolbar.tsx`
- `GlobalStore.tsx: useTipTapRenderer: true`
- The `Doc` component
- The Improve/Accept workflow
- The left sidebar (WorkspaceExplorer)
- The right improvement panel structure

**THE KNOWN TRAP:** Zustand `persist` middleware can override `useTipTapRenderer: true` from localStorage. The version key in the persist config must be incremented whenever this default changes, forcing localStorage to reset. Current version must be verified before any store change.

**Content loading contract:**
```
Build artifact:    setSelected(file) → useEffect → GET /api/improve?file= → setRawContent
Research artifact: setV3ActiveArtId(id) → useEffect → GET /api/runs/{runId}/artifacts/{id} → setRawContent
Future artifacts:  [outcome]-specific useEffect → appropriate GET endpoint → setRawContent
```
All paths converge at `rawContent`. The editor renders `rawContent`. This is the single integration point.

---

### 2.4 Mission Control — Live Orchestration Graph
**Location:** `src/app/mission-control/page.tsx`
**Graph component:** `OfficeScene` (or equivalent force-directed graph component)
**Role:** Real-time visualization of the active orchestration. Shows Coordinator → agents → execution flow → artifacts.

**Invariants:**
- ONE Mission Control page for ALL orchestration types
- The graph component accepts orchestration-specific node/edge data and renders it using the shared visual language
- Animated node states: queued → running → complete (with glow/pulse effects)
- Node connection lines show data/execution flow
- Status indicators per node
- The Build lifecycle graph (15 stages, 6 specialist agents) is the CANONICAL visual reference

**What changes per orchestration:**
- The node definitions (which agents, which roles)
- The topology (sequential vs parallel, which nodes feed which)
- The execution step labels and PM-native activity text
- The artifact nodes and their connections
- The completion state and artifact count

**What NEVER changes:**
- The visual language (dark background, emerald accent, glow states)
- The animation system (pulse for running, check for complete)
- The node card design
- The shared graph rendering component
- The SSE event → node state update mechanism

**Mission Control routing (MUST be respected):**
```typescript
// PRIORITY ORDER — do not invert:
// 1. Build actively running → Build Mission Control ALWAYS wins
// 2. URL has outcome=research + runId → Research Mission Control
// 3. Sidebar nav with no params + last run was Research + no Build active → Research
// 4. Default → Build Mission Control
```

**THE KNOWN TRAP:** Using `git checkout HEAD -- mission-control/page.tsx` restores the WRONG (old flat SVG) version. HEAD is not always the good version. The live graph version must be identified by commit hash, not assumed to be HEAD.

---

## 3. THE STATE AND DATA FLOW CONTRACT

```
EXECUTION LAYER
  CLI engine → writes artifacts to disk
  Executor → emits SSE events to events.jsonl
  
  ↓
  
PERSISTENCE LAYER
  workspace/{projectId}/runs/{runId}/
    ├── plan.json              (immutable)
    ├── normalized-mission.json (immutable)
    ├── state.json             (mutable)
    ├── events.jsonl           (append-only)
    ├── artifact-index.json    (written after completion)
    └── artifacts/
        └── {artifactId}/
            └── v1.md          (canonical content)
            └── v2.md          (after Studio improvement)
  
  ↓
  
API LAYER
  /api/runs/current           → active run info
  /api/runs/[runId]/artifacts → artifact list
  /api/runs/[runId]/artifacts/[id] → artifact content
  /api/missions/[runId]/events → SSE stream
  
  ↓
  
PRESENTATION LAYER
  Mission Control ← SSE events (real-time node status)
  Desk ← artifact-index.json (artifact tree)
  Studio ← artifact content API (rawContent)
```

Nothing in the presentation layer may write to the execution layer except through the Improve/Accept workflow (which writes v2.md).

---

## 4. INVARIANT COMPONENTS — NEVER DUPLICATE

These components must NOT be recreated for any new orchestration:

| Component | File | What it does | Broken by |
|-----------|------|-------------|-----------|
| `WorkspaceExplorer` | `src/components/shared/WorkspaceExplorer.tsx` | Sidebar artifact tree | Creating V3ArtifactSidebar |
| `Doc` + `TipTapRenderer` | `src/app/improve/page.tsx` + `TipTapRenderer.tsx` | Universal editor | Creating ResearchViewer |
| `FormattingToolbar` | `src/components/improve/FormattingToolbar.tsx` (or inline) | Editor toolbar | Hiding it behind useTipTapRenderer:false |
| `ArtifactInspector` / right panel | Inside `desk/page.tsx` | Right-panel artifact view | Creating Research-specific modal |
| Mission Control graph component | `src/app/mission-control/page.tsx` | Live orchestration graph | git checkout to wrong version |

---

## 5. THE PROTECTED FILES

These files MUST NOT be modified by orchestration extension work:

```
ABSOLUTE PROTECTION:
  src/core/coordinator-v2.js
  src/core/lifecycle-engine.js
  src/core/journey-engine.js
  src/utils/llm.js

STRONG PROTECTION (change only with explicit justification):
  src/components/shared/WorkspaceExplorer.tsx
  src/components/improve/TipTapRenderer.tsx
  src/components/improve/FormattingToolbar.tsx
  src/lib/GlobalStore.tsx (especially useTipTapRenderer)
  src/app/desk/page.tsx (extend only; never restructure)
  src/app/improve/page.tsx (extend only; never restructure)
```

---

## 6. VISUAL LANGUAGE — DO NOT REINVENT

| Token | Value | Used for |
|-------|-------|---------|
| `--ig-emerald` / `#34D399` | Emerald green | Active states, accents, running indicators |
| `--ig-canvas` / `#05090B` | Near-black | Page background |
| `--ig-surface` / `#0A1013` | Dark surface | Card backgrounds |
| `#0F1A16` | Slightly raised | Hover states, active selections |
| `#1C2A22` | Border color | Default borders |
| `#2a7a5a` | Dimmed emerald | Hover borders, inactive emerald |
| `#E8F0EC` | Near-white | Primary text |
| `#5B6B63` | Muted | Secondary text, placeholders |
| `#34D399` opacity animations | Pulse | Running/active node glow |

Typography:
- Inter — prose, UI labels
- JetBrains Mono — intent input, system values, code

Motion rule: **Every animation maps to a real system event.** No decorative motion.

---

## 7. ARTIFACT LIFECYCLE (CANONICAL)

```
1. GENERATION
   Orchestration executes → LLM produces content → 
   Executor writes to workspace/{projectId}/runs/{runId}/artifacts/{id}/v1.md

2. INDEXING
   Executor writes artifact-index.json after all artifacts complete
   (or progressively as each completes for real-time desk updates)

3. DESK ENTRY
   Desk polls /api/runs/current → detects new run →
   fetches /api/runs/{runId}/artifacts → builds WorkspaceNode[] →
   passes to WorkspaceExplorer

4. STUDIO ENTRY
   User clicks artifact node → onNodeSelect fires →
   appropriate content-loading useEffect fires →
   GET /api/runs/{runId}/artifacts/{id} →
   setRawContent(content) →
   Doc renders TipTapRenderer with content

5. IMPROVEMENT
   User edits in Studio → Improve → Accept →
   PATCH /api/runs/{runId}/artifacts/{id} →
   writes v2.md → Desk reflects updated version

6. MISSION CONTROL
   SSE stream from /api/missions/{runId}/events →
   Frontend EventSource subscribes →
   Events update node states: queued→running→complete →
   Graph re-renders with new state
```

---

## 8. WHAT WAS LEARNED FROM THE RESEARCH INTEGRATION

This section exists to prevent repetition of costly mistakes.

### 8.1 What Research got wrong

| What happened | What should have happened | Cost |
|---|---|---|
| Created `V3ArtifactSidebar.tsx` | Reused `WorkspaceExplorer` with Research `WorkspaceNode[]` | 1 day |
| Created `V3ArtifactViewer.tsx` | Opened artifact in existing right panel | 1 day |
| Research artifacts appeared in Build workspace | Added `outcome === 'research'` guard on the tree injection | 2 hours |
| Studio showed white paper instead of editor | `useTipTapRenderer: false` was the default; one line fix | 1 day |
| Mission Control restored to flat SVG | `git checkout HEAD` chose wrong commit; live graph was in working tree, not HEAD | 4 hours |
| Studio blank on initial load | `rawContent` wasn't being set; one useEffect addition | 2 hours |

**Total estimated time lost: 4-5 days.**
**Total lines of permanent new code required: ~50.**

### 8.2 The pattern that caused all regressions

```
WRONG PATTERN (what was done):
  1. Start implementing Research
  2. Something doesn't look right visually
  3. Create a new component that looks like the old one
  4. The new component is parallel to, not using, the existing one
  5. The existing one still runs and conflicts
  6. Spend days debugging the conflict

CORRECT PATTERN (what should be done):
  1. Read the existing component
  2. Understand what data it accepts
  3. Pass Research data in that format
  4. The existing component renders it
  5. Done
```

---

## 9. REGRESSION PROTOCOL

Before any orchestration implementation sprint:
```
□ Record current Build golden state:
    - Run a Build mission end-to-end
    - Screenshot: Desk shows Build artifacts
    - Screenshot: Studio opens artifact with FormattingToolbar
    - Screenshot: Mission Control shows live Build graph
    - git log --oneline -3 (record the hashes)

□ These screenshots are the regression baseline.
□ After EVERY implementation session, re-run this verification.
□ A sprint is FAIL if ANY baseline screenshot no longer matches.
```

---

*IDEAGATE-CANONICAL-SHELL-ARCHITECTURE.md · Version 1.0 · August 2026*
*This document governs all orchestration extensions. It does not expire.*
