# IDEAGATE-NEW-BACKLOG-ITEMS-P20-P25.md
# Backlog items extracted from extended Mission 14 planning conversation
# Version 1.0 | July 2026
# These do NOT exist in IDEAGATE-MASTER-TODO.md yet. Merge into that file at the next
# documentation-sync checkpoint (do not merge mid-mission; treat as a docs-only micro-task).

---

## P-NEW-20 — Model Registry Maintenance Workflow / Claude Code Skill

**Priority:** MEDIUM
**Suggested mission:** Post-Mission-14, standalone micro-mission
**Dependencies:** None — model-registry.ts already exists and is stable post-Mission-13

**Problem:** Every model catalog update currently requires a full Claude Code session: read
model-registry.ts, verify a slug against openrouter.ai/models manually, propose a diff, get
approval, commit. This happened twice in Mission 13 (owl-alpha retirement, Grok ID fix) and
will recur every time OpenRouter adds/deprecates/renames a model — which happens often in a
fast-moving model market.

**Vision:** A reusable workflow (most likely a Claude Code Skill, given Anthropic's skill
system is designed exactly for this: a repeatable, scoped operating procedure) that:
1. Queries OpenRouter's `GET /api/v1/models` (already proven reliable — used successfully
   during Mission 13's P-NEW-18/19 diagnosis).
2. Diffs the live catalog against model-registry.ts's current ModelEntry list.
3. Flags: models in the registry no longer in the catalog (retirement candidates), new models
   not yet in the registry (addition candidates), and models whose metadata (context window,
   pricing, capability flags) has drifted from what's recorded.
4. Proposes a scoped diff for owner approval — never auto-commits.

**Scope boundary:** this is a maintenance workflow, not a UI feature. It does not need a Studio
or Desk surface. It lives as operating procedure (a skill or a documented Claude Code prompt
pattern), not as product UI.

**Success criteria:** a model catalog refresh that previously took a full diagnostic session
(as Mission 13 required) takes one short, scoped Claude Code session using the skill.

**Risk:** low — read-only diagnosis by default; commits still require explicit approval per
the existing protected-file-adjacent discipline (model-registry.ts is not protected, but model
routing correctness is safety-critical, so the same rigor applies).

---

## P-NEW-21 — Continuous Missions (formerly "Looping") — Future Architectural Pillar

**Priority:** FUTURE / architectural pillar candidate — NOT a near-term feature
**Suggested mission:** Evaluate after Mission 17 (auth + persistence), since continuous
background operation needs a real backend, not the current local dev-server model
**Dependencies:** Mission 17 (persistence), Mission 18 (operations/monitoring)

**What this is:** the discussion explored whether IdeaGate should eventually support
self-directed, ongoing work — not just one-shot lifecycle runs the user triggers manually.
Examples raised: continuous monitoring of a project's market/competitive landscape, periodic
re-validation of an MVP hypothesis as new research becomes available, documentation-freshness
checks, architecture-health checks, PM-learning loops that surface what a run's outcomes imply
for the next idea.

**What this is NOT (rejected from the raw brainstorm):** an "autonomous AI agent that acts
without supervision" framing. That contradicts IdeaGate's core identity as an *enforced,
structured, human-supervised* operating system (the whole point of the coordinator's exit
criteria is that nothing advances without validation). Continuous Missions must remain
owner-triggered-and-reviewed, never autonomous-and-silent. This is a hard product-philosophy
constraint, not a soft preference — it's the same trust principle (CT-1..CT-7 in the Design
System) applied to background work: no work happens the user doesn't know about and didn't ask
to be monitored.

**Reasoned framing:** this is a **future architectural pillar**, not a feature and not a
platform capability in the Mission 14 sense of "extension point." It would require: a
persistence layer (Mission 17), a scheduling/trigger mechanism (new), a notification surface
(new), and explicit owner opt-in per project. None of this is buildable or even fully
specifiable before Mission 17 lands. Recording it now so the WOS's `runs/` immutable-history
design (each run already a complete, comparable snapshot) is confirmed as the right substrate
for this — a "continuous mission" would simply be a new run triggered by a condition instead of
a manual click, writing to the exact same `runs/{run-id}/` structure.

**Do NOT build any part of this now.** Recorded strictly as a future direction with one
concrete architectural confirmation: the WOS's immutable-runs design already supports it
without modification.

---

## P-NEW-22 — Workspace Knowledge Ingestion (Uploads / Attachments / References)

**Priority:** MEDIUM-HIGH
**Suggested mission:** Mission 16 (aligns with Studio's evolution into a richer workspace,
already anticipated by AD-11's context envelope in Mission 14's Specification)
**Dependencies:** Mission 14's Studio context envelope (`{ primary, attachments[],
references[] }`, currently always-empty by design) — this item is what populates it.

**Problem / Vision:** today Studio can only improve an artifact using the artifact's own text.
The broader vision (raised repeatedly across this conversation) is that a PM improving a PRD
should be able to attach supporting material — a competitor teardown PDF, a user-interview
transcript, a research report, an architecture diagram, a spreadsheet of data — and have the
improvement call use that material as grounding context.

**Scope for Mission 16 (when scheduled — not now):**
- File types: PDF, DOCX, PPTX, Markdown, TXT, images, CSV — matches what a working PM actually
  produces and receives.
- Storage: lands in the WOS's reserved `project/references/` folder (already designed for this
  in the Workspace Operating System document, §4 and §8).
- Wiring: populates the `attachments[]` / `references[]` arrays in the context envelope that
  Mission 14 Phase 4 establishes as always-empty. No envelope redesign needed — this is exactly
  the seam it was built for.

**Known technical debt to resolve as part of this item:** a prior PDF upload attempt failed
with the error `pdfParse is not a function`. This is a real, previously-observed bug — record
it here as the starting diagnostic note for whoever picks up P-NEW-22: the PDF-extraction
library integration was attempted before and broke at the `pdfParse` call site. Whoever
implements P-NEW-22 should treat this as a known landmine, not a fresh unknown — verify the
PDF-parsing library's actual export shape (likely an ESM/CommonJS interop mismatch, a common
cause of "X is not a function" on a default-export library) before assuming the same approach
will work.

**Explicitly NOT Mission 14 scope.** Mission 14 only reserves the envelope shape.

---

## P-NEW-23 — Continue vs. Retry: Two Distinct Product Behaviours (currently conflated)

**Priority:** HIGH
**Suggested mission:** Mission 16, alongside P-NEW-5 (Continue/Resume button)
**Dependencies:** journey.json's existing per-stage state (already sufficient to determine
where a run stopped)

**The distinction, reasoned from this conversation's discussion:**

**Continue** = resume execution from the last successfully completed stage. The run picks up
exactly where it left off, using the artifacts already generated as-is. This is the behaviour
P-NEW-5 already describes ("Continue/Resume button for stalled runs").

**Retry** = a different, currently-undefined behaviour: restart the run, but *not* from zero
context. Retry should carry forward the coordinator's understanding of the original idea (the
Stage 0 Idea Intake artifact, and ideally the reasoning trail from journey.json about why the
prior attempt stalled or produced low-confidence output) while regenerating from a fresh stage
sequence — most useful when a stage failed or degraded (the Mission 13 validation run's Stage 5
"degraded conditions, low confidence" case is the concrete example that motivated this
distinction) and simply resuming would propagate the bad output forward.

**Why this matters as a distinct backlog item rather than folding into P-NEW-5:** Continue and
Retry solve different failure modes and must not be merged into one button with unclear
semantics. Continue trusts the existing artifacts. Retry distrusts the most recent ones but
keeps the original idea's context. Conflating them (a single "Resume" button that sometimes
means one and sometimes the other) would violate the Design System's CT-1 (honest system state)
— the user must know which behaviour they're choosing.

**Scope when built:** two distinct UI affordances (not necessarily two buttons — could be one
button with a clear choice), both reading from journey.json's existing stage/confidence data,
neither requiring new coordinator logic beyond re-entry-point selection (Continue) or
context-carrying re-generation (Retry, which does need coordinator-level work — this is why it
touches lifecycle-engine.js/coordinator-v2.js and needs its own scoped mission, not a Mission 14
addition).

---

## P-NEW-24 — Alternative Delivery Pipelines Beyond Prototype Prompt

**Priority:** MEDIUM (long-term differentiation, not urgent)
**Suggested mission:** Post-Mission-16, likely its own mission (tentatively "Delivery
Pipelines" or folded into a Mission 18+ scope)
**Dependencies:** Stable lifecycle output (already exists); no hard dependency on auth/persistence

**Problem / Vision:** today every lifecycle run ends at the same destination — a single
"Prototype Prompt" artifact (Stage 14), intended to be pasted into an AI coding tool. The
brainstorm raised that different users have different destinations for the same underlying PM
work: a developer wants a Claude Code-ready development package; someone using a different
coding agent wants an equivalent package tailored to it; an enterprise user might want an
engineering handoff package with different formatting/detail; a job-seeker (this project's own
primary use case) wants a portfolio package; someone doing due diligence wants a research
package.

**Reasoned framing:** this is best modeled as a **configurable delivery pipeline** — a final
transformation step applied to the same 15 artifacts, not a new lifecycle mode (lifecycle modes,
per the WOS §13 and Runbook Appendix, are about running a *subset* of stages; delivery
pipelines are about *packaging* the full output differently). The two ideas are complementary,
not the same thing, and should not be conflated in future specs.

**Not scoped to any mission yet.** Recording the architectural framing (packaging step, not
lifecycle mode) so a future mission doesn't have to re-derive this distinction.

---

## P-NEW-25 — DataAgent Referenced But Not Implemented

**Priority:** LOW
**Suggested mission:** Any convenient cleanup session, or as part of a future agent-roster
change (would also touch the Design System's data-driven AGENTS registry, AD-9)

**Problem:** `lifecycle-engine.js` references a `DataAgent` in its stage-to-agent mapping, but
`createAgents()` in `agents-v2/index.js` does not define one. This was flagged during Mission
13 planning and never resolved — carried forward here so it isn't lost.

**Recommendation (unchanged from earlier discussion):** most likely resolution is removing the
dead reference rather than building a seventh agent, since no stage currently requires
data-specific agent behaviour distinct from the existing six. Confirm this by grepping
lifecycle-engine.js for the exact reference before deciding.

---

*New backlog items v1.0 | July 2026*
*Merge into IDEAGATE-MASTER-TODO.md at the next documentation-sync checkpoint.*
*None of these six items are scheduled to a specific upcoming mission except where noted.*
