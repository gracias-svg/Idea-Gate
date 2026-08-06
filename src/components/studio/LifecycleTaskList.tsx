'use client';

// src/components/studio/LifecycleTaskList.tsx
// Mission 20 — G2: Wraps TaskList with IdeaGate's 15-stage lifecycle labels.
//
// Maps currentStage (0–15) to TaskList's currentIndex:
//   i < currentStage  → done
//   i === currentStage && isRunning → active (arrow icon)
//   i > currentStage  → pending
//
// Title shows "Building your product · N of 15 stages".

import React from 'react';
import { TaskList } from '@/components/ui/task-list';

// ── 15 lifecycle stage labels (indices 0–14) ───────────────────────────────────

const LIFECYCLE_LABELS: string[] = [
  'Lifecycle initialised',          // 0
  'Discovery & ideation',           // 1
  'Problem definition',             // 2
  'Solution design',                // 3
  'Architecture hypothesis',        // 4
  'Validation strategy',            // 5
  'Coordinator review',             // 6
  'Product strategy refinement',    // 7
  'UX iteration',                   // 8
  'Research synthesis',             // 9
  'Architecture refinement',        // 10
  'Coordinator sign-off',           // 11
  'Product roadmap finalization',   // 12
  'QA & acceptance criteria',       // 13
  'Artifact compilation',           // 14
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  currentStage: number;   // 0–15 (15 = complete)
  isRunning:    boolean;
  idea?:        string;   // V3: relocates idea text from header to checklist subtitle
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LifecycleTaskList({ currentStage, isRunning, idea }: Props) {
  const clampedStage = Math.min(Math.max(currentStage, 0), LIFECYCLE_LABELS.length);
  // V3: idea text shown as subtitle below the header, replacing the removed 18px idea div
  const title = idea
    ? `${idea.length > 60 ? idea.slice(0, 60) + '…' : idea}`
    : `Building your product · ${clampedStage} of ${LIFECYCLE_LABELS.length} stages`;

  return (
    <TaskList
      labels={LIFECYCLE_LABELS}
      currentIndex={clampedStage}
      isRunning={isRunning}
      title={title}
      defaultOpen={false}
    />
  );
}
