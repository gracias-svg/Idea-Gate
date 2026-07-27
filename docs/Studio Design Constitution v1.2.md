# STUDIO DESIGN CONSTITUTION v1.2 — VALIDATED

---

## 1. Executive Review

**Is the current Constitution production-ready?** Conditionally. The architecture and visual tokens are sound. The philosophy is correct and distinguishes IdeaGate from competitors appropriately. What's missing is not volume — it's specificity in the areas that will generate the most implementation questions: interaction grammar, semantic objects, and the premium component strategy. Without those, Claude Code will fill gaps with averages.

**What is already excellent:** The editing philosophy ("prose-first, section-aware, AI-primary") is the right call and will age well. The save model (autosave-primary, ⌘S as confirmation) is exactly right for PM workflow — PMs cannot be interrupted by save dialogs. The two-zone toolbar model (format left, AI right) is the correct structural decision for an AI-first editor. The motion table with exact millisecond values is unusually precise and will prevent animation drift across missions. The explicit statement that AI is "invited, not intrusive" is worth treating as a constitutional principle.

**What should not change:** The typography scale (§8). The elevation system (§12). The save state machine (§7). The AI interaction evolution phases (§15). The document-first principle (§2). These are correct and constraining future contributors to them is good, not limiting.

---

## 2. Gap Analysis

**Missing concepts:**

- No Experience Principles (separate from Design Philosophy — the *emotional* contract with the user)
- No Interaction Grammar (what does Tab do? Double-click? Slash? Escape? These will be answered wrong by Claude Code otherwise)
- No Semantic Object model (PM artifacts are typed knowledge, not just text)
- No Slash Command Philosophy (the entry point for structured PM objects)
- No Document Intelligence philosophy (when does Studio become *smart* about the document's content?)
- No premium component strategy (guidance on when to integrate vs. invent)
- No personality vocabulary (how does IdeaGate *feel* vs. how does it *look*)
- No empty document state definition
- No error state philosophy
- No definition of what "collaboration" means in v1 (before real-time exists)
- No guidance on the document's relationship to the Lifecycle (artifacts have stages, sections don't — this needs explicit treatment)

**Ambiguities that will generate wrong implementation decisions:**

- §4 says "there is no edit mode toggle" but doesn't define what happens during the AI preview/diff state — the editor must go temporarily uneditable during a diff view. Undefined.
- §6 says selection highlights use `--ig-emerald` at 20% opacity but doesn't define behavior when text overlaps a green heading. Color-on-color conflict.
- §10 defines the bubble at 32px height but doesn't define what happens on narrow viewports where the bubble would clip. No responsive fallback.
- §14 says "16px icons in workspace rows" but workspace rows are 28px tall — 16px icon in a 28px row with 6px padding on each side is correct, but the sidebar's current 10-11px caption labels need an explicit note that they're different from nav labels, or the floor-value rule in §8 will be misread.
- §19 says "the formatting toolbar subscribes to `editor.on('selectionUpdate')` only" — this is incorrect. The toolbar must also update on `editor.on('transaction')` to catch programmatic changes (like ⌘B).

**Unnecessary constraints:**

- §7 autosave debounce of 3 seconds is too aggressive for long-form PM writing where users regularly pause to think. 8-10 seconds is the Notion/Linear norm and reduces server chatter dramatically. This should be loosened.
- §10 says "no text labels on bubble buttons" — this is correct for the final state but may need to be temporarily softened for a first implementation where discoverability matters. The Constitution should distinguish between "never" and "eventually."

**Long-term risks:**

- The Lifecycle-Document relationship is undefined. An artifact is produced by a lifecycle stage. Sections within an artifact are navigation, not lifecycle objects. But future Document Intelligence (confidence scoring, missing-section detection) requires understanding *what kind of artifact this is*. The Constitution doesn't establish this mapping.
- The "single editor instance per artifact" rule in §19 will conflict with the future split-view requirement (original + improved side by side). Two editor instances will be needed. The Constitution should acknowledge this.

---

## 3. Studio Design Constitution v1.2

---

### §0 — What IdeaGate Studio Is

Studio is not a markdown editor, a note-taking application, or a documentation tool. It is a **Product Operating System workspace** — the primary surface where structured product thinking becomes tracked, versioned, AI-assisted artifact output.

Every design decision in this Constitution is made in service of one user: a senior Product Manager running a product development lifecycle, under time pressure, working alongside AI agents and human collaborators. If a decision would not serve that person, it does not belong here.

---

### §1 — Design Philosophy

Premium is achieved through restraint, rhythm, and precision — never decoration, motion for its own sake, or visual complexity that doesn't carry information.

The document is the hero. Everything else is infrastructure for the document.

Calm and confident are not stylistic choices. They are product commitments. A PM using Studio during a high-stakes roadmap review must feel that the tool is completely in control, completely reliable, and completely focused on their thinking — not on its own interface.

---

### §2 — Product Principles

**Document-first.** The center column holds ~65% visual weight. Nothing competes with it.

**AI as collaborator, not widget.** AI is woven into the writing surface. It appears where work happens. It never lives only in a sidebar.

**Calm confidence.** The interface communicates trust through stillness. Elements appear when needed; they disappear completely when not.

**Honest state.** Every system state has a visible, readable, non-alarming representation. Nothing is hidden.

**Keyboard-first.** Every action has a keyboard path. Mouse is convenience, not requirement.

**Progressive depth.** The surface is simple at rest. Complexity reveals on interaction.

**Fearless recovery.** No destructive action is irreversible without confirmation. The PM should never fear the tool. Autosave, undo history, and version history (Mission 7+) exist so every decision can be revisited.

---

### §3 — Experience Principles

These define the *emotional contract* with the user — the feelings the product must reliably produce:

**Writing should feel fearless.** Every keystroke is safe. Nothing is ever permanently lost. The autosave is constant and silent.

**Reading should feel uninterrupted.** The document is the center of gravity. Navigation, AI panels, and toolbars exist to support the document, never to interrupt it.

**AI should feel invited.** AI never acts without a deliberate user gesture. Ghost-text completions appear but never execute themselves. AI suggestions are offers, not impositions.

**Recovery should always feel possible.** The undo history is deep. Version history (future) is accessible. No operation is a cliff.

**Product thinking remains the hero.** The interface is a vehicle for thought. When the interface draws attention to itself, it has failed.

**Every interaction should reduce cognitive load.** If an interaction requires the PM to remember something across panels, across states, or across sessions, the design has failed.

---

### §4 — Document Behaviour

The document is a first-class workspace object with identity (title, version, save state), history (future), and collaborators (future).

Documents are rendered from markdown files. Markdown is the canonical format. The editor is a view over the markdown, never a replacement.

When a document is open, it fills available space. It scrolls naturally. The viewport edge is not a document boundary.

**Document and Lifecycle relationship:** Every artifact belongs to exactly one lifecycle stage. The document header displays this relationship via the artifact's stage label. Section navigation within the document is orthogonal to lifecycle stages — sections are *within* an artifact, not additional lifecycle stages. Future Document Intelligence features (confidence scoring, completeness checks) derive their expectations from the artifact's stage type, not from section count or heading names.

**During AI preview/diff state:** When an improve operation is in the previewed state (showing a diff), the editor becomes temporarily non-editable regardless of the `editable` prop. This is a UI state managed by the improve flow, not a Constitution violation. The toolbar becomes read-only but remains visible. Exiting the preview (accepting or rejecting) restores editability.

---

### §5 — Editing Philosophy

**Model: prose-first, section-aware, AI-primary.**

Clicking anywhere in the document places a cursor immediately. There is no "edit mode" toggle. The document is always editable when the TipTap flag is active and no preview/diff state is shown.

Block-level editing (dragging sections, reordering blocks) is a future capability (Mission 8+). Mission 3 establishes inline prose editing only.

The insertion caret uses the default browser cursor with accent color override (see §5.1).

Tab: indents within lists. Does not create new blocks in Mission 3. In future slash-command missions, Tab will cycle through slash-command completions.

Formatting is applied via keyboard shortcuts primarily. The toolbar is a secondary affordance and must never be the only way to perform a format action.

**§5.1 — Cursor**

The cursor color is `var(--ig-emerald)`. It blinks at the browser-default rate. No custom animation.

Cursor color is applied via `.ig-tiptap-render .ProseMirror { caret-color: var(--ig-emerald); }`. This is a single CSS property — no JavaScript required.

---

### §6 — Selection Behaviour

Selected text uses the browser's native selection highlight, overridden via `::selection { background: rgba(74,222,128,0.18); }` scoped to `.ig-tiptap-render`. The 18% opacity is chosen to read clearly against dark canvas without obscuring the text color. On headings (which may be lighter), the selection background will still read because it is semi-transparent.

On selection of any text longer than 2 characters, the AI Bubble appears (§10).

On selection collapse (click elsewhere, Escape, or any document keyboard shortcut that moves the cursor), the AI Bubble dismisses.

Multi-selection across block boundaries behaves as native browser selection.

**Narrow viewport fallback:** If the AI Bubble would clip outside the document column, it is repositioned to the nearest safe edge with a maximum width of `min(340px, 100vw - 24px)`.

---

### §7 — Save Philosophy

**Autosave is primary. Manual save is confirmation.**

Changes persist automatically within **8 seconds** of the last keystroke via debounced `PUT /api/artifact`. 8 seconds (not 3) is chosen to match the Notion/Linear norm and reduce server calls during active writing.

`⌘S` triggers an immediate save. It is a confirmation gesture, not a survival mechanism.

**Save state machine:**

`clean` → no indicator  
`dirty` → amber dot (6px, `var(--ig-caution)`)  
`saving` → pulsing emerald dot (800ms opacity cycle, per §13)  
`saved` → CheckCircle2 icon (12px, emerald), fades to nothing after 2000ms  
`error` → red dot + "Save failed" caption, persistent until resolved or dismissed  

Auto-save fires on: 8-second debounce after last keystroke, tab/window blur event, artifact navigation away from current artifact.

No save modal. No save dialog. No blocking save. No save-required warning before navigation.

---

### §8 — Typography Scale

Applied inside `.ig-tiptap-render` and Studio's document surface. These values are authoritative. Implementations must not deviate.

| Element | Size | Weight | Line-height | Color token |
|---|---|---|---|---|
| Document H1 | 1.75rem / 28px | 700 | 1.25 | `--ig-text-primary` |
| Document H2 | 1.25rem / 20px | 600 | 1.30 | `--ig-text-primary` |
| Document H3 | 1.0625rem / 17px | 600 | 1.35 | `--ig-text-primary` |
| Body / paragraph | 0.9375rem / 15px | 400 | 1.75 | `--ig-text-secondary` |
| Bold inline | — | 600 | — | `--ig-text-primary` |
| Caption / meta | 0.71875rem / 11.5px | 400 | 1.4 | `--ig-text-tertiary` |
| Workspace nav label | 0.75rem / 12px | 500 | 1.4 | `--ig-text-secondary` |
| Workspace section caption | 0.6875rem / 11px | 400 | 1.4 | `--ig-text-tertiary` |
| Status bar | 0.6875rem / 11px | 400 | — | `--ig-text-tertiary` |

**Absolute minimums:** No text in Studio renders below 11px. No text renders below 3.5:1 contrast against its direct background. Caption text (11-11.5px) targets 4.5:1.

**Voice assignment:** Geist Sans for all human-readable text (titles, prose, labels, navigation). JetBrains Mono for machine-produced output only (artifact filenames, model IDs, version strings, code blocks, timestamps in the activity feed).

---

### §9 — Spacing System

All spacing values are drawn from `--ig-space-*` tokens. No arbitrary values.

| Context | Value | Token |
|---|---|---|
| Document column horizontal padding | 32px | `--ig-space-8` |
| Document paragraph gap | 16px | `--ig-space-4` |
| Heading → following paragraph gap | 8px | `--ig-space-2` |
| Paragraph → following heading gap | 24px | `--ig-space-6` |
| Formatting toolbar height | 36px | — |
| Formatting toolbar horizontal padding | 12px | `--ig-space-3` |
| AI panel section gap | 16px | `--ig-space-4` |
| Workspace row height | 28px | — |
| Workspace row horizontal padding | 10px | — |
| AI bubble padding | 4px 8px | — |
| AI bubble button gap | 4px | — |

---

### §10 — AI Bubble (Selection Toolbar)

**Appearance:** Pill shape. `border-radius: var(--ig-radius-full)`. `background: var(--ig-surface-overlay)`. `box-shadow: var(--ig-elev-overlay)`. Height: 32px. Padding: 4px 8px. Gap: 4px.

**Content:** 4 icon-only buttons (Rewrite, Expand, Clarify, Evidence). Tooltip on hover: full label + keyboard shortcut (e.g., "Rewrite ⌥R"). No text labels in the bubble itself.

**Activation threshold:** Text selection ≥ 2 characters.

**Appearance:** Opacity 0→1 + scale 0.95→1.0, 150ms ease-out. Dismiss: opacity 1→0 + scale 1.0→0.95, 80ms ease-in. `prefers-reduced-motion`: opacity-only transitions.

**Placement:** 8px above the selection midpoint, horizontally centered on the selection rectangle. Clamped to the document column edges. If insufficient space above (selection within 48px of the top of the document column), flip to 8px below the selection.

**Narrow viewport fallback:** `max-width: min(340px, 100vw - 24px)`, repositioned to nearest safe edge.

**On click:** Right panel transitions to show the selected text quoted and the chosen action pre-loaded. Bubble dismisses. Document focus is maintained.

**Not in this bubble:** Text-labeled chips, outlined borders, full-width format buttons, any operation that immediately auto-runs without confirmation.

---

### §11 — Formatting Toolbar

Sticky above the document body when `editable: true`. Hidden (`display: none`) when `editable: false` or during the AI preview/diff state.

**Styling:** `background: var(--ig-surface-raised)` · `box-shadow: var(--ig-elev-1)` · `border-bottom: 1px solid var(--ig-border-subtle)` · `height: 36px` · `padding: 0 12px` · `display: flex; align-items: center; gap: 2px`.

**Zone A (left) — Formatting group** using shadcn ToggleGroup:  
Bold (⌘B) · Italic (⌘I) · Underline (⌘U) · Strikethrough  
[divider] Inline code  
[divider] Bullet list · Ordered list  
[divider] Blockquote  

Each toggle reflects the active state at the cursor via `editor.isActive()`. Toolbar state updates on both `selectionUpdate` and `transaction` events.

**Zone B (right) — AI group:**  
A single "✦ AI" muted pill button, `margin-left: auto`. Placeholder in Mission 3. Functional in Mission 4 (opens inline AI prompt when nothing selected; shows contextual AI action count when text is selected).

**Active toggle styling:** `background: var(--ig-surface-active)`, icon color: `var(--ig-emerald)`.

---

### §12 — Elevation System

| Layer | Token | Use |
|---|---|---|
| Canvas | `--ig-canvas` | App background |
| Surface | `--ig-surface` | Workspace panels, document |
| Raised surface | `--ig-surface-raised` | Toolbar, cards, chip groups |
| Overlay | `--ig-surface-overlay` | AI bubble, dropdowns, popovers |

Elevation is expressed through background lightness progression. Shadows reinforce but do not replace the surface color distinction.

---

### §13 — Motion Language

| Interaction | Duration | Easing | Notes |
|---|---|---|---|
| AI Bubble appearance | 150ms | ease-out | scale + opacity |
| AI Bubble dismissal | 80ms | ease-in | scale + opacity |
| Formatting toolbar entrance | 120ms | ease-out | opacity only |
| Panel section expand | 120ms | ease-out | height + opacity |
| Save state transition | 200ms | ease-in-out | opacity |
| Autosave pulsing dot | 800ms | ease-in-out loop | opacity 0.4→1.0→0.4 |
| Slash command menu open | 120ms | ease-out | scale + opacity (Mission 6+) |

Idle UI is completely still. Nothing animates on a timer except the autosave pulse and text cursor. `prefers-reduced-motion` gates all transforms; opacity-only transitions are permitted.

---

### §14 — Iconography

Single set: `lucide-react`. No mixing.

Sizes: 14px in toolbars and AI bubble · 16px in workspace rows · 20px in nav rail.

Every icon-only interactive element has `aria-label`. Every interactive icon has a minimum 32px touch/click target via padding.

---

### §15 — Interaction Grammar

These definitions govern every interaction in Studio. Future missions must not introduce inconsistent behaviors.

| Gesture | Behavior |
|---|---|
| Single click (document) | Place cursor |
| Double click (word) | Select word |
| Triple click (paragraph) | Select paragraph |
| Click + drag | Text selection |
| Escape | Dismiss bubble / close menu / deselect, in that priority order |
| Enter | Confirm (in menus); new paragraph (in document) |
| Tab | Indent in list; cycle slash-command completion (Mission 6+) |
| Shift+Tab | Unindent in list |
| ⌘S | Immediate save (confirmation gesture) |
| ⌘Z / ⌘⇧Z | Undo / Redo (TipTap history) |
| ⌘B / ⌘I / ⌘U | Bold / Italic / Underline |
| ⌘K | Open Command Palette (existing) |
| / (at start of new line) | Open slash command menu (Mission 6+) |
| ⌘/ | Toggle comment (Mission 7+) |
| Hover on interactive element | Show tooltip after 400ms delay |

---

### §16 — PM Semantic Objects

IdeaGate artifacts contain structured PM thinking. Over time, certain recurring content types should become first-class *semantic objects* — not just formatted text, but typed nodes that carry PM meaning.

**Decision: Semantic objects exist. They are introduced via slash commands (Mission 6+). They serialize to markdown using the fenced-block convention established in the Architecture Blueprint (§7).**

Object types to be introduced in Mission 6+:

`/decision` · `/risk` · `/evidence` · `/assumption` · `/metric` · `/insight` · `/persona` · `/jtbd` · `/user-story`

Each object in the document:
- Carries a type, a status, and a confidence level
- Serializes as a fenced code block: ` ```ideagate:decision ` with YAML frontmatter
- Renders as a distinct visual block inside the document (Mission 6+)
- Degrades gracefully to a readable code block outside IdeaGate

**Plain text remains valid for all content.** Semantic objects are an enhancement, not a requirement. A PM writing prose is writing valid IdeaGate content.

---

### §17 — Slash Command Philosophy

The slash command is the primary entry point for inserting structured PM objects and AI-generated content. It is not a keyboard shortcut. It is an invitation to the AI to help structure product thinking.

**Philosophy:** `/` says "I want to create something structured." The menu that follows is a curated list of PM-native objects, not a generic editor command list.

**Scope of slash commands:**
- PM semantic objects (`/decision`, `/risk`, etc.) — Mission 6+
- Diagram blocks (`/diagram`, `/table`, `/roadmap`) — Mission 6+
- AI-assisted generation (`/draft-prd`, `/generate-user-stories`) — Mission 8+
- Format shortcuts (`/h1`, `/bullet`) — explicit NOT a priority; keyboard shortcuts exist for this

**The slash command menu:** Appears 8px below and aligned to the left edge of the `/` character. Fuzzy search filters as the user types. 120ms open animation (scale + opacity). Dismissed by Escape, by clicking outside, or by selecting an item.

---

### §18 — Document Intelligence

Document Intelligence is Studio's evolution from AI-assisted editing to AI-aware document management. It answers: *"How good is this artifact, and what is missing?"*

**Phase 1 (Missions 1-3):** AI refines selected text.  
**Phase 2 (Missions 4-6):** AI is contextually aware of the whole artifact — surfaces missing sections, flags unsupported claims, shows evidence coverage.  
**Phase 3 (Missions 7-9):** AI produces a structured review of the document (confidence score, completeness %, suggested additions), visible as a non-intrusive side panel.

**Constitutional principle:** Document Intelligence is ambient, not intrusive. It never interrupts writing. It presents findings when the PM is ready to look, not mid-sentence.

The lifecycle stage of the artifact governs Document Intelligence expectations. A Discovery artifact has different completeness criteria than a PRD. The intelligence layer derives its expectations from the artifact type, not from a generic document model.

---

### §19 — Workspace Intelligence

Workspace Intelligence is the set of relationships Studio makes visible between artifacts, across the lifecycle, over time.

**Existing (available now):** Dependency graph (stale propagation, already implemented). Artifact version tracking.

**Near-term (Missions 5-8):** Artifact relationship visualization (which decisions in the Discovery artifact influenced the PRD?). Traceability links between User Stories and their originating JTBD. Decision history (a log of what was changed and why).

**Long-term:** Live execution monitoring (which agents are working on what, right now). Quality trends over time.

**Constitutional principle:** Workspace Intelligence is discoverable on demand, never persistent visual clutter. The document surface is never crowded with relationship indicators — they appear via the Inspector (right panel, expandable) or the Lifecycle Rail (top).

---

### §20 — Document Surface Philosophy

Studio's document surface will evolve across three phases:

**Phase 1 (now):** Rich prose document. Editable. AI-assisted. Markdown-canonical.

**Phase 2 (Missions 6-8):** Structured document with PM semantic blocks embedded in prose. Tables, diagrams, decision records.

**Phase 3 (Missions 9+):** Workspace surface — a document that contains both prose and structured PM objects, where certain views (Roadmap View, Board View) offer alternative representations of the same underlying content without changing the markdown source.

**Constitutional principle:** Every surface evolution must preserve the markdown canonical format. No evolution may require abandoning the existing artifact files. No evolution may require a data migration.

---

### §21 — AI Interaction Philosophy

**Phase 1 (Missions 1-3):** AI refines selected text via the AI Bubble + right panel.  
**Phase 2 (Missions 4-6):** AI is contextually aware of the document. Right panel shows AI's assessment of the current artifact. AI surfaces missing sections and evidence gaps.  
**Phase 3 (Missions 7-9):** AI participates in writing via ghost-text completions. AI reviews the document as a whole and produces a structured improvement report. AI assists with semantic object creation via slash commands.

**Invariant across all phases:** AI is invited, not intrusive. Every AI action requires one deliberate user gesture. AI never auto-modifies the document without a user trigger.

The right panel is **Artifact Intelligence**, not a chat interface. It does not accumulate conversation history in the UI. Each interaction is contextual to the current selection or document state.

---

### §22 — Premium Visual Personality

The IdeaGate Studio visual personality is:

**Editorial.** Content-first. Typography-led. Whitespace is intentional, not empty.

**Premium.** High craftsmanship in every detail. Consistent radius, consistent spacing, consistent weight hierarchy. No rounding inconsistencies. No font size below the floor.

**Restrained.** Color is used for state and hierarchy, not decoration. The palette is narrow.

**Confident.** The layout does not apologize for density. Sections are clearly delineated without heavy borders.

**Alive where intelligence is working.** The one moment of visible energy is when AI is working — the pulsing save dot, the streaming response. Everything else is still.

This personality should be independently recognizable: a user who has never seen IdeaGate's homepage should look at Studio and feel that it was built by a team with strong design opinions, not assembled from generic component defaults.

---

### §23 — Premium Component Strategy

**Principle:** Reach for a proven implementation before inventing. Claude Code inventing interactions from prose produces lower quality than Claude Code adapting a well-specified reference.

**Evaluation order for any new interaction pattern:**

1. Does the existing `--ig-*` token system + an established pattern from a prior mission solve it? → Use that.
2. Does shadcn/ui or Radix UI have a primitive that handles the accessibility and keyboard contract? → Adapt it to IdeaGate tokens.
3. Does 21st.dev have a production-quality reference implementation? → Extract the interaction and motion principles; adapt to IdeaGate visual language. Never copy tokens or branding.
4. Does Mobbin/Refero/Behance have a relevant reference? → Use for composition and spacing principles only; these are inspiration sources, not code sources.
5. If none of the above: build from scratch, and add the result to the Design System as a named pattern for future reuse.

**Approved sources by type:**

- *Composable primitives:* shadcn/ui, Radix UI, React Aria
- *Positioning/floating:* Floating UI (already in the stack)
- *Motion:* Framer Motion (already in the stack)
- *Interaction references:* 21st.dev (evaluate, extract, adapt — never install whole libraries)
- *Composition and spacing references:* Mobbin, Refero, Behance, Recent.design

---

### §24 — Sidebar / Right Panel Philosophy

The right panel is Artifact Intelligence. It communicates: what the AI knows about this artifact, what it recommends, what actions are available, what the result of the last action was.

It is structured, not conversational. It does not show a chat history. Each state reflects the current moment.

Panel sections in priority order: Model indicator → Action intent → Preset chips → Scope/Extent → Primary action → (Future: AI confidence, missing sections, evidence coverage, dependencies).

The panel is fixed width. It does not resize. It does not collapse to an icon in Mission 3.

---

### §25 — Document Identity

Every open document displays:
- **Title:** First H1 parsed from artifact content (fallback: human-readable artifact name). Geist Sans, 17px, weight 600.
- **Save state indicator:** Right-aligned in the header row per §7.
- **Stage label:** The artifact's lifecycle stage (e.g., "Discovery · Stage 1") in caption size, below the title.
- *(Future: version badge, collaborator avatars, star/favorite)*

The machine filename (`0-idea-intake.md`) is demoted to caption below the title, not replacing it.

---

### §26 — Accessibility

All interactive elements are keyboard-reachable. Focus rings use `--ig-focus-ring`. No color-only information. Minimum touch target 32px. All icon-only buttons have `aria-label`. `prefers-reduced-motion` gates all transforms. `prefers-contrast: more` is a future consideration and must not be blocked by current CSS choices.

---

### §27 — Performance

One TipTap editor instance per open artifact. Destroyed and recreated on artifact switch (not persisted). The formatting toolbar updates on `selectionUpdate` and `transaction` events only — not on every keydown.

Autosave is debounced at 8 seconds, not concurrent with other saves. Two saves do not run simultaneously. If a save is in progress when another is triggered, the second is queued.

**Split-view consideration:** The future split-view (original + improved side-by-side) will require two TipTap instances. This is an anticipated architectural need. The current "one instance" rule applies to the primary reading pane. Split-view panes render read-only instances; they share no state with the editable primary instance.

---

### §28 — Theme Architecture

The document surface is independently themeable from the Studio shell via `data-document-theme` scoping. Default document theme in dark mode: inherits `--ig-canvas`. In light mode (future): `#FFFFFF` with remapped text tokens. The theme toggle is document-level, not app-global.

All `--ig-tiptap-render` CSS is already scoped. No global color change is needed to add document-level theming.

---

## 4. Validation Matrix

| Section | Why it exists | What it prevents | Future missions that rely on it |
|---|---|---|---|
| §0 What Studio Is | Prevents the product from drifting toward a generic editor | Future engineers treating it as a Notion clone | All |
| §1 Design Philosophy | Establishes quality bar | Decoration, animation drift | All |
| §2 Product Principles | Named constraints for tradeoff decisions | Features that compete with the document | All |
| §3 Experience Principles | Emotional contract that shapes micro-decisions | Anxiety-inducing interactions (e.g., data loss fears) | M3, M4, M7 |
| §4 Document Behaviour | Defines lifecycle-document relationship | Future Document Intelligence being built on wrong assumptions | M5, M6, M8 |
| §5 Editing Philosophy | Establishes what editing *is* | "Edit mode" toggles, mode-based UX | M3, M4 |
| §6 Selection Behaviour | Covers edge cases in selection/highlight | Color-on-color highlight conflicts, narrow viewport clips | M3, M4 |
| §7 Save Philosophy | Prevents save dialogs and data loss anxiety | Auto-save at wrong frequency, blocking saves | M3, M4 |
| §8 Typography Scale | Exact values prevent guessing | Sub-11px labels, inconsistent heading hierarchy | M3, M5, M6 |
| §9 Spacing System | Exact values prevent guessing | Arbitrary padding values, inconsistent density | M3, M5, M6 |
| §10 AI Bubble | Detailed spec for the highest-visibility interaction | Generic chip bars, wrong positioning, accessibility failures | M3, M4 |
| §11 Formatting Toolbar | Two-zone model establishes long-term structure | Format-only toolbar that can't integrate AI | M3, M4 |
| §12 Elevation System | Prevents shadow/background inconsistency | Mixed card styles, arbitrary shadows | All |
| §13 Motion Language | Exact timings prevent drift | Too-fast/too-slow animations, decorative motion | All |
| §14 Iconography | Single set prevents mixing | lucide + heroicons + phosphor in the same screen | All |
| §15 Interaction Grammar | The interaction contract | Inconsistent Tab/Escape/Enter behavior | M3, M6, M7 |
| §16 Semantic Objects | Establishes PM-native content types | Treating everything as unstructured prose forever | M6, M7 |
| §17 Slash Commands | Philosophy prevents scope creep | /heading commands competing with keyboard shortcuts | M6+ |
| §18 Document Intelligence | Phases prevent premature complexity | AI annotations on Mission 3 | M5, M6, M8 |
| §19 Workspace Intelligence | Prevents duplication of the dependency graph work | Rebuilding what Sprint 07 established | M5, M8 |
| §20 Surface Philosophy | Three-phase evolution path | Canvas/whiteboard mode being built before document is stable | M8+ |
| §21 AI Interaction Philosophy | Prevents AI from becoming intrusive | Auto-correction, unsolicited suggestions | M4, M7, M8 |
| §22 Visual Personality | Named personality prevents generic defaults | Components that look like generic SaaS templates | All |
| §23 Component Strategy | Evaluation order prevents low-quality invention | Claude Code guessing at interaction primitives | All |
| §24 Right Panel | Structural commitment | Chat history accumulating in the AI panel | All |
| §25 Document Identity | Defines what a document header contains | Filename-as-title, no save state visibility | M3, M5 |
| §26 Accessibility | Non-negotiable baseline | Focus rings missing, color-only states | All |
| §27 Performance | Prevents editor instance proliferation | Memory leaks, two editors fighting over same content | M3, M5 |
| §28 Theme Architecture | Establishes the scoping approach | Global CSS rewrite when light mode is added | M8+ |

---

## 5. Mission 3 Review Against v1.2

**Remains correct:** API route (B1/B2), enable editing (B3), save pipeline (B4), document identity header (B5), dirty state + autosave (B6). The overall scope is right.

**Should change:**

- Autosave debounce: change from 3s to 8s per §7
- Cursor color: add `caret-color: var(--ig-emerald)` per §5.1 — one CSS line, already implied but not specified
- Toolbar state updates: subscribe to both `selectionUpdate` AND `transaction` per §11 fix
- Selection highlight: add `::selection` override per §6
- Document title: parse first H1 from content, not filename, per §25
- Typography: values must match §8 exactly (they did in the previous prompt but should cite §8 directly)
- Toolbar Zone B: must include the AI placeholder button from Mission 3, per §11

**Should be deferred:**

The right-panel "selected text quoted" feedback (Layer 2 of the bubble interaction) → Mission 4, per the original recommendation. Not in Mission 3.

---

---

## 7. Confidence Review

**Would I approve implementation after this review?** Yes, with one condition: the Constitution file must be committed to the repository before a single line of Mission 3 code is written. Not as a convention — as a hard first commit. If Claude Code starts Mission 3 without reading the Constitution, the typography values, autosave timing, and toolbar structure will all drift.

**Remaining design risks:**

The right-panel flow (how the AI panel responds to bubble selections) is specified at the philosophy level but not at the pixel/timing level. Mission 4 will need to specify this precisely before it runs.

The interaction between autosave and the improve/diff flow is unspecified. If a PM is mid-autosave when they click "IMPROVE NOW," what happens? The save should be cancelled or completed before the improve call. This needs a sentence in Mission 3's build prompt — I've added the concurrent-save guard to B3 but it should be explicitly tested.

**Decisions intentionally left open:**

Light mode document surface exact color values. Comment thread anchor representation in markdown. Ghost-text AI completion UX. Slash command menu exact design.

**Probability the Constitution remains valid without major redesign over one year:** **82%.** The risks to that 18%: (1) the semantic object model might need to evolve faster than the mission sequence assumes if the lifecycle engine produces richer typed output; (2) a collaborative editing requirement might arrive before Mission 9 if IdeaGate gets real users who want to share; (3) the split-view interaction (original vs. improved) might need richer treatment than "read-only second TipTap instance." None of these require redesigning the Constitution — they require targeted amendments. The governance model (extend, don't contradict; name replacements explicitly) is exactly what makes amendments safe rather than accumulative debt.