# IDEAGATE — ORCHESTRATION EXTENSION PLAYBOOK
## How to Add a New Orchestration Without Breaking Anything
### Version 1.0 · August 2026 · REQUIRED READING before any new orchestration sprint

---

> **This playbook is law.**
> Every person and AI assistant implementing a new orchestration must read this first.
> Deviating from this playbook produced 4-5 days of regressions during Research integration.
> The shell is built. You are extending it. You are not building it again.

---

## 1. THE FUNDAMENTAL RULE

```
REUSE → ADAPT → EXTEND → VERIFY
NEVER → DUPLICATE → REBUILD → REPLACE
```

The product shell (Composer, Desk, Studio, Mission Control) is complete and working. You are adding new **orchestration methodology** inside it — not creating a new product.

Analogy: The building exists. You are furnishing a new room. You do not rebuild the elevator, the lobby, or the stairs for each new room.

---

## 2. WHAT IS ORCHESTRATION-SPECIFIC vs WHAT IS SHARED

### SHARED (never recreate):

| Surface | Component | Your job |
|---------|-----------|---------|
| Composer UI | `src/app/composer/page.tsx` | Add your outcome to the outcome grid. That's it. |
| Workspace sidebar | `WorkspaceExplorer.tsx` | Feed it `WorkspaceNode[]` with your artifact names. Done. |
| Artifact right panel | Inside `desk/page.tsx` | Call the same `setSelected()` / `openArtifact()` function. Done. |
| Studio editor | `Doc` → `TipTapRenderer` → `FormattingToolbar` | Load your artifact content into `rawContent`. Done. |
| Mission Control shell | `mission-control/page.tsx` | Add a routing branch for your outcome. Pass your nodes to the graph. |
| Navigation | Left nav bar | Unchanged. |
| Visual tokens | `#34D399`, `#05090B`, etc. | Unchanged. |

### ORCHESTRATION-SPECIFIC (you build this):

| Element | Where it goes | Description |
|---------|--------------|-------------|
| Execution pipeline | `src/core/outcome-runtime/step-registry/{outcome}.js` | Step definitions for your orchestration |
| Agent/capability invocations | `src/core/outcome-runtime/capabilities/` | Reuse RE/PS/CO/AR/UX/QA files |
| Artifact manifest | `artifact-index.json` schema | List of artifacts your orchestration produces |
| Graph node definitions | Passed as data to Mission Control graph | Nodes, edges, labels for your orchestration |
| PM-native progress labels | `PM_ACTIVITY_TEXT` in SSE event mapping | What the user sees during execution |
| Artifact API routes | Only if your persistence path is new | Only add what doesn't exist |

---

## 3. PRE-FLIGHT CHECKLIST (mandatory before writing a single line)

**Run this before every orchestration sprint. Do not skip. This is what prevents 4-day regressions.**

```
PRE-FLIGHT: [OUTCOME NAME] Orchestration
Date: [date]
Engineer: [Claude Code session ID or human name]

□ STEP 1 — Read the canonical shell document
  File: docs/IDEAGATE-CANONICAL-SHELL-ARCHITECTURE.md
  Confirm you understand all invariant components.

□ STEP 2 — Record the Build golden state
  Run a Build mission end-to-end right now.
  Verify:
    [ ] Desk shows Build artifacts correctly
    [ ] Studio opens with TipTap + FormattingToolbar
    [ ] Mission Control shows live Build graph
  Record git hash: _______________

□ STEP 3 — List what you will REUSE (must not be empty)
  Composer: [ ] Reusing existing component
  WorkspaceExplorer: [ ] Reusing, will feed new WorkspaceNode[]
  Studio editor: [ ] Reusing, will load content into rawContent
  Mission Control graph: [ ] Reusing, will pass new node data
  API artifact endpoint: [ ] Reusing /api/runs/[runId]/artifacts/[id]
  SSE streaming: [ ] Reusing /api/missions/[runId]/events

□ STEP 4 — List what you will EXTEND (must be genuinely new)
  [ ] Step registry: src/core/outcome-runtime/step-registry/{outcome}.js
  [ ] Graph node definitions: {outcome}Nodes array
  [ ] PM activity labels: PM_ACTIVITY_TEXT['{outcome}']
  [ ] Artifact IDs and PM names: ARTIFACT_ORDER for this outcome
  [ ] Mission Control routing branch: if (outcome === '{outcome}') { ... }

□ STEP 5 — HARD STOP: can any of Step 4 items use an EXISTING adapter?
  If Research already has an artifact loading useEffect, can yours reuse
  the same pattern? If yes, use the same pattern.

□ STEP 6 — Confirm protected files will NOT be touched:
  [ ] coordinator-v2.js — WILL NOT TOUCH
  [ ] lifecycle-engine.js — WILL NOT TOUCH
  [ ] llm.js — WILL NOT TOUCH
  [ ] TipTapRenderer.tsx — WILL NOT TOUCH
  [ ] WorkspaceExplorer.tsx — WILL NOT TOUCH
  [ ] GlobalStore.tsx (useTipTapRenderer) — WILL NOT TOUCH

APPROVAL: Pre-flight complete. Implementation may begin.
```

---

## 4. IMPLEMENTATION TEMPLATE FOR EVERY ORCHESTRATION

Follow this exact sequence. Do not reorder steps.

### PHASE 1 — Backend execution only (no UI changes)

```
1. Create: src/core/outcome-runtime/step-registry/{outcome}.js
   Define the step array following the Research pattern exactly.
   Each step: { id, capability, objective, framing, artifactTarget, dependsOn }

2. Wire in executor.js:
   Add outcome to the step-registry switch/import.
   No other executor changes needed.

3. Wire in cli.js v3-run:
   Add outcome to the outcome routing.
   No other cli.js changes needed.

4. Test from CLI only:
   node src/cli.js v3-run --outcome {outcome} --intent "test" \
     --depth balanced --project test-{outcome}-001
   
   Verify: 
   - All artifacts written to correct paths
   - artifact-index.json written
   - events.jsonl contains step_started/step_complete/run_complete
   - .v3-last-run-info.json written with outcome: '{outcome}'
   
   DO NOT TOUCH UI until CLI verification passes.
```

### PHASE 2 — Composer (one addition only)

```
5. In src/app/composer/page.tsx (or wherever the outcome grid is defined):
   Add your outcome to the OUTCOMES array:
   {
     id: '{outcome}',
     label: '[PM-facing name]',
     description: '[one line description]',
     icon: [existing icon],
     phase: 'PHASE 1', // or 'CANONICAL' if immediately executable
   }
   
   Add to CANONICAL_OUTCOME_IDS array in normalizer if not present.
   Add artifact list to Mission Brief "What You'll Receive" section.
   
   NO OTHER COMPOSER CHANGES.
```

### PHASE 3 — Mission Control routing (minimal)

```
6. In src/app/mission-control/page.tsx, find the V3 routing block.
   Add a branch for your outcome following the Research pattern:
   
   if (effectiveOutcome === '{outcome}' && effectiveRunId) {
     return <OrchestrationMissionControl
       runId={effectiveRunId}
       projectId={effectiveProjectId}
       nodes={OUTCOME_NODES}  // defined below
       outcome="{outcome}"
       isCompleted={...}
     />;
   }
   
7. Define your graph nodes:
   const OUTCOME_NODES = [
     { id: 'coordinator', label: 'CO', sublabel: 'Coordinator', status: 'running' },
     { id: 'step1', label: 'RE', sublabel: '[Step 1 name]', artifactName: '[Artifact 1]', status: 'queued' },
     // ... one node per step
   ];
   
   Pass these to the SAME graph component Research uses.
   DO NOT create a new graph component.
   
8. Wire SSE → node state updates (same pattern as Research):
   step_started → setNodes(prev => prev.map(n => n.id === event.stepId ? {...n, status: 'running'} : n))
   step_complete → setNodes(prev => prev.map(n => n.id === event.stepId ? {...n, status: 'complete'} : n))
```

### PHASE 4 — Desk (WorkspaceNode injection only)

```
9. In src/app/desk/page.tsx, find where Research artifacts are injected
   into the workspace tree (the v3ArtifactList section).
   
   Add your outcome following the SAME pattern:
   
   ...(v3ArtifactList.length > 0 && v3RunInfo?.outcome === '{outcome}'
       ? [{
           id: '{outcome}-section',
           label: '[Section Name]',
           kind: 'folder',
           phaseColor: '#34D399',
           children: v3ArtifactList.map(a => ({
             id: `v3-node-${a.id}`,
             label: a.pmName,
             kind: 'file',
             wdocId: `v3-artifact-${a.id}`,
             healthState: 'trustworthy',
           }))
         }]
       : [])
   
   The WorkspaceExplorer renders this automatically.
   You are passing DATA. You are not creating a new sidebar.
```

### PHASE 5 — Studio (no changes required)

```
10. Studio requires ZERO changes for a new orchestration.
    
    The v3-artifact- node click handler already exists in improve/page.tsx.
    It fetches from /api/runs/{runId}/artifacts/{id} and sets rawContent.
    This works for ANY outcome that produces artifacts at that path.
    
    ONLY REQUIRED if your artifact endpoint is at a different path:
    Add a case to the v3 content-loading useEffect.
    Follow the exact same pattern as Research.
    Load content → setRawContent. Nothing else.
    
    NEVER: create a new editor, new toolbar, new viewer.
```

### PHASE 6 — Verify end-to-end

```
11. Run the full journey:
    Composer → [outcome] mission → Mission Control (your graph) →
    Desk (your artifacts) → Studio (same TipTap editor) → Improve → Accept
    
12. Verify Build regression baseline is intact:
    Run a Build mission.
    Desk shows Build artifacts only (no [outcome] folder).
    Studio opens Build artifact with FormattingToolbar.
    Mission Control shows Build graph (not your graph).
    
    If Build regresses: STOP. Fix the regression before proceeding.
```

---

## 5. THE ORCHESTRATION ADAPTER CONTRACT

For every new orchestration, these are the ONLY integration points:

```typescript
// 1. Step Registry (execution layer)
// File: src/core/outcome-runtime/step-registry/{outcome}.js
export function getSteps(intent: string, depth: string): OutcomeTask[] {
  // Returns ordered array of tasks
  // Each task defines: id, capability, objective, framing, artifactTarget, dependsOn
}

// 2. Artifact Manifest (persistence contract)
// Written to artifact-index.json after execution
{
  "outcome": "{outcome}",
  "hero": "{hero-artifact-id}",
  "artifacts": [
    { "id": "{id}", "pmName": "{PM-facing name}", "path": "artifacts/{id}/v1.md" }
  ]
}

// 3. Graph Node Definitions (Mission Control layer)
// Passed as data to the shared graph component
const NODES: GraphNode[] = [
  { id: string, label: string, sublabel: string, status: NodeStatus,
    artifactName?: string, wordCount?: number }
];

// 4. PM Activity Labels (SSE → Mission Control translation)
PM_ACTIVITY_TEXT['{outcome}'] = {
  '{stepId}': '{PM-native description of what is happening}'
};

// 5. Workspace Tree Injection (Desk layer)
// Added to studioTree in desk/page.tsx and improve/page.tsx
// Condition: v3RunInfo?.outcome === '{outcome}'
// Shape: standard WorkspaceNode[] — no custom shape needed
```

---

## 6. ARTIFACT MANIFEST CONTRACT

Every orchestration must produce an `artifact-index.json` following this schema:

```json
{
  "runId": "string",
  "missionId": "string",
  "outcome": "research | investigate | plan | decide | council | ...",
  "depth": "quick | balanced | deep | exhaustive",
  "intent": "first 80 chars of user intent",
  "hero": "artifact-id of the primary synthesis artifact",
  "createdAt": "ISO 8601",
  "artifacts": [
    {
      "id": "stable-artifact-id",
      "pmName": "PM-Facing Artifact Name",
      "path": "artifacts/{id}/v1.md",
      "ready": true
    }
  ]
}
```

**Artifact IDs must be:**
- Stable (same every run for the same outcome)
- Kebab-case
- Meaningful to a PM (not internal codes)
- Different from Build stage names (0-idea-intake.md format is Build-only)

**Hero artifact:** The final synthesis document. This is what Desk shows by default. For Research: `research-intelligence-brief`. For Investigate: `investigation-report`. For Plan: `implementation-plan`.

---

## 7. MISSION CONTROL GRAPH DATA CONTRACT

The shared graph component expects nodes in this shape:

```typescript
interface GraphNode {
  id: string;           // unique within this orchestration
  label: string;        // capability badge (CO, RE, PS, etc.)
  sublabel: string;     // role description ("Market Intelligence")
  status: 'queued' | 'running' | 'complete' | 'failed';
  artifactName?: string; // what artifact this node produces
  wordCount?: number;   // populated after completion
  role?: 'coordinator' | 'specialist' | 'synthesis'; // for layout hints
}
```

**Node update contract:**
```typescript
// When step_started SSE event arrives:
setNodes(prev => prev.map(n =>
  n.id === event.stepId ? { ...n, status: 'running' } : n
));

// When step_complete SSE event arrives:
setNodes(prev => prev.map(n =>
  n.id === event.stepId
    ? { ...n, status: 'complete', wordCount: event.wordCount }
    : n
));
```

The graph component handles animation and visual updates automatically when status changes. You do not manage animation.

---

## 8. DESK INTEGRATION CONTRACT

**Your orchestration's artifacts appear in Desk via:**

1. `artifact-index.json` contains your artifact list
2. `/api/runs/[runId]/artifacts/route.ts` reads this file and returns the list
3. Desk polls this endpoint while the run is active
4. When artifacts appear, Desk calls `setV3Artifacts(data.artifacts)`
5. The studioTree memo uses these artifacts to build WorkspaceNode[]
6. WorkspaceExplorer renders them

**Your only integration work:** ensure steps 1-2 produce the correct data. Steps 3-6 are already implemented and require no changes.

**Context isolation rule:** Your orchestration's artifacts must be guarded with `v3RunInfo?.outcome === '{your-outcome}'` in the studioTree injection. This prevents cross-contamination between orchestration runs.

---

## 9. STUDIO INTEGRATION CONTRACT

**Your artifacts enter Studio via:**

1. User clicks your artifact's WorkspaceNode in the sidebar
2. `onNodeSelect` fires with `node.wdocId === 'v3-artifact-{artifactId}'`
3. The handler calls `setV3ActiveArtId(artifactId)`
4. `useEffect([v3RunId, v3ActiveArtId])` fires
5. Fetches `GET /api/runs/{runId}/artifacts/{artifactId}`
6. Sets `setRawContent(data.content)`
7. `Doc` renders `TipTapRenderer` with the content
8. FormattingToolbar appears
9. User can edit, Improve, Accept

**Your only integration work:** ensure step 5 returns content at the standard API path. If your artifacts are at the canonical path (`workspace/{projectId}/runs/{runId}/artifacts/{id}/v1.md`), the existing route handles it automatically.

---

## 10. EVIDENCE AND VALIDATION MODEL

For orchestrations that include a Validation Log:

**Rule from Document 5:** Validation Log is **claim-driven**, not type-driven. A Validation Log entry appears only when an artifact contains an externally verifiable claim. It is not a per-artifact checkbox.

**Required fields when a claim is present:**
```
- claimText: the claim being verified
- sourceDescription: where it came from
- sourceType: 'web-url' | 'uploaded-document' | 'tool-result' | 'user-stated'
- verificationStatus: 'verified' | 'partially-verified' | 'unverified'
```

`model-analysis` is NOT a valid sourceType. Evidence must trace to a real source.

---

## 11. WHAT NOT TO DO — ANTI-PATTERNS

These anti-patterns were proven during Research integration. Each one caused at least one day of regressions.

```
❌ ANTI-PATTERN 1: Creating a parallel sidebar
   "Research has a different artifact structure so I'll make ResearchSidebar"
   CORRECT: Feed Research WorkspaceNode[] to the existing WorkspaceExplorer

❌ ANTI-PATTERN 2: Creating a parallel viewer
   "Research artifacts look different so I'll make ResearchArtifactViewer"
   CORRECT: Open them in the same ArtifactInspector right panel

❌ ANTI-PATTERN 3: Creating a parallel editor
   "Research artifacts need a different editing experience"
   CORRECT: Load Research content into rawContent → same TipTap editor

❌ ANTI-PATTERN 4: Letting useTipTapRenderer stay false
   "The user can enable it in settings if they want"
   CORRECT: useTipTapRenderer must be true by default. Always.

❌ ANTI-PATTERN 5: Assuming HEAD is the correct git version
   "I'll git checkout HEAD to restore the good version"
   CORRECT: HEAD is NOT always the good version. Find the specific commit hash.

❌ ANTI-PATTERN 6: Injecting new orchestration's artifacts into all workspaces
   "I'll show Research artifacts whenever they exist"
   CORRECT: Guard with outcome === '{outcome}' before injecting any artifacts

❌ ANTI-PATTERN 7: Changing Mission Control routing to favor new orchestration
   "Research should always show instead of Build when both exist"
   CORRECT: Build active run ALWAYS takes priority. New orchestrations show only when Build is not running.

❌ ANTI-PATTERN 8: Treating TypeScript success as proof of correctness
   "TypeScript passes so it works"
   CORRECT: TypeScript proves it compiles. Browser verification proves it works.

❌ ANTI-PATTERN 9: Bundling multiple goals in one sprint
   "While I'm in the file I'll also fix this other thing"
   CORRECT: ONE goal. ONE file change target. Stop when that goal is proven.

❌ ANTI-PATTERN 10: Declaring success without a real browser run
   "The code looks correct so I'll say PASS"
   CORRECT: Run the product. Click the artifact. See the editor. Only then PASS.
```

---

## 12. REGRESSION PROTOCOL (MANDATORY)

### Before every implementation session:

```bash
# Record golden state
git log --oneline -3  # save these hashes
echo "Build golden state recorded at: $(date)"
```

Then manually verify in browser:
1. Build run → artifacts in Desk ✓
2. Click artifact → TipTap editor with toolbar ✓
3. Mission Control → live Build graph ✓

### After every change:

Re-verify the same three things. If any fail:

```
REGRESSION DETECTED
File changed: [filename]
Golden state hash: [hash from before]
Regression behavior: [what broke]
STOP IMMEDIATELY
Do not make further changes
Report the regression
Use git diff to find the exact breaking line
Revert only that line
```

### The regression is fixed only when all three golden-state checks pass again.

---

## 13. FUTURE ORCHESTRATION IMPLEMENTATION TEMPLATE

For each new outcome, use this template to plan before starting:

```
ORCHESTRATION: [Investigate / Plan / Decide / Council / Review / Prioritize / Case Study]

AGENTS:
  Coordinator: CO (always present)
  Specialist 1: [RE/PS/UX/AR/QA] — [role name] — [objective]
  Specialist 2: ...
  Synthesis: CO — [synthesis role]

ARTIFACT MANIFEST:
  hero: [hero artifact id]
  1. [id]: [PM Name] — [which agent produces it]
  2. [id]: [PM Name] — [which agent produces it]
  ...

GRAPH TOPOLOGY:
  CO → [Specialist 1] → [Specialist 2] → ... → CO Synthesis

RECIPE (from D5 canonical list):
  structured-delivery | research-first | parallel-critique | 
  council | red-blue-debate | goal-based-research-loop

NEW FILES REQUIRED:
  src/core/outcome-runtime/step-registry/{outcome}.js

EXISTING FILES TO EXTEND (NOT REWRITE):
  src/app/mission-control/page.tsx (add routing branch)
  src/app/desk/page.tsx (add workspace tree injection)
  src/app/improve/page.tsx (add content-loading case if needed)

EXISTING FILES NOT TOUCHED:
  TipTapRenderer.tsx, WorkspaceExplorer.tsx, GlobalStore.tsx,
  coordinator-v2.js, lifecycle-engine.js, llm.js

ACCEPTANCE TEST:
  Composer → [outcome] → Mission Control (shows [X] nodes) →
  Desk (shows [Y] artifacts) → Studio (TipTap editor works) →
  Build regression check PASS
```

---

## 14. DEFINITION OF DONE

A new orchestration is COMPLETE when ALL of these are verifiable in the browser:

```
□ Composer accepts the new outcome in the outcome grid
□ Composer Mission Brief shows correct artifact list
□ Running the mission produces all expected artifacts at canonical paths
□ artifact-index.json exists with correct schema
□ Mission Control shows orchestration-specific graph with live node updates
□ Desk shows artifacts under the new section when this outcome is active
□ Desk does NOT show new artifacts when Build is active
□ Clicking an artifact opens it in the universal Studio TipTap editor
□ The FormattingToolbar is visible and functional
□ Editing works — text is modifiable
□ Improve works — submits improvement to the correct artifact
□ Accept works — writes v2.md at the canonical path
□ Build mission control shows Build graph (not the new graph)
□ Build Studio still shows TipTap editor for Build artifacts
□ Build Desk shows only Build artifacts when Build is active
□ TypeScript: 0 errors
□ No new components were created for surfaces that already exist
□ No existing component was modified unnecessarily
```

If any checkbox is false: the orchestration is NOT complete.

---

## 15. SESSION MANAGEMENT RULES

These rules exist because context window exhaustion causes architectural drift:

**Rule 1: One goal per Claude Code session.**
Never ask Claude Code to implement more than one goal in a single session. When sessions get long, the earlier constraints are forgotten.

**Rule 2: Attach the context handoff document to every session.**
`IDEAGATE-V3-CONTEXT-HANDOFF.md` must be the FIRST message in every Claude Code session.

**Rule 3: Read before write, always.**
Every Claude Code session must start with a reconnaissance phase that reads the existing implementation before suggesting any change. The phrase "read Build first" must appear in every implementation prompt.

**Rule 4: TypeScript + browser, never TypeScript alone.**
No sprint ends with "TypeScript passes." Every sprint ends with "browser verification of [specific behavior] confirms PASS."

**Rule 5: The regression check is non-negotiable.**
After every change, verify Build still works. This takes 3 minutes. Skipping it has previously cost 1-2 days of regression recovery.

---

*IDEAGATE-ORCHESTRATION-EXTENSION-PLAYBOOK.md · Version 1.0 · August 2026*
*This document governs every future orchestration implementation.*
*New orchestrations extend the shell. They do not rebuild it.*
