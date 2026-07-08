'use client';

// src/components/desk/RunInsightPanel.tsx
// Mission 14 Phase 2 — Desk Command Center.
// "Trust through transparency" surface — shows the coordinator's original
// generation-time decision/reasoning/confidence for the selected stage.
//
// IMPORTANT DATA-SOURCE NOTE (flagged for Stage B, not solved here):
// decision/reasoning/confidence live in journey.json's stages[n] object
// (confirmed by reading a production journey.json) but NO current API route
// exposes that structured data to the browser — GET /api/data only extracts
// currentStage from journey.json and discards the rest. This component is a
// pure prop consumer, so it doesn't need that fixed before Stage A compiles,
// but Stage B integration cannot populate reasoning/decision/confidence
// until that gap is closed (extending /api/data, or a new minimal route —
// needs explicit confirmation, not assumed here).
//
// agentsUsed has NO real source anywhere in the codebase today. journey.json
// has `decisions[].frameworksUsed` (PM frameworks like "NSM lens" — not agent
// names) and desk/page.tsx has a hardcoded per-stage-number STAGE_META map
// (agentId/agentFull) which is static config, not run-derived attribution.
// Treat agentsUsed as optional/unresolved until Stage B decides a source.
//
// No Tailwind in this project — inline style objects + CSS custom properties,
// matching TopBar.tsx / NavRail.tsx convention.

import { CheckCircle2, RefreshCw, XCircle, Shuffle, HelpCircle, Users } from 'lucide-react';

export interface RunInsightPanelProps {
  stageId:     string | null;
  reasoning:   string | null;
  decision:    string | null;
  confidence:  string | null;
  agentsUsed?: string[];
  /** Optional — shows a skeleton block while a fetch is in flight. */
  isLoading?:  boolean;
  /** Optional — this reasoning is from a superseded version (post-improvement). */
  isStale?:    boolean;
}

const DECISION_ICON: Record<string, typeof CheckCircle2> = {
  go:      CheckCircle2,
  iterate: RefreshCw,
  kill:    XCircle,
  reshape: Shuffle,
};

const DECISION_COLOR: Record<string, string> = {
  go:      'var(--accent-primary)',
  iterate: 'var(--text-secondary)',
  kill:    'var(--status-error)',
  reshape: 'var(--text-secondary)',
};

export default function RunInsightPanel({
  stageId, reasoning, decision, confidence, agentsUsed, isLoading = false, isStale = false,
}: RunInsightPanelProps) {
  const baseStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', gap: '10px',
    padding: '16px', fontFamily: "'JetBrains Mono','Fira Code',monospace",
  };

  // Loading state
  if (isLoading) {
    return (
      <div style={baseStyle}>
        <div style={{ width: '40%', height: '12px', background: 'var(--border-default)', borderRadius: '3px' }} />
        <div style={{ width: '90%', height: '10px', background: 'var(--border-subtle)', borderRadius: '3px' }} />
        <div style={{ width: '75%', height: '10px', background: 'var(--border-subtle)', borderRadius: '3px' }} />
      </div>
    );
  }

  // Empty state — nothing selected
  if (!stageId) {
    return (
      <div style={{ ...baseStyle, color: 'var(--text-secondary)', fontSize: 'var(--text-body)' }}>
        Select a stage to see how the system reasoned about it.
      </div>
    );
  }

  // Error state — stage selected but reasoning wasn't captured
  if (!reasoning) {
    return (
      <div style={baseStyle}>
        <div style={{ fontSize: 'var(--text-label)', color: 'var(--text-primary)' }}>
          Stage {stageId}
        </div>
        <div style={{ fontSize: 'var(--text-body)', color: 'var(--status-error)' }}>
          Reasoning not captured for this stage.
        </div>
      </div>
    );
  }

  const DecisionIcon = (decision && DECISION_ICON[decision]) || HelpCircle;
  const decisionColor = (decision && DECISION_COLOR[decision]) || 'var(--text-secondary)';
  // Partial state — reasoning present but agent attribution unknown
  const isPartial = !agentsUsed || agentsUsed.length === 0;

  return (
    <div style={{
      ...baseStyle,
      opacity: isStale ? 0.7 : 1,
      boxShadow: isStale ? 'inset 0 0 0 1px var(--border-strong)' : 'none',
      borderRadius: 'var(--radius-md)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <DecisionIcon size={16} strokeWidth={1.5} color={decisionColor} />
        <span style={{ fontSize: 'var(--text-label)', fontWeight: 600, color: decisionColor, textTransform: 'capitalize' }}>
          {decision ?? 'Unknown'}
        </span>
        {confidence && (
          <span style={{
            fontSize: 'var(--text-caption)', color: 'var(--text-secondary)',
            border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)',
            padding: '1px 6px', marginLeft: 'auto',
          }}>
            {confidence} confidence
          </span>
        )}
      </div>

      <p style={{ fontSize: 'var(--text-body)', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
        {reasoning}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
        <Users size={12} strokeWidth={1.5} />
        {isPartial ? 'Agents unknown' : agentsUsed!.join(', ')}
      </div>

      {isStale && (
        <div style={{ fontSize: 'var(--text-caption)', color: 'var(--status-error)' }}>
          This reasoning is from a superseded version.
        </div>
      )}
    </div>
  );
}
