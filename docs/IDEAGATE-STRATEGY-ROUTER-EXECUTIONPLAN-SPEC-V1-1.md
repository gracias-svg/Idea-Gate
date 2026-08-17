# IDEAGATE — STRATEGY ROUTER + EXECUTIONPLAN SPECIFICATION
## Document 2 of 7 | Version 1.1 — Authoritative
## Status: Pre-Implementation

**Depends on:** Document 1 — Mission Composer V1 Product & Engineering Specification
(COMPLETE / AUTHORITATIVE)
**Supersedes:** Document 2 Version 1.0
**Feeds:** Document 3 — Orchestration Engine + Agent Harness Specification

**Core architectural principle (non-negotiable throughout):**
> AI explains and generates. Deterministic rules govern state, progression,
> validation gates, termination, persistence, cancellation, concurrency limits,
> budget enforcement, and artifact contracts.

---

## VERSION 1.1 CHANGE SUMMARY

The following architectural corrections were made from Version 1.0. Every
change fixes a specific contradiction or ambiguity. Nothing architecturally
correct was removed.

| # | Correction | Where |
|---|---|---|
| 1 | **ExecutionPlan is now strictly immutable.** Mutable runtime fields (`status`, `completedStepIds`, `failedStepIds`) removed from ExecutionPlan. A new `ExecutionState` contract owns all runtime state. | §1.3, Part 12, Part 13 |
| 2 | **CO is not a synthesis-domain artifact capability.** CO is selected for orchestration, synthesis, and judgment requirements — a separate routing layer from artifact-domain capability selection. Five-layer selection model introduced. | Part 6, §6.5, all examples |
| 3 | **Goal loop depth is independent of depth level.** Any depth may include a goal loop. Depth controls per-iteration rigor. Loop policy controls recurrence and termination. `depth: exhaustive` is not required for looping. | §7.3, Part 9, §8.3, worked examples |
| 4 | **Fail-closed vs safety normalization formally separated.** Semantic incompatibility → reject. Safety-bound normalization → apply, record, disclose. Mixed behavior removed. | Part 15 |
| 5 | **URL fetchability moved to Context Engine.** Normalizer validates URL syntax only. Runtime reachability is Context/Evidence layer responsibility. | §2.3, §2.5 |
| 6 | **crossArtifactConsistency vs crossArtifactConsistencyCheck clarified.** Consistency is a product requirement. The depth-driven check controls validation rigor, not whether coherence is required. | §5.5 |
| 7 | **One unified execution graph.** `EvaluationStep` is a step subtype within the single `ExecutionStep[]` graph, not a parallel array. Compiler produces one graph. | §12.2, §12.4, Part 13 |
| 8 | **Artifact dependency ownership split.** Run-specific dependencies live in the plan. Persistent workspace artifact relationships are a separate concern owned by the Artifact/Workspace model. | §12.6 |
| 9 | **Canonical persistence path fixed.** All references use `workspace/{projectId}/runs/{runId}/`. | §1.4, Part 14 |
| 10 | **Orchestration Engine ≠ CO** made an explicit architectural invariant with formal definition. | §4.3, §6.5, Invariant #4 |
| 11 | **Five-layer capability selection model** replaces the informal mixed reasons for Research and other outcomes. | Part 6 |
| 12 | **Testable acceptance criteria** added (previously only a checklist). | Part 24 |
| 13 | **Traceability matrix** from Document 1 principles to Document 2 contracts to Document 3 dependencies added. | Part 23 |
| 14 | **`ValidatedUrl.fetchable` removed** from Normalizer output — it is runtime context, not normalization state. | §2.3 |

*Final QA pass additions (specification integrity):*

| QA-1 | **Quality revision execution model** fully specified. Revision is a bounded retry transition, not a new plan step. `ExecutionState.revisionAttemptsByStepId` tracks attempts. Revision uses evaluation gaps as additional context for the re-run generation step. | §10.4 |
| QA-2 | **Evaluation source of truth** ownership defined. `state.json.evaluationResultsByStepId` = current/latest result. `evaluations.jsonl` = append-only history including all revision attempts. | §17.3 |
| QA-3 | **Runtime cost terminology** corrected. `consumedEstimatedCostUsd` renamed to `consumedActualCostUsd`. `HardBudget.maxEstimatedCostUsd` renamed to `costCeilingUsd`. Three cost concepts defined: estimated (pre-run forecast), ceiling (hard stop), actual consumed (runtime). | §12.5, Part 14 |
| QA-4 | **Loop termination precedence** made unambiguous. Eight-rule ordered evaluation: cancellation first, then goalMet (takes precedence over all bounds if current iteration satisfied the goal), then bounds in order. | §13.2 |
| QA-5 | **Execution order authority** clarified. `dependsOn` = correctness authority (step cannot start until dependencies complete). `order` = concurrency grouping hint. `receivesOutputFrom` = context scoping. Compiler validation rules for contradictions added. | §12.5 |
| QA-6 | **Invariant #25 added**: `ExecutionStepType` describes WHAT; `CapabilityId` describes WHO. `synthesize` ≠ CO; `judge` ≠ CO; `evaluate` ≠ QA. Document 3 must not re-derive capability from step type. | Part 20 |

---

## HOW TO READ THIS DOCUMENT

Document 1 defined *what* IdeaGate does and *why*.
This document defines *how IdeaGate decides what execution to construct.*

A reader should come away knowing:
- How the Router converts intent into execution decisions
- Why every capability in a plan is there and why absent ones are absent
- What an ExecutionPlan contains in its complete, immutable form
- What ExecutionState contains that ExecutionPlan deliberately does not
- How depth, context, and goal signals modify the plan independently of each other
- How the system fails safely when it cannot produce a valid plan
- What invariants Document 3 can rely on without reinventing architecture

---

# PART 1 — THE NORMALIZATION PIPELINE

## 1.1 Why This Pipeline Exists

The gap between what a PM types and what an execution engine can run is the
problem this pipeline solves. "Help me figure out if we should launch in
Southeast Asia" does not name a capability set, a recipe, or a quality policy.

The pipeline converts that intent into a fully specified, persisted,
deterministic ExecutionPlan without asking the user to understand the execution
layer.

## 1.2 The Four Stages

```
 USER
   │  intent · outcome · depth · context · goal? · orchestrationOverride?
   ▼
╔═══════════════════════════════════════════════╗
║  MISSION COMPOSER (UI)                        ║  produces RunConfig
║  Document 1 §II, §IV                         ║
╚═══════════════════════════════════════════════╝
   │
   ▼  RunConfig (Document 1 §IV)
╔═══════════════════════════════════════════════╗
║  REQUEST NORMALIZER  (Part 2)                 ║  validates, fills defaults,
║                                               ║  rejects invalid combinations
╚═══════════════════════════════════════════════╝
   │
   ▼  NormalizedMission (§2.4)
╔═══════════════════════════════════════════════╗
║  STRATEGY ROUTER  (Parts 3–10)                ║  derives execution decisions,
║  deterministic rule-based code, no LLM        ║  produces RoutingDecision
╚═══════════════════════════════════════════════╝
   │
   ▼  RoutingDecision (Part 11)
╔═══════════════════════════════════════════════╗
║  EXECUTIONPLAN COMPILER  (Part 13)            ║  compiles into typed,
║                                               ║  validated, persisted plan
╚═══════════════════════════════════════════════╝
   │
   ▼  ExecutionPlan (immutable, persisted BEFORE execution begins)
╔═══════════════════════════════════════════════╗
║  ORCHESTRATION ENGINE  (Document 3)           ║  executes the plan;
║  deterministic infrastructure, not a CO call  ║  writes ExecutionState
╚═══════════════════════════════════════════════╝
   │
   ▼  ExecutionState + events.jsonl + Artifacts
```

**These are four distinct stages. They must not be collapsed into one LLM call.**
Each stage has a single, well-defined input contract, a single output contract,
and explicit failure behavior.

## 1.3 The Three Runtime Files — Ownership Is Non-Negotiable

The three files that represent a mission's lifecycle have strict ownership rules.

| File | Owns | Written by | Immutable? |
|---|---|---|---|
| `plan.json` | What IdeaGate decided to do | Compiler | **Yes — after write** |
| `state.json` | What is currently happening | Orchestration Engine | No — updated during execution |
| `events.jsonl` | What happened in what order | Orchestration Engine | Append-only |

**Invariant:** The Orchestration Engine **never writes to `plan.json`**. It reads
plan.json and writes to state.json and events.jsonl. Any field that the engine
must update during execution belongs in state.json, not plan.json.

This is the critical correction from Version 1.0. See Part 12 (ExecutionPlan)
and Part 14 (ExecutionState).

## 1.4 Canonical Persistence Path

All files for a mission live at:
```
workspace/
  {projectId}/
    artifacts/              ← persisted artifact outputs
    runs/
      {runId}/
        normalized-mission.json
        routing-decision.json
        plan.json           ← immutable after Compiler writes it
        state.json          ← mutable runtime state
        events.jsonl        ← append-only event log
        evaluations.jsonl   ← evaluation results, append-only
```

**This path is canonical. Every reference in this document uses it.**

## 1.5 Stage Contracts — What Each Stage May and May Not Do

| Stage | May | May not |
|---|---|---|
| Normalizer | Validate, default-fill, reject invalid input | Make execution decisions, select capabilities, query the filesystem or network |
| Router | Make deterministic routing decisions from NormalizedMission | Call LLMs, query external systems, read execution state |
| Compiler | Assemble, validate, and persist the plan | Make routing decisions, modify existing plans, call LLMs |
| Orchestration Engine | Execute the plan, read state, update state, emit events | Modify plan.json, make routing decisions, select capabilities |

---

# PART 2 — REQUEST NORMALIZER

## 2.1 Responsibility

The Normalizer takes a raw RunConfig (from the Mission Composer) and produces a
validated, default-filled NormalizedMission. It is the only layer that interacts
with raw user input.

**What it does:**
- Validates required fields are present and acceptable
- Fills defaults for optional fields
- Rejects semantically invalid combinations
- Applies safety normalizations with explicit disclosure
- Produces a NormalizedMission that the Router can trust is complete and valid

**What it does NOT do:**
- Select capabilities
- Select orchestration recipes
- Evaluate execution strategy
- Query external URLs for reachability (see §2.5)
- Make planning decisions

## 2.2 Validation Operations (Deterministic, in Order)

| Operation | Rule | Failure |
|---|---|---|
| Intent presence | ≥ 10 characters | `INTENT_TOO_SHORT` |
| Outcome presence | Must be one of the nine OutcomeIds | `OUTCOME_REQUIRED` (Phase 1 requires explicit selection) |
| Outcome + context pairing | `review` and `investigate` require at least one context source | `OUTCOME_REQUIRES_CONTEXT` |
| Goal bounds completeness | If `goal` is present, all four GoalBounds fields must be set | `GOAL_MISSING_BOUNDS` |
| Goal iterations cap | `goal.bounds.maxIterations > 5` | safety normalize to 5, disclose (see §2.6) |
| Context file types | Only supported MIME types accepted | `CONTEXT_FILE_UNSUPPORTED` |
| Context file sizes | Above limit → reject that file | `CONTEXT_FILE_TOO_LARGE` |
| URL syntax | Well-formed URL syntax | `CONTEXT_URL_MALFORMED` |
| Combination validity | See §2.4 | `COMBINATION_INVALID` |
| Override compatibility | See §7.4 | `ORCHESTRATION_INCOMPATIBLE` |

## 2.3 What URLs the Normalizer Validates — and What It Does Not

The Normalizer validates that a URL is **syntactically well-formed and policy-permitted**.

The Normalizer does **not** check whether a URL is reachable, returns content,
or is rate-limited. These are runtime properties that can change moment to moment.
Treating a transiently-unreachable URL as invalid during normalization would make
normalization nondeterministic.

**URL reachability, fetching, content extraction, and scoping to capabilities
are the responsibility of the Context Engine (Document 4).** The Normalizer
simply passes valid URLs forward.

```typescript
// Version 1.0 had fetchable: boolean here. REMOVED in 1.1.
interface ValidatedUrl {
  url: string;
  wellFormed: true;       // guaranteed by the Normalizer; malformed URLs are rejected
  policyPermitted: boolean; // false if domain is on a block list
}
```

## 2.4 Invalid Combination Table (Semantic Invalidity — Hard Reject)

These are semantic incompatibilities. The Normalizer returns an error and
produces no NormalizedMission. The Router never receives these.

| Combination | Error | User message |
|---|---|---|
| `outcome: 'review'` + no context source | `OUTCOME_REQUIRES_CONTEXT` | "Review requires an artifact to review. Upload a document or select one from your workspace." |
| `outcome: 'investigate'` + no context source | `OUTCOME_REQUIRES_CONTEXT` | "Investigation requires evidence. Upload data, research, or a product spec before running." |
| `goal` present + any `goal.bounds` field missing | `GOAL_MISSING_BOUNDS` | "A bounded goal requires all four bounds: maxIterations, maxDurationMs, costCeilingUsd, onExhausted." |
| `orchestrationOverride: 'debate'` + `outcome: 'prioritize'` | `ORCHESTRATION_INCOMPATIBLE` | "Debate requires two competing positions. Prioritize is a ranking task with one correct ordering." |
| `orchestrationOverride: 'debate'` + `outcome: 'casestudy'` | `ORCHESTRATION_INCOMPATIBLE` | "Debate is not compatible with Case Study — narrative authorship requires a single voice." |
| `orchestrationOverride: 'goal-based-research-loop'` + no `goal` | `ORCHESTRATION_INCOMPATIBLE` | "Goal-based loop requires an explicit goal specification." |

## 2.5 Semantic Invalidity vs Safety Normalization — Formal Distinction

This is a correction from Version 1.0, which mixed these two behaviors.

**Semantic Invalidity → Fail Closed**
When a configuration has no meaningful execution interpretation, the Normalizer
rejects it. No plan is produced. No fallback topology is invented.

**Safety-Bound Normalization → Apply, Record, Disclose**
When a configuration *does* have a meaningful interpretation but a specific
value violates a system safety limit, the Normalizer may normalize the value —
but must record and disclose the normalization.

| Input | Normalization | Disclosure |
|---|---|---|
| `goal.bounds.maxIterations: 20` | Normalized to 5 (V1 hard cap) | `appliedNormalizations` records the original value and the cap |
| `depth: 'exhaustive'` + `outcome: 'prioritize'` | Normalized to `'deep'` (exhaustive adds no value to ranking) | `appliedNormalizations` records this; user is informed before execution |

```typescript
interface AppliedNormalization {
  field: string;
  originalValue: unknown;
  normalizedValue: unknown;
  rule: string;           // the explicit policy rule that required this
  userVisible: boolean;   // true = shown to user before execution begins
}
```

**The rule:** the Normalizer never invents a different semantic meaning. It only
adjusts bounded values within a configuration that already has a valid meaning.

## 2.6 Default Resolution (Deterministic, in Order)

| Field | Default | Reason |
|---|---|---|
| `depth` | `'balanced'` | Middle tier; appropriate for most PM jobs |
| `context.includeWorkspaceMemory` | `false` | Opt-in; most fresh missions do not need prior context |
| `context.uploads` | `[]` | |
| `context.urls` | `[]` | |
| `context.workspaceArtifactPaths` | `[]` | |

## 2.7 NormalizedMission Output Contract

```typescript
interface NormalizedMission {
  // From RunConfig, validated
  intent: string;
  outcome: OutcomeId;
  depth: DepthLevel;
  orchestrationOverride?: OrchestrationRecipeId;
  context: ResolvedContextBundle;
  goal?: ValidatedGoalSpec;

  // Added by the Normalizer
  missionId: string;            // UUID — stable across this mission's lifetime
  normalizedAt: string;         // ISO 8601
  inferredOutcome: boolean;     // true if outcome was inferred (Phase 2+)
  inferenceConfidence?: number; // 0–1, present when inferredOutcome=true
  appliedDefaults: AppliedDefault[];
  appliedNormalizations: AppliedNormalization[];
  normalizationVersion: string; // "v1"
}

interface ResolvedContextBundle {
  uploads: ValidatedContextItem[];
  urls: ValidatedUrl[];             // syntax-valid only — not fetched yet
  githubRepo?: string;
  workspaceArtifactPaths: string[];
  includeWorkspaceMemory: boolean;
  estimatedContextTokens: number;  // rough upper bound for budget planning
}

interface ValidatedContextItem {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  scopeHint?: CapabilityId[];  // user-supplied hint for which capabilities want this
  // Note: extraction and parsing happen in the Context Engine, not here
}

interface ValidatedGoalSpec {
  statement: string;
  criteria: GoalCriterion[];
  bounds: GoalBounds;          // maxIterations already capped to ≤ 5
  validatedAt: string;
}
```

## 2.8 Normalizer Failure Contract

On any semantic validation failure, the Normalizer returns a `NormalizationError`
and produces no NormalizedMission. The Router is never invoked with invalid input.

```typescript
interface NormalizationError {
  code: NormalizationErrorCode;
  field?: string;
  userMessage: string;      // shown to the user
  engineerDetail?: string;  // logged only
}

type NormalizationErrorCode =
  | 'INTENT_TOO_SHORT'
  | 'OUTCOME_REQUIRED'
  | 'OUTCOME_REQUIRES_CONTEXT'
  | 'GOAL_MISSING_BOUNDS'
  | 'CONTEXT_FILE_UNSUPPORTED'
  | 'CONTEXT_FILE_TOO_LARGE'
  | 'CONTEXT_URL_MALFORMED'
  | 'COMBINATION_INVALID'
  | 'ORCHESTRATION_INCOMPATIBLE'
  | 'INTERNAL_NORMALIZER_ERROR';
```

---

# PART 3 — STRATEGY ROUTER: ROLE AND CONSTRAINTS

## 3.1 What the Router Is

The Strategy Router is the decision-making layer. It takes a NormalizedMission
and produces a RoutingDecision — the complete set of execution choices with
rationale.

**The Router is deterministic rule-based code, not an LLM call.** The same
NormalizedMission must always produce the same RoutingDecision. This is
non-negotiable for:
- Reproducibility (re-running a mission produces the same plan)
- Auditability (the plan is a reliable record of intent)
- Debuggability (routing logic is inspectable and testable)
- Cost predictability (the plan's budget is known before execution)

LLMs may assist in upstream classification (outcome inference, Phase 2), but
the Router's own decision logic is explicit rules. Where a decision requires
judgment that cannot be deterministic, that is surfaced as a routing failure
requiring user input, not resolved by an LLM call inside the Router.

## 3.2 The Orchestration Engine Is Not the Coordinator Capability

This distinction is architectural and must not be blurred.

**Orchestration Engine:** deterministic infrastructure. Executes the plan. Does
not invoke capabilities directly — it invokes the Agent Harness (Document 3),
which invokes capabilities. The engine enforces sequencing, isolation, budgets,
retries, cancellation, state persistence, and event emission. It does not reason.

**CO (Coordinator capability):** one specialist capability that may be invoked
in specific plan steps to perform synthesis, framing, judgment, or aggregation.
CO is selected by the Router when the mission requires it. CO is not selected
for every mission.

**Consequence:** a mission that invokes only PS and QA (Prioritize) still runs
under the Orchestration Engine. CO's absence from the capability list does not
mean the system is unorchestrated — it means the Orchestration Engine can
sequence PS → QA without requiring a CO reasoning step.

This distinction becomes Architectural Invariant #4 (Part 21).

## 3.3 The Five Routing Questions

These questions are the Router's charter. Every routing decision traces to one.

1. **What is the user trying to accomplish?** → ArtifactContract
2. **What information is required?** → evidence needs, context requirements
3. **Which capabilities are required?** → five-layer selection (Part 6)
4. **How should those capabilities collaborate?** → orchestration recipe (Part 7)
5. **How will IdeaGate know it is good enough to stop?** → evaluation policy + termination

## 3.4 Why the Router Produces a RoutingDecision Before an ExecutionPlan

The Router produces a `RoutingDecision`. The Compiler assembles it into an
`ExecutionPlan`. This separation:
- Makes the Router independently testable (test routing logic against RoutingDecision)
- Makes the Compiler independently testable (test plan assembly against RoutingDecision)
- Preserves the Router's output for inspection by Mission Control
- Creates a clean boundary: routing decisions are facts; plan assembly is mechanical

---

# PART 4 — ARTIFACT CONTRACT DERIVATION

## 4.1 The Central Architectural Principle

**The artifact contract drives capability selection.**

The Router does not ask: "what agents does Build need?" It asks: "what artifact
set would prove Build is complete, what information domains those artifacts
require, and which capabilities own those domains?"

This keeps the system outcome-driven rather than capability-driven. If the
artifact contract for Build were restructured, the capability set would change
automatically — not because someone updated an agent list, but because the
domain requirements changed.

```
User intent
   ↓
Outcome
   ↓
ArtifactContract (what artifact set proves the objective is addressed)
   ↓
Artifact domains (what kinds of expertise those artifacts require)
   ↓
Domain capabilities (Layer 1 of selection)
   + Orchestration requirements (Layer 4)
   + Evaluation requirements (Layer 3)
   = Total selected capability set
```

## 4.2 ArtifactContract Schema

```typescript
interface ArtifactContract {
  outcomeId: OutcomeId;
  artifacts: PlannedArtifact[];

  // Product requirement: must these artifacts be coherent with each other?
  // This is independent of how rigorously coherence is checked (which is
  // controlled by DepthPolicy).
  crossArtifactCoherence: boolean;

  // Does this outcome require external evidence sources?
  evidenceRequired: boolean;
  minimumEvidenceSources?: number;  // present when evidenceRequired: true

  // Does this outcome require an existing artifact as input?
  inputArtifactRequired: boolean;

  // Does the synthesis artifact require preserved dissent?
  dissentPreservationRequired: boolean;

  // Minimum number of independent assessors (council, review)
  minimumIndependentAssessors?: number;

  // Minimum number of hypotheses (investigate)
  minimumHypotheses?: number;

  // May this outcome run with a goal-based loop?
  goalLoopEligible: boolean;
}

interface PlannedArtifact {
  id: string;                 // stable, unique within IdeaGate's artifact vocabulary
  domain: ArtifactDomain;
  required: boolean;
  // In V1, every artifact is narrative. Future: structured, visual.
  // outputType is reserved; V1 implementations may default to 'narrative'.
  outputType?: ArtifactOutputType;
}

type ArtifactDomain =
  | 'research'        // RE is the primary domain capability
  | 'strategy'        // PS is the primary domain capability
  | 'ux'             // UX is the primary domain capability
  | 'architecture'   // AR is the primary domain capability
  | 'quality'        // QA is the primary domain capability
  // Note: 'synthesis' is NOT an artifact domain. CO is selected via Layer 4
  // (orchestration requirement), not because an artifact has domain 'synthesis'.
  // Version 1.0 used 'synthesis' as a domain; this is corrected in 1.1.

type ArtifactOutputType =
  | 'narrative'       // V1: all artifacts
  | 'structured'      // future: typed structured content
  | 'visual'          // future: derived from structured information
  | 'evaluation-result'; // internal: produced by evaluation steps
```

### Why 'synthesis' Is Not an Artifact Domain

Version 1.0 used `domain: 'synthesis'` on artifacts and derived CO from it.
This created two problems:
1. It made CO appear mandatory for every outcome that has a synthesis artifact
2. It confused a coordination *requirement* with a *content domain*

The correction: CO is not selected because an artifact requires synthesis
content. CO is selected because the orchestration recipe requires a synthesis,
judgment, or aggregation step. This is Layer 4 of capability selection.

## 4.3 Artifact Contracts per Outcome

### `build`

```typescript
{
  outcomeId: 'build',
  artifacts: [
    { id: 'idea-intake',             domain: 'strategy',     required: true },
    { id: 'discovery',               domain: 'research',     required: true },
    { id: 'problem-definition',      domain: 'research',     required: true },
    { id: 'solution-design',         domain: 'strategy',     required: true },
    { id: 'mvp-hypothesis',          domain: 'strategy',     required: true },
    { id: 'validation',              domain: 'quality',      required: true },
    { id: 'prioritization',          domain: 'strategy',     required: true },
    { id: 'prd',                     domain: 'strategy',     required: true },
    { id: 'ux-design',               domain: 'ux',           required: true },
    { id: 'usability-planning',      domain: 'ux',           required: true },
    { id: 'architecture',            domain: 'architecture', required: true },
    { id: 'backlog-release',         domain: 'architecture', required: true },
    { id: 'implementation-planning', domain: 'strategy',     required: true },
    { id: 'qa-readiness',            domain: 'quality',      required: true },
    { id: 'prototype-prompt',        domain: 'architecture', required: true },
  ],
  crossArtifactCoherence: true,
  evidenceRequired: false,
  inputArtifactRequired: false,
  dissentPreservationRequired: false,
  goalLoopEligible: false,
}
// Domains: research, strategy, ux, architecture, quality → all five.
// All five domain capabilities required. CO required via Layer 4 (stage-gate coordination).
```

### `casestudy`

```typescript
{
  outcomeId: 'casestudy',
  artifacts: [
    { id: 'context-and-problem',   domain: 'research',  required: true },
    { id: 'options-considered',    domain: 'strategy',  required: true },
    { id: 'decision-and-rationale',domain: 'strategy',  required: true },
    { id: 'execution-approach',    domain: 'strategy',  required: true },
    { id: 'outcome-and-learning',  domain: 'strategy',  required: true },
  ],
  crossArtifactCoherence: true,
  evidenceRequired: false,
  inputArtifactRequired: false,
  dissentPreservationRequired: false,
  goalLoopEligible: false,
}
// Domains: research, strategy only. UX/AR/QA not in the domain set.
// CO selection: Layer 4 — sequential recipe with no multi-perspective synthesis
// → CO NOT required. The narrative is single-voiced.
```

### `prioritize`

```typescript
{
  outcomeId: 'prioritize',
  artifacts: [
    { id: 'ranked-list',          domain: 'strategy', required: true },
    { id: 'scoring-breakdown',    domain: 'strategy', required: true },
    { id: 'dependency-map',       domain: 'quality',  required: true },
    { id: 'sequence-rationale',   domain: 'strategy', required: true },
  ],
  crossArtifactCoherence: false,
  evidenceRequired: false,
  inputArtifactRequired: false,
  dissentPreservationRequired: false,
  goalLoopEligible: false,
}
// Domains: strategy, quality only.
// CO: Layer 4 check — no multi-perspective synthesis needed.
// CO NOT required. The Orchestration Engine sequences PS → QA without needing CO.
```

### `plan`

```typescript
{
  outcomeId: 'plan',
  artifacts: [
    { id: 'epic-story-hierarchy', domain: 'architecture', required: true },
    { id: 'acceptance-criteria',  domain: 'quality',      required: true },
    { id: 'dependency-order',     domain: 'architecture', required: true },
    { id: 'sprint-sequence',      domain: 'strategy',     required: true },
    { id: 'risk-register',        domain: 'quality',      required: true },
  ],
  crossArtifactCoherence: true,
  evidenceRequired: false,
  inputArtifactRequired: false,
  dissentPreservationRequired: false,
  goalLoopEligible: false,
}
// Domains: architecture, strategy, quality. CO: Layer 4 — no multi-perspective synthesis.
// CO NOT required.
```

### `research`

```typescript
{
  outcomeId: 'research',
  artifacts: [
    { id: 'market-landscape',       domain: 'research',  required: true },
    { id: 'competitor-matrix',      domain: 'research',  required: true },
    { id: 'user-problem-evidence',  domain: 'research',  required: true },
    { id: 'assumption-register',    domain: 'research',  required: true },
    { id: 'opportunity-assessment', domain: 'strategy',  required: true },
  ],
  crossArtifactCoherence: true,
  evidenceRequired: true,
  minimumEvidenceSources: 2,
  inputArtifactRequired: false,
  dissentPreservationRequired: false,
  goalLoopEligible: true,
}
// Domains: research, strategy. CO: Layer 4 — recipe requires coordination and framing.
// CO SELECTED via Layer 4.
```

### `review`

```typescript
{
  outcomeId: 'review',
  artifacts: [
    { id: 'gap-analysis',       domain: 'quality',  required: true },
    { id: 'revised-artifact',   domain: 'quality',  required: false },
  ],
  crossArtifactCoherence: false,
  evidenceRequired: false,
  inputArtifactRequired: true,
  dissentPreservationRequired: false,
  minimumIndependentAssessors: 2,
  goalLoopEligible: false,
}
// Domain capabilities: see §6.4 — context-driven selection determines reviewers.
// CO: Layer 4 — parallel critique recipe requires synthesis. CO SELECTED.
```

### `decide`

```typescript
{
  outcomeId: 'decide',
  artifacts: [
    { id: 'decision-framing',  domain: 'strategy', required: true },
    { id: 'position-a',        domain: 'strategy', required: true },
    { id: 'position-b',        domain: 'strategy', required: true },
    { id: 'synthesis-dissent', domain: 'strategy', required: true },
  ],
  crossArtifactCoherence: true,
  evidenceRequired: false,
  inputArtifactRequired: false,
  dissentPreservationRequired: true,
  goalLoopEligible: false,
}
// Domain: strategy only → PS. CO: Layer 4 — debate recipe requires CO as judge.
// Result: PS (×2 instances) + CO.
```

### `council`

```typescript
{
  outcomeId: 'council',
  artifacts: [
    { id: 'assessor-report',   domain: 'quality',  required: true }, // one per assessor
    { id: 'council-synthesis', domain: 'quality',  required: true },
  ],
  crossArtifactCoherence: false,
  evidenceRequired: false,
  inputArtifactRequired: false,
  dissentPreservationRequired: true,
  minimumIndependentAssessors: 2,
  goalLoopEligible: false,
}
// Domain capabilities: context-driven selection (§6.4). CO: Layer 4 (aggregation).
```

### `investigate`

```typescript
{
  outcomeId: 'investigate',
  artifacts: [
    { id: 'evidence-summary',    domain: 'research',  required: true },
    { id: 'hypothesis-set',      domain: 'research',  required: true },
    { id: 'experiment-designs',  domain: 'quality',   required: true },
    { id: 'recommended-action',  domain: 'strategy',  required: true },
  ],
  crossArtifactCoherence: true,
  evidenceRequired: true,
  inputArtifactRequired: true,
  dissentPreservationRequired: false,
  minimumHypotheses: 3,
  goalLoopEligible: false,  // uses bounded evidence gathering, not an explicit goal loop
}
// Domains: research, quality, strategy. Additional capabilities: context-driven (§6.4).
// CO: Layer 4 — synthesis of multi-lens diagnosis. CO SELECTED.
```

## 4.4 Artifact Contract Extensibility

Artifact IDs are stable across versions, improvements, and re-runs. An artifact
improved three times carries the same `id` with an incrementing `version`.

No ArtifactContract may assume `outputType: 'narrative'` is permanent. The
`outputType` field exists to accommodate future structured and visual outputs
without requiring a schema migration. Document 1's three-layer artifact model
(Narrative → Structured Information → Visual Representations) depends on this
stability.

The `structured` and `representations` fields described in Document 1 §29 will
be attached to artifacts using stable `id` values. If `id` changed, the
attachment would be lost.

## 4.5 Cross-Artifact Coherence vs Depth-Controlled Check — The Distinction

**`ArtifactContract.crossArtifactCoherence`** is a **product requirement**.
It states that these artifacts must be internally consistent with each other.
A PRD that contradicts the Problem Definition is an artifact quality failure
regardless of depth level.

**`DepthPolicy.evaluationPassCount`** and related depth fields control **how
rigorously coherence is checked**:
- `balanced`: each artifact is evaluated for internal quality; coherence is
  expected but a dedicated cross-artifact pass is not run
- `deep`: coherence expectations are stronger; contradiction detection is enabled
- `exhaustive`: a dedicated cross-artifact evaluation step is added to the plan

A `balanced` Build mission still requires coherence — it simply checks it less
formally. A reader must not interpret `balanced` as "coherence doesn't matter."

---

# PART 5 — CAPABILITY MODEL

## 5.1 Primary Capabilities

Six specialist capabilities exist in IdeaGate V3. They are the available
capability universe — not a mandatory execution roster.

| ID | Capability | Domain expertise |
|---|---|---|
| CO | Coordinator | Synthesis, judgment, decision framing, coordination, aggregation |
| PS | Product Strategy | Positioning, prioritization, requirements, business case |
| RE | Research | Evidence gathering, market analysis, JTBD synthesis |
| UX | UX Design | Flows, information architecture, usability, interaction design |
| AR | Architect | Technical feasibility, system design, decomposition, estimation |
| QA | Quality Assurance | Validation, completeness, acceptance criteria, risk |

## 5.2 Capability Count ≠ Instance Count

A capability may appear multiple times in a plan with different `instanceRole`
values. This is how Debate works.

```
decide outcome:
  Capabilities: PS, CO         (2 distinct capabilities)
  Instances:   PS[blue], PS[red], CO[judge]   (3 instances)
```

Instance count and capability count are independent. This distinction must
not be confused in the execution graph or in documentation.

## 5.3 Capabilities vs Sub-Agents

Primary capabilities are **persistent specialist roles** in the system.

Sub-agents are **temporary execution workers** created to decompose one
capability's task into parallel bounded sub-tasks. They are not new capabilities.
They are not promoted to primary capabilities after their task completes.
They report their output to the capability that spawned them.

```
RE (primary capability, persistent)
 ├── market-landscape worker (temporary sub-agent)
 ├── competitor worker (temporary sub-agent)
 └── user-problem worker (temporary sub-agent)
        ↓ workers report SubAgentResult back to RE
RE synthesizes
```

---

# PART 6 — FIVE-LAYER CAPABILITY SELECTION

This corrects Version 1.0's mixed capability selection reasons. Selection
now uses five explicit layers applied in sequence. The final capability set
is the union of all layers.

## 6.1 The Five Layers

```
LAYER 1 — Artifact Domain Capabilities
LAYER 2 — Context Signal Capabilities (context-driven additions)
LAYER 3 — Depth/Evaluation Capabilities (quality gate requirements)
LAYER 4 — Orchestration Capabilities (recipe-driven CO requirement)
LAYER 5 — Delegation (sub-agent workers for specific capabilities)
```

Layers 1–4 determine which **primary capabilities** are in the plan.
Layer 5 determines which capabilities may **delegate to sub-agents**.

## 6.2 Layer 1 — Artifact Domain Capabilities

The deterministic map from artifact domain to primary capability:

```typescript
const DOMAIN_CAPABILITY_MAP: Record<ArtifactDomain, CapabilityId> = {
  'research':      'RE',
  'strategy':      'PS',
  'ux':            'UX',
  'architecture':  'AR',
  'quality':       'QA',
}
// Note: there is no 'synthesis' domain. CO is selected via Layer 4 only.
```

**Algorithm:** collect all `domain` values from `ArtifactContract.artifacts`,
map each to its capability using `DOMAIN_CAPABILITY_MAP`, deduplicate.

**This gives the minimum domain capability set.** It may be augmented by
Layers 2–4. It is never reduced.

## 6.3 Layer 2 — Context Signal Capabilities

Context signals from the NormalizedMission can activate additional capabilities
beyond what the artifact domains require. These rules are deterministic and
applied only when the outcome supports variable capability selection.

### For `review` (which domains to assess)

```
Classify the uploaded document type, then:

IF document is a PRD, strategy doc, requirements, or positioning doc:
  → activate PS (strategy critique)
IF document contains UX/design content, flows, or interface specs:
  → activate UX (design critique)
IF document contains architecture, technical specs, or system design:
  → activate AR (technical critique)
ALWAYS:
  → activate QA (completeness, acceptance criteria)
```

### For `council` (which specialists to convene)

```
IF question involves pricing, positioning, market, revenue, roadmap:
  → activate PS
IF question involves design, usability, user experience, accessibility:
  → activate UX
IF question involves feasibility, architecture, scalability, integration:
  → activate AR
IF question involves market evidence, research, competitor analysis:
  → activate RE

ALWAYS:
  → activate CO (Layer 4 — council recipe requires aggregation)
  → do NOT activate all five domain capabilities by default
  → justify every activation with one of the above signals
```

### For `investigate` (which lenses apply to the symptom)

```
IF symptom involves funnel, conversion, activation, onboarding:
  → activate UX, PS
IF symptom involves reliability, performance, latency, errors:
  → activate AR
IF symptom involves churn, retention, engagement, NPS:
  → activate PS, RE
IF symptom involves support volume, complaint patterns:
  → activate UX, QA
IF symptom involves market, competitive, external factors:
  → activate RE, PS
```

## 6.4 Layer 3 — Depth/Evaluation Capabilities

Some depth levels require capabilities to perform additional quality work.

| Depth + Condition | Addition |
|---|---|
| `depth: 'deep'` + `evidenceRequired: true` | QA added for evidence coverage validation (if not already present) |
| `depth: 'exhaustive'` + `crossArtifactCoherence: true` | A dedicated cross-artifact evaluation step is added — evaluated by QA or CO depending on recipe |
| `depth: 'exhaustive'` + `minimumIndependentAssessors ≥ 2` | Maximum supported assessor count within the relevant domain set |

**Critical:** depth adds rigor, not arbitrary capabilities. A deep `prioritize`
run does not add RE or UX — it increases evaluation strictness for the PS and
QA passes that already exist.

## 6.5 Layer 4 — Orchestration Capabilities (CO Selection)

This is the layer that corrects the Version 1.0 "synthesis domain" conflation.

CO is selected when the orchestration recipe requires a synthesis, aggregation,
judgment, or framing step that CO must perform. CO is **not** selected merely
because some artifact is labeled "synthesis."

| Recipe | CO requirement |
|---|---|
| `structured-delivery` (without stage-gate coordination) | CO NOT required. The Orchestration Engine sequences steps. |
| `structured-delivery` (Build — with stage-gate coordination) | CO SELECTED — coordinator evaluates stage gates, validates outputs before advancing |
| `research-first` | CO SELECTED — coordinates research phase and synthesizes the final framing |
| `parallel-critique` | CO SELECTED — synthesizes independent critiques |
| `council` | CO SELECTED — aggregates assessments, synthesizes recommendation |
| `red-blue-debate` | CO SELECTED — acts as judge, synthesizes with preserved dissent |

**Prioritize (`structured-delivery`, no stage-gate coordination):**
CO is NOT required. PS scores items. QA validates dependencies. The Orchestration
Engine sequences PS → QA → done. No synthesis across independent perspectives
is needed. The system executes correctly without CO.

**Build (`structured-delivery` with stage-gate coordination):**
CO IS required. The coordinator must validate each stage gate before advancing,
detect conflicts, and ensure downstream coherence. This is an explicit
coordination responsibility — the stage-gate logic is too complex to be a
purely mechanical Orchestration Engine function.

## 6.6 Layer 5 — Delegation (Sub-Agent Workers)

Certain capabilities may be eligible to delegate sub-tasks to temporary workers.
See Part 9 for full delegation policy. Layer 5 determines which capabilities in
the plan are delegation-eligible based on outcome and depth.

## 6.7 Capability Rationale Records — Mandatory for Explainability

Every capability selection and rejection must be recorded in the RoutingDecision.
This is not optional metadata — it is the product feature that enables Mission
Control to answer "why these capabilities?"

```typescript
interface CapabilityRationale {
  capabilityId: CapabilityId;
  decision: 'selected' | 'rejected' | 'considered-and-rejected';
  layer: 1 | 2 | 3 | 4 | 5;           // which layer made this decision
  reason: string;                       // explicit human-readable explanation
  triggeredBy: string;                  // artifact domain, context signal, recipe, or depth rule
  consideredFor?: string;               // what was evaluated before rejection
}
```

**Example rationale records for `prioritize`:**
```
{ capabilityId: 'PS', decision: 'selected', layer: 1,
  reason: 'Strategy domain artifacts require PS for framework application and ranking',
  triggeredBy: 'PRIORITIZE_ARTIFACT_CONTRACT.artifacts domains include "strategy"' }

{ capabilityId: 'QA', decision: 'selected', layer: 1,
  reason: 'Quality domain artifact (dependency-map) requires QA for validation',
  triggeredBy: 'PRIORITIZE_ARTIFACT_CONTRACT.artifacts[2].domain = "quality"' }

{ capabilityId: 'RE', decision: 'rejected', layer: 1,
  reason: 'No research domain artifact in PRIORITIZE_ARTIFACT_CONTRACT. Items to rank are user-provided; discovery is not required.',
  triggeredBy: 'Artifact domain scan: research domain absent' }

{ capabilityId: 'UX', decision: 'rejected', layer: 1,
  reason: 'No UX domain artifact in PRIORITIZE_ARTIFACT_CONTRACT.',
  triggeredBy: 'Artifact domain scan: ux domain absent' }

{ capabilityId: 'AR', decision: 'rejected', layer: 1,
  reason: 'No architecture domain artifact. Effort estimates provided by user; no decomposition needed.',
  triggeredBy: 'Artifact domain scan: architecture domain absent' }

{ capabilityId: 'CO', decision: 'rejected', layer: 4,
  reason: 'Structured-delivery recipe with no stage-gate coordination does not require CO. PS→QA sequential execution is handled by the Orchestration Engine.',
  triggeredBy: 'Recipe: structured-delivery (no stage-gate mode); Layer 4 CO selection rule not triggered' }
```

---

# PART 7 — ORCHESTRATION RECIPE SELECTION

## 7.1 What a Recipe Is

A recipe is a named composition of orchestration primitives (Document 1 Part VIII–IX).
The Router selects a recipe based on outcome and ArtifactContract properties.
The recipe, in turn, determines Layer 4 capability requirements (§6.5).

## 7.2 Auto-Selection Logic (Deterministic)

```
Build:       structured-delivery (with stage-gate coordination)
CaseStudy:   structured-delivery (without stage-gate)
Prioritize:  structured-delivery (without stage-gate)
Plan:        structured-delivery (without stage-gate)
Decide:      red-blue-debate
Research:    research-first
             IF goalLoopEligible AND goal IS present: goal-based-research-loop
Review:      Phase 1/2: structured-delivery (sequential critique fallback)
             Phase 3: parallel-critique
Council:     council
Investigate: research-first (evidence phase) + structured steps (diagnosis)
```

The Router selects the recipe before running Layer 4 capability selection.
Layer 4 then determines CO requirement based on the selected recipe.

## 7.3 Goal Loop and Depth Are Independent Dimensions

**This is the correction from Version 1.0 which conflated them.**

| Dimension | Controls |
|---|---|
| `depth` | Per-iteration rigor: research breadth, evaluation threshold, revision allowance, evidence requirements |
| `goal` + `loopPolicy` | Recurrence: how many iterations, when to stop, what proves success |
| `trigger` | When execution occurs (Phase 4: scheduling) |
| `persistentEvidence` | What previous iterations contribute (Phase 4) |

A goal loop at `depth: 'balanced'` is valid. Each iteration performs a balanced
research pass. The loop determines when the goal is met.

A goal loop at `depth: 'exhaustive'` is also valid. Each iteration is more
rigorous. The same loop termination logic applies.

Depth is chosen based on how thorough each iteration should be.
Goal bounds are chosen based on how many iterations are acceptable.
These are independent user choices.

**Rule:** `goalLoopEligible: true` in the ArtifactContract is necessary and
sufficient for a goal loop to be available, provided the NormalizedMission
includes a `ValidatedGoalSpec`. Depth level is not a prerequisite.

## 7.4 Recipe Incompatibility Table (Semantic Invalidity — Hard Reject)

| Outcome | Incompatible override | Reason |
|---|---|---|
| `prioritize` | `debate`, `council`, `parallel-critique` | Ranking has no meaningful competing positions |
| `casestudy` | `debate`, `council` | Narrative coherence requires single authorship |
| `plan` | `debate`, `council` | Decomposition must be internally consistent |
| `decide` | `council`, `structured-delivery` | Debate is the only recipe that preserves genuine opposing positions |
| any | `goal-based-research-loop` + no `goal` in mission | Loop requires explicit goal spec |

## 7.5 Recipe Constraints Enforced by the Router

| Constraint | Behavior on violation |
|---|---|
| `debate` requires exactly 2 opposing instances of one capability | RouterError: DEBATE_REQUIRES_OPPOSING_INSTANCES |
| `council` requires ≥ 2 independent assessors | RouterError: COUNCIL_REQUIRES_MINIMUM_ASSESSORS |
| `goal-based-research-loop` requires a ValidatedGoalSpec | RouterError: LOOP_REQUIRES_GOAL_SPEC |
| All `GoalBounds` fields must be present | RouterError: LOOP_BOUNDS_INCOMPLETE (should have been caught by Normalizer) |
| `loop.maxIterations` > 5 | Normalize to 5, record in appliedNormalizations |

---

# PART 8 — DEPTH POLICY

## 8.1 Depth Is a Policy Bundle

Depth controls per-iteration rigor. It is not a token budget, an agent count,
or a loop count. The same depth policy applies whether a mission runs once or
loops five times.

## 8.2 DepthPolicy Schema

```typescript
interface DepthPolicy {
  level: DepthLevel;

  // Research rigor
  researchBreadth: 'minimal' | 'standard' | 'extended' | 'maximum';
  maxSubAgentWorkers: number;       // per delegation group; 0 = no delegation

  // Evaluation rigor
  evaluationPassCount: number;      // how many times a step output is evaluated
  evaluationThreshold: number;      // minimum weighted score to advance (0–100)
  maxQualityRevisions: number;      // max revisions on evaluation failure

  // Consistency checking
  // Note: crossArtifactCoherence is a product requirement (§4.5).
  // This field controls how rigorously it is enforced.
  dedicatedCoherenceCheckEnabled: boolean;

  // Evidence requirements
  evidenceRequirement: EvidenceRequirementLevel;
  minimumEvidenceSources?: number;

  // Perspectives
  maxIndependentPerspectives: number;

  // Goal loop
  goalLoopPermitted: boolean;         // any depth can loop — this is ALWAYS true
  maxLoopIterations: number;          // maximum if a loop is used at this depth
                                      // 0 = no explicit limit from depth (bounds in GoalSpec)

  // Artifact richness
  artifactDepthMultiplier: number;    // guides length framing (0.7–1.5)
}

type EvidenceRequirementLevel =
  | 'assertions-permitted'            // quick: claims need no sources
  | 'key-claims-sourced'              // balanced: important claims need sources
  | 'all-claims-sourced'              // deep: every claim needs a source
  | 'all-claims-sourced-coverage-checked'; // exhaustive: coverage is explicitly evaluated
```

## 8.3 Policy Values by Depth Level

| Policy field | quick | balanced | deep | exhaustive |
|---|---|---|---|---|
| `researchBreadth` | minimal | standard | extended | maximum |
| `maxSubAgentWorkers` | 0 | 0 | 4 | 5 |
| `evaluationPassCount` | 0 | 1 | 1 | 2 |
| `evaluationThreshold` | — | 70 | 78 | 85 |
| `maxQualityRevisions` | 0 | 1 | 2 | 2 |
| `dedicatedCoherenceCheckEnabled` | false | false | false | true |
| `evidenceRequirement` | assertions-permitted | key-claims-sourced | all-claims-sourced | all-claims-sourced-coverage-checked |
| `minimumEvidenceSources` | — | — | 2 | 3 |
| `maxIndependentPerspectives` | 1 | 1 | 2 | 3 |
| `goalLoopPermitted` | **true** | **true** | **true** | **true** |
| `maxLoopIterations` | (governed by GoalBounds) | (governed by GoalBounds) | (governed by GoalBounds) | (governed by GoalBounds) |
| `artifactDepthMultiplier` | 0.7 | 1.0 | 1.3 | 1.5 |

**`goalLoopPermitted` is always true.** Loop termination is governed entirely by
`GoalBounds` in the NormalizedMission. Depth level does not gate loop eligibility.

---

# PART 9 — DELEGATION POLICY

## 9.1 Philosophy

Delegation enables a capability to decompose a task into bounded parallel
sub-tasks performed by temporary workers. It is used when:
1. The task has independent sub-components that do not contaminate each other
2. Parallel execution materially improves coverage or speed
3. The decomposition is well-defined (workers know their scope)

Delegation must not be used merely to add apparent thoroughness. A `prioritize`
mission does not benefit from workers — consistent scoring requires a single scorer.

## 9.2 V1 Delegation Rules

```typescript
interface DelegationPolicy {
  allowed: boolean;
  maxWorkers: number;              // per delegation group
  maxDepth: 1;                     // V1 safety boundary — see §9.3
  eligibleCapabilities: CapabilityId[];
  workerBudget: WorkerBudget;
  failureBehavior: 'proceed-with-successful' | 'fail-if-below-minimum';
  minimumSuccessfulWorkers: number;
  outputSchema: 'SubAgentResult';  // Document 1 §11.4
  gapReportingRequired: true;      // always — gaps from failed workers must be stated
}

interface WorkerBudget {
  maxTokensPerWorker: number;
  maxCostUsdPerWorker: number;
  maxDurationMsPerWorker: number;
}
```

**When delegation is allowed (V1):**

```
depth 'quick':    allowed: false, maxWorkers: 0
depth 'balanced': allowed: false, maxWorkers: 0
depth 'deep':     allowed: true  IF outcome IN ['research', 'investigate', 'council']
depth 'exhaustive': allowed: true IF outcome IN ['research', 'investigate', 'council']
```

**Worker counts:**

| Outcome + depth | maxWorkers |
|---|---|
| `research` + `deep` | 4 |
| `research` + `exhaustive` | 5 |
| `investigate` + `deep` | 3 |
| `investigate` + `exhaustive` | 4 |
| `council` + `exhaustive` | 2 per assessor (sub-domain analysis) |

## 9.3 V1 Safety Boundary — Delegation Depth = 1

Workers may not spawn workers. This is a V1 safety boundary, not a permanent
prohibition.

The condition for enabling recursive delegation in a future version:
1. Provable termination — a formal bound on total delegation depth exists
2. Complete observability — every node in the delegation tree emits events
3. Per-branch budgets — each node enforces its own cost and time ceiling
4. Defined failure handling at every depth — partial failure at depth N has
   a clear contract for propagation upward

Until all four are demonstrated: `maxDepth: 1`.

---

# PART 10 — EVALUATION POLICY

## 10.1 Evaluation Is Mission-Specific

There is no universal quality score. The Router generates a different evaluation
policy for every outcome.

## 10.2 Evaluation in the Execution Graph — One Graph

Version 1.0 introduced a separate `evaluationSteps: EvaluationStep[]` array
in the ExecutionPlan alongside `steps: ExecutionStep[]`. This created two
competing execution graphs — a problem for Document 3.

**Correction in Version 1.1:** Evaluation steps are a `stepType` within the
single unified `ExecutionStep[]` array. The Compiler produces one graph.
The Orchestration Engine executes one graph.

```typescript
type ExecutionStepType =
  | 'generate'    // produce an artifact
  | 'evaluate'    // evaluate a generated artifact
  | 'synthesize'  // synthesize multiple inputs into one output
  | 'delegate'    // create and dispatch sub-agent workers
  | 'judge'       // judge between two opposing outputs (debate)
  | 'aggregate';  // aggregate independent assessments (council)
```

A step with `stepType: 'evaluate'` IS an EvaluationStep. It lives in the
same `steps` array. The Orchestration Engine processes it like any other step.

## 10.3 EvaluationPolicy Schema

```typescript
interface EvaluationPolicy {
  outcomeId: OutcomeId;
  dimensions: EvaluationDimension[];
  passThreshold: number;            // 0–100 weighted score
  evaluatorCapability: CapabilityId | 'orchestration-engine';
  failureBehavior: EvaluationFailureBehavior;
  // revisionPolicy is resolved from DepthPolicy at plan compilation time
}

interface EvaluationDimension {
  dimension: QualityDimension;
  weight: number;        // weights must sum to 1.0
  required: boolean;     // true = failure on this dimension fails the whole evaluation
  minimumScore?: number; // optional per-dimension floor, independent of passThreshold
}

type EvaluationFailureBehavior =
  | 'revise-then-advance'  // revise up to maxRevisions, then advance with warning
  | 'revise-then-fail'     // revise up to maxRevisions, then fail the step
  | 'advance-with-warning' // no revision; advance and flag
```

## 10.4 Quality Revision Execution Model

**How revision works inside an immutable plan.**

A quality revision is a bounded retry transition, not a new plan step. The plan
itself never mutates. The revision model is:

**At plan-compile time (immutable):**
```
step G1 — generate (stepType: 'generate', stepId: 'build-PS-prd-step-7')
step E1 — evaluate (stepType: 'evaluate', evaluatesStepId: 'build-PS-prd-step-7',
                    onEvaluationFail: 'revise', revisesStepId: 'build-PS-prd-step-7')
```

`revisesStepId` points back to the generation step. The plan encodes the
intent — "if evaluation fails, re-run this generation step" — but contains
no mutable revision counters.

**At runtime (in ExecutionState):**
The engine maintains `revisionAttemptsByStepId` in `ExecutionState`:
```typescript
revisionAttemptsByStepId: Record<string, number>
// e.g. { 'build-PS-prd-step-7': 1 }
```

The engine enforces the revision budget using `DepthPolicy.maxQualityRevisions`
read from the plan's evaluation policy.

**The revision execution loop (deterministic, engine-governed):**
```
1. Generation step runs → produces artifact output
2. Evaluation step runs → scores output against EvaluationPolicy
3. IF passed: advance to next step in graph
4. IF failed:
   a. Read revisionAttemptsByStepId[generationStepId] from ExecutionState
   b. IF attempts < maxQualityRevisions:
        - Increment revisionAttemptsByStepId[generationStepId]
        - Emit 'revision_started' event with gaps from evaluation
        - Re-execute the generation step with gaps as additional context
        - Re-run the evaluation step (goto step 2)
   c. IF attempts >= maxQualityRevisions:
        - exhaustion behavior is derived from `EvaluationPolicy.failureBehavior`
          (compiled into `FailurePlan.QualityFailurePolicy.onRevisionExhausted`):
            revise-then-advance → advance with artifact flagged; continue plan
            revise-then-fail    → fail the step; `FailurePlan.onStepQualityFailure` applies
```

**How revision attempts are tracked:**
- `ExecutionState.revisionAttemptsByStepId[stepId]` holds the current count
- Each revision attempt appends to `evaluations.jsonl` (see §QA-2)
- `ExecutionState.evaluationResultsByStepId[stepId]` holds the **most recent** result

**Critical constraints:**
- Positions in a debate mission (`PS[blue]`, `PS[red]`) are **never revised**.
  Only the judge/synthesis step (`CO[judge]`) may be revised. This is enforced
  at compile time: evaluate steps for position-generating steps have
  `onEvaluationFail: 'advance-with-warning'`, not `'revise'`.
- The generation step itself does not change between revisions — only its
  input framing is augmented with the evaluation gaps. The plan's `taskSpec`
  remains immutable; gaps are appended as runtime context by the Agent Harness.
- A revision is distinct from a technical retry (API failure). Technical
  retries are transparent; the step is re-run identically. Revisions are
  quality-driven; the step is re-run with gap context.

## 10.5 Per-Outcome Evaluation Policies

**`build`** — Completeness and handoff readiness
```
dimensions: completeness(0.35,req), logical-consistency(0.25), handoff-readiness(0.25), technical-feasibility(0.15)
threshold: 70  evaluator: QA  failure: revise-then-advance
```

**`research`** — Evidence quality (recommendation integrity)
```
dimensions: evidence-quality(0.30,req), source-coverage(0.25,req), contradiction-handling(0.20), rationale-clarity(0.25)
threshold: 75  evaluator: QA  failure: revise-then-advance
Critical gate: if source-coverage score < threshold → recommendation = "Investigate Further"
```

**`review`** — Gap quality and coverage
```
dimensions: completeness(0.40,req), rationale-clarity(0.35), evidence-quality(0.25)
threshold: 70  evaluator: CO  failure: revise-then-advance
Minimum gap count: 3 (explicit gate, not a dimension weight)
```

**`decide`** — Argument quality and preserved dissent
```
dimensions: argument-quality(0.30,req), tradeoff-coverage(0.30,req), dissent-preservation(0.25,req), rationale-clarity(0.15)
threshold: 80  evaluator: CO  failure: revise-then-fail
dissent-preservation is required: absence of dissent section always fails.
Positions are never revised — only synthesis may be revised.
```

**`investigate`** — Hypothesis testability
```
dimensions: hypothesis-quality(0.30,req), falsifiability(0.25,req), experiment-quality(0.25,req), evidence-quality(0.20)
threshold: 75  evaluator: QA  failure: revise-then-advance
Minimum hypotheses: 3 (explicit gate)
Each hypothesis: must have both supporting AND contradicting evidence considered
```

**`council`** — Independence and dissent
```
dimensions: source-coverage(0.35,req), dissent-preservation(0.35,req), rationale-clarity(0.30)
threshold: 75  evaluator: CO  failure: revise-then-advance
If mean assessor confidence < 70: low-confidence areas must be named explicitly
```

**`casestudy`** — Factual integrity
```
dimensions: factual-integrity(0.40,req), rationale-clarity(0.35), completeness(0.25)
threshold: 70  evaluator: QA  failure: revise-then-advance
factual-integrity required: fabricated metrics or invented outcomes → always fail
```

**`prioritize`** — Scoring integrity
```
dimensions: scoring-consistency(0.35,req), dependency-correctness(0.35,req), rationale-clarity(0.30)
threshold: 75  evaluator: QA  failure: revise-then-advance
```

**`plan`** — Handoff readiness
```
dimensions: completeness(0.30,req), dependency-correctness(0.35,req), handoff-readiness(0.35,req)
threshold: 80  evaluator: QA  failure: revise-then-fail
High threshold: engineering will act on this output
```

---

# PART 11 — ROUTINGDECISION

## 11.1 What It Is and Why It Exists

The RoutingDecision captures every routing decision made by the Strategy Router,
with full rationale. It is the intermediate object between the Router and the
Compiler.

**Product value:** Mission Control reads the RoutingDecision to answer
"What did IdeaGate plan to do and why?" before execution begins. This is
observable planning.

**Engineering value:** The Router is independently testable against the
RoutingDecision. The Compiler is independently testable against the
RoutingDecision. They share a clean contract.

## 11.2 RoutingDecision Schema

```typescript
interface RoutingDecision {
  // Identity
  decisionId: string;          // UUID
  missionId: string;           // from NormalizedMission
  decidedAt: string;           // ISO 8601
  routerVersion: string;       // "v1.1"

  // Core decisions
  outcome: OutcomeId;
  depth: DepthLevel;
  recipe: OrchestrationRecipeId;
  stageGateCoordination: boolean; // true for Build; requires CO via Layer 4

  // Artifact contract
  artifactContract: ArtifactContract;

  // Capability decisions (layers 1–4)
  layer1Capabilities: CapabilityId[];  // from artifact domains
  layer2Capabilities: CapabilityId[];  // from context signals
  layer3Capabilities: CapabilityId[];  // from depth/evaluation requirements
  layer4Capabilities: CapabilityId[];  // from orchestration requirements (CO)
  selectedCapabilities: CapabilityId[]; // union of layers 1–4
  capabilityInstances: CapabilityInstance[];
  capabilityRationale: CapabilityRationale[];

  // Delegation (layer 5)
  delegationPolicy: DelegationPolicy;

  // Depth policy
  depthPolicy: DepthPolicy;

  // Evaluation policy
  evaluationPolicy: EvaluationPolicy;

  // Loop policy (present only when recipe includes a goal loop)
  loopPolicy?: LoopPolicy;

  // Budget estimation
  estimatedBudget: EstimatedBudget;

  // Context plan (how context is scoped per capability)
  contextPlan: ContextPlan;

  // Tool assignments (which tools each capability instance may use)
  toolAssignments: ToolAssignment[];

  // Failure plan
  failurePlan: FailurePlan;

  // Plain-language routing summary (for Mission Control / Office)
  routingSummary: string;
}
```

## 11.3 CapabilityInstance

```typescript
interface CapabilityInstance {
  instanceId: string;
  capabilityId: CapabilityId;
  instanceRole?: string;       // 'blue' | 'red' | 'judge' | assessor name
  framing?: string;            // system-prompt framing for this instance
  isolatedFrom?: string[];     // other instanceIds this instance must not receive output from
}
```

## 11.4 Context Plan

The Router decides which context items reach which capabilities. Dumping all
context into every capability degrades output and wastes budget.

```typescript
interface ContextPlan {
  globalContextIds: string[];         // context item IDs sent to all capabilities
  capabilityContextIds: {
    [instanceId: string]: string[];   // additional item IDs for specific instances
  };
  workspaceMemory: {
    include: boolean;
    scope: 'relevant-artifacts' | 'full-workspace';
  };
  estimatedTotalTokens: number;
}
```

**Default scoping rules (without user-supplied `scopeHint`):**

| Capability | Receives by default |
|---|---|
| RE | Research docs, analytics, competitor info, URLs |
| PS | Strategy docs, PRDs, metrics, business context |
| UX | Design specs, user research, screenshots, flows |
| AR | Technical specs, architecture docs, repository structure |
| QA | Requirements, acceptance criteria, prior test plans |
| CO | Summaries of above — not full raw content |

## 11.5 Tool Assignments

```typescript
interface ToolAssignment {
  instanceId: string;
  allowedTools: ToolId[];
  reason: string;
}

type ToolId =
  | 'artifact-write'    // produce artifacts (every capability, always)
  | 'artifact-read'     // read other artifacts (CO, QA at exhaustive depth)
  | 'file-read'         // read scoped context items
  | 'url-fetch'         // fetch URLs (RE when URLs in context — runtime, not normalization)
  | 'web-search'        // search the web (RE when evidenceRequired)
  | 'github-read'       // read a GitHub repository (AR when githubRepo in context)
  | 'workspace-read';   // read workspace artifacts and memory
```

## 11.6 Failure Plan

```typescript
interface FailurePlan {
  onTechnicalRetry: RetryPolicy;
  onStepQualityFailure: QualityFailurePolicy;
  onDelegationBranchFailure: BranchFailurePolicy;
  onBudgetExhausted: BudgetExhaustedPolicy;
  onCancellation: CancellationPolicy;
}

interface RetryPolicy {
  maxTechnicalRetries: number;  // V1: always 2
  useFallbackModel: boolean;    // V1: always true
}

interface QualityFailurePolicy {
  maxRevisions: number;          // from DepthPolicy.maxQualityRevisions
  revisionsRequireGaps: boolean; // evaluation must return actionable gaps before revision
  // Derived from EvaluationPolicy.failureBehavior at compile time:
  //   failureBehavior: 'revise-then-advance' → onRevisionExhausted: 'advance-with-warning'
  //   failureBehavior: 'revise-then-fail'    → onRevisionExhausted: 'fail-step'
  onRevisionExhausted: 'advance-with-warning' | 'fail-step';
}

interface BranchFailurePolicy {
  onPartialFailure: 'proceed-with-successful' | 'fail-delegation';
  minimumSuccessfulBranches: number;
  gapsMustBeReported: true;
}

interface BudgetExhaustedPolicy {
  onDurationExceeded: 'complete-current-then-stop';
  onCostExceeded: 'stop-immediately';
  onIterationsExceeded: 'return-best-and-state-uncertainty';
}

interface CancellationPolicy {
  artifactPreservation: 'preserve-all-completed';
  lockFileClearing: 'always';     // critical: prevents false isRunning state
}
```

---

# PART 12 — EXECUTIONPLAN (IMMUTABLE CONTRACT)

## 12.1 The Immutability Rule

**The ExecutionPlan is written once by the Compiler and never modified.**

The Orchestration Engine reads the plan. It writes all runtime state to
`state.json` and `events.jsonl`. It never writes to `plan.json`.

This means `plan.json` contains only fields that were known at compile time.
It contains no runtime state.

## 12.2 Top-Level Schema (Immutable Fields Only)

```typescript
interface ExecutionPlan {
  // Identity
  planId: string;
  runId: string;
  missionId: string;
  clientRunId?: string;
  compiledAt: string;           // ISO 8601 — when the Compiler wrote this
  planVersion: string;          // "v1.1"
  routingDecisionId: string;    // reference to routing-decision.json

  // Mission intent (captured at compile time for posterity)
  outcome: OutcomeId;
  objective: string;            // plain-language statement
  depth: DepthLevel;
  recipe: OrchestrationRecipeId;

  // Execution graph (immutable — what will be done)
  steps: ExecutionStep[];       // unified graph: generate + evaluate + synthesize + delegate + judge

  // Capabilities (immutable — who will do it)
  capabilities: CapabilityId[];
  capabilityInstances: CapabilityInstance[];

  // Delegation (immutable — how workers may be spawned)
  delegationPolicy: DelegationPolicy;

  // Evaluation (immutable — what quality means for this mission)
  evaluationPolicy: EvaluationPolicy;

  // Artifact contract (immutable — what will be produced)
  artifactContract: ArtifactContract;
  runArtifactDependencies: RunArtifactDependency[]; // within-run dependencies only

  // Context (immutable — what information reaches each capability)
  contextPlan: ContextPlan;

  // Loop (immutable — the loop policy if this plan includes one)
  loopPolicy?: LoopPolicy;

  // Budgets (immutable — the hard ceilings that govern execution)
  hardBudget: HardBudget;
  estimatedBudget: EstimatedBudget;

  // Failure handling (immutable — what to do when things go wrong)
  failurePlan: FailurePlan;

  // Observability (immutable — what the engine must emit)
  observabilityContract: ObservabilityContract;

  // Rationale (immutable — why these decisions were made)
  capabilityRationale: CapabilityRationale[];
  routingSummary: string;

  // V2 compatibility
  internalStageMappings?: InternalStageMapping[];
}
```

Note: `status`, `completedStepIds`, `failedStepIds` are **absent**. They belong
in `ExecutionState` (Part 14).

## 12.3 ExecutionStep (Unified Graph)

```typescript
interface ExecutionStep {
  stepId: string;
  stepType: ExecutionStepType;
  order: number;                       // steps with the same order run concurrently

  // Which capability instance performs this step
  capabilityInstanceId: string;

  // Task definition
  taskSpec?: TaskSpec;                 // present for generate, evaluate, synthesize, judge

  // Delegation specification (present only for stepType='delegate')
  delegationSpec?: DelegationSpec;

  // Dependency graph
  dependsOn: string[];                 // stepIds that must complete first
  receivesOutputFrom: string[];        // stepIds whose output feeds this step's context
  mustNotReceiveOutputFrom: string[];  // isolation: for council, critique, debate

  // Tools
  allowedTools: ToolId[];

  // Context
  contextRefs: string[];

  // For evaluate steps: what is being evaluated and what to do with the result
  evaluatesStepId?: string;
  onEvaluationPass?: 'advance' | 'next-loop-iteration';
  onEvaluationFail?: 'revise' | 'advance-with-warning' | 'fail';
  revisesStepId?: string;              // if onEvaluationFail='revise', which step reruns

  // Artifact outputs (the artifact IDs this step is responsible for)
  outputArtifactIds: string[];

  // V2 compatibility
  internalStageIndex?: number;
}

interface TaskSpec {
  objective: string;
  framing: string;                     // capability-specific system-prompt addition
  outputSchema: OutputSchemaId;
  qualityDimensions: QualityDimension[];
  evidenceRequirementLevel: EvidenceRequirementLevel;
}
```

## 12.5 Execution Order Authority — `order` vs `dependsOn` vs `receivesOutputFrom`

Three fields govern step sequencing. They have different authorities and must
not be confused.

**`dependsOn: string[]` — correctness authority**
A step may not begin execution until every stepId listed in `dependsOn` has
reached `complete` status in `ExecutionState`. This is a hard execution gate.
The engine enforces it unconditionally.

**`order: number` — concurrency grouping hint**
Steps with the same `order` value are eligible to execute concurrently, subject
to `hardBudget.maxConcurrentSteps`. This is a performance hint that groups
independent work. It does not create a dependency.

**`receivesOutputFrom: string[]` — context scoping**
Identifies which completed steps' output this step should receive as context.
This is an Agent Harness concern — it determines what the capability sees, not
when execution may start. A step may receive context from a step it does not
strictly `dependsOn` (e.g., a synthesis step may receive context from multiple
prior steps, not all of which are in its `dependsOn`).

**Relationship rules (enforced by the Compiler):**

| Rule | Compiler validation |
|---|---|
| If step A is in step B's `dependsOn`, A and B must not share the same `order` value | CompilerError: `CONCURRENT_DEPENDENCY_CONFLICT` |
| `receivesOutputFrom` may reference any stepId that will complete before this step's `order` is reached | Validated by topological sort |
| `mustNotReceiveOutputFrom` takes precedence over `receivesOutputFrom` for the same stepId | Compiler rejects a step where a stepId appears in both |
| A step's `dependsOn` must be a subset of steps with lower `order` values | CompilerError: `ORDER_DEPENDENCY_CONTRADICTION` |

**Practical interpretation for Document 3:**
> `dependsOn` controls *when* a step starts.
> `order` groups steps that *can* start together.
> `receivesOutputFrom` controls *what context* a step receives.
> The engine uses `dependsOn` for scheduling and `receivesOutputFrom` for
> context assembly. It never infers one from the other.

```typescript

interface DelegationSpec {
  ownerCapabilityId: CapabilityId;
  workers: WorkerSpec[];
  aggregationStrategy: 'merge' | 'synthesize' | 'rank';
  minimumSuccessfulWorkers: number;
}

interface WorkerSpec {
  workerId: string;
  objective: string;
  allowedTools: ToolId[];
  outputSchema: 'SubAgentResult';
}
```

## 12.4 Run-Specific vs Persistent Artifact Dependencies

**This is the ownership clarification from Version 1.1.**

**Run-specific artifact dependencies** (`runArtifactDependencies` in the plan):
Which artifacts produced in this run depend on which other artifacts produced
in this run. This governs within-run handoffs (what context downstream steps
receive) and within-run stale detection (if an early artifact is revised,
which later steps need to be flagged).

**Persistent artifact dependencies** in the workspace artifact model: the
long-lived relationships between artifacts across runs and improvement cycles
(e.g., the PRD depends on the Problem Definition; improving the Problem
Definition stales the PRD). This is owned by the Artifact/Workspace model
in Document 4/5 — **not** by any single run's plan.

`plan.json` must not become the sole source of truth for Studio's artifact
dependency graph. The plan records run-time dependencies; the workspace model
records product-level dependencies.

```typescript
interface RunArtifactDependency {
  artifactId: string;            // downstream artifact produced in this run
  dependsOnArtifactId: string;   // upstream artifact it receives as context
  dependencyType: 'informs' | 'requires';
  withStepId: string;            // the step that established this dependency
}
```

## 12.5 Hard Budget

```typescript
interface HardBudget {
  maxTotalSteps: number;
  maxConcurrentSteps: number;
  maxDurationMs: number;      // wall-clock ceiling — always set; compared to consumedDurationMs
  costCeilingUsd: number;     // hard cost ceiling — always set; compared to consumedActualCostUsd
                              // Named 'ceiling', not 'estimated', because it is a deterministic stop,
                              // not a forecast. It is set conservatively above the estimated cost.
  onDurationExhausted: 'complete-current-then-stop';
  onCostExhausted: 'stop-immediately';
}

// The three distinct cost concepts in the system:
//
// 1. EstimatedBudget.estimatedCostUsd   — pre-run forecast; inaccurate by nature;
//                                          used for user communication only.
// 2. HardBudget.costCeilingUsd          — deterministic enforcement ceiling;
//                                          set at plan compile time; always > estimatedCostUsd.
// 3. ExecutionState.consumedActualCostUsd — real cost as execution proceeds;
//                                          reported by the model API per invocation;
//                                          compared against costCeilingUsd at each step.
//
// The engine checks: if consumedActualCostUsd >= costCeilingUsd → stop-immediately.
```

## 12.6 ObservabilityContract

```typescript
interface ObservabilityContract {
  emitPlanLoadedEvent: true;      // engine must emit before any step begins
  emitStepStartEvent: true;
  emitStepCompleteEvent: true;
  emitStepRetryEvent: true;
  emitDelegationEvents: boolean;  // true when delegation is in the plan
  emitLoopEvents: boolean;        // true when loopPolicy is in the plan
  emitEvaluationEvents: boolean;  // true when evaluation steps are in the plan
  activityTextRequired: true;     // every event must carry PM-native activity text
  // Technical topology (stage numbers, agent IDs as controls) must never
  // appear in activity text. PM-native language only.
}
```

## 12.7 V2 Compatibility Mapping

```typescript
interface InternalStageMapping {
  stepId: string;
  internalStageIndex: number;     // 0–14 for Build
  stageLabel: string;             // from STAGE_LABELS
}
// Build is the primary outcome where internalStageIndex maps to V2's 15-stage lifecycle.
// This field allows the Orchestration Engine to invoke the existing coordinator logic
// while operating within the new plan contract.
// V2's internal logic governs stage execution; V3's plan contract governs everything else.
```

---

# PART 13 — LOOPPOLICY

## 13.1 Schema

```typescript
interface LoopPolicy {
  // Type of loop
  loopType: 'goal-based' | 'quality-improvement';  // future types possible

  // Termination conditions (all must be satisfied to continue; any triggers stop)
  maxIterations: number;               // hard cap, already normalized to ≤ 5
  maxTotalDurationMs: number;          // wall clock across all iterations
  maxTotalCostUsd: number;             // budget across all iterations
  minimumImprovementPerIteration: number; // 0–100; stop if improvement < this
  
  // Goal criteria (for goal-based loops)
  goalCriteria?: GoalCriterion[];      // from ValidatedGoalSpec

  // Persistent state (Phase 4)
  persistentEvidenceEnabled: boolean;  // requires Phase 4 infrastructure
  evidenceStoreId?: string;

  // Termination behavior
  onGoalMet: 'terminate-and-emit';
  onBoundsExhausted: 'return-best-with-uncertainty' | 'fail';
  onMinImprovementNotMet: 'terminate-early';
  onCancellation: 'preserve-current-state';

  // Between-iteration context
  priorIterationSummaryIncluded: boolean;  // feed prior iteration summary as context
}
```

## 13.2 Loop Termination — Deterministic

Loop continuation/termination is decided by deterministic code evaluating the
`LoopPolicy` and current `ExecutionState`. An LLM does not decide whether to
continue a loop. The loop termination contract is:

```
After each iteration completes, evaluate in this EXACT ORDER.
First matching rule terminates. Do not evaluate further rules after a match.

1. IF cancellation was requested
     → terminate; reason: 'cancelled'
     (cancellation overrides goal; a cancelled mission is cancelled)

2. EVALUATE goal criteria against current iteration's output
     → goalMet: boolean

3. IF goalMet
     → terminate with success; reason: 'goal-met'
     → goalMet TAKES PRECEDENCE over all remaining bound checks.
     Rationale: the current iteration satisfied the goal before bounds
     were exhausted. Reporting success is correct even if maxIterations
     was simultaneously reached. The useful answer is "goal met in N
     iterations," not "exhausted after N iterations."

4. IF currentIteration >= maxIterations
     → terminate; reason: 'max-iterations'

5. IF consumedActualCostUsd >= maxTotalCostUsd
     → terminate; reason: 'max-cost'

6. IF elapsedMs >= maxTotalDurationMs
     → terminate; reason: 'max-duration'

7. IF improvement(current, previous) < minimumImprovementPerIteration
     → terminate early; reason: 'min-improvement-not-met'

8. Continue to next iteration.
```

**On termination without goal met (rules 1, 4–7):** return the best result
produced across all iterations. State the termination reason and explicit
uncertainty in the output. Emit `loop_terminated_without_goal` event.

**On goal met (rule 3):** return the result from the iteration that met the
goal. Emit `loop_terminated_goal_met` event. Write `loopState.goalMet: true`
and `loopState.terminationReason: 'goal-met'` to `ExecutionState`.

---

# PART 14 — EXECUTIONSTATE (MUTABLE RUNTIME RECORD)

## 14.1 Why This Exists

The ExecutionPlan is immutable. All runtime state must live somewhere. That
somewhere is `ExecutionState`, written to `workspace/{projectId}/runs/{runId}/state.json`.

The Orchestration Engine writes to this file. Mission Control reads it to
answer "what is currently happening?"

## 14.2 ExecutionState Schema

```typescript
interface ExecutionState {
  // Identity
  runId: string;
  planId: string;              // reference to the immutable plan

  // High-level status
  status: RunStatus;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  failedAt?: string;
  pausedAt?: string;

  // Step-level tracking
  currentStepId?: string;
  completedStepIds: string[];
  skippedStepIds: string[];
  failedStepIds: string[];
  retryCountByStepId: Record<string, number>;      // technical API retries per step
  revisionAttemptsByStepId: Record<string, number>; // quality revision count per generation step

  // Evaluation tracking
  evaluationResultsByStepId: Record<string, EvaluationSummary>;

  // Delegation tracking
  activeWorkerIds: string[];
  completedWorkerIds: string[];
  failedWorkerIds: string[];

  // Loop tracking (present when plan has a loopPolicy)
  loopState?: {
    currentIteration: number;
    lastIterationScore?: number;
    goalMet: boolean;
    terminationReason?: LoopTerminationReason;
  };

  // Budget consumption
  // Note on cost terminology:
  //   plan.estimatedBudget.estimatedCostUsd = pre-run estimate (may be inaccurate)
  //   plan.hardBudget.costCeilingUsd        = hard stop ceiling (deterministic)
  //   consumedActualCostUsd (below)         = real cost as reported by the model API
  consumedDurationMs: number;
  consumedActualCostUsd: number;   // actual token cost at runtime, not an estimate
  consumedSteps: number;

  // Failure information
  lastFailureReason?: string;
  lastFailureCode?: string;

  // Cancellation
  cancellationRequestedAt?: string;
  cancellationReason?: string;
}

type RunStatus =
  | 'pending'      // plan compiled, not yet started
  | 'running'      // execution in progress
  | 'paused'       // between loop iterations
  | 'complete'     // all required steps succeeded
  | 'failed'       // a required step failed beyond recovery
  | 'cancelled'    // user or system cancellation
  | 'partial';     // completed some steps, stopped due to budget/failure

type LoopTerminationReason =
  | 'goal-met'
  | 'max-iterations'
  | 'max-duration'
  | 'max-cost'
  | 'min-improvement-not-met'
  | 'cancelled';
```

---

# PART 15 — EXECUTIONPLAN COMPILER

## 15.1 Responsibility

The Compiler takes a `RoutingDecision` and assembles it into a typed, validated,
persisted `ExecutionPlan`. It makes no routing decisions of its own.

## 15.2 Compilation Sequence

```
1.  Validate RoutingDecision is complete (all required fields present)
2.  Generate planId, compiledAt
3.  Build CapabilityInstance list from capabilityInstances in RoutingDecision
4.  Build ExecutionStep list from recipe + capability instances + artifact contract:
    a. For each artifact: one 'generate' step assigned to the domain capability
    b. For each evaluation pass in DepthPolicy: one 'evaluate' step following it
    c. For recipe-required synthesis/judge/aggregate steps: add those step types
    d. For delegation-eligible capabilities: add 'delegate' step type
5.  Assign stepIds (stable, deterministic — not random UUIDs; derived from step semantics)
6.  Build dependency graph: assign dependsOn, receivesOutputFrom, mustNotReceiveOutputFrom
7.  Assign allowedTools per step from RoutingDecision.toolAssignments
8.  Assign contextRefs per step from RoutingDecision.contextPlan
9.  Set evaluation step links: evaluatesStepId, onPass, onEvaluationFail, revisesStepId
10. Build RunArtifactDependency list from step outputs
11. Set HardBudget from RoutingDecision.estimatedBudget + system hard limits
12. Copy FailurePlan from RoutingDecision
13. Set ObservabilityContract
14. Add InternalStageMappings for outcomes that map to V2 engine stages
15. VALIDATE:
    a. No circular dependencies in step graph
    b. No isolation constraint violations (mustNotReceiveOutputFrom)
    c. No delegation depth > 1
    d. Loop policy complete if present
    e. All hard budget ceilings present
    f. All evaluation steps have a revisesStepId when onEvaluationFail='revise'
    g. All artifact IDs are unique within this plan
    h. Every artifact in ArtifactContract.artifacts has at least one producing step
16. Persist to workspace/{projectId}/runs/{runId}/plan.json (write-once)
17. Return ExecutionPlan
```

## 15.3 Compiler Errors (All Fail Closed)

```typescript
type CompilerError =
  | 'ROUTING_DECISION_INCOMPLETE'
  | 'CIRCULAR_STEP_DEPENDENCY'
  | 'ISOLATION_CONSTRAINT_VIOLATED'
  | 'DELEGATION_DEPTH_EXCEEDED'
  | 'LOOP_BOUNDS_MISSING'
  | 'BUDGET_CEILING_MISSING'
  | 'ARTIFACT_ID_COLLISION'
  | 'EVALUATION_REVISION_TARGET_MISSING'
  | 'PRODUCING_STEP_MISSING_FOR_ARTIFACT'
  | 'PERSISTENCE_FAILURE';
```

On any error: no plan file is written. The error is returned to the caller with
a specific code. No fallback plan is invented.

## 15.4 Step ID Stability

Step IDs are derived deterministically from their semantic content, not from
random UUIDs:

```
{outcomeId}-{capabilityId}-{instanceRole?}-{artifactId or purpose}-{order}
```

Example: `build-RE-discovery-step-2`, `research-CO-synthesis-step-6`

This makes plans for the same outcome structurally comparable across runs and
makes event logs correlated with specific plan steps.

---

# PART 16 — FAILURE HANDLING

## 16.1 The Taxonomy

The system handles eight distinct failure categories. Each has a defined source,
code prefix, behavior, and state impact.

| Category | Source | Code prefix | User-visible? | Retry? |
|---|---|---|---|---|
| Invalid request | Normalizer | NORM_ | Yes | User must fix |
| Configuration invalid | Router/Compiler | ROUTE_ / COMPILE_ | Yes | User must fix |
| Technical API failure | Agent Harness | TECH_ | No (logged only) | Auto (max 2) |
| Quality failure | Evaluation step | EVAL_ | No | Auto (max revisions) |
| Dependency failure | Compiler/Engine | DEP_ | Yes | No |
| Budget exhaustion | Engine | BUDGET_ | Yes | No |
| Cancellation | User/system | CANCEL_ | Yes | No |
| Persistence failure | Engine | PERSIST_ | Yes (engineer alert) | No |

## 16.2 Semantic Invalidity vs Safety Normalization (Formal Rule)

**Semantic Invalidity:** the configuration has no valid execution interpretation.
→ The system rejects the request. No plan is produced. No fallback is invented.

**Safety Normalization:** the configuration has a valid interpretation but a
specific value violates a system safety limit.
→ The system applies the normalized value, records the original value and the
normalization rule in `appliedNormalizations`, and communicates the normalization
to the user before execution begins.

**No silent degradation.** Any normalization that changes meaning must be
disclosed. A user who set `maxIterations: 20` must learn their effective value
is 5 before committing to the run.

## 16.3 Fail Closed — Precise Meaning

"Fail closed" in this architecture means:
1. No execution strategy is invented when the Router cannot derive one
2. No topology fallback is silently substituted
3. No partial plan proceeds to execution if the Compiler finds an inconsistency
4. No step proceeds without a valid tool allowlist
5. No loop continues without explicit termination conditions
6. No sub-agent spawns more sub-agents

What "fail closed" does NOT mean: that all errors terminate the entire run. A
worker failure within a delegation group does not fail the run — it triggers the
`BranchFailurePolicy` (proceed with successful workers, report gap).

---

# PART 17 — PERSISTENCE AND OBSERVABILITY

## 17.1 The Observability Chain

```
NormalizedMission → workspace/{projectId}/runs/{runId}/normalized-mission.json
RoutingDecision   → workspace/{projectId}/runs/{runId}/routing-decision.json
ExecutionPlan     → workspace/{projectId}/runs/{runId}/plan.json         (immutable)
ExecutionState    → workspace/{projectId}/runs/{runId}/state.json        (mutable)
Events            → workspace/{projectId}/runs/{runId}/events.jsonl      (append-only)
Evaluations       → workspace/{projectId}/runs/{runId}/evaluations.jsonl (append-only)
Artifacts         → workspace/{projectId}/artifacts/{artifactId}.md
```

## 17.2 What Each Surface Reads

**Mission Control (before execution):**
- `routing-decision.json` → "What did IdeaGate plan to do and why?"
- `plan.json` → "Which capabilities? Which steps? What is the budget?"

**Mission Control (during execution):**
- `state.json` → "What is running? What has completed? What failed?"
- `events.jsonl` → "What happened in what order?"

**Mission Control (after execution):**
- `evaluations.jsonl` → "Which steps passed/failed quality gates?"
- `artifacts/` → "What was produced?"

**Studio:**
- `artifacts/` → edit and improve
- The Artifact/Workspace model (Document 4/5) → stale propagation, dependency graph

## 17.3 Evaluation Source of Truth — Ownership Rule

Two locations hold evaluation data. Their ownership is non-overlapping.

| Location | Owns | Written by | Semantics |
|---|---|---|---|
| `state.json → evaluationResultsByStepId` | **Current/latest** evaluation result per step | Engine, after each evaluation step | Always reflects the most recent evaluation. Overwritten if a step is revised and re-evaluated. |
| `evaluations.jsonl` | **Complete history** of all evaluation attempts | Engine, append-only | One entry per evaluation execution, including all revision attempts. Never overwritten. |

**When to read which:**

- Mission Control showing "did this step pass?" → read `state.json` (current status)
- Audit or debugging "how many times was this step revised?" → read `evaluations.jsonl`
- Determining revision count → `state.json.revisionAttemptsByStepId[stepId]`

**Entry schema for `evaluations.jsonl`:**
```typescript
interface EvaluationLogEntry {
  entryId: string;
  runId: string;
  stepId: string;           // the evaluation step's stepId
  evaluatesStepId: string;  // the generation step being evaluated
  attemptNumber: number;    // 1 = first evaluation, 2 = after first revision, etc.
  timestamp: string;
  passed: boolean;
  overallScore: number;
  dimensionScores: Record<QualityDimension, number>;
  gaps: string[];           // actionable gaps; empty if passed
  evaluatorCapabilityId: CapabilityId;
}
```

**No two competing sources of truth:** `evaluationResultsByStepId` in
`state.json` is the operational view. `evaluations.jsonl` is the audit trail.
A reader should never need to reconcile one against the other.

## 17.4 Event Emission Contract

Every event emitted to `events.jsonl` must include PM-native `activity` text.

```typescript
interface ExecutionEvent {
  eventId: string;
  runId: string;
  planId: string;
  timestamp: string;
  type: ExecutionEventType;
  stepId?: string;
  capabilityInstanceId?: string;
  workerId?: string;
  activity: string;       // PM-native — no stage numbers, no technical topology
  detail?: string;        // engineer-level detail — NOT shown to users
  loopIteration?: number;
}

type ExecutionEventType =
  | 'plan_loaded'
  | 'step_started'
  | 'step_completed'
  | 'step_retried'
  | 'step_failed'
  | 'delegation_started'
  | 'worker_started'
  | 'worker_completed'
  | 'worker_failed'
  | 'evaluation_started'
  | 'evaluation_passed'
  | 'evaluation_failed'
  | 'revision_started'
  | 'artifact_written'
  | 'loop_iteration_started'
  | 'loop_terminated'
  | 'run_completed'
  | 'run_failed'
  | 'run_cancelled';
```

**Activity text rules:**

| Prohibited | Use instead |
|---|---|
| "Stage 8 started" | "Designing UX flows for the product" |
| "RE agent active" | "Researching market landscape" |
| "QA[eval]-step-13" | "Evaluating evidence coverage" |
| "PS[blue] invoked" | "Building the case for this approach" |
| "parallel dispatch 4" | "Gathering evidence from four sources" |

---

# PART 18 — STUDIO AND ARTIFACT COMPATIBILITY

## 18.1 Improvement Compatibility

The existing improve pipeline (Studio) produces new artifact versions and marks
downstream artifacts stale. The V3 plan architecture must not break this.

The `runArtifactDependencies` in the plan record within-run dependencies.
The Artifact/Workspace model records product-level dependencies (across runs,
across improvement cycles). These are separate ownership domains.

When Studio improves an artifact:
- The stable `artifactId` is unchanged
- The `version` increments
- The Artifact/Workspace model's dependency graph determines which other
  artifacts are stale
- This is not derived from any single run's `plan.json`

The plan's `RunArtifactDependency` list feeds the initial population of the
workspace's artifact dependency graph at the end of a run — it is a source, not
a permanent substitute.

## 18.2 Three-Layer Artifact Compatibility

The `ExecutionStep.outputArtifactIds` reference stable artifact IDs. Future
structured content will attach to these same IDs. The plan schema does not
assume any artifact's content is Markdown forever — `outputType` is present and
accepts `'structured'` and `'visual'` for future use.

## 18.3 Future Studio Flow Compatibility

The future Studio model (SELECT → IMPROVE → STRUCTURE → VISUALIZE → REGENERATE)
operates on artifacts with stable IDs and incrementing versions. The plan's
artifact contract provides the foundation: stable IDs, typed artifacts, and
explicit dependency recording.

---

# PART 19 — WORKED ROUTING EXAMPLES

These examples are architectural tests expressed in human-readable form. They
prove the Router is selective and derive different capability graphs from
different product jobs.

**Format per example:** Intent → Outcome + Depth → Artifact Contract Domains
→ Layer-by-layer capability selection → Instances → Recipe → Evaluation → Key isolation
constraints → Resulting plan shape.

---

## Example 1 — PRIORITIZE

**Intent:** "I have 25 backlog items and capacity for 8. Help me decide what to build."

| Dimension | Value | Derivation |
|---|---|---|
| Outcome | `prioritize` | User selected |
| Depth | `balanced` | User selected |
| Context | None | |
| ArtifactContract domains | strategy, quality | PRIORITIZE_ARTIFACT_CONTRACT |

**Five-layer capability selection:**

| Layer | Capabilities | Reason |
|---|---|---|
| L1 Domains | PS (strategy), QA (quality) | domains in artifact contract |
| L2 Context signals | none | no context uploads, no symptom signals |
| L3 Depth/Eval | none added | balanced + QA already present |
| L4 Orchestration | CO NOT added | structured-delivery (no stage-gate); Orchestration Engine sequences PS→QA without CO |
| L5 Delegation | not allowed | depth: balanced |

**Selected: PS, QA (2 capabilities, 2 instances)**

**Explicitly rejected:**
- RE: no research domain artifact; items are user-provided
- UX: no UX domain artifact; ranking involves no interaction design
- AR: no architecture domain; effort estimates provided
- CO: no multi-perspective synthesis required; engine sequences mechanically

**Recipe:** `structured-delivery` (sequential: PS scores → QA validates)
Sequential because QA's dependency check requires the completed ranking from PS.

**Evaluation:** scoring-consistency (0.35, req), dependency-correctness (0.35, req), rationale-clarity (0.30) | threshold: 70 | evaluator: QA | revisions: 1

**Plan shape:** 2 generate steps + 1 evaluate step = 3 steps total.

---

## Example 2 — RESEARCH

**Intent:** "Is AI inventory management for Indian retail worth building?"

| Dimension | Value |
|---|---|
| Outcome | `research` |
| Depth | `deep` |
| Context | Web search enabled |
| ArtifactContract domains | research (×4 artifacts), strategy (×1 artifact) |

**Five-layer capability selection:**

| Layer | Capabilities | Reason |
|---|---|---|
| L1 Domains | RE (research), PS (strategy) | domains in artifact contract |
| L2 Context signals | none triggered | no symptom, no specific context |
| L3 Depth/Eval | QA added | depth:deep + evidenceRequired:true → QA evaluates coverage |
| L4 Orchestration | CO added | research-first recipe requires synthesis/framing capability |
| L5 Delegation | RE eligible | depth:deep + research in eligible outcomes → 4 workers |

**Selected: RE, PS, QA, CO (4 capabilities, 4 instances)**

**Explicitly rejected:**
- UX: no UX domain; whether to build precedes how it looks
- AR: no architecture domain; technical feasibility not the question here

**Workers (L5, under RE):** market landscape / competitor analysis / user problem evidence / business model. Each is independent — no shared context between workers.

**Recipe:** `research-first` (CO frames → RE orchestrates workers → RE synthesizes → PS interprets → QA evaluates → CO recommends)

**Critical evaluation gate:** if source-coverage < threshold → recommendation MUST be "Investigate Further". Never a confident Build/Don't Build on insufficient evidence.

**Goal loop:** not present in this example (no GoalSpec). If GoalSpec were provided at `depth: 'balanced'`, the Router would select `goal-based-research-loop` — depth does not block loop eligibility.

---

## Example 3 — COUNCIL (Pricing decision)

**Intent:** "Before I take this pricing shift to leadership, stress-test it."

| Dimension | Value |
|---|---|
| Outcome | `council` |
| Depth | `deep` |
| Context | Uploaded: pricing proposal, revenue breakdown |

**Five-layer capability selection:**

| Layer | Capabilities | Reason |
|---|---|---|
| L1 Domains | QA (assessor-report, council-synthesis) | from COUNCIL artifact contract |
| L2 Context signals | PS (pricing, positioning), RE (competitive pricing), AR (metering/billing) | "pricing shift" + "leadership" signals |
| L3 Depth/Eval | none added | council assessors already include RE |
| L4 Orchestration | CO added | council recipe requires aggregation |
| L5 Delegation | PS eligible | depth:deep → PS spawns 2 sub-domain workers |

**Selected: PS, RE, AR, QA, CO (5 capabilities)**

**Explicitly rejected:**
- UX: "pricing shift" does not signal a design question. *The question is about the pricing model, not the pricing page.* This is the explicit selective-invocation example: Council does not automatically invoke all specialists.

**Isolation:** PS, RE, AR each assess independently. `mustNotReceiveOutputFrom` ensures assessors do not see each other's output before completing their own. CO receives all three.

**Workers (L5, under PS at depth:deep):** pricing-lens analysis, positioning-lens analysis.

**Recipe:** `council` (parallel independent assessments → aggregate → CO synthesis)

**Critical gate:** mean assessor confidence < 70 → low-confidence areas must be explicitly named in the synthesis.

---

## Example 4 — DECIDE

**Intent:** "Should we build our recommendation engine or buy one? Engineering wants to build. Finance wants to buy."

| Dimension | Value |
|---|---|
| Outcome | `decide` |
| Depth | `deep` |
| Context | Uploads: engineering estimate, vendor pricing sheet |

**Five-layer capability selection:**

| Layer | Capabilities | Reason |
|---|---|---|
| L1 Domains | PS (strategy domain: all four artifacts) | all DECIDE artifacts are strategy domain |
| L2 Context signals | none triggered by decision framing | neither upload triggers AR (feasibility not in dispute) |
| L3 Depth/Eval | none added | PS already present |
| L4 Orchestration | CO added | red-blue-debate recipe requires a judge |
| L5 Delegation | not allowed | DECIDE not in delegation-eligible outcomes |

**Selected: PS, CO (2 capabilities)**
**Instances: PS[blue], PS[red], CO[judge] (3 instances)**

**Explicitly rejected:**
- RE: evidence provided in uploads; no discovery needed. *Conditional: if intent included "and check what competitors charge," RE would be added via Layer 2.*
- UX: no UX dimension in an infrastructure economics decision.
- AR: technical feasibility is not in dispute. *Conditional: if the disagreement were about system architecture rather than economics, AR would replace PS as the debating capability.*
- QA: the judge performs quality assessment on the synthesis.

**Isolation:** PS[blue] and PS[red] receive identical context. They are in each other's `mustNotReceiveOutputFrom`. CO[judge] receives both.

**Critical evaluation gate:** `dissent-preservation` is a required dimension. A synthesis with no dissent section always fails evaluation regardless of other scores. Positions are never revised — only the synthesis may be revised.

---

## Example 5 — INVESTIGATE

**Intent:** "Activation dropped from 34% to 26%. Don't know why."
**Context:** funnel analytics CSV, user interview notes, onboarding spec

| Dimension | Value |
|---|---|
| Outcome | `investigate` |
| Depth | `deep` |
| ArtifactContract domains | research (evidence, hypothesis), quality (experiments), strategy (recommendation) |

**Five-layer capability selection:**

| Layer | Capabilities | Reason |
|---|---|---|
| L1 Domains | RE (research domain), QA (quality domain), PS (strategy domain) | from INVESTIGATE artifact contract |
| L2 Context signals | UX added (funnel/conversion symptom), PS already selected | activation/funnel → UX and PS signals |
| L3 Depth/Eval | none added | QA already present |
| L4 Orchestration | CO added | research-first recipe requires synthesis |
| L5 Delegation | RE eligible | depth:deep + investigate eligible → 3 workers |

**Selected: RE, QA, PS, UX, CO (5 capabilities)**

**Explicitly rejected:**
- AR: *no reliability/performance/technical signal in the symptom.* **The symptom drives the capability set, not the outcome name.** If the analytics had shown a load-time regression, AR would be added via Layer 2 context signals. This demonstrates conditional capability invocation.

**Workers (L5, under RE):** analytics worker / interview worker / spec-diff worker. Each receives one evidence source.

**Isolation for diagnosis phase:** UX and PS diagnose independently. They must not see each other's diagnosis before completing their own. Both receive RE synthesis. CO receives both.

**Critical evaluation gates:**
- Minimum 3 hypotheses (explicit gate, not a weighted dimension)
- Each hypothesis must have both supporting AND contradicting evidence
- Each hypothesis must have a falsifiable test
- At least one experiment must be executable within one week

---

## Example 6 — CONTINUOUS EXECUTION (Composition, Not an Outcome)

**Intent:** "Track Competitor X for material product or pricing changes."

**This is not a new outcome.** The Router selects `outcome: research` with a
`GoalSpec`. The `goal-based-research-loop` recipe is chosen because:
- `outcome: research` is `goalLoopEligible: true`
- A `ValidatedGoalSpec` is present in the NormalizedMission

**Key architectural demonstration:** `depth: 'balanced'` + `goal loop` is valid.
Depth controls per-iteration rigor. Loop controls recurrence.

| Dimension | Value |
|---|---|
| Outcome | `research` |
| Depth | `balanced` |
| Goal | present — "material changes in Competitor X's product or pricing" |
| Loop | bounded: maxIterations:3, maxDurationMs:600_000, maxCostUsd:0.50 |

**Selected: RE, CO (2 capabilities)**
**Workers (per iteration):** product-change scanner / pricing scanner

**Explicitly rejected:**
- PS: business interpretation is NOT needed for change detection. PS is invoked in a *separate, subsequent mission* if the user wants implications after a material change is detected.
- UX/AR/QA: no design, architecture, or validation dimension in change detection.

**Loop behavior:**
```
[trigger: scheduled — Phase 4 infrastructure]
each iteration:
  RE → 2 workers → gather current evidence
  Compare current evidence against persistent evidence store
  CO evaluates materiality
  If material change → emit output + update store
  If not material → no-op + update store
  Evaluate: goal criteria met?
  If not: gaps → targeted follow-up research (within iteration bounds)

Termination (any condition):
  material change found
  maxIterations (3) reached
  maxDurationMs (10 min) elapsed
  maxCostUsd ($0.50) exceeded
  minimumImprovement not met
  cancellation requested
```

On termination without meeting goal: return best available result with explicit
uncertainty stated. Silence is the correct output when nothing material happened.

**Phase 4 dependencies:** persistent evidence store, scheduling infrastructure.

---

## Example 7 — BUILD

**Intent:** "AI-powered inventory management for independent retail stores"

| Dimension | Value |
|---|---|
| Outcome | `build` |
| Depth | `balanced` |
| ArtifactContract domains | research, strategy, ux, architecture, quality |

**Five-layer capability selection:**

| Layer | Capabilities | Reason |
|---|---|---|
| L1 Domains | RE, PS, UX, AR, QA | all five non-synthesis domains present in artifact contract |
| L2 Context signals | none | no uploads, no symptom |
| L3 Depth/Eval | none added | all domain capabilities already selected |
| L4 Orchestration | CO added | Build uses structured-delivery with stage-gate coordination |
| L5 Delegation | not allowed | build not in delegation-eligible outcomes (V1) |

**Selected: RE, PS, UX, AR, QA, CO (6 capabilities, 6 instances)**

**Architectural statement:** All six capabilities are selected because the
`BUILD_ARTIFACT_CONTRACT` spans all five non-synthesis domains AND the Build
recipe requires CO for stage-gate coordination. This is **derived** from the
artifact contract and recipe — it is not a hard-coded rule. A `BUILD_LITE`
artifact contract with only three domains would produce a different capability
set.

**V2 compatibility:** This is the primary outcome where `internalStageIndex`
maps to the existing 15-stage lifecycle. The Compiler generates an
`InternalStageMapping` for each of the 15 generate steps.

**Plan shape:** 15 generate steps + evaluation steps (per DepthPolicy) = ~16–17 steps.

---

## Routing Summary Matrix

| Outcome | Domains | Selected capabilities | Instances | Sub-agent workers | Recipe | CO? | CO reason |
|---|---|---|---|---|---|---|---|
| prioritize | strategy, quality | PS, QA | 2 | 0 | structured-delivery | No | No stage-gate, no synthesis |
| casestudy | research, strategy | RE, PS | 2 | 0 | structured-delivery | No | No synthesis step in recipe |
| plan | architecture, strategy, quality | AR, PS, QA | 3 | 0 | structured-delivery | No | No stage-gate, no synthesis |
| research | research, strategy | RE, PS, QA | 4 | 4 | research-first | Yes | Recipe requires coordination |
| review | quality (context-driven) | PS, UX, AR, QA | 4 | 0 | parallel-critique | Yes | Synthesis across critiques |
| decide | strategy | PS, CO | **3** | 0 | red-blue-debate | Yes | Judge role |
| council | quality (context-driven) | PS, RE, AR, QA | 4 | 2 | council | Yes | Aggregation |
| investigate | research, quality, strategy (+ context) | RE, PS, UX, QA | 5 | 3 | research-first | Yes | Synthesis |
| continuous | research | RE | 2 | 2 | goal-based-loop | Yes | Frames and evaluates |
| build | all five | all six | 6 | 0 | structured-delivery | Yes | Stage-gate coordination |

**Read this table as the anti-inflation guard.** If any outcome's Row shows all
six capabilities without explicit justification in all five layers, that is a
Router defect.

---

# PART 20 — ARCHITECTURAL INVARIANTS

Rules that the Orchestration Engine (Document 3) and all subsequent documents
must never violate.

1. **The Router is deterministic.** Same NormalizedMission → same RoutingDecision. No randomness, no LLM decision calls within the Router.

2. **Artifact contracts drive domain capability selection (Layer 1).** A capability is selected for its domain because an artifact needs that domain — not because an outcome name sounds like it might use the capability.

3. **CO is not a domain capability.** CO is selected via Layer 4 (orchestration requirements), not because an artifact has a "synthesis" domain. CO is absent from missions where the recipe does not require synthesis, judgment, or stage-gate coordination.

4. **The Orchestration Engine is not CO.** The engine is deterministic infrastructure. CO is a specialist capability. A mission running PS + QA still runs under the engine. The engine orchestrates execution; CO orchestrates reasoning.

5. **ExecutionPlan is immutable after compilation.** `plan.json` is written once. The engine never writes to it. All runtime state goes to `state.json`.

6. **ExecutionState is separate and mutable.** `state.json` owns all runtime fields: status, completedStepIds, failedStepIds, budget consumption, loop state, cancellation state.

7. **The plan is persisted before execution begins.** No step of any execution starts without a complete, validated, persisted `plan.json`.

8. **Isolation constraints are declared in the plan.** `mustNotReceiveOutputFrom` is set at compile time. The engine enforces it — it does not decide it.

9. **All loops are bounded.** Every loop plan must have: maxIterations ≤ 5, maxDurationMs, costCeilingUsd, minimumImprovementPerIteration, onBoundsExhausted. No unbounded loops.

10. **Goal loops are depth-independent.** Any depth level may include a goal loop. Depth controls per-iteration rigor; loop policy controls recurrence.

11. **Delegation depth = 1 in V1.** Workers do not spawn workers. The Compiler rejects any plan where worker delegation depth > 1.

12. **Sub-agents are temporary workers, not capabilities.** A worker is a bounded task executor. It is not promoted to a primary capability. It reports to its owner capability.

13. **No semantic fallback.** The Router and Compiler never invent an alternative topology when the requested strategy is invalid. They fail with a specific error.

14. **Safety normalization is disclosed.** Any normalization that changes a value must be recorded in `appliedNormalizations` and shown to the user before execution.

15. **URL reachability belongs to the Context Engine.** The Normalizer validates URL syntax only. Runtime fetching, content extraction, and scoping are Context Engine responsibility.

16. **Evaluation is in the unified execution graph.** Evaluation steps are `ExecutionStep` entries with `stepType: 'evaluate'`. There is one execution graph, not two.

17. **Run-specific artifact dependencies vs persistent workspace dependencies are separate.** `plan.json` records `RunArtifactDependency`. The Artifact/Workspace model owns cross-run, cross-improvement-cycle dependency tracking.

18. **Artifact IDs are stable.** Stable across versions, improvement cycles, re-runs. No routing decision may change an artifact's ID.

19. **No artifact is assumed to be Markdown forever.** The `outputType` field on `PlannedArtifact` and `ExecutionStep` exists and accepts `'structured'` and `'visual'`.

20. **Persistence path is canonical.** Every file reference uses `workspace/{projectId}/runs/{runId}/`. No other path format.

21. **Activity text in events is PM-native.** No stage numbers, no agent IDs as controls, no technical topology in `ExecutionEvent.activity`.

22. **Continuous execution is a composition, not a new outcome.** `outcome: research` + `GoalSpec` + `goal-based-research-loop` recipe. No ninth or tenth outcome type is introduced.

23. **Mission Control reads planning decisions from persisted files.** "What did IdeaGate plan?" is answered from `routing-decision.json` and `plan.json`, not reconstructed from events.

24. **Depth controls rigor, not capability expansion.** A deeper run has more rigorous evaluation thresholds and more allowed revisions. It does not automatically add capabilities from domains the artifact contract does not require.

25. **`ExecutionStepType` describes WHAT; `CapabilityId` describes WHO.** These are independent. The step type does not imply a capability:
    - `stepType: 'synthesize'` does not mean CO — any capability may synthesize
    - `stepType: 'judge'` does not mean CO — the Router assigns the judging capability
    - `stepType: 'evaluate'` does not mean QA — CO evaluates in debate and council
    The Router has already assigned the correct `capabilityInstanceId` to each step
    in the plan. Document 3 must execute the assigned instance — it must not
    re-derive or override the capability from the step type.

---

# PART 21 — OPEN DECISIONS

| Decision | Why it matters | Options | Recommendation | Resolves in |
|---|---|---|---|---|
| Where does the Router live? | CLI engine vs. API route layer vs. separate module | (a) as a module in the CLI engine, (b) as an API route in the UI layer, (c) as a shared library | Option (a) — keeps routing co-located with execution; avoids cross-process routing decisions | Phase 1 implementation start |
| Step ID generation strategy | Deterministic IDs enable event/step correlation across runs | (a) semantic derivation, (b) sequential integers, (c) UUID | Option (a) — semantic IDs are human-readable and stable | Phase 1 |
| Outcome inference threshold | 0.7 confidence is documented but not validated | Empirical calibration required | Confirm through Phase 2 testing | Phase 2 |
| Context summarization threshold | 16,000 tokens is documented; calibration needed | Depends on model context windows | Calibrate against available models | Document 4 |
| Worker budget allocation | Percentage vs absolute per-worker ceiling | Absolute is simpler and safer | Absolute (documented in §9.2) | Phase 4 |
| Persistent evidence store format | JSONL vs SQLite vs structured files | JSONL is consistent with events.jsonl and zero-infrastructure | JSONL | Document 4 / Phase 4 |

---

# PART 22 — EXPLICIT DEFERRALS

What Document 2 deliberately does not solve:

1. **Agent Harness implementation** — how capabilities are invoked, timed out, retried, and observed. Document 3.
2. **Orchestration Engine implementation** — how the engine executes the plan's step graph, manages parallelism, enforces isolation. Document 3.
3. **Context extraction and retrieval** — parsing uploads, fetching URLs, scoping to capabilities. Document 4.
4. **Persistent artifact dependency model** — the workspace-level artifact graph that survives across runs. Document 4/5.
5. **Outcome-specific step sequences** — the exact prompts, framing, and step layouts for each outcome. Document 5.
6. **Outcome inference classifier** — the LLM-assisted classifier for Phase 2 intent parsing. Document 6 / Phase 2.
7. **Historical budget estimation** — real time and cost estimates require operational data. Phase 3.
8. **Scheduling infrastructure** — how continuous compositions are triggered. Phase 4.
9. **Recursive delegation safety** — demonstrating the four conditions for depth > 1. Future version.
10. **Mission Composer UX** — states, transitions, copy, interaction detail. Document 6.

---

# PART 23 — TRACEABILITY MATRIX

How Document 1 principles become Document 2 contracts and what Document 3 inherits.

| Document 1 principle | Document 2 contract | Document 3 dependency |
|---|---|---|
| Artifact contract drives capability selection | DOMAIN_CAPABILITY_MAP + five-layer selection algorithm (Part 6) | Engine receives CapabilityInstances from plan; must not re-select capabilities |
| CO is not a mandatory capability | Layer 4 rule (§6.5) + CO rejection in prioritize/casestudy/plan examples | Engine does not special-case CO; treats it like any other capability |
| Orchestration Engine ≠ CO | §3.2, Invariant #4 | Engine is infrastructure; CO is invoked only when it appears in capabilityInstances |
| Plan immutable during execution | §1.3, Part 12 | Engine writes to state.json; must never write to plan.json |
| Loops are bounded | LoopPolicy schema (Part 13), Invariant #9 | Engine evaluates termination deterministically; LLM does not decide loop continuation |
| Goal loop is depth-independent | §7.3, DepthPolicy table (§8.3) | Engine allows goal loops at any depth level |
| Sub-agent depth = 1 (V1) | §9.3, Invariant #11 | Engine enforces maxDepth:1; Compiler rejected depth>1 plans |
| Evaluation in unified graph | §10.2, stepType:'evaluate' | Engine processes evaluate steps like any other step in the sequence |
| Context scoped per capability | ContextPlan schema (§11.4) | Agent Harness receives capability-specific context bundles from the plan |
| Activity text is PM-native | ObservabilityContract (§12.6), event rules (§17.3) | Engine emits PM-native activity text; never emits stage numbers or agent IDs |
| Artifact IDs are stable | PlannedArtifact.id, RunArtifactDependency (§4.4, §12.4) | Engine writes artifacts using the plan's stable IDs; never generates new IDs at runtime |
| No artifact assumed Markdown forever | outputType field on PlannedArtifact and ExecutionStep | Agent Harness must produce output in the schema declared by the step; format is plan-determined |
| Fail closed | §16.2, all error codes | Engine fails steps that exceed retry limits; does not invent workarounds |

---

# PART 24 — TESTABLE ACCEPTANCE CRITERIA

These criteria must be verifiable by observation or automated test. "The document says it" is not sufficient.

| # | Criterion | How to verify |
|---|---|---|
| 1 | Router determinism | Given identical NormalizedMission input twice, assert the two RoutingDecision outputs are byte-identical |
| 2 | Prioritize selects only PS + QA | Run the Router with `outcome:'prioritize'`, assert `selectedCapabilities.length === 2`, assert `capabilityInstances` does not contain RE, UX, AR, or CO |
| 3 | Decide uses 2 capabilities, 3 instances | Run with `outcome:'decide'`, assert `capabilities = ['PS','CO']`, assert `capabilityInstances.length === 3` |
| 4 | CO absent from prioritize | Assert no capabilityInstance with capabilityId:'CO' in a `prioritize` plan |
| 5 | Goal loop valid at balanced depth | Submit RunConfig with `outcome:'research'`, `depth:'balanced'`, `goal: {bounds:...}`. Assert Router selects `recipe:'goal-based-research-loop'` |
| 6 | Loop rejected without GoalSpec | Submit `outcome:'research'`, no `goal`, `orchestrationOverride:'goal-based-research-loop'`. Assert RouterError: LOOP_REQUIRES_GOAL_SPEC |
| 7 | Debate isolation enforced | In a `decide` plan, assert `PS[blue].mustNotReceiveOutputFrom` contains `PS[red].instanceId` and vice versa |
| 8 | maxIterations capped | Submit `goal.bounds.maxIterations: 20`. Assert `NormalizedMission.goal.bounds.maxIterations === 5`, `appliedNormalizations` contains the original value |
| 9 | debate + prioritize rejected | Submit `outcome:'prioritize'`, `orchestrationOverride:'debate'`. Assert NormalizationError: ORCHESTRATION_INCOMPATIBLE |
| 10 | URL syntax valid but runtime unreachable — normalization succeeds | Submit a URL that is syntactically valid but points to an unreachable host. Assert NormalizedMission is produced (no normalization error). Assert the URL appears in `context.urls` with `wellFormed:true`. Assert the URL is NOT in a `fetchable:false` state (that field does not exist) |
| 11 | plan.json unchanged during execution | Start a run. After 30 seconds, read plan.json. Assert its content is byte-identical to the file written by the Compiler |
| 12 | state.json updated during execution | After any step completes, assert `state.json.completedStepIds` contains that step's ID and `plan.json.steps` does not contain any mutable state |
| 13 | Stable artifact IDs across runs | Run the same Build mission twice. Assert both runs produce artifacts with the same 15 artifact IDs (same stable IDs, different versions) |
| 14 | Revised artifact same ID | Improve an artifact in Studio. Assert the improved artifact has the same `artifactId` and an incremented `version` |
| 15 | Council selects selective specialists | Run the Router with `outcome:'council'` + a UX-heavy question. Assert UX is selected. Run again with a purely pricing question. Assert UX is rejected with a rationale record |
| 16 | Activity text has no stage numbers | Emit 10 events during a run. Assert no event.activity contains a pattern matching `Stage \d+` |
| 17 | Delegation depth 1 enforced | Attempt to create a DelegationSpec with a nested worker that also has a DelegationSpec. Assert CompilerError: DELEGATION_DEPTH_EXCEEDED |
| 18 | Evaluation step in unified graph | Compile a plan with `depth:'balanced'`. Assert at least one step has `stepType:'evaluate'`. Assert there is no separate `evaluationSteps` array in the plan |

---

# PART 25 — DOCUMENT 2 DEFINITION OF DONE

Document 3 may proceed only when all items on this checklist are confirmed.

**Normalization:**
- [ ] NormalizedMission schema typed and complete
- [ ] Semantic invalidity vs safety normalization formally separated
- [ ] URL syntax-only validation explicit; runtime fetchability excluded
- [ ] `appliedNormalizations` records all safety normalizations
- [ ] All seven semantic invalidity combinations documented

**Routing:**
- [ ] Five-layer capability selection model documented and algorithmic
- [ ] DOMAIN_CAPABILITY_MAP defined (no 'synthesis' domain)
- [ ] Layer 4 CO selection rules documented per recipe
- [ ] CO absent from prioritize/casestudy/plan explained explicitly
- [ ] Context signal rules documented for review/council/investigate
- [ ] Orchestration Engine ≠ CO explicitly stated and made an invariant
- [ ] RoutingDecision schema complete and typed

**ExecutionPlan:**
- [ ] No mutable runtime fields in ExecutionPlan schema
- [ ] ExecutionState defined as separate mutable schema
- [ ] Single unified ExecutionStep[] graph (evaluate is a step type)
- [ ] CapabilityInstance handles multiple instances of one capability
- [ ] `mustNotReceiveOutputFrom` present on ExecutionStep
- [ ] `outputType` field present on PlannedArtifact (not assumed Markdown)
- [ ] RunArtifactDependency vs persistent workspace dependency ownership clear

**Depth and Loop:**
- [ ] `goalLoopPermitted: true` at all depth levels
- [ ] Depth controls rigor, not loop eligibility
- [ ] LoopPolicy is a distinct schema from DepthPolicy
- [ ] Loop termination is deterministic (not LLM-decided)

**Failure:**
- [ ] Eight failure categories with codes, behaviors, state impact
- [ ] Fail-closed and safety normalization formally separated

**Persistence:**
- [ ] Canonical path defined: `workspace/{projectId}/runs/{runId}/`
- [ ] `plan.json` described as immutable
- [ ] `state.json` described as mutable
- [ ] `events.jsonl` described as append-only

**Examples:**
- [ ] All seven examples complete with all five layers shown
- [ ] Rejected capabilities explicitly documented in all seven
- [ ] Decide example: 2 capabilities, 3 instances
- [ ] Continuous example: composition, not new outcome
- [ ] Build example: six capabilities derived from artifact contract
- [ ] Routing summary matrix present

**Invariants:**
- [ ] 25 invariants stated
- [ ] All five critical blocker corrections made and stated in Invariants
- [ ] Traceability matrix (Doc 1 → Doc 2 → Doc 3) present
- [ ] Testable acceptance criteria present (18 criteria)

---

# PART 26 — DOCUMENT 3 HANDOFF REQUIREMENTS

## What Document 3 Is Allowed to Assume

1. Every ExecutionPlan it receives was produced by a Router and Compiler that satisfy all 25 invariants in Part 20.
2. `plan.json` is immutable and will not change during execution.
3. All capability instances are specified with stable IDs and framing.
4. Isolation constraints (`mustNotReceiveOutputFrom`) are correct and pre-validated.
5. The step graph has no circular dependencies (validated by Compiler).
6. All budget ceilings are present and valid.
7. All loop policies have complete bounds.
8. Delegation depth is ≤ 1 (enforced by Compiler).
9. All artifact IDs are stable and unique within the plan.
10. The `internalStageIndex` mapping is present for any step that maps to a V2 engine stage.
11. Event activity text must be PM-native — the engine is responsible for enforcing this.

## What Document 3 Must NOT Redesign

1. The capability selection model — which capabilities are present was decided by the Router.
2. The isolation constraints — the engine enforces `mustNotReceiveOutputFrom`; it does not set it.
3. The evaluation policy — the policy is in the plan; the engine applies it.
4. The loop termination conditions — the conditions are in LoopPolicy; the engine evaluates them deterministically.
5. The artifact ID scheme — IDs come from the plan; the engine uses them.
6. The routing rationale — rationale is in `routing-decision.json`; the engine does not re-derive it.
7. The context scoping — which context items reach which capability instance is in ContextPlan.

---

# ARCHITECTURAL CONSISTENCY AUDIT

Post-completion check against the five critical blockers and six important issues.

| Issue | Status | Evidence |
|---|---|---|
| **Blocker 1:** Plan immutability vs mutable status fields | ✅ PASS | `status`, `completedStepIds`, `failedStepIds` removed from ExecutionPlan. `ExecutionState` (Part 14) owns all runtime fields. §1.3, Invariant #5, #6 state the rule explicitly. |
| **Blocker 2:** CO not a synthesis-domain capability | ✅ PASS | `'synthesis'` removed from `ArtifactDomain` type. CO selected via Layer 4 only (§6.5). Examples show CO rejected in prioritize/casestudy/plan. Invariants #3 and #4. |
| **Blocker 3:** Goal loop depth independence | ✅ PASS | `goalLoopPermitted: true` at all depth levels in DepthPolicy table (§8.3). §7.3 explicit rule. Example 6 uses `depth:'balanced'` with a loop. Invariant #10. |
| **Blocker 4:** Fail-closed vs safety normalization | ✅ PASS | §2.5 formal separation. Table of semantic invalidity (§2.4) vs table of safety normalizations (§2.5). `appliedNormalizations` schema records and discloses normalizations. |
| **Blocker 5:** URL fetchability in Context, not Normalizer | ✅ PASS | `ValidatedUrl.fetchable` removed (§2.3). Explicit rule: Normalizer validates syntax; Context Engine handles runtime reachability. Invariant #15. |
| **Issue: crossArtifactConsistency clarification** | ✅ PASS | §4.5 explicitly separates `crossArtifactCoherence` (product requirement) from `dedicatedCoherenceCheckEnabled` in DepthPolicy (validation intensity). |
| **Issue: One unified execution graph** | ✅ PASS | §10.2 removes separate `evaluationSteps[]`. `EvaluationStep` is now `stepType:'evaluate'` in the single `ExecutionStep[]` graph. Invariant #16. |
| **Issue: Artifact dependency ownership** | ✅ PASS | §12.4 splits `RunArtifactDependency` (in plan, run-specific) from persistent workspace artifact dependency model (Document 4/5). |
| **Issue: Canonical persistence path** | ✅ PASS | §1.4 defines canonical path. All examples use it. Invariant #20. |
| **Issue: Orchestration Engine ≠ CO** | ✅ PASS | §3.2 explicit section. Invariant #4. Prioritize example explicitly explains the engine sequences PS→QA without CO. Traceability matrix row. |
| **Issue: Five-layer selection model** | ✅ PASS | Part 6 defines all five layers with explicit algorithms. Research example walks all five layers. CO selection is L4 with recipe-based rules. |

*Final QA pass — six additional checks:*

| Check | Status | Evidence |
|---|---|---|
| **QA-1: Revision execution model** | ✅ PASS | §10.4 fully specifies revision as a bounded retry transition. Plan never mutates. `ExecutionState.revisionAttemptsByStepId` tracks attempts. Revision uses evaluation gaps as context. Exhaustion behavior derived from `EvaluationPolicy.failureBehavior` into `QualityFailurePolicy.onRevisionExhausted`. Debate positions explicitly excluded from revision via `onEvaluationFail: 'advance-with-warning'`. |
| **QA-2: Evaluation source of truth** | ✅ PASS | §17.3 defines: `state.json.evaluationResultsByStepId` = current/latest (overwritten on revision); `evaluations.jsonl` = append-only history with attempt number. `EvaluationLogEntry` schema defined. No competing sources of truth. |
| **QA-3: Cost terminology** | ✅ PASS | `consumedEstimatedCostUsd` renamed to `consumedActualCostUsd`. `HardBudget.maxEstimatedCostUsd` renamed to `costCeilingUsd`. Three distinct cost concepts defined and explained inline in Part 12. All downstream references (invariant 9, user messages) updated. |
| **QA-4: Loop termination precedence** | ✅ PASS | §13.2 defines eight-rule ordered evaluation. Cancellation first. GoalMet second (explicit TAKES PRECEDENCE rule over all remaining bounds). Then bounds in cost/duration/improvement order. Simultaneous-condition ambiguity resolved. |
| **QA-5: Execution order authority** | ✅ PASS | §12.5 defines three-field authority: `dependsOn` = correctness (hard gate), `order` = concurrency grouping, `receivesOutputFrom` = context scoping. Compiler validation rules for contradictions defined. `CONCURRENT_DEPENDENCY_CONFLICT` and `ORDER_DEPENDENCY_CONTRADICTION` errors added to Compiler. |
| **QA-6: Step type vs capability invariant** | ✅ PASS | Invariant #25 added: `ExecutionStepType` = WHAT; `CapabilityId` = WHO. Explicit examples: `synthesize` ≠ CO; `judge` ≠ CO; `evaluate` ≠ QA. Document 3 prohibition stated. |

**Mechanical checks:**
| Check | Status |
|---|---|
| All 25 invariants present and uniquely numbered (1–25) | ✅ PASS |
| No `'synthesis'` artifact domain in active schemas | ✅ PASS (line 512 is in historical explanation only) |
| No mutable fields in `ExecutionPlan` interface | ✅ PASS (status/completedStepIds/failedStepIds are in `ExecutionState` only) |
| No parallel `evaluationSteps[]` array in plan | ✅ PASS (line 1225 is in explanatory context only; schemas are clean) |
| No `ValidatedUrl.fetchable` in active code | ✅ PASS |
| No `consumedEstimatedCostUsd` or `maxEstimatedCostUsd` remaining | ✅ PASS |
| `revisionAttemptsByStepId` present in `ExecutionState` | ✅ PASS |
| Loop termination precedence unambiguous | ✅ PASS |
| `dependsOn` vs `order` authority defined with Compiler validation | ✅ PASS |
| Invariant #25 (`StepType` vs `CapabilityId`) present | ✅ PASS |

---

*IdeaGate — Strategy Router + ExecutionPlan Specification*
*Document 2 of 7 | Version 1.1 — Authoritative*
*Status: Pre-Implementation*
*Depends on: Document 1 (COMPLETE / AUTHORITATIVE)*
*Feeds: Document 3 — Orchestration Engine + Agent Harness Specification*
