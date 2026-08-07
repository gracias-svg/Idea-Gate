// src/lib/buildWorkspaceTree.ts
// M32B — Shared utility: build a live workspace documents tree from actual
// disk artifacts. No disabled/placeholder stage nodes. No static pre-built
// lifecycle tree. The tree grows from real files only.
//
// Consumed by:
//   src/app/desk/page.tsx    (workspaceTree useMemo)
//   src/app/improve/page.tsx (studioTree useMemo)
//
// Rule: a stage node appears ONLY when its artifact file exists in `artifacts`.
// Rule: a phase folder appears ONLY when it has ≥1 artifact OR is the
//       currently active / next phase while a lifecycle is running.

import type { WorkspaceNode } from '@/components/shared/WorkspaceExplorer';
import type { HealthState }    from '@/components/shared/WorkspaceExplorer';

// ── Canonical lifecycle structure ─────────────────────────────────────────────
// Single source of truth — both pages import from here.
export const LIFECYCLE_PHASES: ReadonlyArray<{
  id:     string;
  label:  string;
  color:  string;
  stages: number[];
}> = [
  { id: 'discover',  label: 'Discover',  color: '#4ade80', stages: [0, 1, 2]        },
  { id: 'decide',    label: 'Decide',    color: '#38bdf8', stages: [3, 4, 5, 6]     },
  { id: 'specify',   label: 'Specify',   color: '#818cf8', stages: [7, 8, 9]        },
  { id: 'architect', label: 'Architect', color: '#fb923c', stages: [10, 11]         },
  { id: 'ship',      label: 'Ship',      color: '#fde047', stages: [12, 13, 14]     },
] as const;

export const STAGE_LABELS: Record<number, string> = {
   0: 'Idea Intake',
   1: 'Discovery',
   2: 'Problem Definition',
   3: 'Solution Design',
   4: 'MVP Hypothesis',
   5: 'Validation',
   6: 'Prioritization',
   7: 'PRD',
   8: 'UX Design',
   9: 'Usability',
  10: 'Architecture',
  11: 'Backlog & Release',
  12: 'Implementation',
  13: 'QA & Readiness',
  14: 'Prototype Prompt',
};

// ── Utility: parse stage number from artifact filename ────────────────────────
// e.g. "07-prd-v1.md" → 7,  "0-idea-intake.md" → 0
export const stageNum  = (f: string): number => parseInt(f.split('-')[0], 10) || 0;

// ── Core builder ──────────────────────────────────────────────────────────────
// Builds the children of the "Documents" folder node.
// Returns only phase folders that have ≥1 real artifact, or are the active/
// next phase while the lifecycle is running.
//
// `getHealth(file, stageIndex)` — caller supplies health lookup (different
//   between Desk and Studio due to journey-state awareness).
// `getVer(file)` — caller supplies version lookup from RuntimeContext.
export function buildLiveDocumentsChildren(opts: {
  artifacts:    string[];
  currentStage: number;
  isRunning:    boolean;
  getHealth:    (file: string, stageIndex: number) => HealthState;
  getVer:       (file: string) => number;
}): WorkspaceNode[] {
  const { artifacts, currentStage, isRunning, getHealth, getVer } = opts;

  // Nothing to show when idle with no artifacts
  if (!isRunning && artifacts.length === 0) return [];

  const activePhaseIdx = LIFECYCLE_PHASES.findIndex(p =>
    p.stages.includes(currentStage)
  );

  return LIFECYCLE_PHASES
    .filter((phase, i) => {
      const hasArtifacts = phase.stages.some(n =>
        artifacts.some(a => stageNum(a) === n)
      );
      // While running, also show the active phase and the next upcoming phase
      // so the user can see what's coming next even before its files land.
      const isActive = isRunning && i === activePhaseIdx;
      const isNext   = isRunning && i === activePhaseIdx + 1;
      return hasArtifacts || isActive || isNext;
    })
    .map((phase): WorkspaceNode => {
      // Only include stage nodes that have an actual file on disk.
      const stageNodes: WorkspaceNode[] = phase.stages
        .filter(n => artifacts.some(a => stageNum(a) === n))
        .map((n): WorkspaceNode => {
          const file    = artifacts.find(a => stageNum(a) === n)!;
          const health  = getHealth(file, n);
          return {
            id:          `stage-${n}`,
            kind:        'file',
            label:       STAGE_LABELS[n] ?? `Stage ${n}`,
            file,
            stageIndex:  n,
            healthState: health,
            version:     getVer(file),
          };
        });

      return {
        id:         `phase-${phase.id}`,
        kind:       'folder',
        label:      phase.label,
        phaseColor: phase.color,
        count:      stageNodes.length,
        children:   stageNodes,
      };
    });
}
