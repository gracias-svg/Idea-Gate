'use client';
// src/components/ModelSelector/ModelCard.tsx
// Mission: 12A

import React from 'react';
import type { ModelCardProps } from './types';
import { getProviderMeta } from './providerMeta';

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono','Fira Code',monospace" };

const COST_BADGE: Record<string, { label: string; color: string }> = {
  free:        { label: 'FREE',    color: '#4ade80' },
  'ultra-low': { label: '$',       color: '#22d3ee' },
  low:         { label: '$$',      color: '#38bdf8' },
  mid:         { label: '$$$',     color: '#f59e0b' },
  premium:     { label: 'PREMIUM', color: '#a78bfa' },
};

const SPEED_DOT: Record<string, { color: string; label: string }> = {
  'very-fast':     { color: '#4ade80', label: 'Very Fast' },
  fast:            { color: '#4ade80', label: 'Fast' },
  'moderate-fast': { color: '#f59e0b', label: 'Moderate-Fast' },
  moderate:        { color: '#f59e0b', label: 'Moderate' },
  slow:            { color: '#f87171', label: 'Slow' },
};

function formatContext(tokens: number): string {
  if (tokens >= 1_000_000) {
    const m = tokens / 1_000_000;
    return `${Number.isInteger(m) ? m : m.toFixed(1)}M ctx`;
  }
  return `${Math.round(tokens / 1000)}K ctx`;
}

export function ModelCard({ model, isSelected, onSelect, onDetailRequest, tabIndex, cardRef }: ModelCardProps) {
  const provider = getProviderMeta(model.modelId);
  const cost = COST_BADGE[model.costTier];
  const speed = SPEED_DOT[model.typicalSpeed];
  const disabled = model.comingSoon;

  return (
    <button
      ref={cardRef}
      className="ig-model-card"
      tabIndex={tabIndex ?? -1}
      role="option"
      aria-selected={isSelected}
      disabled={disabled}
      onClick={() => !disabled && onSelect(model.modelId)}
      onMouseEnter={() => onDetailRequest?.(model)}
      title={model.modelId}
      style={{
        width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '2px',
        padding: '7px 12px', border: 'none',
        borderLeft: isSelected ? '2px solid #818cf8' : '2px solid transparent',
        backgroundColor: isSelected ? '#0a0f1e' : 'transparent',
        cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.45 : 1, ...MONO,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: provider.color, flexShrink: 0 }} />
        <span style={{ fontSize: '12px', color: isSelected ? '#e2e8f0' : '#94a3b8', fontWeight: 600 }}>
          {model.displayName}
        </span>
        {cost && (
          <span style={{
            fontSize: '8px', fontWeight: 700, color: cost.color, border: `1px solid ${cost.color}55`,
            borderRadius: '3px', padding: '1px 5px', marginLeft: 'auto',
          }}>{cost.label}</span>
        )}
        {model.supportsVision && <span style={{ fontSize: '10px' }} title="Vision">👁</span>}
        {model.supportsThinking && <span style={{ fontSize: '10px' }} title="Thinking">🧠</span>}
        {isSelected && (
          <span style={{ fontSize: '10px', color: '#818cf8', marginLeft: cost ? '4px' : 'auto' }}>
            ✓
          </span>
        )}
        {disabled && (
          <span style={{ fontSize: '8px', color: '#475569', border: '1px solid #1e293b', borderRadius: '3px', padding: '1px 5px' }}>
            Coming Soon
          </span>
        )}
      </div>
      <div style={{ fontSize: '9px', color: '#475569', paddingLeft: '12px' }}>
        {provider.name} · {formatContext(model.contextWindow)}
        {speed && <> · <span style={{ color: speed.color }}>{speed.label}</span></>}
        {model.bestUseCases[0] && <> · {model.bestUseCases[0]}</>}
      </div>
    </button>
  );
}
