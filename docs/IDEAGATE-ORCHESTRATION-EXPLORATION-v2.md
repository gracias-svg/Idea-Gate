# IDEAGATE — ORCHESTRATION EXPLORATION v2 (HARDENED)
## Architectural Decision Framework · Pre-Implementation · Governance Edition
### Builds on v1 · August 2026 · NO IMPLEMENTATION AUTHORIZED

---

> This document HARDENS the v1 exploration. It does not replace it.
> Read v1 first. This document adds precision, classification, and governance.
>
> **Notation:**
> **[PROVEN]** = demonstrated in the running Build or Research product
> **[CONTRACT]** = established in D1–D7 and verified in the cross-document audit
> **[INFERENCE]** = architectural reasoning; requires explicit approval before use
> **[GAP]** = unresolved decision; blocks implementation until answered
> **[IMPL]** = implementation detail; does not affect product contracts

---

# SECTION 1 — HARDENED ARCHITECTURAL RULES

These 18 rules govern every remaining orchestration. They are derived from
observed failures during Research integration, not from theory.

```
1.  Build is the canonical shell reference. [PROVEN]
2.  Research is the validated non-Build extension reference. [PROVEN]
3.  The shell is immutable. Orchestrations provide data and methodology only. [PROVEN]
4.  Never create a second version of any existing shell surface. [PROVEN — cost 4 days]
5.  Never mix active-run workspace data from different runs. [PROVEN — cost 2 days]
6.  Never invent a recipe when an existing one can express the PM job. [CONTRACT — 6 recipes only]
7.  Never invent an agent when an existing capability instance can express it. [CONTRACT — 6 capabilities only]
8.  Never add complexity to make an orchestration appear more agentic. [PROVEN — produced fake behavior]
9.  Topology must reflect actual methodology and dependency structure. [CONTRACT]
10. Artifact count must reflect genuine intermediate outputs, not UI scaffolding. [CONTRACT]
11. Mission Control must visualize actual execution/topology data, not animation. [PROVEN]
12. Every artifact must have traceable lineage: input → step → output. [CONTRACT — D4 §19]
13. Every orchestration terminates in the canonical artifact/persistence pipeline. [PROVEN]
14. Every generated artifact enters the existing Desk → Studio flow unchanged. [PROVEN]
15. Every orchestration-specific graph uses the existing graph renderer + data contract. [PROVEN]
16. One active run owns one isolated workspace context. [PROVEN — cost 1.5 days to fix]
17. Existing working surfaces are never modified to solve an orchestration-specific problem. [PROVEN]
18. If the minimum safe change is not obvious, STOP and re-diagnose. [PROVEN — every regression]
```

---

# SECTION 2 — CONFIRMED CONTRACTS TABLE

What is already established in D1–D7 that the remaining orchestrations must
consume without modification.

| Concept | Authority | Value | Notes |
|---------|-----------|-------|-------|
| OutcomeIds (exactly 9) | D1, D2, D5 | build casestudy research review decide council investigate prioritize plan | No new IDs permitted |
| RecipeIds (exactly 6) | D2 §7, D5 §7.1 | structured-delivery research-first parallel-critique council red-blue-debate goal-based-research-loop | No new recipes |
| CapabilityIds (exactly 6) | D1, D2 | CO PS RE UX AR QA | No new capabilities |
| Artifact path pattern | D7 v1.2 | workspace/{projectId}/runs/{runId}/artifacts/{id}/v1.md | Canonical; D2/D3 require amendment to match |
| artifact-index.json schema | D7 | {runId, missionId, outcome, depth, intent, hero, createdAt, artifacts[]} | Same shape for all outcomes |
| SSE event vocabulary | D3 §17.2 | 27 named events in snake_case | Same events for all outcomes |
| Active workspace isolation | Shell Architecture doc | One outcome → one exclusive workspace context | Proven during Research |
| TaskSpec fields | D1 §29, D2 §12 | objective, framing, outputSchemaId, qualityDimensions, evidenceRequirementLevel | extractionHints added by D5 (needs D2 amendment) |
| EvaluationPolicy fields | D3 §9 | evaluatorCapabilityId, passThreshold, failureBehavior, maxRevisions | Per-step quality contract |
| Investigate context required | D2 §2.4 | OUTCOME_REQUIRES_CONTEXT — cannot run without uploaded evidence | Normalizer enforces |
| Review context required | D2 §2.4 | OUTCOME_REQUIRES_CONTEXT — cannot run without artifact to review | Normalizer enforces |
| Decide default recipe | D7 v1.2 (resolved conflict) | structured-delivery by default; red-blue-debate requires orchestrationOverride:'debate' | D2 §7.2 text requires amendment |
| Debate incompatible with casestudy | D2 §2.4 | ORCHESTRATION_INCOMPATIBLE | Normalizer enforces |
| Minimum 3 hypotheses (investigate) | D2 §15 | Hard numeric gate | Enforcement behavior = [GAP G6] |
| Council step type | D3 §14 | aggregate (distinct from synthesize) | Preserves dissent; does not unify voices |
| instanceRole (debate only) | D3 §7.2 | blue / red / judge | Only outcome using instance roles |
| CO selection rule | D2 §4 Layer 4 | CO selected when recipe requires synthesis/stage-gate | Not all outcomes need CO |
| Prioritize input semantics | D6 §30A.2 | Items may come from intent text OR uploads; no formal context attachment required | Distinct from Review/Investigate |

---

# SECTION 3 — INFERENCES REQUIRING APPROVAL

The following propositions appear architecturally correct but are NOT established
in D1–D7. Each requires explicit owner approval before it becomes a contract.
No implementation may proceed from an unapproved inference.

## I1 — Investigate step topology
**Proposed:** CO (frame) → RE (evidence summary) → PS (hypothesis set ≥3) → QA (experiment designs) → CO (recommendation)
**Why proposed:** Dependencies are genuine — hypotheses require evidence; experiments require hypotheses.
**Alternatives:** CO frame could be collapsed into RE step if framing is simple. Final CO step could be PS if synthesis is just recommendation.
**Approval needed:** Yes, before Investigate step-registry file is written.

## I2 — Prioritize step topology
**Proposed:** PS (ranked list) → QA (sequence + dependency validation)
**Why proposed:** Scoring and validation are genuinely different jobs; contract has no CO.
**Alternatives:** Single PS step that scores AND validates (faster; fewer artifacts).
**Approval needed:** Yes — single vs two steps is a product experience decision.

## I3 — Plan step topology
**Proposed:** AR (epic hierarchy) → AR (dependency map) → PS (sprint sequence) → QA (readiness check)
**Why proposed:** Decomposition and dependency mapping are both architectural judgment. AR twice with different objectives is architecturally supported (D3 allows multiple instances).
**Alternatives:** Collapse AR×2 into one step (simpler; loses separation of decomposition vs dependency reasoning).
**Approval needed:** Yes, specifically whether AR×2 is desired.

## I4 — Case Study step topology
**Proposed:** RE (evidence + context assembly) → PS (narrative — hero)
**Why proposed:** Gathering facts (RE) and constructing narrative (PS) are different capabilities.
**Alternatives:** Single PS step with evidence provided as context attachment (simpler if evidence is already curated).
**Approval needed:** Yes — affects artifact count and step complexity.

## I5 — Review capability selection signals
**Proposed:** Document type determines critics: PRD→PS+UX+QA, architecture→AR+QA, research→RE+PS+QA.
**Why proposed:** D2 §4 Layer 2 names context signals as a selection driver but doesn't enumerate Review's mapping.
**Approval needed:** Yes — this mapping is product behavior, not a contract detail.

## I6 — Council artifact representation
**Proposed:** Separate artifact per assessor position + one aggregated council recommendation (hero).
**Why proposed:** Independent readability of dissent; traceability of each assessor's reasoning.
**Alternative:** Single aggregated artifact containing all positions as sections.
**Approval needed:** Yes — this is Gap G2, escalated here. It determines artifact count for Council.

## I7 — Review/Council Mission Control graph shows parallel topology despite serial execution
**Proposed:** Nodes appear in fan-out/fan-in graph even though V1 executes them serially.
**Justification:** The dependency structure is genuinely parallel (critics don't depend on each other). The graph should represent dependency architecture, not execution timing.
**Risk:** If the PM watches Mission Control and sees one node light up at a time, the graph will look inconsistent with its topology claim.
**Approval needed:** Yes — this is a product honesty decision.

## I8 — Decide debate graph uses blue/red visual treatment
**Proposed:** PS[blue] and PS[red] nodes use color differentiation (blue accent / red accent) in the graph.
**Justification:** The adversarial nature of debate should be visible in the orchestration graph.
**Risk:** Requires the graph renderer to support node-level color variation.
**Approval needed:** Yes — depends on what the existing graph renderer supports.

## I9 — Prioritize Mission Control shows 2 nodes without visual padding
**Proposed:** Show 2 nodes honestly. No visual padding.
**Justification:** Fake complexity violates Rule 8 and the "no fake agents" principle.
**Risk:** A 2-node graph may look visually thin alongside Build's 15-stage graph.
**Approval needed:** Yes, as a product experience decision.

## I10 — Sprint implementation sequence
**Proposed:** Investigate → Prioritize → Case Study → Plan → Review → Council → Decide
**Justification:** Complexity order; reuses proven patterns before introducing new primitives.
**Clarification:** This is a RECOMMENDATION, not a contract. Each sprint must still trace the repository before implementation. "Three touch points" was an observation from Research, not a guarantee.
**Approval needed:** Yes, before any implementation begins.

---

# SECTION 4 — REMAINING GAPS (PRODUCT DECISIONS REQUIRED)

These are not answerable from the document set. Each blocks the indicated outcome.

| ID | Question | Blocks | Context |
|----|----------|--------|---------|
| G1 | What document type signals map to which Review critics? | Review | D2 §4 Layer 2 names context signals but doesn't enumerate the Review critic-selection matrix |
| G2 | Council: separate artifact per assessor, or sections within one document? | Council | Affects artifact count, Desk tree depth, and whether individual reasoning is independently accessible |
| G3 | Plan: AR twice (decompose + dependency), or one combined AR step? | Plan | Repeated-capability invocation is supported by D3 but whether it's desired here is a product decision |
| G4 | Review/Council: show parallel graph topology when V1 executes serially? | Review, Council | Honesty question — dependency-accurate vs timing-accurate visualization |
| G5 | Prioritize/Case Study: visual treatment for a 2-node Mission Control graph? | Prioritize, Case Study | Product polish vs no-fake-complexity principle |
| G6 | Investigate <3 hypotheses: retry (quality revision) or step failure? | Investigate | D2 §15 specifies the minimum but not the enforcement behavior when the gate is not met |
| G7 | Case Study: must the PM provide context, or can RE generate evidence from intent alone? | Case Study | Determines whether OUTCOME_REQUIRES_CONTEXT applies to casestudy |
| G8 | Decide (default, no debate): is the hero artifact the recommendation itself, or a decision-with-rationale document that includes the options analysis? | Decide | Affects artifact count and Desk representation |

---

# SECTION 5 — COMPLETE PLANNING MODEL PER OUTCOME

This applies the requested planning model to each outcome. Items are tagged [CONTRACT],
[INFERENCE], or [GAP] throughout.

---

## 5.1 INVESTIGATE

| Planning item | Answer | Tag |
|---|---|---|
| PM job | "Something is wrong. Find the cause and tell me how to test it." | PROVEN |
| Required input | Uploaded evidence (data, logs, user feedback, metrics). Cannot run without. | CONTRACT — D2 §2.4 |
| Agent/capability model | RE + PS + QA + CO | CONTRACT — D2 §4 |
| Topology | Sequential pipeline (evidence → hypotheses → experiments → recommendation) | INFERENCE — I1 |
| Dependencies | Evidence must precede hypotheses. Hypotheses must precede experiments. True dependency chain. | INFERENCE — I1 |
| Isolation required | No. Sequential = no isolation concern. | INFERENCE |
| Methodology | Root-cause analysis with adversarial hypothesis generation (generate competing explanations, not a single explanation) | INFERENCE from D2 §15 |
| Hard gate | ≥3 hypotheses required. Enforcement behavior = [GAP G6] | CONTRACT — D2 §15 |
| Intermediate artifacts | evidence-summary, hypothesis-set, experiment-designs | INFERENCE — I1 |
| Hero artifact | recommended-action | INFERENCE — I1 |
| Evidence/validation | Each hypothesis must cite a specific finding in evidence-summary. CO-OCCURRENCE IS NOT LINEAGE applies here most strictly. | CONTRACT — D4 §19 principle |
| Desk representation | 5 artifacts; hero = recommended-action | INFERENCE |
| Studio representation | Same TipTap editor. rawContent = artifact content. No Studio changes. | PROVEN |
| MC nodes | 5 (CO-frame, RE-evidence, PS-hypotheses, QA-experiments, CO-recommendation). Edges = execution dependency. | INFERENCE — I1 |
| Persistence / lineage | Canonical path. artifact-index.json. outcome = 'investigate'. | CONTRACT |
| Acceptance test | Evidence uploaded → 5 artifacts generated → recommended-action is hero → each hypothesis traces to evidence-summary finding | INFERENCE |
| Build regression | Build workspace untouched. Studio TipTap unchanged. MC shows Build graph during Build runs. | PROVEN |
| Research regression | Research workspace untouched when Investigate is active. | PROVEN |

---

## 5.2 PRIORITIZE

| Planning item | Answer | Tag |
|---|---|---|
| PM job | "I have a list. What order, and why?" | PROVEN concept |
| Required input | Items — may be in intent text OR uploaded. No formal context attachment required. | CONTRACT — D6 §30A.2 |
| Agent/capability model | PS + QA. No CO. | CONTRACT — D2 §4 |
| Topology | PS (score) → QA (validate sequence + dependencies) | INFERENCE — I2 |
| Dependencies | QA validation follows PS scoring. Genuine dependency. | INFERENCE |
| Isolation required | No. | INFERENCE |
| Methodology | Framework-based scoring (RICE/ICE/value-effort) + internal consistency validation | INFERENCE |
| Hard gate | None specified in contracts | CONTRACT — no gate defined |
| Intermediate artifacts | ranked-list | INFERENCE — I2 |
| Hero artifact | delivery-sequence | INFERENCE — I2 |
| Evidence/validation | QA checks internal consistency: do higher-ranked items depend on lower-ranked items? | INFERENCE |
| Desk representation | 2 artifacts. Hero = delivery-sequence. | INFERENCE |
| Studio representation | Same TipTap editor. No Studio changes. | PROVEN |
| MC nodes | 2 (PS-ranked, QA-sequence). Linear chain. No CO node. | INFERENCE + GAP G5 |
| Persistence / lineage | Canonical path. artifact-index.json. outcome = 'prioritize'. | CONTRACT |
| Acceptance test | Items provided → ranked-list scored → delivery-sequence validated → no circular dependencies | INFERENCE |
| Build regression | Same as above | PROVEN |
| Research regression | Same as above | PROVEN |

---

## 5.3 CASE STUDY

| Planning item | Answer | Tag |
|---|---|---|
| PM job | "Turn these facts into a narrative I can present." | PROVEN concept |
| Required input | Context with raw evidence/facts [GAP G7 — is this required or can RE generate from intent?] | GAP G7 |
| Agent/capability model | RE + PS. No CO, no QA. | CONTRACT — D2 §4 |
| Topology | RE (evidence assembly) → PS (narrative construction) | INFERENCE — I4 |
| Dependencies | Narrative follows evidence. True dependency. | INFERENCE |
| Isolation required | No. | INFERENCE |
| Methodology | Evidence → narrative arc. PS must have freedom to reorganize chronology. | INFERENCE — I4 |
| Hard gate | None specified. | CONTRACT — no gate defined |
| Intermediate artifacts | evidence-context-assembly | INFERENCE |
| Hero artifact | case-study-narrative | INFERENCE |
| Evidence/validation | Voice consistency. Single narrative voice throughout. | INFERENCE — I4 |
| Desk representation | 2 artifacts. Hero = case-study-narrative. | INFERENCE |
| Studio representation | Same TipTap editor. No Studio changes. | PROVEN |
| MC nodes | 2 (RE-evidence, PS-narrative). Linear chain. | INFERENCE + GAP G5 |
| Persistence / lineage | Canonical path. artifact-index.json. outcome = 'casestudy'. | CONTRACT |
| Acceptance test | Evidence provided → narrative produced as single-voice document → no structural repetition of RE evidence format in hero | INFERENCE |
| Build regression | Same as above | PROVEN |
| Research regression | Same as above | PROVEN |

---

## 5.4 PLAN

| Planning item | Answer | Tag |
|---|---|---|
| PM job | "I know what to build. Break it into executable engineering work." | PROVEN concept |
| Required input | Scope description (intent text) or PRD attachment [GAP G7 applies — is context required?] | GAP G7 |
| Agent/capability model | AR + PS + QA. No CO. AR is lead. | CONTRACT — D2 §4 |
| Topology | AR (epic hierarchy) → AR (dependency map) → PS (sprint sequence) → QA (readiness check) | INFERENCE — I3 + GAP G3 |
| Dependencies | Sprint sequence requires dependency map. Readiness check requires sprint sequence. | INFERENCE |
| Isolation required | No. | INFERENCE |
| Methodology | Technical decomposition first, then business-priority ordering within technical constraints | INFERENCE — I3 |
| Hard gate | QA readiness gate: are stories testable? Is anything under-specified? | INFERENCE |
| Intermediate artifacts | epic-hierarchy, dependency-map, sprint-sequence | INFERENCE |
| Hero artifact | sprint-sequence (with readiness annotations from QA) | INFERENCE |
| Evidence/validation | QA checks: each story independently testable; no circular dependencies; technical order respected | INFERENCE |
| Desk representation | 4 artifacts. Hero = sprint-sequence. | INFERENCE |
| Studio representation | Same TipTap editor. No Studio changes. | PROVEN |
| MC nodes | 4 (AR-epics, AR-deps, PS-sequence, QA-readiness). Linear with AR×2 noted. | INFERENCE + GAP G3 |
| Persistence / lineage | Canonical path. artifact-index.json. outcome = 'plan'. | CONTRACT |
| Acceptance test | Scope provided → epics decomposed → dependencies mapped → sprint sequence produced → QA annotations present | INFERENCE |
| Build regression | Same as above | PROVEN |
| Research regression | Same as above | PROVEN |

---

## 5.5 REVIEW

| Planning item | Answer | Tag |
|---|---|---|
| PM job | "I wrote something. Tell me what's wrong with it." | PROVEN concept |
| Required input | Artifact to review (uploaded or selected from workspace). Cannot run without. | CONTRACT — D2 §2.4 |
| Agent/capability model | Context-driven from {PS, UX, AR, QA} + CO | CONTRACT — D2 §4 |
| Topology | CO → [PS, UX, AR, QA in parallel-isolated] → CO (synthesis) | CONTRACT — D5 §16.4 (parallel-critique recipe) |
| Dependencies | Critics are mutually independent. CO synthesis depends on all critics. | CONTRACT — D5 §16.4 |
| Isolation required | **YES — load-bearing.** `mustNotReceiveOutputFrom` must be set for each critic. | CONTRACT — D3 §6 |
| Methodology | Each critic reviews the same artifact independently. CO synthesis combines without averaging. | CONTRACT — D5 §16 |
| Hard gate | CO synthesis must address every critic's finding. | INFERENCE |
| Context-critic mapping | [GAP G1 — not in contracts. Must be decided before Review is implemented.] | GAP G1 |
| Intermediate artifacts | ps-critique, ux-critique, ar-critique, qa-critique (whichever critics run) | INFERENCE |
| Hero artifact | review-synthesis | INFERENCE |
| Evidence/validation | Each critique finding must be independently addressable in the hero artifact | INFERENCE |
| Desk representation | Variable count (depending on critics selected) + 1 hero. | INFERENCE |
| Studio representation | Same TipTap editor. No Studio changes. | PROVEN |
| MC nodes | Fan-out/fan-in. CO → [critics] → CO. Parallel layout. Serial execution V1. | INFERENCE + GAP G4 |
| Persistence / lineage | Canonical path. artifact-index.json. outcome = 'review'. | CONTRACT |
| Acceptance test | Artifact uploaded → context signals select critics → critics isolated → synthesis produced → each critic finding addressed | INFERENCE |
| Build regression | Same as above | PROVEN |
| Research regression | Same as above | PROVEN |

---

## 5.6 COUNCIL

| Planning item | Answer | Tag |
|---|---|---|
| PM job | "I need multiple senior perspectives before I commit to this decision." | PROVEN concept |
| Required input | Question or decision context. May include supporting documents. | INFERENCE — no explicit contract clause |
| Agent/capability model | Context-driven capabilities + CO (aggregate, not synthesize) | CONTRACT — D2 §4, D3 §14 |
| Topology | CO → [Assessor 1, Assessor 2, Assessor 3 in parallel-isolated] → CO (aggregate) | CONTRACT — council recipe |
| Dependencies | Assessors are mutually independent. CO aggregation depends on all assessors. | CONTRACT |
| Isolation required | **YES — load-bearing.** Each assessor must be isolated. | CONTRACT |
| Synthesis mode | `aggregate`, NOT `synthesize`. Preserves dissent. Does not merge voices. | CONTRACT — D3 §14 step type |
| Hard gate | None specified explicitly in contracts. | CONTRACT — no gate defined |
| Assessor artifact format | [GAP G2 — separate artifact per assessor, or sections within one?] | GAP G2 |
| Hero artifact | council-recommendation (includes explicit section: "Where assessors disagreed") | INFERENCE — I6 |
| Evidence/validation | Aggregation must surface disagreements, not suppress them | CONTRACT — aggregate semantics |
| Desk representation | Depends on GAP G2 | GAP G2 |
| Studio representation | Same TipTap editor. No Studio changes. | PROVEN |
| MC nodes | Fan-out/fan-in. CO → [assessors] → CO. Parallel layout. Serial V1. | INFERENCE + GAP G4 |
| Persistence / lineage | Canonical path. artifact-index.json. outcome = 'council'. | CONTRACT |
| Acceptance test | Question provided → assessors generate independent positions → aggregation preserves dissent → disagreements explicitly noted | CONTRACT + INFERENCE |
| Build regression | Same as above | PROVEN |
| Research regression | Same as above | PROVEN |

---

## 5.7 DECIDE

| Planning item | Answer | Tag |
|---|---|---|
| PM job | "Two options. Which one, and why?" | PROVEN concept |
| Required input | Decision context (intent text). No formal attachment required by default. | INFERENCE — no contract clause requiring context |
| Agent/capability model | PS + CO | CONTRACT — D2 §4 |
| Topology (default) | PS (framing) → PS (options analysis) → CO (recommendation) | INFERENCE — I10 |
| Topology (debate override) | CO → [PS[blue] || PS[red]] → CO[judge] | CONTRACT — D3 §7.2 instanceRole |
| Dependencies (default) | Options analysis depends on framing. Recommendation depends on analysis. | INFERENCE |
| Dependencies (debate) | Blue and red are parallel-isolated. Judge depends on both. | CONTRACT — debate isolation |
| Isolation required | Default: No. Debate: **YES — absolute.** Blue must not see red, vice versa. | CONTRACT |
| Instance roles | debate only: blue / red / judge | CONTRACT — D3 §7.2 |
| Step type (debate) | judge (distinct from synthesize and aggregate) | CONTRACT — D3 §14 |
| Intermediate artifacts (default) | decision-framing, options-analysis | INFERENCE |
| Hero artifact (default) | recommendation | GAP G8 |
| Hero artifact (debate) | adjudication | INFERENCE |
| Evidence/validation | Recommendation must reference specific options analysis points | INFERENCE |
| Desk representation | Default: 3 artifacts. Debate: 4 (framing + blue + red + adjudication). | INFERENCE + GAP G8 |
| Studio representation | Same TipTap editor. No Studio changes. | PROVEN |
| MC nodes | Default: 3-node linear. Debate: adversarial fan-out/convergence with visual treatment. | INFERENCE — I8 + GAP G4 |
| Persistence / lineage | Canonical path. artifact-index.json. outcome = 'decide'. | CONTRACT |
| Acceptance test | Decision context → options analyzed → recommendation produced; with override: debate isolation verified → adjudication produced | INFERENCE |
| Build regression | Same as above | PROVEN |
| Research regression | Same as above | PROVEN |

---

# SECTION 6 — GOLDEN REGRESSION TEST PLAN

This plan is executed BEFORE every new orchestration sprint and AFTER every change.
It proves that the two golden references (Build, Research) remain intact.

## 6.1 Pre-implementation baseline (execute before sprint begins)

```
STEP 1 — Build baseline:
  a. Run a Build mission from Composer with any clear PM idea
  b. Mission Control shows Build 15-stage graph with Coordinator + 6 agents
  c. All 15 Build lifecycle stages complete
  d. Desk shows Build workspace ONLY (no Research folder, no new outcome folder)
  e. Click any Build artifact → right panel opens (Build-style)
  f. Navigate to Studio → Build artifact in TipTap editor with FormattingToolbar
  g. Improve works → Accept works
  h. Record: Build run completed / Desk isolated / Studio TipTap / MC Build graph ✓

STEP 2 — Research baseline:
  a. Run a Research mission from Composer
  b. Mission Control shows Research 5-node graph (not Build graph)
  c. Research artifacts complete: market-landscape, competitor-matrix, user-evidence,
     opportunity-assessment, research-intelligence-brief
  d. Desk shows Research workspace ONLY (no Build lifecycle items)
  e. Click any Research artifact → right panel opens (same Build-style)
  f. Navigate to Studio → Research artifact in TipTap editor with same toolbar
  g. Improve works → Accept works
  h. Record: Research run completed / Desk isolated / Studio TipTap / MC Research graph ✓

STEP 3 — Shell integrity:
  a. Confirm: WorkspaceExplorer.tsx not modified since last sprint [git status]
  b. Confirm: TipTapRenderer.tsx not modified since last sprint [git status]
  c. Confirm: GlobalStore.tsx useTipTapRenderer = true [grep check]
  d. Confirm: coordinator-v2.js / lifecycle-engine.js / llm.js untouched [git status]
  e. Record all 4 as CONFIRMED

PROCEED to implementation only if all three steps fully pass.
```

## 6.2 Post-implementation regression check (execute after every sprint)

```
STEP 1 — New orchestration works:
  a. Run a mission with the new outcome from Composer
  b. Mission Control shows [outcome]-specific graph
  c. Expected artifacts generated at canonical path
  d. Desk shows [outcome] workspace ONLY
  e. Click artifact → right panel
  f. Studio → TipTap editor with content
  g. Improve + Accept work
  
STEP 2 — Build regression:
  a. Repeat pre-implementation Build baseline steps 1a–1g
  b. CONFIRM: nothing has changed

STEP 3 — Research regression:
  a. Repeat pre-implementation Research baseline steps 2a–2g
  b. CONFIRM: nothing has changed

STEP 4 — Shell integrity:
  a. WorkspaceExplorer.tsx: not modified [git diff]
  b. TipTapRenderer.tsx: not modified [git diff]
  c. GlobalStore.tsx: useTipTapRenderer still true [grep]
  d. coordinator-v2.js / lifecycle-engine.js / llm.js: not modified [git diff]

STEP 5 — Workspace isolation:
  a. Run Build → Desk shows Build ONLY (no new outcome folder)
  b. Run Research → Desk shows Research ONLY (no new outcome folder)
  c. Run [new outcome] → Desk shows [new outcome] ONLY (no Build or Research folder)
  
A sprint is FAIL if any of Steps 1–5 report a negative result.
Do not patch forward on a regression. Diagnose and restore first.
```

---

# SECTION 7 — RECOMMENDED FIRST ORCHESTRATION

**INVESTIGATE — recommended as the first implementation after Research.**

**Evidence-based rationale:**

1. **Family B (research-first) is already proven by Research.** Investigate uses the same recipe, the same execution engine, and the same 5-step sequential structure. The step-registry file is the primary new element.

2. **Research's implementation artifacts are directly reusable.** The Mission Control Research node array can be adapted for Investigate by changing node IDs, labels, and capability assignments. The Desk workspace injection uses the same guard pattern with `outcome === 'investigate'`. Studio requires zero changes.

3. **Investigate introduces exactly one new element** not present in Research: the ≥3 hypothesis hard gate. This proves that the evaluation framework can enforce numeric quality constraints, which is architecturally valuable to validate before building more complex orchestrations.

4. **The open gap (G6) is bounded.** Whether <3 hypotheses triggers retry vs step failure is a decision, not an unknown. Either answer produces clear implementation. This is the lowest-risk gap in the entire remaining set.

5. **Investigate validates the context-required path.** Research does not require context. Investigate does. Proving both ends of the context-requirement spectrum early removes uncertainty for Review and Council, which also require context.

6. **It solves a clear PM problem.** A PM who has collected user complaints, support tickets, or analytics data has a real job to do — investigate the root cause. This is immediately useful, not speculative.

**What Investigate does NOT introduce:**
- No isolation requirements
- No instance roles
- No aggregate step type
- No context-driven capability selection
- No debate
- No loop termination logic

It is the cleanest possible next step.

---

# SECTION 8 — EXACT PRE-FLIGHT CHECKLIST FOR CLAUDE CODE

This checklist must appear at the start of EVERY implementation prompt.
Claude Code must complete every item and report confirmation before writing code.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IDEAGATE — HARD EXECUTION GATE (paste at top of every prompt)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 0 — GOVERNANCE READ (no code until complete):

  Read both governance documents:
  cat /Users/apple/idea-gate-ui-safe/docs/IDEAGATE-CANONICAL-SHELL-ARCHITECTURE.md
  cat /Users/apple/idea-gate-ui-safe/docs/IDEAGATE-ORCHESTRATION-EXTENSION-PLAYBOOK.md

  Report proof of reading:
    CANONICAL_SHELL_READ: YES
    PLAYBOOK_READ: YES
    ACTIVE_WORKSPACE_ISOLATION_RULE: [paste the rule text]
    ANTI_PATTERN_CREATING_RESEARCH_SIDEBAR: [paste the anti-pattern text]
    SHELL_LOCK_COMPONENTS: [list them]

STEP 1 — REPOSITORY IDENTITY (no code until complete):

  git -C /Users/apple/idea-gate-ui-safe rev-parse --show-toplevel
  git -C /Users/apple/agent-zero-data/workdir/ui-layer rev-parse --show-toplevel

  Report:
    CLI_ENGINE_REPO: /Users/apple/idea-gate-ui-safe (YES/NO)
    UI_LAYER_REPO: /Users/apple/agent-zero-data/workdir/ui-layer (YES/NO)
    GOVERNANCE_DOCS_IN_CLI_ENGINE: YES/NO
    GOVERNANCE_DOCS_IN_UI_LAYER: YES/NO

STEP 2 — GOLDEN REGRESSION BASELINE (no code until complete):

  Run these checks and report:

  a. Build: curl -s http://localhost:3000/desk >/dev/null && echo 200 || echo FAIL
  b. Research: cat /Users/apple/idea-gate-ui-safe/.v3-last-run-info.json | \
       node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{
         const r=JSON.parse(d); console.log('last_outcome:', r.outcome, 'hasArtifacts:', r.hasArtifacts)
       })"
  c. Shell: git -C /Users/apple/agent-zero-data/workdir/ui-layer diff HEAD -- \
       src/components/shared/WorkspaceExplorer.tsx \
       src/components/improve/TipTapRenderer.tsx | wc -l
       (must be 0 — these files must not have uncommitted changes)

  Report:
    DESK_HTTP_200: YES/NO
    LAST_RUN_OUTCOME: [value]
    SHELL_COMPONENTS_CLEAN: YES/NO (0 diff lines)

STEP 3 — DECLARE CHANGE BOUNDARY (required before trace):

  State:
    GOAL: [one sentence]
    FILES_ALLOWED_TO_CHANGE: [list — max 3]
    FILES_PROTECTED: [list — include all shell components]
    COMPONENTS_REUSED: [list existing components by name]
    NEW_ORCHESTRATION_ELEMENTS: [list only genuinely new things]
    ACCEPTANCE_TEST: [one sentence — browser-verifiable]
    REGRESSION_TEST: [Build and Research baselines pass]

STEP 4 — TRACE BEFORE EDIT (for every new orchestration):

  Before writing the step-registry file, read:
  cat /Users/apple/idea-gate-ui-safe/src/core/outcome-runtime/step-registry/research.js
  
  Confirm the pattern you are adapting and report:
    RESEARCH_STEP_PATTERN_READ: YES
    EXTENDING_VS_RECREATING: EXTENDING

ONLY AFTER ALL 4 STEPS ARE REPORTED: begin implementation.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

# SECTION 9 — WHAT MUST BE DECIDED BEFORE IMPLEMENTATION BEGINS

The following gaps block specific orchestrations. They do not need to be resolved
simultaneously — only the gaps blocking the first orchestration (Investigate) must
be resolved before its sprint begins.

**Gaps blocking Investigate (first sprint):**
- G6: <3 hypotheses → retry or step failure? ← **must be decided first**

**Gaps blocking Prioritize, Case Study (second sprint):**
- G5: 2-node graph visual treatment
- G7: Case Study — is context required?

**Gaps blocking Plan (third sprint):**
- G3: AR×2 or single AR step?
- G7: Plan — is context required?

**Gaps blocking Review (fourth sprint):**
- G1: Context signal → critic capability mapping ← **most complex gap**
- G4: Parallel topology in serial execution

**Gaps blocking Council (fifth sprint):**
- G2: Assessor position as separate artifact or section?
- G4: Same as Review

**Gaps blocking Decide (sixth sprint):**
- G8: Hero artifact in default (non-debate) decide
- I8: Debate graph blue/red visual treatment

**Inferences requiring approval before any sprint:**
- I1: Investigate topology
- I2: Prioritize topology
- I10: Sprint sequence (as recommendation, not contract)

---

# SECTION 10 — SUMMARY: WHAT IS FIXED, WHAT VARIES, WHY

```
FIXED (the IdeaGate product shell):
  Composer surface and behavior
  WorkspaceExplorer component and WorkspaceNode[] contract
  TipTap Studio editor and FormattingToolbar
  Mission Control graph renderer
  Artifact persistence pipeline (canonical path + artifact-index.json)
  SSE event vocabulary (27 events)
  Active workspace isolation mechanism
  Improve/Accept workflow

VARIES (per orchestration — the contents, not the package):
  OutcomeId and Recipe selection
  Which capabilities participate and how many instances
  Step topology (sequential / parallel-isolated / adversarial)
  Isolation requirements (none / critic / debate)
  Step artifact contracts (IDs, PM names, hero designation)
  Evaluation dimensions per step (from TaskSpec.qualityDimensions)
  Mission Control node/edge data (IDs, labels, topology shape)
  WorkspaceNode[] data (IDs, labels, phaseColor, hierarchy)
  Evidence/validation model (hard gates where contractually specified)

WHY EACH TOPOLOGY FITS ITS OUTCOME:
  Investigate: sequential because hypotheses must emerge from evidence, not precede it
  Prioritize: 2-step because scoring and consistency-checking are distinct jobs
  Case Study: 2-step because evidence gathering and narrative construction are different capabilities
  Plan: 4-step because technical decomposition and business sequencing genuinely conflict
  Review: parallel-isolated because critic independence is the product
  Council: parallel-isolated-aggregate because preserved dissent is the product
  Decide: sequential default / adversarial on override because both jobs are legitimate

THE GOVERNING TEST:
  "Would a senior PM recognize this topology as the right way to structure
   this type of work — or does it look like we added steps to seem agentic?"
  If the latter: simplify.
```

---

*IDEAGATE-ORCHESTRATION-EXPLORATION-v2.md · August 2026*
*NO CODE. NO IMPLEMENTATION. DECISIONS AND APPROVALS FIRST.*
*The first implementation sprint begins only after Section 9 gaps are resolved.*
