'use client';

// src/app/mission-control/page.tsx
// IdeaGate — Mission Control
// Mission 10: Replaces /office. Unified operational hub with sub-nav tabs.
// Overview (existing analytics) · Live (existing agent-activity + Phaser) ·
// Journey (journey.json data) · Blueprint (artifact dependency view)

import dynamic from 'next/dynamic';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useRuntime, ARTIFACT_DEPS, getDirectDownstream } from '@/lib/RuntimeContext';
import { useGlobalStore, getModelMeta, isModelFree } from '@/lib/GlobalStore';
import type { AgentData, OfficeSceneConfig } from '../../game/OfficeScene';
import OrchestrationGraph from '@/components/office/OrchestrationGraph';
import ExecutionSummary   from '@/components/office/ExecutionSummary';
import LiveLogStream      from '@/components/office/LiveLogStream';
import VitalsBand         from '@/components/viz/VitalsBand';
import type { VitalSegment } from '@/components/viz/VitalsBand';

const PhaserGame = dynamic(() => import('../office/PhaserGame'), { ssr: false });

// ── Stage metadata ────────────────────────────────────────────────────────────
const STAGE_LABEL: Record<number, string> = {
   0: 'Idea Intake',      1: 'Discovery',          2: 'Problem Definition',
   3: 'Solution Design',  4: 'MVP Hypothesis',      5: 'Validation',
   6: 'Prioritization',   7: 'PRD',                 8: 'UX Design',
   9: 'Usability',       10: 'Architecture',        11: 'Backlog & Release',
  12: 'Implementation',  13: 'QA & Readiness',      14: 'Prototype Prompt',
};

const STAGE_AGENT: Record<number, string> = {
   0: 'CO', 1: 'PS', 2: 'RE', 3: 'UX', 4: 'AR', 5: 'QA', 6: 'CO',
   7: 'PS', 8: 'UX', 9: 'RE', 10: 'AR', 11: 'CO', 12: 'PS', 13: 'QA', 14: 'AR',
};

const ALL_ARTIFACTS = Object.keys(ARTIFACT_DEPS);

const AGENT_DEFS = [
  {
    id: 'CO', name: 'Coordinator', fullName: 'PM Coordinator',
    color: '#34d399', stages: [0, 6, 11], zone: 'STRATEGY',
    role: 'Lifecycle orchestration · quality gating · stage advancement',
    isCoordinator: true,
  },
  {
    id: 'PS', name: 'Product Strat', fullName: 'Product Strategist',
    color: '#818cf8', stages: [1, 7, 12], zone: 'STRATEGY',
    role: 'Discovery · PRD · implementation planning',
    isCoordinator: false,
  },
  {
    id: 'RE', name: 'Researcher', fullName: 'Research Lead',
    color: '#38bdf8', stages: [2, 9], zone: 'STRATEGY',
    role: 'Problem definition · usability planning',
    isCoordinator: false,
  },
  {
    id: 'UX', name: 'UX Designer', fullName: 'UX Designer',
    color: '#f472b6', stages: [3, 8], zone: 'EXECUTION',
    role: 'Solution design · UX specification',
    isCoordinator: false,
  },
  {
    id: 'AR', name: 'Architect', fullName: 'Principal Architect',
    color: '#fb923c', stages: [4, 10, 14], zone: 'EXECUTION',
    role: 'MVP hypothesis · architecture · prototype prompt',
    isCoordinator: false,
  },
  {
    id: 'QA', name: 'QA Engineer', fullName: 'QA Engineer',
    color: '#c084fc', stages: [5, 13], zone: 'QA',
    role: 'Validation strategy · QA readiness',
    isCoordinator: false,
  },
] as const;

// SSE agent name → display name
const SSE_AGENT_DISPLAY: Record<string, string> = {
  ProductStrategyAgent: 'Product Strategy Agent',
  ResearchAgent:        'Research Agent',
  DataAgent:            'Data Agent',
  UXAgent:              'UX Design Agent',
  ArchitectAgent:       'Architect Agent',
  CodeAgent:            'Code Agent',
  QAAgent:              'QA Agent',
};

type MCTab   = 'overview' | 'live' | 'journey' | 'blueprint';
type DashTab = 'STATUS' | 'AGENTS' | 'FEED' | 'CONTROLS';

const MC_TABS: { id: MCTab; label: string }[] = [
  { id: 'overview',   label: 'Overview'   },
  { id: 'live',       label: 'Live'       },
  { id: 'journey',    label: 'Journey'    },
  { id: 'blueprint',  label: 'Blueprint'  },
];

const DISABLED_TABS = [
  'Intelligence', 'Insights', 'Decisions', 'Metrics',
  'Collaboration', 'Lifecycle Health', 'Dependency Graphs',
];

// ── Derive agent state from real runtime data ─────────────────────────────────
function deriveAgentState(
  agentId: string,
  artifacts: string[],
  runtime: ReturnType<typeof useRuntime>,
): 'idle' | 'done' | 'working' | 'stale' | 'blocked' {
  const def = AGENT_DEFS.find(a => a.id === agentId);
  if (!def) return 'idle';
  const ownedArts = ALL_ARTIFACTS.filter(
    art => def.stages.includes(parseInt(art.split('-')[0], 10) as never),
  );
  const isStale    = ownedArts.some(art => runtime.state.staleArtifacts.has(art));
  const hasImproved = ownedArts.some(art => (runtime.state.artifactVersions[art] ?? 0) > 0);
  const hasArtifact = ownedArts.some(art =>
    artifacts.some(f => f === art || f.startsWith(art.split('.')[0])),
  );
  if (isStale)     return 'stale';
  if (hasImproved) return 'working';
  if (hasArtifact) return 'done';
  return 'idle';
}

const STATE_COLOR: Record<string, string> = {
  done: '#4ade80', working: '#818cf8', stale: '#f59e0b', blocked: '#f87171', idle: '#94a3b8',
};
const STATE_LABEL: Record<string, string> = {
  done: 'DONE', working: 'WORKING', stale: 'STALE', blocked: 'BLOCKED', idle: 'IDLE',
};

// ── Lifecycle strip SVG ───────────────────────────────────────────────────────
function LifecycleStrip({
  currentStage, versions, stale,
}: { currentStage: number; versions: Record<string, number>; stale: Set<string> }) {
  const stages = Array.from({ length: 15 }, (_, i) => i);
  return (
    <svg viewBox="0 0 840 36" style={{ width: '100%', height: '36px', overflow: 'visible' }}>
      {stages.map(i => {
        const art    = ALL_ARTIFACTS.find(a => parseInt(a.split('-')[0], 10) === i);
        const isStale = art ? stale.has(art) : false;
        const ver    = art ? (versions[art] ?? 0) : 0;
        const active = i === currentStage;
        const done   = i < currentStage;
        const x = i * (840 / 15) + (840 / 30);
        const col = isStale ? '#f59e0b' : ver > 0 ? '#4ade80' : done ? '#22c55e55' : active ? '#818cf8' : '#1e293b';
        return (
          <g key={i}>
            {i > 0 && <line x1={x - 840 / 15} y1={18} x2={x} y2={18} stroke="#1e293b" strokeWidth={1} />}
            <circle cx={x} cy={18} r={active ? 7 : 5} fill={col} stroke={active ? '#818cf8' : 'transparent'} strokeWidth={2} />
            {ver > 0 && <text x={x} y={8} fontSize="7" fill="#4ade8088" textAnchor="middle">v{ver}</text>}
            <text x={x} y={30} fontSize="6" fill={isStale ? '#f59e0b' : active ? '#818cf8' : done ? '#94a3b8' : '#1e293b'} textAnchor="middle">
              {STAGE_LABEL[i]?.split(' ')[0]?.slice(0, 5)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Coordinator station (STATUS tab centerpiece) ──────────────────────────────
function CoordinatorStation({
  currentStage, events, improvements, staleCount,
}: {
  currentStage: number;
  events: ReturnType<typeof useRuntime>['state']['events'];
  improvements: number;
  staleCount: number;
}) {
  const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono','Fira Code',monospace" };
  const agentId    = STAGE_AGENT[currentStage] ?? 'CO';
  const agentColor = AGENT_DEFS.find(a => a.id === agentId)?.color ?? '#4ade80';

  const coordEvents = events.filter(e =>
    e.type === 'ORCHESTRATION_STAGE' ||
    e.type === 'ORCHESTRATION_COMPLETE' ||
    e.type === 'ORCHESTRATION_STARTED',
  ).slice(0, 3);

  return (
    <div style={{ padding: '10px', backgroundColor: '#040b14', border: '1px solid #4ade8033', borderRadius: '4px', marginBottom: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#4ade80' }} />
        <div style={{ fontSize: '12px', color: '#4ade80', fontWeight: 700, letterSpacing: '0.1em' }}>COORDINATOR · CO</div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: '13px', color: '#4ade80', padding: '1px 6px', border: '1px solid #4ade8033', borderRadius: '2px' }}>ACTIVE</div>
      </div>

      <div style={{ fontSize: '13px', color: '#818cf8', fontWeight: 700, marginBottom: '4px', ...MONO }}>
        Stage {currentStage}: {STAGE_LABEL[currentStage] ?? 'Complete'}
      </div>
      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
        Active agent: <span style={{ color: agentColor }}>{agentId}</span>
        {currentStage >= 14 && <span style={{ color: '#4ade80', marginLeft: '8px' }}>· Lifecycle complete</span>}
      </div>

      <div style={{ fontSize: '13px', color: '#2a5a30', letterSpacing: '0.08em', fontWeight: 700, marginBottom: '5px' }}>LAST DECISIONS</div>
      {coordEvents.length > 0 ? coordEvents.map((ev, i) => (
        <div key={ev.id ?? i} style={{ fontSize: '13px', color: '#94a3b8', padding: '3px 0', borderBottom: '1px solid #060e09', display: 'flex', gap: '7px' }}>
          <span style={{ color: '#1a3a20' }}>{new Date(ev.timestamp).toLocaleTimeString('en', { hour12: false })}</span>
          <span style={{ color: '#94a3b8' }}>{ev.type.replace(/_/g, ' ')}</span>
          {ev.payload.stage !== undefined && <span style={{ color: '#4ade8066' }}>→ Stage {String(ev.payload.stage)}</span>}
        </div>
      )) : (
        <div style={{ fontSize: '13px', color: '#1e293b' }}>
          {currentStage >= 14
            ? '✓ All 14 stages complete · lifecycle cycle closed'
            : 'No coordinator events this session — run a lifecycle to see decisions'}
        </div>
      )}

      <div style={{ marginTop: '8px', padding: '6px 8px', backgroundColor: '#0a0800', border: '1px solid #f59e0b22', borderRadius: '3px', fontSize: '13px', color: '#f59e0b88', lineHeight: 1.5 }}>
        ⚠ V3.2 FIX PENDING: Coordinator currently advances without quality signal (stages 1-14 parse bug). Decision log will become meaningful after tool_use migration.
      </div>
    </div>
  );
}

// ── Journey tab ───────────────────────────────────────────────────────────────
function JourneyTab({
  journeyState,
  currentStage,
  router,
  MONO,
}: {
  journeyState: { currentStage: number; stages: Record<string, any>; agentsByStage: Record<string, string[]> };
  currentStage: number;
  router: ReturnType<typeof useRouter>;
  MONO: React.CSSProperties;
}) {
  const hasData = Object.keys(journeyState.stages).length > 0;

  if (!hasData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: '#1e293b' }}>
        <div style={{ fontSize: '32px', opacity: 0.3 }}>◎</div>
        <div style={{ fontSize: '13px', color: '#334155', textAlign: 'center', lineHeight: 1.7 }}>
          No journey data yet.<br />Run a lifecycle to see stage-by-stage details.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '16px', overflowY: 'auto', height: '100%' }}>
      {Array.from({ length: 15 }, (_, i) => {
        const key      = String(i);
        const stage    = journeyState.stages[key] as Record<string, any> | undefined;
        const agents   = journeyState.agentsByStage[key] ?? [];
        const isDone   = i < currentStage;
        const isActive = i === currentStage;

        const statusColor = isDone ? '#4ade80' : isActive ? '#818cf8' : '#1e293b';
        const statusLabel = isDone ? 'DONE' : isActive ? 'ACTIVE' : 'PENDING';
        const borderColor = isDone ? '#4ade8022' : isActive ? '#818cf833' : '#0a1a2e';

        // durationMs is always 0 in current data — do not display it.
        const summary    = stage?.summary    as string | undefined;
        const decision   = stage?.decision   as string | undefined;
        const confidence = stage?.confidence as string | undefined; // 'high' | 'medium' | 'low'
        const outputFile = stage?.outputFile as string | undefined;

        const confidenceColor =
          confidence === 'high'   ? '#4ade80' :
          confidence === 'medium' ? '#f59e0b' :
          confidence === 'low'    ? '#f87171' : undefined;

        return (
          <div
            key={i}
            style={{
              padding: '10px 12px',
              backgroundColor: isActive ? '#040b14' : '#020c06',
              border: `1px solid ${borderColor}`,
              borderRadius: '4px',
              transition: 'border-color 200ms ease',
            }}
          >
            {/* Stage header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: summary || decision ? '8px' : 0 }}>
              {/* Number badge */}
              <div style={{
                width: '22px', height: '22px', borderRadius: '3px', flexShrink: 0,
                backgroundColor: isDone ? '#4ade8015' : isActive ? '#818cf815' : '#0a1a2e',
                border: `1px solid ${statusColor}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', color: statusColor, fontWeight: 700, ...MONO,
              }}>
                {i}
              </div>

              {/* Label */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', color: isDone ? '#94a3b8' : isActive ? '#e2e8f0' : '#334155', fontWeight: isActive ? 700 : 400 }}>
                  {STAGE_LABEL[i]}
                </div>
                {agents.length > 0 && (
                  <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>
                    {agents.join(' · ')}
                  </div>
                )}
              </div>

              {/* Status badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                {confidence && confidenceColor && (
                  <span style={{
                    fontSize: '9px', padding: '1px 5px',
                    border: `1px solid ${confidenceColor}33`,
                    borderRadius: '2px',
                    color: confidenceColor,
                    ...MONO,
                  }}>
                    {confidence}
                  </span>
                )}
                <span style={{
                  fontSize: '8px', padding: '2px 6px',
                  backgroundColor: isDone ? '#4ade8010' : isActive ? '#818cf810' : 'transparent',
                  border: `1px solid ${statusColor}33`,
                  borderRadius: '2px', color: statusColor, letterSpacing: '0.08em',
                }}>
                  {statusLabel}
                </span>
              </div>
            </div>

            {/* Summary */}
            {summary && (
              <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.6, marginBottom: decision ? '6px' : 0, paddingLeft: '30px' }}>
                {summary}
              </div>
            )}

            {/* Decision + artifact link row */}
            {(decision || outputFile) && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', paddingLeft: '30px', marginTop: '4px' }}>
                {decision && (
                  <div style={{ flex: 1, fontSize: '11px', color: '#4ade8077', lineHeight: 1.5, fontStyle: 'italic' }}>
                    "{decision}"
                  </div>
                )}
                {outputFile && (
                  <button
                    onClick={() => router.push('/improve')}
                    style={{
                      flexShrink: 0, fontSize: '9px', padding: '2px 7px',
                      backgroundColor: '#0a1f0e', color: '#4ade80',
                      border: '1px solid #4ade8033', borderRadius: '2px',
                      cursor: 'pointer', ...MONO, letterSpacing: '0.06em',
                    }}
                    title={`Open ${outputFile} in Studio`}
                  >
                    ◈ STUDIO
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Blueprint tab ─────────────────────────────────────────────────────────────
function BlueprintTab({
  artifacts,
  runtime,
  MONO,
}: {
  artifacts: string[];
  runtime: ReturnType<typeof useRuntime>;
  MONO: React.CSSProperties;
}) {
  const formatName = (art: string) =>
    art.replace('.md', '').replace(/^\d+-/, '').replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());

  const staleCount   = runtime.state.staleArtifacts.size;
  const improvedCount = Object.values(runtime.state.artifactVersions).filter(v => v > 0).length;
  const pendingCount = ALL_ARTIFACTS.length - artifacts.length;

  const vitals: VitalSegment[] = [
    { label: 'Generated', value: `${artifacts.length}/15`, tone: artifacts.length === 15 ? 'emerald' : 'neutral' },
    { label: 'Stale',     value: String(staleCount),        tone: staleCount > 0 ? 'caution' : 'neutral'          },
    { label: 'Improved',  value: String(improvedCount),     tone: improvedCount > 0 ? 'emerald' : 'neutral'       },
    { label: 'Pending',   value: String(pendingCount),      tone: pendingCount > 0 ? 'neutral' : 'emerald'        },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* VitalsBand — compact status summary using viz primitive */}
      <div style={{ padding: '8px 16px', flexShrink: 0, borderBottom: '1px solid #0a1a2e', backgroundColor: '#020c06' }}>
        <VitalsBand segments={vitals} />
      </div>

      {/* Artifact list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {ALL_ARTIFACTS.map((art, idx) => {
          const isGenerated = artifacts.some(f => f === art || f.startsWith(art.split('.')[0]));
          const isStale     = runtime.state.staleArtifacts.has(art);
          const version     = runtime.state.artifactVersions[art] ?? 0;
          const isImproved  = version > 0;
          const upstream    = ARTIFACT_DEPS[art] ?? [];
          const downstream  = getDirectDownstream(art);

          const dotColor = isStale ? '#f59e0b' : isImproved ? '#818cf8' : isGenerated ? '#4ade80' : '#1e293b';
          const nameColor = isStale ? '#f59e0b' : isImproved ? '#818cf8' : isGenerated ? '#94a3b8' : '#334155';

          return (
            <div
              key={art}
              style={{
                display: 'grid',
                gridTemplateColumns: '20px 1fr auto',
                alignItems: 'start',
                gap: '8px',
                padding: '8px 10px',
                backgroundColor: isStale ? '#0a080022' : isImproved ? '#0a0b1a' : '#020c06',
                border: `1px solid ${isStale ? '#f59e0b22' : isImproved ? '#818cf822' : '#0a1a2e'}`,
                borderRadius: '3px',
                transition: 'background-color 200ms ease',
              }}
            >
              {/* Status dot */}
              <div style={{ paddingTop: '3px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <div style={{
                  width: '7px', height: '7px', borderRadius: '50%', backgroundColor: dotColor, flexShrink: 0,
                  ...(isStale ? { animation: 'blink 2s infinite' } : {}),
                }} />
                <div style={{ fontSize: '8px', color: '#1e293b', ...MONO }}>{idx}</div>
              </div>

              {/* Name + deps */}
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                  <span style={{ fontSize: '12px', color: nameColor, fontWeight: isImproved ? 700 : 400 }}>
                    {formatName(art)}
                  </span>
                  {isImproved && (
                    <span style={{ fontSize: '8px', color: '#818cf8', padding: '1px 4px', border: '1px solid #818cf833', borderRadius: '2px', ...MONO }}>
                      v{version}
                    </span>
                  )}
                  {isStale && (
                    <span style={{ fontSize: '8px', color: '#f59e0b', padding: '1px 4px', border: '1px solid #f59e0b33', borderRadius: '2px', ...MONO }}>
                      STALE
                    </span>
                  )}
                </div>

                {/* Upstream deps */}
                {upstream.length > 0 && (
                  <div style={{ fontSize: '10px', color: '#475569', lineHeight: 1.5 }}>
                    <span style={{ color: '#1e293b' }}>↑ </span>
                    {upstream.map(dep => (
                      <span key={dep} style={{ marginRight: '6px' }}>
                        {formatName(dep)}
                      </span>
                    ))}
                  </div>
                )}

                {/* Downstream */}
                {downstream.length > 0 && (
                  <div style={{ fontSize: '10px', color: '#334155', lineHeight: 1.5 }}>
                    <span style={{ color: '#1e293b' }}>↓ </span>
                    {downstream.map(dep => {
                      const depStale = runtime.state.staleArtifacts.has(dep);
                      return (
                        <span key={dep} style={{ marginRight: '6px', color: depStale ? '#f59e0b88' : '#334155' }}>
                          {formatName(dep)}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right: stale/none */}
              <div style={{ fontSize: '8px', color: dotColor, letterSpacing: '0.06em', ...MONO, paddingTop: '2px', textAlign: 'right' as const }}>
                {isStale ? 'STALE' : isImproved ? 'IMPROVED' : isGenerated ? 'GEN' : '—'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MissionControlPage() {
  const runtime  = useRuntime();
  const router   = useRouter();
  const { state: { settings } } = useGlobalStore();
  const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono','Fira Code',monospace" };

  const [artifacts,    setArtifacts]    = useState<string[]>([]);
  const [currentStage, setCurrentStage] = useState(0);
  const [mcTab,        setMcTab]        = useState<MCTab>('overview');
  const [dashTab,      setDashTab]      = useState<DashTab>('STATUS');
  const [phaserConfig, setPhaserConfig] = useState<OfficeSceneConfig>({ agents: [] });
  // SSE state
  const [isRunning,    setIsRunning]    = useState<boolean | null>(null);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const [journeyState, setJourneyState] = useState<{
    currentStage: number;
    stages: Record<string, any>;
    agentsByStage: Record<string, string[]>;
  }>({ currentStage: 0, stages: {}, agentsByStage: {} });
  const logEndRef = useRef<HTMLDivElement>(null);

  // Artifact + stage polling
  useEffect(() => {
    const refresh = () => {
      fetch('/api/data').then(r => r.json()).then(d => {
        setArtifacts(d.artifacts ?? []);
        setCurrentStage(d.currentStage ?? 0);
      }).catch(() => {});
    };
    refresh();
    const id = setInterval(refresh, 4000);
    return () => clearInterval(id);
  }, []);

  // /api/run polling — drives SSE subscription
  useEffect(() => {
    let cancelled = false;
    const poll = () => {
      fetch('/api/run').then(r => r.json()).then(d => {
        if (cancelled) return;
        setIsRunning(d.isRunning ?? false);
        if (d.isRunning) {
          if (d.currentStage != null) setCurrentStage(d.currentStage);
          if (d.currentAgent != null) setCurrentAgent(d.currentAgent);
        }
      }).catch(() => {});
    };
    poll();
    const id = setInterval(poll, isRunning ? 2000 : 4000);
    return () => { cancelled = true; clearInterval(id); };
  }, [isRunning]);

  // SSE subscription — mirrors StatusBar.tsx.
  // onerror intentionally empty: browser auto-reconnects (Mission 8 Bug Fix 2).
  useEffect(() => {
    if (!isRunning) {
      if (esRef.current) { esRef.current.close(); esRef.current = null; }
      setCurrentAgent(null);
      return;
    }
    if (esRef.current) return; // already open

    const es = new EventSource('/api/stream');
    esRef.current = es;

    es.onmessage = (evt) => {
      let data: { type: string; stage?: number; agent?: string };
      try { data = JSON.parse(evt.data) as typeof data; } catch { return; }

      switch (data.type) {
        case 'stage_start':
          if (typeof data.stage === 'number') setCurrentStage(data.stage);
          setCurrentAgent(null);
          break;
        case 'agent_active':
          setCurrentAgent(data.agent ?? null);
          break;
        case 'stage_retry':
          setCurrentAgent(null);
          break;
        case 'run_complete':
        case 'run_stopped':
          setCurrentAgent(null);
          es.close();
          esRef.current = null;
          break;
        default:
          break;
      }
    };

    es.onerror = () => {
      // Do NOT call es.close() — browser retries automatically per EventSource spec.
    };

    return () => { es.close(); esRef.current = null; };
  }, [isRunning]);

  // Phaser agent config
  useEffect(() => {
    const agents: AgentData[] = AGENT_DEFS.map(def => ({
      id:    def.id,
      name:  def.name,
      color: def.color,
      state: deriveAgentState(def.id, artifacts, runtime),
      stale: def.stages.some(s => {
        const art = ALL_ARTIFACTS.find(a => parseInt(a.split('-')[0], 10) === s);
        return art ? runtime.state.staleArtifacts.has(art) : false;
      }),
    }));
    setPhaserConfig({ agents });
  }, [artifacts, runtime.state.staleArtifacts, runtime.state.artifactVersions]);

  // Auto-scroll event feed
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [runtime.state.events.length]);

  // Journey-state polling
  useEffect(() => {
    const load = () => fetch('/api/journey-state').then(r => r.json())
      .then(d => setJourneyState({
        currentStage: d.currentStage ?? 0,
        stages: d.stages ?? {},
        agentsByStage: d.agentsByStage ?? {},
      }))
      .catch(() => {});
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, []);

  const staleCount    = runtime.state.staleArtifacts.size;
  const improvements  = runtime.state.improvementCount;
  const sessionTokens = runtime.state.sessionTokens;
  const sessionCost   = runtime.state.sessionCost;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      backgroundColor: 'var(--ig-canvas)', overflow: 'hidden', ...MONO, color: '#94a3b8',
    }}>
      <style>{`
        ::-webkit-scrollbar { width: 3px }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px }
        @keyframes pulse { 0%,100%{ opacity:.5 } 50%{ opacity:1 } }
        @keyframes blink { 0%,100%{ opacity:1 } 50%{ opacity:0 } }
      `}</style>

      {/* ── Page header strip ── */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '0 14px',
        height: '44px', backgroundColor: '#020c06',
        borderBottom: '1px solid #0a1a2e', flexShrink: 0, gap: '10px',
      }}>
        <div style={{ fontSize: '13px', color: '#4ade80', fontWeight: 700, letterSpacing: '0.12em' }}>
          MISSION CONTROL
        </div>
        <div style={{ fontSize: '13px', color: '#1a3a20', letterSpacing: '0.06em' }}>IDEAGATE MOS</div>
        <div style={{ width: '1px', height: '24px', backgroundColor: '#0a1a2e' }} />

        {/* Agent health chips */}
        {AGENT_DEFS.map(def => {
          const state = deriveAgentState(def.id, artifacts, runtime);
          const col   = STATE_COLOR[state];
          return (
            <div
              key={def.id}
              title={`${def.fullName} — ${def.role}`}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '3px 8px', backgroundColor: '#040b14',
                border: `1px solid ${col}33`, borderRadius: '3px', cursor: 'default',
              }}
            >
              <div style={{
                width: '5px', height: '5px', borderRadius: '50%', backgroundColor: col,
                ...(state === 'stale'   ? { animation: 'blink 2s infinite'  } :
                    state === 'working' ? { animation: 'pulse 1.5s infinite' } : {}),
              }} />
              <span style={{ fontSize: '12px', color: col, fontWeight: 700 }}>{def.id}</span>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>{def.name}</span>
              <span style={{ fontSize: '8px', color: `${col}88`, marginLeft: '2px' }}>● {STATE_LABEL[state]}</span>
            </div>
          );
        })}

        <div style={{ flex: 1 }} />

        {/* Runtime telemetry */}
        <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: '#94a3b8' }}>
          {improvements > 0 && <span><span style={{ color: '#4ade80', fontWeight: 700 }}>{improvements}</span> improved</span>}
          {staleCount > 0 && <span style={{ animation: 'blink 2s infinite' }}><span style={{ color: '#f59e0b', fontWeight: 700 }}>{staleCount}</span> stale</span>}
          {sessionTokens > 0 && <span><span style={{ color: '#818cf8' }}>{sessionTokens.toLocaleString()}</span>t · <span style={{ color: '#4ade80' }}>${sessionCost.toFixed(3)}</span></span>}
        </div>

        {/* Stage indicator */}
        <div style={{ fontSize: '12px', color: '#94a3b8', padding: '3px 8px', border: '1px solid #1e293b', borderRadius: '2px' }}>
          {currentStage}/14 · {currentStage >= 14 ? <span style={{ color: '#4ade80' }}>COMPLETE</span> : <span style={{ color: '#818cf8' }}>RUNNING</span>}
        </div>
      </div>

      {/* ── Sub-nav tab bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '0 14px', height: '36px',
        backgroundColor: '#020c06', borderBottom: '1px solid #0a1a2e',
        flexShrink: 0, gap: '0',
      }}>
        {/* Active tabs */}
        {MC_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setMcTab(tab.id)}
            style={{
              padding: '0 14px', height: '36px', border: 'none', cursor: 'pointer',
              background: 'transparent', ...MONO, fontSize: '11px',
              letterSpacing: '0.06em', color: mcTab === tab.id ? '#4ade80' : '#475569',
              borderBottom: mcTab === tab.id ? '2px solid #4ade80' : '2px solid transparent',
              transition: 'color 150ms ease, border-color 150ms ease',
            }}
            onMouseEnter={e => { if (mcTab !== tab.id) (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
            onMouseLeave={e => { if (mcTab !== tab.id) (e.currentTarget as HTMLElement).style.color = '#475569'; }}
          >
            {tab.label}
          </button>
        ))}

        <div style={{ width: '1px', height: '16px', backgroundColor: '#0a1a2e', margin: '0 8px' }} />

        {/* Disabled future tabs */}
        {DISABLED_TABS.map(label => (
          <button
            key={label}
            disabled
            title="Coming soon"
            style={{
              padding: '0 12px', height: '36px', border: 'none', cursor: 'not-allowed',
              background: 'transparent', ...MONO, fontSize: '11px',
              letterSpacing: '0.06em', color: '#1e293b',
              borderBottom: '2px solid transparent', opacity: 0.6,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}

      {/* OVERVIEW TAB — OrchestrationGraph + ExecutionSummary + Active Agent + LiveLogStream */}
      {mcTab === 'overview' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#020c06' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', flex: '0 0 auto' }}>
              <div style={{ flex: 2 }}>
                <OrchestrationGraph
                  agents={AGENT_DEFS as any}
                  stages={journeyState.stages}
                  currentStage={currentStage}
                  agentsByStage={journeyState.agentsByStage}
                />
              </div>
              <div style={{ flex: 1 }}>
                <ExecutionSummary
                  stages={journeyState.stages}
                  currentStage={currentStage}
                />
              </div>
            </div>

            {/* Active agent indicator */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '5px 10px',
              backgroundColor: '#040b14', border: '1px solid #0a1a2e', borderRadius: '3px', flexShrink: 0,
            }}>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                backgroundColor: isRunning && currentAgent ? '#818cf8' : '#1e293b',
                ...(isRunning && currentAgent ? { animation: 'pulse 1.5s infinite' } : {}),
              }} />
              <span style={{ fontSize: '12px', color: '#2a5a30', letterSpacing: '0.08em', fontWeight: 700, flexShrink: 0 }}>
                ACTIVE AGENT
              </span>
              <span style={{ fontSize: '12px', color: isRunning && currentAgent ? '#818cf8' : '#94a3b8' }}>
                {isRunning && currentAgent
                  ? (SSE_AGENT_DISPLAY[currentAgent] ?? currentAgent)
                  : isRunning ? '—' : 'No run active'}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#94a3b8', flexShrink: 0 }}>
                {isRunning
                  ? `Stage ${currentStage}: ${STAGE_LABEL[currentStage] ?? 'Complete'}`
                  : currentStage >= 14 ? 'Complete' : '—'}
              </span>
            </div>

            <div style={{ flex: 1, overflow: 'hidden' }}>
              <LiveLogStream events={runtime.state.events} maxItems={20} />
            </div>
          </div>
        </div>
      )}

      {/* LIVE TAB — Phaser canvas + Mission Control sidebar */}
      {mcTab === 'live' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

            {/* Phaser canvas */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              <PhaserGame agents={phaserConfig.agents} currentStage={currentStage} />

              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '6px 16px', backgroundColor: '#020c0699',
                backdropFilter: 'blur(2px)', borderTop: '1px solid #0a1a2e',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', color: '#2a5a30', letterSpacing: '0.1em', fontWeight: 700 }}>
                    LIFECYCLE · {currentStage}/14 · {STAGE_LABEL[currentStage]}
                  </span>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>{artifacts.length} artifacts generated</span>
                </div>
                <LifecycleStrip
                  currentStage={currentStage}
                  versions={runtime.state.artifactVersions}
                  stale={runtime.state.staleArtifacts}
                />
              </div>
            </div>

            {/* Dashboard sidebar */}
            <div style={{
              width: '295px', flexShrink: 0, borderLeft: '1px solid #0a1a2e',
              display: 'flex', flexDirection: 'column', backgroundColor: '#020c06',
            }}>
              <div style={{ padding: '10px 12px 0', borderBottom: '1px solid #0a1a2e', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#2a5a30', letterSpacing: '0.12em', fontWeight: 700 }}>DASHBOARD</div>
                  {(() => {
                    const key    = settings.defaultModel;
                    const meta   = getModelMeta(key);
                    const isFree = isModelFree(key);
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: '#94a3b8' }}>
                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: isFree ? '#84cc16' : '#4ade80', flexShrink: 0 }} />
                        <span style={{ ...MONO }}>{meta?.label ?? key}</span>
                        {isFree && <span style={{ fontSize: '7px', color: '#4ade80', fontWeight: 700 }}>FREE</span>}
                      </div>
                    );
                  })()}
                </div>
                <div style={{ display: 'flex', gap: '0' }}>
                  {(['STATUS', 'AGENTS', 'FEED', 'CONTROLS'] as DashTab[]).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setDashTab(tab)}
                      style={{
                        padding: '5px 8px', fontSize: '13px', borderRadius: 0, border: 'none', cursor: 'pointer',
                        ...MONO, backgroundColor: 'transparent',
                        color: dashTab === tab ? '#4ade80' : '#94a3b8',
                        borderBottom: dashTab === tab ? '1px solid #4ade80' : '1px solid #1e293b',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>

                {/* STATUS */}
                {dashTab === 'STATUS' && (
                  <div>
                    <CoordinatorStation
                      currentStage={currentStage}
                      events={runtime.state.events}
                      improvements={improvements}
                      staleCount={staleCount}
                    />
                    <div style={{ fontSize: '12px', color: '#2a5a30', letterSpacing: '0.1em', marginBottom: '7px', fontWeight: 700 }}>SYSTEM HEALTH</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px' }}>
                      {[
                        { l: 'Active',   v: '0/6',                  c: '#94a3b8' },
                        { l: 'Complete', v: '6/6',                  c: '#4ade80' },
                        { l: 'Stale',    v: String(staleCount),     c: staleCount > 0 ? '#f59e0b' : '#94a3b8' },
                        { l: 'Progress', v: currentStage >= 14 ? '100%' : `${Math.round((currentStage / 14) * 100)}%`, c: '#4ade80' },
                      ].map(x => (
                        <div key={x.l} style={{ padding: '7px', backgroundColor: '#040b14', border: '1px solid #0a1a2e', borderRadius: '3px', textAlign: 'center' as const }}>
                          <div style={{ fontSize: '17px', color: x.c, fontWeight: 700, ...MONO }}>{x.v}</div>
                          <div style={{ fontSize: '8px', color: '#94a3b8', marginTop: '2px' }}>{x.l}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: '13px', color: '#2a5a30', letterSpacing: '0.1em', marginBottom: '5px', fontWeight: 700 }}>LIFECYCLE</div>
                    <div style={{ height: '5px', backgroundColor: '#0a1a2e', borderRadius: '3px', marginBottom: '10px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, (currentStage / 14) * 100)}%`, backgroundColor: '#4ade80', borderRadius: '3px', transition: 'width 0.5s' }} />
                    </div>
                    <div style={{ fontSize: '13px', color: '#2a5a30', letterSpacing: '0.1em', marginBottom: '5px', fontWeight: 700 }}>ARTIFACTS</div>
                    <div style={{ padding: '6px 8px', backgroundColor: '#040b14', border: '1px solid #4ade8022', borderRadius: '3px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#4ade80', fontWeight: 700 }}>{artifacts.length} generated</span>
                      {improvements > 0 && <span style={{ fontSize: '13px', color: '#818cf8' }}>{improvements} improved</span>}
                    </div>
                    {sessionTokens > 0 && (
                      <>
                        <div style={{ fontSize: '13px', color: '#2a5a30', letterSpacing: '0.1em', marginBottom: '5px', fontWeight: 700 }}>SESSION TELEMETRY</div>
                        <div style={{ padding: '8px', backgroundColor: '#040b14', border: '1px solid #0a1a2e', borderRadius: '3px', fontSize: '12px', lineHeight: 1.9 }}>
                          <div>Tokens: <span style={{ color: '#818cf8' }}>{sessionTokens.toLocaleString()}</span></div>
                          <div>Cost: <span style={{ color: '#4ade80' }}>${sessionCost.toFixed(4)}</span></div>
                          <div>Improvements: <span style={{ color: '#4ade80' }}>{improvements}</span></div>
                          <div>Stale nodes: <span style={{ color: staleCount > 0 ? '#f59e0b' : '#94a3b8' }}>{staleCount}</span></div>
                        </div>
                      </>
                    )}
                    <div style={{ marginTop: '10px', padding: '7px 8px', backgroundColor: '#040b14', border: '1px solid #4ade8022', borderRadius: '3px' }}>
                      <div style={{ fontSize: '12px', color: '#4ade80', fontWeight: 700 }}>
                        ► {currentStage >= 14 ? 'LIFECYCLE COMPLETE' : 'ORCHESTRATION ACTIVE'}
                      </div>
                      {staleCount > 0 && <div style={{ fontSize: '13px', color: '#f59e0b', marginTop: '2px', animation: 'blink 2s infinite' }}>△ {staleCount} artifact{staleCount > 1 ? 's' : ''} stale — review in DESK or REFINE</div>}
                      {improvements > 0 && <div style={{ fontSize: '13px', color: '#818cf8', marginTop: '2px' }}>◈ {improvements} improvement{improvements > 1 ? 's' : ''} — BroadcastChannel active</div>}
                    </div>
                  </div>
                )}

                {/* AGENTS */}
                {dashTab === 'AGENTS' && (
                  <div>
                    {AGENT_DEFS.map(def => {
                      const state     = deriveAgentState(def.id, artifacts, runtime);
                      const col       = STATE_COLOR[state];
                      const ownedArts = ALL_ARTIFACTS.filter(a => def.stages.includes(parseInt(a.split('-')[0], 10) as never));
                      const improved  = ownedArts.filter(a => (runtime.state.artifactVersions[a] ?? 0) > 0);
                      const stale     = ownedArts.filter(a => runtime.state.staleArtifacts.has(a));
                      const reasoning = ownedArts.flatMap(a => runtime.getReasoningFor(a)).slice(0, 1)[0];
                      return (
                        <div key={def.id} style={{ marginBottom: '8px', padding: '9px', backgroundColor: '#040b14', border: `1px solid ${col}22`, borderRadius: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px' }}>
                            <div style={{
                              width: '7px', height: '7px', borderRadius: '50%', backgroundColor: col, flexShrink: 0,
                              ...(state === 'stale' ? { animation: 'blink 2s infinite' } : state === 'working' ? { animation: 'pulse 1.5s infinite' } : {}),
                            }} />
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: '13px', color: col, fontWeight: 700 }}>{def.id}</span>
                              <span style={{ fontSize: '13px', color: '#94a3b8', marginLeft: '6px' }}>{def.fullName}</span>
                            </div>
                            <span style={{ fontSize: '8px', color: `${col}99`, padding: '2px 5px', border: `1px solid ${col}33`, borderRadius: '2px' }}>{STATE_LABEL[state]}</span>
                          </div>
                          <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '5px', lineHeight: 1.5 }}>{def.role}</div>
                          <div style={{ fontSize: '13px', color: '#1e293b', marginBottom: '4px' }}>
                            Stages: {def.stages.join(', ')} · Zone: {def.zone}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', fontSize: '13px', marginBottom: '4px' }}>
                            {improved.length > 0 && <span style={{ color: '#4ade8066' }}>{improved.length} improved</span>}
                            {stale.length > 0 && <span style={{ color: '#f59e0b88' }}>{stale.length} stale</span>}
                            <span style={{ color: '#1e293b' }}>{ownedArts.length} owned artifacts</span>
                          </div>
                          {reasoning && (
                            <div style={{ marginTop: '5px', padding: '5px 7px', backgroundColor: '#020c06', border: '1px solid #4ade8011', borderRadius: '3px', fontSize: '8px', color: '#4ade8077', lineHeight: 1.5 }}>
                              {reasoning.reasoning.slice(0, 90)}…
                            </div>
                          )}
                          {!reasoning && (
                            <div style={{ marginTop: '4px', fontSize: '8px', color: '#1e293b' }}>
                              Execution trace available in V3.2 (requires tool_use migration)
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* FEED */}
                {dashTab === 'FEED' && (
                  <div>
                    <div style={{ fontSize: '13px', color: '#2a5a30', letterSpacing: '0.1em', marginBottom: '7px', fontWeight: 700 }}>
                      RUNTIME EVENT FEED · {runtime.state.events.length} events
                      <span style={{ color: '#1e293b', fontWeight: 400, marginLeft: '6px' }}>BroadcastChannel</span>
                    </div>
                    {runtime.state.events.length === 0 && (
                      <div style={{ fontSize: '12px', color: '#1e293b', lineHeight: 1.7, padding: '6px 0' }}>
                        No events yet.<br />Improve an artifact in the REFINE view.<br />Events appear here in real-time.
                      </div>
                    )}
                    {runtime.state.events.map((ev, i) => {
                      const art      = ev.payload.artifact as string ?? '';
                      const artLabel = art ? art.replace('.md', '').replace(/^\d+-/, '').replace(/-/g, ' ') : '';
                      const evColor  = ev.type === 'ARTIFACT_IMPROVED' ? '#4ade80' : ev.type === 'ARTIFACTS_STALE' ? '#f59e0b' : ev.type === 'MODEL_ROUTED' ? '#818cf8' : '#94a3b8';
                      return (
                        <div key={ev.id ?? i} style={{ padding: '5px 0', borderBottom: '1px solid #060e09', display: 'flex', gap: '7px' }}>
                          <div style={{ flexShrink: 0 }}>
                            <div style={{ fontSize: '8px', color: '#1a3a20' }}>{new Date(ev.timestamp).toLocaleTimeString('en', { hour12: false })}</div>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', color: evColor, fontWeight: 700 }}>{ev.type.replace(/_/g, ' ')}</div>
                            {artLabel && <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{artLabel}</div>}
                            {ev.payload.model != null && <div style={{ fontSize: '8px', color: '#1e293b' }}>{String(ev.payload.model)}</div>}
                            {ev.payload.tokens != null && <div style={{ fontSize: '8px', color: '#94a3b8' }}>{String(ev.payload.tokens).toLocaleString()}t</div>}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={logEndRef} />
                  </div>
                )}

                {/* CONTROLS */}
                {dashTab === 'CONTROLS' && (
                  <div>
                    <div style={{ fontSize: '12px', color: '#2a5a30', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: 700 }}>RUNTIME CONTROLS</div>
                    {staleCount > 0 && (
                      <div style={{ marginBottom: '10px', padding: '9px', backgroundColor: '#0a080022', border: '1px solid #f59e0b33', borderRadius: '3px' }}>
                        <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 700, marginBottom: '5px', animation: 'blink 2s infinite' }}>△ {staleCount} STALE ARTIFACTS</div>
                        <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '7px', lineHeight: 1.6 }}>Downstream artifacts marked stale following improvements.</div>
                        {Array.from(runtime.state.staleArtifacts).map(a => (
                          <div key={a} style={{ fontSize: '13px', color: '#f59e0b88', marginBottom: '2px' }}>△ {a.replace('.md', '').replace(/^\d+-/, '').replace(/-/g, ' ')}</div>
                        ))}
                        <button
                          onClick={() => runtime.clearStale()}
                          style={{ marginTop: '7px', width: '100%', padding: '6px', fontSize: '13px', cursor: 'pointer', ...MONO, backgroundColor: '#0a0800', color: '#f59e0b', outline: '1px solid #f59e0b33', border: 'none', borderRadius: '3px', letterSpacing: '0.06em' }}
                        >
                          ○ CLEAR ALL STALE
                        </button>
                      </div>
                    )}
                    <div style={{ marginBottom: '8px', padding: '8px', backgroundColor: '#040b14', border: '1px solid #0a1a2e', borderRadius: '3px' }}>
                      <div style={{ fontSize: '13px', color: '#2a5a30', fontWeight: 700, marginBottom: '5px', letterSpacing: '0.06em' }}>ARTIFACT GRAPH</div>
                      <div style={{ fontSize: '13px', lineHeight: 1.9, color: '#94a3b8' }}>
                        <div>Total nodes: <span style={{ color: '#94a3b8' }}>15</span></div>
                        <div>Improved: <span style={{ color: '#4ade80' }}>{Object.keys(runtime.state.artifactVersions).length}</span></div>
                        <div>Stale: <span style={{ color: '#f59e0b' }}>{staleCount}</span></div>
                        <div>Reasoning: <span style={{ color: '#818cf8' }}>{runtime.state.reasoningChain.length} entries</span></div>
                        <div>Events: <span style={{ color: '#38bdf8' }}>{runtime.state.events.length}</span></div>
                      </div>
                    </div>
                    <div style={{ marginBottom: '8px', padding: '8px', backgroundColor: '#040b14', border: '1px solid #4ade8022', borderRadius: '3px' }}>
                      <div style={{ fontSize: '13px', color: '#4ade8088', marginBottom: '3px' }}>● ideagate-runtime active</div>
                      <div style={{ fontSize: '8px', color: '#94a3b8', lineHeight: 1.5 }}>All open tabs receive events via BroadcastChannel. Improve in REFINE — this feed updates without refresh.</div>
                    </div>
                    <button onClick={() => router.push('/improve')} style={{ width: '100%', padding: '9px', fontSize: '12px', cursor: 'pointer', ...MONO, backgroundColor: '#0a1f0e', color: '#4ade80', outline: '1px solid #4ade8033', border: 'none', borderRadius: '3px', letterSpacing: '0.08em', marginBottom: '5px' }}>
                      ◈ OPEN STUDIO
                    </button>
                    <button onClick={() => router.push('/desk')} style={{ width: '100%', padding: '9px', fontSize: '12px', cursor: 'pointer', ...MONO, backgroundColor: '#0a0f1e', color: '#818cf8', outline: '1px solid #818cf833', border: 'none', borderRadius: '3px', letterSpacing: '0.08em' }}>
                      ◈ OPEN ARTIFACT DESK
                    </button>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      )}

      {/* JOURNEY TAB */}
      {mcTab === 'journey' && (
        <div style={{ flex: 1, overflow: 'hidden', backgroundColor: '#020c06' }}>
          <JourneyTab
            journeyState={journeyState}
            currentStage={currentStage}
            router={router}
            MONO={MONO}
          />
        </div>
      )}

      {/* BLUEPRINT TAB */}
      {mcTab === 'blueprint' && (
        <div style={{ flex: 1, overflow: 'hidden', backgroundColor: '#020c06' }}>
          <BlueprintTab
            artifacts={artifacts}
            runtime={runtime}
            MONO={MONO}
          />
        </div>
      )}
    </div>
  );
}
