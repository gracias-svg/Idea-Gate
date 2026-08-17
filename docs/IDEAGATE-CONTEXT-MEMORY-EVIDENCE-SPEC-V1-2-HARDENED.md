# IDEAGATE — CONTEXT + MEMORY + EVIDENCE
# PRODUCT KNOWLEDGE SYSTEM (PKS)
## Document 4 of 7 | Version 1.2 (Hardened) — Authoritative
## Status: Specification — Pre-Implementation

**Supersedes:** Document 4 v1.1
**v1.1 hardening preserved exactly:** P0-1 through P0-5, P1-1 through P1-7
**v1.2 additions:** PM product-intelligence layer — decision lineage, reasoning chain,
artifact stale propagation, dual consumer API, knowledge status lifecycle, V3/V4 artifact support

**Depends on:** Document 3 (FROZEN — Orchestration Engine + Agent Harness)
**Supersedes:** Document 4 Pre-Specification Architectural Analysis (v1.0)
**Feeds:** Document 5 — Outcome Engineering Contracts

**Governing principle (non-negotiable):**
> AI explains and generates. Deterministic rules govern. Persistent knowledge
> is selectively retrieved. Evidence supports claims. Provenance explains why
> information exists. Scope determines who may see it. Context is assembled
> for a purpose. Memory is earned, not automatically accumulated.

**The central design question this document answers:**
> Can IdeaGate remember the right things, retrieve the right things, for the
> right agent, at the right time, for the right reason, with the right provenance,
> without leaking irrelevant or forbidden information, while remaining
> deterministic at the runtime layer?

---

# PART 1 — DOCUMENT OVERVIEW AND BOUNDARY

## 1.1 What the Product Knowledge System Is

IdeaGate is a Product Lifecycle Operating System. It transforms ideas through
a governed PM lifecycle, allowing specialist capabilities to operate over time
without context dumping, contamination, or stale knowledge.

The Product Knowledge System (PKS) is the IdeaGate subsystem that makes
cumulative product intelligence possible. It is not a generic memory layer,
a vector database wrapper, or an RAG system. It is a controlled, provenance-aware,
scope-enforced knowledge substrate that serves one product.

The PKS answers:
- What does IdeaGate currently believe about this product?
- Why does it believe it?
- What evidence supports each belief?
- Which beliefs are stale, superseded, or in conflict?
- Why did a particular agent receive particular information?
- What knowledge survived from prior runs?
- What changed?

## 1.2 What Document 4 Owns

| Responsibility | Owner |
|---|---|
| ContextManager implementation | **Document 4** |
| Memory ontology and schemas | **Document 4** |
| Evidence ontology and schemas | **Document 4** |
| Provenance model | **Document 4** |
| Temporal model | **Document 4** |
| Authority model | **Document 4** |
| Scope/isolation within knowledge retrieval | **Document 4** |
| Retrieval pipeline and ranking | **Document 4** |
| Freshness and supersession | **Document 4** |
| Contradiction model | **Document 4** |
| Context budget management | **Document 4** |
| Evidence capture lifecycle | **Document 4** |
| Memory promotion governance | **Document 4** |
| Cross-run continuity | **Document 4** |
| Loop/continuous research compatibility | **Document 4** |
| Context assembly trace | **Document 4** |
| Knowledge storage (V1 format, phase upgrades) | **Document 4** |

## 1.3 What Document 4 Does NOT Own

| Responsibility | Actual Owner |
|---|---|
| Isolation enforcement (mustNotReceiveOutputFrom) | Document 3 Engine (runs BEFORE PKS) |
| ExecutionPlan schema | Document 2 |
| ExecutionState schema | Document 3 |
| ExecutionAttempt schema | Document 3 |
| EvaluationLogEntry schema | Document 3 |
| Artifact persistence to disk | Document 3 |
| Step scheduling and dispatch | Document 3 |
| Budget enforcement (cost/duration ceilings) | Document 3 |
| Cancellation semantics | Document 3 |
| Failure cascade | Document 3 |
| V2 compatibility projections | Document 3 |
| ContextRequest / ContextResponse schemas | Document 3 (frozen) |
| AssembledContext schema | Document 3 (frozen) |

## 1.4 Boundary Invariant

**Document 3 enforces isolation before calling scope(). Document 4 implements
scope() and may perform additional knowledge-scope filtering, but must not
contradict or replace Document 3's isolation enforcement.**

---

# PART 2 — DOCUMENT 3 INHERITANCE CONTRACT

## 2.1 Frozen Interface — Document 4 Implements This

```typescript
// Document 4 implements this. Document 3 calls it.
interface ContextManager {
  scope(request: ContextRequest): Promise<ContextResponse>;
}

// Document 3 §6.2 — frozen
interface ContextRequest {
  step: ExecutionStep;
  plan: ExecutionPlan;
  state: ExecutionState;
  revisionContext?: RevisionContext;
  tokenBudget: number;
}

// Document 3 §6.2 — frozen
interface ContextResponse {
  assembledContext: AssembledContext;
  retrievalMetadata: ContextRetrievalMetadata;
  withinBudget: boolean;
  actualTokens: number;
}

// Document 3 §6.2 — frozen
interface AssembledContext {
  contextItems: ResolvedContextItem[];
  priorStepOutputs: PriorStepOutput[];
  workspaceKnowledge: WorkspaceKnowledgeSlice;
  totalTokens: number;
}
```

**Document 4 fills the content of `WorkspaceKnowledgeSlice`, `ResolvedContextItem`,
and `PriorStepOutput`. The schemas of `AssembledContext`, `ContextRequest`, and
`ContextResponse` are frozen and Document 4 must not redefine them.**

## 2.2 What Document 3 Guarantees Before Calling scope()

Before Document 3 calls `contextManager.scope()`, it has already:
1. Enforced `mustNotReceiveOutputFrom` — prohibited source IDs are already filtered
2. Computed the remaining `tokenBudget` from the hard budget ceiling
3. Validated the step's `capabilityInstanceId` is in the plan
4. Assembled the isolation-safe `receivesOutputFrom` list (step.receivesOutputFrom minus mustNotReceiveOutputFrom)

Document 4 does NOT re-enforce these Document 3 rules.

## 2.3 scope() Call Contract

Document 3 calls `scope()` **before every step dispatch**. If `scope()` throws or
times out, Document 3 treats it as a technical failure of the step (retryable, §6.4
of Document 3).

Document 4 must ensure `scope()` is safe to retry with the same inputs.
Partial state from a failed `scope()` call must not corrupt the knowledge store.

## 2.4 New Fields on AssembledContext Structures

Document 4 defines the full internal schema for these types, which Document 3
declared as opaque:

```typescript
// Document 4 defines this fully (§3.3 below)
interface WorkspaceKnowledgeSlice {
  items: WorkspaceKnowledgeItem[];
  evidenceItems: EvidenceItem[];    // scoped evidence for this step
  totalTokens: number;
  retrievalMetadata: KnowledgeRetrievalMetadata;
  overflowOccurred: boolean;        // true if budget overflow happened (§15)
  overflowDetails?: ContextOverflowRecord;
}

// Document 4 defines content extraction
interface ResolvedContextItem {
  contextItemId: string;
  content: string;
  mimeType: string;
  sourceRef: string;
  tokenEstimate: number;
  provenance: ContextItemProvenance;
}

// Document 4 defines what's in prior step outputs
interface PriorStepOutput {
  stepId: string;
  capabilityId: CapabilityId;
  artifactIds: string[];
  content: string;          // full or summarized artifact content
  tokenEstimate: number;
  summarized: boolean;      // true if content was compressed
}
```

---

# PART 3 — CONTEXT TAXONOMY

## 3.1 Five Categories, Two Lifecycles

```
╔══════════════════════════════════════════════════════════════════╗
║  TRANSIENT (lives within one run; never promoted automatically)  ║
║                                                                  ║
║  CATEGORY 1: CURRENT-EXECUTION CONTEXT                          ║
║  • Active task spec, revision context, tool results this step   ║
║  Owned by: Document 3 (Agent Harness). PKS never touches it.   ║
║                                                                  ║
║  CATEGORY 2: RUN STATE CONTEXT                                  ║
║  • Prior step outputs (receivesOutputFrom)                       ║
║  • Artifacts produced in this run                               ║
║  • RunConfig and ExecutionPlan summary                           ║
║  • Loop iteration state                                          ║
║  Source: Document 3 state.json and artifacts on disk             ║
║  PKS role: resolve step artifact content; provide PriorStepOutput║
╠══════════════════════════════════════════════════════════════════╣
║  PERSISTENT (can survive across runs with controlled scope)      ║
║                                                                  ║
║  CATEGORY 3: WORKSPACE / PROJECT KNOWLEDGE                       ║
║  • Decisions, constraints, facts, findings, assumptions          ║
║  • Prior outcomes, unresolved questions                          ║
║  Source: PKS WorkspaceKnowledgeStore                             ║
║  PKS role: retrieve, rank, assemble into WorkspaceKnowledgeSlice ║
║                                                                  ║
║  CATEGORY 4: EVIDENCE                                            ║
║  • Source-grounded observations with provenance                  ║
║  Source: PKS EvidenceStore                                       ║
║  PKS role: capture during run (run-scoped), promote post-run    ║
║                                                                  ║
║  CATEGORY 5: ARTIFACT KNOWLEDGE                                  ║
║  • Summaries and extractions from produced artifacts             ║
║  • Artifact dependency map and version history                   ║
║  Source: PKS ArtifactKnowledgeIndex                              ║
║  PKS role: extract and index from artifacts post-run             ║
╚══════════════════════════════════════════════════════════════════╝
```

## 3.2 The Critical Boundary — Category 2 vs Category 3

**Category 2 (Run State)** is transient. It is available within a run but does
not automatically survive to the next run.

**Category 3 (Project Knowledge)** is persistent within a project. It must be
explicitly promoted from run state via the promotion lifecycle (Part 19).

The boundary between them is a controlled promotion gate, not an automatic copy.
This is the most important boundary Document 4 enforces.

## 3.3 WorkspaceKnowledgeItem — The Document 4 Content Schema

```typescript
interface WorkspaceKnowledgeItem {
  // Identity
  itemId: string;                   // stable UUID; never changes
  version: number;                  // incremented on update; starts at 1
  memoryClass: MemoryClass;

  // Content
  content: string;                  // the knowledge text
  contentSummary?: string;          // compressed version (when generated)

  // Provenance (full — see Part 7)
  provenance: ProvenanceRecord;

  // Temporal (see Part 8)
  temporal: TemporalRecord;

  // Authority (see Part 9)
  authorityScore: number;           // 0–1

  // Retrieval signals
  tags: string[];                   // domain tags for structural retrieval
  stageAffinity?: number[];         // which lifecycle stages this is relevant to
  capabilityAffinity?: CapabilityId[]; // which capabilities typically need this

  // Status
  status: KnowledgeStatus;
  supersededBy?: string;            // itemId of newer version
  supersedes?: string;              // itemId this replaced

  // Contradiction tracking
  contradictionIds: string[];       // ContradictionRecord IDs

  // Confidence
  confidence: number;               // 0–100
  evidenceBasis: EvidenceBasis;

  // Scope
  projectId: string;
  scope: KnowledgeScope;
}

type MemoryClass = 'decision' | 'constraint' | 'fact' | 'research-finding'
                 | 'assumption' | 'prior-outcome' | 'unresolved-question';

type KnowledgeStatus = 'active' | 'aging' | 'stale' | 'superseded' | 'contradicted'
                      | 'candidate' | 'invalidated';

type EvidenceBasis = 'source-grounded' | 'model-generated' | 'user-asserted'
                   | 'inferred' | 'derived';
// CRITICAL: 'model-generated' carries lower authority and confidence.
// 'source-grounded' is the highest-trust evidence basis.

type KnowledgeScope = 'project' | 'run-local';
// 'project': available to all future runs in this project (promoted)
// 'run-local': available only within the current run; discarded at run end

type ContextItemProvenance = {
  contextItemId: string;
  sourcePath: string;        // storagePath or URL
  sourceRef: string;         // display reference
  extractedAt: string;       // ISO 8601
  extractionMethod: string;  // 'file-read' | 'url-fetch' | 'github-read'
}
```

---

# PART 4 — MEMORY ONTOLOGY

Seven memory classes, derived from IdeaGate's lifecycle semantics.

## 4.1 CLASS A — DECISION

A resolved choice the project has made.

```typescript
interface Decision extends WorkspaceKnowledgeItemBase {
  memoryClass: 'decision';
  decisionText: string;              // what was decided
  rationale: string;                 // why (reasoning, not just conclusion)

  // Backward reasoning graph (v1.2) — all optional; populate what is traceable.
  // A decision need not have ALL of these; it MUST have rationale text.
  evidenceIds?: string[];             // EvidenceItem IDs directly supporting this
  findingIds?: string[];              // ResearchFinding itemIds informing this
  implicationIds?: string[];          // Implication records bridging findings → decision
  acceptedAssumptionIds?: string[];   // Assumptions this decision explicitly accepts
  priorDecisionIds?: string[];        // Prior decisions this decision derives from / revises
  validationResultIds?: string[];     // Validation/experiment outcomes that supported this
  userRequirementRefs?: string[];     // Free-text or ID references to explicit user inputs
  alternativesConsidered?: AlternativeConsidered[]; // structured alternatives (§35.3)

  // Forward impact graph (v1.2) — what this decision governs
  derivedConstraintIds?: string[];    // Constraint itemIds that DERIVE from this decision
                                      // (not all constraints come from decisions — see §4.2)
  affectedArtifactIds?: string[];     // Artifact IDs this decision directly impacts

  madeInRun: string;
  madeAtStage?: string;
  // 'under-review' is a Decision-specific status (only) — not a general knowledge lifecycle state
  status: 'active' | 'superseded' | 'under-review';
  authorityScore: 0.9;
}
// Default freshness class: 'stable'
// Supersession: requires a new decision that explicitly supersedes this one
// 'under-review': transitional state indicating this decision is being reconsidered.
//   Not a new persisted lifecycle state for all knowledge items — it applies only to Decision.
// Retrieval priority: always ranked high for relevant steps
```

## 4.2 CLASS B — CONSTRAINT

A boundary the project must operate within.

**Not all constraints have equal authority.** A constraint's authority depends
on how it was established. This distinction prevents the word "constraint" from
becoming a memory-authority escalation mechanism.

```typescript
type ConstraintSource =
  | 'user-stated'           // User explicitly stated this in RunConfig or intent
                            // → authorityScore: 1.0  (inviolable project boundary)
  | 'explicitly-governed'   // Formal governance: regulatory, contractual, explicit policy
                            // → authorityScore: 0.95 (effectively inviolable)
  | 'research-discovered'   // Identified through research/discovery steps
                            // → authorityScore: 0.80 (high-priority, not inviolable)
  | 'model-inferred';       // Inferred by a capability without explicit user direction
                            // → authorityScore: 0.60 (Tier 2 priority only, no authority floor)

interface Constraint extends WorkspaceKnowledgeItemBase {
  memoryClass: 'constraint';
  constraintText: string;       // verbatim as stated — never summarized
  source: ConstraintSource;
  constraintType: 'budget' | 'technical' | 'regulatory' | 'user-preference'
                | 'strategic' | 'timeline' | 'other';
  status: 'active' | 'relaxed' | 'removed';
  evidenceIds?: string[];
  authorityScore: number;       // derived from source (see above); NOT always 1.0

  // Reasoning graph links (v1.2)
  // derivedFromDecisionId is ONLY set for decision-derived constraints.
  // user-stated and explicitly-governed constraints do NOT have this field set —
  // they originate directly from user input or governance, not from a PKS Decision.
  derivedFromDecisionId?: string;  // Set only when source='research-discovered' or
                                   // constraint explicitly flows from a Decision.
                                   // NEVER set when source='user-stated' or 'explicitly-governed'.
  affectedArtifactIds?: string[];  // Artifact IDs governed by this constraint
}
// Constraint origin summary (preserves v1.1 authority model):
// user-stated         → authorityScore=1.0; no derivedFromDecisionId; Tier 0
// explicitly-governed → authorityScore=0.95; may optionally reference a governance doc
// research-discovered → authorityScore=0.80; may set derivedFromDecisionId or findingIds
// model-inferred      → authorityScore=0.60; may set derivedFromDecisionId; not Tier 0
// The constraint source always determines authority — not the presence of a decision link.
// Default freshness class: 'stable'
// Budget Tier protection: ONLY 'user-stated' and 'explicitly-governed' constraints
//   receive Tier 0 budget protection and authority floor (§14).
// 'research-discovered' and 'model-inferred' constraints are Tier 2 items.
// Constraint text is never compressed or summarized (§16) for Tier 0 constraints.
```

## 4.3 CLASS C — FACT

A statement about the world relevant to this product.

```typescript
interface Fact extends WorkspaceKnowledgeItemBase {
  memoryClass: 'fact';
  factText: string;
  domain: string;               // 'market' | 'competitive' | 'technical' | 'user' | ...
  freshnessClass: FreshnessClass; // must be set per domain (see §13)
  evidenceIds: string[];        // facts without evidence get confidence < 0.5
  validFrom?: string;           // ISO 8601
  validUntil?: string;          // ISO 8601 if known
  authorityScore: number;       // varies by source (§9)
}
// Competitor features: 'time-sensitive'
// Historical market facts: 'stable'
// Pricing: 'perishable'
```

## 4.4 CLASS D — RESEARCH FINDING

An evidence-backed conclusion from a discovery or research step.

```typescript
interface ResearchFinding extends WorkspaceKnowledgeItemBase {
  memoryClass: 'research-finding';
  findingText: string;
  supportingEvidenceIds: string[];
  contraEvidenceIds?: string[];      // evidence that complicates this finding
  producedInRun: string;
  producedAtStage: string;
  confidence: number;                // 0–100; reflects evidence strength
  freshnessClass: FreshnessClass;    // based on underlying evidence age

  // Forward reasoning chain — what this finding implies (v1.2)
  implicationIds?: string[];         // Implication records derived from this finding
  derivedAssumptionIds?: string[];   // Assumption itemIds this finding informed
  derivedDecisionIds?: string[];     // Decision itemIds this finding contributed to
}
// Default freshness class: 'time-sensitive'
// Superseded when a newer finding in the same domain contradicts or updates
```

## 4.5 CLASS E — ASSUMPTION

An unverified belief the project is operating on.

```typescript
interface Assumption extends WorkspaceKnowledgeItemBase {
  memoryClass: 'assumption';
  assumptionText: string;
  status: 'unvalidated' | 'validated' | 'invalidated' | 'partially-validated';
  validationEvidenceIds?: string[];
  raisedInRun: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  authorityScore: 0.5;

  // Reasoning chain links (v1.2)
  derivedFromFindingIds?: string[];  // ResearchFinding itemIds that raised this assumption
  governedByDecisionIds?: string[];  // Decision itemIds that explicitly accept this assumption
  affectedArtifactIds?: string[];    // Artifact IDs that rest on this assumption
}
// Default freshness class: 'stable' (until status changes)
// QA capability should receive unvalidated high/critical assumptions as context
```

## 4.6 CLASS F — PRIOR OUTCOME

A record of what a completed run produced and learned.

```typescript
interface PriorOutcome extends WorkspaceKnowledgeItemBase {
  memoryClass: 'prior-outcome';
  runId: string;
  outcomeType: OutcomeId;
  depth: DepthLevel;
  outcomeSummary: string;             // generated post-run
  artifactsProduced: string[];        // artifact IDs
  evaluationResult?: {
    overallScore: number;
    passedDimensions: QualityDimension[];
    failedDimensions: QualityDimension[];
  };
  lessons: string[];                  // extracted learnings
  openQuestionsRaised: string[];      // questions this run raised
  authorityScore: 0.7;                // prior outcomes are informative, not directive
}
// Default freshness class: 'stable' (historical record)
// Never superseded; multiple prior outcomes accumulate
```

## 4.7 CLASS G — UNRESOLVED QUESTION

An open question the project has identified but not resolved.

```typescript
interface UnresolvedQuestion extends WorkspaceKnowledgeItemBase {
  memoryClass: 'unresolved-question';
  questionText: string;
  raisedInRun: string;
  raisedAtStage: string;
  status: 'open' | 'resolved' | 'deferred';
  resolution?: {
    resolvedInRun: string;
    answer: string;
    evidenceIds: string[];
  };
  priority: 'critical' | 'high' | 'medium' | 'low';
  relevantCapabilities: CapabilityId[];
  authorityScore: 0.4;  // questions carry low authority but high retrieval priority for relevant steps
}
```

---

# PART 5 — EVIDENCE ONTOLOGY

Evidence is distinct from memory. Evidence is source-grounded; memory is derived.

## 5.1 Evidence Lineage and PM Reasoning Chain (v1.2)

IdeaGate supports two layered views of the same knowledge chain:

**The epistemic chain** (how knowledge is established):
```
SOURCE
  (external URL, uploaded file, tool result, user assertion)
    ↓  extraction
EVIDENCE ITEM
  (attributed observation with full provenance; run-scoped → project-scoped)
    ↓  capability reasoning
RESEARCH FINDING
  (evidence-backed conclusion; CLASS D; references supportingEvidenceIds)
    ↓  implication step (optional; see §35.2)
IMPLICATION
  (the bridge: "this finding implies that…"; lightweight link record)
    ↓  acceptance or discovery
ASSUMPTION / DECISION
  (CLASS E / CLASS A; referencing findingIds + implicationIds)
    ↓  governance
CONSTRAINT
  (CLASS B; derivedFromDecisionId; governs artifact behavior)
    ↓  impact
ARTIFACT
  (PRD, UX spec, OST, ERD, architecture, MVP canvas, etc.)
```

**The traversal is bidirectional.** Given any node, IdeaGate can walk
backward (why does this decision exist?) and forward (what would change if
this finding were wrong?). See Part 35 for the full lineage query contract.

**These are distinct objects.** A model does not skip levels. An
EvidenceItem is grounded in a source. A memory item references evidence.
A decision references its interpretation chain.

## 5.2 EvidenceItem Schema (P0-4 corrected)

```typescript
interface EvidenceItem {
  evidenceId: string;             // stable UUID

  // Source (never 'model-analysis' — see §5.3)
  sourceRef: string;              // URL, filename, artifact path, tool name
  sourceType: EvidenceSourceType;
  sourceTrustLevel: SourceTrustLevel;

  // Bitemporal (P0-9 fix — see Part 8)
  temporal: EvidenceTemporalRecord;

  // Content
  contentText: string;            // extracted observation
  contentSummary?: string;        // compressed for token efficiency
  extractionMethod: string;       // 'url-fetch' | 'file-read' | 'tool-result' | 'user-stated'

  // Scope
  projectId: string;
  runId: string;                  // which run captured this
  scope: 'run-scoped' | 'project-scoped';  // see §17

  // Attribution
  stepId: string;
  capabilityId: CapabilityId;

  // Status
  status: EvidenceStatus;
  supersededBy?: string;          // evidenceId
  contradictedBy?: string[];      // evidenceIds that conflict

  // Quality
  confidence: number;             // 0–100; the extracting capability's confidence
  evidenceBasis: EvidenceBasis;
}

// 'model-analysis' REMOVED — model reasoning is not evidence (§5.3)
// 'workspace-artifact' REMOVED — artifacts produce ArtifactKnowledgeItems, not EvidenceItems (§5.4)
type EvidenceSourceType =
  | 'web-url'               // fetched from an external web URL
  | 'uploaded-document'     // user-uploaded file (PDF, DOCX, CSV, etc.)
  | 'tool-result'           // returned by a tool call (web-search, github-read, etc.)
  | 'user-stated';          // explicitly stated by the user in RunConfig or intent

type SourceTrustLevel = 'high' | 'medium' | 'low' | 'unknown';

type EvidenceStatus = 'active' | 'superseded' | 'contradicted' | 'retracted'
                    | 'stale' | 'uncertain';
```

## 5.3 Model Output Is Not Evidence — The Epistemic Hierarchy (P0-4 fix)

This is a critical security and integrity rule.

```
EPISTEMIC HIERARCHY (highest to lowest trust):

1. USER_ASSERTED       Source: user directly stated it in RunConfig or intent.
                       Authority: highest. Examples: "Budget is $500K", "We target B2B."
                       Stored as: EvidenceItem(sourceType='user-stated') OR directly
                                  as a Constraint (CLASS B) or Fact (CLASS C).

2. SOURCE_GROUNDED     Source: an external document, URL, or tool result.
                       Authority: high, with trust level per source domain.
                       Stored as: EvidenceItem(sourceType = web-url | uploaded-document
                                  | tool-result | user-stated)
                       Note: workspace-artifact is NOT a valid EvidenceSourceType.
                             Artifacts produce ArtifactKnowledgeItems (see §5.4).

3. DERIVED_CLAIM       Source: reasoning over source-grounded evidence by a capability.
                       Authority: medium. The underlying evidence is the authority.
                       Stored as: WorkspaceKnowledgeItem(evidenceBasis='inferred',
                                  evidenceIds=[...])
                       Note: the evidence IDs must be non-empty for a derived claim to
                             gain any retrieval authority. A derived claim with no
                             evidence IDs has confidence capped at 40.

4. MODEL_GENERATED     Source: model reasoning without external grounding.
                       Authority: low. Must be explicitly marked.
                       Stored as: WorkspaceKnowledgeItem(evidenceBasis='model-generated',
                                  confidence≤50)
                       NOT stored as EvidenceItem.
                       The 'model-analysis' EvidenceSourceType is REMOVED from this
                       specification. Model analysis produces WorkspaceKnowledgeItems,
                       not EvidenceItems.
```

**Memory Poisoning Prevention (Part 25):** a model cannot create an EvidenceItem.
Only the Engine (via extraction tools) can create EvidenceItems, and only when
the source is an external document, URL, tool result, or user assertion.

## 5.4 Artifact-Derived Knowledge vs Evidence — The Laundering Boundary (P0-3)

IdeaGate artifacts are produced by model capabilities. Model-produced content
is not evidence. Therefore a critical architectural rule:

**An IdeaGate artifact is not an evidence source. Artifacts produce
`ArtifactKnowledgeItems`, not `EvidenceItems`.**

```
VALID path:
  External URL / Uploaded doc / Tool result
    ↓ extraction
  EvidenceItem(sourceType='web-url' | 'uploaded-document' | 'tool-result')
    ↓ referenced in artifact via evidenceIds
  Artifact (cites the EvidenceItem)
    ↓ extraction at promotion
  ArtifactKnowledgeItem (evidenceBasis='derived'; references original evidenceIds)

INVALID path (artifact laundering — BLOCKED):
  Model reasoning in artifact
    ↓ extraction
  EvidenceItem(sourceType='workspace-artifact')   ← THIS IS PROHIBITED
    ↓ retrieval
  Future run treats model reasoning as source-grounded evidence
```

`ArtifactKnowledgeItem` is a distinct object type in the `ArtifactKnowledgeIndex`
(Part 21). It has:
- `evidenceBasis: 'derived'` — not 'source-grounded'
- `authorityScore` derived from the artifact's evaluation result and referencing
  evidence (if the artifact's argument cites evidence, authority is higher)
- No `EvidenceSourceType` — it is not an EvidenceItem

If an artifact's text explicitly cites an EvidenceItem (by evidenceId), the
Promotion Engine can reference that pre-existing EvidenceItem. The artifact did
not create new evidence; it referenced existing evidence already in the store.

---

# PART 6 — PROVENANCE MODEL

Every item in the PKS traces to its origin. This is non-negotiable.

## 6.1 ProvenanceRecord Schema

```typescript
interface ProvenanceRecord {
  // Origin chain
  sourceRef: string;             // the original source (URL, path, user input)
  sourceType: EvidenceSourceType | 'promotion';  // 'promotion' for derived items
  extractedFromEvidenceIds?: string[];  // evidence IDs this was derived from
  derivedFromItemIds?: string[];        // knowledge item IDs this built upon

  // Run context
  producedInRun: string;
  producedInStep: string;
  producedByCapability: CapabilityId;
  producedByInstanceRole?: string;     // 'blue' | 'red' | etc. if relevant

  // Temporal
  createdAt: string;            // ISO 8601 — when this item was first created
  lastModifiedAt: string;       // ISO 8601 — updated on status changes
  promotedAt?: string;          // ISO 8601 — when scope changed to 'project'

  // Chain
  supersedes?: string;          // ID of prior item this replaces
  supersededBy?: string;        // ID of item that replaced this one

  // Epistemic
  evidenceBasis: EvidenceBasis;
  confidence: number;           // 0–100

  // Human-edit provenance seam (v1.2 — reserved for V3/V4 collaborative editing)
  // Populated when changeOrigin can be determined. Left undefined for legacy items.
  changeOrigin?: ChangeOrigin;
}

// Distinguishes how the knowledge or artifact version was created.
// This seam allows future Studio / Desk UI to show:
//   "This artifact section was written by IdeaGate" vs "edited by a human" etc.
// changeOrigin does NOT affect retrieval, authority, or promotion logic in V1.
// It is observability / provenance metadata only.
type ChangeOrigin =
  | 'ai-generated'      // produced by a model invocation (default for most PKS items)
  | 'human-authored'    // written or substantially edited by a human in Studio
  | 'evidence-driven'   // directly extracted from an external source by the Engine
  | 'system-derived';   // created by deterministic Engine logic (stale propagation, etc.)
```

## 6.2 Provenance Preservation Rule

Provenance fields are **never compressed, truncated, or discarded** — under
any circumstance, including context budget overflow.

When content is summarized, the ProvenanceRecord of the item travels with it,
unchanged.

When provenance cannot be established for a candidate item (missing required
fields), the item is **rejected from promotion** and logged. An item without
traceable provenance is not knowledge — it is an unchecked model output.

## 6.3 The "Why Did This Agent See This?" Chain

Every `WorkspaceKnowledgeItem` included in an `AssembledContext` must have:
1. A `ProvenanceRecord` (why this item exists in the knowledge store)
2. A `ContextInclusionReason` in the `ContextAssemblyTrace` (why it was retrieved for this step)

Together, these answer: "Why did this agent see this information?"

---

# PART 7 — TEMPORAL MODEL (P0-9 fix)

## 7.1 Bitemporal Tracking

Inspired by Zep/Graphiti's bitemporal approach, every EvidenceItem and
WorkspaceKnowledgeItem carries both when something happened in the world
AND when IdeaGate observed it.

```typescript
interface EvidenceTemporalRecord {
  // When IdeaGate observed/captured this (always required)
  observedAt: string;            // ISO 8601

  // When the source material was published (optional — from web content, documents)
  sourcePublishedAt?: string;    // ISO 8601

  // When this fact was true in the real world (optional — for time-scoped facts)
  eventTime?: string;            // ISO 8601 e.g., "Competitor X launched Feature Y on 2026-03-15"

  // Validity window (optional — for facts with known expiry)
  validFrom?: string;            // ISO 8601
  validUntil?: string;           // ISO 8601 e.g., "pricing valid until end of Q3 2026"

  // Freshness class (governs decay — see Part 13)
  freshnessClass: FreshnessClass;

  // Computed freshness state (updated during retrieval, not stored)
  // freshnessState is computed dynamically; not persisted
}

type FreshnessClass =
  | 'stable'          // unlikely to change (historical, published research)
  | 'time-sensitive'  // meaningful decay over weeks/months (competitor features, pricing)
  | 'perishable'      // changes rapidly (news, announcements, promotions)
  | 'unknown';        // freshness cannot be determined from source

interface WorkspaceKnowledgeTemporalRecord extends EvidenceTemporalRecord {
  promotedAt?: string;           // when moved from run-scoped to project-scoped
  lastAccessedAt?: string;       // when last included in context (for LRU policies)
}
```

## 7.2 Why Both Timestamps Matter

**Scenario:** Competitor X announced a new feature (eventTime: 2026-06-01).
IdeaGate ran a research mission that found this on 2026-07-15 (observedAt).
On 2026-08-14, a new run starts and retrieves this evidence.

- `observedAt` = 2026-07-15 → recency score calculation
- `eventTime` = 2026-06-01 → the fact's age in the world
- `sourcePublishedAt` = 2026-06-02 → the announcement's publication date

For a feature announcement (`freshnessClass: 'time-sensitive'`), all three
matter for determining whether the information is still current.

## 7.3 Fields Required vs Optional by Context

| Item type | observedAt | sourcePublishedAt | eventTime | validFrom / validUntil |
|---|---|---|---|---|
| EvidenceItem (any source) | **Required** | Optional | Optional | Optional |
| WorkspaceKnowledgeItem | **Required** | Optional | Optional | Optional |
| Constraint | **Required** | Not applicable | Not applicable | Optional |
| Decision | **Required** | Not applicable | Optional | Optional |

## 7.4 V1 Temporal Calculation Semantics (P1-1)

**What drives freshness in V1 vs what is metadata:**

| Temporal field | V1 role | Notes |
|---|---|---|
| `observedAt` | **Primary freshness signal** — drives `recencyScore` and `freshnessMultiplier` calculation (§11.4) | Always required; always used |
| `validUntil` | **Hard expiry check** — if set and `now > validUntil`, the item scores 0 regardless of other signals | Used as an override in Step 2 of the ranking formula |
| `eventTime` | **Stored metadata only in V1** — describes when the real-world event occurred; does not modify the freshness calculation | Useful for display and future temporal reasoning |
| `sourcePublishedAt` | **Stored metadata only in V1** — describes the source publication date | Does not modify freshness calculation |
| `validFrom` | **Stored metadata only in V1** — records the start of known validity | Not used in V1 retrieval computation |

**V1 does not claim operational bitemporal reasoning.** It stores the temporal
fields because they will be needed in Phase 3+ for more sophisticated freshness
policies (e.g., a competitor fact with `eventTime: 2024-01-01` but
`observedAt: 2026-08-01` is fresh in observation but old in event time).

For now: store all temporal data; compute freshness from `observedAt` with
`validUntil` as a hard override. Phase 3 will introduce richer temporal policies.

**This is an honest claim, not a speculative one.**

---

# PART 8 — AUTHORITY MODEL (P0-3 fix)

## 8.1 The Problem Being Solved

A high-quality external web source (sourceTrustLevel='high') must NOT
automatically outrank an explicit project constraint (user-stated). A PM's
decision about their own product has maximum project authority regardless of
how many external sources disagree.

Source reliability (epistemic quality of the evidence) is distinct from
project authority (standing within this product's knowledge base).

## 8.2 Three Separate Dimensions

| Dimension | Meaning | Determines |
|---|---|---|
| **Source Reliability** | How trustworthy is the external source? | Evidence quality signal in ranking |
| **Project Authority** | How authoritative is this item within THIS project? | Override protection for decisions/constraints |
| **Confidence** | How certain is the system about this item's accuracy? | Retrieval score modifier |

These are **independently scored** and **independently applied**.

## 8.3 Project Authority Score

```typescript
function computeAuthorityScore(item: WorkspaceKnowledgeItem): number {
  switch (item.memoryClass) {
    case 'constraint':       return 1.0;  // maximum — inviolable project boundaries
    case 'decision':         return 0.9;  // near-maximum — resolved project choices
    case 'assumption':       return 0.5;  // provisional — not yet validated
    case 'fact':             return authorityFromSource(item.provenance.sourceType);
    case 'research-finding': return authorityFromSource(item.provenance.sourceType);
    case 'prior-outcome':    return 0.7;  // informative but not directive
    case 'unresolved-question': return 0.4; // open, low authority
  }
}

function authorityFromSource(sourceType: string): number {
  switch (sourceType) {
    case 'user-stated':   return 0.95;  // user explicitly stated this
    case 'promotion':     return 0.80;  // promoted from a capability's analysis
    case 'tool-result':   return 0.70;  // tool-derived, external
    case 'web-url':       return 0.60;  // external; variable trust
    case 'uploaded-document': return 0.75; // user-provided; trusted as relevant
    default:              return 0.50;
  }
}
```

## 8.4 Authority Override Rule (P0-2 corrected)

**Authority protects a relevant item from sinking below its standing.
Authority cannot manufacture relevance for an irrelevant item.**

In the ranking formula (Part 11), `authorityScore` participates in the weighted
sum as a signal. The authority floor is applied in Step 5 — **after** the
relevance threshold check in Step 4. An item that does not pass the relevance
threshold (< 0.30) is excluded before the authority floor is considered.

```
Correct (v1.1):
  Step 4: apply relevance threshold — if pre_floor_score < 0.30 → EXCLUDE
  Step 5: for items that passed Step 4 AND memoryClass ∈ ['constraint','decision']
          AND authorityScore >= 0.85 AND applicability check passes:
          final_score = max(pre_floor_score, 0.80)

Prohibited (v1.0 error):
  Apply authority floor → inflated score → passes threshold → irrelevant item enters context
```

The authority floor's purpose is **protection, not promotion**: it prevents a
relevant decision from being buried by recency or keyword mismatches. It does
not inject irrelevant decisions into a context where they do not belong.

**Note on constraint authority floors:**
Only constraints where `source IN ['user-stated', 'explicitly-governed']`
(authorityScore >= 0.85) receive the authority floor. Research-discovered and
model-inferred constraints (authorityScore 0.60–0.80) do not — they compete
on their relevance score alone.

## 8.5 Four Distinct Epistemic Dimensions (P1-5 and P1-6)

These four dimensions are separate. They must not be conflated.

| Dimension | Question answered | Who sets it | Where used |
|---|---|---|---|
| **Source Reliability** | How likely is this source to be accurate? | Set at extraction time based on source type | `sourceQualityScore` in ranking |
| **Project Authority** | How much does this item govern this project's decisions? | Set at promotion time based on memory class and source | `authorityScore`; authority floor |
| **Evidence Basis** | How was this item established — source-grounded, inferred, or asserted? | Set at promotion/extraction time | Epistemic hierarchy; confidence cap |
| **Confidence** | How certain is the system about this item's current validity? | Set at promotion; may decay over time | Retrieval score modifier |

```typescript
// Source reliability: measures the external source's epistemic quality
// This is about the SOURCE, not the extracted claim.
type SourceReliabilityLevel =
  | 'high'     // Authoritative source: published research, official docs, user statement
  | 'medium'   // Reasonable source: news sites, product pages, tool results
  | 'low'      // Questionable source: anonymous, unsourced, low-reputation domain
  | 'unknown'; // Cannot determine — treat conservatively

// Mapping: sourceType → default SourceReliabilityLevel
// This is a starting point; operators may override per domain.
const DEFAULT_SOURCE_RELIABILITY: Record<EvidenceSourceType, SourceReliabilityLevel> = {
  'user-stated':        'high',    // user's own assertion about their product
  'uploaded-document':  'medium',  // user provided it, but quality varies
  'web-url':            'medium',  // assume medium; domain-specific overrides possible
  'tool-result':        'medium',  // tool results are factual but unvetted
};

// Source reliability → sourceQualityScore for ranking
const RELIABILITY_TO_SCORE: Record<SourceReliabilityLevel, number> = {
  high:    0.85,
  medium:  0.65,
  low:     0.40,
  unknown: 0.50,
};
```

## 8.6 Confidence Semantics (P1-6)

**What confidence means in IdeaGate — precisely:**

`EvidenceItem.confidence` (0–100):
> The extracting capability's estimate of how accurately the observed claim
> was captured from the source. High confidence means "I am confident this
> text was accurately read from the source." It is **not** a claim about
> whether the source is correct — that is sourceReliability.

`WorkspaceKnowledgeItem.confidence` (0–100):
> The system's estimate of the item's current validity, considering:
> (a) evidence strength (how many supporting evidence items, how reliable)
> (b) temporal freshness (has this likely changed?)
> (c) evidence basis (source-grounded vs model-generated)
> It is **not** a probability that the claim is true in the world.
> It is a system-internal quality signal that affects retrieval ranking.

**Model-generated items**: `evidenceBasis = 'model-generated'` → `confidence` is capped
at 50 regardless of the value submitted. This prevents a model's self-expressed
certainty from inflating retrieval scores.

**Evidence basis hierarchy → confidence caps:**
```
source-grounded:   max confidence = 100 (no cap)
user-asserted:     max confidence = 100 (no cap; user is authoritative for their project)
derived:           max confidence =  80 (derived from evidence; some uncertainty)
inferred:          max confidence =  70 (model reasoning over evidence; significant uncertainty)
model-generated:   max confidence =  50 (unsupported model reasoning)
```

---

# PART 9 — SCOPE AND ISOLATION MODEL

## 9.1 The Scope Hierarchy

```
WORKSPACE (user account level)
   │ hard isolation boundary — no cross-workspace leakage
   ├── PROJECT A
   │     │ controlled boundary — cross-run sharing via promotion
   │     ├── RUN 1 (runId: abc)
   │     │     ├── CAPABILITY INSTANCE: RE
   │     │     │    Context: scoped to RE per capabilityContextIds
   │     │     └── CAPABILITY INSTANCE: PS
   │     │          Context: different scope — different items
   │     └── RUN 2 (runId: def)
   │           Can access: PROJECT A promoted knowledge from RUN 1
   │           Cannot access: RUN 1's run-local working state
   └── PROJECT B
         (zero access to PROJECT A knowledge — ever)
```

## 9.2 Knowledge Scope States

```typescript
type KnowledgeScope = 'run-local' | 'project';

// run-local: available only within the generating run
//   → EvidenceItems captured during a run before promotion
//   → WorkspaceKnowledgeItems in 'candidate' status
//   → Discarded at run completion unless promoted

// project: available to all future runs in the same project
//   → Promoted WorkspaceKnowledgeItems (status='active')
//   → Promoted EvidenceItems
//   → Artifact knowledge from ArtifactKnowledgeIndex
```

## 9.3 Isolation Rules (Non-Negotiable)

1. **Cross-project isolation is absolute.** Project B's retrieval universe contains
   zero items from Project A. This is enforced by scoping every knowledge query
   by `projectId` before any other retrieval logic.

2. **Cross-capability isolation is enforced by Document 3** (mustNotReceiveOutputFrom)
   before `scope()` is called. Document 4 trusts that the `receivesOutputFrom` list
   it receives is already isolation-safe.

3. **Cross-run isolation within a project** is enforced by the promotion gate.
   Only explicitly promoted items cross the run boundary.

4. **Sub-agent isolation** (Part 31): workers inherit their parent capability's
   scope. A worker cannot access knowledge outside the parent's allowed scope.

5. **Scope is enforced before retrieval** (not after). The PKS query universe
   never contains out-of-scope items. There is no permission-filter-after-retrieval.

## 9.4 Two Distinct Context Mechanisms (P0-5 fix)

`scope()` assembles context from **two independent mechanisms** that coexist
without overlap:

| Mechanism | Source | What it controls | Driven by |
|---|---|---|---|
| **Pinned Context Items** | `plan.contextPlan.capabilityContextIds` | Explicitly selected uploads, URLs, workspace artifacts | Document 2 Compiler at plan time |
| **Dynamic Knowledge Retrieval** | PKS knowledge store and evidence store | Relevant project knowledge retrieved based on the step's context | Document 4 at runtime via the 7-stage pipeline |

`capabilityContextIds` is **not the retrieval universe**. It is a list of
explicitly pinned static items (e.g., "always include the uploaded PRD for
this review step"). These bypass the ranking pipeline and are included
directly as `ResolvedContextItem` entries in `assembledContext.contextItems`.

Dynamic PKS retrieval operates **independently** over the project's knowledge
store. The Compiler does not enumerate knowledge items at plan time — the PKS
retrieves them at runtime based on relevance, freshness, and scope.

## 9.5 Scope Enforcement in scope()

```typescript
async function scope(request: ContextRequest): Promise<ContextResponse> {
  // ── MECHANISM 1: Pinned context items ──────────────────────────────────────
  // Explicitly selected by the plan's compiler.
  // These are resolved directly (file extraction, URL fetch).
  const pinnedItemIds: string[] =
    request.plan.contextPlan.capabilityContextIds[request.step.capabilityInstanceId] ?? [];
  const contextItems: ResolvedContextItem[] = resolvePinnedItems(pinnedItemIds);

  // ── MECHANISM 2: Dynamic knowledge retrieval ───────────────────────────────
  // Scope filter: constrains the retrieval universe to this project + run.
  // Does NOT enumerate specific items — that is the retrieval pipeline's job.
  const scopeFilter: ScopeFilter = {
    projectId: resolveProjectId(request.plan),
    allowRunLocalFromRunId: request.state.runId,
    allowedStepOutputFrom: new Set(request.step.receivesOutputFrom),
    // Note: mustNotReceiveOutputFrom enforcement already done by Document 3.
    // Document 4 receives only the isolation-safe receivesOutputFrom list.
  };

  // Run the 7-stage retrieval pipeline (Part 10) with this scope filter.
  const { rankedItems, trace } = runRetrievalPipeline(scopeFilter, request);

  // ── ASSEMBLY ────────────────────────────────────────────────────────────────
  // Build AssembledContext within tokenBudget.
  // Throws ContextContractUnsatisfiable if Tier 0 items exceed budget (§14.2).
  return assembleContext(contextItems, rankedItems, request.tokenBudget, trace);
}
```

---

# PART 10 — RETRIEVAL ARCHITECTURE

## 10.1 The Retrieval Pipeline (Seven Stages)

**Scope is enforced in Stage 1. No retrieval computation begins before scope.**

```
STAGE 1: SCOPE ENFORCEMENT (mandatory; always first)
  Filter the retrieval universe to only items the requesting step may access.
  Items outside scope are NEVER candidates.
  Inputs: ScopeFilter (§9.4), projectId, runId, capabilityInstanceId
  Output: candidate pool (scope-restricted)

STAGE 2: CANDIDATE GENERATION (multi-signal, from the scoped pool)
  Run these signals in parallel against the candidate pool:
  a. Structural: filter by memoryClass, stageAffinity, capabilityAffinity
  b. Keyword / BM25: match against content text
  c. Semantic similarity (optional; Phase 3+): embedding cosine similarity
  d. Recency: score by observedAt freshness
  e. Relationship: bonus for items related to already-prioritized items
  Output: candidates with raw signal scores

STAGE 3: FRESHNESS FILTER
  Apply freshnessClass temporal rules:
  - 'stable':         no penalty
  - 'time-sensitive': compute freshness_multiplier ∈ [0, 1] per §13
  - 'perishable':     hard-zero after perishabilityThresholdDays
  - 'unknown':        gentle penalty
  Output: candidates with freshness_multiplier applied

STAGE 4: CONTRADICTION DETECTION
  Identify pairs of candidates where contradictionIds overlap.
  Mark both members of each pair with contradiction_flag=true.
  Do NOT exclude either. Both may proceed with a contradiction_penalty.
  Output: candidates annotated with contradiction flags

STAGE 5: RANKING (complete formula — see Part 12)
  Apply the deterministic multi-signal ranking formula.
  Apply authority floor for decisions and constraints.
  Apply relevance threshold: exclude final_score < 0.3
  Sort by final_score DESC; break ties by temporal.observedAt DESC
  Output: ranked candidate list

STAGE 6: CONTEXT BUDGET APPLICATION (§15)
  Apply priority tier ordering:
    Tier 0: MANDATORY — active constraints (never cut)
    Tier 1: REQUIRED — prior step outputs from receivesOutputFrom
    Tier 2: HIGH PRIORITY — active decisions, revision context
    Tier 3: RANKED — everything else, in score order
  Apply budget overflow handling if mandatory items exceed budget.
  Output: selected items within tokenBudget

STAGE 7: ASSEMBLY AND TRACE
  Assemble AssembledContext:
    - contextItems: from resolved context item IDs in plan.contextPlan
    - priorStepOutputs: from receivesOutputFrom (Document 3 state)
    - workspaceKnowledge: from ranked items that fit within budget
  Write ContextAssemblyTrace record (see Part 23)
  Return ContextResponse
```

## 10.2 Every Stage Is Mandatory

Stages are not optional based on context size or simplicity. Even if the
knowledge base is empty, the pipeline runs and returns an empty
WorkspaceKnowledgeSlice. The discipline of always running through the pipeline
is what makes the system predictable and auditable.

## 10.3 Phase 1 — No Embeddings Required

In Phase 1 (JSONL storage), Stage 2 uses only structural + keyword signals.
The semanticScore in the ranking formula defaults to 0, and weights are
redistributed automatically (§12.5).

Phase 1 retrieval is sufficient for IdeaGate's V1 scale because:
- Projects have < 500 knowledge items at maturity
- BM25 on domain-specific PM vocabulary outperforms generic embeddings
- Structural signals (memoryClass, stageAffinity) provide strong pre-filtering

---

# PART 11 — RANKING MODEL (P0-2 fix — complete mathematics)

## 11.1 Signals

```typescript
interface RankingSignals {
  semanticScore:   number;   // [0, 1] embedding cosine similarity; 0 in Phase 1
  keywordScore:    number;   // [0, 1] BM25 normalized against corpus max
  recencyScore:    number;   // [0, 1] computed from temporal.observedAt and freshnessClass
  sourceQuality:   number;   // [0, 1] from authority model §8.5
  authorityScore:  number;   // [0, 1] from authority model §8.3
  relationshipBonus: number; // [0, 0.2] additive; bonus for related-to-selected items
}
```

## 11.2 Weight Sets by Outcome Type

```
STANDARD WEIGHTS (no embeddings — sum to 1.0 for core signals):
  W_semantic  = 0.00  (zero when embeddings unavailable)
  W_keyword   = 0.30
  W_recency   = 0.20
  W_quality   = 0.25
  W_authority = 0.25
  (relationship_bonus is additive, not in the normalized set)

WITH EMBEDDINGS (Phase 3+):
  W_semantic  = 0.25
  W_keyword   = 0.20
  W_recency   = 0.15
  W_quality   = 0.20
  W_authority = 0.20

OUTCOME-TYPE WEIGHT OVERRIDES (applied over the base set):
  research:    { semantic:0.25, keyword:0.20, recency:0.15, quality:0.20, authority:0.20 }
  decide:      { semantic:0.15, keyword:0.15, recency:0.10, quality:0.20, authority:0.40 }
  build:       { semantic:0.25, keyword:0.20, recency:0.20, quality:0.15, authority:0.20 }
  investigate: { semantic:0.30, keyword:0.25, recency:0.20, quality:0.15, authority:0.10 }
  council:     { semantic:0.20, keyword:0.20, recency:0.15, quality:0.25, authority:0.20 }
  casestudy:   { semantic:0.20, keyword:0.20, recency:0.10, quality:0.25, authority:0.25 }
  prioritize:  { semantic:0.20, keyword:0.25, recency:0.15, quality:0.20, authority:0.20 }
  plan:        { semantic:0.20, keyword:0.20, recency:0.20, quality:0.20, authority:0.20 }
  
Note: All outcome weight sets sum to 1.0. relationship_bonus is always additive.
```

## 11.3 Missing Signal Handling (Phase 1 — no embeddings)

When `semanticScore = 0` (no embeddings available):

```
Redistribute W_semantic proportionally to remaining signals:
  W'_keyword   = W_keyword   + (W_semantic × 0.40)
  W'_recency   = W_recency   + (W_semantic × 0.20)
  W'_quality   = W_quality   + (W_semantic × 0.20)
  W'_authority = W_authority + (W_semantic × 0.20)
  Sum(W') = 1.0 (guaranteed)
```

## 11.4 Freshness Multiplier

The freshnessMultiplier is applied as a multiplicative modifier, independent
of the recencyScore signal:

- `recencyScore`: how recently was this item observed (generic time decay)
- `freshnessMultiplier`: does this item type retain validity at its current age?

```typescript
function freshnessMultiplier(temporal: TemporalRecord): number {
  const ageDays = (Date.now() - new Date(temporal.observedAt).getTime()) / 86_400_000;

  switch (temporal.freshnessClass) {
    case 'stable':
      return 1.0;  // no decay — historical facts remain valid

    case 'time-sensitive':
      // Linear decay from 1.0 at 0 days to 0.3 at 90 days
      return Math.max(0.3, 1.0 - (ageDays / 90) * 0.7);

    case 'perishable':
      // Hard zero after 7 days; linear decay before
      if (ageDays > 7) return 0.0;
      return 1.0 - (ageDays / 7) * 0.5;  // minimum 0.5 within 7 days

    case 'unknown':
      // Gentle decay from 1.0 to 0.5 over 180 days
      return Math.max(0.5, 1.0 - (ageDays / 180) * 0.5);
  }
}
```

**When freshnessMultiplier = 0**: the item is effectively expired and will score
0 regardless of relevance. Perishable items older than 7 days are excluded from
the candidate set entirely (not just ranked low).

## 11.5 The Complete Formula (P0-2 corrected)

Critical ordering: **relevance threshold is applied BEFORE the authority floor.**
Authority protects a relevant item from sinking below its standing.
Authority cannot manufacture relevance for an irrelevant item.

```
STEP 1 — RAW WEIGHTED SCORE:
  raw_score = Σ(W'_i × signal_i)
  where W'_i are the redistribution-corrected weights (§11.3)
  Note: relationship_bonus is DEFERRED to Phase 3 (see §11.6).
        It is NOT part of the V1 formula.

STEP 2 — FRESHNESS ADJUSTMENT:
  Check hard expiry first:
    if item.temporal.validUntil IS SET AND now > item.temporal.validUntil:
      freshness_adjusted = 0.0  (expired; exclude)
    else:
      freshness_adjusted = raw_score × freshnessMultiplier(item.temporal)

STEP 3 — CONTRADICTION PENALTY:
  contradiction_penalty = item.contradictionIds.length > 0 ? 0.05 : 0.0
  pre_floor_score = freshness_adjusted - contradiction_penalty

STEP 4 — RELEVANCE THRESHOLD (applied first — P0-2 fix):
  if pre_floor_score < 0.30:
    EXCLUDE from candidate set
    Record exclusion with reason='below-threshold'
    → Authority floor is NEVER applied to excluded items.
      An irrelevant constraint or decision is not surfaced by authority.

STEP 5 — AUTHORITY FLOOR (only for items that passed Step 4):
  Applies only to items where memoryClass ∈ ['constraint', 'decision']
  AND item.authorityScore >= 0.85
  AND item passes an applicability check (see §11.7):

  if applicable AND authorityScore >= 0.85:
    final_score = max(pre_floor_score, 0.80)
  else:
    final_score = pre_floor_score

STEP 6 — DETERMINISTIC SORT:
  Sort by final_score DESC
  Tiebreak: sort by temporal.observedAt DESC (most recent wins)
  Both criteria are stable and deterministic given the same input data.
```

## 11.6 Relationship Bonus — Deferred to Phase 3

**The relationship bonus is removed from V1.** The original design defined
bonus scores based on "already-selected items," which creates a circular
dependency: items are selected based on their score, but their score depends
on the selection. This is mathematically ill-defined without a two-pass algorithm.

**V1**: relationship bonus is 0 for all items. No change to the formula.

**Phase 3**: implement a two-pass algorithm:
- Pass 1: rank all candidates without relationship bonus
- Pass 2: add relationship bonus to candidates that are structurally related
  to the top-N items from Pass 1 (N = min(10, candidatesAboveThreshold))
- Final sort on adjusted scores

This is deterministic, non-circular, and can be implemented when Phase 3
introduces SQLite (enabling efficient relationship traversal).

## 11.7 Applicability Check for Constraints and Decisions (P0-2)

A constraint or decision must pass an applicability check before receiving
the authority floor. This prevents an irrelevant project decision from being
artificially elevated into context.

```typescript
function isApplicableToStep(
  item: WorkspaceKnowledgeItem,
  step: ExecutionStep,
  plan: ExecutionPlan
): boolean {
  // If the item has explicit stageAffinity, check it
  if (item.stageAffinity && item.stageAffinity.length > 0) {
    const currentStage = step.internalStageIndex;
    if (currentStage !== undefined) {
      return item.stageAffinity.includes(currentStage);
    }
  }

  // If the item has explicit capabilityAffinity, check it
  if (item.capabilityAffinity && item.capabilityAffinity.length > 0) {
    const cap = plan.capabilityInstances
      .find(c => c.instanceId === step.capabilityInstanceId)?.capabilityId;
    if (cap) return item.capabilityAffinity.includes(cap);
  }

  // No affinity specified → assume applicable (default: broad applicability)
  return true;
}
```

**Constraints with no stageAffinity or capabilityAffinity are treated as
broadly applicable** (they appear in every step's context). Operators may
add affinities to limit scope.

The "NextJS App Router" decision example: it has no stageAffinity set → it is
retrieved for all steps by default. If applicability is too broad for a project,
the operator can add `capabilityAffinity: ['AR']` to restrict it to architecture
steps. V1 does not do this automatically — it is a configuration the project
owner sets during promotion.

---

# PART 12 — FRESHNESS AND SUPERSESSION

## 12.1 Freshness Class Assignment

| Knowledge category | Default freshnessClass | Rationale |
|---|---|---|
| Constraint | stable | Project boundaries don't change unless explicitly modified |
| Decision | stable | Project decisions persist until explicitly superseded |
| Assumption | stable | Assumptions persist until validated/invalidated |
| Prior outcome | stable | Historical record; never changes |
| Market size / industry facts | time-sensitive | Changes quarterly/annually |
| Competitor features | time-sensitive | Changes on product release cycles |
| Competitor pricing | perishable | Can change without announcement |
| News / announcements | perishable | Loses salience rapidly |
| User research (published) | time-sensitive | Ages but remains historically valid |
| Research finding (recent field) | time-sensitive | Academic knowledge evolves |
| Historical research | stable | Published, established findings |

## 12.2 Supersession Protocol

```
When item B supersedes item A:

1. Write item B with B.provenance.supersedes = A.itemId
2. Update item A: A.status = 'superseded', A.supersededBy = B.itemId
3. Write a SupersessionRecord:
   {
     supersessionId, itemAId, itemBId,
     reason, supersededAt, supersededInRun
   }
4. Add B to the project knowledge index (active)
5. Retain A in storage — never delete
6. During retrieval: items with status='superseded' receive
   freshnessMultiplier = 0.0 in STANDARD retrieval
   (effectively excluded from normal candidates)
7. Exception: historical analysis runs may explicitly request
   superseded items via plan.contextPlan.includeSuperseded (future capability)
```

## 12.3 The No-Deletion Rule — Scope and Limits (P1-7)

**Within the normal PKS lifecycle, no knowledge item is deleted.** Items may be:
- `superseded` — replaced by newer information (chain preserved)
- `invalidated` — proven incorrect with evidence (original preserved)
- `stale` — no longer fresh but not proven incorrect
- `retracted` — explicitly withdrawn by the user (content preserved; status updated)

In all normal-lifecycle cases, the item persists with its status updated. The
history of what IdeaGate believed, and when, is part of the product audit trail.

**Governance deletion (outside normal PKS lifecycle):**
Hard deletion may be legally required in certain scenarios: GDPR right-to-erasure
requests, security breach remediation, accidental PII ingestion, or explicit
platform governance policy. This is a **platform-level concern** that sits
outside the PKS memory lifecycle. It requires a separate administrative
capability with audit logging and is not part of the normal `scope()`, retrieval,
or promotion flows.

The PKS specification does not implement governance deletion. It preserves the
architectural seam: the storage layer (JSONL files; later SQLite) supports hard
deletion by record ID. The PKS API does not expose a delete method in V1.
A future governance module may do so with appropriate controls.

**Summary:** "No deletion" means no deletion in normal product intelligence
operations. It does not mean data can never be removed under any circumstances.

---

# PART 13 — CONTRADICTION MODEL

## 13.1 Types of Contradiction (P1-2 enhancement)

Not every apparent conflict is a factual contradiction. The system must
distinguish:

| Contradiction type | Description | Example |
|---|---|---|
| `factual-conflict` | Two claims about the same fact contradict | "Competitor X has offline mode" vs "Competitor X does not have offline mode" |
| `temporal-change` | One claim was true; a later claim supersedes it | "Pricing was ₹1,999" (2025) vs "Pricing is ₹2,499" (2026) |
| `scope-conflict` | Claims true in different contexts appear contradictory | "Tier-1 users prefer app" vs "Tier-2 users prefer WhatsApp" |
| `definition-conflict` | Different definitions of a term | "Enterprise = 500+ employees" vs "Enterprise = 100+ employees" |
| `source-conflict` | Different sources report different facts | Source A vs Source B on market size |
| `unresolved-discrepancy` | Genuine disagreement without clear resolution | Research finding vs user assertion |

## 13.2 Contradiction Detection

Contradiction detection runs in Stage 4 of retrieval. It is not a semantic
comparison by an LLM — it is a structural check against the stored
`contradictedBy` field on EvidenceItems and WorkspaceKnowledgeItems.

Detection at promotion time: when a new item is promoted, the promotion engine
performs a structured keyword match against existing active items on the same
topic domain and stageAffinity. If a potential conflict is detected, a human-
readable conflict description is generated and stored as a ContradictionRecord
in `candidate` status. Human or rule-based resolution can promote it to
`confirmed` status.

```typescript
interface ContradictionRecord {
  contradictionId: string;
  contradictionType: ContradictionType;  // from §13.1
  itemA: ContradictionParticipant;
  itemB: ContradictionParticipant;
  discoveredAt: string;
  discoveredInRun: string;

  // Status lifecycle:
  // 'candidate'  → potential contradiction detected; not yet confirmed
  // 'confirmed'  → verified as a genuine conflict
  // 'resolved'   → conflict has been closed (see resolution.method for how)
  // 'dismissed'  → determined not to be a genuine contradiction
  status: 'candidate' | 'confirmed' | 'resolved' | 'dismissed';

  conflictDescription: string;  // human-readable
  resolution?: ContradictionResolution;
}

interface ContradictionParticipant {
  kind: 'knowledge' | 'evidence';
  id: string;
  claim: string;  // the relevant excerpt
}

// Resolution is recorded as a separate object; resolution.method records
// how it was resolved — including if a user explicitly resolved it.
// 'user-resolved' is a method, not a status. This maintains enum consistency.
interface ContradictionResolution {
  resolvedAt: string;
  resolvedInRun?: string;          // present if resolved within an automated run
  method: ContradictionResolutionMethod;
  rationale: string;
  resolvedByCapability?: CapabilityId;
}

type ContradictionResolutionMethod =
  | 'a-supersedes-b'              // item A is newer and supersedes B
  | 'b-supersedes-a'              // item B is newer and supersedes A
  | 'both-valid-different-scope'  // both are true in different contexts
  | 'temporal-change'             // the world changed; both were true at different times
  | 'dismissed-not-contradictory' // re-evaluated; not actually in conflict
  | 'user-explicit';              // user explicitly resolved via UI or RunConfig
```

## 13.3 Both Sides Always Preserved

When a contradiction is confirmed, both items retain status `active` with
`contradictionIds` pointing to the ContradictionRecord. Neither is suppressed
or excluded from retrieval unless supersession occurs.

In the assembled context, contradicted items appear with a structured annotation:

```
[⚠ CONTRADICTION: This item conflicts with another item in the knowledge base.
 Contradiction ID: {id}. Type: {type}. Please address this explicitly in your analysis.]
```

---

# PART 14 — CONTEXT BUDGET AND OVERFLOW HANDLING (P0-1 fix)

## 14.1 Priority Tiers (P0-1 + P0-4 corrected)

**The fundamental contract (from Document 3 §6.2, frozen):**
`assembledContext.totalTokens <= tokenBudget` — always. Violation is not
permitted; if mandatory items alone exceed the budget, `ContextContractUnsatisfiable`
is thrown (§14.3) and no model call is made.

**Not all constraints are Tier 0.** Only constraints established with explicit
user or governance authority qualify. Research-inferred or model-inferred
constraints are Tier 2. (P0-4 fix)

```
TIER 0 — INVIOLABLE
  If Tier 0 items alone exceed tokenBudget: throw ContextContractUnsatisfiable.
  Includes:
    Active constraints where source IN ['user-stated', 'explicitly-governed']
      AND authorityScore >= 0.85
  Does NOT include:
    - constraints where source IN ['research-discovered', 'model-inferred'] → Tier 2
    - decisions (even authoritative ones) → Tier 1
    - non-active constraints (status ≠ 'active') → exclude entirely
  Compression: verbatim constraint text preserved; provenance preserved.

TIER 1 — REQUIRED (compressed before excluded; not an overflow error if excluded)
  Prior step outputs specified in step.receivesOutputFrom
  Active decisions with authorityScore >= 0.85 AND applicability match (§11.7)
  Revision context (if this is a revision attempt)

TIER 2 — HIGH PRIORITY (compressed and excluded in score order)
  Active constraints with source IN ['research-discovered', 'model-inferred']
  Remaining active decisions
  Top-ranked research findings
  Unvalidated critical/high-priority assumptions
  Confirmed contradictions relevant to this step

TIER 3 — BEST EFFORT (included until budget exhausted, score order)
  Facts, prior outcomes, medium/low assumptions, open questions, artifact summaries
```

## 14.2 Budget Application Algorithm (P0-1 corrected)

**The fundamental contract (from Document 3 §6.2, frozen):**
`assembledContext.totalTokens <= tokenBudget` — always.

`scope()` must NEVER return an `AssembledContext` whose `totalTokens` exceeds
`tokenBudget`. The model invocation never happens with oversized context.
Any condition that would require violating this contract throws
`ContextContractUnsatisfiable` instead.

```
function applyBudget(tier0, tier1, tier2, tier3, tokenBudget):
  remaining = tokenBudget

  // ── PHASE 1: Mandatory items (Tier 0) ──────────────────────────────────────
  // Only user-stated and explicitly-governed constraints qualify as Tier 0.
  // (P0-4 fix: research-discovered and model-inferred constraints are Tier 2)

  mandatoryBudget = computeMinimumRequiredTokens(tier0)
  if mandatoryBudget > tokenBudget:
    // Impossible context contract — cannot satisfy without violating Document 3
    throw ContextContractUnsatisfiable {
      cause: 'tier0-mandatory-exceeds-budget',
      mandatoryTokens: mandatoryBudget,
      availableBudget: tokenBudget,
      affectedItemIds: tier0.map(i => i.itemId)
    }
    // No AssembledContext is returned. No model call is made.
    // Document 3 receives this as a non-retryable technical failure.

  for item in tier0:
    compressed = compressIfNeeded(item, remaining)  // §15
    selected.append(compressed)
    remaining -= compressed.tokenEstimate

  // ── PHASE 2: Required items (Tier 1) ───────────────────────────────────────
  // Prior step outputs, active decisions (top 3 by score), revision context.

  for item in tier1.sortBy(finalScore DESC):
    compressed = compressIfNeeded(item, remaining)
    if compressed.tokenEstimate <= remaining:
      selected.append(compressed)
      remaining -= compressed.tokenEstimate
    else:
      // Tier 1 item cannot fit even after compression.
      // Do NOT throw — Tier 1 is required but not inviolable.
      record ContextExclusionRecord(item, 'tier1-budget-overflow')

  // ── PHASE 3: Best-effort items (Tiers 2 and 3) ─────────────────────────────
  for item in [...tier2, ...tier3].sortBy(finalScore DESC):
    if item.tokenEstimate <= remaining:
      selected.append(item)
      remaining -= item.tokenEstimate
    else:
      record ContextExclusionRecord(item, 'budget')

  // ── FINAL: Verify contract ─────────────────────────────────────────────────
  totalTokens = selected.sum(i => i.tokenEstimate)
  assert totalTokens <= tokenBudget  // must always hold; throw if it does not

  return {
    selected,
    totalTokens,
    withinBudget: true  // always true — we either satisfy it or throw before returning
  }
```

## 14.3 ContextContractUnsatisfiable

```typescript
class ContextContractUnsatisfiable extends Error {
  readonly code = 'CONTEXT_CONTRACT_UNSATISFIABLE';
  readonly retryable = false;   // not retryable without plan change
  readonly cause: 'tier0-mandatory-exceeds-budget';
  readonly mandatoryTokens: number;
  readonly availableBudget: number;
  readonly affectedItemIds: string[];
}
```

**Document 3 behavior when this is thrown:**
- scope() throws → Document 3 receives it as a technical failure
- `retryable = false` → no standard retry; this requires architectural intervention
- Engine emits `ENG_12: CONTEXT_CONTRACT_UNSATISFIABLE` event
- The step is failed and the failure cascade (Document 3 §15.2) applies
- Mission Control surfaces this as an actionable error: "Mandatory project
  constraints for this project exceed the model's context budget for this step.
  Options: (a) increase the model context window, (b) remove obsolete constraints,
  (c) add stage/capability affinity to constraints to reduce scope."

**This is the correct resolution of P0-1.** The frozen contract
`assembledContext.totalTokens <= tokenBudget` is never violated. Instead, the
system surfaces the impossibility before a model call occurs.

## 14.4 Removal of ContextOverflowRecord

The `ContextOverflowRecord` schema and "proceed with annotation" behavior from
v1.0 are REMOVED. They violated the Document 3 contract.

The `ContextAssemblyTrace.withinBudget` field always reflects truth:
it is `true` when the assembled context fits within the budget (the only case
where scope() returns normally) or the method has thrown before returning.

---

# PART 15 — COMPRESSION RULES

## 15.1 What May and May Not Be Compressed

| Content type | Compressible? | What must survive |
|---|---|---|
| Tier 0 constraint text | **NEVER** | Verbatim text always. User-stated/governed constraints quoted, not paraphrased. |
| Tier 2 constraint text | Yes, minimally | Core restriction + source + status |
| Provenance fields | **NEVER** | All ProvenanceRecord fields on every item |
| Contradiction flags | **NEVER** | contradictionIds and ContradictionRecord references |
| Decision text | Yes, with limits | Core decision statement; rationale may be summarized |
| Research finding | Yes | Source reference, confidence, freshness class, evidence IDs |
| Evidence content | Yes | Source ref, timestamp, confidence, status |
| Assumption | Yes | Assumption text; status; priority |
| Prior step output | Yes | Artifact IDs produced; key conclusions |
| Prior outcome | Yes | RunId, outcome type, summary |
| Open question | Yes | Question text; status |

## 15.2 Compression Contract

When content is compressed, the compressed item must carry a `compressed: true`
flag and the compression must not remove:
- Source reference
- Timestamp(s)
- Confidence score
- Contradiction/status flags
- Evidence IDs (can be truncated to top 3 if > 10)

## 15.3 Compression Depth Limits

| Budget pressure | Compression allowed |
|---|---|
| remaining > 50% | None; include full content |
| 20–50% remaining | Summaries for Tier 2/3; full for Tier 0/1 |
| < 20% remaining | Aggressive summary for Tier 2/3; minimal for Tier 1 |
| Tier 0 overflow | Include full constraint text regardless; annotate overflow |

---

# PART 16 — EVIDENCE CAPTURE LIFECYCLE (P0-5 fix)

## 16.1 Two Separate Lifecycles

**Evidence Capture** and **Memory Promotion** are distinct processes with different timing.

```
EVIDENCE CAPTURE (may happen DURING a run)
  ↓ source-grounded; not model reasoning
  EvidenceItem(scope='run-scoped')
  ↓ available to later steps in same run and same loop iteration
  → persisted to evidence.jsonl for this run

MEMORY PROMOTION (happens POST-RUN or at controlled checkpoints)
  ↓ explicit, governed, deterministic rules
  WorkspaceKnowledgeItem(scope='project', status='active')
  ↓ available to all future runs in this project
  → persisted to knowledge/items.jsonl for this project
```

## 16.2 Evidence Capture Rules

Evidence items may be captured during execution when:
1. A tool call returns source-grounded content (url-fetch, file-read, tool-result)
2. The captured content is relevant and non-redundant (novelty check)
3. The source type qualifies (§5.3) — model analysis does NOT qualify
4. The evidence has complete provenance (source, timestamp, capability, step)

Evidence captured during a run is stored with `scope='run-scoped'`.
It is immediately available to:
- Later steps in the same run (via retrieval, filtered by runId)
- Later iterations of a goal loop in the same run

**Evidence captured during a run is NOT automatically available to future runs.**
Promotion to `scope='project'` requires the post-run promotion phase (§18).

## 16.3 Evidence Capture for Goal Loops (P0-6 fix)

This is the key resolution for continuous research compatibility.

```
LOOP ITERATION 1:
  RE gathers competitor pricing evidence
  → EvidenceItem(scope='run-scoped', runId='abc')
  → persisted to runs/abc/evidence.jsonl

LOOP ITERATION 2 (step state reset; evidence store NOT reset):
  ContextManager.scope() for the next RE step
  → retrieval includes run-scoped evidence from iteration 1
    (filtered by: projectId AND runId = 'abc')
  → RE builds on prior iteration's evidence
  → new evidence captured in iteration 2 also stored with runId='abc'

RUN COMPLETION:
  Promotion phase runs
  → relevant run-scoped evidence → project-scoped
  → future runs can access this evidence
```

**Critical:** Document 3 §12.3 resets `completedStepIds`, `activeStepIds`, etc.
between iterations. It does NOT reset the evidence store. The evidence store
is not execution state — it is knowledge state. Document 4 owns it.

## 16.4 Evidence Capture During Execution — Safety Rules

To prevent memory poisoning during evidence capture:
1. Only the Engine triggers evidence capture (via tool call completion events)
2. The model cannot directly write to the evidence store
3. Every evidence item requires a non-empty `sourceRef`
4. Model-generated text is NOT captured as evidence (§5.3)
5. Evidence items fail validation if they lack required provenance fields
6. Evidence capture is idempotent: re-capturing the same source at the same
   timestamp produces the same evidence ID (content-addressed)

---

# PART 17 — CANDIDATE KNOWLEDGE LIFECYCLE

## 17.1 The Promotion Lifecycle (Summary)

```
OBSERVATION / TOOL OUTPUT (transient, in-step)
    ↓
    IF source-grounded AND complete provenance:
EVIDENCE CAPTURE → EvidenceItem(scope='run-scoped')
    ↓
    POST-RUN: Extraction phase
ARTIFACT EXTRACTION → Candidate WorkspaceKnowledgeItems
    ↓
    NOVELTY CHECK: Is this genuinely new?
    IF redundant → update freshness/confidence on existing item; discard candidate
    IF novel:
SCHEMA VALIDATION → required fields present?
    ↓
    IF invalid → reject; log; do not store
    IF valid:
AUTHORITY CHECK → authority score computed
CONTRADICTION CHECK → scan for conflicts with active items
    ↓
    IF no conflict:
PROMOTION → WorkspaceKnowledgeItem(scope='project', status='active')
    ↓
    IF contradiction found:
PROMOTION OF BOTH SIDES → ContradictionRecord created
    Both items: scope='project', status='active', contradictionIds=[...]
```

## 17.2 Novelty Check

Before promoting a candidate, check for redundancy:

```typescript
interface NoveltyCheckResult {
  novel: boolean;
  supersedes?: string;        // itemId of the existing item this replaces
  updateExisting?: string;    // itemId of the existing item whose freshness to update
}

// keywordOverlap: normalized Jaccard similarity over extracted content terms.
// Computed as: |A ∩ B| / |A ∪ B| where A, B are lowercased word token sets.
function keywordOverlap(contentA: string, contentB: string): number {
  const tokensA = new Set(contentA.toLowerCase().split(/\W+/).filter(t => t.length > 3));
  const tokensB = new Set(contentB.toLowerCase().split(/\W+/).filter(t => t.length > 3));
  const intersection = new Set([...tokensA].filter(t => tokensB.has(t)));
  const union = new Set([...tokensA, ...tokensB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function isNovel(
  candidate: CandidateKnowledgeItem,
  existingItems: WorkspaceKnowledgeItem[]
): NoveltyCheckResult {
  // Step 1: Filter to same memory class only.
  // Different classes are never near-duplicates regardless of content.
  const sameClass = existingItems.filter(
    i => i.memoryClass === candidate.memoryClass
      && i.status !== 'superseded'   // ignore already-superseded items
      && i.status !== 'invalidated'
  );

  if (sameClass.length === 0) {
    return { novel: true };
  }

  // Step 2: Keyword overlap check (threshold: 0.70 = 70% Jaccard similarity)
  const nearDuplicates = sameClass.filter(
    i => keywordOverlap(i.content, candidate.content) >= 0.70
  );

  if (nearDuplicates.length === 0) {
    return { novel: true };
  }

  // Step 3: Determine if this is a genuine update or a true duplicate.
  // Sort near-duplicates by most recent first.
  const mostRecent = nearDuplicates.sort(
    (a, b) => new Date(b.temporal.observedAt).getTime()
            - new Date(a.temporal.observedAt).getTime()
  )[0];

  const candidateIsNewer = new Date(candidate.temporal.observedAt)
    > new Date(mostRecent.temporal.observedAt);

  const overlap = keywordOverlap(candidate.content, mostRecent.content);
  const isDifferentEnough = overlap < 0.90;  // <90% = some genuine new content

  if (candidateIsNewer && isDifferentEnough) {
    // Genuine update: promote candidate and supersede the existing item
    return { novel: true, supersedes: mostRecent.itemId };
  }

  // True duplicate or older version: update existing item's freshness
  return { novel: false, updateExisting: mostRecent.itemId };
}
```

---

# PART 18 — MEMORY PROMOTION GOVERNANCE (P0-7 fix)

## 18.1 Authority Hierarchy for Memory Operations

```
OPERATION           | AUTHORIZED ACTORS
--------------------|--------------------------------------------------
Evidence capture    | Engine (via tool completion) only
                    | → model CANNOT write evidence directly
                    |
Candidate generation| Promotion Engine (post-run, deterministic)
                    | → extracts from artifacts and run-scoped evidence
                    | → model output only reaches here if in an artifact
                    |
Schema validation   | Promotion Engine (deterministic rules)
                    |
Novelty check       | Promotion Engine (deterministic keyword comparison)
                    |
Promotion decision  | Promotion Engine (deterministic rules)
                    | → never requires a model call for the promotion itself
                    |
Contradiction       | Promotion Engine detects; records ContradictionRecord
 detection          | → resolution may require future user confirmation
                    |
Supersession        | Promotion Engine (when novelty check identifies update)
                    |
Invalidation        | Future: user-initiated or research-evidence-based
                    | → not autonomous; requires explicit trigger
                    |
Deletion            | PROHIBITED — nothing is ever deleted (§12.3)
```

## 18.2 Sub-Agent Memory Authority (P1-3 — sub-agent boundaries)

Workers (sub-agents) operate under their parent capability's authority.

| Sub-agent action | Permitted? | Rule |
|---|---|---|
| Generate content (artifact text) | Yes | Normal step output |
| Produce `SubAgentResult` | Yes | Evidence basis: 'inferred' or 'model-generated' |
| Directly capture evidence items | No | Only the Engine captures evidence |
| Write to knowledge store | No | Only the Promotion Engine writes knowledge |
| Access knowledge beyond parent's scope | No | Parent scope is the ceiling |
| Access another capability's isolated output | No | Document 3 isolation (mustNotReceiveOutputFrom) applies |

**A worker's evidence value flows back to the parent capability via `SubAgentResult`.
The parent capability's artifact may reference worker findings. The Promotion
Engine extracts from the parent's artifact — not directly from worker output.**

## 18.3 Promotion Happens Post-Run (Default) with Loop Exception

```
DEFAULT: Memory promotion happens after run_completed event.
LOOP EXCEPTION: Run-scoped evidence is available within the run's
  loop iterations (§16.3). Promotion to project scope still happens post-run.

WHY DEFAULT: promotes consistency — partial run output does not contaminate
  the project knowledge base if the run fails mid-execution.

WHY LOOP EXCEPTION: evidence is source-grounded; it does not require
  consistency protection. It is captured as-observed.
```

---

# PART 19 — CROSS-RUN CONTINUITY

## 19.1 What Survives Across Runs

| Item type | Survives? | Scope after run |
|---|---|---|
| Active constraints | Yes | project (always) |
| Active decisions | Yes | project (always) |
| Promoted facts (status=active, aging) | Yes | project |
| Research findings (status=active, aging) | Yes | project |
| Assumptions (status=active) | Yes | project |
| Prior outcome records | Yes | project (permanent) |
| Open questions (status=open) | Yes | project |
| Evidence (project-scoped) | Yes | project |
| Run-local working state | No | discarded |
| Candidate knowledge (not promoted) | No | discarded |
| Superseded items | Archived | project (read-only, low retrieval score) |

## 19.2 Continuity for Repeated Outcomes

When the same outcome runs for the same project multiple times:

**Research run 1:** Produces research findings on competitor X → promoted to project
**Research run 2:** Retrieves prior research findings in context → builds upon them or contradicts them → contradiction model triggers if needed

This is cumulative product intelligence. Each run benefits from prior runs
without automatically inheriting all prior context.

## 19.3 Run Outcome Digest

At run completion, the Promotion Engine generates a `PriorOutcome` record (CLASS F):

```typescript
interface RunOutcomeDigest {
  runId: string;
  completedAt: string;
  outcomeType: OutcomeId;
  depth: DepthLevel;
  artifactsProduced: string[];
  evaluationResults: { stepId: string; passed: boolean; overallScore: number }[];
  decisionsPromoted: number;
  findingsPromoted: number;
  evidenceItemsCaptured: number;
  contradictionsDetected: number;
  assumptionsRaised: number;
  openQuestionsRaised: number;
  lessons: string[];           // extracted from QA evaluation comments
}
```

This digest becomes a `PriorOutcome` memory item available to future runs.

---

# PART 20 — LOOP AND CONTINUOUS RESEARCH COMPATIBILITY (P0-6 fix)

## 20.1 Architecture for Continuous/Iterative Research

Document 3 supports bounded goal loops. The PKS must not require a run to
complete before evidence becomes useful to the next iteration.

**The solution (per §16.3):** evidence capture is run-scoped and not reset between
loop iterations. The PKS serves run-scoped evidence within the same runId.

## 20.2 Continuous Research Pattern

```
USER: "Track Competitor X for material product or pricing changes"
→ outcome: research + GoalSpec + loopPolicy

ITERATION 1:
  RE scans current state
  Tool results → EvidenceItems(scope='run-scoped', runId=R1)
  Evaluation: goal not yet met
  State reset for iteration 2 (completedStepIds cleared; evidence NOT cleared)

ITERATION 2:
  RE context includes:
    - Iteration 1 run-scoped evidence (via PKS retrieval scoped to runId=R1)
    - Project-scoped evidence from prior runs
  RE can compare: "Last time I saw price=₹2,999; now I see ₹3,499"
  → Material change detected → goalMet

RUN COMPLETION:
  Promotion engine runs
  → Pricing evidence → project-scoped
  → "Pricing changed from ₹2,999 to ₹3,499 on [date]" → FactItem(scope='project')
  → PriorOutcome with lesson: "Material pricing change detected in Iteration 2"
```

## 20.3 Evidence Accumulation Rules for Loops

| Rule | Rationale |
|---|---|
| Evidence is NOT reset between iterations | Loop's purpose is to accumulate across iterations |
| Only run-scoped evidence from THIS run is available | Prevents cross-run contamination |
| Evidence from prior runs (if promoted) is also available | Project knowledge is always available |
| Workers in each iteration can contribute evidence | Via SubAgentResult → parent artifact |
| Contradictions between iterations are detected at promotion time | Not during the loop |

---

# PART 21 — ARTIFACT ↔ KNOWLEDGE RELATIONSHIPS

## 21.1 The Object Hierarchy (Non-Collapsible)

```
ARTIFACT (a complete PM output)
  ≠ ARTIFACT VERSION (a specific point-in-time state of an artifact)
  ≠ ARTIFACT KNOWLEDGE (summaries and extractions from an artifact)
  ≠ EVIDENCE ITEM (a source-grounded observation captured during evidence gathering)
  ≠ CLAIM (an assertion made in the artifact text — not stored separately in V1)
  ≠ INTERPRETATION (a capability's reasoning in the artifact text)
  ≠ MEMORY ITEM (a promoted WorkspaceKnowledgeItem)
  ≠ DECISION (a promoted memory item of CLASS A)
  ≠ EXECUTION LOG (Document 3 events.jsonl)
  ≠ EVALUATION RECORD (Document 3 evaluations.jsonl)
```

## 21.2 Artifact Knowledge Index

The ArtifactKnowledgeIndex extracts structured knowledge from artifacts post-run:

```typescript
interface ArtifactKnowledgeEntry {
  artifactId: string;           // stable ID from Document 2 ArtifactContract
  artifactVersion: number;      // version when this was indexed
  indexedAt: string;
  runId: string;

  // Structured extractions
  keyDecisions: string[];       // extracted decision statements
  keyConstraints: string[];     // extracted constraint statements
  keyAssumptions: string[];     // extracted assumption statements
  evidenceIdsReferenced: string[]; // evidence items cited in this artifact
  dependsOnArtifactIds: string[]; // artifacts this one references

  // Summary for context injection
  contentSummary: string;       // compressed artifact summary
  sectionSummaries: {
    sectionTitle: string;
    summary: string;
    keyPoints: string[];
  }[];
  totalTokens: number;          // of contentSummary
}
```

## 21.3 Artifact Versioning and PKS

When an artifact is improved (Studio), the ArtifactKnowledgeEntry for the prior
version is marked `superseded`. The new version is indexed. Knowledge items
derived from the prior version are marked `superseded` in the WorkspaceKnowledgeStore.

This implements the stale propagation model from Document 2 (§12.4) at the
knowledge level.

## 21.4 Artifact Impact Record (v1.2 — Stale Propagation)

When upstream knowledge changes (a decision is superseded, a research finding is
contradicted, an assumption is invalidated, a constraint is removed), IdeaGate
must identify which artifacts are now stale.

```typescript
interface ArtifactImpactRecord {
  artifactId: string;         // stable ID from Document 2 ArtifactContract
  artifactType: ArtifactType; // 'prd' | 'ux-design' | 'architecture' | 'mvp-hypothesis'
                              // | 'ost' | 'erd' | 'backlog-release' | etc. (§39.1)

  // Upstream knowledge this artifact depends on (populated at promotion time)
  dependsOnDecisionIds: string[];     // Decision itemIds that shaped this artifact
  dependsOnConstraintIds: string[];   // Constraint itemIds this artifact respects
  dependsOnAssumptionIds: string[];   // Assumptions this artifact rests on
  dependsOnFindingIds: string[];      // Research findings this artifact references
  dependsOnEvidenceIds: string[];     // Direct evidence citations in this artifact

  // Stale status (updated when upstream knowledge changes)
  stalenessStatus: 'current' | 'stale' | 'potentially-stale';
  stalenessReasons: StalenessReason[];
  lastEvaluatedAt: string;    // when stale check last ran
}

interface StalenessReason {
  triggerId: string;            // itemId or evidenceId of the changed upstream item
  triggerKind: 'decision' | 'constraint' | 'assumption' | 'finding' | 'evidence';
  changeType: 'superseded' | 'invalidated' | 'contradicted' | 'retracted';
  detectedAt: string;
  humanReadable: string;
  // e.g. "Decision 'Use React Native' was superseded by 'Use Flutter' on 2026-09-01"
}
```

## 21.4a Relationship to Existing Artifact Dependency Architecture

**ArtifactImpactRecord does NOT replace the existing artifact dependency graph.**
There are two complementary, non-competing dependency mechanisms:

| Mechanism | Owner | Purpose |
|---|---|---|
| **Document 2 RunArtifactDependency** | Document 2/3 (plan + engine) | Structural artifact-to-artifact ordering within a run (PRD depends on Problem Definition for context) |
| **PKS ArtifactImpactRecord** | Document 4 PKS | Knowledge-impact: which knowledge items an artifact depends on for its *content* (PRD depends on decisions D1, D2; constraints C1, C2) |

**These are different dimensions:**
- Document 2/3's artifact dependencies govern *execution ordering* and *stale propagation between artifacts*
- ArtifactImpactRecord governs *knowledge-driven staleness* — "a knowledge change makes this artifact's content potentially outdated"

When a knowledge change occurs, the PKS:
1. Marks affected ArtifactImpactRecords as `stale` or `potentially-stale`
2. The existing artifact dependency graph (Document 2 §12.4) then governs downstream artifact-to-artifact propagation

**One canonical artifact dependency mechanism** (Document 2/3). One canonical knowledge-impact mechanism (ArtifactImpactRecord). They work in sequence, not in competition.

## 21.5 Stale Propagation Rules — With Deterministic Semantics

**Staleness states are defined precisely:**

`stale` — The system can establish with high confidence that the artifact's content
is materially affected by the knowledge change. The knowledge change directly
contradicts or invalidates something the artifact asserts. A human should regenerate
or explicitly dismiss.

`potentially-stale` — A relevant dependency changed, but the system cannot
automatically determine whether the artifact content is materially affected.
Human review is required to confirm or dismiss.

**Why this artifact is stale must always be explainable.** `StalenessReason.humanReadable`
carries the specific provenance path:
```
"Decision D17 ('Use React Native') was superseded by Decision D31 ('Use Flutter') 
 on 2026-09-01. PRD section 'Technical Approach' depends on D17."
```

**Propagation rules with deterministic semantics:**

| Upstream change | Staleness level | Rationale |
|---|---|---|
| Decision superseded | `potentially-stale` on dependsOnDecisionIds artifacts | Decision changed; whether artifact content is materially affected requires review |
| Core assumption invalidated (proven wrong) | `stale` on dependsOnAssumptionIds artifacts | The assumption being false directly invalidates content that rests on it |
| Constraint removed/relaxed | `potentially-stale` on dependsOnConstraintIds artifacts | The constraint may no longer apply; review needed |
| Research finding contradicted | `potentially-stale` on downstream artifact chain | Contradicted finding may affect decisions which affect artifacts |
| Evidence retracted | `potentially-stale` if the evidence was cited in the artifact | Cited source is retracted; claim grounding must be reviewed |

**Propagation algorithm — deterministic and explainable:**
```
1. Knowledge item status changes (superseded / invalidated / retracted / contradicted)
2. PKS walks:
     knowledge item → affectedArtifactIds (direct links)
     knowledge item → derived decisions → affected artifacts (indirect)
     knowledge item → derived assumptions → affected artifacts (indirect)
3. For each affected artifact, create StalenessReason with full provenance path
4. Set ArtifactImpactRecord.stalenessStatus per the table above
5. Notify Document 3 artifact dependency mechanism for downstream artifact propagation
6. Surface to Mission Control / Desk / Studio with the StalenessReason
```

**Human staleness review:**
When a human reviews a stale or potentially-stale artifact:
- Confirm: artifact needs regeneration → trigger Studio improve flow
- Dismiss: knowledge change does not affect this artifact → set status='current';
  record DismissalRecord(itemId, dismissedBy, dismissedAt, rationale)
- Defer: not reviewed yet → status remains stale/potentially-stale

**ArtifactImpactRecord population:**
- Populated by the Promotion Engine at run completion
- Updated when knowledge items change status
- Read by the PKS Inspection API (§36.2) and the Desk / Studio surfaces

## 21.6 Impact Matrix: Artifact Type × Knowledge Change

| Artifact | Superseded decision | Invalidated assumption | Contradicted finding | Constraint removed |
|---|---|---|---|---|
| Problem Definition | ✓ potentially-stale | ✓ stale | ✓ potentially-stale | — |
| PRD | ✓ stale | ✓ stale | ✓ potentially-stale | ✓ potentially-stale |
| UX Design | ✓ potentially-stale | ✓ potentially-stale | — | ✓ potentially-stale |
| Architecture | ✓ stale | — | ✓ potentially-stale | ✓ stale |
| MVP Hypothesis | ✓ stale | ✓ stale | ✓ stale | — |
| OST | ✓ stale | ✓ stale | ✓ stale | — |
| ERD | ✓ potentially-stale | — | — | ✓ potentially-stale |
| Backlog/Release | ✓ potentially-stale | — | — | ✓ potentially-stale |
| QA Readiness | ✓ potentially-stale | ✓ potentially-stale | — | ✓ potentially-stale |

`✓ stale` = high confidence this artifact needs updating
`✓ potentially-stale` = may need updating; human review required
`—` = typically unaffected by this change type

---

# PART 22 — CONTEXT ASSEMBLY TRACE AND RETRIEVAL OBSERVABILITY

## 22.1 The ContextAssemblyTrace

Every call to `scope()` produces a `ContextAssemblyTrace` record appended to
`workspace/{projectId}/runs/{runId}/context-trace.jsonl`.

```typescript
interface ContextAssemblyTrace {
  traceId: string;
  runId: string;
  stepId: string;
  capabilityInstanceId: string;
  requestedAt: string;
  completedAt: string;
  tokenBudget: number;
  actualTokens: number;
  withinBudget: true;  // always true — scope() only returns on success; throws on contract violation
  // Note: overflowOccurred removed. If mandatory items exceeded the budget,
  // ContextContractUnsatisfiable was thrown and no trace was written.

  // All candidates evaluated (scoped pool)
  candidatesEvaluated: number;
  candidatesAboveThreshold: number;

  // Items included — WHY they were included
  inclusions: ContextInclusionRecord[];

  // Items excluded — WHY they were not included
  exclusions: ContextExclusionRecord[];  // P1-5 enhancement

  // Contradictions surfaced
  contradictionsFlagged: string[];
}

interface ContextInclusionRecord {
  itemId: string;
  itemKind: 'knowledge' | 'evidence' | 'context-item' | 'prior-step-output';
  tier: 0 | 1 | 2 | 3;
  finalScore: number;
  compressed: boolean;
  tokenContribution: number;
  inclusionReason: string;  // human-readable
  rankingSignals: {
    keyword: number;
    semantic: number;
    recency: number;
    quality: number;
    authority: number;
    relationship: number;
    freshnessMultiplier: number;
    contradictionPenalty: number;
  };
}

// P1-5: Exclusion observability
interface ContextExclusionRecord {
  itemId: string;
  itemKind: string;
  finalScore: number;
  exclusionReason: ExclusionReason;
  humanReadableReason: string;
}

type ExclusionReason =
  | 'out-of-scope'         // filtered in Stage 1 (scope enforcement)
  | 'prohibited'           // in mustNotReceiveOutputFrom (Document 3)
  | 'below-threshold'      // final_score < 0.30
  | 'stale-perishable'     // freshnessMultiplier = 0 (perishable expired)
  | 'superseded'           // status = 'superseded'
  | 'budget'               // budget exhausted before this tier item
  | 'budget-tier1-overflow'// Tier 1 item excluded due to overflow
  | 'conflict-policy'      // excluded due to contradiction policy (rare)
  | 'agent-boundary'       // capability not in capabilityAffinity list
  | 'duplicate'            // near-duplicate of higher-ranked included item
  | 'insufficient-authority'; // authority score below capability's threshold
```

## 22.2 Observability Purpose

The `ContextAssemblyTrace` is the foundation for answering:

| Question | Source |
|---|---|
| "Why did RE see this competitor information?" | `inclusions[*].inclusionReason + rankingSignals` |
| "Why didn't PS see the constraint?" | `exclusions` where `itemKind='knowledge'` and `exclusionReason='budget'` |
| "What was the retrieval quality?" | `candidatesAboveThreshold / candidatesEvaluated` |
| "Did the context overflow?" | `overflowOccurred + overflowDetails` |
| "Which contradictions were surfaced?" | `contradictionsFlagged` |

## 22.3 Future Retrieval Inspector

The `context-trace.jsonl` files are the data source for a future Mission Control
"Retrieval Inspector" view showing — step by step — what knowledge each agent
received and why. This view is not in scope for V1 but the data is being
collected from day one.

## 22.4 Real-Time Run-Scoped Evidence Visibility (v1.2)

During execution, run-scoped evidence accumulates in
`workspace/{projectId}/runs/{runId}/evidence.jsonl`. This file is readable
by Mission Control in real time (it is append-only; readers see it grow).

**What Mission Control can display during execution:**
- Evidence items captured so far in this run (sources, claims, timestamps)
- Which capability captured each evidence item (from provenance.producedByCapability)
- Which step captured it (from provenance.producedInStep)
- Current confidence of each evidence item
- Whether any evidence is already contradicting prior project knowledge

**What is NOT visible during execution:**
- Promoted project-level knowledge (that happens post-run)
- Contradiction records against project knowledge (written post-run)
- The final ArtifactImpactRecord updates (written post-run)

**Critical boundary — no implicit promotion:**
`RunEvidenceSnapshot` is a **read-only observability view** over run-scoped evidence.
Viewing evidence in the snapshot does not trigger any promotion into the project
knowledge store. The following path is explicitly prohibited:

```
PROHIBITED:
  RunEvidenceSnapshot seen by human
      ↓ (implicit)
  Evidence automatically promoted to persistent PKS
```

The correct path remains:
```
PERMITTED:
  RunEvidenceSnapshot seen by human (read-only; no side effects)
  Run completes (run_completed event)
      ↓
  Governed promotion lifecycle (§18)
      ↓ (explicit, deterministic, post-run)
  Persistent PKS knowledge
```

This separation preserves the governed promotion lifecycle (§18) while giving
human observers meaningful real-time insight into what the run is discovering.
"The model saw this during execution" must never automatically become "IdeaGate
treats this as governed knowledge."

```typescript
// PKS exposes this for Mission Control during execution
interface RunEvidenceSnapshot {
  runId: string;
  asOf: string;              // ISO 8601 — snapshot time
  totalEvidenceItems: number;
  byCapability: Record<CapabilityId, number>;
  recentItems: EvidenceItem[];  // last 20, reverse-chronological
  potentialContradictions: {
    runEvidenceId: string;
    conflictsWithProjectItemId: string;
    humanReadable: string;
  }[];
}
```

---

# PART 23 — FAILURE AND DEGRADED-MODE MATRIX (P0-8 fix)

## 23.1 The Core Principle

```
"Graceful degradation where safe; fail closed where correctness,
 isolation, integrity, or security would otherwise be compromised."
```

## 23.2 Fail-Open Cases (Graceful Degradation)

| Failure | Behavior | Run impact |
|---|---|---|
| Knowledge store unavailable (read) | Return empty WorkspaceKnowledgeSlice | Step proceeds with no project knowledge |
| Evidence store unavailable (read) | Return no evidenceItems in slice | Step proceeds with no evidence context |
| No relevant knowledge above threshold | Return empty slice | Normal — expected for new projects |
| Knowledge base empty | Return empty slice | Normal — expected for first run |
| Evidence stale (time-sensitive, old) | Include with staleness annotation | Step proceeds; model sees freshness warning |
| Item marked 'superseded' | Exclude from default retrieval | Normal — newer item included instead |
| Optional context item extraction fails | Log; skip that item; continue | Step proceeds; item missing from context |
| URL fetch failure | Log; return no contextItem for that URL | Step proceeds; URL content missing |
| GitHub read failure | Log; return no contextItem | Step proceeds; repo content missing |
| Promotion fails (storage write error) | Log; retry once; if fail: mark run as partially-committed | Run complete; knowledge promotion partial |
| Novelty check times out | Promote with 'uncertain-novelty' flag | Step proceeds in future; possible duplicate |
| Context trace write fails | Log; continue | Missing trace entry; not a run failure |
| Token budget smaller than RANK items | Truncate Tier 3/2 items; include what fits | Step proceeds with reduced knowledge |

## 23.3 Fail-Closed Cases (Stop Execution)

| Failure | Response | Run impact |
|---|---|---|
| **Cross-project contamination detected** | Throw `ScopeViolationError`; Engine receives as step failure | Step fails (technically retryable after fix) |
| **Knowledge schema corrupted** (required fields missing, types invalid) | Reject item at retrieval; log KNOWLEDGE_INTEGRITY_ERROR | Single item skipped; if widespread: log alert |
| **Provenance record missing** (zero sourceRef) | Reject at promotion; never serve | Item not promoted; logged |
| **Memory poisoning attempt detected** (model output attempting to write directly to knowledge store) | MEMORY_SECURITY_VIOLATION; block; log | No impact on run; security event emitted |
| **Impossible context contract** (Tier 0 mandatory items exceed tokenBudget) | Throw `ContextContractUnsatisfiable` (retryable=false); Engine fails the step; emits ENG_12 | Step fails; cascade applies (§15.2 Doc 3); Mission Control surfaces actionable error |
| **scope() call with missing required fields** | Throw validation error | Step treated as technical failure (retryable) |

---

# PART 24 — SECURITY AND MEMORY POISONING PROTECTIONS

## 24.1 The Threat Model

A primary security concern in LLM-powered systems is **memory poisoning**: a
model or external source inserts structured content designed to be treated as
knowledge, influencing future model behavior.

IdeaGate's architecture prevents this through deterministic promotion gates.

## 24.2 Defense Layer 1 — No Direct Model Writes

The model never calls a knowledge store write function. Knowledge store writes
are only possible via:
1. The Promotion Engine (post-run, deterministic rules)
2. Tool call completions (evidence capture by the Engine)

No agent harness invocation can trigger a direct knowledge write.

## 24.3 Defense Layer 2 — Schema Validation Before Promotion

Every candidate item must pass schema validation before promotion:
- Required fields must be present and correctly typed
- `sourceRef` must be a non-empty string
- `confidence` must be in [0, 100]
- `memoryClass` must be one of the seven defined values
- `evidenceBasis` for evidence items must be 'source-grounded' or 'user-asserted'
  (not 'model-generated')

Schema validation failures reject the item without exception — the run continues.

## 24.4 Defense Layer 3 — Epistemic Hierarchy Enforcement

Items with `evidenceBasis: 'model-generated'` receive:
- `confidence <= 50` (enforced; higher values are truncated at promotion)
- `authorityScore` computed from the authority model (typically 0.5 or below)
- A flag in the assembled context: `"[model-generated: treat as inference, not fact]"`

This prevents unsupported model reasoning from acquiring the epistemic status
of source-grounded evidence.

## 24.5 Defense Layer 4 — Injection Detection

Before storing any extracted content as a candidate knowledge item, the Promotion
Engine scans for injection patterns:

```typescript
const INJECTION_PATTERNS = [
  /YOU ARE NOW IN (ADMIN|MEMORY WRITE|KNOWLEDGE STORE) MODE/i,
  /MEMORY SYSTEM INSTRUCTION:/i,
  /OVERRIDE PREVIOUS.*KNOWLEDGE/i,
  /\[SYSTEM\].*PROMOTE THIS AS/i,
  // ... additional patterns derived from red-teaming
];

function detectInjectionAttempt(content: string): boolean {
  return INJECTION_PATTERNS.some(p => p.test(content));
}
```

When detected: reject the candidate; emit `MEMORY_SECURITY_VIOLATION` event;
do not store anything from this extraction batch.

## 24.6 Defense Layer 5 — Source Integrity

Evidence items from external sources carry source trust levels. A source that
consistently produces injection-pattern content may be flagged as `sourceTrustLevel: 'low'`
or blocked by a domain allowlist/blocklist (future configuration).

---

# PART 25 — V1 STORAGE ARCHITECTURE

## 25.1 Philosophy

Local-first. Zero operational cost. File-based. Git-compatible.
Consistent with IdeaGate's existing architecture.

No external services, databases, or cloud dependencies in V1.

## 25.2 File Layout

```
workspace/
  {projectId}/
    knowledge/
      items.jsonl           ← WorkspaceKnowledgeItems (append-only; status updates append)
      evidence.jsonl        ← Project-scoped EvidenceItems
      artifact-index.jsonl  ← ArtifactKnowledgeEntries
      artifact-impact.jsonl ← ArtifactImpactRecords (v1.2)
      implications.jsonl    ← Implication records (v1.2; not WorkspaceKnowledgeItems)
      contradictions.jsonl  ← ContradictionRecords
      supersessions.jsonl   ← SupersessionRecords
      annotations.jsonl     ← PKSAnnotations (v1.2; human-layer only)
    runs/
      {runId}/
        evidence.jsonl      ← Run-scoped EvidenceItems (captured during run)
        context-trace.jsonl ← ContextAssemblyTrace per step (append-only)
        outcome-digest.json ← RunOutcomeDigest (written at run completion)
        promoted.jsonl      ← Log of items promoted in this run's promotion phase
```

## 25.3 JSONL Append-Only Protocol

Knowledge items are never overwritten in-place. Updates (status changes,
supersession) are appended as new records:

```
items.jsonl:
{"itemId":"abc","version":1,"status":"active",...}    ← original
{"itemId":"abc","version":2,"status":"superseded",...} ← status update (append)
```

The most recent record for a given `itemId` wins. Reading the knowledge store
requires scanning and deduplicating by `itemId` + taking the latest `version`.

This is intentionally simple for V1. Phase 3 (SQLite) will make this
efficient by maintaining an index.

## 25.4 V1 Performance Targets (P0-10 — targets, not guarantees)

These are implementation targets to be validated:

| Operation | V1 target (JSONL) | Phase 3 target (SQLite) |
|---|---|---|
| scope() call (full pipeline) | P95 < 200ms for ≤500 items | P95 < 50ms |
| Evidence capture (single item) | < 10ms | < 5ms |
| Post-run promotion (≤50 candidates) | < 5 seconds | < 1 second |
| Context assembly trace write | < 5ms | < 2ms |

**These are targets.** Actual performance must be benchmarked against the
IdeaGate runtime in Phase 1. If targets are missed, optimize before Phase 3.

---

# PART 26 — PHASE UPGRADE SEAMS

## 26.1 Phase 1 → Phase 3: SQLite

The JSONL storage protocol is replaced by SQLite for the knowledge store and
artifact index. The schema does not change — only the storage backend changes.

PKS presents the same interface. The ContextManager implementation switches from
JSONL scanning to SQL queries. No other component changes.

```
Phase 3 SQLite tables:
  workspace_knowledge (items with full schema, indexed by projectId + status + memoryClass)
  evidence (evidenceItems, indexed by projectId + runId + status)
  artifact_knowledge (ArtifactKnowledgeEntries, indexed by artifactId)
  contradictions (ContradictionRecords)
  supersessions (SupersessionRecords)
```

## 26.2 Phase 3: Local Embeddings

FastEmbed (or equivalent local embedding model) generates embeddings for each
WorkspaceKnowledgeItem and EvidenceItem at promotion time. Embeddings are stored
in the SQLite table alongside the item.

The `semanticScore` signal in the ranking formula becomes active. Weight
redistribution (§11.3) is no longer needed.

No external API call is required for embeddings — local model, zero cost.

## 26.3 Phase 4: Graph Traversal

The `derivedFromItemIds` and `supersedes` fields enable graph traversal without
a graph database. Phase 4 may introduce in-memory graph traversal over the
SQLite-backed knowledge store for multi-hop relationship queries:

- "What decisions were informed by this research finding?"
- "What evidence chain led to this conclusion?"
- "What artifacts depend on this fact?"

The data model already supports this (all relationships are stored). Phase 4
adds efficient traversal on top.

---

# PART 27 — UML ASSESSMENT (Updated from Analysis)

## 27.1 Verdict: INSPIRE

The Universal Memory Layer (UML) as a philosophy is aligned with IdeaGate's
requirements. As a specific implementation stack, it introduces risks.

**Take from UML (philosophy):**
- Retrieve-first: always retrieve before generation
- Provenance as first-class: every item carries full lineage
- Selective promotion: output does not automatically become memory
- Scope-constrained retrieval: scope before any retrieval computation
- Contradiction preservation: never silently overwrite
- Temporal validity awareness: freshness is a property, not binary
- Cross-session continuity: intentional, not automatic

**Do NOT take from UML (implementation risks):**
- Any specific graph database (Neo4j, Kuzu) — operational complexity
- Any specific vector database — external dependency, cost
- Cloud-first architectures — violates local-first requirement
- Autonomous model-controlled memory — violates deterministic governance
- Global shared memory — violates isolation hierarchy

**IdeaGate's PKS is a native implementation of UML philosophy.** The
architecture may be described as "UML-inspired" for portfolio purposes. The
specific UML implementation is replaced by IdeaGate-native JSONL/SQLite/embeddings.
This is a portfolio strength, not a limitation.

---

# PART 28 — MID-2026 RESEARCH ENHANCEMENTS

## 28.1 ADOPTED — Multi-Signal Retrieval

**Problem solved:** PM vocabulary (RICE, JTBD, PRD) benefits more from keyword
matching than generic semantic similarity. Building multi-signal from the start
avoids a future rewrite.

**Applied in:** Part 10 (retrieval pipeline), Part 11 (ranking formula).

## 28.2 ADOPTED — Bitemporal Tracking

**Problem solved:** Competitor pricing and features have two different ages —
when they happened and when IdeaGate discovered them. Both matter for freshness
reasoning.

**Applied in:** Part 7 (temporal model), `EvidenceItem.temporal.eventTime`.

## 28.3 ADOPTED — Novelty-Gated Promotion (SAGE-inspired)

**Problem solved:** The same competitor fact discovered five times should not
create five memory items.

**Applied in:** Part 17 (novelty check in promotion lifecycle).

## 28.4 ADOPTED — Provenance as Evidence Tracing (W3C PROV-DM inspired)

**Problem solved:** "Why did this agent see this information?" requires
structured provenance at every level.

**Applied in:** Part 6 (ProvenanceRecord), Part 22 (ContextAssemblyTrace).

## 28.5 INSPECT (deferred) — Temporal Knowledge Graph

**Problem solved:** Would enable multi-hop reasoning over artifact → evidence → decision chains.

**Why deferred:** Requires graph database infrastructure not compatible with V1 local-first. Data model is designed to be graph-representable (all relationships stored). Phase 4 may implement graph traversal.

**Applied as:** Phase 4 seam in Part 26.

## 28.6 REJECTED — Autonomous Memory Management by LLM

**Risk:** Memory poisoning, uncontrolled accumulation, loss of deterministic governance.

**Applied as:** §18.1 (authority hierarchy), Part 24 (security).

## 28.7 REJECTED — Vector-Only Retrieval Foundation

**Risk:** Cannot enforce scope, detect contradictions, or apply temporal semantics.

**Applied as:** Phase 1 uses keyword + structural only; semantic is additive (Phase 3).

---

# PART 29 — RETRIEVAL QUALITY EVALUATION SEAM (P1-1)

## 29.1 Why This Matters

Retrieval quality directly impacts artifact quality. If the PKS retrieves
irrelevant or stale context, the generated artifacts suffer. IdeaGate needs a
mechanism to measure and improve retrieval over time.

## 29.2 Evaluation Seam Contract

The PKS exposes these quality metrics that the existing IdeaGate Evaluation
Harness can eventually measure:

```typescript
interface RetrievalQualityMetrics {
  runId: string;
  stepId: string;

  // Context quality signals
  contextRelevanceScore?: number;     // how relevant was the retrieved context?
  contextPrecision?: number;          // what fraction of retrieved items were relevant?
  evidenceCoverageScore?: number;     // was evidence comprehensive?
  contradictionExposureRate: number;  // fraction of retrievals that exposed contradictions

  // Efficiency signals
  tokensUsed: number;
  tokenBudget: number;
  tokenEfficiency: number;           // tokensUsed / tokenBudget

  // Retrieval signals
  candidatesEvaluated: number;
  candidatesAboveThreshold: number;
  itemsIncluded: number;
  itemsExcluded: number;
  exclusionReasons: Record<ExclusionReason, number>;

  // Downstream signal (requires evaluation result)
  subsequentArtifactScore?: number;   // from EvaluationLogEntry for this step
}
```

## 29.3 Correlation with Downstream Quality

The `ContextAssemblyTrace` records the context for each step. The
`EvaluationLogEntry` (Document 3) records the quality of the step's output.
These can be joined by `stepId` and `runId` to answer:

"When high-authority project knowledge was retrieved for a step, did the resulting
artifact score higher on relevant quality dimensions?"

This correlation analysis is a future Phase 4 capability but the data is
collected from day one.

---



# PART 34B — CANONICAL LIFECYCLE COUNT (v1.2 RESOLUTION)

## 34B.1 The Ambiguity Being Resolved

IdeaGate documentation uses both "14-stage lifecycle" and references to
`internalStageIndex 0–14` (15 values). Document 5 must map stages to PKS knowledge
production. That mapping requires a canonical, unambiguous count.

## 34B.2 Canonical Resolution

**The IdeaGate lifecycle has 15 execution steps, numbered internalStageIndex 0–14.**

The human-facing name **"14-stage PM lifecycle"** refers to the 14 substantive PM
stages (indices 1–14). Stage 0 (Idea Intake) is the input-collection step that
precedes the formal PM lifecycle; it is not counted in the "14 stages" because it
collects the idea rather than transforming it.

| Terminology | Count | Meaning |
|---|---|---|
| "14-stage lifecycle" (human-facing) | 14 | Stages 1–14: Discovery through Prototype Prompt |
| `internalStageIndex` (execution) | 0–14 (15 values) | Includes Stage 0: Idea Intake |
| Build outcome plan steps | 15 generate steps | One per internalStageIndex |

This is not a conflict. It is two consistent views of the same lifecycle:
- The PM talks about 14 substantive stages
- The execution engine has 15 indices (0–14) because Stage 0 is real work

## 34B.3 Stage → PKS Knowledge Mapping (for Document 5)

This is the authoritative stage-to-knowledge-production reference that Document 5
must use when defining extraction hints and capability output contracts.

| internalStageIndex | Stage name | Primary PKS knowledge produced |
|---|---|---|
| 0 | Idea Intake | Fact (project context), Constraint (user-stated), UnresolvedQuestion |
| 1 | Discovery | ResearchFinding, EvidenceItem, Assumption (unvalidated), UnresolvedQuestion |
| 2 | Problem Definition | ResearchFinding, Assumption (unvalidated), Fact (problem space) |
| 3 | Solution Design | Decision (solution choice), Assumption, AlternativeConsidered |
| 4 | MVP Hypothesis | Decision (scope), Assumption, Constraint (scope, model-inferred) |
| 5 | Validation | EvidenceItem (validation data), ResearchFinding (validated/invalidated), updates Assumption.status |
| 6 | Prioritisation | Decision (priority), Fact (ranking scores) |
| 7 | PRD | Decision (requirements), Constraint (requirements, user-stated) |
| 8 | UX Design | Decision (UX choices), Constraint (UX, model-inferred), Assumption |
| 9 | Usability Planning | UnresolvedQuestion, Decision (test approach) |
| 10 | Architecture | Decision (architecture), Constraint (technical, explicitly-governed) |
| 11 | Backlog & Release | Decision (scope/timeline), Constraint (release) |
| 12 | Implementation Planning | Decision (implementation approach), Fact |
| 13 | QA & Readiness | Constraint (quality gates, explicitly-governed), Decision (acceptance criteria) |
| 14 | Prototype Prompt | Fact (prototype scope), Decision (prototype choices) |

**This mapping is guidance for Document 5.** Document 5 defines the specific
extraction hints and structured output schemas that cause the Promotion Engine to
populate these knowledge items. The mapping above establishes what Document 5
must produce, not how it produces it.

---

# PART 35 — PM REASONING GRAPH AND DECISION LINEAGE (v1.2)

## 35.1 The PM Reasoning Graph — Technical Definition

The human-facing name is **PM Reasoning Chain**. Technically, the structure is a
**directed graph**, not a linear chain. A single decision may be supported by
multiple evidence items, findings, implications, and assumptions simultaneously.
A single finding may inform multiple decisions and assumptions. A single decision
may affect multiple downstream constraints and artifacts.

**IdeaGate does not introduce a ReasoningGraph memory class or a graph database.**
The graph is represented through relationship fields on existing memory classes and
traversed at query time. The existing JSONL + relationship-field architecture remains
the single source of truth.

**Relationship semantics — do not overstate causality.** These words are precise:

| Verb | Meaning |
|---|---|
| `supports` | Evidence supports a claim; does not prove it alone |
| `informs` | A finding informs a decision without being the sole reason |
| `derives-from` | A constraint or implication derives from a decision or finding |
| `depends-on` | An artifact depends on knowledge; changing that knowledge may affect the artifact |
| `constrains` | A constraint limits solution space |
| `impacts` | A knowledge change impacts artifact currency |
| `supersedes` | A newer item replaces an older one; old item preserved |

Use these consistently in documentation, UI, and evaluation labels.
Never use "caused by" — PM reasoning is multi-factor, not strictly causal.

**Traversal (the graph, not a chain):**
```
BACKWARD (why does X exist? — any node)
  artifact   ← depends-on ← {decision, constraint, assumption, finding, evidence}
                             (all are legitimate direct sources)
  decision   ← {evidenceIds, findingIds, implicationIds, acceptedAssumptionIds,
                priorDecisionIds, userRequirementRefs, validationResultIds}
  constraint ← {derivedFromDecisionId?, evidenceIds?, userInput}
  finding    ← supportingEvidenceIds
  evidence   ← provenance.sourceRef

FORWARD (what changes if X is wrong? — any node)
  evidence   → finding (via ResearchFinding.supportingEvidenceIds)
  finding    → implication (via implicationIds)
  finding    → assumption  (via derivedAssumptionIds)
  finding    → decision    (via derivedDecisionIds)
  decision   → constraint  (via derivedConstraintIds, only for decision-derived constraints)
  decision   → artifact    (via affectedArtifactIds)
  assumption → artifact    (via affectedArtifactIds)
  constraint → artifact    (via ArtifactImpactRecord.dependsOnConstraintIds)
```

## 35.1a Multiple Legitimate Decision Origins

**Decisions are not forced through findings.** A decision can legitimately originate
from any combination of:

```
Evidence ──────────────────┐
Research Finding ──────────┤
Implication ───────────────┤
Assumption ────────────────┤
Prior Decision ────────────┼──→ Decision
Governing Constraint ──────┤
Explicit User Requirement ─┤
Validation Result ─────────┤
Business/Product Mandate ──┘
```

All of these origin types are represented as optional relationship fields on the
Decision class (§4.1). None is required. A Decision must always have `rationale`
text explaining its basis, but the relationship fields that formalize that basis
are optional — populated where the Promotion Engine can extract them, left null
where the reasoning was not explicitly traceable.

## 35.2 Implication Record

An **Implication** is a lightweight bridge record connecting a research finding to
the decision or assumption it implied. It makes the reasoning step explicit without
requiring a new memory class.

```typescript
// Implication persistence contract (Correction 4):
// implications.jsonl is append-only. A record is ONLY appended when the Implication
// is in its fully committed state — targetItemId must be resolved BEFORE appending.
// The Promotion Engine holds pending implications in memory during the promotion pass.
// When the target Decision or Assumption is resolved and promoted, the Promotion Engine
// commits the Implication as a complete, immutable record and appends it.
// "Pending" is an in-memory state only — never a state on a persisted record.
// There is no mutation of existing records in implications.jsonl.
//
// If a target cannot be resolved in the current promotion pass, the Implication
// is discarded (not appended). If the source Finding is superseded, the Implication
// is not re-created — the supersession chain handles lineage.

interface Implication {
  // Stored in knowledge/implications.jsonl (append-only; only committed records)
  implicationId: string;
  projectId: string;
  producedInRun: string;
  producedAtStage: string;

  // The bridge — both source and target are resolved before appending
  sourceType: 'research-finding';  // always a finding in V1
  sourceItemId: string;            // ResearchFinding.itemId (already promoted)
  implicationText: string;         // "This finding informs the decision/assumption that..."
  relationshipVerb: 'informs' | 'supports' | 'derives-from'; // (§35.1 vocabulary)
  targetType: 'decision' | 'assumption';
  targetItemId: string;            // Required — resolved before append. NOT optional.

  // Epistemic status
  confidence: number;              // 0–100; how strongly does the finding support this?
  evidenceBasis: 'inferred';       // always; implications are capability reasoning
  status: 'accepted' | 'rejected' | 'superseded'; // no 'pending' in persisted records
  provenance: ProvenanceRecord;
}
```

**Implications are lightweight.** They live in a separate append-only file and are
not promoted to WorkspaceKnowledgeItems. They exist solely to make the reasoning
step between findings and decisions/assumptions inspectable.

**Append-only safety guarantee:** `implications.jsonl` is never mutated. Records
are committed complete. The "pending" state exists only in the Promotion Engine's
in-memory pass — never on disk. An implementation team cannot interpret any field
as requiring post-hoc mutation of an existing record.

## 35.3 AlternativeConsidered Record

Tracks which options were evaluated before a decision was made.

```typescript
interface AlternativeConsidered {
  alternativeId: string;          // UUID
  alternativeText: string;        // the option that was considered
  rejectionRationale: string;     // why it was not chosen
  relatedEvidenceIds?: string[];  // evidence that informed this evaluation
}
// Stored inline within Decision.alternativesConsidered[]
// Enables Mission Control to answer: "What other options did we evaluate?"
```

## 35.4 DecisionLineage Query (PKS Inspection API)

The `getDecisionLineage(decisionId)` call (§37.2) returns:

```typescript
interface DecisionLineage {
  decision: WorkspaceKnowledgeItem;  // the decision itself

  // Backward chain (why)
  supportingEvidence: EvidenceItem[];
  findings: WorkspaceKnowledgeItem[];   // ResearchFindings that led here
  implications: Implication[];
  acceptedAssumptions: WorkspaceKnowledgeItem[];
  alternativesConsidered: AlternativeConsidered[];

  // Forward chain (impact)
  derivedConstraints: WorkspaceKnowledgeItem[];
  affectedArtifacts: ArtifactImpactRecord[];

  // Supersession chain
  supersedes?: WorkspaceKnowledgeItem;   // prior decision replaced by this one
  supersededBy?: WorkspaceKnowledgeItem; // newer decision that replaced this one
}
```

This is a **read-only computed view** assembled at query time from relationship
fields in existing knowledge items. It is not stored as a separate object.

## 35.5 PM Reasoning Chain: What Document 5 Must Define

Document 5 must specify, per lifecycle outcome and stage:
- Which stages produce Research Findings
- Which stages produce Implications
- Which stages produce Decisions
- Which stages produce Constraints from those Decisions
- Which artifacts are governed by which Decisions and Constraints

This is the extraction-hint contract that makes the reasoning chain populatable
automatically during the Promotion Engine's post-run phase.

---

# PART 36 — DUAL PKS CONSUMERS (v1.2)

## 36.1 Two Consumers, One Foundation

The PKS serves two distinct consumers using the same underlying knowledge store,
the same provenance model, the same scope enforcement, and the same retrieval
pipeline:

| Consumer | Purpose | Interface | Isolation contract |
|---|---|---|---|
| **Agent Context Retrieval** | Assemble context for model invocations | `ContextManager.scope()` | Document 3 isolation before scope(); dynamic retrieval; budget-constrained |
| **Human Knowledge Inspection** | PM explores the project's accumulated knowledge | `PKSInspectionAPI` | Read-only; same projectId scope; no tokenBudget; no isolation (human sees what they are authorized to) |

The two consumers share: projectId scoping, provenance records, status lifecycle,
contradiction records, artifact impact records.

They differ in: the agent consumer receives a budget-constrained assembled context;
the human inspector receives full structured objects without compression.

## 36.2 PKS Inspection API

```typescript
interface PKSInspectionAPI {
  // Decision lineage
  getDecisionLineage(projectId: string, decisionId: string): Promise<DecisionLineage>;
  listDecisions(projectId: string, filter?: KnowledgeStatusFilter): Promise<WorkspaceKnowledgeItem[]>;

  // Reasoning chain traversal
  getReasoningChain(projectId: string, rootId: string, direction: 'forward' | 'backward'): Promise<ReasoningChainView>;

  // Artifact impact
  getArtifactImpact(projectId: string, artifactId: string): Promise<ArtifactImpactRecord>;
  listStaleArtifacts(projectId: string): Promise<ArtifactImpactRecord[]>;

  // Knowledge browser
  listKnowledge(projectId: string, filter: KnowledgeFilter): Promise<WorkspaceKnowledgeItem[]>;
  getKnowledgeItem(projectId: string, itemId: string): Promise<WorkspaceKnowledgeItem>;
  getKnowledgeTimeline(projectId: string): Promise<KnowledgeTimelineEntry[]>;

  // Evidence browser
  listEvidence(projectId: string, filter?: EvidenceFilter): Promise<EvidenceItem[]>;
  getRunEvidenceSnapshot(projectId: string, runId: string): Promise<RunEvidenceSnapshot>;

  // Contradiction browser
  listContradictions(projectId: string, status?: ContradictionStatus): Promise<ContradictionRecord[]>;

  // Assumption register
  listAssumptions(projectId: string, priority?: AssumptionPriority): Promise<WorkspaceKnowledgeItem[]>;

  // Provenance inspection
  getProvenanceChain(projectId: string, itemId: string): Promise<ProvenanceRecord[]>;
}

interface KnowledgeFilter {
  memoryClass?: MemoryClass | MemoryClass[];
  status?: KnowledgeStatus | KnowledgeStatus[];
  producedInRun?: string;
  since?: string;          // ISO 8601
  freshnessClass?: FreshnessClass;
}

interface KnowledgeTimelineEntry {
  itemId: string;
  memoryClass: MemoryClass;
  contentSummary: string;
  status: KnowledgeStatus;
  timestamp: string;
  producedInRun: string;
  changeType: 'created' | 'superseded' | 'invalidated' | 'retracted' | 'contradicted';
}

interface ReasoningChainView {
  rootId: string;
  direction: 'forward' | 'backward';
  nodes: ChainNode[];
  edges: ChainEdge[];
}

interface ChainNode {
  id: string;
  kind: 'evidence' | 'finding' | 'implication' | 'assumption' | 'decision' | 'constraint' | 'artifact';
  label: string;
  status: string;
  confidence?: number;
}

interface ChainEdge {
  fromId: string;
  toId: string;
  relationshipType: string;  // 'supports' | 'implies' | 'accepts' | 'derives' | 'impacts'
}
```

## 36.3 Collaborative Annotations (V3/V4 Seam)

In the V3/V4 collaborative PM workspace, team members may annotate knowledge items,
flag stale artifacts, and add context to evidence. These annotations are a PKS
**write** concern that coexists with the governed promotion lifecycle.

```typescript
interface PKSAnnotation {
  annotationId: string;
  projectId: string;
  targetItemId: string;          // knowledge item, evidence, or artifact being annotated
  targetKind: 'knowledge' | 'evidence' | 'artifact' | 'contradiction';
  annotatorId: string;           // future: user identity (Phase 5 / auth layer)
  annotationText: string;
  annotationType: 'note' | 'question' | 'dispute' | 'confirmation' | 'flag-stale';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}
```

**Annotations are NOT knowledge items.** They do not enter the retrieval pipeline.
They are human-layer metadata stored in `knowledge/annotations.jsonl`. They are
surfaced in the PKS Inspection API and in future Studio / Desk UI surfaces.

The model does not receive annotations as context (they are human notes, not
system knowledge). Future: a `'flag-stale'` annotation on a critical assumption
may trigger an `UnresolvedQuestion` knowledge item to be promoted.

---

# PART 37 — KNOWLEDGE STATUS LIFECYCLE (v1.2)

## 37.1 The Canonical Status States

This section clarifies the full status lifecycle for all knowledge items, avoiding
ambiguity between normal lifecycle operations and exceptional governance deletion.

```
WorkspaceKnowledgeItem.status lifecycle:

'candidate'      Initial state at extraction; not yet in the project knowledge base.
      ↓ Promotion Engine validates and promotes
'active'         Fully promoted; available for retrieval; authoritative for its class.
      ↓ Three pathways out of 'active':

PATH A — NORMAL SUPERSESSION:
'active' → 'superseded'   A newer item explicitly replaces this one.
                          supersededBy = newItemId.
                          Original preserved. History intact.
                          Not retrieved in standard queries.

PATH B — LOGICAL INVALIDATION:
'active' → 'invalidated'  Evidence proves this item is incorrect.
                          Requires evidenceIds pointing to contradicting evidence.
                          Original preserved. Marked as incorrect.
                          Not retrieved in standard queries; visible in history.

PATH C — EXPLICIT RETRACTION:
'active' → 'retracted'   User explicitly withdraws this item.
                          No evidence required.
                          Original preserved with retraction timestamp.

SPECIAL STATES:
'aging'          Computed dynamically during retrieval (based on temporal.observedAt).
                 Not stored — this is a retrieval-time annotation.
'stale'          Computed dynamically during retrieval (freshnessClass threshold exceeded).
                 Not stored — retrieval-time annotation.
'contradicted'   Contradiction detected but not yet confirmed; item remains active.
                 Status stays 'active'; contradictionIds field is populated.
```

## 37.2 Displaying Status to PM Users

The Inspection API and Mission Control should present status in PM-native language,
not engineering status names:

| Internal status | PM-facing label | Meaning shown |
|---|---|---|
| `active` | Current | This is the team's accepted position |
| `superseded` | Replaced | A newer position has taken over — tap to see the chain |
| `invalidated` | Proven wrong | Evidence showed this was incorrect — tap to see why |
| `retracted` | Withdrawn | The team explicitly withdrew this position |
| `under-review` (Decision) | Being reconsidered | Open question on whether this still stands |
| `candidate` | Proposed | Not yet accepted into the project knowledge base |

## 37.3 Governance Deletion (Outside Normal Lifecycle)

As established in v1.1 §12.3: hard deletion for legal/security/privacy reasons is
outside the PKS API scope. The storage layer supports it; a future administrative
module will expose it. This is unchanged in v1.2.

For V3/V4's collaborative PM workspace: user-level deletion of one's own annotations
is a lightweight concern (annotations are not knowledge items) and may be supported
directly via `PKSAnnotation` deletion without affecting the governed knowledge store.

---

# PART 38 — V3/V4 ARTIFACT SUPPORT (v1.2)

## 38.1 Artifact Type Vocabulary

IdeaGate's artifact contracts (Document 2) define the legal artifact IDs. The
PKS must recognize and correctly classify all current and near-term artifact types
for stale propagation and reasoning chain traversal:

```typescript
type ArtifactType =
  // Core lifecycle artifacts (existing)
  | 'idea-intake'
  | 'discovery'
  | 'problem-definition'
  | 'solution-design'
  | 'mvp-hypothesis'
  | 'validation'
  | 'prioritization'
  | 'prd'
  | 'ux-design'
  | 'usability-planning'
  | 'architecture'
  | 'backlog-release'
  | 'implementation-planning'
  | 'qa-readiness'
  | 'prototype-prompt'

  // V3/V4 strategic artifacts (v1.2 additions)
  | 'ost'                    // Opportunity Solution Tree (Teresa Torres)
  | 'erd'                    // Entity-Relationship Diagram
  | 'competitive-landscape'  // competitive analysis artifact
  | 'assumption-map';        // visual assumption register — a produced artifact, not a view

// NOTE: 'decision-log' and 'evidence-board' are REMOVED from ArtifactType.
// These are PKS computed views accessible via the Inspection API (§36.2), not
// produced artifacts with stable artifactIds and version histories.
// Turning computed views into artifact types would create a second source of truth
// for knowledge that already lives in the PKS knowledge store.
// Decision history → use listDecisions() + getKnowledgeTimeline()
// Evidence collection → use listEvidence() + getRunEvidenceSnapshot()
```

## 38.2 OST (Opportunity Solution Tree) — PKS Integration

An OST is a hierarchical PM artifact showing: desired outcome → opportunities
→ solutions → experiments. It is strongly dependent on:
- Research findings (opportunities come from user research)
- Assumptions (solutions rest on assumptions)
- Decisions (experiment prioritization is a decision)

When promoted to ArtifactKnowledgeIndex:
```
ArtifactKnowledgeEntry {
  artifactType: 'ost',
  dependsOnFindingIds: [...],    // opportunities trace to findings
  dependsOnAssumptionIds: [...], // solutions trace to assumptions
  dependsOnDecisionIds: [...],   // prioritized experiments trace to decisions
}
```

When a research finding is contradicted or an assumption is invalidated:
OST → `potentially-stale` or `stale` (per impact matrix §21.6).

## 38.3 ERD (Entity-Relationship Diagram) — PKS Integration

An ERD is an architectural artifact defining the data model. It depends on:
- Architecture decisions (data storage strategy, normalization rules)
- Technical constraints (database platform, scale requirements)
- Solution design decisions

```
ArtifactKnowledgeEntry {
  artifactType: 'erd',
  dependsOnDecisionIds: [...],    // architecture and data model decisions
  dependsOnConstraintIds: [...],  // technical constraints
}
```

When a relevant architecture decision is superseded: ERD → `stale`.

## 38.4 Visual Artifact Editing — PKS Contract

V3/V4 will support visual editing of structured artifacts (wireframes, journey maps,
system diagrams, OST nodes, ERD entities). From the PKS perspective:

- Visual editing of an artifact triggers a new artifact **version** (Document 3 already handles this)
- The new version is re-indexed by the Promotion Engine post-save
- Knowledge extracted from the prior version is marked `superseded` if content changed materially
- Visual representations are stored as artifact content (Document 2 `outputType: 'visual'`)
- They do not create new knowledge classes — they are representations of existing artifact content

The PKS does not render or validate visual content. It tracks artifact versions,
extracts knowledge from artifacts, and propagates staleness. Rendering is a UI concern.

## 38.5 Human-Edit Provenance Seam

When a human edits an artifact in Studio (text or visual), the resulting artifact
version carries `provenance.changeOrigin: 'human-authored'` (from the `ChangeOrigin`
type in §6.1). This is a reserved seam — not a full human-edit ontology.

**The seam enables these future capabilities without redesign:**
- Mission Control showing: "This decision section was human-edited on 2026-09-01"
- Evaluation: "AI-generated vs human-authored sections" quality comparison
- Audit: distinguishing AI reasoning from human judgment in artifacts

**What the seam does NOT do in V1:**
- It does not change promotion logic
- It does not change retrieval scoring
- It does not create new memory classes
- It does not require new UI implementation in V1

**changeOrigin population rules:**
```
AI-generated artifacts (standard):    changeOrigin = 'ai-generated'
Human studio edit (future V3/V4):     changeOrigin = 'human-authored'
Evidence-extracted items:             changeOrigin = 'evidence-driven'
Stale propagation / system updates:   changeOrigin = 'system-derived'
```

The seam exists because future IdeaGate must be able to distinguish between
"the AI inferred X" and "a human decided X." This distinction matters for trust,
audit, and product governance — but implementing it in V1 would be premature.

## 38.5 Collaborative PM Workspace Implications

In the V3/V4 collaborative model, multiple users work on the same project. The PKS
must maintain isolation between:
- Promoted project knowledge (shared across the team)
- Run-scoped working evidence (scoped to a specific run; not shared until promotion)
- Individual annotations (scoped to the annotator unless shared)

The projectId scope model (Part 9) already handles the project-level sharing.
User-level identity (who promoted what) is captured in `ProvenanceRecord.producedByCapability`
for agent-generated knowledge, and in `PKSAnnotation.annotatorId` for human-layer
annotations. Full multi-user auth is deferred to Document 7 / Phase 5.

---

# PART 39 — CONFIDENCE, RELEVANCE, AUTHORITY, SOURCE RELIABILITY: RUNTIME AND UI SEPARATION (v1.2)

## 39.1 Four Dimensions — Runtime vs UI Semantics

These four dimensions exist in both runtime retrieval and human-facing display.
They must be clearly separated in both contexts.

| Dimension | Runtime use | UI display |
|---|---|---|
| **Source reliability** | `sourceQualityScore` in ranking formula (§11.2); `DEFAULT_SOURCE_RELIABILITY` mapping | "Source quality: high/medium/low" badge on evidence items |
| **Project authority** | `authorityScore`; budget tier assignment; authority floor in ranking | "Authority: Governance constraint / Project decision / Research insight / Working assumption" tag |
| **Evidence basis** | confidence cap by basis; epistemic hierarchy; retrieval scoring | "Based on: User statement / External source / Research analysis / Model reasoning" label |
| **Confidence** | ranking signal via sourceQualityScore; displayed with caveats | "Confidence: 85% — supported by 3 evidence sources" (never "85% probability of being true") |

## 39.2 UI Language Rules

The following phrases are **prohibited** in Mission Control / Desk / Studio:
- "90% confident this is true" → use "90% — strong evidence support"
- "AI determined this" → use "Derived from research by [capability]"
- "Authoritative source" → use "User-stated constraint" or "External research"
- "Memory" (generic) → use specific class: "Project decision" / "Research finding" / etc.

PM-native language must be used throughout. The four dimensions appear as
distinct data fields in the Inspection API, not blended into a single "score."

---

# PART 30 — TESTABLE ACCEPTANCE CRITERIA (v1.2)

| # | Criterion | Verification |
|---|---|---|
| 1 | Scope enforcement runs before any retrieval | Insert Project A items; run scope() with Project B scope; assert zero Project A items in candidates |
| 2 | Only authoritative constraints are Tier 0 | user-stated constraint + model-inferred constraint + low budget; assert user-stated included, model-inferred excluded |
| 3 | Tier 0 overflow throws ContextContractUnsatisfiable (P0-1) | Set tokenBudget=10; insert 100-token user-stated constraint; assert scope() throws; assert no AssembledContext returned; assert no model call |
| 4 | Authority floor does NOT apply below relevance threshold (P0-2) | Insert decision (authorityScore=0.9) with zero signal match; assert pre_floor_score<0.30 → excluded; assert final_score is NOT 0.80 |
| 5 | Authority floor DOES protect relevant decisions | Insert decision (authorityScore=0.9) with moderate relevance (pre_floor=0.45); assert final_score=0.80 |
| 6 | workspace-artifact not a valid EvidenceSourceType (P0-3) | Attempt EvidenceItem(sourceType='workspace-artifact'); assert validation error; assert not stored |
| 7 | Artifact extraction → ArtifactKnowledgeItem, not EvidenceItem (P0-3) | Run post-run promotion on an artifact; assert produced items are ArtifactKnowledgeItems; assert no EvidenceItems created from artifact content |
| 8 | model-inferred constraints are Tier 2, not Tier 0 (P0-4) | Promote constraint(source='model-inferred'); assert authorityScore=0.60; assert Tier 2 classification; assert excluded under budget pressure |
| 9 | user-stated constraints retain maximum authority (P0-4) | Promote constraint(source='user-stated'); assert authorityScore=1.0; assert Tier 0 |
| 10 | capabilityContextIds are pinned items only (P0-5) | scope() with capabilityContextIds=['file-abc']; assert file-abc in contextItems; assert workspaceKnowledge contains dynamically retrieved items NOT limited to capabilityContextIds |
| 11 | observedAt drives V1 freshness; validUntil overrides (P1-1) | Insert evidence(freshnessClass='perishable', observedAt=8 days ago); assert freshnessMultiplier=0.0; Insert evidence(validUntil=yesterday); assert excluded regardless of observedAt |
| 12 | eventTime is stored metadata, not used in V1 freshness | Insert evidence(eventTime=2024-01-01, observedAt=today); assert freshness uses observedAt; assert recencyScore is high |
| 13 | ContradictionRecord status enum has exactly four values (P1-2) | Attempt status='user-resolved'; assert validation error; assert resolution.method='user-explicit' is the correct field |
| 14 | No relationship_bonus in V1 ranking (P1-3) | Inspect RankingSignals; assert no relationship field contributes to score; assert five-signal formula only |
| 15 | Novelty check uses Jaccard similarity; no domain field required (P1-4) | Insert two items with 80% Jaccard overlap and no tags/domain field; assert correct near-duplicate detection; assert no KeyError |
| 16 | sourceReliability is separate from authorityScore (P1-5) | user-stated item: assert authorityScore=0.95 AND sourceReliability='high' as separate fields; web-url item: assert sourceReliability='medium' AND authorityScore independent |
| 17 | confidence capped per evidenceBasis (P1-6) | Promote(evidenceBasis='model-generated', confidence=90); assert stored confidence=50; Promote(evidenceBasis='source-grounded', confidence=90); assert stored confidence=90 |
| 18 | PKS has no delete method in V1 (P1-7) | Assert PKS.deleteItem() does not exist; assert governance deletion is a separate administrative concern |
| 19 | ContextContractUnsatisfiable is non-retryable | Trigger the exception; assert retryable=false; assert step fails with ENG_12 |
| 20 | Ranking is deterministic | Run scope() twice with identical inputs; assert byte-identical ranking scores |
| 21 | Decision reasoning chain traversable backward (v1.2) | Create evidence→finding→implication→decision chain; call getDecisionLineage; assert all chain nodes returned |
| 22 | Decision reasoning chain traversable forward (v1.2) | Create decision→constraint chain; call getReasoningChain(id,'forward'); assert constraint and artifact appear as nodes |
| 23 | Superseded decision propagates staleness (v1.2) | Supersede a decision; assert all artifactIds in affectedArtifactIds have ArtifactImpactRecord.stalenessStatus='potentially-stale' |
| 24 | Invalidated assumption marks artifacts stale (v1.2) | Invalidate an assumption; assert all affectedArtifactIds have stalenessStatus='stale' |
| 25 | Run-scoped evidence visible in real time (v1.2) | Capture evidence mid-run; call getRunEvidenceSnapshot(runId); assert item appears before run completes |
| 26 | Annotations are not knowledge items (v1.2) | Create PKSAnnotation; assert it does not appear in listKnowledge(); assert not in retrieval pipeline |
| 27 | OST tracks finding/assumption/decision dependencies (v1.2) | Promote OST artifact; assert ArtifactKnowledgeEntry.dependsOnFindingIds populated |
| 28 | Implication records live in implications.jsonl (v1.2) | Promote an implication; assert written to implications.jsonl; assert NOT in items.jsonl |

---

# PART 31 — ARCHITECTURAL INVARIANTS (v1.2 Hardened — 40 total)

1. **The ContextManager interface is frozen.** `scope(ContextRequest) → ContextResponse` does not change.

2. **scope() never returns assembledContext.totalTokens > tokenBudget.** If Tier 0 mandatory items cannot fit within the budget, scope() throws `ContextContractUnsatisfiable` (retryable=false). The model is never invoked with oversized context.

3. **Scope enforcement precedes retrieval.** No retrieval query begins before the ScopeFilter is applied at Stage 1.

4. **Cross-project isolation is absolute.** Zero knowledge items from Project A may appear in a Project B retrieval result.

5. **Authority cannot substitute for relevance.** The relevance threshold (Step 4) is applied before the authority floor (Step 5). An irrelevant item cannot be elevated to context by authority alone.

6. **Not all constraints are Tier 0.** Only constraints with source IN ['user-stated', 'explicitly-governed'] (authorityScore ≥ 0.85) receive Tier 0 protection. Research-discovered and model-inferred constraints are Tier 2.

7. **Provenance is never compressed.** ProvenanceRecord fields survive all compression and truncation operations.

8. **The model never writes to the knowledge store.** Evidence capture is Engine-triggered. Promotion is Promotion-Engine-triggered. No LLM invocation creates an EvidenceItem or WorkspaceKnowledgeItem.

9. **Model-generated items cap at confidence=50.** Regardless of submitted value.

10. **workspace-artifact is not a valid EvidenceSourceType.** Artifacts produce ArtifactKnowledgeItems, not EvidenceItems. Artifact existence does not make model-generated reasoning source-grounded evidence.

11. **ContradictionRecord status has exactly four values.** candidate, confirmed, resolved, dismissed. The resolution method is stored in ContradictionResolution.method (including 'user-explicit').

12. **No knowledge item is logically deleted in normal lifecycle operations.** Items are superseded, invalidated, or retracted. Governance deletion is a separate administrative concern outside the PKS API.

13. **Evidence capture is run-scoped; promotion is project-scoped.** Run-scoped evidence survives loop iteration resets (Document 3 step-state reset does not affect PKS evidence state).

14. **capabilityContextIds defines pinned items only, not the retrieval universe.** Dynamic PKS knowledge retrieval operates independently over the project knowledge store.

15. **Ranking is deterministic.** Same candidates + same signals → same ranked order. No relationship_bonus in V1.

16. **observedAt drives V1 freshness calculation.** validUntil is a hard expiry override. eventTime, sourcePublishedAt, and validFrom are stored metadata only in V1.

17. **The storage substrate is replaceable.** PKS API does not expose file paths, SQL queries, or embedding dimensions.

18. **Injection detection runs before promotion.** Positive match rejects the entire extraction batch.

19. **Authority is separate from source reliability, evidence basis, and confidence.** These four dimensions are independent and must not be conflated.

20. **Sub-agents inherit parent scope.** Workers cannot access knowledge beyond their parent capability's allowed scope and cannot write directly to the knowledge store.

21. **Contradictions are preserved.** Both items in a contradiction remain active. A ContradictionRecord is created. Neither is silently overwritten.

22. **ContextAssemblyTrace is written only on successful scope() return.** If ContextContractUnsatisfiable is thrown, no trace entry is written for that call.

---

23. **Decision reasoning chain relationship fields are optional, not required for v1.1 compliance.** A knowledge item without reasoning-chain link fields is valid. Links are populated progressively as the Promotion Engine extracts them.

24. **Implication records are not WorkspaceKnowledgeItems.** They live in `implications.jsonl` and are not retrieved by the ContextManager pipeline. They are accessible only via the Inspection API.

25. **ArtifactImpactRecord is maintained by the Promotion Engine, not the retrieval pipeline.** Stale propagation runs post-promotion, not during scope() assembly.

26. **The PKS Inspection API is read-only.** It does not modify the knowledge store. The only write operations are evidence capture (Engine-triggered) and promotion (Promotion Engine-triggered) and annotations (user-triggered via Inspection API).

27. **Annotations are not knowledge items and do not enter the retrieval pipeline.** They are human-layer metadata that do not affect ContextManager.scope() results.

28. **OST, ERD, and V3/V4 artifact types are recognized by ArtifactType enum.** The PKS artifact impact model applies to all artifact types uniformly.

29. **Confidence, relevance, authority, and source reliability are displayed as four separate dimensions in Mission Control.** They must not be blended into a single "quality score" in the UI.

30. **Knowledge status in the UI uses PM-native language.** 'superseded' → "Replaced", 'invalidated' → "Proven wrong", etc. Engineering status values are internal only.

31. **The PM Reasoning Graph is graph-structured, not a simple chain.** A decision may have multiple origin types (evidence, findings, implications, assumptions, prior decisions, user requirements, validation results). No single origin type is mandatory.

32. **Implication records in implications.jsonl are committed in complete form only.** `targetItemId` is required (not optional) in persisted records. "Pending" state is in-memory only during the Promotion Engine pass. No mutation of existing records in implications.jsonl.

33. **Not all constraints derive from decisions.** `Constraint.derivedFromDecisionId` is set only for decision-derived constraints. user-stated and explicitly-governed constraints have no decision origin field.

34. **ArtifactImpactRecord (knowledge impact) and Document 2/3 RunArtifactDependency (structural ordering) are complementary, not competing.** They work in sequence: knowledge change → PKS ArtifactImpactRecord staleness → Document 2/3 downstream artifact propagation.

35. **Staleness is always explainable.** Every stalenessStatus value must be accompanied by at least one StalenessReason with a humanReadable provenance path. The UI must be able to answer "why is this artifact stale?"

36. **High confidence does not imply high authority.** Confidence and authority are independent dimensions. A model-generated item at confidence=50 does not gain authority by having high confidence.

37. **RunEvidenceSnapshot is read-only.** Viewing it does not trigger promotion. "The model saw this during execution" never automatically becomes "IdeaGate treats this as governed knowledge."

38. **'under-review' is a Decision-specific status only.** Not a general knowledge lifecycle state. All other memory classes use: candidate / active / superseded / invalidated / retracted.

39. **'decision-log' and 'evidence-board' are computed views, not ArtifactType values.** Accessible via PKSInspectionAPI. Must not appear in the ArtifactType enum.

40. **Relationship semantics do not overstate causality.** Vocabulary: supports, informs, derives-from, depends-on, constrains, impacts, supersedes. "Caused by" is not used.

# PART 32 — ADVERSARIAL CONSISTENCY REVIEW (v1.2)

## Document 2 + Document 3 Contract Checks

| Check | Result | Mechanism |
|---|---|---|
| Document 2: artifact IDs stable | ✅ | ArtifactKnowledgeEntry references stable artifactId |
| Document 2: artifact not assumed Markdown forever | ✅ | ArtifactKnowledgeItem supports future structured types |
| Document 2: canonical persistence path | ✅ | All PKS files under workspace/{projectId}/... |
| Document 3: plan is immutable | ✅ | PKS reads plan for scope hints; never writes to plan.json |
| Document 3: assembledContext.totalTokens ≤ tokenBudget (P0-1) | ✅ FIXED | scope() throws ContextContractUnsatisfiable if Tier 0 items exceed budget; never returns oversized context |
| Document 3: isolation enforced before scope() | ✅ | §9.5 — PKS trusts the filtered receivesOutputFrom list |
| Document 3: scope() failure → step technical failure | ✅ | §2.3 and failure matrix |
| Document 3: loop iteration reset does not clear evidence | ✅ | §20.3 — evidence state is PKS-owned, not execution-state |

## P0/P1 Scenario Tests (Adversarial)

| Scenario | Expected behavior | Correct? |
|---|---|---|
| **A** Mandatory constraints exceed context budget | scope() throws ContextContractUnsatisfiable(retryable=false); no model call; ENG_12 | ✅ |
| **B** Irrelevant high-authority decision in candidate pool | pre_floor_score < 0.30 → excluded at Step 4 (relevance threshold); authority floor (Step 5) never applied | ✅ |
| **C** Model invents a "constraint" in an artifact | Artifact → ArtifactKnowledgeItem(evidenceBasis='derived'); promoted to memory class 'constraint' only if Promotion Engine validates; source='model-inferred' → authorityScore=0.60, Tier 2, no authority floor | ✅ |
| **D** Model writes fabricated claim into artifact; Promotion Engine encounters it | ArtifactKnowledgeItem extracted; evidenceBasis='derived'; confidence ≤ 80; injection pattern scan runs; if no external evidence IDs referenced, item remains 'derived', not 'source-grounded' | ✅ |
| **E** Artifact cites a real EvidenceItem (by evidenceId) | ArtifactKnowledgeItem references pre-existing evidenceId; the EvidenceItem already exists in EvidenceStore from original capture; artifact did not create new evidence | ✅ |
| **F** Project A knowledge queried by Project B | ScopeFilter(projectId=B) → Stage 1 excludes all Project A items; zero contamination | ✅ |
| **G** Run-local item queried by future run without promotion | Run-local items have scope='run-local'; ScopeFilter allows only current runId's run-local items; future run cannot retrieve them | ✅ |
| **H** Loop iteration 2 retrieves evidence from iteration 1 | Evidence store not reset between iterations; scope() includes run-scoped evidence from same runId; iteration 2 can retrieve iteration 1 evidence | ✅ |
| **I** Competitor fact: old eventTime, recent observedAt | V1 freshness uses observedAt (recent → high score); eventTime stored as metadata only; item retrieved with freshness annotation | ✅ |
| **J** Two contradictory facts with equal authority | Both promoted; ContradictionRecord created(status='candidate'); both remain active; both included in context with contradiction annotation; no automatic winner | ✅ |
| **K** Relationship bonus depends on selection order | V1 ranking has NO relationship bonus; problem does not exist in V1; deferred to Phase 3 two-pass algorithm | ✅ |
| **L** Novelty candidate has no domain or tags field | Novelty check uses Jaccard similarity on content text only; no domain/tags fields referenced in pseudocode | ✅ |
| **M** User explicitly resolves a contradiction | resolution.method='user-explicit'; status changes from 'confirmed' → 'resolved'; both original items remain in storage | ✅ |
| **N** Model claims 99% confidence in unsupported reasoning | evidenceBasis='model-generated' → stored confidence capped at 50 regardless of submitted value | ✅ |
| **O** Uploaded document contains malicious instructions | Injection detection scans content before promotion; pattern match → MEMORY_SECURITY_VIOLATION; item not stored | ✅ |
| **P** Knowledge item superseded | New item written with supersedes=oldId; old item status='superseded', supersededBy=newId; SupersessionRecord created; old item never deleted | ✅ |
| **Q** Privacy/security deletion request (GDPR) | PKS has no delete method in V1; governance deletion is an administrative concern outside PKS scope; the storage layer (JSONL/SQLite) supports physical deletion; a future governance module will handle it with audit logging | ✅ |

**v1.2 scenario additions:**

| Scenario | Expected behavior | Correct? |
|---|---|---|
| **R** | Decision superseded — artifact staleness propagation | Promotion Engine walks Decision.affectedArtifactIds; marks each ArtifactImpactRecord.stalenessStatus='potentially-stale' | ✅ |
| **S** | Research finding contradicted — forward trace to artifacts | finding → derivedDecisionIds → Decision.affectedArtifactIds → ArtifactImpactRecords; mark 'potentially-stale' | ✅ |
| **T** | PM asks "Why was this decision made?" | getDecisionLineage(id) returns supportingEvidence, findings, implications, acceptedAssumptions, alternativesConsidered | ✅ |
| **U** | Model reasoning added as evidence via implication record | Implication.evidenceBasis='inferred'; does not become EvidenceItem; laundering boundary preserved | ✅ |
| **V** | Project B queries Project A's decision lineage | PKSInspectionAPI enforces projectId scope; Project A items not returned | ✅ |
| **W** | Real-time evidence snapshot requested mid-run | getRunEvidenceSnapshot(runId) reads evidence.jsonl; returns current items without waiting for run completion | ✅ |
| **X** | PM annotates a finding; does annotation enter model context? | PKSAnnotation not in scope() pipeline; model never sees annotations | ✅ |
| **Y** | OST artifact improved; prior artifact knowledge stale? | New ArtifactKnowledgeEntry created; prior marked superseded; Promotion Engine evaluates downstream staleness | ✅ |

---

# PART 33 — DOCUMENT 4 DEFINITION OF DONE (v1.2)

Document 5 may proceed only when all items on this checklist are confirmed.

**Core contracts:**
- [ ] ContextManager.scope() implementation matches frozen Document 3 interface exactly
- [ ] WorkspaceKnowledgeSlice internal schema is fully typed and documented
- [ ] ResolvedContextItem content extraction specified (file-read, url-fetch)
- [ ] PriorStepOutput content resolution specified

**Ontology:**
- [ ] Seven memory classes fully specified with schemas and default freshness classes
- [ ] EvidenceItem schema complete; model-analysis removed from EvidenceSourceType
- [ ] Three epistemic hierarchy levels defined (§5.3)
- [ ] ProvenanceRecord all fields specified
- [ ] Bitemporal fields (observedAt, eventTime, sourcePublishedAt) defined (Part 7)

**Authority model:**
- [ ] Three separate dimensions defined (reliability, project authority, confidence)
- [ ] Authority floor rule for decisions/constraints specified
- [ ] Source trust level → sourceQualityScore mapping defined

**Retrieval:**
- [ ] All seven pipeline stages specified
- [ ] Scope enforcement confirmed as Stage 1 (before any retrieval computation)
- [ ] Multi-signal candidate generation (Phase 1: no embeddings)
- [ ] Complete ranking formula with all six inputs and six steps specified
- [ ] Missing-signal weight redistribution defined
- [ ] Freshness multiplier formula defined per class
- [ ] Contradiction penalty defined
- [ ] Authority floor defined
- [ ] Relevance threshold (0.30) defined
- [ ] Tie-breaking rule defined
- [ ] Ranking determinism confirmed

**Budget:**
- [ ] Four budget tiers defined
- [ ] Budget application algorithm defined
- [ ] Tier 0 overflow handling defined (annotate, flag, do not halt)
- [ ] Tier 1 overflow handling defined
- [ ] Compression rules defined (what survives, what doesn't)

**Evidence:**
- [ ] Evidence capture lifecycle separate from memory promotion
- [ ] Run-scoped evidence available to loop iterations (not reset between iterations)
- [ ] Evidence capture requires source (no model-only evidence)
- [ ] Evidence capture is Engine-triggered, not model-triggered

**Promotion:**
- [ ] Promotion lifecycle steps defined
- [ ] Novelty check defined
- [ ] Post-run timing specified (with loop exception)
- [ ] Memory write authority hierarchy defined
- [ ] Sub-agent memory authority restrictions defined

**Security:**
- [ ] Five defense layers defined (no direct writes, schema validation, epistemic hierarchy, injection detection, source integrity)
- [ ] Injection detection patterns exist
- [ ] Memory poisoning path blocked

**Contradiction:**
- [ ] Six contradiction types defined
- [ ] ContradictionRecord schema defined
- [ ] Both sides always preserved
- [ ] Contradiction annotation in assembled context defined

**Observability:**
- [ ] ContextAssemblyTrace schema complete (inclusions AND exclusions)
- [ ] ExclusionReason type defined
- [ ] Storage path for context traces specified

**Failure:**
- [ ] Fail-open matrix complete (11 cases)
- [ ] Fail-closed matrix complete (6 cases)
- [ ] Core principle stated: graceful degradation where safe; fail closed where integrity at risk

**Storage:**
- [ ] V1 JSONL file layout specified
- [ ] JSONL append-only update protocol specified
- [ ] Phase 3 SQLite seam specified
- [ ] Phase 4 graph traversal seam specified
- [ ] No external service dependencies in V1

**Invariants and criteria (v1.1):**
- [ ] 40 architectural invariants stated (22 from v1.1 + 18 from v1.2)
- [ ] 20 testable acceptance criteria stated
- [ ] Adversarial consistency review (scenarios A–Q) completed

**v1.2 PM intelligence additions:**
- [ ] PM reasoning chain relationship fields on Decision, Constraint, ResearchFinding, Assumption
- [ ] Implication record schema defined; storage: implications.jsonl
- [ ] AlternativeConsidered embedded in Decision
- [ ] DecisionLineage query return type defined
- [ ] ArtifactImpactRecord schema and stale propagation rules (§21.4–21.6)
- [ ] Artifact impact matrix defined (§21.6)
- [ ] ArtifactType enum includes OST, ERD and other V3/V4 types
- [ ] PKS Inspection API (§36.2) fully defined
- [ ] Dual consumer model specified (Part 36)
- [ ] PKSAnnotation schema defined; excluded from retrieval
- [ ] RunEvidenceSnapshot for real-time visibility (§22.4)
- [ ] Knowledge status lifecycle with PM-native UI labels (Part 37)
- [ ] Four UI dimensions separated; UI language rules (Part 39)
- [ ] Invariants 23–30 added (v1.2)
- [ ] Acceptance criteria 21–28 added (v1.2)
- [ ] Adversarial scenarios R–Y added

---

# PART 34 — DOCUMENT 5 HANDOFF (v1.2)

## What Document 5 Is Allowed to Assume

1. The PKS `scope()` call is made before every step and returns an `AssembledContext` with workspaceKnowledge items carrying full provenance, freshness, authority, and contradiction annotations.

2. Only active constraints with source ∈ ['user-stated', 'explicitly-governed'] are in Tier 0. Document 5 capability prompts may reference these constraints and trust they will be present.

3. Evidence captured during a research step is available as run-scoped evidence to later steps in the same run (and across loop iterations within the same run).

4. After a run completes, the PKS promotes relevant knowledge to project scope. Second runs of the same outcome type will retrieve knowledge promoted by prior runs.

5. ContradictionRecords are annotated in the assembled context when conflicting knowledge is retrieved.

6. The `ContextAssemblyTrace` records all retrieval decisions (inclusions and exclusions).

7. **(v1.2)** The PM reasoning chain is populated by the Promotion Engine from extraction hints. Document 5 must define which outcomes and stages populate which memory class relationship fields.

8. **(v1.2)** ArtifactImpactRecords are populated post-run. Document 5 must specify, per artifact type, which decision/constraint/assumption/finding IDs it depends on so the Promotion Engine can populate `affectedArtifactIds`.

9. **(v1.2)** The PKSInspectionAPI is available to Mission Control for human knowledge exploration. Document 5 does not need to define this further.

10. **(v1.2)** OST, ERD, and all V3/V4 artifact types are in the `ArtifactType` enum. Document 5 may reference them in outcome engineering contracts.

## What Document 5 Must NOT Redesign

1. The `ContextManager` interface or any frozen schema from Document 3
2. The retrieval pipeline stages or ranking formula
3. The memory ontology (seven classes) — Document 5 adds extraction rules; it does not add classes
4. The authority model, scope/isolation model, or promotion lifecycle timing
5. The PKS Inspection API — defined in §36.2
6. The ArtifactImpactRecord schema — defined in §21.4
7. The Implication record schema — defined in §35.2

## What Document 5 Must Define

1. Which lifecycle stages produce which memory class items (e.g., Discovery → ResearchFinding, Solution Design → Decision + Assumption)
2. Which memory class relationship fields each stage populates (e.g., which findings lead to which decisions)
3. Capability framing per outcome: which knowledge classes each capability needs in its context
4. Structured output schemas for generate steps that enable extraction hints
5. Structured output schemas for evaluate steps that the PKS uses to extract quality dimensions
6. Which artifact types depend on which decision/constraint/assumption IDs (for ArtifactImpactRecord population)
7. OST-specific extraction: how findings, assumptions, and decisions map to OST tree nodes
8. ERD-specific extraction: which decisions govern ERD entity/relationship choices

# IDEAGATE — DOCUMENT 4 v1.2
# PART 34A — FINAL SURGICAL CLARIFICATION ADDENDUM

**Placement:** Paste directly after the existing **PART 34 — DOCUMENT 5 HANDOFF** and before the existing Part 35.

**Purpose:** Final hardening of Document 4 without redesigning its architecture.

**Status:** Normative clarification. This addendum does not replace Document 4 v1.2, Document 3, or Document 2. It closes remaining ambiguity, ownership, terminology, lineage, promotion, artifact-impact, and implementation seams before Document 5.

**Authoritative rule:** Where this addendum addresses a specific ambiguity, this clarification governs. All other v1.2 contracts remain unchanged.

---

## 34A.1 — Architectural Intent

Document 4 v1.2 is fundamentally aligned with IdeaGate's intended direction:

> **IdeaGate does not merely remember generated text. It maintains governed product knowledge that can be selectively retrieved, inspected, traced, challenged, superseded, and connected back to the artifacts and decisions it influences.**

The PKS therefore remains:

```text
Evidence
   ↓
Finding
   ↓
Implication
   ↓
Assumption
   ↓
Decision
   ↓
Constraint
   ↓
Artifact
   ↓
Impact / Staleness
   ↓
Future retrieval
```

This is a reasoning substrate, not a generic chatbot memory layer.

The following principles remain non-negotiable:

- AI generates and explains.
- Deterministic rules govern persistence, scope, retrieval, promotion, state, and completion.
- Memory is earned rather than accumulated indiscriminately.
- Evidence is not the same thing as model reasoning.
- Context is assembled for a purpose, not dumped into a prompt.
- Co-occurrence is not lineage.
- Human annotations are not automatically model context.
- Project isolation is enforced before retrieval.
- Staleness must be explainable.
- Every important product claim should be traceable to its basis.

---

# 34A.2 — Canonical Lifecycle Terminology

IdeaGate has two legitimate lifecycle descriptions that must not be conflated.

### Internal execution model

```text
internalStageIndex = 0–14
```

This represents **15 executable lifecycle steps**.

### Human-facing PM lifecycle

```text
Stages 1–14
```

These represent the **14 substantive PM lifecycle stages**.

### Stage 0

```text
Stage 0 — Idea Intake
```

Stage 0 is a real executable step and produces a real artifact. It is called the intake step and is not counted when the product is described to users as having a "14-stage PM lifecycle."

### Canonical statement

> **IdeaGate executes 15 lifecycle steps (0–14). Stage 0 is Idea Intake; stages 1–14 constitute the formal 14-stage PM lifecycle.**

This wording should be used consistently across:

- Document 5+
- UI specifications
- Mission Control
- artifact metadata
- interview material
- evaluation documentation
- implementation comments

The frontend must not expose internal stage terminology merely because the engine uses it.

---

# 34A.3 — Governance Status vs Computed Condition

The PKS must distinguish **persisted governance state** from **runtime/computed condition**.

### Persisted governance states

General knowledge:

```text
candidate
active
superseded
invalidated
retracted
```

Decision-specific:

```text
under-review
```

`under-review` is not a sixth universal memory status.

### Computed conditions

These are derived conditions, not additional governance states:

```text
aging
stale
contradicted
```

They may be displayed prominently in the UI but must not silently become additional persisted lifecycle states.

### Definitions

| State / condition | Meaning |
|---|---|
| `candidate` | Proposed knowledge not yet accepted into governed project knowledge |
| `active` | Currently accepted project knowledge |
| `superseded` | Replaced by a newer accepted position |
| `invalidated` | Determined to be incorrect, unsupported, or no longer valid |
| `retracted` | Explicitly withdrawn from reliance |
| `under-review` | A Decision is actively being reconsidered |
| `aging` | Freshness is declining but the item has not necessarily become invalid |
| `stale` | A material dependency or freshness condition means the item may no longer be reliable for current use |
| `contradicted` | The item currently conflicts with another governed position |

UI labels may be PM-native, but stored semantics remain deterministic.

---

# 34A.4 — `invalidated` vs `retracted`

These must remain distinct.

### Invalidated

The knowledge itself has been determined to be wrong, unsupported, or no longer valid.

Example:

> "Users prefer a five-step onboarding flow" is disproven by validation.

### Retracted

The knowledge is explicitly withdrawn because its basis should no longer be relied upon.

Example:

> A previously cited source is discovered to be materially unreliable and the associated evidence is withdrawn.

### Rule

Retraction does not automatically equal invalidation.

A retracted source may cause dependent knowledge to become:

```text
stale
invalidated
under-review
```

depending on the actual dependency and evidence.

The Promotion Engine must preserve this distinction rather than collapsing all negative outcomes into one status.

---

# 34A.5 — Canonical Artifact Dependency Direction

Document 4 contains both forward dependency information and reverse impact information.

These are complementary, not competing sources of truth.

### Canonical dependency

The artifact declares what governed knowledge it depends on:

```text
ArtifactKnowledgeEntry
    ├── dependsOnFindingIds
    ├── dependsOnDecisionIds
    ├── dependsOnAssumptionIds
    ├── dependsOnConstraintIds
    └── ...
```

This is the canonical relationship.

It answers:

> **What knowledge governed this artifact?**

### Derived reverse impact

A knowledge item may expose or be indexed through:

```text
affectedArtifactIds
```

This answers:

> **Which artifacts may be affected if this knowledge changes?**

It is a derived reverse index.

### Required invariant

No implementation may treat both directions as independently mutable truth.

Conceptually:

```text
Artifact dependency
       ↓
Derived reverse index
       ↓
ArtifactImpactRecord
       ↓
Staleness propagation
```

If a reverse index becomes inconsistent, it must be reconstructable from canonical artifact dependency declarations.

---

# 34A.6 — ArtifactImpactRecord vs Lifecycle Dependency Graph

Two different dependency systems exist.

### Structural lifecycle dependency

Owned by Documents 2/3.

It answers:

> What artifact or execution step must exist before another artifact or step can proceed?

### Knowledge dependency

Owned by Document 4.

It answers:

> What product knowledge does this artifact rely on?

Example:

```text
Research Finding
      ↓
Decision
      ↓
PRD
```

The lifecycle graph determines execution/dependency order.

The PKS knowledge graph determines reasoning/knowledge impact.

They must not be merged into one overloaded dependency model.

### Correct flow

```text
Knowledge changes
       ↓
PKS resolves dependent artifacts
       ↓
ArtifactImpactRecord
       ↓
staleness assessment
       ↓
existing artifact dependency system
       ↓
downstream review / regeneration decisions
```

Document 4 does not replace Document 2/3 dependency semantics.

---

# 34A.7 — ContextManager Ownership Boundary

Document 3 owns the frozen external runtime contract.

Document 4 owns the PKS implementation behind that contract.

### Document 3 owns

- `ContextRequest`
- `ContextResponse`
- `AssembledContext` outer contract
- execution semantics
- runtime failure semantics
- context budget contract
- orchestration-facing expectations
- isolation ordering before PKS retrieval

### Document 4 owns

- memory ontology
- evidence ontology
- provenance
- temporal semantics
- scope-aware retrieval implementation
- ranking
- promotion
- contradiction handling
- context assembly internals
- PKS persistence
- PKS implementation of the ContextManager contract

### Hard boundary

Document 4 must not silently modify a frozen Document 3 interface.

If implementation requires an interface change:

```text
Document 3 change
      ↓
explicit versioned architectural decision
      ↓
Document 4 compatibility update
```

Never silently widen the ContextManager contract from inside Document 4.

---

# 34A.8 — Truthful Reasoning Lineage

The PM reasoning chain is valuable only if it is trustworthy.

The Promotion Engine must never manufacture lineage merely because two objects were:

- retrieved together;
- generated in the same stage;
- semantically similar;
- present in the same model response;
- mentioned near each other.

### Canonical principle

> **Co-occurrence is not lineage.**

A relationship is created only when there is an authoritative basis for the relationship.

For example:

```text
ResearchFinding.supportingEvidenceIds
```

can establish evidence → finding.

A structured Decision may explicitly reference:

```text
findingIds
assumptionIds
alternativeIds
```

which can establish reasoning relationships.

But if a finding and decision merely appear in the same context window, no relationship may be inferred solely from that fact.

This protects:

- decision lineage;
- reasoning inspection;
- artifact impact;
- stale propagation;
- future decision-quality evaluation.

---

# 34A.9 — Relationship Vocabulary Must Remain Semantically Controlled

The relationship vocabulary should remain small and interpretable.

Approved semantic relationships include:

```text
supports
informs
derives-from
depends-on
constrains
impacts
supersedes
```

If a future relationship is required, it must be introduced with:

1. a precise semantic definition;
2. source-of-truth ownership;
3. allowed source/target memory classes;
4. persistence semantics;
5. query semantics;
6. UI interpretation;
7. impact on staleness;
8. backward compatibility.

Do not create a new relationship merely because a visualization would be easier to draw with it.

The reasoning model must serve product reasoning first and visualization second.

---

# 34A.10 — Required vs Eligible vs Optional Promotion

Document 5 must distinguish three concepts.

### Required

The outcome contract requires a structured output when the relevant information exists.

### Eligible

An output may be promoted if it passes:

- schema validation;
- provenance requirements;
- scope validation;
- novelty checks;
- contradiction rules;
- confidence/evidence requirements;
- promotion governance.

### Optional

A capability may produce the information, but its absence does not constitute an execution failure.

### Critical PM principle

Not every stage creates new persistent knowledge.

A stage may:

- discover new knowledge;
- confirm existing knowledge;
- update an existing belief;
- produce an artifact without new persistent knowledge;
- determine that no decision is necessary;
- leave a question unresolved.

The PKS must represent reality rather than manufacture memory to satisfy a quota.

---

# 34A.11 — Evidence vs Research Evidence vs Memory

The word "evidence" must remain contextual.

### Evidence subsystem

Document 4's EvidenceItem represents **provenance-bearing support for a claim or finding**.

It is not itself the complete research artifact.

For example:

```text
Web source
   ↓
EvidenceItem
   ↓
ResearchFinding
   ↓
Implication
   ↓
Decision
```

The research artifact remains the PM-facing synthesis.

The EvidenceItem is the verification/provenance layer underneath it.

Therefore:

> **Evidence is not the research document. Evidence supports claims made within research and other product reasoning.**

This distinction must be preserved in Document 5 and in UI terminology.

---

# 34A.12 — Validation Log as an Artifact Presentation Layer

IdeaGate should support a **Validation Log** at the bottom of appropriate PM artifacts.

It is a verification layer, not a replacement for the artifact's reasoning.

### Appropriate artifacts

Highest-value examples include:

- Idea Intake / Discovery
- Problem Definition
- User Research / Research & Validate
- Competitive Analysis
- Solution Hypothesis
- Validation
- Prioritization
- Case Study
- Strategy / viability artifacts
- Architecture decisions where external technical claims are material
- Any artifact containing externally verifiable claims

### Not every artifact requires a Validation Log

Purely generated or internally derived artifacts may have:

```text
Validation Log: Not applicable
```

rather than an empty fabricated section.

### Recommended presentation

At the extreme bottom:

```text
────────────────────────────────────
VALIDATION LOG
────────────────────────────────────

Claim / Finding
Source
Source type
Working link
Retrieved / observed date
Evidence reference
Verification status
Notes
```

### Purpose

A PM can click a source and independently verify:

> **Where did this claim come from?**

This is distinct from PKS provenance.

PKS provenance answers:

> **How did IdeaGate obtain and use this information?**

The Validation Log answers:

> **Where can the human verify the underlying claim?**

Document 5 must define when structured artifact outputs should contain validation-log entries.

---

# 34A.13 — Artifact Representation Contract

The artifact is not merely Markdown.

IdeaGate's long-term artifact model is:

```text
Narrative
   +
Structured information
   +
Visual representation
   +
Validation / provenance layer
```

A single artifact may therefore have multiple synchronized representations.

### Canonical representation vocabulary

At minimum:

```text
MERMAID
USER_FLOW
INFORMATION_ARCHITECTURE
SYSTEM_ARCHITECTURE
PROCESS_FLOW
SEQUENCE_DIAGRAM
STATE_DIAGRAM
DECISION_TREE
DECISION_MATRIX
DEPENDENCY_GRAPH
JOURNEY_MAP
ERD
OST
SERVICE_BLUEPRINT
WIREFRAME
ROADMAP
```

Mermaid is particularly important because it provides a structured, reproducible representation rather than a static screenshot.

### Principle

> **One underlying PM artifact, multiple representations.**

A visual representation must remain traceable to the artifact information from which it was derived.

---

# 34A.14 — Artifact Improvement Is Not Decoration

Studio's future artifact-improvement system must treat visualization as structured transformation.

The conceptual flow is:

```text
SELECT
   ↓
IMPROVE
   ↓
STRUCTURE
   ↓
VISUALIZE
   ↓
EDIT
   ↓
REGENERATE
   ↓
SAVE VERSION
```

Examples:

### Research section

Possible representations:

```text
Journey Map
Evidence Map
User Flow
Decision Matrix
```

### Navigation/product structure

Possible representations:

```text
Information Architecture
User Flow
Service Blueprint
```

### Technical architecture

Possible representations:

```text
System Architecture
Sequence Diagram
ERD
Dependency Graph
```

### Decision section

Possible representations:

```text
Decision Matrix
Decision Tree
Trade-off Map
```

### Agent orchestration section

Possible representations:

```text
Orchestration Graph
Sequence Diagram
Process Flow
State Diagram
```

The system should eventually infer suitable representations from artifact semantics rather than forcing users to manually choose from a long diagram menu.

---

# 34A.15 — Visual Artifacts Must Remain Structurally Connected

Visual objects must not become disconnected screenshots.

For example:

```text
PRD
 │
 ├── narrative
 ├── structured requirements
 ├── user flow
 ├── sequence diagram
 └── validation log
```

The user may edit the visual representation, but the system must preserve:

- artifactId;
- artifactVersion;
- representationId;
- derivedFromHash;
- source section / structured object;
- creation method;
- modification origin;
- staleness state.

If the underlying narrative changes materially:

```text
source artifact changes
       ↓
representation becomes potentially stale
       ↓
user sees why
       ↓
regenerate / reconcile
```

This is the foundation for a serious PM workspace rather than a Markdown editor with decorative diagrams.

---

# 34A.16 — Human Annotation Boundary

`PKSAnnotation` is intentionally different from governed knowledge.

Human annotations may contain:

- comments;
- questions;
- review notes;
- reminders;
- disagreement;
- proposed changes.

They must not automatically enter model context.

Correct model:

```text
Governed Knowledge
       │
       ├── retrieved for agents
       │
Human Annotation
       │
       └── visible to humans by default
```

An annotation can become governed knowledge only through an explicit promotion path that satisfies the same governance requirements as other knowledge.

This prevents collaborative notes from contaminating agent context.

---

# 34A.17 — Multi-User and Project Isolation

The PKS must preserve these scopes:

```text
project scope
run scope
agent/capability scope
human annotation scope
```

### Project

Shared governed product knowledge.

### Run

Temporary evidence and working knowledge associated with a specific execution.

### Agent/capability

Only the knowledge appropriate to the assigned task.

### Human annotation

Human-layer collaboration, not automatically model-visible.

Cross-project retrieval is prohibited unless a future explicitly governed sharing mechanism is introduced.

A future enterprise knowledge-sharing layer must never be achieved by weakening project isolation.

---

# 34A.18 — Memory Write Authority

The authority hierarchy remains:

```text
Model
  ✕ cannot directly write governed memory

Sub-agent
  ✕ cannot directly promote governed memory

Capability
  → produces structured evidence/artifact output

Engine
  → triggers capture at controlled execution points

Promotion Engine
  → validates, deduplicates, links, and promotes

PKS
  → persists governed knowledge
```

The model may propose:

```text
candidate finding
candidate assumption
candidate decision
```

but deterministic governance decides whether it becomes persistent project knowledge.

This remains one of IdeaGate's strongest differentiators.

---

# 34A.19 — Memory Promotion Must Be Novelty-Aware

The PKS should not become a transcript database.

If a new run discovers information materially equivalent to existing active knowledge:

```text
new observation
      ↓
novelty check
      ↓
existing knowledge still valid?
      ├── yes → record provenance / confirmation as appropriate
      └── no  → update / supersede / create contradiction
```

Do not create duplicate knowledge simply because a new run generated a differently worded version.

Novelty is a governance decision, not a similarity-only decision.

---

# 34A.20 — Temporal Semantics Must Remain Bitemporal

For time-sensitive product intelligence, distinguish:

```text
eventTime
```

When the underlying fact was true.

```text
observedAt
```

When IdeaGate learned it.

Where applicable:

```text
sourcePublishedAt
validFrom
validUntil
```

Example:

> A competitor changed pricing on June 1, but IdeaGate discovered the change on June 5.

Those are different facts and must not collapse into one timestamp.

This is especially important for:

- competitor monitoring;
- market research;
- product launches;
- policy changes;
- pricing;
- feature tracking;
- continuous research loops.

---

# 34A.21 — Retrieval Quality Must Be Observable

The PKS must eventually be able to answer:

> **Did the right context reach the right agent?**

`ContextAssemblyTrace` therefore remains a first-class architectural commitment.

At minimum it should make it possible to inspect:

```text
what was retrieved
why it was retrieved
what was excluded
why it was excluded
what was ranked highly
what was truncated
what was contradicted
what was stale
what budget tier it occupied
which agent/capability received it
```

This is not merely debugging telemetry.

It is the foundation for:

- Retrieval Inspector;
- Mission Control observability;
- context-quality evaluation;
- memory-quality improvement;
- future retrieval optimization.

---

# 34A.22 — Document 5 Must Define the Outcome-to-Knowledge Contract

Document 5 must not redesign the PKS.

It must operationalize it.

### Document 5 MUST NOT redesign

1. Seven memory classes.
2. Evidence ontology.
3. ContextManager external contract.
4. Document 3 frozen schemas.
5. Scope/isolation model.
6. Retrieval pipeline.
7. Ranking formula.
8. Authority model.
9. Temporal model.
10. Promotion timing.
11. PKSInspectionAPI.
12. ArtifactImpactRecord.
13. Implication semantics.
14. Provenance boundary.

### Document 5 MUST define

1. Lifecycle-step → memory-production mapping.
2. Outcome → memory-production mapping.
3. Capability → required knowledge-context mapping.
4. Structured generation output schemas.
5. Structured evaluation output schemas.
6. Evidence-reference population rules.
7. Reasoning relationship population rules.
8. Required vs eligible vs optional promotion.
9. Novelty handling.
10. Contradiction handling at extraction/promotion.
11. Artifact dependency extraction.
12. ArtifactImpactRecord population.
13. OST extraction rules.
14. ERD extraction rules.
15. Validation Log generation rules.
16. Visual representation metadata where structured outputs are produced.
17. Handling when no new persistent knowledge is created.
18. Rules preventing unsupported lineage.

---

# 34A.23 — Document 5 Must Define Knowledge Production Per Real PM Outcome

The outcome model must remain user-oriented.

Examples:

### Research

```text
Input
→ question + product context + sources

Execution
→ research-first + parallel workers + evaluation + optional loop

Knowledge
→ evidence
→ findings
→ implications
→ assumptions

Artifacts
→ research synthesis
→ evidence-backed findings
→ validation log
→ optional journey / competitor / evidence visualizations
```

### Case Study

```text
Input
→ product/problem + available project evidence

Execution
→ structured analysis + strategy reasoning

Knowledge
→ decisions
→ findings
→ assumptions
→ outcomes

Artifacts
→ case study
→ decision narrative
→ impact/evidence chain
→ validation log
```

### Prioritize

```text
Input
→ opportunities/features + constraints + evidence

Execution
→ strategy + quality evaluation

Knowledge
→ decision
→ constraints
→ assumptions

Artifacts
→ prioritization matrix
→ decision rationale
→ dependency/impact view
```

### Decide / Debate / Council

```text
Input
→ explicit decision question + context

Execution
→ debate/council as justified by the request

Knowledge
→ alternatives
→ evidence
→ dissent
→ decision
→ rationale

Artifacts
→ decision record
→ decision matrix
→ reasoning chain
```

### Continuous Research

```text
Goal
→ "Track competitor X's pricing/features"

Loop
→ retrieve → investigate → evaluate → compare → accumulate

Termination
→ goal met OR deterministic bounds

Persistent result
→ governed knowledge only after promotion rules
```

The exact schemas belong in Document 5.

---

# 34A.24 — Validation Log Contract for Document 5

Document 5 must specify that a Validation Log is **conditional**, not universal decoration.

For artifacts containing externally verifiable claims, the output contract should support:

```text
ValidationLogEntry {
  claimId
  claim
  sourceTitle
  sourceType
  url
  observedAt
  evidenceId
  verificationStatus
  notes
}
```

The system must distinguish:

```text
verified
partially-verified
unverified
contradicted
not-applicable
```

A broken URL must not be presented as verified.

Where links are available, they should be retained as clickable working references.

This is a human verification layer and must remain distinct from internal provenance metadata.

---

# 34A.25 — Artifact Improvement Vocabulary to Preserve

The following visualization/representation types are now part of the intended IdeaGate artifact direction.

## Core / Immediate

1. Mermaid
2. User Flow
3. Information Architecture
4. System Architecture
5. Process / Lifecycle Flow
6. Sequence Diagram
7. Decision Matrix
8. Dependency Graph
9. Journey Map
10. State Diagram
11. Decision Tree
12. ERD

## Strategic PM representations

13. Opportunity Solution Tree
14. Assumption Map
15. Service Blueprint
16. Roadmap / Timeline
17. Wireframe / UI Flow

## Future collaborative representation

18. Real-time collaborative PM workspace
19. Collaborative notation
20. Visual artifact editing
21. Interactive node/graph editing
22. Freeform canvas

These are not all required to be implemented in the PKS itself.

The PKS must preserve the **data and lineage seams** needed for them.

Rendering and collaborative interaction remain UI/Studio responsibilities.

---

# 34A.26 — Premium Product-Sense Guardrails

The architecture must remain useful to a working PM, not merely impressive to an engineer.

Every new subsystem or capability should answer:

1. What real PM problem does this solve?
2. Who uses it?
3. What decision/work does it improve?
4. What information does it require?
5. What artifact does it improve?
6. How does the user know it is trustworthy?
7. What happens when the evidence is insufficient?
8. What happens when sources disagree?
9. What happens when information becomes stale?
10. What is the smallest useful implementation?

Do not add:

- agents because "agent swarms" are fashionable;
- memory because "memory" is fashionable;
- graphs because graphs look advanced;
- embeddings because vector search is popular;
- diagrams because visual output looks premium.

The architecture should make the system **more useful**, not merely more technically elaborate.

---

# 34A.27 — Mid-2026 Technology Position

IdeaGate should adopt current industry principles without becoming dependent on fashionable infrastructure.

Useful principles include:

```text
multi-signal retrieval
bitemporal knowledge
provenance-first systems
structured agent context
bounded loops
evaluation-driven execution
agent/sub-agent delegation where justified
human inspection
replayability
deterministic orchestration
```

Potential future implementation technologies may include:

```text
embeddings
graph traversal
knowledge graphs
specialized memory frameworks
```

but none is mandatory for the V1 local-first PKS.

The current architecture should therefore preserve seams for:

```text
keyword retrieval
+
structural retrieval
+
optional semantic retrieval
+
future graph traversal
```

without making any of them a prerequisite for the initial implementation.

---

# 34A.28 — Agent/Sub-Agent Boundary

Document 4 must support the orchestration model established by Documents 1–3 without assuming that every outcome uses every agent.

The PKS is context-aware, not agent-count-driven.

Example:

```text
Research
RE
 ├── competitor sub-agent
 ├── customer sub-agent
 ├── market sub-agent
 └── evidence verifier

Council
PS
RE
AR
QA
 └── bounded specialist workers where justified

Prioritize
PS
QA
```

Sub-agents may produce evidence or structured findings, but governed memory promotion remains centralized.

This preserves:

```text
many workers
      ↓
controlled parent capability
      ↓
structured output
      ↓
Promotion Engine
      ↓
governed PKS
```

No sub-agent swarm gets unrestricted memory-write authority.

---

# 34A.29 — Goal-Based Loop and PKS Interaction

Continuous/loop execution must remain separate from persistent-memory promotion.

Within a run:

```text
Iteration 1
  ↓
run-scoped evidence
  ↓
Iteration 2 retrieves it
  ↓
new evidence
  ↓
Iteration 3
```

At run completion:

```text
run evidence
      ↓
evaluation
      ↓
promotion eligibility
      ↓
project knowledge
```

The loop must not directly bypass promotion governance.

A continuous research mission therefore accumulates evidence during execution but earns persistent memory through the same deterministic governance rules as a one-shot mission.

---

# 34A.30 — Failure and Fallback Principle

PKS failure handling must preserve the Document 3 distinction between:

- runtime failure;
- context/retrieval failure;
- budget exhaustion;
- cancellation;
- data-integrity failure.

Safe degradation may be allowed for:

```text
optional retrieval unavailable
optional enrichment unavailable
semantic retrieval unavailable
non-critical visualization derivation unavailable
```

Fail closed for:

```text
cross-project contamination
scope violation
provenance corruption
impossible context contract
memory poisoning
integrity failure
```

The model must never receive silently degraded context when the degradation could materially alter a governed decision without being disclosed.

---

# 34A.31 — Canonical Artifact-Type Governance

`ArtifactType` remains extensible.

Mentioning a future artifact does not automatically make it canonical.

A new artifact type becomes canonical only after its owning specification defines:

- stable artifact ID;
- schema;
- lifecycle ownership;
- output representation;
- dependency semantics;
- persistence;
- versioning;
- validation requirements;
- stale/impact behavior;
- UI representation where applicable.

Computed views such as:

```text
decision history
evidence browser
knowledge timeline
reasoning chain
```

should remain views unless there is a deliberate product decision to make them persisted artifacts.

This prevents accidental second sources of truth.

---

# 34A.32 — Human Edit / Provenance Seam

Future Studio editing must distinguish:

```text
AI-generated
AI-improved
Human-edited
Human-authored
System-derived
```

This is provenance metadata, not a new memory class.

If a human changes an artifact:

```text
artifact version changes
      ↓
change origin recorded
      ↓
knowledge re-indexed where necessary
      ↓
affected representations evaluated for staleness
```

The PKS must not assume that every artifact modification came from an agent.

This seam is essential for the future collaborative PM workspace.

---

# 34A.33 — Final Architectural Invariants Added by This Addendum

The following rules are binding for Document 5 and implementation.

**Invariant 41 — Co-occurrence is not lineage.**

**Invariant 42 — Reverse artifact impact indexes are derived, not independently authoritative.**

**Invariant 43 — Lifecycle stage count is canonical: 15 executable steps, 14 substantive PM stages.**

**Invariant 44 — Governance states and computed freshness/contradiction conditions are distinct.**

**Invariant 45 — `invalidated` and `retracted` are semantically distinct.**

**Invariant 46 — Document 4 may implement the Document 3 ContextManager contract but may not silently redefine it.**

**Invariant 47 — Required, eligible, and optional knowledge promotion are distinct concepts.**

**Invariant 48 — Human annotations do not enter model context automatically.**

**Invariant 49 — Validation Log is a human verification layer, not a replacement for PKS provenance.**

**Invariant 50 — Visual representations are representations of artifacts, not independent knowledge sources.**

**Invariant 51 — New artifact types require an owning artifact contract before becoming canonical.**

**Invariant 52 — Persistent knowledge promotion is deterministic and cannot be directly performed by the model or unrestricted sub-agent.**

---

# 34A.34 — Document 5 Acceptance Checklist

Before Document 5 is considered complete, it must demonstrate:

```text
□ Every lifecycle step has an explicit knowledge-production contract.
□ Every major outcome has an explicit knowledge-production contract.
□ Every capability has defined context requirements.
□ Structured generation outputs are defined.
□ Structured evaluation outputs are defined.
□ Evidence references are structured.
□ Reasoning relationships are structured and justified.
□ Unsupported lineage cannot be created.
□ Required / eligible / optional promotion is explicit.
□ Novelty handling is explicit.
□ Contradiction handling is explicit.
□ Artifact dependency extraction is explicit.
□ ArtifactImpactRecord extraction is explicit.
□ OST extraction is explicit.
□ ERD extraction is explicit.
□ Validation Log generation is explicit.
□ Artifacts with no new persistent knowledge are valid.
□ Human annotations remain separate from governed knowledge.
□ Loop iterations reuse run-scoped evidence correctly.
□ Project promotion occurs only through governance.
□ Visual representation metadata has a stable artifact relationship.
□ Human edits preserve provenance/change origin.
□ No new memory class is introduced.
□ No frozen Document 3 contract is silently modified.
```

---

# 34A.35 — Final Product-Sense Test

Before freezing Document 4 and proceeding, IdeaGate should be able to answer the following for any important product claim:

```text
WHAT
What is being claimed?

WHY
Why does IdeaGate believe it?

EVIDENCE
What supports it?

SOURCE
Where can the human verify it?

WHEN
When was it true and when did IdeaGate learn it?

AUTHORITY
How authoritative is it for this product?

CONFIDENCE
How certain is IdeaGate?

CONTRADICTION
Does anything disagree?

FRESHNESS
Is it still current?

LINEAGE
What finding / implication / assumption / decision produced it?

IMPACT
Which artifacts depend on it?

CONTEXT
Which agents received it, and why?

PROMOTION
Why was it allowed into persistent project knowledge?

VALIDATION
Can a PM independently verify the claim?

REPRESENTATION
Can the reasoning be understood through the appropriate artifact visualization?
```

If the system cannot answer these questions, the PKS is not yet functioning as the product-intelligence layer envisioned for IdeaGate.

---

# 34A.36 — Final Freeze Decision

After this addendum:

> **Document 4 v1.2 remains the authoritative PKS specification. This Part 34A is its final surgical clarification layer.**

No further conceptual expansion should occur while Document 5 is being authored unless a genuine cross-document contradiction is discovered.

The next document must focus on:

> **Outcome Engineering Contracts — how each IdeaGate outcome and lifecycle execution produces structured PM artifacts, evidence, decisions, assumptions, constraints, reasoning relationships, validation logs, and knowledge eligible for promotion.**

Document 5 must consume this architecture.

It must not redesign it.

---

# 34A.37 — Document 5 Handoff: Exact Questions It Must Answer

For every outcome, Document 5 must make it possible to answer:

```text
1. What is the user's job?

2. What inputs are required?

3. What context is required?

4. Which capabilities are invoked?

5. Which sub-agents are justified?

6. Which orchestration primitive is used?

7. What intermediate outputs exist?

8. What final artifacts are produced?

9. What structured knowledge is extracted?

10. What evidence supports it?

11. Which reasoning relationships are created?

12. What is evaluated?

13. What causes revision?

14. What can loop?

15. What terminates the loop?

16. What is persisted?

17. What is promoted?

18. What remains run-scoped?

19. What enters the Validation Log?

20. What visual representations can be generated?

21. What becomes stale if knowledge changes?

22. What does the user see?

23. What does Mission Control observe?

24. What is the Definition of Done?
```

These questions form the minimum engineering/product contract for every major outcome.

---

# 34A.38 — Scope Boundary

This addendum deliberately does **not** specify:

- implementation code;
- storage migrations;
- UI layouts;
- model providers;
- exact agent prompts;
- exact retrieval algorithms beyond the already-frozen v1.2 contract;
- graph database implementation;
- embeddings implementation;
- external memory frameworks;
- collaborative backend;
- enterprise permissions;
- autonomous memory agents.

Those belong to the appropriate later specifications.

The goal is to make the architecture **implementation-ready without prematurely implementing future layers**.

---

# 34A.39 — Final Principle

The entire Document 4 architecture should be judged against one sentence:

> **IdeaGate should remember what matters, prove why it matters, retrieve only what is relevant, know when it may no longer be true, show what changed, preserve how decisions were reached, and never pretend certainty or lineage that the evidence does not support.**

That is the Product Knowledge System.

Not "AI memory."

Not RAG.

Not a vector database.

A governed product intelligence substrate.

---

# 34A.40 — Version / Change Record

| Version | Status | Purpose |
|---|---|---|
| Document 4 v1.0 | Superseded | Pre-specification architecture |
| Document 4 v1.1 | Superseded | Hardened context/memory/evidence foundation |
| Document 4 v1.2 | **Authoritative** | PM reasoning, lineage, impact, inspection, artifact support |
| **Part 34A** | **Final surgical clarification** | Ownership, terminology, lineage, promotion, validation, representation, artifact governance, Document 5 contract |

**Final status: DOCUMENT 4 v1.2 + PART 34A = READY TO FREEZE AND PROCEED TO DOCUMENT 5.**

---

**PART 34A — ONE AFTER ONE**

This is the complete first-and-only addendum intended to be pasted directly below the existing Part 34.


---

*IdeaGate — Context + Memory + Evidence: Product Knowledge System*
*Document 4 of 7 | Version 1.1 — Authoritative*
*Status: FROZEN — READY FOR DOCUMENT 5*
*Depends on: Document 1, Document 2 (FROZEN), Document 3 (FROZEN)*
*Feeds: Document 5 — Outcome Engineering Contracts*

*v1.1 hardening (preserved exactly): P0-1 through P0-5, P1-1 through P1-7*
*v1.2 additions: PM reasoning chain (Part 35) / Dual PKS consumers (Part 36) /*
*Knowledge status lifecycle (Part 37) / V3-V4 artifact support (Part 38) /*
*UI dimension separation (Part 39) / Stale propagation (§21.4–21.6) /*
*Real-time evidence visibility (§22.4) / ArtifactImpactRecord / Implication records /*
*PKS Inspection API / Annotations / OST + ERD support / 30 invariants / 28 ACs*
