'use client';

// Mission Control v1 — Batch M2 — SCRATCH ROUTE (deleted in M3).
// Renders the full Mission Control composition against real + synthetic adapter
// output so the pixels can be reviewed before integrating into office/page.tsx.
// This page is the composition/orchestration layer: it may read the store and
// map runtime → presentation items. The viz components stay presentation-only.

import { useEffect, useMemo, useRef, useState } from 'react';
import WorkspaceLayout from '@/components/shell/WorkspaceLayout';
import HeroSlot from '@/components/ui/HeroSlot';
import Panel from '@/components/ui/Panel';
import OrchestrationCanvas, {
  type RippleSignal,
  type ReasoningSignal,
} from '@/components/viz/OrchestrationCanvas';
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

// M2.5 — parameterised by the stage currently in progress so the "Advance
// Stage" demo control (below) can step it forward, one stage at a time,
// each step producing a fresh completion (drives the ripple) and eventually
// a running->complete transition (drives the stage-rail sweep). Confidence
// pattern (every 4th stage low) matches the original fixed M2 fixture —
// stage 3 is still low-confidence at the default starting point (4).
function demoRunningState(activeStage: number): ExecutionState {
  const stages: Record<string, StageState> = {};
  const lastIndex = Math.min(activeStage, 14);
  for (let i = 0; i <= lastIndex; i++) {
    if (i === activeStage && activeStage <= 14) {
      stages[String(i)] = { id: String(i), status: 'active', startedAt: '2026-07-11T18:06:00.000Z' };
    } else {
      stages[String(i)] = {
        id: String(i),
        status: 'completed',
        startedAt: '2026-07-11T18:00:00.000Z',
        completedAt: '2026-07-11T18:05:00.000Z',
        confidence: i % 4 === 3 ? 'low' : 'high',
      };
    }
  }
  const completedStages = Object.values(stages).filter((s) => s.completedAt).length;
  return {
    currentStage: lastIndex,
    stages,
    agents: {},
    metrics: {
      currentStage: lastIndex,
      totalStages: 14,
      completedStages,
      totalDurationMs: 0,
      // Always fresh — the staleness guard (adapter C2) would otherwise
      // treat this synthetic fixture as an abandoned run.
      lastUpdated: new Date().toISOString(),
    },
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

  // M2.5 — synthetic "advance stage" control for the running scenario, so
  // the storytelling motion (ripple on completion, eventual completion
  // sweep) can be demonstrated deterministically instead of waiting on a
  // real run. Resets to the original M2 fixture (stage 4, AR active) every
  // time the running tab is re-entered.
  const [demoStage, setDemoStage] = useState(4);
  useEffect(() => {
    if (scenario === 'running') setDemoStage(4);
  }, [scenario]);

  // Live store snapshot.
  const liveCurrentStage = useExecutionStore((s) => s.currentStage);
  const liveStages = useExecutionStore((s) => s.stages);
  const liveAgents = useExecutionStore((s) => s.agents);
  const liveMetrics = useExecutionStore((s) => s.metrics);

  const execution: ExecutionState = useMemo(() => {
    if (scenario === 'empty') return emptyState();
    if (scenario === 'running') return demoRunningState(demoStage);
    return { currentStage: liveCurrentStage, stages: liveStages, agents: liveAgents, metrics: liveMetrics };
  }, [scenario, demoStage, liveCurrentStage, liveStages, liveAgents, liveMetrics]);

  const model = useMemo(
    () => toOrchestrationModel(execution, AGENT_DEFS, AGENT_LAYOUT),
    [execution],
  );

  const metricItems = toMetricItems(execution, model.activeAgentId, model.runState);
  const activityItems = toActivityItems(execution);
  const vitals = toVitals(execution, model.activeAgentId, model.runState);

  // ── M2.5 storytelling signals — diffed here, in the composition layer,
  // never in the pure adapter (see OrchestrationCanvas.tsx comment). ──────

  // Reset both diff baselines silently on scenario switch, BEFORE the diff
  // effects below run in the same commit — otherwise switching tabs would
  // read a stale baseline from a different scenario and fire a spurious
  // burst of ripples / a spurious sweep. Declared first so it commits first.
  const prevStagesRef = useRef<Record<string, StageState> | null>(null);
  const prevRunStateRef = useRef<string | null>(null);
  useEffect(() => {
    prevStagesRef.current = null;
    prevRunStateRef.current = null;
  }, [scenario]);

  // Task 2 — confidence ripple: fire once from the owning agent whenever a
  // stage transitions to completed. Tone carries the confidence signal
  // itself (caution = low) rather than a separate indicator.
  const rippleNonceRef = useRef(0);
  const [ripple, setRipple] = useState<RippleSignal | null>(null);
  useEffect(() => {
    const prev = prevStagesRef.current;
    prevStagesRef.current = execution.stages;
    if (!prev) return; // first observation of this baseline — nothing "just" happened.
    for (const [idx, stage] of Object.entries(execution.stages)) {
      if (stage.completedAt && !prev[idx]?.completedAt) {
        const owner = AGENT_DEFS.find((d) => d.stages.includes(Number(idx)));
        if (owner) {
          rippleNonceRef.current += 1;
          setRipple({
            nodeId: owner.id,
            tone: stage.confidence === 'low' ? 'caution' : 'emerald',
            nonce: rippleNonceRef.current,
          });
        }
      }
    }
  }, [execution.stages]);

  // Task 4 — completion sweep: fire once on a running -> complete transition.
  const sweepNonceRef = useRef(0);
  const [completionSweepNonce, setCompletionSweepNonce] = useState(0);
  useEffect(() => {
    const prev = prevRunStateRef.current;
    prevRunStateRef.current = model.runState;
    if (prev === 'running' && model.runState === 'complete') {
      sweepNonceRef.current += 1;
      setCompletionSweepNonce(sweepNonceRef.current);
    }
  }, [model.runState]);

  // Task 3 — reasoning tag: real data only. Stage label is always known;
  // the confidence half only renders when the store has actually resolved a
  // confidence for THIS stage. For a stage still in progress that's usually
  // not yet true (confidence is written at completion) — so on genuinely
  // live/in-progress work the tag will often show just the label, which is
  // the honest behaviour, not a missing feature.
  const reasoning: ReasoningSignal | null = useMemo(() => {
    if (!model.activeAgentId) return null;
    const label = STAGE_LABELS[execution.currentStage];
    if (!label) return null;
    const confidence = execution.stages[String(execution.currentStage)]?.confidence;
    const phrase = confidence ? (confidence === 'low' ? 'reviewing carefully' : 'high confidence') : null;
    return { nodeId: model.activeAgentId, text: phrase ? `${label} · ${phrase}` : label };
  }, [model.activeAgentId, execution.currentStage, execution.stages]);

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
        {scenario === 'running' && (
          <button
            type="button"
            data-testid="advance-stage"
            onClick={() => setDemoStage((s) => Math.min(s + 1, 15))}
            disabled={demoStage > 14}
            style={{
              fontFamily: 'var(--ig-font-mono)', fontSize: 11,
              padding: '4px 12px', borderRadius: 6,
              cursor: demoStage > 14 ? 'default' : 'pointer',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              background: 'transparent',
              color: demoStage > 14 ? 'var(--ig-text-tertiary)' : 'var(--ig-emerald)',
              border: `1px solid ${demoStage > 14 ? 'var(--ig-border-default)' : 'var(--ig-emerald-dim)'}`,
              opacity: demoStage > 14 ? 0.5 : 1,
            }}
          >
            {demoStage > 14 ? 'Run complete' : 'Advance Stage →'}
          </button>
        )}
      </div>

      <div style={{ height: 'calc(100% - 46px)' }}>
        <WorkspaceLayout
          vitals={<VitalsBand segments={vitals} />}
          hero={
            <HeroSlot alive={model.runState === 'running'} className="h-full">
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>
                <div style={{ position: 'relative', flex: 1, minHeight: 340 }}>
                  <OrchestrationCanvas
                    nodes={model.nodes}
                    edges={model.edges}
                    ripple={ripple}
                    reasoning={reasoning}
                  />
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
                  <StageRail stageNodes={model.stageNodes} completionSweepNonce={completionSweepNonce} />
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
