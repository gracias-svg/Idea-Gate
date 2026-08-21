# IDEAGATE — INVESTIGATE ORCHESTRATION ARCHITECTURE PLAN V2
## Authoritative · Hardened · Single Source of Truth · August 2026
## Status: AWAITING OWNER APPROVAL — No code until decisions in §12 are resolved

---

> **This document supersedes the V1 Investigate Plan.**
> Read this, not V1, before any implementation discussion.
>
> **Notation (applied to every claim):**
> **[CONTRACT]** — established in D1–D7, verified in cross-document audit
> **[PROVEN]** — demonstrated in the running Build or Research product
> **[INFERENCE]** — architectural reasoning; requires explicit owner approval
> **[GAP]** — unresolved product decision; blocks implementation until answered
> **[IMPL]** — implementation detail; does not affect contracts

---

# §1 — PURPOSE AND GOVERNING PRINCIPLES

## 1.1 What Investigate is

Investigate is a **genuine evidence-to-diagnosis agentic workflow**. It is not a multi-agent document generator and not a visual simulation of agentic behaviour.

A PM starts an Investigate mission when something observable is happening in their product and they do not know why. The PM supplies evidence. The system investigates the evidence, generates competing falsifiable hypotheses, diagnoses the problem through independent specialist lenses, designs experiments to test hypotheses, and delivers a decision-ready recommended action. Every output is traceable to its evidence source. Every hypothesis is testable. Every recommendation references the hypothesis it resolves.

The agentic value comes from:
- A coordinator that frames the investigation against the actual mission intent
- An investigation lead (RE) that decomposes evidence and can delegate to bounded specialist workers at sufficient depth
- Bounded sub-agents that independently investigate evidence domains without access to each other's findings
- Isolated diagnostic lenses that diagnose the same evidence independently, preventing anchoring
- QA gates that force revision when quality thresholds are not met — actual retry loops, not cosmetic
- Deterministic lineage that connects every conclusion to a specific evidence finding

## 1.2 The shell is unchanged

```
Composer → Desk/WorkspaceExplorer → Studio/TipTap → Mission Control
```

These four surfaces are not modified for Investigate. Investigate provides orchestration-specific data (nodes, edges, WorkspaceNode[], artifact content, SSE events) that flows through the existing shell. [PROVEN — established during Research integration]

## 1.3 Build and Research remain protected regression baselines

Every Investigate implementation decision must be compatible with Build and Research continuing to work exactly as they do today. If any implementation change breaks either baseline, implementation stops. No patches forward across a regression. [PROVEN — cost of violating this: 4 days during Research integration]

---

# §2 — WHAT THE CONTRACTS ESTABLISH (READ-ONLY)

Nothing in this section is subject to architectural debate. It is established fact.

| Fact | Source | Value |
|------|--------|-------|
| OutcomeId | D1, D2, D5 | `'investigate'` |
| Recipe | D2 §7 | `research-first` |
| Domain capabilities | D2 §4 | RE, QA, PS (UX and AR may be added via Layer 2 context signals) |
| CO participation | D2 §4 Layer 4 | Required — research-first recipe includes CO |
| Context requirement | D2 §2.4 | Required — cannot run without uploaded evidence |
| Minimum hypotheses | D2 §15 | ≥3. Hard gate. |
| Sub-agent eligibility | D3 §11 | Research/Investigate eligible for delegation at `deep` and `exhaustive` depth |
| Sub-agent depth gate | D3 §11 | Sub-agents only at deep/exhaustive — NOT at quick or balanced |
| Sub-agent constraints | D3 §11 | Bounded scope · Cannot write PKS directly · Cannot cross isolation boundaries · Max 1 delegation level (no sub-sub-agents) · maxWorkers set in DelegationPolicy per plan |
| Sub-agent scope | D3 §11 | Inherit parent scope — receive same context the parent RE Lead had access to, no more |
| Sub-agent results | D3 §11 | SubAgentResult returned to parent RE Lead — not written directly to artifact store |
| Delegation step type | D3 §14 | `delegate` |
| Synthesis step type | D3 §14 | `synthesize` |
| Evaluation step type | D3 §14 | `evaluate` |
| Isolation mechanism | D3 §6 | `mustNotReceiveOutputFrom` — diagnostic lenses must not see each other's outputs |
| `dependsOn` vs `receivesOutputFrom` | D3 §4.2, §6 | Distinct: `dependsOn` = scheduling gate; `receivesOutputFrom` = context gate; `mustNotReceiveOutputFrom` = isolation gate |
| EvaluationPolicy | D3 §9 | `evaluatorCapabilityId`, `passThreshold`, `failureBehavior` (`revise-then-fail` or `advance-with-warning`), `maxRevisions` |
| CO-OCCURRENCE IS NOT LINEAGE | D4 Part 34A | Relationships require explicit artifact ID reference — never proximity inference |
| Validation Log | D5 §4.3 | Claim-driven, not type-driven. Only where externally verifiable claims exist. |
| Artifact persistence path | D7 v1.2 | `workspace/{projectId}/runs/{runId}/artifacts/{id}/v1.md` |
| Artifact confidence cap | D4 §19.1 | Model-generated content: confidence ≤ 50 |
| Active workspace isolation | Shell Architecture doc | One active run → one exclusive workspace context |
| SSE event vocabulary | D3 §17.2 | 27 canonical events, snake_case |
| PM-native event labels | D3 §17.3 | `activityText` per event — never expose step IDs, model names, capability IDs |

---

# §3 — WHAT MAKES INVESTIGATE GENUINELY AGENTIC

This section exists to distinguish real agentic execution from cosmetic simulation. Every item must be traceable to actual runtime behavior, not animation.

## 3.1 The coordinator enforces mission scope

CO frames the investigation before any evidence is reviewed. CO produces a mission framing that defines: the investigation question, the scope of acceptable hypotheses, and the constraints under which the investigation operates. All downstream steps receive this framing as part of their context. The framing is not advisory — it is the bounded specification each specialist works within.

[INFERENCE — CO as "framing" step is architectural; the contract establishes CO's presence but not a dedicated framing step] → **[REQUIRES APPROVAL]**

## 3.2 RE Investigation Lead performs real evidence analysis

The RE Lead invokes the LLM against the actual uploaded evidence documents. This is a real LLM call with the evidence content in context. The RE Lead identifies evidence domains (groupings of evidence by type, source, or theme) and, at deep/exhaustive depth, dispatches bounded workers to investigate each domain.

The RE Lead does NOT simply pass evidence to sub-agents and wait. It performs its own initial evidence scan to identify domain boundaries before delegation. [INFERENCE] → **[REQUIRES APPROVAL]**

## 3.3 Bounded sub-agents perform real parallel investigation

At deep and exhaustive depth, the RE Lead dispatches RE sub-agents as bounded workers. Each sub-agent:
- Receives a `SubAgentTask` specifying its evidence domain scope
- Performs a genuine LLM invocation against that scoped evidence subset
- Returns a structured `SubAgentResult` to the parent RE Lead
- Does NOT write to PKS or artifact store directly [CONTRACT — D3 §11]
- Has no visibility into other sub-agents' work [CONTRACT — isolation per scope]

The RE Lead's synthesis step then combines all `SubAgentResult[]` into the evidence-summary artifact. This synthesis is a separate LLM invocation that integrates the sub-agents' findings, not a text concatenation.

**Sub-agents are not graph nodes that light up.** They are real executor dispatches that produce real outputs. Mission Control shows sub-agent activity because `step_started` and `step_complete` SSE events are emitted for each sub-agent execution. [CONTRACT — D3 §17.2 delegation events: `delegation_started`, `worker_started`, `worker_completed`, `delegation_completed`]

## 3.4 Diagnostic lenses produce genuinely independent analyses

Each diagnostic lens (hypothesis generation, strategic diagnosis, UX diagnosis where context warrants) runs in isolation from the other lenses. Each receives:
- The evidence-summary [shared context — all lenses see this]
- The CO framing [shared context]
- Each lens does NOT receive the other lenses' outputs [isolation via `mustNotReceiveOutputFrom`]

This isolation is not cosmetic. If the hypothesis lens sees the strategic diagnosis before generating hypotheses, it anchors on that framing and produces derivative hypotheses, not independent ones. The `mustNotReceiveOutputFrom` constraint prevents this at the runtime level [CONTRACT — D3 §6].

## 3.5 QA gates create real evaluation loops

Three QA evaluation gates exist in the topology. When a gate fails:
- The Engine identifies the failing quality dimensions
- A revision is requested from the previous step (the LLM is called again with the evaluation gaps as context)
- This continues up to `EvaluationPolicy.maxRevisions`
- After exhausting revisions: `failureBehavior` determines whether to fail the step or advance with warning [GAP G6]

The ≥3 hypotheses gate at Gate 2 is the most important. If the hypothesis set contains fewer than 3 hypotheses, the QA evaluator returns `passed: false` with `gaps: ["Insufficient hypothesis count — 3 minimum required"]`, and the Engine requests a revision. [CONTRACT for the gate; [INFERENCE] for how it's implemented as EvaluationPolicy]

## 3.6 Lineage is machine-verifiable, not narrative

Every downstream artifact references its upstream artifact by ID in its content. The TaskSpec for each step includes an explicit requirement to reference upstream artifacts by ID. The QA Final Gate validates this lineage exists before the master artifact can be produced. [INFERENCE — the mechanism; CONTRACT for the CO-OCCURRENCE IS NOT LINEAGE principle]

## 3.7 Mission Control is driven by runtime events

Every node status transition in Mission Control comes from an SSE event emitted by the executor. `step_started` makes a node RUNNING. `step_complete` makes it COMPLETE. `worker_started` activates a sub-agent node. `delegation_completed` marks the delegation phase as done. Nothing is pre-drawn or simulated. [CONTRACT — D3 §17.2; PROVEN — Research Mission Control works this way]

---

# §4 — FULL TOPOLOGY WITH DEPTH BEHAVIOUR

## 4.1 What depth changes (real behaviour, not node count)

Depth changes the following real execution characteristics:

| Characteristic | Quick | Balanced | Deep | Exhaustive |
|---|---|---|---|---|
| Evidence analysis | Combined (RE Lead only) | Separate evidence step | RE Lead + 2–3 sub-agents | RE Lead + 4–5 sub-agents |
| Hypothesis generation | Combined with evidence | Separate RE/PS step | Separate + QA gate before | Separate + QA gate before + extended |
| Diagnostic lenses | 1 (RE/PS combined) | 2 (RE/PS + PS strategy) | 2–3 (+ UX if context warrants) | 3+ (+ UX + AR if context warrants) |
| QA gates | 1 (final only) | 2 (diagnostic + final) | 3 (evidence + diagnostic + final) | 3 (evidence + diagnostic + final with stricter thresholds) |
| Sub-agents | None [CONTRACT] | None [CONTRACT] | 2–3 [CONTRACT-eligible] | 4–5 [CONTRACT-eligible] |
| Evaluation thresholds | passThreshold: 65 | passThreshold: 70 | passThreshold: 75 | passThreshold: 80 |
| maxRevisions per gate | 1 | 2 | 2 | 3 |
| Total steps | ~5 | ~9 | ~14 | ~18 |
| Mission Control nodes | 5–6 | 9–10 | 13–16 | 17–20 |

These are [INFERENCE] for the specific numbers. The direction (deeper = more rigorous, more evidence coverage, stricter thresholds) is correct and well-grounded.

## 4.2 Quick Depth Topology

```
CO [frame-investigation]
  ↓
RE [evidence-and-hypotheses] — combined step: review evidence + generate ≥3 hypotheses
  ↓
QA [evaluate: ≥3 hypotheses · evidence grounding · each hypothesis falsifiable]
  ↓
CO [synthesis: diagnostic findings + experiment outline + recommendation]
  ↓
QA [final-gate: recommended action has clear lineage · experiments are falsifiable]
  ↓
★ investigate-report (hero)
```

**Artifacts produced (Quick):**
- `evidence-hypotheses` — combined evidence review + ≥3 hypotheses
- `diagnostic-synthesis` — CO's combined diagnosis + recommendation
- `investigate-report` — hero, decision-ready synthesis

**Real behavioral difference from Balanced:** No separate evidence step. No isolated lenses. Single QA gate. RE Lead handles everything in one combined invocation. Faster, lower coverage.

## 4.3 Balanced Depth Topology

```
CO [frame-investigation]
  ↓
RE [evidence-review] — RE Lead reviews all uploaded evidence; produces evidence-summary
  ↓
QA [evidence-gate] — validates evidence quality and completeness
  ↓ (independent, `mustNotReceiveOutputFrom` each other)
RE/PS [hypothesis-set]     PS [strategic-diagnosis]
  (depend on: evidence-summary + CO framing)
  (isolated from: each other)
  ↓
CO [multi-lens-synthesis] — integrates hypothesis-set + strategic-diagnosis
  ↓
QA [validation-gate] — ≥3 hypotheses · each references evidence · diagnosis coherent
  ↓
QA [experiment-designs] — one experiment per hypothesis, falsifiable
  ↓
PS [recommended-action] — which experiment first, expected outcomes
  ↓
QA [final-gate] — recommendation traces to hypothesis · experiments testable
  ↓
★ investigate-report (hero)
```

**Artifacts produced (Balanced):**
- `evidence-summary` — structured evidence analysis
- `hypothesis-set` — ≥3 competing hypotheses with evidence references
- `diagnostic-findings` — CO synthesis of all lenses
- `experiment-designs` — one per hypothesis
- `recommended-action` — prioritized recommendation
- `investigate-report` — hero

**Real behavioral difference from Quick:** Separate evidence step + separate hypothesis step = more rigorous coverage. Two isolated diagnostic lenses. Two QA gates. Still no sub-agents [CONTRACT].

## 4.4 Deep Depth Topology

```
CO [frame-investigation]
  ↓
RE Lead [investigation-lead]
  delegates (bounded, parallel) to:
  ├── RE Sub-agent A [evidence-domain-A]
  ├── RE Sub-agent B [evidence-domain-B]
  └── RE Sub-agent C [evidence-domain-C]
  ↓ (sub-agents return SubAgentResult[] to RE Lead)
RE Lead [evidence-synthesis] — synthesize step combining SubAgentResults
  ↓
QA [evidence-gate] — stricter threshold than Balanced
  ↓ (independent, isolated from each other)
RE/PS [hypothesis-set]    UX [ux-diagnosis]*    PS [strategic-diagnosis]
  (all depend on: evidence-summary + CO framing)
  (all isolated from: each other via mustNotReceiveOutputFrom)
  ↓
CO [multi-lens-synthesis] — integrates all three lenses
  ↓
QA [validation-gate] — stricter threshold + UX findings integrated
  ↓
QA [experiment-designs]
  ↓
PS [recommended-action]
  ↓
QA [final-gate]
  ↓
★ investigate-report (hero)
```

*UX only when Layer 2 context signals indicate user-experience evidence (user feedback, session recordings, usability data, support tickets about UX). [CONTRACT — D2 §4 Layer 2]

**Real behavioral difference from Balanced:** Sub-agents provide 3× coverage of evidence domains in parallel. Evidence synthesis is a dedicated LLM synthesize step. Three isolated diagnostic lenses. Stricter thresholds.

**DelegationPolicy at Deep:**
```typescript
delegationPolicy: {
  delegationEligible: true,
  maxWorkers: 3,
  workerDepthConstraint: 'one-less',    // sub-agents run at balanced, not deep
  workersMayNotSpawnWorkers: true,       // no sub-sub-agents [CONTRACT]
}
```

## 4.5 Exhaustive Depth Topology

Deep topology with:
- Up to 5 sub-agents (DelegationPolicy.maxWorkers = 5)
- Additional context-driven lenses (AR if technical infrastructure evidence exists)
- Stricter QA thresholds (passThreshold: 80)
- maxRevisions: 3 per gate
- Extended experiment designs (2 experiments per hypothesis, not 1)
- Additional follow-up investigation thread if initial evidence gate score is below 65

[INFERENCE — entire Exhaustive topology requires approval; outlined here for completeness]

---

# §5 — REAL SUB-AGENT EXECUTION MECHANICS

This section defines HOW sub-agents execute, not merely that they exist.

## 5.1 What a sub-agent is

A sub-agent is a bounded RE capability instance dispatched by the RE Lead at a `delegate` step [CONTRACT — D3 §14]. It is:
- A separate LLM invocation with a scoped `SubAgentTask`
- Bounded to its assigned evidence domain (cannot access evidence from other domains)
- Able to use the same tools as its parent (web search, document analysis) within its scope
- Required to return a `SubAgentResult` to the parent — it does not write artifacts directly

It is NOT:
- A persistent agent object
- A separate process or service
- A parallel orchestration with its own coordinator
- A graph node label with no corresponding execution

## 5.2 Sub-agent task contract

```typescript
// SubAgentTask — dispatched by RE Lead to each worker
interface SubAgentTask {
  workerId: string;                    // e.g., 'evidence-domain-A'
  parentInstanceId: string;            // RE Lead instance ID
  evidenceScope: {
    documentIds: string[];             // which uploaded documents to investigate
    investigationFocus: string;        // what to look for in this domain
    parentFraming: string;             // CO's investigation framing (inherited)
  };
  objective: string;                   // e.g., "Extract key patterns from user feedback data..."
  outputRequirements: {
    minFindings: number;               // minimum evidence findings to return
    findingFormat: 'structured';       // always structured for lineage
    requireSourceRef: boolean;         // true — every finding must cite its source
  };
  allowedTools: ToolId[];              // same tools as parent, scoped to evidenceScope.documentIds
  maxAttempts: number;                 // from DelegationPolicy
}

// SubAgentResult — returned by each worker to RE Lead
interface SubAgentResult {
  workerId: string;
  findings: EvidenceFinding[];
  qualityAssessment: string;           // worker's assessment of evidence quality
  gaps: string[];                      // evidence gaps or uncertainties identified
  completedAt: string;
}

interface EvidenceFinding {
  findingId: string;                   // e.g., 'domain-A-finding-3'
  claim: string;                       // what was found
  sourceRef: string;                   // document + section + date
  sourceType: 'uploaded-document';     // [CONTRACT — D4 §5.3 valid evidence types]
  confidence: number;                  // ≤ 50 if model-inferred [CONTRACT — D4 §19.1]
  relevance: 'high' | 'medium' | 'low';
}
```

## 5.3 How sub-agent lineage flows to final artifacts

```
Sub-agent A finds [finding-A1, finding-A2, finding-A3]
Sub-agent B finds [finding-B1, finding-B2]
Sub-agent C finds [finding-C1, finding-C2, finding-C3, finding-C4]
              ↓
RE Lead [evidence-synthesis step]:
  Receives SubAgentResult[] from all workers
  Synthesizes into evidence-summary with:
    - finding ID preserved (domain-A-finding-3, etc.)
    - source reference preserved
    - contradictions between domains flagged
              ↓
hypothesis-set references evidence-summary finding IDs:
  "Hypothesis 1: [claim] — supported by [domain-A-finding-3, domain-C-finding-1]"
              ↓
experiment-designs references hypothesis IDs:
  "Experiment A: Tests Hypothesis 1 by [method]"
              ↓
investigate-report references all prior artifact IDs
```

Finding IDs generated by sub-agents must survive the entire lineage chain to the master artifact. The QA Final Gate validates that the master artifact contains at least one traceable reference per hypothesis back to a specific finding ID. [INFERENCE for ID mechanism; CONTRACT for CO-OCCURRENCE IS NOT LINEAGE principle]

---

# §6 — ARTIFACT CONTRACT AND PM-QUALITY CONTENT STANDARDS

Every artifact must be a PM-native deliverable, not a text dump. Structured elements are included when they serve a functional PM purpose — not for visual decoration.

## 6.1 evidence-summary

**Owner:** RE Lead (synthesize step at Balanced/Deep; combined step at Quick)
**PM purpose:** Shows what the evidence actually says, source by source, before any interpretation
**Validation Log:** Required — this artifact makes externally verifiable claims about uploaded documents

**Content structure:**
```
# Evidence Summary
**Investigation:** [CO framing — what was investigated]
**Evidence Reviewed:** [count of sources, types]

## Evidence Sources

| Source | Type | Reliability | Key Domain |
|--------|------|-------------|------------|
| [source name] | [uploaded-document/user-feedback/etc] | [high/medium/low + rationale] | [what it covers] |

## Key Findings

[finding-ID: domain-A-finding-1]
**Claim:** [what was found]
**Source:** [document name, section, date]
**Confidence:** [value ≤50 for model-inferred]
**Relevance:** [high/medium/low]

[Repeat for each finding]

## Evidence Quality Assessment
[Overall assessment: coverage, recency, diversity, gaps]

## Contradictions Between Sources
[Any findings that conflict with each other — flagged explicitly]

---
## Sources & Evidence Trail
[Validation Log — populated from EvidenceItem references]
```

## 6.2 hypothesis-set

**Owner:** RE/PS lens
**PM purpose:** Provides ≥3 competing, falsifiable explanations that could account for the observed problem
**Hard gate:** ≥3 hypotheses [CONTRACT — D2 §15]
**Validation Log:** Required where hypotheses cite external claims

**Content structure:**
```
# Competing Hypotheses

## Hypothesis Comparison Matrix

| ID | Hypothesis | Evidence For | Evidence Against | Falsifiability | Priority |
|----|-----------|--------------|-----------------|----------------|----------|
| H1 | [claim] | [finding IDs] | [finding IDs or NONE] | [how to disprove] | [P1/P2/P3] |
| H2 | [claim] | [finding IDs] | [finding IDs or NONE] | [how to disprove] | |
| H3 | [claim] | [finding IDs] | [finding IDs or NONE] | [how to disprove] | |

**Evidence reference note:**
Each finding ID above (e.g., domain-A-finding-3) traces to a specific finding
in the Evidence Summary. See Evidence Summary for source details.

## Null Hypothesis
H-null: [The observed pattern has no specific structural cause — it is baseline variance]
Falsification: [What would prove the null hypothesis false]

## Hypothesis Ranking Rationale
[Why H1 is prioritized — evidence strength, parsimony, actionability]
```

## 6.3 diagnostic-findings

**Owner:** CO (multi-lens synthesis step)
**PM purpose:** Integrates all diagnostic lenses into a coherent diagnosis while preserving each lens's independent perspective
**Validation Log:** Optional — only if diagnostic findings cite external claims

**Content structure:**
```
# Diagnostic Findings

## Diagnostic Summary
[3-4 sentence integration of all lenses' findings — what the investigation concludes]

## Per-Lens Diagnostic Analysis

### Hypothesis Analysis Lens (RE/PS)
**Finding:** [what the hypothesis analysis found]
**Key pattern:** [most significant pattern observed]
**Supported hypotheses:** [H1, H3]
**Unsupported hypotheses:** [H2]

### Strategic Lens (PS)
**Finding:** [strategic dimension of the problem]
**Business impact:** [revenue/retention/growth/efficiency implication]
**Linked hypothesis:** [which hypothesis this most directly informs]

### Experience Lens (UX) [if present]
**Finding:** [user experience dimension]
**User impact:** [who is affected and how]
**Linked hypothesis:** [which hypothesis]

## Integration: Where Lenses Agree / Disagree
| Dimension | RE/PS | PS | UX | Agreement |
|-----------|-------|----|----|-----------|
| Root cause | H1 likely | H1 likely | H2 possible | Partial |

## Synthesis Confidence
[Overall confidence in the diagnosis, caveats, what would increase confidence]
```

## 6.4 experiment-designs

**Owner:** QA (generator role) [INFERENCE — QA as experiment designer rather than evaluator; see §12 G_D2]
**PM purpose:** Concrete, executable tests that would confirm or disconfirm each hypothesis
**Validation Log:** Not typically required

**Content structure:**
```
# Experiment Designs

## Experiment Matrix

| ID | Tests | Method | Success Criteria | Timeline | Resources | Risk |
|----|-------|--------|-----------------|----------|-----------|------|
| EXP-1 | H1 | [method description] | [measurable success criteria] | [timeframe] | [what's needed] | [risk if inconclusive] |
| EXP-2 | H2 | | | | | |
| EXP-3 | H3 | | | | | |

## Experiment Prioritization
**Recommended first:** EXP-[n] because [evidence strength + feasibility + time-to-signal]
**Can run in parallel:** EXP-[n] and EXP-[m] are independent
**Requires EXP-[n] first:** EXP-[n+1] is only worth running if EXP-n confirms H[n]

## What Each Experiment Proves / Disproves
EXP-1 confirms: H1 is the root cause
EXP-1 disconfirms: H1 is ruled out; re-examine H2, H3
[Repeat]
```

## 6.5 recommended-action

**Owner:** PS
**PM purpose:** A specific, prioritized recommendation for what the PM should do next, grounded in the investigation
**Validation Log:** Not typically required

**Content structure:**
```
# Recommended Action

## Primary Recommendation
**Action:** [specific next step]
**Rationale:** Based on [hypothesis H1], supported by [finding IDs from evidence-summary],
               the most likely root cause is [X]. The highest-ROI first action is [Y].

## Decision Table

| Option | Evidence For | Evidence Against | Confidence | Risk | Recommendation |
|--------|-------------|-----------------|------------|------|----------------|
| Run EXP-1 immediately | H1 has strongest evidence base | H2 not ruled out | High | Low | **RECOMMENDED** |
| Run EXP-2 first | H2 is novel hypothesis | Less evidence support | Medium | Low | Alternative |
| Investigate further | Evidence gaps remain | Delays action | Medium | Medium | If timeline allows |

## Reasoning Chain
Evidence → [finding IDs] → Hypothesis → [H1] → Experiment → [EXP-1] → Action → [recommended action]
[This chain must be explicit and machine-traceable]

## If Experiment Confirms H1:
[Specific actions to take]

## If Experiment Disconfirms H1:
[Fallback: reassess H2 using EXP-2]
```

## 6.6 investigate-report (HERO ARTIFACT)

**Owner:** CO (hero synthesis)
**PM purpose:** A single decision-ready PM deliverable that synthesizes the complete investigation. This does NOT concatenate prior artifacts — it synthesizes them into a coherent decision package.
**Validation Log:** Required — cites evidence from evidence-summary

**Content structure:**
```
# Investigate Intelligence Report
★ [Mission title from CO framing]
Research Mission · [Depth] · [Date]

---

## Executive Summary
[3–4 sentences. What was investigated. What the most likely root cause is.
What action is recommended. Written for a senior PM or stakeholder audience.]

---

## Investigation Context
- **Question:** [The PM's investigation question]
- **Evidence reviewed:** [N sources — types]
- **Hypotheses generated:** [N competing explanations]
- **Depth:** [Quick/Balanced/Deep/Exhaustive]

---

## Key Evidence Findings

| Finding | Source | Confidence | Relevant to |
|---------|--------|------------|-------------|
| [finding-A1 claim] | [source ref] | [%] | H1, H3 |
| [finding-B1 claim] | [source ref] | [%] | H2 |

---

## Competing Hypotheses

| ID | Hypothesis | Evidence Support | Testable |
|----|-----------|-----------------|----------|
| H1 | [claim] | [finding IDs] | Yes — EXP-1 |
| H2 | [claim] | [finding IDs] | Yes — EXP-2 |
| H3 | [claim] | [finding IDs] | Yes — EXP-3 |

---

## Diagnosis

[2–3 paragraphs synthesizing the diagnostic lenses. Written as a coherent narrative.
Not a copy-paste from diagnostic-findings. A genuine synthesis.]

**Most likely root cause:** H[n] — [claim]
**Confidence:** [High/Medium/Low] based on [evidence strength + lens agreement]

---

## Recommended Experiments

1. **EXP-1** — Tests H1 via [method] — [timeline] — [success criteria]
2. **EXP-2** — Tests H2 (run if EXP-1 disconfirms H1) — [timeline]

---

## Recommended Action

**Do this first:** [specific action]
**Reasoning:** [1 paragraph — references H1, EXP-1, finding IDs]
**If this confirms the hypothesis:** [next step]
**If this disconfirms the hypothesis:** [fallback]

---

## Lineage Trail

| Output | Sources |
|--------|---------|
| Hypothesis H1 | finding-A1, finding-C2 |
| Hypothesis H2 | finding-B1 |
| Diagnosis | H1 + H2 + UX-lens-finding |
| Recommendation | H1 + EXP-1 |

---
## Sources & Evidence Trail
[Validation Log — populated from evidence-summary EvidenceItems where claims are externally verifiable]
```

---

# §7 — MACHINE-VERIFIABLE LINEAGE

## 7.1 The lineage chain

```
Uploaded evidence documents
        ↓
EvidenceFinding[] with stable IDs (domain-X-finding-N)
        ↓
evidence-summary (contains all findings with IDs preserved)
        ↓
hypothesis-set (each hypothesis lists finding IDs it depends on)
        ↓
diagnostic-findings (references hypothesis IDs)
        ↓
experiment-designs (references hypothesis IDs it tests)
        ↓
recommended-action (references hypothesis ID + experiment ID + finding IDs)
        ↓
investigate-report (lineage trail table — maps every conclusion to its sources)
```

## 7.2 How lineage is enforced

Each step's `TaskSpec.objective` includes an explicit instruction to reference upstream artifact IDs. This is not a suggestion in the prompt — it is a structured requirement that the QA evaluator checks for.

**Example TaskSpec.objective for hypothesis-set step:**
> "Generate ≥3 competing, falsifiable hypotheses that could explain the observed problem. For each hypothesis, you MUST list the specific finding IDs from the evidence-summary that support it (format: `[finding-A1, finding-C2]`). Each hypothesis must be independently falsifiable — include a brief description of what would prove it wrong."

**QA Gate 2 (Validation Gate) checks:**
- `hypothesis.supportingFindingIds.length >= 1` for each hypothesis
- Each finding ID referenced exists in the evidence-summary artifact
- hypothesis count ≥ 3

If any check fails, `EvaluationLogEntry.passed = false` and the Engine requests a revision. [CONTRACT for revision mechanism; INFERENCE for specific checks]

## 7.3 CO-OCCURRENCE IS NOT LINEAGE

A hypothesis may not be justified by "the evidence mentions poor UX" when the PM uploaded user research. The hypothesis must cite: "Finding domain-A-finding-3 states: 23% of users reported confusion at the team invitation step (source: Q2 User Survey, p. 14)." The specificity is the lineage. [CONTRACT — D4 Part 34A]

---

# §8 — EVALUATION GATES

## 8.1 Gate 1 — Evidence Quality Gate (after evidence-summary)

**Evaluator:** QA
**Question:** Is the evidence base sufficient to support reliable hypothesis generation?

**EvaluationPolicy:**
```typescript
{
  evaluatorCapabilityId: 'QA',
  passThreshold: 70,           // Balanced; 75 at Deep; 80 at Exhaustive [INFERENCE]
  requiredDimensions: ['source-diversity', 'relevance'],
  maxRevisions: 2,
  failureBehavior: [GAP G6],
  dimensions: [
    'source-diversity',         // Evidence from >1 independent source
    'relevance',                // Evidence is relevant to the investigation question
    'recency',                  // Evidence is appropriately current for the domain
    'completeness',             // Evidence covers the scope of the investigation
  ]
}
```

## 8.2 Gate 2 — Hypothesis Validation Gate (after CO multi-lens synthesis)

**Evaluator:** QA
**Question:** Does the diagnosis have ≥3 valid hypotheses, each with explicit evidence lineage?

**Hard check (CONTRACT — D2 §15):** hypothesis count ≥ 3. This is not a dimension score — it is a binary gate. If hypothesis count < 3, the gate fails regardless of other scores.

**EvaluationPolicy:**
```typescript
{
  evaluatorCapabilityId: 'QA',
  passThreshold: 70,           // Balanced; 75 at Deep [INFERENCE]
  requiredDimensions: ['hypothesis-count', 'evidence-lineage'],
  maxRevisions: 2,
  failureBehavior: [GAP G6],
  dimensions: [
    'hypothesis-count',         // REQUIRED: ≥3 hypotheses present
    'evidence-lineage',         // REQUIRED: each hypothesis cites ≥1 finding ID
    'falsifiability',           // Each hypothesis can be proven/disproven
    'coherence',                // Diagnostic narrative is internally consistent
    'completeness',             // All major evidence themes addressed
  ]
}
```

**Enforcement behavior for hypothesis-count < 3 (GAP G6 decision needed):**

**Option A:** `failureBehavior: 'revise-then-fail'` — Engine requests revision from RE/PS step with explicit gap: "Only N hypotheses generated. Minimum 3 required. Generate additional competing explanations that account for [unaddressed evidence themes]."

**Option B:** `failureBehavior: 'advance-with-warning'` — Artifact is flagged: "QUALITY WARNING: Only N hypotheses generated. 3+ required for complete investigation." Mission proceeds.

**Recommendation:** Option A (revise-then-fail) with maxRevisions: 2. A 1-hypothesis investigation defeats the entire purpose of Investigate. Requires approval.

## 8.3 Gate 3 — Final Quality Gate (before investigate-report)

**Evaluator:** QA
**Question:** Is the complete investigation package decision-ready?

**EvaluationPolicy:**
```typescript
{
  evaluatorCapabilityId: 'QA',
  passThreshold: 75,           // Balanced; 80 at Deep [INFERENCE]
  requiredDimensions: ['lineage-completeness', 'action-specificity'],
  maxRevisions: 2,
  failureBehavior: 'revise-then-fail',   // Final gate always fails hard [INFERENCE]
  dimensions: [
    'lineage-completeness',    // REQUIRED: recommendation traces to hypothesis + finding
    'action-specificity',      // REQUIRED: recommendation is a concrete action, not a platitude
    'experiment-feasibility',  // Experiments are actually executable by the PM's team
    'coverage',                // All ≥3 hypotheses have at least one experiment
  ]
}
```

---

# §9 — MISSION CONTROL TOPOLOGY AND EVENTS

## 9.1 Fundamental rule

**Every node state in Mission Control comes from a real SSE event.** No node may show RUNNING unless a `step_started` event was emitted. No node may show COMPLETE unless a `step_complete` event was emitted. Sub-agent nodes appear because `worker_started` events fire during the delegation phase. [CONTRACT — D3 §17.2]

## 9.2 Node definitions (Balanced depth — baseline)

```typescript
const INVESTIGATE_NODES_BALANCED: GraphNode[] = [
  { id: 'co-frame',        label: 'CO',    sublabel: 'Mission Coordinator',   role: 'coordinator', status: 'queued' },
  { id: 're-lead',         label: 'RE',    sublabel: 'Investigation Lead',    role: 'specialist',  status: 'queued' },
  { id: 'evidence-synth',  label: 'RE',    sublabel: 'Evidence Summary',      role: 'specialist',  status: 'queued', artifactId: 'evidence-summary' },
  { id: 'qa-gate-1',       label: 'QA',    sublabel: 'Evidence Gate',         role: 'specialist',  status: 'queued' },
  { id: 're-ps-hyp',       label: 'RE/PS', sublabel: 'Hypothesis Generation', role: 'specialist',  status: 'queued', artifactId: 'hypothesis-set' },
  { id: 'ps-strategy',     label: 'PS',    sublabel: 'Strategic Diagnosis',   role: 'specialist',  status: 'queued' },
  { id: 'co-synthesis',    label: 'CO',    sublabel: 'Multi-Lens Synthesis',  role: 'synthesis',   status: 'queued', artifactId: 'diagnostic-findings' },
  { id: 'qa-gate-2',       label: 'QA',    sublabel: 'Validation Gate',       role: 'specialist',  status: 'queued' },
  { id: 'qa-experiments',  label: 'QA',    sublabel: 'Experiment Designs',    role: 'specialist',  status: 'queued', artifactId: 'experiment-designs' },
  { id: 'ps-recommend',    label: 'PS',    sublabel: 'Recommended Action',    role: 'specialist',  status: 'queued', artifactId: 'recommended-action' },
  { id: 'qa-gate-3',       label: 'QA',    sublabel: 'Final Gate',            role: 'specialist',  status: 'queued' },
  // Hero artifact node
  { id: 'investigate-hero',label: '★',     sublabel: 'Investigate Report',    role: 'hero',        status: 'queued', artifactId: 'investigate-report' },
];
```

## 9.3 Deep depth node additions (dynamically resolved from plan, not runtime-dynamic)

At Deep depth, the plan includes sub-agent nodes. These are known at plan-compile time (ExecutionPlan is immutable [CONTRACT — D3 §3]). They appear in the initial graph because they are in the compiled step list.

```typescript
// Added between re-lead and evidence-synth nodes for Deep depth:
{ id: 're-sub-A', label: 'RE', sublabel: 'Evidence Domain A', role: 'worker', status: 'queued' },
{ id: 're-sub-B', label: 'RE', sublabel: 'Evidence Domain B', role: 'worker', status: 'queued' },
{ id: 're-sub-C', label: 'RE', sublabel: 'Evidence Domain C', role: 'worker', status: 'queued' },
// UX lens added after qa-gate-1:
{ id: 'ux-diagnosis', label: 'UX', sublabel: 'Experience Diagnosis', role: 'specialist', status: 'queued' },
```

## 9.4 Edge types (edges are drawn at plan-compile time; states update at runtime)

```
co-frame → re-lead                    type: execution-dependency
re-lead → [re-sub-A, re-sub-B, re-sub-C]  type: delegation
[sub-agents] → evidence-synth         type: artifact-dependency (SubAgentResult aggregation)
evidence-synth → qa-gate-1            type: evaluation
qa-gate-1 → re-ps-hyp                 type: execution-dependency
qa-gate-1 → ps-strategy               type: execution-dependency
qa-gate-1 → ux-diagnosis              type: execution-dependency (if present)
re-ps-hyp ↛ ps-strategy               type: isolation (mustNotReceiveOutputFrom)
re-ps-hyp ↛ ux-diagnosis              type: isolation
ps-strategy ↛ ux-diagnosis            type: isolation
[all lenses] → co-synthesis           type: artifact-dependency
co-synthesis → qa-gate-2              type: evaluation
qa-gate-2 → qa-experiments            type: execution-dependency
qa-experiments → ps-recommend         type: artifact-dependency
ps-recommend → qa-gate-3              type: evaluation
qa-gate-3 → investigate-hero          type: execution-dependency
```

## 9.5 PM-native activity labels

```typescript
PM_ACTIVITY_TEXT['investigate'] = {
  'co-frame':        'Understanding your investigation question...',
  're-lead':         'Reviewing your evidence...',
  're-sub-A':        'Investigating evidence thread...',
  're-sub-B':        'Investigating evidence thread...',
  're-sub-C':        'Investigating evidence thread...',
  'evidence-synth':  'Synthesising evidence findings...',
  'qa-gate-1':       'Validating evidence quality...',
  're-ps-hyp':       'Generating competing hypotheses...',
  'ps-strategy':     'Running strategic diagnosis...',
  'ux-diagnosis':    'Running experience diagnosis...',
  'co-synthesis':    'Synthesising diagnostic findings...',
  'qa-gate-2':       'Validating diagnosis and hypotheses...',
  'qa-experiments':  'Designing experiments...',
  'ps-recommend':    'Formulating recommended action...',
  'qa-gate-3':       'Final quality check...',
  'investigate-hero':'Producing Investigate Intelligence Report...',
};
// NEVER expose: capability names, step IDs, model names, token counts, sub-agent count
```

---

# §10 — CANONICAL SHELL INTEGRATION

No new surfaces. No duplicate components.

## 10.1 Desk

WorkspaceExplorer receives `WorkspaceNode[]` with `outcome === 'investigate'` guard.

```typescript
// In desk/page.tsx studioTree memo — additive, does not touch existing guards:
...(v3RunInfo?.outcome === 'investigate' && v3Artifacts.length > 0
    ? [{
        id: 'investigate-root',
        label: (v3RunInfo?.intent?.slice(0, 26) ?? 'Investigation') + '…',
        kind: 'folder' as const,
        children: [{
          id: 'investigate-documents',
          label: 'Documents',
          kind: 'folder' as const,
          children: [{
            id: 'investigate-findings',
            label: 'Investigation Findings',
            kind: 'folder' as const,
            phaseColor: '#34D399',
            children: v3Artifacts.map(a => ({
              id: `v3-node-${a.id}`,
              label: a.id === 'investigate-report' ? `★ ${a.pmName}` : a.pmName,
              kind: 'file' as const,
              wdocId: `v3-artifact-${a.id}`,
              healthState: 'trustworthy' as const,
            }))
          }]
        }]
      }]
    : [])
```

**WorkspaceExplorer.tsx: NOT MODIFIED. [PROVEN — Research uses identical pattern]**

## 10.2 Studio

Same TipTap editor. Same FormattingToolbar. Same rawContent flow.

```
v3-artifact-{id} node clicked
        ↓
onNodeSelect → setV3ActiveArtId(artifactId)
        ↓
useEffect([v3RunId, v3ActiveArtId])
        ↓
GET /api/runs/{runId}/artifacts/{artifactId}
        ↓
setRawContent(data.content)
        ↓
Doc → TipTapRenderer → renders Investigate artifact
FormattingToolbar: unchanged
Improve → Accept: unchanged
```

**TipTapRenderer.tsx: NOT MODIFIED.**
**FormattingToolbar.tsx: NOT MODIFIED.**
**GlobalStore.tsx: NOT MODIFIED (useTipTapRenderer remains true).**

## 10.3 Mission Control

InvestigateMissionControl component follows the exact ResearchMissionControl pattern.

```
mission-control/page.tsx reads URL param: outcome = 'investigate'
        ↓
routes to <InvestigateMissionControl runId={...} depth={...} />
        ↓
InvestigateMissionControl:
  - loads INVESTIGATE_NODES_[depth] based on depth prop
  - subscribes to SSE: /api/missions/{runId}/events
  - maps step_started → node.status = 'running'
  - maps step_complete → node.status = 'complete', wordCount = event.wordCount
  - maps delegation_started → sub-agent nodes = 'running'
  - maps worker_complete → sub-agent node = 'complete'
  - maps run_complete → completion state, all nodes = 'complete'
        ↓
passes nodes + edges to the EXISTING graph renderer
```

**Existing graph renderer: NOT MODIFIED.**

---

# §11 — IMPLEMENTATION BOUNDARY

## 11.1 New files (do not exist yet)

```
src/core/outcome-runtime/step-registry/investigate.js
  — Step array for each depth (4 arrays)
  — DelegationPolicy per depth
  — EvaluationPolicy per gate (3 gates)
  — PM activity labels
  — Sub-agent task specifications

src/components/mission-control/InvestigateMissionControl.tsx
  — Follows ResearchMissionControl.tsx pattern exactly
  — INVESTIGATE_NODES_BALANCED, INVESTIGATE_NODES_DEEP arrays
  — SSE subscription and node state updates
  — Completion banner + "View in Desk" CTA
```

## 11.2 Allowed modifications (additive only)

```
src/app/mission-control/page.tsx
  ADD: one routing branch for outcome === 'investigate'
  DO NOT TOUCH: Research branch, Build branch, graph renderer

src/app/desk/page.tsx
  ADD: one outcome === 'investigate' workspace tree injection
  DO NOT TOUCH: Research guard, Build tree, WorkspaceExplorer

src/app/improve/page.tsx
  ADD: v3 content-loading case for outcome === 'investigate'
  DO NOT TOUCH: Build path, Research path, TipTap, FormattingToolbar

src/app/api/missions/run/route.ts
  VERIFY: existing route handles investigate outcome
  ADD if missing: investigate case to the routing switch
```

## 11.3 Absolutely protected (no modifications under any circumstances)

```
coordinator-v2.js · lifecycle-engine.js · llm.js
src/components/shared/WorkspaceExplorer.tsx
src/components/improve/TipTapRenderer.tsx
src/components/improve/FormattingToolbar.tsx
src/lib/GlobalStore.tsx
src/components/mission-control/ResearchMissionControl.tsx (read-only reference)
src/core/outcome-runtime/executor.js
  (read to verify delegation mechanism exists; do not modify unless
   Phase-0 trace proves a dependency — report before touching)
```

---

# §12 — OPEN DECISIONS (REQUIRED BEFORE IMPLEMENTATION)

| ID | Question | Recommendation | Blocks |
|----|----------|----------------|--------|
| G6 | Hypothesis gate: revise-then-fail or advance-with-warning when <3 hypotheses? | revise-then-fail (maxRevisions: 2). A single-hypothesis investigation defeats the product value. | investigate-report quality |
| G_D1 | Does balanced depth use sub-agents? | No — contracts say deep/exhaustive only. Balanced = RE Lead only. | step-registry balanced |
| G_D2 | Who generates experiment designs: QA (generator role) or RE/PS (generate) + QA (evaluate)? | QA as generator — testability is QA's primary expertise. But this is unusual usage of QA. | step-registry experiment step |
| G_D3 | CO framing: dedicated framing step (separate LLM call) or CO framing produced as part of evidence step context? | Dedicated CO framing step — it produces a named mission contract that all other steps receive. Small cost, significant benefit for investigation coherence. | step-registry CO step |
| G_D4 | UX at balanced depth (yes/no) and at deep depth (only via Layer 2 signal or always)? | UX at deep+ only, and only via Layer 2 context signal. At balanced: RE/PS + PS only. | step-registry lens selection |
| G_D5 | DelegationPolicy.maxWorkers values at deep and exhaustive? | deep = 3, exhaustive = 5 | DelegationPolicy |
| G_D6 | Evidence domain identification: RE Lead identifies domains before delegation (requires initial RE scan), or domains are pre-specified in the step-registry based on uploaded document types? | RE Lead identifies domains — allows adaptation to actual evidence. This requires RE Lead to be a multi-phase step: (1) scan evidence, (2) identify domains, (3) dispatch. | step-registry RE Lead step |
| G_D7 | What happens if only 1–2 evidence domains are identified? Does RE Lead still dispatch sub-agents, or handle directly? | If ≤1 domain identified, RE Lead handles directly (no delegation). Delegation only when ≥2 separable domains exist. | DelegationPolicy condition |

**For Investigate V1 (Balanced depth), only G6, G_D1, G_D2, G_D3, G_D4 are blocking.**

---

# §13 — MANDATORY PHASE-0 IMPLEMENTATION GATE

Claude Code must complete ALL items below and report confirmation before writing a single line of code.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IDEAGATE — INVESTIGATE PHASE-0 GATE (paste at start of every sprint)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

0. GOVERNANCE READ (quote to prove):

  cat /Users/apple/idea-gate-ui-safe/docs/IDEAGATE-CANONICAL-SHELL-ARCHITECTURE.md
  cat /Users/apple/idea-gate-ui-safe/docs/IDEAGATE-ORCHESTRATION-EXTENSION-PLAYBOOK.md

  Report:
    ACTIVE_WORKSPACE_ISOLATION_RULE: [paste rule text verbatim]
    SHELL_LOCK_COMPONENTS: [paste list verbatim]
    ANTI_PATTERN_RESEARCH_SIDEBAR: [paste anti-pattern verbatim]

1. INVESTIGATE PLAN READ:

  Read: IDEAGATE-INVESTIGATE-ARCHITECTURE-PLAN-V2.md (this document)

  Report:
    INVESTIGATE_RECIPE: [value]
    INVESTIGATE_CONTEXT_REQUIRED: YES/NO
    MIN_HYPOTHESES: [value]
    SUBAGENT_DEPTH_GATE: [at which depths]
    QA_GATE_COUNT: [value]
    HERO_ARTIFACT_ID: [value]
    LINEAGE_MECHANISM: [one sentence description]

2. LIVE IMPLEMENTATION INSPECTION:

  # Read Research step registry (the pattern we are extending)
  cat /Users/apple/idea-gate-ui-safe/src/core/outcome-runtime/step-registry/research.js

  # Read executor to confirm delegation mechanism exists
  grep -n "delegate\|delegation\|maxWorkers\|SubAgent\|worker" \
    /Users/apple/idea-gate-ui-safe/src/core/outcome-runtime/executor.js | head -20

  # Read ResearchMissionControl (the component we are patterning)
  head -80 /Users/apple/agent-zero-data/workdir/ui-layer/src/components/\
    mission-control/ResearchMissionControl.tsx

  Report:
    RESEARCH_STEP_REGISTRY_READ: YES
    DELEGATION_IN_EXECUTOR: YES/NO + line number if YES
    RESEARCH_MC_PATTERN_READ: YES
    EXTENDING_NOT_RECREATING: CONFIRMED

3. GOLDEN REGRESSION BASELINE:

  # Build check
  curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/desk

  # Research artifacts exist
  cat /Users/apple/idea-gate-ui-safe/.v3-last-run-info.json | \
    node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{
      const r=JSON.parse(d);
      console.log('outcome:', r.outcome, 'hasArtifacts:', r.hasArtifacts);
    })"

  # Shell components unmodified
  git -C /Users/apple/agent-zero-data/workdir/ui-layer diff HEAD -- \
    src/components/shared/WorkspaceExplorer.tsx | wc -l
  git -C /Users/apple/agent-zero-data/workdir/ui-layer diff HEAD -- \
    src/components/improve/TipTapRenderer.tsx | wc -l

  Report:
    BUILD_HTTP_200: YES/NO
    RESEARCH_ARTIFACTS_EXIST: YES/NO
    SHELL_COMPONENTS_UNMODIFIED: YES (0 diff lines each)

4. IMPLEMENTATION BOUNDARY DECLARATION:

  GOAL: [one sentence]
  FILES_ALLOWED: [list — max 4]
  FILES_PROTECTED: [list — must include all shell components]
  COMPONENTS_REUSED: [list existing components by name]
  NEW_ELEMENTS: [list only new files]
  ACCEPTANCE_TEST: [one browser-verifiable sentence]
  REGRESSION_TEST: [Build and Research pass]

5. GAP VERIFICATION:

  Before coding, confirm every decision in §12 has been resolved.
  List: RESOLVED / STILL_OPEN for G6, G_D1, G_D2, G_D3, G_D4.
  If any are STILL_OPEN: STOP. Report to human. Do not proceed.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STOP FOR APPROVAL after Phase-0 report.
No code until human confirms Phase-0 complete and all §12 gaps resolved.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

# §14 — GOLDEN REGRESSION GATE

## Pre-implementation baseline

```
BUILD:
  □ Run Build mission end-to-end
  □ Mission Control: 15-stage Build graph, Coordinator + 6 agents
  □ Desk: Build workspace ONLY (no Investigate or Research folder)
  □ Studio: Build artifact opens in TipTap + FormattingToolbar
  □ Improve + Accept work
  □ git log --oneline -1 -- src/app/desk/page.tsx [record hash]

RESEARCH:
  □ Run Research mission end-to-end
  □ Mission Control: Research 5-node graph
  □ Desk: Research workspace ONLY (no Build artifacts contaminating)
  □ All 5 Research artifacts accessible
  □ Studio: Research artifact in TipTap + same toolbar
  □ Improve + Accept work

SHELL INTEGRITY:
  □ git diff HEAD -- src/components/shared/WorkspaceExplorer.tsx = 0 lines
  □ git diff HEAD -- src/components/improve/TipTapRenderer.tsx = 0 lines
  □ grep 'useTipTapRenderer.*true' src/lib/GlobalStore.tsx = match
  □ coordinator-v2.js / lifecycle-engine.js / llm.js = no uncommitted changes
```

## Post-implementation verification

```
INVESTIGATE:
  □ Evidence uploaded → Investigate runs from Composer
  □ Mission Control: Investigate graph (5 nodes at Quick, 11+ at Balanced)
  □ ≥3 hypotheses in hypothesis-set artifact
  □ Each hypothesis references evidence-summary finding ID
  □ Experiment-designs has one experiment per hypothesis
  □ Recommend-action references hypothesis + experiment IDs
  □ investigate-report is the hero artifact (★)
  □ investigate-report lineage trail table populated
  □ Desk: Investigate workspace ONLY
  □ Click any artifact → right panel
  □ Studio: TipTap + FormattingToolbar unchanged
  □ Improve + Accept work for Investigate artifacts

BUILD REGRESSION:
  □ Same as baseline — unchanged in every detail

RESEARCH REGRESSION:
  □ Same as baseline — unchanged in every detail

WORKSPACE ISOLATION:
  □ Build run: Desk shows Build ONLY (no Investigate or Research folder)
  □ Research run: Desk shows Research ONLY (no Build or Investigate folder)
  □ Investigate run: Desk shows Investigate ONLY (no Build or Research folder)

REGRESSION = STOP → diagnose → restore before any further sprint.
```

---

# §15 — ACCEPTANCE CRITERIA

The Investigate orchestration is NOT complete until ALL of these hold:

```
□ PM uploads evidence, runs Investigate, receives 5+ artifacts
□ Quick: 5 nodes in Mission Control, 3 artifacts, hero renders
□ Balanced: 11 nodes in Mission Control, 6 artifacts, hero renders
□ Deep (if implementing): sub-agent nodes appear, 14+ MC nodes
□ Hypothesis-set contains ≥3 hypotheses
□ Each hypothesis explicitly references at least 1 evidence-summary finding
□ QA Validation Gate fires; revision occurs if <3 hypotheses returned
□ Experiment-designs has one experiment per hypothesis
□ investigate-report lineage trail is populated
□ Mission Control nodes are updated from real SSE events (not pre-drawn)
□ Desk shows Investigate workspace ONLY (not Build, not Research)
□ Clicking artifact opens in right panel (Build-style, no new component)
□ Studio opens artifact in TipTap with FormattingToolbar intact
□ Improve + Accept work for Investigate artifacts
□ Build regression: NONE
□ Research regression: NONE
□ Shell components: WorkspaceExplorer, TipTapRenderer, FormattingToolbar UNCHANGED
□ TypeScript: 0 errors
□ No new Sidebar, Viewer, Editor, or parallel shell created
```

---

# §16 — FINAL QUALITY TEST

> "Could Claude Code implement this plan while preserving Build and Research,
> creating genuinely real bounded sub-agent execution, maintaining deterministic
> artifact lineage, producing meaningful PM artifacts, and exposing actual runtime
> execution in Mission Control — without needing the architecture explained again?"

**Self-assessment:**

- **Build and Research preserved:** Yes — implementation boundary is explicit, additive-only, no shell modifications.
- **Real bounded sub-agent execution:** Yes — §5 defines the SubAgentTask/SubAgentResult contract, what bounded scope means, and how findings flow to evidence-summary. Claude Code can implement this against the executor.js delegation mechanism.
- **Deterministic artifact lineage:** Yes — §7 defines the finding ID format, the explicit reference requirement in TaskSpec.objective, and the QA gate check that validates lineage.
- **Meaningful PM artifacts:** Yes — §6 defines the exact content structure of each artifact with functional PM purpose for every structured element.
- **Real runtime execution in Mission Control:** Yes — §9 defines nodes per depth, edge types, SSE event mappings, and PM-native labels. No pre-drawn graph.
- **Open gaps resolved before coding:** Yes — §12 identifies exactly which decisions block V1 Balanced implementation and requires confirmation before Phase-0 clears.

---

# §17 — HARDENED IMPLEMENTATION FOOTER — NON-NEGOTIABLE

This section is an implementation guardrail, not a new architectural proposal.
It exists to ensure this plan produces a serious, premium, genuinely agentic
PM product while preserving the proven IdeaGate shell.

## 17.1 RUNTIME-FIRST RULE

The existing IdeaGate runtime is authoritative.

Before implementing any proposed interface, delegation mechanism, event,
lineage mechanism, artifact contract, or execution primitive, Claude Code MUST
inspect the existing runtime and D1–D7 contracts and reuse/adapt what already
exists.

The plan MUST NOT cause Claude Code to invent a parallel runtime abstraction
merely because this document describes a desired behaviour.

EXISTING RUNTIME > PLAN PROPOSAL > IMPLEMENTATION INFERENCE.

If the proposed design cannot be expressed through the existing runtime,
STOP and report the exact gap before modifying the runtime.

## 17.2 GENUINE AGENTIC EXECUTION

Investigate must demonstrate real agentic work, not agent-shaped UI.

Where Deep/Exhaustive delegation is selected:

RE Lead
→ real bounded RE worker execution
→ real SubAgentResult
→ parent synthesis
→ downstream artifacts

A Mission Control node MUST correspond to real runtime execution.
A visual node without corresponding execution is a failure.

Sub-agents must:
- receive bounded work;
- perform genuine investigation;
- return structured results;
- preserve finding/source lineage;
- remain isolated from other workers;
- never write directly to the artifact store;
- never spawn sub-sub-agents.

## 17.3 MACHINE-VERIFIABLE LINEAGE

Lineage MUST be represented in a form the runtime/evaluation layer can
validate.

The system must be able to establish:

evidence finding
→ hypothesis
→ diagnosis
→ experiment
→ recommendation
→ hero artifact

Co-occurrence, textual similarity, document proximity, or shared context
MUST NOT be treated as lineage.

If the current runtime lacks the required structured lineage mechanism,
Claude Code MUST identify the smallest additive extension required and STOP
for approval before implementing it.

## 17.4 ACTIVE WORKSPACE ISOLATION

At any moment, the active outcome determines the workspace.

Build → Build workspace ONLY.
Research → Research workspace ONLY.
Investigate → Investigate workspace ONLY.

Never append one outcome's tree beneath another outcome's tree.

WorkspaceExplorer remains universal.

Outcome-specific data changes.
The shell does not.

## 17.5 MISSION CONTROL = EXECUTION TRUTH

Mission Control MUST represent actual runtime execution.

Node state, worker state, completion state, and failure state must originate
from real execution events.

The graph MUST NOT be a pre-drawn simulation of intended orchestration.

Planned topology may define the graph structure.
Runtime events determine what the graph says actually happened.

## 17.6 DEPTH MUST BE BEHAVIOURAL

Quick, Balanced, Deep and Exhaustive MUST produce materially different
execution behaviour.

Depth may change:
- evidence coverage;
- delegation;
- worker count within contract limits;
- specialist lenses;
- evaluation strictness;
- revision behaviour;
- experiment depth;
- artifact completeness.

Depth MUST NOT exist merely to increase node count or visual complexity.

## 17.7 ARTIFACT QUALITY STANDARD

Every artifact must have a distinct PM purpose.

Use tables, matrices, diagrams, entity relationships, information architecture,
validation logs, evidence trails, or other structured elements only when they
improve the decision-making value of the artifact.

Do not add visual structure for decoration.

Every Investigate run must produce:
- coherent intermediate artifacts;
- one clearly identified hero/master artifact;
- explicit artifact relationships;
- evidence/lineage trail;
- decision-ready synthesis.

The hero artifact MUST synthesize the investigation rather than concatenate
previous artifacts.

## 17.8 SPECIALIZATION WITHOUT GIMMICKRY

Additional agents, workers, lenses, gates, or orchestration patterns MUST
exist because they perform a distinct reasoning or execution responsibility.

Never add an agent solely to:
- increase agent count;
- make Mission Control look busy;
- create a more impressive graph;
- manufacture an "agentic" appearance.

The product should demonstrate meaningful patterns such as:
- coordinator-led delegation;
- bounded parallel investigation;
- specialist isolation;
- synthesis;
- evaluation/revision;
- evidence lineage;
- adaptive depth.

## 17.9 SHELL PRESERVATION

The canonical shell remains:

Composer
→ Mission Control
→ Desk / WorkspaceExplorer
→ Studio / TipTap
→ Improve / Accept

Investigate may provide new:
- recipe;
- step registry;
- execution configuration;
- artifact contracts;
- runtime data;
- graph data;
- outcome-specific workspace data.

Investigate MUST NOT create:
- a parallel sidebar;
- a parallel editor;
- a parallel artifact viewer;
- a parallel workspace;
- a parallel orchestration renderer;
- a replacement coordinator;
- a replacement lifecycle engine.

REUSE → ADAPT → EXTEND → VERIFY.

Never:
DUPLICATE → REBUILD → REPLACE.

## 17.10 CHANGE BOUNDARY

Before implementation Claude Code MUST produce an exact file-level change
boundary.

Every proposed file change must answer:

WHY is this file required?
WHAT existing behaviour does it extend?
WHAT existing behaviour is protected?
HOW will regression be detected?

If a new file or modification is not necessary to fulfil the approved
Investigate contract, do not create it.

## 17.11 REGRESSION IS A HARD STOP

Build and Research are protected regression baselines.

Before implementation:
- establish the baseline.

After implementation:
- execute the complete Build journey;
- execute the complete Research journey;
- verify Mission Control;
- verify Desk isolation;
- verify Studio artifact loading;
- verify Improve/Accept;
- verify shell components remain intact.

ANY REGRESSION = STOP.

Do not patch forward.
Do not continue adding features.
Diagnose → restore → re-verify → continue.

## 17.12 PHASE-0 IS MANDATORY

Claude Code MUST NOT implement directly from this document.

Required sequence:

READ
→ PROVE READ
→ INSPECT LIVE RUNTIME
→ TRACE EXISTING PATTERN
→ ESTABLISH REGRESSION BASELINE
→ IDENTIFY GAPS
→ DECLARE FILE BOUNDARY
→ STOP FOR HUMAN APPROVAL
→ IMPLEMENT
→ TEST
→ REAL BROWSER RUN
→ EVALUATE
→ REPORT

No code before Phase-0 approval.

## 17.13 PORTFOLIO-QUALITY BAR

Investigate is intended to demonstrate genuine product and agent-system
thinking.

Completion therefore requires more than:
- successful TypeScript;
- generated files;
- populated graph;
- successful API response.

It must demonstrate, through the running product:

1. meaningful coordinator orchestration;
2. specialist reasoning;
3. real bounded delegation where depth warrants it;
4. independent diagnostic lenses where warranted;
5. evaluation and revision;
6. evidence-to-decision lineage;
7. adaptive execution based on mission configuration;
8. coherent PM-native artifacts;
9. actual runtime observability;
10. preservation of the universal IdeaGate shell.

The result must be credible as a premium agentic SaaS product and as a serious
PM portfolio case study.

Agent count is NOT a success metric.
Execution quality, traceability, product coherence and decision value are.

## 17.14 FINAL IMPLEMENTATION TEST

Before declaring Investigate complete, answer YES to every question:

□ Did the implementation reuse the existing runtime?
□ Did real delegation occur where required?
□ Did sub-agent outputs affect downstream execution?
□ Is lineage machine-verifiable?
□ Does Mission Control reflect actual runtime events?
□ Does depth change actual execution?
□ Does each artifact have a distinct PM purpose?
□ Is there exactly one hero/master artifact?
□ Is workspace context strictly isolated by active outcome?
□ Does Studio remain the universal document editor?
□ Were all shell components reused rather than duplicated?
□ Did Build remain unchanged?
□ Did Research remain unchanged?
□ Were all approved changes within the declared boundary?
□ Was real browser verification completed?
□ Would the resulting behaviour be defensible as genuine agentic SaaS rather
  than a visual agent simulation?

If any answer is NO, Investigate is NOT complete.

---

**Verdict: This plan is implementation-ready pending owner approval of the §12 decisions.**

---

*IDEAGATE-INVESTIGATE-ARCHITECTURE-PLAN-V2.md · August 2026*
*Single authoritative plan. Supersedes V1. No code until §12 decisions resolved and Phase-0 approved.*
