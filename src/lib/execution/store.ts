// Foundation Phase 1 — Batch F4 — Unified Execution Context.
// Single Zustand store all execution-aware components read from, so the
// graph (OrchestrationGraph), analytics view, and any future panel share
// one selection/hover state instead of each re-deriving it.

import { create } from 'zustand';
import type {
  AgentState,
  ExecutionEntity,
  JourneyStateResponse,
  MetricSnapshot,
  RuntimeEvent,
  StageState,
} from './types';

// The lifecycle engine is fixed at 14 enforced stages (CLAUDE.md — "WHAT
// CURRENTLY WORKS"); used only to compute MetricSnapshot.totalStages.
const TOTAL_STAGES = 14;

export interface ExecutionContext {
  currentStage: number;
  stages: Record<string, StageState>;
  agents: Record<string, AgentState[]>;
  metrics: MetricSnapshot | null;
  events: RuntimeEvent[];
  selected: ExecutionEntity | null;
  hovered: ExecutionEntity | null;
  select: (entity: ExecutionEntity | null) => void;
  hover: (entity: ExecutionEntity | null) => void;
  hydrate: (data: JourneyStateResponse) => void;
}

export const useExecutionStore = create<ExecutionContext>((set, get) => ({
  currentStage: 0,
  stages: {},
  agents: {},
  metrics: null,
  events: [],
  selected: null,
  hovered: null,

  select: (entity) => set({ selected: entity }),
  hover: (entity) => set({ hovered: entity }),

  hydrate: (data) => {
    const prevEvents = get().events;
    const nextEvents: RuntimeEvent[] = [...prevEvents];

    const stages: Record<string, StageState> = {};
    const agents: Record<string, AgentState[]> = {};
    let completedStages = 0;
    let totalDurationMs = 0;

    for (const [id, stage] of Object.entries(data.stages)) {
      const stageNum = parseInt(id, 10);
      const status = stage.completedAt
        ? 'completed'
        : stageNum === data.currentStage
          ? 'active'
          : 'pending';

      if (status === 'completed') completedStages += 1;
      if (stage.durationMs) totalDurationMs += stage.durationMs;

      const prevStage = get().stages[id];
      if (stage.startedAt && prevStage?.startedAt !== stage.startedAt) {
        nextEvents.push({ id: `${id}-started-${stage.startedAt}`, stageId: id, type: 'stage-started', timestamp: stage.startedAt });
      }
      if (stage.completedAt && prevStage?.completedAt !== stage.completedAt) {
        nextEvents.push({ id: `${id}-completed-${stage.completedAt}`, stageId: id, type: 'stage-completed', timestamp: stage.completedAt });
      }

      stages[id] = { id, status, ...stage };
      agents[id] = (data.agentsByStage[id] ?? []).map((name) => ({
        id: name,
        stageId: id,
        status: 'completed',
      }));
    }

    const metrics: MetricSnapshot = {
      currentStage: data.currentStage,
      totalStages: TOTAL_STAGES,
      completedStages,
      totalDurationMs,
      lastUpdated: new Date().toISOString(),
    };

    set({ currentStage: data.currentStage, stages, agents, metrics, events: nextEvents });
  },
}));
