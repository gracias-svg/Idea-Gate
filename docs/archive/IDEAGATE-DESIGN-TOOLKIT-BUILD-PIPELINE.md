# IDEAGATE DESIGN TOOLKIT & BUILD PIPELINE
# Zero-Cost Edition — The Permanent Design Operating Manual
Version 1.0 | July 2026

> **How to use this document.** Every entry below ends in one of four words —
> **Adopt / Defer / Reject / Investigate** — followed by a reason and a setup step.
> Tables over paragraphs. If you only read one section before your next build
> session, read **Section 8 (Implementation Pipeline)** — everything else supports it.
>
> **Constraint that governs every recommendation in this document:** preserve the
> Journey Engine, Coordinator, protected files, and Phaser. Every tool below is
> additive to the existing Next.js/React/Tailwind/XYFlow/Framer-Motion/Zustand stack,
> not a replacement for it.

---

## SECTION 1 — EXECUTIVE SUMMARY

**Where IdeaGate stands.** Architecture, engine, adapters, execution context, and
composition primitives are genuinely strong — verified through real implementation,
not asserted. The visual layer is not yet strong. Two months of iteration proved this
conclusively: prompting Claude Code with better prose descriptions of "premium"
produced marginal gains, because prose cannot transmit pixel-level construction detail.

**Why engineering is no longer the bottleneck.** TypeScript is clean, the adapter
layer correctly isolates runtime concepts from presentation, the execution store is
verified live. None of the last five audits found an architecture defect. Every one
found a craft defect: two-layer nodes, one-pixel-border panels, a global monospace
override, uniform type sizes.

**Why design intelligence is now the bottleneck.** Premium software is the product of
hundreds of small, correct construction decisions — layer count, weight contrast,
material depth — that a text specification, however careful, systematically
under-specifies. This has been proven twice in this project: the M2.5 batch executed
its spec perfectly and still read as "engineer's SVG diagram," because the spec's
words were correct and its pixels were never checked against a reference image.

**Why external tooling matters.** Claude Code is an excellent implementer and an
average designer by default — it reproduces the statistical average of its training
data unless given either (a) a fixed grammar/token system to obey, or (b) a real
reference image to match. We have (a). We have under-used (b).

**Why human-in-the-loop matters.** No visual batch in this project's history has ever
been looked at, pixel by pixel, by a person before being called "done." That is the
single largest process gap, larger than any tool gap.

**Why prompting alone is insufficient.** Prompting is the last mile, not the whole
road. Reference gathering, composition, and critique are earlier, non-prompt steps
that this project has been skipping.

---

## SECTION 2 — DESIGN PHILOSOPHY (compact)

**Identity.** Premium, calm, CLI-native AI Product Operating System. Emerald-on-near-
black. Two-voice typography (Geist Sans for human reading, JetBrains Mono for machine
data). Restraint over spectacle.

**Always true:**
- One hero element per screen, sized ≥1.7:1 against anything else on it.
- Color carries meaning only (emerald=alive/active, amber=attention, never decoration).
- Motion maps to a real state change; it stops completely when nothing is happening.
- Every surface has real construction depth — layered shadows/gradients, not a 1px border.
- Every stat pairs one large numeral with one small muted label ("so-what" included).

**Never true:**
- Glassmorphism, blur-based translucency, literal neon, RGB decoration, particle
  backgrounds, oversized glow, gradient-everywhere, mockup device frames, confetti.
- A screen with two elements of equal visual weight competing for attention.
- Motion that runs on a timer instead of a state change.
- Metrics duplicated across experiences instead of viewed as different perspectives
  on one stored value.

---

## SECTION 3 — COMPLETE DESIGN TOOLKIT

### 3.1 — Claude Code Skills

| Skill | What it is | Decision | Why | Setup | Fits |
|---|---|---|---|---|---|
| **`frontend-design`** (Anthropic, official) | A skill that constrains Claude Code away from generic/"AI slop" visual defaults before it writes code | **Adopt** | Free, official, zero risk, directly targets the exact failure mode this project has hit repeatedly | Install via Claude Code skills marketplace | Shared — install once, applies everywhere |
| Generic "UI/UX Pro Max"–style skills (50 styles incl. glassmorphism/neumorphism/brutalism) | A broad multi-style skill that lets the agent pick a visual style | **Reject as-is / Investigate constrained** | Default mode would let Claude pick glassmorphism or neumorphism — both banned for us. Only usable if hard-constrained to our own token set, which defeats its generality | If ever used, must be prompted with "IdeaGate tokens only, ignore the style library" | N/A unless constrained |

### 3.2 — MCP Servers

| MCP | What it is | Decision | Why | Setup | Fits | Free? |
|---|---|---|---|---|---|---|
| **Figma (official, remote)** | Figma's own MCP: reads design context from Figma files into Claude Code, AND (Claude-Code-exclusive) `generate_figma_design` captures **live running localhost UI into editable Figma layers** | **Adopt — highest priority in this document** | This is the one tool that changes the *medium* of design work from prompt-space to canvas-space. Solves the core two-month failure: visual judgment has never had a surface to act on | In Claude Code: `/plugin` → install `figma` → Enter to authorize → OAuth in browser. Free during beta (per Figma's own docs; will become usage-based later) | Office (capture the graph, redesign in canvas, send back), Desk, Blueprint | Yes, currently |
| **Framelink (Figma MCP alternative)** | Unofficial Figma MCP | **Reject** | CVE-2025-15061 — unauthenticated remote code execution in `fetchWithRetry`. Do not install | — | — | — |
| **shadcn MCP** | Lets Claude Code browse/install shadcn registry components directly | **Adopt** | Free, official, zero risk, speeds up chrome-building | `npx shadcn@latest mcp init --client claude` | Desk, Blueprint chrome. **Never** the orchestration graph | Yes |
| **Magic UI MCP** (`@magicuidesign/mcp`) | Exposes Magic UI's component source as callable tools | **Adopt, narrowly** | Only to pull reference source for 3 specific patterns (§3.3). Never to browse/install the marketing catalog | `npx -y @magicuidesign/mcp@latest` | Desk (StatBlock numeral animation, entrance transitions) | Yes |
| **21st.dev / Magic MCP** | Community component registry + generator, app-interface-focused (not landing-page) | **Adopt, chrome only** | Real free skill + MCP; generates shadcn+Tailwind components from prompts | `npx skills add 21st-dev/skill`, or MCP with API key (small free tier) | Desk, Blueprint chrome. **Never** the graph | Yes (limited free tier) |
| **Mobbin MCP** | Feeds 621,500 real production app screens into Claude Code's context as reference grounding | **Defer** | Genuinely the strongest reference-grounding tool that exists, but it's $10/mo and it solves "the model doesn't know what premium looks like" — Figma MCP + human review solves the same problem for free right now. Revisit if the Figma workflow plateaus | Pro plan, $10/mo | All three screens, if adopted | No ($10/mo) |

**Security note applying to all MCP servers above:** never run two Figma MCP servers
simultaneously (confuses context). Review any generated code before commit — 21st.dev
has documented prompt-injection advisories in its GitHub issues; treat its output like
any other batch, not as pre-trusted.

### 3.3 — Component Registries / Design Systems

| Source | What it is | Decision | Why | Fits |
|---|---|---|---|---|
| **shadcn/ui** | Production component + accessibility foundation (Radix underneath) | **Adopt — already foundation** | Already installed, correct base | Shared |
| **Magic UI** (full catalog) | Marketing/landing animation catalog — confetti, meteors, particles, neon gradient, retro grid, device mockups | **Reject as a dependency** | Verified catalog is ~90% landing-page spectacle. Installing it as a package risks inheriting the marketing aesthetic by accident | — |
| ↳ **Number Ticker** (pattern, not install) | Animated counting numeral | **Adopt as hand-implemented pattern** (~20 lines) | Exactly right for StatBlock hero numbers | Desk, Office vitals |
| ↳ **Blur Fade** (pattern) | Restrained fade+sharpen entrance | **Adopt as pattern** | Alternative/addition to our `reveal` primitive | Shared |
| ↳ **Noise Texture** (pattern) | SVG turbulence grain overlay | **Adopt as pattern** | This is the verified, correct answer to "material depth without glassmorphism" | Shared — apply once, globally |
| **Aceternity UI** | 3D cards, spotlight, magnetic buttons, parallax | **Reject** | Checked the actual catalog — everything is landing-page spectacle. Nothing maps to dashboard/orchestration work | — |
| **react-bits** | Text/background animation components, accessibility built-in (unlike the two above) | **Reject for now** | Same marketing-effect category (auroras, kinetic text, particles); no orchestration/dashboard fit found | — |

### 3.4 — Figma Ecosystem & Community Kits

| Resource | What it is | Decision | Why |
|---|---|---|---|
| **Figma Community — free dark SaaS dashboard kits** | Search "dark dashboard," "SaaS admin dark," "analytics dashboard dark ui" on figma.com/community | **Adopt as starting material** | A free kit gives Desk/Blueprint panels professional spacing/type/elevation to start from — faster than building composition from zero, and it's exactly the "pick a template" the user asked about |
| **Code Connect** (Figma) | Maps Figma components to real codebase components so generated code matches actual usage | **Investigate later** | Valuable once a stable component library exists in Figma; premature right now |

### 3.5 — React Flow / Graph Visualization Ecosystem

| Tool | Decision | Why |
|---|---|---|
| **@xyflow/react (current)** | **Adopt — keep** | Nodes are real React components, so our tokens/Tailwind/Framer Motion all work inside them. Correct for 6 nodes / 15 stages |
| **Cytoscape.js / Sigma.js / WebGL graph engines** | **Reject** | These win at thousands of nodes. We have six. Adopting one trades component-based styling for raw canvas rendering — a downgrade dressed as an upgrade |
| **d3-shape** | **Reject (confirmed twice)** | XYFlow's built-in `getBezierPath` with tuned curvature is sufficient. No dependency needed |
| **React Flow Pro examples** | **Defer** | Paid tier exists for advanced examples; our node/edge work is bespoke and grammar-governed regardless, so a template library adds little |

### 3.6 — Motion & Animation Systems

| Tool | Decision | Why |
|---|---|---|
| **framer-motion@12.42.2 (installed)** | **Adopt — keep, do not replace** | Same engine as the rebranded `motion` package; installing both breaks the build. Animates OKLCH natively at up to 120fps |
| **`motion` package** | **Reject (do not install)** | Identical library, different name — causes a conflict with the already-installed version |
| **Lottie** | **Defer** | For authored micro-animations; our motion is state-driven from live data, which Lottie files can't respond to |
| **Rive** | **Defer, same reason as Lottie** | Interactive state-machine animation is interesting for a future onboarding moment, not for state-driven orchestration |

### 3.7 — Typography

| Resource | Decision | Why |
|---|---|---|
| **Geist Sans + JetBrains Mono (installed)** | **Adopt — unlock it** | Already installed and correctly imported; the type scale exists only as a markdown table today. Must become real `--ig-t-*` CSS custom properties (see M3 spec) |
| Google Fonts alternatives | **Reject** | No reason to reopen a settled decision |

### 3.8 — Icons & SVG

| Resource | Decision | Why |
|---|---|---|
| **Lucide (installed)** | **Adopt — apply consistently** | Currently used ad hoc (raw unicode glyphs appear in places); enforce Lucide everywhere for a consistent icon weight/size language |
| **SVGO** | **Adopt, low priority** | Free CLI to optimize hand-authored SVGs (bracket-corner marks, custom node shapes) before they ship |

### 3.9 — Design Review / Visual QA Tools

| Tool | Decision | Why |
|---|---|---|
| **Claude Code's built-in Preview tool (screenshot/eval)** | **Adopt — already in use** | Already proven useful for structural self-verification (the fitView bug catch in M2). Zero cost, already available |
| **Browser extension: Perfect Pixel / PixelZoomer (overlay a reference image over the live page at set opacity)** | **Adopt** | Free, lets a human directly overlay `REF-node-construction.png` on the rendered `/office` and see misalignment immediately — the single best zero-cost way to do the "side-by-side" acceptance check |
| **Chromatic / Percy (automated visual regression)** | **Defer** | Both are paid at any meaningful usage tier; against the zero-cost mandate. Manual screenshot-compare is sufficient at our current scale |
| **WebAIM Contrast Checker** | **Adopt** | Free, web-based, quick pass for text-on-surface contrast ratios |

### 3.10 — Reference & Inspiration Libraries (manual browsing, no connector exists)

Godly, Awwwards, Lapa Ninja, SaaSFrame, Page Collective, One Page Love, UI Garage — all
**adopt as human browsing sources**, not as anything Claude Code connects to. No MCP
exists for these. Value: you look, you screenshot something specific, you feed that
screenshot to Claude Code directly — same discipline as the curated Design Intelligence
packet already validated in this project.

### 3.11 — Accessibility

| Tool | Decision | Why |
|---|---|---|
| **`useReducedMotion` (Framer Motion, already used)** | **Adopt — keep enforcing** | Already gates breathe/ripple/sweep animations correctly |
| **axe DevTools (browser extension)** | **Adopt** | Free, catches contrast/ARIA issues in the running app |

---

## SECTION 4 — HUMAN-IN-THE-LOOP WORKFLOW

```
1. REFERENCE GATHERING        → You or Claude Chat pull real screenshots (not descriptions)
2. REFERENCE CURATION          → Sort by evidence: is this a real product or stock/marketing
                                  art? (Proven necessary — 4 of 7 images in the last packet
                                  were marketing art, not product UI)
3. VISUAL COMPOSITION BLUEPRINT → Wireframe-level: hero size, reading order, panel weight.
                                  No color, no font, no motion yet.
   🚨 MANUAL REVIEW REQUIRED — composition must be approved before any component is built
4. TOOL SELECTION               → Which of §3's tools applies to this specific batch
5. CLAUDE CODE IMPLEMENTATION   → Build against the reference images directly (attach them)
6. RUNNING APPLICATION          → Integrated into the real route, not a permanent scratch page
   🚨 MANUAL REVIEW REQUIRED — a human opens the browser. Non-negotiable. This step has
   never happened in this project's history until this document.
7. VISUAL CRITIQUE              → Specific notes: "the hub is too small," not "make it premium"
8. ITERATION                    → Small, targeted fixes against the critique — not a rebuild
9. APPROVAL                     → Explicit "yes, this is done" before moving on
10. INTEGRATION                 → Merge into production route, delete scratch route, tag
11. REPEAT for the next screen
```

**What the human must inspect, that AI cannot judge:** does the hub actually dominate
the composition; does the empty state feel like "waiting" or "broken"; does the glow
read as alive or as decoration; would you put this screenshot in a portfolio without
apologizing for it. These are judgment calls, not correctness checks.

---

## SECTION 5 — REFERENCE INTELLIGENCE LIBRARY

### Verified from your own reference packet (Design_Intelligence_SS.pdf)

| Image | Verdict | Extract | Reject reason (if applicable) |
|---|---|---|---|
| SebaMini orchestrator (pg. 4) | **Adopt — strongest reference in the set** | Layered node construction (bracket corners, bloom, dome-gradient core, bracketed mono telemetry in negative space) | — |
| Active Flow Map (pg. 3 top) | **Adopt** | Huge numeral + tiny muted label; one accent color used only on the active path | — |
| Satellite dashboard, left panel only (pg. 6) | **Adopt** | Dense, small-caps labeled data rows, one severity color per row | (right panel's aurora light-beam is spectacle — ignore it) |
| Adobe Stock "Multi-Agent Orchestration" HUD (pg. 2) | **Reject** | — | Literal stock concept art for tech marketing; this is the exact cliché the project is trying to escape |
| Hexacore (pg. 5) | **Reject** | — | Confirmed landing-page hero animation, not app UI |
| Data UI Mega Kit (pg. 3 bottom) | **Reject** | — | Generic grid-of-unrelated-widgets, the literal "KPI dashboard" anti-pattern |
| Constellation tablet mockup (pg. 1) | **Reject** | — | Ambient illustration, not legible-at-a-glance instrument panel |
| Light CRM marketing site (pg. 7 top) | **Reject** | — | Wrong mode (light), wrong purpose (marketing page) |

### Real products — borrow principles, never pixels

| Product | Borrow | Never copy |
|---|---|---|
| **Linear** | Hierarchy, restraint, weight-contrast typography | Their specific violet/purple brand color |
| **Stripe (Dashboard/Sigma)** | Density-with-clarity, dense tables that stay scannable | Their exact chart styles |
| **Vercel** | Calm surfaces, generous negative space, execution-status clarity | Their black/white minimalism as literal identity |
| **Cursor** | AI-native interaction model — the sense that "something is thinking" | Chat-first interaction (we are graph-first) |
| **LangGraph Studio, GitHub Actions, Datadog, Grafana** | Execution-graph and pipeline-status conventions | Generic DevOps monitoring aesthetic (explicitly an anti-goal) |

---

## SECTION 6 — DESIGN SYSTEM ROADMAP

**Shared infrastructure (build once, every screen inherits):** OKLCH tokens, type
scale, motion primitives, composition primitives (`WorkspaceLayout`, `Panel`,
`StatBlock`, `HeroSlot`), the selection contract, Lucide icon usage, grain texture,
elevation system.

**Screen-specific (never shared):** the orchestration graph's node/edge components
(Office only), the lifecycle/dependency graph (Blueprint only), the artifact editor
chrome (Desk only).

**Inheritance model going forward:** Intelligence & Quality and Insights & Performance
reuse Office's `StageRail`, `MetricGrid`, `ActivityStream` unchanged — this was
designed in from Mission Control's first spec specifically so future screens don't
require a redesign, only new data wired through the same adapters.

---

## SECTION 7 — VISUAL ACCEPTANCE CRITERIA (Design Review Checklist)

**Every screen, before "done":**
- [ ] One unambiguous hero, ≥1.7:1 visual weight over anything else
- [ ] A real reading order (1st/2nd/3rd stop), not a grid
- [ ] ≥3 distinct type sizes with genuine weight contrast (not 11/12/13px)
- [ ] Every stat: big numeral + tiny label + one line of "so what"
- [ ] Surfaces show real depth (≥3 shadow layers or a gradient + grain), never a 1px border
- [ ] Removing all motion still leaves a well-composed static screen
- [ ] A stranger can identify "what's happening" within 3 seconds
- [ ] No glassmorphism, blur-translucency, neon, particles, or device mockups anywhere
- [ ] Empty state reads as "waiting," never as "broken" or blank
- [ ] A human has opened the browser and said yes — not just "TypeScript passed"

---

## SECTION 8 — IMPLEMENTATION PIPELINE (practical, in order)

```
1. Claude Chat        → writes the spec + Composition Blueprint (wireframe-level)
2. YOU                → run the dev server, open the CURRENT flat screen
3. Claude Code        → "Send this page to Figma" (generate_figma_design)
4. YOU, in Figma       → resize the hub, fix spacing, steal material from a free
                          dark-dashboard Community kit if useful — this is where your
                          visual judgment finally has a surface to act on
5. Claude Code        → "Build this Figma frame" (get_design_context) — pixel-exact
                          tokens instead of prose interpretation
6. Claude Code        → implements against Foundation primitives, screenshots itself,
                          verifies against §7's checklist mechanically where possible
7. YOU                → 🚨 MANUAL REVIEW — open the real integrated route, not a
                          scratch page. Give specific notes.
8. Claude Code        → targeted revision only, re-screenshot
9. YOU                → approve
10. Claude Code        → regression check (lifecycle run, Stop, Improve/Accept, New
                          Idea, model selector), tag, done
```

**Where each tool sits:** Figma MCP = steps 3–5. shadcn/21st.dev MCP = step 6, chrome
only. Magic UI MCP = step 6, only for Number Ticker/Blur Fade/Noise Texture patterns.
Preview/screenshot tool = steps 6 and 8. Perfect Pixel extension = step 7, overlaying
the reference image on the live render.

---

## SECTION 9 — DESIGN DIRECTOR RECOMMENDATIONS (opinionated)

1. **Install the Figma MCP this week.** Everything else in this document is secondary
   to this one change. It's free, it's a five-minute setup, and it's the first tool in
   this entire project that relocates visual judgment to where judgment actually works
   — a canvas, not a prompt.
2. **Kill the scratch-route habit as a permanent home for anything.** `/mc-scratch`
   has existed for three batches. Scratch routes are for verification, not residence.
   Integrate or delete after every batch.
3. **Stop writing "premium" in prose. Attach an image instead.** Every future batch
   prompt should include a reference image, not an adjective. This project has already
   proven prose under-specifies construction detail twice.
4. **Do not buy Mobbin yet.** The Figma workflow is the cheaper, more direct fix for
   the same underlying problem. Revisit only if that workflow plateaus.
5. **The single biggest remaining lever is human review, not another tool.** No batch
   in this project has ever been looked at by a person before being called complete.
   Fix that before adding anything else to this toolkit.

---

*IdeaGate Design Toolkit & Build Pipeline v1.0 — the permanent operating manual.*
*Tables over philosophy. Figma MCP first. A human looks at every batch. No exceptions.*
