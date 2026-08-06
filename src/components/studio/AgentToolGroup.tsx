'use client';

// src/components/studio/AgentToolGroup.tsx
// Mission 26 — Honest execution feed.
//
// Previous version used a THOUGHT_FEED circular buffer of fake AI thoughts.
// This version shows ONLY real SSE events from the backend.
//
// When streaming with no recent events: show a stage-progress waiting state.
// When streaming with events: show up to 4 real events (newest on top).
// When complete: show completion summary.
//
// "Only show genuine execution events. Never invent fake AI thinking."

import React from 'react';
import { ToolGroup, ToolEntry, ToolGroupState } from '@/components/ui/tool-group';

// ── SSE event types ────────────────────────────────────────────────────────────

export interface StreamEvent {
  type:    'stage_start' | 'agent_active' | 'stage_retry' | 'agent_error' | 'run_complete' | 'run_stopped';
  stage?:  number;
  name?:   string;
  agent?:  string;
  message?: string;
}

// ── Agent display names ────────────────────────────────────────────────────────

const AGENT_DISPLAY: Record<string, string> = {
  ProductStrategyAgent: 'Product Strategy',
  ResearchAgent:        'Researcher',
  UXAgent:              'UX Designer',
  ArchitectAgent:       'Architect',
  QAAgent:              'QA Engineer',
  CoordinatorAgent:     'Coordinator',
};

// ── Stage name map ─────────────────────────────────────────────────────────────

const STAGE_NAMES: Record<number, string> = {
  0:  'Lifecycle init',
  1:  'Discovery',
  2:  'Problem definition',
  3:  'Solution design',
  4:  'Architecture hypothesis',
  5:  'Validation strategy',
  6:  'Coordinator review',
  7:  'Product strategy',
  8:  'UX iteration',
  9:  'Research synthesis',
  10: 'Architecture refinement',
  11: 'Coordinator sign-off',
  12: 'Product roadmap',
  13: 'QA & acceptance',
  14: 'Artifact compilation',
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  currentStage:  number;
  currentAgent:  string | null;
  isRunning:     boolean;
  recentEvents:  StreamEvent[];
  startedAt?:    number;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AgentToolGroup({
  currentStage,
  currentAgent,
  isRunning,
  recentEvents,
  startedAt,
}: Props) {
  const groupState: ToolGroupState = isRunning ? 'streaming' : 'completed';

  const agentDisplayName = currentAgent ? (AGENT_DISPLAY[currentAgent] ?? currentAgent) : null;
  const stageName = STAGE_NAMES[currentStage] ?? `Stage ${currentStage}`;

  const shimmerLabel = agentDisplayName
    ? `${agentDisplayName} · ${stageName}`
    : stageName;

  const completeLabel = `${Math.min(currentStage, 15)} of 15 stages complete`;

  // ── Build real event entries from SSE stream ──────────────────────────────
  // Only real events from the backend are shown. No circular buffer.
  const entries: ToolEntry[] = recentEvents
    .slice(-4)
    .map((evt, i): ToolEntry | null => {
      if (evt.type === 'stage_start') {
        const name = evt.name ?? STAGE_NAMES[evt.stage ?? -1] ?? `Stage ${evt.stage}`;
        return {
          id:       `sse-stage-${evt.stage}-${i}`,
          category: 'file',
          title:    name,
          subtitle: evt.stage != null ? `stage ${evt.stage}` : undefined,
        };
      }
      if (evt.type === 'agent_active') {
        const disp = evt.agent ? (AGENT_DISPLAY[evt.agent] ?? evt.agent) : 'Agent';
        return {
          id:       `sse-agent-${evt.agent}-${i}`,
          category: 'search',
          title:    disp,
          subtitle: 'active',
        };
      }
      if (evt.type === 'stage_retry') {
        return {
          id:       `sse-retry-${evt.stage}-${i}`,
          category: 'command',
          title:    `Retrying stage`,
          subtitle: evt.stage != null ? `stage ${evt.stage}` : undefined,
        };
      }
      if (evt.type === 'agent_error') {
        return {
          id:       `sse-error-${i}`,
          category: 'command',
          title:    evt.message ?? 'Agent error',
          subtitle: 'error',
        };
      }
      return null;
    })
    .filter((e): e is ToolEntry => e !== null);

  // When running but no real events yet, inject a single "waiting" entry
  // so the feed doesn't appear empty. This is real state (we know the stage),
  // not a fake thought.
  const displayEntries: ToolEntry[] = isRunning && entries.length === 0
    ? [{ id: 'waiting-stage', category: 'file', title: stageName, subtitle: 'initialising' }]
    : entries;

  return (
    <ToolGroup
      state={groupState}
      shimmerLabel={shimmerLabel}
      completeLabel={completeLabel}
      nestedTools={displayEntries}
      maxVisibleTools={4}
      startedAt={startedAt}
    />
  );
}
