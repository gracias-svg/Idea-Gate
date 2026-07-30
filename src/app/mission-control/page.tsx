'use client';

// src/app/mission-control/page.tsx
// IdeaGate — Mission Control
// Mission 11: OrchestrationGraph always visible above two tabs:
//   Intelligence & Quality · Insights & Performance

import { useState, useEffect, useRef } from 'react';
import { useRuntime, ARTIFACT_DEPS } from '@/lib/RuntimeContext';
import OrchestrationGraph from '@/components/office/OrchestrationGraph';
import ExecutionSummary   from '@/components/office/ExecutionSummary';

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
  { id: 'CO', name: 'Coordinator',  fullName: 'PM Coordinator',      color: '#34d399', stages: [0, 6, 11], role: 'Lifecycle orchestration · quality gating · stage advancement' },
  { id: 'PS', name: 'Product Strat',fullName: 'Product Strategist',  color: '#818cf8', stages: [1, 7, 12], role: 'Discovery · PRD · implementation planning' },
  { id: 'RE', name: 'Researcher',   fullName: 'Research Lead',       color: '#38bdf8', stages: [2, 9],     role: 'Problem definition · usability planning' },
  { id: 'UX', name: 'UX Designer',  fullName: 'UX Designer',         color: '#f472b6', stages: [3, 8],     role: 'Solution design · UX specification' },
  { id: 'AR', name: 'Architect',    fullName: 'Principal Architect',  color: '#fb923c', stages: [4, 10, 14],role: 'MVP hypothesis · architecture · prototype prompt' },
  { id: 'QA', name: 'QA Engineer',  fullName: 'QA Engineer',         color: '#c084fc', stages: [5, 13],    role: 'Validation strategy · QA readiness' },
] as const;

const SSE_AGENT_DISPLAY: Record<string, string> = {
  ProductStrategyAgent: 'Product Strategy Agent',
  ResearchAgent:        'Research Agent',
  DataAgent:            'Data Agent',
  UXAgent:              'UX Design Agent',
  ArchitectAgent:       'Architect Agent',
  CodeAgent:            'Code Agent',
  QAAgent:              'QA Agent',
};

type MCTab = 'intelligence' | 'insights';

const MC_TABS: { id: MCTab; label: string }[] = [
  { id: 'intelligence', label: 'Intelligence & Quality'   },
  { id: 'insights',     label: 'Insights & Performance'   },
];

const STATE_COLOR: Record<string, string> = {
  done: '#4ade80', working: '#818cf8', stale: '#f59e0b', blocked: '#f87171', idle: '#94a3b8',
};
const STATE_LABEL: Record<string, string> = {
  done: 'DONE', working: 'WORKING', stale: 'STALE', blocked: 'BLOCKED', idle: 'IDLE',
};

// ── Confidence helpers ────────────────────────────────────────────────────────
const CONF_SCORE: Record<string, number> = { high: 90, medium: 70, low: 40 };
const CONF_COLOR: Record<string, string> = {
  high: '#4ade80', medium: '#f59e0b', low: '#f87171',
};

// Normalize conflicts — field is array OR string depending on the stage/run.
// Strings starting with "No " indicate no conflicts (QA sign-off phrasing).
function getConflicts(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((c): c is string => typeof c === 'string' && c.trim().length > 0);
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s || s.toLowerCase().startsWith('no ')) return [];
    return [s];
  }
  return [];
}

// ── Agent state derivation (header chips) ────────────────────────────────────
function deriveAgentState(agentId: string, artifacts: string[], runtime: ReturnType<typeof useRuntime>): 'idle' | 'done' | 'working' | 'stale' | 'blocked' {
  const def = AGENT_DEFS.find(a => a.id === agentId);
  if (!def) return 'idle';
  const ownedArts  = ALL_ARTIFACTS.filter(art => def.stages.includes(parseInt(art.split('-')[0], 10) as never));
  const isStale    = ownedArts.some(art => runtime.state.staleArtifacts.has(art));
  const hasImproved = ownedArts.some(art => (runtime.state.artifactVersions[art] ?? 0) > 0);
  const hasArtifact = ownedArts.some(art => artifacts.some(f => f === art || f.startsWith(art.split('.')[0])));
  if (isStale)     return 'stale';
  if (hasImproved) return 'working';
  if (hasArtifact) return 'done';
  return 'idle';
}

// ── Duration formatter ────────────────────────────────────────────────────────
function fmtDuration(ms: number): string {
  if (ms < 1000)  return '<1s';
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  const m = Math.floor(ms / 60000);
  const s = Math.round((ms % 60000) / 1000);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

// ── Section heading ───────────────────────────────────────────────────────────
function SectionHead({ label, MONO }: { label: string; MONO: React.CSSProperties }) {
  return (
    <div style={{ fontSize: '11px', color: '#2a5a30', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '10px', ...MONO }}>
      {label}
    </div>
  );
}

// ── Future-feature placeholder ────────────────────────────────────────────────
function ComingSoon({ label, MONO }: { label: string; MONO: React.CSSProperties }) {
  return (
    <div style={{ padding: '10px 12px', border: '1px solid #0a1a2e', borderRadius: '3px', fontSize: '11px', color: '#334155', ...MONO }}>
      {label}
    </div>
  );
}

// ── T1: Intelligence & Quality tab ───────────────────────────────────────────
function IntelligenceTab({
  journeyState,
  currentStage,
  MONO,
}: {
  journeyState: { currentStage: number; stages: Record<string, any>; agentsByStage: Record<string, string[]> };
  currentStage: number;
  MONO: React.CSSProperties;
}) {
  const [expandedStage, setExpandedStage] = useState<number | null>(null);
  const hasData = Object.keys(journeyState.stages).length > 0;

  // Section 1: Trust score
  const stageScores = Array.from({ length: 15 }, (_, i) => {
    const conf = journeyState.stages[String(i)]?.confidence as string | undefined;
    return CONF_SCORE[conf ?? ''] ?? 0;
  });
  const trustScore    = Math.round(stageScores.reduce((a, b) => a + b, 0) / 15);
  const highCount     = stageScores.filter(s => s === 90).length;
  const medCount      = stageScores.filter(s => s === 70).length;
  const lowCount      = stageScores.filter(s => s === 40).length;
  const missingCount  = stageScores.filter(s => s === 0).length;

  const trustColor = trustScore >= 80 ? '#4ade80' : trustScore >= 60 ? '#f59e0b' : '#f87171';

  // Section 3: Stages with real conflicts
  const conflictStages = Array.from({ length: 15 }, (_, i) => {
    const stage = journeyState.stages[String(i)];
    const conflicts = getConflicts(stage?.conflicts);
    return { i, name: STAGE_LABEL[i] ?? String(i), conflicts };
  }).filter(e => e.conflicts.length > 0);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Section 1: Journey Trust Score ── */}
      <div>
        <SectionHead label="JOURNEY TRUST SCORE" MONO={MONO} />
        {!hasData ? (
          <div style={{ fontSize: '12px', color: '#334155', ...MONO }}>No data yet. Run a lifecycle to see your Trust Score.</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '56px', fontWeight: 700, color: trustColor, lineHeight: 1, ...MONO }}>{trustScore}</div>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px', ...MONO }}>out of 100</div>
            </div>
            <div style={{ paddingBottom: '6px', fontSize: '11px', color: '#475569', lineHeight: 2, ...MONO }}>
              {highCount > 0 && <div><span style={{ color: '#4ade80', fontWeight: 700 }}>{highCount}</span> high confidence</div>}
              {medCount > 0  && <div><span style={{ color: '#f59e0b', fontWeight: 700 }}>{medCount}</span> medium confidence</div>}
              {lowCount > 0  && <div><span style={{ color: '#f87171', fontWeight: 700 }}>{lowCount}</span> low confidence</div>}
              {missingCount > 0 && <div><span style={{ color: '#334155', fontWeight: 700 }}>{missingCount}</span> missing</div>}
            </div>
          </div>
        )}
      </div>

      {/* ── Section 2: Stage validation table ── */}
      <div>
        <SectionHead label="STAGE VALIDATION" MONO={MONO} />
        {!hasData ? (
          <div style={{ fontSize: '12px', color: '#334155', ...MONO }}>Run a lifecycle to see stage validation data.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 56px 64px 60px', gap: '8px', padding: '4px 8px', fontSize: '9px', color: '#334155', letterSpacing: '0.08em', ...MONO }}>
              <span>#</span><span>STAGE</span><span>AGENT</span><span>CONFIDENCE</span><span>CONFLICTS</span>
            </div>

            {Array.from({ length: 15 }, (_, i) => {
              const key       = String(i);
              const stage     = journeyState.stages[key] as Record<string, any> | undefined;
              const agents    = journeyState.agentsByStage[key] ?? [];
              const conf      = stage?.confidence as string | undefined;
              const conflicts = getConflicts(stage?.conflicts);
              const reasoning = stage?.reasoning as string | undefined;
              const hasConflicts = conflicts.length > 0;
              const isExpanded   = expandedStage === i;
              const isDone = i < currentStage;
              const isActive = i === currentStage;

              return (
                <div key={i}>
                  <button
                    onClick={() => setExpandedStage(isExpanded ? null : i)}
                    style={{
                      display: 'grid', gridTemplateColumns: '32px 1fr 56px 64px 60px',
                      gap: '8px', padding: '6px 8px', width: '100%', textAlign: 'left',
                      border: `1px solid ${hasConflicts ? '#f59e0b22' : isActive ? '#818cf822' : '#0a1a2e'}`,
                      borderRadius: '3px', cursor: 'pointer',
                      backgroundColor: hasConflicts ? '#0a080011' : isActive ? '#040b14' : '#020c06',
                      transition: 'background-color 120ms ease',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = hasConflicts ? '#0a080022' : '#040b14'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = hasConflicts ? '#0a080011' : isActive ? '#040b14' : '#020c06'; }}
                  >
                    {/* # */}
                    <span style={{ fontSize: '10px', color: isDone ? '#4ade8066' : isActive ? '#818cf8' : '#334155', ...MONO, alignSelf: 'center' }}>{i}</span>
                    {/* Stage name */}
                    <span style={{ fontSize: '12px', color: isDone ? '#94a3b8' : isActive ? '#e2e8f0' : '#475569', alignSelf: 'center' }}>
                      {STAGE_LABEL[i]}
                    </span>
                    {/* Agent */}
                    <span style={{ fontSize: '9px', color: '#475569', ...MONO, alignSelf: 'center' }}>
                      {agents.length > 0
                        ? agents[0].replace('Agent', '').replace('ProductStrategy', 'PS').replace('Research', 'RE').replace('UX', 'UX').replace('Architect', 'AR').replace('QA', 'QA').replace('Coordinator', 'CO').replace(/\s/g, '')
                        : STAGE_AGENT[i]}
                    </span>
                    {/* Confidence */}
                    <span style={{ alignSelf: 'center' }}>
                      {conf ? (
                        <span style={{ fontSize: '9px', padding: '1px 5px', border: `1px solid ${CONF_COLOR[conf] ?? '#334155'}33`, borderRadius: '2px', color: CONF_COLOR[conf] ?? '#475569', ...MONO }}>
                          {conf}
                        </span>
                      ) : <span style={{ fontSize: '9px', color: '#1e293b', ...MONO }}>—</span>}
                    </span>
                    {/* Conflicts count */}
                    <span style={{ fontSize: '10px', color: hasConflicts ? '#f59e0b' : '#334155', fontWeight: hasConflicts ? 700 : 400, ...MONO, alignSelf: 'center' }}>
                      {stage ? (hasConflicts ? conflicts.length : '—') : '—'}
                    </span>
                  </button>

                  {/* Expanded reasoning */}
                  {isExpanded && reasoning && (
                    <div style={{
                      padding: '10px 12px 10px 40px',
                      backgroundColor: '#010a04', borderLeft: '2px solid #0a1a2e',
                      borderBottom: '1px solid #0a1a2e', borderRight: '1px solid #0a1a2e',
                      borderRadius: '0 0 3px 3px', marginTop: '-1px',
                    }}>
                      <div style={{ fontSize: '9px', color: '#2a5a30', letterSpacing: '0.08em', marginBottom: '5px', ...MONO }}>REASONING</div>
                      <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.7 }}>{reasoning}</div>
                    </div>
                  )}
                  {isExpanded && !reasoning && (
                    <div style={{ padding: '8px 12px 8px 40px', backgroundColor: '#010a04', borderLeft: '2px solid #0a1a2e', fontSize: '11px', color: '#334155', ...MONO }}>
                      No reasoning recorded for this stage.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Section 3: Contradictions ── */}
      <div>
        <SectionHead label="CONTRADICTIONS" MONO={MONO} />
        {!hasData ? (
          <div style={{ fontSize: '12px', color: '#334155', ...MONO }}>Run a lifecycle to see contradiction analysis.</div>
        ) : conflictStages.length === 0 ? (
          <div style={{ fontSize: '12px', color: '#4ade8077', ...MONO }}>No contradictions detected in this run.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {conflictStages.map(({ i, name, conflicts }) => (
              <div key={i} style={{ padding: '10px 12px', backgroundColor: '#0a080011', border: '1px solid #f59e0b22', borderRadius: '3px' }}>
                <div style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 700, marginBottom: '6px', ...MONO }}>
                  Stage {i} · {name}
                </div>
                {conflicts.map((c, j) => (
                  <div key={j} style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.6, paddingLeft: '8px', borderLeft: '2px solid #f59e0b33', marginBottom: j < conflicts.length - 1 ? '5px' : 0 }}>
                    {c}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Section 4: Honest empty states ── */}
      <div>
        <SectionHead label="QUALITY ANALYSIS" MONO={MONO} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <ComingSoon label="Agent agreement matrix available in a future version." MONO={MONO} />
          <ComingSoon label="Evidence source tracking available in a future version." MONO={MONO} />
          <ComingSoon label="Review queue requires collaboration features." MONO={MONO} />
        </div>
      </div>

    </div>
  );
}

// ── T2: Insights & Performance tab ───────────────────────────────────────────
function InsightsTab({
  journeyState,
  runtime,
  sessionTokens,
  sessionCost,
  MONO,
}: {
  journeyState: { currentStage: number; stages: Record<string, any>; agentsByStage: Record<string, string[]> };
  runtime: ReturnType<typeof useRuntime>;
  sessionTokens: number;
  sessionCost: number;
  MONO: React.CSSProperties;
}) {
  const [recentRuns, setRecentRuns] = useState<{ name: string; createdMs: number | null }[]>([]);

  useEffect(() => {
    fetch('/api/data?projects=true')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.projects)) setRecentRuns(d.projects); })
      .catch(() => {});
  }, []);

  // ── Section 1: Run summary ────────────────────────────────────────────
  const stage0  = journeyState.stages['0']  as Record<string, any> | undefined;
  const stage14 = journeyState.stages['14'] as Record<string, any> | undefined;

  let runDurationMs: number | null = null;
  if (stage0?.startedAt && stage14?.completedAt) {
    runDurationMs = new Date(stage14.completedAt as string).getTime() - new Date(stage0.startedAt as string).getTime();
  }

  const stagesCompleted = Object.values(journeyState.stages).filter(
    (s: any) => typeof s?.completedAt === 'string' && s.completedAt.length > 0,
  ).length;

  const hasRunData = Object.keys(journeyState.stages).length > 0;

  // ── Section 2: Stage durations ───────────────────────────────────────
  type StageTiming = { index: number; name: string; durationMs: number };
  const timings: StageTiming[] = [];
  for (let i = 0; i < 15; i++) {
    const s = journeyState.stages[String(i)] as Record<string, any> | undefined;
    if (!s?.startedAt || !s?.completedAt) continue;
    const dur = new Date(s.completedAt as string).getTime() - new Date(s.startedAt as string).getTime();
    timings.push({ index: i, name: STAGE_LABEL[i] ?? String(i), durationMs: dur });
  }
  const maxDuration = timings.length > 0 ? Math.max(...timings.map(t => t.durationMs)) : 0;
  const bottleneckIndex = maxDuration > 0
    ? timings.find(t => t.durationMs === maxDuration)?.index ?? null
    : null;

  // ── Section 3: Token spend by model ─────────────────────────────────
  const modelledEvents = runtime.state.events.filter(e => e.type === 'MODEL_ROUTED');
  const modelGroups: Record<string, number> = {};
  modelledEvents.forEach(e => {
    const model  = String(e.payload.model  ?? 'unknown');
    const tokens = Number(e.payload.tokens ?? 0);
    modelGroups[model] = (modelGroups[model] ?? 0) + tokens;
  });
  const modelEntries = Object.entries(modelGroups).sort((a, b) => b[1] - a[1]);
  const totalModelTokens = modelEntries.reduce((sum, [, t]) => sum + t, 0);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Section 1: This run summary ── */}
      <div>
        <SectionHead label="THIS RUN" MONO={MONO} />
        {!hasRunData ? (
          <div style={{ fontSize: '12px', color: '#334155', ...MONO }}>No run data. Start a lifecycle to see metrics.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { label: 'Tokens Used',       value: sessionTokens > 0 ? sessionTokens.toLocaleString() : '—', color: '#818cf8' },
              { label: 'Cost',              value: sessionCost > 0 ? `$${sessionCost.toFixed(4)}` : '—',     color: '#4ade80' },
              { label: 'Run Duration',      value: runDurationMs != null ? fmtDuration(runDurationMs) : '—', color: '#38bdf8' },
              { label: 'Stages Completed',  value: `${stagesCompleted}/15`,                                 color: stagesCompleted === 15 ? '#4ade80' : '#f59e0b' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ padding: '10px 12px', backgroundColor: '#040b14', border: '1px solid #0a1a2e', borderRadius: '3px' }}>
                <div style={{ fontSize: '20px', color, fontWeight: 700, ...MONO }}>{value}</div>
                <div style={{ fontSize: '9px', color: '#475569', marginTop: '3px', letterSpacing: '0.06em', ...MONO }}>{label.toUpperCase()}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Section 2: Stage durations / bottleneck ── */}
      <div>
        <SectionHead label="STAGE DURATIONS" MONO={MONO} />
        {!hasRunData || timings.length === 0 ? (
          <div style={{ fontSize: '12px', color: '#334155', ...MONO }}>No timing data available for this run.</div>
        ) : maxDuration === 0 ? (
          <div style={{ fontSize: '12px', color: '#334155', ...MONO }}>
            All stages completed in &lt;1s. Timing resolution is per-second — runs under 1s per stage are indistinguishable.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {timings.map(({ index, name, durationMs }) => {
              const pct      = maxDuration > 0 ? (durationMs / maxDuration) * 100 : 0;
              const isBottle = index === bottleneckIndex;
              return (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '140px', fontSize: '11px', color: isBottle ? '#f59e0b' : '#475569', flexShrink: 0, textAlign: 'right' as const }}>
                    {name}
                    {isBottle && <span style={{ marginLeft: '5px', fontSize: '8px', color: '#f59e0b', ...MONO }}>BOTTLENECK</span>}
                  </div>
                  <div style={{ flex: 1, height: '6px', backgroundColor: '#0a1a2e', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.max(pct, 2)}%`,
                      backgroundColor: isBottle ? '#f59e0b' : '#4ade8044',
                      borderRadius: '3px',
                      transition: 'width 400ms ease',
                    }} />
                  </div>
                  <div style={{ width: '52px', fontSize: '10px', color: isBottle ? '#f59e0b' : '#334155', ...MONO, flexShrink: 0 }}>
                    {fmtDuration(durationMs)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Section 3: Token spend by model ── */}
      <div>
        <SectionHead label="TOKEN SPEND BY MODEL" MONO={MONO} />
        {modelEntries.length === 0 ? (
          <div style={{ fontSize: '12px', color: '#334155', ...MONO }}>
            No model routing events. Token usage is recorded when you improve artifacts in Studio.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {modelEntries.map(([model, tokens]) => {
              const pct = totalModelTokens > 0 ? ((tokens / totalModelTokens) * 100).toFixed(1) : '0';
              return (
                <div key={model} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px', backgroundColor: '#040b14', border: '1px solid #0a1a2e', borderRadius: '3px' }}>
                  <div style={{ flex: 1, fontSize: '11px', color: '#818cf8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{model}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', ...MONO, flexShrink: 0 }}>{tokens.toLocaleString()}t</div>
                  <div style={{ fontSize: '10px', color: '#475569', ...MONO, flexShrink: 0, width: '36px', textAlign: 'right' as const }}>{pct}%</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Section 4: Recent runs ── */}
      <div>
        <SectionHead label="RECENT RUNS" MONO={MONO} />
        {recentRuns.length === 0 ? (
          <div style={{ fontSize: '12px', color: '#334155', ...MONO }}>No runs found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {recentRuns.map((run, i) => {
              const label = run.name.length > 44 ? run.name.slice(0, 41) + '…' : run.name;
              const dateStr = run.createdMs && run.createdMs > 1000000000000
                ? new Date(run.createdMs).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
                : '—';
              return (
                <div key={run.name} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '5px 8px',
                  backgroundColor: i === 0 ? '#040b14' : '#020c06',
                  border: `1px solid ${i === 0 ? '#4ade8022' : '#0a1a2e'}`,
                  borderRadius: '3px',
                }}>
                  <div style={{ flex: 1, fontSize: '11px', color: i === 0 ? '#94a3b8' : '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {i === 0 && <span style={{ fontSize: '8px', color: '#4ade80', marginRight: '6px', ...MONO }}>LATEST</span>}
                    {label}
                  </div>
                  <div style={{ fontSize: '10px', color: '#334155', ...MONO, flexShrink: 0 }}>{dateStr}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Section 5: Honest empty states ── */}
      <div>
        <SectionHead label="ADVANCED ANALYTICS" MONO={MONO} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <ComingSoon label="Historical performance charts available in a future version." MONO={MONO} />
          <ComingSoon label="Optimizer recommendations available in a future version."    MONO={MONO} />
          <ComingSoon label="Cache instrumentation available in a future version."        MONO={MONO} />
        </div>
      </div>

    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MissionControlPage() {
  const runtime = useRuntime();
  const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono','Fira Code',monospace" };

  const [artifacts,    setArtifacts]    = useState<string[]>([]);
  const [currentStage, setCurrentStage] = useState(0);
  const [mcTab,        setMcTab]        = useState<MCTab>('intelligence');
  const [isRunning,    setIsRunning]    = useState<boolean | null>(null);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const [journeyState, setJourneyState] = useState<{
    currentStage: number;
    stages: Record<string, any>;
    agentsByStage: Record<string, string[]>;
  }>({ currentStage: 0, stages: {}, agentsByStage: {} });

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

  // SSE subscription — onerror intentionally empty (Mission 8 Bug Fix 2).
  useEffect(() => {
    if (!isRunning) {
      if (esRef.current) { esRef.current.close(); esRef.current = null; }
      setCurrentAgent(null);
      return;
    }
    if (esRef.current) return;
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
      }
    };
    es.onerror = () => { /* browser auto-retries — do not call es.close() */ };
    return () => { es.close(); esRef.current = null; };
  }, [isRunning]);

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
      backgroundColor: '#020c06', overflow: 'hidden', ...MONO, color: '#94a3b8',
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
        <div style={{ fontSize: '13px', color: '#4ade80', fontWeight: 700, letterSpacing: '0.12em' }}>MISSION CONTROL</div>
        <div style={{ fontSize: '13px', color: '#1a3a20', letterSpacing: '0.06em' }}>IDEAGATE MOS</div>
        <div style={{ width: '1px', height: '24px', backgroundColor: '#0a1a2e' }} />

        {/* Agent health chips */}
        {AGENT_DEFS.map(def => {
          const state = deriveAgentState(def.id, artifacts, runtime);
          const col   = STATE_COLOR[state];
          return (
            <div key={def.id} title={`${def.fullName} — ${def.role}`} style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '3px 8px', backgroundColor: '#040b14',
              border: `1px solid ${col}33`, borderRadius: '3px', cursor: 'default',
            }}>
              <div style={{
                width: '5px', height: '5px', borderRadius: '50%', backgroundColor: col,
                ...(state === 'stale' ? { animation: 'blink 2s infinite' } :
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
          {staleCount > 0   && <span style={{ animation: 'blink 2s infinite' }}><span style={{ color: '#f59e0b', fontWeight: 700 }}>{staleCount}</span> stale</span>}
          {sessionTokens > 0 && <span><span style={{ color: '#818cf8' }}>{sessionTokens.toLocaleString()}</span>t · <span style={{ color: '#4ade80' }}>${sessionCost.toFixed(3)}</span></span>}
        </div>

        <div style={{ fontSize: '12px', color: '#94a3b8', padding: '3px 8px', border: '1px solid #1e293b', borderRadius: '2px' }}>
          {currentStage}/15 · {currentStage >= 14
            ? <span style={{ color: '#4ade80' }}>COMPLETE</span>
            : <span style={{ color: '#818cf8' }}>RUNNING</span>}
        </div>
      </div>

      {/* ── Always-visible: OrchestrationGraph + ExecutionSummary + Active Agent ── */}
      <div style={{
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        padding: '12px 16px 8px', gap: '8px', backgroundColor: '#020c06',
        borderBottom: '1px solid #0a1a2e',
      }}>
        <div style={{ display: 'flex', gap: '12px' }}>
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

        {/* Active agent bar — SSE real-time */}
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
      </div>

      {/* ── Sub-nav tab bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '0 16px',
        height: '36px', backgroundColor: '#020c06',
        borderBottom: '1px solid #0a1a2e', flexShrink: 0, gap: '0',
      }}>
        {MC_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setMcTab(tab.id)}
            style={{
              padding: '0 16px', height: '36px', border: 'none', cursor: 'pointer',
              background: 'transparent', ...MONO, fontSize: '11px',
              letterSpacing: '0.06em',
              color: mcTab === tab.id ? '#4ade80' : '#475569',
              borderBottom: mcTab === tab.id ? '2px solid #4ade80' : '2px solid transparent',
              transition: 'color 150ms ease, border-color 150ms ease',
            }}
            onMouseEnter={e => { if (mcTab !== tab.id) (e.currentTarget as HTMLElement).style.color = '#94a3b8'; }}
            onMouseLeave={e => { if (mcTab !== tab.id) (e.currentTarget as HTMLElement).style.color = '#475569'; }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', backgroundColor: '#020c06' }}>
        {mcTab === 'intelligence' && (
          <IntelligenceTab
            journeyState={journeyState}
            currentStage={currentStage}
            MONO={MONO}
          />
        )}
        {mcTab === 'insights' && (
          <InsightsTab
            journeyState={journeyState}
            runtime={runtime}
            sessionTokens={sessionTokens}
            sessionCost={sessionCost}
            MONO={MONO}
          />
        )}
      </div>
    </div>
  );
}
