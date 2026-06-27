// src/lib/pmLifecycle.ts
//
// ════════════════════════════════════════════════════════════════════════════
// ARCHITECTURAL CONTRACT — READ BEFORE MODIFYING
// ════════════════════════════════════════════════════════════════════════════
//
// THIS FILE IS A PRESENTATION LAYER ONLY.
//
// It defines how existing V3 execution artifacts are grouped, labeled, and
// displayed in the PM Lifecycle view. It has no authority over:
//
//   • Execution order    → governed by /src/core/lifecycle-engine.js
//   • Artifact creation  → governed by /src/core/coordinator-v2.js
//   • Dependency graph   → governed by ARTIFACT_DEPS in RuntimeContext.tsx
//   • Stale propagation  → governed by RuntimeContext.tsx
//   • Agent orchestration→ governed by /src/agents-v2/
//   • Builder packages   → governed by /src/app/api/build/route.ts
//   • Workspace files    → governed by the V3 CLI execution system
//
// The V3 lifecycle engine in /src/core/ is the SOLE EXECUTION AUTHORITY.
//
// PM_LIFECYCLE_MAP expresses THEMATIC GROUPING for portfolio presentation.
// It does NOT express when artifacts are generated or what depends on what.
//
// IMPORT RULES — enforced by code review:
//   ✓ May be imported in: src/app/desk/, src/app/improve/, src/app/office/,
//                          src/components/
//   ✗ Must NOT be imported in: src/app/api/*, src/lib/RuntimeContext.tsx,
//                               src/lib/DataProvider.tsx, src/lib/fileAdapter.ts
//                               or any other server-side / execution-path file.
//
// All functions in this file are PURE — they take data in and return data out.
// They make no API calls, write no state, and read nothing from the filesystem.
//
// ════════════════════════════════════════════════════════════════════════════

// ── Stage status type ─────────────────────────────────────────────────────
// Three states only. No 'blocked'. Status is based purely on artifact
// existence — never on execution order or workflow dependency logic.
// The V3 execution system determines what runs when; this layer only
// observes what has been produced.
export type StageStatus = 'complete' | 'partial' | 'pending';

// ── PM Lifecycle stage definition ─────────────────────────────────────────
export interface PMLifecycleStage {
  /** 0-based internal index — used as key in PM_LIFECYCLE_MAP */
  index: number;

  /** 0-based display number shown to users (0–8), matching index */
  number: number;

  /** Full stage name used in all UI labels */
  name: string;

  /** Abbreviated name for constrained spaces (progress bars, chips) */
  shortName: string;

  /** One-sentence description of what this PM stage represents */
  description: string;

  /** Primary deliverable or decision produced by this stage */
  keyOutput: string;

  /** V3 artifact filenames that belong to this PM stage.
   *  These are DISPLAY mappings — they do not alter RuntimeContext.ARTIFACT_DEPS. */
  artifactFiles: string[];

  /** The artifact that best represents this stage when only one can be shown */
  primaryArtifact: string;

  /** V3 agent IDs (CO, PS, RE, UX, AR, QA) associated with this stage's artifacts */
  agentIds: string[];

  /** Human-readable agent label for UI display */
  agentLabel: string;

  /** Hex color for stage indicators, badges, and progress nodes */
  color: string;

  /** PM frameworks applied at this stage — for interview and intelligence panel */
  frameworks: string[];

  /** What this stage demonstrates to a PM hiring manager */
  interviewSignal: string;

  /** Detailed PM purpose — shown in the PM Intelligence OVERVIEW panel */
  pmPurpose: string;

  /** Optional note explaining why V3 artifact generation order differs from
   *  the PM narrative order. Shown as a contextual note in the Desk UI.
   *  Not shown if undefined — only stages where reordering needs explanation. */
  presentationNote?: string;
}

// ── Post-lifecycle deliverable definition ─────────────────────────────────
export interface PMDeliverable {
  /** Stable identifier — used as React key and localStorage key */
  id: string;

  /** Display name */
  name: string;

  /** What this deliverable contains and why it matters */
  description: string;

  /** Whether this deliverable can be generated now or is a future feature */
  available: boolean;

  /** true = coming in a future release; shows a "coming soon" badge */
  future: boolean;

  /** For available deliverables: the builder/export formats it supports */
  formats?: string[];
}

// ── Progress summary ───────────────────────────────────────────────────────
export interface LifecycleProgressSummary {
  /** Count of PM stages where all artifacts are present */
  complete: number;

  /** Count of PM stages where some but not all artifacts are present */
  partial: number;

  /** Count of PM stages where no artifacts are present */
  pending: number;

  /** Total number of PM Lifecycle stages — always 9 */
  total: number;

  /** 0–100 integer percentage based on complete / total */
  percent: number;

  /** Status of each individual stage, in index order */
  stages: StageStatus[];
}

// ════════════════════════════════════════════════════════════════════════════
// PM_LIFECYCLE_STAGES — the 9 approved PM Lifecycle stages (0–8)
//
// Approved sequence:
//   0. Idea Intake · 1. Opportunity & Market Intelligence · 2. User & Problem
//   Validation · 3. Strategic Bet & North Star · 4. Solution Definition & MVP
//   Scope · 5. AI/Technical Architecture · 6. Prototype & Learning Loop ·
//   7. PRD: Validated Specification · 8. Ship Strategy
//
// Order here is the PM NARRATIVE order, not the V3 execution order.
// See presentationNote on individual stages where these differ.
// ════════════════════════════════════════════════════════════════════════════
export const PM_LIFECYCLE_STAGES: PMLifecycleStage[] = [

  // ── Stage 0 ─────────────────────────────────────────────────────────────
  {
    index:           0,
    number:          0,
    name:            'Idea Intake',
    shortName:       'Idea Intake',
    description:     'Frame the raw idea, set initial scope boundaries, and validate the governing hypothesis through the North Star Metric lens.',
    keyOutput:       'Scoped idea framing + NSM-aligned outcome hypothesis',
    artifactFiles:   ['0-idea-intake.md'],
    primaryArtifact: '0-idea-intake.md',
    agentIds:        ['CO'],
    agentLabel:      'Coordinator (CO)',
    color:           '#16a34a',
    frameworks:      ['NSM Lens', 'Jobs to Be Done (JTBD)', 'Outcome Hypothesis Validation'],
    interviewSignal: 'Idea clarity, scope discipline, testability framing before any research investment is committed',
    pmPurpose:
      'Establishes the initial scope boundary and the hypothesis that governs every subsequent lifecycle decision. ' +
      '0-idea-intake.md frames the raw idea through the North Star Metric lens — naming the primary and secondary ' +
      'jobs the idea serves for both the end user and the company, and stating the outcome hypothesis with its ' +
      'underlying assumption and risk explicitly. This is the root artifact: nothing downstream is generated ' +
      'until the idea is scoped and the hypothesis it rests on is named.',
  },

  // ── Stage 1 ─────────────────────────────────────────────────────────────
  {
    index:           1,
    number:          1,
    name:            'Opportunity & Market Intelligence',
    shortName:       'Opportunity',
    description:     'Establish strategic market context — is this opportunity worth pursuing?',
    keyOutput:       'Market landscape assessment + opportunity hypothesis',
    artifactFiles:   ['1-discovery.md'],
    primaryArtifact: '1-discovery.md',
    agentIds:        ['PS'],
    agentLabel:      'Product Strategist (PS)',
    color:           '#22c55e',
    frameworks:      ['PESTEL', "Porter's Five Forces", 'First Principles'],
    interviewSignal: 'Market awareness, opportunity identification, signal-to-insight translation, strategic framing before problem commitment',
    pmPurpose:
      '1-discovery.md applies PESTEL and Porter\'s Five Forces to establish whether the market is strategically ' +
      'attractive before any problem validation investment begins, building directly on the scope and hypothesis ' +
      'named in Idea Intake. This artifact answers: is this worth pursuing, and what is the competitive and ' +
      'macro-environmental context we are operating in?',
  },

  // ── Stage 2 ─────────────────────────────────────────────────────────────
  {
    index:           2,
    number:          2,
    name:            'User & Problem Validation',
    shortName:       'Problem',
    description:     'Validate that the problem is real, painful, frequent, and worth solving for a specific user.',
    keyOutput:       'Validated problem statement with user evidence and JTBD insight',
    artifactFiles:   ['2-problem-definition.md'],
    primaryArtifact: '2-problem-definition.md',
    agentIds:        ['RE'],
    agentLabel:      'Researcher (RE)',
    color:           '#34d399',
    frameworks:      ['JTBD Outcome-Driven Innovation', 'Empathy Mapping', '5W1H', 'Problem Framing', 'Behavioral Segmentation'],
    interviewSignal: 'User-centricity, problem articulation depth, evidence-based validation, Jobs-to-be-Done fluency',
    pmPurpose:
      'Validates the problem through user research, behavioral analysis, and Jobs-to-be-Done mapping. ' +
      'This stage answers three questions with evidence: Who specifically has this problem? ' +
      'How painful is it and how frequently does it occur? ' +
      'What job are users hiring a product to do that existing solutions fail at? ' +
      'Strong problem definition is the most defensible foundation for every downstream product decision.',
  },

  // ── Stage 3 ─────────────────────────────────────────────────────────────
  {
    index:           3,
    number:          3,
    name:            'Strategic Bet & North Star',
    shortName:       'Strategy',
    description:     'Define success before defining the solution. Establish the north star metric and strategic priorities.',
    keyOutput:       'North Star metric + validated strategic priority order',
    artifactFiles:   ['5-validation.md', '6-prioritization.md'],
    primaryArtifact: '5-validation.md',
    agentIds:        ['QA', 'CO'],
    agentLabel:      'QA Engineer · Coordinator',
    color:           '#818cf8',
    frameworks:      ['AARRR', 'North Star Framework', 'RICE', 'MoSCoW', 'Kano', 'Value vs Effort'],
    interviewSignal: 'Success-first thinking, strategic prioritization before solution commitment, metric design, go/no-go discipline',
    pmPurpose:
      '5-validation.md makes the success bar explicit before building begins — AARRR metrics, experiment design, ' +
      'and evidence-based go/no-go criteria. 6-prioritization.md applies RICE, MoSCoW, and Kano simultaneously ' +
      'to resolve competing PM priorities into a defensible ordered backlog. ' +
      'Presenting these artifacts as Stage 3 signals the critical PM practice of defining what winning looks like ' +
      'before committing to a solution — a senior PM signal that junior portfolios typically miss.',
    presentationNote:
      '5-validation.md and 6-prioritization.md were generated as V3 execution stages 5 and 6, after Solution Design ' +
      'and MVP Hypothesis artifacts. They are presented here as Stage 3 because defining success criteria and ' +
      'strategic priorities is a strategic-phase activity in the PM narrative — it must precede solution commitment, ' +
      'even when execution systems generate these documents in a different order for quality-grounding reasons.',
  },

  // ── Stage 4 ─────────────────────────────────────────────────────────────
  {
    index:           4,
    number:          4,
    name:            'Solution Definition & MVP Scope',
    shortName:       'Solution',
    description:     'Translate validated insight into a precisely scoped, user-centred solution concept.',
    keyOutput:       'Solution concept + MVP scope + UX specification',
    artifactFiles:   ['3-solution-design.md', '4-mvp-hypothesis.md', '8-ux-design.md', '9-usability-planning.md'],
    primaryArtifact: '4-mvp-hypothesis.md',
    agentIds:        ['UX', 'AR', 'RE'],
    agentLabel:      'UX Designer · Architect · Researcher',
    color:           '#38bdf8',
    frameworks:      ['OST (Opportunity Solution Tree)', 'MVP Test Cards', 'Design Thinking', 'UX Heuristics', 'Cognitive Load Reduction', 'WCAG'],
    interviewSignal: 'Scope discipline, user-centred design, MVP thinking, tradeoff reasoning, explicit exclusions',
    pmPurpose:
      'Four artifacts define the solution space with PM rigor. 3-solution-design.md applies the Opportunity Solution Tree ' +
      'to generate and evaluate solution approaches. 4-mvp-hypothesis.md compresses scope to the minimum viable test ' +
      'of the riskiest assumption. 8-ux-design.md specifies the information architecture, user flows, and interaction ' +
      'logic that deliver the solution. 9-usability-planning.md defines the testing protocol to validate UX quality ' +
      'before prototype build. Together these answer: what exactly are we building, why this and not that, and what does good look like?',
    presentationNote:
      '8-ux-design.md and 9-usability-planning.md were generated as V3 stages 8 and 9, after the PRD, because ' +
      'V3\'s execution grounding logic uses the PRD to anchor UX specification. They are presented here within ' +
      'Stage 4 (Solution Definition) because UX design and usability planning are conceptually solution-phase activities ' +
      'in the PM narrative. The PRD in Stage 7 is understood as the evidence-backed codification of what these ' +
      'solution artifacts established, informed by the prototype in Stage 6.',
  },

  // ── Stage 5 ─────────────────────────────────────────────────────────────
  {
    index:           5,
    number:          5,
    name:            'AI / Technical Architecture',
    shortName:       'Architecture',
    description:     'Define the technical system that makes the solution buildable. For AI products, architecture is product strategy.',
    keyOutput:       'System architecture + AI orchestration design + technical constraints',
    artifactFiles:   ['10-architecture.md'],
    primaryArtifact: '10-architecture.md',
    agentIds:        ['AR'],
    agentLabel:      'Architect (AR)',
    color:           '#fb923c',
    frameworks:      ['System Design', 'API Contract Design', 'Microservices Patterns', 'AI Orchestration', 'Data Model Design'],
    interviewSignal: 'Technical fluency, architecture-as-product-decision, AI system understanding, constraint identification before prototype commitment',
    pmPurpose:
      'Architecture precedes prototype because the architecture defines the capability boundary — ' +
      'you cannot scope a prototype for an AI product without understanding what the model can do, ' +
      'what the latency constraints are, and where the edge cases in AI behavior appear. ' +
      'For IdeaGate specifically, this artifact documents the multi-agent coordinator-worker system, ' +
      'the 14-stage lifecycle enforcement, and the technical decisions that make the execution pipeline possible. ' +
      'A PM who can explain and defend these decisions demonstrates the technical fluency increasingly required ' +
      'for AI-native product roles.',
  },

  // ── Stage 6 ─────────────────────────────────────────────────────────────
  {
    index:           6,
    number:          6,
    name:            'Prototype & Learning Loop',
    shortName:       'Prototype',
    description:     'Build the smallest thing that tests the riskiest assumption. Validate before specifying.',
    keyOutput:       'Builder-ready prototype prompt for Lovable, Bolt, v0, Cursor, or Replit',
    artifactFiles:   ['14-prototype-prompt.md'],
    primaryArtifact: '14-prototype-prompt.md',
    agentIds:        ['AR'],
    agentLabel:      'Architect (AR)',
    color:           '#f59e0b',
    frameworks:      ['Hypothesis-Driven Prototyping', 'Assumption Testing', 'Build-Measure-Learn'],
    interviewSignal: 'Bias to action, hypothesis-driven building, validation-first mindset, builder-tool fluency, prototype-before-PRD discipline',
    pmPurpose:
      'The prototype comes before the PRD because the PRD should be evidence-backed, not speculative. ' +
      '14-prototype-prompt.md packages the complete lifecycle intelligence — market context, validated problem, ' +
      'strategic bet, solution scope, and technical architecture — into a single builder-ready context. ' +
      'The output is a prompt that an engineering team or a builder tool (Lovable, Bolt, v0) can execute ' +
      'immediately, with enough specification to build a working prototype that tests the core assumptions ' +
      'defined in Stage 3. What the prototype teaches informs the PRD in Stage 7.',
    presentationNote:
      '14-prototype-prompt.md is generated as the final V3 execution stage (14), after the PRD and all delivery artifacts. ' +
      'It is presented here as Stage 6 — before the PRD — because the approved PM Lifecycle reflects a ' +
      'prototype-before-PRD approach: the prototype validates assumptions, and the PRD documents the validated, ' +
      'evidence-backed specification. The V3 execution system generates the PRD early to ground subsequent artifacts; ' +
      'the PM narrative reorders these for portfolio presentation to reflect modern AI product development practice.',
  },

  // ── Stage 7 ─────────────────────────────────────────────────────────────
  {
    index:           7,
    number:          7,
    name:            'PRD: Validated Specification',
    shortName:       'PRD',
    description:     'Document the validated, evidence-backed product requirements. The execution blueprint for engineering.',
    keyOutput:       'Full PRD with acceptance criteria, edge cases, and delivery dependencies',
    artifactFiles:   ['7-prd.md'],
    primaryArtifact: '7-prd.md',
    agentIds:        ['PS'],
    agentLabel:      'Product Strategist (PS)',
    color:           '#a78bfa',
    frameworks:      ['PRD Structure', 'Definition of Ready / Definition of Done', 'Acceptance Criteria', 'Requirements Engineering', 'Edge Case Coverage'],
    interviewSignal: 'Documentation rigor, evidence-backed requirements, stakeholder clarity, engineering-PM handoff quality',
    pmPurpose:
      'The PRD is positioned after the prototype because it is the evidence-backed codification of what the ' +
      'full lifecycle produced — not a speculative requirements document written before any validation occurred. ' +
      '7-prd.md captures the validated problem (Stage 2), the strategic priorities (Stage 3), the scoped solution ' +
      '(Stage 4), the technical constraints (Stage 5), and the prototype learnings (Stage 6) into a single ' +
      'engineering-ready specification. Acceptance criteria and edge cases are grounded in what the validation ' +
      'and prototype phases revealed, not in what was assumed at the outset.',
  },

  // ── Stage 8 ─────────────────────────────────────────────────────────────
  {
    index:           8,
    number:          8,
    name:            'Ship Strategy',
    shortName:       'Ship',
    description:     'Translate the validated specification into a concrete, actionable plan for engineering execution.',
    keyOutput:       'Backlog + sprint plan + release strategy + QA readiness criteria',
    artifactFiles:   ['11-backlog-&-release-planning.md', '12-implementation-planning.md', '13-qa-&-readiness.md'],
    primaryArtifact: '11-backlog-&-release-planning.md',
    agentIds:        ['CO', 'PS', 'QA'],
    agentLabel:      'Coordinator · Product Strategist · QA Engineer',
    color:           '#4ade80',
    frameworks:      ['Agile', 'Scrum', 'Critical Path', 'Definition of Ready', 'Release Strategy', 'QA Strategy', 'Readiness Gate'],
    interviewSignal: 'Delivery planning, sprint discipline, cross-functional coordination, launch readiness, quality gate design',
    pmPurpose:
      '11-backlog-&-release-planning.md operationalises the PRD into engineering work units with sprint sequencing ' +
      'and release milestones. 12-implementation-planning.md maps dependencies and provides the engineering team ' +
      'with a concrete implementation roadmap. 13-qa-&-readiness.md defines what "production ready" means — ' +
      'the quality bar, readiness criteria, and launch checklist that must be cleared before the prototype goes live. ' +
      'Together these three artifacts answer: how do we ship this, in what order, and how do we know it\'s ready?',
  },

];

// ════════════════════════════════════════════════════════════════════════════
// PM_LIFECYCLE_MAP — stage index → ordered V3 artifact filenames
//
// This is the canonical display mapping. The order of filenames within each
// array is the order they appear in the PM Lifecycle view for that stage.
// It does NOT express execution dependencies — use ARTIFACT_DEPS for that.
// ════════════════════════════════════════════════════════════════════════════
export const PM_LIFECYCLE_MAP: Readonly<Record<number, readonly string[]>> = Object.freeze({
  0: Object.freeze(['0-idea-intake.md']),
  1: Object.freeze(['1-discovery.md']),
  2: Object.freeze(['2-problem-definition.md']),
  3: Object.freeze(['5-validation.md', '6-prioritization.md']),
  4: Object.freeze(['3-solution-design.md', '4-mvp-hypothesis.md', '8-ux-design.md', '9-usability-planning.md']),
  5: Object.freeze(['10-architecture.md']),
  6: Object.freeze(['14-prototype-prompt.md']),
  7: Object.freeze(['7-prd.md']),
  8: Object.freeze(['11-backlog-&-release-planning.md', '12-implementation-planning.md', '13-qa-&-readiness.md']),
});

// ════════════════════════════════════════════════════════════════════════════
// PM_LIFECYCLE_ARTIFACT_MAP — V3 artifact filename → PM stage index
//
// Reverse lookup derived from PM_LIFECYCLE_MAP.
// All 15 V3 artifacts appear exactly once.
// ════════════════════════════════════════════════════════════════════════════
export const PM_LIFECYCLE_ARTIFACT_MAP: Readonly<Record<string, number>> = Object.freeze({
  '0-idea-intake.md':                  0,
  '1-discovery.md':                    1,
  '2-problem-definition.md':           2,
  '5-validation.md':                   3,
  '6-prioritization.md':               3,
  '3-solution-design.md':              4,
  '4-mvp-hypothesis.md':                4,
  '8-ux-design.md':                    4,
  '9-usability-planning.md':           4,
  '10-architecture.md':                5,
  '14-prototype-prompt.md':            6,
  '7-prd.md':                          7,
  '11-backlog-&-release-planning.md':  8,
  '12-implementation-planning.md':     8,
  '13-qa-&-readiness.md':              8,
});

// ════════════════════════════════════════════════════════════════════════════
// PM_LIFECYCLE_DELIVERABLES — post-lifecycle output section
//
// These are NOT PM Lifecycle stages. They appear below Stage 8 (Ship Strategy)
// as a distinct "Deliverables" section. They do not participate in lifecycle
// progress calculations. Builder packages are a system action, not a PM
// thinking stage — they are assembled by /api/build/ from all lifecycle artifacts.
// ════════════════════════════════════════════════════════════════════════════
export const PM_LIFECYCLE_DELIVERABLES: readonly PMDeliverable[] = Object.freeze([
  {
    id:          'builder-packages',
    name:        'Builder Packages',
    description: 'Implementation-ready packages assembled from all lifecycle artifacts. ' +
                 'Each package is optimised for a specific builder tool\'s context window and prompt format. ' +
                 'Generated on demand — can be regenerated at any time as artifacts are improved.',
    available:   true,
    future:      false,
    formats:     ['Lovable', 'Bolt', 'v0', 'Cursor', 'Replit', 'Claude', 'ChatGPT', 'Gemini', 'Windsurf', 'OpenHands'],
  },
  {
    id:          'pm-case-study',
    name:        'PM Case Study',
    description: 'Auto-generated portfolio narrative synthesised from all lifecycle stages. ' +
                 'STAR/CIRCLES hybrid format. Interview-ready in under 10 minutes.',
    available:   false,
    future:      true,
  },
  {
    id:          'portfolio-export',
    name:        'Portfolio Export',
    description: 'Export the full PM Lifecycle view as a shareable PDF or slide deck.',
    available:   false,
    future:      true,
  },
]);

// ════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS — pure, no side effects, no external calls
// ════════════════════════════════════════════════════════════════════════════

/**
 * Returns the PM Lifecycle stage status for a given stage index,
 * based solely on which artifact filenames are present in the workspace.
 *
 * Three states only. No 'blocked' state.
 * Status is observation-only — it does not imply workflow gates or prerequisites.
 *
 * @param stageIndex  - 0-based PM stage index (0–8)
 * @param presentArtifacts - array of filenames currently in the workspace
 */
export function lifecycleStageStatus(
  stageIndex: number,
  presentArtifacts: string[],
): StageStatus {
  const required = PM_LIFECYCLE_MAP[stageIndex];
  if (!required || required.length === 0) return 'pending';

  const presentCount = required.filter(f => presentArtifacts.includes(f)).length;

  if (presentCount === required.length) return 'complete';
  if (presentCount > 0)                 return 'partial';
  return 'pending';
}

/**
 * Returns a full progress summary across all 9 PM Lifecycle stages.
 * Builder packages and other deliverables are excluded from the count.
 *
 * @param presentArtifacts - array of filenames currently in the workspace
 */
export function lifecycleProgress(presentArtifacts: string[]): LifecycleProgressSummary {
  const stages = PM_LIFECYCLE_STAGES.map((_, i) =>
    lifecycleStageStatus(i, presentArtifacts),
  );

  const complete = stages.filter(s => s === 'complete').length;
  const partial  = stages.filter(s => s === 'partial').length;
  const pending  = stages.filter(s => s === 'pending').length;
  const total    = PM_LIFECYCLE_STAGES.length; // always 9

  return {
    complete,
    partial,
    pending,
    total,
    percent: total > 0 ? Math.round((complete / total) * 100) : 0,
    stages,
  };
}

/**
 * Given a V3 artifact filename, returns the PM Lifecycle stage it belongs to.
 * Returns null for filenames not mapped to any PM stage.
 *
 * @param artifactFilename - e.g. '7-prd.md', '14-prototype-prompt.md'
 */
export function getLifecycleStageForArtifact(artifactFilename: string): PMLifecycleStage | null {
  const stageIndex = PM_LIFECYCLE_ARTIFACT_MAP[artifactFilename];
  if (stageIndex === undefined) return null;
  return PM_LIFECYCLE_STAGES[stageIndex] ?? null;
}

/**
 * Returns all artifact filenames for a given PM stage index, in PM display order.
 * Returns empty array for invalid stage indices.
 *
 * @param stageIndex - 0-based PM stage index (0–8)
 */
export function getStageArtifacts(stageIndex: number): readonly string[] {
  return PM_LIFECYCLE_MAP[stageIndex] ?? [];
}

/**
 * Returns true if the given filename is a known V3 lifecycle artifact
 * that maps to a PM Lifecycle stage.
 *
 * @param filename - artifact filename to check
 */
export function isLifecycleArtifact(filename: string): boolean {
  return filename in PM_LIFECYCLE_ARTIFACT_MAP;
}

/**
 * Returns the provided artifact list sorted in PM Lifecycle stage order.
 * Within each stage, artifacts appear in the order defined by PM_LIFECYCLE_MAP.
 * Artifacts not in the PM_LIFECYCLE_ARTIFACT_MAP sort to the end.
 *
 * Use this in Desk and Improve left rail when PM Lifecycle view is active.
 * In V3 view, use the default numeric sort (parseInt on filename prefix) instead.
 *
 * @param artifacts - array of V3 artifact filenames from DataProvider
 */
export function sortArtifactsByPMStage(artifacts: string[]): string[] {
  return [...artifacts].sort((a, b) => {
    const stageA = PM_LIFECYCLE_ARTIFACT_MAP[a] ?? 999;
    const stageB = PM_LIFECYCLE_ARTIFACT_MAP[b] ?? 999;
    if (stageA !== stageB) return stageA - stageB;
    // Within same PM stage: sort by position in PM_LIFECYCLE_MAP
    const stageArtifacts = PM_LIFECYCLE_MAP[stageA] ?? [];
    return stageArtifacts.indexOf(a) - stageArtifacts.indexOf(b);
  });
}

/**
 * Returns all 15 V3 artifact filenames in PM Lifecycle stage order.
 * Useful for constructing a fully ordered list when all artifacts exist.
 */
export function getArtifactsInPMOrder(): string[] {
  return PM_LIFECYCLE_STAGES.flatMap(stage => [...stage.artifactFiles]);
}

/**
 * Returns the sibling artifacts in the same PM stage as the given artifact,
 * excluding the artifact itself. Returns empty array if no siblings exist
 * or the artifact is not in the map.
 *
 * Use this in the PM Intelligence panel to show "other artifacts in this stage."
 *
 * @param artifactFilename - the currently selected artifact
 */
export function getStageSiblings(artifactFilename: string): string[] {
  const stageIndex = PM_LIFECYCLE_ARTIFACT_MAP[artifactFilename];
  if (stageIndex === undefined) return [];
  const stageArtifacts = PM_LIFECYCLE_MAP[stageIndex] ?? [];
  return stageArtifacts.filter(f => f !== artifactFilename);
}

/**
 * Returns a human-readable label for a StageStatus value.
 * Consistent across all UI components.
 */
export function stageStatusLabel(status: StageStatus): string {
  switch (status) {
    case 'complete': return 'Complete';
    case 'partial':  return 'In Progress';
    case 'pending':  return 'Not Started';
  }
}

/**
 * Returns the display color for a StageStatus value.
 * Consistent across all UI components.
 */
export function stageStatusColor(status: StageStatus): string {
  switch (status) {
    case 'complete': return '#4ade80';
    case 'partial':  return '#f59e0b';
    case 'pending':  return '#1e293b';
  }
}

// ── Constants ─────────────────────────────────────────────────────────────

/** Total number of PM Lifecycle stages. Always 9. */
export const PM_LIFECYCLE_STAGE_COUNT = PM_LIFECYCLE_STAGES.length as 9;

/** Total number of V3 artifacts tracked in the PM Lifecycle map. Always 15. */
export const PM_LIFECYCLE_ARTIFACT_COUNT = Object.keys(PM_LIFECYCLE_ARTIFACT_MAP).length as 15;