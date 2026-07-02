# IDEAGATE-MISSION-13-STARTER-PROMPT.md
# The exact starter prompt to paste into a new Claude Code session for Mission 13.
# Version 1.0 | July 2026
#
# INSTRUCTIONS FOR THE USER:
# 1. Commit all five Mission 13 documents to idea-gate-ui-safe repo and push
# 2. Open a new Claude Code session
# 3. Paste everything between the === delimiters below as your first message
# 4. Wait for Claude Code to read all four documents and report the pre-flight before proceeding

---

## ═══════════════════════════════════════════════════════════
## PASTE EVERYTHING BELOW INTO CLAUDE CODE AS THE FIRST MESSAGE
## ═══════════════════════════════════════════════════════════

You are beginning Mission 13 of IdeaGate PMOS. Mission 13 is a stabilisation mission —
its only job is to resolve seven known issues without breaking anything that currently works.
No new features. No new components. No architectural changes. Every change is additive,
surgical, and independently reversible.

---

## DOCUMENT READING ORDER — MANDATORY BEFORE ANY CODE

Read these four documents IN ORDER. After reading each, state what the most important
piece of information was. Do not write any code until all four are read.

```
1. /Users/apple/idea-gate-ui-safe/IDEAGATE-STATE-NOW.md
   Focus: current git state, what works, protected file list, current model constants

2. /Users/apple/idea-gate-ui-safe/IDEAGATE-MISSION-13-SPECIFICATION.md
   Focus: scope (in/out), risk register, rollback strategy, success criteria

3. /Users/apple/idea-gate-ui-safe/IDEAGATE-MISSION-13-IMPLEMENTATION-PLAN.md
   Focus: Batches A/B/C step-by-step, file-by-file checklist, regression checklist

4. /Users/apple/idea-gate-ui-safe/IDEAGATE-MISSION-13-CLAUDE-CODE-RUNBOOK.md
   Focus: the exact sequence of prompts and verification gates for this session
```

After reading all four, confirm:
- Current git tag on both repos
- TypeScript error count (expected: 0)
- The seven P-NEW items this mission will close

---

## HARD SAFETY RULES — APPLY THROUGHOUT THIS ENTIRE SESSION

```
1. NEVER modify these files in Mission 13:
   coordinator-v2.js / lifecycle-engine.js / journey-engine.js / parseContent.ts
   desk/page.tsx / improve/page.tsx / office/page.tsx
   Any file inside src/components/ModelSelector/ (already proven working)

2. BEFORE any code change: read the target file completely and quote relevant sections

3. BEFORE any commit: quote the full git diff and confirm it matches the specification

4. BEFORE any push: TypeScript must show 0 errors

5. IF any verification step fails: STOP. Report the exact failure.
   Do not attempt a workaround. Do not proceed to the next step.
   Report and wait for instruction.

6. IF the Refresh button root cause is in a protected file: mark B2 as DEFERRED.
   Document the root cause. Do not touch the protected file.

7. IF any batch requires touching more than the files listed in the specification:
   STOP and report which additional file is needed and why before proceeding.
```

---

## PRE-FLIGHT SEQUENCE — RUN IMMEDIATELY AFTER READING ALL FOUR DOCUMENTS

```bash
# Step 0A — Confirm baseline:
cd /Users/apple/idea-gate-ui-safe && git log --oneline -3 && git status
cd /Users/apple/agent-zero-data/workdir/ui-layer && git log --oneline -3 && git status

# Step 0B — TypeScript baseline:
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "backup-before-claude" | wc -l
# Must be 0 before proceeding

# Step 0C — Create rollback checkpoint (BEFORE ANY OTHER CHANGE):
cd /Users/apple/idea-gate-ui-safe && \
git tag -a v4.2-pre-mission-13 \
  -m "Rollback checkpoint before Mission 13 Stabilisation. Restore: git reset --hard v4.2-pre-mission-13" && \
git push origin v4.2-pre-mission-13 && echo "CHECKPOINT_CREATED"

# Step 0D — External model check (INFORM USER, DO NOT PROCEED UNTIL ANSWERED):
echo "USER ACTION REQUIRED BEFORE BATCH A:"
echo "Open https://openrouter.ai/models and check these four models:"
echo "  openrouter/owl-alpha"
echo "  nvidia/nemotron-3-ultra-253b:free"
echo "  nvidia/nemotron-3-super-120b-a12b:free"
echo "  openai/gpt-oss-120b:free"
echo "For each: report ACTIVE, DEPRECATED, or NOT FOUND"
echo "Do not start Batch A until these statuses are provided"
```

Report this summary after pre-flight:
```
PRE-FLIGHT REPORT
  CLI repo HEAD: ___
  UI repo HEAD: ___
  TypeScript errors: ___ (must be 0)
  Rollback tag created: YES/NO
  Awaiting model status from user: YES
```

---

## MISSION STRUCTURE — THREE BATCHES + FINAL

```
BATCH A (30-45 min): model-registry.ts + llm.js
  A1: Update FALLBACK_MODEL_ID, DEFAULT_MODEL_ID, RECOVERY_MODEL_IDS
  A2: Increase max_tokens in llm.js (4K→8K agent, 4K→12K merge)
  Gate: TypeScript + grep verification + commit

BATCH B (90-120 min): run/route.ts + TopBar.tsx + RuntimeContext.tsx
  B1: Stop button cleans .current-run.json lock file
  B2: Refresh button — diagnose + fix OR defer with documented reason
  B3: New Idea complete workspace state reset
  Gate: TypeScript + user smoke test (Stop, New Idea, Refresh) + commit

BATCH C (60-90 min): SettingsModal.tsx only
  C1: Replace ModelDropdown with ModelSelector in CAIModels function
  Gate: TypeScript + user Settings smoke test + full regression + commit

FINAL (30 min):
  Update IDEAGATE-MASTER-TODO.md (mark P-NEW items closed)
  User runs validation lifecycle with new default model
  Tag v4.2-stable and push
  Generate mission report
```

Each batch must be confirmed before the next begins.
The Runbook (IDEAGATE-MISSION-13-CLAUDE-CODE-RUNBOOK.md) contains the exact prompts.
Follow the Runbook sequence precisely.

---

## WHAT SUCCESS LOOKS LIKE

When Mission 13 is complete:
- No API call routes to openrouter/owl-alpha as fallback or default
- Lifecycle artifacts are complete paragraphs (not cut off mid-sentence at 4,000 tokens)
- Clicking Stop deletes the lock file — no false-positive "run active" on next session start
- Clicking New Idea clears the workspace completely across all three tabs
- Settings AI Models tab shows the same 22-model selector as the TopBar
- TypeScript: 0 errors
- Tag v4.2-stable pushed
- All Mission 12 features still working (Improve flow, version tracking, stale propagation)

After this report is confirmed, Mission 14 begins (Premium UI Foundation).

## ═══════════════════════════════════════════════════════════
## END OF STARTER PROMPT
## ═══════════════════════════════════════════════════════════
