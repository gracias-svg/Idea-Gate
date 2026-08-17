# IDEAGATE — MISSION COMPOSER
# V1 PRODUCT & ENGINEERING SPECIFICATION

**Version:** 1.0 (Authoritative)
**Date:** August 2026
**Status:** VERSION 1.0 — COMPLETE / AUTHORITATIVE
Source of truth for all subsequent documentation and implementation.
Pre-implementation: no code is to be written against this document until
Document 2 (Strategy Router + ExecutionPlan Spec) exists.
**Supersedes:** All prior Mission Composer / Advanced Search Bar documents.

---

## HOW TO READ THIS DOCUMENT

This document defines *what IdeaGate is becoming* and *how it must be engineered*.

It is organized so that:
- A **Product Manager** can read Parts I–II and XVII and understand the product.
- A **Designer** can read Parts II, XIX and understand the intended experience.
- An **Architect** can read Parts III–XVI and understand system boundaries.
- An **Engineer** can read Parts IV–XVIII and XXVII and implement without inventing contracts.
- A **Reviewer** can read Part XXIV and distinguish what exists from what is planned.

Every capability in this document carries an explicit status classification.
No capability is described as existing unless it verifiably exists in the repository.

---

# PART I — PRODUCT VISION AND PROBLEM

## 1.1 The Problem

A Product Manager's work is not writing documents. It is a sequence of *product jobs*:

- Determining whether an opportunity is real
- Understanding why a metric moved
- Deciding between competing options
- Stress-testing a proposal before committing
- Sequencing work under constraint
- Turning approved intent into executable plans
- Documenting decisions so others can learn from them
- Staying aware of what competitors are doing

Every one of these jobs requires: gathering the right information, applying the right
expertise, considering multiple perspectives, evaluating quality, and producing an
output someone else can act on.

Today, a PM does this by opening a blank document, talking to colleagues, running
searches, and iterating. It takes days or weeks per job. Much of the work is
structurally repeatable but is redone from scratch every time.

Generic AI assistants (ChatGPT, Claude) can help with pieces of this, but they:
- produce one perspective, not multiple independent expert perspectives
- have no memory of the product context across sessions
- cannot enforce a process or validate their own output against criteria
- produce prose, not structured artifacts that feed downstream workflows
- provide no traceability — you cannot see why the answer is what it is
- cannot iterate toward a measurable goal

## 1.2 What IdeaGate Is

**IdeaGate is a Product Operating System.**

A PM describes a product job. IdeaGate determines the appropriate research,
reasoning, collaboration, validation and artifact-generation process, executes it
with controlled multi-agent orchestration, evaluates the result against
mission-appropriate criteria, and produces structured artifacts that persist in a
workspace and feed downstream product work.

The user describes **what they want accomplished**.
IdeaGate determines **how to accomplish it**.

## 1.3 Why This Requires a System, Not a Prompt

A single LLM call cannot:
- run independent expert evaluations that do not contaminate each other
- preserve genuine disagreement between perspectives
- gather evidence iteratively until a coverage threshold is met
- validate output against explicit quality criteria and revise on failure
- enforce that a process was actually followed
- persist structured state that survives across sessions
- provide an auditable record of why a recommendation was made

IdeaGate's differentiation is not "AI writes PM documents." It is:
**controlled, evaluated, traceable multi-agent execution of product work.**

## 1.4 Universality Requirement

IdeaGate must serve a PM inside an existing company, not only a founder with an idea.

| Situation | Product job |
|---|---|
| Greenfield | "I have an idea — build it out" |
| Discovery | "Is this opportunity worth pursuing?" |
| Analytics | "Why did activation drop?" |
| Customer | "Why are users complaining about onboarding?" |
| Competitive | "What changed at Competitor X?" |
| Strategy | "Should we enter this market?" |
| Decision | "Build or buy?" |
| Planning | "Turn this initiative into a delivery plan" |
| Roadmap | "Which initiatives come first?" |
| Review | "Challenge this PRD" |
| Design | "Stress-test this UX" |
| Architecture | "Challenge this technical approach" |
| Portfolio | "Turn this into a PM case study" |
| Monitoring | "Alert me when Competitor X materially changes" |

If IdeaGate only serves greenfield, it is a startup toy. Serving the full list
makes it a product organization tool.

## 1.5 Product Philosophy — Locked

> **AI explains and generates. Deterministic rules govern.**

The LLM is responsible for: reasoning, synthesis, writing, analysis, critique.

Deterministic system code is responsible for: state transitions, progression,
validation gates, termination conditions, persistence, cancellation, artifact
contracts, concurrency limits, budget enforcement.

An LLM must never decide whether a run is complete, whether state advances,
or whether a quality gate passed. Those are rules.

---

# PART II — MISSION COMPOSER PRODUCT MODEL

## 2.1 What the Mission Composer Is

The Mission Composer is the entry point where a PM describes a product job and
IdeaGate converts it into an executable mission.

It is **not** a search bar. It is **not** a settings panel. It is **not** a
workflow builder.

It is the surface where a product job becomes a configured, executable mission.

## 2.2 The Interaction Model

```
Describe  →  (optionally Configure)  →  Execute
```

**Describe** is required. **Configure** is optional — the system chooses sensible
defaults. **Execute** starts the mission.

The default path is: type the job, press Run. Configuration exists for users
who want to override the system's choices.

## 2.3 The Four Dimensions

These are orthogonal. Any combination is valid. The system resolves the
combination into an ExecutionPlan.

| Dimension | Question | Default behavior |
|---|---|---|
| **OUTCOME** | What do I want accomplished? | User selects; system may infer from intent text |
| **DEPTH** | How much rigor should be applied? | Balanced |
| **ORCHESTRATION** | How should work be coordinated? | **Auto-selected by Strategy Router** |
| **CONTEXT** | What existing information applies? | None unless provided |

**Orchestration is auto-selected by default.** The user does not choose it unless
they deliberately open advanced controls. This is a hard product rule.

## 2.4 What Is Never Exposed

The following are implementation details and must never appear in the Mission
Composer or any primary user surface:

- Lifecycle stage numbers ("Stage 7", "15 stages", "stages 0–14")
- Agent identifiers used as configuration controls
- Model names, token counts, temperature, or any model parameter
- Topology terminology ("fan-out", "parallel execution", "sequential pipeline")
- Internal orchestration names ("planner-executor-verifier", "swarm")
- Prompt architecture, tool routing, internal IDs

**Translation table (binding):**

| Never say | Say instead |
|---|---|
| "15 stages" | "Complete product definition" |
| "Stage 6" | "Prioritize your work" |
| "Stages 11–12" | "Turn approved work into an execution plan" |
| "6 agents" | "Multiple specialists" (only if relevant) |
| "Run stages 0,1,2,5" | "Research and validate the opportunity" |
| "Parallel critique" | "Independent expert review" |

## 2.5 The Honesty Rule — Absolute

**Never expose a control unless it actually affects execution.**

Prohibited:
- Toggles that do not change behavior
- Intelligence modules that are not wired to anything
- Complexity estimates derived from keyword heuristics
- Time estimates not derived from real execution data
- "Coming Soon" states that appear operational

If a capability is not implemented, either omit it entirely, or show it clearly
as a future capability without implying it works. A future capability must state
what phase it belongs to, not a vague "coming soon."

---

# PART III — CANONICAL ARCHITECTURE

## 3.1 The Pipeline

```
USER
  │  describes a product job
  ▼
MISSION COMPOSER                        [UI layer]
  │  collects: intent, outcome, depth, context, optional orchestration override
  ▼
REQUEST NORMALIZER                      [UI layer or API boundary]
  │  validates, resolves defaults, infers outcome if unspecified
  ▼
RunConfig                               [canonical contract — Part IV]
  ▼
STRATEGY ROUTER                         [engine layer]
  │  answers the five orchestration questions (§6.2)
  │  selects: capabilities, orchestration recipe, evaluation policy, termination
  ▼
ExecutionPlan                           [canonical contract — Part VII]
  ▼
ORCHESTRATION ENGINE                    [coordinator — PROTECTED]
  │  executes the plan; manages deterministic state; emits events
  ▼
AGENT HARNESS                           [per-agent execution boundary — Part XII]
  │  identity · task · context · memory · tools · constraints · output schema
  ▼
TOOLS + MEMORY + CONTEXT                [Part XIII, XIV]
  ▼
EVALUATION                              [Part XV]
  │  mission-specific quality criteria
  ▼
PASS / RETRY / REVISE / LOOP / ESCALATE / TERMINATE   [Part XVI]
  ▼
OUTPUT / ARTIFACTS
  ▼
WORKSPACE                               [filesystem — existing]
  ▼
DESK / STUDIO / MISSION CONTROL         [existing surfaces]
```

## 3.2 Architectural Boundaries — MUST NOT CROSS

Two repositories, one system:

```
CLI Engine:  /Users/apple/idea-gate-ui-safe/
UI Layer:    /Users/apple/agent-zero-data/workdir/ui-layer/
```

They communicate **only** through the existing HTTP API surface:

| Route | Method | Purpose |
|---|---|---|
| `/api/run` | POST | Start a mission |
| `/api/run` | DELETE | Cancel a mission |
| `/api/run` | GET | Current run status |
| `/api/stream` | GET (SSE) | Live event stream |
| `/api/data` | GET | Artifact list + current stage |
| `/api/artifact` | GET/PUT | Read/write single artifact |
| `/api/improve` | POST | Improve an artifact |
| `/api/journey-state` | GET | Journey metadata |

**The Mission Composer is UI-layer only.** It produces a RunConfig and POSTs it
to `/api/run`. The Strategy Router lives in the engine layer. The UI never
receives an ExecutionPlan and never learns internal topology.

**Status:** `CURRENTLY IMPLEMENTED` — this boundary exists and is enforced today.

## 3.3 Preserve the Existing Engine

IdeaGate has a working V2 engine. It must not be rebuilt to accommodate the
Mission Composer.

| Existing capability | Status |
|---|---|
| Coordinator (coordinator-v2.js) | CURRENTLY IMPLEMENTED |
| Six primary agents (CO/PS/RE/UX/AR/QA) | CURRENTLY IMPLEMENTED |
| Sequential lifecycle execution | CURRENTLY IMPLEMENTED |
| Journey state persistence (journey.json) | CURRENTLY IMPLEMENTED |
| Artifact persistence (markdown on disk) | CURRENTLY IMPLEMENTED |
| SSE event streaming | CURRENTLY IMPLEMENTED |
| Retry with fallback model | CURRENTLY IMPLEMENTED |
| Per-stage iteration guard (max 2) | CURRENTLY IMPLEMENTED |
| Cancellation (SIGTERM/SIGKILL) | CURRENTLY IMPLEMENTED |
| Single-artifact improvement | CURRENTLY IMPLEMENTED |

The Strategy Router is a **new layer above** this engine. It decides which
existing capabilities a mission requires. It does not replace them.

---

# PART IV — RunConfig CONTRACT

The canonical object produced by the Mission Composer.

```typescript
interface RunConfig {
  // ── REQUIRED ────────────────────────────────────────────
  
  /** The user's description of the product job, verbatim. */
  intent: string;
  
  /** What should be delivered. */
  outcome: OutcomeId;

  // ── OPTIONAL (defaults applied by Request Normalizer) ───
  
  /** How much rigor to apply. Default: 'balanced'. */
  depth?: DepthLevel;
  
  /** 
   * Orchestration override. 
   * If omitted, the Strategy Router auto-selects.
   * Only set when the user explicitly overrides via advanced controls.
   */
  orchestrationOverride?: OrchestrationRecipeId;
  
  /** Existing information to ground the mission. */
  context?: ContextBundle;
  
  /** Explicit goal for goal-based loop missions. */
  goal?: GoalSpec;
  
  /** Client-supplied identifier for correlation. */
  clientRunId?: string;
}

type OutcomeId =
  | 'build'
  | 'research'
  | 'review'
  | 'decide'
  | 'investigate'
  | 'council'
  | 'casestudy'
  | 'prioritize'
  | 'plan';

type DepthLevel = 'quick' | 'balanced' | 'deep' | 'exhaustive';

interface ContextBundle {
  /** Files uploaded for this mission. */
  uploads?: ContextItem[];
  /** URLs to be fetched at run time. */
  urls?: string[];
  /** GitHub repository to read (README + structure). */
  githubRepo?: string;
  /** Existing workspace artifacts to include as grounding. */
  workspaceArtifactPaths?: string[];
  /** Whether to include the workspace's memory (prior mission outputs). */
  includeWorkspaceMemory?: boolean;
}

interface ContextItem {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  /** Server-side path after upload. */
  storagePath: string;
  /** Optional: restrict which capabilities receive this item. */
  scopeHint?: CapabilityId[];
}

interface GoalSpec {
  /** Human-readable goal statement. */
  statement: string;
  /** Machine-checkable success criteria. */
  criteria: GoalCriterion[];
  /** Hard bounds. Required. */
  bounds: GoalBounds;
}

interface GoalCriterion {
  dimension: QualityDimension;
  /** Minimum acceptable score, 0–100. */
  threshold: number;
}

interface GoalBounds {
  maxIterations: number;      // hard cap, always ≤ 5
  maxDurationMs: number;      // wall-clock limit
  maxEstimatedCostUsd: number;
  /** What to do if bounds are hit before criteria are met. */
  onExhausted: 'return-best' | 'fail';
}
```

**Status:** `NOT YET IMPLEMENTED` — this contract does not exist in the repository.
Phase 1 implements: `intent`, `outcome`, `depth`, `clientRunId`.
`context`, `goal`, `orchestrationOverride` are Phase 2+.

---

# PART V — REQUEST NORMALIZER

## 5.1 Responsibility

Takes a raw Mission Composer submission and produces a valid, complete RunConfig.

## 5.2 Operations

| Operation | Behavior |
|---|---|
| **Validate intent** | Reject empty or < 10 characters. Return a specific error, not a generic failure. |
| **Resolve outcome** | If the user selected one, use it. If not, infer from intent (Phase 2). If inference confidence is low, ask the user rather than guessing. |
| **Apply depth default** | `balanced` if unspecified. |
| **Validate context** | Reject unsupported file types. Reject files above size limit. Verify URLs are well-formed. |
| **Validate goal** | If `outcome` requires a goal (monitoring/loop missions), require `goal.bounds`. Reject any goal without bounds. |
| **Reject invalid combinations** | Explicitly enumerate combinations that are invalid and why. |

## 5.3 Outcome Inference (Phase 2)

If the user does not select an outcome, infer it from intent using an
explicit classifier — not vibes.

The classifier returns `{ outcome, confidence }`. If `confidence < 0.7`, the
Composer asks the user to confirm rather than proceeding on a guess.

**Design rule:** inference must be transparent. If IdeaGate infers "Investigate"
from "why did activation drop", the Composer shows that inference before running
and lets the user correct it.

**Status:** `PHASE 2` — Phase 1 requires explicit outcome selection.

## 5.4 Invalid Combinations

| Combination | Why invalid | Behavior |
|---|---|---|
| `outcome: 'review'` with no context | Nothing to review | Reject with: "Review requires an artifact. Upload a document or select one from your workspace." |
| `outcome: 'investigate'` with no context | Nothing to investigate | Reject with a specific message naming what's needed |
| `goal` present without `goal.bounds` | Unbounded loop risk | Reject. Bounds are mandatory. |
| `depth: 'exhaustive'` + `outcome: 'prioritize'` | Prioritize has no exhaustive tier that adds value | Downgrade to `deep` and inform the user |

**Status:** `NOT YET IMPLEMENTED`

---

# PART VI — STRATEGY ROUTER

## 6.1 Responsibility

The Strategy Router is the intelligence of the system. It takes a RunConfig and
produces an ExecutionPlan.

It is **deterministic rule-based code**, not an LLM. Given the same RunConfig,
it must produce the same ExecutionPlan. This is required for reproducibility,
auditability, and debuggability.

## 6.2 The Five Orchestration Questions

For every mission the Router answers:

1. **WHAT is the user trying to accomplish?** → outcome → artifact contract
2. **WHAT information is required?** → context resolution → what must be gathered vs. provided
3. **WHICH capabilities are required?** → minimum sufficient capability set
4. **HOW should those capabilities collaborate?** → orchestration recipe
5. **HOW will IdeaGate know it is good enough to stop?** → evaluation policy + termination

## 6.3 Minimum Sufficient Capability Principle

**The Router selects the smallest capability set that reliably produces the
required outcome.**

More agents is not better. Six agents producing redundant opinions is worse than
two agents producing the correct artifact.

Additional capabilities are added only when one of these is true:
- The task genuinely requires domain expertise the current set lacks
- Independent perspectives materially improve the result (Council, Debate)
- Decomposition materially improves speed or coverage (parallel research)
- An independent evaluator is required for the quality gate

Every capability added beyond the minimum must have a documented justification
in the outcome contract (Part XVIII).

## 6.4 Router Decision Table (V1)

| Outcome | Capabilities | Recipe | Justification |
|---|---|---|---|
| `build` | CO, PS, RE, UX, AR, QA | Structured Delivery | Full product definition genuinely requires all domains |
| `casestudy` | CO, PS, RE | Structured Delivery | Narrative + product reasoning + evidence framing. UX/AR/QA add nothing to a retrospective narrative. |
| `prioritize` | PS, QA | Structured Delivery | Scoring is product strategy; dependency validation is QA. No research, UX, or architecture required. |
| `plan` | AR, PS, QA | Structured Delivery | Decomposition is architecture; sequencing is strategy; acceptance criteria are QA. |
| `research` | CO, RE (+ research sub-agents), PS | Research First | Evidence gathering is the mission; PS validates the business conclusion |
| `review` | PS, UX, AR, QA (as justified), CO | Parallel Critique | Independent critiques must not contaminate each other |
| `decide` | PS×2 (opposing), CO (judge) | Red/Blue Debate | Genuine trade-off requires opposing positions |
| `council` | Selected specialists, CO | Council | Multiple independent domain perspectives |
| `investigate` | RE, + specialists as symptom indicates, CO | Research First + Council | Diagnosis needs evidence then multi-lens interpretation |

**Note on Council capability selection:** Council does not automatically invoke
all specialists. The Router selects specialists whose domain is relevant to the
question. A pricing decision does not require UX. A UX decision does not require
architecture unless technical constraints are in play.

**Status:** `NOT YET IMPLEMENTED`. Phase 1 implements rows 1–4.

## 6.5 Depth Resolution

The Router translates depth into a policy bundle (Part XVI, §16.2), not into
model parameters.

## 6.6 Orchestration Override

If `orchestrationOverride` is present in RunConfig, the Router validates it is
compatible with the outcome and uses it. If incompatible, it rejects with an
explanation rather than silently ignoring.

Example: `outcome: 'prioritize'` with `orchestrationOverride: 'debate'` is
rejected — there is no meaningful opposing position in a ranking task.

---

# PART VII — ExecutionPlan CONTRACT

Produced by the Strategy Router. Consumed by the Orchestration Engine.
**Never exposed to the UI.**

```typescript
interface ExecutionPlan {
  planId: string;
  runId: string;
  outcome: OutcomeId;
  depth: DepthLevel;
  recipe: OrchestrationRecipeId;

  /** Ordered execution steps. */
  steps: ExecutionStep[];

  /** Capabilities active for this plan. */
  capabilities: CapabilityId[];

  /** Sub-agent delegation policy for this plan. */
  delegationPolicy: DelegationPolicy;

  /** How outputs are evaluated. */
  evaluationPolicy: EvaluationPolicy;

  /** Bounds on any revision or goal loops. */
  loopPolicy: LoopPolicy;

  /** What artifacts this plan will produce. */
  artifactContract: ArtifactContract;

  /** Resolved context, scoped per capability. */
  contextPlan: ContextPlan;

  /** Total resource bounds for the entire plan. */
  budget: ExecutionBudget;
}

interface ExecutionStep {
  stepId: string;
  /** Ordinal position. Steps with the same order run concurrently. */
  order: number;
  
  /** Which capability performs this step. */
  capability: CapabilityId;
  
  /** 
   * Instance discriminator. Used when the same capability appears
   * twice in one step group (e.g. debate: PS instance 'blue' and 'red').
   */
  instanceRole?: string;
  
  /** What this step must produce. */
  taskSpec: TaskSpec;
  
  /** Tools this step may use. */
  allowedTools: ToolId[];
  
  /** Context scoped to this step. */
  contextRefs: string[];
  
  /** Internal lifecycle stage this maps to, if any. */
  internalStageIndex?: number;
  
  /** Whether this step may delegate to sub-agents. */
  delegationAllowed: boolean;
  
  /** Steps that must complete before this one. */
  dependsOn: string[];
}

type CapabilityId = 'CO' | 'PS' | 'RE' | 'UX' | 'AR' | 'QA';

interface TaskSpec {
  objective: string;
  outputSchema: OutputSchemaId;
  qualityDimensions: QualityDimension[];
  /** Instructions that shape the capability's framing for this specific task. */
  framing: string;
}

interface ExecutionBudget {
  maxTotalSteps: number;
  maxConcurrentSteps: number;
  maxDurationMs: number;
  maxEstimatedCostUsd: number;
  /** Behavior when a budget is exhausted mid-run. */
  onExhausted: 'complete-current-then-stop' | 'stop-immediately';
}
```

**Status:** `NOT YET IMPLEMENTED`

---

# PART VIII — ORCHESTRATION PRIMITIVES

There are exactly **five** primitives. Everything else is a recipe composed from
them.

## 8.1 SEQUENTIAL

```
Step A → Step B → Step C
```

Each step completes before the next begins. Output of A is available to B.

**Use when:** work has genuine dependencies. B cannot start without A's output.
**Status:** `CURRENTLY IMPLEMENTED` (this is the V2 lifecycle)

## 8.2 PARALLEL

```
        ┌→ Step A →┐
Input → ├→ Step B →├→ Aggregate
        └→ Step C →┘
```

Independent steps execute concurrently. Results are aggregated.

**Use when:** steps are genuinely independent and do not need each other's output.
**Constraint:** must define an aggregation contract. Parallel without defined
aggregation is not a primitive, it is a bug.
**Status:** `PHASE 3` — requires coordinator changes for concurrent dispatch.

## 8.3 DEBATE

```
Question → Position A ┐
                      ├→ Judge → Synthesis (dissent preserved)
        → Position B ┘
```

Two instances of a capability receive opposing framings. A judge synthesizes.

**Use when:** a genuine trade-off exists and both sides have merit.
**Not for:** factual questions. Debate produces better decisions, not better facts.
**Constraint:** the synthesis must preserve unresolved disagreement explicitly.
Hiding the dissent defeats the purpose.
**Status:** `PHASE 3`

## 8.4 VOTE / CONSENSUS

```
        ┌→ Assessor A (score + concern) ┐
Input → ├→ Assessor B (score + concern) ├→ Aggregate → Synthesis
        └→ Assessor C (score + concern) ┘
```

Multiple assessors independently evaluate the same input. Scores and concerns
are aggregated. Dissent is surfaced.

**Use when:** independent expert perspectives materially reduce blind spots.
**Constraint:** assessors must not see each other's output before assessing.
Contamination invalidates the independence that makes voting useful.
**Status:** `PHASE 3`

## 8.5 LOOP

```
Execute → Evaluate → criteria met? ─yes→ Complete
                   └─no→ Identify gap → Generate next task → Execute
                        (bounded: max iterations, time, budget)
```

Execution repeats until an explicit criterion is met or bounds are exhausted.

**Use when:** the mission has a measurable goal and iteration demonstrably improves
the result toward it.
**Hard constraints:**
- Success criteria must be defined **before** the loop starts
- `maxIterations` is always ≤ 5
- A wall-clock timeout is always present
- A cost budget is always present
- Minimum-improvement detection halts the loop when iterations stop helping
- On exhaustion: return best available result with explicit uncertainty stated

**Never** an unbounded "keep thinking until satisfied" loop.
**Status:** `PHASE 3` (revision loop) / `PHASE 4` (goal loop)

---

# PART IX — ORCHESTRATION RECIPES

Recipes are named compositions of primitives. They are internal. Users do not
select recipes by name unless using advanced override.

## 9.1 Structured Delivery

```
sequential(step₁ … stepₙ)
```

The V2 lifecycle model. One capability per step, ordered by dependency.

**Recipe for:** build, casestudy, prioritize, plan
**Status:** `CURRENTLY IMPLEMENTED`

## 9.2 Research First

```
sequential(
  research_phase:  RE with tools [web-search, url-fetch]
                   (+ parallel sub-agents if delegation justified),
  synthesis:       RE aggregates findings,
  interpretation:  PS interprets business implications,
  evaluation:      evidence coverage check
)
```

Evidence gathering runs first and deepest. Downstream capabilities receive
research output as context.

**Recipe for:** research, investigate (first phase)
**Status:** `PHASE 2`

## 9.3 Parallel Critique

```
parallel(
  PS critique(artifact),
  UX critique(artifact),
  AR critique(artifact),
  QA critique(artifact)
) → CO synthesis(ranked gaps)
```

Same input to multiple assessors simultaneously. Independence is the point —
each assessor must not see the others' findings.

**Recipe for:** review
**Status:** `PHASE 3` (parallel) — Phase 2 ships a sequential fallback that
produces the same artifact contract with lower parallelism.

## 9.4 Council

```
parallel(
  selected_specialist₁ assess(input) → {assessment, confidence, concern},
  selected_specialist₂ assess(input) → {assessment, confidence, concern},
  ...
) → vote_aggregate → CO synthesis(agreement, dissent, recommendation)
```

Differs from Parallel Critique: Council produces *scored assessments with
confidence*, aggregated into a recommendation. Critique produces *gaps*.

**Recipe for:** council
**Status:** `PHASE 3`

## 9.5 Red/Blue Debate

```
debate(
  blue: PS(framing="build the strongest case FOR"),
  red:  PS(framing="find every reason this fails"),
  judge: CO(synthesize, preserve dissent)
)
```

**Recipe for:** decide
**Status:** `PHASE 3`

## 9.6 Goal-Based Research Loop

```
loop(
  execute:  RE research(current_gaps),
  evaluate: evidence_coverage_score(),
  gate:     score ≥ goal.criteria.threshold,
  on_fail:  identify_gaps() → generate_targeted_tasks(),
  bounds:   goal.bounds
)
```

**Recipe for:** research (deep/exhaustive), continuous execution compositions (§18.10)
**Status:** `PHASE 4`

## 9.7 Planner → Executor → Verifier

```
sequential(
  plan:    CO decompose(objective) → task list,
  execute: parallel-or-sequential(tasks by dependency),
  verify:  QA verify(output vs objective),
  revise:  loop(revise, bounded) if verification fails
)
```

**Recipe for:** investigate (Phase 4), complex plan missions
**Status:** `PHASE 4`

---

# PART X — AGENT MODEL

## 10.1 Primary Capabilities

IdeaGate has six persistent specialist capabilities. They are capabilities, not
a mandatory team.

| ID | Capability | Domain |
|---|---|---|
| CO | Coordinator | Orchestration, synthesis, judging, decision framing |
| PS | Product Strategy | Positioning, prioritization, business case, requirements |
| RE | Research | Evidence gathering, market analysis, problem synthesis |
| UX | UX Design | Flows, information architecture, usability, interaction |
| AR | Architect | Technical feasibility, system design, decomposition |
| QA | Quality Assurance | Validation, completeness, acceptance criteria, risk |

**Status:** `CURRENTLY IMPLEMENTED`

## 10.2 Dynamic Selection — The Core Correction

**No mission automatically uses all six capabilities.**

The Strategy Router selects the minimum sufficient set per §6.3.

Worked examples:

```
PRIORITIZE
  Required: PS (apply framework), QA (validate dependencies)
  Not required: RE (no research in ranking known items)
                UX (no design work)
                AR (no architecture work)
                CO (no synthesis across perspectives needed)
  Capability set: [PS, QA]

CASE STUDY
  Required: RE (frame the evidence), PS (product reasoning), CO (narrative synthesis)
  Not required: UX, AR, QA
  Capability set: [CO, PS, RE]

REVIEW a technical architecture doc
  Required: AR (technical critique), QA (completeness), CO (synthesis)
  Conditionally required: PS (if strategic soundness is in scope)
                          UX (only if the doc includes UX decisions)
  Capability set: determined by document content classification
```

## 10.3 Multiple Instances of One Capability

A capability may appear more than once in a plan with different `instanceRole`
framings. This is how Debate works — two PS instances, opposing briefs.

Instances are isolated: they do not share context or see each other's output
until the judge step.

**Status:** `PHASE 3`

---

# PART XI — DYNAMIC AGENT / SUB-AGENT DELEGATION

## 11.1 Primary Capabilities vs. Sub-Agents

| | Primary Capability | Sub-Agent |
|---|---|---|
| Lifetime | Persistent, part of the system | Created for one bounded task, then discarded |
| Identity | Named, stable (CO, PS, RE…) | Ephemeral, typed by task |
| Scope | Domain expertise | One narrow sub-task |
| Owner | The system | A parent capability |
| Output | An artifact | A finding handed back to the parent |
| Visible to user | As "specialists" | Only as parent activity |

Sub-agents do **not** become new top-level capabilities. A "Pricing Researcher"
is a temporary worker under RE, not a seventh IdeaGate agent.

## 11.2 Delegation Contract — Mandatory Fields

Every use of sub-agent delegation must specify all fifteen:

| # | Field | Requirement |
|---|---|---|
| 1 | Justification | Why decomposition materially improves the result |
| 2 | Decomposed task | What is being split and on what axis |
| 3 | Owner | Which primary capability owns the workers |
| 4 | Max workers | Hard cap on count |
| 5 | Worker input | Exactly what each worker receives |
| 6 | Worker output schema | Structured; must include evidence and confidence |
| 7 | Validation | How a worker's output is checked before acceptance |
| 8 | Merge strategy | How outputs are combined |
| 9 | Partial failure | Behavior when one worker fails |
| 10 | Disagreement | Behavior when workers contradict each other |
| 11 | Max concurrency | Simultaneous worker limit |
| 12 | Max depth | Sub-agents may not spawn sub-agents (depth = 1) |
| 13 | Budget | Token/cost ceiling for the delegation group |
| 14 | Termination | When delegation stops regardless of completion |
| 15 | Persistence | Whether worker outputs are retained for traceability |

## 11.3 Delegation Constraints — Absolute

- **Maximum spawn depth: 1 — a V1 safety boundary.** In V1, a sub-agent may not
  spawn sub-agents. This is a deliberate safety constraint, not a permanent
  architectural impossibility. Recursive delegation is deferred until a future
  architecture explicitly demonstrates: provable termination, full observability
  of the delegation tree, per-branch budget enforcement, and defined failure
  handling at every depth. Until all four exist, depth remains capped at 1.
- **Maximum concurrent workers: 5** per delegation group.
- **Every delegation group has a cost budget** enforced by deterministic code.
- **Worker output must be structured**, including source and confidence.
- **A worker that fails does not fail the mission.** The parent proceeds with
  the workers that succeeded and states the coverage gap explicitly.

## 11.4 Worker Output Schema

```typescript
interface SubAgentResult {
  workerId: string;
  taskDescription: string;
  status: 'complete' | 'partial' | 'failed';
  finding: string;
  evidence: EvidenceRef[];
  confidence: number;          // 0–100
  unresolvedQuestions: string[];
  durationMs: number;
}

interface EvidenceRef {
  source: string;              // URL, filename, or workspace artifact path
  excerpt?: string;
  retrievedAt: string;         // ISO 8601
}
```

## 11.5 Where Delegation Is Justified

| Mission | Delegation | Justification |
|---|---|---|
| Research | RE spawns competitor / pricing / user-problem / market-trend workers | Independent evidence axes; parallel gathering materially improves coverage and speed |
| Council (deep) | PS spawns pricing + positioning analysts; AR spawns scalability + integration analysts | Sub-domains within one capability's assessment |
| Investigate | RE spawns per-data-source workers (analytics, tickets, research) | Each source requires different analysis |

## 11.6 Where Delegation Is NOT Justified

| Mission | Why not |
|---|---|
| Prioritize | Ranking a known list is one coherent task; splitting it produces inconsistent scoring |
| Case Study | Narrative coherence requires single authorship |
| Plan | Work decomposition must be internally consistent; parallel decomposition creates conflicting breakdowns |
| Build (V1) | Sequential lifecycle already provides the structure |

## 11.7 Terminology

Use **"bounded dynamic sub-agent delegation."**

Do not use "swarm" in architecture documents, code, or product copy. It is
imprecise and implies uncontrolled emergent behavior, which is the opposite of
what this architecture provides.

**Status:** `PHASE 4`

---

# PART XII — AGENT HARNESS

## 12.1 Purpose

The Agent Harness is the execution boundary. Every capability invocation goes
through it. It is what makes IdeaGate an engineering system rather than a
collection of prompts.

## 12.2 Contract

```typescript
interface AgentInvocation {
  // Identity
  capability: CapabilityId;
  instanceRole?: string;
  invocationId: string;
  
  // Work
  task: TaskSpec;
  
  // Information
  context: ResolvedContext;
  memory: MemorySlice;
  
  // Capability boundaries
  allowedTools: ToolId[];
  delegationAllowed: boolean;
  maxSubAgents: number;
  
  // Output requirements
  outputSchema: OutputSchemaId;
  
  // Execution controls
  retryPolicy: RetryPolicy;
  timeoutMs: number;
  cancellationToken: string;
  
  // Observability
  emitEvents: boolean;
  
  // Quality contract
  evaluationContract: EvaluationContract;
}

interface AgentResult {
  invocationId: string;
  capability: CapabilityId;
  status: 'complete' | 'partial' | 'failed' | 'cancelled' | 'timeout';
  output: string;                  // the produced content
  structuredOutput?: unknown;      // parsed per outputSchema
  evidence: EvidenceRef[];
  confidence: number;              // 0–100
  subAgentResults?: SubAgentResult[];
  tokensUsed: number;
  estimatedCostUsd: number;
  durationMs: number;
  failureReason?: string;
}
```

## 12.3 Harness Responsibilities

The harness — not the agent, not the coordinator — is responsible for:

- Assembling the final prompt from task, context, and memory
- Enforcing the tool allow-list (an agent cannot call a tool not granted)
- Enforcing the timeout
- Executing the retry policy on technical failure
- Validating output against the schema before returning
- Emitting events for observability
- Enforcing sub-agent limits if delegation is allowed
- Honoring cancellation immediately

**Status:** `NOT YET IMPLEMENTED` — currently agents are invoked directly by the
coordinator without a formal harness boundary. This is the highest-value
architectural refactor for making the system extensible. Recommended for Phase 2.

---

# PART XIII — CONTEXT ENGINE

## 13.1 Context vs. Memory vs. Artifacts

These are three distinct things and must not be conflated:

| | Definition | Lifetime | Source |
|---|---|---|---|
| **Context** | Information provided for *this* mission | This run only | User uploads, URLs, selected artifacts |
| **Memory** | Information retained from prior missions | Across runs in a workspace | System-generated summaries of prior runs |
| **Artifacts** | Persistent product outputs | Permanent | Mission outputs written to workspace |

An artifact can *become* context for a later mission when the user selects it.
Memory is derived, not user-selected.

## 13.2 The Context Pipeline

```
INGEST → PARSE → CLASSIFY → CHUNK → INDEX → RETRIEVE → BUNDLE → AGENT
```

| Stage | Responsibility |
|---|---|
| **Ingest** | Accept upload; store to workspace context directory; record metadata |
| **Parse** | Extract text per format (PDF, DOCX, CSV, image via vision, markdown direct) |
| **Classify** | Determine document type: PRD, research, analytics, spec, competitor doc, other |
| **Chunk** | Split into semantically coherent sections with headers preserved |
| **Index** | Build a retrievable index (Phase 4: embeddings; Phase 2: keyword + section headers) |
| **Retrieve** | Given a capability's task, select relevant chunks |
| **Bundle** | Assemble a ContextBundle scoped to that capability |

## 13.3 Anti-Pattern — Explicitly Prohibited

**Never dump every uploaded file into every agent's prompt.**

This is the naive approach. It:
- exhausts context windows
- degrades output quality with irrelevant information
- makes costs unpredictable
- destroys traceability (which source informed which claim?)

## 13.4 Context Scoping

Each capability receives only relevant context:

| Capability | Typically needs |
|---|---|
| RE | Research docs, competitor info, market data, analytics |
| PS | Business context, strategy docs, prior PRDs, metrics |
| UX | User research, design specs, screenshots, flows |
| AR | Technical specs, architecture docs, constraints, repository structure |
| QA | Requirements, acceptance criteria, prior test plans |
| CO | Summaries of all of the above, not the full content |

## 13.5 Provenance and Citation

Every context item carries:

```typescript
interface ContextProvenance {
  contextItemId: string;
  source: string;              // filename, URL, or artifact path
  ingestedAt: string;
  documentType: string;        // classified type
  freshness?: string;          // for URLs: when fetched
}
```

When an agent uses context in its output, the output must include a citation
marker. Untraceable claims are a quality failure, not a stylistic preference.

## 13.6 Context Size Management

| Total context size | Strategy |
|---|---|
| < 4,000 tokens | Inject in full |
| 4,000–16,000 tokens | Inject with section headers for navigation |
| > 16,000 tokens | Retrieve relevant chunks only; summarize the rest to ≤ 4,000 tokens |

Original context is always persisted at full fidelity for traceability, even
when a summary is what reaches the agent.

**Status:** `PHASE 2` (ingest/parse/scope) → `PHASE 4` (embeddings, retrieval)

---

# PART XIV — MEMORY MODEL

## 14.1 What Memory Is

Memory is what IdeaGate retains about a workspace across missions, so that a
second mission in the same workspace is better-informed than the first.

## 14.2 Memory Contents

```typescript
interface WorkspaceMemory {
  workspaceId: string;
  
  /** Compressed summaries of prior mission outputs. */
  missionSummaries: MissionSummary[];
  
  /** Facts about the product that persist across missions. */
  productFacts: ProductFact[];
  
  /** Decisions made and their rationale. */
  decisionLog: DecisionRecord[];
  
  /** Assumptions stated and their current evidence status. */
  assumptionRegister: Assumption[];
}

interface ProductFact {
  fact: string;
  source: string;              // which mission established it
  establishedAt: string;
  confidence: number;
  supersededBy?: string;       // if a later mission contradicted it
}
```

## 14.3 Memory Is Derived, Not Authored

Memory is generated by the system from mission outputs. The user does not write
memory directly. This keeps it honest — memory reflects what the system actually
produced, not what someone claims.

## 14.4 Contradiction Handling

When a new mission produces a fact that contradicts memory, the system must:
1. Surface the contradiction explicitly in the output
2. Not silently overwrite the prior fact
3. Record both with timestamps and let the user resolve

**Status:** `NOT YET IMPLEMENTED` — journey.json holds per-run state today but
there is no cross-run memory. `PHASE 4`.

---

# PART XV — EVALUATION SYSTEM

## 15.1 Evaluation Is Mission-Specific

There is no single "quality score." Different missions require different criteria.

## 15.2 Quality Dimensions

```typescript
type QualityDimension =
  | 'completeness'          // covers required sections
  | 'logical-consistency'   // no internal contradictions
  | 'evidence-quality'      // claims are supported
  | 'source-coverage'       // sufficient breadth of evidence
  | 'contradiction-handling'// conflicting evidence addressed, not ignored
  | 'technical-feasibility' // buildable as described
  | 'ux-quality'            // design reasoning holds up
  | 'scoring-consistency'   // ranking methodology applied uniformly
  | 'dependency-correctness'// dependencies identified and ordered correctly
  | 'rationale-clarity'     // reasoning is explicit and traceable
  | 'argument-quality'      // positions are substantive
  | 'tradeoff-coverage'     // trade-offs named, not glossed
  | 'dissent-preservation'  // disagreement retained, not smoothed away
  | 'hypothesis-quality'    // hypotheses are specific and testable
  | 'falsifiability'        // claims can be proven wrong
  | 'experiment-quality'    // experiments would produce a real answer
  | 'factual-integrity'     // narrative matches provided facts
  | 'handoff-readiness';    // downstream consumer can act on it
```

## 15.3 Per-Outcome Evaluation Policies

| Outcome | Primary dimensions | Evaluator | Pass threshold |
|---|---|---|---|
| build | completeness, logical-consistency, handoff-readiness | QA | 70 |
| research | evidence-quality, source-coverage, contradiction-handling | QA | 75 |
| review | completeness, rationale-clarity | CO | 70 |
| decide | argument-quality, tradeoff-coverage, dissent-preservation | CO | 80 |
| investigate | hypothesis-quality, falsifiability, experiment-quality | QA | 75 |
| council | source-coverage, dissent-preservation, rationale-clarity | CO | 75 |
| casestudy | factual-integrity, rationale-clarity, completeness | QA | 70 |
| prioritize | scoring-consistency, dependency-correctness, rationale-clarity | QA | 75 |
| plan | completeness, dependency-correctness, handoff-readiness | QA | 80 |

## 15.4 Evaluation Contract

```typescript
interface EvaluationPolicy {
  dimensions: QualityDimension[];
  passThreshold: number;           // 0–100
  evaluator: CapabilityId | 'self';
  maxEvaluationAttempts: number;
  onFailure: 'revise' | 'escalate' | 'accept-with-warning' | 'fail';
}

interface EvaluationResult {
  passed: boolean;
  overallScore: number;
  dimensionScores: Record<QualityDimension, number>;
  failedDimensions: QualityDimension[];
  /** What specifically must improve. Required when passed=false. */
  gaps: string[];
  evaluatorNotes: string;
}
```

## 15.5 Evaluation Must Be Actionable

An evaluation that returns "score: 62, failed" is useless. It must return
specific gaps that the revision step can act on. A revision loop without
actionable gaps is just re-rolling the dice.

**Status:** `PARTIALLY IMPLEMENTED` — the coordinator produces a confidence
value (high/medium/low) and a go/iterate decision today. Full dimensional
evaluation is `PHASE 3`.

---

# PART XVI — RETRY, REVISION, AND GOAL LOOP

## 16.1 Three Distinct Mechanisms

These must never be conflated in code or documentation.

### Technical Retry
**Trigger:** The model, API, or tool failed. Network error, 429, 400, timeout.
**Action:** Retry the identical request, possibly with a fallback model.
**Bound:** Max 2 retries per invocation.
**Not a quality mechanism.** The output was never produced.
**Status:** `CURRENTLY IMPLEMENTED`

### Quality Revision
**Trigger:** Output was produced but failed an evaluation gate.
**Action:** Re-invoke with the specific gaps as additional instruction.
**Bound:** Max 2 revisions per step (depth-dependent).
**The output exists but is not good enough.**
**Status:** `PARTIALLY IMPLEMENTED` (coordinator iterate decision, max 2)

### Goal-Based Loop
**Trigger:** The mission's explicit goal has not been satisfied.
**Action:** Evaluate what is missing, generate new tasks targeting the gap,
execute them, re-evaluate.
**Bound:** goal.bounds — max iterations, time, cost, minimum improvement.
**The work is incomplete relative to a stated objective.**
**Status:** `PHASE 4`

## 16.2 Depth as a Policy Bundle

Depth is not "number of iterations." It is a bundle of policy settings.

| Policy | Quick | Balanced | Deep | Exhaustive |
|---|---|---|---|---|
| Research breadth | Minimum sufficient | Standard | Extended | Maximum within budget |
| Sub-agent delegation | Never | Only if required | When beneficial | When beneficial |
| Max parallel workers | 0 | 2 | 4 | 5 |
| Evaluation passes | 0 | 1 | 1 | 2 |
| Evaluation threshold | 60 | 70 | 78 | 85 |
| Quality revisions allowed | 0 | 1 | 2 | 2 |
| Cross-artifact consistency check | No | No | No | Yes |
| Contradiction detection | No | No | Yes | Yes |
| Evidence requirement | Assertions permitted | Key claims sourced | All claims sourced | All claims sourced + coverage check |
| Independent perspectives | 1 | 1 | 2 where justified | 3 where justified |
| Artifact depth | Concise | Standard | Extended | Extended + appendices |

**Never exposed:** token counts, temperature, model selection, internal iteration
counters. Depth is a product-level concept.

## 16.3 Loop Termination — Mandatory Conditions

Every loop terminates when **any** of these is true:

1. Success criteria met
2. `maxIterations` reached
3. `maxDurationMs` elapsed
4. `maxEstimatedCostUsd` exceeded
5. Improvement between iterations < minimum threshold (diminishing returns)
6. User cancellation
7. Unrecoverable failure

On termination without meeting criteria: return the best result produced,
with explicit uncertainty stated in the output. Never return nothing. Never
silently claim success.

---

# PART XVII — OUTCOME CATALOG

Nine outcomes. Each is a product job, not a prompt template.

| # | Outcome | Product job | V1 status |
|---|---|---|---|
| 1 | **Build** | Turn an idea into a complete product definition | CURRENTLY IMPLEMENTED |
| 2 | **Research & Validate** | Determine whether an opportunity is worth pursuing | PHASE 2 |
| 3 | **Review & Improve** | Find what is wrong with an existing artifact | PHASE 2 |
| 4 | **Decide** | Choose between options with both sides argued | PHASE 3 |
| 5 | **Investigate** | Diagnose why something is happening in a live product | PHASE 3 |
| 6 | **Council Review** | Get independent expert assessments before committing | PHASE 3 |
| 7 | **Case Study** | Document product work as a portfolio-ready case study | PHASE 1 |
| 8 | **Prioritize** | Rank and sequence work with explicit rationale | PHASE 1 |
| 9 | **Plan** | Turn approved work into an executable plan | PHASE 1 |

**Continuous monitoring is deliberately NOT a tenth outcome.**

"Alert me when Competitor X materially changes" is not a distinct product job
requiring its own execution model. It is an existing outcome (Research) combined
with three orthogonal capabilities:

```
Continuous monitoring  =  Outcome (Research)
                        + Goal-Based Loop (Part XVI)
                        + Persistent evidence store (Part XIII)
                        + Scheduling / triggering (infrastructure)
```

Making it a tenth outcome would duplicate Research's entire contract to add a
scheduler. Treating it as a composition means any outcome becomes continuous
when combined with a loop and a trigger — Investigate could run weekly on a
metric, Review could run on every PRD revision. The composition is the general
capability; a "Monitor" outcome would be a narrow special case of it.

Documented as a composition in §18.10.

---

# PART XVIII — OUTCOME ENGINEERING CONTRACTS

Each contract answers 45 dimensions. For readability, related dimensions are
grouped. All 45 are addressed.

---

## 18.1 BUILD

**Product job:** Turn an idea into a complete, structured product definition
covering problem, solution, requirements, design, architecture, and delivery plan.

**Target user:** Founders, PMs starting a new initiative, product consultants,
innovation teams.

**Trigger:** A new idea or initiative exists and needs to be thought through
properly before commitment.

**Why this deserves to exist:** The work of taking an idea from sentence to
engineering-ready specification is structurally repeatable but universally redone
from scratch. It takes 2–4 weeks of PM time. Compressing it to under 30 minutes
while maintaining structure is genuine leverage.

**Why agentic execution is justified:** The output spans six distinct domains
(strategy, research, design, architecture, planning, quality). A single generalist
pass produces shallow coverage in each. Domain-specialized generation produces
materially better depth per domain.

**Why one LLM response is insufficient:** Context window limits alone make a
15-artifact output impossible in one response. Beyond that, later artifacts
depend on earlier decisions — a PRD must reflect the validated problem, not a
freshly invented one. Sequential dependency is real.

**Why this orchestration is appropriate:** Structured Delivery (sequential).
The dependency chain is genuine: you cannot write a PRD before defining the
problem. Parallelism would produce inconsistent artifacts.

**Input contract:** `intent` (idea description, ≥ 10 chars). Optional: target
market, constraints.

**Optional context:** Existing research, competitor documentation, brand or
technology constraints.

**Minimum sufficient capability set:** CO, PS, RE, UX, AR, QA.

**Why all six here:** the *currently defined* complete lifecycle produces
artifacts spanning strategy, research, design, architecture, planning and
quality. Each of the six capabilities owns at least one artifact in that set.

**This is not an architectural rule.** "Build" is not defined as "use six
capabilities." It is defined as "produce a complete product definition." The
capability set is derived from the artifact contract of the *current* lifecycle.
If the lifecycle is later reshaped — a shorter Build variant, a Build that skips
architecture for a non-technical product — the Strategy Router derives a
different capability set from the new artifact contract. Nothing in the
architecture requires Build to invoke six capabilities.

**Conditions justifying additional capabilities:** None in V1.

**Conditions justifying sub-agent delegation:** At depth `deep` or `exhaustive`,
RE may delegate market/competitor research. Not in V1.

**Auto-selected strategy:** Structured Delivery.

**Execution graph:**
```
CO(intake) → RE(discovery) → RE(problem) → PS(solution) → PS(mvp)
→ QA(validation) → PS(prioritize) → PS(prd) → UX(ux) → UX(usability)
→ AR(architecture) → AR(backlog) → PS(implementation) → QA(qa) → AR(prototype)
```

**Tools required:** artifact-write. Optionally file-read for context.

**Context requirements:** Journey state compressed to per-stage summaries
(~300 tokens each). Full prior outputs are not passed forward.

**Memory requirements:** None in V1.

**Intermediate state:** journey.json updated per completed step.
`.current-run.json` tracks live execution state.

**Intermediate artifacts:** One markdown artifact written per completed step.

**Final artifacts:** 15 markdown files + journey.json with per-stage reasoning
and confidence.

**Evaluation criteria:** completeness, logical-consistency, handoff-readiness.
Threshold 70. Evaluator: QA (via coordinator confidence assessment).

**Quality gates:** Step advances when the coordinator returns `decision: "go"`.
Max 2 iterations per step.

**Retry behavior:** Fallback model on API failure. Max 2 retries.

**Failure modes:**
| Failure | Behavior |
|---|---|
| API error | Fallback model → retry (max 2) |
| Both models fail | Write partial artifact with explicit warning → advance |
| Parse failure | Extract what is recoverable → flag in artifact → advance |
| Timeout on one step | Mark step incomplete → advance → note in final summary |

**Cancellation:** DELETE `/api/run` → SIGTERM → 5s grace → SIGKILL →
`.current-run.json` cleared. Completed artifacts persist. Partial artifacts remain
with a status marker.

**Loop policy:** No goal loop. Quality revision only, max 2 per step.

**Termination:** All planned steps complete, or cancellation, or unrecoverable
failure.

**Persistence:** Artifacts and journey.json on disk. Survive restart.

**Streaming events:** `stage_start`, `agent_active`, `stage_complete`,
`run_complete`, `stage_retry` on retry.

**Desk integration:** Artifacts appear in Workspace Explorer as completed.
Confidence drives health indicators.

**Studio integration:** Any artifact opens in the editor; improvement pipeline
applies.

**Mission Control integration:** Orchestration stream shows active capability
and PM-native action text.

**What should NOT be automated:** The decision to build. IdeaGate produces the
definition; the commitment decision is the PM's.

**Human decision boundary:** IdeaGate never decides to proceed. It produces
artifacts that inform a human decision.

**Trust requirements:** Medium. Output is a starting point the PM will edit.

**Evidence/provenance requirements:** Low in V1 (no external research).
Higher when context is provided — uploaded material must be cited.

**Expected failure cost:** Low. A weak artifact costs review time, not a bad
decision.

**Cost/latency:** ~15–30 minutes. Cost varies by model; historically ~$0.01–0.02
per full run on economical models.

**Definition of Done:** 15 artifacts exist. journey.json has 15 completed steps.
`run_complete` emitted. `isRunning` = false. Every artifact contains real content
(not error text).

**Current implementation status:** `CURRENTLY IMPLEMENTED`

---

## 18.2 RESEARCH & VALIDATE

**Product job:** Determine whether an opportunity is real and worth pursuing,
grounded in evidence rather than assertion.

**Target user:** PMs evaluating opportunities before committing roadmap capacity.
Founders before writing code. Consultants advising clients.

**Trigger:** "We're considering X. Is the market real? Should we build this?"

**Why this deserves to exist:** This is the highest-leverage PM decision point.
A wrong "yes" costs a quarter of engineering. Most PMs make this call on
intuition plus a few hours of searching because rigorous evidence gathering is
expensive. Making it cheap changes decision quality.

**Why agentic execution is justified:** Evidence gathering across market,
competitor, and user-problem axes is genuinely parallelizable. Each axis
requires different sources and different analysis. Independent gathering
produces better coverage than one sequential pass.

**Why one LLM response is insufficient:** An LLM answering "is this opportunity
real" produces a plausible-sounding answer from training data with no evidence
trail. The value here is *the evidence*, not the conclusion. A single response
cannot gather, cite, and assess coverage.

**Why this orchestration is appropriate:** Research First — evidence must be
gathered before any interpretation. Interpreting first and then finding
supporting evidence is motivated reasoning, which is exactly the failure mode
this outcome exists to prevent.

**Input contract:** `intent` (the opportunity hypothesis). Recommended:
target market, known competitors.

**Optional context:** Existing research, competitor URLs, analytics.

**Minimum sufficient capability set:** RE (primary), PS (business interpretation),
CO (synthesis). QA at depth ≥ deep for evidence coverage validation.

**Conditions justifying additional capabilities:** AR if technical feasibility is
a material factor in viability. UX if the opportunity hinges on a UX innovation.

**Conditions justifying sub-agent delegation:** At depth ≥ balanced. RE
decomposes into: market landscape, competitor analysis, user problem evidence,
pricing/business model. Four workers, independent axes, materially better
coverage than sequential.

**Delegation contract (per §11.2):**
1. Justification: independent evidence axes; parallel gathering improves coverage
2. Decomposed task: evidence gathering, split by evidence type
3. Owner: RE
4. Max workers: 4 (quick: 0, balanced: 2, deep: 4, exhaustive: 4)
5. Worker input: the hypothesis + its specific research axis + tool access
6. Worker output: `SubAgentResult` with finding, evidence, confidence
7. Validation: each worker's evidence must include ≥ 1 source reference
8. Merge: RE synthesizes; contradictions between workers are surfaced, not resolved silently
9. Partial failure: proceed with successful workers; state the coverage gap
10. Disagreement: both findings retained; contradiction flagged in output
11. Max concurrency: 4
12. Max depth: 1
13. Budget: per-depth allocation from ExecutionBudget
14. Termination: all workers complete or budget exhausted
15. Persistence: worker outputs retained in workspace for traceability

**Auto-selected strategy:** Research First.

**Execution graph:**
```
CO(frame the question)
  → RE(research lead)
       ├→ worker: market landscape
       ├→ worker: competitor analysis
       ├→ worker: user problem evidence
       └→ worker: business model / pricing
  → RE(synthesize findings, flag contradictions)
  → PS(interpret business implications)
  → QA(evidence coverage check)          [depth ≥ deep]
  → CO(recommendation with confidence)
```

**Tools required:** web-search (required), url-fetch, file-read, artifact-write.

**Context requirements:** RE receives full context bundle. PS receives RE's
synthesis, not raw worker output. CO receives synthesis + PS interpretation.

**Memory requirements:** If prior research exists in this workspace, include as
context so the mission builds on it rather than repeating it.

**Intermediate state:** Evidence accumulation per axis. Worker completion status.

**Intermediate artifacts:** Per-axis findings (retained for traceability).

**Final artifacts:** Research brief containing: market landscape, competitor
matrix, user problem evidence, assumption register with evidence status,
contradictions found, and an explicit recommendation —
**Build / Don't Build / Investigate Further** — with confidence and reasoning.

**Evaluation criteria:** evidence-quality, source-coverage,
contradiction-handling. Threshold 75. Evaluator: QA.

**Quality gates:** The recommendation must be one of three explicit values.
Every material claim must carry a source reference. If evidence coverage is
below threshold, the recommendation defaults to "Investigate Further" with
named gaps — never a confident recommendation on thin evidence.

**Retry behavior:** Standard technical retry. Web search failure → proceed with
in-context knowledge and explicitly flag the limitation in the output.

**Failure modes:**
| Failure | Behavior |
|---|---|
| Web search unavailable | Proceed without; flag limitation prominently |
| All workers fail | Fail the mission; do not produce a fake research brief |
| Contradictory evidence | Surface the contradiction; do not pick a side silently |
| Insufficient evidence | Recommendation = "Investigate Further" with named gaps |

**Cancellation:** Standard. Completed worker findings persist.

**Loop policy:** At depth `exhaustive`, a bounded goal loop may run: if evidence
coverage < threshold, generate targeted follow-up research. Max 3 iterations.
`PHASE 4`.

**Termination:** Recommendation produced with confidence, or bounds exhausted.

**Persistence:** Research brief + per-axis findings + evidence references.

**Streaming events:** Standard plus `subagent_start` / `subagent_complete`.

**Desk integration:** Research brief appears as an artifact. Evidence references
are linkable.

**Studio integration:** Brief can be edited and improved.

**Mission Control integration:** Stream shows research axes being worked in
parallel — this is a visually strong demonstration of real parallel execution.

**What should NOT be automated:** The build decision itself.

**Human decision boundary:** IdeaGate recommends. The PM decides.

**Trust requirements:** High. This output informs a resource commitment.
Traceability is essential — every claim needs a source.

**Evidence/provenance requirements:** Maximum. This is the outcome where
citation is non-negotiable.

**Expected failure cost:** High. A confidently wrong "Build" recommendation
could cost a quarter of engineering time. This is why the quality gate defaults
to "Investigate Further" on thin evidence.

**Cost/latency:** 10–25 minutes depending on depth and worker count.

**Definition of Done:** Research brief exists with all required sections, an
explicit three-way recommendation, confidence score, and source references for
every material claim.

**Current implementation status:** `PHASE 2` — requires web-search tool in the
Agent Harness and the Strategy Router. Sub-agent delegation is `PHASE 4`;
Phase 2 ships a sequential RE research pass producing the same artifact contract.

---

## 18.3 REVIEW & IMPROVE

**Product job:** Given an existing artifact, identify its gaps, weaknesses and
risks from multiple independent expert perspectives, ranked by severity.

**Target user:** PMs inheriting documentation. Teams preparing for design review.
PMs seeking a structured second opinion on their own work.

**Trigger:** "Here's a PRD. What's wrong with it?"

**Why this deserves to exist:** Reviewing your own work is structurally hard —
you cannot see what you did not think of. Getting four independent expert
perspectives normally requires scheduling four people.

**Why agentic execution is justified:** Independence is the entire value. Four
critiques that have not seen each other produce genuinely different findings.
One reviewer produces one perspective.

**Why one LLM response is insufficient:** A single pass asked to "review from
product, UX, technical and QA perspectives" produces four shallow sections
contaminated by a single reasoning thread. Independent invocations produce
genuinely independent findings.

**Why this orchestration is appropriate:** Parallel Critique. The assessors
must not see each other's output. Sequential review causes anchoring — the second
reviewer agrees with the first.

**Input contract:** The artifact (upload or workspace selection) — **required**.
`intent` describing what kind of review is wanted.

**Optional context:** Supporting documents, the artifact's intended audience,
known constraints.

**Minimum sufficient capability set:** Determined by document classification:

| Document type | Capabilities |
|---|---|
| PRD | PS, UX, AR, QA |
| Architecture doc | AR, QA (+ PS if strategic implications) |
| Roadmap | PS, QA |
| UX spec | UX, PS, QA |
| Research report | RE, PS, QA |

CO always performs synthesis.

**Conditions justifying additional capabilities:** Document content indicates a
domain not in the default set.

**Conditions justifying sub-agent delegation:** Not justified. Each critique is
one coherent assessment.

**Auto-selected strategy:** Parallel Critique.

**Execution graph:**
```
[classify document type] → [select assessors]
  parallel(
    PS critique → gaps
    UX critique → gaps
    AR critique → gaps
    QA critique → gaps
  )
  → CO synthesis(dedupe, rank by severity)
  → [optional] apply improvements → revised artifact
```

**Tools required:** file-read, artifact-write.

**Context requirements:** Each assessor receives the full artifact. Assessors do
**not** receive each other's output. CO receives all critiques.

**Intermediate artifacts:** Per-assessor critique (retained).

**Final artifacts:** Gap analysis with severity ranking (critical/major/minor),
each gap containing: description, why it matters, specific recommendation,
which perspective identified it, confidence. Optionally: a revised artifact.

**Evaluation criteria:** completeness, rationale-clarity. Threshold 70.
Evaluator: CO.

**Quality gates:** Minimum 3 identified gaps (if fewer, the artifact is either
excellent — state that explicitly — or the review was shallow, which fails).
Every gap must have a specific recommendation, not "consider improving X."

**Failure modes:**
| Failure | Behavior |
|---|---|
| Document unparseable | Fail with a specific message about the format |
| One assessor fails | Proceed with the rest; state which perspective is missing |
| No gaps found | State explicitly that the artifact meets the reviewed criteria |

**Cancellation:** Standard. Completed critiques persist.

**Loop policy:** If the user requests improvements applied, a bounded revision
loop runs: apply → evaluate → revise. Max 2 iterations.

**Termination:** Gap analysis produced, or improvements applied and validated.

**Streaming events:** Standard. Parallel critiques stream concurrently.

**Desk/Studio/Mission Control:** Gap analysis is an artifact. Revised artifact
opens in Studio. Stream shows concurrent critiques.

**What should NOT be automated:** Applying improvements without review. The
revised artifact is a proposal, not a replacement.

**Human decision boundary:** IdeaGate identifies gaps. The PM decides which to
act on.

**Trust requirements:** Medium-high. False positives waste time; false negatives
let real problems through.

**Evidence/provenance requirements:** Each gap must reference the specific
section of the artifact it concerns.

**Expected failure cost:** Medium. A missed critical gap could reach production.

**Cost/latency:** 5–12 minutes.

**Definition of Done:** Gap analysis with ≥ 3 gaps (or explicit statement that
the artifact is sound), each with severity, description, recommendation, and
source perspective.

**Current implementation status:** `PHASE 2` (sequential fallback) →
`PHASE 3` (true parallel). Requires context ingestion.

---

## 18.4 DECIDE

**Product job:** Given a decision with competing options, produce a rigorous
argument for each position and a synthesis that preserves genuine disagreement.

**Target user:** PMs facing build-vs-buy, pivot, platform, or kill decisions.
Anyone who must present a decision to leadership with defensible reasoning.

**Trigger:** "Should we do A or B?" where both have real merit.

**Why this deserves to exist:** The failure mode in product decisions is
motivated reasoning — building the case for what you already decided. A system
that argues both sides with equal rigor produces a decision record that survives
scrutiny.

**Why agentic execution is justified:** Genuine opposition requires genuine
independence. An agent instructed to "consider both sides" produces a balanced-
sounding single perspective. Two instances with opposing briefs produce actual
opposition.

**Why one LLM response is insufficient:** An LLM asked to argue both sides
hedges. It produces "on one hand… on the other hand…" without committing to
either. The value here is two *committed* positions and an explicit synthesis of
where they conflict.

**Why this orchestration is appropriate:** Debate. This is the only orchestration
that produces genuine opposition.

**Input contract:** The decision statement, the options, and why it is not
obvious. All required.

**Optional context:** Existing position documents, relevant data, constraints.

**Minimum sufficient capability set:** PS × 2 (opposing instances), CO (judge).

**Conditions justifying additional capabilities:** If the decision is primarily
technical, AR replaces or supplements PS as the debating capability. If UX is
the axis of disagreement, UX debates.

**Conditions justifying sub-agent delegation:** Not justified. Each position
must be a single coherent argument.

**Auto-selected strategy:** Red/Blue Debate.

**Execution graph:**
```
CO(frame the decision precisely)
  → PS[blue](argue FOR option A, with evidence)
  → PS[red](argue AGAINST option A / FOR option B, with evidence)
  → CO[judge](
       identify points of genuine conflict,
       assess evidence quality on each side,
       synthesize recommendation,
       preserve unresolved dissent explicitly
     )
```

Blue and Red do not see each other's output. The judge sees both.

**Tools required:** file-read, artifact-write. web-search if evidence gathering
is in scope.

**Context requirements:** Both positions receive identical context. Asymmetric
context would rig the debate.

**Intermediate artifacts:** Position A, Position B — both retained. These have
standalone value.

**Final artifacts:** Decision brief containing: decision framing, Position A
with evidence, Position B with evidence, explicit conflict map (where they
disagree and why), synthesis with recommendation, **preserved dissent** (what
the losing position raised that remains unaddressed), confidence, and a
recommended next step.

**Evaluation criteria:** argument-quality, tradeoff-coverage,
**dissent-preservation**. Threshold 80 — the highest of any outcome, because a
decision brief that smooths over disagreement is actively harmful.

**Quality gates:**
- Both positions must contain specific evidence, not assertion
- The synthesis **must** contain a dissent section — its absence is an automatic fail
- The recommendation must name what would change it

**Failure modes:**
| Failure | Behavior |
|---|---|
| One position fails to generate | Fail the mission — a one-sided debate is worse than none |
| Positions are substantially identical | Flag: the decision may not be a real trade-off |
| Judge produces no dissent section | Quality gate fails → revise |

**Cancellation:** Standard.

**Loop policy:** Quality revision on the synthesis only, max 1. Positions are
not revised — revising a position after seeing the other side destroys independence.

**Termination:** Synthesis produced with dissent preserved and quality gate passed.

**Streaming events:** Standard. The stream showing "Blue team building the case"
then "Red team challenging" is a strong observable demonstration.

**Desk/Studio/Mission Control:** Three artifacts. Decision brief is the primary
output; positions are supporting.

**What should NOT be automated:** The decision. IdeaGate produces the argument;
the human chooses.

**Human decision boundary:** Absolute. IdeaGate never decides.

**Trust requirements:** Very high. This output may be presented to leadership.

**Evidence/provenance requirements:** High. Both positions must cite.

**Expected failure cost:** Very high. A badly reasoned decision brief could
justify a wrong strategic choice.

**Cost/latency:** 8–20 minutes.

**Definition of Done:** Three artifacts. Synthesis contains recommendation,
trade-offs, explicit preserved dissent, confidence, and what would change the
recommendation.

**Current implementation status:** `PHASE 3` — requires the coordinator to
dispatch two instances of one capability with different framings.

---

## 18.5 INVESTIGATE

**Product job:** Given a symptom in a live product, diagnose likely root causes
with evidence for and against each, and design experiments to distinguish them.

**Target user:** PMs at companies with live products. Growth PMs. Anyone facing
a metric movement they do not understand.

**Trigger:** "Activation dropped 12% last week and I don't know why."

**Why this deserves to exist:** This is the most common real PM emergency and
the one least served by existing AI tools, because it requires the PM's own
product context. It is also the outcome that proves IdeaGate works for PMs
inside companies, not just founders.

**Why agentic execution is justified:** Diagnosis requires multiple specialist
lenses on the same evidence — a UX cause, a technical cause, and a market cause
look completely different and require different expertise to spot.

**Why one LLM response is insufficient:** Without the product's actual data,
an LLM produces generic hypotheses ("check your onboarding funnel"). The value
comes from analyzing the PM's real context, which requires ingestion, scoping,
and multi-lens analysis.

**Why this orchestration is appropriate:** Research First (analyze the evidence)
followed by Council (multi-lens interpretation). Diagnosis before interpretation.

**Input contract:** Symptom description with specifics (what changed, when, by
how much) — required. Product context — required.

**Required context:** At least one evidence source (analytics, user research,
support data, or product spec). Without evidence, this outcome cannot run —
reject at the Request Normalizer rather than producing speculation.

**Minimum sufficient capability set:** RE (evidence analysis), CO (synthesis),
plus specialists indicated by the symptom:

| Symptom type | Additional capabilities |
|---|---|
| Funnel/conversion drop | UX, PS |
| Performance/reliability | AR |
| Feature adoption | UX, PS |
| Churn/retention | PS, RE |
| Support volume spike | UX, QA |

**Conditions justifying additional capabilities:** The symptom classification
determines the set. Do not invoke AR for a copy-change-driven conversion drop.

**Conditions justifying sub-agent delegation:** RE may delegate per evidence
source (one worker per data source) when 3+ sources are provided. Each source
requires different analysis.

**Auto-selected strategy:** Research First → Council.

**Execution graph:**
```
CO(frame the investigation)
  → RE(analyze evidence)
       ├→ worker per evidence source   [if 3+ sources]
  → RE(synthesize what the evidence shows)
  → parallel(
       UX(diagnose from design/usability perspective),
       PS(diagnose from product/market perspective),
       AR(diagnose from technical perspective)    [if indicated]
     )
  → CO(rank hypotheses by evidence weight)
  → QA(design experiments to distinguish hypotheses)
```

**Tools required:** file-read (context), artifact-write. web-search if external
factors are plausible.

**Context requirements:** Maximum. This outcome is context-dependent by nature.
Each specialist receives context scoped to their lens.

**Memory requirements:** Prior investigations in this workspace are valuable
context — a recurring symptom is itself a finding.

**Intermediate artifacts:** Evidence analysis, per-lens diagnosis.

**Final artifacts:** Investigation brief: symptom restatement, evidence summary,
ranked hypotheses (each with supporting evidence, contradicting evidence, and
confidence), experiment designs to distinguish them, recommended first action.

**Evaluation criteria:** hypothesis-quality, falsifiability, experiment-quality.
Threshold 75.

**Quality gates:**
- Minimum 3 hypotheses
- Each hypothesis must have **both** supporting and contradicting evidence
  considered — one-sided hypotheses fail
- Each hypothesis must have a falsifiable test
- At least one experiment must be executable within a week

**Failure modes:**
| Failure | Behavior |
|---|---|
| Insufficient evidence | State what evidence is needed to proceed; do not speculate |
| Contradictory evidence | Surface it; contradiction is itself a finding |
| No plausible hypothesis | State that explicitly; recommend what data to gather |

**Cancellation:** Standard.

**Loop policy:** `PHASE 4` — if hypothesis confidence is uniformly low, a
bounded loop may request targeted additional analysis. Max 2 iterations.

**Termination:** Ranked hypotheses with experiments produced.

**Streaming events:** Standard plus per-source analysis events.

**Desk/Studio/Mission Control:** Investigation brief is the artifact.
Experiments could later feed a Plan mission.

**What should NOT be automated:** Concluding a root cause. IdeaGate produces
ranked hypotheses, never a definitive cause claim — that requires the experiment
to run.

**Human decision boundary:** IdeaGate hypothesizes. Reality decides.

**Trust requirements:** High.

**Evidence/provenance requirements:** Maximum. Every hypothesis must cite the
specific evidence supporting and contradicting it.

**Expected failure cost:** High. A wrong diagnosis leads to fixing the wrong thing.

**Cost/latency:** 12–25 minutes.

**Definition of Done:** ≥ 3 ranked hypotheses, each with evidence for/against,
confidence, and a falsifiable experiment. First recommended action named.

**Current implementation status:** `PHASE 3` — requires context ingestion
(Phase 2) and parallel execution (Phase 3).

---

## 18.6 COUNCIL REVIEW

**Product job:** Obtain independent expert assessments of a proposal before
committing, surfacing blind spots and disagreement.

**Target user:** PMs before stakeholder review. Teams running pre-mortems.

**Trigger:** "Before I take this to leadership, what will they challenge?"

**Why this deserves to exist:** Pre-mortems work but require assembling people.
Simulating independent expert assessment surfaces blind spots at zero
coordination cost.

**Why agentic execution is justified:** Independence is the mechanism. Each
assessor evaluating without seeing others produces genuinely different concerns.

**Why one LLM response is insufficient:** Same contamination problem as Review.
One reasoning thread produces one perspective wearing four hats.

**Why this orchestration is appropriate:** Council (vote/consensus). Council
differs from Parallel Critique in output: Council produces *scored assessments
with confidence*, aggregated into a recommendation. Critique produces *gaps*.

**Input contract:** The proposal, decision, or artifact — required. The
dimensions that matter — required.

**Minimum sufficient capability set:** Selected by relevance to the question.
**Council does not automatically invoke all specialists.** A pricing decision
does not need UX. Router selects based on the dimensions named in the input.

**Conditions justifying sub-agent delegation:** At depth `exhaustive`, a
specialist may delegate sub-analyses within their domain (PS → pricing analyst +
positioning analyst). Justified when the domain has genuinely separable
sub-questions.

**Auto-selected strategy:** Council.

**Execution graph:**
```
CO(frame what is being assessed)
  → parallel(
       specialist₁ assess → {assessment, confidence 0-100, primary concern},
       specialist₂ assess → {assessment, confidence, concern},
       ...
     )
  → aggregate(scores, identify agreement and disagreement)
  → CO synthesis(recommendation, agreement map, dissent map, weighted confidence)
```

**Quality gates:**
- Every assessor must return a numeric confidence
- If mean confidence < 70, the output must explicitly flag low-confidence areas
- Dissent must be preserved, not averaged away

**Final artifacts:** Council report: per-assessor assessment with confidence,
agreement map, dissent map, aggregate recommendation, weighted confidence.

**Evaluation criteria:** source-coverage, dissent-preservation, rationale-clarity.
Threshold 75.

**What should NOT be automated:** Treating the aggregate as a decision. Council
informs.

**Expected failure cost:** Medium-high.

**Current implementation status:** `PHASE 3` — requires parallel execution.

---

## 18.7 CASE STUDY

**Product job:** Structure product work as a rigorous case study in the format
product organizations expect.

**Target user:** PMs building portfolios, preparing for interviews, or
documenting decisions for organizational learning.

**Trigger:** "I led this initiative and need to write it up properly."

**Why this deserves to exist:** PMs consistently under-document their best work
because the structure is non-obvious. A system that enforces the structure
produces materially better narratives.

**Why agentic execution is justified — honestly assessed:** **Weakly.** This is
primarily a structured generation task. The justification for multiple
capabilities is that PM reasoning (PS), evidence framing (RE) and narrative
synthesis (CO) are genuinely different skills, and the resulting sections are
noticeably better when generated by differently-framed invocations. But this is
a smaller effect than in Research or Decide.

**Why one LLM response is insufficient:** Marginally. A single well-structured
prompt produces a decent case study. Three framed invocations produce a better
one. This outcome exists because the *structure* has value, not because the
orchestration does.

**This honesty matters:** it demonstrates that IdeaGate adds agents when they
help and does not pretend they always do.

**Why this orchestration is appropriate:** Structured Delivery — the narrative
has genuine sequential dependency (you cannot write the outcome before the
decision).

**Minimum sufficient capability set:** CO, PS, RE. UX/AR/QA add nothing to a
retrospective narrative.

**Conditions justifying additional capabilities:** If the case study concerns a
technical decision, AR may frame the technical reasoning section.

**Conditions justifying sub-agent delegation:** Never. Narrative coherence
requires single authorship.

**Input contract:** What happened — the situation, the actions, the outcome.

**Optional context:** Metrics, timeline, artifacts from the project, constraints.

**Final artifacts:** Case study with: problem and context, constraints and
success criteria, research and evidence considered, options evaluated, decision
and rationale, trade-offs acknowledged, execution approach, outcome and metrics,
learnings, what I would do differently.

**Evaluation criteria:** factual-integrity, rationale-clarity, completeness.
Threshold 70.

**Quality gates:**
- Every claim must trace to something the user provided — **no invented metrics**
- If the user provided no outcome data, the outcome section must say so rather
  than inventing plausible numbers
- The "what I'd do differently" section must be substantive, not platitudes

**Failure modes:**
| Failure | Behavior |
|---|---|
| Insufficient input detail | Ask specific follow-up questions rather than inventing |
| No metrics provided | Outcome section states this explicitly |

**What should NOT be automated:** Facts. IdeaGate structures the narrative; the
user supplies the truth.

**Trust requirements:** High — this may be presented in interviews. Fabricated
detail is a serious failure.

**Evidence/provenance requirements:** High in a specific sense: everything must
come from user input.

**Expected failure cost:** High reputationally if fabricated content reaches an
interview.

**Cost/latency:** 5–10 minutes.

**Definition of Done:** Case study with all ten sections, every factual claim
traceable to user input.

**Current implementation status:** `PHASE 1 BUILDABLE NOW` — requires Strategy
Router mapping and case-study output framing per capability. No new orchestration,
no new tools, no new agents.

---

## 18.8 PRIORITIZE

**Product job:** Rank and sequence a set of candidate work items with explicit,
defensible rationale.

**Target user:** PMs running planning cycles. Product leads sequencing roadmaps.

**Trigger:** "I have 30 backlog items and capacity for 8."

**Why this deserves to exist:** Prioritization frameworks are well-known but
tediously applied. Consistent application across 30 items is exactly what a
system does better than a human under time pressure.

**Why agentic execution is justified — honestly assessed:** **Modestly.** Two
capabilities: PS applies the framework, QA validates dependencies. The dependency
check is a genuinely different task from scoring and benefits from separate
execution.

**Why one LLM response is insufficient:** For a small list, it is sufficient.
For 20+ items with dependencies, consistency degrades and dependency conflicts
are missed. The separate QA pass catches sequencing errors that scoring alone
misses.

**Why this orchestration is appropriate:** Structured Delivery, two steps.
Not parallel — the dependency check needs the ranking to check.

**Minimum sufficient capability set:** PS, QA. **Explicitly not** RE, UX, AR, CO.

**Conditions justifying additional capabilities:** If items require effort
estimation and none is provided, AR may estimate. If strategic alignment is
contested, a Council sub-mission may be warranted — but that is a different
outcome.

**Conditions justifying sub-agent delegation:** Never. Consistent scoring
requires single-scorer consistency. Parallel scoring produces incomparable scores.

**Input contract:** The list of items — required, minimum 3.

**Optional context:** Strategic goals, user value data, effort estimates,
known dependencies, capacity constraints.

**Auto-selected strategy:** Structured Delivery.

**Execution graph:**
```
PS(select framework based on available data, apply consistently, rank)
  → QA(validate dependencies, check sequencing feasibility, flag conflicts)
  → [PS revises if QA finds conflicts, max 1 revision]
```

**Framework selection logic (deterministic, not LLM):**
| Available data | Framework |
|---|---|
| Reach, impact, confidence, effort all present | RICE |
| Only relative importance | MoSCoW |
| User satisfaction dimension present | Kano |
| Effort + value only | Value/Effort matrix |

**Final artifacts:** Ranked list with per-item score breakdown, framework used
and why, dependency map, recommended sequence, and trade-offs of this ranking
(what is being deprioritized and the cost of that).

**Evaluation criteria:** scoring-consistency, dependency-correctness,
rationale-clarity. Threshold 75.

**Quality gates:**
- Every item must be scored on every dimension the framework requires
- No item may be scored on a dimension for which no data exists — mark unknown
- Dependency violations must be flagged, not silently reordered

**Failure modes:**
| Failure | Behavior |
|---|---|
| Insufficient data for any framework | Use Value/Effort with explicit assumptions stated |
| Circular dependencies | Flag them; do not invent a resolution |

**What should NOT be automated:** The final priority call. Strategic priorities
involve organizational context IdeaGate does not have.

**Human decision boundary:** IdeaGate ranks by stated criteria. The PM applies
judgment IdeaGate cannot.

**Trust requirements:** Medium.

**Expected failure cost:** Medium.

**Cost/latency:** 3–8 minutes.

**Definition of Done:** Ranked list, framework stated, per-item scoring shown,
dependencies validated, trade-offs named.

**Current implementation status:** `PHASE 1 BUILDABLE NOW`

---

## 18.9 PLAN

**Product job:** Turn approved work into an engineering-ready execution plan.

**Target user:** PMs moving from definition to delivery. PMs preparing handoff.

**Trigger:** "This is approved. Now I need it broken down for engineering."

**Why this deserves to exist:** The definition-to-execution translation is where
PM work most often becomes ambiguous. A structured decomposition with acceptance
criteria and dependencies is directly usable by an engineering team.

**Why agentic execution is justified:** Three genuinely different skills:
decomposition (AR), sequencing under constraint (PS), and acceptance criteria
definition (QA).

**Why one LLM response is insufficient:** A single pass produces a task list.
It rarely produces correct dependency ordering or testable acceptance criteria,
because those require different reasoning modes.

**Why this orchestration is appropriate:** Structured Delivery — decomposition
must precede sequencing, which must precede acceptance criteria.

**Minimum sufficient capability set:** AR, PS, QA.

**Conditions justifying additional capabilities:** UX if the work includes
design deliverables that need their own breakdown.

**Conditions justifying sub-agent delegation:** Never — the breakdown must be
internally consistent.

**Input contract:** Approved feature/initiative description or PRD — required.

**Optional context:** Technical constraints, team capacity, timeline,
existing architecture.

**Execution graph:**
```
AR(decompose into epics → stories → tasks)
  → PS(sequence by dependency and value, propose sprint allocation)
  → QA(write acceptance criteria per story, identify risks and blockers)
```

**Final artifacts:** Epic/story/task hierarchy, acceptance criteria per story,
dependency map, suggested sequence, risk and blocker register.

**Evaluation criteria:** completeness, dependency-correctness, handoff-readiness.
Threshold 80 — high, because the output goes to engineering.

**Quality gates:**
- Every story must have acceptance criteria
- Every acceptance criterion must be testable (not "works well")
- No circular dependencies
- Every task must map to a story; every story to an epic

**Connection to Kanban:** The output of Plan is the correct input for a Kanban
view. Epics and stories from Plan populate Kanban columns. This is the intended
long-term Kanban architecture — Kanban should visualize *work*, not mirror
lifecycle artifacts.

**What should NOT be automated:** Capacity commitment. IdeaGate proposes a
sequence; the team commits.

**Trust requirements:** High — engineering will act on this.

**Expected failure cost:** Medium-high. Bad acceptance criteria cause rework.

**Cost/latency:** 5–12 minutes.

**Definition of Done:** Complete hierarchy with acceptance criteria per story,
validated dependency ordering, risk register.

**Current implementation status:** `PHASE 1 BUILDABLE NOW`

---

## 18.10 CONTINUOUS EXECUTION — A Composition, Not an Outcome

**What it is:** Any outcome, executed repeatedly against a persistent evidence
base, surfacing output only when a materiality threshold is crossed.

**Not a tenth outcome.** See Part XVII. Continuous execution is the composition:

```
existing Outcome  +  Goal-Based Loop  +  Persistent evidence store  +  Trigger
```

**Worked instance — continuous competitive intelligence:**
```
Outcome:   research
Goal:      "surface material changes in Competitor X's product or pricing"
Loop:      goal-based, triggered on schedule rather than user action
Evidence:  persistent store, versioned per execution
Bounds:    per-execution iteration/duration/cost limits (Part XVI §16.3)
Output:    emitted only when change materiality exceeds threshold
```

**Other instances the same composition enables:**
- Investigate + trigger on metric threshold breach → automated diagnosis
- Review + trigger on artifact change → continuous document quality check
- Research + trigger on schedule → market landscape tracking

**Why this framing matters architecturally:** if Monitor were an outcome, adding
"continuous investigation" would require an eleventh outcome, "continuous review"
a twelfth. As a composition, continuity is a property any outcome can acquire.

**Architecture required:**
```
Goal definition (what constitutes "material change")
  → periodic research execution
  → evidence store (persistent, versioned)
  → change detection (compare current evidence to prior state)
  → materiality evaluation (is this change worth surfacing?)
  → notification or no-op
  → bounded continuation
```

**Why it cannot ship earlier:** Requires persistent evidence store (Part XIII),
memory model (Part XIV), goal-based loop (Part XVI), and scheduled execution
infrastructure — none of which exist.

**Current implementation status:** `FUTURE ARCHITECTURE`

---

# PART XIX — MISSION COMPOSER UX

## 19.1 Reference Feel

Linear (simple by default, powerful when needed) + Raycast (progressive reveal) +
Notion AI (calm, understands intent).

**Must not feel like:** an engineering control panel, a settings dashboard, a
wizard, a form, an AI demo, a list of agents, a workflow builder.

## 19.2 States

**COLLAPSED (default)**
A single input. Placeholder: "What do you want to accomplish?"
A primary action button. Nothing else visible.
Pressing the action with no configuration runs with defaults.

**EXPANDED (on focus or explicit expand)**
The input remains at top, now multi-line.
Below: Outcome selection, Depth selection, Context attachment.
An "Advanced" disclosure containing orchestration override.
At the bottom: a plain-language summary of what will happen, and the run action.

**RUNNING**
Composer collapses. The orchestration stream takes over the surface.

## 19.3 What the Expanded State Shows

```
What do you want to accomplish?
[                                                    ]

OUTCOME
  ○ Build              Turn an idea into a complete product definition
  ○ Case Study         Document product work as a portfolio case study
  ○ Prioritize         Rank and sequence work with clear rationale
  ○ Plan               Turn approved work into an execution plan
  
  ── Available in Phase 2 ──────────────────────────
  ○ Research & Validate    (muted, not selectable)
  ○ Review & Improve       (muted, not selectable)

DEPTH
  [ Quick ] [ Balanced ] [ Deep ] [ Exhaustive ]

CONTEXT
  + Attach files    + Add URL    + Use workspace artifacts

▸ Advanced

────────────────────────────────────────────────
This will produce a complete product definition
using multiple specialists.
                                    [ Run Mission ]
```

## 19.4 The Mission Summary

A plain-language sentence describing what will happen. Generated from the actual
ExecutionPlan characteristics, not from a template with fake numbers.

Valid: "This will produce a complete product definition using multiple specialists."
Valid: "This will rank your items and validate dependencies."
Invalid: "6 agents · 15 artifacts · ~18 minutes" — unless those numbers are real
and derived from the plan.

## 19.5 Time Estimates — Only If Real

Do not show a time estimate until the system can derive one from actual
historical execution data for that outcome and depth combination.

Until then: show nothing, or show a range only after ≥ 10 completed runs of that
configuration exist.

## 19.6 Complexity Estimation — Removed

The keyword-heuristic complexity estimator ("contains 'platform' → Platform tier")
is removed from this specification. It is a gimmick that produces confident-looking
output with no basis.

Future complexity estimation, if built, derives from the actual ExecutionPlan:
step count, capability count, context size, delegation count, evaluation passes.
That is a real signal. Keywords are not.

## 19.7 Progressive Disclosure Rules

| Level | Visible |
|---|---|
| Default | Intent input + run action |
| Expanded | Outcome, Depth, Context |
| Advanced | Orchestration override, evaluation threshold override |
| Never | Stages, models, tokens, topology, prompt internals |

---

# PART XX — STREAMING AND OBSERVABILITY

## 20.1 One Event Model, All Missions

Every orchestration type emits the same event contract. The UI adapts its
rendering; it does not maintain separate orchestration logic per outcome.

```typescript
interface MissionEvent {
  type: MissionEventType;
  runId: string;
  timestamp: number;
  
  stepId?: string;
  capability?: CapabilityId;
  instanceRole?: string;
  
  /** PM-native description of what is happening. Never implementation text. */
  activity?: string;
  
  subAgentId?: string;
  evaluationResult?: EvaluationSummary;
  message?: string;
}

type MissionEventType =
  | 'mission_start'
  | 'step_start'
  | 'step_complete'
  | 'step_retry'
  | 'subagent_start'
  | 'subagent_complete'
  | 'evaluation_start'
  | 'evaluation_pass'
  | 'evaluation_fail'
  | 'revision_start'
  | 'loop_iteration'
  | 'artifact_written'
  | 'mission_complete'
  | 'mission_failed'
  | 'mission_cancelled';
```

## 20.2 Activity Text Must Be PM-Native

| Never | Instead |
|---|---|
| "ResearchAgent · ACTIVE" | "Researching competitor pricing" |
| "Stage 8 · running" | "Designing interaction flows" |
| "parallel dispatch: 4 workers" | "Gathering evidence across four areas" |
| "PS[blue] invoked" | "Building the case for this approach" |
| "eval score 62, iterate" | "Checking evidence coverage" |

## 20.3 The Orchestration Stream

Universal component. Behavior:
- One active activity at a time, with visible progress indication
- Completed activities accumulate as history, most recent nearest the active row
- Older history fades progressively
- Maximum visible history bounded (4–6 rows)
- On completion: final state shown, then collapses to a summary

The same component serves Build, Research, Review, Decide, Council, Investigate,
Case Study, Prioritize, Plan, and any future outcome. Only the event stream
differs.

**Status:** `PARTIALLY IMPLEMENTED` — an orchestration stream component exists;
the universal event model does not.

---

# PART XXI — WORKSPACE AND ARTIFACT PERSISTENCE

## 21.1 Storage Model

Plain files on disk. Markdown for content. JSON for state. Git-versioned.
No database in V1. This is a deliberate zero-cost architectural decision.

## 21.2 Structure

```
workspace/
  {project-id}/
    artifacts/           # mission outputs (markdown)
    context/             # uploaded context, original + extracted
    evidence/            # research findings, per-source
    journey.json         # execution state and reasoning
    memory.json          # derived cross-mission memory (Phase 4)
    runs/
      {run-id}/
        plan.json        # the ExecutionPlan (for audit)
        events.jsonl     # the full event stream
```

## 21.3 Content and Metadata Never Mix

Artifact prose lives in `.md`. Machine state lives in `.json`. Siblings, never
nested. This is an existing architectural principle and remains binding.

## 21.4 Artifact Contract

Every mission declares what artifacts it will produce before executing.
The contract is part of the ExecutionPlan. A mission that produces artifacts
not in its contract is a bug.

**Status:** `CURRENTLY IMPLEMENTED` for artifacts and journey.json.
`NOT YET IMPLEMENTED` for plan.json, events.jsonl, evidence/, memory.json.

---

# PART XXII — DESK / STUDIO / MISSION CONTROL INTEGRATION

## 22.1 Surface Responsibilities

| Surface | Question it answers |
|---|---|
| **Desk** | What is the state of my product thinking, and what needs attention? |
| **Studio** | How do I read and improve this artifact? |
| **Mission Control** | What is the system doing right now, and how did it get here? |

These are three views of the same underlying run state. None maintains its own
orchestration logic.

## 22.2 Integration Requirements Per Surface

**Desk**
- Artifacts appear as they are written
- Health state derived from evaluation results
- The Mission Composer lives here
- Outcome type is visible per artifact set

**Studio**
- Any artifact opens in the editor
- Improvement pipeline applies to any artifact regardless of producing outcome
- Context used to produce an artifact is inspectable

**Mission Control**
- Live orchestration stream
- Execution plan visualization (which capabilities, what order)
- Evaluation results per step
- Historical runs with their plans and events

**Status:** Desk and Studio integration `CURRENTLY IMPLEMENTED` for Build.
Mission Control shows live agent activity. Plan visualization is `PHASE 3`.

---

# PART XXIII — SECURITY, CANCELLATION, FAILURE HANDLING

## 23.1 Cancellation

Cancellation must be immediate and safe from any state.

```
User cancels
  → cancellation token set
  → in-flight agent invocations receive the token and abort
  → running sub-agents terminated
  → completed artifacts retained
  → partial artifacts marked with status
  → run state set to 'cancelled'
  → mission_cancelled event emitted
  → process terminated (SIGTERM → 5s → SIGKILL)
  → lock files cleared
```

**Critical:** cancellation must clear `.current-run.json`. Failure to do so
causes false "run active" state on next session — a bug that has occurred in
this system before.

## 23.2 Failure Taxonomy

| Failure | Scope | Response |
|---|---|---|
| Tool failure | One invocation | Retry with backoff (max 2), then proceed without the tool, flag limitation |
| Model failure | One invocation | Fallback model, then partial output with warning |
| Step failure | One step | Depends on `dependsOn`: if others depend on it, fail forward with a marker; if not, skip and note |
| Sub-agent failure | One worker | Proceed with successful workers; state coverage gap |
| Evaluation failure | One step | Revise (bounded) or accept with warning per policy |
| Budget exhaustion | Whole mission | Complete current step, then stop; return partial results with explicit statement |
| Unrecoverable | Whole mission | Fail cleanly; persist what exists; clear locks; emit `mission_failed` |

## 23.3 Never Fail Silently

Every failure produces either a visible warning in the output or an explicit
error state. A mission that appears to succeed while having failed internally
is the worst failure mode.

## 23.4 Resource Bounds — All Mandatory

Every mission has enforced bounds on: total steps, concurrent steps, wall-clock
duration, estimated cost, sub-agent count, loop iterations. Enforcement is
deterministic code, not LLM judgment.

---

# PART XXIV — CAPABILITY STATUS MATRIX

| Capability | Status |
|---|---|
| Six primary capabilities (CO/PS/RE/UX/AR/QA) | CURRENTLY IMPLEMENTED |
| Sequential orchestration | CURRENTLY IMPLEMENTED |
| Build outcome (15-artifact lifecycle) | CURRENTLY IMPLEMENTED |
| Journey state persistence | CURRENTLY IMPLEMENTED |
| Artifact persistence | CURRENTLY IMPLEMENTED |
| SSE event streaming | CURRENTLY IMPLEMENTED |
| Technical retry with fallback model | CURRENTLY IMPLEMENTED |
| Bounded per-step iteration (max 2) | CURRENTLY IMPLEMENTED |
| Cancellation | CURRENTLY IMPLEMENTED |
| Single-artifact improvement | CURRENTLY IMPLEMENTED |
| Desk / Studio / Mission Control surfaces | CURRENTLY IMPLEMENTED |
| — | — |
| RunConfig contract | NOT YET IMPLEMENTED — Phase 1 |
| Request Normalizer | NOT YET IMPLEMENTED — Phase 1 |
| Strategy Router | NOT YET IMPLEMENTED — Phase 1 |
| ExecutionPlan contract | NOT YET IMPLEMENTED — Phase 1 |
| Outcome routing (casestudy/prioritize/plan) | NOT YET IMPLEMENTED — Phase 1 |
| Depth policy bundle | NOT YET IMPLEMENTED — Phase 1 |
| Mission Composer UI | NOT YET IMPLEMENTED — Phase 1 |
| — | — |
| Agent Harness formal boundary | NOT YET IMPLEMENTED — Phase 2 |
| Context ingestion pipeline | NOT YET IMPLEMENTED — Phase 2 |
| Web search tool | NOT YET IMPLEMENTED — Phase 2 |
| URL fetch tool | NOT YET IMPLEMENTED — Phase 2 |
| Research & Validate outcome | NOT YET IMPLEMENTED — Phase 2 |
| Review & Improve outcome (sequential) | NOT YET IMPLEMENTED — Phase 2 |
| Outcome inference from intent | NOT YET IMPLEMENTED — Phase 2 |
| — | — |
| Parallel execution primitive | NOT YET IMPLEMENTED — Phase 3 |
| Debate primitive | NOT YET IMPLEMENTED — Phase 3 |
| Vote/consensus primitive | NOT YET IMPLEMENTED — Phase 3 |
| Dimensional evaluation system | NOT YET IMPLEMENTED — Phase 3 |
| Quality revision loop | PARTIALLY IMPLEMENTED — Phase 3 for full policy |
| Decide outcome | NOT YET IMPLEMENTED — Phase 3 |
| Council outcome | NOT YET IMPLEMENTED — Phase 3 |
| Investigate outcome | NOT YET IMPLEMENTED — Phase 3 |
| Universal event model | PARTIALLY IMPLEMENTED — Phase 3 |
| — | — |
| Sub-agent delegation | NOT YET IMPLEMENTED — Phase 4 |
| Goal-based loop | NOT YET IMPLEMENTED — Phase 4 |
| Memory model | NOT YET IMPLEMENTED — Phase 4 |
| Context retrieval / embeddings | NOT YET IMPLEMENTED — Phase 4 |
| Planner-Executor-Verifier recipe | FUTURE ARCHITECTURE |
| Continuous execution (composition, not an outcome) | FUTURE ARCHITECTURE |

---

# PART XXV — PHASED BUILD PLAN

## Phase 1 — Prove the Architecture

**Objective:** Demonstrate the full pipeline end-to-end with real outcomes.
Not to build every feature.

The slice that proves the architecture:
```
Mission Composer → RunConfig → Normalizer → Strategy Router
→ ExecutionPlan → existing engine → real artifacts → workspace → surfaces
```

**Scope:**
- RunConfig with `intent`, `outcome`, `depth`
- Request Normalizer with validation
- Strategy Router mapping four outcomes to capability sets and internal steps
- ExecutionPlan produced and persisted to `runs/{id}/plan.json`
- Four outcomes genuinely executing differently:
  - **Build** — capability set derived from the current lifecycle's artifact
    contract, which spans all six domains (no engine change)
  - **Case Study** — CO/PS/RE, case-study framing, ten-section output
  - **Prioritize** — PS/QA only, framework application + dependency validation
  - **Plan** — AR/PS/QA, decomposition + sequencing + acceptance criteria
- Depth policy affecting evaluation threshold and revision allowance
- Mission Composer UI with the four outcomes and depth selector
- Muted, non-selectable entries for Phase 2/3 outcomes with phase labels

**Explicitly out of scope:** context ingestion, web search, parallel execution,
debate, council, sub-agents, loops, intelligence module toggles, complexity
estimation, time estimates.

**Non-negotiable:** each of the four outcomes must produce a genuinely different
artifact set using a genuinely different capability set. If Prioritize invokes all
six capabilities and produces a 15-artifact lifecycle, Phase 1 has failed.

## Phase 2 — Context and Evidence

- Agent Harness as a formal boundary
- Context ingestion: upload → parse → classify → scope
- Web search and URL fetch tools
- Research & Validate outcome (sequential RE research, no sub-agents yet)
- Review & Improve outcome (sequential critique fallback)
- Outcome inference with confirmation

## Phase 3 — Multi-Perspective Orchestration

- Parallel execution primitive
- Debate primitive
- Vote/consensus primitive
- Dimensional evaluation system
- Decide, Council, Investigate outcomes
- Parallel critique for Review
- Universal event model across all orchestrations

## Phase 4 — Delegation and Continuity

- Bounded sub-agent delegation
- Goal-based loop with full bounds enforcement
- Memory model
- Context retrieval with embeddings
- Research with parallel workers

---

# PART XXVI — DEFINITION OF DONE

## Phase 1 DoD

Phase 1 is complete when all of the following are true:

1. A user can select each of four outcomes in the Mission Composer
2. Each outcome produces a demonstrably different artifact set
3. Each outcome invokes a demonstrably different capability set
   (verifiable in `runs/{id}/plan.json`)
4. Depth selection changes evaluation threshold and revision allowance
   (verifiable in the persisted plan)
5. The ExecutionPlan is persisted for every run
6. No lifecycle stage numbers appear anywhere in the UI
7. No control is present that does not affect execution
8. Artifacts appear in Desk, are editable in Studio, and execution is visible
   in Mission Control for all four outcomes
9. Cancellation works from any state and clears all lock files
10. A completed run leaves no stale state that affects the next run

## Per-Outcome DoD

Each outcome's individual Definition of Done is stated in its contract (Part XVIII).

---

# PART XXVII — ENGINEERING ACCEPTANCE CRITERIA

Criteria that any implementation must satisfy, verified by observation, not by
compilation.

## 27.1 Architectural

- [ ] Strategy Router is deterministic: same RunConfig → same ExecutionPlan
- [ ] ExecutionPlan is never exposed to the UI layer
- [ ] No LLM call decides state transition, progression, or completion
- [ ] Every loop has enforced bounds in deterministic code
- [ ] Sub-agent spawn depth is enforced at 1
- [ ] The CLI/UI boundary is unchanged

## 27.2 Behavioral

- [ ] Selecting Prioritize does not run a 15-artifact lifecycle
- [ ] Selecting Case Study produces a case study, not a PRD
- [ ] Depth: Quick and Depth: Exhaustive produce observably different output
- [ ] Cancellation from any state leaves no stale lock
- [ ] A failed step produces a visible warning, never a silent gap

## 27.3 Honesty

- [ ] No UI control exists that does not affect execution
- [ ] No time estimate is shown without real historical basis
- [ ] No complexity estimate is shown without a real derivation
- [ ] Every "future" capability is labeled with its phase
- [ ] No capability is described as implemented without repository evidence

## 27.4 Observability

- [ ] Every mission emits the universal event model
- [ ] Activity text is PM-native, never implementation text
- [ ] The plan and event stream are persisted for every run
- [ ] A completed run is fully reconstructible from persisted state

## 27.5 Verification Method

Acceptance is verified in a real browser running a real mission — not by
TypeScript compilation, not by a passing build, not by a component rendering
without error. The observable behavior is the criterion.

---

# PART XXVIII — OPEN DECISIONS AND EXPLICIT DEFERRALS

## 28.1 Open Decisions

| Decision | Options | Deferred until |
|---|---|---|
| Where the Strategy Router lives | CLI engine vs. API route layer | Phase 1 implementation start |
| Whether outcome inference uses an LLM or rules | LLM classifier vs. keyword rules vs. hybrid | Phase 2 |
| Evidence store format | JSONL append-only vs. per-source files vs. SQLite | Phase 4 |
| Memory generation trigger | Every run vs. explicit vs. scheduled | Phase 4 |
| Whether Council confidence is model-reported or externally evaluated | Self-report vs. QA assessment | Phase 3 |

## 28.2 Explicit Deferrals

These are consciously not being built and the reasons are recorded:

| Deferred | Reason |
|---|---|
| Multi-user / auth | Not required for the core product thesis; adds infrastructure before product-market validation |
| Real-time collaboration | Requires auth; requires a persistence backend change |
| Database migration | Filesystem storage is sufficient and zero-cost at current scale |
| Agent marketplace / custom agents | Would multiply surface area before core outcomes are proven |
| Autonomous continuous execution | Violates the human-decision-boundary principle |
| Swarm-style emergent orchestration | No product problem requires it; bounded delegation covers the real need |

## 28.3 Explicitly Rejected

| Rejected | Reason |
|---|---|
| Keyword-based complexity estimation | Produces confident output with no basis |
| Exposing agent selection as a user control | Users should describe jobs, not configure topology |
| "Swarm" as product terminology | Imprecise; implies uncontrolled behavior |
| Unbounded goal loops | Safety and cost risk with no product justification |
| Nine independent feature implementations | Defeats the shared-architecture thesis |

---

# PART XXIX — ARTIFACT REPRESENTATION MODEL

## 29.1 The Product Requirement

IdeaGate must not ultimately produce "AI-generated documents" — blocks of
Markdown prose that a PM reads once and abandons.

It must produce **professional PM artifacts**: structured objects containing
decisions, evidence, entities, relationships, and — where it genuinely helps —
native visual representations of that information.

The distinction is not cosmetic. A PRD that contains a dependency graph is more
useful than a PRD that describes dependencies in a paragraph, because the graph
can be checked, extended, and consumed by downstream work. A decision matrix is
more useful than a paragraph comparing options, because it makes the comparison
dimensions explicit and complete.

## 29.2 The Three-Layer Artifact Model

Every IdeaGate artifact has three layers. In V1, only the first is populated.
The architecture must not prevent the second and third from being added.

```
Artifact
├── NARRATIVE
│     the prose a human reads
│     markdown, sectioned, authored by a capability
│
├── STRUCTURED INFORMATION
│     machine-readable content extracted from or authored alongside the narrative
│     ├── entities        (features, users, systems, competitors, metrics)
│     ├── decisions       (what was chosen, alternatives, rationale, confidence)
│     ├── relationships   (depends-on, blocks, informs, contradicts, supersedes)
│     ├── dependencies    (ordering constraints between entities)
│     └── evidence        (claims with sources, confidence, retrieval time)
│
└── VISUAL REPRESENTATIONS
      derived from structured information — never authored independently
      ├── flow            (user flow, process flow)
      ├── architecture    (system architecture, service blueprint)
      ├── sequence        (interaction sequence)
      ├── journey         (user journey over time)
      ├── matrix          (decision matrix, scoring matrix, comparison)
      ├── state           (state machine, lifecycle states)
      └── graph           (dependency graph, opportunity map, ERD)
```

**The binding constraint:** a visual representation must be *derivable* from the
structured information layer. A diagram that is authored independently of the
artifact's content is a decorative image, and decorative images are prohibited —
they drift out of sync with the artifact and become misinformation.

## 29.3 Representation Catalog

| Representation | Renders | Derived from |
|---|---|---|
| Information Architecture | Content/navigation hierarchy | entities + parent-child relationships |
| System Architecture | Components and their connections | entities (systems) + relationships |
| User Flow | Steps a user takes to complete a job | entities (steps) + ordered relationships |
| Process / Lifecycle Flow | Stages of a process | entities (stages) + sequence |
| Sequence Diagram | Ordered interactions between actors | entities (actors) + ordered messages |
| Decision Matrix | Options scored against criteria | decisions + criteria + scores |
| Decision Tree | Branching decision logic | decisions + conditional relationships |
| Dependency Graph | What depends on what | entities + dependency relationships |
| State Diagram | States and transitions | entities (states) + transition relationships |
| Journey Map | User experience across time and touchpoints | entities (touchpoints) + sequence + sentiment |
| ERD | Data entities and their relations | entities (data) + cardinality relationships |
| Service Blueprint | Frontstage/backstage service delivery | entities + layer classification + sequence |
| Wireframe / UI Flow | Screen structure and navigation | entities (screens) + navigation relationships |
| Roadmap / Timeline | Work sequenced over time | entities (work items) + dates + dependencies |

## 29.4 Which Artifacts Support Which Representations

This mapping is a **capability declaration**, not an obligation. An artifact
supports a representation when its structured information can produce it. It
does not follow that every artifact should render every supported representation.

| Artifact type | Representations it can support |
|---|---|
| **PRD** | User Flow · Decision Matrix · Dependency Graph · Sequence Diagram (when interaction complexity warrants) |
| **UX artifact** | Information Architecture · User Flow · Journey Map · Wireframe/UI Flow · State Diagram |
| **Architecture artifact** | System Architecture · Sequence Diagram · Dependency Graph · ERD |
| **Research artifact** | Evidence structure · Journey Map · Opportunity Map · Competitive Comparison Matrix · Decision Matrix |
| **Prioritization artifact** | Scoring Matrix · Decision Matrix · Trade-off visualization · Dependency Graph |
| **Decision brief** | Decision Matrix · Decision Tree · Trade-off visualization |
| **Investigation brief** | Dependency Graph (causal) · Journey Map (where the symptom appears) · Decision Tree (hypothesis branching) |
| **Plan artifact** | Roadmap/Timeline · Dependency Graph · Process Flow |
| **Case study** | Journey Map (the project over time) · Decision Matrix (options considered) |
| **Lifecycle / orchestration record** | Process Flow · State Diagram · Sequence Diagram · Orchestration Graph (capability and sub-agent relationships) |

## 29.5 The Selection Rule

**The system determines representation from semantic content, not from a
checklist.**

The governing question is: *what representation makes this artifact more useful
to a real PM?*

| If the content is about… | The useful representation is |
|---|---|
| Comparison across options and criteria | Matrix |
| Ordering and what blocks what | Dependency graph |
| Time-ordered interaction between parties | Sequence diagram |
| Navigation or content structure | Information architecture |
| Experience across time and touchpoints | Journey map |
| System components and their connections | Architecture |
| Conditional branching logic | Decision tree |
| Discrete states and transitions between them | State diagram |
| Work sequenced against time | Roadmap |

**If a representation adds no information the narrative does not already carry
clearly, do not generate it.** A diagram that restates a two-sentence paragraph
makes the artifact longer, not better. The artifact must become *more useful*,
not merely *more visual*.

## 29.6 Mermaid as a Structured Format

Mermaid is treated as a **structured, reproducible representation format** — not
an image generator.

This matters because:
- Mermaid source is text: it versions in git alongside the artifact
- It is regenerable: when structured information changes, the Mermaid is
  re-derived rather than manually redrawn
- It is inspectable: a reviewer can read the source and verify it matches the content
- It is portable: it renders in GitHub, Notion, and most modern documentation tools

Representations that Mermaid handles well: flowchart, sequence, state, ERD,
journey, gitgraph, timeline.

Representations requiring another approach: decision matrices (tables),
wireframes (structured layout description), architecture diagrams beyond
Mermaid's expressiveness (a structured node/edge model rendered natively).

## 29.7 Artifact Schema Requirements for V1

**V1 does not build the visualization engine.** V1 must only ensure the artifact
contract does not *prevent* it.

The minimum V1 requirement:

```typescript
interface ArtifactRecord {
  // ── V1: implemented ──────────────────────────────────
  path: string;
  artifactType: string;
  producedBy: CapabilityId;
  producedInRun: string;
  narrative: string;              // the markdown content
  
  // ── V1: reserved, may be empty ───────────────────────
  /** 
   * Structured content extracted from or authored with the narrative.
   * Empty in V1. The field must exist so later population is additive.
   */
  structured?: StructuredContent;
  
  /**
   * Derived representations. Empty in V1.
   * Each carries a hash of the structured content it was derived from,
   * so staleness is detectable when the artifact changes.
   */
  representations?: RepresentationRecord[];
}

interface StructuredContent {
  entities?: Entity[];
  decisions?: Decision[];
  relationships?: Relationship[];
  evidence?: EvidenceRef[];
}

interface Entity {
  id: string;
  type: string;                   // 'feature' | 'user' | 'system' | 'metric' | …
  label: string;
  attributes?: Record<string, unknown>;
}

interface Relationship {
  from: string;                   // entity id
  to: string;                     // entity id
  type: 'depends-on' | 'blocks' | 'informs' | 'contradicts'
      | 'supersedes' | 'contains' | 'transitions-to';
  label?: string;
}

interface Decision {
  id: string;
  question: string;
  chosen: string;
  alternatives: string[];
  rationale: string;
  confidence: number;
  tradeoffs: string[];
}

interface RepresentationRecord {
  type: RepresentationType;
  format: 'mermaid' | 'structured-json' | 'table';
  source: string;                 // mermaid text or serialized structure
  /** Hash of the structured content this was derived from. */
  derivedFromHash: string;
  generatedAt: string;
  /** True when structured content has changed since generation. */
  stale?: boolean;
}
```

**The only V1 obligation:** `ArtifactRecord` includes the optional `structured`
and `representations` fields. They remain empty. Their presence means Phase 3+
can populate them without migrating every existing artifact.

## 29.8 Staleness — The Synchronization Contract

A representation derived from structured content must know when its source
changed. `derivedFromHash` provides this: when the structured content's hash no
longer matches, the representation is marked stale and either regenerated or
visually flagged.

**A visualization that silently drifts from its artifact is worse than no
visualization.** It becomes confidently wrong documentation.

## 29.9 Future Studio Interaction

The long-term Studio model, documented here so the architecture accommodates it:

```
SELECT  →  IMPROVE  →  STRUCTURE  →  VISUALIZE  →  REGENERATE  →  SAVE/VERSION
```

| Level | What the PM can do |
|---|---|
| **Content** | rewrite · clarify · strengthen reasoning · identify gaps · improve evidence · improve requirements · improve decisions |
| **Structure** | reorganize sections · identify missing information · expose dependencies · connect related artifacts · improve information architecture |
| **Visual** | visualize a section · generate the appropriate representation · convert structured information to Mermaid · regenerate after the artifact changes |

**Critical UX principle:** the PM must not need diagram terminology to benefit.

If a PM selects a section describing a complicated multi-party interaction,
IdeaGate recognizes that a sequence diagram would clarify it and offers
*"Show this as a step-by-step interaction"* — not *"Generate sequence diagram."*
The system knows the diagram taxonomy; the user does not have to.

The representation stays connected to the artifact. It is a view of the
artifact's content, not a separate object that happens to sit near it.

## 29.10 Phase Boundary — Explicit

**V1 does:**
- Define the three-layer artifact model (§29.2)
- Define the representation catalog and per-artifact support map (§29.3, §29.4)
- Define the selection rule (§29.5)
- Reserve `structured` and `representations` in the artifact schema (§29.7)
- Define the staleness contract (§29.8)
- Document the future Studio interaction model (§29.9)

**V1 does not:**
- Build the visualization engine
- Build an interactive canvas
- Implement any diagram type
- Add visualization controls to the Mission Composer
- Populate the structured layer
- Expand Phase 1 into a Studio redesign

**Why decide now:** if artifacts ship as pure markdown strings with no reserved
schema, adding structured content later requires migrating and re-parsing every
artifact ever produced. Reserving two optional fields costs nothing today and
prevents a full artifact-system restructure later.

**Status:** `FUTURE ARCHITECTURE` for the engine. `PHASE 1` for the schema
reservation only.

---

# PART XXX — WORKED EXECUTION EXAMPLES

These examples exist to prevent the architecture from quietly becoming "six
agents for everything." Each shows a different execution graph derived from a
different product job.

**Every example explicitly states which capabilities are NOT used and why.**

---

## Example A — PRIORITIZE

**USER REQUEST**
> "I have 24 items in our Q3 backlog and capacity for about 8. Help me figure out
> what to build. Here's the list with rough effort estimates."

**OUTCOME:** `prioritize`
**DEPTH:** `balanced`
**CONTEXT:** pasted list of 24 items with effort estimates. No uploads.

**SELECTED CAPABILITIES: 2**

| Capability | Why |
|---|---|
| PS | Selects and applies the prioritization framework consistently across 24 items |
| QA | Validates dependency ordering; catches sequencing conflicts scoring alone misses |

**NOT USED — and why:**

| Capability | Why not |
|---|---|
| RE | No research required. The items are known; nothing needs discovering. Invoking RE would produce market context nobody asked for. |
| UX | No design work. Ranking existing items involves no interaction design. |
| AR | No architecture work. Effort estimates were provided; nothing needs technical decomposition. |
| CO | No synthesis across independent perspectives — there is only one ranking. CO's synthesis role is unnecessary when there is nothing to reconcile. |

**SUB-AGENTS:** None.
*Why not justified:* consistent scoring requires a single scorer. Parallel workers
scoring different subsets produce incomparable scores — item 3 scored by worker A
and item 17 by worker B cannot be reliably ranked against each other.

**ORCHESTRATION RECIPE:** Structured Delivery (2 steps, sequential)
*Why sequential:* the dependency check operates on the ranking. It cannot run
before the ranking exists.

**EXECUTION STEPS**
```
step 1  PS   Framework selection (deterministic: effort present + no reach data
             → Value/Effort matrix), score all 24 items, produce ranking
                ↓
step 2  QA   Validate dependency ordering, flag conflicts
                ↓
        [if conflicts] PS revise ranking, max 1 revision
```

**EVALUATION**
- Dimensions: `scoring-consistency`, `dependency-correctness`, `rationale-clarity`
- Threshold: 75
- Evaluator: QA
- Gate: every item scored on every framework dimension; unknowns marked, not invented

**TERMINATION**
Ranking produced and dependency-validated. Max 1 revision. No loop.

**FINAL OUTPUT**
Ranked list · per-item score breakdown · framework used and why · dependency map ·
recommended sequence · explicit trade-offs (what is being deprioritized, at what cost)

**Latency:** 3–8 min

---

## Example B — RESEARCH & VALIDATE

**USER REQUEST**
> "We're considering building an AI-powered inventory tool for independent retail
> stores in India. Is this opportunity real?"

**OUTCOME:** `research`
**DEPTH:** `deep`
**CONTEXT:** none uploaded. Web search enabled.

**SELECTED CAPABILITIES: 4**

| Capability | Why |
|---|---|
| CO | Frames the research question and synthesizes the final recommendation |
| RE | Owns evidence gathering — this is the mission |
| PS | Interprets business viability from the evidence |
| QA | Validates evidence coverage before a recommendation is permitted |

**NOT USED — and why:**

| Capability | Why not |
|---|---|
| UX | No design work at the validation stage. Whether to build precedes how it looks. |
| AR | Technical feasibility is not the question. "Can we build it" is not in doubt; "should we" is. *Conditional:* if the opportunity hinged on an unproven technical capability, AR would be added. |

**SUB-AGENTS: 4** *(depth `deep`)*

| Worker | Task |
|---|---|
| market landscape | Market size, growth, structural dynamics |
| competitor analysis | Existing players, positioning, gaps |
| user problem evidence | Do independent retailers actually experience this pain? |
| business model | Pricing viability, willingness to pay |

*Why justified:* four genuinely independent evidence axes. Different sources,
different queries, no shared reasoning. Sequential gathering would take 4× longer
and produce no better coverage. Owner: RE. Concurrency: 4. Depth: 1.

**ORCHESTRATION RECIPE:** Research First
*Why:* evidence must precede interpretation. Interpreting first and then finding
supporting evidence is motivated reasoning — the exact failure this outcome exists
to prevent.

**EXECUTION STEPS**
```
step 1  CO   Frame the research question
                ↓
step 2  RE   Dispatch 4 workers ──┬── market landscape      ┐
                                  ├── competitor analysis   │ parallel
                                  ├── user problem evidence │
                                  └── business model        ┘
                ↓
step 3  RE   Synthesize; surface contradictions between workers (do not resolve silently)
                ↓
step 4  PS   Interpret business implications
                ↓
step 5  QA   Evidence coverage check
                ↓
step 6  CO   Recommendation: Build / Don't Build / Investigate Further
```

**EVALUATION**
- Dimensions: `evidence-quality`, `source-coverage`, `contradiction-handling`
- Threshold: 75
- Gate: **if coverage < threshold, the recommendation defaults to "Investigate
  Further" with named gaps.** A confident recommendation on thin evidence is
  prohibited — the failure cost of a wrong "Build" is a quarter of engineering.

**TERMINATION**
Recommendation produced with confidence. If one worker fails, proceed with the
rest and state the coverage gap. If all fail, fail the mission — do not produce
a research brief with no research.

**FINAL OUTPUT**
Market landscape · competitor matrix · user problem evidence · assumption register
with evidence status · contradictions found · **explicit three-way recommendation**
with confidence · source reference for every material claim

**Latency:** 10–25 min

---

## Example C — COUNCIL REVIEW

**USER REQUEST**
> "We're planning to move our pricing from per-seat to usage-based next quarter.
> Before I take this to the leadership team, what will they challenge?"

**OUTCOME:** `council`
**DEPTH:** `deep`
**CONTEXT:** uploaded pricing proposal doc + current revenue breakdown

**SELECTED CAPABILITIES: 4**

| Capability | Why |
|---|---|
| PS | Pricing strategy, market positioning, revenue implications — the core lens |
| RE | Competitive pricing benchmarks; is this move consistent with market direction |
| AR | Metering and billing feasibility — usage-based pricing requires infrastructure per-seat does not |
| CO | Aggregates independent assessments, surfaces agreement and dissent |

**NOT USED — and why:**

| Capability | Why not |
|---|---|
| UX | *Considered and rejected.* Pricing page design is downstream; the question is whether the pricing *model* is sound. If the question had been "will customers understand this pricing," UX would be essential. **This is the selective-invocation rule working: Council does not automatically call every specialist.** |
| QA | No artifact to validate for completeness. This is a proposal assessment, not a document review. |

**SUB-AGENTS: 2** *(depth `deep`, under PS only)*

| Worker | Task |
|---|---|
| pricing analyst | Model the revenue impact across customer segments |
| positioning analyst | Assess competitive positioning implications |

*Why justified:* PS's domain contains two genuinely separable sub-questions
requiring different analysis. Owner: PS. Concurrency: 2. Depth: 1.

**ORCHESTRATION RECIPE:** Council (vote/consensus)
*Why:* the value is independent assessment. Assessors must not see each other's
output — contamination produces consensus that was never independently reached.

**EXECUTION STEPS**
```
step 1  CO   Frame what is being assessed
                ↓
step 2  parallel ── PS  assess → {assessment, confidence, primary concern}
                    │      ├── pricing analyst
                    │      └── positioning analyst
                    ├── RE  assess → {assessment, confidence, primary concern}
                    └── AR  assess → {assessment, confidence, primary concern}
                ↓
step 3       Aggregate scores; compute agreement and disagreement map
                ↓
step 4  CO   Synthesis: recommendation, agreement, dissent, weighted confidence
```

**EVALUATION**
- Dimensions: `source-coverage`, `dissent-preservation`, `rationale-clarity`
- Threshold: 75
- Gate: every assessor returns a numeric confidence. **If mean confidence < 70,
  the output must explicitly flag the low-confidence areas** rather than
  presenting an averaged recommendation that hides uncertainty.

**TERMINATION**
All assessors complete (or fail, with coverage stated), synthesis produced with
dissent preserved.

**FINAL OUTPUT**
Per-assessor assessment with confidence · agreement map · **dissent map** ·
aggregate recommendation · weighted confidence · what would change the assessment

**Latency:** 8–18 min

---

## Example D — DECIDE (Red / Blue)

**USER REQUEST**
> "Should we build our own recommendation engine or integrate a third-party API?
> Engineering wants to build it. Finance wants to buy. I need to present both
> sides to the exec team."

**OUTCOME:** `decide`
**DEPTH:** `deep`
**CONTEXT:** uploaded engineering estimate + vendor pricing sheet

**SELECTED CAPABILITIES: 3 invocations, 2 distinct capabilities**

| Invocation | Capability | Role |
|---|---|---|
| 1 | PS `[blue]` | Argue FOR building in-house, with evidence |
| 2 | PS `[red]` | Argue AGAINST building / FOR buying, with evidence |
| 3 | CO `[judge]` | Synthesize, preserve unresolved dissent |

**This is the multiple-instance case:** one capability, two isolated instances
with opposing framings. They do not share context and do not see each other's
output.

**NOT USED — and why:**

| Capability | Why not |
|---|---|
| RE | Evidence was provided (estimate + pricing). No discovery needed. *Conditional:* if the user had asked "and check what competitors do," RE joins. |
| UX | No design dimension in a build-vs-buy infrastructure decision. |
| AR | *Considered.* Technical feasibility is not in dispute — both options are feasible. **If the disagreement had been technical rather than economic, AR would replace PS as the debating capability.** |
| QA | No artifact to validate. The judge performs quality assessment on the synthesis. |

**SUB-AGENTS:** None.
*Why not justified:* each position must be one coherent argument. Splitting a
position across workers produces a fragmented case that is easier to defeat for
reasons unrelated to its merit.

**ORCHESTRATION RECIPE:** Red/Blue Debate
*Why:* an agent instructed to "consider both sides" hedges — it produces
"on one hand… on the other…" without committing. Two committed positions produce
genuinely testable arguments.

**EXECUTION STEPS**
```
step 1  CO        Frame the decision precisely
                    ↓
step 2  PS[blue]  Build the strongest case FOR building in-house
        PS[red]   Build the strongest case AGAINST / FOR buying
                  ↑ identical context to both — asymmetric context rigs the debate
                  ↑ isolated — neither sees the other
                    ↓
step 3  CO[judge] Identify genuine conflict points
                  Assess evidence quality on each side
                  Synthesize recommendation
                  PRESERVE unresolved dissent
```

**EVALUATION**
- Dimensions: `argument-quality`, `tradeoff-coverage`, **`dissent-preservation`**
- Threshold: **80 — the highest of any outcome**
- Gate: **the synthesis must contain a dissent section. Its absence is an
  automatic fail.** A decision brief that smooths over disagreement is actively
  harmful — it presents false consensus to an exec team.

**TERMINATION**
Synthesis produced with dissent preserved and quality gate passed.
Max 1 revision on the synthesis only. **Positions are never revised** — revising
a position after seeing the other side destroys the independence that makes the
debate meaningful.

**FINAL OUTPUT**
Decision framing · Position A with evidence · Position B with evidence ·
**explicit conflict map** · synthesis with recommendation · **preserved dissent**
(what the losing position raised that remains unaddressed) · confidence ·
what would change the recommendation

**Latency:** 8–20 min

---

## Example E — INVESTIGATE

**USER REQUEST**
> "Activation dropped from 34% to 26% over the last three weeks. I don't know why."
> *Uploads:* funnel analytics CSV, recent user interview notes, current onboarding spec

**OUTCOME:** `investigate`
**DEPTH:** `deep`
**CONTEXT:** 3 evidence sources uploaded (required — this outcome cannot run
without evidence; the Request Normalizer rejects it otherwise)

**SELECTED CAPABILITIES: 5**

| Capability | Why |
|---|---|
| CO | Frames the investigation; ranks hypotheses by evidence weight |
| RE | Analyzes the three evidence sources — the diagnostic foundation |
| UX | Symptom is a funnel/conversion drop → design and usability causes are plausible |
| PS | Product/market causes: did positioning change, did a competitor act, did the audience shift |
| QA | Designs falsifiable experiments to distinguish the hypotheses |

**NOT USED — and why:**

| Capability | Why not |
|---|---|
| AR | *Conditional, and the condition was not met.* If the symptom were latency, errors, or reliability, AR would be essential. A conversion drop with no reported performance change does not indicate a technical cause. **If the analytics showed a load-time regression, the Router would add AR.** This is symptom-driven capability selection. |

**SUB-AGENTS: 3** *(3 evidence sources provided)*

| Worker | Task |
|---|---|
| analytics analysis | Where in the funnel does the drop occur, and when did it start |
| interview analysis | What do users say about the onboarding experience |
| spec analysis | What changed in the onboarding flow in the relevant window |

*Why justified:* each source requires genuinely different analysis. Owner: RE.
Concurrency: 3. Depth: 1.

**ORCHESTRATION RECIPE:** Research First → Council
*Why:* diagnosis must precede interpretation. Interpreting before analyzing the
evidence produces hypotheses that fit a preconception rather than the data.

**EXECUTION STEPS**
```
step 1  CO   Frame the investigation
                ↓
step 2  RE   Dispatch 3 workers ──┬── analytics    ┐
                                  ├── interviews   │ parallel
                                  └── spec diff    ┘
                ↓
step 3  RE   Synthesize what the evidence shows
                ↓
step 4  parallel ── UX  diagnose from usability perspective
                    └── PS  diagnose from product/market perspective
                ↓
step 5  CO   Rank hypotheses by evidence weight
                ↓
step 6  QA   Design falsifiable experiments to distinguish hypotheses
```

**EVALUATION**
- Dimensions: `hypothesis-quality`, `falsifiability`, `experiment-quality`
- Threshold: 75
- Gates:
  - minimum 3 hypotheses
  - **each hypothesis must have both supporting AND contradicting evidence
    considered** — one-sided hypotheses fail the gate
  - each must have a falsifiable test
  - at least one experiment executable within a week

**TERMINATION**
Ranked hypotheses with experiments produced. If evidence is insufficient, state
what evidence is needed — **do not speculate**. IdeaGate never claims a
definitive root cause; only the experiment can establish that.

**FINAL OUTPUT**
Symptom restatement · evidence summary · **ranked hypotheses** (each with
supporting evidence, contradicting evidence, confidence) · experiment designs ·
recommended first action

**Latency:** 12–25 min

---

## Example F — CONTINUOUS / GOAL-BASED RESEARCH

**USER REQUEST**
> "Track Competitor X. Tell me when something materially changes in their product
> or pricing — don't send me noise."

**This is not a tenth outcome.** It is a composition:

```
Outcome (research) + Goal-Based Loop + Persistent evidence store + Trigger
```

**OUTCOME:** `research`
**DEPTH:** `balanced` *(per execution — exhaustive would be wasteful for a recurring check)*
**CONTEXT:** persistent evidence store from prior executions + competitor URLs

**GOAL SPECIFICATION** *(mandatory for any loop)*
```
statement: "Surface material changes in Competitor X's product or pricing"
criteria:  [{ dimension: 'evidence-quality', threshold: 70 }]
bounds:    { maxIterations: 3,
             maxDurationMs: 600_000,
             maxEstimatedCostUsd: 0.50,
             onExhausted: 'return-best' }
```

**SELECTED CAPABILITIES: 2**

| Capability | Why |
|---|---|
| RE | Gathers current-state evidence |
| CO | Evaluates materiality — is this change worth surfacing |

**NOT USED — and why:**

| Capability | Why not |
|---|---|
| PS | Business interpretation is not required for detection. **PS is invoked only when a material change is detected** and the user asks for implications — which is a separate mission, not part of the monitoring loop. |
| UX / AR / QA | No design, architecture, or validation dimension in change detection. |

**SUB-AGENTS: 2** *(per execution)*

| Worker | Task |
|---|---|
| product change scan | What changed in the product surface |
| pricing scan | What changed in published pricing |

*Owner:* RE. *Concurrency:* 2. *Depth:* 1.

**ORCHESTRATION RECIPE:** Goal-Based Research Loop, schedule-triggered

**EXECUTION STEPS**
```
[trigger: scheduled]
        ↓
step 1  RE   Dispatch 2 workers → current-state evidence
        ↓
step 2       Compare current evidence against the persistent store
        ↓
step 3  CO   Materiality evaluation — is this change worth surfacing?
        ↓
     ┌──────── material? ────────┐
     │ NO                        │ YES
     ▼                           ▼
  no-op                      emit output
  update store               update store
     │                           │
     └──── evidence coverage < threshold? ────┐
                    │ YES                     │ NO
                    ▼                         ▼
          targeted follow-up research      terminate
          (iteration 2, then 3 max)
```

**EVALUATION**
- Dimension: `evidence-quality`, threshold 70
- Materiality is a separate deterministic check, not an LLM judgment call:
  a change is material when it crosses a defined threshold (price delta %,
  new feature category, positioning change)

**TERMINATION** *(any of these — all deterministic)*
1. Material change detected and reported
2. No material change and evidence coverage adequate → no-op, terminate
3. `maxIterations` (3) reached
4. `maxDurationMs` (10 min) elapsed
5. `maxEstimatedCostUsd` ($0.50) exceeded
6. Improvement between iterations below minimum → diminishing returns, halt
7. User cancellation

On exhaustion without meeting criteria: **return best available with explicit
uncertainty.** Never silently claim success. Never continue indefinitely.

**FINAL OUTPUT**
Either a change report (what changed, evidence, materiality assessment, prior
state comparison) — or nothing, with the evidence store updated. **Silence when
nothing material happened is the correct output**, and is itself the product
value: the PM is not notified for noise.

**Latency:** 4–10 min per execution

**Status:** `FUTURE ARCHITECTURE` — requires persistent evidence store (Part XIII),
goal-based loop (Part XVI), and scheduling infrastructure.

---

## Cross-Example Summary — The Anti-Pattern Guard

| Example | Capabilities | Instances | Sub-agents | Recipe |
|---|---|---|---|---|
| A · Prioritize | **2** (PS, QA) | 2 | 0 | Structured |
| B · Research | **4** (CO, RE, PS, QA) | 4 | 4 | Research First |
| C · Council | **4** (CO, PS, RE, AR) | 4 | 2 | Council |
| D · Decide | **2** (PS, CO) | **3** | 0 | Debate |
| E · Investigate | **5** (CO, RE, UX, PS, QA) | 5 | 3 | Research First → Council |
| F · Continuous | **2** (RE, CO) | 2 | 2 | Goal Loop |
| — Build (§18.1) | 6 | 6 | 0 | Structured |

**Read this table as the architectural guard.** Capability count ranges from 2 to
6 and is derived from the product job in every case. Example D uses three
*invocations* of two *capabilities* — demonstrating that instance count and
capability count are independent. No example invokes a capability because it
exists; each invocation is justified in its contract.

If a future outcome's execution graph invokes all six capabilities without a
per-capability justification of the kind shown above, that is a Strategy Router
defect, not a feature.

---

# APPENDIX A — SELF-REVIEW AGAINST QUALITY BAR

| # | Question | Answer |
|---|---|---|
| A | Could another engineer implement without inventing contracts? | Yes — Parts IV, VII, XII, XV define all contracts with types |
| B | Could a PM use it without understanding lifecycle stages? | Yes — Part II §2.4 prohibits stage exposure; translation table is binding |
| C | Does every multi-agent decision have a product reason? | Yes — Part XVIII documents justification per outcome, including where it is weak (Case Study, Prioritize) |
| D | Are six agents used only when justified? | Yes — Part XXX table: capability count ranges 2–6, derived per job. Prioritize uses 2, Decide uses 2 capabilities across 3 instances. Build's six derive from the current lifecycle's artifact contract, not from a rule. |
| E | Can the system dynamically use fewer or more? | Yes — Part VI §6.3, Part X §10.2 |
| F | Can legitimate tasks spawn bounded sub-agents? | Yes — Part XI with 15-field mandatory contract |
| G | Can research use parallel workers? | Yes — Part XVIII §18.2 with full delegation contract |
| H | Can Council use multiple independent specialists? | Yes — Part XVIII §18.6, with selective invocation |
| I | Can research continue through a bounded goal loop? | Yes — Part XVI §16.3, Part IX §9.6 |
| J | Can new outcomes be added without a new engine? | Yes — recipes compose primitives; a new outcome is a Router entry. Part XXX Example F demonstrates continuous execution as a composition, not a new outcome. |
| K | Are primitives separated from recipes? | Yes — Parts VIII and IX are separate |
| L | Are context and memory distinct? | Yes — Part XIII §13.1 |
| M | Are retry, revision and goal loop distinct? | Yes — Part XVI §16.1 |
| N | Are evaluation criteria mission-specific? | Yes — Part XV §15.3 |
| O | Is the system honest about what is implemented? | Yes — Part XXIV, and honesty rules in §2.5 |
| P | Is deterministic state still governed by rules? | Yes — Part I §1.5, Part VI (Router is rule-based) |
| Q | Does it improve actual PM work? | Each outcome states its product job and failure cost |
| R | Does it feel like a premium SaaS OS rather than an AI demo? | Part XIX establishes the UX bar and prohibits demo patterns |
| S | Can it evolve without a rewrite? | Yes — primitives + recipes + Router table is the extension point |
| T | Do artifacts avoid becoming markdown blobs? | Yes — Part XXIX three-layer model; schema fields reserved in V1 |
| U | Are visualizations derivable, not decorative? | Yes — Part XXIX §29.2 binding constraint + §29.8 staleness contract |
| V | Is Phase 1 scope protected from inflation? | Yes — Part XXIX §29.10 explicit phase boundary; V1 reserves schema only |

---

# APPENDIX B — DOCUMENTATION SEQUENCE

This document is Document 1. The following documents come next, in order.
**Do not begin implementation of a component before its contract document exists.**

| # | Document | Defines |
|---|---|---|
| 1 | **This document** | Product model, architecture, contracts, outcomes, phases |
| 2 | Strategy Router + ExecutionPlan Spec | Routing rules, capability selection logic, depth resolution, evaluation policy generation |
| 3 | Orchestration Engine + Agent Harness Spec | Primitive implementations, handoff contracts, concurrency, cancellation, state |
| 4 | Context + Memory + Evidence Spec | Ingestion, parsing, scoping, retrieval, provenance, citation |
| 5 | Outcome Engineering Contracts | One detailed implementation contract per outcome |
| 6 | Mission Composer UX Spec | Interaction detail, states, transitions, copy |
| 7 | Implementation Plan | Goal-based Claude Code mission sequence |

## Implementation Prompt Standard

When implementation begins, every Claude Code mission prompt must contain:

```
GOAL                      — the observable end state
CURRENT STATE             — what exists now
FILES TO READ             — required reading before any edit
ARCHITECTURAL CONTRACT    — the contracts this must satisfy
SCOPE                     — what is in scope
NON-GOALS                 — what is explicitly out of scope
IMPLEMENTATION STEPS      — ordered
VERIFICATION              — how to check each step
BROWSER ACCEPTANCE        — what must be observably true in a browser
FAILURE CONDITIONS        — what constitutes failure
ROLLBACK                  — how to revert
DEFINITION OF DONE        — the completion criterion
```

**The loop:** implement → verify → observe → diagnose → fix → verify again →
stop only when the goal is observably met.

**Not sufficient to stop:** TypeScript compiles. A file was created. An API
returned 200. A component rendered. A test passed.

**Sufficient to stop:** the specified observable behavior is present in a
running browser.

---

*IdeaGate Mission Composer V1 Product & Engineering Specification*
*Version 1.0 — August 2026*
*Status: **COMPLETE / AUTHORITATIVE***

**Contents verified present:** product vision · product problem · Mission Composer
model · RunConfig · Request Normalizer · Strategy Router · ExecutionPlan ·
orchestration primitives · orchestration recipes · primary agent model · dynamic
agent selection · bounded dynamic sub-agent delegation · Agent Harness · Context
Engine · Memory model · Evaluation model · retry/revision/goal-loop distinction ·
Goal-Based Loop · all nine outcomes · outcome-specific contracts · failure
handling · cancellation · persistence · streaming/observability · Desk
integration · Studio integration · Mission Control integration · Composer UX ·
capability status matrix · phased build plan · Definition of Done · engineering
acceptance criteria · open decisions · explicit deferrals · documentation
sequence · Claude Code goal-based prompt standard · **artifact representation
model** · **worked execution examples**

**Contradictions corrected in this pass:**
1. Sub-agent depth reframed from permanent prohibition to V1 safety boundary
   with explicit conditions for future relaxation (§11.3)
2. Build's six-capability set reframed from architectural rule to derivation
   from the current lifecycle's artifact contract (§18.1)
3. Continuous monitoring reframed from a tenth outcome to a composition of
   Outcome + Goal Loop + persistence + trigger (Part XVII, §18.10)

**Next document:** Document 2 — Strategy Router + ExecutionPlan Specification.
Do not begin implementation before it exists.
