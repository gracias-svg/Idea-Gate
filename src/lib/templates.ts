// src/lib/templates.ts
// Mission 27 — PM template content registry.
// Pre-written starting content for each template in FolderWorkspace.
// Templates are markdown strings — rendered in the workspace doc editor.

export const TEMPLATE_CONTENT: Record<string, string> = {

  // ── Align templates ────────────────────────────────────────────────────────

  'Product Vision': `# Product Vision

## Vision Statement

*A single sentence that describes the world your product creates for users.*

---

## The Problem We Solve

Describe the core pain point this product addresses. Who feels it? How often? How severely?

## Our Differentiated Approach

What is the specific mechanism that makes our solution better than alternatives?

## The User We Serve

**Primary persona:** [Name, role, goal]

**Core job-to-be-done:** When [situation], I want to [motivation] so I can [outcome].

## Success Looks Like

In 12 months, we will know this vision is working when:

- [ ] North Star Metric: [metric] reaches [target]
- [ ] [Second measurable outcome]
- [ ] [Third measurable outcome]

## What We Will NOT Do

Explicit scope boundaries prevent drift. List the adjacent problems this product does not solve.
`,

  'OKR Framework': `# OKR Framework

## Cycle

Q[X] [Year]

---

## Objective 1

*Inspiring, directional, qualitative goal*

**Key Result 1.1:** [Metric] from [baseline] to [target] by [date]
**Key Result 1.2:** [Metric] from [baseline] to [target] by [date]
**Key Result 1.3:** [Metric] from [baseline] to [target] by [date]

**Owner:** [Team / Person]
**Why this matters:** [1-2 sentences connecting to company strategy]

---

## Objective 2

*Inspiring, directional, qualitative goal*

**Key Result 2.1:** [Metric] from [baseline] to [target] by [date]
**Key Result 2.2:** [Metric] from [baseline] to [target] by [date]

**Owner:** [Team / Person]
**Why this matters:** [1-2 sentences connecting to company strategy]

---

## Alignment Check

| OKR | Connects to company goal | Risk if missed |
|-----|--------------------------|----------------|
| O1  | [Company goal]           | [Impact]       |
| O2  | [Company goal]           | [Impact]       |
`,

  'Stakeholder Map': `# Stakeholder Map

## Purpose

Document every stakeholder with influence over or interest in this product. Updated each quarter.

---

## Power / Interest Grid

| Stakeholder | Role | Power | Interest | Engagement strategy |
|-------------|------|-------|----------|---------------------|
| [Name]      | [Title] | High | High | Collaborate — weekly sync |
| [Name]      | [Title] | High | Low  | Keep satisfied — monthly update |
| [Name]      | [Title] | Low  | High | Keep informed — changelog |
| [Name]      | [Title] | Low  | Low  | Monitor — quarterly review |

---

## Key Relationships

**Executive sponsor:** [Name] — Decision authority over [scope]

**Primary champion:** [Name] — Amplifies internally, unblocks resources

**Key skeptic:** [Name] — Concern: [specific worry]. Mitigation: [approach]

---

## Communication Plan

| Cadence | Format | Audience | Owner |
|---------|--------|----------|-------|
| Weekly  | Slack update | Engineering leads | PM |
| Monthly | Roadmap review | Leadership | PM + Eng lead |
| Quarterly | All-hands slide | Whole company | PM |
`,

  'Decision Log': `# Decision Log

## Purpose

Every significant product decision is logged here. Decisions without a log entry are not decisions — they are accidents.

---

## [Date] — [Decision Title]

**Status:** Decided / Under discussion / Superseded

**Context:** What situation forced this decision?

**Options considered:**
1. [Option A] — [trade-offs]
2. [Option B] — [trade-offs]
3. [Option C] — [trade-offs]

**Decision:** We chose [Option X] because [reasoning].

**Decider:** [Name / Committee]

**Consequences:** What does this decision make easy? What does it make harder?

**Review date:** [When should we revisit?]

---

## [Date] — [Next Decision]

*Add entries above this line, newest first.*
`,

  'Strategy Brief': `# Strategy Brief

## Situation

Describe the current market context, competitive dynamics, and internal constraints shaping this decision.

## Complication

What specific challenge or opportunity makes the status quo insufficient?

## Question

The single strategic question this brief must answer.

## Hypothesis

Our bet: if we [action], then [outcome] because [mechanism].

## Evidence

| Signal | Source | Confidence | Implication |
|--------|--------|-----------|-------------|
| [Data point] | [Source] | High/Med/Low | [What it means] |

## Recommendation

**Do:** [Specific action]
**By:** [Date]
**Owned by:** [Team/Person]

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| [Risk 1] | High/Med/Low | High/Med/Low | [Mitigation] |

## Success Criteria

We will know this strategy is working when [leading indicator] moves from [X] to [Y] within [timeframe].
`,

  // ── Plan templates ─────────────────────────────────────────────────────────

  'Roadmap': `# Product Roadmap

## Strategy Context

*One paragraph linking this roadmap to the product vision and current OKRs.*

---

## Now — [Quarter / Month]

| Initiative | Goal | DRI | Status |
|------------|------|-----|--------|
| [Initiative 1] | [Metric impact] | [Name] | In progress |
| [Initiative 2] | [Metric impact] | [Name] | Planned |

---

## Next — [Quarter / Month]

| Initiative | Goal | DRI | Confidence |
|------------|------|-----|-----------|
| [Initiative 3] | [Metric impact] | [Name] | High |
| [Initiative 4] | [Metric impact] | [Name] | Medium |

---

## Later — [Quarter+]

These are directional. Not committed. Sequencing may change based on learnings.

- [Future initiative 1]
- [Future initiative 2]
- [Future initiative 3]

---

## Not on the Roadmap

Explicitly out of scope, and why:
- [Item]: [Reason — deprioritised, wrong time, wrong team]
`,

  'Release Plan': `# Release Plan

## Release

**Name:** [Release name / version]
**Target date:** [Date]
**PM:** [Name]
**Eng lead:** [Name]

---

## Scope

### In scope
- [Feature 1]: [Brief description]
- [Feature 2]: [Brief description]

### Out of scope (deferred)
- [Feature X]: Deferred to [next release] — [reason]

---

## Launch Milestones

| Date | Milestone | Owner | Status |
|------|-----------|-------|--------|
| [Date] | Feature complete | [Eng lead] | ⬜ |
| [Date] | Internal beta | [PM] | ⬜ |
| [Date] | QA sign-off | [QA] | ⬜ |
| [Date] | Release | [PM] | ⬜ |

---

## Go-to-Market

**Announcement:** [Blog / email / in-app]
**Comms owner:** [Name]
**Target audience:** [Segment]

---

## Rollback Plan

If [critical failure condition]: [rollback procedure and owner]
`,

  'Sprint Plan': `# Sprint Plan

## Sprint [N] — [Date range]

**Team:** [Names]
**Goal:** [One sentence — what does a successful sprint look like?]

---

## Committed Items

| # | Story | Points | Owner | Definition of Done |
|---|-------|--------|-------|-------------------|
| 1 | [User story] | [N] | [Name] | [Acceptance criteria] |
| 2 | [User story] | [N] | [Name] | [Acceptance criteria] |

**Total points:** [Sum]

---

## Dependencies

| Dependency | Team | Needed by | Status |
|------------|------|-----------|--------|
| [Dependency] | [Team] | [Date] | Blocked / Clear |

---

## Risks

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| [Risk] | High/Med/Low | [Mitigation] |

---

## Retrospective Actions (from last sprint)

- [ ] [Action from last retro]
- [ ] [Action from last retro]
`,

  'RAID Log': `# RAID Log

**R — Risks · A — Assumptions · I — Issues · D — Dependencies**

Updated: [Date] | Owner: [PM name]

---

## Risks

| ID | Risk | Probability | Impact | Mitigation | Owner | Status |
|----|------|-------------|--------|-----------|-------|--------|
| R1 | [Risk description] | High/Med/Low | High/Med/Low | [Mitigation] | [Name] | Open |

---

## Assumptions

| ID | Assumption | Basis | Validation approach | Due date |
|----|-----------|-------|---------------------|---------|
| A1 | [We assume X is true] | [Source] | [How will we validate?] | [Date] |

---

## Issues

| ID | Issue | Impact | Owner | Resolution | Status |
|----|-------|--------|-------|-----------|--------|
| I1 | [Active issue] | [Impact on delivery] | [Name] | [Action] | Open |

---

## Dependencies

| ID | Dependency | Team | Required by | Status |
|----|-----------|------|------------|--------|
| D1 | [What we need] | [From whom] | [Date] | On track / At risk |
`,

  'Launch Checklist': `# Launch Checklist

## Launch: [Feature / Product name]

**Target date:** [Date]
**PM:** [Name]
**Launch type:** Soft launch / GA / Beta

---

## Pre-Launch

### Product
- [ ] All acceptance criteria verified by PM
- [ ] Edge cases tested and documented
- [ ] Error states handled gracefully
- [ ] Accessibility review complete

### Engineering
- [ ] Feature flags configured
- [ ] Monitoring and alerts set up
- [ ] Rollback procedure documented and tested
- [ ] Performance benchmarks met

### Data & Analytics
- [ ] Tracking events implemented and verified
- [ ] Dashboard created for launch metrics
- [ ] Baseline metrics captured

### Legal & Compliance
- [ ] Privacy review complete
- [ ] Terms of service updated (if needed)
- [ ] Security review passed

---

## Launch Day

- [ ] Feature enabled for [% of users / segment]
- [ ] Announcement published
- [ ] Support team briefed
- [ ] On-call engineer confirmed

---

## Post-Launch (48 hours)

- [ ] Core metrics reviewed
- [ ] User feedback collected
- [ ] Critical bugs triaged
- [ ] Decision: full rollout / hold / rollback
`,

  // ── Measure templates ──────────────────────────────────────────────────────

  'Experiment Brief': `# Experiment Brief

## Hypothesis

**We believe that** [change we will make]
**Will result in** [expected outcome]
**For** [target user segment]
**Because** [mechanism / reasoning]

---

## Metric

**Primary metric:** [Metric name] — currently [X], target [Y]
**Secondary metrics:** [What else we'll watch]
**Guardrail metrics:** [What we must not damage]

---

## Design

**Type:** A/B test / Multivariate / Holdout / Pre-post

**Control:** [What users see today]
**Treatment:** [What the experiment group sees]

**Sample size:** [Minimum detectable effect] requires [N users] for [X]% power at [α]

**Duration:** [Minimum runtime to reach significance]

---

## Risks

| Risk | Mitigation |
|------|-----------|
| [Novelty effect] | Run for minimum [X] days |
| [Segment contamination] | Randomize at [user / session / device] level |

---

## Decision Rules

- If primary metric improves by ≥ [X]%: Ship
- If guardrail metric degrades by ≥ [Y]%: Stop immediately
- If inconclusive after [N] days: [Document and archive / extend]
`,

  'Metrics Summary': `# Metrics Summary

## Period

[Week / Month / Quarter] ending [Date]

---

## North Star Metric

**[Metric name]:** [Current value]
▲ [+X%] vs last period | Target: [Y]

---

## Acquisition

| Metric | This period | Last period | Δ |
|--------|------------|------------|---|
| [New users] | [N] | [N] | [%] |
| [Signups] | [N] | [N] | [%] |

---

## Activation

| Metric | This period | Last period | Δ |
|--------|------------|------------|---|
| [Activation rate] | [%] | [%] | [%] |
| [Time to first value] | [mins] | [mins] | [%] |

---

## Retention

| Cohort | D1 | D7 | D30 |
|--------|----|----|-----|
| [Date] | [%] | [%] | [%] |

---

## Revenue

| Metric | This period | Last period | Δ |
|--------|------------|------------|---|
| [MRR / ARR] | [$] | [$] | [%] |
| [ARPU] | [$] | [$] | [%] |

---

## Key Insights

1. [What changed and why]
2. [Unexpected finding]
3. [Action item: who, what, by when]
`,

  'Funnel Analysis': `# Funnel Analysis

## Funnel: [Name / User journey]

**Period:** [Date range]
**Segment:** [All users / Cohort / Plan]

---

## Conversion Steps

| Step | Users | Conversion | Drop-off |
|------|-------|-----------|---------|
| [Step 1: Visit] | [N] | 100% | — |
| [Step 2: Signup] | [N] | [X]% | [Y]% lost here |
| [Step 3: Activate] | [N] | [X]% | [Y]% lost here |
| [Step 4: Convert] | [N] | [X]% | [Y]% lost here |

**Overall conversion:** [First step] → [Last step] = [X]%

---

## Biggest Drop-off

**Between [Step X] and [Step Y]:** [N]% of users leave.

**Hypothesis:** [Why we think this happens]

**Evidence:** [Qualitative: user interviews / session recordings] [Quantitative: event analysis]

---

## Proposed Interventions

| Intervention | Estimated lift | Effort | Priority |
|-------------|---------------|--------|---------|
| [Change 1] | [+X pp] | Small / Med / Large | High |
| [Change 2] | [+X pp] | Small / Med / Large | Medium |

---

## Next Steps

- [ ] [Action 1] — Owner: [Name] — Due: [Date]
- [ ] [Action 2] — Owner: [Name] — Due: [Date]
`,

  'Post-Launch Review': `# Post-Launch Review

## Launch Summary

**Feature / Release:** [Name]
**Launch date:** [Date]
**PM:** [Name]
**Review date:** [Date — typically 2 weeks post-launch]

---

## Did We Hit Our Goals?

| Goal | Target | Actual | Status |
|------|--------|--------|--------|
| [Primary metric] | [X] | [Y] | ✅ / ⚠️ / ❌ |
| [Secondary metric] | [X] | [Y] | ✅ / ⚠️ / ❌ |

---

## What Went Well

- [Specific thing that worked]
- [Specific thing that worked]

---

## What Didn't Go Well

- [Issue 1] — Root cause: [Why it happened]
- [Issue 2] — Root cause: [Why it happened]

---

## User Feedback

> "[Direct quote from user feedback]" — [Source: support ticket / interview / review]

**Themes:** [Pattern 1] · [Pattern 2] · [Pattern 3]

---

## Learnings

| Learning | Applies to | Action |
|---------|-----------|--------|
| [Insight] | [Future launches / process] | [Specific change we will make] |

---

## Recommendations

**Ship full rollout:** ✅ / ⚠️ Hold / ❌ Rollback

**Rationale:** [1-2 sentences]

**Next iteration:** [What we'd do differently or improve next]
`,
};

export function getTemplateContent(name: string): string {
  return TEMPLATE_CONTENT[name] ?? `# ${name}\n\n`;
}
