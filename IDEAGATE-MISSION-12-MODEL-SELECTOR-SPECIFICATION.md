# IDEAGATE MISSION 12 — MODEL SELECTOR SPECIFICATION

**Document ID:** IDEAGATE-M12-SPEC-001
**Version:** 1.0.0
**Status:** ARCHITECTURAL REFERENCE — not source of truth
**Parent Document:** IDEAGATE-MODEL-PLATFORM-SPECIFICATION.md (Section 15 — UX Spec, superseded
by this document for implementation purposes)
**Scope:** Missions 12A, 12B, 12C, 12D only

> **How to use this document:** This is a design target, not a contract. Claude Code reads it
> before each 12A–12D mission to understand intent, then implements. If implementation reveals
> the spec was wrong, ambiguous, or technically infeasible as written, Claude Code decides
> whether to update this document or correct the implementation — and states which decision it
> made and why in its mission report. This document must never silently drift out of sync with
> the codebase. Treat disagreement between doc and code as a signal to investigate, not as an
> error to suppress.

---

## TABLE OF CONTENTS

1. Mission Objectives and Scope
2. Explicit Out-of-Scope (Scope Creep Prevention)
3. Information Architecture — The AI Control Center
4. Registry Data Model and Exposed Fields
5. UI Hierarchy and Layout
6. Search, Filtering, Sorting, and Grouping Behaviour
7. Model Categorization Strategy
8. Interaction Design and State Management
9. Runtime Status Indicators
10. Accessibility and Responsive Behaviour
11. Backward Compatibility Constraints
12. Performance Expectations
13. Error and Fallback Behaviour
14. Acceptance Criteria (per sub-mission)
15. Smoke Test Plan
16. Future Extensibility (Mission 13+)
17. Mission Breakdown Reference (12A–12D)
18. Open Questions

---

## 1. MISSION OBJECTIVES AND SCOPE

**Primary objective:** Replace the current 10-model dropdown (`ModelDropdown.tsx`) with a
registry-driven selector that surfaces all enabled models from `MODEL_REGISTRY` (22 at time of
writing), without changing the underlying routing established in Mission 11.

**What success looks like:**
- A user opens the model selector and sees all 22 enabled models, grouped by category
- A user selects any model — including ones never available before (e.g., Claude Opus 4.8,
  Gemini 2.5 Pro, xAI Grok 4.1 Fast) — and that exact model ID reaches OpenRouter
- The OpenRouter activity dashboard shows the selected model for every call in the run
- Nothing that currently works (model persistence, free/paid distinction, Settings page model
  list, Office page agent model display) breaks

**This mission does NOT touch:**
- The registry data itself (`model-registry.ts`) — that is Mission 11, already complete
- The routing logic (`run/route.ts`, `improve/route.ts`) — already migrated in 11B
- The coordinator or any CLI-side execution logic
- Recovery Mode / transparent fallback UI (that is Mission 14, per the Platform Specification)
- Cost tracking or usage dashboards (that is Mission 15)

---

## 2. EXPLICIT OUT-OF-SCOPE (SCOPE CREEP PREVENTION)

The following are recognized as valuable but are explicitly **not** part of Mission 12A–12D.
If a 12-series mission finds itself touching any of these, stop and report — do not proceed.

| Item | Why it's excluded | Where it belongs |
|---|---|---|
| Favourites / pinned models | Adds persistence + UI complexity beyond registry display | Mission 12-Phase-2 (post-12D) |
| Per-stage model override (different model per lifecycle stage) | Requires coordinator changes | Future theme, not yet scheduled |
| Model comparison / side-by-side regeneration | Requires new API surface | Future theme |
| Cost tracking display in dropdown | Requires GenerationLog (Mission 15) | Mission 15 |
| Transparent Recovery Mode banner | Requires coordinator-side event emission | Mission 14 |
| Provider logos as actual image assets | Cosmetic polish, not functional | Mission 16 (Premium UI/UX) |
| New providers beyond OpenRouter (Anthropic Direct, etc.) | Provider abstraction is stubs-only per spec | Future phase per Platform Spec Section 9 |
| P-NEW-5 (Continue/Resume button) | Unrelated subsystem — coordinator state, not model selection | Tracked separately in TODO |
| P-NEW-6 (New Idea blank canvas audit) | Unrelated subsystem | Tracked separately in TODO |
| P-NEW-1 (max_tokens fix) | Coordinator/llm.js change, protected files | Standalone mission, not 12-series |
| P-NEW-2 (Stage 10 prompt strengthening) | Lifecycle stage definition change | Standalone mission, not 12-series |
| P-NEW-3 (third recovery model) | Coordinator fallback logic | Standalone mission, not 12-series |

---

## 3. INFORMATION ARCHITECTURE — THE AI CONTROL CENTER

The model selector is being elevated from "a dropdown" to what this document calls the
**AI Control Center** — the single place in the UI where the user understands and controls
which intelligence powers their work. Three surfaces currently reference model data and all
three must read from the same source after Mission 12:

```
AI CONTROL CENTER
│
├── TopBar Model Selector (Desk page)
│     Primary entry point. Visible at all times. Drives the lifecycle run.
│
├── Improve Page Model Selector
│     Secondary entry point. Drives single-artifact improvement calls.
│     Already has REGISTRY_MODELS available (added Mission 11C, unused until now).
│
└── Settings Modal — AI Models Tab
      Tertiary entry point. Sets defaultModel persisted to GlobalStore.
      Currently reads MODEL_LABELS (unchanged in 11C, still the 10-model legacy set).
```

A fourth surface exists but is explicitly **read-only** in this mission:

```
Office Page — Agent Model Badge
      Displays which model an agent is using during a run. Read-only display,
      sourced from MODEL_LABELS + FREE_MODEL_KEYS. Visual update only if trivial;
      do not add interactivity here in Mission 12.
```

**Decision required at 12A:** Does the Settings Modal's "AI Models" tab get the new
22-model selector too, or does it stay on the legacy 10-model list with a note that the
full catalog is available via the main selector? Recommendation: Settings Modal gets the
new selector in 12C (bundled with Improve page work) since both are secondary surfaces with
similar integration complexity. Flag this in the 12A report for confirmation before 12C begins.

---

## 4. REGISTRY DATA MODEL AND EXPOSED FIELDS

The selector must render using only fields that already exist in `ModelEntry` (defined in
`model-registry.ts`, Mission 11A). No new fields should be added to the registry as part of
Mission 12 — if a UI need can't be met with existing fields, that is a signal to flag, not to
silently extend the registry.

**Fields the selector UI consumes:**

| Field | UI Use |
|---|---|
| `modelId` | Value submitted on selection; shown in tooltip/detail view |
| `displayName` | Primary label in dropdown row |
| `provider` | Used for provider color dot (Section 15.5 of Platform Spec) |
| `category` | Section grouping |
| `costTier` | Badge: FREE / $ / $$ / $$$ / PREMIUM |
| `contextWindow` | Displayed as "1M ctx" / "262K ctx" etc. |
| `supportsVision` | 👁 icon |
| `supportsThinking` | 🧠 icon |
| `typicalSpeed` | Speed dot + label |
| `isFree` | Drives FREE badge + free-tier section placement |
| `enabled` | Gate — false means excluded from render entirely |
| `comingSoon` | Gate — true means greyed out, not selectable |
| `bestUseCases[0]` | Single-line descriptor under model name |
| `pmDocumentQuality`, `reliabilityScore` | Available for future sort/recommend logic — not required to render in 12A, but the data structure must support reading them |

**Fields NOT used in Mission 12** (reserved for later missions, must not be wired into UI yet):
`inputCostPerMillion`, `outputCostPerMillion` (Mission 15 — cost display),
`isRecommended`, `isBenchmarkWinner` (future intelligence layer), `notes` (detail panel,
optional stretch goal — see Section 16).

---

## 5. UI HIERARCHY AND LAYOUT

```
ModelSelector/
├── index.tsx              Top-level component — owns open/closed state
├── ModelSelectorTrigger.tsx   Collapsed button shown in TopBar/Improve header
├── ModelSelectorPanel.tsx     Expanded dropdown panel
├── SearchBar.tsx               Text input + filter chips
├── CategorySection.tsx         Section header + list of ModelCard
├── ModelCard.tsx                Single model row
├── RecentlyUsed.tsx             Top-of-panel recent models (Phase 2 — see Section 16)
└── types.ts                     Shared prop types for this component family only
                                  (do NOT redefine ModelEntry — import from model-registry.ts)
```

**Layout reference (desktop, matches existing IdeaGate visual language):**

```
┌──────────────────────────────────────────────┐
│ ◉ Owl Alpha (Free)            FREE    ▼      │  ← Trigger (collapsed state)
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ 🔍 Search models...      [All][Paid][Free]   │
├──────────────────────────────────────────────┤
│ 🏆 FRONTIER PREMIUM                4 models   │
│   Claude Opus 4.8        PREMIUM  👁 🧠       │
│   Claude Sonnet 4.6      PREMIUM  👁 🧠       │
│   ...                                          │
├──────────────────────────────────────────────┤
│ 💰 BEST VALUE PAID                 9 models   │
│   ...                                          │
├──────────────────────────────────────────────┤
│ 🆓 ZERO-COST / FREE                7 models   │
│   ...                                          │
└──────────────────────────────────────────────┘
```

Full visual spec (colors, spacing, provider color table) is defined in
IDEAGATE-MODEL-PLATFORM-SPECIFICATION.md Section 15.1–15.6 — this document does not repeat
that detail, it points to it. Mission 12A must read that section before building.

**Constraint:** Reuse the existing visual language already present in `ModelDropdown.tsx`
(dark backgrounds, JetBrains Mono font, the established color palette from `GlobalStore.tsx`
provider colors where present). Do not introduce a new design language in Mission 12 — that
is Mission 16's job.

---

## 6. SEARCH, FILTERING, SORTING, AND GROUPING BEHAVIOUR

**Search (required in 12A):**
- Matches against `displayName`, `modelId`, `provider`, `bestUseCases` (case-insensitive)
- Debounced 150ms
- Empty state: "No models found for '{query}'"

**Filter chips (required in 12A):** All / Paid / Free / Fast / Thinking / Vision
- Filter logic exactly as defined in Platform Spec Section 15.4
- Multiple chips combine with AND logic; contradictory combinations (Paid+Free) reset to All

**Sorting (NOT required in 12A — explicitly deferred):**
No user-facing sort control in Mission 12. Display order is fixed: category order as defined
in Section 7 below, then registry array order within each category. If a future mission adds
sort-by-quality or sort-by-cost, that is a 12-Phase-2 item, not 12A–12D.

**Grouping (required in 12A):**
Models are grouped into the 7 sections defined in the Platform Spec (Section 8.3): Frontier
Premium, Best Value Paid, Fast & Affordable, Zero-Cost/Free, Coding Specialists, Heavy
Reasoning, Vision/Document Analysis. Note: some models legitimately appear in multiple
*logical* groupings per the spec (e.g., Claude Opus 4.8 is both Frontier Premium and a Coding
Specialist) — but each `ModelEntry.category` field holds exactly one value. **Decision for
12A:** render only by the single `category` field; do not attempt cross-listing in multiple
sections. This keeps the data model simple and matches what was actually built in Mission 11A.

---

## 7. MODEL CATEGORIZATION STRATEGY

Display order (fixed, do not reorder without updating this document):

1. 🏆 Frontier Premium
2. 💰 Best Value Paid
3. ⚡ Fast & Affordable
4. 🆓 Zero-Cost / Free
5. 💻 Coding Specialists
6. 🧠 Heavy Reasoning
7. 👁 Vision / Document Analysis

**Current actual registry distribution** (verified against `model-registry.ts` as of Mission
11A, 22 models, `coding-specialist`/`heavy-reasoning`/`vision-document-analysis` categories
have zero entries currently — all 22 models are in the first 4 categories):

```
frontier-premium:   4 (Opus 4.8, Sonnet 4.6, Opus 4.7, Haiku 4.5 — note: Haiku is
                       actually category:'fast-affordable' per the registry, verify at 12A)
best-value-paid:    9
fast-affordable:    4 (3 + Gemini 3 Flash Preview)
zero-cost:          7
coding-specialist:  0  ← empty section
heavy-reasoning:    0  ← empty section
vision-document-analysis: 0  ← empty section
```

**Decision required at 12A:** Empty category sections (coding-specialist, heavy-reasoning,
vision-document-analysis) must not render as empty headers. Per Platform Spec Section 15.3:
"Section has 0 results after filter → header hidden." This rule applies at all times for these
three categories, not just under active filters, since they currently have zero registry
entries at all. Confirm this renders correctly — it is an easy thing to get wrong (showing an
empty "💻 CODING SPECIALISTS · 0 models" header would look broken).

---

## 8. INTERACTION DESIGN AND STATE MANAGEMENT

**State ownership:**

| State | Owner | Persisted? |
|---|---|---|
| Selected model (`defaultModel`) | GlobalStore | Yes — localStorage, unchanged from 11C |
| Dropdown open/closed | Local component state (`ModelSelector/index.tsx`) | No |
| Search query | Local component state | No |
| Active filter chips | Local component state | No |
| Scroll position within panel | Browser native | No |

**Selection flow:**
1. User clicks trigger → panel opens
2. User types in search OR clicks a filter chip → list narrows
3. User clicks a model card → `updateSettings({ defaultModel: modelId })` called
4. Panel closes
5. Trigger re-renders showing new selection

**Critical constraint learned from Mission 11C:** Do NOT introduce any new derived array that
filters `LEGACY_KEY_MAP` or any other registry-adjacent structure without verifying every
element of the result actually has a corresponding `MODEL_LABELS` (or equivalent) entry. The
GlobalStore crash in 11C happened exactly this way — a filter produced keys that looked valid
but weren't covered by the lookup table they were immediately used against. Mission 12 must
read directly from `MODEL_REGISTRY` (the new selector's exclusive data source) and must NOT
mix it with the legacy `MODEL_LABELS`/`ModelKey` system. These are two parallel systems by
design during the transition — do not cross-wire them.

**Trigger disabled state:** Same rule as the legacy dropdown — disabled while `isRunning` is
true (lifecycle in progress). Verify this still works after the swap.

---

## 9. RUNTIME STATUS INDICATORS

Mission 12 does **not** build a new status bar (that's a separate future item, not currently
scheduled in the 12-series). What Mission 12 must preserve:

- The existing TopBar display of the currently selected model name must continue to work
  identically after the swap (just sourced from richer registry data instead of the legacy map)
- The Office page's per-agent model badge (read-only) must continue to render without error

No new status indicators are introduced in 12A–12D. If a "bottom status bar" is desired, that
is explicitly out of scope per Section 2 above and should be proposed as a future mission.

---

## 10. ACCESSIBILITY AND RESPONSIVE BEHAVIOUR

**Required in 12A/12B (not optional, not deferred):**
- Keyboard navigation: Arrow keys move focus between model cards, Enter selects, Escape closes
- Focus returns to the trigger button after closing the panel
- `aria-expanded` on trigger, `role="listbox"` on panel, `role="option"` per card,
  `aria-selected="true"` on the currently selected model

**Responsive behaviour:**
- Desktop (>1024px): full panel as designed
- The existing IdeaGate app does not currently have a defined mobile breakpoint strategy.
  Mission 12 should not introduce one. If the panel renders acceptably without special
  handling at narrower widths, that's sufficient — do not build a separate mobile variant.
  This matches the Platform Spec's general guidance but de-scopes the mobile-specific
  modal pattern described there (Section 15.15) — that's Mission 16 territory.

---

## 11. BACKWARD COMPATIBILITY CONSTRAINTS

This is the most important section for risk control, directly informed by Mission 11's lessons.

1. **`ModelKey` type and `MODEL_LABELS` in GlobalStore.tsx must NOT be removed or restructured
   in Mission 12.** Three existing components (`ModelDropdown.tsx`, `SettingsModal.tsx`,
   `office/page.tsx`) depend on the current `Record<ModelKey, ModelMeta>` shape. The new
   selector is **additive** — it reads `MODEL_REGISTRY` directly, it does not replace
   `MODEL_LABELS`.

2. **`defaultModel` in `GlobalSettings` remains typed as `ModelKey` for now**, OR is widened
   to `string` if 12B determines this is necessary to support full registry model IDs (most
   registry `modelId` values like `'anthropic/claude-opus-4-8'` are not valid `ModelKey`
   literals). **This is the single most important technical decision in Mission 12B** — flag
   it explicitly in the 12B report. Recommended approach: widen `ModelKey` to `string` with a
   runtime-validated subset, OR add a parallel field. Do not guess; read GlobalStore.tsx fully
   before deciding, exactly as Mission 11C did.

3. **Old `ModelDropdown.tsx` is not deleted in Mission 12.** It may be deprecated (no longer
   imported by TopBar) but should remain in the codebase, unused, until Mission 12D confirms
   the new selector is fully stable across at least one complete lifecycle validation run.
   Delete it only in a follow-up cleanup mission, not as part of 12A–12D.

4. **Existing legacy model keys (`haiku`, `owlalpha`, `qwen`, etc.) must continue to resolve
   correctly** through `resolveModelId()` regardless of which UI selector was used to set them.
   This was already guaranteed by Mission 11; Mission 12 must not weaken it.

---

## 12. PERFORMANCE EXPECTATIONS

- Dropdown open-to-render: no perceptible delay (registry has 22 static entries, no async
  fetch required — `MODEL_REGISTRY` is a compile-time constant)
- Search debounce: 150ms (matches Platform Spec Section 15.4)
- No additional network requests introduced by the selector itself — all data is local

---

## 13. ERROR AND FALLBACK BEHAVIOUR

| Scenario | Required Behaviour |
|---|---|
| `defaultModel` in localStorage references a model no longer in the registry (deprecated) | Trigger shows the stored value gracefully (display the raw ID or a "Unknown model" label) rather than crashing — this is the direct lesson from the 11C runtime crash |
| Registry import fails to load (should not happen — static import) | Not expected; if it occurs, this is a build-time failure, not a runtime concern for this mission |
| User selects a `comingSoon: true` model | Not selectable — click does nothing, or shows tooltip "Provider integration coming soon" per Platform Spec Section 15.3 |
| Empty search results | "No models found for '{query}'" message, not a blank panel |

---

## 14. ACCEPTANCE CRITERIA (PER SUB-MISSION)

**12A — Component built in isolation**
```
□ ModelSelector/ folder created with all files listed in Section 5
□ Component renders standalone (e.g., in a test route or Storybook-style isolation)
  showing all 22 enabled models grouped into non-empty categories only
□ Search and filter chips functional
□ Keyboard navigation functional
□ TypeScript: 0 errors
□ ZERO existing files modified — this is purely additive, like Mission 11A
```

**12B — Wired into Desk TopBar**
```
□ TopBar imports and renders <ModelSelector /> in place of <ModelDropdown />
□ Selecting a model updates GlobalStore.settings.defaultModel correctly
□ TypeScript: 0 errors
□ UI smoke test: dropdown opens, all 22 models visible, no runtime errors
□ Full lifecycle test: select a NEW model (not in the old 10) — e.g. Claude Sonnet 4.6 —
  run a lifecycle, confirm OpenRouter activity log shows that exact model ID
□ Old ModelDropdown.tsx still exists in codebase, just unused by TopBar
```

**12C — Wired into Improve page (and Settings Modal, if confirmed in 12A)**
```
□ improve/page.tsx uses <ModelSelector /> sourced from REGISTRY_MODELS (already present)
□ Settings Modal decision from Section 3 implemented as agreed
□ TypeScript: 0 errors
□ UI smoke test on Improve page: model selection persists, improve call uses selected model
```

**12D — Full verification + tag**
```
□ Full 15-stage lifecycle run using a model unavailable before Mission 12
□ OpenRouter activity log confirms exact model ID match for every call in the run
□ Documentation updated (CLAUDE.md, ENGINEERING_STATUS.md) per the same pattern as 11D
□ Both repos pushed, tag v4.1-model-selector created
```

---

## 15. SMOKE TEST PLAN

This is the non-negotiable manual verification sequence, modeled directly on what caught the
real bug in Mission 11C (the `FREE_MODEL_KEYS` runtime crash). Run after every sub-mission,
not just at the end.

```
1. Hard refresh the browser (Cmd+Shift+R) — never trust a hot-reloaded state
2. Open the model selector
3. Confirm NO runtime error overlay appears
4. Confirm category headers show correct counts and no empty headers
5. Confirm at least 3 models NOT in the old 10-model list are visible and selectable
   (e.g., Claude Opus 4.8, Gemini 2.5 Pro, xAI Grok 4.1 Fast)
6. Select one of those new models
7. Confirm the trigger updates to show the new selection
8. Reload the page — confirm the selection persisted (localStorage)
9. Type a search query — confirm results narrow correctly
10. Clear search — confirm full list returns
```

If any step fails, stop, roll back the specific file via `git checkout`, and report the exact
failure before proceeding — same discipline as Mission 11.

---

## 16. FUTURE EXTENSIBILITY (MISSION 13+)

This section exists so Mission 12's architecture doesn't have to be rebuilt later. The
following are NOT built in Mission 12 but the component structure should not actively prevent
them:

- **Favourites/pinned models** (Section 2) — would need a new `RecentlyUsed.tsx`-adjacent
  component and a localStorage key; the `ModelCard.tsx` component should accept an optional
  `isFavourite` prop even if unused in 12A, to avoid a prop-interface rewrite later
- **Model Details Panel** (Platform Spec Section 15.11) — a right-sidebar panel showing full
  `ModelEntry` metadata. Mission 12 does not build this, but `ModelCard.tsx` should expose the
  full `ModelEntry` object on click/hover via a callback prop, so a future mission can hang a
  detail panel off that same event without restructuring the card component
- **Cost display** (Mission 15) — `inputCostPerMillion`/`outputCostPerMillion` fields exist in
  the registry now; the `ModelCard.tsx` cost badge logic should be written so a future mission
  can extend `costTier` badge logic to show actual numeric pricing without a rewrite
- **Recovery Mode integration** (Mission 14) — the selector itself does not show recovery
  state, but it should not assume `defaultModel` is always the *actual* model used (Mission 14
  will introduce the distinction between planned vs. actual model)

---

## 17. MISSION BREAKDOWN REFERENCE (12A–12D)

```
12A: Build ModelSelector component, isolated, zero risk          [NOT YET STARTED]
12B: Wire into Desk TopBar — the real risk point                 [BLOCKED ON 12A]
12C: Wire into Improve page + Settings Modal decision              [BLOCKED ON 12B]
12D: Full lifecycle verification + tag v4.1-model-selector        [BLOCKED ON 12C]
```

Each sub-mission gets its own playbook document, generated only after the prior sub-mission's
report is confirmed — same protocol as Mission 11.

---

## 18. OPEN QUESTIONS

These must be resolved during 12A/12B, not assumed in advance. Each should appear explicitly
in the relevant mission's report.

| Question | Resolve in | Default if undecided |
|---|---|---|
| Does Settings Modal get the new selector in 12C, or stay legacy? | 12A (flag), decide by 12C | Stays legacy, new selector deferred |
| Is `defaultModel` widened to `string` or kept as `ModelKey`? | 12B | Widen to `string` with runtime validation |
| Does `ModelCard.tsx` need a detail-on-hover tooltip in 12A, or is single-line `bestUseCases[0]` sufficient? | 12A | Single-line only, no tooltip |
| Should the old `ModelDropdown.tsx` be marked `@deprecated` in a comment once unused? | 12B | Yes, add a one-line comment, do not delete |

---

*End of IDEAGATE-MISSION-12-MODEL-SELECTOR-SPECIFICATION.md*
*Version 1.0.0 · This document is a design reference, not a source of truth. Claude Code may
update it during implementation if reality diverges from intent — state the decision and
reasoning when this happens.*
