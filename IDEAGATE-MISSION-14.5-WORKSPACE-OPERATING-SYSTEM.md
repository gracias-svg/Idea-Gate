# IDEAGATE-MISSION-14.5-WORKSPACE-OPERATING-SYSTEM.md
# Workspace Operating System (WOS) — Information Architecture, Project Structure & Knowledge Management
# Version 1.0 | July 2026 | Status: PLANNING / ARCHITECTURAL RECOMMENDATION
# This is a foundational architecture document. It defines the substrate every current and
# future IdeaGate capability sits on. It is not an implementation spec and writes no code.

---

## 0. HOW TO READ THIS DOCUMENT

This is the architecture that powers the entire product — the "operating system for product
work." Desk, Office, Studio, and every future workspace (Memory, Documents, Presentations,
Case Studies, Research, Portfolio) sit on top of it. It was written after independent research
of the 2026 knowledge-management landscape (Notion, Obsidian, Logseq, Capacities, Linear,
Craft, Anytype, AFFiNE) and reasons from IdeaGate's actual constraints, not from any single
product's design.

**The governing constraint (owner-stated):** only proceed with what is doable, feasible,
zero-cost, and does not break anything working now or planned. Where a richer design would add
cost, lock-in, or risk, this document chooses the simpler durable option and says so.

---

## 1. THE FOUNDING DECISION (and why)

**IdeaGate's workspace is a local-first, plain-file system — Obsidian-shaped storage with
Notion-shaped navigation. This is confirmed, not chosen lightly.**

The 2026 research splits knowledge tools into two philosophies:
- **Obsidian model:** plain Markdown/JSON files on disk, folders, zero-cost, git-versionable,
  millisecond search regardless of size, readable forever by any editor, and — critically —
  the ideal shape for AI retrieval (files are a clean corpus). Local-first "is not a slogan;
  it is an operating model" (research).
- **Notion model:** cloud database, typed blocks, per-seat pricing ($10-20/user/mo),
  collaboration, but lock-in, slower at scale, and exports that "lose database structure."

IdeaGate already writes plain files to `/workspace/{run}/artifacts/`. It is already
Obsidian-shaped. Keeping it that way means: zero cost, no engine rewrite, no lock-in, perfect
AI-retrieval substrate, and git as the free versioning + backup layer. Moving to a database
would add cost, add risk, and rewrite the working engine — a direct violation of the governing
constraint.

**What we borrow from Notion:** only its *navigation legibility* — workspace → project →
sections in a left sidebar, breadcrumbs, recent items. Notion's *storage* is rejected;
Notion's *wayfinding* is adopted, implemented over plain files.

**Verdict:** Obsidian storage + Notion navigation + git versioning. All three are free.

---

## 2. WORKSPACE PHILOSOPHY

One source of truth for every concept. Nothing is mixed; everything has one home and one owner.

| Concept | Definition | One-line rule |
|---|---|---|
| **Workspace** | The top-level container for one user's product work. One per user today. | The permanent root. Everything lives inside exactly one workspace. |
| **Project** | One product idea and everything produced for it. | A project = one idea → its lifecycle runs → its artifacts. |
| **Run** | One execution of a lifecycle (full 14-stage, or a future subset mode). | A run is immutable history. A project can have many runs. |
| **Stage** | One of the lifecycle steps within a run (0-Idea Intake … 14-Prototype). | A stage produces exactly one primary artifact. |
| **Artifact** | The structured document a stage produces. | One artifact per stage per run. Has one owner agent. |
| **Version** | An improved iteration of an artifact (Studio). | Versions are additive; the original is never overwritten. |
| **Supporting file** | A non-artifact file (uploads, references, exports) — future. | Lives beside the artifact it supports, never mixed into it. |
| **Asset** | A binary (image, PDF, diagram, prototype) — future. | Lives in a dedicated assets area, referenced, never duplicated. |
| **Metadata** | Machine data about the work (journey.json, timing, versions, relationships). | Lives separate from content, never inside the artifact prose. |
| **Memory** | Distilled decisions, reasoning, tradeoffs, approvals — future. | A derived layer, never a duplicate of artifacts. |

**The load-bearing principle:** *content and metadata never mix.* An artifact is human-readable
prose. journey.json is machine-readable state. They sit side by side, never inside one another.
This is what keeps the workspace both human-friendly and AI-friendly at once.

---

## 2A. PRODUCT WORKSPACE, NOT FILE EXPLORER (the architecture/UI separation)

**Storage Architecture ≠ User Interface.** This is a load-bearing distinction, not a detail.

Internally, IdeaGate is rich: projects, runs, artifacts, versions, assets, metadata, memory,
references. That richness is correct and necessary — it's what makes the system extensible
(§13) and AI-retrievable (§9).

Externally, the user never operates a filesystem. They operate a **Product Workspace**. They
never see "runs/2026-07-06_run-001/artifacts/07-prd.md" — they see "PRD, v3, from today's run."
The UI translates internal structure into product language: a run becomes "today's lifecycle,"
an artifact becomes "your PRD," a version becomes "the improved draft." This is the same
discipline Linear, Figma, GitHub, and Notion all share — sophisticated internals, radically
simple surface.

**Why this separation matters beyond Mission 14:** because the UI never depends on the literal
storage shape, the storage can evolve — merge layers, rename folders, reorganize metadata,
even migrate to a different backend later — **without ever requiring a UI redesign.** The UI
reads through a translation layer (the API routes already do this — `/api/data` returns
artifacts, not file paths), never the raw tree. This is what lets mature software evolve for
years without a rewrite.

**The rule, stated plainly:** the WOS (this document) governs storage. The Design System
governs presentation. A component never assumes a file path; it always consumes data the
translation layer already shaped into product concepts (stage, artifact, version, run).

---

## 3. WORKSPACE HIERARCHY

Reasoned independently (not assumed from the example). The correct hierarchy separates
*immutable history* (runs) from *the living project*, and separates *content* from *metadata*.

```
Workspace                     (one per user — the permanent root)
  └── Project                 (one product idea)
        ├── project.json      (project-level metadata: name, created, idea, status)
        ├── runs/             (immutable execution history)
        │     └── {run-id}/   (one lifecycle execution)
        │           ├── journey.json      (run metadata: timing, decisions, confidence)
        │           ├── artifacts/        (the 15 stage outputs — content)
        │           │     ├── 00-idea-intake.md
        │           │     ├── 01-discovery.md
        │           │     └── … 14-prototype-prompt.md
        │           ├── versions/         (Studio improvements, additive)
        │           │     └── 07-prd/v2.md, v3.md …
        │           └── assets/           (run-scoped binaries — future)
        ├── memory/           (project-scoped derived knowledge — future)
        │     ├── decisions.json
        │     └── reasoning.json
        └── references/       (project-scoped uploads/attachments — future, AD-11 envelope)
```

**Why this shape, not the example's flat "Stage → Artifact → Version":**
- **Runs are immutable history.** Putting artifacts directly under Project (no run layer) means
  a second run overwrites the first — you lose the ability to compare runs or show iteration.
  The `runs/{run-id}/` layer preserves every execution. This is free (folders) and matches how
  the engine already writes (`/workspace/{run-folder}/`).
- **Content and metadata are siblings, never nested.** `artifacts/` holds prose; `journey.json`
  holds state; they sit together under the run. AI retrieves either cleanly.
- **Versions are additive under the run**, never replacing the original artifact (Studio's
  version tracking already works this way).
- **memory/ and references/ are project-scoped**, reserved and empty today — the future seams.

---

## 4. FOLDER ORGANIZATION

The structure must serve today's full 14-stage run *and* future lifecycle modes, uploads,
exports, presentations, and collaboration — without restructuring. It does, because:

- **Future lifecycle modes** (Discovery-only, PRD-only, Research Sprint) are just runs with a
  subset of stage files. A discovery-only run writes `00-idea-intake.md` + `01-discovery.md`
  and stops. Same folder shape, fewer files. No restructure.
- **Future uploads/references** land in the reserved `references/` folder (project-scoped) or
  `assets/` (run-scoped). Reserved now, empty now.
- **Future exports** (PDF, PPTX, portfolio) land in a reserved `exports/` folder per project.
- **Future presentations / case studies** are new artifact *types* inside a run's `artifacts/`
  or a new sibling folder — additive, not restructuring.
- **Future collaboration** adds a `shared/` scope at workspace level later — additive.

```
Workspace/
  ├── projects/
  │     ├── {project-a}/
  │     │     ├── project.json
  │     │     ├── runs/
  │     │     ├── memory/          (reserved)
  │     │     ├── references/      (reserved — uploads/attachments)
  │     │     └── exports/         (reserved — PDF/PPTX/portfolio)
  │     └── {project-b}/
  ├── shared/                      (reserved — future collaboration)
  ├── templates/                   (reserved — future template library)
  └── .workspace/                  (workspace-level metadata, hidden)
        ├── index.json             (search/discovery index)
        └── recent.json            (recently opened items)
```

---

## 5. FILE NAMING CONVENTION

The convention must be sortable, human-readable, AI-parseable, and stable. Reasoned against the
example's deep `01.2.1.a` scheme — which is **rejected** for artifact files because it encodes
hierarchy the folder structure already provides (redundant, brittle, high cognitive load).
Instead:

**Artifacts (one per stage):** `{NN}-{kebab-stage-name}.md`
```
00-idea-intake.md   01-discovery.md   02-problem-definition.md   07-prd.md
```
- Two-digit zero-padded stage number → natural sort, stable ordering.
- Kebab-case stage name → human-readable, URL-safe, AI-parseable.
- No deeper numbering — the folder + stage number already give full position.

**Versions:** `versions/{NN}-{stage}/v{N}.md`
```
versions/07-prd/v2.md   versions/07-prd/v3.md
```

**Metadata:** fixed, predictable names — `journey.json`, `project.json`, `index.json`.

**Assets (future):** `assets/{type}/{descriptive-name}.{ext}` — e.g.
`assets/diagrams/system-architecture.svg`.

**Why granular `01.2.1.a` is rejected:** deep dotted IDs are for systems where files are flat
and hierarchy must be encoded in the name. IdeaGate has real folders — hierarchy lives in the
path, not the filename. Encoding it twice creates drift (rename a stage → every sub-ID breaks).
The two-digit-plus-name convention is simpler, sorts correctly, and never drifts.

---

## 6. PM LIFECYCLE MAPPING

Every agent output maps to exactly one stage file. Nothing an agent produces is homeless.

| # | Stage | File | Owner agent |
|---|---|---|---|
| 0 | Idea Intake | 00-idea-intake.md | CO |
| 1 | Discovery | 01-discovery.md | RE |
| 2 | Problem Definition | 02-problem-definition.md | PS |
| 3 | Solution Design | 03-solution-design.md | PS |
| 4 | MVP Hypothesis | 04-mvp-hypothesis.md | PS |
| 5 | Validation | 05-validation.md | RE |
| 6 | Prioritisation | 06-prioritisation.md | PS |
| 7 | PRD | 07-prd.md | PS |
| 8 | UX Design | 08-ux-design.md | UX |
| 9 | Usability Planning | 09-usability-planning.md | UX |
| 10 | Architecture | 10-architecture.md | AR |
| 11 | Backlog & Release | 11-backlog-release.md | AR |
| 12 | Implementation Planning | 12-implementation-planning.md | AR |
| 13 | QA & Readiness | 13-qa-readiness.md | QA |
| 14 | Prototype Prompt | 14-prototype-prompt.md | CO |

**Future stages/modes** slot into the same scheme: a future "Competitive Analysis" stage is a
new numbered file in a run; a future mode simply produces a subset. The mapping never
restructures — it extends.

---

## 7. METADATA STRATEGY

**Rule: metadata lives beside content, never inside it, in predictable JSON files.** No database
(cost, lock-in). JSON on disk is free, git-versionable, and AI-readable.

| File | Scope | Contains |
|---|---|---|
| `.workspace/index.json` | Workspace | Search index: every artifact's path, stage, project, keywords |
| `.workspace/recent.json` | Workspace | Recently opened items for fast navigation |
| `project.json` | Project | name, idea, created, status, run count |
| `runs/{id}/journey.json` | Run | timing, per-stage decisions, confidence, tokens, cost, finish_reason (already exists) |
| `runs/{id}/artifacts/*.md` | Artifact | content only — no metadata mixed in |
| `memory/*.json` | Project | derived decisions/reasoning (future) |

**Why not frontmatter-in-the-file (the Obsidian default)?** Considered and rejected as the
*primary* store: mixing YAML frontmatter into artifact prose complicates AI retrieval of the
prose and risks the agent's output format. IdeaGate keeps prose pure and metadata in sibling
JSON. (A light frontmatter block for human-facing tags could be added later as a convenience,
but journey.json remains the source of truth.)

**Why not a database?** Cost, lock-in, engine rewrite, and — per research — database exports
"lose structure." Plain JSON is durable, free, and inspectable months later.

---

## 8. SUPPORTING FILES & ASSETS

Where every file type lives, so nothing is homeless and nothing is mixed:

| Type | Home | Rule |
|---|---|---|
| .md (artifacts) | `runs/{id}/artifacts/` | Content only |
| .json (metadata) | beside its scope | Never inside .md |
| .svg / .png (diagrams, images) | `runs/{id}/assets/` or `assets/` (future) | Referenced, never duplicated |
| .pdf / .docx / .pptx (uploads, exports) | `references/` (in) or `exports/` (out) | Separate in vs out |
| .csv (data) | `assets/data/` | Referenced |
| logs | `runs/{id}/` (e.g. `_last-run.log`) | Run-scoped, prefixed `_` |
| generated prototypes | `runs/{id}/prototype/` | Run-scoped |
| temporary / cache | `.workspace/cache/` (hidden, gitignored) | Never committed, never shown in UI |

**Principle:** inputs (`references/`) and outputs (`exports/`) are never mixed; content
(`artifacts/`) and binaries (`assets/`) are never mixed; temporary files are hidden and
gitignored so they never clutter the workspace or the git history.

---

## 9. CONTEXT PRESERVATION

How context survives across sessions, runs, and future AI retrieval — without duplication.

- **Session continuity:** `.workspace/recent.json` + the current project/run pointer restore
  where the user was.
- **Run continuity:** each run is immutable; journey.json preserves the full decision trail.
  A future Continue/Resume (P-NEW-5) reads the last run's journey.json to know where it stalled.
- **Document continuity:** versions/ preserve every iteration; the original is never lost.
- **Decision continuity:** journey.json (and future memory/decisions.json) preserve *why* each
  stage advanced or flagged — the coordinator's reasoning (EP-8 / CT-3 from the Design System).
- **AI retrieval:** the `.workspace/index.json` is what a future AI reads to find relevant
  artifacts — it indexes paths and keywords, never duplicates content. The AI is *pointed at*
  files, never fed copies. This is the Obsidian/Atlas retrieval model: cite the source file,
  don't duplicate it.

**Never duplicated:** an artifact exists in exactly one place. Memory and index *reference* it
by path. This is the single most important rule for keeping the workspace clean and AI-honest —
duplication is how knowledge systems rot.

---

## 10. MEMORY ARCHITECTURE (reserved — future)

Memory is a *derived* layer, never a second copy of the artifacts. It preserves what the raw
files don't: distilled decisions, tradeoffs, rejected ideas, approvals, critiques.

```
project/memory/          (reserved — built in a future mission, not Mission 14/14.5)
  ├── decisions.json      distilled key decisions + the reasoning behind them
  ├── tradeoffs.json      what was chosen over what, and why
  ├── rejected.json       ideas considered and dropped (so they're not re-litigated)
  └── approvals.json      owner approvals, review comments, design critiques
```

**Philosophy (from research — progressive summarization / BASB "distill" stage):** memory is
the 20-word summary that carries the cognitive load, pointing back to the full artifact. It is
built by distillation, never by copying. When a future AI needs context, it reads memory first
(cheap, distilled), then follows references to the full artifact only if needed. This is how the
system stays fast and context-rich as projects accumulate — without cost and without clutter.

**Not built now.** Reserved as `memory/`. The seam exists; the feature is a later mission.

---

## 11. NAVIGATION UX (the visual workspace)

Notion-legibility over Obsidian-storage. The left rail (from Mission 14's Global Shell) gains a
workspace tree when inside a project. Calm, fast, progressive-disclosure — consistent with the
Design System.

**Behaviour:**
- Left panel shows the project tree: Project → Runs → (latest run expanded) → stage artifacts.
- Folders collapse/expand; files open in the content area.
- Breadcrumbs update (Workspace / Project A / Run 3 / 07-PRD).
- Recently opened updates (`recent.json`).
- Search (Cmd+K "Search Existing Artifacts") queries `index.json` — millisecond, real data.
- Metadata (journey.json) is *not* shown as a raw file in the tree by default — it powers the
  UI (node chain, run insight) but stays out of the user's way (progressive disclosure).
- Keyboard navigation throughout (arrow keys, Enter, Cmd+K), matching the command palette.

**Cognitive load:** the tree shows the *current* run expanded and older runs collapsed. The
user sees today's work, not a wall of history. Depth is one click away, never forced.

---

## 12. INFORMATION DENSITY

Premium ≠ empty (research is explicit: the strongest products present a lot without
overwhelming). Applied to the workspace:
- **Default view:** current project, current run, stage artifacts. ~7 items visible — within
  working-memory limits.
- **Hidden by default:** metadata files, older runs, cache, reserved-empty folders.
- **Progressive disclosure:** older runs, versions, and assets expand on demand.
- **The tree is calm; the content area is where density lives** (an artifact is dense with real
  PM content). Navigation stays light so the content can be rich.

---

## 11A. CONTINUITY — REMEMBER, NEVER RESET (session and UI state)

2026's defining premium-product trend is continuity-as-memory (confirmed independently —
Microsoft's 2026 "Work IQ" framework is built on Data/Memory/Interference specifically so a
system "can recognize relationships between your projects, pick up where you left off").
IdeaGate must feel the same: returning to the product should feel like never having left.

This is distinct from the Memory Architecture (§10, which preserves *decisions and reasoning*).
This is **UI-state continuity** — remembering how the user was working, not what was decided.

| Remembered | Where it lives | Scope |
|---|---|---|
| Active workspace/project | `.workspace/recent.json` | Workspace |
| Open/expanded folders in the nav tree | client-side (localStorage-equivalent, not files) | Session |
| Selected artifact | `.workspace/recent.json` | Workspace |
| Active filters (Cmd+K recency, artifact filters) | client-side | Session |
| Scroll position per view | client-side | Session |
| Studio context (which artifact, which version being compared) | client-side + `versions/` | Session |
| Office layout (Analytics vs Agent Activity tab) | client-side | Session |

**Rule:** durable facts (what exists, what was decided) live in files (§7, §10). Transient
*where-the-user-was* state lives client-side and is cheap, fast, and never risks corrupting
the workspace tree. Both together produce "I never left" continuity without conflating
storage with session state — consistent with the Architecture ≠ UI separation (§2A).

**Not built in Mission 14/14.5.** Recorded here so the shell (NavRail tree, Studio, Office tab
state) is designed knowing this is coming, and so no session-state hack gets written into the
storage layer later.

---

## 11B. SEARCH AS A PLATFORM CAPABILITY (not merely a Cmd+K shortcut)

`.workspace/index.json` (§7) is not a Cmd+K implementation detail — it is the **universal
search substrate** for the entire platform. Cmd+K's "Search Existing Artifacts" (Mission 14
Runbook Checkpoint 1C) is the *first* reader of this index, not the only one. Because the
index is file-based and rebuildable from the tree, it is designed from day one to extend to:
artifacts, decisions (once memory/ exists), runs, uploaded references (once references/
exists), versions, and eventually annotations/comments. Building the index this way now means
richer search later is a new reader over the same substrate — never a redesign.

---

## 14A. WORKSPACE EXPERIENCE PRINCIPLES (behavioural, not visual)

These extend the Design System's Confidence & Trust rules (CT-1..CT-7) and Platform Invariants
into workspace-specific behaviour. They are testable, not decorative.

1. **Never lose user context.** Navigating away and back restores exactly where the user was.
2. **Never lose user work.** Versions are additive (§15); nothing is silently overwritten.
3. **Prefer continuity over reset.** Default behaviour restores state; resets are explicit user
   actions (e.g. Mission 13's "New Idea"), never automatic or accidental.
4. **Minimise cognitive load.** The tree shows today's work; history and metadata stay one
   click away (§12).
5. **Hide complexity until required.** Metadata, reserved folders, and cache are never shown
   in the default view.
6. **Remember intent.** The system reflects what the user was doing (§11A), not just what
   exists.
7. **Surface the most important information first.** Current run, current artifact, current
   confidence — always above the fold.
8. **Real work is always more valuable than decorative UI.** Every workspace element traces to
   a real artifact, run, or decision (shared with Design System EP-3).

---

## 13. FUTURE EXTENSIBILITY (extension points, not features)

Every future capability plugs into a reserved seam. None is built in Mission 14/14.5.

| Future capability | Reserved seam | Restructure needed? |
|---|---|---|
| Lifecycle modes (Discovery-only, etc.) | runs write a subset of stage files | No |
| Uploads / attachments / references | `project/references/` (AD-11 envelope) | No |
| Exports (PDF, PPTX, portfolio) | `project/exports/` | No |
| Presentation / Case Study builders | new artifact types in a run | No |
| Memory layer | `project/memory/` | No |
| Knowledge graph | derived from `index.json` references | No |
| Templates library | `Workspace/templates/` | No |
| Collaboration / team | `Workspace/shared/` scope | No |
| Universal search | `.workspace/index.json` already the substrate | No |
| Plugins / integrations | additive readers over the file tree | No |

**The extensibility guarantee:** because storage is plain files in a predictable tree, *every*
future capability is either (a) a new file type in an existing folder, (b) a new reserved
folder, or (c) a new reader over the same files. None requires migrating or restructuring what
exists. This is the core payoff of the Obsidian-shaped decision.

---

## 14. WORKSPACE PRINCIPLES (permanent invariants)

These join the platform invariants and never change without an ADR:

1. **Single source of truth.** Every artifact exists in exactly one place.
2. **No duplication.** Memory and index reference by path; they never copy content.
3. **Content and metadata never mix.** Prose in .md, state in .json, side by side.
4. **Runs are immutable.** History is preserved; new runs never overwrite old ones.
5. **Versions are additive.** The original artifact is never destroyed.
6. **Plain files, local-first, zero-cost.** No database, no lock-in, git for versioning/backup.
7. **Every artifact has one owner agent.** Traceable to who produced it.
8. **Everything is searchable and referenceable** via the index — without duplication.
9. **Folders reflect the user's mental model** (project → run → stage), not the engine's.
10. **The workspace evolves without restructuring.** New capability plugs into a seam.
11. **AI retrieves by reference, never by copy.** The corpus stays clean and honest.
12. **Temporary files are hidden and gitignored.** They never clutter the tree or history.

---

## 15. VERSION STRATEGY

- **Artifact versions:** additive under `versions/{stage}/v{N}.md`. Studio already does this.
- **Run versions:** each run is a version of the whole project's thinking — immutable, compared
  side by side in a future mission.
- **Git as the backbone:** the entire workspace is git-tracked. Every change is a commit; every
  release a tag. This is the free, durable version layer the research praises Obsidian for.
- **No version data in prose:** version numbers live in metadata and filenames, never inside the
  artifact text.

---

## 16. MIGRATION STRATEGY

The current engine writes `/workspace/{run-folder}/artifacts/`. Moving to the WOS shape is
*additive and non-breaking*:

- **Phase A (zero-risk):** the WOS tree is a superset of today's layout. Wrap existing runs
  under `projects/{project}/runs/` — a folder move, scriptable, reversible.
- **Phase B:** add `project.json` and `.workspace/index.json` (new metadata, nothing removed).
- **Phase C:** reserved folders (`memory/`, `references/`, `exports/`, `shared/`, `templates/`)
  are created empty. No behaviour change.
- **The engine's write path** changes only its base directory (one config value), not its
  logic. journey.json and artifact writing are untouched.

**Critical:** migration is a *later, scoped mission* (not Mission 14). Mission 14 is UI only.
The WOS is documented now so Mission 14's shell is built knowing this tree is coming — the
NavRail workspace tree and Cmd+K search are designed against this structure so they don't need
rework when the WOS lands.

---

## 17. RISKS & TRADE-OFFS

| Risk / Trade-off | Assessment | Decision |
|---|---|---|
| Plain files vs database | Files lose relational queries but gain zero-cost, no-lock-in, AI-clean corpus | Files — the research is decisive for this use case |
| No frontmatter in artifacts | Slightly less self-describing files | Accept — journey.json is the metadata SoT; prose stays pure |
| Deep numbering rejected | Less granular filename hierarchy | Accept — folders provide hierarchy; names stay stable |
| index.json can drift from files | If a file is added outside the app, index misses it | Mitigate — index is rebuildable from the tree at any time (files are truth) |
| Migration touches the engine's base dir | One config change | Low risk — scoped, later mission, reversible |
| Many runs accumulate | Tree could grow large | Mitigate — collapse old runs, progressive disclosure, index-backed search |

**Overall risk:** low. The design is a superset of what exists, all additive, all reversible,
all zero-cost.

---

## 18. VISUAL REPRESENTATIONS (multiple views)

### View A — Folder Hierarchy (how it's stored on disk)
```
Workspace/
├── projects/
│   ├── smart-parking/
│   │   ├── project.json
│   │   ├── runs/
│   │   │   └── 2026-07-06_run-001/
│   │   │       ├── journey.json
│   │   │       ├── artifacts/
│   │   │       │   ├── 00-idea-intake.md
│   │   │       │   ├── 01-discovery.md
│   │   │       │   ├── 07-prd.md
│   │   │       │   └── 14-prototype-prompt.md
│   │   │       ├── versions/
│   │   │       │   └── 07-prd/
│   │   │       │       ├── v2.md
│   │   │       │       └── v3.md
│   │   │       └── assets/            (reserved)
│   │   ├── memory/                    (reserved)
│   │   ├── references/                (reserved)
│   │   └── exports/                   (reserved)
│   └── coffee-loyalty/
├── shared/                            (reserved — collaboration)
├── templates/                         (reserved — template library)
└── .workspace/                        (hidden)
    ├── index.json
    ├── recent.json
    └── cache/                         (gitignored)
```

### View B — Navigation Hierarchy (what the user sees in the left rail)
```
▼ Smart Parking                        (project — expanded)
  ▼ Run 001 · Jul 6 · complete         (latest run — expanded)
    ○ Idea Intake
    ○ Discovery
    ○ Problem Definition
    ● PRD              v3              (active, has versions)
    ○ Architecture
    ○ … (15 stages)
  ▶ Run 000 · Jul 5 · stopped          (older run — collapsed)
▶ Coffee Loyalty                       (project — collapsed)
```
Metadata (journey.json) is not shown as a file — it powers the node chain and run insight.

### View C — Lifecycle Hierarchy (the PM mental model)
```
Idea → Discovery → Problem → Solution → MVP → Validation → Prioritisation
     → PRD → UX → Usability → Architecture → Backlog → Implementation
     → QA → Prototype
        (each stage = one artifact file, one owner agent, one place)
```

### View D — Metadata Hierarchy (state, separate from content)
```
.workspace/index.json          (workspace: search index over all artifacts)
.workspace/recent.json         (workspace: recent items)
  project.json                 (project: name, idea, status, run count)
    runs/{id}/journey.json     (run: timing, decisions, confidence, tokens, cost)
      artifacts/*.md           (content only — no metadata inside)
```

### View E — Memory Hierarchy (derived knowledge, reserved/future)
```
project/memory/                (derived — never a copy of artifacts)
  ├── decisions.json           key decisions + reasoning (distilled)
  ├── tradeoffs.json           chosen-over-what, and why
  ├── rejected.json            considered and dropped
  └── approvals.json           owner approvals, review comments
        ↑ each entry REFERENCES an artifact by path — never duplicates it
```

---

## 19. FINAL RECOMMENDATION

Adopt the **Obsidian-storage + Notion-navigation + git-versioning** Workspace Operating System
described above:

- **Storage:** plain Markdown artifacts + sibling JSON metadata, in a predictable
  Workspace → projects → project → runs → run → artifacts tree. Zero-cost, local-first,
  AI-clean, git-versioned, readable forever.
- **Navigation:** Notion-legible left-rail tree + breadcrumbs + recent + Cmd+K search over a
  rebuildable index — calm, fast, progressive-disclosure.
- **Metadata:** separate JSON, never mixed into prose; journey.json remains the run SoT.
- **Memory:** a reserved derived layer that references, never duplicates — built later.
- **Extensibility:** every future capability (modes, uploads, exports, presentations, memory,
  collaboration, templates, search, plugins) plugs into a reserved seam with no restructure.

**Feasibility check against the governing constraint:** doable (it's a superset of today's
layout), workable (folders + JSON, no new tech), feasible (migration is one config change +
folder moves), zero-cost (no database, git for versioning), and non-breaking (additive,
reversible, engine logic untouched). It strengthens the roadmap rather than threatening it: the
Mission 14 shell is designed against this tree, so nothing built now needs rework when the WOS
migration lands in a later scoped mission.

**What is NOT done now:** no code, no migration, no memory layer, no reserved-folder features.
Mission 14 remains UI-only. This document is the architecture the shell is built to fit, and the
blueprint a future WOS mission executes.

---

*Workspace Operating System v1.0 | July 2026*
*Grounded in independent 2026 knowledge-management research; reasoned from IdeaGate's actual*
*constraints. A foundational architecture recommendation — not an implementation spec.*
