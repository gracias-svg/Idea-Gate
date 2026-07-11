'use client';

// Mission Control v1 — Batch M2 — VitalsBand.
// A thin mono TEXT line (≤36px). NOT cards. If it starts looking like cards,
// it's wrong. Segments are separated by a mid-dot; one segment may be an error
// message in plain language (no stack traces, ever). Presentation-only.

import { memo } from 'react';

export interface VitalSegment {
  label: string;
  value: string;
  tone?: 'emerald' | 'caution' | 'danger' | 'neutral';
}

interface VitalsBandProps {
  segments: VitalSegment[];
}

const valueColor = (tone: VitalSegment['tone']) =>
  tone === 'emerald' ? 'var(--ig-emerald)'
    : tone === 'caution' ? 'var(--ig-caution)'
      : tone === 'danger' ? 'var(--ig-danger)'
        : 'var(--ig-text-primary)';

function VitalsBandImpl({ segments }: VitalsBandProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        height: 36,
        padding: '0 4px',
        fontFamily: 'var(--ig-font-mono)',
        fontSize: 11,
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
    >
      {segments.map((s, i) => (
        <span key={s.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {i > 0 && <span style={{ color: 'var(--ig-border-strong)' }}>·</span>}
          <span style={{ color: 'var(--ig-text-tertiary)', textTransform: 'uppercase' }}>{s.label}</span>
          <span style={{ color: valueColor(s.tone) }}>{s.value}</span>
        </span>
      ))}
    </div>
  );
}

export default memo(VitalsBandImpl);
