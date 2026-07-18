# Studio (`/improve`) — UI Evidence Package

**Source file:** `src/app/improve/page.tsx` (759 lines, single client component `ImprovePage`)
**Generated:** Phase 2B Step 1 — Evidence Collection (read-only)
**Status:** Documents the CURRENT implementation only. No target-state comparison, no critique, no recommendations.

---

## Part 1 — Screen Purpose

Based only on code (component name `ImprovePage`, header label `REFINE`, subtitle `ARTIFACT IMPROVEMENT ENGINE`, internal comment "Artifact Refinement + Builder Package Export"):

- **Primary responsibility:** Let a user select a lifecycle artifact (one of up to 15 stage `.md` files), submit a natural-language "improvement intent" to an LLM (via `POST /api/improve`, action `preview`), review a generated `original` vs `improved` diff, and either `accept` (action `accept`, persists to disk) or discard the result.
- **Secondary responsibility:** After an artifact is improved and accepted, generate a "builder package" (`POST /api/build`) formatted for one of 10 external AI coding tools (Claude, ChatGPT, Gemini, Lovable, Bolt, v0, Replit, Cursor, Windsurf, OpenHands), and copy/deep-link that package out to the chosen tool.
- **Tertiary capabilities present in code:** uploading reference documents (PDF/DOCX/TXT/MD/CSV, via `POST /api/improve/extract`) to inject as extra context into the improve call; downloading raw or improved markdown as a `.md` file; a compact inline SVG "artifact graph" (15-node linear stage strip) with tabs to switch to an "event feed" or "reasoning chain" view.
- **Expected user workflow**, as stated verbatim in the component's own empty-state copy (lines 528–537):
  1. Click a stage node in the graph, or select an artifact from the left rail.
  2. Choose a model (model selection itself is driven by `GlobalStore` settings, shared with `TopBar`'s selector — no in-page model picker is rendered).
  3. Describe an improvement intent (free text) or click a preset chip.
  4. Click "◈ IMPROVE NOW" — triggers a real LLM call.
  5. Accept → artifact is saved to disk and downstream artifacts are marked stale.
  6. Optionally generate a build package to send to a builder platform.

---

## Part 2 — Structural Survey

**Overall layout:** Fixed-viewport, non-scrolling shell (`height:'100vh', overflow:'hidden'`) with three horizontal bands stacked in a column flex container:
1. Header bar (52px, fixed height)
2. Graph/Events/Reasoning tab bar (variable height, contains a 100px-tall inline panel)
3. Main content row (`flex:1`, fills remaining height)

**Main content row** is itself a 3-column flex layout:
- Left sidebar — fixed `width:210px`, artifact list, scrollable (`overflowY:'auto'`)
- Centre content — `flex:1`, the artifact reader / diff viewer, scrollable per-pane
- Right panel — fixed `width:270px`, the intent/model/extent/scope/build controls, scrollable

**Reading order (visual top-to-bottom, left-to-right):** Header (REFINE branding, session stats, stale-artifact warning) → tab bar (Graph/Events/Reasoning) → left artifact rail → centre reader/diff pane → right control panel (intent textarea → active model badge → presets → reference docs → extent → scope → Improve button → build destination) → (conditionally) bottom-of-right-panel accept/discard + usage + reasoning block.

**Imported UI primitives:** None from a component library. No shadcn/ui, no Radix, no lucide-react icons, no framer-motion, no @xyflow/react are imported in this file. All icons are literal Unicode glyphs (`◈ ▶ ⟳ △ ✓ ↓ ▲ ⚠`) embedded directly in JSX strings.

**Custom components defined in this file:**
- `ir()` — inline-markdown token renderer (bold/code spans), function returning `React.ReactNode[]`
- `MD` — full block-level markdown renderer (headings `#`–`####`, `---` rules, blockquotes, bullet/numbered lists, table-row passthrough, paragraphs), built from manual `.split('\n')` + regex line matching, not a markdown library
- No other sub-components are extracted; the rest of the UI is inlined directly in the `ImprovePage` function body as JSX blocks (header, tab bar, sidebar, centre pane, right panel are all inline, not separate components)

**Imported external modules (non-UI):**
- `useGlobalStore`, `getModelMeta`, `isModelFree` from `@/lib/GlobalStore`
- `parseContent`, `parseContentDetailed` from `@/lib/parseContent`
- `useRuntime`, `getTransitiveDownstream` from `@/lib/RuntimeContext`
- `MODEL_REGISTRY` from `@/lib/model-registry`

**Component hierarchy (React composition):** Flat — `ImprovePage` is the only component besides the internal `MD`/`ir` helpers. No nested custom child components; no component tree beyond native DOM elements (`div`, `button`, `textarea`, `svg`, `input`).

**State management:**
- Local `useState` hooks (18 total) inside `ImprovePage`: `artifacts`, `stage`, `selected`, `rawContent`, `parseWarn`, `fileLoading`, `intent`, `extent`, `scope`, `docs`, `uplLoading`, `uplError`, `uiState`, `result`, `error`, `view`, `showBuild`, `buildTarget`, `buildLoading`, `buildPackage`, `copied`, `panel` (component-local state; not exhaustive count but all are `React.useState`)
- One `useRef` (`uploadRef`, for the hidden file input)
- Cross-cutting/shared state consumed via two external providers:
  - `useGlobalStore()` — supplies `settings.defaultModel`, `settings.openRouterApiKey`, `settings.customModelId`, `settings.tokenBudgetPerCall`, plus `updateSettings()`. Model selection (`modelKey`) is derived entirely from this store, not local state.
  - `useRuntime()` — supplies `runtime.state` (`improvementCount`, `staleArtifacts`, `sessionTokens`, `sessionCost`, `events`, `reasoningChain`, `artifactVersions`), plus methods `emitEvent`, `markImproved`, `isStale`, `getVersion`, `clearStale`, and the module-level helper `getTransitiveDownstream`.

**Data flow (high level):**
- On mount: `GET /api/data` → populates `artifacts` (file list) and `stage` (current lifecycle stage).
- On `selected` change: `GET /api/improve?file=...` → raw content run through `parseContentDetailed()` → `rawContent` + optional `parseWarn`.
- On "Improve" click: `POST /api/improve` with action `preview`, `artifactName`, `intent`, `extent`, `scope`, `model` (key), `apiKey`, `customModelId`, `maxTokens`, and optional `extractedDocuments` (from uploaded docs) → response becomes `result` (contains `original`, `improved`, `reasoning`, `impactWarnings`, token/cost usage) → `uiState` transitions `idle → loading → previewed`.
- On "Accept" click: `POST /api/improve` with action `accept`, `artifactName`, `content: result.improved` → on success, calls `runtime.markImproved(...)` (propagates stale-state to downstream artifacts in the shared runtime store) → `uiState → accepted`.
- On file upload: `POST /api/improve/extract` (multipart form) per file → appends to `docs` state, later sent as `extractedDocuments` in the improve call.
- On "Generate build package": `POST /api/build` → `buildPackage` (a per-builder-id map of `{content, deepLink, chars, emphasis}`).
- Copy/open-builder actions use `navigator.clipboard.writeText` and `window.open`.

**Typography usage:** No design-token type scale referenced. Every text element sets `fontSize` as a literal pixel value inline (values observed: `8px, 8.5px, 9px, 9.5px, 10px, 11px, 12px, 13px, 14px, 17px, 22px, 24px`). `fontFamily` is applied via a locally-defined `MONO` object (`"'JetBrains Mono','Fira Code',monospace"`) spread into most `style` props; the `MD` component defines its own separate identical `M` constant for the same purpose. No use of the app-wide `--ig-t-*` CSS custom properties.

**Spacing approach:** All spacing (`padding`, `margin`, `gap`) is literal pixel values inline, no spacing-token variables referenced (e.g. `padding:'0 16px'`, `gap:'10px'`, `margin:'6px 12px 10px'`).

**Surface/material approach:** Flat single-layer backgrounds via inline `backgroundColor` hex literals (e.g. `#020c06`, `#040b14`, `#0d1117`, `#0a1509`, `#0a0f1e`). No box-shadow / elevation layering is used anywhere in this file. Borders are 1px solid hex or hex-with-alpha-suffix literals (e.g. `#0a1a2e`, `#4ade8033`, `#818cf822`).

**Design token usage:** Exactly one CSS custom property reference exists in the file: `backgroundColor:'var(--ig-canvas)'` on the root container (line 317). Every other color value in the file (borders, text, backgrounds, per-model accent colors, per-builder accent colors, status colors) is a literal hex or hex+alpha string, not a `var(--...)` token.

**Responsive behaviour:** None. All widths are fixed pixel values (`210px` left rail, `270px` right panel) or percentage/flex fill. No media queries, no breakpoint logic, no container queries present in this file.

---

## Part 3 — Component Hierarchy (rendered UI tree)

```
Studio (/improve)
├── Header Bar
│   ├── Brand block ("REFINE" / "ARTIFACT IMPROVEMENT ENGINE")
│   ├── Session stats (improved count · stale count · session tokens/cost)
│   ├── Active model summary text (provider · cost · use-case)
│   └── Action buttons (Clear stale · Download current .md)
├── Tab Bar (Graph / Events / Reasoning)
│   ├── Tab buttons (◈ ARTIFACT GRAPH · ▶ EVENT FEED · ⟳ REASONING CHAIN)
│   ├── Right-aligned meta counter text
│   └── Active tab panel (one of):
│       ├── Artifact Graph — inline SVG, 15-node linear stage strip with connecting lines
│       ├── Event Feed — scrollable list of runtime events (or empty-state copy)
│       └── Reasoning Chain — scrollable list of past improvement reasoning entries (or empty-state with suggested-start chips)
├── Main Row
│   ├── Left Sidebar (Artifacts)
│   │   ├── "ARTIFACTS · N" label
│   │   ├── Suggested Start block (shown only when nothing selected)
│   │   ├── Artifact list (one row per artifact: status dot, name, version badge, stale marker)
│   │   └── Downstream Impact block (shown only when an artifact with downstream deps is selected)
│   ├── Centre Content
│   │   ├── View toggle bar (ORIGINAL / SPLIT / IMPROVED) — shown only when a result exists
│   │   ├── Empty state ("Select an artifact…" + Runtime Workflow steps box) — shown when nothing selected
│   │   ├── Loading state ("Loading artifact…")
│   │   ├── Artifact reader (rendered Markdown via `MD`) — shown when idle with content loaded
│   │   ├── Generating state ("GENERATING…" + active model + doc-injection note)
│   │   ├── Accepted state (✓ confirmation + stats + "Improve again" / "Generate build package" buttons)
│   │   ├── Split/Original/Improved diff panes (rendered Markdown, one or two columns)
│   │   └── Inline error banner (⚠, shown when `error` is set)
│   └── Right Panel (Controls)
│       ├── Improvement Intent textarea
│       ├── Active model badge
│       ├── Presets (11 chip buttons)
│       ├── Reference Docs (uploaded-doc list + upload dropzone + error text)
│       ├── Extent selector (LIGHT / MEDIUM / STRONG)
│       ├── Scope selector (BLOCK / STAGE / PROJECT)
│       ├── "◈ IMPROVE NOW" button + model/cost caption
│       ├── Build Destination (collapsible)
│       │   ├── Builder grid (10 buttons: Claude, ChatGPT, Gemini, Lovable, Bolt, v0, Replit, Cursor, Windsurf, OpenHands)
│       │   └── Generate/Copy/Open-builder controls (state-dependent)
│       └── Accept/Discard block (shown only when a preview result exists)
│           ├── ACCEPT / DISCARD buttons
│           ├── Usage grid (Input / Output / Cost)
│           ├── PM Reasoning block
│           └── Impact warnings list (▲, if any)
```

---

## Part 4 — Technical Observations (facts only)

**Inline styles:** 100% of visual styling in this file is via the `style={{...}}` JSX prop. No CSS Modules, no styled-components, no Tailwind utility classes are used on any element in this file. One `<style>{...}` template-literal block (lines 318–323) injects global-scoped raw CSS (`::-webkit-scrollbar`, `button:disabled`, a `@keyframes pulse` rule) directly into the page.

**Hardcoded colors:** The vast majority of colors are literal hex strings (3/6-digit, some with 2-digit alpha suffixes) written directly in `style` objects. Examples of the range observed: `#020c06`, `#0a1a2e`, `#94a3b8`, `#4ade80`, `#818cf8`, `#f59e0b`, `#f87171`, `#334155`, `#1e293b`, `#0d1117`, `#040b14`, `#22c55e`, `#38bdf8`, `#fde047`, `#f472b6`, `#4ade8033`, `#818cf822`. Per-model colors are hardcoded in the `MODELS` array (line 24–39); per-builder colors are hardcoded in the `BUILDERS` array (line 78–89). Only one token reference exists in the whole file: `var(--ig-canvas)` (line 317).

**Hardcoded spacing:** All `padding`, `margin`, `gap`, and dimension values are literal pixel strings inline (e.g. `'7px 12px'`, `'0 16px'`, `'210px'`, `'270px'`, `'52px'`). No spacing scale or token is referenced.

**Hardcoded typography:** All `fontSize` and `fontWeight` values are literal numbers/strings inline, as enumerated in Part 2. `fontFamily` is set via the locally-scoped `MONO` constant (and a duplicate `M` constant inside `MD`), not via a shared/imported typography token or component.

**Duplicated UI patterns observed:**
- The "section label" pattern (`fontSize:'9px'|'10px', color:'#2a5a30', letterSpacing:'0.1em'|'0.12em', fontWeight:700`) is repeated as an inline literal at each of: ARTIFACTS, SUGGESTED START, DOWNSTREAM, IMPROVEMENT INTENT, PRESETS, REFERENCE DOCS, EXTENT, SCOPE, BUILD DESTINATION, USAGE, PM REASONING — each instance restates the same style object rather than referencing a shared constant or component.
- The pill/chip button pattern (small padding, `outline: '1px solid <color><alpha>'`, conditional `backgroundColor`/`color` based on an `active` boolean) recurs independently in: Extent buttons, Scope buttons, Preset buttons, Builder grid buttons, view-toggle buttons (ORIGINAL/SPLIT/IMPROVED), tab-bar buttons — each is a separate inline `<button style={{...}}>` with its own literal style object; a shared `B` base style constant (line 314) is spread into most of these but the color/background/outline logic is re-implemented per instance.
- `MONO` (page-level) and `M` (inside `MD`) are two separately declared, identically-valued `fontFamily` constants.
- Empty-state copy blocks (graph/events/reasoning tabs, centre-pane "select an artifact") each hand-roll their own container/text styling rather than sharing one empty-state pattern.

**Reusable components actually present:** `MD` (markdown renderer) and its `ir()` helper are the only two functions in the file reused across multiple call sites (artifact reader, split/original/improved diff panes).

**Missing design-system primitives (factual absence, not a recommendation):** No imports from `@/components/ui/*`, no shadcn/ui `Button`/`Card`/`Badge`/`Tabs` components, no icon library, no shared typography or spacing token consumption, no shared elevation/surface component — all of Part 2's "Design token usage" and "Surface/material approach" findings apply.

**Custom implementations:** The Markdown renderer (`MD`/`ir`) is a hand-written line-by-line parser (not a library such as `react-markdown`). The inline SVG artifact graph (lines 380–404) is a hand-built 15-node linear layout computed via `viewBox="0 0 700 80"` and manual `x = i*(700/15)+(700/30)` positioning, not the app's `@xyflow/react`-based graph primitive used elsewhere in the codebase.

**Token usage summary:** 1 of an estimated 300+ color/spacing/typography declarations in this file references a CSS custom property (`var(--ig-canvas)`, root background only). All other declarations are literal values.

---

## Part 5 — Screenshot

Captured via the existing project screenshot pipeline (Playwright, 1440×900 viewport) as part of the prior W0-C2 verification batch, against the current committed state of this file (no changes to `improve/page.tsx` since that capture — confirmed via `git status`).

Saved to: `docs/ui-audit/studio/02-screenshot.png`

---

## Part 6 — Evidence Summary

Studio is a single 759-line client component (`ImprovePage` in `src/app/improve/page.tsx`) with no sub-component decomposition beyond one internal Markdown-rendering helper (`MD`/`ir`). The screen is a fixed-viewport, three-column workspace (210px artifact rail · flexible reader/diff pane · 270px control panel) stacked under a header and a tabbed graph/events/reasoning strip. All layout is hand-written CSS-in-JS via inline `style` objects — there is no Tailwind usage, no shadcn/ui or other component-library usage, and no icon library (icons are literal Unicode glyphs).

Architecturally, the page is a thin orchestration layer over four external data sources: local `useState` for UI/form state (selection, intent text, extent/scope, uploaded docs, build package, view mode), `GlobalStore` for the persisted model selection and API settings, `RuntimeContext` for cross-page shared state (stale tracking, session cost/tokens, event log, reasoning history, downstream-dependency lookups), and four REST endpoints (`/api/data`, `/api/improve`, `/api/improve/extract`, `/api/build`) for artifact listing, content loading, LLM-driven improvement (preview/accept), document extraction, and build-package generation.

Visually, the implementation is 100% literal values: every color, spacing, and font-size is a hardcoded inline string, with the single exception of the root container's `backgroundColor: var(--ig-canvas)`. Recurring visual patterns (section labels, pill/chip buttons, empty states) are each re-implemented per call site rather than factored into shared components, though a common base style object (`B`) is spread into most buttons and a shared `MONO` font constant is reused across most (but not all — `MD` duplicates it as `M`) text elements.

---

✓ Evidence package created
✓ Screenshot created
✓ File locations:
  - `docs/ui-audit/studio/01-evidence.md`
  - `docs/ui-audit/studio/02-screenshot.png`
