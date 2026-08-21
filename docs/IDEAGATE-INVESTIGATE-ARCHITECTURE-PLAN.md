# IDEAGATE — INVESTIGATE ORCHESTRATION ARCHITECTURE PLAN
## Review Before Implementation · August 2026
## Status: PLAN ONLY — No code written

---

> **Notation:**
> **[CONTRACT]** — established in D1–D7, verified in cross-document audit
> **[PROVEN]** — demonstrated in running Build or Research product
> **[INFERENCE]** — architectural reasoning requiring explicit approval
> **[GAP]** — unresolved product decision blocking implementation

---

# 1. WHAT THE CONTRACTS ESTABLISH FOR INVESTIGATE

The following facts are not proposals. They are authoritative.

| Fact | Source | Value |
|------|--------|-------|
| OutcomeId | D1, D2, D5 | `'investigate'` |
| Recipe | D2 §7 | `research-first` |
| Domain capabilities | D2 §4 DOMAIN_CAPABILITY_MAP | RE, QA, PS (context adds ±UX, ±AR via Layer 2) |
| CO participation | D2 §4 Layer 4 | Yes — research-first recipe requires CO |
| Context requirement | D2 §2.4 | Required. Cannot run without uploaded evidence. |
| Minimum hypotheses | D2 §15 | ≥3. Hard gate. |
| Sub-agent eligibility | D3 §11, D7 DelegationPolicy | Eligible at `deep` and `exhaustive` depth |
| Sub-agent constraints | D3 §11 | Temporary · inherit parent scope · cannot write PKS directly · cannot cross isolation boundaries · max 1 level deep (no sub-sub-agents) · max workers set in DelegationPolicy per plan |
| Sub-agent step type | D3 §14 | `delegate` |
| Synthesis step type | D3 §14 | `synthesize` |
| Evaluate step type | D3 §14 | `evaluate` |
| EvaluationPolicy.failureBehavior | D3 §9 | `revise-then-fail` or `advance-with-warning` — which applies at the hypothesis gate = [GAP G6] |
| Isolation between diagnostic lenses | D3 §6 | `mustNotReceiveOutputFrom` — each lens must not see other lenses' output before CO synthesis |
| Artifact path | D7 v1.2 | `workspace/{projectId}/runs/{runId}/artifacts/{id}/v1.md` |
| Active workspace isolation | Shell Architecture doc | `v3RunInfo?.outcome === 'investigate'` guards Desk/Studio injection |

**What the contracts do NOT specify and must be decided:**
- Exact step topology at each depth level
- Number and specialization of RE sub-agents
- Whether UX appears as a diagnostic lens (context-driven; contracts allow it via Layer 2 but do not require it)
- Exact artifact set and hero designation
- Enforcement behavior when <3 hypotheses returned (GAP G6)
- Whether balanced depth uses sub-agents or not

---

# 2. EVALUATION OF THE PROPOSED TOPOLOGY

The proposed topology (CO → RE Lead → RE sub-agents → synthesis → QA → diagnostic lenses → CO synthesis → QA → experiments → recommendation → QA → master) is evaluated element by element.

## 2.1 CO as Mission Coordinator — [CONTRACT]

CO is required because `research-first` recipe includes CO per Layer 4 selection.
Role: frame investigation, normalize context, drive synthesis/judgment.
✓ Fully supported.

## 2.2 RE Investigation Lead — [INFERENCE — approved pending step definition]

D2 §4 makes RE the primary capability for investigate. The concept of a "lead RE" that can delegate to sub-agents at deep/exhaustive is exactly what D3 §11 + DelegationPolicy describes. The Investigation Lead is the parent capability instance that manages bounded sub-agents.

The Investigation Lead is NOT the same as a "step" in the Research sense. It is an RE capability instance with `delegationAllowed: true` at deep/exhaustive, and `delegationAllowed: false` at quick/balanced.

## 2.3 RE Evidence Sub-Agents — [CONTRACT at deep/exhaustive; INFERENCE at balanced]

D3 §11 and D7 DelegationPolicy establish: RE is eligible for sub-agent delegation at deep and exhaustive. Sub-agents are:
- Temporary worker instances
- Inherit parent scope but cannot exceed it
- Cannot write to PKS directly (their outputs return to parent RE Lead)
- Cannot spawn sub-sub-agents
- Count is in `DelegationPolicy.maxWorkers` (set per plan per depth)

**At what depth do sub-agents first appear?**
D3 says deep/exhaustive. Balanced = [GAP G_D1] — whether balanced gets 1 sub-agent, lightweight delegation, or no sub-agents is a product decision. The contracts say "eligible at deep/exhaustive" which implies balanced does NOT get sub-agents. This interpretation is [INFERENCE] pending confirmation.

**How many sub-agents?**
The proposed diagram shows exactly 3 (Thread A, B, C). The contracts do not specify a fixed count — it is in `DelegationPolicy.maxWorkers` and should be determined by the evidence domains present in the uploaded context, bounded by depth. Recommend: balanced = 0, deep = 2–3, exhaustive = up to 5. These numbers are [INFERENCE] requiring approval.

**What do sub-agents investigate?**
Each sub-agent investigates a separable evidence domain or investigation thread identified by the RE Lead. This is the RE Lead's judgment — it decomposes the investigation space and dispatches bounded workers. [INFERENCE — supported by D3 §11 parent→worker pattern]

## 2.4 Evidence Synthesis — [CONTRACT-DERIVED, step type = 'synthesize']

After sub-agents return results, a `synthesize` step type (D3 §14) combines their outputs into a unified evidence summary. If no sub-agents ran (quick depth), this collapses to the RE Lead's direct output.

At quick: RE Lead produces evidence summary directly.
At balanced/deep/exhaustive: RE Lead receives sub-agent results → synthesize step combines them.

## 2.5 QA Evidence Gate — [INFERENCE — requires GAP G6 resolution]

A QA `evaluate` step that validates the evidence summary before hypothesis generation proceeds. This is architecturally sound (QA as an evaluation gate is explicitly supported by D3 §9). The exact `EvaluationPolicy` for this gate requires:
- `evaluatorCapabilityId: 'QA'`
- `passThreshold: [to be defined]`
- `failureBehavior: 'revise-then-fail'` or `'advance-with-warning'` — **[GAP G6 applies here too]**

## 2.6 Parallel Diagnostic Lenses — [INFERENCE; UX is CONDITIONAL]

The proposed lenses are: RE/PS (hypotheses), UX (experience diagnosis), PS (strategic diagnosis).

**RE/PS for hypothesis generation:** RE generates competing hypotheses; PS provides strategic framing. This aligns with the contracted capability set (RE + PS both appear in investigate). Hypotheses must be ≥3 per [CONTRACT — D2 §15]. Isolation between lenses: `mustNotReceiveOutputFrom` [CONTRACT — D3 §6].

**UX as a diagnostic lens:** UX is NOT in the domain capability set for investigate [CONTRACT — D2 §4]. However, D2 §4 Layer 2 explicitly allows context signals to add UX or AR when the investigation involves user-facing product behavior. If the uploaded evidence is user research, session recordings, or UX audit data, UX should appear. If it is system logs or financial data, UX should not appear.

**UX inclusion rule [INFERENCE requiring approval]:** UX participates as a diagnostic lens when uploaded context contains evidence classified as: user feedback, usability data, session recordings, NPS/CSAT, support tickets about user behavior. The Layer 2 context signal mechanism handles this — no new capability is invented.

**Isolation between lenses is load-bearing:** Each lens must independently diagnose without seeing other lenses' outputs. This is the same isolation contract as Review (D3 §6, `mustNotReceiveOutputFrom`). The lens isolation prevents anchoring.

## 2.7 CO Multi-Lens Synthesis — [CONTRACT-DERIVED, step type = 'synthesize']

CO synthesizes all diagnostic lens outputs. This is CO's core role in research-first recipe. It produces a coherent diagnostic finding that integrates evidence + hypotheses + lens-specific diagnoses. Supported by D3 §14 `synthesize` step type and CO's role as coordinator/synthesizer.

## 2.8 QA Validation Gate — [INFERENCE]

QA evaluates the CO synthesis before experiment design proceeds. This gates whether the diagnosis is coherent and evidence-grounded. Same GAP G6 applies to `failureBehavior` here.

## 2.9 QA Experiment Design — [INFERENCE]

QA generates experiment designs. This is unusual — experiment design is typically a PS/RE job, but QA's testability perspective is the point. Each experiment must be designed to be falsifiable, time-bounded, and independently executable. [INFERENCE] The alternative is a RE or PS step for experiment design with QA then evaluating them. This choice requires a product decision — see [GAP G_D2].

## 2.10 PS Recommended Action — [INFERENCE]

PS produces the recommended action (which experiment to run first, and what to do if it confirms vs disconfirms each hypothesis). PS is the right capability for strategic recommendation. [INFERENCE — aligned with PS's role as Product Strategy]

## 2.11 QA Final Gate — [INFERENCE]

Final QA evaluation of the complete investigation package. Checks: ≥3 hypotheses present, all hypotheses testable, recommendation traces to at least one hypothesis, evidence lineage complete. [INFERENCE]

## 2.12 Master/Hero Investigate Artifact — [INFERENCE]

The hero artifact synthesizes the complete investigation into one PM-facing document. Contents:
- Executive Summary (what was investigated, what was found)
- Evidence Base (key findings from evidence threads)
- Competing Hypotheses (≥3, each with supporting evidence reference)
- Diagnostic Findings (per-lens insights)
- Recommended Experiments (ranked, falsifiable)
- Recommended Action (which hypothesis to test first, and why)

This is [INFERENCE] — the exact structure needs approval. The artifact is the CO's final synthesis informed by all prior steps.

---

# 3. DEPTH-DEPENDENT TOPOLOGY

## Quick Depth (revised from proposal)

```
CO [frame]
  ↓
RE [evidence summary + hypothesis generation — combined]
  ↓
QA [evaluate: ≥3 hypotheses, evidence grounding]
  ↓
CO [synthesis: findings + recommendation]
  ↓
QA [final gate]
  ↓
★ Investigate Report (hero)
```

Artifacts: 3 (evidence-hypotheses, diagnostic-synthesis, investigate-report)
Sub-agents: None
MC nodes: 5

## Balanced Depth (revised from proposal)

```
CO [frame investigation]
  ↓
RE Investigation Lead [evidence review]
  ↓
Evidence Summary [synthesize step]
  ↓
QA [evidence gate]
  ↓
RE/PS [hypotheses — ≥3]   PS [strategic diagnosis]
       ↓                         ↓
       └──────────┬──────────────┘
                  ▼
           CO [multi-lens synthesis]
                  ↓
           QA [validation gate]
                  ↓
           QA [experiment designs]
                  ↓
           PS [recommended action]
                  ↓
           QA [final gate]
                  ↓
     ★ Investigate Report (hero)
```

Sub-agents: None (GAP G_D1 — whether balanced gets sub-agents)
MC nodes: 10–11

## Deep Depth (revised from proposal)

```
CO [frame investigation]
  ↓
RE Investigation Lead
  ├──→ RE Sub-agent A [evidence domain 1]
  ├──→ RE Sub-agent B [evidence domain 2]
  └──→ RE Sub-agent C [evidence domain 3]
             ↓
      Evidence Synthesis [synthesize step]
             ↓
      QA [evidence gate]
             ↓
RE/PS [hypotheses]   UX [diagnosis]*   PS [diagnosis]
      ↓                   ↓                ↓
      └───────────────────┼────────────────┘
                          ▼
                   CO [multi-lens synthesis]
                          ▼
                   QA [validation gate]
                          ▼
                   QA [experiment designs]
                          ▼
                   PS [recommended action]
                          ▼
                   QA [final gate]
                          ▼
            ★ Investigate Report (hero)
```

*UX only when context signals warrant (Layer 2 selection)
Sub-agents: 2–3 (DelegationPolicy.maxWorkers)
MC nodes: 14–16 (depth-variable)

---

# 4. ARTIFACT CONTRACT AND LINEAGE

## 4.1 Artifact set (Balanced depth as baseline)

| ArtifactId | PM Name | Owner Step | Depends On |
|-----------|---------|-----------|-----------|
| `evidence-summary` | Evidence Summary | RE Lead (+ sub-agents if deep) | Uploaded context |
| `hypothesis-set` | Competing Hypotheses | RE/PS lens | evidence-summary |
| `diagnostic-findings` | Diagnostic Findings | CO multi-lens synthesis | hypothesis-set + all lens outputs |
| `experiment-designs` | Experiment Designs | QA | diagnostic-findings |
| `recommended-action` | Recommended Action | PS | experiment-designs |
| `investigate-report` | ★ Investigate Intelligence Report | CO (hero) | ALL prior artifacts |

Hero = `investigate-report`

## 4.2 Lineage chain

```
Uploaded evidence
        ↓
Evidence Summary (RE Lead)
        ↓
Hypothesis Set (RE/PS — ≥3, each citing evidence-summary finding)
        ↓                    ↓
UX Diagnosis*          PS Diagnosis
        ↓                    ↓
Diagnostic Findings (CO synthesis — integrates all lenses)
        ↓
Experiment Designs (QA — one experiment per hypothesis)
        ↓
Recommended Action (PS — which experiment first, fallback if confirmed/disconfirmed)
        ↓
★ Investigate Report (CO — full package)
```

*UX only at deep/exhaustive with relevant context signals

## 4.3 CO-OCCURRENCE IS NOT LINEAGE [CONTRACT]

The hypothesis-set must cite specific findings from evidence-summary by reference ID, not by co-occurrence. Each diagnostic finding must reference its supporting hypothesis by ID. Experiment designs must reference the hypothesis they test by ID. This lineage chain is deterministic, not inferred from proximity. [CONTRACT — D4 §19, D4 Part 34A]

---

# 5. EVALUATION GATES (QA)

Three QA gates appear in the full topology. Their placement and `EvaluationPolicy` is [INFERENCE] except where otherwise noted.

## Gate 1 — Evidence Gate (after Evidence Summary)

**Question:** Is the evidence base sufficient to generate reliable hypotheses?
**Check:** Sufficient source diversity · No single source dominates · Evidence is relevant to the investigation question
**EvaluationPolicy.failureBehavior:** [GAP G6] — if evidence is insufficient, does the step fail or advance with warning?
**Threshold:** [INFERENCE — suggest 70/100]

## Gate 2 — Validation Gate (after CO Synthesis)

**Question:** Is the diagnosis coherent? Is each finding traceable to a specific hypothesis?
**Check:** ≥3 hypotheses present [CONTRACT — D2 §15] · Each finding traces to ≥1 hypothesis · No contradictions unresolved
**≥3 hypotheses enforcement:** [GAP G6] — retry (quality-revision) or step-failure?
**Threshold:** [INFERENCE — suggest 75/100]

## Gate 3 — Final Gate (before Master artifact)

**Question:** Is the complete investigation package ready for PM consumption?
**Check:** All hypotheses testable · Experiments are falsifiable · Recommendation traces to at least one hypothesis · No orphaned findings
**EvaluationPolicy.failureBehavior:** [GAP G6]
**Threshold:** [INFERENCE — suggest 80/100]

---

# 6. MISSION CONTROL TOPOLOGY

## 6.1 Node definitions (Balanced depth — baseline)

```typescript
const INVESTIGATE_NODES_BALANCED = [
  { id: 'co-frame',      label: 'CO', sublabel: 'Mission Coordinator',    status: 'queued' },
  { id: 're-lead',       label: 'RE', sublabel: 'Investigation Lead',     status: 'queued' },
  { id: 'evidence-synth',label: 'RE', sublabel: 'Evidence Summary',       status: 'queued' },
  { id: 'qa-evidence',   label: 'QA', sublabel: 'Evidence Gate',          status: 'queued' },
  { id: 're-ps-hyp',     label: 'RE/PS', sublabel: 'Hypotheses',         status: 'queued' },
  { id: 'ps-diag',       label: 'PS', sublabel: 'Strategic Diagnosis',   status: 'queued' },
  { id: 'co-synthesis',  label: 'CO', sublabel: 'Multi-Lens Synthesis',   status: 'queued' },
  { id: 'qa-valid',      label: 'QA', sublabel: 'Validation Gate',        status: 'queued' },
  { id: 'qa-expts',      label: 'QA', sublabel: 'Experiment Designs',     status: 'queued' },
  { id: 'ps-action',     label: 'PS', sublabel: 'Recommended Action',     status: 'queued' },
  { id: 'qa-final',      label: 'QA', sublabel: 'Final Gate',             status: 'queued' },
];
// Hero artifact node connects to qa-final
```

## 6.2 Edge types (what edges represent)

| Edge | Type | Meaning |
|------|------|---------|
| co-frame → re-lead | execution dependency | Framing must precede investigation |
| re-lead → sub-agents | delegation | Parent dispatches bounded workers |
| sub-agents → evidence-synth | artifact dependency | Workers feed synthesis |
| evidence-synth → qa-evidence | evaluation | Gate validates evidence |
| qa-evidence → [lenses] | execution dependency + isolation | Lenses are independent of each other |
| [lenses] → co-synthesis | artifact dependency | All lenses feed CO |
| co-synthesis → qa-valid | evaluation | Gate validates diagnosis |
| qa-valid → qa-expts | execution dependency | Experiments follow valid diagnosis |
| qa-expts → ps-action | artifact dependency | Action follows experiments |
| ps-action → qa-final | evaluation | Final gate before hero |

Isolation edges (between lenses) must visually communicate "these do not see each other." [INFERENCE — visual treatment TBD]

## 6.3 Depth-variable nodes

At quick depth: the sub-agent fan-out and some diagnostic lenses collapse.
At deep/exhaustive: sub-agent nodes appear dynamically as the plan executes.

[INFERENCE] In V1, the node set is fixed per depth level at plan-compile time (determined by the step-registry). The node count does not change dynamically during execution. Dynamic node creation would require runtime plan mutation which is [CONTRACT] prohibited (ExecutionPlan is immutable).

## 6.4 PM-Native Activity Labels

```typescript
PM_ACTIVITY_TEXT['investigate'] = {
  'co-frame':       'Understanding your investigation question...',
  're-lead':        'Reviewing your evidence...',
  're-sub-A':       'Investigating evidence thread...',
  're-sub-B':       'Investigating evidence thread...',
  'evidence-synth': 'Synthesising evidence findings...',
  'qa-evidence':    'Validating evidence quality...',
  're-ps-hyp':      'Generating competing hypotheses...',
  'ps-diag':        'Running strategic diagnosis...',
  'ux-diag':        'Running experience diagnosis...',
  'co-synthesis':   'Synthesising diagnostic findings...',
  'qa-valid':       'Validating diagnosis...',
  'qa-expts':       'Designing experiments...',
  'ps-action':      'Formulating recommended action...',
  'qa-final':       'Final quality check...',
};
// Never expose: sub-agent count, model names, step IDs, token counts
```

---

# 7. CANONICAL SHELL INTEGRATION (NO NEW SURFACES)

## 7.1 Desk

```
EXISTING WorkspaceExplorer receives:
  WorkspaceNode[] where outcome === 'investigate'

Same isolation guard as Research:
  isInvestigateActive = v3RunInfo?.outcome === 'investigate'
                     && v3Artifacts.length > 0

Same tree structure as Research:
  [Investigation Root]
    └── Documents
          └── Investigation Findings
                ├── Evidence Summary
                ├── Competing Hypotheses
                ├── Diagnostic Findings
                ├── Experiment Designs
                ├── Recommended Action
                └── ★ Investigate Report
```

WorkspaceExplorer.tsx: NOT MODIFIED.
desk/page.tsx: ADD one `outcome === 'investigate'` guard alongside the existing `outcome === 'research'` guard. [ALLOWED file per change boundary]

## 7.2 Studio

```
EXISTING TipTap editor receives:
  rawContent = Investigate artifact content
  (fetched from /api/runs/{runId}/artifacts/{id})

Same v3 content-loading useEffect as Research.
No new editor. No new toolbar. No new viewer.
```

improve/page.tsx: ADD one case to the v3 content-loading useEffect for `outcome === 'investigate'`. [ALLOWED file per change boundary] The Investigate artifact content is markdown — it enters rawContent identically to Research. TipTapRenderer.tsx: NOT MODIFIED.

## 7.3 Mission Control

```
EXISTING graph renderer receives:
  INVESTIGATE_NODES_[DEPTH] array
  edges = execution dependency + artifact dependency structure above

Same routing branch pattern as Research:
  if (effectiveOutcome === 'investigate' && effectiveRunId) {
    return <InvestigateMissionControl runId=... />;
  }
```

InvestigateMissionControl: a NEW component that follows the EXACT same pattern as ResearchMissionControl. It is not a parallel shell — it is an outcome-specific data component that feeds the existing graph renderer.

mission-control/page.tsx: ADD routing branch. [ALLOWED]

---

# 8. IMPLEMENTATION BOUNDARY

## 8.1 NEW files (not modifications of existing working code)

```
src/core/outcome-runtime/step-registry/investigate.js
  — Step definitions for each depth level
  — DelegationPolicy per depth
  — EvaluationPolicy per gate
  — PM activity labels

src/components/mission-control/InvestigateMissionControl.tsx
  — Follows ResearchMissionControl pattern exactly
  — Receives runId, depth, isCompleted
  — Subscribes to SSE, updates INVESTIGATE_NODES_[depth]
  — Passes node data to existing graph renderer
```

## 8.2 ALLOWED modifications

```
src/app/mission-control/page.tsx
  — Add: if (outcome === 'investigate') routing branch
  — Do not touch: Research branch, Build branch, shell components

src/app/desk/page.tsx
  — Add: outcome === 'investigate' workspace tree injection
  — Same guard pattern as Research
  — Do not touch: Research guard, Build tree, WorkspaceExplorer

src/app/improve/page.tsx
  — Add: v3 content-loading case for outcome === 'investigate'
  — Do not touch: existing Build path, Research path, TipTap, FormattingToolbar
```

## 8.3 ABSOLUTELY PROTECTED

```
coordinator-v2.js / lifecycle-engine.js / llm.js
WorkspaceExplorer.tsx
TipTapRenderer.tsx / FormattingToolbar.tsx
GlobalStore.tsx
ResearchMissionControl.tsx (working reference — read only)
executor.js (read to understand pattern; do not modify unless tracing proves dependency)
```

---

# 9. OPEN GAPS — DECISIONS REQUIRED BEFORE IMPLEMENTATION

| ID | Question | Blocker for | Decision needed |
|----|----------|-------------|-----------------|
| G6 | When <3 hypotheses returned: retry (quality-revision) or step failure? | Investigate (hard gate enforcement) | Product decision: revise-then-fail or advance-with-warning? |
| G_D1 | Does balanced depth use sub-agents or not? | Investigate step-registry for balanced | If yes: maxWorkers? If no: RE Lead handles evidence directly |
| G_D2 | Experiment design: QA generates, or RE/PS generates + QA evaluates? | Investigate step-registry | QA as generator is unusual; validate this is the intended model |
| G_D3 | What is the exact content structure of the Master/Hero Investigate Report? | investigate-report artifact shape | Sections: executive summary + evidence + hypotheses + findings + experiments + recommendation? |
| G_D4 | Does UX appear at balanced depth, or only at deep/exhaustive when context signals warrant it? | Investigate step-registry balanced | Recommend: UX only at deep+ and only via Layer 2 context signal |
| G_D5 | What is DelegationPolicy.maxWorkers for investigate at deep and exhaustive? | Investigate DelegationPolicy | Recommend: deep = 3, exhaustive = 5 — requires approval |

---

# 10. ACCEPTANCE CRITERIA

**The Investigate orchestration is complete when ALL of these hold:**

```
□ Evidence uploaded → Investigate mission runs from Composer
□ Quick depth: 5-node linear graph in Mission Control
□ Balanced depth: ~11-node graph with parallel diagnostic lenses
□ Deep depth: sub-agent fan-out visible in Mission Control
□ All expected artifacts generated at canonical paths
□ artifact-index.json written with outcome='investigate', hero='investigate-report'
□ Desk shows Investigate workspace ONLY (not Build, not Research)
□ Six artifacts in Desk sidebar (balanced depth baseline)
□ ★ Investigate Report opens as default right-panel artifact
□ Clicking any artifact → opens in existing right panel (Build-style)
□ Studio opens Investigate artifacts in TipTap editor with FormattingToolbar
□ Improve + Accept work for Investigate artifacts
□ ≥3 hypotheses are present in the hypothesis-set artifact
□ Each hypothesis references a specific evidence-summary finding
□ Experiment-designs artifact contains one experiment per hypothesis
□ Investigate report traces recommendation to at least one hypothesis
```

---

# 11. GOLDEN REGRESSION GATE

Must be run BEFORE the Investigate sprint begins AND after it ends.

## Pre-sprint baseline (exact steps)

```
Build check:
  1. Run Build mission → Mission Control shows 15-stage Build graph
  2. Desk: Build workspace ONLY (no Investigate, no Research folder)
  3. Studio: Build artifact opens in TipTap with FormattingToolbar
  4. git diff HEAD -- src/components/shared/WorkspaceExplorer.tsx | wc -l  (= 0)
  5. git diff HEAD -- src/components/improve/TipTapRenderer.tsx | wc -l   (= 0)
  6. grep 'useTipTapRenderer.*true' src/lib/GlobalStore.tsx               (must match)
  Record: ✓ Build baseline confirmed

Research check:
  1. Run Research mission → Mission Control shows Research 5-node graph
  2. Desk: Research workspace ONLY (no Build artifacts)
  3. Artifact opens in right panel → Studio opens in TipTap
  4. Improve + Accept work
  Record: ✓ Research baseline confirmed
```

## Post-sprint regression verification

```
1. Investigate works end-to-end (acceptance criteria above)
2. Run Build → ✓ same as baseline (no change)
3. Run Research → ✓ same as baseline (no change)
4. Shell components: WorkspaceExplorer, TipTapRenderer, GlobalStore UNCHANGED
5. Desk isolation: Build workspace shows no Investigate folder
6. Desk isolation: Research workspace shows no Investigate folder
7. Desk isolation: Investigate workspace shows no Build/Research artifacts

ANY regression = STOP. Restore before any further sprint.
```

---

# 12. ANSWERS TO THE 16 REQUIRED QUESTIONS

```
□ Why these capabilities?
  RE (investigation), PS (hypothesis/strategy), QA (quality gates), CO (synthesis).
  Contract-established for investigate. UX added by context signal only.
  [CONTRACT + INFERENCE where UX]

□ Why these agents?
  RE is the primary investigator. PS brings strategic framing. QA acts as
  multi-point quality gating rather than a single final check.
  CO synthesizes across lenses.
  [CONTRACT for RE/QA/PS/CO; INFERENCE for multi-gate QA role]

□ Why sub-agents?
  Investigation often covers multiple separable evidence domains
  (e.g., user behavior data AND system logs AND support tickets).
  Sub-agents let the RE Lead investigate each domain in bounded parallel.
  [CONTRACT for eligibility; INFERENCE for domain-separation rationale]

□ When are sub-agents created?
  At deep and exhaustive depth only (D3 §11 mandate).
  Only when the RE Lead identifies separable evidence domains.
  [CONTRACT — deep/exhaustive; INFERENCE — domain-separation trigger]

□ What causes parallelism?
  Sub-agents in parallel (deep/exhaustive depth).
  Diagnostic lenses in parallel (balanced+). Both use mustNotReceiveOutputFrom.
  [CONTRACT for isolation mechanism; INFERENCE for topology]

□ What causes sequential execution?
  Evidence must precede hypotheses. Hypotheses must precede experiments.
  QA gates create mandatory checkpoints. These are genuine dependencies.
  [INFERENCE — grounded in PM methodology]

□ What does each agent produce?
  RE Lead → evidence-summary
  RE/PS lens → hypothesis-set (≥3)
  PS lens → strategic diagnostic finding (section in diagnostic-findings)
  UX lens → experience diagnostic finding (section in diagnostic-findings, if present)
  CO → diagnostic-findings + investigate-report
  QA → evaluation results (gates); experiment-designs artifact
  PS → recommended-action artifact
  [INFERENCE — requires approval per artifact]

□ How are artifacts linked?
  Explicit lineage: each artifact references prior artifact IDs in its TaskSpec.
  hypothesis-set.objective cites evidence-summary.
  diagnostic-findings.objective cites hypothesis-set.
  CO-OCCURRENCE IS NOT LINEAGE. [CONTRACT — D4 §19]

□ How is evidence lineage preserved?
  Each hypothesis must cite a specific finding in evidence-summary by reference.
  Each diagnostic finding must reference ≥1 hypothesis by ID.
  Lineage is deterministic, traced through artifact IDs.
  [CONTRACT — D4 §19 + D4 Part 34A]

□ Where does QA validate?
  Three gates: evidence, diagnosis, final. [INFERENCE]
  EvaluationPolicy.failureBehavior = [GAP G6]

□ What is the master artifact?
  investigate-report: executive summary + evidence base + hypotheses +
  diagnostic findings + recommended experiments + recommended action.
  [INFERENCE — structure requires approval]

□ What nodes/edges/events in Mission Control?
  Nodes per depth (Quick=5, Balanced=11, Deep=14+).
  Edges = execution dependency + artifact dependency + delegation.
  Events: standard 27 SSE events (D3 §17.2). [CONTRACT]

□ How does depth change execution?
  Quick: linear, no sub-agents, fewer lenses.
  Balanced: lenses in parallel, no sub-agents. [GAP G_D1]
  Deep: sub-agents (2–3) + full lens set including UX.
  Exhaustive: more sub-agents (up to 5) + extended lens set.
  [INFERENCE + GAP G_D1, G_D4, G_D5]

□ How does the same Desk render the output?
  Investigate WorkspaceNode[] fed to existing WorkspaceExplorer.
  Same tree structure depth as Research. Same isolation guard.
  WorkspaceExplorer.tsx unchanged. [PROVEN pattern]

□ How does the same Studio edit the output?
  rawContent = Investigate artifact markdown.
  TipTap renders, FormattingToolbar operates.
  Improve/Accept workflow unchanged.
  TipTapRenderer.tsx unchanged. [PROVEN pattern]

□ How are Build and Research protected?
  Shell components untouched. New code is additive (new files + routing branches).
  Active workspace isolation guard prevents cross-contamination.
  Golden regression gate run before and after sprint. [PROVEN]
```

---

# 13. REMAINING DECISIONS NEEDED FROM OWNER

Before the Investigate implementation sprint can begin, the following must be decided:

1. **G6: Hypothesis gate enforcement.** When QA gate finds <3 hypotheses, is the behavior: (a) `revise-then-fail` (Engine requests another hypothesis generation attempt); or (b) `advance-with-warning` (flag in artifact but proceed)? Recommend: `revise-then-fail` up to `maxRevisions`, then `advance-with-warning`. Requires approval.

2. **G_D1: Balanced depth and sub-agents.** Does balanced depth use sub-agents? Recommend: No — sub-agents at deep/exhaustive only per contract. Requires confirmation.

3. **G_D2: Who generates experiment designs?** QA as generator (current proposal) or RE/PS generate + QA evaluates? Recommend: QA generates experiments (its testability expertise) + CO final gate evaluates them. Requires approval.

4. **G_D3: Investigate Report structure.** Approve or amend the section structure proposed in §4.1.

5. **G_D4: UX at balanced depth?** Recommend: UX only at deep/exhaustive via Layer 2 context signal. Requires confirmation.

6. **G_D5: DelegationPolicy.maxWorkers.** Recommend: deep = 3, exhaustive = 5. Requires approval.

---

*IDEAGATE-INVESTIGATE-ARCHITECTURE-PLAN.md · August 2026*
*PLAN ONLY — No code. Decisions listed in Section 13 must be resolved before sprint begins.*
