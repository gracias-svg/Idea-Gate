'use client';

// Mission Control v1 — Batch M2 — SCRATCH ROUTE (deleted in M3).
// Renders the full Mission Control composition against real + synthetic adapter
// output so the pixels can be reviewed before integrating into office/page.tsx.
// This page is the composition/orchestration layer: it may read the store and
// map runtime → presentation items. The viz components stay presentation-only.

import { useMemo, useState } from 'react';
import WorkspaceLayout from '@/components/shell/WorkspaceLayout';
import HeroSlot from '@/components/ui/HeroSlot';
import Panel from '@/components/ui/Panel';
import OrchestrationCanvas from '@/components/viz/OrchestrationCanvas';
import StageRail from '@/components/viz/StageRail';
import MetricGrid, { type MetricItem } from '@/components/viz/MetricGrid';
import ActivityStream, { type ActivityItem } from '@/components/viz/ActivityStream';
import VitalsBand, { type VitalSegment } from '@/components/viz/VitalsBand';
import { AGENT_LAYOUT } from '@/components/viz/layout';
import { useExecutionStore } from '@/lib/execution/store';
import {
  toOrchestrationModel,
  type AgentDef,
  type ExecutionState,
} from '@/lib/execution/adapters/orchestration';
import type { StageState } from '@/lib/execution/types';

// Local copy of the six-agent registry (corrected colours). In M3 office/page
// injects the real AGENT_DEFS; scratch is throwaway so a local copy avoids
// importing the heavy office page.
const AGENT_DEFS: readonly AgentDef[] = [
  { id: 'CO', name: 'Coordinator',  fullName: 'PM Coordinator',    color: '#34d399', stages: [0, 6, 11], zone: 'STRATEGY',  role: '', isCoordinator: true },
  { id: 'PS', name: 'Product Strat', fullName: 'Product Strategist', color: '#818cf8', stages: [1, 7, 12], zone: 'STRATEGY',  role: '', isCoordinator: false },
  { id: 'RE', name: 'Researcher',   fullName: 'Research Lead',      color: '#38bdf8', stages: [2, 9],     zone: 'STRATEGY',  role: '', isCoordinator: false },
  { id: 'UX', name: 'UX Designer',  fullName: 'UX Designer',        color: '#f472b6', stages: [3, 8],     zone: 'EXECUTION', role: '', isCoordinator: false },
  { id: 'AR', name: 'Architect',    fullName: 'Principal Architect', color: '#fb923c', stages: [4, 10, 14], zone: 'EXECUTION', role: '', isCoordinator: false },
  { id: 'QA', name: 'QA Engineer',  fullName: 'QA Engineer',        color: '#c084fc', stages: [5, 13],    zone: 'QA',        role: '', isCoordinator: false },
];

const STAGE_LABELS = [
  'Idea Intake', 'Discovery', 'Problem Definition', 'Solution Design',
  'MVP Hypothesis', 'Validation', 'Prioritization', 'PRD',
  'UX Design', 'Usability', 'Architecture', 'Backlog & Release',
  'Implementation', 'QA & Readiness', 'Prototype Prompt',
];

type Scenario = 'live' | 'running' | 'empty';

// ── Synthetic states for review ───────────────────────────────────────────────
function emptyState(): ExecutionState {
  return { currentStage: 0, stages: {}, agents: {}, metrics: null };
}

function runningState(): ExecutionState {
  // Stages 0–3 complete (stage 3 low-confidence), stage 4 in progress → AR alive.
  const stages: Record<string, StageState> = {};
  for (let i = 0; i <= 4; i++) {
    const base = { id: String(i), status: 'completed' as const, startedAt: '2026-07-11T18:00:00.000Z' };
    if (i < 4) {
      stages[String(i)] = { ...base, completedAt: '2026-07-11T18:05:00.000Z', confidence: i === 3 ? 'low' : 'high' };
    } else {
      stages[String(i)] = { id: '4', status: 'active', startedAt: '2026-07-11T18:06:00.000Z' };
    }
  }
  return {
    currentStage: 4,
    stages,
    agents: {},
    metrics: { currentStage: 4, totalStages: 14, completedStages: 4, totalDurationMs: 0, lastUpdated: new Date().toISOString() },
  };
}

// ── Runtime → presentation mapping (page layer, allowed to know runtime) ──────
function toMetricItems(s: ExecutionState, activeAgentId: string | null, runState: string): MetricItem[] {
  const done = Object.values(s.stages).filter((st) => st.completedAt).length;
  const low = Object.values(s.stages).filter((st) => st.completedAt && st.confidence === 'low').length;
  return [
    { label: 'Current Stage', value: `${s.currentStage} / 15`, context: 'position in the lifecycle' },
    { label: 'Active Agent', value: activeAgentId ?? 'Idle', context: activeAgentId ? 'working right now' : 'no cognition in progress', tone: activeAgentId ? 'emerald' : 'neutral' },
    { label: 'Completed', value: done, context: 'stages finalised' },
    { label: 'Low Confidence', value: low, context: low ? 'flagged for review' : 'none flagged', tone: low ? 'caution' : 'neutral' },
  ];
}

function toActivityItems(s: ExecutionState): ActivityItem[] {
  return Object.values(s.stages)
    .filter((st) => st.startedAt)
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 8)
    .map((st) => ({
      id: st.id,
      label: st.completedAt ? `Stage ${st.id} · ${STAGE_LABELS[Number(st.id)]} completed` : `Stage ${st.id} · ${STAGE_LABELS[Number(st.id)]} started`,
      detail: st.completedAt ? undefined : 'in progress',
      time: st.completedAt ? 'done' : 'now',
      tone: st.completedAt ? (st.confidence === 'low' ? 'caution' : 'emerald') : 'neutral',
    }));
}

function toVitals(s: ExecutionState, activeAgentId: string | null, runState: string): VitalSegment[] {
  const low = Object.values(s.stages).filter((st) => st.completedAt && st.confidence === 'low').length;
  return [
    { label: 'Run', value: runState, tone: runState === 'running' ? 'emerald' : 'neutral' },
    { label: 'Active', value: activeAgentId ?? '—', tone: activeAgentId ? 'emerald' : 'neutral' },
    { label: 'Stage', value: `${s.currentStage}/14`, tone: 'neutral' },
    { label: 'Confidence', value: low ? `${low} low` : 'clear', tone: low ? 'caution' : 'emerald' },
  ];
}

export default function McScratchPage() {
  const [scenario, setScenario] = useState<Scenario>('live');

  // Live store snapshot.
  const liveCurrentStage = useExecutionStore((s) => s.currentStage);
  const liveStages = useExecutionStore((s) => s.stages);
  const liveAgents = useExecutionStore((s) => s.agents);
  const liveMetrics = useExecutionStore((s) => s.metrics);

  const execution: ExecutionState = useMemo(() => {
    if (scenario === 'empty') return emptyState();
    if (scenario === 'running') return runningState();
    return { currentStage: liveCurrentStage, stages: liveStages, agents: liveAgents, metrics: liveMetrics };
  }, [scenario, liveCurrentStage, liveStages, liveAgents, liveMetrics]);

  const model = useMemo(
    () => toOrchestrationModel(execution, AGENT_DEFS, AGENT_LAYOUT),
    [execution],
  );

  const metricItems = toMetricItems(execution, model.activeAgentId, model.runState);
  const activityItems = toActivityItems(execution);
  const vitals = toVitals(execution, model.activeAgentId, model.runState);

  return (
    <div style={{ height: '100%', padding: 20, boxSizing: 'border-box' }}>
      {/* scratch-only scenario toggle (this whole route is deleted in M3) */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {(['live', 'running', 'empty'] as Scenario[]).map((s) => (
          <button
            key={s}
            data-scenario={s}
            onClick={() => setScenario(s)}
            style={{
              fontFamily: 'var(--ig-font-mono)', fontSize: 11,
              padding: '4px 12px', borderRadius: 6, cursor: 'pointer',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              background: scenario === s ? 'var(--ig-surface-overlay)' : 'transparent',
              color: scenario === s ? 'var(--ig-emerald)' : 'var(--ig-text-tertiary)',
              border: `1px solid ${scenario === s ? 'var(--ig-emerald-dim)' : 'var(--ig-border-default)'}`,
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <div style={{ height: 'calc(100% - 46px)' }}>
        <WorkspaceLayout
          vitals={<VitalsBand segments={vitals} />}
          hero={
            <HeroSlot alive={model.runState === 'running'} className="h-full">
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>
                <div style={{ position: 'relative', flex: 1, minHeight: 340 }}>
                  <OrchestrationCanvas nodes={model.nodes} edges={model.edges} />
                  {model.runState === 'empty' && (
                    <div
                      style={{
                        position: 'absolute', left: '50%', bottom: 24, transform: 'translateX(-50%)',
                        fontFamily: 'var(--ig-font-mono)', fontSize: 12,
                        color: 'var(--ig-text-tertiary)', pointerEvents: 'none', textAlign: 'center',
                      }}
                    >
                      Run an idea to see the organisation work.
                    </div>
                  )}
                </div>
                <div style={{ flexShrink: 0 }}>
                  <StageRail stageNodes={model.stageNodes} />
                </div>
              </div>
            </HeroSlot>
          }
          supporting={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
              <Panel title="Run Summary" elevation={1}>
                <MetricGrid items={metricItems} />
              </Panel>
              <Panel title="Activity Stream" elevation={1} className="flex-1 min-h-0 overflow-auto">
                <ActivityStream items={activityItems} />
              </Panel>
            </div>
          }
        />
      </div>
    </div>
  );
}
