'use client';

// src/components/desk/ArtifactCard.tsx
// Mission 14 Phase 2 — Desk Command Center.
// Single artifact summary card. Pure prop consumer — wordCount/confidence/
// isStale are computed by the caller (desk/page.tsx already has this exact
// pattern: wordCount() helper + runtime.isStale()), not fetched here.
//
// No Tailwind in this project — inline style objects + CSS custom properties,
// matching TopBar.tsx / NavRail.tsx convention.

import { useState } from 'react';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ArtifactCardProps {
  stageId:     string;
  name:        string;
  wordCount:   number;
  confidence:  ConfidenceLevel;
  isStale?:    boolean;
  isActive?:   boolean;
  onClick?:    () => void;
  /** Optional — shows a skeleton row instead of real data while a fetch is in flight. */
  isLoading?:  boolean;
}

const CONFIDENCE_COLOR: Record<ConfidenceLevel, string> = {
  high:   'var(--accent-primary)',
  medium: 'var(--text-secondary)',
  low:    'var(--status-error)',
};

export default function ArtifactCard({
  stageId, name, wordCount, confidence, isStale = false, isActive = false, onClick, isLoading = false,
}: ArtifactCardProps) {
  const [hovered, setHovered] = useState(false);

  // Loading state
  if (isLoading) {
    return (
      <div style={{
        padding: '12px 14px', borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)', background: 'var(--surface-raised)',
        opacity: 0.5,
      }}>
        <div style={{ width: '60%', height: '12px', background: 'var(--border-default)', borderRadius: '3px', marginBottom: '8px' }} />
        <div style={{ width: '35%', height: '10px', background: 'var(--border-subtle)', borderRadius: '3px' }} />
      </div>
    );
  }

  // Empty state — no artifact at all: render nothing.
  if (!name) return null;

  const showRaised = hovered && !isActive;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column', gap: '6px',
        padding: '12px 14px',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${isActive ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
        background: isActive ? 'var(--accent-muted)' : showRaised ? 'var(--surface-raised)' : 'transparent',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 150ms var(--ease-standard), border-color 150ms var(--ease-standard)',
        fontFamily: "'JetBrains Mono','Fira Code',monospace",
        boxShadow: isStale ? '0 0 0 1px var(--border-strong)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <span style={{
          fontSize: 'var(--text-label)', fontWeight: 600, color: 'var(--text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {name}
        </span>

        <span style={{
          fontSize: 'var(--text-caption)', flexShrink: 0,
          color: CONFIDENCE_COLOR[confidence],
          border: `1px solid ${CONFIDENCE_COLOR[confidence]}`,
          borderRadius: 'var(--radius-sm)',
          padding: '1px 6px',
        }}>
          {confidence}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
          {wordCount.toLocaleString()} words
        </span>
        {isStale && (
          <span style={{ fontSize: 'var(--text-caption)', color: 'var(--status-error)' }}>
            △ stale
          </span>
        )}
      </div>
    </div>
  );
}
