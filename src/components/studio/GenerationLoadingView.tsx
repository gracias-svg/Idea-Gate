'use client';

// src/components/studio/GenerationLoadingView.tsx
// Mission 19 — S4: Generation progress view.
//
// Shown in the Studio right pane when isRunning && !selected.
// Replaced by the document view as soon as an artifact is selected.
//
// Layout (top → bottom):
//   1. Idea text — 20px / weight 500
//   2. 2×3 agent card grid — active card glows
//   3. Stage progress bar + label
//
// Inline styles only. No Tailwind. Uses --ig-* tokens where available.
// AGENT_DEFS defined locally — mission-control is protected.

import React from 'react';

// ── AGENT_DEFS ──────────────────────────────────────────────────────────────
// Mirrors the authoritative definition in mission-control/page.tsx.
// Must be kept in sync if agent roster ever changes.

const AGENT_DEFS = [
  { id: 'CO', name: 'Coordinator',   color: '#34d399', stages: [0, 6, 11],  role: 'Lifecycle orchestration' },
  { id: 'PS', name: 'Product Strat', color: '#818cf8', stages: [1, 7, 12],  role: 'Discovery · PRD' },
  { id: 'RE', name: 'Researcher',    color: '#38bdf8', stages: [2, 9],      role: 'Problem definition' },
  { id: 'UX', name: 'UX Designer',  color: '#f472b6', stages: [3, 8],      role: 'Solution design' },
  { id: 'AR', name: 'Architect',    color: '#fb923c', stages: [4, 10, 14], role: 'MVP hypothesis' },
  { id: 'QA', name: 'QA Engineer',  color: '#c084fc', stages: [5, 13],     role: 'Validation strategy' },
] as const;

// Map SSE agent name → AGENT_DEF id
const SSE_AGENT_TO_ID: Record<string, string> = {
  ProductStrategyAgent: 'PS',
  ResearchAgent:        'RE',
  UXAgent:              'UX',
  ArchitectAgent:       'AR',
  QAAgent:              'QA',
  CoordinatorAgent:     'CO',
};

// Total lifecycle stages
const TOTAL_STAGES = 15;

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  isRunning:      boolean;
  currentStage:   number;
  currentAgent:   string | null;  // SSE agent name string
  idea:           string;
  reducedMotion?: boolean;
}

// ── AgentCard ─────────────────────────────────────────────────────────────────

interface AgentCardProps {
  def:          typeof AGENT_DEFS[number];
  isActive:     boolean;
  reducedMotion: boolean;
}

function AgentCard({ def, isActive, reducedMotion }: AgentCardProps) {
  return (
    <div style={{
      borderRadius: '6px',
      border: `1px solid ${isActive ? `${def.color}55` : 'rgba(255,255,255,0.05)'}`,
      background: isActive ? `rgba(74,222,128,0.08)` : 'rgba(255,255,255,0.02)',
      padding: '10px 12px',
      transition: reducedMotion ? 'none' : 'border-color 200ms ease-out, background 200ms ease-out',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      minHeight: '60px',
    }}>
      {/* Header row: dot + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Activity dot */}
        <div style={{
          width: '6px', height: '6px',
          borderRadius: '50%',
          backgroundColor: isActive ? def.color : 'rgba(255,255,255,0.15)',
          flexShrink: 0,
          animation: isActive && !reducedMotion ? 'ig-agent-dot-pulse 1.2s ease-in-out infinite' : 'none',
          transition: reducedMotion ? 'none' : 'background-color 200ms ease-out',
        }} />
        {/* Agent ID badge */}
        <span style={{
          fontFamily: "'JetBrains Mono','Fira Code',monospace",
          fontSize: '10px',
          fontWeight: 700,
          color: isActive ? def.color : 'rgba(255,255,255,0.25)',
          letterSpacing: '0.08em',
          transition: reducedMotion ? 'none' : 'color 200ms ease-out',
        }}>
          {def.id}
        </span>
        {/* Agent name */}
        <span style={{
          fontFamily: 'var(--ig-font-sans, system-ui, sans-serif)',
          fontSize: '11px',
          fontWeight: isActive ? 600 : 400,
          color: isActive ? '#e2e8f0' : 'rgba(255,255,255,0.3)',
          letterSpacing: '0.01em',
          transition: reducedMotion ? 'none' : 'color 200ms ease-out',
        }}>
          {def.name}
        </span>
      </div>
      {/* Role subtitle */}
      <div style={{
        fontFamily: 'var(--ig-font-sans, system-ui, sans-serif)',
        fontSize: '10px',
        color: isActive ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.15)',
        letterSpacing: '0.01em',
        paddingLeft: '12px',
        transition: reducedMotion ? 'none' : 'color 200ms ease-out',
      }}>
        {def.role}
      </div>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────

export default function GenerationLoadingView({
  isRunning,
  currentStage,
  currentAgent,
  idea,
  reducedMotion = false,
}: Props) {
  if (!isRunning) return null;

  // Resolve active agent id from SSE name
  const activeId = currentAgent ? (SSE_AGENT_TO_ID[currentAgent] ?? null) : null;

  // Progress 0–1
  const progress = Math.min(1, currentStage / TOTAL_STAGES);
  const pct = Math.round(progress * 100);

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 32px',
      gap: '28px',
      animation: reducedMotion ? 'none' : 'ig-fade-in 150ms ease-out',
      overflow: 'hidden',
    }}>
      {/* ── Idea text ── */}
      <div style={{
        fontFamily: 'var(--ig-font-sans, system-ui, sans-serif)',
        fontSize: '20px',
        fontWeight: 500,
        color: '#f1f5f9',
        lineHeight: 1.4,
        textAlign: 'center',
        maxWidth: '520px',
        letterSpacing: '-0.2px',
      }}>
        {idea || 'Generating…'}
      </div>

      {/* ── Agent cards 2×3 grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        width: '100%',
        maxWidth: '560px',
      }}>
        {AGENT_DEFS.map(def => (
          <AgentCard
            key={def.id}
            def={def}
            isActive={activeId === def.id}
            reducedMotion={reducedMotion}
          />
        ))}
      </div>

      {/* ── Stage progress ── */}
      <div style={{ width: '100%', maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* Progress track */}
        <div style={{
          height: '2px',
          borderRadius: '1px',
          backgroundColor: 'rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            backgroundColor: '#4ade80',
            borderRadius: '1px',
            transition: reducedMotion ? 'none' : 'width 600ms ease-out',
          }} />
        </div>
        {/* Label */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{
            fontFamily: "'JetBrains Mono','Fira Code',monospace",
            fontSize: '10px',
            color: 'var(--ig-text-tertiary, #475569)',
            letterSpacing: '0.06em',
          }}>
            Stage {currentStage} / {TOTAL_STAGES}
          </span>
          <span style={{
            fontFamily: "'JetBrains Mono','Fira Code',monospace",
            fontSize: '10px',
            color: pct > 0 ? '#4ade80' : 'var(--ig-text-tertiary, #475569)',
            letterSpacing: '0.04em',
          }}>
            {pct}%
          </span>
        </div>
      </div>
    </div>
  );
}
