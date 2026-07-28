// src/components/workspace/motion.ts
// Sprint 07 (W9) — motion values for the Workspace panel, cited by name at
// every call site. Exact durations are prescribed per-interaction by the
// sprint brief (coarser than lib/motion/primitives.ts's starting values), but
// reuse its cubic-bezier easings rather than inventing new curves.
import { easing } from '@/lib/motion/primitives';

export const workspaceMotion = {
  hoverMs:             80,   // row hover
  expandCollapseMs:    120,  // chevron expand/collapse — ViewSwitcher.tsx (Sprint 05) precedent
  activeSectionRailMs: 150,  // active-section indicator in the tree
  activityRowMs:       150,  // new activity feed entry slide-in
  artifactCompleteMs:  200,  // artifact row transitions to Written
  scrollToSectionMs:   250,  // smooth-scroll to a heading
  arrivalAccentMs:     400,  // brief highlight fade after landing
  easing,
} as const;
