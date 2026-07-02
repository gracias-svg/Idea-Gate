# IdeaGate PMOS — Architecture Review & Mission 13 Planning Session
Session type: Planning only. No code written. Ready to paste into IDEAGATE-TODO-SUMMARY.md / IDEAGATE-ARCHITECTURE-DECISIONS.md / IDEAGATE-STATE-NOW.md.

---

## TOPIC 1 — KNOWLEDGE BASE VERIFICATION

```
KNOWLEDGE BASE VERIFICATION
─────────────────────────────────────────────────────────────
☑ Current git tag:           v4.1-model-selector
☑ Both repos on branch:      main
☑ Both repos pushed to:      github.com/gracias-svg/Idea-Gate
☑ CLI Engine path:           /Users/apple/idea-gate-ui-safe/
☑ UI Layer path:             /Users/apple/agent-zero-data/workdir/ui-layer/
☑ Last completed mission:    Mission 12C (Improve cleanup + auth fix + response shape fix + accept action)
☑ Improve flow status:       WORKING — IMPROVE NOW (200) + ACCEPT (200) confirmed via screenshots
☑ Critical open item:        P-NEW-10 — Owl Alpha 404 observed twice, FALLBACK_MODEL_ID at risk
☑ Highest quality item:      P-NEW-1 — 52-57% truncation rate, max_tokens increase needed
☑ Documents agreed as canon: YES — STATE-NOW, MISSION-LOG, TODO-SUMMARY, ARCHITECTURE-DECISIONS, NEXT-SESSION
```

### Contradiction check — findings

1. **Protected file lists — consistent, one harmless omission.** STATE-NOW.md's protected list includes `workspace/` (runtime artifacts) in addition to the five code files; NEXT-SESSION.md's list has the five code files only. Not a contradiction — `workspace/` is a directory rule, not a file rule, and NEXT-SESSION.md's own "DO NOT" section separately says "Modify workspace/ runtime artifacts." No action needed, but worth folding into one canonical list (see Topic 9).

2. **P-NEW priority ordering — consistent** across TODO-SUMMARY.md and NEXT-SESSION.md for Mission 13's three items (P-NEW-10 → P-NEW-1 → P-NEW-3, same order, same rationale: verify Owl Alpha first since it determines whether P-NEW-3's array needs restructuring).

3. **Gap found — P-NEW-9 is absent from the suggested mission order.** TODO-SUMMARY.md marks P-NEW-9 (model selection synchronization audit) as HIGH priority, discovered during the Mission 12B crash. NEXT-SESSION.md's "Mission 14–18" sequence never schedules it. Since P-NEW-9 is explicitly a read-only audit ("likely no code changes unless divergence found," 30 minutes), this should be folded into Mission 15's quality-of-life bundle rather than left unscheduled — see Topic 4.

4. **Gap found — priority vs. schedule mismatch on P-NEW-5.** TODO-SUMMARY.md marks P-NEW-5 (Continue/Resume) HIGH priority. NEXT-SESSION.md schedules it fifth (Mission 17), after two MEDIUM-priority bundles (Missions 15–16). This isn't wrong — P-NEW-5 touches a protected file (coordinator-v2.js) and needs its own spec doc, which justifies deferring it — but the two documents disagree on what "HIGH priority" means operationally (urgency vs. sequencing). Recommend TODO-SUMMARY.md add a "Blocked on spec" sub-tag distinct from priority so this doesn't read as a scheduling error in future sessions.

5. **Mission 12D was never run as a separate mission — MISSION-LOG.md and the Mission 12 spec disagree on structure, not on outcome.** The spec document (IDEAGATE-MISSION-12-MODEL-SELECTOR-SPECIFICATION.md, Section 17) defines four sub-missions: 12A, 12B, 12C, and 12D ("Full verification + tag v4.1-model-selector"). MISSION-LOG.md only documents 12A, 12B, and 12C — the tag `v4.1-model-selector` was created at the end of 12C, not a separate 12D. This is a real deviation from the spec, not a contradiction between canon documents (MISSION-LOG.md is authoritative for what actually happened). **Recommendation:** add a one-line note to MISSION-LOG.md's Mission 12C entry stating "12D folded into 12C — verification and tagging happened in the same session as the final bug fixes, no separate sub-mission was run." This closes the gap for future readers who cross-reference the spec.

6. **No stale ADRs found.** All 17 ADRs in ARCHITECTURE-DECISIONS.md reflect the current STATE-NOW.md snapshot — the dual-key bridge (ADR-007/008/009), the additive response shape (ADR-010/011), and the registry-as-canon rule (ADR-006) are all still accurate as of v4.1. No ADR needs to be marked SUPERSEDED.

### Mission 12 completion check

```
☑ Mission 12A complete: ModelSelector 9-file component built (commit b4180f6)
☑ Mission 12B complete: TopBar wired, crash-safety accessors added (commit f435019)
☑ Mission 12C complete: Three sub-fixes + cleanup commits (efb3c01, a3acc91, 630f095)
☑ Tag v4.1-model-selector exists and was pushed
☐ Item appearing INCOMPLETE: 12D (full verification as its own sub-mission) was never run
  as a distinct step — its acceptance criteria (Section 14 of the spec) were satisfied
  inline during 12C. Functionally complete; procedurally merged. See finding #5 above.
```

---

## TOPIC 2 — MISSION 12 RETROSPECTIVE

**Yes — Mission 12 was the most complex and highest-risk work on IdeaGate so far.** It's the only mission that: touched five files across two layers of the type system (GlobalStore, TopBar, ModelDropdown, SettingsModal, office/page.tsx), hit two separate runtime crashes that TypeScript did not catch, and uncovered a months-old hidden auth bug as a side effect of finally exercising a code path that had never succeeded before.

**Three most important lessons:**

1. **TypeScript casts are not runtime safety.** Both the Mission 11C crash (`FREE_MODEL_KEYS` iterating `LEGACY_KEY_MAP` entries not present in `MODEL_LABELS`) and the Mission 12B crash (`MODEL_LABELS[fullRegistryId]` → undefined → `.label` throws) have the identical shape: a cast satisfies the compiler, the lookup fails at runtime. The fix pattern — safe accessor functions (`getModelMeta`, `isModelFree`) that try the legacy path and fall back to the registry — is now the canonical pattern (ADR-009) and should be the default reflex whenever a new lookup spans the legacy/registry boundary.

2. **A code path with a permanent hidden failure looks identical to a code path that was never tested.** The Improve auth bug (module-load `process.env` capture, always empty) existed since before this chat's history and was invisible because the 401 always fired first — no request had ever gotten far enough to expose the response-shape mismatch underneath it. This is why Mission 9's `readDotEnvFile()` pattern should have been applied to *every* route touching OpenRouter at the time it was invented, not just the one route being fixed. Lesson formalized as ADR-015 (canonical implementation over parallel logic) — but the meta-lesson is: when you fix a bug pattern in one file, grep for the same pattern elsewhere in the same session, don't wait for it to surface independently.

3. **Diagnosis before fix, every time, even under pressure to move fast.** Mission 12C was blocked three times (auth, response shape, accept-action) and each blocker was root-caused with actual evidence — console instrumentation, side-by-side file comparison — before any line was changed. This is the pattern that should be formalized (see below) rather than left as something Mission 12C happened to do well.

**Pattern to formalize for every future mission** (not previously written down as a rule): **when a route or function fails, add temporary diagnostic instrumentation and capture actual output before hypothesizing a fix.** Mission 12C's `[DIAG]` console.log lines are exactly this — they were removed afterward, but the *practice* of adding them first should become a standing step in the mission playbook template, alongside the existing "read the file in full before editing" rule.

---

## TOPIC 3 — MISSION 13 DEFINITION

**One-sentence objective:** Eliminate the two largest risks to lifecycle reliability and artifact quality — an unstable default/fallback model and a >50% truncation rate — in a single low-diff, two-file change.

**Scope:**
- `model-registry.ts` — `FALLBACK_MODEL_ID`, `DEFAULT_MODEL_ID`, `RECOVERY_MODEL_IDS` (P-NEW-10, P-NEW-3)
- `llm.js` — `max_tokens` for agent calls and merge calls (P-NEW-1)
- `GlobalStore.tsx` — `DEFAULT_SETTINGS.defaultModel` only, if P-NEW-10 requires a new default key (no other GlobalStore changes)

**Out of scope:** coordinator-v2.js, lifecycle-engine.js, journey-engine.js, parseContent.ts, desk/page.tsx, any UI component beyond the one-line DEFAULT_SETTINGS change.

**Success criteria:**
- Owl Alpha status resolved (confirmed active-and-monitored, or replaced everywhere it appears as default/fallback)
- Zero calls with `finish_reason: length` on a full validation run
- All 15 stages complete with no "Exit criteria weak" flags attributable to truncation
- No 404s from any model in the recovery chain during the validation run
- TypeScript: 0 errors; tag `v4.2-coordinator-stability` created and pushed

**Dependency that must resolve first:** Step 0 (manual Owl Alpha status check at openrouter.ai/models) gates everything else — it determines whether P-NEW-10 is an emergency rewrite of the model constants or a lower-urgency monitoring note, which in turn determines whether P-NEW-3's array is edited once or restructured. This is correctly sequenced as Step 0 in NEXT-SESSION.md; no change needed.

---

## TOPIC 4 — BACKLOG REPRIORITIZATION (TOP 10)

| Rank | ID | Priority | Item | Change from current doc? |
|---|---|---|---|---|
| 1 | P-NEW-10 | CRITICAL | Owl Alpha retirement risk | No change — correctly ranked |
| 2 | P-NEW-1 | HIGH | max_tokens truncation fix | No change |
| 3 | P-NEW-3 | HIGH | Third recovery model | No change |
| 4 | P-NEW-9 | HIGH | Model sync audit | **Promote into Mission 15** — currently unscheduled (see Topic 1, finding 3); it's read-only and cheap, no reason to leave it homeless |
| 5 | P-NEW-8 | LOW→MEDIUM | Stop button doesn't clear lock file | **Promote** — one line, high nuisance value (false "run active" on every session start), should not wait behind P-NEW-11/6 |
| 6 | P-NEW-11 | MEDIUM | Refresh button non-functional | No change |
| 7 | P-NEW-6 | MEDIUM | New Idea blank canvas audit | No change |
| 8 | P-NEW-2 | MEDIUM | Architecture prompt strengthening | No change — correctly gated on P-NEW-1 landing first |
| 9 | P-NEW-15 | MEDIUM | Improve page visual polish | No change |
| 10 | P-NEW-5 | HIGH (blocked) | Continue/Resume button | **Keep priority label HIGH but tag "blocked on spec doc"** rather than letting it read as mis-sequenced — see Topic 1 finding 4 |

**Items now irrelevant given Mission 12's work:** None. Every item on the list either predates Mission 12 and is still open, or was discovered by Mission 12 itself.

**FUTURE THEME items worth promoting for portfolio timing:** P-NEW-17 Phase 4 (cloud deployment) has outsized portfolio value relative to engineering cost — a live URL is worth more in an interview than any single additional feature — see Topic 7 for the full argument. Recommend flagging Phase 4 as "consider before Phase 3" explicitly in the roadmap (already partially reflected in the deployment plan's Stage 1/Stage 2 split in the project's master context).

---

## TOPIC 5 — DOCUMENT INTELLIGENCE ENHANCEMENTS

| Stage | Proposed addition | Complexity | Benefit |
|---|---|---|---|
| Stage 10 — Architecture | Embedded Mermaid diagrams (system architecture, data flow) | Medium — prompt-only change once P-NEW-1's token ceiling is raised; Mermaid is plain text so no new rendering pipeline needed if Desk already renders fenced code blocks | High — this is literally "the hero" document (per the 10-doc portfolio structure); a rendered diagram does more for interview credibility than another paragraph of prose |
| Stage 6 — Prioritization | RICE scoring table | Low — table syntax is markdown, LLMs already produce tables reliably; just needs an explicit required-format instruction in the prompt | Medium-high — RICE tables are a recognizable PM artifact, cheap to add |
| Stage 5 — Validation | Metrics tracking table | Low — same reasoning as RICE table | Medium |
| Stage 3 — Solution Design | Opportunity Solution Tree (as Mermaid or nested list) | Medium — OST as a tree diagram is a less standard LLM output than RICE/metrics tables, more prompt iteration likely needed | Medium — nice-to-have, less critical than Stage 10's diagram |

**Implementation path:** All four are prompt-level changes in `lifecycle-engine.js` (PROTECTED — needs explicit mission scope) plus, for the Mermaid cases, confirming the Desk renderer already handles fenced ` ```mermaid ` blocks (check `parseContent.ts`/Desk's markdown renderer — if it doesn't render Mermaid today, that's a separate UI dependency to land first). **Recommend:** do Stage 10's Mermaid diagram first as a single-stage pilot mission after Mission 14 (which already touches Stage 10's prompt for P-NEW-2) — bundling the "add required sections" work with "add a diagram requirement" is a natural pairing, one commit, one file, one mission.

**Sequencing note:** none of this should happen before P-NEW-1 lands (Mission 13) — richer required output needs the higher token ceiling, exactly as P-NEW-2 already notes.

---

## TOPIC 6 — UI/UX IMPROVEMENT ROADMAP

**P-NEW-15 visual language standard:** Match Desk's established values exactly — dark green accent `#4ade80`, dark background `#020c06`, JetBrains Mono, 11px minimum body text. This is already specified in TODO-SUMMARY.md; no new decision needed, just execution.

**Tab naming/icon system:** Current three tabs are Desk / Improve / Office. Desk and Office are strong, purpose-evoking names; "Improve" is more generic and slightly undersells what the page does (single-artifact AI rewriting with version tracking). Two reasonable options: keep "Improve" for now (it's functionally accurate and changing it has zero engineering value on its own — pure naming churn), or fold the rename into the eventual P-NEW-12 Editing Studio spec, where the page's scope is expanding anyway and a rename would be justified by new capability rather than done in isolation. **Recommendation: defer renaming to the P-NEW-12 spec doc** rather than doing a standalone rename mission — renaming twice (once now, once when Studio ships) is wasted motion.

**Stale-artifact re-sync (P-NEW-16) complexity:** Genuinely low — the RuntimeContext already tracks staleness and knows the parent/child relationship (that's how the "1 downstream artifact marked stale" message works today). The remaining work is UI-only: a button that pre-fills the Improve intent field and navigates. TODO-SUMMARY.md's 2-3 hour estimate looks right. The only reason this isn't trivial is the explicit prerequisite on P-NEW-12 — worth confirming whether a *minimal* version (no Studio dependency) could ship standalone, since the current Improve flow already supports everything the re-sync button needs to call.

---

## TOPIC 7 — SAAS ROADMAP ASSESSMENT

**Is Phase 1 (auth+DB) worth it for portfolio value alone?** Marginal. A recruiter or hiring panel evaluating this as a PM portfolio piece cares about: does the system work, is the reasoning about tradeoffs sound, is there a working demo they can click through. Auth and multi-tenancy demonstrate *engineering* maturity more than *product* maturity, and this project's positioning (per IDEAGATE-POSITIONING.md and the locked interview answer) is explicitly a PM artifact, not a SaaS engineering showcase. Auth is valuable insurance if the project is ever actually shared publicly, but it is not the highest-leverage next investment for portfolio purposes specifically.

**Minimum viable SaaS version — smallest thing that turns this from local demo into something someone else could use:** A single deployed instance (Vercel + pre-generated Lumi artifacts, per the existing Stage 1 deployment plan) with **no auth at all** — a public read-only or single-shared-key demo. This lets anyone see and interact with the Desk/Blueprint/Office views without needing Phase 1's 8-12 week investment. This is materially cheaper than Phase 1 and delivers most of the portfolio value (a live, clickable URL) immediately.

**Should Phase 4 (cloud deployment) happen before Phase 3 (team features)?** Yes, clearly, for portfolio purposes — this already appears to be the plan's intent (the project's "DEPLOYMENT PLAN" describes a Stage 1 that's essentially Phase 4 without Phase 1's auth, deployed *now*, well ahead of team features). Team collaboration has no portfolio value without an audience to collaborate with; a live URL has value the moment it exists. **Recommendation:** treat the existing Stage 1 deployment plan (Vercel, ideagate.site, pre-generated artifacts, ₹800/year) as the real "Phase 4-lite," decoupled from the Phase 1-4 SaaS sequence entirely, and pursue it independently of — and sooner than — any auth/team work.

---

## TOPIC 8 — TECHNICAL DEBT ASSESSMENT

| Item | Address in Mission 14? | Reasoning |
|---|---|---|
| `readDotEnvFile()` duplicated (ADR-015 follow-up) | **No** | Touches `run/route.ts`, the one auth implementation that's never had a bug. Risk outweighs benefit until a third route needs it (ADR-014's own "open architectural question" already recommends waiting). |
| DataAgent referenced but missing in `createAgents()` | **No, but document it explicitly** | Not causing crashes — coordinator silently skips it. Low priority, but should get its own P-NEW number instead of living only in the "architectural recommendations" section, so it doesn't get lost. Recommend: remove the dead reference in a dedicated 10-minute mission once Mission 13-16 settle, per the ADR-017 "open question" lean toward removing rather than building the agent. |
| MODEL_LABELS/ModelKey/FREE_MODEL_KEYS legacy bridge (P-NEW-14) | **No — explicitly, per its own doc** | TODO-SUMMARY.md is unambiguous: "Do NOT rush this," each surface migration should be separate and verified. Bundling it into Mission 14 would violate that instruction. |
| Owl Alpha hardcoded in CLI `.env` (`OPENROUTER_MODEL=openrouter/owl-alpha`) | **Yes — but as part of Mission 13, not 14** | This is the same root risk as P-NEW-10, just in a different file. If Mission 13 replaces Owl Alpha as the registry default without also updating the CLI `.env` fallback, a direct terminal run (`node src/cli.js v2 "idea"`, bypassing the UI) would still default to a dead model. One-line addition to Mission 13's scope, not a new mission. |

**Net recommendation:** Mission 14 stays focused on P-NEW-2 (Architecture prompt) as originally scoped. Only the `.env` Owl Alpha reference should move — into Mission 13, where it belongs thematically and costs one extra line.

---

## TOPIC 9 — AGREED 5-MISSION ROADMAP

| Mission | Objective | Priority items covered |
|---|---|---|
| 13 — Coordinator Stability + Quality | Replace at-risk default/fallback model, eliminate truncation, harden recovery chain (registry + CLI `.env` both updated) | P-NEW-10, P-NEW-1, P-NEW-3 |
| 14 — Architecture Prompt Strengthening | Require minimum structure (incl. Mermaid diagram) in Stage 10 output now that the token ceiling supports it | P-NEW-2, Stage-10 Mermaid pilot (Topic 5) |
| 15 — Quality-of-Life Bundle | Four small independent fixes: stop-button cleanup, refresh-button diagnosis, new-idea audit, model-sync audit | P-NEW-8, P-NEW-11, P-NEW-6, P-NEW-9 |
| 16 — Premium UI/UX Pass | Visual parity for Improve page, ModelSelector polish backlog cleanup | P-NEW-15, P-NEW-7 |
| 17 — Public Deploy (Stage 1) | Ship the no-auth, pre-generated-artifact Vercel deployment at ideagate.site — portfolio-facing milestone | Deployment plan Stage 1 (pulled forward ahead of P-NEW-5/12/17-Phase-1, per Topic 7) |

*(Continue/Resume (P-NEW-5) and the Improve Studio spec (P-NEW-12) remain scheduled after this window — both are blocked on their own spec documents and are appropriately sequenced later, not omitted.)*

---

## NEW ADRs TO ADD

**ADR-018 — Diagnostic instrumentation before hypothesis (proposed)**
*Context:* Mission 12C's three blockers were each root-caused by adding temporary console instrumentation and reading actual output before proposing a fix, rather than reasoning from the symptom alone.
*Decision:* Formalize this as a standing step in every mission playbook: when a route, function, or UI flow fails, add temporary diagnostic logging and capture real output before writing a fix. Remove instrumentation once the fix is verified.
*Status:* Proposed — recommend adding to ARCHITECTURE-DECISIONS.md alongside ADR-014 (rollback-first protocol) as a companion "process" ADR.

**ADR-019 — Public deployment precedes auth (proposed)**
*Context:* Topic 7 of this session. The SaaS roadmap (P-NEW-17) sequences auth+DB as Phase 1, before cloud deployment (Phase 4). For portfolio purposes, this session concluded the opposite ordering delivers more value sooner.
*Decision:* The existing Stage 1 deployment plan (Vercel + pre-generated artifacts, no auth, ideagate.site) is treated as independent of and prior to the Phase 1-4 SaaS sequence, not as "Phase 4 done early." Scheduled as Mission 17 in this session's roadmap.
*Status:* Proposed — recommend adding to ARCHITECTURE-DECISIONS.md's "Open Architectural Questions" table as a resolved decision, replacing the implicit assumption in P-NEW-17 Phase 4's original framing.

---

*Document produced: architecture review + Mission 13 planning session, July 2026.*
*No code was written or modified in this session, per session scope.*
