# IDEAGATE-MISSION-14-CLAUDE-CODE-RUNBOOK.md
# Mission 14 — Claude Code Execution Runbook
# Version 1.0 | July 2026
# Status: PLANNING — approve after Implementation Plan, before Starter Prompt
# Depends on: SPECIFICATION + DESIGN-SYSTEM + IMPLEMENTATION-PLAN (all approved)

---

## 0. HOW TO USE THIS RUNBOOK

This is the execution script for Mission 14. It contains the exact prompt to paste into Claude
Code for each of the 14 batches plus final, the verification gate for each, and the rollback
protocol. One batch = one checkpoint = one STOP for owner approval. Never paste two batches at
once (the drift failure mode from early Mission 13). Never let Claude Code proceed past a STOP
without explicit owner confirmation.

**Golden rules (restated from MES-V1 and the Specification):**
- Standalone components before protected-file integration.
- Rollback tag before every protected-file edit.
- Read a file completely before editing it.
- Quote the git diff before every commit.
- TypeScript 0 errors before every commit; owner smoke test before every push.
- Tokens only, no hardcoded values. No mocked data shipped. Seven states per component.
- If any verification fails: STOP, report the exact error, do not work around it.

**Reconciliation note (Cmd+K scope):** Batch 1C's command set is the owner-refined list —
Navigate (Desk/Studio/Office), New Idea, Start Lifecycle, Stop Lifecycle, Open Settings, Model
Selection, Search Existing Artifacts, Open Recent Project. Explicitly excluded: AI chat, prompt
generation, workflow scripting, plugins, automation, multi-command execution, agent
orchestration. This supersedes the narrower list in Implementation Plan Batch 1C; back-port when
convenient.

---

## 1. SESSION START (paste once, before any batch)

Use IDEAGATE-MISSION-14-STARTER-PROMPT.md as the first message. It defines the document reading
order, protected files, mission boundary, and the Phase 0 pre-flight. Do not begin Batch 0A
until the starter-prompt pre-flight report is confirmed by the owner.

---

## 2. PHASE 0 — ENGINE FOUNDATION

### CHECKPOINT 0A — Coordinator fallback fix

```
Mission 14 Batch 0A. Engine fix — P-NEW-18. This is a PROTECTED file.

STEP 1 — Create the mission rollback tag BEFORE any edit:
cd /Users/apple/idea-gate-ui-safe && \
git tag -a v4.3-pre-m14 -m "Rollback checkpoint before Mission 14. Restore: git reset --hard v4.3-pre-m14" && \
git push origin v4.3-pre-m14 && echo "TAGGED"

STEP 2 — Read the coordinator fallback locations (do not edit yet):
grep -n "owl-alpha" /Users/apple/idea-gate-ui-safe/src/core/coordinator-v2.js
Quote every match with surrounding context (5 lines each).

STEP 3 — Replace BOTH occurrences of 'openrouter/owl-alpha' with
'nvidia/nemotron-3-super-120b-a12b:free'. Change nothing else — no logic, no structure.

STEP 4 — Verify:
grep -n "owl-alpha" /Users/apple/idea-gate-ui-safe/src/core/coordinator-v2.js
(expect: no matches)
Quote the git diff.

STEP 5 — STOP. Do not commit yet. The owner will run a full lifecycle smoke test to confirm
zero owl-alpha 404s and faster run time before you commit. Wait for confirmation.
```

**GATE 0A:** grep returns nothing; diff shows only the two string changes; owner confirms a
lifecycle run shows no owl-alpha 404 in OpenRouter logs and materially faster completion than
the 19m27s Mission 13 baseline. Then: commit `fix(coordinator): replace owl-alpha fallback with
nemotron-3-super (P-NEW-18)`. Do not push until after Batch 0B (batch the Phase 0 push).

### CHECKPOINT 0B — Grok fix + dependencies + design tokens

```
Mission 14 Batch 0B. Three independent changes, three commits.

STEP 1 — Grok model ID (P-NEW-19). First report the correct OpenRouter slug for xAI Grok 4.1
Fast (the owner will confirm from openrouter.ai/models). Do not edit until the slug is confirmed.
Then update the modelId field (~line 412) in:
/Users/apple/agent-zero-data/workdir/ui-layer/src/lib/model-registry.ts
One field only. Quote the diff.

STEP 2 — Dependencies:
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
npm install framer-motion recharts && \
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "backup-before-claude" | wc -l
(expect 0). Confirm dev server starts and all three pages load. Create a throwaway component
importing both libs, confirm it compiles, delete it.

STEP 3 — Design tokens. Append the design-token CSS custom-property block (from the Design
System document, sections 6-8: surfaces, borders, accent, text, status, spacing, radius,
shadows, motion, type) to:
/Users/apple/agent-zero-data/workdir/ui-layer/src/app/globals.css
Additive only. Nothing reads them yet. Confirm no existing style breaks.

STEP 4 — Commit each separately:
  fix(model-registry): correct xAI Grok model ID (P-NEW-19)
  chore(deps): add framer-motion + recharts for Mission 14
  style(tokens): add design system CSS custom properties (Mission 14)

STEP 5 — Push Phase 0 (both repos):
cd /Users/apple/idea-gate-ui-safe && git pull --rebase origin main && git push origin main
cd /Users/apple/agent-zero-data/workdir/ui-layer && git pull --rebase origin main && git push origin main

STEP 6 — Report and STOP.
```

**GATE 0B / PHASE 0 GATE:** TypeScript 0; deps verified; tokens in DevTools; Grok fixed;
coordinator fixed; both repos pushed; `v4.3-pre-m14` exists. Owner confirms. STOP.

---

## 3. PHASE 1 — GLOBAL SHELL

### CHECKPOINT 1A — NavRail + shell layout

```
Mission 14 Batch 1A. NavRail + app-shell. New component + layout wrapper.

STEP 1 — Create src/components/shell/NavRail.tsx per the Implementation Plan props interface
(NAV_ITEMS array, core + reserved-empty platform sections, active-route via usePathname).
Use design tokens only. Implement the applicable states (success; running indicator). Document
N/A states explicitly in a comment.

STEP 2 — Read src/app/layout.tsx completely. Quote it. Then wrap {children} in the app-shell
(flex row: NavRail + main content-area). Page components are NOT modified.

STEP 3 — Verify: all three pages load in the shell; NavRail highlights the active route;
navigation works via Link with no reload. TypeScript 0. Quote the diff.

STEP 4 — Commit feat(shell): add NavRail + app-shell layout (Mission 14 Phase 1). STOP.
```

**GATE 1A:** pages load; active-route highlight correct; TypeScript 0; owner smoke test. STOP.

### CHECKPOINT 1B — StatusBar

```
Mission 14 Batch 1B. StatusBar. New component + layout mount.

STEP 1 — Create src/components/shell/StatusBar.tsx per props interface. Slot-based (left:
model; center: stage + timer, reserved slots; right: tokens + cost + pulse). Reads GlobalStore
+ RuntimeContext. Mono font for values. All seven states (see Implementation Plan §3 Batch 1B).
Pulse + counters animate only when isRunning.

STEP 2 — Mount <StatusBar/> at the bottom of layout.tsx.

STEP 3 — Verify: empty state on load ("No active run", metrics "—"); populates during a run;
pulse animates only during run. TypeScript 0. Quote diff.

STEP 4 — Commit feat(shell): add slot-based StatusBar (Mission 14). STOP.
```

**GATE 1B:** empty state correct; live data during run; TypeScript 0; owner smoke test. STOP.

### CHECKPOINT 1C — Command Palette (Cmd+K)

```
Mission 14 Batch 1C. Cmd+K command palette. FOUNDATIONAL SCOPE ONLY.

STEP 1 — Create src/components/shell/CommandPalette.tsx per props interface.

COMMANDS (this exact set — nothing more):
  Navigate: Go to Desk, Go to Studio, Go to Office
  Run:      Start Lifecycle, Stop Lifecycle, New Idea
  Settings: Open Settings
  Model:    Switch Model (opens the existing model selector)
  Retrieve: Search Existing Artifacts (searches REAL artifacts from journey.json — never a
            mocked list), Open Recent Project (reads the real project list)

EXPLICITLY FORBIDDEN (do not build, do not stub): AI chat, prompt generation, workflow
scripting, plugin execution, automation, multi-command execution, agent orchestration.

STEP 2 — Behaviour: Cmd/Ctrl+K opens; fuzzy filter; fully keyboard-driven (arrows, Enter,
Esc); dark overlay (--surface-raised + --border-strong); Framer Motion entrance 200ms no
bounce; respect prefers-reduced-motion. Commands call EXISTING handlers — no new logic.
States: empty ("No matching commands"), success (list). Document N/A explicitly.

STEP 3 — Wire a global keydown listener. Touch no existing run/nav logic.

STEP 4 — Verify: Cmd+K opens; each command executes; artifact search returns real artifacts;
recent project opens a real project. TypeScript 0. Quote diff.

STEP 5 — Commit feat(shell): add Cmd+K command palette — foundational (Mission 14). STOP.
```

**GATE 1C:** palette opens, filters, executes; artifact search + recent project use real data
(EP-3); forbidden actions absent; TypeScript 0; owner smoke test. STOP.

### CHECKPOINT 1D — TopBar refinement + Phase 1 regression

```
Mission 14 Batch 1D. Remove tab nav from TopBar (moved to NavRail). Full Phase 1 regression.

STEP 1 — Read src/components/TopBar.tsx completely. Quote the tab-nav Link block.

STEP 2 — Remove ONLY the Desk/Studio/Office tab Links and their container. Keep model selector,
idea input, Run, Stop, New Idea, stage banner untouched. Touch no run or model logic.

STEP 3 — Run the Phase 1 regression checklist (Implementation Plan §3 Batch 1D). Report each
line pass/fail. Then a full 14-stage lifecycle must complete.

STEP 4 — Commit refactor(topbar): remove tab nav; command-bar only (Mission 14). Push both
repos. STOP.
```

**GATE 1D / PHASE 1 GATE:** full regression checklist green; lifecycle completes; Mission 13
features intact; TypeScript 0; pushed; owner confirms. STOP.

---

## 4. PHASE 2 — DESK COMMAND CENTER

### CHECKPOINT 2A — LifecycleNodeChain (standalone)

```
Mission 14 Batch 2A. LifecycleNodeChain — STANDALONE, no page touched.

Create src/components/desk/LifecycleNodeChain.tsx per props interface. CONSTRAINT: render from
the stages array length, never a hardcoded 15/14 — a future partial-lifecycle mode passes a
shorter array and this must just work. Tokens only. All seven states (Implementation Plan §4
Batch 2A). Reasoning surfaced on hover (CT-3/EP-8).

Verify in an isolated dev harness with mock stages for each of the seven states (mock is for
the harness only, never shipped to a page). TypeScript 0. Quote diff.
Commit feat(desk): add LifecycleNodeChain (standalone, Mission 14 Phase 2). STOP.
```

**GATE 2A:** all seven states render in isolation; no hardcoded stage count; TypeScript 0. STOP.

### CHECKPOINT 2B — ArtifactCard + RunInsightPanel (standalone)

```
Mission 14 Batch 2B. ArtifactCard + RunInsightPanel — STANDALONE.

Create both per props interfaces (Implementation Plan §4 Batch 2B). RunInsightPanel appears
only when completedAt is non-null (CT-1 — never faked); surfaces per-stage coordinator
reasoning (CT-3). Tokens only. Seven states each. Verify in isolation. TypeScript 0. Quote diff.
Commit feat(desk): add ArtifactCard + RunInsightPanel (standalone, Mission 14). STOP.
```

**GATE 2B:** both render all states in isolation; RunInsightPanel hidden without completedAt;
TypeScript 0. STOP.

### CHECKPOINT 2C — desk/page.tsx integration (PROTECTED)

```
Mission 14 Batch 2C. Integrate three components into desk/page.tsx. PROTECTED FILE.

STEP 1 — Rollback tag:
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
git tag -a v4.3-pre-desk -m "Before Mission 14 desk integration" && git push origin v4.3-pre-desk && echo "TAGGED"

STEP 2 — Read desk/page.tsx COMPLETELY. Quote: journey.json fetch, artifact-list render,
right-panel render, polling effect, SSE subscription, and the Mission 13 dismissal latch
(dismissedRef etc). Confirm you can see all of these before editing.

STEP 3 — Additive integration only:
  - Insert <LifecycleNodeChain> between TopBar area and artifact list, fed by a stages array
    derived from the already-fetched journey.json.
  - Replace flat artifact list items with <ArtifactCard> (same data, new presentation).
  - Add <RunInsightPanel> to the right panel ABOVE existing context content.
DO NOT change artifact loading, polling, SSE, RuntimeContext consumption, or the dismissal latch.

STEP 4 — Run the Phase 2 regression checklist (Implementation Plan §4 Batch 2C). Every line.
Critical: confirm the dismissal latch still works (New Idea clears; poll does not repopulate).

STEP 5 — Quote diff (only desk/page.tsx changed). TypeScript 0. Commit feat(desk): integrate
node chain, artifact cards, run insight (Mission 14 Phase 2). Push. STOP.
```

**GATE 2C / PHASE 2 GATE:** node chain matches journey.json; nodes navigate; dismissal latch
intact; reasoning surfaced; artifact loading + Studio hand-off unchanged; TypeScript 0; owner
smoke test. STOP.

---

## 5. PHASE 3 — OFFICE ANALYTICS

### CHECKPOINT 3A — OrchestrationGraph (standalone)

```
Mission 14 Batch 3A. OrchestrationGraph — STANDALONE SVG.

Create src/components/office/OrchestrationGraph.tsx per props interface. Renders from the
AGENTS array (six today — adding an agent is a data change, AD-9). SVG only, no WebGL. The
active-node glow (--shadow-glow) is the ONLY glow permitted in the product. Travelling edge dot
on active context transfer (CSS offset-path). All seven states. Verify in isolation with mock
agent/edge data for each state. TypeScript 0. Quote diff.
Commit feat(office): add OrchestrationGraph (standalone, Mission 14). STOP.
```

**GATE 3A:** all states render in isolation; glow only on active nodes; TypeScript 0. STOP.

### CHECKPOINT 3B — ExecutionSummary + LiveLogStream + OfficeTabSwitcher (standalone)

```
Mission 14 Batch 3B. Three standalone components (Implementation Plan §5 Batch 3B).

Create all three per props interfaces. LiveLogStream surfaces coordinator decisions (CT-3);
auto-scroll unless user scrolled up; empty state educates. All values real (EP-3). Seven states.
Verify in isolation. TypeScript 0. Quote diff.
Commit feat(office): add ExecutionSummary + LiveLogStream + tab switcher (standalone). STOP.
```

**GATE 3B:** all three render all states; TypeScript 0. STOP.

### CHECKPOINT 3C — office/page.tsx integration (PROTECTED-adjacent)

```
Mission 14 Batch 3C. Integrate Analytics into office/page.tsx. Preserve pixel art.

STEP 1 — Rollback tag:
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
git tag -a v4.3-pre-office -m "Before Mission 14 office integration" && git push origin v4.3-pre-office && echo "TAGGED"

STEP 2 — Read office/page.tsx COMPLETELY. Quote the Phaser initialization and the SSE
subscription.

STEP 3 — Add <OfficeTabSwitcher> (default active='analytics'). Analytics tab renders
<OrchestrationGraph> + <ExecutionSummary> + <LiveLogStream> fed by the existing SSE
subscription. Agent Activity tab renders the existing pixel-art Phaser view, unchanged.

CRITICAL (R-6): BOTH tabs render; inactive one hidden via CSS display:none. Phaser initializes
ONCE and is NEVER unmounted on tab switch. Verify the canvas is not re-created when switching.

STEP 4 — Run the Phase 3 regression checklist (Implementation Plan §5 Batch 3C). Confirm
explicitly: switching tabs does not re-init Phaser (watch for a canvas flicker or re-mount).

STEP 5 — Quote diff (only office/page.tsx). TypeScript 0. Commit feat(office): Analytics default
view + preserve pixel art (Mission 14 Phase 3). Push. STOP.
```

**GATE 3C / PHASE 3 GATE:** Analytics default; graph reflects live run; log stream real events;
pixel art unchanged; Phaser does not re-init on switch; TypeScript 0; owner smoke test. STOP.

---

## 6. PHASE 4 — STUDIO PREMIUM

### CHECKPOINT 4A — VersionTimeline + ImprovementMetrics (standalone)

```
Mission 14 Batch 4A. Two standalone Studio components (Implementation Plan §6 Batch 4A).
Create both per props interfaces. Real data only (EP-3). Seven states. Verify in isolation.
TypeScript 0. Quote diff.
Commit feat(studio): add VersionTimeline + ImprovementMetrics (standalone, Mission 14). STOP.
```

**GATE 4A:** both render all states in isolation; TypeScript 0. STOP.

### CHECKPOINT 4B — improve/page.tsx integration + envelope + motion + rename

```
Mission 14 Batch 4B. Studio premium integration. improve/page.tsx (not protected).

STEP 1 — Read improve/page.tsx COMPLETELY. Quote the IMPROVE NOW call, ACCEPT logic, and the
version-tracking write.

STEP 2 — Rename displayed label "Improve" → "Studio" (header + visible labels). URL stays
/improve. No redirect, no file rename.

STEP 3 — Context envelope (AD-11): structure the improve request as
{ primary: artifactContent, attachments: [], references: [] }. attachments/references always
empty in Mission 14. The route reads envelope.primary exactly as it reads raw content today.
Confirm no behaviour change.

STEP 4 — Add <VersionTimeline> to the left rail; <ImprovementMetrics> to the right after
improve completes. Add Framer Motion transitions between idle/loading/split-view (300ms, no
bounce, respect reduced-motion).

DO NOT change IMPROVE NOW API logic, ACCEPT logic, version write, or stale propagation.

STEP 5 — Run the Phase 4 / final regression checklist (Implementation Plan §6 Batch 4B),
including the full cross-workspace pass (Desk lifecycle → Studio improve → Office analytics).

STEP 6 — Quote diff. TypeScript 0. Commit feat(studio): premium Studio — version timeline,
metrics, envelope, motion (M14). Push. STOP.
```

**GATE 4B / PHASE 4 GATE:** Studio label correct, URL unchanged; improve+accept identical to
baseline; version timeline works; envelope in use with no behaviour change; motion clean;
full cross-workspace regression green; TypeScript 0; owner smoke test. STOP.

---

## 7. FINAL — DOCUMENTATION SYNC + TAG

```
Mission 14 Batch F. Documentation sync + release tag. Docs only.

STEP 1 — IDEAGATE-MASTER-TODO.md: close P-NEW-13 (Office Analytics), P-NEW-15 (Studio parity),
P-NEW-18 (coordinator fallback), P-NEW-19 (Grok ID). Note P-NEW-12 (Studio) advanced.

STEP 2 — ENGINEERING_STATUS.md: append Mission 14 entry (all batches, commit hashes,
regression results, the Cmd+K addition, the design token system).

STEP 3 — IDEAGATE-STATE-NOW.md: update tab structure (Analytics default in Office), model
constants (owl-alpha fully retired from coordinator + registry), new components list, what-works
list, add Cmd+K, add the design token system, add the NavRail/StatusBar shell.

STEP 4 — Quote the diff (only these three docs). Commit docs(mission-14): state sync + mission
close. Push.

STEP 5 — Tag:
cd /Users/apple/idea-gate-ui-safe && \
git tag -a v4.3-premium-ui -m "IdeaGate v4.3 — Mission 14 Premium UI Foundation & Visual Operating System complete" && \
git push origin v4.3-premium-ui && echo "TAGGED"

STEP 6 — Final report. STOP. Mission 14 closed.
```

**FINAL GATE:** all docs synced; tag pushed; full regression green. Mission 14 complete.

---

## 8. ROLLBACK PROTOCOL

- Any batch fails its gate → revert to the most recent pre-batch tag, report, do not proceed.
- Protected-file batches have dedicated tags: `v4.3-pre-m14` (Phase 0), `v4.3-pre-desk`
  (Batch 2C), `v4.3-pre-office` (Batch 3C).
- Because standalone components precede integration, a failed integration reverts to the
  pre-integration tag without losing the verified standalone components.
- `git reset --hard <tag>` restores; never `--force` push to recover — report instead.

---

## 9. MISSION 14 SUCCESS MEASURES (qualitative acceptance — how we know it worked)

Distinct from per-batch technical gates. Evaluated by the owner after the mission closes,
against the Brand Promise and Experience Principles.

- **Reduced cognitive load** — each screen answers one PM question; progressive disclosure holds.
- **Faster navigation** — nav rail + Cmd+K make any workspace/action reachable in ≤2 steps.
- **Faster artifact access** — node chain + artifact cards + Cmd+K search reach any artifact fast.
- **Visible lifecycle progress** — a viewer can see, at a glance, where a run is and what each
  stage produced.
- **Confidence during long runs** — status bar + orchestration graph + log stream keep the user
  reassured for the full 15-30 min run (no opaque waiting).
- **Visible reasoning** — coordinator decisions are surfaced, not buried (EP-8/CT-3).
- **Discoverability** — Cmd+K and consistent patterns make capability findable.
- **Consistent interaction patterns** — the shell is identical everywhere (EP-7).
- **Interview demonstration quality** — the Office Analytics view lands as a "wow" in a live
  demo; nothing fake, nothing broken.
- **Clear product identity** — IdeaGate is recognizably itself: calm everywhere, alive where the
  intelligence works.
- **Platform extensibility** — a new workspace, agent, nav item, or lifecycle mode can be added
  later without redesign.

---

## 10. APPENDIX — FUTURE EXTENSION POINTS (documented, NOT built)

References the extensibility decisions already made (Specification AD-9..AD-12, extensibility
ledger; Design System §17). Recorded here so future missions inherit direction, not so anything
is built now. Mission 14 builds extension points, not features.

**Future workspaces** (drop into NAV_ITEMS reserved platform section): Research, Discovery,
Feature Prioritization, Case Study, Presentation Builder, Portfolio Builder, Executive Reports,
AI Review, Knowledge Library, Templates, Learning Hub.

**Future lifecycle modes** (the one genuinely new architectural note — enabled cheaply by the
stage-list constraint added in Batch 2A/3A: components render from a stage array, not a
hardcoded 14): Full Idea→Prototype, Discovery-only, Market Research-only, Feature
Prioritization, MVP Definition, PRD Generation, UX Sprint, Architecture Review, Competitive
Analysis, Product Audit, Interview Case Study, Product Strategy Sprint. A future mode passes a
subset stage list; the node chain and orchestration graph already handle it because they render
from the array length, never a hardcoded count.

**Future platform capabilities** (additive surfaces on the same shell + tokens + component
contract; Studio envelope AD-11 already reserves uploads/attachments/references): Collaboration,
Team Workspaces, Shared Projects, Version Comparison, Artifact History, Multi-document Reasoning,
Attachments, PDF/Image Uploads, Reference Documents, AI Review, AI Suggestions, Templates
Marketplace, Plugin Architecture, External Integrations, Portfolio Export, Presentation
Generation, Enterprise Features, Knowledge Graph, Memory Layer, Universal Search, drag-and-drop
artifact organization, smarter project dashboards, and interactive diagram generation (one
underlying model visualized in multiple diagram styles — Mermaid flowcharts, sequence diagrams,
state diagrams, ER diagrams, architecture diagrams, node graphs — in the spirit of Napkin AI's
one-model-many-views approach).

**Future outer flow** (Design System §17; Specification AD-12): Landing → Authentication →
Workspace Selection → Project Dashboard → Shell → Desk/Office/Studio. Mission 14 renders at
current routes; the shell is structured to nest under this later without a rewrite.

None of the above is in Mission 14 scope. All of it is made cheap for later.

---

*Mission 14 Runbook v1.0 | July 2026*
*Next document: IDEAGATE-MISSION-14-STARTER-PROMPT.md (after this is approved) — the final document.*
