# IDEAGATE-MISSION-13-SPECIFICATION.md
# Mission 13 — Stabilisation + Settings Parity
# Version 1.0 | July 2026
# STATUS: PLANNING — do not execute until this document is reviewed and approved

---

## 1. MISSION OVERVIEW

### 1.1 Mission Name
**Mission 13 — Stabilisation + Settings Parity**

### 1.2 Single Objective
Eliminate all known system instabilities, UX bugs, and quality degradations that currently
exist in the v4.1-model-selector baseline, and bring the Settings Modal model selector into
parity with the new 22-model registry-native selector already deployed in TopBar.

### 1.3 Why This Mission Exists
The v4.1 baseline has seven confirmed issues that, left unresolved, will cause visible
failures during recruiter demos, degrade AI output quality on every run, or silently route
lifecycle executions to a broken or retired model. None of these issues can be deferred into
Mission 14's premium UI work — a beautiful UI on top of a broken foundation is worse than
a plain UI on top of a stable one.

### 1.4 Success Statement
At the end of Mission 13, IdeaGate should be demoed to 20-25 invited users with full
confidence that:
- No API call will fail due to a retired or broken model
- No lifecycle artifact will be truncated mid-sentence
- The model dropdown is consistent everywhere in the product (TopBar = Settings = same 22 models)
- All basic UX flows (Refresh, New Idea, Stop) behave correctly
- A user who clicks Stop sees a clean slate on the next page load

### 1.5 Mission Classification
- Type: Stabilisation + Parity
- Risk level: LOW-MEDIUM (no new features, additive changes only)
- Estimated duration: 2-3 engineering days
- Blocking: Yes — Missions 14-20 should not begin until Mission 13 is tagged complete
- Commits expected: 8-12 commits across 3 batches
- Tag on completion: `v4.2-stable`

---

## 2. ARCHITECTURE CONTEXT

### 2.1 Current System Baseline (v4.1-model-selector)
Read IDEAGATE-STATE-NOW.md Section 1-3 for the full picture. Summary for this mission:

```
Two repos, one GitHub remote:
  CLI Engine:  /Users/apple/idea-gate-ui-safe/         (branch: main)
  UI Layer:    /Users/apple/agent-zero-data/workdir/ui-layer/  (branch: main)

Key files relevant to Mission 13:
  model-registry.ts   — canonical model source, FALLBACK_MODEL_ID at risk
  llm.js              — max_tokens hardcoded at 4,000 (PROTECTED FILE)
  run/route.ts        — Stop handler (missing lock file cleanup)
  TopBar.tsx          — Refresh button, New Idea handler, Stop/Run state
  SettingsModal.tsx   — CAIModels component still uses legacy ModelDropdown
  GlobalStore.tsx     — safe accessors getModelMeta/isModelFree already present
  ModelSelector/      — 9-file component, proven working since Mission 12A
```

### 2.2 Key Architectural Decisions Relevant to This Mission

**ADR-006:** model-registry.ts is the single canonical model source. Changes to model
availability are made only in this file.

**ADR-007:** LEGACY_KEY_MAP entries are never deleted — only entries for new defaults are
added. When updating FALLBACK_MODEL_ID, add the new model's short key to LEGACY_KEY_MAP
if a short key is needed in DEFAULT_SETTINGS.

**ADR-013:** ModelSelector reads ONLY from MODEL_REGISTRY. When wiring it into SettingsModal,
resolution of the stored defaultModel string happens at the call site (via resolveModelId()),
not inside the component.

**ADR-003:** API keys are always read from .env at request time. No changes to this pattern
in Mission 13.

**ADR-015:** When two components solve the same problem differently, converge toward the
canonical implementation. The SettingsModal currently uses ModelDropdown (legacy, 10 models).
TopBar now uses ModelSelector (22 models). After Mission 13, both use ModelSelector.

### 2.3 Protected Files in This Mission
These files are referenced but changes must be minimal and surgical:

```
PROTECTED (touch only if absolutely required, changes need explicit justification):
  /Users/apple/idea-gate-ui-safe/src/core/coordinator-v2.js
  /Users/apple/idea-gate-ui-safe/src/core/lifecycle-engine.js
  /Users/apple/idea-gate-ui-safe/src/core/journey-engine.js
  /Users/apple/agent-zero-data/workdir/ui-layer/src/lib/parseContent.ts
  /Users/apple/agent-zero-data/workdir/ui-layer/src/app/desk/page.tsx

PROTECTED (touch llm.js ONLY for the max_tokens change, zero other changes):
  /Users/apple/idea-gate-ui-safe/src/utils/llm.js

NOT IN SCOPE (do not touch these in Mission 13):
  improve/page.tsx (now called Studio internally — Mission 16 scope)
  office/page.tsx (Mission 14 scope — Analytics sub-tab)
  Any new React components (Mission 14 scope)
```

---

## 3. SCOPE

### 3.1 In Scope — The Seven Items

**Batch A — Model Registry + Token Capacity (3 items, same 2 files)**

| Item | P-NEW ID | Description | File | Risk |
|---|---|---|---|---|
| A1 | P-NEW-10 | Owl Alpha default/fallback model update | model-registry.ts | LOW |
| A2 | P-NEW-3 | Add third model to RECOVERY_MODEL_IDS | model-registry.ts | NONE |
| A3 | P-NEW-1 | Increase max_tokens (4K→8K agent, 4K→12K merge) | llm.js | LOW |

**Batch B — UX Bug Fixes (3 items, 2 files)**

| Item | P-NEW ID | Description | File | Risk |
|---|---|---|---|---|
| B1 | P-NEW-8 | Stop button clears .current-run.json lock file | run/route.ts | NONE |
| B2 | P-NEW-11 | Diagnose and fix refresh button | TopBar.tsx | LOW |
| B3 | P-NEW-6 | New Idea complete state reset (all views) | TopBar.tsx, RuntimeContext.tsx | MEDIUM |

**Batch C — Settings Model Selector Parity (1 item, 1 file)**

| Item | P-NEW ID | Description | File | Risk |
|---|---|---|---|---|
| C1 | P-NEW-9 | Replace ModelDropdown in Settings with ModelSelector | SettingsModal.tsx | MEDIUM |

### 3.2 Out of Scope — Explicitly Not Part of Mission 13

The following items look related but must NOT be included. Including them would expand scope,
increase risk, and delay the stabilisation checkpoint.

| Item | Why Out of Scope | Where It Belongs |
|---|---|---|
| Mermaid diagrams in artifacts | Requires lifecycle-engine.js changes | Mission 15 |
| Stage Confidence Radar | New component, not stabilisation | Mission 14 |
| Token Burn Rate Heatmap | New UI component | Mission 15 |
| Continue/Resume button | New API route + coordinator entry point | Mission 16 |
| Studio rename | UI-only change, safe to bundle into Mission 14 | Mission 14 |
| Office Analytics sub-tab | Major new component | Mission 14 |
| Any Framer Motion animation | Mission 14 scope | Mission 14 |
| Supabase integration | Mission 17 scope | Mission 17 |
| DataAgent missing in createAgents() | Not causing user-visible issues today | Future |
| serverAuth.ts extraction | Refactoring, not stabilisation | Future cleanup |

---

## 4. AFFECTED FILES

### 4.1 CLI Engine Repo (idea-gate-ui-safe)

```
src/utils/llm.js
  Change: max_tokens constants
  Risk: LOW — one or two constant changes
  Rollback: git checkout src/utils/llm.js

src/lib/model-registry.ts  [if exists here — verify location]
```

### 4.2 UI Layer Repo (ui-layer)

```
src/lib/model-registry.ts
  Change: FALLBACK_MODEL_ID, DEFAULT_MODEL_ID, RECOVERY_MODEL_IDS
  Risk: LOW — constant changes only
  Rollback: git checkout src/lib/model-registry.ts

src/app/api/run/route.ts
  Change: Add lock file cleanup in DELETE handler
  Risk: NONE — one try-catch block addition
  Rollback: git checkout src/app/api/run/route.ts

src/components/TopBar.tsx
  Change: Refresh button handler, New Idea complete reset
  Risk: MEDIUM — refresh handler diagnosis may reveal complexity
  Rollback: git checkout src/components/TopBar.tsx

src/lib/RuntimeContext.tsx (if New Idea reset requires it)
  Change: Potential clearAll() function or equivalent reset method
  Risk: MEDIUM — verify before touching
  Rollback: git checkout src/lib/RuntimeContext.tsx

src/components/SettingsModal.tsx
  Change: CAIModels function — replace ModelDropdown with ModelSelector
  Risk: MEDIUM — replaces a working component with new one
  Rollback: git checkout src/components/SettingsModal.tsx
```

### 4.3 Files That Must NOT Change

```
coordinator-v2.js   — protected
lifecycle-engine.js — protected
journey-engine.js   — protected
parseContent.ts     — protected
desk/page.tsx       — protected
improve/page.tsx    — Mission 16 scope
office/page.tsx     — Mission 14 scope
ModelSelector/*     — already proven, do not modify
GlobalStore.tsx     — already contains safe accessors, no changes needed
```

---

## 5. DEPENDENCIES

### 5.1 Prerequisites (must be true before starting)

```
□ v4.1-model-selector tag exists and is pushed to GitHub
□ Both repos are on main branch, clean working tree (git status shows nothing uncommitted)
□ npm run dev starts successfully on port 3000
□ TypeScript has 0 errors on current baseline
□ The Improve flow (IMPROVE NOW + ACCEPT) continues to work
□ No active lifecycle run is in progress when starting
□ Owl Alpha status verified at openrouter.ai/models (required before Batch A)
```

### 5.2 External Dependencies

```
OpenRouter model availability:
  Required check before A1/A2:
  - nvidia/nemotron-3-ultra-253b:free  — verify ACTIVE on openrouter.ai
  - nvidia/nemotron-3-super-120b-a12b:free — verify ACTIVE (was confirmed working in Mission 11D)
  - openai/gpt-oss-120b:free — verify ACTIVE (new candidate for third recovery slot)
  
  If nemotron-3-ultra is also unavailable: use nvidia/nemotron-3-super as the new primary
  and source an alternative third model.
```

### 5.3 Internal Dependencies

```
Batch A must complete before Batch C (Settings selector must show the updated model list)
Batch B is independent — can be done in any order relative to A and C
Batch C depends on ModelSelector/* (already built in Mission 12A, stable)
```

---

## 6. RISK MANAGEMENT AND ROLLBACK STRATEGY

### 6.1 Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| nemotron-3-ultra also 404 on OpenRouter | MEDIUM | HIGH | Fall back to nemotron-3-super as primary, source different third model |
| max_tokens increase causes rate limit errors on free models | LOW | MEDIUM | Free models have their own max ceiling per request; verify model's actual max before setting |
| Refresh button bug is in a protected file (coordinator or journey engine) | LOW | MEDIUM | Document root cause, defer fix to an isolated mission rather than touching protected files |
| New Idea reset breaks desk/page.tsx state | MEDIUM | HIGH | Read desk/page.tsx fully before touching RuntimeContext; test isolated before committing |
| SettingsModal ModelSelector causes style conflicts | LOW | LOW | The component is already proven in TopBar; same props, same styling |
| TypeScript errors after SettingsModal change | MEDIUM | LOW | Apply as ModelKey cast at call site (proven pattern from Mission 12B) |

### 6.2 Pre-Mission Rollback Checkpoint

**MANDATORY: Create this tag before ANY code change in Mission 13**

```bash
cd /Users/apple/idea-gate-ui-safe && \
git tag -a v4.2-pre-mission-13 \
  -m "Rollback checkpoint before Mission 13 (Stabilisation)

State: v4.1-model-selector complete, all Mission 12 work pushed.
Restore with: git reset --hard v4.2-pre-mission-13
Covers: both repos via shared remote" && \
git push origin v4.2-pre-mission-13 && \
echo "CHECKPOINT_CREATED"
```

### 6.3 Per-Batch Rollback Commands

**If Batch A breaks something:**
```bash
# Both repos share the same remote — reset UI layer:
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
git checkout src/lib/model-registry.ts

# Reset CLI repo (llm.js):
cd /Users/apple/idea-gate-ui-safe && \
git checkout src/utils/llm.js

# Verify TypeScript:
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "backup-before-claude"
```

**If Batch B breaks something:**
```bash
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
git checkout src/components/TopBar.tsx && \
git checkout src/lib/RuntimeContext.tsx 2>/dev/null || true && \
git checkout src/app/api/run/route.ts
```

**If Batch C breaks something:**
```bash
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
git checkout src/components/SettingsModal.tsx
```

**Full rollback to pre-mission baseline:**
```bash
cd /Users/apple/idea-gate-ui-safe && \
git reset --hard v4.2-pre-mission-13

cd /Users/apple/agent-zero-data/workdir/ui-layer && \
git reset --hard v4.2-pre-mission-13
```

### 6.4 Non-Failure Scenarios (do not treat as failures)

```
SCENARIO: OpenRouter logs show higher token usage after max_tokens increase
REASON:   Correct behaviour — models now generate complete outputs instead of truncating
ACTION:   None. This is the intended result. Monitor cost per run.

SCENARIO: Some free models hit their own ceiling below the new max_tokens value
REASON:   Each model has its own max output tokens. The setting is a ceiling, not a floor.
ACTION:   None. The model will generate what it can. Run quality improves regardless.

SCENARIO: Settings modal now shows 22 models instead of 10
REASON:   This is exactly what Mission 13 is supposed to achieve.
ACTION:   None. Verify categories appear correctly (same 4 visible categories as TopBar).

SCENARIO: .current-run.json cleanup produces a file-not-found error in the DELETE handler
REASON:   The file may already not exist (if Stop was never clicked). try-catch handles this.
ACTION:   None. The try-catch is there precisely to handle this case silently.

SCENARIO: The refresh button fix reveals the handler is in a protected file
REASON:   Possible — the refresh may trigger a coordinator-level re-poll.
ACTION:   Do NOT touch protected files. Document root cause in the commit message, defer fix
          to a standalone diagnosis session. Mark B2 as DEFERRED in the mission report.
```

### 6.5 Verification After Rollback

After any rollback, verify the baseline is restored:

```bash
# TypeScript check:
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "backup-before-claude" | wc -l
# Expected: 0

# Server starts:
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
cd /Users/apple/agent-zero-data/workdir/ui-layer && npm run dev &
sleep 8 && lsof -i :3000 | grep LISTEN | head -2
# Expected: node process on port 3000

# Mission 12 Improve flow still works:
# Open http://localhost:3000/improve, select artifact, click preset, IMPROVE NOW
# Expected: HTTP 200, split view renders
```

---

## 7. VALIDATION CHECKLIST — PRE-MISSION

Run all checks. Do not begin any batch until all boxes are checked.

```
PRE-MISSION STATE VERIFICATION
═══════════════════════════════════════════════════════════════
□ git status (both repos): clean working tree, no uncommitted changes
□ git log --oneline -3 (both repos): most recent commit is from Mission 12C
□ npx tsc --noEmit: 0 errors in ui-layer
□ npm run dev: server starts on port 3000 without errors in /tmp/nextjs-dev.log
□ http://localhost:3000/desk: page loads, model selector shows "DeepSeek R1" or current model
□ http://localhost:3000/improve: page loads, IMPROVE NOW button visible
□ Model selector in TopBar: opens, shows 4 category sections, 22 models
□ Owl Alpha status: checked at openrouter.ai/models before Batch A begins
□ Nemotron 3 Ultra status: checked at openrouter.ai/models
□ Rollback checkpoint tag v4.2-pre-mission-13: created and pushed

Do not proceed to Batch A until all boxes above are checked.
```

---

## 8. SUCCESS CRITERIA

Mission 13 is COMPLETE when ALL of the following are true:

```
MODEL REGISTRY (Batch A)
═══════════════════════════════════════════════════════════════
□ FALLBACK_MODEL_ID and DEFAULT_MODEL_ID no longer point to openrouter/owl-alpha
□ New default is a confirmed-active free model (verified at openrouter.ai/models)
□ RECOVERY_MODEL_IDS contains exactly 3 models, all confirmed active
□ A lifecycle run with DEFAULT model shows the new model in OpenRouter logs (not Owl Alpha)
□ Truncation rate confirmed lower: run a 3-stage test, no finish_reason:length responses
   (full 14-stage validation run not required for Mission 13 — that is Mission 13D gate)

UX BUG FIXES (Batch B)
═══════════════════════════════════════════════════════════════
□ Stop button: after clicking Stop, no stale .current-run.json file remains on disk
  Verify: ls /Users/apple/idea-gate-ui-safe/.current-run.json after Stop → file not found
□ New Idea button: clicking it clears the left-rail artifact list, center panel, and
  downstream stale indicators across all three tabs (Desk, Studio, Office)
□ Refresh button: either (a) clicking it refreshes artifact data without a full page reload,
  OR (b) root cause is documented and fix is deferred with explicit reason

SETTINGS PARITY (Batch C)
═══════════════════════════════════════════════════════════════
□ Settings → AI Models tab: shows the new ModelSelector (22 models, 4 categories)
□ Selecting a model in Settings updates GlobalStore.defaultModel identically to TopBar
□ The selection persists across page reload
□ No runtime error on Settings modal open
□ TopBar and Settings show the same selected model simultaneously

OVERALL
═══════════════════════════════════════════════════════════════
□ TypeScript: 0 errors after all three batches
□ All Mission 12C functionality intact: IMPROVE NOW, ACCEPT, version tracking, stale propagation
□ Full lifecycle run (14 stages) completes with the new default model
□ Tag v4.2-stable created and pushed
□ IDEAGATE-STATE-NOW.md updated to reflect Mission 13 completion
□ IDEAGATE-MASTER-TODO.md: P-NEW-1, P-NEW-3, P-NEW-6, P-NEW-8, P-NEW-9, P-NEW-10 marked done
```

---

## 9. REFERENCES

- IDEAGATE-STATE-NOW.md v2.0 — current system state
- IDEAGATE-MISSION-LOG.md — Mission 12C completion details (auth fix, response shape fix)
- IDEAGATE-ARCHITECTURE-DECISIONS.md — ADR-006, ADR-007, ADR-013, ADR-015
- IDEAGATE-MISSION-12-MODEL-SELECTOR-SPECIFICATION.md — ModelSelector architecture
- IDEAGATE-TODO-SUMMARY.md — P-NEW-1, P-NEW-3, P-NEW-6, P-NEW-8, P-NEW-9, P-NEW-10 details

---

*Document version: 1.0 | July 2026 | STATUS: PLANNING — pending review and approval*
