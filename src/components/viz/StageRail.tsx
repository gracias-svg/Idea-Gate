'use client';

// Mission Control v1 — Batch M2 — StageRail.
// 15 lifecycle nodes (0–14), always visible below the graph — "where are we in
// the mission" must be glance-tier. Hardcoded 15; never sized from
// metrics.totalStages (which reports 14). Dots + tiny stage NUMBERS only —
// truncated names at 15 nodes are visual noise. The current stage's full name
// renders ONCE, below the rail. Presentation-only: it reads `status`.

import { memo } from 'react';
import type { StageNode } from '@/lib/execution/adapters/orchestration';

interface StageRailProps {
  stageNodes: StageNode[];
  selectedIndex?: number | null;
  onSelectStage?: (index: number) => void;
}

function dotStyle(status: StageNode['status']): React.CSSProperties {
  switch (status) {
    case 'current':
      return {
        width: 10, height: 10,
        background: 'var(--ig-emerald)',
        boxShadow: '0 0 0 3px var(--ig-emerald-muted)',
      };
    case 'done':
      return { width: 8, height: 8, background: 'var(--ig-emerald)' };
    case 'low-confidence':
      return { width: 8, height: 8, background: 'var(--ig-caution)' };
    default: // pending
      return {
        width: 8, height: 8,
        background: 'transparent',
        border: '1px solid var(--ig-border-default)',
      };
  }
}

function StageRailImpl({ stageNodes, selectedIndex, onSelectStage }: StageRailProps) {
  const current = stageNodes.find((s) => s.status === 'current');

  return (
    <div style={{ width: '100%', userSelect: 'none' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {/* connecting line — very low opacity, behind the dots */}
        <div
          style={{
            position: 'absolute',
            left: '3%', right: '3%', top: '50%',
            height: 1,
            transform: 'translateY(-50%)',
            background: 'var(--ig-border-default)',
            opacity: 0.4,
          }}
        />
        {stageNodes.map((s) => {
          const isSelected = selectedIndex === s.index;
          return (
            <button
              key={s.index}
              type="button"
              onClick={onSelectStage ? () => onSelectStage(s.index) : undefined}
              style={{
                position: 'relative',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                padding: '4px 0',
                background: 'transparent',
                border: 'none',
                cursor: onSelectStage ? 'pointer' : 'default',
              }}
            >
              <span
                style={{
                  borderRadius: '50%',
                  transition: 'all 160ms ease',
                  outline: isSelected ? '2px solid var(--ig-emerald-muted)' : 'none',
                  outlineOffset: 3,
                  ...dotStyle(s.status),
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--ig-font-mono)',
                  fontSize: 9,
                  color: s.status === 'pending' ? 'var(--ig-text-tertiary)' : 'var(--ig-text-secondary)',
                }}
              >
                {s.index}
              </span>
            </button>
          );
        })}
      </div>

      {/* current stage name — once, quietly, below the rail */}
      <div
        style={{
          marginTop: 8,
          textAlign: 'center',
          fontFamily: 'var(--ig-font-mono)',
          fontSize: 11,
          letterSpacing: '0.04em',
          minHeight: 14,
          color: 'var(--ig-text-secondary)',
        }}
      >
        {current ? `STAGE ${current.index} · ${current.label}` : ''}
      </div>
    </div>
  );
}

export default memo(StageRailImpl);
