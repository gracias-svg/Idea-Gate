# IDEAGATE — MISSION COMPOSER UX & EXPERIENCE SPECIFICATION
## Document 6 of 7 | Version 1.2 — FREEZE CANDIDATE
## Status: Specification — Pre-Implementation

**Supersedes:** Document 6 v1.1 (which superseded v1.0)
**v1.1 corrections (preserved):** workspace memory default (opt-in); remove unsupported research-emphasis and context-focus controls; remove fake validation-log toggle; fix duplicate Investigate; depth is default-balanced (not mandatory gate); remove invented file limits; overhaul Advanced section; revise Run activation logic; add No-Invention Audit and Control Traceability.

**Depends on:**
- Document 1 — Mission Composer V1 Product Spec (FROZEN)
- Document 2 — Strategy Router + ExecutionPlan Spec V1.1 (FROZEN)
- Document 3 — Orchestration Engine + Agent Harness (FROZEN)
- Document 4 — PKS v1.2 Hardened (FROZEN)
- Document 5 — Outcome Engineering Contracts V1.3 (FROZEN)
- IdeaGate Design Blueprint V1.2 (AUTHORITATIVE visual/interaction)
- IdeaGate Visual Grammar V1.0 (AUTHORITATIVE construction)

**Feeds:** Document 7 — Implementation Specification

**Governing principle:**
> IdeaGate is a Product Operating System. A PM describes a job. IdeaGate understands
> it, configures itself, and produces PM artifacts worthy of a senior product team.
> The experience must make the reasoning visible without making the internals legible.

---

# PART 0 — INDEPENDENT DESIGN BRAINSTORM
## Senior PM × Staff Designer × Product Architect Challenge

Before writing any spec, a structured challenge of the existing direction against
mid-2026 product and interaction expectations.

## 0.1 The Central Tension

IdeaGate's Composer has a genuine design challenge that most AI products avoid:
it is not a chatbot input and it is not a forms-based settings panel. It is
something rarer — a **mission briefing interface**. The PM is briefing a smart
team. Every UX decision must reinforce that mental model or undermine it.

The compact-to-expanded bar from the Lovable prototype is the right instinct.
But the expansion must feel like the system is *engaging with the brief*, not
exposing its configuration surface. That's a meaningful distinction.

## 0.2 KEEP / ENHANCE / FUTURE SEAM / REJECT

| Element | Decision | Rationale |
|---|---|---|
| Compact bar → expanded surface | **KEEP + ENHANCE** | Right instinct. The metaphor is correct. Enhance the expansion choreography so it feels like engagement, not form-reveal. |
| Pill treatment for selected parameters | **KEEP + ENHANCE** | Clear affordance for "this is set / changeable." Enhance by making pills feel like confirmed choices, not filter chips. |
| Clear dedicated Run action | **KEEP** | The commitment moment must be unambiguous. |
| Outcome grid/list in expansion | **ENHANCE** | Add outcome descriptions ("what you'll get") that appear on hover/focus. Selection education is core to IdeaGate's PM value. |
| Depth as segmented control | **KEEP** | Right mechanism. Change the labels to be PM-native ("Quick / Balanced / Deep / Exhaustive" with explanatory copy). |
| Context attachment as secondary | **REJECT** | Context is a first-class input for IdeaGate, not a secondary option. It needs its own dedicated zone. |
| Exposing orchestration settings in main flow | **REJECT** | Orchestration is Strategy Router territory. Expose debate override in Advanced only. |
| Agent count / token estimates | **REJECT** | Not an established architectural contract; creates false precision. |
| Static placeholder text | **ENHANCE** | Add intent examples per outcome type that rotate or appear as suggestions. |
| Generic "Run" button label | **ENHANCE** | "Run Mission" is clearer than "Run." Small language precision. |
| Missing workspace context awareness | **ADD** | If prior project runs exist, the Composer should show "This project has prior research — IdeaGate will build on it." This is a core PKS differentiator. |
| No mission crystallization | **ADD** | As the user configures, a Mission Summary should gradually "crystallize" at the bottom, showing what IdeaGate is about to do in PM-native language. This is the signature trust moment. |
| No intent interpretation layer | **ADD** | A brief pause after intent typing should surface a contextual suggestion: "This sounds like an Investigate mission." Inference suggests; user governs. |
| No keyboard navigation | **ADD** | Cmd+K to open Composer, arrow keys for outcome selection, Enter to confirm depth — keyboard-first power users need this. |
| Saved templates | **FUTURE SEAM** | Preserve the seam for "Save as template" in Advanced, but don't implement yet. |
| Recent missions | **FUTURE SEAM** | A quick-access panel showing recent mission types and outcomes. Reserve the slot in the Composer footer. |
| Scheduled / continuous triggers | **FUTURE SEAM** | The Continuous Research outcome needs a "Schedule" option eventually. Reserve without implementing. |
| Team collaboration indicators | **FUTURE SEAM** | Multi-user context. Reserve without implementing. |

## 0.3 The Signature Interaction

The most important thing Document 6 must establish:

**Intent → Suggestion → Confirmation → Crystallization → Run**

Each step should feel like a conversation, not a form. By the time the PM
clicks Run, they should feel confident that IdeaGate understood their brief —
not that they finished filling out a settings panel.

The **Mission Crystallization** moment — where the Mission Summary visibly
"firms up" from vague placeholder text to a precise PM-native statement as
the user configures — is the signature interaction that distinguishes IdeaGate
from every generic AI workflow tool.

---

# PART 1 — EXPERIENCE NORTH STAR

## 1.1 The Defining Statement

> "Describe your PM question. IdeaGate understands the job, handles the
> methodology, and returns a complete PM artifact set — with the reasoning
> visible and the evidence traceable."

This is not a chatbot. This is not a document generator. This is a PM colleague
who knows structured product methodology, asks the right clarifying questions,
does the work, and shows their reasoning.

The Composer is where that conversation begins.

## 1.2 The Three-Sentence PM Test

If a PM cannot explain to a colleague what IdeaGate just did in three sentences
using only PM vocabulary — no AI jargon, no agent names, no token counts — then
the UX has failed.

**Pass example:**
> "I gave IdeaGate a question about our activation drop. It researched the
> problem, generated three hypotheses grounded in the attached analytics data,
> and designed experiments to test each one. The key claim about session length
> is cited and verified."

**Fail example:**
> "I put in my prompt and the coordinator sent it to the research agent who
> retrieved embeddings from the context window and ran four evaluation passes
> at 78% threshold."

Every UX decision is tested against this standard.

---

# PART 2 — USER AND PROBLEM FRAMING

## 2.1 Primary Users

| User type | Immediate job | IdeaGate value |
|---|---|---|
| **Staff/Senior PM** | Turn a product question into a structured artifact under time pressure | Speed + methodology rigor |
| **PM Leader** | Audit and validate a team's product reasoning | Evidence tracing + structured critique |
| **Founder/solo PM** | Do senior PM work without a senior PM team | Leverage + completeness |
| **PM student / aspiring PM** | Learn and practice structured PM methodology | Guided process + PM vocabulary |
| **Product strategist** | Research a market or competitive landscape systematically | Evidence + depth |

## 2.2 The Core Problem Being Solved

Good PM artifacts are time-intensive. Writing a proper PRD, discovery document,
or prioritized backlog takes hours of structured thinking that most PMs don't
have — especially early in their careers.

IdeaGate does not eliminate PM judgment. It eliminates the blank page, the
missing methodology, the unsourced assertion, and the disconnected sections.
The PM still owns the product thinking. IdeaGate does the structured work.

## 2.3 What PMs Do NOT Want to Think About

The Composer must abstract these completely:
- How many "agents" are working
- Which internal model is being used
- How many tokens the mission will consume
- What the "orchestration recipe" is
- How the context retrieval works
- What the evaluation threshold is
- The difference between run-scoped and project-scoped evidence

These are legitimate engineering concerns. They are not PM concerns.

---

# PART 3 — EXPERIENCE PRINCIPLES

Seven principles, in priority order. When two principles conflict, earlier wins.

## Principle 1 — Intent-First

The Composer begins with a natural-language description. Configuration follows
naturally from intent; it does not precede it. A PM should never need to
understand IdeaGate's architecture to run a mission.

*Governed by: Document 1 §2 (Mission Composer mental model)*

## Principle 2 — Suggest, Never Override

IdeaGate interprets intent and surfaces suggestions. But the user's explicit
choice always wins. The system never silently reconfigures itself after a user
has made a deliberate selection.

*Governed by: Document 2 §3 (normalization contract) — "explicit wins over inferred"*

## Principle 3 — Earned Complexity

Default state is minimal. Configuration depth reveals progressively, only when
the PM's input signals that more precision is needed or useful. Complexity is
never the default view.

*Inspired by: Design Blueprint Part II §3 (progressive disclosure)*

## Principle 4 — Visible Reasoning

IdeaGate explains what it's about to do in PM language. The Mission Summary
crystallizes from the PM's inputs before execution. After execution, the artifact
contains the reasoning, evidence citations, and Validation Log. The system never
claims certainty it cannot support.

*Governed by: Document 4 §36 (PKS Inspection API — what can be surfaced)*
*Document 5 §4.3 (Validation Log — claim-driven)*

## Principle 5 — Artifacts Are Deliverables

IdeaGate produces PM artifacts — structured, versionable, improvable documents —
not chat responses. The Desk is a workspace for PM artifacts. The Studio is where
they are improved. These are distinct surfaces with distinct mental models.

*Governed by: Document 5 Part 3 (artifact layer model)*

## Principle 6 — Evidence Is First-Class

Context attached to a mission becomes first-class input — not a raw dump.
Prior project knowledge is surfaced as an asset, not exposed as a technical
mechanism. Evidence citations appear in artifacts and Validation Logs.

*Governed by: Document 4 §5.1 (evidence lineage), §4.3 (Validation Log claim rule)*

## Principle 7 — Calm Authority

IdeaGate is confident without being presumptuous. It does not celebrate
completion with confetti. It does not apologize for limitations with excessive
hedging. It presents its work clearly and stands behind it — with the evidence
to back it up.

*Governed by: Design Blueprint §3 (emotional vocabulary): Confidence; Clarity; Trust*

---

# PART 4 — INFORMATION ARCHITECTURE

## 4.1 The Three Primary Surfaces

```
COMPOSER                    DESK                        STUDIO
──────────────────          ──────────────────          ──────────────────
Where missions start        Where artifacts live        Where artifacts improve

Intent → Configure          Navigate artifact set       Select → Improve
→ Summary → Run             Read / Inspect              → Visualize → Edit
                            Validation Log              → Version → Compare
Feeds: Mission Control      View Visual Representations
                            Stale notifications         Feeds back to Desk
↓
MISSION CONTROL
──────────────────
Where execution is observed
High-level progress (PM-native)
Complete → artifact appears in Desk
```

## 4.2 Navigation Rail Context

The Composer lives within the IdeaGate shell. It does not have its own
dedicated page. It can be:

1. **Persistent strip** — A compact bar that lives at the top or bottom of
   the workspace, always accessible.
2. **Triggered via Cmd+K** — Opens as an overlay/modal on the current view.
3. **Contextually promoted** — When Desk is empty for a project, the Composer
   is the primary element of the view.

Document 7 determines the specific placement within the NavRail + workspace shell
defined in Mission 14. Document 6 specifies behavior in all cases.

## 4.3 Workspace Context Awareness

The Composer is always aware of:
- Which project is currently open (projectId)
- Whether prior missions exist for this project (workspace memory)
- Whether there are stale artifacts that may need updating
- Whether Continuous Research loops are active

This awareness influences what the Composer shows proactively — not through
intrusive notifications, but through contextual signals in the Composer itself.

---

# PART 5 — COMPOSER MENTAL MODEL

## 5.1 The Metaphor

The PM is **briefing a smart, methodical colleague** on a product job.

The brief has:
- A description of the work ("What we're trying to figure out")
- A type of output expected ("Give me a research brief / a decision analysis")
- A level of depth ("Quick take or thorough analysis?")
- Supporting material to work from ("Here are the files you'll need")
- Any special constraints or preferences (Advanced)

This is not a form. It is a brief. The Composer should feel like one.

## 5.2 What the PM Should Never Need to Know

| Internal concept | What the PM sees instead |
|---|---|
| `outcomeId: 'investigate'` | "Investigate — Diagnose a product problem..." |
| `depth: 'balanced'` | "Balanced — Thorough analysis, evidence-backed" |
| `orchestrationOverride: 'debate'` | "Run as Debate: challenge this from both sides" |
| `capabilityId: 'RE'` | (invisible — the system handles this) |
| `tokenBudget: 48000` | (invisible — never shown) |
| `revisionAttempts: 2` | (invisible — the system handles quality) |
| `ContextContractUnsatisfiable` | "There's too much project context for this model. Try reducing attached files or selecting a narrower context." |
| `internalStageIndex: 7` | "PRD" (or the natural-language artifact name) |

---

# PART 6 — INTERACTION AND STATE MODEL

## 6.1 Composer State Type

**State machine principles:**
- Depth is NEVER a required gate. Document 2 §3.1 defaults `depth` to `'balanced'` automatically.
  The PM may change depth but is never blocked from Running because they didn't explicitly set it.
- Run becomes available when: `intentText` has sufficient content AND `outcome` is confirmed.
- Workspace memory is opt-in; default is excluded (`context.includeWorkspaceMemory: false`).
- The `depth-set` state is removed as a separate state — depth lives in the `configuring` state
  and defaults to `'balanced'` the moment an outcome is confirmed.

```typescript
type ComposerState =
  | { tag: 'idle' }
  | { tag: 'focused' }
  | { tag: 'typing'; intentText: string }
  | { tag: 'suggestion'; intentText: string; suggested: OutcomeDisplayId; confidence: 'high' | 'moderate' }
  | { tag: 'configuring';
      intentText: string;
      outcome: OutcomeDisplayId;
      depth: DepthLevel;            // always set; defaults to 'balanced' on outcome confirmation
      workspaceMemory: boolean;     // defaults to false (opt-in — Document 2 RunConfig default)
      contextItems: ContextItem[];  // files + URLs + selected artifacts
      advanced: AdvancedConfig;
      panelOpen: 'context' | 'advanced' | null;
    }
  | { tag: 'preflight'; mission: MissionSummary; validationState: 'pending' | 'valid' | 'warning' | 'error' }
  | { tag: 'error'; errorType: ComposerErrorType; recoverable: boolean }
  | { tag: 'submitting' }
  | { tag: 'running'; missionId: string }
  | { tag: 'completed'; missionId: string };

// PM-facing outcome display names (map to canonical OutcomeIds internally)
type OutcomeDisplayId =
  | 'build' | 'research' | 'investigate' | 'prioritize' | 'plan'
  | 'review' | 'decide' | 'council' | 'case-study';
// ↑ Exactly 9. No new outcomes. Maps to: build, research, investigate, prioritize,
//   plan, review, decide, council, casestudy (Document 5 canonical OutcomeIds)

type DepthLevel = 'quick' | 'balanced' | 'deep' | 'exhaustive';
// Matches Document 2 DepthLevel exactly.

type ComposerErrorType =
  | 'intent-too-short'
  | 'outcome-required'        // should not appear in normal flow — Run is blocked UX-side
  | 'context-file-error'
  | 'unsatisfiable-context'   // maps to ContextContractUnsatisfiable (Document 4 §14.3)
  | 'provider-error'
  | 'network-error';

// Run eligibility — derived from Document 2 §7 (OUTCOME_REQUIRES_CONTEXT) and Document 5:
//
//   For MOST outcomes:
//     Run available when: intent is non-trivially complete AND outcome is confirmed
//     Depth: always set (defaults to 'balanced'). Context: optional.
//
//   For REVIEW and INVESTIGATE specifically:
//     Document 2 §7 explicitly defines OUTCOME_REQUIRES_CONTEXT for these two.
//     Document 5 §16.2 (Review): "Required Inputs: The artifact to review"
//     Document 5 §20.2 (Investigate): "Required Inputs: Evidence (uploads)"
//     Run is BLOCKED until at least one context item is provided.
//     The context zone becomes prominent and the block reason is shown.
//
// See §6.x Run Eligibility by Outcome for the complete table.
```

## 6.1a Run Eligibility by Outcome

**Source:** Document 2 §7 (OUTCOME_REQUIRES_CONTEXT error table) + Document 5 per-outcome Required Inputs.

This table is the contractual source for the Run button's enabled/disabled state.

| Outcome | Intent required? | Context required? | Required context type | Run eligible when |
|---|---|---|---|---|
| Build | Yes | No | — | Intent + Outcome |
| Research | Yes | No (context strongly encouraged) | — | Intent + Outcome |
| Case Study | Yes | No | — | Intent + Outcome |
| Prioritize | Yes | Effectively yes | Items list (intent text or uploaded file) | Intent contains item list OR file attached |
| Plan | Yes | No | — | Intent + Outcome |
| Decide | Yes | No | — | Intent + Outcome |
| Council | Yes | No | — | Intent + Outcome |
| **Review** | Yes | **YES — hard requirement** | Uploaded artifact OR selected workspace artifact | Intent + Outcome + ≥1 context item |
| **Investigate** | Yes | **YES — hard requirement** | Uploaded evidence (analytics, research, transcripts) | Intent + Outcome + ≥1 context item |

**Notes:**
- `Review` and `Investigate` must show a clear context prompt and a disabled Run button until context is provided. The blocking reason must always be visible. *(Source: Document 2 §7 — OUTCOME_REQUIRES_CONTEXT)*
- `Prioritize` is a pragmatic soft-requirement: a list must exist for the outcome to produce anything meaningful. The intent text may serve as the list ("Rank: notifications, dark mode, export"). If the PM has confirmed intent that contains an item list, Run is eligible. If intent is clearly about context that hasn't been attached, the Mission Summary makes this visible.
- All other outcomes: context is optional and Run is never blocked by its absence.
- Depth NEVER blocks Run (defaults to Balanced for all outcomes).
- Workspace memory NEVER blocks Run (defaults to excluded).

**What the PM sees when blocked (Review / Investigate):**
```
[Run Mission  ▶ ]   ← disabled; grey; cursor: not-allowed

Below Run button, or beside context zone:
┌──────────────────────────────────────────────────────────────────────────┐
│ Upload [the artifact to review / evidence for this investigation]         │
│ to enable this mission.                                                    │
│                                                                            │
│ ↑  See context section above                                              │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 6.2 State: Idle

**What the PM sees:**
- Compact single-line bar (~48px height)
- Placeholder: `"Describe your PM question or goal..."`
- Left: IdeaGate monogram or subtle compass icon (12px)
- Right: Keyboard hint `⌘K` or `/` in `--ig-text-tertiary`, visible only on hover
- Background: `--ig-surface` with `--ig-border-default` hairline
- Workspace context indicator (right side, only if prior project context exists):
  small amber/emerald dot + "Prior context" in `--ig-text-tertiary`

**What is hidden:** All configuration, context panel, Mission Summary, Run button

**Trigger to leave:** Click anywhere on bar, type any character, press `⌘K`

## 6.3 State: Focused

**What the PM sees:**
- Bar height stays compact (~48px)
- `--ig-border-strong` emerald-tinted ring appears (2px, `--ig-emerald-dim`)
- Cursor: text cursor in the intent field
- Placeholder text becomes lighter, `--ig-text-tertiary`
- Keyboard hint fades out
- Subtle appearance of the expansion affordance below bar (ghost of the
  expanded surface: 2px gap, barely visible in `--ig-border-subtle`)

**What is hidden:** Full expanded surface (not yet)
**Motion:** `var(--ig-dur-quick) var(--ig-ease-out)` for border ring

## 6.4 State: Typing / Intent

**What the PM sees:**
- Bar has expanded to show intent textarea (~80–120px, 2–3 lines visible, grows to 5)
- Expansion: height animation from 48px → 120px, `var(--ig-dur-standard) var(--ig-ease-out)`, spring-like settle
- Intent text renders in `--ig-text-primary`, JetBrains Mono 14px (mono = "the machine understands")
- Below intent area: a horizontal separator, then Outcome and Depth rows appear (both unset)
- At very bottom: Mission Summary placeholder in `--ig-text-tertiary`: "Select an outcome to see your mission summary."
- Character count: not shown. Word/sentence count: not shown. No pressure signals.
- If workspace context exists: subtle card appears beside intent area:
  ```
  ╭──────────────────────────────╮
  │ 🗄 Prior project context      │
  │ 3 research runs · 12 findings │
  │ IdeaGate will build on this   │  ← clickable to see/hide
  ╰──────────────────────────────╯
  ```

**Suggestion timing:** After a brief pause in typing, if intent is sufficiently detailed, IdeaGate may transition to Suggestion state. The exact timing and detection logic are Document 7 implementation decisions; they must not auto-select an outcome.

## 6.5 State: Suggestion

**What the PM sees:**
- A non-intrusive suggestion strip appears between the intent textarea and the Outcome row:

  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │ ◈ This sounds like an Investigate mission.  [Use this ↵]  [×] │
  └─────────────────────────────────────────────────────────────────┘
  ```

  - `◈`: IdeaGate's "thinking" indicator (small animated emerald pulse, 2s period)
  - Text: `"This sounds like a [Outcome Name] mission."` — PM-native language
  - `[Use this ↵]`: accept suggestion, keyboard activatable
  - `[×]`: dismiss; outcome row remains unset
  - Background: `--ig-surface-raised`, `--ig-border-subtle`
  - Animation: slide-in from below + fade-in, `var(--ig-dur-quick) var(--ig-ease-out)`

**For 'moderate' confidence suggestions:**
  ```
  ◈ This could be Research or Investigate. Which fits better?
  ```
  Shows two outcome chips to tap.

**Critical rule — V1 behavior only:** Suggestion never auto-selects. The PM must
explicitly confirm the suggestion (pressing ↵ or clicking it) or dismiss it.

**The governing principle (permanent):** Explicit user choices win. Suggestion is
always a hint, never a routing decision. This is preserved even if Phase 2 introduces
inferred-outcome capabilities — the PM's explicit selection is always what the RunConfig
receives. "Suggest, never override" is an invariant, not a V1 limitation.

**What this maps to:**
- Document 2 §3.1: normalization contract, `explicit-over-inferred` rule
- Document 1: Mission Composer mental model (PM controls the brief)
- V1 implementation: suggestion is client-side heuristic on intent text
- Phase 2 (future seam): inferred outcomes from the Strategy Router — the same
  "explicit wins" rule applies; the only change is where the suggestion comes from

## 6.6 State: Outcome Confirmed

**What the PM sees:**
- The Outcome row now shows a **confirmed outcome pill**:
  ```
  [✓ Investigate  ×]
  ```
  - Pill: `--ig-surface-raised`, `--ig-border-strong` (emerald-tinted), `--ig-text-primary`
  - Checkmark: `--ig-emerald` (small, 10px)
  - The `×` allows changing the outcome
  - The suggestion strip (if shown) disappears cleanly

- **Below the outcome pill**: A one-line description of what this outcome will produce:
  ```
  Diagnose a product problem from evidence — returns hypotheses with experiment designs.
  ```
  Color: `--ig-text-secondary`, 12px, Inter.

- **Outcome grid** (for changing): clicking the outcome pill opens an inline grid overlay:
  ```
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  BUILD          RESEARCH        INVESTIGATE     PRIORITIZE              │
  │  Start with     Deep-dive       Diagnose a      Rank and               │
  │  an idea →      into a          problem →       sequence →             │
  │  full product   market/topic    hypotheses      a set of items         │
  │                                                                         │
  │  PLAN           REVIEW          DECIDE          COUNCIL                 │
  │  Turn scope     Critique an     Frame a         Multi-expert            │
  │  into delivery  existing        decision and    deliberation →          │
  │  plan           artifact        resolve it      synthesis              │
  │                                                                         │
  │  CASE STUDY                                                            │
  │  Document a                                                            │
  │  decision or                                                           │
  │  experience                                                            │
  └─────────────────────────────────────────────────────────────────────────┘
  ```
  Navigation: keyboard arrows move focus, Enter selects, Escape closes without selecting.

- **Depth row** now becomes active (previously dimmed):
  ```
  Quick  ●Balanced  Deep  Exhaustive
  ```
  Balanced is pre-selected by default. Each option has a one-line sub-description.

## 6.7 State: Configuring (depth + context + optional advanced)

**Entry condition:** Outcome confirmed. Depth auto-defaults to Balanced.

**Run activation varies by outcome (per §6.1a):**
- **Most outcomes** (Build, Research, Case Study, Plan, Decide, Council, Prioritize): Run becomes active immediately after intent + outcome are confirmed. Context is optional.
- **Review and Investigate**: Run is BLOCKED until ≥1 context item is provided. Context zone becomes prominent with a clear block message. Run button is disabled with explanation. This is a hard contract requirement from Document 2 §7.

**What the PM sees:**
- Depth row shows Balanced pre-selected (pill: `[● Balanced]`). PM may change to Quick/Deep/Exhaustive. Depth NEVER blocks Run.
- **Context section is visible** (not collapsed — it is prominent and welcoming):
  - For Review/Investigate: context zone is especially prominent; shows "Required" label and block reason
  - For all other outcomes: context zone is welcoming but optional
  ```
  ┌────────────────────────────────────────────────────────────┐
  │ Context                                                    │
  │ ┌──────────────────────────────────────────────────────┐  │
  │ │  + Attach files / paste URL / select prior artifact  │  │
  │ └──────────────────────────────────────────────────────┘  │
  │                                                            │
  │  From this project:  [✓ Prior research (3 runs)]  [none] │
  └────────────────────────────────────────────────────────────┘
  ```
  Context is not required but its zone is visible and welcoming.

- **Mission Summary begins to crystallize** (bottom of Composer):
  From: `"Select an outcome to see your mission summary."`
  To (on depth confirmation):
  ```
  ◈ IdeaGate will investigate [your product question] using structured evidence
    analysis, generating hypotheses with experiment designs.

  What you'll receive:
  Evidence Summary · Hypothesis Set · Experiment Designs · Recommended Action
  ```
  Animation: text replaces with fade-in per line, `var(--ig-dur-standard) var(--ig-ease-out)`

- **Run Mission button** is already active (it became active when outcome was confirmed).
  Depth defaulted to Balanced on outcome confirmation — the PM does not need to touch it.
  Background: `--ig-emerald`, text: `--ig-text-on-emerald`, `font-weight: 600`
  The Run button's only disabled state is before intent+outcome are both satisfied.

## 6.8 State: Context Open

**What the PM sees:**
- Context panel expands fully:

  ```
  CONTEXT  ─────────────────────────────────────────────────────────────
  
  Attached Files
  ┌──────────────────────────────────────────────────────────────────┐
  │ Drop files here or click to upload                               │
  │ PDF · DOCX · CSV · TXT · XLSX · PNG/JPG                         │
  └──────────────────────────────────────────────────────────────────┘
  
  [If files attached:]
  📄 activation-analytics.csv         12 KB    [×]
  📝 onboarding-interviews.docx       84 KB    [×]
  
  URLs / External References
  [  Paste a URL to include...                        + Add  ]
  
  Workspace Context
  ╭──────────────────────────────────────────────────────────────────╮
  │ From this project                                                │
  │                                                                  │
  │ ● 3 prior research runs         [Exclude ✓]    [Include  ]     │
  │ ● 12 research findings                                           │
  │ ● 5 active decisions                                             │
  │ ● 2 open assumptions                                             │
  │                                                                  │
  │ IdeaGate will retrieve relevant prior knowledge for this mission.│
  ╰──────────────────────────────────────────────────────────────────╯
  
  Select Prior Artifacts
  [  Browse artifacts from this project...          ]
  ```

**Context rules (maps to Document 4):**
- Files → `EvidenceSourceType: 'uploaded-document'`
- URLs → `EvidenceSourceType: 'web-url'`
- Prior artifacts → `capabilityContextIds` in the plan (pinned context)
- Workspace context → dynamic PKS retrieval (Document 4 §9.4–9.5)
- Context selection here feeds the `RunConfig.context` object

**What is never exposed:**
- Retrieval algorithm, embedding scores, token estimates for context
- Raw PKS items — only summary cards
- Internal evidence IDs

## 6.9 State: Advanced Configuration

**What the PM sees:**
- A collapsed `Advanced` section below the Context panel:

  ```
  ▸ Advanced  (Orchestration · Research · Output preferences)
  ```

  Clicking expands:

  ```
  ▾ Advanced
  
  Orchestration
  For this outcome (Decide), you can enable structured adversarial reasoning:
  [ ] Run as Debate  — Challenge this question from opposing positions
                       before reaching a conclusion.
                       IdeaGate will reason from both sides independently.
  
  ```

**Rules (v1.1):**
- Debate toggle: only shown when `outcome === 'decide'` — maps to `orchestrationOverride: 'debate'`
- For all other outcomes: Advanced section does not appear in V1 (no applicable controls)
- Research emphasis, context focus, visual toggle, and validation-log toggle have been removed —
  none have authoritative RunConfig mappings (see Part 29 No-Invention Audit)

## 6.10 State: Preflight / Mission Summary

**What the PM sees:**

The Mission Summary "crystallizes" into its final form:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  ◈  MISSION BRIEF                                                      │
│                                                                         │
│  IdeaGate will investigate why your activation rate dropped             │
│  after the onboarding release. It will analyze the attached             │
│  analytics data and interview notes, generate evidence-grounded         │
│  hypotheses, and design experiments to test each one.                   │
│                                                                         │
│  Outcome       Investigate                                              │
│  Depth         Balanced                                                 │
│  Context       activation-analytics.csv · onboarding-interviews.docx   │
│                + Prior project context (3 research runs)                │
│                                                                         │
│  What you'll receive:                                                   │
│  Evidence Summary · Hypothesis Set (≥3, falsifiable) ·                  │
│  Experiment Designs · Recommended Action                                │
│                                                                         │
│  Externally verifiable claims will have a Validation Log.               │
│                                                                         │
│                              [  Edit  ]    [  Run Mission  ▶  ]        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Critical rules for Mission Summary content:**
1. Paraphrase the PM's intent in IdeaGate's voice — don't repeat it verbatim
2. State what artifacts will be produced (from Document 5 artifact contracts)
3. Mention context that's being used (summarized, not detailed)
4. Mention Validation Log if evidence-heavy claims are expected
5. **Never state** estimated time, agent count, model name, token count, or evaluation threshold
6. **Never fabricate** quality score, confidence level, or completeness estimate

**What fabrication prevention looks like:**
- ❌ "This will take approximately 8–12 minutes"
- ✅ (No time estimate — it is not available as an architectural contract)
- ❌ "6 specialist agents will collaborate"
- ✅ (Not exposed — agent count is an implementation detail)
- ❌ "Confidence: High"
- ✅ (Confidence is an output attribute, not a pre-execution guarantee)

## 6.11 State: Error / Validation Error

### Error types and PM-native messages:

| Error | PM-facing message | Recoverable? | Action |
|---|---|---|---|
| `intent-too-short` | "Add more detail about what you're trying to figure out — a sentence or two is enough." | Yes | Continue typing |
| `outcome-required` | "Choose a mission type to continue." | Yes | Highlight outcome row |
| `context-file-error` | "We couldn't read [filename]. Try a different format (PDF, DOCX, TXT, CSV)." | Yes | Remove + re-attach |
| `unsatisfiable-context` | "There's more project context than this mission can use at once. Try reducing the attached files or narrowing the workspace context." | Yes | Reduce context |
| `unsatisfiable-config` | "This configuration can't be satisfied with the current settings. [Specific reason in PM language]" | Usually yes | Edit configuration |
| `network-error` | "IdeaGate couldn't connect. Check your connection and try again." | Yes | Retry button |
| `provider-error` | "Something went wrong on IdeaGate's end. We're on it." | Usually yes | Retry button |

**Error presentation:**
- Inline validation: below the specific field that has an issue (field-level red border + message)
- Configuration-level errors: in the Mission Summary area, above the Run button
- Fatal errors: replace Mission Summary with error card + retry action
- No error should be a raw technical message

## 6.12 State: Unsatisfiable Configuration

When `ContextContractUnsatisfiable` would be thrown (Document 4 §14.3):

```
⚠  Too much context for this configuration.

   IdeaGate's mandatory project constraints — [N constraints] — don't fit
   within the model's context for a [Balanced] [Investigate] mission.

   Options:
   [ Remove some context ]    [ Reduce depth to Quick ]    [ Learn more ]
```

The user is never told "ContextContractUnsatisfiable." They are told what the
problem is in PM language and offered concrete resolution paths.

## 6.13 State: Running / Handoff to Mission Control

**The transition:**

1. PM clicks "Run Mission ▶"
2. Brief press-state: Run button scales slightly (1.0→0.96, `var(--ig-dur-instant)`), emerald darkens
3. After ~120ms: button label changes to `"Starting mission..."` with a subtle spinner
4. The Composer surface **fades and collapses** toward a compact summary strip:
   - Height animation: full expanded height → 48px, `var(--ig-dur-calm) var(--ig-ease-in)`
   - Content fades out at half-duration
5. Mission Control view **rises in** from below (or transitions from the right depending on layout):
   - `var(--ig-dur-calm) var(--ig-ease-out)`
   - Mission Control header shows the mission intent + "IdeaGate is working..."

**Reduced motion:** No height/position animation. Instead: instant state swap with a 80ms cross-fade only.

**What the PM sees in Mission Control (immediately after handoff):**

```
IdeaGate is working on: "Why did our activation rate drop after the onboarding release?"
Investigate · Balanced · 2 files + project context

──────────────────────────────────────────────────────────────────────────────
  ● Gathering evidence from your files...
  ○ Analyzing patterns
  ○ Generating hypotheses
  ○ Designing experiments
  ○ Recommending action

  [Cancel mission]
```

**Mission Control rules:**
- **PM-native phase labels only.** Never: "RE step 1 of 7", "Evaluation pass running"
- **Progress is coarse-grained.** 4–5 high-level phases, not step-by-step agent logs
- **Cancel is always available** until completion
- **Artifacts appear in Desk** when complete; Mission Control shows "Complete — view artifacts"
- If the user navigates away during execution, a persistent subtle indicator in the nav rail shows the active mission

---

# PART 7 — OUTCOME SELECTION EXPERIENCE

## 7.1 Nine Outcomes — PM-Native Descriptions

**Canonical status:** All nine outcomes are canonically defined in Document 5. All nine appear in the
Composer outcome grid. Document 5 §32 distinguishes implementation status (CURRENT vs PHASE 1) — this
distinction is an implementation concern, not a Composer UX concern. The Composer does not pre-filter
the outcome grid based on implementation status. If an outcome's execution is not yet implemented,
the execution layer (Document 3 / Mission Control) handles the appropriate response. The Composer
presenting all nine reflects the full IdeaGate product vision.

**V1 CURRENT execution:** Build, Case Study, Research, Prioritize, Review, Decide, Debate (variant of Decide)
**PHASE 1 execution:** Council, Investigate, Plan *(planned for Mission 14-16; canonical; will work when implemented)*

Each outcome has a name, a one-sentence description, and a "What you'll receive" summary.
These are the only descriptions shown; internal OutcomeIds are never exposed.

```
BUILD
Name:          Build
When to use:   You have an idea and want a complete product definition.
Description:   Start with a concept and produce a full PM artifact set — discovery,
               problem framing, solution design, PRD, UX approach, architecture,
               and delivery plan.
You'll receive: Discovery · Problem Definition · Solution Design · MVP Hypothesis ·
               Validation Plan · Prioritization · PRD · UX Design · Architecture ·
               Backlog · Implementation Plan · QA Readiness · Prototype Prompt

RESEARCH
Name:          Research
When to use:   You need structured intelligence on a market, competitor, user group,
               or product question.
Description:   Deep-dive into a question and return evidence-backed intelligence
               with cited sources.
You'll receive: Market Landscape · Competitor Matrix · User Problem Evidence ·
               Assumption Register · Opportunity Assessment

DECIDE
Name:          Decide
When to use:   You're facing a product decision and need structured analysis
               before committing.
Description:   Frame a decision, analyze options with evidence, and reach a
               justified conclusion with preserved uncertainty.
You'll receive: Decision Framing · Options Analysis · Synthesis and Recommendation

COUNCIL
Name:          Council
When to use:   A complex question genuinely needs multiple expert perspectives
               before you decide.
Description:   Convene the right mix of perspectives and produce a synthesized
               recommendation — with disagreements preserved, not smoothed over.
You'll receive: Independent Assessor Reports · Council Synthesis (with preserved dissent)

INVESTIGATE
[see above]

PRIORITIZE
Name:          Prioritize
When to use:   You have a list of items and need a scored, reasoned ranking.
Description:   Score and rank a set of items — features, bets, user stories —
               against your criteria.
You'll receive: Ranked List · Scoring Breakdown · Sequence Rationale · Dependency Map

PLAN
Name:          Plan
When to use:   Scope is approved and you need an engineering-ready delivery plan.
Description:   Decompose approved scope into epics, stories, dependencies, and
               a sprint sequence.
You'll receive: Epic/Story Hierarchy · Acceptance Criteria · Dependency Map ·
               Sprint Sequence · Risk Register

REVIEW
Name:          Review
When to use:   You have an artifact — PRD, strategy, analysis — and need structured
               critique and improvement recommendations.
Description:   Critically assess an existing artifact and return specific,
               evidence-backed improvement recommendations.
You'll receive: Gap Analysis · Improvement Recommendations · (Revised Artifact at Deep+)

CASE STUDY
Name:          Case Study
When to use:   You want to document a product decision or initiative as a structured
               learning artifact.
Description:   Record the reasoning, options, decision, and outcomes of a product
               experience as a reusable learning document.
You'll receive: Case Study (situation, evidence, options, decision, execution,
               outcomes, learnings)
```

## 7.2 Outcome Grid Interaction

The outcome grid (shown when selecting or changing an outcome) uses a 3-column grid
at desktop width, collapsing to 2-column at tablet and 1-column at mobile.

| Interaction | Behavior |
|---|---|
| Hover | Expand to show "What you'll receive" — smooth reveal, `var(--ig-dur-quick)` |
| Click / Enter | Select outcome; grid closes; confirmed pill appears |
| Escape | Close without selection; existing outcome unchanged |
| Arrow keys | Move focus between outcomes; Enter to select |
| Tab | Move to next focusable element in grid |

**Visual state per outcome card:**
- Unselected: `--ig-surface`, `--ig-border-subtle` border, `--ig-text-primary` name, `--ig-text-secondary` description
- Hovered: `--ig-surface-raised`, `--ig-border-default`, full description visible
- Selected: `--ig-surface-raised`, `--ig-border-strong` (emerald-tinted), `--ig-emerald` name, checkmark icon
- Previously-run (if project history exists): subtle "Run before" label in `--ig-text-tertiary`

---

# PART 8 — DEPTH SELECTION EXPERIENCE

## 8.1 Four Depths — PM-Native Descriptions

| Depth | PM label | PM description | When to use |
|---|---|---|---|
| Quick | **Quick** | "Essential analysis, fast results." | Exploration, early-stage, time-constrained |
| Balanced | **Balanced** _(default)_ | "Thorough analysis with evidence backing. The right choice for most PM work." | Standard PM work at any stage |
| Deep | **Deep** | "Extended research, broader evidence, stricter quality checks." | High-stakes decisions, investor-facing work, complex problems |
| Exhaustive | **Exhaustive** | "Maximum rigor across every dimension." | Major strategic decisions, board-level artifacts, launch-critical specifications |

## 8.2 Depth UX

**Default:** Balanced is pre-selected when an outcome is confirmed. The PM does not
need to interact with the depth row to run a mission. Changing depth is an optional
refinement, not a required step.

**Visual treatment:**

```
  Quick      ● Balanced      Deep      Exhaustive
  ─────      ──────────────  ────      ──────────
```

- Segmented control / pill group
- Selected: `--ig-emerald-muted` background, `--ig-emerald` text, `--ig-border-strong`
- Unselected: `--ig-surface`, `--ig-text-secondary`
- Not selectable: If `exhaustive` is not eligible for the selected outcome, it is
  dimmed with tooltip: "Exhaustive depth isn't available for [Outcome]. Deep gives
  you maximum rigor for this mission type."

**Depth and loop independence (Document 5 §8):**
Never expose "loop" as part of the depth selection. Depth controls rigor; loops
are a separate Continuous Research concern. These dimensions must not conflate.

**What depth never reveals:**
- Worker count
- Token allocation
- Evaluation pass count
- Revision attempt count

---

# PART 9 — CONTEXT AND DOCUMENT ATTACHMENT

## 9.1 Why Context Is First-Class

Document 4's PKS is IdeaGate's core differentiator. Context is not a file picker
hidden in a corner — it is the primary way a PM brings their product knowledge
into IdeaGate. The UX must treat it as such.

## 9.2 Four Context Types

| Type | PM label | Maps to | UI treatment |
|---|---|---|---|
| **Uploaded files** | "Your documents" | `EvidenceSourceType: 'uploaded-document'` | Drop zone + file list |
| **URLs** | "Links to analyze" | `EvidenceSourceType: 'web-url'` | URL input field |
| **Prior artifacts** | "Existing IdeaGate artifacts" | `capabilityContextIds` (pinned) | Artifact browser modal |
| **Workspace context** | "Prior project knowledge" | Dynamic PKS retrieval (Document 4 §9.4) | Summary card with include/exclude toggle |

## 9.3 Context Drop Zone

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│     ↑  Drop files here, or  [Browse]                              │
│                                                                    │
│     PDF · Word · CSV · TXT · Excel · Images                       │
│     (file count and size limits: see Document 7 implementation)    │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**States:**
- Empty/default: as above
- Drag-over: border becomes `--ig-emerald`, `--ig-emerald-muted` background fill
- File attached: file list with icons, names, sizes, and remove buttons
- Error: `--ig-status-danger` border with error message below

**Accepted formats:** PDF, DOCX, TXT, CSV, XLSX, PNG, JPG, JPEG
Unsupported formats show: "We can't read [format] files yet. Try PDF or text formats."

## 9.4 URL Input

```
[  Paste a URL to include in this mission...          + Analyze  ]
```

- Accepts HTTPS URLs to publicly accessible pages (URL reachability and content parsing: Document 7)
- On "Analyze": brief loading indicator → shows URL domain + title (fetched)
- Multiple URLs can be added
- Malformed URL: inline error message
- URL that's not publicly accessible: "This URL couldn't be reached. Check that it's publicly accessible."

## 9.5 Workspace Context Card

For projects with prior runs, the workspace context card surfaces the option to
include prior project knowledge. **It is opt-in — not included by default.**

This maps to: `context.includeWorkspaceMemory: false` (Document 2 §3.1 RunConfig default).
Rationale: most fresh missions do not need prior context; memory is governed context,
not ambient invisible context. The PM makes a deliberate choice.

```
╭──────────────────────────────────────────────────────────────────────╮
│ Prior project knowledge                              [Include  ]     │
│                                                                      │
│ 3 research missions · 12 findings · 5 decisions · 2 open questions   │
│                                                                      │
│ Include this to let IdeaGate build on what you've already learned.   │
│ [What would this add to my mission?] ↗                              │
╰──────────────────────────────────────────────────────────────────────╯
```

**[What would this add?]** → opens a read-only panel from the PKS Inspection API
(Document 4 §36.2) showing:
- Active decisions relevant to this mission type
- Recent research findings on related topics
- Open assumptions that relate to the intent

This panel is read-only. It shows what *would be* retrieved if workspace memory is
included — not how the retrieval works.

**When workspace memory is included (opt-in):**
The card updates:
```
╭──────────────────────────────────────────────────────────────────────╮
│ Prior project knowledge                              [✓ Included]    │
│                                                                      │
│ 3 research missions · 12 findings · 5 decisions                      │
│                                                                      │
│ IdeaGate will draw on relevant prior knowledge for this mission.     │
│ [See what's included] ↗                           [Remove]          │
╰──────────────────────────────────────────────────────────────────────╯
```

When no prior runs exist for this project: workspace context card is not shown.
The PM sees only the file attachment zone and URL input.

## 9.6 Context Scope Rules (maps to Document 4)

These rules govern the system behavior. They are never shown to the user but
must be respected:
- Cross-project isolation: absolute. Project B context never enters Project A missions.
- Run-scoped evidence: not accessible from other projects.
- Context is never a raw dump: PKS retrieval governs what gets assembled (§9.4–9.5 Doc 4)

---

# PART 10 — ADVANCED CONFIGURATION

## 10.1 Design Principle and Control Contract

Advanced configuration is a power-user surface. Every control must:
1. Solve a real PM problem the user cannot solve by choosing outcome + depth alone
2. Map to an existing authoritative contract (RunConfig field or frozen semantic)
3. Be genuinely useful at mission-start time (not configurable after the fact)

**V1 Advanced controls inventory** — derived from frozen Document 2 RunConfig:

| RunConfig field | Available? | Maps to UI? |
|---|---|---|
| `orchestrationOverride: 'debate'` | Decide outcome only | ✅ Debate toggle |
| `goal: ValidatedGoalSpec` | Research only (Phase 1) | 🔮 Future seam |
| `depth` | All outcomes | Already in main flow (not Advanced) |
| `context.includeWorkspaceMemory` | All outcomes | Already in Context section |

**Removed as unsupported in V1:**
- ~~Research emphasis slider~~ — no `researchEmphasis` field in RunConfig
- ~~Context Focus (Blend/Prioritize)~~ — retrieval weighting is internal to Document 4, not PM-configurable
- ~~Visual representations toggle~~ — not a RunConfig field; visual output is artifact-contract-driven
- ~~Validation Log toggle~~ — replaced with informational copy (see §10.3 below)
- ~~Schedule / Save template / Share~~ — no architectural contract; visible in Part 28 as future seams only

**V1 result:** In V1, only Decide exposes the Debate toggle. Advanced does not appear for other outcomes because no other outcome currently has an applicable V1 Advanced configuration control.

**Important:** This is a statement of V1 scope, not a permanent architectural rule. Advanced is not a "Decide-only section" — it is an outcome-specific controls surface that appears when the selected outcome has at least one applicable V1 configuration. Future outcomes may introduce their own applicable Advanced controls (e.g., when the Goal specification for Continuous Research becomes a V1 Composer control, it would appear in Advanced for the Research outcome).

## 10.1a Goal — Explicitly Not a V1 Composer Control

Document 2 §3 defines `goal?: ValidatedGoalSpec` as an optional RunConfig field.
Document 5 §21 defines Continuous Research as `outcomeId: 'research'` + `ValidatedGoalSpec` + `loopPolicy`.

**The Goal specification is NOT exposed in the V1 Composer UI.**

Why: ValidatedGoalSpec (goalStatement, successCriteria, bounds) is a complex structured input.
The V1 Composer is designed around natural-language intent — structured goal criteria are
a Phase 1/future capability that requires its own input surface.

The architectural seam is preserved (RunConfig accepts `goal?`). The Composer does not
expose a Goal field. The implementation must not add one without a Document 6 amendment.

Future seam: When Goal becomes a V1 Composer control for Continuous Research, it will
appear in an extended context section specific to the Research outcome, or in Advanced.
The Document 6 and Document 7 boundary must be amended at that time.

---

## 10.2 Debate Override (Decide outcome only)


**Shown when:** `outcome === 'decide'`
**Hidden for:** all other outcomes (Advanced section does not appear)

```
Advanced

Reasoning approach

[ ] Run as Debate
    IdeaGate will build the strongest case for both sides independently,
    then adjudicate. Best for high-stakes decisions where bias is a real risk.

    How it works: two independent analyses run without seeing each other,
    then a synthesis adjudicates. The losing position's best argument is
    always preserved.
```

**Maps to (authoritative):**
- `orchestrationOverride: 'debate'` in Document 2 RunConfig
- RecipeId: `red-blue-debate` (Document 5 §18)
- Debate is only valid for `outcome: 'decide'` — all other outcomes reject this override
  (Document 2: ORCHESTRATION_INCOMPATIBLE for casestudy, prioritize, etc.)

## 10.3 Evidence Verification (informational — not a control)

The following is **not a toggle**. It is a PM-readable statement of IdeaGate behavior:

```
Evidence verification

IdeaGate automatically creates a record of externally verifiable claims
with their sources — at the bottom of the relevant artifact sections.
This is driven by the claims themselves, not by artifact type.
No configuration needed.
```

**Why informational rather than a toggle:**
Document 5 §4.3 establishes that the Validation Log is claim-driven. A UI toggle
that appears to control it creates a false expectation that the PM can turn off
evidence verification. They cannot and should not be able to. Presenting it as
informational copy builds trust without creating a fake control.

---

# PART 11 — MISSION SUMMARY AND PREFLIGHT

## 11.1 The Crystallization Principle

The Mission Summary does not appear all at once. It crystallizes progressively
as the PM configures their mission:

| After this action | Summary shows | Notes |
|---|---|---|
| Nothing yet | — | (no summary in idle/focused state) |
| Intent typed (sufficiently detailed) | Placeholder: "Select a mission type to see your summary." | Minimal; doesn't describe anything yet |
| Outcome confirmed (most outcomes) | "[Outcome name] mission: [paraphrase of intent]." + artifact list | Run becomes active |
| Outcome confirmed (Review/Investigate) | "[Outcome name] mission: [paraphrase]. Upload [evidence/the artifact] to continue." | Run remains blocked; summary shows the missing piece prominently |
| Context added (Review/Investigate) | Summary updates: "Using: [file name]. What you'll receive: [artifact list]." + Run activates | Context resolves the block |
| Workspace memory opted in | Adds: "+ prior project context included." | |
| Depth changed from Balanced | Adds notation: "[Depth] analysis." | Only shown if different from Balanced |
| All configured | Full crystallized summary; Run is active | |

## 11.2 What the Mission Summary Must and Must Not Contain

**Must contain:**
- IdeaGate's paraphrase of the PM's intent (shows understanding)
- The confirmed outcome name
- The confirmed depth
- The context being used (summarized)
- The artifacts that will be produced (from Document 5 artifact contracts)
- Whether a Validation Log is expected (if evidence-heavy)

**Must not contain:**
- Time estimates
- Agent names or counts
- Model names
- Token counts
- Evaluation thresholds
- Confidence percentages or quality predictions
- Any fabricated certainty about the output

## 11.3 Mission Summary for Each Outcome

Template: `"IdeaGate will [verb phrase] [about the intent], [returning/producing] [artifact list]."`

**Build:**
> "IdeaGate will take your idea — [intent paraphrase] — through a complete 15-stage PM lifecycle: from discovery and problem definition through PRD, UX design, architecture, and delivery planning."
> What you'll receive: 13 structured PM artifacts.

**Research:**
> "IdeaGate will research [topic] and return a structured intelligence brief with evidence citations."
> What you'll receive: Market Landscape · Competitor Matrix · User Problem Evidence · Assumption Register · Opportunity Assessment

**Investigate:**
> "IdeaGate will analyze [context files / your description] to diagnose [problem paraphrase], returning hypotheses grounded in evidence with experiments to test them."
> What you'll receive: Evidence Summary · Hypothesis Set · Experiment Designs · Recommended Action

**Decide (standard):**
> "IdeaGate will frame [decision paraphrase], analyze the options with evidence, and produce a justified recommendation with dissent preserved."
> What you'll receive: Decision Framing · Options Analysis · Synthesis and Recommendation

**Decide (debate):**
> "IdeaGate will build the strongest case for both sides of [decision paraphrase] independently, then adjudicate. The losing position's best argument will be preserved."
> What you'll receive: Position A · Position B · Adjudication and Decision

---

# PART 12 — MOTION AND INTERACTION SYSTEM

## 12.1 Motion Principles

All motion in the Composer maps to a system event. No decorative animation.
Motion vocabulary from Design Blueprint §14:

| Token | Value | Use in Composer |
|---|---|---|
| `--ig-dur-instant` | 80ms | Button press feedback, hover state changes |
| `--ig-dur-quick` | 160ms | Pill selection, suggestion strip appear |
| `--ig-dur-standard` | 240ms | Outcome grid open/close, context panel expand |
| `--ig-dur-calm` | 400ms | Composer expand/collapse, Run transition |
| `--ig-ease-out` | `cubic-bezier(0.0, 0.0, 0.2, 1)` | Entrances, reveals |
| `--ig-ease-in` | `cubic-bezier(0.4, 0.0, 1, 1)` | Exits, collapses |
| `--ig-ease-standard` | `cubic-bezier(0.4, 0.0, 0.2, 1)` | In-place state changes |

## 12.2 Signature Motion: Composer Expansion

The compact bar expanding to the configuration surface is the signature Composer
motion. It must feel like the system engaging with the brief, not revealing settings.

```
Start:    [compact bar, 48px height]
Trigger:  Focus / click
Phase 1:  Height 48 → 120px (intent textarea visible), --ig-dur-standard, --ig-ease-out
          Border ring: fade in, --ig-dur-quick
Phase 2:  On outcome confirmed: Outcome row slides in from below, --ig-dur-quick, --ig-ease-out
Phase 3:  On depth set: Context row slides in, --ig-dur-quick, --ig-ease-out
Phase 4:  Mission Summary fades in line by line, --ig-dur-standard, --ig-ease-out
          (15ms stagger per line)
```

## 12.3 Suggestion Strip Animation

```
Start:    off-screen below intent area
Trigger:  Intent interpretation complete
Motion:   translateY(8px → 0) + opacity(0 → 1), --ig-dur-quick, --ig-ease-out
Exit:     opacity(1 → 0) + translateY(0 → -4px), --ig-dur-instant
```

## 12.4 Outcome Grid Animation

```
Open:     scale(0.96 → 1.0) + opacity(0 → 1), --ig-dur-standard, --ig-ease-out
          transform-origin: top center
Close:    scale(1.0 → 0.96) + opacity(1 → 0), --ig-dur-quick, --ig-ease-in
Selection: pill appears with scale(0 → 1) pulse, --ig-dur-quick
```

## 12.5 Mission Crystallization Animation

The Mission Summary text is the most important motion. It must feel like
IdeaGate is thinking, not like a form auto-completing.

```
Initial state: placeholder text, --ig-text-tertiary
On each configuration confirmation:
  - New content replaces placeholder
  - Per-line: opacity(0 → 1) + translateY(4px → 0), --ig-dur-standard
  - 20ms stagger between lines
  - Existing content adjusts position with --ig-dur-standard
```

## 12.6 Run Transition

```
Phase 1:  Button: scale(1.0 → 0.96) + color darken, 80ms
Phase 2:  Button label: "Starting mission...", spinner appears
Phase 3:  Composer surface: opacity(1 → 0), --ig-dur-standard
          Composer height: full → 0, --ig-dur-calm, --ig-ease-in
Phase 4:  Mission Control: opacity(0 → 1) + translateY(8px → 0), --ig-dur-calm, --ig-ease-out
```

## 12.7 Reduced Motion

All spring/translate animations are replaced by cross-fades when
`prefers-reduced-motion: reduce` is set:
- Expansion: instant height change + opacity fade
- Suggestions: opacity fade only (no translate)
- Mission crystallization: opacity fade per section (no translate)
- Run transition: cross-fade only

No animation is purely decorative; all have semantic meaning. Under reduced motion,
the semantic content is preserved — only the motion is simplified.

---

# PART 13 — ACCESSIBILITY

## 13.1 Keyboard Interaction Model

| Key | Action |
|---|---|
| `⌘K` / `/` | Open Composer from anywhere in the workspace |
| `Tab` | Move forward through Composer controls |
| `Shift+Tab` | Move backward |
| `↑ ↓ ← →` | Navigate outcome grid / depth segments |
| `Enter` | Confirm selection / activate focused element |
| `Space` | Toggle checkbox / confirm selection (in grid) |
| `Escape` | Close overlay (outcome grid, workspace context panel) / dismiss suggestion |
| `⌘Enter` | Run Mission (when Composer is in preflight state and valid) |

## 13.2 Focus Management

- When Composer opens: focus moves to intent textarea
- When outcome grid opens: focus moves to first outcome card (or currently selected)
- When outcome grid closes: focus returns to outcome pill / trigger element
- When Mission Control opens: focus moves to Mission Control heading
- No focus trap except within outcome grid overlay (while open)

## 13.3 ARIA Requirements

```html
<!-- Composer container -->
<div role="region" aria-label="Mission Composer">

  <!-- Intent textarea -->
  <textarea
    aria-label="Describe your PM question or goal"
    aria-describedby="composer-hint"
    aria-required="true"
  />
  <p id="composer-hint" class="visually-hidden">
    Describe what you're trying to accomplish and IdeaGate will suggest a mission type.
  </p>

  <!-- Suggestion strip -->
  <div role="status" aria-live="polite" aria-atomic="true">
    {suggestionText}
  </div>

  <!-- Outcome grid -->
  <div
    role="listbox"
    aria-label="Select mission type"
    aria-activedescendant={selectedOutcomeId}
  >
    <div role="option" aria-selected={isSelected} id={outcomeId}>
      {outcome name}
    </div>
  </div>

  <!-- Depth segmented control -->
  <div role="radiogroup" aria-label="Mission depth">
    <label>
      <input type="radio" name="depth" value="balanced" aria-describedby="depth-balanced-desc" />
      Balanced
      <span id="depth-balanced-desc">Thorough analysis with evidence backing.</span>
    </label>
  </div>

  <!-- Mission Summary -->
  <div role="region" aria-label="Mission summary" aria-live="polite">
    {missionSummaryContent}
  </div>

  <!-- Run button -->
  <button
    aria-disabled={!isValid}
    aria-describedby="run-desc"
  >
    Run Mission
  </button>
  <p id="run-desc" class="visually-hidden">
    {isValid ? 'Launch this mission.' : 'Complete the configuration above to run your mission.'}
  </p>
</div>
```

## 13.4 Color and Contrast Requirements

All text must meet WCAG 2.1 AA:
- `--ig-text-primary` (`#E8F0EC`) on `--ig-canvas` (`#05090B`): Ratio ~19:1 ✅
- `--ig-text-secondary` (`#94A3B8`) on `--ig-surface`: Ratio ~9:1 ✅
- `--ig-text-tertiary` (`#5B6B63`) on `--ig-surface`: Check required at implementation

Color is never the only state indicator. All states also use:
- Shape change (border weight, fill)
- Label change (selected / not selected)
- Icon change (✓ on selected)
- ARIA state (aria-selected, aria-pressed)

---

# PART 14 — RESPONSIVE BEHAVIOR

## 14.1 Breakpoints

| Breakpoint | Width | Composer behavior |
|---|---|---|
| Desktop | ≥1024px | Full expanded Composer; 3-column outcome grid |
| Tablet | 768–1023px | 2-column outcome grid; context panel below configuration |
| Mobile | <768px | Full-screen Composer modal; 1-column outcome grid; depth as dropdown |

## 14.2 Mobile-Specific Adaptations

- Composer opens as a bottom sheet / full-screen modal on mobile
- Intent textarea is the primary element (full width)
- Outcome selection: scrollable horizontal row of cards (not grid)
- Depth: four-option dropdown or horizontal scroll
- Context: simplified to "Attach" button (opens file picker) + workspace toggle
- Mission Summary: appears above Run button (no side-by-side layout)
- Advanced: collapsed behind a chevron, not shown by default

---

# PART 15 — MISSION CONTROL TRANSITION AND VIEW

## 15.1 PM-Native Progress Model

Mission Control is where the PM observes execution without needing to understand
the internal agent topology. The progress language is PM-native:

**Investigate mission progress labels (example):**
```
● Reviewing your evidence files
● Identifying patterns and gaps in the data
○ Generating hypotheses
○ Designing experiments
○ Formulating recommendation
```

**Research mission progress labels:**
```
● Understanding your research question
● Gathering market and competitive intelligence
● Synthesizing findings
○ Assessing opportunities
○ Reviewing for completeness
```

These labels are defined per-outcome in Document 7 (they map to internal execution
steps but are translated into PM language). Document 6 defines the vocabulary
standard; Document 7 defines the mapping.

## 15.2 What Mission Control Shows

```
┌─────────────────────────────────────────────────────────────────────────┐
│  MISSION CONTROL                                                        │
│                                                                         │
│  "Why did our activation rate drop after the onboarding release?"      │
│  Investigate · Balanced · 2 files + project context                    │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────     │
│                                                                         │
│  ● Reviewing your evidence files                          [0:23]       │
│  ○ Identifying patterns                                                 │
│  ○ Generating hypotheses                                                │
│  ○ Designing experiments                                                │
│  ○ Formulating recommendation                                           │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────     │
│                                                                         │
│                                      [Cancel mission]                   │
└─────────────────────────────────────────────────────────────────────────┘
```

**Timer:** Shows elapsed time per active step in `--ig-text-tertiary`, monospace.
**Not shown:** Agent names, model names, token counts, evaluation scores, revision
attempts, internal step IDs, any architecture internals.

## 15.3 Completion Transition

```
Mission complete ✓

"Why did our activation rate drop?"
Investigate · Balanced · 2 files + project context

4 artifacts ready in your Desk

[View artifacts →]       [Start another mission]
```

The emerald checkmark and "Mission complete" message are the primary completion
signals. The PM is then directed to the Desk.

## 15.4 Failure Handling in Mission Control

If a mission fails:

```
Something went wrong during your mission.

IdeaGate encountered a problem [on the evidence review step / partway through].
[2 of 4 artifacts were completed and are available in your Desk.]

[View partial artifacts]   [Retry mission]   [Contact support]
```

**Rules:**
- Never expose internal error codes or stack traces
- Always tell the PM what (if anything) was completed
- Always offer a recovery action
- Partial completion is shown if any artifacts were produced

---

# PART 16 — ARTIFACT-AWARE EXPERIENCE (DESK)

## 16.1 The Desk Mental Model

The Desk is where PM artifacts live, are read, are inspected, and are improved.
It is not a chat history. It is not a document list. It is a **PM artifact workspace**.

The PM should feel like they're opening a portfolio of structured PM work, not
reading an AI chatbot's output.

## 16.2 Artifact Navigation

For multi-artifact outcomes (Build, Research, Investigate):

```
Sidebar (left):                    Main view (right):
┌─────────────────────┐           ┌──────────────────────────────────────────┐
│ Investigate         │           │ Evidence Summary                          │
│ Mission: "Why did   │           │ ──────────────────────────────────────── │
│ activation drop?"   │           │                                          │
│ Balanced · 2h ago   │           │ [Artifact content renders here]          │
│                     │           │                                          │
│ ─────────────────── │           │                                          │
│ ▶ Evidence Summary  │           │                                          │
│   Hypothesis Set    │           │ ─────────────────────────────── ▾ STUDIO │
│   Experiment Designs│           │  [Improve]  [Add diagram]  [Critique]   │
│   Recommended Action│           └──────────────────────────────────────────┘
│                     │
│ ─────────────────── │
│ Prior missions      │
│   Research · 3 days │
│   Build · 1 week    │
└─────────────────────┘
```

## 16.3 Artifact Content Rendering

Artifacts have three layers (Document 5 Part 3). The Desk renders:

1. **Narrative layer**: PM prose, rendered as rich text (headings, paragraphs, lists)
2. **Structured layer**: tables, matrices, ranked lists — rendered as native components
3. **Visual layer**: Mermaid diagrams, recharts, IdeaGate-native representations

**Visual representations appear inline** within the artifact at the appropriate
section, not in a separate tab. A diagram in the Architecture section appears
in the Architecture section.

## 16.4 Stale Artifact Indicators

When an artifact becomes stale due to an upstream knowledge change (Document 4 §21.5):

```
╭──────────────────────────────────────────────────────────────────────────╮
│ ⚠  This artifact may need updating                               [×]    │
│                                                                          │
│ The architecture decision this artifact depends on was updated.          │
│ Relevant section: "Technical Approach"                                   │
│                                                                          │
│  [View what changed]          [Regenerate affected sections]             │
╰──────────────────────────────────────────────────────────────────────────╯
```

- Color: `--ig-status-caution` (amber) border, not alarm-red
- Positioned at the top of the affected artifact section, not the full artifact
- Dismissable — the PM decides whether to act on it
- "View what changed" → opens the knowledge change in the reasoning inspector (Phase 2)

---

# PART 17 — STUDIO: IN-ARTIFACT IMPROVEMENT

## 17.1 Studio Activation

The Studio improvement bar appears at the bottom of the Desk view when an artifact
is selected. It does not interrupt reading — it's always subtly present and activates
on interaction:

```
── Studio ──────────────────────────────────────────────────────────────────
[✎ Improve]  [◈ Add visualization]  [↺ Critique]  [⊞ Compare]  [⋯ More]
```

**Collapsed by default:** The bar shows one line. Clicking "Improve" expands
the Studio panel upward.

## 17.2 The Improve Flow

```
SELECT (section or full artifact selected in Desk)
  ↓
IMPROVE (PM describes the improvement goal)
  "Make the competitor analysis more specific to our pricing tier"
  "Add a user flow for the signup experience"
  "Strengthen the evidence citations in Section 3"
  ↓
STRUCTURE (optional: IdeaGate extracts/updates structured data layer)
  ↓
VISUALIZE (optional: add or update a representation)
  "Generate a dependency graph for this section"
  "Convert the prioritization to a quadrant chart"
  ↓
EDIT (PM directly edits text or visual nodes in Studio)
  Sets provenance.changeOrigin = 'human-authored'
  ↓
REGENERATE (if visual representations need updating)
  derivedFromHash comparison → regeneration triggered
  ↓
SAVE / VERSION (new artifact version created; stale propagation runs)
```

## 17.3 Improvement Goal Input

```
┌────────────────────────────────────────────────────────────────────────┐
│ Studio: Improve                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│ What would you like to improve?                                        │
│                                                                        │
│ [  Describe the improvement goal...                                  ] │
│                                                                        │
│ Common improvements:                                                   │
│ [Make more specific]  [Add evidence]  [Strengthen argument]           │
│ [Add visualization]   [Simplify]      [Extend analysis]               │
│                                                                        │
│ Scope: ● Full artifact   ○ This section only                          │
│                                                                        │
│                                    [Improve ↵]                         │
└────────────────────────────────────────────────────────────────────────┘
```

## 17.4 Human Edit Flow

When the PM edits artifact text directly in Studio:
1. The edit area becomes an editable rich-text surface (not a code editor)
2. The edited section gets a subtle `--ig-border-default` ring while being edited
3. On save: a new artifact version is created; `provenance.changeOrigin = 'human-authored'`
4. If structured meaning changed: a non-intrusive prompt appears:
   "The content you edited may affect [visualization name]. Regenerate? [Yes] [Not now]"
5. The version history is accessible: `v1 (IdeaGate) · v2 (You edited) · v3 (IdeaGate + your edit)`

## 17.5 Version History

```
Version history                                                      [×]
──────────────────────────────────────────────────────────────────────
v3 · Current                                     Today, 14:32
    IdeaGate improved: "Competitor analysis extended"

v2                                               Today, 13:45
    You edited: "Updated pricing table manually"

v1 · Original                                    Today, 13:21
    IdeaGate generated (Investigate · Balanced)

                                      [Restore v1]   [Compare v1 and v3]
```

---

# PART 18 — VALIDATION LOG PRESENTATION

## 18.1 The Governing Rule

Validation Log entries appear only where artifacts contain externally verifiable
claims. This is a claim-driven rule (Document 5 §4.3), not an artifact-type rule.
The UX must not over-present or under-present the Validation Log.

## 18.2 Placement and Discovery

The Validation Log appears at the **extreme bottom** of the artifact section that
contains verifiable claims. It is:
- Below all artifact content
- Collapsed by default
- Identified by a subtle label

```
[artifact content above...]

▾ Validation Log  (6 verifiable claims)
```

Expanded:

```
▾ Validation Log  (6 verifiable claims)
──────────────────────────────────────────────────────────────────────────────

  Claim                                   Source              Status
  ─────────────────────────────────────   ────────────────    ──────────────
  "Indian SMB market estimated at..."     Redseer 2025 ↗      ✓ Verified
  "Competitor X charges ₹2,999/month"     Competitor X site ↗ ✓ Verified
  "Activation rates for SMB tools..."     Product Hunt 2024 ↗ ~ Partial
  "WhatsApp Business has 200M+ users"     Meta Blog ↗         ✓ Verified
  "B2B SaaS churn rates average..."       Bessemer 2024 ↗     ✗ Unverified
  "Feature Y exists in Competitor Z"      Competitor Z docs ↗ ~ Partial

  Legend:  ✓ Verified  ~ Partially verified  ✗ Unverified  ⊘ Not applicable
  
  6 claims · 4 with working source links · Last checked: today
```

## 18.3 Interaction

| Element | Behavior |
|---|---|
| Source URL `↗` | Opens URL in new tab |
| Status badge | Static; set at artifact generation time |
| "Expand/collapse" | Toggle Validation Log panel |
| Status filter | Filter by Verified / Unverified / Partial (future capability) |

## 18.4 Empty State (No Verifiable Claims)

If a section has no externally verifiable claims, there is no Validation Log.
No placeholder, no "no claims to validate" message — just absence.

The PM does not need to know that the claim-driven rule exists. They simply
notice the Validation Log where it's useful and don't notice its absence where
it isn't.

---

# PART 19 — VISUAL REPRESENTATION SEAMS

## 19.1 Representations Are Views, Not Documents

Visual representations are views of underlying structured artifact content
(Document 5 Part 3, §3.3). They are not screenshots, images, or independent
files. They are:
- Derived from Layer 2 structured data
- Connected to their parent artifact via `derivedFromHash`
- Versioned alongside the artifact
- Stale-able independently (if Layer 2 changes but representation hasn't regenerated)

## 19.2 Representation Discovery in Desk

When an artifact section has a visual representation available or generated:

```
[SYSTEM ARCHITECTURE]

[prose content above...]

╭──────────────────────────────────────────────────────────────────────╮
│  System Architecture                                                  │
│  ─────────────────────────────────────────────────────────────────── │
│                                                                      │
│  [Mermaid / IdeaGate-native diagram renders here]                    │
│                                                                      │
│  ⊙ Connected to artifact content  ↺ Regenerate  ✎ Edit nodes        │
╰──────────────────────────────────────────────────────────────────────╯
```

**Stale representation indicator:**
```
⚠ This diagram may be outdated — the artifact was edited. [Regenerate]
```

## 19.3 Visualization Vocabulary Surface

In Studio, "Add visualization" opens a representation selection panel:

```
ADD VISUALIZATION

Based on this section's content, IdeaGate recommends:
┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
│ User Flow         │  │ Flowchart         │  │ Sequence Diagram  │
│ Key paths through │  │ Decision flow or  │  │ System or agent   │
│ your product      │  │ process steps     │  │ interaction       │
└───────────────────┘  └───────────────────┘  └───────────────────┘

All visualizations
[ERD] [Dependency Graph] [Gantt] [Quadrant] [State Diagram]
[OST] [Decision Matrix] [Journey Map] [Service Blueprint...]
```

The system recommends based on artifact section type; the PM can choose any.
**Implementation note for Document 7:** IdeaGate infers recommendations from
artifact section type and structured data content — not from user selection history.

## 19.4 OST Visualization

When an OST representation is generated (Phase 2):

```
╭──────────────────────────────────────────────────────────────────────╮
│  Opportunity Solution Tree                                            │
│                                                                      │
│  [Interactive OST node tree renders here]                            │
│                                                                      │
│  Outcome: [User defined outcome]                                      │
│  ├── Opportunity: [Grounded in research finding] ●                   │
│  │   ├── Solution: [Rests on Assumption A]                           │
│  │   │   └── Experiment: [Prioritized — Decision D3]                 │
│  │   └── Solution: [Rests on Assumption B]                           │
│  └── Opportunity: [Hypothesis-grade, no evidence] ◦                  │
│                                                                      │
│  ● Evidence-grounded  ◦ Hypothesis-grade (no evidence linked)        │
│                                                                      │
│  ⊙ Connected  ↺ Regenerate  ✎ Edit nodes                            │
╰──────────────────────────────────────────────────────────────────────╯
```

The `●` vs `◦` distinction surfaces the OST's epistemic status — whether
an Opportunity is grounded in evidence or is hypothesis-grade (Document 5 §3.4:
OST must surface absent evidence linkage, not paper over it).

---

# PART 20 — DESIGN SYSTEM INTEGRATION

## 20.1 Typography Application

| Surface element | Typeface | Size | Weight | Color |
|---|---|---|---|---|
| Intent textarea | JetBrains Mono | 14px | 400 | `--ig-text-primary` |
| Outcome name in grid | Inter | 13px | 600 | `--ig-text-primary` |
| Outcome description | Inter | 12px | 400 | `--ig-text-secondary` |
| Confirmed pill text | Inter | 12px | 500 | `--ig-text-primary` |
| Depth labels | Inter | 12px | 500 | varies by state |
| Mission Summary heading | Inter | 11px | 600 | `--ig-emerald` (small caps) |
| Mission Summary body | Inter | 13px | 400 | `--ig-text-secondary` |
| Artifact prose body | Inter | 15px | 400 | `--ig-text-primary` |
| Artifact headings H2 | Inter | 18px | 700 | `--ig-text-primary` |
| Validation Log table | JetBrains Mono | 12px | 400 | `--ig-text-secondary` |

## 20.2 Elevation Application

| Element | Elevation construction |
|---|---|
| Compact Composer bar | `--ig-surface` + `--ig-border-default` hairline |
| Expanded Composer surface | `--ig-surface-raised` + 4-layer elevation (Blueprint §1.1) |
| Outcome grid overlay | `--ig-surface-overlay` + elevated 4-layer |
| Mission Summary panel | `--ig-surface-raised` + subtle top-edge highlight |
| Validation Log panel | Same surface as parent artifact; distinguished by `--ig-border-subtle` top rule |

## 20.3 Emerald Spend Budget

The emerald accent is spent intentionally and sparingly:

| Use | Emerald token | Rationale |
|---|---|---|
| Focus ring on Composer | `--ig-emerald-dim` | Low-energy; persistent |
| Selected outcome/depth pill | `--ig-border-strong` (emerald-tinted) | Confirmed choice signal |
| Run Mission button | `--ig-emerald` fill | The primary action — full spend justified |
| Mission Summary label | `--ig-emerald` small caps | "IdeaGate is engaged" |
| Suggestion strip icon | `--ig-emerald` pulse | Active interpretation signal |
| Active phase in Mission Control | `--ig-emerald` dot | "Working here" |

Everything else: neutral surface hierarchy.

## 20.4 Icon Usage

Single icon set: `lucide-react`. Never mix sets.

| Icon | Usage |
|---|---|
| `Compass` or `Play` | IdeaGate monogram in compact bar |
| `CheckCircle` | Confirmed outcome/depth pill |
| `X` | Remove / dismiss |
| `ChevronDown` / `ChevronRight` | Expand/collapse |
| `Paperclip` | File attachment |
| `Link` | URL input |
| `Sparkles` or `Brain` | Suggestion / inference indicator |
| `ArrowRight` | Run Mission direction |
| `AlertTriangle` | Stale artifact warning |
| `ExternalLink` | Validation Log source link |

---

# PART 21 — LOVABLE PROTOTYPE MAPPING

## 21.1 Elements Evaluated

| Prototype element | KEEP / ENHANCE / REMOVE / DEFER | Rationale |
|---|---|---|
| Compact single-line bar | **KEEP** | Right mental model for the ambient state |
| Expansion on focus | **KEEP + ENHANCE** | Add spring physics; make expansion feel like engagement |
| Pill treatment for selections | **KEEP + ENHANCE** | Evolve to confirmed-choice pills with `×` dismissal |
| Outcome as the first selection | **KEEP** | Correct hierarchy |
| Clear "Run" action | **KEEP + ENHANCE** | "Run Mission" is clearer; emerald fill is the right treatment |
| Context as secondary | **REMOVE** | Context is first-class, not secondary |
| No Mission Summary | **ADD** | The crystallization moment is new |
| No intent interpretation | **ADD** | Suggestion strip is new |
| Static depth controls | **ENHANCE** | Add PM-native labels with hover descriptions |
| Missing workspace context | **ADD** | Prior knowledge card is new |
| Visual density | **KEEP** | Good dense-but-readable balance |
| Spatial vertical flow | **KEEP** | Intent → Config → Action is correct |
| Motion treatment | **ENHANCE** | Apply Blueprint motion tokens; add spring character |
| Missing keyboard nav | **ADD** | Full keyboard model specified above |

## 21.2 What Changes From the Prototype

The most significant differences from the Lovable prototype:

1. **Context is a first-class zone** (not a secondary option) — this reflects Document 4's PKS architecture
2. **Mission Summary crystallizes** as configuration proceeds — this is the new signature interaction
3. **Intent interpretation suggests** an outcome after typing — the system engages with the brief
4. **Workspace context card appears proactively** for projects with prior runs
5. **Motion is richer** and reflects Blueprint tokens precisely

---

# PART 22 — PRODUCT DIFFERENTIATION / PREMIUM SAAS CONSIDERATIONS

## 22.1 What Makes IdeaGate's Composer Distinct

In 2026, every SaaS tool has an "AI" input. IdeaGate's Composer must be
recognizably different. The differentiators:

**1. Structured PM methodology, not generic AI**
The outcome grid educates. Selecting "Investigate" doesn't just label a prompt —
it commits IdeaGate to a specific PM methodology (hypothesis generation, experiment
design, evidence grounding). The PM learns PM practice by using IdeaGate.

**2. Visible reasoning through Mission Crystallization**
No other AI input shows the user "here is what I understood and what I will do"
before execution. The Mission Summary's gradual crystallization is unique.

**3. Evidence is first-class, not optional**
The context zone treats the PM's files and prior knowledge as first-class inputs —
not hidden RAG machinery. The PM sees what context is being used and can curate it.

**4. Workspace knowledge accumulation**
The "Prior project context" card in the Composer is a recurring trust signal: IdeaGate
remembers what this team has learned. Over time, this becomes the most valuable
part of the product.

**5. Claim-driven Validation Log**
No AI document tool provides a structured, citable Validation Log at the bottom of
evidence-heavy artifacts. This alone differentiates IdeaGate for serious PM use.

## 22.2 Repeat Usage Patterns

A PM will use IdeaGate repeatedly for the same project. The experience must reward
this:

- **First mission**: Composer feels new, exploratory. Intent interpretation helps.
- **Second mission**: Workspace context card shows "1 prior run." PM feels they're building on something.
- **Fifth mission**: Workspace context card shows "5 runs, 20 findings, 8 decisions." The accumulated value is visible.

This progression is a narrative the UX must make visible without being intrusive.

---

# PART 23 — UX-TO-ARCHITECTURE TRACEABILITY

Every major UX element maps to a frozen architectural contract:

| UX element | Architectural authority |
|---|---|
| Nine outcomes and their names | Documents 1 + 5 (OutcomeId contract) |
| Outcome descriptions and artifacts | Document 5 (outcome contracts, artifact specs) |
| Depth levels and PM labels | Document 2 (DepthPolicy) |
| Intent interpretation suggestion | Document 1 + 2 (normalization; inference suggests, explicit governs) |
| Debate toggle (Advanced) | Document 2 (`orchestrationOverride: 'debate'`) + Document 5 (§18) |
| Context attachment types | Document 4 (EvidenceSourceType, capabilityContextIds) |
| Workspace context card | Document 4 (PKS dynamic retrieval, §9.4–9.5) |
| Mission Summary content rules | Document 5 (artifact contracts per outcome) |
| "No fabricated estimates" rule | Document 3 (runtime state is the only source of truth) |
| Validation Log placement + rule | Document 5 §4.3 (claim-driven) |
| Stale artifact indicator | Document 4 §21.5 (stale propagation) |
| Human-edit `changeOrigin` | Document 4 §38.5 (changeOrigin seam) |
| Visual representation derivation | Document 5 §3.3 (Layer 2 → Layer 3) |
| OST epistemic status display | Document 5 §3.4 (hypothesis-grade vs evidence-grounded) |
| Motion tokens | Design Blueprint §14 (motion vocabulary) |
| Color system | Design Blueprint Part III |
| Typography | Design Blueprint §6 + Visual Grammar §3 |

---

# PART 24 — IMPLEMENTATION BOUNDARY / DOCUMENT 7 HANDOFF

## 24.1 What Document 6 Defines

- State model (complete)
- Interaction flows and transitions
- Motion timing and character
- Content/copy standards
- Accessibility requirements
- PM-native language standards
- Information hierarchy per surface
- Component behavior (not implementation)

## 24.2 What Document 7 Must Define

| Concern | Document 7 responsibility |
|---|---|
| Component implementation (React/Next.js) | Specific component file structure, hooks |
| Intent interpretation implementation | NLP/routing model, confidence scoring |
| Progress label mapping | internal step → PM-native label per outcome |
| Validation Log extraction | Claim detection, source attribution algorithm |
| Visual representation renderers | Mermaid config, recharts setup, OST/ERD renderers |
| Context assembly implementation | How attached files become PKS evidence |
| Workspace context retrieval | PKS Inspection API integration |
| Mission Summary generation | Template engine or LLM prompt |
| Stale artifact detection | ArtifactImpactRecord integration |
| Animation library specifics | Whether to use Framer Motion, CSS transitions, etc. |
| Keyboard shortcut binding | OS-level shortcut registration |

---

# PART 25 — ACCEPTANCE CRITERIA

| # | Criterion | Verification |
|---|---|---|
| 1 | Composer shows all nine outcomes | Open outcome grid; assert 9 outcomes with correct PM names and descriptions |
| 2 | Suggestion only suggests; never auto-selects | Type a full intent sentence; wait for any suggestion to appear; assert outcome row remains unset (no auto-selection has occurred); accept suggestion; assert outcome is now set |
| 3 | Explicit selection overrides suggestion | Accept suggestion; then click a different outcome; assert new outcome is used |
| 4 | Balanced depth is pre-selected by default | Open Composer; assert depth = 'balanced' on first configuration |
| 5 | Mission Summary does not contain time/agent/token estimates | Generate Mission Summary for any outcome; assert no time, agent count, or token estimates appear |
| 6 | Workspace context card visible but NOT included by default | Open Composer for a project with prior runs; assert workspace context card shows "Include ○" (unchecked); assert that running without opt-in produces `includeWorkspaceMemory: false` in RunConfig |
| 7 | Debate toggle only appears for Decide outcome | Set outcome = 'investigate'; assert debate toggle absent. Set = 'decide'; assert visible. |
| 8 | Run button active after intent + outcome for most outcomes; blocked for Review/Investigate without context | (a) Confirm Research outcome: assert Run active without context. (b) Confirm Review outcome: assert Run disabled until file attached. (c) Confirm Investigate outcome: assert Run disabled until file attached. In all cases, depth shows Balanced without PM interaction. |
| 9 | Cmd+K opens Composer from any workspace view | Press ⌘K on Desk, Studio, Mission Control; assert Composer opens with focus on intent textarea |
| 10 | Reduced motion preference is respected | Set prefers-reduced-motion: reduce; assert no translateY animations; only opacity transitions |
| 11 | Validation Log appears only where external claims exist (claim-driven) | Generate Research artifact with external market/competitor claims; assert Validation Log entries present. Generate Prioritize artifact (no external claims); assert no Validation Log. Generate Research artifact with only analytical interpretation; assert no Validation Log entries. |
| 12 | Stale indicator appears when upstream knowledge changes | Supersede a Decision that an artifact depends on; assert stale indicator appears on that artifact |
| 13 | Human edit sets changeOrigin = 'human-authored' | Edit artifact text in Studio; save; assert new version has changeOrigin = 'human-authored' |
| 14 | Keyboard navigation of outcome grid | Arrow key navigation; assert focus moves correctly; Enter selects; Escape dismisses without selection |
| 15 | Error messages are PM-native | Trigger intent-too-short error; assert message is PM-readable, no technical codes |
| 15a | Review outcome blocks Run without context | Set outcome=Review; assert Run button is disabled; assert context zone shows "Required" indicator; attach a file; assert Run becomes active |
| 15b | Investigate outcome blocks Run without context | Set outcome=Investigate; assert Run button is disabled; assert blocking message is visible; attach evidence file; assert Run becomes active |
| 16 | Advanced section only shows for Decide (V1) | Set outcome=Research; assert no Advanced section visible. Set outcome=Decide; assert Advanced section with Debate toggle appears. |
| 17 | Debate toggle only valid for Decide; other outcomes reject it | Set outcome=Decide; enable debate; change to outcome=Prioritize; assert debate toggle absent and Advanced section hidden; assert RunConfig does not contain orchestrationOverride |

---

# PART 26 — ADVERSARIAL UX REVIEW

## 26.1 Consistency Audit Against Documents 1–5 and Design Blueprint

| Check | Verified? | Notes |
|---|---|---|
| Nine outcomes used; no invented outcomes | ✅ | All nine, PM-facing names only |
| Outcomes described in PM language; no internal IDs | ✅ | Document 5 contract respected |
| Depth levels match Document 2 DepthPolicy | ✅ | Quick/Balanced/Deep/Exhaustive |
| Debate is `orchestrationOverride: 'debate'` only; shown for Decide only | ✅ | Document 5 §18 |
| Context types map to Document 4 EvidenceSourceType | ✅ | Uploaded/URL/pinned/dynamic |
| Workspace context = PKS dynamic retrieval; never raw content | ✅ | Document 4 §9.4 |
| Mission Summary never fabricates time/agent/token estimates | ✅ | Runtime state only — Document 3 |
| Validation Log is claim-driven; not per artifact type | ✅ | Document 5 §4.3 |
| Visual representations are views of Layer 2; not independent | ✅ | Document 5 Part 3 |
| OST shows evidence-grounded vs hypothesis-grade distinction | ✅ | Document 5 §3.4 |
| Human edits set changeOrigin = 'human-authored' | ✅ | Document 4 §38.5 |
| Motion respects prefers-reduced-motion | ✅ | Design Blueprint Part VIII §35 |
| Emerald is spent sparingly as the single protagonist accent | ✅ | Design Blueprint §5 |
| Monospace for machine output; sans for human reading | ✅ | Design Blueprint §6 |
| 4-layer elevation for raised surfaces | ✅ | Visual Grammar §1.1 |
| No agent names, model names, token counts exposed to PM | ✅ | Document 6 Part 5 §5.2 |
| "Suggest; never override" maintained throughout | ✅ | Document 2 normalization contract |

## 26.2 PM Sense Check

Can a PM explain IdeaGate in three sentences after using Document 6's Composer?

**Simulated first-time PM response:**
> "I typed what I was trying to figure out about our activation drop. IdeaGate
> suggested Investigate, I confirmed it, and chose Balanced depth. I attached my
> analytics CSV, saw that it was going to analyze the data and generate hypotheses,
> confirmed the mission brief, and hit Run."

✅ Three sentences. PM vocabulary. No architecture exposed.

---

# PART 27 — DEFINITION OF DONE

Document 6 is complete when:

**Outcome coverage:**
- [ ] All nine outcomes have PM-native names, descriptions, and "What you'll receive" summaries
- [ ] Debate variant of Decide is specified (Advanced only)
- [ ] Continuous Research is not surfaced in the main Composer flow (Document 7 concern for scheduling)

**Composer states:**
- [ ] All 13+ Composer states defined with visible/hidden/disabled/active elements
- [ ] Suggestion state defines behavioral trigger (sufficiently detailed intent) and "moderate" confidence variant; timing deferred to Document 7
- [ ] Preflight state defines Mission Summary rules including fabrication prohibition

**Interaction model:**
- [ ] Keyboard interaction model complete (⌘K, arrows, Enter, Escape, ⌘Enter)
- [ ] All motion uses Design Blueprint tokens
- [ ] Reduced motion variant defined
- [ ] Mobile-specific adaptations defined

**Context attachment:**
- [ ] Four context types defined (uploaded/URL/prior artifacts/workspace)
- [ ] Workspace context card defined for projects with prior runs
- [ ] Include/Exclude toggle for workspace context defined

**Artifact experience:**
- [ ] Desk navigation defined for multi-artifact outcomes
- [ ] Stale artifact indicator defined (amber, section-level)
- [ ] Studio improvement flow defined (Select→Improve→Visualize→Edit→Version)
- [ ] Human-edit flow defined with changeOrigin seam

**Validation Log:**
- [ ] Claim-driven placement rule enforced (not per-type)
- [ ] Collapsed-by-default presentation defined
- [ ] Table format with source links defined

**Visual representations:**
- [ ] Representations defined as views of structured data, not independent documents
- [ ] Stale representation indicator defined
- [ ] OST epistemic status display defined

**Engineering handoff:**
- [ ] Document 7 handoff table complete (24 implementation concerns)
- [ ] UX-to-architecture traceability table complete
- [ ] All acceptance criteria are objectively testable

**Quality:**
- [ ] Adversarial review completed against Documents 1–5 and Design Blueprint
- [ ] All 17 cross-document checks verified
- [ ] PM sense check passed

---

# PART 28 — FUTURE SEAMS AND DEFERRALS

**Previously visible in Advanced (now removed as unsupported):**
These were removed from Document 6 v1.0 as they had no authoritative RunConfig mapping.
They are preserved here as future seams only — NOT as visible disabled buttons.

| Previously shown | Why removed | Future contract needed |
|---|---|---|
| Research emphasis slider | No `researchEmphasis` in RunConfig (Doc 2) | New RunConfig field + Router support |
| Context Focus (blend/prioritize) | Retrieval weighting is Document 4 internal | Document 4 amendment + RunConfig field |
| Visual representations toggle | Not a RunConfig field | Document 7 rendering preference per artifact type |
| Validation Log toggle | Claim-driven rule cannot be toggled (Doc 5 §4.3) | None — correct behavior is informational only |

**Active future seams (spec preserved, not visible in current UI):**

| Capability | Status | Where seam lives |
|---|---|---|
| Saved mission templates | Future | Advanced section slot (currently empty for non-Decide) |
| Recent missions quick-access | Future | Composer footer — space reserved |
| Continuous Research scheduling | Phase 4 | Advanced section → goal + schedule; entirely hidden until Phase 4 |
| Team collaboration indicators | Future | Workspace context card — team activity slot reserved |
| Mission sharing / export | Future | Studio "More" menu |
| Voice intent input | Future | Intent textarea — accepts transcribed text |
| Reasoning inspector (PKS) | Phase 2 | "[What would this add?]" link in workspace context card |
| OST interactive editing | Phase 2 | "Edit nodes" affordance in OST representation viewer |
| ERD interactive editing | Phase 2 | "Edit entities" affordance in ERD viewer |
| Artifact version comparison | Phase 2 | Version history "Compare" action |
| Intent inference from Router | Phase 2 | Suggestion strip — V1 is heuristic; Phase 2 is Router-powered |

**Visual policy for future seams:**
Future capabilities do **not** appear as disabled buttons or "Coming Soon" labels
in the current UI. Showing unbuilt features makes the product feel unfinished.
Seams are architectural (specification + slot), not visual.

---


# PART 29 — NO-INVENTION AUDIT

Every UX concept in Document 6 is classified against the authoritative contracts.
"Unsupported invention" → removed or converted to future seam in v1.1.

| UX concept | Classification | Authority | Status |
|---|---|---|---|
| Nine outcome names | Existing contract | Document 5 OutcomeIds | ✅ Preserved |
| Balanced depth default | Existing contract | Document 2 §3.1 | ✅ Preserved |
| `orchestrationOverride: 'debate'` | Existing contract | Document 2 RunConfig | ✅ Preserved |
| Workspace memory opt-in | Existing contract | Document 2 `includeWorkspaceMemory: false` | ✅ Fixed v1.0→v1.1 |
| File attachment | Existing contract | Document 4 EvidenceSourceType 'uploaded-document' | ✅ Preserved |
| URL entry | Existing contract | Document 4 EvidenceSourceType 'web-url' | ✅ Preserved |
| Prior artifacts as context | Existing contract | Document 4 capabilityContextIds | ✅ Preserved |
| Validation Log (informational) | Existing contract | Document 5 §4.3 | ✅ Preserved |
| Mission Crystallization | Presentation-only UX | No RunConfig impact | ✅ Preserved |
| PM-native progress labels | Presentation translation | Document 3 runtime events | ✅ Preserved |
| changeOrigin='human-authored' | Existing contract | Document 4 §38.5 | ✅ Preserved |
| Visual reps as structured views | Existing contract | Document 5 §3.3 | ✅ Preserved |
| OST hypothesis-grade indicator | Existing contract | Document 5 §3.4 | ✅ Preserved |
| Motion tokens | Existing contract | Design Blueprint §14 | ✅ Preserved |
| "Research emphasis" slider | Unsupported invention | No RunConfig field | ❌ Removed in v1.1 |
| "Context Focus" retrieval weight | Unsupported invention | Document 4 retrieval is internal | ❌ Removed in v1.1 |
| "Include visual representations" toggle | Unsupported invention | Not a RunConfig field | ❌ Removed in v1.1 |
| Validation Log toggle | False control | Document 5 §4.3 is claim-driven | ❌ Removed in v1.1 |
| "Up to 10 files · 50MB each" | Implementation detail | Belongs in Document 7 | ❌ Removed in v1.1 |
| Visible "Future capability" buttons | Premature UI | No contract | ❌ Removed in v1.1 |
| Workspace memory "Include ✓" default | Wrong default | Document 2 default is `false` | ❌ Fixed in v1.1 |
| "800ms pause" + "≥8 words" suggestion trigger | Implementation detail | Belongs in Document 7 | ❌ Removed in v1.2 |
| Run active for ALL outcomes on intent+outcome | Ignores Document 2 §7 context requirements | OUTCOME_REQUIRES_CONTEXT for Review + Investigate | ❌ Fixed in v1.2 |
| Goal as a future-seam but without classification | Ambiguous — is it V1 or future? | Document 2 RunConfig field exists but Composer V1 does not expose it | ❌ Clarified in v1.2 (§10.1a) |
| Advanced as "Decide-only architectural rule" | Over-constrains future extension | V1 scope, not permanent rule | ❌ Corrected wording in v1.2 |

---

# PART 30 — COMPOSER CONTROL TRACEABILITY TABLE

Every active V1 Composer control traced to its authoritative contract.
Any control that cannot complete this chain does not exist in Document 6 v1.1.

| UI control | PM problem solved | RunConfig field | Authority | Section | V1 or Future |
|---|---|---|---|---|---|
| Intent textarea | Express the PM job | `intent: string` | Document 1 §IV | §6.4 | V1 |
| Required context zone (Review/Investigate only) | Fulfil hard context prerequisite before Run | `context.uploadedDocuments` / `context.artifactIds` | Document 2 §7 (OUTCOME_REQUIRES_CONTEXT) | §6.1a, §9 | V1 |
| Outcome selection (9 options) | Specify what kind of work | `outcome: OutcomeId` | Document 2 + Document 5 | §7 | V1 |
| Depth control (4 options) | Control analysis rigor | `depth: DepthLevel` (default: balanced) | Document 2 §3.1 | §8 | V1 |
| File attachment | Provide mission context from files | `context.uploadedDocuments` | Document 4 EvidenceSourceType | §9.3 | V1 |
| URL entry | Provide mission context from web | `context.urls` | Document 4 EvidenceSourceType | §9.4 | V1 |
| Prior artifacts selector | Provide specific IdeaGate artifacts as context | `context.artifactIds` (capabilityContextIds) | Document 4 §9.4 | §9 | V1 |
| Workspace memory toggle (opt-in) | Include prior project knowledge | `context.includeWorkspaceMemory: boolean` (default false) | Document 2 §3.1 | §9.5 | V1 |
| Debate toggle (Decide only) | Enable adversarial reasoning | `orchestrationOverride: 'debate'` | Document 2 RunConfig + Document 5 §18 | §10.2 | V1 |
| Evidence verification statement | Trust signal (no user control) | N/A (informational) | Document 5 §4.3 | §10.3 | V1 |

PART 30A — FINAL FREEZE-GATE CLARIFICATIONS & CONTRACT BOUNDARY

Document: Mission Composer UX & Experience Specification
Applies to: Document 6 v1.2
Status: Surgical clarification / final freeze gate
Purpose: Resolve remaining UX-contract ambiguities before Document 7 implementation.

Authority rule: This Part 30A amends or clarifies only the specific areas identified below. All portions of Document 6 v1.2 that are not explicitly affected remain authoritative and unchanged.

No new outcome, capability, orchestration primitive, RunConfig field, memory class, execution semantic, or backend architecture is introduced by this addendum.

30A.1 — Canonical Outcomes vs Currently Executable Outcomes

Document 5 defines the canonical IdeaGate outcome model.

Document 6 defines how those outcomes are presented to the PM.

These are separate concepts:

CANONICAL PRODUCT CAPABILITY
        ↓
May be represented in the Composer
        ↓
CURRENT EXECUTION READINESS
        ↓
Determines whether Run is actually permitted

The Composer must not silently invent implementation readiness.

Likewise, the Composer must not hide a canonical product outcome merely because a particular execution capability is not yet implemented, unless the authoritative implementation contract explicitly requires that behavior.

Governing rule

Canonical outcome availability and execution readiness are separate dimensions.

The UI may represent the complete canonical outcome vocabulary while execution eligibility is determined by the authoritative runtime/implementation contract.

If an outcome is not executable in the current release:

the UI must not imply that a successful execution is available;
the user must receive a clear PM-native explanation;
the Composer must not fabricate a fallback execution;
the UI must not silently substitute another outcome;
Document 7 must implement the behavior defined by the authoritative readiness contract.

The Composer therefore never says:

"This outcome doesn't exist."

when the outcome is architecturally valid but not yet executable.

Instead, it communicates the actual state honestly.

Critical principle

Do not confuse "supported by the product model" with "currently executable by the runtime."

This distinction prevents Document 7 from having to invent product behavior.

30A.2 — Prioritize Input Semantics

Prioritize requires a meaningful set of items to prioritize.

This is an outcome input requirement, not automatically a context-required classification.

The items may originate from:

the user's natural-language intent;
an attached document;
selected existing artifacts;
explicitly supplied contextual material;
another supported input mechanism defined by the authoritative contracts.

Therefore:

Prioritize must not be classified as hard context-required merely because it needs items to prioritize.

The Composer should determine whether the mission contains enough information to perform prioritization.

Example:

"Prioritize these six features: onboarding, search, referrals, notifications, analytics and dark mode."

is sufficient semantic input even without an attachment.

Conversely:

"Prioritize these."

with no identifiable items is insufficient.

Governing rule
Prioritize
    ↓
Requires prioritization candidates
    ↓
Candidates may come from intent OR supported context
    ↓
No artificial attachment requirement

Do not use an invented classification such as:

"effectively context-required."

Use the actual semantic requirement:

The mission must contain a usable set of prioritization candidates.

30A.3 — Preflight Has a Precise Meaning

The Composer's Preflight state is a user-facing validation and crystallization state.

It is not:

an additional execution stage;
an orchestration step;
a hidden agent run;
a replacement for the Strategy Router;
a second execution engine;
persisted runtime state.

Its purpose is:

USER INPUT
   ↓
CONFIGURATION
   ↓
PREFLIGHT
   ↓
MISSION CRYSTALLIZATION
   ↓
RUN

Preflight verifies that the configured mission is sufficiently valid to submit.

It may surface:

missing required input;
incompatible configuration;
missing required context;
unsupported combination;
normalization warning;
user-visible assumption;
execution-readiness issue.
Preflight must not perform substantive PM work.

It does not research, prioritize, debate, evaluate or generate artifacts.

Its job is:

"Is this mission sufficiently well-formed and executable for IdeaGate to accept?"

This preserves the deterministic boundary:

Composer
   ↓
Preflight / normalization
   ↓
RunConfig
   ↓
Strategy Router
   ↓
ExecutionPlan
30A.4 — Mission Summary Must Not Become a Second Outcome Contract

The Mission Summary is a presentation of the configured mission, not a second source of truth for outcome semantics.

Document 5 remains authoritative for:

outcome purpose;
required inputs;
artifact outputs;
evaluation requirements;
evidence requirements;
knowledge production;
orchestration semantics.

Document 6 determines:

how those decisions are explained to the PM;
how the summary is visually presented;
how the summary crystallizes;
how the PM understands what will happen.

Therefore:

Document 6 may present an outcome contract; it must not redefine it.

If Document 5 changes an artifact requirement in a future controlled revision, Document 6's presentation must follow that authoritative contract rather than maintaining a competing hard-coded interpretation.

30A.5 — 15 Executable Steps vs 14 Substantive PM Stages vs Artifact Count

IdeaGate uses different counting concepts for different purposes.

These must never be conflated:

15 executable steps

The internal execution model includes 15 executable lifecycle positions/steps.

14 substantive PM stages

The user-facing PM lifecycle is represented as 14 substantive lifecycle stages.

Artifact count

Artifacts are not required to have a one-to-one relationship with lifecycle stages or execution steps.

One execution step may:

produce an artifact;
contribute to an artifact;
coordinate another operation;
evaluate an output;
prepare context;
perform a non-document-producing operation.

Likewise, one PM deliverable may incorporate information from multiple lifecycle steps.

Therefore:

Stage count ≠ execution-step count ≠ artifact count.

If the Composer presents a count such as:

"13 major PM deliverables"

that number must be described as a deliverable count, not as a claim that IdeaGate has 13 stages or that every execution step produces one artifact.

This distinction must remain intact in:

Mission Summary;
Mission Control;
Desk;
documentation;
implementation telemetry.
30A.6 — Document 5 Is the Artifact Semantic Source of Truth

Document 6 must not become a second artifact-definition system.

The ownership boundary is:

DOCUMENT 5
──────────
What the outcome means
What it produces
What the artifact means
What quality means
What evidence is required
What knowledge is generated


        ↓


DOCUMENT 6
──────────
How the PM configures the mission
How the PM understands the expected result
How the result is presented
How the Composer communicates the contract


        ↓


DOCUMENT 7
──────────
How the system implements it

Therefore, when Document 6 displays:

"What you'll receive"

that content is a UX representation of the Document 5 contract.

It must not silently introduce:

new artifacts;
new minimum counts;
new quality guarantees;
new evidence requirements;
new evaluation rules;
new orchestration behavior.
Governing principle

Document 5 defines the deliverable. Document 6 explains the deliverable. Document 7 implements the deliverable.

30A.7 — Context Requirement Must Remain Contract-Driven

The Composer must distinguish between:

Required context

The authoritative outcome contract explicitly requires external/contextual material.

Useful context

Context may improve quality but is not mandatory.

Semantic input

The user's intent itself contains the information required to perform the outcome.

Optional workspace knowledge

Prior project knowledge may be included only according to the existing explicit workspace-memory contract.

The Composer must never turn:

"useful"

into:

"required"

merely because additional context would improve the result.

This protects IdeaGate from becoming an unnecessarily cumbersome form.

30A.8 — Advanced Configuration Remains Progressive Disclosure

The Composer must preserve the existing philosophy:

The PM chooses the job. IdeaGate handles the machinery.

Therefore the Composer must not expose:

agent counts;
model selection;
token budgets;
raw orchestration recipes;
evaluation thresholds;
retrieval algorithms;
memory architecture;
sub-agent topology;
internal lifecycle stage numbers.

Advanced configuration may expose only genuine PM-level choices already supported by the authoritative contracts.

The Lovable/Mobbin-inspired expanded interaction remains valid:

COMPACT MISSION BAR
        ↓
EXPAND
        ↓
INTENT
        ↓
OUTCOME
        ↓
DEPTH
        ↓
CONTEXT
        ↓
APPLICABLE ADVANCED OPTIONS
        ↓
MISSION CRYSTALLIZATION
        ↓
RUN

The expansion must feel like briefing a product team, not configuring an AI system.

30A.9 — Design Implementation Boundary

Document 6 specifies the experience contract.

The Design Blueprint remains authoritative for:

visual language;
tokens;
typography;
motion;
spacing;
component DNA;
interaction character.

Document 7 owns:

component implementation;
React structure;
state wiring;
API integration;
event handling;
persistence integration;
rendering implementation;
technical libraries;
test implementation.

Therefore any implementation-level examples inside Document 6 are illustrative unless explicitly governed by the Design Blueprint or an authoritative UX contract.

Document 7 must not interpret illustrative TypeScript/HTML/CSS examples as mandatory architecture unless the relevant contract explicitly says so.

30A.10 — Mission Composer Product-Sense Gate

Before Document 6 is frozen, every Composer decision must pass this test:

1. Does this help a PM express a real job?


2. Does this reduce unnecessary configuration?


3. Does this make an important decision clearer?


4. Does it expose only information the PM actually needs?


5. Is the control backed by an authoritative contract?


6. Does the control have an understandable PM outcome?


7. Can the user understand what will happen before committing?


8. Does the UI avoid exposing implementation mechanics?


9. Does the interaction preserve user agency?


10. Does the behavior remain honest when execution is unavailable,
    context is insufficient, or evidence is weak?

If the answer to any of these is no, the feature requires reconsideration before implementation.

30A.11 — Final Freeze Rules

After this amendment:

Document 6 must NOT:
create another outcome;
create another orchestration recipe;
create another agent;
redefine memory;
redefine retrieval;
redefine execution;
redefine evaluation;
redefine artifact semantics;
introduce artificial context requirements;
invent unsupported implementation capabilities;
expose internal lifecycle mechanics to the PM.
Document 6 MUST:
remain outcome-oriented;
preserve progressive disclosure;
preserve Mission Crystallization;
preserve first-class attachments;
preserve PM-native language;
preserve explicit user choice;
preserve deterministic validation boundaries;
accurately communicate execution readiness;
consume Document 5 as the artifact contract;
hand implementation questions to Document 7;
preserve the premium IdeaGate Design Blueprint.
30A.12 — Final Freeze Decision

With Part 30A applied:

Document 1  → Product / Mission Composer foundation
Document 2  → Routing + ExecutionPlan
Document 3  → Runtime + Agent Harness
Document 4  → Context + Memory + Evidence + Part 34A
Document 5  → Outcome Engineering Contracts
Document 6  → Mission Composer UX + Experience + Part 30A
Document 7  → Implementation Specification

The architectural chain is:

PM JOB
  ↓
MISSION COMPOSER
  ↓
NORMALIZED MISSION
  ↓
RUN CONFIG
  ↓
STRATEGY ROUTER
  ↓
EXECUTION PLAN
  ↓
ORCHESTRATION ENGINE
  ↓
AGENT HARNESS
  ↓
CONTEXT / MEMORY / EVIDENCE
  ↓
EVALUATION
  ↓
ARTIFACTS
  ↓
DESK / STUDIO / MISSION CONTROL

No layer should silently assume behavior owned by another layer.

Final rule

If a future implementation question cannot be answered from Documents 1–6, Document 7 must identify the missing contract explicitly rather than inventing product behavior.

Status

DOCUMENT 6 v1.2 + PART 30A = FINAL FREEZE-GATE VERSION

After verification of the amendment against Documents 1–5 and the Design Blueprint, Document 6 may be frozen and Document 7 may begin.

PART 30A — ONE AFTER ONE

This is the complete surgical addendum intended to be pasted directly below the existing final Part 30 of Document 6.
---

*IdeaGate — Mission Composer UX & Experience Specification*
*Document 6 of 7 | Version 1.2 — FREEZE CANDIDATE*
*Status: READY FOR IMPLEMENTATION REVIEW PENDING FINAL APPROVAL*
*Depends on: Documents 1–5 (FROZEN), Design Blueprint V1.2, Visual Grammar V1.0*
*Feeds: Document 7 — Implementation Specification*

*Core principle: IdeaGate is a Product Operating System. The Composer is a mission briefing*
*interface, not an AI settings panel. The PM describes a job. IdeaGate understands it.*
