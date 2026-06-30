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
        display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px',
        backgroundColor: '#040b14', border: '1px solid #0f1923', borderRadius: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, ...MONO,
      }}
    >
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: provider.color }} />
      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
        {model ? model.displayName : 'Select AI Model'}
      </span>
      {model?.isFree && (
        <span style={{
          fontSize: '8px', fontWeight: 700, color: '#4ade80', border: '1px solid #4ade8055',
          borderRadius: '3px', padding: '1px 5px',
        }}>FREE</span>
      )}
      <span style={{
        fontSize: '9px', color: '#334155',
        transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s',
      }}>▼</span>
    </button>
  );
}
