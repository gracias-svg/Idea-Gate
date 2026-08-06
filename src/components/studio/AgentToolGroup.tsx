'use client';

// src/components/studio/AgentToolGroup.tsx
// Mission 29 — Stable all-agents view.
//
// Shows all 6 agents as a stable list with their current status:
//   active   — the agent currently executing (SSE agent_active or currentAgent prop)
//   done     — agents that have been active in this run (from recentEvents)
//   waiting  — not yet reached
//
// The card header shows the current stage name as a fixed label.
// This replaces the sliding-window SSE event buffer from M26.

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

// ── All agents in execution order ─────────────────────────────────────────────

const ALL_AGENTS: Array<{ key: string; label: string }> = [
  { key: 'CoordinatorAgent',     label: 'Coordinator'     },
  { key: 'ResearchAgent',        label: 'Researcher'      },
  { key: 'ProductStrategyAgent', label: 'Product Strategy'},
  { key: 'UXAgent',              label: 'UX Designer'     },
  { key: 'ArchitectAgent',       label: 'Architect'       },
  { key: 'QAAgent',              label: 'QA Engineer'     },
];

// ── Agent display names (kept for backward compat) ────────────────────────────

export const AGENT_DISPLAY: Record<string, string> = {
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

  const stageName    = STAGE_NAMES[currentStage] ?? `Stage ${currentStage}`;
  const completeLabel = `${Math.min(currentStage, 15)} of 15 stages complete`;

  // ── Build stable all-agents entry list ───────────────────────────────────
  // Agents that have been active (from SSE history) are marked done.
  // The current active agent is marked active.
  // The rest are waiting.
  const seenAgents = new Set(
    recentEvents.filter(e => e.type === 'agent_active').map(e => e.agent)
  );

  const entries: ToolEntry[] = ALL_AGENTS.map(({ key, label }) => {
    const isActive  = key === currentAgent && isRunning;
    const isDone    = seenAgents.has(key) && !isActive;
    return {
      id:       key,
      category: isActive ? 'search' : isDone ? 'command' : 'file',
      title:    label,
      subtitle: isActive ? 'active' : isDone ? 'done' : 'waiting',
    };
  });

  return (
    <ToolGroup
      state={groupState}
      shimmerLabel={stageName}
      completeLabel={completeLabel}
      nestedTools={entries}
      maxVisibleTools={6}
      startedAt={startedAt}
    />
  );
}
