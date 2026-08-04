'use client';

// src/components/studio/KanbanView.tsx
// Mission 18 — Studio Kanban View (K3).
//
// Renders 5 phase columns (Discover / Decide / Specify / Architect / Ship).
// Each column: phase header + one card per lifecycle artifact.
// Cards show: name, health border (3px left), version badge, "Not yet generated" for pending.
// Clicking a generated card: selects artifact + switches studioView back to 'document'.
// No drag-and-drop. Lifecycle order is enforced by the engine, not the PM.
// Horizontal scroll when 5 columns don't fit viewport.
//
// Inline styles only. No Tailwind. Uses --ig-* tokens where available.

import React, { useState } from 'react';
import { stageNum } from '@/lib/artifactDisplay';

// ── Constants ─────────────────────────────────────────────────────────────────

const STAGE_LABELS: Record<number, string> = {
   0: 'Idea Intake',    1: 'Discovery',       2: 'Problem Def',
   3: 'Solution Design',4: 'MVP Hypothesis',  5: 'Validation',
   6: 'Prioritization', 7: 'PRD',             8: 'UX Design',
   9: 'Usability',     10: 'Architecture',   11: 'Backlog & Release',
  12: 'Implementation', 13: 'QA & Readiness', 14: 'Prototype Prompt',
};

const PHASES = [
  { id: 'discover',  label: 'Discover',  color: '#4ade80', stages: [0, 1, 2] },
  { id: 'decide',    label: 'Decide',    color: '#38bdf8', stages: [3, 4, 5, 6] },
  { id: 'specify',   label: 'Specify',   color: '#818cf8', stages: [7, 8, 9] },
  { id: 'architect', label: 'Architect', color: '#fb923c', stages: [10, 11] },
  { id: 'ship',      label: 'Ship',      color: '#fde047', stages: [12, 13, 14] },
] as const;

// Health → 3px left-border color
const healthColor = (file: string | undefined, isStale: (f: string) => boolean): string => {
  if (!file) return '#1e293b'; // ungenerated — muted
  return isStale(file) ? '#ef4444' : '#4ade80';
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface KanbanViewProps {
  artifacts:          string[];
  onSelectArtifact:   (file: string) => void;
  isStale:            (file: string) => boolean;
  getVersion:         (file: string) => number;
}

// ── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  stageIndex:       number;
  file:             string | undefined;
  isStale:          (f: string) => boolean;
  getVersion:       (f: string) => number;
  onSelect:         (file: string) => void;
}

function KanbanCard({ stageIndex, file, isStale, getVersion, onSelect }: CardProps) {
  const [hovered, setHovered] = useState(false);

  const name     = STAGE_LABELS[stageIndex] ?? `Stage ${stageIndex}`;
  const hColor   = healthColor(file, isStale);
  const version  = file ? getVersion(file) : 0;
  const isStaleF = file ? isStale(file) : false;
  const hasFile  = !!file;

  return (
    <div
      role={hasFile ? 'button' : undefined}
      tabIndex={hasFile ? 0 : undefined}
      aria-label={hasFile ? `Open ${name} in document view` : undefined}
      onClick={() => { if (file) onSelect(file); }}
      onKeyDown={(e) => { if (file && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onSelect(file); } }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position:        'relative',
        borderLeft:      `3px solid ${hColor}`,
        borderRadius:    '4px',
        background:      hovered && hasFile ? 'var(--ig-surface-raised, #111827)' : 'var(--ig-surface, #0d1117)',
        padding:         '10px 12px',
        cursor:          hasFile ? 'pointer' : 'default',
        transition:      'box-shadow 120ms ease-out, background 120ms ease-out',
        boxShadow:       hovered && hasFile ? '0 2px 8px rgba(0,0,0,0.35)' : 'none',
        minHeight:       '64px',
        display:         'flex',
        flexDirection:   'column',
        gap:             '6px',
        outline:         'none',
      }}
    >
      {/* Stage name */}
      <div style={{
        fontFamily: 'var(--ig-font-sans, system-ui, sans-serif)',
        fontSize:   '13px',
        fontWeight: 500,
        color:      hasFile ? 'var(--ig-text-secondary, #cbd5e1)' : 'var(--ig-text-tertiary, #475569)',
        lineHeight: 1.3,
      }}>
        {name}
      </div>

      {/* Bottom row: health badge + version */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {hasFile ? (
          <>
            {isStaleF && (
              <span style={{
                fontFamily:    "'JetBrains Mono','Fira Code',monospace",
                fontSize:      '9px',
                color:         '#ef4444',
                letterSpacing: '0.06em',
                fontWeight:    600,
              }}>
                △ STALE
              </span>
            )}
            {!isStaleF && (
              <span style={{
                fontFamily:    "'JetBrains Mono','Fira Code',monospace",
                fontSize:      '9px',
                color:         '#4ade8066',
                letterSpacing: '0.06em',
              }}>
                ✓
              </span>
            )}
            {version > 0 && (
              <span style={{
                fontFamily:    "'JetBrains Mono','Fira Code',monospace",
                fontSize:      '9px',
                color:         '#4ade80',
                padding:       '1px 5px',
                border:        '1px solid #4ade8033',
                borderRadius:  '2px',
                letterSpacing: '0.04em',
              }}>
                v{version}
              </span>
            )}
            {hovered && (
              <span style={{
                marginLeft:    'auto',
                fontFamily:    "'JetBrains Mono','Fira Code',monospace",
                fontSize:      '9px',
                color:         'var(--ig-text-tertiary, #475569)',
                letterSpacing: '0.04em',
              }}>
                Open →
              </span>
            )}
          </>
        ) : (
          <span style={{
            fontFamily:    'var(--ig-font-sans, system-ui, sans-serif)',
            fontSize:      '11px',
            color:         'var(--ig-text-tertiary, #334155)',
            fontStyle:     'italic',
          }}>
            Not yet generated
          </span>
        )}
      </div>
    </div>
  );
}

// ── Column ────────────────────────────────────────────────────────────────────

interface ColumnProps {
  phase:          typeof PHASES[number];
  artifacts:      string[];
  onSelectArtifact: (file: string) => void;
  isStale:        (file: string) => boolean;
  getVersion:     (file: string) => number;
}

function KanbanColumn({ phase, artifacts, onSelectArtifact, isStale, getVersion }: ColumnProps) {
  // Count generated artifacts in this phase
  const generatedCount = phase.stages.filter(n =>
    artifacts.some(f => stageNum(f) === n)
  ).length;

  return (
    <div style={{
      minWidth:      '200px',
      flex:          '1 0 200px',
      display:       'flex',
      flexDirection: 'column',
      gap:           '0',
    }}>
      {/* Column header */}
      <div style={{
        display:       'flex',
        alignItems:    'center',
        gap:           '8px',
        padding:       '0 0 12px 0',
        borderBottom:  `2px solid ${phase.color}33`,
        marginBottom:  '12px',
        flexShrink:    0,
      }}>
        {/* Phase dot */}
        <div style={{
          width:        '7px',
          height:       '7px',
          borderRadius: '50%',
          backgroundColor: phase.color,
          flexShrink:   0,
        }} />

        {/* Phase name */}
        <span style={{
          fontFamily:    'var(--ig-font-sans, system-ui, sans-serif)',
          fontSize:      '12px',
          fontWeight:    600,
          color:         phase.color,
          letterSpacing: '0.02em',
          flex:          1,
        }}>
          {phase.label}
        </span>

        {/* Count badge */}
        <span style={{
          fontFamily:    "'JetBrains Mono','Fira Code',monospace",
          fontSize:      '10px',
          color:         generatedCount > 0 ? phase.color : 'var(--ig-text-tertiary, #334155)',
          opacity:       generatedCount > 0 ? 0.7 : 0.4,
        }}>
          {generatedCount}/{phase.stages.length}
        </span>
      </div>

      {/* Cards */}
      <div style={{
        display:       'flex',
        flexDirection: 'column',
        gap:           '8px',
        overflowY:     'auto',
        flex:          1,
      }}>
        {phase.stages.map(stageIndex => {
          const file = artifacts.find(f => stageNum(f) === stageIndex);
          return (
            <KanbanCard
              key={stageIndex}
              stageIndex={stageIndex}
              file={file}
              isStale={isStale}
              getVersion={getVersion}
              onSelect={onSelectArtifact}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function KanbanView({ artifacts, onSelectArtifact, isStale, getVersion }: KanbanViewProps) {
  return (
    <div style={{
      flex:     1,
      overflow: 'hidden',
      display:  'flex',
      flexDirection: 'column',
    }}>
      {/* Label */}
      <div style={{
        padding:      '12px 20px 0',
        flexShrink:   0,
        fontFamily:   "'JetBrains Mono','Fira Code',monospace",
        fontSize:     '9px',
        color:        'var(--ig-text-tertiary, #334155)',
        letterSpacing:'0.1em',
        fontWeight:   500,
        textTransform:'uppercase' as const,
      }}>
        Lifecycle Kanban — {artifacts.length} of 15 generated
      </div>

      {/* Columns container — horizontally scrolls when narrow */}
      <div style={{
        flex:            1,
        overflowX:       'auto',
        overflowY:       'hidden',
        padding:         '16px 20px 20px',
        display:         'flex',
        flexDirection:   'column',
      }}>
        <div style={{
          display:         'flex',
          gap:             '16px',
          height:          '100%',
          minWidth:        `${PHASES.length * 216}px`, // 200px + 16px gap * phases
        }}>
          {PHASES.map(phase => (
            <KanbanColumn
              key={phase.id}
              phase={phase}
              artifacts={artifacts}
              onSelectArtifact={onSelectArtifact}
              isStale={isStale}
              getVersion={getVersion}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
