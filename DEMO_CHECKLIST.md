# IdeaGate PMOS — Demo Validation Checklist
Last updated: 2026-06-28

## Setup
- [ ] Both repos on main, clean (`git status` in both)
- [ ] `npm run dev` running in `/Users/apple/agent-zero-data/workdir/ui-layer`
- [ ] Desk accessible at http://localhost:3000/desk
- [ ] Model selector visible in TopBar

## Validation Run 1 — Owl Alpha (primary test)
Idea: "a daily habit tracker for students"
Model: Owl Alpha (Free)

Steps:
- [ ] Select Owl Alpha in model dropdown
- [ ] Enter idea in TopBar input
- [ ] Click Run
- [ ] Confirm green "Generating" banner appears with Stage 0/14
- [ ] Wait 5–10 minutes for stages to advance
- [ ] Confirm artifact names appear in left rail as stages complete
- [ ] After 3 stages: click Stage 0 → confirm content is PM text (not BLOCKED)
- [ ] After 3 stages: click Stage 1 → confirm discovery analysis (not empty)
- [ ] After run completes: confirm "Generating" banner disappears

Pass criteria:
- Stage 0 shows ≥ 300 words of genuine product brief
- Stage 1 shows ≥ 300 words of market/discovery content
- No "Stage Status: BLOCKED" anywhere
- No raw JSON visible in any artifact
- OpenRouter Activity shows owl-alpha as model

## Validation Run 2 — Model Fallback Test
Idea: "a smart recipe app for home cooks"
Model: GPT-OSS 120B (Free) — known to be rate-limited sometimes

Steps:
- [ ] Select GPT-OSS 120B in model dropdown
- [ ] Enter idea, click Run
- [ ] Watch `.last-run.log` for: `[AGENT] Fallback to openrouter/owl-alpha`
  - Log path: `/Users/apple/idea-gate-ui-safe/.last-run.log`
  - Command: `tail -f /Users/apple/idea-gate-ui-safe/.last-run.log`
- [ ] Confirm lifecycle does NOT crash even if primary model fails
- [ ] Confirm artifacts are generated (even if quality is lower)

Pass criteria:
- Lifecycle completes without TypeError crash
- If `[AGENT] Fallback` appears in log, agent fallback is working
- No lifecycle stuck at Stage 0 forever

## Validation Run 3 — Stop Button Test
Idea: "anything"
Model: Owl Alpha

Steps:
- [ ] Start a lifecycle run
- [ ] Wait 30 seconds (let 1 stage start)
- [ ] Click ✕ Stop in the green running banner
- [ ] Confirm banner disappears
- [ ] Confirm "Run stopped." message appears briefly
- [ ] Confirm no new artifacts appear after stopping

Pass criteria:
- Stop button is visible during run
- Clicking it clears the running state within 3 seconds
- `.current-run.json` is deleted: `ls /Users/apple/idea-gate-ui-safe/.current-run.json` → should 404

## Validation Run 4 — New Idea Test
After any completed run:

Steps:
- [ ] Click "+ New Idea" button (appears after run completes)
- [ ] Confirm input field clears
- [ ] Confirm artifact list on left clears (or shows loading)
- [ ] Confirm Desk shows empty state

Pass criteria:
- Artifact list is empty or refreshes
- No old artifacts from previous run still visible

## Reporting Results
After completing validations, note:
- Which stage (if any) produces BLOCKED content
- Which stage (if any) produces fewer than 100 words
- Any TypeError in terminal (running `npm run dev`)
- Any 404 errors in `.last-run.log`
- OpenRouter Activity model names (confirm owl-alpha hits)

Report to Claude Code with these findings for Mission 10C.
