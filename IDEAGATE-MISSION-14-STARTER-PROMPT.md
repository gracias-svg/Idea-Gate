# IDEAGATE-MISSION-14-STARTER-PROMPT.md
# Mission 14 — Claude Code Session Opener
# Version 1.0 | July 2026
# Paste this verbatim as the first message in the Claude Code session for Mission 14.

---

You are beginning Mission 14 of IdeaGate PMOS: Premium UI Foundation & Visual Operating System.
Mission type: UI FOUNDATION. No new lifecycle stages, no new agents, no auth, no database.

## READ THESE DOCUMENTS BEFORE TOUCHING ANY FILE (in this order)

1. IDEAGATE-STATE-NOW.md — current verified system state, tag v4.2-stable
2. IDEAGATE-MASTER-TODO.md — confirm P-NEW-13, P-NEW-15, P-NEW-18, P-NEW-19 are the items
   this mission closes
3. IDEAGATE-MISSION-14-SPECIFICATION.md — scope, Experience Principles, phases, protected
   file exceptions, risk register
4. IDEAGATE-MISSION-14-DESIGN-SYSTEM.md — tokens, component contract, motion vocabulary
5. IDEAGATE-MISSION-14-IMPLEMENTATION-PLAN.md — exact file paths and props interfaces
6. IDEAGATE-MISSION-14-CLAUDE-CODE-RUNBOOK.md — the checkpoint you will execute today

Do not write any code until you confirm you have read all six.

## MISSION BOUNDARY

Mission 14 builds: engine fixes (Phase 0), a global shell with NavRail/StatusBar/Cmd+K
(Phase 1), a Desk lifecycle node chain (Phase 2), an Office Analytics orchestration view
(Phase 3), and a premium Studio (Phase 4). Nothing else. If you find yourself about to build
uploads, comparison modes, auth, a new agent, or any item listed as "explicitly out of scope"
in the Specification §6 — STOP and report before proceeding.

## PROTECTED FILES

```
/Users/apple/idea-gate-ui-safe/src/core/coordinator-v2.js       (Phase 0 exception only)
/Users/apple/idea-gate-ui-safe/src/core/lifecycle-engine.js     (do not touch)
/Users/apple/idea-gate-ui-safe/src/core/journey-engine.js       (do not touch)
/Users/apple/idea-gate-ui-safe/src/utils/llm.js                 (do not touch)
.../ui-layer/src/lib/parseContent.ts                            (do not touch)
.../ui-layer/src/app/desk/page.tsx                              (Phase 2 exception only)
.../ui-layer/src/app/office/page.tsx                             (Phase 3 exception, adjacent)
```

Every protected-file edit requires: a pre-edit rollback tag, complete read before editing,
additive changes only, TypeScript 0 errors after, owner smoke test before commit.

## GOLDEN RULES (MES-V1, unchanged from Mission 13)

- One checkpoint at a time. Never combine batches. Never proceed past a STOP without
  explicit owner confirmation.
- Standalone components before protected-file integration.
- Tokens only — no hardcoded colours, spacing, radius, or durations.
- Every component implements all seven states (loading/empty/success/running/partial/
  warning/error) before it is considered done.
- Every displayed value traces to a real source (journey.json, SSE, GlobalStore,
  RuntimeContext). No mocked data ships to a page.
- Read a file completely before editing it. Quote the diff before every commit.
- If anything fails: STOP, report the exact error, do not work around it.

## PRE-FLIGHT (run now, before Batch 0A)

```bash
cd /Users/apple/idea-gate-ui-safe && git log --oneline -3 && git status --porcelain
cd /Users/apple/agent-zero-data/workdir/ui-layer && git log --oneline -3 && git status --porcelain
cd /Users/apple/agent-zero-data/workdir/ui-layer && \
  npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "backup-before-claude" | wc -l
git tag | grep v4
```

Report: current commit on both repos (expect tag `v4.2-stable` reachable), working tree clean,
TypeScript error count (expect 0). Confirm this matches IDEAGATE-STATE-NOW.md before proceeding.

**STOP. Report the pre-flight results and wait for confirmation before Batch 0A begins.**
