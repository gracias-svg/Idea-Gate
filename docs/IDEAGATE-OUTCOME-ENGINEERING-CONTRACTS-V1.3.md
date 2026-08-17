# IDEAGATE — OUTCOME ENGINEERING CONTRACTS
## Document 5 of 7 | Version 1.3 — Authoritative
## Status: Specification — Pre-Implementation

**Supersedes:** Document 5 v1.0
**Amendment:** v1.2 hardening — Validation Log single-source-of-truth; orchestration recipe canonical names; OST/ERD semantic contracts; visual derivation seam; artifact-layer model; Review zero-gap fix; Part 32 non-authoritative; complete-contract boundary

**Depends on:**
- Document 1 — Mission Composer V1 Product & Engineering Specification (FROZEN)
- Document 2 — Strategy Router + ExecutionPlan Specification V1.1 (FROZEN)
- Document 3 — Orchestration Engine + Agent Harness Specification (FROZEN)
- Document 4 — Context + Memory + Evidence / Product Knowledge System V1.2 Hardened (FROZEN)

**Feeds:** Document 6 — Mission Composer UX Specification

**Governing principle:**
> IdeaGate is a Product Operating System. AI generates and explains.
> Deterministic rules govern execution, evaluation, and promotion.
> Every outcome exists to solve a real PM job — not to demonstrate AI capabilities.

---

# PART 1 — PURPOSE AND SCOPE

## 1.1 What Document 5 Is

Document 5 translates the IdeaGate architecture into complete engineering and product
contracts for every user-facing outcome. For each outcome it answers:

- What PM job does this solve?
- What does IdeaGate do behind the scenes, in what order?
- Which capabilities are invoked and why; which are explicitly rejected and why?
- What orchestration primitive governs execution?
- What context does each capability receive?
- How is work evaluated, revised, and optionally looped?
- What artifacts are produced and what is their structure?
- What evidence and knowledge are extracted and persisted?
- What visual representations are generated and how are they connected?
- What Validation Logs are required?
- What happens when things go wrong?

## 1.2 What Document 5 Does NOT Do

- Redesign Documents 1–4 or any frozen contract
- Write implementation code
- Define UI copy or interaction design (that is Document 6)
- Create new memory classes or retrieval mechanisms
- Create new execution semantics
- Expand the capability roster beyond CO, PS, RE, UX, AR, QA
- Claim current implementation for capabilities not yet built
- Embed implementation phase/timing labels in outcome contracts (see Part 32 for all implementation status)

## 1.3 Complete-Contract Boundary

Document 5 is "complete" at the **semantic/product-contract level**, not the implementation-schema level.

| Document 5 defines (authoritatively) | Document 7 defines (implementation) |
|---|---|
| What each outcome must produce | Extraction schemas, structured output types |
| Which capabilities are selected and why | Model-specific prompt templates |
| Which orchestration recipe governs | Infrastructure/scheduler implementation |
| What semantic meaning OST/ERD must carry | Rendering engine, node schema, persistence format |
| What knowledge is produced and its class | Extraction trigger patterns, promotion pipeline |
| How visual representations derive from structured data | Rendering library, file format, collaboration protocol |
| What goes in the Validation Log | Automated claim-detection implementation |

Gaps that belong to Document 7 are explicitly marked with a → handoff note. They are not silent omissions.

## 1.3 Canonical Outcome IDs

```typescript
type OutcomeId =
  | 'build'           // Full product lifecycle — all 15 stages
  | 'casestudy'       // Document a product decision or experience as a learning artifact
  | 'research'        // Market, competitive, user, or domain intelligence
  | 'review'          // Critique and improve an existing artifact
  | 'decide'          // Frame and resolve a product decision
  | 'council'         // Multi-perspective deliberation on a complex question
  | 'investigate'     // Diagnose and explain a product problem from evidence
  | 'prioritize'      // Rank and sequence a set of items against criteria
  | 'plan';           // Decompose approved work into delivery structure
```

Three execution variants are built on these base OutcomeIds:
- **Debate / Red Team–Blue Team**: `outcomeId: 'decide'` + `orchestrationOverride: 'debate'` (internal recipe: `red-blue-debate`)
- **Research & Validate**: `outcomeId: 'research'` + explicit validation step in EvaluationPolicy
- **Continuous / Goal-Based Research**: `outcomeId: 'research'` + `ValidatedGoalSpec` + `loopPolicy`

---

# PART 2 — OUTCOME CONTRACT SCHEMA

Every outcome is governed by a complete contract. This schema is the canonical template.

```typescript
interface OutcomeContract {
  outcomeId: OutcomeId;
  humanFacingName: string;
  pmJob: string;                       // The PM job this outcome solves
  whenToUse: string[];
  notSuitableFor: string[];

  // Inputs
  requiredInputs: InputSpec[];
  optionalInputs: InputSpec[];
  contextSignals: string[];            // what the Router reads from context to make decisions

  // Router decisions
  artifactContract: ArtifactContract;  // from Document 2 §4
  selectedCapabilities: CapabilityId[];
  rejectedCapabilities: CapabilityRationale[];
  capabilityInstances: CapabilityInstance[];
  subAgentPolicy?: SubAgentPolicy;

  // Execution
  orchestrationRecipe: OrchestrationRecipeId;
  depthInteraction: DepthInteraction;

  // Memory + Evidence
  memoryContract: OutcomeMemoryContract;

  // Evaluation
  evaluationPolicy: EvaluationPolicy;  // from Document 2 §10

  // Revision
  maxRevisions: number;                // from DepthPolicy

  // Loop (if eligible)
  loopPolicy?: LoopPolicy;

  // Outputs
  artifacts: ArtifactSpec[];
  knowledgeProduction: KnowledgeProductionSpec;
  validationLog: ValidationLogSpec;
  visualRepresentations: RepresentationSpec[];

  // Persistence
  persistence: PersistenceSpec;

  // Failure modes
  failureModes: FailureMode[];

  // Definition of Done
  definitionOfDone: string[];
}
```

---

# PART 3 — ARTIFACT CONTRACT AND STRUCTURE

## 3.1 Artifact Structure Principle

Every IdeaGate artifact has three layers. Not every layer is generated in every outcome;
depth and context determine which layers are active:

```
LAYER 1: NARRATIVE
  Professional prose: context, analysis, reasoning, recommendation.
  Default representation for most artifacts in Document 5.
  Required to remain human-readable; may be supplementary for structured-first
  artifacts (OST, ERD — see §3.4).
  Representation mode is determined by the artifact contract; Document 5 defines
  the contract; the rendering mode may evolve in Document 7.

LAYER 2: STRUCTURED INFORMATION
  Machine-readable content derived from (or primary for) the artifact:
  scores, rankings, matrices, decision trees, hypothesis lists, dependency maps,
  entity/relationship graphs, opportunity-solution-experiment trees.
  Generated when structured output schema is defined for the step.
  For OST/ERD: Layer 2 IS the primary semantic layer; narrative is supplementary.

LAYER 3: VISUAL REPRESENTATIONS
  Derived from Layer 2 structured data.
  Cannot exist without Layer 2 — visual meaning must derive from structured meaning.
  Are re-generated when Layer 2 content changes (derivedFromHash comparison).
  Carry a derivedFromHash and regeneration policy.
  Human edits to a visual representation must be reflected back into Layer 2
  to preserve semantic coherence; edits that only affect presentation do not.
```

**Core invariant (visual derivation):** A visual representation is a view of
the underlying structured artifact. It is not an independent document. It carries:
- `artifactId`: same as the parent artifact (stable)
- `representationId`: unique per representation type per artifact
- `derivedFromHash`: hash of the Layer 2 content that produced this representation
- `version`: increments when the representation is regenerated
- `stalenessStatus`: 'current' | 'potentially-stale' | 'stale' (mirroring ArtifactImpactRecord)

When a human edits a visual representation's structural meaning (e.g., adds an
OST node, modifies an ERD relationship), the edit creates a new artifact version
with `changeOrigin: 'human-authored'` and triggers Layer 2 re-indexing and
downstream stale evaluation.

## 3.2 Artifact Spec Schema

```typescript
interface ArtifactSpec {
  artifactId: string;         // stable; never changes across versions
  title: string;              // human-facing name
  pmPurpose: string;          // what PM decision or communication this enables
  required: boolean;
  primaryCapability: CapabilityId;
  outputType: 'narrative' | 'structured' | 'visual';
  wordCountGuidance: Record<DepthLevel, string>;  // e.g. {quick:'300–500', balanced:'600–900'}
  sections: SectionSpec[];
  validationLogRequired: boolean;
  knowledgeProductionHints: KnowledgeProductionHint[];
}

interface SectionSpec {
  sectionId: string;
  heading: string;
  purpose: string;
  required: boolean;
  evidenceRequired: boolean;   // true if this section must cite evidence
  extractionHint: string;      // what the Promotion Engine looks for here
}

interface KnowledgeProductionHint {
  memoryClass: MemoryClass;
  triggerPattern: string;   // what linguistic signal indicates this class is present
  relationshipFields: string[];  // which relationship fields to populate
  authorityLevel: 'user-stated' | 'explicitly-governed' | 'research-discovered' | 'model-inferred';
}
```

## 3.3 Visual Representation Registry

```typescript
interface RepresentationSpec {
  representationType: RepresentationType;
  derivedFromArtifactSection: string;    // sectionId that feeds this
  derivedFromStructuredField?: string;   // specific structured data field
  requiresStructuredLayer: boolean;
  regenerationTrigger: 'on-artifact-change' | 'on-demand' | 'auto';
  tool: 'mermaid' | 'recharts' | 'ideagate-native' | 'future';

  // Stable identity (always present on a representation)
  // artifactId: same as parent artifact (inherited — not duplicated here)
  representationId: string;              // stable UUID; unique per representation type per artifact
  derivedFromHash: string;              // hash of the Layer 2 content; changes trigger re-generation
  version: number;                       // increments on regeneration
  stalenessStatus: 'current' | 'potentially-stale' | 'stale';
  // changeOrigin mirrors the parent artifact's provenance.changeOrigin (Document 4 §38.5)
}

// Collaborative editing seam (future):
// Visual representations in a future collaborative PM workspace may be edited
// by multiple users simultaneously. The identity/versioning model above is
// compatible with future CRDT or OT protocols.
// Document 7 defines the collaboration protocol; Document 5 preserves the seam.

## 3.4 OST and ERD — Structured-First Artifact Semantic Contracts

### OST (Opportunity Solution Tree)

**Semantic contract** — what an OST must represent:
```
OUTCOME
  (the desired business or user result the product is pursuing)
  └── OPPORTUNITY
        (an unmet user need or problem discovered through research)
        └── SOLUTION
              (a hypothesized approach to address the opportunity)
              └── EXPERIMENT
                    (a bounded test to validate the solution)
```

**Lineage and reasoning chain — when authoritatively established:**

OST lineage follows the same when-traceable principle as all PKS relationship
fields (§5.2). IdeaGate must never manufacture a ResearchFinding or EvidenceItem
merely to satisfy an Opportunity reference. The PM Reasoning Graph must reflect
reality, not graph-completeness.

- Each **Opportunity** SHOULD reference `supportingEvidenceIds` and `findingIds`
  when those relationships are authoritatively established from research work
  conducted in this or a prior run. If no supporting evidence or finding exists,
  the Opportunity is still valid — but its epistemic status (no grounding evidence)
  must be surfaced in the OST node and in any staleness/confidence assessment.
- Each **Solution** MAY reference `acceptedAssumptionIds` when the solution was
  explicitly designed around specific, identified assumptions.
- Each **Experiment** MAY reference a `decisionId` when the prioritization choice
  is recorded as a Decision in the PKS.
- The OST itself is an `ArtifactType: 'ost'` with stable `artifactId` and `version`.
- Absent evidence linkage: Opportunities without EvidenceItem references are
  hypothesis-grade, not evidence-grounded. The OST must represent this distinction —
  not paper over it.

**Stale propagation:** When a ResearchFinding that supports an Opportunity is
contradicted, the affected Opportunity nodes become `potentially-stale`. When an
Assumption that underpins a Solution is invalidated, the Solution becomes `stale`.

**Primary layer:** OST is structured-first (Layer 2 primary). Narrative is supplementary —
it may describe the strategic context, but the OST's meaning lives in the node hierarchy.

**→ Document 7** defines: the node schema, renderer, storage format, collaborative editing protocol.

---

### ERD (Entity-Relationship Diagram)

**Semantic contract** — what an ERD must represent:
- **Entities**: bounded data objects relevant to the product's domain, named and defined
- **Relationships**: typed connections between entities with named roles and cardinalities
- **Constraints**: data integrity rules governing entities and relationships
- **Architecture connection**: each entity or relationship that was shaped by an architecture
  Decision should reference that `decisionId` in the structured layer

**Lineage and reasoning chain:**
- Entities derive from domain analysis (architecture/solution design decisions)
- Significant design choices for entities/relationships should reference `decisionId`
  values in the structured Layer 2 so that superseding an architecture decision
  propagates staleness to the ERD
- The ERD is an `ArtifactType: 'erd'` with stable `artifactId` and `version`

**Stale propagation:** When architecture Decisions governing the ERD's entities are
superseded, the ERD `ArtifactImpactRecord.stalenessStatus` becomes `potentially-stale`
or `stale` depending on materiality.

**Primary layer:** ERD is structured-first (Layer 2 primary). Narrative describes
design rationale; the ERD's meaning lives in the entity-relationship graph.

**→ Document 7** defines: the entity/relationship schema, Mermaid class-diagram mapping,
rendering details, and persistent storage format.

---

type RepresentationType =
  // Currently supportable (Mermaid-based)
  | 'flowchart'            // Process or decision flow
  | 'sequence-diagram'     // System or agent interaction sequence
  | 'state-diagram'        // State machine
  | 'class-diagram'        // ERD / entity relationships
  | 'gantt'                // Roadmap / timeline
  | 'quadrant-chart'       // 2×2 priority matrix
  // Recharts-based
  | 'ranking-table'        // Prioritized list with scores
  | 'scoring-breakdown'    // Multi-criteria scoring visualization
  // IdeaGate-native (Phase 2)
  | 'user-flow'            // Visual user journey
  | 'ost'                  // Opportunity Solution Tree
  | 'assumption-map'       // Visual assumption register
  | 'journey-map'          // Customer journey map
  | 'decision-matrix'      // Multi-option decision comparison
  // Future
  | 'service-blueprint'    // Service design blueprint
  | 'system-architecture'  // Visual system architecture
  | 'evidence-map'         // Evidence network visualization
  | 'dependency-graph';    // Artifact or feature dependency visualization
```

---

# PART 4 — VALIDATION LOG CONTRACT

## 4.1 What the Validation Log Is

The Validation Log is an artifact appendix that lists externally verifiable claims
with their sources, enabling the PM to independently verify IdeaGate's assertions.

**Validation Log ≠ PKS Provenance.**

| | PKS Provenance | Validation Log |
|---|---|---|
| Answers | How did IdeaGate obtain, use, and govern this information? | Where can the PM independently verify this claim? |
| Audience | The system (retrieval, evaluation, lineage) | The PM (human verification) |
| Format | Structured ProvenanceRecord | Human-readable table in artifact appendix |
| Updates | Automatic (system-maintained) | Generated at artifact production time |

## 4.2 Validation Log Schema

```typescript
interface ValidationLogEntry {
  entryId: string;
  claimText: string;          // the specific claim made in the artifact
  claimLocation: string;      // section and paragraph reference
  sourceDescription: string;  // human-readable source name
  sourceType: 'web-url' | 'uploaded-document' | 'tool-result'
             | 'user-stated' | 'model-inferred' | 'prior-run-artifact';
  workingUrl?: string;        // URL for web sources
  evidenceId?: string;        // PKS EvidenceItem.evidenceId if captured
  observedAt?: string;        // when IdeaGate found this
  publishedAt?: string;       // when the source published this
  verificationStatus: ValidationStatus;
  verificationNotes?: string;
}

type ValidationStatus =
  | 'verified'           // PM can confirm this from the cited source
  | 'partially-verified' // Source supports the general claim but not all details
  | 'unverified'         // No external source; model-inferred or user-stated
  | 'contradicted'       // Another source challenges this claim
  | 'not-applicable';    // Claim is analytical/normative; no external verification exists

interface ValidationLog {
  artifactId: string;
  generatedAt: string;
  entries: ValidationLogEntry[];
  totalClaims: number;
  verifiedCount: number;
  unverifiedCount: number;
  contradictedCount: number;
  coverageNote: string;  // e.g. "Validation Log covers 8 of 12 externally-verifiable claims."
}
```

## 4.3 When Validation Logs Are Required — Claim-Driven Rule

**The Validation Log is claim-driven, not artifact-type-driven.**

A Validation Log entry is required for every externally-verifiable claim in any
artifact, regardless of which outcome produced it. A claim is "externally verifiable"
if a PM could, in principle, independently confirm it from a source.

```
REQUIRES a Validation Log entry:
  "Competitor X charges ₹2,999/month for SMBs"     ← factual, verifiable
  "The Indian SMB retail market is estimated at..."  ← empirical claim
  "Our activation rate dropped from 34% to 26%"     ← metrics claim
  "Interview participant P3 said: onboarding is confusing" ← sourced user statement

DOES NOT require a Validation Log entry:
  "We recommend prioritizing Feature A over Feature B"   ← analytical judgment
  "The architecture should use a microservices approach" ← design recommendation
  "Acceptance criteria: X must load within 2 seconds"    ← normative requirement
  "Assumption: users prefer WhatsApp to email"           ← explicitly labelled assumption
```

**Practical rule for each artifact section:**
The capability generating the section is responsible for identifying which
claims are externally verifiable and populating the Validation Log accordingly.
Sections with no externally-verifiable claims have no Validation Log entry.
An artifact with no externally-verifiable claims anywhere needs no Validation Log.

**Outcomes most likely to produce Validation Log entries:**
Research, Investigate, Case Study, and Build Discovery/Validation stages —
because these outcomes are evidence-driven by nature. But any outcome that
cites external sources (competitor data, market metrics, user research, etc.)
must produce Validation Log entries for those citations.

---

# PART 5 — KNOWLEDGE PRODUCTION CONTRACT

## 5.1 Per-Stage Knowledge Production (Canonical — from Document 4 Part 34B)

Document 5 operationalizes Part 34B's stage-to-knowledge mapping by defining
the extraction hints and structured output fields that cause the Promotion Engine
to create the correct PKS items.

For every outcome stage, the knowledge production contract specifies:
- Which memory class items are expected
- What linguistic signals trigger extraction
- Which relationship fields to populate
- What authority level to assign
- Whether items are promotable to project scope

## 5.2 Structured Output Requirements for PKS Extraction

When an artifact section should produce PKS knowledge, the step's TaskSpec
includes an extraction hint in its structured output schema.

**Relationship field population — when traceable, not mandatorily:**

Document 4 Part 35 v1.2 establishes that all reasoning-chain relationship fields
are **optional** and are populated **only when an authoritative relationship can
be established** from structured output, governed input, or another approved source.

**The governing rule: CO-OCCURRENCE IS NOT LINEAGE.**

A finding produced in the same stage as a decision does not automatically become
a `findingIds` entry on that decision. A constraint produced after a decision does
not automatically gain `derivedFromDecisionId`. Relationships must be
explicitly established — not inferred from proximity, semantic similarity, or
the fact that two objects appeared in the same step.

If a relationship cannot be authoritatively established:
- leave the field absent (null/undefined in the structured output);
- the Promotion Engine does not manufacture the relationship;
- the PKS item is still valid without the relationship field;
- its epistemic status reflects the absence of established lineage.

```
ResearchFinding → populate WHEN authoritative:
  supportingEvidenceIds: include only EvidenceItems that directly support this finding
  implicationIds: populated post-promotion, only when an Implication is committed
  derivedDecisionIds: populated post-promotion, only when Decision explicitly references this finding

Assumption → populate WHEN authoritative:
  derivedFromFindingIds: include only Findings that explicitly raised this assumption
  governedByDecisionIds: include only Decisions that explicitly accept this assumption

Decision → populate WHEN authoritative:
  evidenceIds: EvidenceItems that directly informed this decision
  findingIds: ResearchFindings that informed this (not all findings from the same stage)
  acceptedAssumptionIds: Assumptions explicitly accepted in making this decision
  alternativesConsidered: only options that were genuinely evaluated and rejected
  derivedConstraintIds: Constraints that explicitly flow from this decision
  affectedArtifactIds: Artifacts whose content is governed by this decision

Constraint → populate WHEN authoritative:
  derivedFromDecisionId: ONLY when this constraint explicitly flows from a Decision
    (user-stated and explicitly-governed constraints typically have NO decision source)
  affectedArtifactIds: Artifacts this constraint explicitly governs
  source: always required — must reflect actual authority level, not inflated

ArtifactImpactRecord (post-promotion) → populate:
  dependsOnDecisionIds, dependsOnConstraintIds, dependsOnAssumptionIds,
  dependsOnFindingIds, dependsOnEvidenceIds
  (only the knowledge items this artifact's content genuinely depends on)
```

The Promotion Engine extracts relationships from explicitly populated structured
output fields — it does not infer relationships from narrative co-occurrence.
Document 7 defines the extraction implementation.

## 5.3 Document 5 / Document 7 Semantic Boundary

**Document 5 defines (semantic contracts — authoritative):**
- Which structured fields an outcome/stage must be capable of producing
- The meaning of those fields and their PKS knowledge class
- Which relationship fields may be populated when traceable
- Whether a field is required, optional, or conditional
- The semantic contract for Validation Log entries
- The semantic contract for OST/ERD structured data

**Document 7 defines (implementation — non-authoritative from Document 5's perspective):**
- Runtime serialization format and schema validation
- Extraction mechanics and claim-detection implementation
- Relationship-field inference rules and post-promotion linking
- Parser/validator implementation
- Storage format and rendering implementation
- Model-specific prompt templates that produce the structured output
- Collaboration protocol for multi-user editing

Document 5's semantic contracts must be complete enough that Document 7 can
implement them without inventing product meaning. Document 5 must not steal
implementation ownership from Document 7 by prescribing runtime schemas.

---

```typescript
interface StructuredArtifactOutput {
  narrative: string;                  // the prose section

  // PKS extraction targets (populated by the capability; used by Promotion Engine)
  decisionsIdentified?: {
    text: string;
    rationale: string;
    evidenceIds?: string[];
    findingIds?: string[];
    acceptedAssumptionIds?: string[];
    alternativesConsidered?: { text: string; rejectionRationale: string }[];
  }[];
  assumptionsIdentified?: {
    text: string;
    status: 'unvalidated' | 'validated';
    priority: 'critical' | 'high' | 'medium' | 'low';
    evidenceIds?: string[];
  }[];
  findingsIdentified?: {
    text: string;
    supportingEvidenceIds: string[];
    confidence: number;
  }[];
  constraintsIdentified?: {
    text: string;
    source: 'user-stated' | 'explicitly-governed' | 'research-discovered' | 'model-inferred';
    constraintType: string;
    // Authority is derived from source per Document 4 §4.2:
    //   user-stated: authorityScore=1.0; Tier 0 budget protection
    //   explicitly-governed: authorityScore=0.95; Tier 0 protection
    //   research-discovered: authorityScore=0.80; Tier 2
    //   model-inferred: authorityScore=0.60; Tier 2; must never silently become a hard boundary
  }[];
  questionsRaised?: {
    text: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
  }[];
}
```

---

# PART 6 — CAPABILITY SELECTION PRINCIPLES

## 6.1 The Selection Hierarchy (from Document 2 Part 6)

Capabilities are selected in five layers. Document 5 applies this hierarchy to
every outcome. Only selected capabilities appear in the ExecutionPlan.

```
Layer 1: Artifact domain → DOMAIN_CAPABILITY_MAP
  research   → RE
  strategy   → PS
  ux         → UX
  architecture → AR
  quality    → QA

Layer 2: Context signals → additional capabilities based on uploads, symptoms
Layer 3: Depth/Evaluation → QA added for evidence coverage at Deep/Exhaustive
Layer 4: Orchestration → CO when recipe requires synthesis/judgment/stage-gate
Layer 5: Delegation → sub-agents for eligible outcomes at Deep/Exhaustive depth
```

## 6.2 Capability Rejection Requirement

For every outcome in this document, capability rejections are explicit.
A capability that is not selected has a documented reason. The default is
**not selected** — selection requires justification, not rejection.

## 6.3 Sub-Agent Delegation Rules

Sub-agents are temporary parallel workers, not persistent capabilities.
Sub-agent delegation is permitted only at `depth: 'deep'` or `depth: 'exhaustive'`
for `research`, `investigate`, and `council` outcomes.

```
Sub-agent scope: bounded task (one research question, one evidence domain)
Sub-agent output: SubAgentResult (not directly to artifacts)
Sub-agent authority: cannot promote knowledge to PKS
Sub-agent evidence: contributes EvidenceItems via parent capability's synthesis
Maximum depth: 1 (sub-agents cannot spawn sub-agents)
```

---

# PART 7 — ORCHESTRATION RECIPES

## 7.1 Active Recipe Set — Six Canonical Recipes

Each recipe is a named composition of orchestration primitives. The canonical
set is exactly six. No outcome contract may reference a recipe outside this set.

| RecipeId | PM-facing name | Used for |
|---|---|---|
| `structured-delivery` | (transparent) | Build, Case Study, Prioritize, Plan |
| `research-first` | (transparent) | Research, Investigate |
| `parallel-critique` | (transparent) | Review, Council |
| `red-blue-debate` | Debate | Decide (orchestrationOverride: 'debate') |
| `council` | Council | Council outcome |
| `goal-based-research-loop` | Continuous Research | Research (+ GoalSpec) |

**structured-delivery** — Steps execute sequentially; each step's output feeds
the next. Used for: Build (with stage-gate coordination by CO), Case Study,
Prioritize, Plan. Evaluate after each step at Balanced+ depth.

**research-first** — Evidence gathering runs first; synthesis follows.
Used for: Research, Investigate. Workers may run in parallel during evidence phase.

**parallel-critique** — Multiple independent assessors analyze the same input;
CO synthesizes with dissent preserved.
Used for: Review, Council.

**red-blue-debate** — Two instances of the same capability argue opposing
positions independently; CO adjudicates. PM-facing name: "Debate / Red Team–Blue Team."
Used for: Decide (when `orchestrationOverride: 'debate'`).
Note: `orchestrationOverride: 'debate'` is the user-facing configuration key;
`red-blue-debate` is the internal recipe name consumed by the Router.

**council** — Multiple independent assessors analyze the question from their respective
domains; CO aggregates all assessments and synthesizes a recommendation with preserved
dissent. Assessors are selected via the context-driven capability selection (Layer 2).
Used for: Council outcome.

**goal-based-research-loop** — Research-first recipe repeats until goal criteria
are met or bounds are exhausted. Each iteration uses prior evidence accumulated within
the same run. Loop termination is deterministic (Document 2 §13.2).
Used for: Continuous Research (outcomeId: 'research' + ValidatedGoalSpec).

## 7.2 Recipe ↔ CO Requirement

| Recipe | CO required? | Reason |
|---|---|---|
| structured-delivery (no stage-gate) | No | Engine sequences mechanically |
| structured-delivery (Build) | Yes | Stage-gate validation requires CO |
| research-first | Yes | Synthesis and framing step |
| parallel-critique | Yes | Synthesis across independent assessors |
| red-blue-debate | Yes | Adjudication role |
| goal-based-research-loop | Yes | Frames context + evaluates goal |

---

# PART 8 — DEPTH POLICY INTERACTION

Depth controls per-iteration rigor. It does not control loop eligibility.

| What changes by depth | Quick | Balanced | Deep | Exhaustive |
|---|---|---|---|---|
| Research breadth | Minimal | Standard | Extended | Maximum |
| Sub-agent workers | 0 | 0 | Up to 4 | Up to 5 |
| Evidence requirement | Assertions OK | Key claims sourced | All claims sourced | All claims sourced + coverage check |
| Evaluation passes | None | 1 | 1 (stricter threshold) | 2 |
| Evaluation threshold | — | 70 | 78 | 85 |
| Max quality revisions | 0 | 1 | 2 | 2 |
| Cross-artifact coherence check | No | No | No | Dedicated pass |
| Contradiction detection | No | No | Yes | Yes (exhaustive) |
| Min evidence sources | None | None | 2 | 3 |
| Artifact richness | 0.7× | 1.0× | 1.3× | 1.5× |

**Depth and loop are independent.** A Quick run can have a bounded goal loop.
A Deep run does not automatically loop. Depth controls how thorough each
iteration is; loop policy controls how many iterations occur.

---

# PART 9 — IMPLEMENTATION STATUS REFERENCE

Implementation phase labels (CURRENT, PHASE 1, PHASE 2, PHASE 3, FUTURE) are
**consolidated in Part 32** and not embedded in outcome contracts. This keeps
outcome contracts stable as architectural specifications independent of timeline.

The phase vocabulary is defined in Part 32 §32.1.

---

# PART 10 — OUTCOME: BUILD

## 10.1 PM Job

**Build a complete product definition from an idea.**

A PM has a product concept and needs to transform it into a complete,
professionally structured artifact set — from discovery through QA readiness —
using a governed multi-stage PM lifecycle.

**When to use:**
- Starting a new product or feature from scratch
- Creating a structured product brief for a team
- Generating a complete PM artifact package for stakeholder alignment
- Producing a full product specification for engineering planning

**Not suitable for:** improving an existing artifact (use Review); investigating
a problem (use Investigate); researching a market without building (use Research).

**Example request:**
> "AI-powered inventory management for independent retail stores in tier-2 Indian cities"

## 10.2 Required Inputs

- Intent / idea description (≥ 10 characters)

## 10.3 Optional Inputs

- Uploaded context: prior research, user interview transcripts, competitive analysis, existing PRDs
- Workspace memory: prior project knowledge
- Depth selection (default: balanced)

## 10.4 RunConfig

```typescript
{
  outcome: 'build',
  depth: 'balanced',          // configurable
  context: {
    uploads: [...],           // optional
    workspaceMemory: true     // if prior project knowledge exists
  }
}
```

## 10.5 Strategy Router Decision

**Artifact Contract domains:** research, strategy, ux, architecture, quality
(all five non-synthesis domains present across 15 Build artifacts)

**Five-layer capability selection:**

| Layer | Result |
|---|---|
| L1 Domains | RE (research), PS (strategy), UX (ux), AR (architecture), QA (quality) |
| L2 Context | No additional signals trigger new capabilities |
| L3 Depth | No additions (all domains already present) |
| L4 Orchestration | CO selected — Build uses structured-delivery with stage-gate coordination |
| L5 Delegation | Not permitted for Build in V1 |

**Selected: CO, PS, RE, UX, AR, QA (all six)**

This is the only outcome where all six capabilities are selected. The selection is
**derived** from the artifact contract (all five domain capabilities required) plus
stage-gate coordination (CO Layer 4). It is not a hard-coded rule.

**Recipe:** structured-delivery (with stage-gate coordination)

## 10.6 Execution Plan — 15-Stage Sequential Flow

Each Build execution maps to `internalStageIndex 0–14`:

| Stage | Name | Primary Capability | Key Output |
|---|---|---|---|
| 0 | Idea Intake | CO | Clarified problem space + framing |
| 1 | Discovery | RE | Market landscape, user evidence, competitive analysis |
| 2 | Problem Definition | RE | Problem statement + user needs synthesis |
| 3 | Solution Design | PS | Solution concept + design principles |
| 4 | MVP Hypothesis | PS | MVP scope + testable hypotheses |
| 5 | Validation | QA | Validation plan + hypothesis evaluation |
| 6 | Prioritisation | PS | Prioritized feature set |
| 7 | PRD | PS | Product Requirements Document |
| 8 | UX Design | UX | UX design principles + key flows |
| 9 | Usability Planning | UX | Usability testing plan |
| 10 | Architecture | AR | Technical approach + system design |
| 11 | Backlog & Release | AR | Epic/story structure + release sequence |
| 12 | Implementation Planning | PS | Delivery roadmap + dependencies |
| 13 | QA & Readiness | QA | Quality gates + launch readiness |
| 14 | Prototype Prompt | AR | Prototype specification |

**CO's stage-gate role:** After each stage, CO evaluates whether the output is
coherent, complete, and ready to inform the next stage. If the gate fails at
Balanced+ depth, CO returns a revision request. CO does not generate artifacts —
it validates them.

## 10.7 Context per Capability

| Capability | Receives |
|---|---|
| CO | Stage-gate criteria, prior stage outputs (summaries), constraints, active project decisions |
| RE | All uploaded research/context, prior research findings, competitor facts, user evidence |
| PS | RE outputs, problem definition, MVP hypothesis, prior strategic decisions, constraints |
| UX | Solution design, user evidence, UX constraints, prior UX decisions |
| AR | Solution design, PRD, technical constraints, architecture decisions |
| QA | All prior artifacts (summaries), acceptance criteria, quality constraints |

## 10.8 Depth Interaction for Build

| Depth | What changes |
|---|---|
| Quick | Shorter artifacts, no evaluation, CO gates are advisory only |
| Balanced | 1 evaluation pass per artifact; CO gates enforce quality; standard research |
| Deep | Stricter evaluation (threshold 78); extended discovery research; contradiction detection |
| Exhaustive | 2 evaluation passes; dedicated cross-artifact coherence; maximum research breadth |

## 10.9 Memory and Evidence

**What the PKS provides:**
- Active constraints (Tier 0 — always in context)
- Prior product decisions (if project has prior runs)
- Prior research findings
- Active assumptions

**What Build produces for PKS — all 15 stages (internalStageIndex 0–14):**

Authoritative mapping from Document 4 Part 34B. Every stage is listed.
Each stage may produce new knowledge, update existing knowledge, raise questions,
or produce no new persistent knowledge — all are valid outcomes.

| Stage (index) | Stage name | Eligible PKS output | Structured fields that carry it | Promotion |
|---|---|---|---|---|
| 0 | Idea Intake | Constraint (user-stated), Fact (project scope), UnresolvedQuestion | constraintsIdentified, narrative analysis | Post-run |
| 1 | Discovery | EvidenceItem (from uploads/URLs), ResearchFinding, Assumption (unvalidated), UnresolvedQuestion | findingsIdentified, assumptionsIdentified, questionsRaised; EvidenceItems captured during execution | EvidenceItems: during run; Knowledge: post-run |
| 2 | Problem Definition | ResearchFinding (problem framing), Assumption (unvalidated), Fact (problem space) | findingsIdentified, assumptionsIdentified | Post-run |
| 3 | Solution Design | Decision (solution choice + alternativesConsidered), Assumption | decisionsIdentified (with alternativesConsidered), assumptionsIdentified | Post-run |
| 4 | MVP Hypothesis | Decision (scope/feature selection), Assumption (scope assumptions), Constraint (model-inferred scope limits) | decisionsIdentified, assumptionsIdentified, constraintsIdentified | Post-run |
| 5 | Validation | EvidenceItem (validation data), ResearchFinding (validated/invalidated findings), Assumption status updates | findingsIdentified; status updates for prior assumptions | EvidenceItems: during run; updates + findings: post-run |
| 6 | Prioritisation | Decision (priority order), Fact (scoring rationale) | decisionsIdentified, narrative (scoring data) | Post-run |
| 7 | PRD | Decision (requirements/scope decisions), Constraint (requirements, user-stated or explicitly-governed) | decisionsIdentified, constraintsIdentified | Post-run |
| 8 | UX Design | Decision (UX approach choices), Constraint (UX constraints, model-inferred), Assumption (user behaviour assumptions) | decisionsIdentified, constraintsIdentified, assumptionsIdentified | Post-run |
| 9 | Usability Planning | UnresolvedQuestion (usability hypotheses to test), Decision (test approach) | questionsRaised, decisionsIdentified | Post-run |
| 10 | Architecture | Decision (architecture choices), Constraint (technical, explicitly-governed or research-discovered) | decisionsIdentified, constraintsIdentified | Post-run |
| 11 | Backlog & Release | Decision (scope/sequencing), Constraint (delivery/release constraints, research-discovered) | decisionsIdentified, constraintsIdentified | Post-run |
| 12 | Implementation Planning | Decision (implementation approach), Fact (timeline/resource anchors) | decisionsIdentified, narrative (planning data) | Post-run |
| 13 | QA & Readiness | Constraint (quality gates, explicitly-governed), Decision (acceptance criteria choices) | constraintsIdentified, decisionsIdentified | Post-run |
| 14 | Prototype Prompt | Fact (prototype scope and purpose), Decision (prototype technology/fidelity choice) | decisionsIdentified, narrative | Post-run |

**Evidence capture during execution:** Stages 1 (Discovery) and 5 (Validation) capture EvidenceItems
during execution from URL fetches and file reads. All other stages capture evidence post-run if applicable.

**Not every stage must produce new persistent knowledge.** A stage is valid if it produces:
- new knowledge items (any of the above);
- updates to existing knowledge (e.g., Assumption status change in Stage 5);
- confirmation that prior knowledge remains valid;
- unresolved questions;
- or no new persistent knowledge (e.g., Stage 14 for a project with few decisions remaining).

**Relationship fields** are populated when traceable (§5.2). Stage co-occurrence does not create lineage.

**All knowledge promotion** is post-run (default) except EvidenceItems captured during execution.

**ArtifactImpactRecord:** After knowledge promotion, the Promotion Engine
populates `ArtifactImpactRecord` for each artifact produced in this run,
recording which decisions, constraints, assumptions, and findings it depends on.
This enables stale propagation when upstream knowledge changes (Document 4 §21.4–21.5).

**All promotion:** post-run. Evidence capture from uploads/URLs: during Stages 1 and 5.
**ArtifactImpactRecord:** After knowledge promotion, the Promotion Engine
populates `ArtifactImpactRecord` for each artifact produced in this run,
recording which decisions, constraints, assumptions, and findings it depends on.
This enables stale propagation when upstream knowledge changes (Document 4 §21.4–21.5).


## 10.10 Artifacts Produced

### 10.10.1 Discovery (Stage 1)
**PM Purpose:** Understand the market, users, and competitive landscape before committing to a solution.

**Sections:**
1. Executive Summary
2. Market Context (size, growth, segments)
3. User Research (JTBD, pain points, evidence)
4. Competitive Landscape (3–5 competitors)
5. Key Insights and Opportunities
6. Open Questions
7. Validation Log *(required for all external market, user, and competitor claims — see §4.3)*

**Knowledge production:** ResearchFindings (competitor, market, user), EvidenceItems, Assumptions

**Visual representations:**

| Representation | Type | Layer | Phase |
|---|---|---|---|
| Competitive landscape overview | quadrant-chart | 2 | PHASE 1 |
| User needs heatmap | ranking-table | 2 | PHASE 1 |
| Market landscape flow | flowchart | 2 | CURRENT |

### 10.10.2 Problem Definition (Stage 2)
**PM Purpose:** Articulate the problem clearly enough that the whole team agrees on what is being solved.

**Sections:** Problem Statement, User Segments, Current Experience, Pain Points + Evidence, Success Looks Like, Assumptions, Validation Log *(if externally verifiable claims — see §4.3)*

### 10.10.3 Solution Design (Stage 3)
**Sections:** Solution Concept, Core Principles, Key Features, Trade-offs Considered, Alternatives Rejected, Decision Log

**Knowledge production:** Decisions (with alternativesConsidered embedded), Assumptions

### 10.10.4 MVP Hypothesis (Stage 4)
**Sections:** MVP Scope, Hypotheses (What we believe / How we'll test / What success looks like), Excluded Features, Risks

**Visual:** OST (Opportunity Solution Tree) node structure

### 10.10.5 Validation (Stage 5)
**Sections:** Validation Approach, Criteria, Test Design, Expected Evidence, Risks, Validation Log *(if externally verifiable claims — see §4.3)*

### 10.10.6 Prioritisation (Stage 6)
**Sections:** Prioritization Framework, Ranked Items, Scoring Rationale, Dependencies, Sequencing Rationale

**Structured output:** RICE or MoSCoW scores per feature
**Visual:** Quadrant chart (impact vs effort), Ranking table

### 10.10.7 PRD (Stage 7)
**Sections:** Product Brief, Goals & Non-Goals, User Stories, Requirements, Constraints, Dependencies, Open Questions

**Validation Log:** Optional (if market/user claims made)

### 10.10.8 UX Design (Stage 8)
**Sections:** Design Principles, Key Flows, Information Architecture, Interaction Patterns, Edge Cases, Usability Considerations

**Visual:** User Flow (Mermaid flowchart); Information Architecture diagram

### 10.10.9 Architecture (Stage 10)
**Sections:** Technical Approach, System Components, Integration Points, Data Model Overview, Technical Risks, Constraints

**Visual:** System Architecture diagram (Mermaid); ERD (Mermaid class-diagram); Sequence Diagram

### 10.10.10 Backlog & Release (Stage 11)
**Sections:** Epic Structure, Story Hierarchy, Dependencies, Release Sequence, Estimation Rationale

**Visual:** Gantt / Roadmap (Mermaid gantt); Dependency Graph

### 10.10.11 QA & Readiness (Stage 13)
**Sections:** Quality Criteria, Test Approach, Acceptance Criteria per Epic, Launch Readiness Checklist, Risk Register

## 10.11 Evaluation Contract

| Dimension | Weight | Required? | Threshold (Balanced) |
|---|---|---|---|
| Completeness | 0.35 | Yes | — |
| Logical consistency | 0.25 | No | — |
| Handoff readiness | 0.25 | No | — |
| Technical feasibility | 0.15 | No | — |
| **Overall** | | | **70 (Balanced), 85 (Exhaustive)** |

Evaluator: QA (per-stage). CO evaluates gate criteria between stages.

## 10.12 Validation Log for Build

The claim-driven rule in §4.3 is the governing authority. Build stages likely to produce externally verifiable claims:
- Stage 1 (Discovery): market, user, competitor claims — typically many entries
- Stage 2 (Problem Definition): problem framing backed by evidence — typically several entries
- Stage 5 (Validation): validation results and data — typically several entries

Stages unlikely to produce externally verifiable claims: 0, 3, 4, 6, 8, 9, 11, 12, 13, 14 — typically no Validation Log entries.

The generating capability identifies which claims in each section are externally verifiable and populates entries accordingly. Document 7 defines the claim-detection mechanism.

## 10.13 Failure Modes

| Failure | Behavior |
|---|---|
| Insufficient context (no uploads, generic intent) | Proceeds with model-generated assumptions; assumes are marked 'unvalidated'; quality score likely low at evaluation |
| Stage gate failure after max revisions | Stage advances with quality warning; artifact flagged as below-threshold in Desk |
| Cancellation mid-build | All completed stages preserved; incomplete stages flagged; run status: partial |
| Evidence requirement not met (insufficient sources in Discovery) | Recommendation: "Gather more evidence" added to Discovery; continues to Stage 2 |
| Provider failure | Technical retry (×2) → fallback model → step failure → cascade to required step failure |
| Budget exhaustion | Completes current stage; stops; partial artifacts preserved |

## 10.14 Capability Implementation Status

*→ Implementation phase details for Build: see Part 32.*

## 10.15 Definition of Done — Build

- [ ] All 15 stages completed (or all required stages completed with quality warnings)
- [ ] Each stage artifact is non-empty and addresses its PM purpose
- [ ] Discovery artifact contains ≥ 2 evidence sources (at Balanced+ depth)
- [ ] Validation Log entries present for all externally verifiable claims (per §4.3); stages 1, 2, 5 typically produce entries
- [ ] CO stage-gate passed (or documented as overridden)
- [ ] Knowledge items promoted post-run
- [ ] ArtifactImpactRecords populated
- [ ] User sees complete artifact set in Desk

---

# PART 11 — OUTCOME: CASE STUDY

## 11.1 PM Job

**Document a product decision, initiative, or experience as a structured learning artifact.**

A PM wants to record and share the reasoning behind a product decision, feature
launch, or strategic pivot — for team learning, portfolio purposes, or stakeholder
communication.

**When to use:**
- Documenting a completed feature launch or experiment
- Creating a portfolio piece about a product decision
- Writing a retrospective on a strategy or execution choice
- Recording "how we decided X" for organizational memory

**Not suitable for:** making a new decision (use Decide); ongoing research (use Research).

## 11.2 Selected Capabilities

**L1:** RE (research domain: context-and-problem), PS (strategy domain: decisions, outcomes)
**L4:** CO not required — sequential recipe, single-voice narrative, no multi-perspective synthesis

**Selected: RE, PS**

**Rejected:**
- UX, AR, QA: no UX, architecture, or quality domain artifacts in the casestudy contract (Document 2 §4.3)
- CO: Document 2's routing matrix and Invariant §6.5 explicitly exclude CO from casestudy. The recipe is
  structured-delivery with no stage-gate coordination; the document is single-authored and requires narrative
  coherence, not synthesis of competing perspectives. CO would add no capability the PS capability doesn't
  provide for a single-voice narrative. *(Confirmed: Document 2 routing summary matrix, casestudy row:
  "No | No synthesis step in recipe.")*

**Architectural note:** "Synthesis" in the CO context means aggregating multiple *independent* perspectives.
A case study written from a single perspective by PS — even when it covers multiple sections — is synthesis
of a different kind: narrative authorship. This does not require CO.

## 11.3 Orchestration

Recipe: `structured-delivery` (sequential, no stage-gate)
Steps: RE (context + evidence) → PS (decisions + options + outcomes) → PS (narrative synthesis)

## 11.4 Artifacts

### Case Study Document
**Sections:**
1. Situation (What was the context and challenge?)
2. Evidence Available (What did we know and from where?)
3. Options Considered (What choices did we evaluate?)
4. The Decision (What did we choose and why?)
5. Execution Approach (How did we implement it?)
6. Outcomes and Metrics (What happened?)
7. Key Learnings (What would we do differently?)
8. Validation Log *(required if externally verifiable claims are made — see §4.3)*

**Visual representations:**
- Decision timeline (Mermaid gantt)
- Options comparison matrix (ranking-table)

## 11.5 Knowledge Production

| Section | Memory class | Notes |
|---|---|---|
| Decision section | Decision (with alternativesConsidered) | authorityScore: 0.9; promotable |
| Evidence section | EvidenceItem, ResearchFinding | from uploads/prior knowledge |
| Outcomes section | Fact (outcome metrics) | time-sensitive freshness |
| Learnings section | PriorOutcome | always promotable |

## 11.6 Evaluation

**Dimensions:** factual-integrity (0.40, required), rationale-clarity (0.35), completeness (0.25)
**Threshold:** 70 (Balanced). **Evaluator:** QA. **Revisions:** 1 (Balanced), 2 (Deep)
**Critical gate:** factual-integrity required — fabricated metrics always fail evaluation.

## 11.7 Failure Modes

| Failure | Behavior |
|---|---|
| No prior artifacts or uploads provided | Artifact is model-generated; all claims marked 'unverified'; quality likely low |
| Fabricated metric detected in evaluation | Evaluation fails factual-integrity; revision required; if still fails: artifact flagged |
| Insufficient detail in inputs | Artifact may request clarification; if Quick depth: proceeds with gaps noted |

---

# PART 12 — OUTCOME: RESEARCH

## 12.1 PM Job

**Gather structured intelligence on a market, competitor, user group, technology, or product question.**

A PM needs to understand a landscape before making a decision, validating a
hypothesis, or building a product. Research provides evidence-backed intelligence
with explicit provenance and uncertainty acknowledgment.

**When to use:**
- Market sizing and landscape analysis
- Competitive intelligence (features, pricing, strategy)
- User research synthesis and JTBD analysis
- Technology or domain exploration
- Pre-build discovery without committing to the full Build lifecycle

**Not suitable for:** making a decision on the research (use Decide after Research);
investigating a specific problem (use Investigate).

## 12.2 Required Inputs

- Research question or domain (intent)

## 12.3 Optional Inputs

- Uploaded documents (prior research, reports, transcripts)
- URLs to analyze
- Depth selection (determines research breadth and worker count)
- Goal specification (triggers goal-based loop)

## 12.4 Selected Capabilities

**L1 Domains:** RE (research ×4 artifacts), PS (strategy ×1 artifact)
**L3 Depth:** QA added at Deep/Exhaustive (evidence coverage validation)
**L4 Orchestration:** CO — research-first recipe requires synthesis and framing

**Selected: RE, PS, QA, CO**

**Rejected:**
- UX: No UX domain artifacts. Whether to build precedes how it looks.
- AR: No architecture domain. Technical feasibility is not the question here.

*Conditional additions via L2 context signals:*
- If uploads contain competitor technical specs → AR may be added
- If uploads contain user journey data → UX may be added

## 12.5 Sub-Agents (Deep/Exhaustive depth)

At `depth: 'deep'`, RE delegates to up to 4 parallel workers:

| Worker | Scope |
|---|---|
| Market landscape worker | Market size, trends, growth drivers |
| Competitor worker | Feature, pricing, positioning analysis per competitor |
| User evidence worker | User pain points, JTBD, behavioral evidence |
| Business model worker | Revenue models, pricing structures |

Each worker produces a `SubAgentResult`. RE synthesizes all four.
Workers produce EvidenceItems during execution (run-scoped). Workers do not promote to PKS.

At `depth: 'exhaustive'`: up to 5 workers (adds a regulatory/contextual worker).

## 12.6 Orchestration

Recipe: `research-first`
```
CO frames research scope + context
  ↓
RE coordinates workers (parallel at Deep+) or single-pass (Quick/Balanced)
  ↓
RE synthesizes worker outputs into structured findings
  ↓
PS interprets strategic implications
  ↓
QA evaluates evidence coverage (at Balanced+)
  ↓
CO frames final recommendation with uncertainty acknowledgment
```

## 12.7 Context per Capability

| Capability | Receives |
|---|---|
| CO | Research intent, active project constraints, prior research findings from PKS |
| RE | All uploaded context, URLs, workspace evidence, prior research, competitor facts |
| PS | RE synthesis output, active project decisions, strategic constraints |
| QA | All generated artifacts (summaries), evidence coverage requirements |
| Workers | Their specific bounded scope; no cross-worker contamination |

## 12.8 Artifacts

### 1. Market Landscape
**Sections:** Market Size & Growth, Key Segments, Trends & Drivers, Entry Barriers, Validation Log *(if externally verifiable claims — see §4.3)*

### 2. Competitor Matrix
**Sections:** Competitor Profiles (3–7), Feature Comparison, Pricing Analysis, Positioning Map, Gaps and Opportunities, Validation Log *(if externally verifiable claims — see §4.3)*

**Visual:** Quadrant chart (positioning); Ranking table (feature comparison)

### 3. User Problem Evidence
**Sections:** User Segments, Key Pain Points + Evidence, JTBD Framework, Behavioral Patterns, Confidence Assessment, Validation Log *(if externally verifiable claims — see §4.3)*

### 4. Assumption Register
**Sections:** Critical Assumptions (prioritized), Validation Approach per Assumption, Risk Assessment

**Visual:** Assumption Map

### 5. Opportunity Assessment
**Sections:** Market Opportunity Summary, Strategic Implications, Recommended Next Steps, Confidence Level, Residual Uncertainty

**Structured output:** Opportunity scoring with supporting rationale

## 12.9 Critical Evaluation Gate

When source-coverage dimension scores below threshold:
```
→ Opportunity Assessment recommendation becomes "Investigate Further"
→ Artifact is produced but marked with insufficient-evidence flag
→ PM is shown: "Evidence coverage is below the threshold for a confident recommendation."
→ Never produces a confident Build/Don't Build recommendation on insufficient evidence
```

## 12.10 Evaluation Contract

**Dimensions:** evidence-quality (0.30, required), source-coverage (0.25, required),
contradiction-handling (0.20), rationale-clarity (0.25)
**Threshold:** 75 (Balanced). **Evaluator:** QA. **Revisions:** 1 (Balanced), 2 (Deep/Exhaustive)

## 12.11 Knowledge Production

| Artifact section | Memory class | Relationship fields | Authority |
|---|---|---|---|
| Competitor profiles | Fact (freshnessClass: time-sensitive) | evidenceIds | research-discovered |
| User pain points | ResearchFinding | supportingEvidenceIds, implicationIds | research-discovered |
| Market size/trends | Fact (freshnessClass: time-sensitive) | evidenceIds | research-discovered |
| Assumptions | Assumption (status: unvalidated) | derivedFromFindingIds | model-inferred |
| Opportunity (clear) | Decision (if actionable recommendation) | findingIds, acceptedAssumptionIds, alternativesConsidered | research-discovered |
| Unresolved questions | UnresolvedQuestion | raisedInRun | — |
| Contradicted claims | ContradictionRecord created | itemA, itemB, contradictionType | — |

**Evidence capture:** during execution, from URL fetches and file reads.
EvidenceItems are run-scoped (`scope: 'run-local'`) until post-run promotion.

**Promotion:** post-run. Competitor facts carry `validUntil` where known and
`freshnessClass: 'time-sensitive'` to enable accurate staleness scoring on future retrieval.

**ArtifactImpactRecord:** Each artifact produced in Research has an ArtifactImpactRecord
populated post-promotion. Competitor matrix depends on Fact items (competitors); when
those Facts are superseded by newer research, the matrix becomes `potentially-stale`.

## 12.12 Validation Log

Validation Log entries are required wherever artifacts contain externally verifiable claims (§4.3). Research artifacts typically contain many such claims — competitor facts, market sizes, user research findings — so Validation Log entries are expected throughout. The claim-driven rule in §4.3 is the authority; this note is guidance, not an override.

## 12.13 Failure Modes

| Failure | Behavior |
|---|---|
| No external evidence sources provided | Proceeds; all claims marked model-inferred; Validation Log shows all 'unverified'; low evaluation score |
| URL fetch fails for a cited source | Proceeds; EvidenceItem not created for that URL; gap noted in Validation Log |
| Contradicting evidence found | Both sides included; ContradictionRecord created; synthesis acknowledges conflict |
| Worker failure (≥ minimum succeed) | Proceeds with successful workers; gap noted in artifact |
| Evidence coverage below threshold | Recommendation weakened to "Investigate Further"; artifact flagged |

## 12.14 Implementation Status

→ *Implementation phase details for this outcome: see Part 32.*

---

# PART 13 — OUTCOME: RESEARCH & VALIDATE

## 13.1 PM Job

**Research a question and explicitly evaluate whether the evidence is sufficient to act on.**

This is `outcomeId: 'research'` with an explicit validation evaluation step added
to the EvaluationPolicy. The PM gets not only the research findings but a structured
assessment of evidence quality, coverage, and confidence before committing to a decision.

## 13.2 Difference from Research

| | Research | Research & Validate |
|---|---|---|
| Evaluation | Evidence quality | Evidence quality + explicit sufficiency verdict |
| Additional output | — | Validation verdict artifact (Sufficient / Insufficient / Conditional) |
| Threshold | 75 | 80 (higher — validate requires stronger evidence) |
| Goal eligibility | Yes | Yes |
| Min evidence sources | 2 | 3 |

## 13.3 Additional Artifact: Validation Verdict

**Sections:**
1. Evidence Sufficiency Assessment (Sufficient / Insufficient / Conditional)
2. Evidence Coverage by Dimension (what is well-evidenced vs gaps)
3. Confidence Level by Claim
4. What Would Change the Verdict (what additional evidence is needed)
5. Recommended Next Steps

**This artifact makes the epistemic status of the research explicit.** It prevents
a PM from acting on research that appears confident but is based on thin evidence.

## 13.4 Critical Rule

If the validation verdict is "Insufficient":
- The Opportunity Assessment must not contain a confident recommendation
- The verdict artifact must lead with: "Evidence is insufficient to support a confident recommendation."
- The PM must acknowledge this before using the research output for a major decision

---

# PART 14 — OUTCOME: PRIORITIZE

## 14.1 PM Job

**Rank and sequence a set of backlog items, features, or options against defined criteria.**

A PM has a list of items to prioritize (features, user stories, initiatives, bets)
and needs to produce a scored, ranked, dependency-aware sequence for planning.

**When to use:**
- Quarterly or sprint planning
- Backlog grooming before roadmap
- Deciding which features to build in which order
- Comparing options by value/effort/risk

## 14.2 Required Inputs

- List of items to prioritize (uploaded or pasted)
- Criteria to rank against (or request to apply a standard framework like RICE)

## 14.3 Selected Capabilities

**L1 Domains:** PS (strategy: ranked-list, scoring-breakdown, sequence-rationale), QA (quality: dependency-map)
**L4 Orchestration:** CO NOT required — PS scores; QA validates; engine sequences mechanically

**Selected: PS, QA**

**Explicitly rejected:**
- RE: Items are user-provided; no discovery needed. *(Conditional: if items represent opportunities that need scoped research, use Research first, then Prioritize.)*
- UX: No UX domain artifact
- AR: Effort estimates are user-provided; no decomposition needed. *(Conditional: if effort estimation is requested, AR may be added via L2 context)*
- CO: No multi-perspective synthesis. PS ranks; QA validates consistency. The engine sequences both without a coordinator.

## 14.4 Orchestration

Recipe: `structured-delivery` (sequential, no stage-gate)
```
PS → applies framework, scores items, produces ranking
  ↓
QA → validates scoring consistency, checks dependencies, flags conflicts
  ↓
(evaluation) → scoring-consistency + dependency-correctness
```

## 14.5 Depth Interaction

| Depth | What changes |
|---|---|
| Quick | Single scoring pass; no evaluation; no dependency check |
| Balanced | 1 evaluation pass; dependency check; scoring rationale required |
| Deep | Stricter consistency check; multi-criteria validation; 2 revision attempts |
| Exhaustive | Normalized to Deep for prioritize (exhaustive adds no value to ranking) |

## 14.6 Artifacts

### 1. Ranked List
**Sections:** Ranking framework used, Ranked items with scores, Dependencies map, Sequencing rationale

**Structured output:** `{ itemId, title, scores: {value, effort, confidence, risk}, finalScore, rank, dependencies }`

**Visual representations:**
- Scoring breakdown table
- Quadrant chart (value vs effort) (Mermaid quadrant-chart)
- Dependency graph

### 2. Scoring Breakdown
**Sections:** Per-criterion scores with rationale, Framework application notes, Assumptions in scoring

### 3. Sequence Rationale
**Sections:** Recommended build sequence, Dependency sequencing, Risk sequencing, Quick wins identified

## 14.7 Evaluation Contract

**Dimensions:** scoring-consistency (0.35, required), dependency-correctness (0.35, required),
rationale-clarity (0.30)
**Threshold:** 75. **Evaluator:** QA. **Revisions:** 1 (Balanced)

## 14.8 Knowledge Production

| Output | Memory class | Notes |
|---|---|---|
| Scoring decisions | Decision (priority decisions) | findingIds if evidence-backed |
| Scoring framework | Fact | stable, often reused |
| Sequencing rationale | Decision | derivedConstraintIds if sequence creates constraints |
| Dependencies | Fact | often stable within a planning horizon |

## 14.9 Failure Modes

| Failure | Behavior |
|---|---|
| Items list is empty | Run fails at normalization: OUTCOME_REQUIRES_CONTEXT |
| No scoring framework specified | PS applies RICE by default; notes this in artifact |
| Circular dependencies detected | QA flags in dependency-map; sequence is a best-effort with explicit conflict notation |
| Contradicting effort estimates | QA flags inconsistency; requests clarification or applies median |

---

# PART 15 — OUTCOME: PLAN

## 15.1 PM Job

**Transform approved scope into a structured delivery plan.**

A PM has approved features or scope and needs to produce an execution plan —
epics, stories, acceptance criteria, dependencies, risk register, sprint sequence.

**When to use:**
- Turning a prioritized backlog into sprint-ready work
- Planning a release or quarter of delivery
- Decomposing an approved feature into engineering-ready stories
- Creating a dependency-aware delivery sequence

## 15.2 Selected Capabilities

**L1 Domains:** AR (architecture: epic-story-hierarchy, dependency-order), QA (quality: acceptance-criteria, risk-register), PS (strategy: sprint-sequence)
**L4 Orchestration:** CO NOT required — structured delivery with no stage-gate; engine sequences AR → QA → PS

**Selected: AR, QA, PS**

**Rejected:**
- RE: Scope already approved; no discovery needed
- UX: No UX domain artifacts; UI/UX is an input, not an output of Plan
- CO: Three specialists can be sequenced by the engine without synthesis

## 15.3 Orchestration

Recipe: `structured-delivery`
```
AR → decomposes scope into epics and stories; maps dependencies
  ↓
QA → defines acceptance criteria; builds risk register
  ↓
PS → sequences into sprint plan; maps to timeline
  ↓
(evaluation) → completeness + dependency-correctness + handoff-readiness
```

## 15.4 Artifacts

### 1. Epic/Story Hierarchy
**Sections:** Epics (with descriptions and success criteria), Stories per Epic (INVEST-compliant), Story points (if estimation requested)

**Visual:** Story tree (Mermaid flowchart)

### 2. Acceptance Criteria
**Sections:** Per-epic acceptance criteria, Definition of Done

### 3. Dependency Map
**Sections:** Technical dependencies, Cross-team dependencies, External dependencies

**Visual:** Dependency graph (Mermaid flowchart)

### 4. Sprint Sequence
**Sections:** Recommended sprint sequence, Rationale, Risks by sprint, Recommended team size

**Visual:** Gantt chart (Mermaid gantt)

### 5. Risk Register
**Sections:** Risk list (Probability × Impact), Mitigation strategies, Triggers

## 15.5 Evaluation Contract

**Dimensions:** completeness (0.30, required), dependency-correctness (0.35, required), handoff-readiness (0.35, required)
**Threshold:** 80 (higher — engineering acts on this). **Evaluator:** QA. **Revisions:** 2 (Balanced)

---

# PART 16 — OUTCOME: REVIEW & IMPROVE

## 16.1 PM Job

**Critically assess an existing artifact and produce structured improvement recommendations.**

A PM has an artifact (their own PRD, a competitor's document, a draft strategy,
an existing architecture spec) and wants structured critique: what's missing, what's
weak, what contradicts evidence, and what should be improved.

**When to use:**
- Reviewing your own PRD before sharing with engineering
- Critiquing a competitor's product strategy document
- Getting structured feedback on a draft proposal
- Quality-checking an artifact before a stakeholder review

## 16.2 Required Inputs

- The artifact to review (uploaded file or workspace artifact selection)

## 16.3 Context-Driven Capability Selection

The Router classifies the uploaded artifact's domain and activates appropriate reviewers:

```
Artifact type → Capabilities selected (always + QA + CO):

PRD / Strategy / Requirements / Positioning → PS
UX / Design / Flows / Interface specs → UX
Architecture / Technical specs / System design → AR
Research / Competitive analysis / Market assessment → RE
Quality / Testing / Acceptance criteria → QA (always, as domain capability + evaluator)
```

**Minimum:** 2 independent assessors + QA + CO

**Example: Reviewing a PRD:**
- PS (strategy critique), QA (completeness, acceptance criteria), CO (synthesis)
- Rejected: RE (no discovery needed), UX (depends on whether UX content in PRD), AR (depends on technical content)

**Example: Reviewing an Architecture Document:**
- AR (technical critique), QA (completeness), CO (synthesis)

## 16.4 Orchestration

Recipe: `parallel-critique`

**Authoritative execution model (from Document 2 §7 and Document 3):**
```
Assessors analyze independently (mustNotReceiveOutputFrom each other)
  ↓
CO synthesizes independent critiques (receives all assessor outputs)
  ↓
QA evaluates gap quality and coverage
  ↓
CO produces final improvement recommendation with synthesis
```

*Implementation phase: see Part 32.*

## 16.5 Artifacts

### 1. Gap Analysis
**Sections:**
- Critical Gaps (must fix before use)
- Important Gaps (should fix soon)
- Minor Improvements (nice to have)
- Strengths (what is working well)
- Evidence and Reasoning per Gap

### 2. Improvement Recommendations
**Sections:** Prioritized improvement list, Suggested rewrites for critical sections, Templates or frameworks to apply

### 3. Revised Artifact (Optional — only at Deep/Exhaustive)
If `depth: 'deep'` or `depth: 'exhaustive'`: IdeaGate produces a revised version
of the artifact with improvements applied. The original is preserved in Studio.

## 16.6 Evaluation Contract

**Dimensions:** completeness (0.40, required), rationale-clarity (0.35), evidence-quality (0.25)
**Threshold:** 70. **Evaluator:** CO.

Note: evaluation assesses the *thoroughness of examination and quality of conclusion*, not the count of gaps. A well-evidenced finding of zero material gaps is a valid, high-quality Review. The completeness dimension (0.40, required) confirms the reviewer has examined the artifact coverage systematically and explained their conclusions — whether those conclusions identify gaps or confirm adequacy. What fails completeness is an examination so shallow that confidence in any conclusion is unwarranted.

## 16.7 Failure Modes

| Failure | Behavior |
|---|---|
| No artifact uploaded | Run fails: OUTCOME_REQUIRES_CONTEXT |
| Artifact is unsupported format | File extraction fails; run fails: CONTEXT_FILE_UNSUPPORTED |
| Artifact is too large | Artifact is chunked; QA reviews coverage; large sections may be summarized |
| Reviewer finds zero material gaps | This is a valid outcome. Evaluation passes if the reviewer demonstrates thorough coverage with explicit reasoning (e.g., "Section 3 is complete because all acceptance criteria are present and the constraints are consistent"). A no-gap conclusion that lacks evidence of thorough examination fails completeness — not the absence of gaps itself. |

---

# PART 17 — OUTCOME: DECIDE

## 17.1 PM Job

**Frame a product decision with structured reasoning and reach a justified conclusion.**

A PM faces a product decision — build vs buy, approach A vs B, market A vs market B —
and needs to think through the options rigorously, consider evidence, and arrive at
a justified position with preserved uncertainty.

**When to use:**
- Technology choice decisions (React Native vs Flutter)
- Market entry decisions (tier-1 vs tier-2 cities first)
- Build vs buy vs partner analysis
- Pricing strategy selection
- Positioning trade-offs

## 17.2 Selected Capabilities

**L1 Domains:** PS (all four Decide artifacts are strategy domain)
**L4 Orchestration:** CO required as judge (debate recipe requires judge role)

**Selected: PS (×1 for standard Decide), CO (×1)**

**Note on Decide vs Debate:**
- Standard `decide` outcome: PS frames the decision + analyzes options; CO synthesizes
- `decide` with `orchestrationOverride: 'debate'`: PS[blue] + PS[red] + CO[judge] (see Part 18)

**Rejected:**
- RE: Evidence is in uploads/context; new discovery not required. *(Conditional: if "we don't know X" is the blocking issue, use Research first.)*
- UX, AR, QA: No UX/architecture/quality domain artifacts in the Decide contract. *(Conditional: if the decision is about technical architecture, AR may be added via L2; if about UX approach, UX may be added.)*

## 17.3 Orchestration

Standard decide (no override):
```
PS → frames the decision, analyzes options, cites evidence
  ↓
CO → synthesizes reasoning, surfaces dissent, produces recommendation
  ↓
(evaluation) → argument-quality + tradeoff-coverage + dissent-preservation + rationale-clarity
```

## 17.4 Artifacts

### 1. Decision Framing
**Sections:** What is being decided, Why it matters now, What success looks like, Who is affected, Decision criteria, What information we have, What is unknown

### 2. Analysis of Options
**Sections:** Option A (description, pros, cons, risks, evidence), Option B (description, pros, cons, risks, evidence), Additional options if applicable

**Visual:** Decision matrix (ranking-table)

### 3. Synthesis and Recommendation
**Sections:** Recommended option with rationale, Trade-offs accepted, Dissent preserved ("The case for the alternative is: ..."), Residual uncertainty, What would change the decision, Next steps

**Critical rule:** the Synthesis must always contain a dissent section.
Evaluation requires `dissent-preservation` as a required dimension. A synthesis
without a dissent section **always fails** evaluation regardless of other scores.

## 17.5 Evaluation Contract

**Dimensions:** argument-quality (0.30, required), tradeoff-coverage (0.30, required),
dissent-preservation (0.25, required), rationale-clarity (0.15)
**Threshold:** 80. **Evaluator:** CO. **Revisions:** positions are never revised — only synthesis may be revised.

## 17.6 Knowledge Production

| Output | Memory class |
|---|---|
| The decision itself | Decision (with alternativesConsidered, evidenceIds) |
| Decision creates constraints | Constraint (research-discovered or explicitly-governed, linked via derivedFromDecisionId) |
| Residual uncertainty | UnresolvedQuestion |

---

# PART 18 — OUTCOME VARIANT: DEBATE / RED TEAM–BLUE TEAM (recipe: red-blue-debate)

## 18.1 PM Job

**Stress-test a product decision through structured adversarial reasoning.**

A PM wants to make a decision not just by analyzing options, but by having the
strongest possible case built for each side independently, then adjudicated.
This is genuinely useful when stakes are high, evidence is ambiguous, or
organizational bias toward a position is a real risk.

**This is not theatrical AI debate.** It is a structured PM method:
evidence → independent positions → challenge/rebuttal → dissent-preserving decision.

## 18.2 Configuration

```typescript
{
  outcome: 'decide',
  orchestrationOverride: 'debate',
  depth: 'deep'  // minimum; debate with Quick depth is trivial
}
```

## 18.3 Selected Capabilities and Instances

**Selected: PS (×2 instances), CO (×1 instance)**

| Instance | Role | Isolation |
|---|---|---|
| PS[blue] | Builds the strongest case for Position A | mustNotReceiveOutputFrom: PS[red] |
| PS[red] | Builds the strongest case for Position B | mustNotReceiveOutputFrom: PS[blue] |
| CO[judge] | Adjudicates; receives both; synthesizes with preserved dissent | receives both PS outputs |

**Critically:** PS[blue] and PS[red] see the same context. They do NOT see each other's
output until CO adjudicates. If either position has seen the other's argument, the
debate is contaminated — the isolation invariant is violated and the step fails.

**Rejected:**
- RE, UX, AR, QA: same rationale as Decide. Conditionally added if domain warrants.

## 18.4 Orchestration

```
PS[blue] and PS[red] run CONCURRENTLY (parallel)
  (mustNotReceiveOutputFrom enforced by Document 3)
  ↓
CO[judge] receives BOTH outputs (after both complete)
  ↓
CO[judge] adjudicates: strong argument analysis, evidence challenge, synthesis
  ↓
(evaluation) → argument-quality of each position + CO synthesis quality
  ↓
Final: CO decision document with PRESERVED DISSENT
```

## 18.5 What Debate Adds vs Standard Decide

- Blue and Red positions are independently reasoned — no confirmation bias
- Evidence must be cited differently by each position (challenge is mandatory)
- CO must identify the strongest argument from each side, not just average them
- The losing position's strongest argument must appear in the final decision
- Final document answers: "What was the best case against this decision, and why we still chose it?"

## 18.6 Artifacts

### 1. Position A (Blue)
**Sections:** Position statement, Supporting evidence, Strongest arguments, Pre-empted objections

### 2. Position B (Red)
**Sections:** Position statement, Supporting evidence, Strongest arguments, Pre-empted objections

### 3. Adjudication and Decision
**Sections:** Summary of positions, Strongest argument analysis, Evidence quality assessment, Decision, Rationale, Preserved dissent ("The strongest case for the alternative was: ..."), Residual uncertainty, Conditions that would reverse this decision

## 18.7 Isolation Verification (Acceptance Criterion)

```
Assert: PS[blue].context does NOT contain PS[red].stepId
Assert: PS[red].context does NOT contain PS[blue].stepId
Assert: CO[judge].receivesOutputFrom CONTAINS both PS[blue].stepId AND PS[red].stepId
```

This is tested at every Debate execution. Isolation violation fails the step (ENG_02).

---

# PART 19 — OUTCOME: COUNCIL

## 19.1 PM Job

**Convene the minimum set of independent specialist perspectives necessary to address a complex question.**

A PM faces a question that genuinely requires multiple expert lenses — pricing
strategy that has technical, market, and UX dimensions simultaneously. Council
produces independent assessments from relevant specialists, synthesized with dissent.

**The key product principle: Council is selective.** Not all specialists are always
needed. Pricing question → PS + RE (+ CO). Pricing page design → PS + UX + RE (+ CO).
Technical pricing infrastructure → PS + AR + RE (+ CO).

## 19.2 Context-Driven Capability Selection

The Router evaluates the Council question for domain signals:

```
'pricing' + 'positioning' + 'market'        → PS required
'design' + 'usability' + 'experience'       → UX required
'feasibility' + 'architecture' + 'scale'    → AR required
'evidence' + 'research' + 'market data'     → RE required
Council recipe requires aggregation         → CO always required
```

**Minimum: 2 assessors + CO**

## 19.3 Selected Capabilities (Example: Pricing Decision Council)

Question: "Before I take this pricing shift to leadership, stress-test it."

**Selected: PS, RE, AR, CO**
- PS: pricing strategy and competitive positioning
- RE: competitive pricing intelligence, market data
- AR: billing/metering infrastructure feasibility
- CO: aggregation and synthesis

**Rejected:**
- UX: "pricing shift" is about pricing model, not pricing page. *(If question were about the pricing page experience, UX would be added.)*
- QA: No quality/acceptance-criteria artifact; CO performs synthesis evaluation.

## 19.4 Orchestration

Recipe: `council`
```
Assessors run in parallel (mustNotReceiveOutputFrom each other)
  PS independently: strategy and competitive positioning assessment
  RE independently: market and competitor evidence assessment
  AR independently: technical feasibility and infrastructure assessment
  ↓
CO receives all assessor outputs
CO aggregates: identifies consensus, surfaces disagreement, frames synthesis
  ↓
(evaluation) → source-coverage + dissent-preservation + rationale-clarity
  ↓
Mean assessor confidence < 70 → low-confidence areas explicitly named
```

## 19.5 Sub-Agents at Exhaustive Depth

At `depth: 'exhaustive'`, PS may delegate 2 sub-domain workers:
- Pricing-lens worker: pure pricing model analysis
- Positioning-lens worker: pure competitive positioning analysis

Workers return SubAgentResults to PS, which synthesizes before producing its assessor report.

## 19.6 Artifacts

### 1. Assessor Reports (one per assessor)

**Template per assessor:**
- Perspective (which lens this assessor applied)
- Key findings from this perspective
- Evidence cited
- Concerns identified
- Confidence level (0–100)
- Unanswered questions from this perspective

### 2. Council Synthesis

**Sections:**
- Question restated
- Areas of consensus across assessors
- Areas of genuine disagreement (preserved — not smoothed over)
- Confidence assessment per key dimension
- Recommendation (with clear source of authority: "consensus" vs "majority" vs "CO judgment where assessors disagreed")
- Residual uncertainty
- What additional information would change the synthesis
- Dissent preserved: "The assessor case against this recommendation was: ..."

## 19.7 Evaluation Contract

**Dimensions:** source-coverage (0.35, required), dissent-preservation (0.35, required), rationale-clarity (0.30)
**Threshold:** 75. **Evaluator:** CO (CO evaluates its own synthesis — the only outcome where the same capability generates and evaluates, justified because no independent evaluator is appropriate for a multi-perspective synthesis).

**Special gate:** mean assessor confidence < 70 → low-confidence areas must be explicitly named by section.

---

# PART 20 — OUTCOME: INVESTIGATE

## 20.1 PM Job

**Diagnose and explain a product problem from evidence, then design tests to validate hypotheses.**

A PM is facing a metric decline, an unexpected behavior, or a user complaint pattern.
They know something is wrong but not why. Investigate produces structured hypotheses
grounded in evidence, with testable experiments.

**When to use:**
- Activation rate declined from 34% to 26%
- Support volume spiked 40% — investigate root cause
- Revenue per user dropped after a feature launch
- User research consistently surfaces a complaint you can't explain
- A competitor moved and you need to understand the implications

## 20.2 Required Inputs

- Description of the symptom or problem (intent)
- Evidence: analytics data, user research, support tickets, product metrics (uploads)

## 20.3 Context-Driven Capability Selection (L2)

Symptom signals activate additional capabilities:

```
Funnel / activation / onboarding → UX, PS
Reliability / performance / latency → AR
Churn / retention / engagement / NPS → PS, RE
Support volume / complaint patterns → UX, QA
Market / competitive / external factors → RE, PS
```

**Always in Investigate:** RE (evidence-summary, hypothesis-set), QA (experiment-designs), PS (recommended-action), CO (synthesis)
**Conditionally added:** UX, AR per symptom signals above

## 20.4 Selected Capabilities (Example: Activation decline)

Symptom: "Activation dropped from 34% to 26%. Analytics CSV + interview notes provided."

**L1:** RE, QA, PS
**L2:** UX (funnel/activation signal), AR not activated (no reliability signal)
**L4:** CO required (research-first recipe + multi-lens synthesis)

**Selected: RE, QA, PS, UX, CO**

**Sub-agents at Deep:**
- RE delegates 3 workers: analytics worker, interview worker, spec-diff worker
- Each receives one evidence source; no cross-contamination

## 20.5 Orchestration

Recipe: `research-first` (evidence phase) → structured diagnosis phase
```
RE coordinates workers (parallel at Deep+) — each analyzes one evidence source
  ↓
RE synthesizes worker outputs → evidence summary
  ↓
UX, PS diagnose independently (mustNotReceiveOutputFrom each other's diagnosis)
  ↓
CO synthesizes multi-lens diagnosis
  ↓
QA designs experiments for the validated hypotheses
  ↓
PS recommends action
```

## 20.6 Artifacts

### 1. Evidence Summary
**Sections:** Evidence inventory, Key observations (sourced), Data gaps, Confidence by observation, Validation Log *(if externally verifiable claims — see §4.3)*

### 2. Hypothesis Set
**Critical gates (explicit, tested before evaluation passes):**
- Minimum 3 hypotheses
- Each hypothesis must have both supporting AND contradicting evidence considered
- Each hypothesis must be falsifiable (testable)

**Sections:** Hypothesis statement, Evidence for, Evidence against, Confidence (0–100), Falsification test

**Visual:** Hypothesis ranking (ranking-table)

### 3. Experiment Designs
**Sections:** One experiment design per hypothesis (minimum), Test method (A/B, user test, analytics, etc.), Success criteria, Minimum sample, Timeline, What confirms vs disconfirms hypothesis

**Critical gate:** at least one experiment must be executable within one week.

### 4. Recommended Action
**Sections:** Most likely root cause (with confidence), Immediate action, Experiments to run first, What to monitor, Decision trigger (when to escalate)

## 20.7 Evaluation Contract

**Dimensions:** hypothesis-quality (0.30, required), falsifiability (0.25, required), experiment-quality (0.25, required), evidence-quality (0.20)
**Threshold:** 75. **Evaluator:** QA. **Revisions:** 2 (Balanced+)

**Explicit gates (separate from dimension scoring):**
- Minimum 3 hypotheses (hard gate)
- Each hypothesis has both supporting and contradicting evidence
- Each hypothesis has a falsifiable test
- ≥ 1 experiment executable within one week

## 20.8 Knowledge Production

| Output | Memory class |
|---|---|
| Root cause hypotheses | ResearchFinding (with supporting/contra evidence IDs) |
| Evidence items from uploads | EvidenceItem (run-scoped → promoted) |
| Assumptions in hypotheses | Assumption (unvalidated, priority: high/critical) |
| Recommended action | Decision (with findingIds, acceptedAssumptionIds) |
| Open questions | UnresolvedQuestion |

---

# PART 21 — OUTCOME: CONTINUOUS / GOAL-BASED RESEARCH

## 21.1 PM Job

**Maintain ongoing intelligence on a specific question until sufficient evidence is gathered or a material change is detected.**

A PM wants to track something over time — competitor pricing, a specific market
signal, regulatory changes — and needs IdeaGate to continue researching until
enough evidence is present to act, without requiring them to re-run manually.

**Example:** "Track Competitor X's pricing and feature strategy until we have
enough evidence to update our competitive positioning."

## 21.2 Configuration

```typescript
{
  outcome: 'research',
  goal: {
    statement: "Detect material changes in Competitor X's product or pricing strategy",
    criteria: [
      { dimension: 'evidence-quality', threshold: 78 },
      { dimension: 'source-coverage', threshold: 75 }
    ],
    bounds: {
      maxIterations: 3,
      maxDurationMs: 600_000,    // 10 minutes per full run
      costCeilingUsd: 1.50,
      onExhausted: 'return-best-with-uncertainty'
    }
  }
}
```

## 21.3 Selected Capabilities

**Selected: RE, CO** (minimal — this is surveillance/tracking, not a full research brief)

**Delegation policy for Continuous Research:**
Continuous Research is a variant of `outcomeId: 'research'` and **inherits Research's
delegation policy** (§6.3). This is not a separate delegation architecture.

Sub-agent workers are used within each loop iteration only when the configured
`depth` and the Research delegation rules permit them. At depths where delegation
is not permitted (`quick`, `balanced`), RE performs the iteration itself without
workers. At `deep` depth, RE may use up to 2 workers per iteration (smaller than
a standalone Research run to keep each iteration efficient and within loop budget).

Workers produce EvidenceItems (run-scoped). Workers do not promote to PKS.
Run-scoped evidence from all iterations in a run is available to RE's retrieval
context in subsequent iterations (Document 4 §20.3).

**Rejected for continuous research:**
- PS: Strategic interpretation is a separate, subsequent task after material change detected
- QA: Evidence evaluation is performed by CO as part of the goal evaluation
- UX, AR: No UX or architecture dimension in change detection

## 21.4 Loop Execution Model

```
[Phase 4: triggered by scheduler OR user-initiated]

Iteration N:
  CO: frames retrieval focus for this iteration (what changed since last time?)
  RE: spawns 2 workers (product-change worker + pricing-change worker)
  Workers fetch current evidence from URLs, tool results
  RE synthesizes: What is new? What changed? Material or not?
  CO evaluates goal criteria deterministically (no LLM loop decision)

Termination checks (ordered precedence from Document 2 §13.2):
  1. Cancellation? → terminate
  2. Goal met (evidence-quality + source-coverage above thresholds)? → terminate: goal-met
  3. maxIterations reached? → terminate
  4. maxCost exceeded? → terminate
  5. maxDuration exceeded? → terminate
  6. Improvement < minimumImprovementPerIteration? → terminate early

On goal-met: Final Research Brief produced with full evidence chain
On bounds-exhausted: Best-available research produced with explicit uncertainty statement
```

## 21.5 Cross-Iteration Evidence

**Run-scoped evidence is NOT reset between iterations.** Evidence captured in
Iteration 1 is available to Iteration 2 via PKS retrieval (scoped to runId).
This is the mechanism that makes continuous research meaningful — the system
knows what it found last time.

```
Iteration 1: RE finds "Competitor X prices at ₹2,999/month for SMBs"
→ EvidenceItem(scope='run-scoped', runId=R1)

Iteration 2: RE context includes prior evidence from Iteration 1
→ RE can compare: "Pricing was ₹2,999; now I see ₹3,499 on the same page"
→ Material change detected → goalMet criteria checked → terminates if criteria met
```

## 21.6 Artifacts

### Per-Iteration Output (intermediate — not final)
- Evidence captured this iteration
- Changes detected vs prior iteration
- Materiality assessment
- Goal criteria evaluation

### Final Research Brief (on termination)

**On goal-met:**
Same structure as Research outcome (5 artifacts), but enriched by multi-iteration evidence.
Validation Log contains evidence items from all iterations.

**On bounds-exhausted:**
Research Brief with explicit uncertainty section:
- "After [N] iterations, we were unable to confirm [goal]. The evidence gathered suggests [partial conclusion]. To confirm, [additional action needed]."

## 21.7 Phase Dependency

→ *Implementation phase details for this outcome: see Part 32.*

---

# PART 22 — FAILURE MODES (ALL OUTCOMES)

## 22.1 Normalized Failure Taxonomy

| Failure type | Detection point | Behavior | User experience |
|---|---|---|---|
| **Insufficient context** | Normalization | OUTCOME_REQUIRES_CONTEXT; run rejected | "This outcome requires [context type]. Please upload [...]" |
| **Insufficient evidence** | Evaluation (source-coverage gate) | Artifact produced with weakened recommendation; validation log shows unverified claims | "Evidence coverage is below threshold. [action needed]" |
| **Contradictory evidence** | Retrieval (Stage 4: contradiction detection) | Both sides preserved; ContradictionRecord created; synthesis acknowledges conflict | Artifact shows: "Contradictory evidence was found. Both positions are presented." |
| **Stale knowledge** | PKS retrieval (freshness filter) | Stale items retrieved with staleness annotation; capability told knowledge may be outdated | Artifact notes: "This information was observed [N] days ago and may not reflect current state." |
| **Provider failure** | Agent Harness | Technical retry (×2) → fallback model → step failure → cascade | Mission Control: "A step failed. Retrying..." → if unrecovered: step flagged |
| **Context overflow (Tier 0)** | ContextManager.scope() | ContextContractUnsatisfiable thrown; step fails (non-retryable) | Mission Control: "Active project constraints exceed the model's context budget. [options]" |
| **Evaluation failure** | Evaluation step | Revision initiated (up to maxRevisions) | No user-visible action during revisions |
| **Revision exhaustion** | Post-revision | Artifact advanced with quality warning OR step failed (per onRevisionExhausted) | Desk: artifact flagged below threshold if advanced; Mission Control shows failed step if not |
| **Loop termination** | Between-iteration check | Best-available result returned with uncertainty | Artifact explicitly states termination reason and uncertainty |
| **Cancellation** | Cancellation signal | All completed artifacts preserved; partial run flagged | Desk shows: "Run cancelled. [N] of [M] stages completed." |
| **Budget exhaustion** | Budget watchdog | Current step completes; no new steps dispatched; run status: partial | Desk shows: "Budget limit reached. [N] stages completed." |
| **Artifact persistence failure** | Engine file write | Retry ×2; if fails: ENG_04; step failed | Mission Control: "Failed to save artifact. [retry/contact]" |
| **Memory promotion failure** | Promotion Engine | Logged; run remains complete; PKS not updated | No user-visible impact; logged for technical review |

## 22.2 Outcome-Specific Failure Priorities

| Outcome | Most critical failure to guard against |
|---|---|
| Build | Stage gate failure without useful artifact; evaluation failure cascades |
| Research | Insufficient evidence producing confident recommendation |
| Investigate | Fewer than 3 hypotheses; unfalsifiable hypotheses |
| Debate | Isolation violation contaminating positions |
| Council | Forced consensus overriding genuine assessor disagreement |
| Continuous | Loop not terminating; goal never met; stale evidence masquerading as current |

---

# PART 23 — ARTIFACT IMPROVEMENT IN STUDIO

## 23.1 The Studio Transformation Flow

```
SELECT (choose artifact in Desk)
  ↓
IMPROVE (targeted improvement with goal specification)
  (runs through the Engine with the improve step; produces a new artifact version)
  ↓
STRUCTURE (optional: extract structured data from narrative)
  (produces Layer 2 structured output for visualization)
  ↓
VISUALIZE (generate or update representations from structured data)
  (Layer 3: derived from Layer 2; carries derivedFromHash)
  ↓
EDIT (human editing of artifact text or visual nodes in Studio)
  (Document 4 §38.5: sets provenance.changeOrigin = 'human-authored')
  (Human edits are distinct from AI-generated changes in the PKS lineage)
  ↓
REGENERATE (re-run representations after human edit)
  (checks derivedFromHash; re-generates if Layer 2 content changed)
  ↓
SAVE / VERSION (new artifact version; increments version; stale propagation runs)
  (ArtifactImpactRecord re-evaluated; affected downstream artifacts may become stale)
```

**Human-edit provenance seam (from Document 4 §38.5):**
When a PM edits an artifact section in Studio, the resulting artifact version
carries `provenance.changeOrigin = 'human-authored'`. This is distinct from
`'ai-generated'` (standard AI output), `'evidence-driven'` (extracted from source),
and `'system-derived'` (stale propagation, system updates).

This seam enables future Mission Control to show "This section was last edited by
a human on [date]" and enables evaluation systems to distinguish AI reasoning
from human judgment. No additional implementation is required in V1 beyond
setting the `changeOrigin` field.

**Future real-time collaborative PM workspace (architectural seam):**
The Studio transformation flow is designed to accommodate future real-time
collaborative editing where multiple PMs work on the same artifact simultaneously.
The `changeOrigin` field and artifact versioning model already support this.
The specific collaboration protocol (operational transforms, CRDT, etc.) is a
future Document 6/7 concern; Document 5 preserves the seam without implementing it.

## 23.2 Representation Regeneration Policy

When an artifact is improved or edited, visual representations must be
re-generated if the underlying structured data changed. Representations carry:
```
derivedFromHash: hash of the structured layer content
sourceSection: sectionId that fed this representation
regenerationTrigger: 'on-artifact-change' | 'on-demand' | 'auto'
```

If `derivedFromHash` changes → representation is marked stale → Studio prompts
regeneration → user confirms → representation re-generated from updated structured data.

## 23.3 Representation Recommendations by Outcome

| Outcome | Recommended Representations |
|---|---|
| Build Discovery | Competitive quadrant, User needs heatmap, Market landscape flowchart |
| Build MVP Hypothesis | OST node structure (Phase 2) |
| Build UX Design | User flow (flowchart), Information architecture |
| Build Architecture | System architecture (Mermaid), ERD, Sequence diagram, Dependency graph |
| Build Implementation | Gantt chart, Dependency graph |
| Research | Competitor matrix (ranking-table), Positioning quadrant |
| Prioritize | Value/effort quadrant, Ranked list, Dependency graph |
| Plan | Gantt, Dependency graph, Story tree |
| Investigate | Hypothesis ranking, Evidence timeline (Phase 2) |
| Decide | Decision matrix, Options comparison |
| Council | Multi-assessor comparison (Phase 2) |
| Case Study | Decision timeline (Phase 2) |

---

# PART 24 — EXISTING PRODUCT USE CASES

IdeaGate is not only for creating new products from scratch. These are explicit
use cases for PMs working on established products:

| PM job | Outcome to use | Notes |
|---|---|---|
| Improve onboarding | Investigate (symptom) → Build (stages 8-9 only) | Two-run approach |
| Investigate churn | Investigate + uploaded analytics | Evidence-driven |
| Research competitor feature | Research (targeted) | Single-competitor deep research |
| Prioritize backlog | Prioritize + uploads | Upload current backlog |
| Validate a hypothesis | Research & Validate | Explicit sufficiency check |
| Review an existing PRD | Review | Upload PRD |
| Rework product strategy | Decide (with debate) | For high-stakes strategic pivots |
| Plan a release | Plan | Upload approved scope |
| Run a pricing decision | Council (pricing question) | PS + RE + AR + CO |
| Conduct a feature teardown | Case Study | Document competitive teardown |
| Build a case study | Case Study | Document past decision |
| Track competitor changes | Continuous Research | Goal-based loop |
| Investigate declining conversion | Investigate | Upload funnel data |
| Review an architecture decision | Decide or Council | Architecture-focused |

**Mission Composer must be outcome-oriented, not stage-oriented.** A PM selects
"Research" or "Investigate" — they never see "Stage 7" or "Stage 10."

---

# PART 25 — CROSS-OUTCOME COMPARISON

## 25.1 Routing Summary Matrix

Note: "Validation Log" column shows when validation logs are *likely* required due to the nature of the outcome. Actual requirement is claim-driven — see §4.3.

| Outcome | Capabilities | Instances | Sub-agents | Recipe | CO? | Loop? | Validation Log |
|---|---|---|---|---|---|---|---|
| Build | All 6 | 6 | No (V1) | structured-delivery (gate) | Yes (stage-gate) | No | Stages 1,2,5 |
| Case Study | RE, PS | 2 | No | structured-delivery | No | No | Required |
| Research | RE, PS, QA, CO | 4 | Yes (Deep+) | research-first | Yes | Optional (goal) | Required |
| Research & Validate | RE, PS, QA, CO | 4 | Yes (Deep+) | research-first | Yes | Optional | Required |
| Prioritize | PS, QA | 2 | No | structured-delivery | No | No | N/A |
| Plan | AR, PS, QA | 3 | No | structured-delivery | No | No | N/A |
| Review | Context-driven + QA + CO | 3+ | No | parallel-critique | Yes | No | Optional |
| Decide | PS, CO | 2 | No | structured-delivery | Yes (synthesis) | No | Optional |
| Debate | PS×2, CO | 3 | No | debate | Yes (judge) | No | Optional |
| Council | Context-driven + CO | 3-6 | Yes (Exhaustive) | council | Yes (aggregate) | No | Optional |
| Investigate | RE, QA, PS, ±UX, ±AR, CO | 4-6 | Yes (Deep+) | research-first | Yes | No | Required |
| Continuous | RE, CO | 2 | Yes (per iteration) | goal-based-research-loop | Yes (goal eval) | Yes | Claim-driven (§4.3) |

---

# PART 26 — IMPLEMENTATION STATUS

All implementation phase classification is consolidated in Part 32.

---

# PART 32 — IMPLEMENTATION STATUS REFERENCE (NON-AUTHORITATIVE)

> **This section is a non-authoritative implementation reference.**
> The architectural and outcome contracts in Parts 1–31 define what IdeaGate
> must do. Part 32 describes the current and planned implementation status only.
> Phase assignments reflect IdeaGate's active roadmap at the time of writing.
> If a phase assignment becomes outdated due to roadmap changes, the outcome
> contracts in Parts 1–31 remain valid. No outcome contract depends on a phase
> assignment in Part 32 — the contracts define the target; the roadmap governs
> the timeline.

## 32.1 Phase Vocabulary

| Label | Meaning |
|---|---|
| **CURRENT** | Implemented and working in V4.2-stable |
| **PHASE 1** | Buildable with current stack; planned for Mission 14–16 |
| **PHASE 2** | Requires PKS Inspection API, structured outputs, multi-agent refinements |
| **PHASE 3** | Requires SQLite, local embeddings, graph traversal |
| **PHASE 4** | Requires scheduling infrastructure, persistent evidence store |
| **FUTURE** | Architecture reserved; implementation not yet scoped |

## 32.2 Core Execution per Outcome

| Outcome | Core execution | Evaluation | PKS extraction | Sub-agents | Goal loop |
|---|---|---|---|---|---|
| Build | CURRENT | CURRENT | PHASE 2 | N/A | N/A |
| Case Study | CURRENT | CURRENT | PHASE 2 | N/A | N/A |
| Research | CURRENT | CURRENT | PHASE 2 | PHASE 1 | PHASE 1 |
| Research & Validate | PHASE 1 | PHASE 1 | PHASE 2 | PHASE 1 | PHASE 1 |
| Prioritize | CURRENT | CURRENT | PHASE 2 | N/A | N/A |
| Plan | PHASE 1 | PHASE 1 | PHASE 2 | N/A | N/A |
| Review | CURRENT (sequential) | CURRENT | PHASE 2 | N/A | N/A |
| Review (parallel-critique) | PHASE 2 | PHASE 2 | PHASE 2 | N/A | N/A |
| Decide | CURRENT | CURRENT | PHASE 2 | N/A | N/A |
| Debate | CURRENT | CURRENT | PHASE 2 | N/A | N/A |
| Council | PHASE 1 | PHASE 1 | PHASE 2 | PHASE 1 | N/A |
| Investigate | PHASE 1 | PHASE 1 | PHASE 2 | PHASE 1 | N/A |
| Continuous Research | PHASE 1 | PHASE 1 | PHASE 2 | PHASE 1 | PHASE 1 |
| Scheduled Continuous | PHASE 4 | PHASE 4 | PHASE 2 | PHASE 1 | PHASE 4 |

## 32.3 Visual Representations

| Representation | Tool | Outcomes | Status |
|---|---|---|---|
| Process flowchart (Mermaid) | Mermaid | All | CURRENT |
| Gantt / timeline | Mermaid | Build, Plan | CURRENT |
| Sequence diagram | Mermaid | Build Architecture | CURRENT |
| ERD / class diagram | Mermaid | Build Architecture | CURRENT |
| Quadrant chart | Mermaid | Prioritize, Research | CURRENT |
| Scoring/ranking table | recharts | Prioritize, Research | CURRENT |
| User flow | IdeaGate-native | Build UX | PHASE 1 |
| Information architecture | IdeaGate-native | Build UX | PHASE 1 |
| Dependency graph | IdeaGate-native | Plan, Build Backlog | PHASE 1 |
| Assumption Map | IdeaGate-native | Research, Investigate | PHASE 2 |
| OST node view | IdeaGate-native | Build MVP Hypothesis | PHASE 2 | → Document 7: node schema, renderer |
| Journey Map | IdeaGate-native | Investigate | PHASE 2 |
| Evidence Map | IdeaGate-native | Research, Investigate | PHASE 3 |
| Reasoning Graph Inspector | IdeaGate-native | All (PKS inspection) | PHASE 3 | → Document 7: graph traversal, UI |
| Real-time collaborative canvas | IdeaGate-native | All (Studio) | FUTURE | → Document 7: collaboration protocol (CRDT/OT) |

## 32.4 PKS and Knowledge Features

| Feature | Status |
|---|---|
| PKS knowledge extraction from artifacts | PHASE 2 |
| Implication record population | PHASE 2 |
| ArtifactImpactRecord population | PHASE 2 |
| Stale propagation notifications in Desk | PHASE 2 |
| PKS Inspection API (human knowledge browser) | PHASE 2 |
| Real-time evidence snapshot in Mission Control | PHASE 2 |
| Local embeddings for semantic retrieval | PHASE 3 |
| SQLite knowledge store | PHASE 3 |
| Graph traversal for decision lineage | PHASE 3 |
| Persistent evidence store (across runs) | PHASE 4 |
| Scheduled continuous research | PHASE 4 |

## 32.5 Studio Features

| Feature | Status |
|---|---|
| Artifact improvement (improve flow) | CURRENT |
| Artifact versioning | CURRENT |
| Manual editing (text) | CURRENT |
| human-authored changeOrigin tracking | PHASE 1 |
| Visual node editing (OST, ERD) | PHASE 2 |
| Stale artifact notifications in Studio | PHASE 2 |
| Real-time collaborative editing | FUTURE |

---

# PART 27 — WORKED EXECUTION EXAMPLES

## 27.1 Example: Investigate Activation Decline (Balanced depth)

**Input:** "Activation dropped from 34% to 26%. Don't know why."
**Uploads:** funnel analytics CSV, user interview notes (5 interviews), onboarding spec PDF

**Router decision:**
- Outcome: investigate
- Depth: balanced
- Context signals: funnel/activation → UX added; no reliability signal → AR not added
- Capabilities: RE, QA, PS, UX, CO

**ExecutionPlan steps:**
1. generate (RE): Evidence Summary from all uploads
2. evaluate (QA): Evidence quality check
3. generate (RE): Hypothesis Set (≥3, falsifiable)
4. evaluate (QA): Hypothesis quality check (falsifiability gate)
5. generate (UX): UX-perspective diagnosis
6. generate (PS): Strategic/behavioral diagnosis
7. synthesize (CO): Multi-lens synthesis
8. generate (QA): Experiment designs
9. generate (PS): Recommended action
10. evaluate (QA): Final artifact quality check

**PKS produced:** 3–5 EvidenceItems, 3–5 ResearchFindings, 2–3 Assumptions, 1 Decision (recommended action), 2–3 UnresolvedQuestions

## 27.2 Example: Pricing Decision Council

**Input:** "Before I take this pricing shift to leadership, stress-test it."
**Uploads:** Current pricing proposal, revenue breakdown by segment, competitor pricing research

**Router decision:**
- Outcome: council
- Depth: deep
- Context signals: pricing/positioning → PS; competitive data → RE; metering/billing → AR
- Capabilities: PS (with sub-domain workers at deep), RE, AR, CO

**Execution:** All assessors run concurrently (parallel-critique), receive same context,
cannot see each other's output. CO receives all three after completion.

**Key output:** CO Synthesis includes:
- Areas of consensus across PS, RE, AR
- Named disagreement: "RE and PS disagree on the timeline for pricing parity with Competitor X"
- Recommendation with explicit confidence
- Dissent section: "The case against this pricing shift is..."

## 27.3 Example: Debate on Market Entry

**Input:** "Should we launch in Singapore first or India first?"
**Config:** `orchestrationOverride: 'debate'` (maps to recipe `red-blue-debate`), `depth: 'deep'`

**Capabilities:** PS[blue] (Singapore case), PS[red] (India case), CO[judge]

**Critical execution check before dispatch:**
- PS[blue].contextRefs does NOT include any PS[red] step output
- PS[red].contextRefs does NOT include any PS[blue] step output
- mustNotReceiveOutputFrom enforced before context assembly

**What the debate produces that standard Decide does not:**
- PS[blue] must pre-empt PS[red]'s strongest arguments (argued as counter-strategies)
- PS[red] must do the same
- CO[judge] must identify whether one side made arguments the other failed to answer
- Residual uncertainty is quantified: "CO judges 65% confidence Singapore is correct, with the primary counter-argument being [X]"

---

# PART 28 — ENGINEERING INVARIANTS

1. **Every outcome solves a specific PM job.** Outcomes are not designed around AI capabilities; AI capabilities are designed around PM jobs.

2. **Capability selection is derived, not prescribed.** The Router derives required capabilities from the artifact contract and orchestration requirements. No outcome hard-codes a specific capability set.

3. **Sub-agents are never justified by "more is better."** Sub-agents are justified only where work naturally decomposes into independent parallel questions with bounded scope.

4. **CO is not mandatory for every outcome.** CO is selected only when the recipe requires synthesis, judgment, stage-gate coordination, or aggregation.

5. **Debate positions are never revised.** Only the CO synthesis may be revised during quality revision. Positions are immutable once generated.

6. **Council does not force consensus.** If assessors disagree, the disagreement is preserved in the synthesis. CO never averages away genuine dissent.

7. **Research never produces confident recommendations on insufficient evidence.** The critical evaluation gate (source-coverage below threshold → recommendation weakened) is non-negotiable.

8. **Investigate requires ≥3 falsifiable hypotheses.** This is an explicit gate, not a quality dimension weight. Fewer than 3 hypotheses fails evaluation before scoring.

9. **Validation Log applicability is claim-driven (§4.3), not artifact-type-driven.** An externally verifiable claim in any artifact requires a Validation Log entry. An artifact with no externally verifiable claims needs no Validation Log. Research, Discovery, Case Study, and Investigate outcomes are likely to produce externally verifiable claims — but a Research artifact that only contains analytical interpretation and no external citations needs no Validation Log entries.

10. **Depth controls rigor, not capability count.** Deep depth does not add new capabilities to outcomes that don't require them. It increases evaluation thresholds, worker counts (where permitted), and revision allowances.

11. **Loops are depth-independent.** A Quick research run can have a goal-based loop. A Deep research run does not automatically loop.

12. **Goal evaluation is deterministic.** No LLM decides whether a loop continues. The Engine evaluates goal criteria against EvaluationLogEntry records.

13. **ArtifactImpactRecords are populated post-promotion.** They are not available during run execution.

14. **Visual representations derive from structured data.** A representation cannot be generated without its corresponding Layer 2 structured data. Representations carry derivedFromHash and are regenerated when the underlying data changes.

15. **"Collaborate on this" is not an outcome.** IdeaGate outcomes are goal-oriented PM jobs, not open-ended AI conversations.

16. **CO is correctly excluded from casestudy, prioritize, and plan** per Document 2 Invariant §6.5 and routing summary matrix. This is not a deficiency — these outcomes use structured-delivery with no multi-perspective synthesis requirement.

17. **The Review outcome uses parallel-critique** as its authoritative recipe per Document 2 §7. The current single-sequential implementation is an implementation constraint noted in Part 32 — it does not change the contract.

18. **Validation Logs are claim-driven, not artifact-type-driven.** Any externally verifiable claim in any artifact warrants a Validation Log entry. Artifacts with no external claims need no Validation Log.

19. **Implementation phase labels do not belong in outcome contracts.** Outcome contracts specify what IdeaGate does; Part 32 specifies when. This separation keeps contracts stable as implementation timelines evolve.

20. **A Review concluding zero material gaps is a valid, passing result if supported by thorough examination.** The completeness dimension (0.40, required) measures thoroughness of coverage and soundness of conclusion, not the number of gaps found. Manufactured gaps to meet a minimum count reduce review quality.

21. **Relationship fields in knowledge production must be populated explicitly from structured output, not inferred from narrative co-occurrence.** The Promotion Engine extracts relationships from `StructuredArtifactOutput` fields; it does not use semantic proximity.

22. **Human-authored edits set `provenance.changeOrigin = 'human-authored'`** (Document 4 §38.5). This seam is preserved for future distinguishability of AI vs human reasoning in artifacts.

23. **CO-OCCURRENCE IS NOT LINEAGE.** A finding produced in the same stage as a decision does not automatically become a `findingIds` entry. A constraint produced after a decision does not automatically gain `derivedFromDecisionId`. Relationship fields are populated only when an authoritative relationship can be established from structured output, governed input, or another approved source. This is a trust requirement, not merely a technical preference.

24. **Visual representations are views of structured artifacts, not independent documents.** They carry `derivedFromHash`, `representationId`, `version`, and `stalenessStatus`. Visual meaning must derive from structured meaning. Human edits that affect structural meaning must update Layer 2 and trigger re-indexing.

25. **OST nodes should reference ResearchFinding and Assumption itemIds when those relationships are authoritatively established.** ERD entities/relationships should reference architecture Decision itemIds where the design was explicitly governed by a decision. IdeaGate must not manufacture a ResearchFinding or EvidenceItem merely to satisfy a reference. Absent evidence linkage must be surfaced as hypothesis-grade epistemic status, not silently omitted. Document 7 defines the schema implementation.

26. **The Validation Log is the one governing source for human verification of external claims.** PKS provenance is for the system. The Validation Log is for the PM. They are distinct, both necessary where applicable, neither a substitute for the other.

27. **Part 32 is a non-authoritative implementation reference.** Outcome contracts in Parts 1–31 define what IdeaGate must do. Phase assignments in Part 32 describe planned implementation timing. A change in roadmap timing does not change the outcome contract.

28. **The `red-blue-debate` recipe is the canonical internal name.** The PM-facing name is "Debate / Red Team–Blue Team." The RunConfig override key is `orchestrationOverride: 'debate'`. These three names refer to the same mechanism; `red-blue-debate` is the RecipeId.

---

# PART 29 — ACCEPTANCE CRITERIA

| # | Criterion | Verification |
|---|---|---|
| 1 | Build selects all 6 capabilities and derivation is explicit | Run Build; assert all six selected; assert derivation traces to artifact contract domain coverage |
| 2 | Prioritize selects only PS and QA | Run Prioritize; assert exactly {PS, QA} in capabilityInstances |
| 3 | Council selects selective specialists | Run Council with pricing question; assert UX excluded; run with UX question; assert UX included |
| 4 | Debate enforces isolation | Run Debate; assert PS[blue].mustNotReceiveOutputFrom includes PS[red].stepId and vice versa |
| 5 | CO absent from Prioritize and Plan | Assert no CO instance in Prioritize or Plan ExecutionPlan |
| 6 | Research returns "Investigate Further" when evidence is thin | Mock low source-coverage score; assert recommendation weakened |
| 7 | Investigate fails evaluation with <3 hypotheses | Generate 2 hypotheses; assert evaluation fails minimum-hypothesis gate |
| 8 | Loop termination respects goal-met precedence | Trigger goalMet and maxIterations simultaneously; assert terminationReason='goal-met' |
| 9 | Debate positions never revised | Simulate evaluation failure on PS[blue] output; assert no revision initiated on position; only CO synthesis revision permitted |
| 10 | Validation Log is produced for Research and Discovery | Run Research; assert ValidationLog with ≥1 entry per externally-verifiable claim section |
| 11 | Visual representations carry derivedFromHash | Generate architecture artifact; assert ERD representation carries derivedFromHash field |
| 12 | Cross-iteration evidence available in continuous research | Run 2 loop iterations; assert evidence from iteration 1 retrievable by RE in iteration 2 context |
| 13 | Stale knowledge annotated in context | Insert stale evidence (observedAt = 95 days ago, freshnessClass='time-sensitive'); assert staleness annotation appears in capability context |
| 14 | Council dissent preserved | Simulate PS and RE disagreeing in assessor reports; assert CO synthesis contains both positions; assert synthesis does not pick one without noting the disagreement |
| 15 | Review requires uploaded artifact | Run Review with no uploads; assert OUTCOME_REQUIRES_CONTEXT |

---

# PART 30 — DEFINITION OF DONE

## Document 5 is complete when:

**PM coverage:**
- [ ] All 9 canonical OutcomeIds have complete outcome contracts
- [ ] Three execution variants (Debate, Research & Validate, Continuous Research) are defined
- [ ] Each outcome has an explicit PM job statement
- [ ] Each outcome covers existing-product use cases

**Capability engineering:**
- [ ] Every outcome specifies selected capabilities with Layer 1–4 derivation
- [ ] Every outcome specifies rejected capabilities with rationale
- [ ] Sub-agent delegation rules defined for eligible outcomes (Research, Investigate, Council)
- [ ] Debate isolation contract specified and testable

**Orchestration:**
- [ ] All 6 orchestration recipes defined with execution flows
- [ ] Depth policy interaction specified per outcome
- [ ] Loop contract specified for Continuous Research
- [ ] CO role clarified per outcome (present or absent with rationale)

**Artifacts:**
- [ ] Artifact sections defined for all primary artifacts across all outcomes
- [ ] Validation Log is claim-driven (§4.3), not type-driven; requirements specified per claim type, not artifact type
- [ ] Visual representation registry specified per outcome
- [ ] Visual representation derivation from structured data specified

**Knowledge production:**
- [ ] Knowledge production table specified for all outcomes
- [ ] Memory classes per stage specified (Build has per-stage table)
- [ ] Promotion timing specified (post-run default; evidence capture exception)
- [ ] Relationship fields to populate specified per memory class per outcome

**Evaluation:**
- [ ] Evaluation dimensions, weights, and thresholds specified per outcome
- [ ] Evaluation gates specified where grounded in frozen contracts (e.g., minimumHypotheses from Document 2 Investigate contract); artificial gates removed
- [ ] Dissent-preservation requirement specified for Debate and Council

**Failure modes:**
- [ ] Failure taxonomy defined (all 13 failure types)
- [ ] Outcome-specific critical failures identified
- [ ] All failures have defined user-facing behavior

**Implementation status:**
- [ ] Phase classification consolidated in Part 32 (not embedded in outcome contracts)
- [ ] No current-implementation claim for unbuilt features

**Engineering:**
- [ ] 15 acceptance criteria stated with verification methods
- [ ] Worked execution examples provided (3 examples)
- [ ] Knowledge production tables include explicit Document 4 relationship fields
- [ ] ArtifactImpactRecord connection documented for each outcome's knowledge production
- [ ] Human-edit provenance seam documented in Studio section
- [ ] Implementation status consolidated in Part 32, not embedded in outcome contracts
- [ ] CO exclusion from casestudy, prioritize, plan documented with Document 2 invariant reference
- [ ] Review evaluation treats zero-gap conclusions as valid when examination is thorough
- [ ] Validation Log is claim-driven (§4.3) with no per-artifact/per-stage overrides anywhere in document
- [ ] red-blue-debate is the canonical recipe name; Debate is the PM-facing name
- [ ] OST and ERD semantic contracts defined (§3.4)
- [ ] RepresentationSpec carries stable identity fields (derivedFromHash, representationId, version, stalenessStatus)
- [ ] Part 32 marked as non-authoritative implementation reference
- [ ] Artifact layer model: Layer 1 not "always produced"; representation mode is artifact-contract-driven
- [ ] Complete-contract boundary defined in §1.3
- [ ] Document 7 handoff notes present for OST/ERD rendering, collaboration protocol, extraction schemas
- [ ] 28 engineering invariants stated

---

# PART 31 — DOCUMENT 6 HANDOFF

## What Document 6 May Assume

1. All 9 OutcomeId values are canonical and stable.
2. The Mission Composer presents outcomes in PM-native language, not system-internal names.
3. Depth levels (quick/balanced/deep/exhaustive) have defined product meanings per Part 8.
4. Sub-agents are invisible to users — they are implementation details; only the outcome and its artifacts are user-facing.
5. CO's role is never exposed as "Coordinator agent" — it is invisible to the PM.
6. "Stage 7" and "Stage 10" are never exposed in the UI — only the outcome and artifact names appear.
7. The Validation Log is an artifact appendix — Document 6 defines how it's presented in Desk.
8. Visual representations are navigable from Desk / Studio — Document 6 defines the interaction model.
9. The PKS Inspection API (Document 4 §36.2) provides the data for Mission Control knowledge panels.
10. Loop iteration progress is observable in Mission Control via events.jsonl events.

## What Document 6 Must Define

1. Mission Composer UI: how a PM specifies an outcome, depth, context, and optional goal
2. How each outcome is described to the PM (what they see when selecting it)
3. Desk artifact layout and navigation across the artifact set
4. Studio improve flow: how a PM selects an improvement goal and triggers improvement
5. Studio representation selection: how a PM selects a visual representation
6. Studio edit flow: how a PM edits an artifact section and how PKS change provenance is set
7. Mission Control: how the PM monitors execution in real time (PM-native language, not agent topology)
8. Mission Control: how the PM sees the reasoning graph (decision lineage, evidence chain)
9. Mission Control: how the PM sees and resolves contradictions
10. Validation Log: how it appears in Desk and what PM actions are available
11. Staleness indicators: how the PM is notified when an artifact is stale and what they can do
12. PKS knowledge browser: the human inspection experience for the decision/evidence history
13. The Continuous Research trigger model: how a PM starts, monitors, and terminates a continuous run

## What Document 6 Must NOT Redesign

1. The outcome model, OutcomeIds, or capability selection rules
2. The orchestration recipes
3. The PKS memory ontology or retrieval architecture
4. The evaluation policies
5. The artifact contract structure or validation log format
6. The knowledge production rules
7. The phase classification of any feature

---

*IdeaGate — Outcome Engineering Contracts*
*Document 5 of 7 | Version 1.3 — Authoritative*
*Status: Specification — Pre-Implementation*
*Depends on: Documents 1–4 (all FROZEN)*
*Feeds: Document 6 — Mission Composer UX Specification*

*v1.1 amendments preserved. v1.2: Validation Log single source of truth (claim-driven throughout);
red-blue-debate canonical recipe name; OST/ERD semantic contracts (§3.4); RepresentationSpec stable identity;
artifact layer model corrected; Review zero-gap valid outcome; Part 32 non-authoritative; §1.3 boundary.*
*This document translates the IdeaGate architecture into implementable product behavior.*
*AI generates; deterministic rules govern; every outcome solves a real PM job.*
