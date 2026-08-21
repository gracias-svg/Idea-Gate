# IDEAGATE — REMAINING ORCHESTRATION EXPLORATION
## Architectural Decision Framework · Pre-Implementation
### Version 1.0 · August 2026 · EXPLORATION ONLY — no implementation authorized

---

> **Notation used throughout:**
> **[CONTRACT]** = documented in D1–D7, verified during the cross-document audit
> **[INFERENCE]** = my architectural reasoning, requires your approval before it becomes contract
> **[GAP]** = not established by the document set; needs a decision

---

# PART 1 — WHAT IS ALREADY SETTLED

## 1.1 The fixed shell (never varies)

```
Composer → Desk/WorkspaceExplorer → Studio/TipTap → Mission Control
```
Four surfaces. One implementation each. Every orchestration flows through them unchanged.

## 1.2 The variable layer (changes per outcome)

```
OutcomeId → Recipe → Capabilities → Topology → Steps → Artifacts → Graph data → WorkspaceNode[]
```

## 1.3 The six canonical recipes **[CONTRACT — D2 §7, D5 §7.1]**

| Recipe | Execution shape | Currently used by |
|---|---|---|
| `structured-delivery` | Sequential specialist chain | build, casestudy, decide, prioritize, plan |
| `research-first` | Evidence gathering → analysis → synthesis | research, investigate |
| `parallel-critique` | Independent critics → synthesis | review, council |
| `council` | Independent assessors → aggregation | council |
| `red-blue-debate` | Two opposing positions → adjudication | decide (override only) |
| `goal-based-research-loop` | Bounded iteration until goal met | research (with goal) |

**No new recipes may be created.** Every remaining outcome maps to one of these six.

## 1.4 Capability assignments **[CONTRACT — D2 §4 DOMAIN_CAPABILITY_MAP]**

| Outcome | Domain capabilities | CO present? |
|---|---|---|
| investigate | RE, QA, PS | Yes (via recipe) |
| prioritize | PS, QA | **No** |
| plan | AR, PS, QA | **No** |
| review | context-driven (PS/UX/AR/QA) | Yes |
| decide | PS | Yes |
| council | context-driven | Yes |
| casestudy | RE, PS | **No** |

The three outcomes without CO (prioritize, plan, casestudy) are architecturally significant — they produce a single coherent deliverable that doesn't need coordination synthesis. This is a deliberate contract decision, not an oversight.

---

# PART 2 — OUTCOME-BY-OUTCOME EXPLORATION

---

## 2.1 INVESTIGATE

**PM job:** "Something is happening in my product and I don't know why. Find the cause and tell me how to test it."

**What makes it different from Research:** Research explores an open question about the external world. Investigate diagnoses a *specific observed problem* using *evidence the PM already has*. Research is outward-facing discovery; Investigate is inward-facing root-cause analysis.

**Contract facts:**
- Requires context **[CONTRACT — D2 §2.4]** — cannot run without uploaded evidence
- Recipe: `research-first` **[CONTRACT — D2 §7]**
- Capabilities: RE, QA, PS + CO **[CONTRACT — D2 §4]**
- Minimum 3 hypotheses **[CONTRACT — D2 §15]**

**Candidate topology [INFERENCE]:**
```
CO (frame the investigation)
  ↓
RE — Evidence Summary (what the data actually shows)
  ↓
PS — Hypothesis Set (≥3 competing explanations, generated FROM evidence)
  ↓
QA — Experiment Designs (how to test each hypothesis)
  ↓
CO — Recommended Action (which hypothesis to test first and why)
```

**Why sequential, not parallel:** Hypotheses cannot be generated before evidence is summarized. Experiments cannot be designed before hypotheses exist. This is a genuine dependency chain, not an arbitrary ordering. Parallelizing would produce hypotheses disconnected from evidence — exactly the failure mode Investigate exists to prevent.

**The hypothesis-count rule is the interesting part.** Three hypotheses minimum is a *deterministic gate*, not a suggestion. If PS returns fewer than three, the Engine should reject and re-invoke. This is one of the few places where a hard numeric quality gate is contractually specified.

**Artifacts and their relationship [INFERENCE from D5 pattern]:**
```
evidence-summary ──┐
                   ├──→ hypothesis-set ──→ experiment-designs ──→ recommended-action
context/uploads ───┘                                                    (hero)
```

**Mission Control nodes:** 5. Edges = execution dependency (each step feeds the next).
**Desk:** Research Intelligence-equivalent section, 5 artifacts, hero = recommended-action.
**Studio:** Same TipTap editor. No changes required.

**Evidence/validation:** Every hypothesis must trace to a specific finding in the evidence summary. This is the outcome where "CO-OCCURRENCE IS NOT LINEAGE" matters most — a hypothesis must not be justified by "the evidence mentions X" but by "finding N in evidence-summary supports this."

**Complexity: LOW.** Structurally identical to Research (5 sequential steps, one synthesis). The only new element is the hypothesis-count gate.

**Recommendation:** Build this first. It reuses the Research pattern almost exactly and validates that the pattern generalizes.

---

## 2.2 PRIORITIZE

**PM job:** "I have a list of things. Tell me what order to do them in and why."

**What makes it different:** No discovery. No investigation. The inputs already exist — the PM supplies the items. This is *scoring and sequencing*, not generation.

**Contract facts:**
- Recipe: `structured-delivery` **[CONTRACT — D2 §7]**
- Capabilities: PS, QA — **no CO** **[CONTRACT — D2 §4]**
- Items may come from intent text OR uploads **[CONTRACT — D6 Part 30A §30A.2]** — does *not* require a formal context attachment

**Candidate topology [INFERENCE]:**
```
PS — Ranked List (score items against a framework: RICE/ICE/value-effort)
  ↓
QA — Sequence & Dependencies (validate ordering, surface conflicts)
```

**Why only 2 steps and no CO:** The contract deliberately omits CO. Prioritization produces one coherent artifact — a ranked list with justification. There is nothing to synthesize across because there is only one line of reasoning. Adding a coordinator would be architectural theater.

**Why QA and not another PS pass:** QA's role here is genuinely different — it checks whether the ranking is *internally consistent* (does item 3 depend on item 7? then the order is wrong) rather than re-scoring. This is validation, not generation.

**Artifacts [INFERENCE]:**
```
ranked-list (scored, with rationale per item)
  ↓
delivery-sequence (hero — ordering with dependency notes)
```

**Mission Control nodes:** 2. This is the simplest orchestration in the system.

**The interesting design question:** Should Mission Control show a 2-node graph? A two-node graph looks anemic next to Build's 15-stage lifecycle. **[INFERENCE]** The honest answer is yes — show 2 nodes. Padding it with fake nodes would violate the "no fake agents" principle. The graph should communicate *this is a fast, focused operation*, not pretend to be a research team.

**Complexity: MINIMAL.** This should take one implementation session.

**Recommendation:** Build this second. It proves the shell handles minimal orchestrations without looking broken.

---

## 2.3 PLAN

**PM job:** "I know what to build. Break it into a sequence of work my engineers can execute."

**Contract facts:**
- Recipe: `structured-delivery` **[CONTRACT]**
- Capabilities: AR, PS, QA — **no CO** **[CONTRACT — D2 §4]**
- AR is the lead capability here, which is unusual — most outcomes are PS-led

**Candidate topology [INFERENCE]:**
```
AR — Epic Hierarchy (decompose scope into epics → stories)
  ↓
AR — Dependency Map (what blocks what, technical ordering constraints)
  ↓
PS — Sprint Sequence (business-priority-aware ordering within technical constraints)
  ↓
QA — Readiness Validation (are stories testable? is anything under-specified?)
```

**Why AR twice:** Decomposition and dependency mapping are both architectural judgments requiring the same technical context. Splitting them across capabilities would lose coherence. **[INFERENCE — needs approval]** Two invocations of the same capability with different objectives is architecturally legitimate (D3 supports multiple instances of a capability), but it is worth confirming this is desired rather than collapsing them into one step.

**The genuine tension in this outcome:** AR wants technically-correct ordering. PS wants business-value ordering. These conflict. The sequence step is where that conflict gets resolved. **[INFERENCE]** This makes Plan the only non-Debate outcome with an inherent adversarial element — and it's resolved by sequencing (AR constrains, PS optimizes within constraints), not by debate.

**Artifacts [INFERENCE]:**
```
epic-hierarchy ──→ dependency-map ──→ sprint-sequence (hero) ──→ readiness-check
```

**Mission Control edges:** Here edges are genuinely *artifact* dependencies, not just execution order. The sprint sequence literally cannot exist without the dependency map. Worth visualizing differently from Research's evidence-flow edges. **[INFERENCE]**

**Complexity: MEDIUM.** Four steps, one repeated capability, a real constraint-resolution moment.

---

## 2.4 REVIEW

**PM job:** "I wrote something. Tell me what's wrong with it."

**Contract facts — and one unresolved contradiction:**
- Requires context **[CONTRACT — D2 §2.4]** — cannot run without an artifact to review
- Recipe: `parallel-critique` **[CONTRACT — D5 Invariant 17, D5 §16.4]**
- **[CONTRACT CONFLICT — flagged in the cross-document audit]** D2 §7.2 auto-selection text says "Review: Phase 1/2: structured-delivery (sequential critique fallback)" while D2's own routing summary table and D5 both say `parallel-critique`. D5 Invariant 17 resolves this in favor of `parallel-critique`. **This still requires a D2 amendment.**
- Capabilities: context-driven — PS, UX, AR, QA selected based on what the document *is* **[CONTRACT — D2 §4, D5 §16.3]**

**Candidate topology [CONTRACT-DERIVED]:**
```
        ┌── PS  (strategic critique) ──┐
        │                              │
CO ─────┼── UX  (usability critique) ──┼──→ CO Synthesis
        │                              │
        ├── AR  (technical critique) ──┤
        │                              │
        └── QA  (completeness) ────────┘
```

**This is the first genuinely parallel topology.** The critics must NOT see each other's output — that is the entire point. If UX sees AR's critique first, UX anchors on it and you get one critique wearing four hats instead of four independent perspectives.

**This makes isolation enforcement architecturally load-bearing.** D3's `mustNotReceiveOutputFrom` field exists precisely for this. Each critic step must declare that it must not receive the other critics' outputs. Only the CO synthesis step receives all four.

**Context-driven capability selection is the other novel element.** A PRD gets PS+UX+QA. An architecture doc gets AR+QA. A research brief gets RE+PS. The Router must inspect the *document type* to select critics. **[GAP]** — D2 §4 Layer 2 describes context signals but the exact signal→capability mapping for Review is not fully enumerated in the documents I audited. This needs to be specified before implementation.

**Mission Control implication:** The graph fans out then converges. Visually this is the most interesting orchestration — four parallel nodes running simultaneously, then merging. **[INFERENCE]** In V1 these will likely execute sequentially (no concurrency infrastructure yet per D3's `maxConcurrentSteps`), which creates an honesty problem: the graph shows parallelism that isn't actually parallel. Options: (a) show them as parallel nodes but light them sequentially — accurate to dependency, not to timing; (b) wait for true concurrency. **Recommend (a)** — the topology *is* parallel (no dependencies between critics), only the execution is serialized. The graph should show the dependency structure, which is honest.

**Complexity: MEDIUM-HIGH.** Isolation enforcement is new. Context-driven capability selection is new. Fan-out/fan-in graph is new.

---

## 2.5 COUNCIL

**PM job:** "I need multiple senior perspectives on this before I commit."

**How Council differs from Review — this is the subtle one:**
- Review critiques *an artifact* — it finds flaws in something that exists
- Council assesses *a question or decision* — it gathers independent judgments on something not yet decided

Review is retrospective and document-anchored. Council is prospective and question-anchored.

**Contract facts:**
- Recipe: `council` **[CONTRACT — D2 §7, D5 §7.1]**
- Capabilities: context-driven **[CONTRACT — D2 §4]**
- Uses `aggregate` step type **[CONTRACT — D3 §14 step type vocabulary]** — distinct from `synthesize`

**The `aggregate` vs `synthesize` distinction matters [CONTRACT-DERIVED]:**
- `synthesize` = combine into a unified narrative (Research brief does this)
- `aggregate` = collect independent judgments preserving their distinctness (Council does this)

A council output should *not* dissolve the assessors into one voice. The PM needs to see: "PS says X, AR says Y, they disagree on Z." That disagreement is the product. Synthesis would destroy it.

**Candidate topology [CONTRACT-DERIVED]:**
```
        ┌── Assessor 1 (independent) ──┐
CO ─────┼── Assessor 2 (independent) ──┼──→ CO Aggregation
        └── Assessor 3 (independent) ──┘
                                          (preserves dissent)
```

**Artifacts [INFERENCE]:**
```
assessor-1-position ─┐
assessor-2-position ─┼──→ council-recommendation (hero)
assessor-3-position ─┘     — includes an explicit "where assessors disagreed" section
```

**The design question worth resolving before implementation [GAP]:** Should individual assessor positions be separate artifacts in Desk, or sections within one aggregated document? Research produces 5 separate artifacts. Council could produce 4 (3 positions + aggregation) or 1 (aggregation containing all positions). **[INFERENCE]** Separate artifacts are more honest — the PM can read one assessor's full reasoning without the aggregator's framing. But it clutters Desk for a decision-support outcome. Worth deciding explicitly.

**Complexity: MEDIUM.** Same isolation requirement as Review. New `aggregate` semantics.

---

## 2.6 DECIDE

**PM job:** "Two options. Which one, and why?"

**Contract facts — and the resolved conflict:**
- Recipe: `structured-delivery` by default **[RESOLVED in D7 v1.2 cross-document audit]**
- `red-blue-debate` requires explicit `orchestrationOverride: 'debate'` **[CONTRACT — D5 §18, D6 §10.2]**
- **[CONTRACT CONFLICT — still requires D2 amendment]** D2 §7.2 lists Decide → red-blue-debate as the default. D5/D6/D7 all treat debate as opt-in. The audit resolved in favor of opt-in based on D6 being the approved UX freeze candidate. D2 §7.2 text needs correcting.
- Debate is incompatible with casestudy **[CONTRACT — D2 §2.4]**
- Capabilities: PS + CO **[CONTRACT]**

**Two topologies, one outcome — this is architecturally unique.**

**Default (no override):**
```
PS — Decision Framing (what are we actually deciding?)
  ↓
PS — Options Analysis (evidence for each option)
  ↓
CO — Recommendation (hero)
```

**With `orchestrationOverride: 'debate'`:**
```
        ┌── PS[blue] — Position For ──┐
CO ─────┤                             ├──→ CO[judge] — Adjudication
        └── PS[red]  — Position Against ┘
```

**The debate variant introduces `instanceRole` [CONTRACT — D3 §7.2 HarnessInvocation.instanceRole].** The same capability (PS) runs twice with different framing: blue advocates, red opposes. This is the only outcome using instance roles. The `judge` step type also appears only here.

**Isolation is absolute in debate mode.** Blue must not see red's argument, and vice versa. If either sees the other, you get a converged position rather than a genuine adversarial test. `mustNotReceiveOutputFrom` is load-bearing.

**Mission Control implication:** The debate graph should *look* adversarial — two nodes visually opposed, converging on a judge. This is the one place where the graph topology itself communicates the methodology. **[INFERENCE]** Worth a distinct visual treatment (blue/red accent colors) while using the same graph renderer.

**Complexity: MEDIUM.** Two code paths for one outcome. `instanceRole` and `judge` step type are both new.

---

## 2.7 CASE STUDY

**PM job:** "Turn this messy set of facts into a narrative I can present."

**Contract facts:**
- Recipe: `structured-delivery` **[CONTRACT]**
- Capabilities: RE, PS — **no CO, no QA** **[CONTRACT — D2 §4]**
- Debate is explicitly incompatible **[CONTRACT — D2 §2.4]**

**Candidate topology [INFERENCE]:**
```
RE — Evidence & Context Assembly (what actually happened, chronologically)
  ↓
PS — Narrative Construction (hero — the case study itself)
```

**Why no QA:** The contract omits QA deliberately. A case study is a narrative artifact — its quality is judged by coherence and persuasiveness, not by completeness against a checklist. QA's validation model doesn't apply.

**Why no CO:** Same reason as Prioritize — one coherent output, one line of reasoning, nothing to coordinate.

**Why debate is prohibited [CONTRACT]:** Narrative authorship requires a single voice. Two competing narratives adjudicated by a judge produces neither a case study nor a decision.

**The interesting constraint:** This is the only outcome where *voice consistency* is a quality dimension. **[INFERENCE]** The PS narrative step should receive the RE evidence as context but should not be constrained to RE's structure — it needs freedom to reorganize chronology into narrative arc.

**Complexity: MINIMAL.** Two steps. Simplest orchestration alongside Prioritize.

---

# PART 3 — CROSS-OUTCOME PATTERNS

## 3.1 The four structural families

Rather than seven bespoke orchestrations, the outcomes cluster into four families:

**Family A — Sequential specialist chain** (structured-delivery)
`prioritize · plan · casestudy · decide (default)`
- Each step depends on the previous
- No isolation requirements
- Simplest graph: linear chain
- **Shares one implementation pattern**

**Family B — Evidence-first pipeline** (research-first)
`research · investigate`
- Evidence gathering → analysis → synthesis
- Already proven with Research
- **Investigate reuses Research's implementation shape directly**

**Family C — Isolated parallel + convergence** (parallel-critique, council)
`review · council`
- Independent contributors who must not see each other
- Requires `mustNotReceiveOutputFrom` enforcement
- Fan-out/fan-in graph
- Differ only in synthesis semantics: Review *synthesizes*, Council *aggregates*
- **Shares one implementation pattern with a synthesis-mode flag**

**Family D — Adversarial** (red-blue-debate)
`decide (with override)`
- Two opposing instances of one capability
- Requires `instanceRole` and `judge` step type
- **Only member of this family** — no other outcome uses debate

## 3.2 What this means for implementation sequencing

```
Sprint 1: INVESTIGATE     (Family B — reuses Research pattern exactly)
Sprint 2: PRIORITIZE      (Family A — simplest, proves minimal orchestration)
Sprint 3: CASE STUDY      (Family A — second member, confirms pattern)
Sprint 4: PLAN            (Family A — most complex member)
Sprint 5: REVIEW          (Family C — introduces isolation enforcement)
Sprint 6: COUNCIL         (Family C — reuses Review's isolation, adds aggregate)
Sprint 7: DECIDE          (Families A + D — both paths, most complex)
```

Sprints 1–4 require **no new orchestration primitives**. They are step-registry files plus routing branches. Sprint 5 introduces isolation. Sprint 7 introduces instance roles.

**[INFERENCE]** This ordering means the first four outcomes could plausibly ship in 4–6 Claude Code sessions total, because each is a step-registry file plus a Mission Control node array plus a Desk tree condition — the same three-touch-point pattern Research established.

## 3.3 What is shared across all seven (do not customize)

| Shared element | Why it must not vary |
|---|---|
| WorkspaceExplorer | Receives `WorkspaceNode[]` — orchestration is invisible to it |
| TipTap Studio editor | Receives `rawContent` — artifact origin is irrelevant |
| Mission Control graph renderer | Receives nodes + edges as data |
| Artifact persistence path | `runs/{runId}/artifacts/{id}/v1.md` for all |
| `artifact-index.json` schema | Same shape, different contents |
| SSE event vocabulary | Same 27 events (D3 §17.2) |
| Active workspace isolation rule | Same guard, different outcome value |
| Improve/Accept workflow | Identical for all artifacts |

## 3.4 What genuinely varies

| Variable element | Range across outcomes |
|---|---|
| Step count | 2 (prioritize, casestudy) → 5 (research, investigate) |
| Capability set | 2 (casestudy) → 5 (review) |
| Topology | linear · fan-out/fan-in · adversarial |
| Isolation requirements | none · critic-isolation · debate-isolation |
| Synthesis mode | none · synthesize · aggregate · judge |
| Hard gates | none · ≥3 hypotheses (investigate) |
| Instance roles | none · blue/red/judge (decide-debate only) |

---

# PART 4 — OPEN QUESTIONS REQUIRING DECISIONS

These are **[GAP]** items — not answerable from the document set. Each needs a decision before its outcome is implemented.

| # | Question | Affects | Why it matters |
|---|---|---|---|
| G1 | What context signals map to which Review critics? | Review | D2 §4 Layer 2 describes context-driven selection but doesn't enumerate the Review mapping |
| G2 | Should Council assessor positions be separate Desk artifacts or sections within one? | Council | Affects artifact count, Desk clutter, and whether dissent is independently readable |
| G3 | Should Plan use AR twice, or collapse decomposition + dependency into one step? | Plan | Affects step count and whether repeated-capability invocation becomes a pattern |
| G4 | Does the Mission Control graph show parallel topology when V1 executes serially? | Review, Council | Honesty question: dependency-accurate vs timing-accurate |
| G5 | Should a 2-node graph (Prioritize) get any visual treatment to avoid looking broken? | Prioritize, Case Study | Product polish vs no-fake-complexity principle |
| G6 | When Investigate returns <3 hypotheses, is that a retry or a step failure? | Investigate | D2 §15 states the minimum but not the enforcement behavior |

---

# PART 5 — THE ARCHITECTURAL SUMMARY

**What is fixed:** Four shell surfaces, one artifact path, one event vocabulary, one editor, one workspace explorer, one graph renderer.

**What varies:** Which agents run, in what order, with what isolation, producing which artifacts.

**Why each outcome needs its topology:**
- Investigate is sequential because hypotheses require evidence first
- Prioritize is two steps because scoring and validating are the whole job
- Plan is four steps because technical and business ordering genuinely conflict
- Review is parallel-isolated because independent critique is the product
- Council is parallel-isolated because preserved dissent is the product
- Decide is adversarial *when the PM opts in* because some decisions need stress-testing
- Case Study is two steps because narrative requires a single voice

**How artifacts flow through the shell:** Identically for all seven. Executor writes to canonical path → `artifact-index.json` → Desk `WorkspaceNode[]` → click → `rawContent` → TipTap. No orchestration touches this pipeline.

**How Mission Control makes execution observable:** Same renderer, different node/edge data. Linear chains for Family A. Evidence pipelines for Family B. Fan-out/fan-in for Family C. Adversarial convergence for Family D.

**How we prove it did the right work:** Per-outcome evaluation dimensions from D5, plus the shared regression gate — Build unchanged, Research unchanged, shell components untouched.

---

*This is exploration, not specification. Nothing here is implementable until the [GAP] items are decided and the [INFERENCE] items are approved.*
