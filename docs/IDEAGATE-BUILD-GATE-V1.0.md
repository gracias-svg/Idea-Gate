# IDEAGATE — BUILD GATE
## Repository Integration & Implementation Readiness Gate
### Version 1.0 — Pre-Implementation
### Status: GATE DOCUMENT — NOT YET PASSED

---

## 0. PURPOSE

This is the final verification gate between the seven-document IdeaGate
architecture/specification set and implementation in Claude Code.

It is **not Document 8**. It does not redesign, replace, or extend Documents 1–7.
It verifies that the contracts already defined by Documents 1–7 are synchronized
enough that implementation can proceed without guessing, silently choosing
between conflicting authorities, inventing missing behavior, or using an
obsolete version.

> **The Build Gate does not decide product behavior. It verifies that product
> behavior has already been decided, documented, versioned, and mapped.**

A gate failure must identify the exact document, section, conflict/missing contract,
authoritative source, required amendment, and verification required afterward.

No implementation should begin while a P0/P1 gate remains open.

---

# 1. AUTHORITATIVE DOCUMENT SET

| ID | Final filename | Version | Role | Gate status |
|---|---|---:|---|---|
| D1 | `IDEAGATE-MISSION-COMPOSER-V1-PRODUCT-AND-ENGINEERING-SPEC.md` | 1.0 | Product / Mission Composer foundation | Frozen |
| D2 | `IDEAGATE-STRATEGY-ROUTER-EXECUTIONPLAN-SPEC-V1-1.md` | 1.1 | Strategy Router + ExecutionPlan | Verify synchronization |
| D3 | `IDEAGATE-ORCHESTRATION-ENGINE-AGENT-HARNESS-SPEC.md` | 1.0 | Runtime Engine + Agent Harness | Verify synchronization |
| D4 | `IDEAGATE-CONTEXT-MEMORY-EVIDENCE-SPEC-V1-2-HARDENED.md` | 1.2 + Part 34A | Context + Memory + Evidence / PKS | Frozen |
| D5 | `IDEAGATE-OUTCOME-ENGINEERING-CONTRACTS-V1_3.md` | 1.3 | Outcome Engineering Contracts | Verify synchronization |
| D6 | `IDEAGATE-MISSION-COMPOSER-UX-SPEC-V1_2.md` | 1.2 + Part 30A | Mission Composer UX + Experience | Freeze candidate |
| D7 | `IDEAGATE-IMPLEMENTATION-SPEC-V1_2.md` | 1.2 | Implementation Specification | Finalize from v1.2 corrections |

### Embedded addenda — NOT separate documents

- **D4 Part 34A** is embedded in D4; it is not a separate architecture document.
- **D6 Part 30A** is embedded in D6; it is not a separate architecture document.

Do not create duplicate Part 34A or Part 30A architecture files.

---

# 2. CURRENT FILE LOCATION

The specification files are currently accumulated in:

```text
/Users/apple/Downloads/mission config panel docs/
```

They have **not yet been moved/copied into the IdeaGate repository**.

No Git integration should be inferred from their presence in Downloads.

Target repository:

```text
/Users/apple/idea-gate-ui-safe/
```

Recommended documentation directory, subject to physical verification:

```text
/Users/apple/idea-gate-ui-safe/docs/
```

---

# 3. AUTHORITY HIERARCHY

```text
D1 — Product / foundational contracts
        ↓
D2 — Routing + ExecutionPlan
        ↓
D3 — Runtime Engine + Agent Harness
        ↓
D4 — Context + Memory + Evidence / PKS
        ↓
D5 — Outcome semantic contracts
        ↓
D6 — Composer UX / Experience
        ↓
D7 — Implementation realization
        ↓
BUILD GATE — verification only; owns no product semantics
```

A downstream document may clarify an upstream ambiguity only when that clarification
is explicitly recorded as an amendment/authority decision.

D7 must never silently redefine an upstream contract.

---

# 4. GATE SEVERITY

### P0 — BLOCKING

Cross-project contamination, incorrect execution semantics, incompatible persistence,
invalid lineage, security/integrity failure, or any issue that forces implementation
to choose between materially different behaviors.

**P0 = implementation forbidden.**

### P1 — CONTRACT BLOCKING

Schema, enum, recipe, path, lifecycle, required/optional field, event, or
version/source-of-truth mismatch.

**P1 = implementation forbidden until synchronized.**

### P2 — HARDENING

Clarity, naming, observability, future seams, or implementation refinements that
cannot change runtime meaning.

P2 may be deferred only if explicitly recorded.

---

# 5. CROSS-DOCUMENT CONTRACT GATES

## G1 — Outcome IDs

Exactly:

```text
build
casestudy
research
review
decide
council
investigate
prioritize
plan
```

No new OutcomeId may appear in D7.

**PASS:** D1/D2/D5/D6/D7 agree.

---

## G2 — Canonical orchestration recipes

Exactly:

```text
structured-delivery
research-first
parallel-critique
council
red-blue-debate
goal-based-research-loop
```

`structured-delivery-with-gate` is prohibited.

`goal-based-loop` is stale and prohibited as the canonical RecipeId.

`debate` may remain a RunConfig override key where defined; it is not the canonical
internal RecipeId.

**PASS:** one RecipeId vocabulary exists across D2/D5/D7.

---

## G3 — Decide behavior must have one source of truth

The previous audit found conflicting behavior between D2 and the later D5/D6/D7
interpretation.

The later implementation resolution is:

```text
Decide
  → structured-delivery by default
  → red-blue-debate only when orchestrationOverride = 'debate'
```

This becomes authoritative **only after the owning upstream contract is explicitly
amended to match**. D7 cannot make this decision authoritative by itself.

**PASS:** D2, D5, D6 and D7 describe exactly the same behavior.

---

## G4 — Artifact persistence path

The audit found incompatible paths.

The later D7 resolution uses:

```text
workspace/{projectId}/runs/{runId}/artifacts/{artifactId}/v{N}.md
```

D2/D3 must be synchronized to the same canonical model before implementation.

**PASS:** D2/D3/D7 agree on path, artifact identity and version semantics.

---

## G5 — missionId vs runId

These are distinct:

```text
missionId = identity of the submitted mission
runId     = identity of one execution of that mission
```

No implementation may collapse them.

**PASS:** NormalizedMission, ExecutionPlan, ExecutionState, persistence, events and
recovery preserve the distinction.

---

## G6 — NormalizedMission

The authoritative D2 NormalizedMission contract must be preserved.

The canonical persisted representation remains:

```text
normalized-mission.json
```

D7 must not substitute an unauthorized implementation-only file such as
`execution-meta.json`.

**PASS:** schema, filename and downstream consumption match D2.

---

## G7 — TaskSpec

The final contract must reconcile the architectural fields:

```text
objective
framing
outputSchema / outputSchemaId
qualityDimensions
evidenceRequirementLevel
```

Provider-specific prompt plumbing belongs to the Harness boundary unless explicitly
authorized otherwise.

`extractionHints` may become canonical only after its owning upstream contract
explicitly authorizes it.

**PASS:** D2/D3/D5/D7 agree on one TaskSpec boundary.

---

## G8 — ExecutionStep stepType

The authoritative D3 vocabulary is:

```text
generate
evaluate
synthesize
judge
aggregate
delegate
```

The obsolete/invented values are prohibited:

```text
validate
loop-check
```

**PASS:** D3 and D7 match exactly.

---

## G9 — HardBudget

D3's complete budget contract must be preserved, including:

- `maxTotalSteps`
- `maxConcurrentSteps`
- the authoritative cost/duration ceilings
- the authoritative exhaustion behavior enums.

**PASS:** schema, compiler validation and runtime enforcement use one contract.

---

## G10 — EvaluationPolicy

Must preserve:

```text
evaluatorCapabilityId
failureBehavior
passThreshold
```

Ownership remains:

```text
Engine executes evaluation.
Harness returns model output.
Outcome contracts define evaluation semantics.
```

No duplicate evaluation architecture may be created.

---

## G11 — ExecutionPlan immutability

During execution:

```text
plan.json           = immutable
state.json          = mutable runtime state
events.jsonl        = append-only
evaluations.jsonl   = append-only
```

Runtime progress must never be represented by mutating the plan.

---

## G12 — Runtime state

D3 remains authoritative for:

- `ExecutionAttempt`
- `attemptsByStepId`
- EngineLifecycleState vs persisted RunStatus
- revision cycles
- failure cascade
- cancellation
- crash recovery
- atomic writes.

---

## G13 — Context / Memory / Evidence boundary

D3's ContextManager is the boundary.

D4 owns:

- retrieval;
- memory;
- evidence;
- provenance;
- ranking;
- freshness;
- contradiction preservation;
- promotion governance.

D7 must not reimplement or redefine retrieval.

---

## G14 — UML philosophy

The adopted UML philosophy is retained without making IdeaGate dependent on a
specific UML implementation stack:

```text
retrieve-first
scope-before-retrieval
provenance
freshness
authority
confidence
contradiction preservation
selective cross-run continuity
project isolation
context assembly traceability
```

Memory is not a global context dump.

---

## G15 — Evidence vs memory

These remain distinct:

```text
Evidence capture
    ≠
Persistent memory promotion
```

The model cannot directly promote knowledge.

---

## G16 — Reasoning lineage

The reasoning chain remains:

```text
Evidence
  → Finding
  → Implication
  → Assumption
  → Decision
  → Constraint
  → Artifact
```

> **CO-OCCURRENCE IS NOT LINEAGE.**

No implementation may manufacture lineage because concepts appear together.

---

## G17 — Validation Log

Validation Log is a claim-driven human verification/presentation layer at the
bottom of applicable artifacts.

It is not a replacement for PKS provenance and not a per-artifact-type checkbox.

Where claims require source verification, it should expose the verifiable source
information required by the semantic contract.

---

## G18 — Structured-first visual artifacts

OST and ERD are structured-first:

```text
structured semantic data
        ↓
visual representation
```

Visuals retain stable artifact identity and derivation lineage.

Human editing preserves provenance/change origin.

---

## G19 — Human annotations

Human annotations do not automatically enter model context.

The D4 boundary must remain intact.

---

## G20 — Lifecycle count

The authoritative model is:

```text
15 executable steps
14 substantive PM lifecycle stages
```

---

# 6. DOCUMENT-SPECIFIC GATES

## D1

Verify:
- product vision remains authoritative;
- RunConfig remains the product-facing contract;
- nine OutcomeIds remain unchanged;
- ContextBundle and GoalSpec remain compatible;
- downstream documents do not silently expand D1.

No D1 redesign is authorized by this gate.

## D2

Before PASS:

1. Resolve Decide behavior against D5/D6/D7.
2. Replace stale `goal-based-loop` terminology.
3. Synchronize artifact persistence with D3/D7.
4. Authorize or remove downstream TaskSpec fields such as `extractionHints`.
5. Resolve Review recipe's internal contradiction.
6. Explicitly authorize any downstream `projectId` addition if required.
7. Preserve all 25 invariants.
8. Do not add semantics merely to satisfy implementation.

## D3

Verify:

1. artifact path matches D2/D7;
2. ContextManager remains authoritative;
3. Engine never re-routes/re-selects;
4. Engine never mutates plan.json;
5. runtime state remains separate;
6. crash recovery is deterministic;
7. evaluation cycle remains unified;
8. event catalogue remains canonical;
9. missionId/runId remain distinct;
10. V2 bridge remains a derived compatibility projection.

## D4

Verify:

1. v1.2 remains authoritative;
2. Part 34A remains embedded;
3. no duplicate Part 34A architecture exists;
4. seven memory classes remain unchanged;
5. UML remains INSPIRE, not a mandatory external dependency;
6. isolation occurs before retrieval;
7. evidence/memory/provenance remain distinct;
8. Validation Log remains a verification layer;
9. human annotations remain isolated;
10. visual artifacts remain structurally connected.

## D5

Verify:

1. nine OutcomeIds;
2. six canonical recipes;
3. claim-driven Validation Log;
4. OST/ERD semantic contracts;
5. D5 does not delegate semantic meaning to D7;
6. `extractionHints` has explicit upstream authority or is removed;
7. supersession metadata accurately identifies the immediate predecessor;
8. no new memory classes/outcomes/capabilities.

## D6

Verify:

1. v1.2 is complete;
2. Part 30A is embedded;
3. Part 30A is clarification, not a new document;
4. Composer hides implementation mechanics;
5. attachment is first-class;
6. workspace memory remains opt-in;
7. Review/Investigate context requirements are contract-driven;
8. Mission Crystallization remains presentation-only;
9. Advanced controls expose only authorized PM choices;
10. Design Blueprint remains authoritative for visual language/motion.

## D7

The final implementation specification must:

1. be genuinely versioned as V1.2 if the v1.2 correction set is incorporated;
2. use exact upstream schemas;
3. contain no invented OutcomeIds;
4. contain no invented RecipeIds;
5. contain no invented execution step types;
6. preserve NormalizedMission;
7. preserve `normalized-mission.json`;
8. preserve missionId/runId distinction;
9. preserve canonical artifact path;
10. preserve TaskSpec semantics;
11. preserve evaluation semantics;
12. preserve PKS boundary;
13. preserve provenance/lineage;
14. preserve V2 bridge semantics;
15. keep implementation details below the semantic/product contract boundary.

---

# 7. IMPLEMENTATION ENTRY GATE

Only after every P0/P1 gate passes may Claude Code begin implementation.

Mission 1 must be incremental and reversible. It must establish the minimum
deterministic foundation required for:

```text
Composer
  → Normalizer
  → Router
  → ExecutionPlan
```

Do not attempt a wholesale rewrite of the existing V2 engine.

---

# 8. REPOSITORY INTEGRATION GATE

Before copying:

```text
□ final filenames verified
□ versions verified
□ D4 Part 34A verified inside D4
□ D6 Part 30A verified inside D6
□ D7 is genuinely V1.2 if v1.2 corrections are final
□ no duplicate stale versions are authoritative
□ Build Gate PASS recorded
```

No file has been integrated into the repository merely because it exists in Downloads.

---

# 9. GIT INTEGRATION — EXECUTE ONLY AFTER PASS

```bash
cd /Users/apple/idea-gate-ui-safe

git status --short
git branch --show-current

ls -la docs/

git diff -- docs/
git diff --check

git add docs/IDEAGATE-MISSION-COMPOSER-V1-PRODUCT-AND-ENGINEERING-SPEC.md         docs/IDEAGATE-STRATEGY-ROUTER-EXECUTIONPLAN-SPEC-V1-1.md         docs/IDEAGATE-ORCHESTRATION-ENGINE-AGENT-HARNESS-SPEC.md         docs/IDEAGATE-CONTEXT-MEMORY-EVIDENCE-SPEC-V1-2-HARDENED.md         docs/IDEAGATE-OUTCOME-ENGINEERING-CONTRACTS-V1_3.md         docs/IDEAGATE-MISSION-COMPOSER-UX-SPEC-V1_2.md         docs/IDEAGATE-IMPLEMENTATION-SPEC-V1_2.md

git diff --cached --stat
git diff --cached --check

git commit -m "docs: freeze IdeaGate architecture and implementation contracts"

git push origin main
```

**Do not execute this block yet.**

The repository destination must be physically verified before staging.

---

# 10. PASS CRITERIA

The gate is PASS only when:

```text
D1 = PASS
D2 = PASS
D3 = PASS
D4 = PASS
D5 = PASS
D6 = PASS
D7 = PASS

Cross-document schema audit = PASS
Version audit = PASS
Persistence-path audit = PASS
Recipe audit = PASS
Runtime-state audit = PASS
Context/PKS boundary audit = PASS
Artifact/provenance audit = PASS
Implementation ambiguity audit = PASS
Repository filename audit = PASS
```

A P0/P1 failure automatically means:

```text
BUILD GATE = FAIL
IMPLEMENTATION = BLOCKED
REPOSITORY FREEZE = BLOCKED
```

A P2 may be deferred only when explicitly recorded with owner and rationale.

---

# 11. CLAUDE CODE CONTRACT-GAP RULE

When implementation begins, if Claude Code encounters behavior that cannot be
determined from the authoritative documents, it must stop at that boundary.

It must not infer or silently choose.

Required report:

```text
CONTRACT GAP

Document:
Section:
Observed implementation need:
Authoritative contract:
Conflict / omission:
Why implementation cannot safely continue:
Possible resolutions:
Owner decision required:
```

---

# 12. FINAL READINESS QUESTIONS

Before Mission 1, all must be answerable without guesswork:

```text
Can the system determine the PM job?
Can it determine the selected outcome?
Can it determine the canonical recipe?
Can it determine selected capabilities?
Can it compile the ExecutionPlan?
Can it execute without mutating the plan?
Can it persist runtime state deterministically?
Can it recover from a crash?
Can it evaluate and revise deterministically?
Can it assemble context without redefining retrieval?
Can it distinguish evidence from memory?
Can it preserve provenance and lineage?
Can it persist artifacts using one canonical path?
Can it preserve artifact versions?
Can it propagate staleness?
Can it expose PM-native progress without exposing internals?
Can it implement the Composer without inventing controls?
Can Claude Code implement D7 without choosing between conflicting contracts?
```

Any "no" caused by documentation conflict or omission = **FAIL**.

---

# 13. CURRENT DECISION

## BUILD GATE: NOT PASSED

The architecture is mature and substantially aligned, but the gate should remain
open until the remaining upstream synchronization is actually incorporated into
the authoritative files.

Known material synchronization items:

1. Decide default/override behavior must be single-source-of-truth.
2. Canonical artifact persistence path must be synchronized.
3. D2/D3/D5/D7 TaskSpec ownership must be reconciled.
4. D7 must have genuine V1.2 version identity if the v1.2 correction set is final.
5. D5 supersession metadata must accurately identify its immediate predecessor.
6. D2 stale recipe terminology must be removed.
7. Downstream-only fields must have explicit upstream authority.
8. Final filenames must be verified before repository integration.

These are synchronization tasks, not an invitation to redesign IdeaGate.

### NEXT ACTION

> Resolve the remaining Build Gate failures in the authoritative documents,
> rerun this gate, and only when every P0/P1 gate passes should the seven files
> enter the repository and Claude Code begin Mission 1 implementation.

---

## BUILD GATE RECORD

```text
Gate:                    IdeaGate V1 Implementation Readiness
Gate Version:            1.0
Architecture Set:       Documents 1–7
Current Decision:        NOT PASSED
Implementation Allowed: NO
Repository Integration:  NO
Claude Code Mission 1:   BLOCKED pending PASS
Next Owner Action:       Synchronize remaining P0/P1 contracts
```

---

*IdeaGate — Build Gate V1.0*
*This document verifies the architecture; it does not redefine it.*
