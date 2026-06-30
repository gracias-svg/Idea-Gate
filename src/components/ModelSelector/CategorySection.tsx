'use client';
// src/components/ModelSelector/CategorySection.tsx
// Mission: 12A
// Empty categories render nothing — Spec Section 7. Coding Specialists, Heavy
// Reasoning, and Vision/Document Analysis are currently empty in the registry;
// confirm they do NOT render as empty headers (see A4 smoke test).

import React from 'react';
import { ModelCard } from './ModelCard';
import type { CategorySectionProps } from './types';

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono','Fira Code',monospace" };

export function CategorySection({ label, icon, models, selectedModelId, onSelect, registerCardRef }: CategorySectionProps) {
  if (models.length === 0) return null;

  return (
    <div style={{ marginBottom: '4px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px 4px',
        fontSize: '10px', color: '#2a5a30', fontWeight: 700, letterSpacing: '0.08em', ...MONO,
        position: 'sticky', top: '60px', zIndex: 2,
        backgroundColor: '#020c06', borderBottom: '1px solid #0a1a2e',
      }}>
        <span>{icon}</span>
        <span>{label.toUpperCase()}</span>
        <span style={{ marginLeft: 'auto', color: '#334155', fontWeight: 400 }}>
          {models.length} model{models.length === 1 ? '' : 's'}
        </span>
      </div>
      {models.map(m => (
        <ModelCard
          key={m.modelId}
          model={m}
          isSelected={m.modelId === selectedModelId}
          onSelect={onSelect}
          cardRef={el => registerCardRef(m.modelId, el)}
        />
      ))}
    </div>
  );
}
