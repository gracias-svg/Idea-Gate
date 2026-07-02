# IDEAGATE-MISSION-13-CLAUDE-CODE-RUNBOOK.md
# Mission 13 — Stabilisation + Settings Parity
# Version 1.0 | July 2026
# The authoritative sequence for the Claude Code session that executes Mission 13.
# STATUS: PLANNING — do not execute until Specification and Implementation Plan are approved.

---

## HOW TO USE THIS RUNBOOK

This document is the step-by-step Claude Code session guide. Each section is a separate
Claude Code prompt or verification step. Execute them in order. Never skip a verification
gate. If any gate fails, stop and report — do not proceed to the next step.

The prompts are written to be pasted verbatim into the Claude Code chat window.
Customise only the parts marked [USER TO CONFIRM] before pasting.

---

## RUNBOOK PREAMBLE — READ BEFORE STARTING

Before the first Claude Code prompt is sent:

1. **Read these documents in this order:**
   - IDEAGATE-STATE-NOW.md (current system state)
   - IDEAGATE-MISSION-13-SPECIFICATION.md (this mission's scope and risks)
   - IDEAGATE-MISSION-13-IMPLEMENTATION-PLAN.md (batch-by-batch plan)
   - IDEAGATE-ARCHITECTURE-DECISIONS.md (ADR-006, ADR-007, ADR-013 specifically)

2. **Confirm the baseline:**
   - Both repos on branch main, clean working tree
   - v4.1-model-selector tag exists

3. **User completes external check:**
   - Open https://openrouter.ai/models in a browser
   - Search for "owl-alpha" — report ACTIVE / DEPRECATED / NOT FOUND
   - Search for "nemotron-3-ultra" — report ACTIVE / NOT FOUND
   - Search for "nemotron-3-super" — report ACTIVE / NOT FOUND
   - Search for "gpt-oss-120b" — report ACTIVE / NOT FOUND
   - Record these before sending any Claude Code prompt

---

## RUNBOOK STEP 0 — SESSION OPENER + PRE-FLIGHT

**Paste into Claude Code:**

```
You are beginning Mission 13 (Stabilisation + Settings Parity) of IdeaGate PMOS.
This is a stabilisation mission. No new features. No new components. No refactoring
beyond what is explicitly specified. Every change is additive and surgical.

Read these files before doing anything else:
1. /Users/apple/idea-gate-ui-safe/IDEAGATE-STATE-NOW.md
2. /Users/apple/idea-gate-ui-safe/IDEAGATE-MISSION-13-SPECIFICATION.md
3. /Users/apple/idea-gate-ui-safe/IDEAGATE-MISSION-13-IMPLEMENTATION-PLAN.md
4. /Users/apple/idea-gate-ui-safe/IDEAGATE-ARCHITECTURE-DECISIONS.md (sections ADR-006, ADR-007, ADR-013 only)

After reading, run the pre-flight checklist:

STEP 0A — Confirm git baseline:
cd /Users/apple/idea-gate-ui-safe && git log --oneline -3
cd /Users/apple/agent-zero-data/workdir/ui-layer && git log --oneline -3
echo "=== tags ===" && git tag | grep "v4\."

STEP 0B — TypeScript baseline:
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "backup-before-claude" | wc -l && \
echo "BASELINE_TS_COMPLETE"
# Expected: 0

STEP 0C — Create rollback checkpoint:
cd /Users/apple/idea-gate-ui-safe && \
git tag -a v4.2-pre-mission-13 \
  -m "Rollback checkpoint before Mission 13 Stabilisation

Restore with: git reset --hard v4.2-pre-mission-13
State: v4.1-model-selector complete. All Mission 12 work pushed.
Seven P-NEW items to be resolved: P-NEW-1,3,6,8,9,10,11" && \
git push origin v4.2-pre-mission-13 && \
echo "CHECKPOINT_CREATED"

STEP 0D — Report the following before proceeding:
- Most recent commit hash in both repos
- Whether tag v4.2-pre-mission-13 was created successfully
- Current TypeScript error count

Do NOT proceed to Batch A until 0D is reported and confirmed.
```

**Expected output:** Both repos show Mission 12C commits, tag created, TS = 0 errors.
**Gate:** All three confirmed before moving to Batch A.

---

## RUNBOOK STEP 1 — BATCH A OPENER

**User fills in [USER TO CONFIRM] fields based on openrouter.ai/models check.**

**Paste into Claude Code:**

```
USER-CONFIRMED MODEL AVAILABILITY:
  openrouter/owl-alpha:                    [USER TO CONFIRM: ACTIVE/DEPRECATED/NOT FOUND]
  nvidia/nemotron-3-ultra-253b:free:       [USER TO CONFIRM: ACTIVE/NOT FOUND]
  nvidia/nemotron-3-super-120b-a12b:free:  [USER TO CONFIRM: ACTIVE/NOT FOUND]
  openai/gpt-oss-120b:free:               [USER TO CONFIRM: ACTIVE/NOT FOUND]

Based on the above, determine the correct values for:
  NEW_FALLBACK = [nemotron-3-ultra if active, else nemotron-3-super]
  NEW_THIRD_RECOVERY = [gpt-oss-120b if active, else source an alternative free model]

Then execute Batch A as specified in IDEAGATE-MISSION-13-IMPLEMENTATION-PLAN.md Section A.

STEP A0 — Read model-registry.ts:
grep -n "FALLBACK_MODEL_ID\|DEFAULT_MODEL_ID\|RECOVERY_MODEL_IDS\|LEGACY_KEY_MAP\|owl-alpha" \
  /Users/apple/agent-zero-data/workdir/ui-layer/src/lib/model-registry.ts

Quote the output in full before making any changes.

STEP A1 — Apply changes to model-registry.ts:
[Apply as specified in Implementation Plan Section A1]

STEP A2 — Read llm.js before touching it:
cat /Users/apple/idea-gate-ui-safe/src/utils/llm.js

Quote the full file. Identify:
- Where max_tokens is set for agent calls
- Where max_tokens is set for merge calls (may be same constant or different)

Then apply the max_tokens increase as specified in Implementation Plan Section A2.

STEP A3 — Checkpoint A verification:
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "backup-before-claude" | wc -l && \
echo "BATCH_A_TS_PASS"

grep -n "FALLBACK_MODEL_ID\|DEFAULT_MODEL_ID\|RECOVERY_MODEL_IDS" \
  /Users/apple/agent-zero-data/workdir/ui-layer/src/lib/model-registry.ts

grep -n "max_tokens" /Users/apple/idea-gate-ui-safe/src/utils/llm.js

STEP A4 — Diff review:
cd /Users/apple/agent-zero-data/workdir/ui-layer && git diff src/lib/model-registry.ts
cd /Users/apple/idea-gate-ui-safe && git diff src/utils/llm.js

Quote both diffs in full. Confirm:
- No owl-alpha in FALLBACK_MODEL_ID or DEFAULT_MODEL_ID
- RECOVERY_MODEL_IDS has exactly 3 entries
- max_tokens values updated correctly
- No other changes in either file

STEP A5 — Commit Batch A:
[Use commit message from Implementation Plan Section Checkpoint A]

Report:
BATCH_A_COMPLETE
  model-registry.ts: FALLBACK updated to: ___
  model-registry.ts: RECOVERY_MODEL_IDS: ___
  llm.js: agent max_tokens: ___
  llm.js: merge max_tokens: ___
  TypeScript: PASS
  Commit hash: ___

Do NOT proceed to Batch B until this report is confirmed.
```

**Expected output:** New model IDs in registry, 8000/12000 in llm.js, TS clean, committed.
**Gate:** User confirms report before Batch B.

---

## RUNBOOK STEP 2 — BATCH B OPENER

**Paste into Claude Code:**

```
Batch A confirmed complete. Begin Batch B — UX Bug Fixes.

HARD SAFETY RULE FOR BATCH B:
If the Refresh button root cause is in any of these files, do NOT touch them.
Document the finding and mark B2 as DEFERRED:
  coordinator-v2.js / lifecycle-engine.js / journey-engine.js (any protected file)
Only fix B2 if the entire fix is contained within TopBar.tsx or a non-protected API route.

STEP B0 — Read the three files before touching anything:
grep -n "handleRefresh\|handleNewIdea\|DELETE\|SIGTERM\|current-run" \
  /Users/apple/agent-zero-data/workdir/ui-layer/src/components/TopBar.tsx | head -30

grep -n "clearAll\|resetAll\|staleArtifacts\|improvedArtifacts" \
  /Users/apple/agent-zero-data/workdir/ui-layer/src/lib/RuntimeContext.tsx | head -20

grep -n "DELETE\|kill\|current-run\|unlink" \
  /Users/apple/agent-zero-data/workdir/ui-layer/src/app/api/run/route.ts | head -20

Quote all three outputs before making any changes.

STEP B1 — Fix Stop button lock file cleanup:
Read the full DELETE handler in run/route.ts first:
sed -n '/export async function DELETE/,/^}/p' \
  /Users/apple/agent-zero-data/workdir/ui-layer/src/app/api/run/route.ts

Apply the cleanup as specified in Implementation Plan Section B1.
Confirm fs and path are imported. If not, add them.

STEP B2 — Diagnose and fix (or defer) Refresh button:
Read the handleRefresh function completely.
State clearly: is the fix self-contained in TopBar.tsx? YES/NO
If YES: apply fix.
If NO: add comment to TopBar.tsx, mark B2 DEFERRED in this report.

STEP B3 — Implement New Idea complete state reset:
Read handleNewIdea in TopBar.tsx and the RuntimeContext in full.
Implement resetWorkspace() in RuntimeContext.tsx if it does not exist.
Update handleNewIdea in TopBar.tsx to call it.
Apply as specified in Implementation Plan Section B3.

STEP B4 — Checkpoint B TypeScript:
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "backup-before-claude" | wc -l && \
echo "BATCH_B_TS_PASS"

STEP B5 — Diff review before commit:
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
git diff src/components/TopBar.tsx src/lib/RuntimeContext.tsx src/app/api/run/route.ts

Confirm:
- Lock file cleanup added in DELETE handler
- handleNewIdea clears all workspace state
- No protected files touched
- Diff is as narrow as specified

STEP B6 — User smoke test:
Tell user to perform these tests at http://localhost:3000:
1. Start a run, click Stop → verify lock file is gone:
   ls /Users/apple/idea-gate-ui-safe/.current-run.json
   Expected: No such file or directory
2. With artifacts visible, click New Idea → left rail clears, idea input empty
3. Refresh button: report whether fixed or deferred

Wait for user confirmation before committing.

STEP B7 — Commit Batch B:
[Use commit message from Implementation Plan Section Checkpoint B]

Report:
BATCH_B_COMPLETE
  B1 (Stop lock file): DONE
  B2 (Refresh): FIXED / DEFERRED — reason: ___
  B3 (New Idea reset): DONE
  TypeScript: PASS
  User smoke test: PASS
  Commit hash: ___

Do NOT proceed to Batch C until confirmed.
```

**Expected output:** Lock file cleanup confirmed by user, New Idea resets state, TS clean.
**Gate:** User smoke test results confirmed before Batch C.

---

## RUNBOOK STEP 3 — BATCH C OPENER

**Paste into Claude Code:**

```
Batch B confirmed complete. Begin Batch C — Settings Model Selector Parity.

This is the highest-risk batch because it touches SettingsModal.tsx, which has multiple
sections. The change must be surgical — only the CAIModels function's dropdown component
is replaced. Nothing else in this file changes.

STEP C0 — Read SettingsModal.tsx CAIModels section:
grep -n "function CAIModels\|ModelDropdown\|defaultModel\|active\|MODEL_LABELS\|getModelMeta" \
  /Users/apple/agent-zero-data/workdir/ui-layer/src/components/SettingsModal.tsx | head -40

Also read the CAIModels function body:
sed -n '/function CAIModels/,/^function /p' \
  /Users/apple/agent-zero-data/workdir/ui-layer/src/components/SettingsModal.tsx | head -80

Quote both outputs before making any changes.

Identify:
- The exact line where <ModelDropdown ... /> renders inside CAIModels
- The variable holding the currently selected model (s.defaultModel or equivalent)
- The save function called when selection changes (updateSettings, saveSettings, etc.)
- Whether MODEL_LABELS is still referenced directly (must not be — should be getModelMeta)

STEP C1 — Apply ModelSelector replacement:
Add imports:
  import { ModelSelector } from '@/components/ModelSelector';
  import { resolveModelId } from '@/lib/model-registry';

In CAIModels, replace the <ModelDropdown ... /> render with:
  <ModelSelector
    selectedModelId={resolveModelId(s.defaultModel)}
    onSelectModel={(modelId) => [save function]({ ...s, defaultModel: modelId })}
    disabled={false}
  />

Add @deprecated comment to the ModelDropdown import.
Do NOT touch any other part of this file.

STEP C2 — TypeScript check:
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "backup-before-claude" | head -10 && \
echo "BATCH_C_TS_PASS"

STEP C3 — Diff review:
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
git diff src/components/SettingsModal.tsx

Confirm:
- Only CAIModels function changed
- Only the dropdown component replaced
- resolveModelId() at call site (NOT inside ModelSelector)
- ModelDropdown import kept with @deprecated comment
- No other settings sections changed

STEP C4 — Restart dev server for smoke test:
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
rm -rf /Users/apple/agent-zero-data/workdir/ui-layer/.next
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
npm run dev > /tmp/nextjs-dev.log 2>&1 & sleep 10 && \
lsof -i :3000 | grep LISTEN | head -2

Tell user to run Settings smoke test:
1. Click Settings (gear icon)
2. Click AI Models tab
3. Confirm: 22 models visible in 4 categories (same as TopBar)
4. Select a model not in old 10-model list (e.g. Gemini 2.5 Pro or xAI Grok 4.1 Fast)
5. Save settings (click Save or close modal if auto-save)
6. Confirm: TopBar now shows the same model
7. Reload page → confirm selection persisted

Wait for user confirmation before committing.

STEP C5 — Full regression check:
Tell user to run the full regression checklist from Implementation Plan Section
"REGRESSION CHECKLIST — FULL SUITE"

Wait for all boxes confirmed before committing.

STEP C6 — Commit Batch C:
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
git add src/components/SettingsModal.tsx && \
git diff --cached --stat && \
git commit -m "feat(settings): ModelSelector replaces ModelDropdown in Settings AI Models tab (Mission 13 Batch C)

SettingsModal.tsx:
  - CAIModels: <ModelDropdown /> replaced with <ModelSelector />
  - resolveModelId() wraps selectedModelId at call site (ADR-013 pattern)
  - ModelDropdown import kept with @deprecated comment (still used by Office page)
  - All other settings sections untouched

Model selection now consistent across all product surfaces:
  TopBar → ModelSelector ✓
  Settings AI Models → ModelSelector ✓
  Office page → ModelDropdown (legacy, P-NEW-14, future cleanup)

P-NEW-9 CLOSED" && \
git pull --rebase origin main && git push origin main && echo "BATCH_C_PUSHED"

Report:
BATCH_C_COMPLETE
  SettingsModal: ModelSelector wired ✓
  User confirmed: 22 models visible in Settings ✓
  User confirmed: TopBar + Settings reflect same model ✓
  Full regression: PASS
  TypeScript: PASS
  Commit hash: ___
```

**Expected output:** Settings shows 22 models, synced with TopBar, regression clean.
**Gate:** User full regression checklist confirmed before Final Documentation step.

---

## RUNBOOK STEP 4 — FINAL DOCUMENTATION + TAG

**Paste into Claude Code:**

```
All three batches complete and confirmed. Proceed to final documentation and tagging.

STEP D1 — Update IDEAGATE-MASTER-TODO.md:
Mark these items as DONE (add "✅ CLOSED — Mission 13" next to each):
  P-NEW-1: max_tokens increase
  P-NEW-3: Third recovery model
  P-NEW-6: New Idea reset
  P-NEW-8: Stop button lock file
  P-NEW-9: Settings model selector parity
  P-NEW-10: Owl Alpha retirement

If B2 (Refresh) was DEFERRED, leave P-NEW-11 open and add a note: "Root cause: [what was found]"

STEP D2 — Run validation lifecycle:
Start the dev server if not already running.
Tell user: "Please run one complete lifecycle with the new default model to confirm end-to-end stability. Enter any idea, click Run, wait for all 14 stages to complete. Report: model shown in OpenRouter logs, whether any stages truncated."

Wait for user to confirm lifecycle completed successfully.

STEP D3 — Tag and push:
cd /Users/apple/idea-gate-ui-safe && \
git tag -a v4.2-stable -m "IdeaGate v4.2 — Stabilised Baseline (Mission 13 Complete)

Mission 13 resolved 7 known issues:
  P-NEW-10 ✅: Owl Alpha replaced as default/fallback (was returning 404 on OpenRouter)
  P-NEW-3  ✅: Third recovery model added to RECOVERY_MODEL_IDS (3 models total)
  P-NEW-1  ✅: max_tokens increased — eliminates 52-57% truncation rate
  P-NEW-8  ✅: Stop button cleans .current-run.json lock file on process kill
  P-NEW-6  ✅: New Idea button resets all workspace state across all views
  P-NEW-9  ✅: Settings AI Models tab now uses 22-model ModelSelector (matches TopBar)
  P-NEW-11: [CLOSED with fix / DEFERRED — root cause: ___]

Validated: 14-stage lifecycle complete with new default model.
Foundation stable for Mission 14 (Premium UI Foundation + Analytics Dashboard)." && \
git push origin v4.2-stable && echo "TAGGED_v4.2"

STEP D4 — Final report:

MISSION 13 FINAL REPORT
══════════════════════════════════════════════════
BATCH A (Model Registry + Token Capacity):
  P-NEW-10: CLOSED — New default: ___
  P-NEW-3:  CLOSED — Recovery chain: [model1, model2, model3]
  P-NEW-1:  CLOSED — Agent: 8000 / Merge: 12000 tokens
  Commit: ___

BATCH B (UX Bug Fixes):
  P-NEW-8:  CLOSED — Lock file cleanup confirmed
  P-NEW-6:  CLOSED — New Idea reset confirmed by user
  P-NEW-11: CLOSED/DEFERRED — ___
  Commit: ___

BATCH C (Settings Parity):
  P-NEW-9:  CLOSED — Settings shows 22 models, synced with TopBar
  Commit: ___

DOCUMENTATION + TAG:
  P-NEW items updated in TODO: YES
  Validation lifecycle: PASS (model: ___)
  Tag v4.2-stable: PUSHED

MISSION 13: COMPLETE ✅

NEXT MISSION: Mission 14 — Premium UI Foundation
  Scope: Pipeline visualizer, analytics dashboard, agent cards, live stream panel,
         Office Analytics sub-tab, Framer Motion, Studio rename, stage skip visualization
  Requires: Mission 14 Specification document
  Starting tag: v4.2-stable

Stop. Do not begin Mission 14. Report back and wait for explicit approval.
```

**Expected output:** Tag pushed, TODO updated, validation run confirmed.
**Gate:** Mission 13 Complete status reported before any Mission 14 work.

---

## GIT TAGGING STRATEGY FOR MISSION 13

```
TAGS CREATED IN THIS MISSION:

v4.2-pre-mission-13    — rollback point, created at Step 0 BEFORE any changes
                         Use for emergency full rollback if needed

v4.2-stable            — created at Step 4 AFTER all changes validated
                         Marks the stable baseline for Mission 14

Per-batch tags are NOT created for Mission 13 (batches are small enough that
per-file git checkout is sufficient for mid-batch rollback).

COMMIT STRUCTURE:
  Batch A: 1 commit (model-registry.ts + llm.js bundled — same intent)
  Batch B: 1 commit (TopBar.tsx + RuntimeContext.tsx + run/route.ts — same intent)
  Batch C: 1 commit (SettingsModal.tsx only)
  Docs:    1 commit (TODO updates + ENGINEERING_STATUS)
  Total:   4 commits + 2 tags = clean, readable history
```

---

## COMPLETION CRITERIA SUMMARY

```
Mission 13 is COMPLETE when ALL of the following are confirmed:

□ v4.2-pre-mission-13 tag exists and was pushed before first code change
□ FALLBACK_MODEL_ID no longer points to openrouter/owl-alpha
□ DEFAULT_MODEL_ID no longer points to openrouter/owl-alpha
□ RECOVERY_MODEL_IDS has exactly 3 entries, all confirmed active
□ max_tokens increased to 8000 (agent) and 12000 (merge) in llm.js
□ Stop button confirmed: lock file deleted after Stop, no false-positive active-run detection
□ New Idea confirmed: all workspace state cleared across all views
□ Refresh button: fixed OR deferred with documented root cause
□ Settings AI Models tab: shows 22-model ModelSelector, synced with TopBar
□ TypeScript: 0 errors throughout all batches
□ Full regression suite: all Mission 12 functionality confirmed working
□ Validation lifecycle: 14-stage run completed with new default model
□ 4 commits pushed, both repos synced
□ v4.2-stable tagged and pushed
□ P-NEW-1, P-NEW-3, P-NEW-6, P-NEW-8, P-NEW-9, P-NEW-10 marked CLOSED in TODO
```

---

*Document version: 1.0 | July 2026 | STATUS: PLANNING — pending review and approval*
