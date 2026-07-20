# THE ZERO-COST DESIGN STACK
## How Everyone Else Gets Premium UI From AI — And Exactly What We're Missing
### Researched July 2026 | All findings sourced, none speculated

---

# PART 1 — THE ANSWER

The most credible source in the ecosystem states our situation in one sentence:

> **"Claude Code is a great front-end engineer and a blind designer."**

And it names the fix as a four-step stack, cheapest first. Stop when the output clears
your bar:

| # | Step | What it does | Cost |
|---|---|---|---|
| **1** | **`frontend-design` skill** | Kills the worst defaults. Bans generic fonts, forces a deliberate direction. *"The single highest-leverage free change."* | Free |
| **2** | **A design-system block in `CLAUDE.md`** + shadcn via MCP | *"So every screen stays consistent instead of re-guessed each time."* | Free |
| **3** | **Reference grounding** | *"For output that is actually good and not just consistent, hand it a prompt-library pattern, a captured component, or a direction generated on a design canvas."* | Free |
| **4** | **The screenshot feedback loop** | *"Write the code, screenshot the result, paste it back with specific feedback, and repeat. **The highest-leverage habit, and it costs nothing.**"* | Free |

> **"Give it guardrails, a system, a reference, and a feedback loop, and it builds UI you
> would ship. Skip those, and you get the same purple gradient as everyone else."**

## The audit: IdeaGate has implemented ZERO of the four

| Step | Our status |
|---|---|
| 1. `frontend-design` skill | ❌ **Approved weeks ago. Never installed.** |
| 2. Design system in `CLAUDE.md` | ❌ **Our design system lives in `docs/`. Claude Code only reads it when explicitly told to.** It is not auto-loaded. Every session re-guesses. |
| 3. Reference grounding | ⚠️ **Started three days ago.** The REF images are extracted but not yet in the repo. |
| 4. Screenshot feedback loop | ❌ **Claude Code screenshots itself. A human has never looked.** |

**That is the entire explanation.** Not talent, not tooling budget, not model capability.
We skipped all four steps and then spent two months writing documents about why the
output looked generic.

## The caveat that matters most for *us*

The same source warns — and this is critical, because it means step 1 alone will not
save us:

> The `frontend-design` skill *"is noticeably stronger on expressive marketing pages than
> on dense product UI... it optimizes for a memorable hero, a typographic thesis, and an
> aesthetic risk — which is exactly right for a landing page and only half the story for
> a data table, a settings screen, a **workflow builder**, or an **agent dashboard**."*
>
> *"Real app surfaces live or die on **information density, state coverage, and
> consistency**, not on a striking hero."*

**IdeaGate is an agent dashboard.** We are precisely the case the skill is weakest at.
Steps 2, 3, and 4 matter more for us than step 1 — and step 4 (the human loop) matters
most of all.

---

# PART 2 — THE BIGGEST FREE WIN WE'VE MISSED: `CLAUDE.md`

This one deserves its own section because **nobody in this project has ever mentioned
it, and it is free, takes ten minutes, and fixes a structural problem.**

**How Claude Code actually works:** `CLAUDE.md` is auto-loaded into context at the start
of every session. Skills, MCP settings, and this file travel with you across the
terminal, VS Code, desktop, and web.

**What we did instead:** put the Grammar in `docs/IDEAGATE-VISUAL-GRAMMAR.md` and hoped
each batch prompt would tell Claude Code to read it. When a prompt forgot, or when
context ran short, **Claude Code fell back on its training-data average.** That is
exactly where two-layer nodes and 1px-border panels come from.

**The fix:** a compact design-system block in `CLAUDE.md` — tokens, type scale, the four
interaction states, the anti-pattern list, and a hard rule:

```markdown
## Design System (auto-loaded — obey without being asked)
- Tokens: --ig-* only. NEVER a raw hex in a component.
- Type: Geist Sans for reading, JetBrains Mono ONLY for machine data.
  Stat = 40px/700 numeral + 10px mono label. The 4:1 ratio is mandatory.
- Elevation: 4 stacked light layers + surface gradient. NEVER a 1px border.
- Nodes: ≥5 construction layers. Coordinator ≥7. See docs/GRAMMAR.md §3.2.
- Motion: maps to a real state change. Exactly ONE alive element. Stops when idle.
- BANNED: glassmorphism, backdrop-blur, neon, particles, KPI-card grids, purple gradients.
- If the Grammar is silent on a visual decision → STOP AND ASK. Do not improvise.
```

That last line is the whole ballgame. **Silence is where the generic output comes from.**

---

# PART 3 — THE TOOL CATALOGUE (by problem solved)

## 3.1 — Design generation (the canvas layer)

| Tool | What it is | Verdict for IdeaGate |
|---|---|---|
| **Claude Design** ⭐ | **Anthropic's own design tool.** Research preview since April 17, 2026. Works on a **Pro plan** (separate usage limits from your Claude account). Generates a design system from brand assets or inspiration; wireframe flows; high-fidelity prototypes **with animations**; hands off directly to Claude Code. **Ships with pre-made brand systems — Apple, Linear, Stripe and dozens more — as starting points.** | **INVESTIGATE FIRST.** This is the highest-potential discovery in the research. Reviewers say it *"considers the UX a lot more rather than generation-first"* — unlike Lovable/Stitch/Replit. If the Linear/Stripe brand systems are usable as a base, this collapses weeks of hand-crafting tokens. |
| **Superdesign** | Skill + infinite canvas. `/superdesign` → explore variations → hand back to Claude Code as React + Tailwind. | **Adopt as a fallback** if Claude Design doesn't fit. Free to start. |
| **Figma MCP** | Official. Bidirectional — `generate_figma_design` captures live localhost UI into editable Figma layers. Free during beta. | **Adopt.** Use official only (Framelink has an RCE CVE). |
| v0 / Lovable / Bolt | Prompt-to-app generators | **Reject.** They generate *new* apps. We have a working one with a protected engine. |

## 3.2 — Claude Skills (guardrails, free, MIT)

| Skill | Stars | What it gives Claude Code |
|---|---|---|
| **`frontend-design`** (Anthropic) | 65.8k (skills repo) | Aesthetic taste. Bans generic defaults. Weakest on dense product UI — see caveat above. |
| **UI/UX Pro Max** (`nextlevelbuilder`) | **29.6k, MIT** | A **searchable design database**: 50+ UI styles, 97 colour palettes, 57 font pairings, 99 UX guidelines, 25 chart types across 9 stacks. Ships a Python CLI (`scripts/search.py`) Claude queries. | 
| **Vercel `web-design-guidelines`** (`vercel-labs/agent-skills`) | **19.5k, MIT** | **A REVIEW skill.** Audits existing UI code against 100+ rules (accessibility, performance, UX). Fetches the latest guidelines live, so they stay current. |
| **AccessLint** | 8 | Focused WCAG/contrast/colour-only auditing. |

**The one nobody would guess is the most useful for us: Vercel's `web-design-guidelines`.**
It is a *reviewer*, not a generator. It is the closest thing to an automated version of
our nine-lens quality gate (Grammar §12) — and it would have caught the colour-only status
indicators and the contrast problems automatically.

⚠️ **UI/UX Pro Max caution:** its 50-style library includes glassmorphism, neumorphism,
and brutalism — all banned for us. Usable *only* if hard-constrained to IdeaGate tokens.

## 3.3 — Theme & token generation (this is a genuine shortcut)

| Tool | Why it matters |
|---|---|
| **tweakcn** ⭐ | **9.8k stars. Free. No signup. Open source.** Visual shadcn theme editor: colours, typography, radius, spacing, shadows. **Supports OKLCH natively.** Built-in contrast checking. **AI theme generation from an image or a text prompt.** Exports CSS variables straight into `globals.css`. |
| shadcn official themes | `ui.shadcn.com/themes` — the canonical picker |
| Shadesigner / Shadcn Studio / UIColorful | Granular HSL · multi-surface preview · palette-from-image |

**The play we missed:** we hand-authored our OKLCH tokens in a markdown table and then
never implemented the type scale. **tweakcn does colours, typography, radius, spacing,
AND shadows visually, with live preview and contrast checking, and exports OKLCH.** We
could have fed it `REF-node-construction.png` and gotten a validated token set in
minutes.

## 3.4 — Templates (40–80 hours saved, per the sources)

The industry consensus is blunt: *"A shadcn dashboard template saves 40 to 80 hours of
layout, component, and theming work. Building from scratch makes sense only when your
design requirements are completely unique."*

| Free template | Stars | Why it's relevant |
|---|---|---|
| **Signal Dashboard** | — | **Built specifically for real-time monitoring: activity feeds, notification panels, status indicators.** This is *literally* our supporting-panel use case. |
| **shadcn-admin** (satnaing) | **11k** | Best free overall. Command palette, RBAC, dark mode, RTL. |
| **next-shadcn-dashboard-starter** (Kiranism) | 5.9k | Next.js 16, Tailwind v4, Zustand, kbar command palette, feature-based architecture |
| **Studio Admin** | 1.6k | Multiple theme presets; strong design-system approach |

**The honest split for IdeaGate:**
- **The orchestration graph cannot come from a template.** It is genuinely bespoke, and if it *could* be templated, using one would make IdeaGate look like everyone else. Hand-built, per the Grammar.
- **But the chrome around it — panels, activity feed, status indicators, command palette, stat cards — is ~60% of the perceived premium**, and it is *exactly* what these templates do well. **Signal Dashboard is built for our exact supporting surfaces.**

We hand-built all of it. That was the expensive choice.

## 3.5 — MCP servers

| MCP | Install | Use |
|---|---|---|
| **Figma (official)** | `/plugin` → `figma` → OAuth | Design workspace + live-UI capture |
| **shadcn** | `npx shadcn@latest mcp init --client claude` | Browse/install registry components. **Chrome only.** |
| **21st.dev** | `npx skills add 21st-dev/skill` | App-interface components. Chrome only. Review output (injection advisories). |
| **Magic UI** | `npx -y @magicuidesign/mcp@latest` | Reference source for 3 extracted patterns only |

## 3.6 — Workflow tooling

| Tool | Why |
|---|---|
| **Plan mode** — `claude --permission-mode plan` | Read-only until you approve. *"If the plan is wrong, you fix it in one sentence. If the diff is wrong, you've already paid for 300 lines of edits across five files."* **We should be using this on every batch.** |
| **`claude-code-workflows`** (shinpr) | Production recipes: PRD → UI Spec → Design Doc → work plan → implementation → review. Each phase in a *fresh agent context* so earlier steps don't bloat later ones. Directly addresses our context-exhaustion problem. |
| **Builder.io** | Figma round-tripping + cloud preview. Paid tiers; useful if the local Figma MCP setup proves painful. |

---

# PART 4 — WHAT THIS MEANS FOR IDEAGATE, HONESTLY

## What we did the hard way, and shouldn't have

| We did | Everyone else does | Cost of our choice |
|---|---|---|
| Hand-authored OKLCH tokens in a markdown table; never implemented the type scale | **tweakcn** — visual, live preview, contrast-checked, OKLCH export, free | The type scale still doesn't exist in CSS |
| Hand-built every panel, stat card, activity feed | **Fork a free template** (Signal Dashboard is built for exactly this) | 40–80 hours |
| Put the design system in `docs/` and hoped prompts would reference it | **`CLAUDE.md`** — auto-loaded every session | Claude Code fell back on training-data averages in every gap |
| Wrote prose specifications of "premium" | **Reference grounding** — *"a picture beats prose"* | Two months |
| Let Claude Code verify its own screenshots | **A human looks and gives specific feedback** | Five batches shipped in monospace |

## What genuinely must stay bespoke

The orchestration graph. No template, no registry, no MCP sells a premium multi-agent
orchestration hero — and if one did, using it would erase the only thing that makes
IdeaGate look like *itself*. **The Grammar stands. The graph is hand-built. That decision
was right.**

Everything *around* it should have been bought (for free) rather than built.

---

# PART 5 — THE REVISED STACK

```
LAYER 0  CLAUDE.md design-system block        ← auto-loaded. THE missing structural fix.
LAYER 1  frontend-design skill                 ← kills generic defaults
         Vercel web-design-guidelines skill    ← automated review against 100+ rules
LAYER 2  tweakcn                               ← generate + validate the token set visually
LAYER 3  Reference images in refs/             ← "a picture beats prose"
LAYER 4  Free template (chrome only)           ← Signal Dashboard / shadcn-admin
         Hand-built graph (per the Grammar)    ← the bespoke hero
LAYER 5  Claude Code, in PLAN MODE             ← approve intent before 300 lines of diff
LAYER 6  Screenshot → HUMAN LOOKS → specific feedback → repeat   ← the one that matters
```

---

# PART 6 — IMMEDIATE ACTIONS (all free, ~90 minutes total)

**Do these before the next line of code:**

1. **Write the `CLAUDE.md` design-system block** (10 min) — biggest structural win available.
   Include the hard rule: *"If the Grammar is silent → STOP AND ASK. Do not improvise."*
2. **Install `frontend-design` skill** (2 min) — approved weeks ago, never done.
3. **Install Vercel's `web-design-guidelines` skill** (2 min) — the automated reviewer.
4. **Open tweakcn** (15 min) — validate our OKLCH tokens visually, generate the missing
   type scale + shadow layers, export straight into `globals.css`. Run its contrast checker.
5. **Commit the REF images** into `refs/` (5 min).
6. **Investigate Claude Design** (30 min) — check whether your Pro plan has access. If its
   Linear/Stripe brand systems are usable, it may collapse weeks of work.
7. **Adopt plan mode** — `claude --permission-mode plan` on every batch from now on.
8. **Look at Signal Dashboard's source** (15 min) — steal its activity-feed and status-panel
   construction for our supporting surfaces. Do not touch the graph.

**Then Day 1 of the Execution Blueprint proceeds as written** — with four fewer
self-inflicted handicaps.

---

# PART 7 — THE ONE-LINE SUMMARY

> Everyone else starts from a template, generates their tokens visually, puts the design
> system where the agent auto-loads it, hands the agent a picture instead of a paragraph,
> and **looks at the screen after every change.**
>
> We built from scratch, hand-wrote tokens we never implemented, hid the design system in
> a folder, wrote paragraphs, and never looked.
>
> **The gap was never the model. It was the stack around it — and every layer of that
> stack is free.**

---

*Sources: superdesign.dev (the four-step stack) · Snyk (Claude Skills audit) ·
Figma Help Center (MCP) · tweakcn.com · AdminLTE (template surveys) ·
DesignerUp + Design Systems Collective (Claude Design workflows) · dev.to (Claude Code
best practices). All findings verified July 2026; none speculated.*