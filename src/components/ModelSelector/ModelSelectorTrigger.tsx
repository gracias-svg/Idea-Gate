'use client';
// src/components/ModelSelector/ModelSelectorTrigger.tsx
// Mission: 12A

import React from 'react';
import { getModelById } from '@/lib/model-registry';
import { getProviderMeta } from './providerMeta';

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono','Fira Code',monospace" };

interface Props {
  selectedModelId: string;
  isOpen: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function ModelSelectorTrigger({ selectedModelId, isOpen, disabled, onClick }: Props) {
  const model = getModelById(selectedModelId);
  const provider = model ? getProviderMeta(model.modelId) : { name: '?', color: '#6B7280' };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      style={{
        display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px 5px 6px',
        backgroundColor: '#040b14', border: '1px solid #0f1923', borderRadius: 'var(--ig-radius-full)',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, ...MONO,
        boxShadow: 'var(--ig-elev-1)',
      }}
    >
      {/* Sprint 06 T2 — status dot integrated into a circular badge (avatar-style
          identity slot) instead of a small dot floating beside the label. Ring +
          fill both use the same provider color already driving the dot elsewhere
          in this codebase (Sprint 04's model-card accent) — no new color introduced. */}
      <span style={{
        width: '16px', height: '16px', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1.5px solid ${provider.color}`,
        backgroundColor: `${provider.color}26`,
        flexShrink: 0,
      }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: provider.color }} />
      </span>
      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
        {model ? model.displayName : 'Select AI Model'}
      </span>
      {model?.isFree && (
        <span style={{
          fontSize: '8px', fontWeight: 700, color: '#4ade80', border: '1px solid #4ade8055',
          borderRadius: 'var(--ig-radius-full)', padding: '1px 5px',
        }}>FREE</span>
      )}
      <span style={{
        fontSize: '9px', color: '#334155',
        transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s',
      }}>▼</span>
    </button>
  );
}
