# IDEAGATE — ORCHESTRATION ENGINE + AGENT HARNESS SPECIFICATION
## Document 3 of 7 | Version 1.0 — Authoritative
## Status: Pre-Implementation

**Depends on:**
- Document 1 — Mission Composer V1 Product & Engineering Specification (FROZEN)
- Document 2 — Strategy Router + ExecutionPlan Specification (FROZEN / V1.1)

**Feeds:**
- Document 4 — Context + Memory + Evidence Specification
- Document 5 — Outcome Engineering Contracts
- Document 7 — Implementation Plan

**Governing principle (inherited, non-negotiable):**
> AI explains and generates. Deterministic rules govern state, progression,
> validation gates, termination, persistence, cancellation, concurrency limits,
> budget enforcement, and artifact contracts.

---

## DOCUMENT BOUNDARY

Document 2 answers: **WHAT** should execute (the compiled ExecutionPlan).
Document 3 answers: **HOW** the already-compiled ExecutionPlan executes.

The Engine never:
- re-routes a mission
- re-selects capabilities
- mutates `plan.json`
- infers a topology from step type
- makes decisions reserved for the Router or Compiler

The Engine always:
- executes the step assigned to the `capabilityInstanceId` in the plan
- writes runtime state to `state.json` only
- appends events to `events.jsonl` only
- enforces all constraints deterministically

---

## PROPOSED RUNTIME REQUIREMENTS (beyond Document 2's explicit scope)

The following runtime concerns are necessary for a production-grade engine but
are not fully specified in Document 2. They are proposed here. They do not
violate any frozen contract; they fill necessary implementation gaps.

| Requirement | Why necessary | Section |
|---|---|---|
| Step-level idempotency guard | Process restart must not re-execute completed steps | §3.4, Part 18 |
| Atomic state writes (tmp-rename) | Crash during write must not corrupt `state.json` | §3.3, Part 16 |
| Single-writer state manager | Concurrent parallel steps cannot race on `state.json` | §3.3 |
| Step-level timeout | Per-step LLM latency can be unbounded without a deadline | §7.4 |
| Provider failure taxonomy | 429/400/500/timeout each require different retry behavior | §7.5 |
| Malformed output handling | Model may return non-parseable or schema-invalid output | §7.6 |
| Tool failure policy | Tool calls within a step may fail independently of the model | §7.7 |
| Cancellation checkpoint protocol | Cancellation must be checked at defined safe points | Part 13 |
| Partial artifact write guard | Artifact must be written atomically; partial writes corrupt storage | §16.3 |
| Event serialization (append-lock) | Parallel steps must not interleave events.jsonl entries | §17.2 |
| Crash recovery protocol | Engine restart must resume from last known good state | Part 18 |
| Duplicate execution prevention | Idempotency key on each step prevents double execution | §18.2 |
| Worker result merge conflict handling | Sub-agents may return contradictory findings | §11.5 |
| Gap context assembly for revision | Evaluation gaps must be injected into revision context precisely | §9.3 |
| Stale artifact detection on restart | Restarted engine must not overwrite a completed artifact | §18.3 |

---

# PART 1 — RUNTIME ARCHITECTURE

## 1.1 Component Map

```
                           ┌─────────────────────────────┐
                           │     ORCHESTRATION ENGINE     │
                           │                              │
  plan.json (read-only) ──►│  ┌──────────────────────┐   │
                           │  │    Plan Reader        │   │
                           │  └──────────┬───────────┘   │
                           │             │                │
                           │  ┌──────────▼───────────┐   │
                           │  │    Step Scheduler     │◄──┼─ state.json (R/W)
                           │  └──────────┬───────────┘   │
                           │             │                │
                           │  ┌──────────▼───────────┐   │
                           │  │  Step Dispatcher      │   │
                           │  └──┬──────┬──────┬─────┘   │
                           │     │      │      │          │
                           │  ┌──▼─┐ ┌─▼──┐ ┌─▼──┐      │
                           │  │GEN │ │EVAL│ │DEL │ ...   │── events.jsonl (append)
                           │  └──┬─┘ └─┬──┘ └─┬──┘      │
                           │     └──────┼───────┘         │
                           │  ┌─────────▼──────────┐      │
                           │  │   State Manager    │      │── state.json (atomic write)
                           │  └────────────────────┘      │
                           │  ┌─────────────────────┐     │
                           │  │   Budget Watchdog   │     │
                           │  └─────────────────────┘     │
                           │  ┌─────────────────────┐     │
                           │  │ Cancellation Monitor│     │
                           │  └─────────────────────┘     │
                           └──────────┬──────────────────┘
                                      │
                    ┌─────────────────▼────────────────────┐
                    │           AGENT HARNESS               │
                    │                                       │
                    │  Context Assembler                    │
                    │  Prompt Builder                       │
                    │  Tool Executor                        │
                    │  Output Validator                     │
                    │  Event Emitter                        │
                    │  Timeout Enforcer                     │
                    └───────────────┬──────────────────────┘
                                    │
                    ┌───────────────▼──────────────────────┐
                    │         MODEL PROVIDER                │
                    │   (OpenRouter / model API)            │
                    └──────────────────────────────────────┘
```

## 1.2 Engine Responsibilities (Exclusive)

The Engine owns and is solely responsible for:

| Responsibility | May not be delegated to |
|---|---|
| Reading and validating plan.json at startup | Capabilities, tools |
| Scheduling step execution order | Capabilities |
| Enforcing `dependsOn` gates | Capabilities, Agent Harness |
| Enforcing `maxConcurrentSteps` | Agent Harness |
| Enforcing `mustNotReceiveOutputFrom` isolation | Capabilities |
| Enforcing hard budget ceilings | Agent Harness |
| Running the revision retry loop | Capabilities |
| Evaluating loop termination conditions | Capabilities, LLMs |
| Writing to `state.json` | Capabilities, Agent Harness |
| Appending to `events.jsonl` | Capabilities |
| Appending to `evaluations.jsonl` | Capabilities |
| Writing completed artifacts atomically | Capabilities |
| Processing cancellation signals | Capabilities |
| Crash recovery state reconstruction | Capabilities |

## 1.3 What the Engine Does NOT Do

- Re-route the mission or change the execution plan
- Select, add, or remove capabilities
- Re-derive capability from step type (Invariant 25, Document 2)
- Invoke the Request Normalizer or Strategy Router
- Write to `plan.json`
- Make non-deterministic decisions (every engine decision is rule-based)

---

# PART 2 — ENGINE LIFECYCLE STATE MACHINE

## 2.1 EngineLifecycleState (In-Memory) vs RunStatus (Persisted)

These are two distinct concepts. Conflating them was an inconsistency in the
draft. They are now formally separated.

**`EngineLifecycleState`** — in-memory only. Controls the engine process.
Never written to state.json. Lost on process crash (recoverable from state.json
on restart).

**`RunStatus`** — persisted in `state.json`. What Mission Control reads.
Survives process crash.

```typescript
// IN-MEMORY ONLY — never written to state.json
type EngineLifecycleState =
  | 'INITIALIZING'
  | 'EXECUTING'
  | 'PAUSED_BETWEEN_ITERATIONS'
  | 'COMPLETING'
  | 'DRAINING_CANCELLATION'  // waiting for in-flight steps to drain
  | 'TERMINATED';            // process is exiting (terminal)

// PERSISTED in state.json — survives process restart
type RunStatus =
  | 'pending'       // plan compiled; engine not yet started
  | 'running'       // engine is active (any EngineLifecycleState except TERMINATED)
  | 'complete'      // successful finish
  | 'failed'        // unrecoverable failure
  | 'cancelled'     // user or system cancellation
  | 'partial';      // budget-exhausted stop with some artifacts produced
```

**Mapping — EngineLifecycleState → RunStatus written to state.json:**

| EngineLifecycleState | RunStatus in state.json |
|---|---|
| `INITIALIZING` | `running` (written on first state initialization) |
| `EXECUTING` | `running` |
| `PAUSED_BETWEEN_ITERATIONS` | `running` (loop pause is transient; not a separate status) |
| `COMPLETING` | `running` (status updates to `complete` at the end of COMPLETING) |
| `DRAINING_CANCELLATION` | `running` (status updates to `cancelled` after drain) |
| `TERMINATED` | depends on terminal cause: `complete` / `failed` / `cancelled` / `partial` |

**Why the distinction matters for crash recovery (§18):**
When the Engine restarts and reads `state.json.status = 'running'`, it knows the
process was terminated mid-execution. `EngineLifecycleState` at the time of
crash is unknown and irrelevant — the Engine reconstructs from the persisted
RunStatus and the step tracking sets.

## 2.2 Engine States

```
INITIALIZING
     │
     │ plan valid, state initialized
     ▼
EXECUTING ────────────────────────────────┐
     │                                    │
     │ loopPolicy exists AND               │ cancellation received
     │ current iteration complete          │ at any point
     ▼                                    │
PAUSED_BETWEEN_ITERATIONS                 │
     │                                    │
     │ next iteration begins              │
     ▼                                    │
EXECUTING                                 │
     │                                    ▼
     │ all required steps complete    CANCELLING
     ▼                                    │
COMPLETING                               │ in-flight steps allowed to complete
     │                                    │ or abort per step timeout
     ▼                                    ▼
COMPLETE                           CANCELLED
```

**Additional terminal states:**
- `FAILED` — a required step failed beyond retry and revision budget, and `failureBehavior: 'revise-then-fail'` applied, or an unrecoverable engine error occurred
- `BUDGET_EXHAUSTED` — a hard budget ceiling was hit before completion

## 2.2 Engine State Transitions — Deterministic Rules

| Current state | Trigger | New state | Action |
|---|---|---|---|
| `INITIALIZING` | Plan validated, state file initialized | `EXECUTING` | Begin scheduler loop |
| `INITIALIZING` | Plan file missing or invalid | `FAILED` | Write failure to state.json; emit run_failed |
| `INITIALIZING` | State file shows `complete` (crash recovery) | `COMPLETE` | No-op; run already finished |
| `EXECUTING` | All required steps in `completedStepIds` | `COMPLETING` | Run post-execution cleanup |
| `EXECUTING` | Cancellation signal received | `CANCELLING` | Set cancellation flag; check all active steps |
| `EXECUTING` | Hard cost ceiling hit (`consumedActualCostUsd >= costCeilingUsd`) | (budget exhaustion) | Apply `onCostExhausted` from HardBudget |
| `EXECUTING` | Wall-clock exceeded (`consumedDurationMs >= maxDurationMs`) | (budget exhaustion) | Apply `onDurationExhausted` from HardBudget |
| `EXECUTING` | Loop iteration complete, loopPolicy present | `PAUSED_BETWEEN_ITERATIONS` | Evaluate termination conditions |
| `PAUSED_BETWEEN_ITERATIONS` | Termination condition met | `COMPLETING` or `FAILED` | Emit loop_terminated event |
| `PAUSED_BETWEEN_ITERATIONS` | Continuation permitted | `EXECUTING` | Reset step state for next iteration |
| `COMPLETING` | Cleanup complete | `COMPLETE` | Write final state; emit run_completed |
| `CANCELLING` | All active steps drained | `CANCELLED` | Write final state; emit run_cancelled |

---

# PART 3 — PLAN INTAKE AND STATE INITIALIZATION

## 3.1 Engine Startup Sequence

```
1. Read plan.json from canonical path
2. Validate plan is readable and schema-valid (non-null required fields)
3. Check plan.planVersion is supported by this engine version
4. Read state.json (if exists)
5. Determine startup mode (see §3.2)
6. Initialize or restore in-memory execution context
7. Emit plan_loaded event
8. Enter EXECUTING state
9. Begin scheduler loop
```

## 3.2 Startup Mode Determination

| state.json exists? | status in state.json | Startup mode |
|---|---|---|
| No | — | Fresh start |
| Yes | `complete` | Already done — no-op, report success |
| Yes | `failed` | Already done — no-op, report failure |
| Yes | `cancelled` | Already done — no-op |
| Yes | `running` | Crash recovery — see Part 18 |
| Yes | `pending` | Crash recovery (never started) |
| Yes | `executing` | Crash recovery (interrupted mid-execution) |

## 3.3 State Manager — Single Writer

All writes to `state.json` go through the **State Manager**. The State Manager
is a single-writer serializing queue. Concurrent step completions do not race
on the state file.

**Atomic write protocol:**

```
1. Acquire write lock (in-process mutex)
2. Apply state transition to in-memory state object
3. Validate state invariants (§16.2) — fail with ENG_09 if violated
4. Serialize to JSON
5. Write to state.json.tmp (same directory)
6. fsync state.json.tmp
7. Rename state.json.tmp → state.json (atomic on POSIX)
8. Release write lock
```

If step 7 fails (disk full, permissions), the Engine emits `run_failed` with
`ENG_05: PERSIST_FAILURE`.

**ExecutionAttempt — unified tracking of retries and revisions:**

Both technical retries and quality revisions are tracked as `ExecutionAttempt`
records, which are appended to `state.json`. This unified record enables crash
recovery to reconstruct exactly where a step was in its attempt cycle.

```typescript
interface ExecutionAttempt {
  attemptId: string;         // UUID
  stepId: string;            // the generation step being attempted
  attemptNumber: number;     // 1 = first attempt; 2+ = retry or revision
  attemptKind: 'initial' | 'technical-retry' | 'quality-revision';
  startedAt: string;
  completedAt?: string;
  outcome: 'success' | 'technical-failure' | 'quality-failure' | 'in-progress';
  costUsd: number;
  durationMs: number;
  // Present when attemptKind = 'quality-revision'
  revisionGaps?: string[];
  // Present when outcome = 'technical-failure'
  failureCode?: HarnessFailureCode;
}
```

`ExecutionAttempt` records are written to `state.json.attemptsByStepId[stepId]`.
They are also the ground truth for crash recovery — see §18.

**State Manager pre/post conditions:**

Pre: `state.json` is consistent with last successful write OR does not exist.
Post: `state.json` reflects the applied transition; no intermediate state is
visible to readers. State invariants hold (§16.2).

## 3.4 Idempotency Guard — Before Every Step Execution

Before dispatching any step, the Engine checks:

```typescript
if (state.completedStepIds.includes(step.stepId)) {
  // Step already completed (crash recovery path).
  // Do not re-execute. Skip to next ready step.
  return;
}
if (state.failedStepIds.includes(step.stepId)) {
  // Step already failed in a prior execution.
  // Apply dependency cascade logic (§15.2).
  return;
}
```

This prevents duplicate execution after process restart. A step is executed
exactly once. If the model call completes but the state write crashes, the
Engine detects the artifact exists on disk (§18.3) and treats the step as
complete.

---

# PART 4 — STEP SCHEDULER

## 4.1 Scheduler Responsibility

The Scheduler maintains the set of steps that are **eligible for execution**
at any moment and dispatches them within concurrency bounds.

## 4.2 Step Readiness Rule

A step is **ready** when ALL of the following are true:

1. `step.dependsOn` — every listed stepId is in `state.completedStepIds`
2. `step.stepId` — NOT in `state.completedStepIds` (not already done)
3. `step.stepId` — NOT in `state.failedStepIds` (not failed)
4. `step.stepId` — NOT currently in `activeStepIds` (not already dispatched)
5. Budget not exhausted (§14)
6. Cancellation not signalled

This is the **only** readiness check. The Scheduler does not interpret step
types or reason about semantics.

## 4.3 Scheduler Loop (Pseudocode)

```
while engine.state == EXECUTING:
  ready_steps = plan.steps
    .filter(step => isReady(step, state))
    .sortBy(step => step.order ASC)

  dispatching = ready_steps
    .slice(0, hardBudget.maxConcurrentSteps - state.activeStepIds.length)

  for step in dispatching:
    stateManager.addToActive(step.stepId)
    dispatch(step)  // async, non-blocking

  if ready_steps.empty() AND state.activeStepIds.empty():
    if allRequiredStepsComplete():
      engine.transition(COMPLETING)
    else:
      // No ready steps and nothing active — deadlock or all remaining steps failed
      engine.fail(reason='SCHEDULER_DEADLOCK')
    break

  sleep(SCHEDULER_POLL_INTERVAL_MS)  // e.g., 200ms
```

## 4.4 Order vs dependsOn in the Scheduler

The Scheduler uses `dependsOn` for readiness (§4.2). It uses `order` only
as a sort key — lower order numbers are attempted first within the ready set.
The Scheduler NEVER infers a dependency from `order`. Two steps with the
same `order` value and no `dependsOn` relationship are dispatched concurrently.

**If two steps have the same `order` and one is in the other's `dependsOn`:**
The Compiler has already rejected this plan (CompilerError: CONCURRENT_DEPENDENCY_CONFLICT,
Document 2 §12.5). The Engine should never see it. If it does (engine version
mismatch), the Scheduler treats it as a Compiler invariant violation and fails
the run with `ENG_01: PLAN_INVARIANT_VIOLATED`.

## 4.5 Required vs Optional Steps

A step is **required** if either:
- It directly produces at least one required artifact, OR
- It is in the dependency chain of a step that produces a required artifact
  (i.e., it is a prerequisite for required work)

Steps with no `outputArtifactIds` (e.g., a `synthesize` step that only feeds
downstream steps as context) are required if any downstream step that depends
on them is required.

```typescript
function isStepRequired(step: ExecutionStep, plan: ExecutionPlan): boolean {
  // Direct: step produces a required artifact
  if (step.outputArtifactIds.some(
    id => plan.artifactContract.artifacts.find(a => a.id === id)?.required
  )) return true;

  // Indirect: step is depended upon by a required step (transitive)
  // Use the plan's dependency graph — no cycles (Compiler validated)
  return plan.steps
    .filter(s => s.dependsOn.includes(step.stepId))
    .some(dependent => isStepRequired(dependent, plan));
  // Note: recursion terminates because the Compiler guarantees no circular deps.
}
```

A step producing only optional artifacts may fail without triggering the
dependency cascade that fails the run. The engine logs the failure and continues.

---

# PART 5 — EXECUTIONSTEP STATE MACHINE

## 5.1 Per-Step States

```
            ┌──────────────────────────────────────────────────────┐
            │ PENDING                                               │
            │ (waiting for dependsOn)                              │
            └──────────────────────┬───────────────────────────────┘
                                   │ all dependsOn complete
                                   ▼
            ┌──────────────────────────────────────────────────────┐
            │ READY                                                 │
            │ (eligible for dispatch)                              │
            └──────────────────────┬───────────────────────────────┘
                                   │ scheduler dispatches
                                   ▼
            ┌──────────────────────────────────────────────────────┐
            │ RUNNING                                              │
            │ (Agent Harness executing the step)                   │
            └──┬──────────────────────────────────────────────┬────┘
               │ output produced                              │ failure
               │                                              ▼
               │                           ┌──────────────────────────┐
               │                           │ FAILED (technical retry) │
               │                           │ attempt < maxRetries?    │
               │                           └──┬───────────────────────┘
               │                              │ yes → back to RUNNING
               │                              │ no  → see §15.1
               ▼
  ┌──────────────────────────────────────┐
  │ If stepType == 'evaluate':           │
  │   EVALUATING (score output)          │
  └──┬──────────────────────────────────┘
     │ score >= threshold (or no eval)
     │                          │ score < threshold, onEvaluationFail='revise'
     │                          ▼
     │          ┌─────────────────────────────────────┐
     │          │ REVISING                             │
     │          │ (generation step re-runs with gaps)  │
     │          └──┬──────────────────────────────────┘
     │             │ revision complete → back to EVALUATING
     │             │ revision budget exhausted → COMPLETE (with warning) or FAILED
     ▼
  ┌─────────────┐
  │  COMPLETE   │
  └─────────────┘
```

## 5.2 Step Status in ExecutionState

```typescript
type StepStatus =
  | 'pending'       // waiting for dependsOn
  | 'ready'         // eligible for dispatch (scheduler awareness only; not persisted)
  | 'active'        // in state.activeStepIds
  | 'complete'      // in state.completedStepIds
  | 'failed'        // in state.failedStepIds
  | 'skipped';      // dependency failed; this step was not executed

// ExecutionState tracks sets, not per-step status objects.
// "ready" is an in-memory scheduler concept; it is not written to state.json.
// A step is in exactly one of: active, complete, failed, skipped, or implicitly pending.
```

## 5.3 Step Completion — State Transition Contract

When a step completes successfully:

```
1. Write artifact(s) to disk (atomic — see §16.3)
2. Call stateManager.completeStep(stepId, costIncurred)
   which atomically:
   a. Adds stepId to completedStepIds
   b. Removes stepId from activeStepIds (should be there)
   c. Increments consumedActualCostUsd by costIncurred
   d. Increments consumedDurationMs
   e. Increments consumedSteps
3. Emit step_completed event with PM-native activity text
4. Scheduler loop picks up newly ready downstream steps
```

---

## 6.1 Context Assembly Is an Engine Concern — Architecture

Before invoking the Agent Harness, the Engine requests an `AssembledContext`
from the **Context Manager**. The Engine does not assemble context directly —
it calls the Context Manager's interface (defined below) and passes the result
to the Harness.

**Architectural ownership:**

| Layer | Responsibility |
|---|---|
| Engine | Calls `contextManager.scope()` at the right time; enforces isolation via `mustNotReceiveOutputFrom` before passing; checks size result |
| Context Manager (Document 4) | Determines WHAT knowledge is retrieved, from where, how it is scoped, provenance, freshness, conflict representation, token budget management |
| Agent Harness | Combines `AssembledContext` with capability framing; invokes the model |
| Model | Reasons over what the Harness provides; does not become the memory store |

## 6.2 The Context Manager Interface (Document 4 Seam)

This interface is **frozen in Document 3**. Document 4 implements it.
Document 3 calls it. Neither party redesigns it.

```typescript
// Document 3 calls this. Document 4 implements this.
interface ContextManager {
  scope(request: ContextRequest): Promise<ContextResponse>;
}

interface ContextRequest {
  step: ExecutionStep;
  plan: ExecutionPlan;
  state: ExecutionState;
  // Present when the invocation is a quality revision (§9.3)
  revisionContext?: RevisionContext;
  // The maximum tokens the Harness can accept for context
  tokenBudget: number;
}

interface ContextResponse {
  assembledContext: AssembledContext;
  retrievalMetadata: ContextRetrievalMetadata;
  withinBudget: boolean;   // false if context had to be truncated
  actualTokens: number;
}

interface AssembledContext {
  // Resolved context items (files, URLs, workspace artifacts)
  // Resolution and parsing is Document 4's responsibility
  contextItems: ResolvedContextItem[];

  // Outputs from prior steps this step is permitted to receive
  // (governed by plan.contextPlan.capabilityContextIds and receivesOutputFrom)
  priorStepOutputs: PriorStepOutput[];

  // Workspace knowledge scoped to this step
  // Document 4 determines what "workspace knowledge" contains
  // and how it is structured. It is NOT a raw string dump.
  // Document 4 may populate this from: durable project facts,
  // prior decisions, accepted constraints, historical project knowledge,
  // cross-run memory — whatever it determines is relevant and in-scope.
  workspaceKnowledge: WorkspaceKnowledgeSlice;

  // Total tokens of this assembled context
  totalTokens: number;
}

interface WorkspaceKnowledgeSlice {
  // Structured, not a raw string.
  // Document 4 defines the internal structure.
  // Document 3 passes it to the Harness opaquely.
  items: WorkspaceKnowledgeItem[];
  totalTokens: number;
}

interface WorkspaceKnowledgeItem {
  id: string;
  kind: 'project-fact' | 'decision' | 'constraint' | 'prior-outcome' | 'evidence' | 'artifact-summary';
  content: string;
  provenance: string;          // source identifier — Document 4 defines format
  retrievedAt: string;         // ISO 8601
  // Document 4 may add: freshness, confidence, conflict flags
}

interface ResolvedContextItem {
  contextItemId: string;       // matches plan.contextPlan item IDs
  content: string;             // extracted text — Document 4 handles extraction
  mimeType: string;
  sourceRef: string;           // original URL, filename, or artifact path
  tokenEstimate: number;
  // Document 4 may add: provenance, freshness, retrieval score
}

interface PriorStepOutput {
  stepId: string;
  capabilityId: CapabilityId;
  artifactIds: string[];
  content: string;             // full text or summary (Document 4 decides)
  tokenEstimate: number;
}

interface ContextRetrievalMetadata {
  // For observability and Document 4 debugging — not used by the Harness
  retrievalStrategy: string;
  itemsConsidered: number;
  itemsIncluded: number;
  truncationApplied: boolean;
}
```

**What Document 3 does NOT define here:**
- How context items are extracted from files or URLs
- How workspace knowledge is retrieved or ranked
- How conflicts between knowledge items are represented
- How provenance is tracked
- What "freshness" means for memory items
- How isolation between projects is enforced
- How cross-run memory differs from within-run memory

All of those are Document 4's responsibility.

**What Document 3 DOES define:**
- When to call `contextManager.scope()` (before every step dispatch)
- That the Engine enforces `mustNotReceiveOutputFrom` BEFORE calling scope
  (so the Context Manager never receives a request to include prohibited content)
- That `ContextResponse.withinBudget = false` causes the Engine to log a warning
  and proceed (the Context Manager has already truncated to fit; this is informational)
- That a `contextManager.scope()` failure (exception/timeout) causes the step
  to be treated as a technical failure (retryable)

## 6.3 Isolation Enforcement (before contextManager.scope())

Before calling `contextManager.scope()`, the Engine enforces isolation by
filtering `receivesOutputFrom` against `mustNotReceiveOutputFrom`:

```typescript
function enforcedReceivedFrom(step: ExecutionStep): string[] {
  const violations = step.receivesOutputFrom.filter(
    srcId => step.mustNotReceiveOutputFrom.includes(srcId)
  );
  if (violations.length > 0) {
    // This should have been caught by the Compiler.
    // If reached: plan invariant violated.
    throw new EngineError('ENG_02', `ISOLATION_VIOLATED: step ${step.stepId}`);
  }
  return step.receivesOutputFrom;
}
```

The Engine passes the filtered `receivesOutputFrom` list to the Context Request.
The Context Manager never sees prohibited source IDs — isolation is enforced
upstream of the context layer.

## 6.4 Context Manager Failure Behavior

If `contextManager.scope()` throws or times out:
- Treat as a technical failure of the step (retryable: true)
- Emit `step_retried` event with `reason: 'context-assembly-failed'`
- Standard technical retry policy applies (§15.1)
- If all retries exhausted: step fails; dependency cascade applies (§15.2)

---

# PART 7 — AGENT HARNESS

## 7.1 What the Agent Harness Is

The Agent Harness is the per-invocation execution boundary. Every capability
invocation — regardless of step type — passes through it. It is the membrane
between deterministic engine control and non-deterministic model execution.

The Harness:
- Assembles the final system prompt from the task spec, capability framing, and context
- Enforces tool permissions (model may only call allowed tools)
- Enforces the step timeout
- Invokes the model via the configured provider
- Validates the output against the step's output schema
- Reports cost consumed (from provider response headers/metadata)
- Emits step-level events
- Returns a `HarnessResult` to the Engine

The Harness does NOT:
- Make scheduling decisions
- Write to state.json or events.jsonl (it returns results to the Engine)
- Execute the step's retry logic (the Engine controls retry)
- Enforce budget ceilings (the Engine enforces those before dispatch)

## 7.2 HarnessInvocation Contract

```typescript
interface HarnessInvocation {
  // Which step this is
  stepId: string;
  planId: string;
  runId: string;

  // Which capability instance to invoke
  capabilityInstanceId: string;
  capabilityId: CapabilityId;
  instanceRole?: string;

  // The task
  taskSpec: TaskSpec;
  systemPromptBase: string;       // base system prompt for this capability
  instanceFraming?: string;       // additional framing (e.g., blue/red for debate)

  // What the capability may do
  allowedTools: ToolId[];

  // Assembled context (from §6)
  context: AssembledContext;

  // Optional: evaluation gaps for revision (present when this is a revision attempt)
  revisionContext?: RevisionContext;

  // Execution bounds
  timeoutMs: number;
  attemptNumber: number;          // 1 = first attempt, 2+ = retry or revision
  invocationKind: 'generate' | 'evaluate' | 'synthesize' | 'judge' | 'revision';
}

interface RevisionContext {
  priorOutputText: string;        // the output that failed evaluation
  evaluationGaps: string[];       // actionable gaps from the evaluation step
  attemptsUsed: number;
  maxAttempts: number;
}
```

## 7.3 HarnessResult Contract

```typescript
interface HarnessResult {
  status: 'success' | 'technical-failure' | 'timeout' | 'output-invalid';
  
  // Present on success
  outputText?: string;
  structuredOutput?: unknown;     // parsed per outputSchema
  toolCallResults?: ToolCallResult[];
  
  // Present on any result
  costUsd: number;               // actual cost as reported by provider (0 if unknown)
  durationMs: number;
  providerModel: string;          // which model was used
  
  // Present on failure
  failureCode?: HarnessFailureCode;
  failureDetail?: string;         // engineer-level, not shown to user
  retryable: boolean;             // false for output-invalid (revision required); true for technical
}

type HarnessFailureCode =
  | 'HARNESS_TIMEOUT'
  | 'PROVIDER_RATE_LIMIT'      // 429 — wait and retry
  | 'PROVIDER_CONTEXT_LIMIT'   // 400 / context too large — not retryable without context reduction
  | 'PROVIDER_SERVER_ERROR'    // 500/503 — retry with backoff
  | 'PROVIDER_NETWORK_ERROR'   // connection failure — retry with backoff
  | 'PROVIDER_AUTH_ERROR'      // 401/403 — not retryable; engine alert
  | 'TOOL_EXECUTION_FAILED'    // a tool call within the step failed
  | 'OUTPUT_PARSE_FAILED'      // model returned non-parseable output
  | 'OUTPUT_SCHEMA_INVALID'    // model returned parseable but schema-invalid output
  | 'ISOLATION_VIOLATED';      // detected in context assembly (§6.2)
```

## 7.4 Step Timeout

Every step invocation has a `timeoutMs` calculated by the Engine before
dispatch:

```typescript
function computeStepTimeout(
  step: ExecutionStep,
  plan: ExecutionPlan,
  state: ExecutionState
): number {
  const remainingBudgetMs = plan.hardBudget.maxDurationMs - state.consumedDurationMs;
  const defaultStepTimeoutMs = STEP_TIMEOUT_BY_TYPE[step.stepType] ?? 120_000;
  // Never exceed remaining budget; apply a reasonable per-step default
  return Math.min(defaultStepTimeoutMs, remainingBudgetMs);
}

const STEP_TIMEOUT_BY_TYPE: Record<ExecutionStepType, number> = {
  'generate':   180_000,  // 3 min — generation can be slow for long artifacts
  'evaluate':    60_000,  // 1 min — evaluation is typically shorter
  'synthesize': 120_000,  // 2 min
  'judge':      120_000,  // 2 min
  'aggregate':   60_000,  // 1 min
  'delegate':    30_000,  // 30s — delegation is dispatch, not execution
};
// Note: worker timeouts are set per-worker within DelegationSpec, not here.
```

On timeout: `HarnessResult.status = 'technical-failure'`,
`failureCode = 'HARNESS_TIMEOUT'`, `retryable = true`.

## 7.5 Provider Failure Taxonomy and Retry Behavior

| Failure | Code | Retryable | Strategy |
|---|---|---|---|
| 429 Rate limit | `PROVIDER_RATE_LIMIT` | Yes | Wait `Retry-After` header (or 30s if absent), then retry |
| 400 Context too large | `PROVIDER_CONTEXT_LIMIT` | No (without context change) | Engine must reduce context and retry — separate code path, not standard retry |
| 500/503 Server error | `PROVIDER_SERVER_ERROR` | Yes | Exponential backoff (1s, 3s); attempt fallback model on 2nd retry |
| Network error | `PROVIDER_NETWORK_ERROR` | Yes | Exponential backoff (1s, 3s); attempt fallback model on 2nd retry |
| 401/403 Auth error | `PROVIDER_AUTH_ERROR` | No | Engine alert — not retried; run fails with `ENG_03: AUTH_FAILURE` |
| Timeout | `HARNESS_TIMEOUT` | Yes | Immediate retry with shorter timeout; attempt fallback model on 2nd retry |
| Parse failed | `OUTPUT_PARSE_FAILED` | Yes (limited) | Retry once with explicit "respond in valid JSON" instruction; if fails again → quality revision |
| Schema invalid | `OUTPUT_SCHEMA_INVALID` | No (standard) | Treat as quality failure; revision path |

**Fallback model policy:** when a step has exhausted its primary-model retries,
the Engine switches to the fallback model. The fallback model identity comes
from `plan.failurePlan.onTechnicalRetry.fallbackModelId` — a field that the
Compiler populates from the V2 model registry at plan-compile time. The Engine
reads the plan; it does not reach into the V2 model registry at runtime.

```typescript
// In FailurePlan.RetryPolicy (Document 2 Part 11):
interface RetryPolicy {
  maxTechnicalRetries: number;   // V1: 2
  useFallbackModel: boolean;     // V1: true
  fallbackModelId: string;       // e.g., "openrouter/mistral-7b"
                                 // Populated by Compiler from model-registry.ts
}
```

If `fallbackModelId` is absent or empty and `useFallbackModel: true`, the Engine
treats this as `ENG_11: FALLBACK_MODEL_NOT_CONFIGURED` and fails the step
without retrying (rather than using an arbitrary model).

## 7.6 Malformed Output Handling

The Harness validates model output before returning it.

```
1. Attempt JSON parse if outputSchema is structured
2. If parse fails on first attempt:
   → re-invoke with explicit format instruction prepended
   → attempt parse again
   → if still fails: status='technical-failure', failureCode='OUTPUT_PARSE_FAILED'
3. If parse succeeds but schema validation fails:
   → status='output-invalid', failureCode='OUTPUT_SCHEMA_INVALID', retryable=false
   → Engine routes to quality revision (§9), NOT to technical retry
4. If narrative output (stepType='generate' with outputSchema='narrative'):
   → no structural validation; non-empty output is accepted
   → quality evaluation (the evaluate step) catches content failures
```

## 7.7 Tool Execution within the Harness

The Harness intercepts tool calls from the model and enforces the allowlist:

```typescript
function handleToolCall(
  call: ModelToolCall,
  step: ExecutionStep
): ToolCallResult {
  if (!step.allowedTools.includes(call.toolName)) {
    // Tool not permitted for this step — return a structured refusal
    // The model sees: "Tool X is not available for this operation"
    // The Engine logs this as a non-critical event
    return { status: 'refused', toolName: call.toolName, reason: 'not-permitted' };
  }
  return executeTool(call);
}
```

**Tool failure handling:**

| Tool | Failure behavior |
|---|---|
| `artifact-write` | Critical — retry up to 2×; if still fails: `ENG_04: ARTIFACT_WRITE_FAILED` |
| `web-search` | Non-critical — log failure, return empty result to model, continue |
| `url-fetch` | Non-critical — log failure, return empty result, continue |
| `file-read` | Non-critical if file is optional; critical if required by step — logged either way |
| `artifact-read` | Non-critical — log, continue without that context |
| `github-read` | Non-critical — log, continue |

The Engine collects `toolCallResults` and includes them in the `HarnessResult`.
Tool failures that are non-critical do not fail the step — the model receives
a graceful error response and continues.

---

# PART 8 — GENERATE STEP EXECUTION

## 8.1 Execution Sequence

```
Engine receives step with stepType='generate'

1. Idempotency guard (§3.4)
2. Budget check (§14.1) — if ceiling hit, stop before dispatch
3. Context assembly (§6)
4. Isolation check (§6.2)
5. Compute step timeout (§7.4)
6. Invoke Agent Harness
7. Handle HarnessResult:
   a. success  → write artifact (§16.3), complete step (§5.3)
   b. technical-failure, retryable=true → technical retry (§15.1)
   c. technical-failure, retryable=false (context limit) → reduce context, retry
   d. output-invalid → quality revision path (§9)
   e. timeout → technical retry with fallback model
```

## 8.2 Artifact Flush on Generation

After the Harness returns `success`, the Engine:
1. Writes the artifact atomically (§16.3)
2. Records the artifact as produced in state.json
3. Emits `artifact_written` event with the stable artifact ID

An artifact that exists on disk but is not in `state.json.producedArtifactIds`
indicates a crash between step 1 and step 2. The crash recovery protocol (§18.3)
handles this.

---

# PART 9 — EVALUATE STEP EXECUTION AND REVISION

## 9.1 The Generate-Evaluate-Revise Cycle

A generation step and its paired evaluation step are executed as a **unified
cycle** managed by the Engine. This is the core correction from the draft, which
had the Engine removing steps from `completedStepIds` and re-queuing them —
a model that corrupted the Scheduler's state and broke crash recovery.

**Correct model:** neither the generate step nor the evaluate step is added to
`completedStepIds` until the entire cycle terminates (either with a passing
evaluation, revision budget exhaustion, or quality failure). The Scheduler
dispatches the cycle as one unit.

**Cycle detection:** the Engine knows a step is part of a generate-evaluate
cycle if `plan.steps` contains an evaluate step whose `evaluatesStepId ===
step.stepId`. The Scheduler dispatches the generate step as the entry point;
the Engine runs the full cycle before reporting completion.

```
Engine dispatches a 'generate' step S_gen that has a paired 'evaluate' step S_eval

executeGenerateEvaluateCycle(S_gen, S_eval, plan, state):

  maxRevisions = resolvefromplan(plan, 'maxQualityRevisions')
  revisionContext = null

  for cycleAttempt = 1 to (maxRevisions + 1):

    // --- GENERATE ---
    attempt = ExecutionAttempt {
      attemptKind: cycleAttempt == 1 ? 'initial' : 'quality-revision',
      revisionGaps: revisionContext?.evaluationGaps
    }
    stateManager.recordAttemptStart(S_gen.stepId, attempt)

    harnessInvocation = buildHarnessInvocation(S_gen, plan, state, revisionContext)
    harnessResult = agentHarness.invoke(harnessInvocation)

    if harnessResult.status != 'success':
      // Technical failure — technical retry logic applies (§15.1)
      // Technical retry is handled WITHIN the cycle for the current attempt
      retryResult = handleTechnicalRetry(S_gen, harnessResult, plan, state)
      if retryResult.recovered:
        harnessResult = retryResult.result
      else:
        // Technical failure beyond retry budget — exit cycle with step failure
        stateManager.recordAttemptComplete(S_gen.stepId, 'technical-failure')
        applyStepFailure(S_gen, plan, state, retryResult.reason)
        return

    // Write artifact atomically (§16.3)
    writeArtifact(S_gen, harnessResult)
    stateManager.recordAttemptComplete(S_gen.stepId, 'success')
    emitEvent('artifact_written', S_gen)

    // --- EVALUATE ---
    evalInvocation = buildEvalHarnessInvocation(S_eval, S_gen, harnessResult, plan, state)
    evalResult = agentHarness.invoke(evalInvocation)
    evalLogEntry = parseEvaluationResult(evalResult, S_eval, cycleAttempt)

    appendToEvaluationsJsonl(evalLogEntry)
    stateManager.updateEvaluationResult(S_eval.stepId, evalLogEntry)
    emitEvent(evalLogEntry.passed ? 'evaluation_passed' : 'evaluation_failed', S_eval)

    if evalLogEntry.passed:
      // Cycle succeeds
      stateManager.completeStep(S_gen.stepId, harnessResult.costUsd)
      stateManager.completeStep(S_eval.stepId, evalResult.costUsd)
      return

    // Evaluation failed
    if cycleAttempt > maxRevisions:
      // Revision budget exhausted
      applyRevisionExhaustion(S_gen, S_eval, evalLogEntry, plan, state)
      return

    // Build revision context for next attempt
    revisionContext = buildRevisionContext(evalLogEntry, cycleAttempt, maxRevisions + 1)
    emit('revision_started', { stepId: S_gen.stepId, gaps: evalLogEntry.gaps })
```

**Key properties of this model:**

| Property | Value |
|---|---|
| completedStepIds mutation during cycle | Never — only on cycle termination |
| Crash recovery mid-cycle | Handled via ExecutionAttempt records (§18) |
| Scheduler interference | None — Scheduler sees S_gen as active throughout |
| Isolation between generate and evaluate | S_eval's `dependsOn` is not used for scheduling — the cycle handles ordering internally |
| Technical retry scope | Per generate attempt, within the cycle — standard §15.1 policy |
| Revision counter tracking | `state.attemptsByStepId[S_gen.stepId]` holds all ExecutionAttempt records |

## 9.2 Revision Budget Exhaustion

```typescript
function applyRevisionExhaustion(
  genStep: ExecutionStep,
  evalStep: ExecutionStep,
  lastEvalResult: EvaluationLogEntry,
  plan: ExecutionPlan,
  state: ExecutionState
): void {
  const behavior = plan.failurePlan.onTechnicalRetry  // from QualityFailurePolicy
    .onRevisionExhausted; // derived from EvaluationPolicy.failureBehavior (Document 2 §10.4)

  emitEvent('revision_exhausted', { stepId: genStep.stepId, behavior });

  if (behavior === 'advance-with-warning') {
    // Accept the last artifact with a warning flag
    stateManager.completeStepWithWarning(genStep.stepId, 'quality-below-threshold');
    stateManager.completeStep(evalStep.stepId, 0);
  } else {
    // behavior === 'fail-step'
    stateManager.failStep(genStep.stepId, 'quality-revision-exhausted');
    stateManager.failStep(evalStep.stepId, 'upstream-quality-failure');
    applyStepFailure(genStep, plan, state, 'quality-revision-exhausted');
  }
}
```

## 9.3 Gap Context Assembly for Revision

```typescript
function buildRevisionContext(
  evalLogEntry: EvaluationLogEntry,
  attempt: number,
  maxAttempts: number
): RevisionContext {
  return {
    priorOutputText: readArtifactText(evalLogEntry.evaluatesStepId),
    evaluationGaps: evalLogEntry.gaps,
    attemptsUsed: attempt,
    maxAttempts,
  };
}

function buildRevisionSystemPromptAddition(ctx: RevisionContext): string {
  return [
    `Your previous output was evaluated and did not meet the required quality standard.`,
    `Specific gaps to address:`,
    ...ctx.evaluationGaps.map((gap, i) => `${i + 1}. ${gap}`),
    `Please address each gap explicitly in your revised output.`,
    `This is revision attempt ${ctx.attemptsUsed} of ${ctx.maxAttempts - 1} permitted.`,
  ].join('\n');
}
```

This addition is appended to the capability's base system prompt. The original
`taskSpec.objective` and `taskSpec.framing` are unchanged.

## 9.4 Evaluate Step Without Paired Generate (Solo Evaluation)

Some plans may include an evaluate step that evaluates an artifact produced by
a prior run or an uploaded document, not a generate step in the current plan.
In this case, the evaluate step is dispatched by the Scheduler as a standalone
step (no inner cycle). Its `evaluatesStepId` points to an artifact that already
exists. The evaluation executes normally; if it fails, there is no revision path
(no `revisesStepId` in the plan). The step completes with the evaluation result.

## 9.5 Evaluation Result Schema (for evaluations.jsonl)

```typescript
interface EvaluationLogEntry {
  entryId: string;
  runId: string;
  stepId: string;           // the S_eval step's ID
  evaluatesStepId: string;  // the S_gen step that produced the evaluated artifact
  attemptNumber: number;    // 1 = first eval; 2+ = after revision attempt
  timestamp: string;
  passed: boolean;
  overallScore: number;
  dimensionScores: Record<QualityDimension, number>;
  requiredDimensionsFailed: QualityDimension[];
  gaps: string[];           // actionable; empty if passed
  evaluatorCapabilityId: CapabilityId;
  evaluatorInstanceId: string;
}
```

---

# PART 10 — SYNTHESIZE, JUDGE, AGGREGATE STEPS

## 10.1 These Are Generate Steps with Different Framing

`synthesize`, `judge`, and `aggregate` are step types that describe the
**nature of the reasoning task** — they are not mechanically different from
`generate` in execution. The Agent Harness invokes the assigned
`capabilityInstanceId` with the task spec's framing.

The Engine dispatches them identically to generate steps (§8), using the
assigned capability instance, context, and tools from the plan.

**Key distinction (Invariant 25):** the step type does NOT determine which
capability runs it. The plan's `capabilityInstanceId` does.

## 10.2 Isolation for Judge Steps (Debate)

For `judge` steps in a debate plan, the judge instance (`CO[judge]`) receives:
- Outputs from `PS[blue]` and `PS[red]` (via `receivesOutputFrom`)
- `mustNotReceiveOutputFrom`: empty (the judge sees both)

The position steps have:
- `PS[blue].mustNotReceiveOutputFrom: [PS[red].stepId]`
- `PS[red].mustNotReceiveOutputFrom: [PS[blue].stepId]`

The Engine enforces these constraints in context assembly (§6.2). The judge
step is only dispatched after both position steps complete (via `dependsOn`).

## 10.3 Aggregate Steps (Council)

For `aggregate` steps, the aggregating capability (CO) receives all assessor
outputs via `receivesOutputFrom`. Assessor steps (`mustNotReceiveOutputFrom`
each other) run concurrently (same `order` value).

The aggregate step's `dependsOn` lists all assessor step IDs. The Scheduler
dispatches the aggregate step only after all assessors complete.

---

# PART 11 — DELEGATE STEP EXECUTION (SUB-AGENTS)

## 11.1 Delegation Architecture

A `delegate` step creates temporary workers. The Engine, not the Agent Harness,
manages worker lifecycle. Workers are not capabilities — they are bounded task
executors that report SubAgentResult back to their parent capability.

```
Engine dispatches delegate step
    │
    ▼
WorkerPool.spawn(delegationSpec.workers)
    │
    ├── Worker 1 (Agent Harness invocation)
    ├── Worker 2 (Agent Harness invocation)
    ├── Worker N (Agent Harness invocation, N ≤ maxWorkers)
    │
    ▼
Workers execute concurrently
    │
    ▼
All workers complete or timeout
    │
    ▼
Engine aggregates results → produces owner capability context
    │
    ▼
Parent capability step (generate or synthesize) proceeds
```

## 11.2 Worker Execution Contract

Each worker is an Agent Harness invocation with:
- `capabilityInstanceId`: the parent capability (RE for research workers)
- `invocationKind`: 'generate' (workers always produce output)
- A scoped `taskSpec` from the `WorkerSpec`
- Only the tools listed in `WorkerSpec.allowedTools`
- `maxDepth: 1` enforced — workers do not spawn sub-workers

Workers run concurrently up to `DelegationPolicy.maxWorkers`.

Each worker has its own timeout derived from `DelegationPolicy.workerBudget.maxDurationMsPerWorker`.

## 11.3 Worker Result Merge

When all workers complete (or timeout):

```typescript
interface WorkerMergeResult {
  successful: SubAgentResult[];
  failed: SubAgentResult[];       // status='failed'
  timedOut: SubAgentResult[];     // timeout
  coverageGaps: string[];         // tasks where no worker succeeded
}

function mergeWorkerResults(
  spec: DelegationSpec,
  results: SubAgentResult[],
  policy: DelegationPolicy
): WorkerMergeResult | FailStep {

  const successful = results.filter(r => r.status === 'complete');

  if (successful.length < policy.minimumSuccessfulWorkers) {
    return FAIL_STEP;
  }

  // Gaps from failed workers are always reported
  const gaps = results
    .filter(r => r.status !== 'complete')
    .map(r => `Coverage gap: ${r.taskDescription}`);

  return { successful, failed: ..., timedOut: ..., coverageGaps: gaps };
}
```

**Contradiction handling:** if two workers return findings that contradict
each other, the Engine does NOT resolve the contradiction. It reports both
findings and flags the contradiction to the parent capability's context:

```
"Note: workers returned contradictory findings on [topic].
Worker A found: [finding]. Worker B found: [finding].
Treat this as an area requiring explicit analysis."
```

The parent capability (RE, synthesizing research) reasons about the
contradiction. The Engine does not silently pick one.

## 11.4 Worker Failure Policy

Per `DelegationPolicy.failureBehavior`:

| Scenario | `'proceed-with-successful'` | `'fail-if-below-minimum'` |
|---|---|---|
| Some workers fail, successful ≥ minimum | Proceed; log gaps | Proceed; log gaps |
| successful < minimum | Fail the delegate step | Fail the delegate step |
| All workers fail | Fail the delegate step | Fail the delegate step |

Gaps are always reported. `DelegationPolicy.gapReportingRequired = true` is
not a configurable option — it is always enforced.

## 11.5 Worker Idempotency

Workers do not receive a persistent stepId and are not tracked in
`completedStepIds`. They are ephemeral. If the process crashes during a
delegate step, the entire delegate step re-runs from the beginning on recovery.
Worker results are not persisted between runs. This is acceptable because
workers are designed to be fast and cheap.

---

# PART 12 — LOOP EXECUTION

## 12.1 Loop Lifecycle Overview

A goal-based loop is a meta-execution layer around the plan's step graph.
The plan's steps define one iteration. The loop policy defines how many
iterations may run and when to stop.

```
Engine enters EXECUTING state with loopPolicy present

Iteration 1:
  Execute all plan steps (§4–§11)
  Collect iteration results
  Engine transitions to PAUSED_BETWEEN_ITERATIONS
  Evaluate termination conditions (§12.2)
  → terminate: engine transitions to COMPLETING
  → continue: reset step state for iteration 2

Iteration N:
  ... (same as above, with prior iteration context if persistentEvidence enabled)
```

## 12.2 Between-Iteration Protocol

When all plan steps for an iteration complete, the Engine executes this
protocol before beginning the next iteration:

```
1. Collect iteration output (artifacts produced in this iteration)
2. Compute iteration quality score (from evaluation results)
3. Evaluate loop termination — ordered precedence (Document 2 §13.2):
   a. IF cancellation signalled → terminate, reason='cancelled'
   b. EVALUATE goal criteria → goalMet: boolean
   c. IF goalMet → terminate, reason='goal-met'
   d. IF loopState.currentIteration >= loopPolicy.maxIterations → terminate
   e. IF consumedActualCostUsd >= loopPolicy.maxTotalCostUsd → terminate
   f. IF consumedDurationMs >= loopPolicy.maxTotalDurationMs → terminate
   g. IF improvement(current, prior) < minimumImprovementPerIteration → terminate
   h. → continue to next iteration

4. IF continuing:
   a. Increment state.loopState.currentIteration
   b. Record state.loopState.lastIterationScore = currentScore
   c. Reset completedStepIds, activeStepIds, failedStepIds to empty
      (plan steps will re-execute)
   d. Assemble prior iteration context (for steps that receive it)
   e. Write updated state.json
   f. Emit loop_iteration_started event
   g. Transition to EXECUTING

5. IF terminating:
   a. Set state.loopState.goalMet = (terminationReason === 'goal-met')
   b. Set state.loopState.terminationReason
   c. Write final state.json
   d. Emit loop_terminated or loop_terminated_goal_met event
   e. Transition to COMPLETING
```

## 12.3 Step State Reset Between Iterations

When the loop continues to the next iteration, step state is reset by clearing
tracking sets:

```typescript
stateManager.resetForNextIteration({
  clearCompletedStepIds: true,
  clearActiveStepIds: true,
  clearFailedStepIds: true,
  clearSkippedStepIds: true,
  clearRevisionAttempts: true,
  clearEvaluationResults: true,
  // DO NOT clear: loopState, consumedActualCostUsd, consumedDurationMs
  // Budget consumption persists across iterations — it is cumulative
})
```

Budget consumption is NOT reset between iterations. The loop's total cost and
duration are cumulative.

## 12.4 Goal Evaluation — Deterministic

Goal criteria evaluation uses structured `EvaluationLogEntry` records from the
current iteration. It never involves an LLM call.

```typescript
function evaluateGoal(
  criteria: GoalCriterion[],
  evaluations: EvaluationLogEntry[]
): { goalMet: boolean; detail: string } {

  // Edge case: depth 'quick' has no evaluation steps (evaluationPassCount = 0).
  // If no criteria, or no evaluations, goal cannot be confirmed as met.
  if (criteria.length === 0) {
    return { goalMet: false, detail: 'No goal criteria defined — treating as not met' };
  }
  if (evaluations.length === 0) {
    return {
      goalMet: false,
      detail: 'No evaluation results in this iteration — depth:quick plans cannot confirm goal criteria'
    };
  }

  const passedEvaluations = evaluations.filter(e => e.passed);

  const results = criteria.map(criterion => {
    const bestScore = Math.max(
      0,
      ...passedEvaluations.flatMap(e =>
        Object.entries(e.dimensionScores)
          .filter(([dim]) => dim === criterion.dimension)
          .map(([, score]) => score)
      )
    );
    return {
      criterion,
      bestScore,
      met: bestScore >= criterion.threshold,
    };
  });

  const allMet = results.every(r => r.met);
  const detail = results
    .map(r => `${r.criterion.dimension}: ${r.bestScore}/${r.criterion.threshold} (${r.met ? 'met' : 'NOT MET'})`)
    .join('; ');

  return { goalMet: allMet, detail };
}

---

# PART 13 — CANCELLATION

## 13.1 Cancellation Signal

Cancellation is triggered by:
- HTTP DELETE to `/api/run` (user-initiated)
- System shutdown signal (SIGTERM, SIGINT)
- Internal engine error escalation (§15.3)

On receipt: the Engine sets `cancellationRequested = true` in memory (not in
state.json yet — the flag is checked at cancellation points).

## 13.2 Cancellation Checkpoints

The Engine checks the cancellation flag at these deterministic points:

| Checkpoint | Location |
|---|---|
| Before dispatching any new step | Scheduler loop |
| Between retry attempts | Technical retry loop (§15.1) |
| Between revision attempts | Revision loop (§9.2) |
| Between loop iterations | Between-iteration protocol (§12.2) |
| Before spawning workers | Delegation dispatch |

**In-flight steps are NOT interrupted.** A step that has already been dispatched
to the Agent Harness runs to its own timeout. The Harness has its own timeout
enforcer (§7.4). On cancellation, the Scheduler stops dispatching new steps, and
the Engine waits for in-flight steps to complete or timeout before transitioning
to CANCELLED.

## 13.3 Cancellation State Write

When all in-flight steps drain:

```
1. Set state.status = 'cancelled'
2. Set state.cancellationRequestedAt, state.cancellationReason
3. Write state.json (atomic)
4. Emit run_cancelled event
5. Clear lock files (V2 compatibility: .current-run.json → isRunning: false)
6. Exit
```

**Completed artifacts are preserved.** Partial artifacts (in-flight when
cancellation arrived) are written with an explicit `incomplete` marker by the
Harness if the step completed during drain. Incomplete artifacts are detectable
from state.json's `producedArtifactIds` vs the plan's `artifactContract`.

## 13.4 Cancellation Race Handling

A step may complete between when cancellation is received and when the
Scheduler checks the flag. This is fine — the step completion is processed
normally. The cancellation only prevents new steps from being dispatched.

---

## CONTROL FLOW SEPARATION — BUDGET vs CANCELLATION vs FAILURE

Three distinct control flows terminate or modify execution. They must not be
conflated because they have different semantics, different state outcomes, and
different user experiences.

| Control flow | Trigger | Source | State.status outcome | Artifacts |
|---|---|---|---|---|
| **Budget exhaustion** | Ceiling hit (cost or duration) | Deterministic Engine check | `partial` | Preserved; incomplete set flagged |
| **Cancellation** | User DELETE, SIGTERM, or Engine escalation | External signal or Engine decision | `cancelled` | Preserved; complete artifacts retained |
| **Step failure** | Technical or quality failure beyond retry/revision | Step execution result | `failed` (if required step) or `running` (if optional) | Preserved; missing artifacts flagged |

These are handled by three separate code paths. They share the State Manager
for writes but have independent logic. The Scheduler checks all three conditions
before each dispatch but routes failures to different handlers.

---

## 14.1 Budget Check Before Every Dispatch

Before dispatching any step, the Engine checks:

```typescript
function budgetCheckBeforeDispatch(
  plan: ExecutionPlan,
  state: ExecutionState
): BudgetCheckResult {

  if (state.consumedActualCostUsd >= plan.hardBudget.costCeilingUsd) {
    return { allowed: false, reason: 'COST_CEILING_HIT' };
  }

  if (state.consumedDurationMs >= plan.hardBudget.maxDurationMs) {
    return {
      allowed: false,
      reason: 'DURATION_CEILING_HIT',
      allowCurrentToComplete: true,  // onDurationExhausted: 'complete-current-then-stop'
    };
  }

  if (state.consumedSteps >= plan.hardBudget.maxTotalSteps) {
    return { allowed: false, reason: 'STEP_COUNT_HIT' };
  }

  return { allowed: true };
}
```

## 14.2 Cost Ceiling vs Duration Ceiling — Different Behaviors

Per Document 2 `HardBudget`:
- `onCostExhausted: 'stop-immediately'` → no new steps dispatched, in-flight steps are NOT waited for; Engine transitions to `BUDGET_EXHAUSTED`
- `onDurationExhausted: 'complete-current-then-stop'` → no new steps dispatched, in-flight steps drain normally, then Engine transitions to `BUDGET_EXHAUSTED`

## 14.3 Budget Watchdog

A background coroutine runs during execution, checking budgets on a timer:

```
every BUDGET_CHECK_INTERVAL_MS (default: 5000ms):
  check consumedDurationMs (updated every second via elapsed timer)
  check consumedActualCostUsd (updated after every step)
  if either ceiling hit: trigger budget enforcement
```

The Budget Watchdog ensures duration ceilings are enforced even if a long-running
step is consuming time without completing (e.g., a model call that is hanging).

---

# PART 15 — FAILURE RECOVERY

## 15.1 Technical Retry Sequence

When a Harness returns `status: 'technical-failure'` with `retryable: true`:

```
1. Increment state.retryCountByStepId[stepId]
2. Check: retryCount <= plan.failurePlan.onTechnicalRetry.maxTechnicalRetries (2)
   IF YES:
     a. Emit step_retried event
     b. Apply backoff delay (see §15.1.1)
     c. If retry count == 2 AND plan.failurePlan.onTechnicalRetry.useFallbackModel:
        use fallback model for this invocation
     d. Re-invoke Harness
   IF NO:
     b. Step has failed beyond technical retry
     c. Apply step failure logic (§15.2)
```

**Backoff policy:**
- Retry 1: 1 second delay
- Retry 2: 3 seconds delay, switch to fallback model

**For `PROVIDER_RATE_LIMIT` (429):** use the `Retry-After` header value if
present (up to 30 seconds); otherwise 10 seconds. This supersedes the backoff
above.

## 15.2 Step Failure — Dependency Cascade

When a step fails beyond retry and revision:

```typescript
function applyStepFailure(
  step: ExecutionStep,
  plan: ExecutionPlan,
  state: ExecutionState,
  reason: string,
  cascadeDepth: number = 0    // guard against pathological plans
): void {
  if (cascadeDepth > 50) {
    // The Compiler's acyclicity check should prevent this.
    // If reached: plan invariant violated.
    throw new EngineError('ENG_01', 'Cascade depth exceeded — acyclicity violation');
  }

  // 1. Record as failed (idempotent — safe to call multiple times for the same step)
  if (!state.failedStepIds.includes(step.stepId)) {
    stateManager.failStep(step.stepId, reason);
  }

  const required = isStepRequired(step, plan);

  if (!required) {
    // Non-required step failure — log as warning, do not cascade
    emitEvent('step_failed', { stepId: step.stepId, severity: 'warning', reason });
    return;
  }

  // 2. Cascade to direct dependents
  const directDependents = plan.steps.filter(
    s => s.dependsOn.includes(step.stepId) && !state.failedStepIds.includes(s.stepId)
  );

  for (const dependent of directDependents) {
    stateManager.skipStep(dependent.stepId, `upstream-failure:${step.stepId}`);
    applyStepFailure(dependent, plan, state, 'upstream-failure', cascadeDepth + 1);
  }

  emitEvent('step_failed', { stepId: step.stepId, severity: 'error', reason });

  // 3. Determine run-level outcome AFTER cascade is complete
  if (!canRunComplete(plan, state)) {
    // The run cannot produce all required artifacts — terminal failure
    stateManager.setRunStatus('failed', reason);
    emitEvent('run_failed', { reason: `Required step ${step.stepId} failed: ${reason}` });
    engine.transition('TERMINATED');
  }
  // else: run can still complete via non-failed paths; continue
}

function canRunComplete(plan: ExecutionPlan, state: ExecutionState): boolean {
  // The run can complete if every required artifact can still be produced.
  // An artifact can be produced if the step that produces it is:
  //   - already complete, OR
  //   - not failed and not skipped (i.e., still executable)
  const requiredArtifactIds = new Set(
    plan.artifactContract.artifacts
      .filter(a => a.required)
      .map(a => a.id)
  );

  for (const artifactId of requiredArtifactIds) {
    const producingStep = plan.steps.find(s => s.outputArtifactIds.includes(artifactId));
    if (!producingStep) return false; // No step produces it — plan defect

    const isComplete = state.completedStepIds.includes(producingStep.stepId);
    const isFailed   = state.failedStepIds.includes(producingStep.stepId);
    const isSkipped  = state.skippedStepIds.includes(producingStep.stepId);

    if (!isComplete && (isFailed || isSkipped)) return false;
  }
  return true;
}

## 15.3 Unrecoverable Engine Errors

Some errors require immediate run termination regardless of retry budget:

| Error code | Meaning | Action |
|---|---|---|
| `ENG_01: PLAN_INVARIANT_VIOLATED` | Plan violates a Document 2 invariant | Fail immediately |
| `ENG_02: ISOLATION_VIOLATED` | Context assembly returned contaminated context | Fail the step immediately |
| `ENG_03: AUTH_FAILURE` | Provider authentication error (401/403) | Fail the run |
| `ENG_04: ARTIFACT_WRITE_FAILED` | Cannot write artifact after 2 retries | Fail the run |
| `ENG_05: PERSIST_FAILURE` | Cannot write state.json | Attempt once more; if fails, terminate process |
| `ENG_06: SCHEDULER_DEADLOCK` | No ready steps, no active steps, run incomplete | Fail the run |
| `ENG_07: PLAN_NOT_FOUND` | plan.json missing at startup | Fail immediately |
| `ENG_08: PLAN_VERSION_UNSUPPORTED` | Engine cannot run this plan version | Fail immediately |

---

# PART 16 — PERSISTENCE CONTRACT

## 16.1 File Ownership Summary

| File | Written by | Read by | Mutation |
|---|---|---|---|
| `plan.json` | Compiler (before engine starts) | Engine (read-only) | Never |
| `state.json` | Engine (State Manager only) | Engine, Mission Control | Atomic overwrite |
| `events.jsonl` | Engine (Event Emitter only) | Mission Control, Debug tools | Append-only |
| `evaluations.jsonl` | Engine (after each eval step) | Mission Control, Studio | Append-only |
| `artifacts/{id}.md` | Engine (after step completion) | Studio, Desk | Written once; replaced on revision |

## 16.2 State.json Consistency Invariants

At any point in time, `state.json` must satisfy:
- `completedStepIds ∩ activeStepIds = ∅`
- `completedStepIds ∩ failedStepIds = ∅`
- `activeStepIds ∩ failedStepIds = ∅`
- `completedStepIds ∩ skippedStepIds = ∅`
- `consumedActualCostUsd ≥ 0`
- `consumedDurationMs ≥ 0`
- If `status = 'complete'`: all required plan steps are in `completedStepIds`
- If `status = 'failed'`: at least one required step is in `failedStepIds`
- `attemptsByStepId[stepId]` is always an ordered list (latest attempt last)
- No step may appear in more than one of: activeStepIds, completedStepIds,
  failedStepIds, skippedStepIds (these are mutually exclusive sets)

The State Manager validates these invariants on every write (step 3 of the
atomic write protocol, §3.3). Violation → `ENG_09: STATE_INVARIANT_VIOLATED`.

## 16.3 Atomic Artifact Write

```
1. Write content to artifacts/{artifactId}.tmp
2. fsync the tmp file
3. Rename .tmp → artifacts/{artifactId}.md (atomic on POSIX)
4. If rename succeeds: record in state.producedArtifactIds
5. If rename fails: retry step 3 once; if still fails → ENG_04
```

**Artifact identity across revisions:** when a revision produces a new version
of the same artifact, the stable `artifactId` is unchanged. The new content
overwrites the file at the same path. Prior content is not retained in the
filesystem (it may be retained in the workspace artifact model — Document 4/5
concern, not Engine concern).

## 16.4 Events.jsonl Append Contract

```
1. Acquire append lock (in-process mutex, separate from state write lock)
2. Serialize event to JSON (single line)
3. Write line + newline to events.jsonl
4. Release append lock
```

Events from concurrent parallel steps are serialized by the append lock. Order
within the jsonl file reflects arrival order at the lock, not necessarily the
chronological order the steps performed work. The `timestamp` field on each
event provides the actual chronological ordering.

---

# PART 17 — OBSERVABILITY

## 17.1 Event Emission Rules

Every event emitted by the Engine must:
1. Carry a PM-native `activity` text (no stage numbers, no capability IDs as labels)
2. Carry `runId` and `planId` for correlation
3. Carry a monotonic `timestamp`
4. Be written to `events.jsonl` via the append lock (§16.4)

## 17.2 Complete Event Type Catalogue

```typescript
type EngineEventType =
  | 'plan_loaded'              // startup: plan read and validated
  | 'step_started'             // step dispatched to Agent Harness
  | 'step_completed'           // step succeeded
  | 'step_retried'             // technical retry initiated
  | 'step_failed'              // step failed (may not fail the run)
  | 'step_skipped'             // skipped due to upstream failure
  | 'revision_started'         // quality revision initiated
  | 'revision_exhausted'       // revision budget used up
  | 'artifact_written'         // artifact flushed to disk
  | 'evaluation_started'       // evaluate step dispatched
  | 'evaluation_passed'        // evaluation succeeded
  | 'evaluation_failed'        // evaluation failed
  | 'delegation_started'       // delegate step: workers spawned
  | 'worker_started'           // individual worker started
  | 'worker_completed'         // individual worker succeeded
  | 'worker_failed'            // individual worker failed/timed out
  | 'delegation_completed'     // all workers resolved; results merged
  | 'loop_iteration_started'   // new loop iteration beginning
  | 'loop_iteration_completed' // iteration complete; evaluating termination
  | 'loop_terminated'          // loop stopped (without meeting goal)
  | 'loop_terminated_goal_met' // loop stopped because goal was achieved
  | 'budget_warning'           // approaching ceiling (80% consumed)
  | 'budget_exhausted'         // ceiling hit
  | 'cancellation_received'    // cancellation signal received
  | 'cancellation_completed'   // engine fully drained after cancellation
  | 'run_completed'            // all required steps complete; mission done
  | 'run_failed'               // unrecoverable failure; run is over
  | 'run_recovered'            // crash recovery: resumed from prior state
```

## 17.3 PM-Native Activity Text — Examples

| Step type | Situation | Activity text |
|---|---|---|
| generate (RE) | research outcome | "Researching market landscape and competitor dynamics" |
| generate (PS) | prd stage | "Writing the Product Requirements Document" |
| generate (PS[blue]) | debate | "Building the case for this approach" |
| generate (PS[red]) | debate | "Challenging the proposal — finding risks and weaknesses" |
| generate (CO[judge]) | debate | "Synthesizing competing perspectives — preserving genuine disagreement" |
| evaluate (QA) | research | "Evaluating evidence coverage and source quality" |
| evaluate (CO) | decide | "Checking that dissent is preserved in the synthesis" |
| revision_started | any | "Addressing quality gaps identified in the review" |
| worker_started | research | "Gathering competitor intelligence" |
| loop_iteration_started | continuous | "Checking for material changes to competitor X" |

## 17.4 Mission Control Observable State

Mission Control can reconstruct the full execution picture from persisted files:

| Question | Source |
|---|---|
| What did IdeaGate decide to do? | `routing-decision.json`, `plan.json` |
| What is currently executing? | `state.json.activeStepIds` |
| What has completed? | `state.json.completedStepIds` |
| What failed? | `state.json.failedStepIds` |
| What is the quality of each artifact? | `evaluations.jsonl` (latest per step) |
| What happened in order? | `events.jsonl` |
| What did each step do? | `events.jsonl` filtered by stepId |
| How much did this cost? | `state.json.consumedActualCostUsd` |
| What artifacts were produced? | `state.json.producedArtifactIds` |
| What is the loop doing? | `state.json.loopState` |

---

# PART 18 — CRASH RECOVERY AND IDEMPOTENCY

## 18.1 Why Crash Recovery Is Required

The Engine runs inside a Node.js process. That process can crash (OOM, SIGKILL,
power failure). When the system restarts, the next engine invocation for the
same runId must resume correctly — not re-execute completed steps, not produce
duplicate artifacts, not corrupt state.

## 18.2 Recovery Protocol on Startup

```
1. Read state.json
2. Determine startup mode (§3.2)
3. IF status = 'running' (crash recovery):
   a. Log: engine crashed during execution; recovering
   b. Emit run_recovered event
   c. Clear state.activeStepIds (in-flight steps are presumed lost)
   d. For each stepId that WAS in activeStepIds:
      - Check if its artifact exists on disk (§18.3)
      - IF artifact exists: treat step as complete (add to completedStepIds)
      - IF artifact missing: step returns to pending state
   e. Write updated state.json
   f. Resume scheduler loop
```

## 18.3 Artifact Existence Check

A step that produced its artifact but whose state write crashed is recoverable:

```typescript
function checkArtifactExists(
  step: ExecutionStep,
  plan: ExecutionPlan
): boolean {
  return step.outputArtifactIds.every(artifactId => {
    const path = `${WORKSPACE_ROOT}/${plan.missionId}/artifacts/${artifactId}.md`;
    return fs.existsSync(path) && fs.statSync(path).size > 0;
  });
}
```

If all of a step's output artifacts exist and are non-empty, the Engine treats
the step as complete even if it was not in `completedStepIds`. This handles
the crash-between-artifact-write-and-state-write scenario.

## 18.4 Idempotency of Step Execution

Every step execution checks the idempotency guard before dispatch (§3.4).
If a step is already in `completedStepIds` (from crash recovery), it is skipped.

Steps are designed to be re-runnable: generating the same artifact twice
(before state write) produces a new artifact that overwrites the prior one.
Since the artifact write is atomic (§16.3), there is no corruption risk from
re-running a step that partially succeeded.

## 18.5 Revision Cycle Crash Recovery

With the inner-loop revision model (§9.1), the crash recovery protocol for
an in-progress revision cycle is:

```
On startup with state.json showing step S_gen in activeStepIds
AND state.attemptsByStepId[S_gen.stepId] exists with at least one attempt:

1. Read all ExecutionAttempt records for S_gen.stepId from state.json
2. Find the most recent attempt
3. Determine cycle state:

   a. Most recent attempt outcome = 'success' AND
      S_gen.stepId NOT in completedStepIds:
      → Artifact was written but state write crashed.
      → Artifact existence check (§18.3) confirms it exists.
      → Check if paired S_eval has an entry in evaluations.jsonl:
          If yes AND passed: treat cycle as complete (add both to completedStepIds)
          If yes AND failed: resume from revision (increment revision count,
                            re-enter generate-evaluate cycle with revision context
                            built from the last EvaluationLogEntry gaps)
          If no: re-run the evaluation step with the existing artifact

   b. Most recent attempt outcome = 'in-progress':
      → The process crashed during the Harness invocation.
      → Discard the in-progress attempt record (update to 'technical-failure').
      → Re-enter the cycle from the generate step.
      → Revision count = number of prior 'quality-revision' attempts.

   c. Most recent attempt outcome = 'quality-failure':
      → The evaluate step ran and failed, but the revision was not yet started.
      → Re-enter from the revision path using the last EvaluationLogEntry.
```

**Why ExecutionAttempt records enable this:** they preserve, in state.json,
the complete history of what happened to a step — including whether a revision
was in progress, what attempt number was reached, and what gaps the evaluator
found. A crash at any point leaves a recoverable state.

## 18.6 Worker Recovery

Workers are ephemeral (§11.5). On crash recovery, a delegate step that was
in-flight is treated as incomplete (its artifact likely does not exist). The
delegate step re-runs from the beginning, spawning workers fresh.

---

# PART 19 — V2 ENGINE COMPATIBILITY

## 19.1 The Build Outcome and V2 Lifecycle

The `build` outcome uses `internalStageMappings` to map V3 plan steps to the
existing V2 coordinator's 15-stage lifecycle. The V3 Engine does not rewrite
the V2 coordinator — it wraps it.

```typescript
function executeV2CompatibleStep(
  step: ExecutionStep,
  plan: ExecutionPlan
): Promise<HarnessResult> {
  const mapping = plan.internalStageMappings?.find(m => m.stepId === step.stepId);
  if (mapping) {
    // Delegate to the existing coordinator stage execution
    return v2Coordinator.executeStage(
      mapping.internalStageIndex,
      buildV2Context(step, plan, state)
    );
  }
  // Non-V2-mapped step: use standard Agent Harness
  return agentHarness.invoke(buildHarnessInvocation(step, plan, state));
}
```

## 19.2 V2 Protected Files

The V3 Engine must not modify:
- `coordinator-v2.js`
- `lifecycle-engine.js`
- `journey-engine.js`
- `llm.js`

The V3 Engine wraps these files. Future document versions will supersede them,
but until Document 7's implementation plan explicitly migrates a function, the
protected files are read-only.

## 19.3 V2 State Bridge — Derived Projection, Not Competing Truth

`.current-run.json` and `journey.json` are **derived projections** of V3 runtime
state. They are written by the Engine as secondary outputs for backward
compatibility with V2-era surfaces (Desk, Studio, Mission Control) that read them.

**The V3 `state.json` is the single authoritative runtime state.** The V2 files
are never read back by the Engine. If they diverge from `state.json`, V3 wins.

```typescript
// After every stateManager write, the V2 bridge writes secondary files
function writeV2Bridge(state: ExecutionState, plan: ExecutionPlan): void {
  // .current-run.json — used by /api/run GET to report isRunning
  writeAtomically('.current-run.json', {
    isRunning: state.status === 'running',
    currentStage: resolveCurrentStage(state, plan),  // from internalStageMapping
    currentAgent: resolveCurrentAgent(state, plan),  // from activeStepIds + capabilityInstances
  });

  // journey.json — used by Desk artifact health indicators
  writeAtomically('journey.json', buildJourneyProjection(state, plan));
}
```

**V2 bridge write failures are non-fatal.** If the bridge write fails, the
Engine logs a warning and continues. V3 state.json is unaffected. The UI may
show stale V2 data temporarily; it will catch up on the next state write.

**Migration path:** when Document 7's implementation plan explicitly migrates
Desk, Studio, and Mission Control to read V3 state.json directly, the V2 bridge
is removed. Until then, it runs as a side effect of every state write.

---

# PART 20 — ARCHITECTURAL INVARIANTS

Rules that Document 4, Document 5, and all implementation must not violate.

1. **Engine never writes to plan.json.** plan.json is read-only after Compiler writes it.

2. **All state writes go through the State Manager.** No direct writes to state.json.

3. **State writes are atomic (tmp-rename).** No partial state is ever visible.

4. **The Scheduler uses dependsOn for execution gates.** `order` is a sort hint only. The Engine never infers a dependency from `order`.

5. **mustNotReceiveOutputFrom is enforced before step dispatch.** An isolation violation fails the step immediately; the Engine does not proceed with contaminated context.

6. **Step type does not determine capability.** The Engine invokes `step.capabilityInstanceId`. It never re-derives capability from step type. (Document 2 Invariant 25.)

7. **An evaluate step is a normal ExecutionStep.** It is not a special parallel evaluation system. It lives in `plan.steps[]` and is dispatched by the Scheduler.

8. **Quality revision does not create new plan steps.** Revision re-queues the existing generation step with revision context. The plan is unchanged.

9. **Workers do not spawn workers.** The Engine enforces max delegation depth = 1. Any worker DelegationSpec is rejected at dispatch with ENG_10.

10. **Loop termination is deterministic.** The Engine evaluates loop termination conditions in the Document 2 §13.2 precedence order. No LLM decides whether to continue a loop.

11. **Budget ceilings are enforced before dispatch, not after.** A step is never dispatched if it would definitely exceed a ceiling.

12. **Cancellation only prevents new dispatches; it does not interrupt in-flight steps.** In-flight steps run to their own timeout.

13. **Gaps from evaluation must be injected into revision context explicitly.** The revision does not assume the model remembers the original evaluation result.

14. **evaluationResultsByStepId in state.json holds the latest result only.** evaluations.jsonl holds the full history. These are not redundant — they serve different consumers.

15. **Partial artifact writes cannot persist.** The tmp-rename protocol ensures an artifact either exists completely or not at all.

16. **On crash recovery, completed step detection uses artifact existence as the ground truth.** state.json may be out of sync after a crash; the artifact filesystem is the recovery ground truth.

17. **consumedActualCostUsd is cumulative across loop iterations.** Budget resets are never applied between iterations.

18. **Worker results that contradict each other are preserved as contradictions.** The Engine does not resolve contradictions; it surfaces them to the parent capability.

19. **Events are appended with a serializing lock.** Concurrent steps do not interleave event records within a single jsonl line.

20. **The V2 coordinator is wrapped, not replaced.** internalStageIndex-mapped steps delegate to V2 execution. V2 protected files are never modified by the Engine.

21. **PM-native activity text is mandatory on every event.** No event may carry stage numbers, capability IDs as topology, or internal implementation labels in its `activity` field.

22. **Idempotency guard runs before every step dispatch.** A step in completedStepIds is never re-executed.

23. **Budget warnings are emitted at 80% consumption.** This allows Mission Control to surface approaching limits before hard termination.

24. **Authentication errors (401/403) are not retried.** They indicate a systemic configuration failure and terminate the run.

25. **The Engine may not make routing decisions.** If it discovers that a step cannot be executed as specified (e.g., capability unavailable), it fails the step — it does not substitute a different capability.

---

# PART 21 — TESTABLE ACCEPTANCE CRITERIA

| # | Criterion | Verification |
|---|---|---|
| 1 | plan.json is byte-identical before and after a complete run | Compare hash before first step and after run_completed |
| 2 | A step in completedStepIds is not re-executed after crash recovery | Crash during step N+1; restart; assert step N is not re-dispatched |
| 3 | Two parallel steps writing to state.json do not produce a corrupt state | Run a plan with 5 concurrent steps; assert state invariants hold (§16.2) after each step |
| 4 | An artifact on disk but not in state.json.producedArtifactIds is recovered correctly | Crash after artifact write, before state write; restart; assert step treated as complete |
| 5 | mustNotReceiveOutputFrom is enforced | In a debate plan, assert PS[blue] context bundle contains zero content from PS[red] |
| 6 | Step type does not determine capability | A synthesize step assigned to PS runs PS, not CO |
| 7 | Loop termination follows Document 2 precedence | In a plan where goalMet and maxIterations both trigger on the same iteration, assert terminationReason='goal-met' |
| 8 | Quality revision uses evaluation gaps | Assert RevisionContext.evaluationGaps matches the gaps array in the evaluation result that triggered revision |
| 9 | Revision does not create a new plan step | Assert plan.steps.length is unchanged after a revision cycle |
| 10 | Budget cost ceiling triggers stop-immediately | Set costCeilingUsd=0.001; assert no steps are dispatched after ceiling is hit |
| 11 | Budget duration ceiling triggers drain-current | Set maxDurationMs very low; assert in-flight step completes; assert new dispatch blocked |
| 12 | Cancellation prevents new dispatches but drains in-flight | Send DELETE while step N is running; assert step N completes; assert step N+1 not dispatched |
| 13 | Worker contradiction is surfaced, not resolved | Two workers return conflicting evidence; assert parent capability context contains both with a contradiction flag |
| 14 | events.jsonl has no interleaved partial-JSON lines | Inspect each line of events.jsonl after a parallel run; every line must be valid JSON |
| 15 | V2 .current-run.json is updated after each state write | After step N completes, assert .current-run.json.currentStage reflects it |
| 16 | Budget warning emitted at 80% | Assert budget_warning event exists in events.jsonl when consumedActualCostUsd >= 0.8 * costCeilingUsd |
| 17 | Auth error (401) terminates run without retry | Mock a 401 response; assert no retry event emitted; assert run_failed with ENG_03 |
| 18 | Run recovery emits run_recovered event | Crash and restart; assert first event in the new session is run_recovered |
| 19 | Evaluate step completes regardless of pass/fail | After evaluation failure that triggers revision, assert evaluate stepId is in completedStepIds |
| 20 | All events carry PM-native activity text | Assert no event.activity matches /Stage \d+|[A-Z]{2}Agent|capabilityId/ |

---

# PART 22A — ADVERSARIAL STATE-MACHINE REVIEW

Corner cases that could produce incorrect runtime behavior, and their mitigations.

| Scenario | Risk | Mitigation |
|---|---|---|
| **Scheduler dispatches a step whose dependsOn step is in failedStepIds** | Step executes with missing dependency output | Step readiness rule (§4.2) requires dependsOn steps to be in `completedStepIds`, not just `not failed` — failed steps are not in completedStepIds, so the dependent step never becomes ready |
| **Parallel steps both complete in <1ms and both call stateManager concurrently** | State corruption | State Manager mutex (§3.3) serializes writes; second writer waits for first to complete |
| **Cost ceiling hit mid-step** | Step completes after ceiling — cost overrun | Budget Watchdog (§14.3) checks every 5s; cost ceiling is checked before dispatch not after; an in-flight step that completes after the ceiling is an accepted overrun (bounded by one step's cost) |
| **Loop plan where evaluationPassCount = 0 (quick depth)** | goalMet can never be confirmed | Goal evaluation returns `{ goalMet: false, detail: 'No evaluation results' }` — the loop terminates at maxIterations, returning best result with explicit uncertainty (§12.4) |
| **Revision cycle crashes between artifact write and evaluations.jsonl append** | Recovery cannot determine eval result | On recovery: artifact exists, S_eval has no evaluations.jsonl entry. Engine re-runs the evaluate step with the existing artifact (§18.5 case a) |
| **Two workers return exactly contradictory evidence with equal confidence** | Merge algorithm could mask the conflict | Contradiction surfacing is mandatory (§11.5) — both findings are passed to parent capability with an explicit contradiction flag |
| **generate step S_gen and its evaluate step S_eval have dependsOn creating a cycle** | Deadlock or crash | Compiler's `CIRCULAR_STEP_DEPENDENCY` check catches this at compile time; Engine never receives cyclic plans |
| **ENG_01 thrown from within applyStepFailure cascade** | Exception escapes; run leaves dirty state | applyStepFailure catches EngineError internally; writes state.status='failed' before propagating |
| **Cancellation received between revision attempts** | Revision partially written; cancellation ignored | Cancellation is checked before each generate attempt within the cycle (§13.2 checkpoint) — the cycle terminates cleanly before the next generate invocation |
| **Budget exhausted mid revision-cycle** | Cycle incomplete; run terminates | Budget check is also a cancellation checkpoint for the cycle — when budget exhausts, the cycle applies `onRevisionExhausted: 'advance-with-warning'` with the last artifact, then run terminates with status='partial' |
| **contextManager.scope() returns withinBudget=false** | Context was truncated; model has incomplete information | Engine logs a warning, emits a non-fatal event; proceeds. The Context Manager (Document 4) is responsible for ensuring truncated context is still coherent |
| **state.json.tmp write succeeds but rename fails** | Next read sees old state; recovery risks double-execution | The idempotency guard (§3.4) prevents re-execution; artifact existence check (§18.3) recovers completed work |
| **Evaluate step assigned to a capability instance not in the plan** | Harness cannot find the instance | Engine validates `capabilityInstanceId` exists in `plan.capabilityInstances` before every dispatch; fails with ENG_01 if not found |

---

# PART 22B — DOCUMENT 4 SEAM CLARITY

This section formally states what is inside and outside Document 3's boundary,
to prevent Document 4 from inadvertently redesigning runtime behavior.

**Document 3 owns:**
- When to call `contextManager.scope()`
- Enforcing isolation before the call (§6.3)
- Handling `contextManager.scope()` failure (§6.4)
- The `ContextRequest` and `ContextResponse` types (the interface contract)
- Passing `AssembledContext` to the Harness opaquely

**Document 4 owns:**
- What "workspace knowledge" contains
- How memory is retrieved (lexical, semantic, recency, provenance)
- How conflicts between knowledge items are represented and preserved
- How evidence provenance is tracked
- How cross-run memory differs from within-run memory
- How project isolation is enforced
- How context is tokenized and budget-managed
- How uploads/URLs are extracted and indexed
- How the Universal Memory Layer (UML) is evaluated and potentially adopted
- The internal structure of `WorkspaceKnowledgeSlice` and `WorkspaceKnowledgeItem`
- The internal structure of `ResolvedContextItem` beyond the fields in §6.2

**The `contextManager` is a wall, not a pipe.** Document 3 passes a request
in; gets a fully assembled context bundle back; does not know or care about
the retrieval system behind it. Document 4 may implement UML, a native subsystem,
a hybrid, or anything that satisfies the `ContextManager` interface contract.

**Note on `workspaceKnowledge`:** the `WorkspaceKnowledgeSlice` in `AssembledContext`
(§6.2) is intentionally left structurally open for Document 4. Document 3 passes
it to the Harness as an opaque bundle; the Harness serializes it into the prompt.
Document 4 determines the internal structure. The only constraint Document 3
imposes is that `WorkspaceKnowledgeItem.content` is a string that can be
injected into a prompt, and `provenance` is a non-empty string reference.

---

Each proposed requirement from the document header is now resolved.

| Requirement | Resolution | Section |
|---|---|---|
| Step-level idempotency guard | §3.4 — check completedStepIds before dispatch | §3.4 |
| Atomic state writes | §3.3 — tmp-rename protocol | §3.3 |
| Single-writer state manager | §3.3 — in-process mutex serializes all state writes | §3.3 |
| Step-level timeout | §7.4 — computed per step from remaining budget and step type defaults | §7.4 |
| Provider failure taxonomy | §7.5 — eight failure codes, distinct retry behaviors | §7.5 |
| Malformed output handling | §7.6 — two-attempt parse; schema validation; revision path | §7.6 |
| Tool failure policy | §7.7 — critical vs non-critical per tool type | §7.7 |
| Cancellation checkpoint protocol | §13.2 — five defined checkpoints | §13.2 |
| Partial artifact write guard | §16.3 — tmp-rename for artifacts | §16.3 |
| Event serialization (append-lock) | §16.4 — in-process mutex for jsonl appends | §16.4 |
| Crash recovery protocol | Part 18 — startup mode determination; artifact-as-ground-truth | Part 18 |
| Duplicate execution prevention | §3.4, §18.2 — idempotency guard at dispatch and recovery | §3.4 |
| Worker result merge conflict handling | §11.5 — contradictions surfaced, not resolved | §11.5 |
| Gap context assembly for revision | §9.3 — explicit injection of gaps into revision prompt | §9.3 |
| Stale artifact detection on restart | §18.3 — artifact existence check for recovery | §18.3 |

---

# PART 23 — OPEN DECISIONS

| Decision | Why it matters | Options | Recommendation | Resolves in |
|---|---|---|---|---|
| Scheduler poll interval | Too short = CPU waste; too long = latency between steps | 100ms–1000ms | 200ms — acceptable latency, negligible CPU | Implementation |
| Step timeout default values | Values in §7.4 are estimates; real latency data needed | Calibrate from V2 execution logs | Instrument V2 first; tune in Phase 1 | Phase 1 |
| Budget warning threshold (80%) | Arbitrary; may be too late for long steps | 70%/80%/90% | 80% — gives warning while leaving headroom | Implementation |
| Context size ceiling for Document 4 | Determines when context manager is invoked | Document 4 scope | Document 4 defines; Engine calls the interface | Document 4 |
| Worker timeout policy | Per-worker absolute vs relative to delegation budget | Per-spec | `workerBudget.maxDurationMsPerWorker` from Document 2 (absolute) | Phase 4 |
| V2 state bridge format | .current-run.json schema may diverge from V3 needs | Extend V2 format; maintain exact compat; migrate format | Maintain exact V2 format until Document 7 migration plan exists | Document 7 |
| events.jsonl rotation | Long runs produce large jsonl files | Rotate by size; rotate by run; no rotation | Rotate by run (one file per runId) — already implied by path structure | Implementation |

---

# PART 24 — EXPLICIT DEFERRALS

1. **Context extraction and retrieval** — how uploaded files are parsed and delivered to the context assembler. Document 4 defines the interface; Document 3 calls it.

2. **Persistent evidence store** — cross-iteration state for goal-based loops. Phase 4 infrastructure. Document 3's loop execution assumes `persistentEvidence` is available if `persistentEvidenceEnabled = true`; Phase 1 may set this to false for all plans.

3. **Model selection per invocation** — which specific model within the provider is used for each capability invocation. Inherited from V2 configuration (`model-registry.ts`). Document 3 consumes the configured model; does not select it.

4. **Prompt engineering per capability** — the exact system prompt base per capability and per outcome. Document 5 (Outcome Engineering Contracts) defines these. Document 3 assembles them from the plan's `instanceFraming` field.

5. **Structured output schemas** — the specific TypeScript types for `outputSchema: 'structured'` step outputs. Document 5.

6. **Agent-to-agent communication patterns beyond the plan graph** — currently all information flow is mediated by the plan's `receivesOutputFrom` links. Future multi-agent conversation patterns are out of scope.

7. **Real-time streaming of partial model output** — the current contract is step-complete events. Streaming token-by-token output to the UI is deferred.

---

# PART 25 — DOCUMENT 3 DEFINITION OF DONE

Document 4 may proceed only when all items on this checklist are confirmed.

**Engine:**
- [ ] Engine lifecycle state machine defined with all transitions
- [ ] Plan intake and validation sequence defined
- [ ] Startup mode determination covers all state.json scenarios
- [ ] Single-writer State Manager with atomic write protocol defined
- [ ] Idempotency guard specified for all dispatch paths

**Scheduler:**
- [ ] Step readiness rule covers all conditions
- [ ] Scheduler loop pseudocode defined
- [ ] dependsOn vs order authority clarified for the Scheduler
- [ ] Required vs optional step distinction defined

**Step Execution:**
- [ ] Per-step state machine covers all states and transitions
- [ ] Generate step execution sequence defined
- [ ] Evaluate step execution sequence defined
- [ ] Revision execution sequence defined with gap context injection
- [ ] Synthesize/judge/aggregate steps defined as Harness invocations
- [ ] Step completion state transition contract defined

**Agent Harness:**
- [ ] HarnessInvocation schema complete
- [ ] HarnessResult schema complete
- [ ] Step timeout computation defined
- [ ] Provider failure taxonomy complete (8 failure codes)
- [ ] Malformed output handling defined
- [ ] Tool allowlist enforcement defined
- [ ] Tool failure policy table defined
- [ ] RevisionContext schema defined

**Delegation:**
- [ ] Worker execution contract defined
- [ ] WorkerMergeResult defined
- [ ] Worker failure policy table defined
- [ ] Contradiction handling defined (surfaced, not resolved)
- [ ] Worker idempotency (ephemeral — delegate re-runs) defined

**Loop:**
- [ ] Loop lifecycle protocol defined
- [ ] Between-iteration protocol defined
- [ ] Step state reset between iterations defined
- [ ] Goal evaluation is deterministic (no LLM involvement) defined
- [ ] Loop termination follows Document 2 §13.2 precedence

**Cancellation:**
- [ ] Five cancellation checkpoints defined
- [ ] In-flight step drain behavior defined
- [ ] Cancellation state write protocol defined
- [ ] Cancellation race handling defined

**Budget:**
- [ ] Budget check before dispatch defined
- [ ] Cost vs duration ceiling difference (stop-immediately vs drain) defined
- [ ] Budget Watchdog coroutine defined

**Persistence:**
- [ ] Atomic state write (tmp-rename) defined
- [ ] State invariants defined
- [ ] Atomic artifact write defined
- [ ] events.jsonl append-lock protocol defined

**Crash Recovery:**
- [ ] Recovery protocol covers all startup modes
- [ ] Artifact-existence check defined
- [ ] activeStepIds clearing on recovery defined
- [ ] Revision state recovery defined
- [ ] Worker recovery defined (ephemeral — full re-run)

**Observability:**
- [ ] 22 event types enumerated
- [ ] PM-native activity text examples provided
- [ ] Mission Control observable state mapping complete

**V2 Compatibility:**
- [ ] V2 state bridge defined (secondary writes to .current-run.json, journey.json)
- [ ] Protected files listed as read-only
- [ ] internalStageIndex mapping execution defined

**Invariants and Criteria:**
- [ ] 25 invariants stated
- [ ] 20 testable acceptance criteria stated

---

# PART 26 — DOCUMENT 4 HANDOFF REQUIREMENTS

## What Document 4 Is Allowed to Assume

1. The Engine calls `contextManager.scope(request: ContextRequest)` and receives
   a `ContextResponse` before every step dispatch. Document 4 implements this interface.
   The full interface contract is in §6.2 of this document.

2. The Engine enforces isolation (`mustNotReceiveOutputFrom`) before calling scope.
   Document 4's context manager never receives a request containing prohibited source IDs.

3. `ContextResponse.withinBudget = false` means the context was truncated by the
   Context Manager. The Engine proceeds; Document 4 is responsible for coherence
   of the truncated result.

4. A `contextManager.scope()` failure is treated as a technical failure of the step
   (retryable). Document 4 must ensure scope() is safe to retry.

5. `plan.contextPlan.capabilityContextIds` defines which context item IDs are scoped
   to which capability instances. Document 4's retrieval respects these scopes.

6. `plan.contextPlan.workspaceMemory.include` and `.scope` determine whether and
   what workspace memory should be retrieved. The actual retrieval is Document 4.

7. `WorkspaceKnowledgeItem.content` must be a string injectable into a prompt.
   `WorkspaceKnowledgeItem.provenance` must be a non-empty source reference.

8. For loop missions with `persistentEvidenceEnabled: true`, Document 4 provides
   a persistent evidence store. Document 3's loop execution reads prior-iteration
   evidence from this store via the contextManager interface.

## What Document 4 Must NOT Redesign

1. The `ContextRequest` and `ContextResponse` type contracts (§6.2)
2. When `contextManager.scope()` is called (the Engine decides this)
3. The isolation enforcement (§6.3) — that happens before Document 4 is invoked
4. URL syntax validation — already done by the Normalizer (Document 2 §2.3)
5. The `AssembledContext` type signature — Document 4 populates it; the type is frozen here
6. The `ExecutionAttempt` schema — crash recovery depends on it
7. The `EvaluationLogEntry` schema — goal evaluation depends on it

## What Document 4 Must Define

1. The internal structure of `WorkspaceKnowledgeSlice`
2. Memory categories (current-run, project, cross-run, evidence, artifact retrieval)
3. Retrieval strategy, ranking, and conflict representation
4. Provenance tracking format
5. Freshness and staleness semantics
6. Project isolation enforcement
7. Memory write policy (what becomes durable memory)
8. Evaluation of the Universal Memory Layer (UML) as an architectural option
9. Context budget management and summarization strategy
10. Failure/fallback behavior when retrieval is unavailable or returns stale data

---

# ADVERSARIAL CONSISTENCY REVIEW

Review of every Document 2 invariant for consistency with Document 3 contracts.

| Document 2 Invariant | Consistent? | Document 3 mechanism |
|---|---|---|
| 1. Router is deterministic | N/A (Engine concern) | — |
| 2. Artifact contracts drive domain capability | N/A (Router concern) | — |
| 3. CO not a domain capability | ✅ | Engine invokes `capabilityInstanceId`; doesn't interpret capability |
| 4. Orchestration Engine is not CO | ✅ | §3.2 explicit; Invariant #6 |
| 5. ExecutionPlan immutable | ✅ | §3.3, Part 16, Invariant #1; engine never writes plan.json |
| 6. ExecutionState separate and mutable | ✅ | State Manager owns all writes; Part 14 |
| 7. Plan persisted before execution | ✅ | §3.1 — startup reads existing plan.json |
| 8. Isolation declared in plan | ✅ | §6.2 — enforcement at context assembly |
| 9. All loops bounded | ✅ | §12.2 — termination evaluation; Invariant #10 |
| 10. Goal loops depth-independent | ✅ | Loop execution doesn't reference depth |
| 11. Delegation depth = 1 in V1 | ✅ | §11.2, Invariant #9 |
| 12. Sub-agents are temporary | ✅ | §11.5 — workers are ephemeral; not in capabilities |
| 13. No semantic fallback | ✅ | §15.3 ENG_25 — capability unavailable → fail, not substitute |
| 14. Safety normalization is disclosed | N/A (Normalizer concern) | — |
| 15. URL reachability belongs to Context Engine | ✅ | §6.3 defers to Document 4's context manager |
| 16. Evaluation in unified graph | ✅ | Evaluate steps dispatched by Scheduler like any step |
| 17. Run vs persistent artifact dependencies | ✅ | §8.2 — Engine writes to runArtifactDependencies only |
| 18. Artifact IDs are stable | ✅ | §16.3 — same path on revision; ID unchanged |
| 19. No artifact assumed Markdown forever | ✅ | Harness returns `outputText` or `structuredOutput` |
| 20. Canonical persistence path | ✅ | All paths use `workspace/{projectId}/runs/{runId}/` |
| 21. Activity text is PM-native | ✅ | Invariant #21; Acceptance Criterion #20 |
| 22. Continuous execution is a composition | ✅ | Loop execution is generic; no "continuous" special case |
| 23. Mission Control reads persisted files | ✅ | §17.4 maps every question to a persisted file |
| 24. Depth controls rigor, not capability expansion | N/A (Router concern) | — |
| 25. StepType = WHAT, CapabilityId = WHO | ✅ | §7.1, §10.1, Invariant #6 |

**Unresolved ambiguities identified:**

1. **`EvaluationResult` structure from the Harness:** Document 2 defines `EvaluationPolicy.dimensions` and the scoring model, but does not specify how the model returns dimension scores. Document 5 (Outcome Engineering Contracts) must define the structured output schema for evaluate steps so the Engine can parse scores deterministically.

2. **`outputSchema` values:** `OutputSchemaId` is referenced in `TaskSpec` but the specific schema IDs are not defined in Document 2. Document 5 must enumerate them.

3. **`contextManager.scope()` interface:** Document 3 calls it; Document 4 implements it. The interface (input/output types) needs to be agreed before implementation. Document 4 should treat the `AssembledContext` schema in §6.1 as the contract.

4. **Improvement pipeline integration:** The existing `/api/improve` route is not governed by the V3 Engine — it predates this architecture. Document 5 or Document 7 must clarify whether the improve pipeline should be migrated into the Engine's plan-execution model or remain a parallel path.

---

*IdeaGate — Orchestration Engine + Agent Harness Specification*
*Document 3 of 7 | Version 1.0 — Authoritative*
*Status: Pre-Implementation*
*Depends on: Document 1 (FROZEN), Document 2 (FROZEN / V1.1)*
*Feeds: Document 4 — Context + Memory + Evidence Specification*
