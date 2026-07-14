# CLAUDE DESIGN CAPABILITIES — COMPLETE INVENTORY
## Skills, Plugins, Connectors: What's Actually Available, and Where
### July 2026

> **The distinction this document is built around:** "Claude" is not one surface. What's
> installed in *this chat* (Claude Chat, the one you're talking to now) is a completely
> different toolbox from what's installed in *Claude Code* (your terminal, where IdeaGate
> actually gets built). Confusing the two is how a project ends up assuming a capability
> exists somewhere it doesn't. Every entry below states which surface it lives on.

---

## PART 1 — VERIFIED, RUNNING IN THIS CHAT RIGHT NOW

I checked the actual filesystem rather than recall this from training. These are real,
present, inspectable at `/mnt/skills/`.

### 1.1 — `frontend-design` (public skill — the one we're about to install in Claude Code)

**I read the full 55-line source.** Since we're adopting this blind in Claude Code
without ever having seen it, here is exactly what it says, because it changes how we
should prompt around it:

- **Frames the task as a design-lead persona** at a studio known for giving every
  client an identity that "could not be mistaken for anyone else's."
- **Names the three AI-design clichés explicitly**, so it can be told to avoid them:
  (1) warm cream `#F4F1EA` + serif + terracotta `#D97757` — *and it explicitly flags
  `#D97757` as "Anthropic's own Claude-interaction accent" and therefore a tell*;
  (2) near-black + single acid-green/vermilion accent; (3) broadsheet hairline-rule
  layouts. **Our emerald-on-near-black palette sits close to cliché #2.** The skill
  would not reject it outright — "where the brief pins down a visual direction, follow
  it exactly" — but this is worth knowing before we lean on the skill to save us from
  genericness; on this specific axis it won't.
- **Two-pass process:** brainstorm a token system (4–6 named hex values, 2+ type
  roles, a layout concept, one "signature" element) → **critique it against what a
  generic version would look like** → only then build.
- **"Spend your boldness in one place."** One signature element, everything else quiet.
- **Quality floor, stated explicitly:** responsive to mobile, visible keyboard focus,
  reduced motion respected.
- **"A picture is worth 1000 tokens"** — it explicitly instructs self-screenshot-critique
  where the environment supports it.
- **Its own copywriting section** — plain verbs, active voice, error messages that don't
  apologize. Relevant for empty states and error copy across Desk/Office.

**What this confirms about our earlier caveat:** the skill's examples and internal
calibration (hero-as-thesis, numbered dividers, scroll-triggered reveals) are written
for **marketing/landing pages**. Nothing in the actual text addresses dashboards, data
density, or multi-state components. The caveat from the Zero-Cost Design Stack document
holds, now confirmed against the primary source rather than a secondary description.

### 1.2 — `theme-factory` (example skill)

Ten pre-set colour/font theme pairs (Ocean Depths, Modern Minimalist, Tech Innovation,
Midnight Galaxy, etc.) applicable to slides, docs, and HTML artifacts, or generates a
custom theme on request. **Built for presentation-style artifacts, not application
UI** — no concept of component states, elevation, or interaction. Not applicable to
Mission Control or Office. Could plausibly theme a one-off internal status report.

### 1.3 — `canvas-design` (example skill)

Generates a named "visual philosophy" (an art-movement manifesto) then expresses it as
static `.png`/`.pdf` artwork — posters, art pieces. Explicitly for static visual art,
not product UI, not code. Not applicable to IdeaGate's screens.

### 1.4 — Everything else present, for completeness

`docx` / `pptx` / `xlsx` / `pdf` / `pdf-reading` / `file-reading` — document generation,
not relevant to UI work. `mcp-builder` — for building new MCP servers, not consuming
existing ones (a fit only if we ever needed a *custom* MCP server, which we don't).
`web-artifacts-builder` — builds standalone HTML/React artifacts for this chat's canvas,
not for IdeaGate's codebase. `skill-creator` — for authoring new skills.
`product-self-knowledge` — Anthropic's own product facts, not design.

### 1.5 — What this chat can do directly, right now, no install

- **`visualize` tool** — inline SVG/HTML diagrams, mockups, and interactive widgets,
  rendered in this conversation. Useful for wireframing a Composition Blueprint visually
  instead of only in prose — worth using for the next Live Orchestration blueprint.
- **`image_search`** — pull real reference photography/screenshots into the conversation.
- **Code execution + file creation** (what produced every document in this project) —
  `create_file`, `view`, `bash_tool`. Can render, crop, and inspect images, as done for
  the REF- crops.
- **Web search / web fetch** — used throughout this conversation for tool verification.

**None of this touches your repository.** Everything in Part 1 is Claude Chat only.

---

## PART 2 — CLAUDE CODE (your terminal — where IdeaGate is actually built)

This is a **separate installation** with its own skills/plugins/MCP directory. Nothing
in Part 1 is present there automatically.

### 2.1 — Skills to install (`/plugin` in Claude Code)

| Skill | Source | Status for us | Why |
|---|---|---|---|
| **`frontend-design`** | `anthropics/skills` — 65.8k★, official | **Adopt** | Kills the worst generic defaults. Confirmed weak on dense product UI (Part 1.1) — pair with the next two. |
| **`web-design-guidelines`** | `vercel-labs/agent-skills` — 19.5k★, MIT | **Adopt** | A *reviewer*, not a generator — audits code against 100+ live-fetched rules. Closest automated proxy to our 16-lens gate. |
| **UI/UX Pro Max** | `nextlevelbuilder/ui-ux-pro-max-skill` — 29.6k★, MIT | **Investigate, constrain hard** | Searchable design database (50+ styles, 97 palettes, 57 font pairs, 25 chart types). Its style library includes glassmorphism/neumorphism — **banned for us**. Only usable if explicitly told to ignore its style options and use IdeaGate tokens only. |
| **AccessLint** | `accesslint/claude-marketplace` — 8★ | **Adopt, low priority** | Small, focused WCAG/contrast auditing. |
| **`claude-code-workflows`** | `shinpr/claude-code-workflows` | **Investigate** | Structured PRD → UI Spec → Design Doc → work-plan recipes, each phase in a fresh agent context — directly addresses our context-exhaustion pattern. |

### 2.2 — MCP servers to connect

| MCP | What it does | Verdict | Setup |
|---|---|---|---|
| **Figma (official)** | Bidirectional: reads Figma files into context; **`generate_figma_design`** (Claude-Code-exclusive) captures *live running localhost UI* into editable Figma layers | **Adopt — highest priority** | `/plugin` → `figma` → OAuth. Free during beta. **Official only** — Framelink has an unauthenticated RCE (CVE-2025-15061). |
| **shadcn** | Browse/install the shadcn registry directly | **Adopt — chrome only** | `npx shadcn@latest mcp init --client claude` |
| **21st.dev / Magic** | App-interface component generator, not landing-page | **Adopt — chrome only, review output** | `npx skills add 21st-dev/skill`, or MCP with API key (small free tier). Documented prompt-injection advisories — review generated code like any other batch. |
| **Magic UI** | Exposes Magic UI's component source as tools | **Adopt narrowly** — pull 3 specific patterns only (Number Ticker, Blur Fade, Noise Texture) as reference, never install the catalogue | `npx -y @magicuidesign/mcp@latest` |
| **Mobbin** | Feeds 621k real production screens into context as reference grounding | **Defer** — $10/mo; Figma + human review solves the same problem free | — |

### 2.3 — Claude's own design *product* (separate from Claude Code entirely)

| Product | What it is | Status |
|---|---|---|
| **Claude Design** | Research preview since April 17, 2026. Requires a Pro plan; **separate usage limits from your normal Claude account.** Generates a design system from brand assets/inspiration, wireframe flows, high-fidelity animated prototypes, hands off to Claude Code. **Ships pre-made brand systems — Apple, Linear, Stripe and others — as starting points.** | **Investigate first** — check plan access. If the Linear/Stripe systems are usable as a base, this may shortcut weeks of hand-authored tokens. |

### 2.4 — Tools that are neither a skill nor an MCP, but matter

| Tool | What it solves |
|---|---|
| **tweakcn.com** | Free, 9.8k★, visual OKLCH theme editor — colour, type, radius, spacing, shadows, live preview, contrast checking, AI-theme-from-image. Not a Claude Code plugin — a website you use, then paste the exported CSS in. |
| **Plan mode** (`claude --permission-mode plan`) | Read-only until you approve the plan — catches a wrong turn before 300 lines of diff, not after |
| **Perfect Pixel / PixelZoomer** (browser extension) | Overlay a reference image over the live render at set opacity — the human review tool, not a Claude tool at all |

---

## PART 3 — WHAT DOES NOT EXIST (checked, not assumed)

Stating these plainly, because assuming a capability exists is worse than not having it:

- **No MCP server "generates premium UI" on demand.** Every one above either supplies
  *components* (shadcn, 21st.dev), *reference material* (Mobbin, Figma), or *review*
  (Vercel's skill). None supplies finished taste.
- **No skill in this chat's environment (Part 1) reaches into your repository.** Nothing
  here can install into `ui-layer/`. Everything actionable for IdeaGate is in Part 2.
- **Claude Design and Claude Code are separate products with separate access.** Having
  one does not grant the other.
- **Aceternity UI and react-bits have no MCP and are not recommended regardless** — their
  catalogues are landing-page spectacle; verified in the prior research pass.

---

## PART 4 — THE ACTION LIST, IN ORDER

1. In Claude Code: `/plugin` → install `frontend-design`, `web-design-guidelines`
2. In Claude Code: `/plugin` → install `figma` → authorize
3. `npx shadcn@latest mcp init --client claude`
4. `npx skills add 21st-dev/skill`
5. Check Claude Design access on your plan (separate product, separate limits)
6. Visit tweakcn.com — not an install, a workflow: generate/validate tokens, export CSS
7. Everything in Part 1 (this chat) requires no action — it's already running here for
   research, wireframe visualization, and document production, as it has been throughout
   this conversation

---

*Verified against the live filesystem and current web sources, July 2026.*
*Part 1 = this chat. Part 2 = your terminal. They do not share an installation.*
