'use client';

// src/components/office/OrchestrationGraph.tsx
// Mission 14 Phase 3 — Office Analytics (Stage A, standalone).
//
// Static hub-and-spoke layout: CO is drawn as the central hub (matches its
// isCoordinator:true role as sole orchestrator of the other five agents).
// STRATEGY agents (PS, RE) sit left of the hub, EXECUTION agents (UX, AR)
// flank it vertically, QA sits right. This is a fixed six-node, fixed-edge
// topology (never changes shape run to run), so a static layout is more
// legible than a force simulation.
//
// AGENT NAME MATCHING NOTE: agentsByStage (from /api/journey-state) returns
// raw class names like "ProductStrategyAgent" / "ResearchAgent" — not the
// short AGENT_DEFS ids (CO/PS/RE/UX/AR/QA) used everywhere else in this app.
// There is no canonical id↔classname mapping table anywhere in the codebase
// (journey-state's own route.ts comments flag this same attribution gap).
// isAgentActiveForStage() below does a best-effort stem match; treat "active"
// highlighting as a best-effort visual cue, not exact attribution.
//
// No Tailwind in this project — inline style objects + CSS custom
// properties, matching TopBar.tsx / desk component convention.

import { useMemo } from 'react';
import { motion } from 'framer-motion';

export interface StageData {
  summary?:     string;
  decision?:    string;
  reasoning?:   string;
  confidence?:  string;
  conflicts?:   string;
  startedAt?:   string;
  completedAt?: string;
  durationMs?:  number;
  outputFile?:  string;
  artifacts?:   string[];
}

interface AgentDefLike {
  id:            string;
  name:          string;
  fullName:      string;
  color:         string;
  stages:        readonly number[];
  zone:          string;
  role:          string;
  isCoordinator: boolean;
}

export interface OrchestrationGraphProps {
  agents:        readonly AgentDefLike[];
  stages:        Record<string, StageData>;
  currentStage:  number | null;
  agentsByStage: Record<string, string[]>;
  /** Optional — shows skeleton nodes instead of real data while a fetch is in flight. */
  isLoading?:    boolean;
}

const TOTAL_STAGES = 15;

// Fixed hub-and-spoke coordinates, keyed by AGENT_DEFS id. viewBox 0 0 600 320.
const NODE_POS: Record<string, { x:number; y:number; r:number }> = {
  CO: { x:300, y:155, r:26 },
  PS: { x:100, y:90,  r:18 },
  RE: { x:100, y:220, r:18 },
  UX: { x:300, y:60,  r:18 },
  AR: { x:300, y:250, r:18 },
  QA: { x:500, y:155, r:18 },
};

function normalizeLabel(label: string): string {
  return label.toLowerCase().replace(/\s*\(.*\)/, '').replace(/agent$/, '').trim();
}

function isAgentActiveForStage(def: AgentDefLike, labels: string[] | undefined): boolean {
  if (!labels || labels.length === 0) return false;
  const idLower  = def.id.toLowerCase();
  const nameWord = def.name.split(' ')[0].toLowerCase();
  return labels.some(label => {
    const norm = normalizeLabel(label);
    return norm === idLower || norm.includes(idLower) || norm.includes(nameWord) || nameWord.includes(norm);
  });
}

export default function OrchestrationGraph({
  agents, stages, currentStage, agentsByStage, isLoading = false,
}: OrchestrationGraphProps) {
  const stageCount = useMemo(() => {
    const keys = Object.keys(stages).map(k => parseInt(k, 10)).filter(n => !Number.isNaN(n));
    const maxKey = keys.length ? Math.max(...keys) : -1;
    return Math.max(TOTAL_STAGES, maxKey + 1);
  }, [stages]);

  const isEmpty = Object.keys(stages).length === 0;

  // Which stage's agent should be shown "active" — the currently-running
  // stage if one exists, otherwise the most recently completed stage.
  const targetStageId = useMemo(() => {
    if (currentStage != null) {
      const cur = stages[String(currentStage)];
      if (cur && !cur.completedAt) return String(currentStage);
    }
    const completedIds = Object.keys(stages)
      .map(id => parseInt(id, 10))
      .filter(id => stages[String(id)]?.completedAt);
    if (completedIds.length) return String(Math.max(...completedIds));
    return currentStage != null ? String(currentStage) : null;
  }, [stages, currentStage]);

  const targetStage  = targetStageId != null ? stages[targetStageId] : undefined;
  const isProcessing = !!targetStage && !targetStage.completedAt;
  const isComplete   = !isEmpty && !isProcessing && (currentStage == null || currentStage >= TOTAL_STAGES - 1);
  const isError      = targetStage?.confidence === 'low';
  const activeLabels = targetStageId != null ? agentsByStage[targetStageId] : undefined;
  const activeAgent  = agents.find(a => isAgentActiveForStage(a, activeLabels));

  if (isLoading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
        <svg viewBox="0 0 600 320" style={{ width:'100%', maxWidth:'560px' }}>
          {Object.values(NODE_POS).map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="var(--surface-raised)" opacity={0.5 + (i % 3) * 0.1} />
          ))}
        </svg>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'8px', fontFamily:"'JetBrains Mono','Fira Code',monospace" }}>
      <style>{`
        @keyframes ig-orch-dash-flow { to { stroke-dashoffset: -16; } }
      `}</style>

      <svg viewBox="0 0 600 320" style={{ width:'100%', height:'auto' }}>
        {/* Spokes — CO to every other agent */}
        {agents.filter(a => !a.isCoordinator).map(a => {
          const from = NODE_POS.CO;
          const to   = NODE_POS[a.id];
          if (!to) return null;
          const isActiveEdge = isProcessing && a.id === activeAgent?.id;
          return (
            <line key={`edge-${a.id}`}
              x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke={isActiveEdge ? 'var(--accent-primary)' : 'var(--border-default)'}
              strokeWidth={isActiveEdge ? 2 : 1}
              strokeDasharray={isActiveEdge ? '6 4' : undefined}
              style={isActiveEdge ? { animation:'ig-orch-dash-flow 0.6s linear infinite' } : undefined}
              opacity={isEmpty || isComplete ? 0.35 : 1}
            />
          );
        })}

        {/* Stage dot band — matches LifecycleNodeChain's visual language */}
        {Array.from({ length: stageCount }, (_, i) => i).map(i => {
          const x = 30 + i * ((570 - 30) / (TOTAL_STAGES - 1));
          const data = stages[String(i)];
          const done = !!data?.completedAt;
          const isCurrent = currentStage === i;
          const low = data?.confidence === 'low';
          const fill = low ? 'var(--status-error)' : (done || isCurrent) ? 'var(--accent-primary)' : 'var(--border-strong)';
          return (
            <circle key={`stage-${i}`} cx={x} cy={300} r={isCurrent ? 4.5 : 3} fill={fill} opacity={done || isCurrent ? 1 : 0.5} />
          );
        })}

        {/* Connector from the active agent down to the current stage dot */}
        {activeAgent && currentStage != null && NODE_POS[activeAgent.id] && (() => {
          const node = NODE_POS[activeAgent.id];
          const x = 30 + currentStage * ((570 - 30) / (TOTAL_STAGES - 1));
          return (
            <line x1={node.x} y1={node.y + node.r} x2={x} y2={296}
              stroke="var(--border-default)" strokeWidth={1} strokeDasharray="2 3" opacity={0.6} />
          );
        })()}

        {/* Agent nodes */}
        {agents.map(a => {
          const pos = NODE_POS[a.id];
          if (!pos) return null;
          const active = a.id === activeAgent?.id;
          const showPulse = active && isProcessing;
          const showError = active && isError;
          return (
            <g key={a.id}>
              <motion.circle
                cx={pos.x} cy={pos.y}
                animate={{ r: showPulse ? [pos.r, pos.r * 1.08, pos.r] : pos.r }}
                transition={showPulse ? { duration:1.2, repeat:Infinity, ease:'easeInOut' } : undefined}
                fill={active ? a.color : `${a.color}55`}
                stroke={showError ? 'var(--status-error)' : active ? a.color : 'var(--border-default)'}
                strokeWidth={showError ? 3 : a.isCoordinator ? 2 : 1}
                opacity={isEmpty ? 0.6 : 1}
              />
              <text x={pos.x} y={pos.y + pos.r + 14} textAnchor="middle" fontSize="10" fill="var(--text-secondary)">
                {a.name}
              </text>
            </g>
          );
        })}
      </svg>

      {isEmpty && (
        <div style={{ textAlign:'center', fontSize:'var(--text-caption)', color:'var(--text-secondary)' }}>
          Run an idea to see the orchestration
        </div>
      )}
    </div>
  );
}
