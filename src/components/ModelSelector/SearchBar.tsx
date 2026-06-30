'use client';
// src/components/ModelSelector/SearchBar.tsx
// Mission: 12A

import React from 'react';
import type { FilterChip } from './types';

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono','Fira Code',monospace" };

const CHIPS: { key: FilterChip; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'paid', label: 'Paid' },
  { key: 'free', label: 'Free' },
  { key: 'fast', label: 'Fast' },
  { key: 'thinking', label: 'Thinking' },
  { key: 'vision', label: 'Vision' },
];

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  activeFilters: Set<FilterChip>;
  onToggleFilter: (chip: FilterChip) => void;
}

export function SearchBar({ query, onQueryChange, activeFilters, onToggleFilter }: Props) {
  return (
    <div style={{ padding: '8px 10px', borderBottom: '1px solid #0a1a2e' }}>
      <input
        value={query}
        onChange={e => onQueryChange(e.target.value)}
        aria-label="Search models"
        placeholder="Search models..."
        style={{
          width: '100%', padding: '6px 8px', fontSize: '11px', color: '#94a3b8',
          backgroundColor: '#040b14', border: '1px solid #0f1923', borderRadius: '4px',
          outline: 'none', boxSizing: 'border-box', marginBottom: '6px', ...MONO,
        }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {CHIPS.map(c => {
          const active = activeFilters.has(c.key) || (c.key === 'all' && activeFilters.size === 0);
          return (
            <button
              key={c.key}
              onClick={() => onToggleFilter(c.key)}
              style={{
                padding: '3px 8px', fontSize: '9px', borderRadius: '10px', cursor: 'pointer',
                border: active ? '1px solid #818cf855' : '1px solid #1e293b',
                backgroundColor: active ? '#0a0f1e' : 'transparent',
                color: active ? '#818cf8' : '#475569', ...MONO,
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
