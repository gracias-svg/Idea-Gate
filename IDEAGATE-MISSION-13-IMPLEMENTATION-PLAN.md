# IDEAGATE-MISSION-13-IMPLEMENTATION-PLAN.md
# Mission 13 — Stabilisation + Settings Parity
# Version 1.0 | July 2026
# STATUS: PLANNING — do not execute until Specification is reviewed and approved

---

## OVERVIEW

Mission 13 is divided into three independently testable batches. Each batch ends with a
TypeScript check, a targeted smoke test, and a git commit before the next batch begins.
No batch should be started if the previous batch's checkpoint was not confirmed.

```
Batch A → Model Registry + Token Capacity     (2 files, 3 changes, 30-45 min)
     ↓ CHECKPOINT A: TypeScript + model routing smoke test
Batch B → UX Bug Fixes                        (2-3 files, 3 changes, 90-120 min)
     ↓ CHECKPOINT B: TypeScript + UX smoke test (Stop, New Idea, Refresh)
Batch C → Settings Model Selector Parity      (1 file, surgical change, 60-90 min)
     ↓ CHECKPOINT C: TypeScript + Settings smoke test + full regression
Final   → Documentation update + tag v4.2-stable
```

---

## BATCH A — MODEL REGISTRY + TOKEN CAPACITY

### Objective
Update FALLBACK_MODEL_ID, DEFAULT_MODEL_ID, and RECOVERY_MODEL_IDS to remove the Owl Alpha
dependency. Increase max_tokens in llm.js to eliminate the 52-57% artifact truncation rate.

### A0 — Pre-Batch Verification

```bash
# Confirm clean baseline:
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "backup-before-claude" | wc -l
# Expected: 0

# Confirm rollback tag exists:
cd /Users/apple/idea-gate-ui-safe && git tag | grep v4.2-pre-mission-13
# Expected: v4.2-pre-mission-13

# Verify Owl Alpha status manually (user must report result):
echo "USER ACTION REQUIRED: Open https://openrouter.ai/models and search for 'owl-alpha'"
echo "Report: ACTIVE / DEPRECATED / NOT FOUND"
# Do not proceed until user reports the status
```

### A1 — Update model-registry.ts (Owl Alpha retirement + third recovery model)

**File:** `/Users/apple/agent-zero-data/workdir/ui-layer/src/lib/model-registry.ts`

**Read first:**
```bash
grep -n "FALLBACK_MODEL_ID\|DEFAULT_MODEL_ID\|RECOVERY_MODEL_IDS\|owl-alpha\|nemotron" \
  /Users/apple/agent-zero-data/workdir/ui-layer/src/lib/model-registry.ts
```

**Changes to make:**

1. Update `FALLBACK_MODEL_ID`:
   ```typescript
   // Before:
   export const FALLBACK_MODEL_ID = 'openrouter/owl-alpha';
   // After (use confirmed-active free model from A0 check):
   export const FALLBACK_MODEL_ID = 'nvidia/nemotron-3-ultra-253b:free';
   ```

2. Update `DEFAULT_MODEL_ID`:
   ```typescript
   // Before:
   export const DEFAULT_MODEL_ID = 'openrouter/owl-alpha';
   // After:
   export const DEFAULT_MODEL_ID = 'nvidia/nemotron-3-ultra-253b:free';
   ```

3. Update `RECOVERY_MODEL_IDS` to 3 entries:
   ```typescript
   // Before:
   export const RECOVERY_MODEL_IDS = [
     'openrouter/owl-alpha',
     'nvidia/nemotron-3-super-120b-a12b:free',
   ];
   // After:
   export const RECOVERY_MODEL_IDS = [
     'nvidia/nemotron-3-ultra-253b:free',    // new primary (long-context, confirmed active)
     'nvidia/nemotron-3-super-120b-a12b:free', // confirmed working (Mission 11D, 12C)
     'openai/gpt-oss-120b:free',             // third slot (verify active in A0)
   ];
   ```

4. Add short key to LEGACY_KEY_MAP for the new default (so existing DEFAULT_SETTINGS works):
   ```typescript
   // In LEGACY_KEY_MAP, add:
   'nemotron3ultra': 'nvidia/nemotron-3-ultra-253b:free',
   ```

5. Update DEFAULT_SETTINGS in GlobalStore.tsx (if needed — check current value):
   ```bash
   grep -n "defaultModel" \
     /Users/apple/agent-zero-data/workdir/ui-layer/src/lib/GlobalStore.tsx | head -5
   ```
   If `DEFAULT_SETTINGS.defaultModel` is currently `'owlalpha'`, update to `'nemotron3ultra'`
   OR leave as `'owlalpha'` if LEGACY_KEY_MAP already maps it to owl-alpha and that model
   is still technically available (resolveModelId will handle it gracefully in either case).
   Prefer updating to the new key for clarity.

**Diff size expected:** 8-12 lines changed

### A2 — Update llm.js (max_tokens increase)

**File:** `/Users/apple/idea-gate-ui-safe/src/utils/llm.js`

**Read first — DO NOT TOUCH ANYTHING EXCEPT MAX_TOKENS:**
```bash
cat /Users/apple/idea-gate-ui-safe/src/utils/llm.js
```

**Find the max_tokens setting.** It may be:
- A single constant used for all calls → split into two named constants
- An inline value per call type → update each

**Expected changes:**
```javascript
// Before (agent calls):
max_tokens: 4000,
// After:
max_tokens: 8000,

// Before (merge calls — may be a different value or the same):
max_tokens: 4000,
// After:
max_tokens: 12000,
```

**If there is only one max_tokens constant used everywhere:**
```javascript
// Before:
const MAX_TOKENS = 4000;

// After:
const MAX_TOKENS_AGENT = 8000;   // specialist agent document generation
const MAX_TOKENS_MERGE = 12000;  // coordinator merge + synthesis calls
// Update references: agent calls use MAX_TOKENS_AGENT, merge calls use MAX_TOKENS_MERGE
```

**Critical rule:** Do NOT change:
- The model routing logic
- The retry logic
- The error handling
- The response parsing
- Any other constant or logic in this file

**Diff size expected:** 3-8 lines changed (constant values and names only)

### Checkpoint A — Post-Batch A Verification

```bash
# 1. TypeScript check:
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "backup-before-claude" | head -10
# Expected: 0 errors

# 2. Verify changes are correct:
grep -n "FALLBACK_MODEL_ID\|DEFAULT_MODEL_ID\|RECOVERY_MODEL_IDS" \
  /Users/apple/agent-zero-data/workdir/ui-layer/src/lib/model-registry.ts
# Expected: No longer shows owl-alpha for fallback/default

grep -n "max_tokens" /Users/apple/idea-gate-ui-safe/src/utils/llm.js
# Expected: Values of 8000 and 12000 visible

# 3. Commit Batch A:
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
git add src/lib/model-registry.ts && \
cd /Users/apple/idea-gate-ui-safe && \
git add src/utils/llm.js src/lib/model-registry.ts 2>/dev/null || true && \
git commit -m "fix(registry+llm): Owl Alpha retirement + max_tokens increase (Mission 13 Batch A)

model-registry.ts:
  - FALLBACK_MODEL_ID: openrouter/owl-alpha → nvidia/nemotron-3-ultra-253b:free
  - DEFAULT_MODEL_ID: same
  - RECOVERY_MODEL_IDS: now 3 entries (nemotron-ultra, nemotron-super, gpt-oss-120b)
  - Added LEGACY_KEY_MAP entry: nemotron3ultra

llm.js:
  - Agent calls: max_tokens 4000 → 8000
  - Merge calls: max_tokens 4000 → 12000
  - Eliminates 52-57% truncation rate confirmed across Missions 11-12 validation runs

P-NEW-10 CLOSED, P-NEW-3 CLOSED, P-NEW-1 CLOSED"

# 4. Push:
git pull --rebase origin main && git push origin main
```

---

## BATCH B — UX BUG FIXES

### Objective
Fix the Stop → stale lock file issue, diagnose and fix (or document) the Refresh button,
and implement a complete New Idea state reset.

### B0 — Pre-Batch Verification

```bash
# Confirm TypeScript still clean after Batch A:
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "backup-before-claude" | wc -l
# Expected: 0

# Start dev server:
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
rm -rf /Users/apple/agent-zero-data/workdir/ui-layer/.next
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
npm run dev > /tmp/nextjs-dev.log 2>&1 & sleep 10
```

### B1 — Fix Stop Button Lock File Cleanup

**File:** `/Users/apple/agent-zero-data/workdir/ui-layer/src/app/api/run/route.ts`

**Read the DELETE handler first:**
```bash
grep -n "DELETE\|SIGTERM\|SIGKILL\|kill\|current-run\|unlink" \
  /Users/apple/agent-zero-data/workdir/ui-layer/src/app/api/run/route.ts
```

**Change:** After the kill calls (SIGTERM + SIGKILL sequence), add lock file cleanup:
```typescript
// After the process kill logic, add:
try {
  const lockFile = path.join(CLI_DIR, '.current-run.json');
  const pidFile  = path.join(CLI_DIR, '.current-run.pid');
  if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile);
  if (fs.existsSync(pidFile))  fs.unlinkSync(pidFile);
} catch { /* Ignore — files may not exist */ }
```

**Verify `path` and `fs` are already imported** (they should be — run/route.ts already uses
`readDotEnvFile()` which reads files). If not, add at top:
```typescript
import fs from 'fs';
import path from 'path';
```

**Diff size expected:** 6-8 lines added

### B2 — Refresh Button Diagnosis and Fix

**Read first:**
```bash
grep -n "refresh\|handleRefresh\|Refresh\|onClick" \
  /Users/apple/agent-zero-data/workdir/ui-layer/src/components/TopBar.tsx | head -20
```

**Diagnosis protocol:**
1. Find the refresh button's onClick handler
2. If it calls a function → read that function completely
3. Check what the function does: does it call setArtifacts? Does it trigger a /api/data GET?
4. If the handler is missing or a no-op → implement a data refetch
5. If the handler calls something that depends on a protected file → document and defer

**Expected fix (most likely):**
The refresh button should trigger a fresh GET /api/data and update the artifact list:
```typescript
const handleRefresh = useCallback(async () => {
  try {
    const res = await fetch('/api/data');
    if (res.ok) {
      const d = await res.json();
      setArtifacts(d.artifacts ?? []);
    }
  } catch { /* silently ignore */ }
}, [setArtifacts]);
```

**If the root cause is in a protected file:**
- Add a comment to TopBar.tsx: `// TODO: Refresh not implemented — root cause in coordinator layer`
- Commit with message noting the deferral
- Mark B2 as DEFERRED in the mission report
- Do NOT touch the protected file

### B3 — New Idea Complete State Reset

**Read first:**
```bash
grep -n "handleNewIdea\|New Idea\|newIdea\|clearAll\|setArtifacts\|setCurrentProject\|setIdea" \
  /Users/apple/agent-zero-data/workdir/ui-layer/src/components/TopBar.tsx | head -20

grep -n "clearAll\|resetAll\|staleArtifacts\|improvedArtifacts\|setStage" \
  /Users/apple/agent-zero-data/workdir/ui-layer/src/lib/RuntimeContext.tsx | head -20
```

**Goal:** When "+ New Idea" is clicked, all of these must reset:
- The idea text input (clear the text field)
- The left-rail artifact list (empty it)
- The center panel (show "Select an artifact to read")
- The stage counter (reset to "Stage 0 / 14")
- The stale artifact indicators (RuntimeContext staleArtifacts → empty)
- The improved artifacts version counters (RuntimeContext improvedArtifacts → empty)
- The lifecycle map dots (all reset to pending state)

**Implementation approach:**
1. Check if RuntimeContext already exports a reset function
2. If not, add one:
   ```typescript
   // In RuntimeContext.tsx — add to the context:
   const resetWorkspace = useCallback(() => {
     setStaleArtifacts(new Set());
     setImprovedArtifacts(new Map());
     // any other per-run state that should reset
   }, []);
   ```
3. In TopBar.tsx handleNewIdea, call:
   ```typescript
   const handleNewIdea = useCallback(() => {
     setIdea('');
     setArtifacts([]);
     setCurrentProject(null); // or equivalent
     resetWorkspace();        // RuntimeContext reset
     router.push('/desk');    // ensure desk view is active
   }, [...deps]);
   ```

**Critical:** Do NOT touch desk/page.tsx (protected). All resets must happen via shared
state (GlobalStore or RuntimeContext) that desk/page.tsx already reads reactively.

**Diff size expected:** 10-20 lines across TopBar.tsx and RuntimeContext.tsx

### Checkpoint B — Post-Batch B Verification

**Test sequence (user-confirmed):**
```
STOP BUTTON TEST:
□ Start a lifecycle run (enter any idea, click Run)
□ Wait 5 seconds for it to start
□ Click Stop
□ Verify: ls /Users/apple/idea-gate-ui-safe/.current-run.json → "No such file or directory"
□ Verify: http://localhost:3000/desk loads without "active run" warning

NEW IDEA TEST:
□ From a run with 15 artifacts visible in left rail, click "+ New Idea"
□ Verify: left rail shows empty state (no artifacts)
□ Verify: center panel shows starting state
□ Verify: idea text input is empty
□ Verify: stage counter resets to 0/14
□ Navigate to Studio tab and back to Desk — confirm state is still clean

REFRESH BUTTON TEST:
□ If fixed: clicking Refresh updates artifact list from filesystem (no page reload)
□ If deferred: a clear comment is in the code, deferred status documented in mission report
```

```bash
# TypeScript check:
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "backup-before-claude" | wc -l
# Expected: 0

# Commit Batch B:
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
git add src/components/TopBar.tsx \
        src/lib/RuntimeContext.tsx \
        src/app/api/run/route.ts && \
git commit -m "fix(ux): Stop cleans lock file, New Idea resets workspace, Refresh [fixed/deferred] (Mission 13 Batch B)

run/route.ts (DELETE handler):
  - Added lock file cleanup: .current-run.json + .current-run.pid deleted after process kill
  - try-catch handles case where files don't exist

TopBar.tsx:
  - handleNewIdea: now resets idea, artifacts, project, and calls resetWorkspace()
  - handleRefresh: [fixed: triggers /api/data refetch] OR [deferred: root cause documented]

RuntimeContext.tsx:
  - Added resetWorkspace() function: clears staleArtifacts, improvedArtifacts, per-run counters

P-NEW-8 CLOSED, P-NEW-6 CLOSED, P-NEW-11 [CLOSED/DEFERRED]" && \
git pull --rebase origin main && git push origin main
```

---

## BATCH C — SETTINGS MODEL SELECTOR PARITY

### Objective
Replace the legacy `<ModelDropdown />` in SettingsModal.tsx's "AI Models" tab with the
new `<ModelSelector />` component, making the model selection experience identical to TopBar.

### C0 — Pre-Batch Verification

```bash
# TypeScript still clean:
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "backup-before-claude" | wc -l
# Expected: 0

# Read SettingsModal's AI Models section:
grep -n "ModelDropdown\|CAIModels\|defaultModel\|AI Model\|openRouter" \
  /Users/apple/agent-zero-data/workdir/ui-layer/src/components/SettingsModal.tsx | head -30
```

### C1 — Replace ModelDropdown with ModelSelector in SettingsModal.tsx

**Read the full CAIModels function first:**
```bash
sed -n '/function CAIModels/,/^}/p' \
  /Users/apple/agent-zero-data/workdir/ui-layer/src/components/SettingsModal.tsx | head -60
```

**Changes:**

1. Add ModelSelector import alongside existing ModelDropdown import:
   ```typescript
   import { ModelSelector } from '@/components/ModelSelector';
   import { resolveModelId } from '@/lib/model-registry';
   ```

2. In the CAIModels function, find where `<ModelDropdown ... />` renders.
   Replace with:
   ```tsx
   <ModelSelector
     selectedModelId={resolveModelId(s.defaultModel)}
     onSelectModel={(modelId) => saveSettings({ ...s, defaultModel: modelId })}
     disabled={false}
   />
   ```
   (Adjust `s`, `saveSettings` to match actual variable names found in C0 read step)

3. Keep the ModelDropdown import for now (deprecated but still referenced by Office page).
   Add a comment: `// @deprecated — SettingsModal now uses ModelSelector. Keep for Office page.`

4. Do NOT remove any other settings (API keys field, model preferences, Operating Mode —
   these are separate from the model dropdown and must not be touched).

**Diff size expected:** 8-15 lines changed

**Verify the `active` variable no longer crashes:**
Before Mission 12B, SettingsModal had:
```typescript
const active = MODEL_LABELS[s.defaultModel as ModelKey];
```
This was updated to use `getModelMeta(s.defaultModel)` during Mission 12B's crash fix.
Confirm this is still the case. If it was somehow reverted, re-apply the safe accessor pattern.

### Checkpoint C — Post-Batch C Verification

```bash
# TypeScript check:
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "backup-before-claude" | wc -l
# Expected: 0
```

**User-confirmed smoke test:**
```
SETTINGS MODAL TEST:
□ Open http://localhost:3000/desk
□ Click Settings icon (gear) → Settings modal opens
□ Click "AI Models" tab
□ Verify: 22-model selector appears (same visual as TopBar dropdown)
□ Verify: currently selected model shows checkmark
□ Select a model not in the old 10-model list (e.g. Claude Opus 4.8)
□ Click Save (or however settings are saved in this modal)
□ Close modal
□ Verify: TopBar now shows the newly selected model (confirms GlobalStore sync)
□ Reload page → verify selection persisted

REGRESSION TEST (all Mission 12 functionality must still work):
□ http://localhost:3000/desk — loads, artifact list visible
□ Model selector in TopBar — opens, 22 models visible
□ http://localhost:3000/improve (Studio) — loads, IMPROVE NOW functional
□ Run a lifecycle (enter idea, click Run) — starts and generates Stage 0 artifact
□ Stop button — stops the run, lock file cleaned up
□ New Idea button — resets workspace state
```

```bash
# Commit Batch C:
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
git add src/components/SettingsModal.tsx && \
git commit -m "feat(settings): replace ModelDropdown with ModelSelector in Settings AI Models tab (Mission 13 Batch C)

SettingsModal.tsx:
  - CAIModels function: <ModelDropdown /> replaced with <ModelSelector />
  - Wired via resolveModelId(s.defaultModel) at call site (ADR-013 pattern)
  - onSelectModel updates GlobalStore.defaultModel identically to TopBar
  - ModelDropdown import kept (still used by Office page — deprecated comment added)

Model selection is now consistent across:
  TopBar → ModelSelector (22 models) ✓
  Settings AI Models → ModelSelector (22 models) ✓
  Office page → ModelDropdown (legacy, tracked in P-NEW-14) — unchanged

P-NEW-9 CLOSED" && \
git pull --rebase origin main && git push origin main
```

---

## FINAL DOCUMENTATION UPDATE + TAG

### D1 — Update Documentation

```bash
# Update IDEAGATE-MASTER-TODO.md — mark resolved items:
# P-NEW-1, P-NEW-3, P-NEW-6, P-NEW-8, P-NEW-9, P-NEW-10 → mark DONE

# Update ENGINEERING_STATUS.md with Mission 13 completion

# Update IDEAGATE-STATE-NOW.md:
# - FALLBACK_MODEL_ID and DEFAULT_MODEL_ID: update from owl-alpha to new model
# - "What Is At Risk" section: remove P-NEW-10 and P-NEW-1

# Commit documentation:
cd /Users/apple/idea-gate-ui-safe && \
git add IDEAGATE-MASTER-TODO.md ENGINEERING_STATUS.md IDEAGATE-STATE-NOW.md && \
git commit -m "docs(mission-13): mark P-NEW-1,3,6,8,9,10 complete, update state snapshot"
```

### D2 — Mission Validation Run

Run a complete 14-stage lifecycle with the new default model:

```bash
LATEST_BEFORE=$(ls -t /Users/apple/idea-gate-ui-safe/workspace/ | head -1)
# Enter idea in TopBar: "a B2B SaaS tool for remote engineering team onboarding"
# Click Run with default model (Nemotron 3 Ultra or whatever new default was set)
# Wait for all 14 stages to complete

# After run:
LATEST=$(ls -t /Users/apple/idea-gate-ui-safe/workspace/ | head -1)
echo "Run folder: $LATEST"
ls /Users/apple/idea-gate-ui-safe/workspace/$LATEST/artifacts/ | wc -l
head -5 /Users/apple/idea-gate-ui-safe/workspace/$LATEST/artifacts/0-idea-intake.md
```

### D3 — Tag and Push

```bash
cd /Users/apple/idea-gate-ui-safe && \
git tag -a v4.2-stable -m "IdeaGate v4.2 — Stabilised Baseline

Mission 13 complete. Seven known issues resolved:
  P-NEW-10: Owl Alpha replaced as default/fallback (was returning 404)
  P-NEW-3:  Third recovery model added to chain (3 models total)
  P-NEW-1:  max_tokens increased (4K→8K agent, 4K→12K merge) — eliminates 52-57% truncation
  P-NEW-8:  Stop button now cleans .current-run.json lock file
  P-NEW-6:  New Idea button resets all workspace state across all views
  P-NEW-11: Refresh button [fixed/deferred — update before tagging]
  P-NEW-9:  Settings AI Models tab now uses 22-model ModelSelector (matches TopBar)

Validated: 14-stage lifecycle run with new default model, all artifacts generated.
Foundation is now stable for Mission 14 (Premium UI Foundation)." && \
git push origin v4.2-stable && echo "TAGGED"
```

---

## FILE-BY-FILE IMPLEMENTATION CHECKLIST

This checklist merges the implementation steps with expected behaviour, validation, and
regression verification. Use this as the primary tracking artifact during implementation.

### model-registry.ts

```
□ File read in full before any change (grep output quoted)
□ FALLBACK_MODEL_ID changed to confirmed-active free model
□ DEFAULT_MODEL_ID changed to same model
□ RECOVERY_MODEL_IDS has exactly 3 entries, all confirmed active at openrouter.ai/models
□ LEGACY_KEY_MAP has entry for new default short key
□ No other constants or functions changed
□ Diff: only the 4 constant blocks changed
□ TypeScript: 0 errors after change
□ Expected behavior: resolveModelId('owlalpha') → new fallback model ID
□ Expected behavior: resolveModelId('nemotron3ultra') → nvidia/nemotron-3-ultra-253b:free
□ Regression: resolveModelId('haiku') → anthropic/claude-haiku-4-5 (unchanged)
□ Regression: resolveModelId('deepseek') → deepseek/deepseek-r1 (unchanged)
□ Committed with message referencing P-NEW-10, P-NEW-3
```

### llm.js

```
□ File read in full before any change
□ max_tokens for agent calls identified and updated to 8000
□ max_tokens for merge calls identified and updated to 12000
□ If single constant: split into MAX_TOKENS_AGENT and MAX_TOKENS_MERGE
□ No other changes to any function, logic, or import
□ Diff: only max_tokens values changed
□ Expected behavior: OpenRouter requests will now have higher token ceiling
□ Expected behavior: Artifacts will be complete paragraphs, not cut off mid-sentence
□ Regression: LLM call structure unchanged
□ Regression: Error handling unchanged
□ Regression: Model routing unchanged
□ Committed with message referencing P-NEW-1
```

### run/route.ts (DELETE handler only)

```
□ DELETE handler read in full before any change
□ Process kill sequence confirmed (SIGTERM → wait → SIGKILL)
□ fs and path imports confirmed present (or added)
□ Lock file cleanup added AFTER process kill
□ Both .current-run.json and .current-run.pid cleaned up
□ try-catch wraps cleanup (handles file-not-found silently)
□ No other changes to POST, GET, or other handlers
□ Diff: 6-8 lines added in DELETE handler only
□ TypeScript: 0 errors
□ Expected behavior: after Stop, ls .current-run.json → file not found
□ Regression: Stop still terminates the coordinator process
□ Regression: GET /api/run still returns correct running state
□ Committed with message referencing P-NEW-8
```

### TopBar.tsx

```
□ handleRefresh function located and read
□ Root cause of refresh bug identified (documented in commit message regardless)
□ If fixable without protected files: fix applied
□ If requires protected files: deferred, comment added, documented
□ handleNewIdea function read in full
□ All state resets identified: idea text, artifacts, project, RuntimeContext
□ resetWorkspace() call added (after RuntimeContext exposes it)
□ No changes to Run handler, Stop handler, model selector wiring, or disabled states
□ TypeScript: 0 errors
□ Expected behavior (New Idea): all state cleared, desk shows empty state
□ Expected behavior (Refresh): artifact list reloads from filesystem
□ Regression: Run button still triggers lifecycle with correct model
□ Regression: Stop button still kills process
□ Regression: Model selector still shows correct model
□ Committed with message referencing P-NEW-6, P-NEW-11
```

### RuntimeContext.tsx

```
□ File read in full before any change
□ Existing state vars: staleArtifacts (Set), improvedArtifacts (Map) confirmed
□ resetWorkspace() function added to context value and exported
□ All per-run state variables reset in resetWorkspace()
□ Context type updated to include resetWorkspace
□ No changes to markImproved(), markStale(), ARTIFACT_DEPS
□ TypeScript: 0 errors
□ Expected behavior: calling resetWorkspace() clears all stale/improved indicators
□ Regression: version tracking still works after reset
□ Regression: stale propagation still works after reset
□ Committed bundled with TopBar.tsx change
```

### SettingsModal.tsx

```
□ CAIModels function read in full before any change
□ ModelSelector import added
□ resolveModelId import added from model-registry
□ <ModelDropdown /> in CAIModels replaced with <ModelSelector />
□ selectedModelId={resolveModelId(s.defaultModel)} at call site
□ onSelectModel updates GlobalStore.defaultModel
□ ModelDropdown import kept (Office page still uses it)
□ @deprecated comment added to ModelDropdown import
□ No other settings sections changed (API keys, Operating Mode, etc.)
□ getModelMeta() usage in SettingsModal confirmed (safe accessor, not raw MODEL_LABELS)
□ TypeScript: 0 errors
□ Expected behavior: Settings AI Models shows 22 models in 4 categories
□ Expected behavior: selecting model in Settings updates TopBar display
□ Expected behavior: selection persists across reload
□ Regression: API Keys fields still functional
□ Regression: Operating Mode settings still functional
□ Regression: Office page model badge still works (ModelDropdown still importable)
□ Committed with message referencing P-NEW-9
```

---

## REGRESSION CHECKLIST — FULL SUITE

Run this after all three batches are committed, before tagging v4.2-stable:

```
CORE LIFECYCLE (must work end-to-end):
□ Enter idea in TopBar, click Run → lifecycle starts, Stage 0 artifact generated
□ All 14 stages complete without crashing
□ New default model appears in OpenRouter logs for each call
□ finish_reason shows "stop" more frequently than "length" (truncation reduced)

IMPROVE FLOW (Mission 12C — must still work):
□ Navigate to Studio (renamed from Improve)
□ Select artifact, click preset, IMPROVE NOW → HTTP 200, split view renders
□ ACCEPT → artifact saved to disk, version tracker shows v1
□ Downstream artifacts show stale indicator

MODEL SELECTOR (Mission 12A-12B — must still work):
□ TopBar selector: opens, 22 models, search works, filter chips work
□ TopBar selector: selecting model persists across reload
□ Settings selector: opens, 22 models, matches TopBar selection
□ Both selectors reflect same GlobalStore.defaultModel simultaneously

DESK PAGE (must still work):
□ Artifacts listed in left rail
□ Clicking artifact shows content
□ Lifecycle map (right panel) shows stage completion states
□ Downstream stale markers visible when applicable

OFFICE PAGE (must still work):
□ Pixel art office view loads without errors
□ Agent pixel sprites visible
□ No runtime crashes from this page

STOP + RESUME FLOW:
□ Run lifecycle → Stop → lock file deleted → page shows non-running state
□ Start new lifecycle → works correctly (no "already running" false positive)

NEW IDEA FLOW:
□ Click New Idea → all state cleared → entering new idea and running works
□ No state bleed from previous run

SETTINGS:
□ Settings modal opens
□ AI Models tab shows 22-model ModelSelector
□ API Keys section still visible and editable
□ Other settings sections unchanged
```

---

*Document version: 1.0 | July 2026 | STATUS: PLANNING — pending review and approval*
